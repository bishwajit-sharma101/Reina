import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { createVRMAnimationClip, VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation';
import * as THREE from 'three';

// ==========================================================================
// Expression Presets — each emotion maps to VRM morph target intensities
// ==========================================================================
// 11 Authoritative 3D VRM Expression Presets (matching the Settings Drawer)
const EXPRESSION_PRESETS = {
    neutral: {
        happy: 0, angry: 0, sad: 0, relaxed: 0.15, surprised: 0,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, eyeHighlightHide: 0,
        blush: 0, eyebrowAnger: 0, eyebrowSurprise: 0
    },
    happy: {
        happy: 1.0, angry: 0, sad: 0, relaxed: 0.3, surprised: 0.1,
        blinkLeft: 0, blinkRight: 0, ee: 0.15, oh: 0, eyeHighlightHide: 0,
        blush: 0.4, eyebrowAnger: 0, eyebrowSurprise: 0.1
    },
    sweet: {
        happy: 0.7, angry: 0, sad: 0, relaxed: 0.4, surprised: 0,
        blinkLeft: 0, blinkRight: 0, ee: 0.1, oh: 0, eyeHighlightHide: 0,
        blush: 0.5, eyebrowAnger: 0, eyebrowSurprise: 0.1
    },
    sad: {
        happy: 0, angry: 0, sad: 1.0, relaxed: 0, surprised: 0,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0.1, eyeHighlightHide: 0,
        blush: 0, eyebrowAnger: 0, eyebrowSurprise: 0
    },
    jealous: {
        happy: 0, angry: 0.7, sad: 0.3, relaxed: 0, surprised: 0,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, eyeHighlightHide: 0,
        blush: 0.25, eyebrowAnger: 0.6, eyebrowSurprise: 0
    },
    angry: {
        happy: 0, angry: 1.0, sad: 0, relaxed: 0, surprised: 0.15,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, eyeHighlightHide: 0,
        blush: 0.3, eyebrowAnger: 1.0, eyebrowSurprise: 0
    },
    scary_smile: {
        happy: 0, angry: 0, sad: 0, relaxed: 0, surprised: 0.5,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0,
        fun: 1.0,
        eyeHighlightHide: 1.0,
        ih: 0.25,
        haShortLow: 0.0,
        blush: 0, eyebrowAnger: 0.3, eyebrowSurprise: 0.4
    },
    scary_smile2: {
        happy: 0.4, angry: 0, sad: 0, relaxed: 0.3, surprised: 0.1,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, eyeHighlightHide: 0,
        blush: 0.1, eyebrowAnger: 0.3, eyebrowSurprise: 0.2
    },
    hollow: {
        happy: 0, angry: 0.7, sad: 0, relaxed: 0, surprised: 0.4,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, fun: 0.5, eyeHighlightHide: 0.5,
        blush: 0, eyebrowAnger: 0.4, eyebrowSurprise: 0.3
    },
    dead: {
        happy: 0, angry: 1.0, sad: 0, relaxed: 0, surprised: 0,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, fun: 1.0, eyeHighlightHide: 1.0,
        blush: 0, eyebrowAnger: 0.8, eyebrowSurprise: 0
    },
    flirty: {
        happy: 0.5, angry: 0, sad: 0, relaxed: 0.3, surprised: 0.1,
        blinkLeft: 0, blinkRight: 0, ee: 0.1, oh: 0, eyeHighlightHide: 0,
        blush: 0.6, eyebrowAnger: 0, eyebrowSurprise: 0.1
    }
};

// Aliases ensuring any legacy or AI synonyms safely resolve to valid presets without mesh distortion
EXPRESSION_PRESETS.joke = EXPRESSION_PRESETS.flirty;
EXPRESSION_PRESETS.tsundere = EXPRESSION_PRESETS.angry;
EXPRESSION_PRESETS.embarrassed = EXPRESSION_PRESETS.jealous;
EXPRESSION_PRESETS.excited = EXPRESSION_PRESETS.happy;
EXPRESSION_PRESETS.joy = EXPRESSION_PRESETS.happy;
EXPRESSION_PRESETS.fun = EXPRESSION_PRESETS.happy;
EXPRESSION_PRESETS.psycho = EXPRESSION_PRESETS.scary_smile;
EXPRESSION_PRESETS.mad = EXPRESSION_PRESETS.angry;
EXPRESSION_PRESETS.sorrow = EXPRESSION_PRESETS.sad;
EXPRESSION_PRESETS.brat = EXPRESSION_PRESETS.angry;
EXPRESSION_PRESETS.bratty = EXPRESSION_PRESETS.angry;
EXPRESSION_PRESETS.adorable = EXPRESSION_PRESETS.sweet;
EXPRESSION_PRESETS.whisper = EXPRESSION_PRESETS.scary_smile2;



function lerp(a, b, t) { return a + (b - a) * t; }

function VrmModel({ vrmUrl, animationUrl, emotion, customExpression = null, isTalking, peak = 0, closeness = 50, isDancing = false, onLoad, onAnimationPlay, onInteraction }) {
    const [vrm, setVrm] = useState(null);
    const mixerRef = useRef(null);
    const currentActionRef = useRef(null);
    const vrmRef = useRef(null);
    const prevAnimUrlRef = useRef(null);
    const [blinkVal, setBlinkVal] = useState(0);

    // Dynamic Emotion Map
    const currentEmoteRef = useRef({
        happy: 0, angry: 0, sad: 0, relaxed: 0, surprised: 0,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, fun: 0,
        eyeHighlightHide: 0,
        ih: 0,
        haShortLow: 0,
        blush: 0, eyebrowAnger: 0, eyebrowSurprise: 0
    });

    // Iris / Eye Materials for "Black Eye" override
    const eyeMaterialsRef = useRef([]);

    useEffect(() => {
        if (!vrm) return;
        eyeMaterialsRef.current = [];
        vrm.scene.traverse((obj) => {
            if (obj.isMesh && obj.material) {
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                mats.forEach(m => {
                    const name = m.name.toLowerCase();
                    if (name.includes('white') || name.includes('sclera') || name.includes('face') || name.includes('skin')) return;
                    
                    if (name.includes('iris') || name.includes('pupil') || name.includes('hig') || name.includes('ref')) {
                        eyeMaterialsRef.current.push({
                            material: m,
                            originalColor: m.color.clone(),
                            originalEmissive: m.emissive ? m.emissive.clone() : null,
                            originalOpacity: m.opacity
                        });
                    }
                });
            }
        });
    }, [vrm]);

    // Lip sync state & smoothed vowel weights
    const lipRef = useRef({ phase: 0, nextSwitch: 0, currentShape: 'aa', intensity: 0 });
    const mouthWeightsRef = useRef({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 });

    // Natural blink timing
    const blinkRef = useRef({ nextBlinkTime: 2 + Math.random() * 3, isBlinking: false, blinkStart: 0 });

    // Procedural body refs for idle sway
    const bonesRef = useRef({ spine: null, chest: null, leftArm: null, rightArm: null, head: null });

    // Load VRM
    useEffect(() => {
        let isCancelled = false;
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        loader.load(vrmUrl, (gltf) => {
            if (isCancelled) return;
            const newVrm = gltf.userData.vrm;
            VRMUtils.combineSkeletons(gltf.scene);
            newVrm.scene.rotation.y = 0;

            mixerRef.current = new THREE.AnimationMixer(newVrm.scene);

            const humanoid = newVrm.humanoid;
            if (humanoid) {
                try {
                    bonesRef.current.spine = humanoid.getNormalizedBoneNode('spine');
                    bonesRef.current.chest = humanoid.getNormalizedBoneNode('chest');
                    bonesRef.current.leftArm = humanoid.getNormalizedBoneNode('leftUpperArm');
                    bonesRef.current.rightArm = humanoid.getNormalizedBoneNode('rightUpperArm');
                    bonesRef.current.head = humanoid.getNormalizedBoneNode('head');
                } catch (e) {
                    console.warn("Could not find all bones for procedural animation:", e);
                }
            }

            setVrm(newVrm);
            vrmRef.current = newVrm;
            if (onLoad) onLoad(true);
        }, undefined, (err) => console.error(err));

        return () => {
            isCancelled = true;
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                mixerRef.current = null;
            }
        };
    }, [vrmUrl]);

    // Animation clip cache to enable instant, smooth crossfades between animations
    const clipCacheRef = useRef(new Map());

    useEffect(() => {
        // Clear cached animation clips when VRM model instance changes
        clipCacheRef.current.clear();
        if (!vrm) return;

        // Prefetch core animations into cache for instantaneous crossfading
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
        ["/animations/idle1.vrma", "/animations/bang.vrma"].forEach(url => {
            loader.load(url, (gltf) => {
                const vrmAnims = gltf.userData.vrmAnimations;
                if (vrmAnims && vrmAnims.length > 0 && vrm) {
                    const clip = createVRMAnimationClip(vrmAnims[0], vrm);
                    if (clip) clipCacheRef.current.set(url, clip);
                }
            }, undefined, () => {});
        });
    }, [vrm]);

    // Play VRMA Animation
    useEffect(() => {
        if (!vrm || !animationUrl || !mixerRef.current) {
            if (currentActionRef.current) {
                currentActionRef.current.fadeOut(0.3);
                currentActionRef.current = null;
            }
            return;
        }

        prevAnimUrlRef.current = animationUrl;
        let isCancelled = false;

        const playAction = (clip, url) => {
            if (isCancelled || !vrm || !mixerRef.current) return;
            const newAction = mixerRef.current.clipAction(clip);
            newAction.setLoop(THREE.LoopRepeat);
            newAction.clampWhenFinished = false;
            newAction.timeScale = 1.0;

            if (currentActionRef.current && currentActionRef.current !== newAction) {
                currentActionRef.current.fadeOut(0.35);
            }
            if (currentActionRef.current !== newAction || !newAction.isRunning()) {
                newAction.reset().fadeIn(0.35).play();
                currentActionRef.current = newAction;
            }

            if (onAnimationPlay) {
                onAnimationPlay(url);
            }
        };

        // If clip is already loaded in memory, play it instantly
        if (clipCacheRef.current.has(animationUrl)) {
            playAction(clipCacheRef.current.get(animationUrl), animationUrl);
            return;
        }

        const loader = new GLTFLoader();
        loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

        loader.load(animationUrl, (gltf) => {
            if (isCancelled || !vrm || !mixerRef.current) return;

            const vrmAnimations = gltf.userData.vrmAnimations;
            if (!vrmAnimations || vrmAnimations.length === 0) return;

            const clip = createVRMAnimationClip(vrmAnimations[0], vrm);
            if (!clip) return;

            clipCacheRef.current.set(animationUrl, clip);
            playAction(clip, animationUrl);
        }, undefined, (err) => {
            console.warn("[VRM] Animation load fallback:", animationUrl, err);
            // Safe fallback to idle1 if an animation fails to load
            if (animationUrl !== "/animations/idle1.vrma") {
                const idleUrl = "/animations/idle1.vrma";
                if (clipCacheRef.current.has(idleUrl)) {
                    playAction(clipCacheRef.current.get(idleUrl), idleUrl);
                }
            }
        });

        return () => {
            isCancelled = true;
        };
    }, [vrm, animationUrl]);

    // Per-frame update
    useFrame((state, delta) => {
        if (!vrm) return;

        const t = state.clock.elapsedTime;
        const mgr = vrm.expressionManager;
        const bones = bonesRef.current;

        // =============================================================
        // 0. NON-ZOOMING CINEMATIC CAMERA PANNING & FRAMING (When not dancing)
        // =============================================================
        if (!isDancing) {
            let targetCamPos = [0, 0.15, 1.85];

            if (['sweet', 'flirty'].includes(emotion)) {
                targetCamPos = [0.10, 0.14, 1.85];
            } else if (['angry', 'jealous'].includes(emotion)) {
                targetCamPos = [-0.12, 0.16, 1.85];
            } else if (['scary_smile', 'scary_smile2', 'dead', 'hollow'].includes(emotion)) {
                targetCamPos = [0, 0.08, 1.85];
            }

            const camLerpSpeed = 3.0 * delta;
            state.camera.position.x = lerp(state.camera.position.x, targetCamPos[0], camLerpSpeed);
            state.camera.position.y = lerp(state.camera.position.y, targetCamPos[1], camLerpSpeed);
            state.camera.position.z = lerp(state.camera.position.z, targetCamPos[2], camLerpSpeed);
            if (state.camera.fov !== 21) {
                state.camera.fov = 21;
                state.camera.updateProjectionMatrix();
            }
        }

        // =============================================================
        // 1. PROCEDURAL IDLE BODY MOVEMENT (when no VRMA animation playing)
        // =============================================================
        const hasActiveAnimation = currentActionRef.current && currentActionRef.current.isRunning();

        if (!hasActiveAnimation) {
            if (bones.spine) {
                bones.spine.rotation.x = Math.sin(t * 1.2) * 0.012;
                bones.spine.rotation.z = Math.sin(t * 0.7) * 0.005;
            }
            if (bones.chest) {
                bones.chest.rotation.x = Math.sin(t * 1.2 + 0.3) * 0.008;
            }

            if (bones.head) {
                const mouseX = state.mouse.x * 0.18;
                const mouseY = state.mouse.y * 0.10;
                bones.head.rotation.y = lerp(bones.head.rotation.y, mouseX + Math.sin(t * 0.5) * 0.02, 0.04);
                bones.head.rotation.x = lerp(bones.head.rotation.x, -mouseY + Math.sin(t * 0.8) * 0.01, 0.04);
                bones.head.rotation.z = Math.sin(t * 0.4) * 0.015;
            }

            if (bones.leftArm) {
                bones.leftArm.rotation.x = 0.08 + Math.sin(t * 0.9) * 0.02;
                bones.leftArm.rotation.z = -0.75 + Math.sin(t * 0.6) * 0.015;
            }
            if (bones.rightArm) {
                bones.rightArm.rotation.x = 0.08 + Math.sin(t * 0.9 + 0.5) * 0.02;
                bones.rightArm.rotation.z = 0.75 - Math.sin(t * 0.6) * 0.015;
            }
        }

        // =============================================================
        // 2. EMOTION BLEND SHAPES
        // =============================================================
        if (mgr) {
            const basePreset = EXPRESSION_PRESETS[emotion] || EXPRESSION_PRESETS.neutral;
            const target = (customExpression && typeof customExpression === 'object')
                ? { ...basePreset, ...customExpression }
                : basePreset;
            const cur = currentEmoteRef.current;
            const lerpSpeed = 0.08;

            Object.keys(target).forEach(key => {
                cur[key] = lerp(cur[key] || 0, target[key] || 0, lerpSpeed);
            });

            try { mgr.setValue('happy', cur.happy); } catch (e) {}
            try { mgr.setValue('angry', cur.angry); } catch (e) {}
            try { mgr.setValue('sad', cur.sad); } catch (e) {}
            try { mgr.setValue('relaxed', cur.relaxed); } catch (e) {}
            try { mgr.setValue('surprised', cur.surprised); } catch (e) {}
            try { mgr.setValue('blinkLeft', cur.blinkLeft); } catch (e) {}
            try { mgr.setValue('blinkRight', cur.blinkRight); } catch (e) {}
            try { mgr.setValue('eyeHighlightHide', cur.eyeHighlightHide); } catch (e) {}
            try { mgr.setValue('blush', cur.blush); } catch (e) {}
            try { mgr.setValue('eyebrowAnger', cur.eyebrowAnger); } catch (e) {}
            try { mgr.setValue('eyebrowSurprise', cur.eyebrowSurprise); } catch (e) {}
            try { mgr.setValue('haShortLow', cur.haShortLow); } catch (e) {}

            const isPsycho = ['scary_smile', 'scary_smile2', 'dead', 'hollow'].includes(emotion);
            if (eyeMaterialsRef.current.length > 0) {
                eyeMaterialsRef.current.forEach(({ material, originalColor }) => {
                    if (isPsycho) {
                        material.color.lerp(new THREE.Color(0x050002), 0.1);
                        if (material.emissive) material.emissive.setHex(0x1a0005);
                    } else {
                        material.color.lerp(originalColor, 0.1);
                        if (material.emissive) material.emissive.setHex(0x000000);
                    }
                });
            }

            // 3. NATURAL BLINKING
            const isBlinkSuppressed = isPsycho || cur.blinkLeft > 0.5 || cur.blinkRight > 0.5 || emotion === 'sweet' || emotion === 'happy';

            if (!isBlinkSuppressed) {
                const blink = blinkRef.current;
                blink.blinkStart += delta;

                if (!blink.isBlinking && blink.blinkStart >= blink.nextBlinkTime) {
                    blink.isBlinking = true;
                    blink.blinkStart = 0;
                    blink.nextBlinkTime = 2.5 + Math.random() * 4.0;
                }

                if (blink.isBlinking) {
                    const blinkProgress = blink.blinkStart / 0.15;
                    if (blinkProgress < 1.0) {
                        const bVal = Math.sin(blinkProgress * Math.PI);
                        try { mgr.setValue('blink', bVal); } catch (e) {}
                    } else {
                        blink.isBlinking = false;
                        try { mgr.setValue('blink', 0.0); } catch (e) {}
                    }
                }
            }

            // 4. NATURAL ANIME LIP SYNC (Delicate, capped opening, never gaping wide open)
            const isSinging = animationUrl && animationUrl.includes('Singing');
            const shouldLipSync = isTalking || isSinging;

            // Strict maximum opening caps to ensure mouth never gaps open or sticks tongue out
            const MOUTH_CAPS = {
                aa: 0.30, // Natural soft jaw opening — never exposes throat or forces tongue out
                ih: 0.16, // Subtle horizontal smile opening
                ou: 0.20, // Gentle small rounded mouth
                ee: 0.18, // Subtle teeth/vowel articulation
                oh: 0.24  // Small rounded O shape
            };

            const mouthWeights = mouthWeightsRef.current;
            const lip = lipRef.current;

            // Suppress wide open laughing or shout morphs during speech
            if (shouldLipSync) {
                try { mgr.setValue('haShortLow', 0); } catch (e) {}
            }

            if (shouldLipSync) {
                lip.phase += delta;
                if (lip.phase > lip.nextSwitch) {
                    const speechShapes = ['aa', 'ih', 'ee', 'oh', 'ou', 'aa', 'ee'];
                    lip.currentShape = speechShapes[Math.floor(Math.random() * speechShapes.length)];
                    lip.nextSwitch = lip.phase + 0.08 + Math.random() * 0.10;
                }

                const effectivePeak = isSinging ? (Math.sin(lip.phase * 4) * 0.5 + 0.5) : peak;
                const isSpeakingCadence = effectivePeak > 0.025;

                // Syllabic rise and fall (~4.5 Hz natural speech rhythm)
                const syllableWave = Math.max(0, Math.sin(lip.phase * 15.0));

                let targetOpenness = 0;
                if (isSpeakingCadence) {
                    const audioIntensity = Math.min((effectivePeak - 0.025) * 2.8, 1.0);
                    targetOpenness = (0.35 + 0.65 * audioIntensity) * (0.3 + 0.7 * syllableWave);
                } else if (isTalking) {
                    // Slight breathing micro-movement during speech pause
                    targetOpenness = Math.sin(lip.phase * 8.0) * 0.04;
                }

                // Smoothly lerp active and inactive vowel shapes
                ['aa', 'ih', 'ou', 'ee', 'oh'].forEach(v => {
                    const targetVal = (v === lip.currentShape) 
                        ? Math.max(0, targetOpenness * (MOUTH_CAPS[v] || 0.22))
                        : 0;
                    mouthWeights[v] = lerp(mouthWeights[v] || 0, targetVal, 0.35);
                    try { mgr.setValue(v, mouthWeights[v]); } catch (e) {}
                });
            } else {
                // Smoothly close mouth completely when silent
                ['aa', 'ih', 'ou', 'ee', 'oh'].forEach(v => {
                    mouthWeights[v] = lerp(mouthWeights[v] || 0, 0, 0.3);
                    try { mgr.setValue(v, mouthWeights[v]); } catch (e) {}
                });
            }
        }

        // =============================================================
        // 5. CONVERSATIONAL MICRO-ANIMATION & BLENDING
        // =============================================================
        if (mixerRef.current) mixerRef.current.update(delta);

        // Add lively conversational head/chest rhythm while speaking
        if (isTalking && !isDancing) {
            const speechActivity = Math.min(Math.max((peak - 0.02) * 2.5, 0.0), 1.0);
            if (bones.head) {
                // Subtle head nod on speech emphasis
                const nod = Math.sin(t * 4.8) * 0.022 * (0.3 + 0.7 * speechActivity);
                bones.head.rotation.x += nod;
                // Cute slight head tilt while speaking
                bones.head.rotation.z += Math.sin(t * 1.6) * 0.018;
                // Soft gaze direction toward mouse / user
                const mouseX = state.mouse.x * 0.12;
                const mouseY = state.mouse.y * 0.08;
                bones.head.rotation.y = lerp(bones.head.rotation.y, mouseX + Math.sin(t * 0.6) * 0.012, 0.05);
                bones.head.rotation.x = lerp(bones.head.rotation.x, -mouseY + nod, 0.05);
            }
            if (bones.chest) {
                bones.chest.rotation.x += Math.sin(t * 2.4) * 0.006 * (0.5 + 0.5 * speechActivity);
            }
        }

        vrm.update(delta);
    });

    const handlePointerDown = (e) => {
        e.stopPropagation();
        onInteraction(e.object.name.toLowerCase().includes('head') ? 'headpat' : 'poke');
    };

    return vrm ? (
        <primitive object={vrm.scene} position={[0, -1.01, 0]} onPointerDown={handlePointerDown} />
    ) : null;
}





