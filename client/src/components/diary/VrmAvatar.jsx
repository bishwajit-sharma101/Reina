import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { createVRMAnimationClip, VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation';
import * as THREE from 'three';

// ==========================================================================
// Expression Presets — each emotion maps to VRM morph target intensities
// ==========================================================================
const EXPRESSION_PRESETS = {
    neutral: {
        happy: 0, angry: 0, sad: 0, relaxed: 0.15, surprised: 0,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, eyeHighlightHide: 0
    },
    sweet: {
        happy: 0.7, angry: 0, sad: 0, relaxed: 0.4, surprised: 0,
        blinkLeft: 0, blinkRight: 0, ee: 0.15, oh: 0, eyeHighlightHide: 0
    },
    jealous: {
        happy: 0, angry: 0.7, sad: 0.3, relaxed: 0, surprised: 0,
        blinkLeft: 0.3, blinkRight: 0, ee: 0, oh: 0.1, eyeHighlightHide: 0
    },
    angry: {
        happy: 0, angry: 1.0, sad: 0, relaxed: 0, surprised: 0.15,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, eyeHighlightHide: 0
    },
    brat: {
        happy: 0.5, angry: 0, sad: 0, relaxed: 0.2, surprised: 0.15,
        blinkLeft: 1.0, blinkRight: 0, ee: 0.3, oh: 0, eyeHighlightHide: 0
    },
    bratty: {
        happy: 0.5, angry: 0.1, sad: 0, relaxed: 0.15, surprised: 0.1,
        blinkLeft: 1.0, blinkRight: 0, ee: 0.3, oh: 0, eyeHighlightHide: 0
    },
    adorable: {
        happy: 0.4, angry: 0, sad: 0.1, relaxed: 0.3, surprised: 0.2,
        blinkLeft: 0, blinkRight: 0.9, ee: 0.2, oh: 0, eyeHighlightHide: 0
    },
    sad: {
        happy: 0, angry: 0, sad: 1.0, relaxed: 0, surprised: 0,
        blinkLeft: 0.2, blinkRight: 0.2, ee: 0, oh: 0.2, eyeHighlightHide: 0
    },
    happy: {
        happy: 1.0, angry: 0, sad: 0, relaxed: 0.3, surprised: 0.1,
        blinkLeft: 0, blinkRight: 0, ee: 0.2, oh: 0, eyeHighlightHide: 0
    },
    mad: {
        // Scary hollow eyes — wide open, empty, menacing
        happy: 0, angry: 1.0, sad: 0, relaxed: 0, surprised: 0.8,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0.1, fun: 0.5, eyeHighlightHide: 0
    },
    hollow: {
        // Dead-eye psycho stare — wide open, mouth still neutral
        happy: 0, angry: 0.7, sad: 0, relaxed: 0, surprised: 0.4,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, fun: 0.5, eyeHighlightHide: 0.5
    },
    dead: {
        // Only this face gets the 'totally black iris' material override
        // Using lower surprised (0.7) to keep mouth closed while stare remains intense
        happy: 0, angry: 1.0, sad: 0, relaxed: 0, surprised: 0,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, fun: 1.0, eyeHighlightHide: 1.0
    },
    scary_smile: {
        // Exact VRoid sliders: Fun=1, HighlightHide=1, HA_Short_Low=1, MTH_I=0.5
        // Reference image shows a very thin, wide smile (MTH_I) with widened eyes.
        happy: 0, angry: 0, sad: 0, relaxed: 0, surprised: 0.5,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, 
        fun: 1.0, 
        eyeHighlightHide: 1.0,
        ih: 1.0, // Maximum wide mouth as in picture
        haShortLow: 1.0
    },
    excited: {
        happy: 0.9, angry: 0, sad: 0, relaxed: 0.2, surprised: 0.35,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0.1, ih: 0.5, eyeHighlightHide: 0
    },
    flirty: {
        happy: 0.4, angry: 0, sad: 0, relaxed: 0.3, surprised: 0.1,
        blinkLeft: 0, blinkRight: 0.8, ee: 0.2, oh: 0, eyeHighlightHide: 0
    },
    scary_smile2: {
        happy: 0.4, angry: 0, sad: 0, relaxed: 0.3, surprised: 0.1,
        blinkLeft: 0, blinkRight: 0.8, ee: 0.2, oh: 0, eyeHighlightHide: 0
    },
    psycho: {
        // Unhinged wide smile + wide-open 'snapped' eyes, NO vertical opening
        happy: 1.0, angry: 0.4, sad: 0, relaxed: 0, surprised: 0.3,
        blinkLeft: 0, blinkRight: 0, ee: 1.0, oh: 0, fun: 0.5, eyeHighlightHide: 0
    },
    joy: {
        happy: 1.0, angry: 0, sad: 0, relaxed: 0.3, surprised: 0.1,
        blinkLeft: 0, blinkRight: 0, ee: 0.2, oh: 0, eyeHighlightHide: 0
    },
    fun: {
        happy: 0.6, angry: 0, sad: 0, relaxed: 0.5, surprised: 0.2,
        blinkLeft: 0, blinkRight: 0, ee: 0.15, oh: 0.1, eyeHighlightHide: 0
    },
    sorrow: {
        happy: 0, angry: 0, sad: 1.0, relaxed: 0, surprised: 0,
        blinkLeft: 0.2, blinkRight: 0.2, ee: 0, oh: 0.2, eyeHighlightHide: 0
    },
};


function lerp(a, b, t) { return a + (b - a) * t; }

function VrmModel({ vrmUrl, animationUrl, emotion, isTalking, peak = 0, onLoad }) {
    const [vrm, setVrm] = useState(null);
    const mixerRef = useRef(null);
    const currentActionRef = useRef(null);
    const vrmRef = useRef(null);
    const prevAnimUrlRef = useRef(null);

    // Smooth expression state
    const currentExpressions = useRef({
        happy: 0, angry: 0, sad: 0, relaxed: 0, surprised: 0,
        blinkLeft: 0, blinkRight: 0, ee: 0, oh: 0, fun: 0,
        eyeHighlightHide: 0,
        ih: 0,
        haShortLow: 0
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
                    // EXCLUDE eye whites / sclera / skin
                    if (name.includes('white') || name.includes('sclera') || name.includes('face') || name.includes('skin')) return;
                    
                    // TARGET only Iris, Pupils, and Highlights
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
    const bonesRef = useRef({ spine: null, chest: null, leftArm: null, rightArm: null, leftLowerArm: null, rightLowerArm: null, head: null, neck: null });

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

            // Create ONE persistent mixer for this VRM
            mixerRef.current = new THREE.AnimationMixer(newVrm.scene);

            // Cache bone references for procedural animation
            const humanoid = newVrm.humanoid;
            if (humanoid) {
                try {
                    bonesRef.current.spine = humanoid.getNormalizedBoneNode('spine');
                    bonesRef.current.chest = humanoid.getNormalizedBoneNode('chest');
                    bonesRef.current.leftArm = humanoid.getNormalizedBoneNode('leftUpperArm');
                    bonesRef.current.rightArm = humanoid.getNormalizedBoneNode('rightUpperArm');
                    bonesRef.current.leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm');
                    bonesRef.current.rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm');
                    bonesRef.current.head = humanoid.getNormalizedBoneNode('head');
                    bonesRef.current.neck = humanoid.getNormalizedBoneNode('neck');

                    // Set initial resting pose — arms DOWN from T-pose
                    // VRM T-pose has arms horizontal (rotation.z = 0)
                    // Negative Z on left arm = down, Positive Z on right arm = down
                    // Use ~0.75 rad for arms mostly at sides, natural standing
                    if (bonesRef.current.leftArm) {
                        bonesRef.current.leftArm.rotation.z = -0.75;
                        bonesRef.current.leftArm.rotation.x = 0.08;
                    }
                    if (bonesRef.current.rightArm) {
                        bonesRef.current.rightArm.rotation.z = 0.75;
                        bonesRef.current.rightArm.rotation.x = 0.08;
                    }
                    // Slight elbow bend for natural look
                    if (bonesRef.current.leftLowerArm) {
                        bonesRef.current.leftLowerArm.rotation.y = 0.15;
                    }
                    if (bonesRef.current.rightLowerArm) {
                        bonesRef.current.rightLowerArm.rotation.y = -0.15;
                    }
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
            if (vrmRef.current) {
                VRMUtils.deepDispose(vrmRef.current.scene);
            }
        };
    }, [vrmUrl]);

    // Load / crossfade animation — uses SINGLE persistent mixer
    useEffect(() => {
        if (!vrm || !mixerRef.current) return;

        // No animation URL → smoothly fade out current and return to procedural idle
        if (!animationUrl) {
            if (currentActionRef.current) {
                const fadingAction = currentActionRef.current;
                fadingAction.fadeOut(1.0); // Slow fade out for smooth transition back to idle
                // Clean up reference after fade completes
                setTimeout(() => {
                    if (fadingAction === currentActionRef.current) {
                        currentActionRef.current = null;
                    }
                }, 1100);
            }
            prevAnimUrlRef.current = null;
            return;
        }

        // Skip if same animation already playing
        if (animationUrl === prevAnimUrlRef.current) return;
        if (animationUrl.includes('undefined') || animationUrl.endsWith('/.vrma')) return;

        prevAnimUrlRef.current = animationUrl;

        let isCancelled = false;
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

        loader.load(animationUrl, (gltf) => {
            if (isCancelled || !mixerRef.current) return;
            const vrmAnimations = gltf.userData.vrmAnimations;
            if (vrmAnimations && vrmAnimations.length > 0) {
                const clip = createVRMAnimationClip(vrmAnimations[0], vrm);
                const newAction = mixerRef.current.clipAction(clip);
                newAction.clampWhenFinished = false;
                newAction.loop = THREE.LoopRepeat;

                // Smooth crossfade from old animation to new (NO T-POSE FLASH)
                if (currentActionRef.current) {
                    const oldAction = currentActionRef.current;
                    newAction.reset();
                    newAction.setEffectiveWeight(1);
                    newAction.play();
                    newAction.crossFadeFrom(oldAction, 0.8, true); // 0.8s smooth blend
                } else {
                    newAction.reset();
                    newAction.setEffectiveWeight(1);
                    newAction.fadeIn(0.8); // 0.8s gentle fade in
                    newAction.play();
                }

                currentActionRef.current = newAction;
            }
        }, undefined, (err) => console.warn("Failed to load animation:", err));

        return () => { isCancelled = true; };
    }, [vrm, animationUrl]);

    // Per-frame update
    useFrame((state, delta) => {
        if (!vrm) return;

        const t = state.clock.elapsedTime;
        const mgr = vrm.expressionManager;

        // =============================================================
        // 1. PROCEDURAL IDLE BODY MOVEMENT (when no VRMA animation playing)
        // =============================================================
        const hasActiveAnimation = currentActionRef.current && currentActionRef.current.isRunning();
        const bones = bonesRef.current;

        if (!hasActiveAnimation) {
            // Subtle breathing — spine gentle rise/fall
            if (bones.spine) {
                bones.spine.rotation.x = Math.sin(t * 1.2) * 0.012;
                bones.spine.rotation.z = Math.sin(t * 0.7) * 0.005;
            }
            if (bones.chest) {
                bones.chest.rotation.x = Math.sin(t * 1.2 + 0.5) * 0.008;
            }
            // Arms at sides with subtle natural sway
            if (bones.leftArm) {
                bones.leftArm.rotation.z = -0.75 + Math.sin(t * 0.8) * 0.015;
                bones.leftArm.rotation.x = 0.08 + Math.sin(t * 0.6 + 1) * 0.01;
            }
            if (bones.rightArm) {
                bones.rightArm.rotation.z = 0.75 + Math.sin(t * 0.9 + 2) * 0.015;
                bones.rightArm.rotation.x = 0.08 + Math.sin(t * 0.65 + 3) * 0.01;
            }
            // Slight elbow micro-movement
            if (bones.leftLowerArm) {
                bones.leftLowerArm.rotation.y = 0.15 + Math.sin(t * 0.5 + 1) * 0.008;
            }
            if (bones.rightLowerArm) {
                bones.rightLowerArm.rotation.y = -0.15 + Math.sin(t * 0.55 + 2) * 0.008;
            }
            // Gentle head movement — slight look around, tilt
            if (bones.head) {
                bones.head.rotation.y = Math.sin(t * 0.4) * 0.025;
                bones.head.rotation.x = Math.sin(t * 0.3 + 1) * 0.01;
                bones.head.rotation.z = Math.sin(t * 0.25 + 2) * 0.008;
            }
            if (bones.neck) {
                bones.neck.rotation.y = Math.sin(t * 0.35 + 0.5) * 0.015;
            }
        }

        // =============================================================
        // 2. FACIAL EXPRESSIONS — primary focus, smooth lerp
        // =============================================================
        if (mgr) {
            const preset = EXPRESSION_PRESETS[emotion] || EXPRESSION_PRESETS.neutral;
            const cur = currentExpressions.current;
            const lerpSpeed = 5.0 * delta; // ~0.2s smooth transition

            cur.happy = lerp(cur.happy, preset.happy, lerpSpeed);
            cur.angry = lerp(cur.angry, preset.angry, lerpSpeed);
            cur.sad = lerp(cur.sad, preset.sad, lerpSpeed);
            cur.relaxed = lerp(cur.relaxed, preset.relaxed, lerpSpeed);
            cur.surprised = lerp(cur.surprised, preset.surprised, lerpSpeed);
            cur.blinkLeft = lerp(cur.blinkLeft, preset.blinkLeft, lerpSpeed);
            cur.blinkRight = lerp(cur.blinkRight, preset.blinkRight, lerpSpeed);
            cur.ee = lerp(cur.ee, preset.ee, lerpSpeed);
            cur.oh = lerp(cur.oh, preset.oh, lerpSpeed);
            cur.fun = lerp(cur.fun, preset.fun || 0, lerpSpeed);
            cur.eyeHighlightHide = lerp(cur.eyeHighlightHide || 0, preset.eyeHighlightHide || 0, lerpSpeed);
            cur.ih = lerp(cur.ih || 0, preset.ih || 0, lerpSpeed);
            cur.haShortLow = lerp(cur.haShortLow || 0, preset.haShortLow || 0, lerpSpeed);

            mgr.setValue('happy', cur.happy);
            mgr.setValue('angry', cur.angry);
            mgr.setValue('sad', cur.sad);
            mgr.setValue('relaxed', cur.relaxed);
            mgr.setValue('surprised', cur.surprised);
            // Standard VRM presets
            try { mgr.setValue('fun', cur.fun); } catch (e) {}
            try { mgr.setValue('ih', cur.ih); } catch (e) {}

            // Direct fallback to VRoid's internal mesh shapekey names
            try { mgr.setValue('Fcl_ALL_Fun', cur.fun); } catch (e) {}
            try { mgr.setValue('Fcl_EYE_Highlight_Hide', cur.eyeHighlightHide); } catch (e) {}
            try { mgr.setValue('Fcl_MTH_I', cur.ih); } catch (e) {}
            try { mgr.setValue('Fcl_HA_Short_Low', cur.haShortLow); } catch (e) {}
            
            try { mgr.setValue('blinkLeft', cur.blinkLeft); } catch (e) {}
            try { mgr.setValue('blinkRight', cur.blinkRight); } catch (e) {}

            // =============================================================
            // 2.5 BLACK IRIS OVERRIDE (for 'Scary' faces)
            // =============================================================
            const isDeadLook = ['dead', 'scary_smile', 'scary_smile2', 'hollow', 'mad'].includes(emotion);
            eyeMaterialsRef.current.forEach(({ material, originalColor, originalEmissive, originalOpacity }) => {
                if (isDeadLook) {
                    material.color.set(0x000000);
                    if (material.emissive) material.emissive.set(0x000000);
                    // Hide highlights / catch-lights COMPLETELY
                    if (material.name.toLowerCase().includes('hig') || material.name.toLowerCase().includes('ref')) {
                        material.opacity = 0;
                        material.transparent = true;
                    }
                } else {
                    material.color.copy(originalColor);
                    if (material.emissive && originalEmissive) material.emissive.copy(originalEmissive);
                    material.opacity = originalOpacity;
                }
            });

            // =============================================================
            // 3. NATURAL BLINKING — every 4-7 seconds, short 0.12s close
            // =============================================================
            if (preset.blinkLeft < 0.5 && preset.blinkRight < 0.5) {
                const blink = blinkRef.current;
                if (t >= blink.nextBlinkTime && !blink.isBlinking) {
                    blink.isBlinking = true;
                    blink.blinkStart = t;
                }
                if (blink.isBlinking) {
                    const elapsed = t - blink.blinkStart;
                    if (elapsed < 0.12) {
                        // Eyes closing and opening
                        const blinkVal = Math.sin((elapsed / 0.12) * Math.PI);
                        try { mgr.setValue('blink', blinkVal); } catch (e) {
                            try {
                                mgr.setValue('blinkLeft', Math.max(cur.blinkLeft, blinkVal));
                                mgr.setValue('blinkRight', Math.max(cur.blinkRight, blinkVal));
                            } catch (e2) {}
                        }
                    } else {
                        blink.isBlinking = false;
                        blink.nextBlinkTime = t + 4 + Math.random() * 3; // 4-7s
                        try { mgr.setValue('blink', 0.0); } catch (e) {}
                    }
                }
            }

            // =============================================================
            // 4. LIP SYNC — when talking
            // =============================================================
            try { mgr.setValue('aa', 0); } catch (e) {}
            try { mgr.setValue('ih', isTalking ? 0 : cur.ih); } catch (e) {}
            try { mgr.setValue('ou', 0); } catch (e) {}
            try { mgr.setValue('ee', isTalking ? 0 : cur.ee); } catch (e) {}
            try { mgr.setValue('oh', isTalking ? 0 : cur.oh); } catch (e) {}

            if (isTalking) {
                const lip = lipRef.current;
                lip.phase += delta;

                if (lip.phase > lip.nextSwitch) {
                    const shapes = ['aa', 'ih', 'ou', 'ee', 'oh', 'aa', 'aa', 'ih'];
                    lip.currentShape = shapes[Math.floor(Math.random() * shapes.length)];
                    lip.nextSwitch = lip.phase + 0.08 + Math.random() * 0.12;
                    lip.intensity = 0.3 + Math.random() * 0.7;
                }

                const envelope = (0.2 + peak * 0.8) * (Math.sin(lip.phase * 8) * 0.5 + 0.5);
                const finalVal = lip.intensity * envelope;

                try { mgr.setValue(lip.currentShape, Math.min(finalVal, 1.0)); } catch (e) {
                    try { mgr.setValue('aa', Math.min(finalVal, 1.0)); } catch (e2) {}
                }

                if (lip.currentShape === 'aa') {
                    try { mgr.setValue('oh', finalVal * 0.3); } catch (e) {}
                } else if (lip.currentShape === 'ee') {
                    try { mgr.setValue('ih', finalVal * 0.4); } catch (e) {}
                }
            }
        }

        vrm.update(delta);

        if (mixerRef.current) {
            mixerRef.current.update(delta);
        }
    });

    const handlePointerDown = (e) => {
        e.stopPropagation();
        const partName = e.object.name.toLowerCase();
        console.log("[AVATAR] Clicked part:", partName);
        
        if (partName.includes('head') || partName.includes('hair') || partName.includes('face')) {
            onInteraction('headpat');
        } else {
            onInteraction('poke');
        }
    };

    return vrm ? (
        <primitive 
            object={vrm.scene} 
            position={[0, -1.01, 0]} 
            onPointerDown={handlePointerDown}
        />
    ) : null;
}

export default function VrmAvatar({
    emotion = "neutral",
    animation = "",
    isTalking = false,
    peak = 0,
    modelUrl = "/models/Reina.vrm",
    closeness = 50,
    onLoad = () => {},
    onInteraction = () => {}
}) {
    // Default to idle1 for idle if no specific anim provided
    const activeAnim = animation || "idle1";

    const animUrl = activeAnim
        ? (activeAnim.endsWith('.vrma') ? `/animations/${activeAnim}` : `/animations/${activeAnim}.vrma`)
        : null;

    return (
        <div className="w-full h-full relative bg-transparent">
            <Canvas
                camera={{ position: [0, 0.15, 1.85], fov: 21 }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.8} />
                <directionalLight position={[-2, 5, 2]} intensity={1.2} color="#ffe5e5" castShadow />
                <pointLight position={[0, 2, 1]} intensity={0.8} color="#ffccaa" />
                <spotLight position={[5, 5, 5]} angle={0.15} penumbra={1} intensity={1} color="#ffffff" castShadow />
                
                <Environment preset="night" />

                <VrmModel
                    vrmUrl={modelUrl}
                    animationUrl={animUrl}
                    emotion={emotion}
                    isTalking={isTalking}
                    peak={peak}
                    onLoad={onLoad}
                    onInteraction={onInteraction}
                />

                <OrbitControls
                    target={[0, 0.05, 0]}
                    enableRotate={false}
                    enableZoom={false}
                    enablePan={false}
                />
            </Canvas>
        </div>
    );
}
