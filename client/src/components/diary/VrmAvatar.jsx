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
// ==========================================================================
// Expression Presets — each emotion maps to VRM morph target intensities
// ==========================================================================
const EXPRESSION_PRESETS = {
    neutral: {
        happy: 0, angry: 0, sad: 0, relaxed: 0.15, surprised: 0,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, eyeHighlightHide: 0,
        blush: 0, eyebrowAnger: 0, eyebrowSurprise: 0
    },
    sweet: {
        happy: 0.7, angry: 0, sad: 0, relaxed: 0.4, surprised: 0,
        blinkLeft: 0, blinkRight: 0, ee: 0.15, oh: 0, eyeHighlightHide: 0,
        blush: 0.5, eyebrowAnger: 0, eyebrowSurprise: 0.1
    },
    jealous: {
        happy: 0, angry: 0.7, sad: 0.3, relaxed: 0, surprised: 0,
        blinkLeft: 0.3, blinkRight: 0, ee: 0, oh: 0.1, eyeHighlightHide: 0,
        blush: 0.2, eyebrowAnger: 0.6, eyebrowSurprise: 0
    },
    angry: {
        happy: 0, angry: 1.0, sad: 0, relaxed: 0, surprised: 0.15,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, eyeHighlightHide: 0,
        blush: 0.3, eyebrowAnger: 1.0, eyebrowSurprise: 0
    },
    brat: {
        happy: 0.5, angry: 0, sad: 0, relaxed: 0.2, surprised: 0.15,
        blinkLeft: 1.0, blinkRight: 0, ee: 0.3, oh: 0, eyeHighlightHide: 0,
        blush: 0.3, eyebrowAnger: 0.2, eyebrowSurprise: 0.2
    },
    bratty: {
        happy: 0.5, angry: 0.1, sad: 0, relaxed: 0.15, surprised: 0.1,
        blinkLeft: 1.0, blinkRight: 0, ee: 0.3, oh: 0, eyeHighlightHide: 0,
        blush: 0.25, eyebrowAnger: 0.3, eyebrowSurprise: 0.15
    },
    adorable: {
        happy: 0.4, angry: 0, sad: 0.1, relaxed: 0.3, surprised: 0.2,
        blinkLeft: 0, blinkRight: 0.9, ee: 0.2, oh: 0, eyeHighlightHide: 0,
        blush: 0.6, eyebrowAnger: 0, eyebrowSurprise: 0.2
    },
    sad: {
        happy: 0, angry: 0, sad: 1.0, relaxed: 0, surprised: 0,
        blinkLeft: 0.2, blinkRight: 0.2, ee: 0, oh: 0.2, eyeHighlightHide: 0,
        blush: 0, eyebrowAnger: 0, eyebrowSurprise: 0
    },
    happy: {
        happy: 1.0, angry: 0, sad: 0, relaxed: 0.3, surprised: 0.1,
        blinkLeft: 0, blinkRight: 0, ee: 0.2, oh: 0, eyeHighlightHide: 0,
        blush: 0.4, eyebrowAnger: 0, eyebrowSurprise: 0.1
    },
    mad: {
        happy: 0, angry: 1.0, sad: 0, relaxed: 0, surprised: 0.8,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0.1, fun: 0.5, eyeHighlightHide: 0,
        blush: 0, eyebrowAnger: 1.0, eyebrowSurprise: 0.5
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
    scary_smile: {
        happy: 0, angry: 0, sad: 0, relaxed: 0, surprised: 0.5,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, 
        fun: 1.0, 
        eyeHighlightHide: 1.0,
        ih: 1.0,
        haShortLow: 1.0,
        blush: 0, eyebrowAnger: 0.3, eyebrowSurprise: 0.4
    },
    excited: {
        happy: 0.9, angry: 0, sad: 0, relaxed: 0.2, surprised: 0.35,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0.1, ih: 0.5, eyeHighlightHide: 0,
        blush: 0.5, eyebrowAnger: 0, eyebrowSurprise: 0.4
    },
    flirty: {
        happy: 0.4, angry: 0, sad: 0, relaxed: 0.3, surprised: 0.1,
        blinkLeft: 0, blinkRight: 0.8, ee: 0.2, oh: 0, eyeHighlightHide: 0,
        blush: 0.7, eyebrowAnger: 0, eyebrowSurprise: 0.1
    },
    tsundere: {
        happy: 0, angry: 0.8, sad: 0, relaxed: 0, surprised: 0.2,
        blinkLeft: 0, blinkRight: 0.8, ee: 0.3, oh: 0, eyeHighlightHide: 0,
        blush: 0.6, eyebrowAnger: 0.7, eyebrowSurprise: 0.2
    },
    embarrassed: {
        happy: 0.3, angry: 0, sad: 0.2, relaxed: 0, surprised: 0.4,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0.3, eyeHighlightHide: 0,
        blush: 0.9, eyebrowAnger: 0.2, eyebrowSurprise: 0.3
    },
    joke: {
        happy: 0.8, angry: 0, sad: 0, relaxed: 0.3, surprised: 0.3,
        blinkLeft: 1.0, blinkRight: 0, ee: 0.4, oh: 0, eyeHighlightHide: 0,
        blush: 0.3, eyebrowAnger: 0, eyebrowSurprise: 0.3
    },
    scary_smile2: {
        happy: 0.4, angry: 0, sad: 0, relaxed: 0.3, surprised: 0.1,
        blinkLeft: 0, blinkRight: 0.8, ee: 0.2, oh: 0, eyeHighlightHide: 0,
        blush: 0.1, eyebrowAnger: 0.3, eyebrowSurprise: 0.2
    },
    psycho: {
        happy: 1.0, angry: 0.4, sad: 0, relaxed: 0, surprised: 0.3,
        blinkLeft: 0, blinkRight: 0, ee: 1.0, oh: 0, fun: 0.5, eyeHighlightHide: 0,
        blush: 0.2, eyebrowAnger: 0.5, eyebrowSurprise: 0.3
    },
    joy: {
        happy: 1.0, angry: 0, sad: 0, relaxed: 0.3, surprised: 0.1,
        blinkLeft: 0, blinkRight: 0, ee: 0.2, oh: 0, eyeHighlightHide: 0,
        blush: 0.45, eyebrowAnger: 0, eyebrowSurprise: 0.1
    },
    fun: {
        happy: 0.6, angry: 0, sad: 0, relaxed: 0.5, surprised: 0.2,
        blinkLeft: 0, blinkRight: 0, ee: 0.15, oh: 0.1, eyeHighlightHide: 0,
        blush: 0.35, eyebrowAnger: 0, eyebrowSurprise: 0.2
    },
    sorrow: {
        happy: 0, angry: 0, sad: 1.0, relaxed: 0, surprised: 0,
        blinkLeft: 0.2, blinkRight: 0.2, ee: 0, oh: 0.2, eyeHighlightHide: 0,
        blush: 0.1, eyebrowAnger: 0.2, eyebrowSurprise: 0
    },
};


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

    // Lip sync state
    const lipRef = useRef({ phase: 0, nextSwitch: 0, currentShape: 'aa', intensity: 0 });

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

        const loader = new GLTFLoader();
        loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

        loader.load(animationUrl, (gltf) => {
            if (isCancelled || !vrm || !mixerRef.current) return;

            const vrmAnimations = gltf.userData.vrmAnimations;
            if (!vrmAnimations || vrmAnimations.length === 0) return;

            const clip = createVRMAnimationClip(vrmAnimations[0], vrm);
            if (!clip) return;

            const newAction = mixerRef.current.clipAction(clip);
            newAction.setLoop(THREE.LoopRepeat);
            newAction.clampWhenFinished = false;
            newAction.timeScale = 1.0;

            if (currentActionRef.current) {
                currentActionRef.current.fadeOut(0.6);
            }
            newAction.reset().fadeIn(0.6).play();
            currentActionRef.current = newAction;
            
            if (onAnimationPlay) {
                onAnimationPlay(animationUrl);
            }
        }, undefined, (err) => {
            console.warn("Animation load fallback:", animationUrl, err);
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

            if (['sweet', 'flirty', 'adorable'].includes(emotion)) {
                targetCamPos = [0.10, 0.14, 1.85];
            } else if (['tsundere', 'angry', 'jealous', 'brat', 'bratty'].includes(emotion)) {
                targetCamPos = [-0.12, 0.16, 1.85];
            } else if (['psycho', 'scary_smile', 'scary_smile2', 'dead', 'hollow'].includes(emotion)) {
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

            const isPsycho = ['psycho', 'scary_smile', 'scary_smile2', 'dead', 'hollow'].includes(emotion);
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
            const isBlinkSuppressed = isPsycho || cur.blinkLeft > 0.5 || cur.blinkRight > 0.5;

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

            // 4. LIP SYNC
            const isSinging = animationUrl && animationUrl.includes('Singing');
            const shouldLipSync = isTalking || isSinging;

            try { mgr.setValue('aa', 0); } catch (e) {}
            try { mgr.setValue('ih', shouldLipSync ? 0 : cur.ih); } catch (e) {}
            try { mgr.setValue('ou', 0); } catch (e) {}
            try { mgr.setValue('ee', shouldLipSync ? 0 : cur.ee); } catch (e) {}
            try { mgr.setValue('oh', shouldLipSync ? 0 : cur.oh); } catch (e) {}

            if (shouldLipSync) {
                const lip = lipRef.current;
                lip.phase += delta;
                if (lip.phase > lip.nextSwitch) {
                    const shapes = ['aa', 'ih', 'ou', 'ee', 'oh', 'aa', 'aa', 'ih'];
                    lip.currentShape = shapes[Math.floor(Math.random() * shapes.length)];
                    lip.nextSwitch = lip.phase + (isSinging ? 0.15 : 0.08) + Math.random() * 0.12;
                    lip.intensity = 0.4 + Math.random() * 0.6;
                }
                const effectivePeak = isSinging ? (Math.sin(lip.phase * 4) * 0.5 + 0.5) : peak;
                const envelope = (0.2 + effectivePeak * 0.8) * (Math.sin(lip.phase * 8) * 0.5 + 0.5);
                const finalVal = lip.intensity * envelope;
                try { mgr.setValue(lip.currentShape, Math.min(finalVal, 1.0)); } catch (e) {}
            }
        }

        vrm.update(delta);
        if (mixerRef.current) mixerRef.current.update(delta);
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
    const activeAnim = animation || "idle1";
    const animUrl = activeAnim ? (activeAnim.endsWith('.vrma') ? `/animations/${activeAnim}` : `/animations/${activeAnim}.vrma`) : null;
    const isDancing = isDancingProp || animation === "kyun_dance" || animation === "dance1";

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