function DanceCameraRig({ isDancing }) {
    useFrame(({ camera, clock }, delta) => {
        if (!isDancing) {
            if (camera.userData.wasDancing) {
                camera.userData.wasDancing = false;
            }
            return;
        }
        
        if (!camera.userData.wasDancing) {
            camera.userData.wasDancing = true;
        }
        
        const t = clock.getElapsedTime();
        
        // --- CINEMATIC MID-SHOT (Hide legs) ---
        // Moved camera in from 3.8m to 3.1m to cut off the lower legs/feet
        const radius = 3.1; 
        
        // Stronger swaying angle (approx 35 degrees) for a more pronounced optical illusion
        const angle = Math.sin(t * 1.3) * 0.60;
        
        const targetX = Math.sin(angle) * radius;
        const targetZ = Math.cos(angle) * radius;
        
        // Raise the camera height slightly closer to chest level
        const targetY = -0.05; 
        const targetFov = 21;

        const lerpSpeed = Math.min(5.0 * delta, 1.0); 
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, lerpSpeed);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, lerpSpeed);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, lerpSpeed);
        
        // Look slightly higher (stomach level) so her head has that 30px gap 
        // and the bottom of the frame neatly cuts off her legs around the knees.
        camera.lookAt(0, -0.10, 0);

        if (camera.fov !== targetFov) {
            camera.fov = targetFov;
            camera.updateProjectionMatrix();
        }
    });
    return null;
}

const VALID_VRMA_NAMES = new Set([
    "idle1", "idle2", "bang", "peace_sign", "scare_jump", "view_360", "view_360_stylish",
    "blow_kiss", "happy_idle", "nod_yes", "look_around", "thankful", "thinking",
    "angry", "greeting", "sadIdle", "kyun_dance", "dance1", "lag_queen",
    "VRMA_01", "VRMA_02", "VRMA_03", "VRMA_04", "VRMA_05", "VRMA_06", "VRMA_07",
    "pose_friendy", "pose_lillian", "pose_nyammy", "pose_wonderful", "Singing"
]);

const ANIM_ALIASES = {
    // Descriptive names mapped to VRMA 1-5
    vrma1: "view_360",
    vrma_01: "view_360",
    vrma2: "scare_jump",
    vrma_02: "scare_jump",
    vrma3: "peace_sign",
    vrma_03: "peace_sign",
    vrma4: "bang",
    vrma_04: "bang",
    vrma5: "view_360_stylish",
    vrma_05: "view_360_stylish",
    vrma6: "VRMA_06",
    vrma_06: "VRMA_06",
    vrma7: "VRMA_07",
    vrma_07: "VRMA_07",

    // Natural shorthand aliases
    peace: "peace_sign",
    v_sign: "peace_sign",
    pistol: "bang",
    hand_pistol: "bang",
    gun: "bang",
    scare: "scare_jump",
    jump: "scare_jump",
    jumpscare: "scare_jump",
    "360": "view_360",
    turntable: "view_360",
    "360_style": "view_360_stylish",
    "360_stylish": "view_360_stylish",
    kiss: "blow_kiss",
    blow_a_kiss: "blow_kiss",
    "blow a kiss": "blow_kiss",
    nod: "nod_yes",
    "head nod": "nod_yes",
    "head nod yes": "nod_yes",
    yes: "nod_yes",
    thank: "thankful",
    thanks: "thankful",
    grateful: "thankful",
    think: "thinking",
    ponder: "thinking",
    curious: "look_around",
    look: "look_around",
    "look around": "look_around",
    look_away: "look_around",
    happy: "happy_idle",
    excited: "happy_idle",
    shrug: "VRMA_06",
    tsundere: "angry",
    sweet: "VRMA_07",
    yandere: "VRMA_07",
    wave: "greeting",
    hello: "greeting",
    dance: "kyun_dance",
    // Per user instruction: do not use Taking animation; use idle1 for normal conversation
    talk: "idle1",
    talking: "idle1",
    speaking: "idle1"
};

export default function VrmAvatar({
    emotion = "neutral",
    animation = "",
    customExpression = null,
    isTalking = false,
    peak = 0,
    modelUrl = "/models/Reina.vrm",
    closeness = 50,
    isDancing: isDancingProp = false,
    onLoad = () => {},
    onAnimationPlay = () => {},
    onInteraction = () => {}
}) {
    // 1. Resolve raw animation name through alias map
    const rawAnim = (animation || "").replace(/\.vrma$/i, "").trim();
    const resolvedName = ANIM_ALIASES[rawAnim.toLowerCase()] || rawAnim;

    // 2. Select active animation:
    // User rule: For normal conversation, stay in "idle1" (natural idle breathing).
    // Only switch to an animation when an explicit expressive/emotional animation is requested!
    let activeAnim = "idle1";
    if (resolvedName && resolvedName !== "idle1" && VALID_VRMA_NAMES.has(resolvedName)) {
        activeAnim = resolvedName;
    } else if (resolvedName === "idle2") {
        activeAnim = "idle2";
    } else {
        activeAnim = "idle1";
    }

    const animUrl = `/animations/${activeAnim}.vrma`;
    const isDancing = isDancingProp || activeAnim === "kyun_dance" || activeAnim === "dance1" || activeAnim === "lag_queen" || activeAnim === "Singing";

    return (
        <div className="w-full h-full relative bg-transparent">
            <Canvas camera={{ position: [0, 0.15, 1.85], fov: 21 }} style={{ background: 'transparent' }}>
                <ambientLight intensity={1.1} color="#ffffff" />
                <directionalLight position={[-2, 5, 2.5]} intensity={1.3} color="#fff0f0" />
                <directionalLight position={[2, 3, 2]} intensity={0.7} color="#eef4ff" />
                <pointLight position={[0, 1.8, 1.2]} intensity={0.8} color="#ffe2d0" />
                <pointLight position={[0, -0.8, 1]} intensity={0.4} color="#ffd4e6" />
                
                {/* 3D Dust/Sparkles to provide stronger parallax reference without lagging GPU */}
                {isDancing && (
                    <Sparkles 
                        count={350} 
                        scale={12} 
                        size={3.5} 
                        speed={0.6} 
                        opacity={0.4} 
                        color="#ff3388"
                    />
                )}
                
                <DanceCameraRig isDancing={isDancing} />
                <VrmModel
                    vrmUrl={modelUrl}
                    animationUrl={animUrl}
                    emotion={emotion}
                    customExpression={customExpression}
                    isTalking={isTalking}
                    peak={peak}
                    isDancing={isDancing}
                    onLoad={onLoad}
                    onAnimationPlay={onAnimationPlay}
                    onInteraction={onInteraction}
                />
                
                {!isDancing && <OrbitControls target={[0, 0.05, 0]} enableRotate={false} enableZoom={false} enablePan={false} />}
            </Canvas>
        </div>
    );
}
