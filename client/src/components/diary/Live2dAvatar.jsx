import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

// Make PIXI globally available for pixi-live2d-display plugin
window.PIXI = PIXI;

export default function Live2dAvatar({
    emotion = "neutral",
    isTalking = false,
    peak = 0,
    modelPath = "/models/March 7th/march 7th.model3.json",
    onLoad = () => {},
    onInteraction = () => {}
}) {
    const canvasRef = useRef(null);
    const appRef = useRef(null);
    const modelRef = useRef(null);
    const isTalkingRef = useRef(isTalking);
    const peakRef = useRef(peak);

    useEffect(() => { isTalkingRef.current = isTalking; }, [isTalking]);
    useEffect(() => { peakRef.current = peak; }, [peak]);

    useEffect(() => {
        let isMounted = true;
        let Live2DModel;

        const initLive2D = async () => {
            try {
                // Dynamically import pixi-live2d-display/cubism4
                const live2dDisplay = await import('pixi-live2d-display/cubism4');
                Live2DModel = live2dDisplay.Live2DModel;
                Live2DModel.registerTicker(PIXI.Ticker);

                if (!canvasRef.current || !isMounted) return;

                const parent = canvasRef.current.parentElement;
                const width = parent.clientWidth || window.innerWidth;
                const height = parent.clientHeight || window.innerHeight;

                const app = new PIXI.Application({
                    view: canvasRef.current,
                    width: width,
                    height: height,
                    transparent: true,
                    autoStart: true,
                    backgroundAlpha: 0,
                    resolution: window.devicePixelRatio || 1
                });
                appRef.current = app;

                const model = await Live2DModel.from(modelPath, {
                    autoInteract: false
                });

                if (!isMounted) {
                    model.destroy();
                    app.destroy(true);
                    return;
                }

                modelRef.current = model;

                // Scale remains identical (3.1x); y position shifted UP to leave ~30px gap from top title
                const scale = (height * 3.1) / model.height;
                model.scale.set(scale);
                model.x = width / 2;
                model.y = height / 2 + (height * 0.95);
                model.anchor.set(0.5, 0.5);

                // Disable Pixi v7 EventSystem traversal to avoid isInteractive crash
                model.eventMode = 'none';
                model.interactive = false;
                if (app.stage) app.stage.eventMode = 'none';

                // Add pointer interaction listener
                model.on('hit', (hitAreas) => {
                    if (hitAreas.includes('head') || hitAreas.includes('face')) {
                        onInteraction('headpat');
                    } else {
                        onInteraction('poke');
                    }
                });

                app.stage.addChild(model);
                onLoad();

                // Per-frame dynamic breathing, head sway, eye movement & lip sync
                let frameTime = 0;
                app.ticker.add((delta) => {
                    if (!modelRef.current || !modelRef.current.internalModel) return;
                    const coreModel = modelRef.current.internalModel.coreModel;
                    if (!coreModel) return;

                    frameTime += delta * 0.03;

                    // Continuous Natural Idle Animations (Breathing, Head Sway, Body Tilt, Eye Gaze)
                    try {
                        const breathVal = (Math.sin(frameTime) + 1) * 0.5;
                        const headX = Math.sin(frameTime * 0.7) * 8.0;
                        const headY = Math.cos(frameTime * 0.5) * 5.0;
                        const headZ = Math.sin(frameTime * 0.4) * 4.0;
                        const bodyX = Math.sin(frameTime * 0.3) * 3.0;

                        coreModel.setParameterValueById('ParamBreath', breathVal);
                        coreModel.setParameterValueById('ParamAngleX', headX);
                        coreModel.setParameterValueById('ParamAngleY', headY);
                        coreModel.setParameterValueById('ParamAngleZ', headZ);
                        coreModel.setParameterValueById('ParamBodyAngleX', bodyX);
                        coreModel.setParameterValueById('ParamEyeBallX', Math.sin(frameTime * 0.6) * 0.3);
                        coreModel.setParameterValueById('ParamEyeBallY', Math.cos(frameTime * 0.5) * 0.3);
                    } catch (e) {}

                    // Real-time Audio & Speech Lip Sync
                    if (isTalkingRef.current) {
                        const audioMouth = peakRef.current > 0.05 ? Math.min(1.0, peakRef.current * 3.5) : (Math.sin(frameTime * 18) * 0.45 + 0.55);
                        try {
                            coreModel.setParameterValueById('ParamMouthOpenY', audioMouth);
                        } catch (e) {}
                    } else {
                        try {
                            coreModel.setParameterValueById('ParamMouthOpenY', 0);
                        } catch (e) {}
                    }
                });

            } catch (err) {
                console.error("Live2D Load Error:", err);
            }
        };

        initLive2D();

        const handleResize = () => {
            if (appRef.current && canvasRef.current) {
                const parent = canvasRef.current.parentElement;
                const w = parent.clientWidth || window.innerWidth;
                const h = parent.clientHeight || window.innerHeight;
                appRef.current.renderer.resize(w, h);

                if (modelRef.current) {
                    const scale = (h * 3.1) / modelRef.current.height;
                    modelRef.current.scale.set(scale);
                    modelRef.current.x = w / 2;
                    modelRef.current.y = h / 2 + (h * 0.95);
                }
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            isMounted = false;
            window.removeEventListener('resize', handleResize);
            if (modelRef.current) {
                try { modelRef.current.destroy(); } catch (e) {}
                modelRef.current = null;
            }
            if (appRef.current) {
                try { appRef.current.destroy(true); } catch (e) {}
                appRef.current = null;
            }
        };
    }, [modelPath]);

    // Dynamically trigger Live2D Expressions & Arm Poses when emotion changes
    useEffect(() => {
        if (!modelRef.current || !modelRef.current.internalModel) return;
        const model = modelRef.current;
        const coreModel = model.internalModel.coreModel;

        const expMap = {
            "neutral": -1,
            "shy": 0, "1.exp3.json": 0, "1": 0,
            "peace": 1, "happy": 1, "2.exp3.json": 1, "2": 1,
            "camera": 2, "photo": 2, "3.exp3.json": 2, "3": 2,
            "blush": 3, "sweet": 3, "sweet_love": 3, "flirty": 3, "4.exp3.json": 3, "4": 3,
            "dark": 4, "dead": 4, "yandere": 4, "scary_smile": 4, "scary_smile2": 4, "psycho": 4, "hollow": 4, "5.exp3.json": 4, "5": 4,
            "crying": 5, "sad": 5, "6.exp3.json": 5, "6": 5,
            "sweat": 6, "tsundere": 6, "embarrassed": 6, "joke": 6, "7.exp3.json": 6, "7": 6,
            "star": 7, "excited": 7, "8.exp3.json": 7, "8": 7
        };

        const key = emotion?.toLowerCase() || "neutral";
        const targetIdx = expMap[key] !== undefined ? expMap[key] : -1;

        // Set Expression File
        try {
            if (targetIdx >= 0) {
                if (model.expressionManager) {
                    model.expressionManager.setExpression(targetIdx);
                } else if (model.internalModel?.motionManager?.expressionManager) {
                    model.internalModel.motionManager.expressionManager.setExpression(targetIdx);
                }
            } else {
                // Clear active expression for neutral
                if (model.expressionManager) model.expressionManager.resetExpression();
            }
        } catch (e) {}

        // Set Poses & Parameters directly on Core Model
        if (coreModel) {
            try {
                // Reset pose parameters
                ['Param26', 'Param27', 'Param28', 'Param30', 'Param31', 'Param32', 'Param33', 'Param37'].forEach(param => {
                    try { coreModel.setParameterValueById(param, 0); } catch (e) {}
                });

                if (key === "shy") coreModel.setParameterValueById('Param26', 1); // 捂脸 Shy Cover
                else if (key === "peace" || key === "happy") coreModel.setParameterValueById('Param27', 1); // 比耶 Peace Sign
                else if (key === "camera" || key === "photo") coreModel.setParameterValueById('Param28', 1); // 照相 Camera Pose
                else if (key === "blush" || key === "sweet" || key === "sweet_love" || key === "flirty") coreModel.setParameterValueById('Param30', 1); // 脸红 Blush
                else if (key === "dark" || key === "dead" || key === "yandere" || key === "scary_smile" || key === "scary_smile2" || key === "psycho" || key === "hollow") coreModel.setParameterValueById('Param31', 1); // 黑脸 Dark Stare
                else if (key === "crying" || key === "sad") coreModel.setParameterValueById('Param32', 1); // 哭 Crying
                else if (key === "sweat" || key === "tsundere" || key === "embarrassed" || key === "joke") coreModel.setParameterValueById('Param33', 1); // 流汗 Sweat
                else if (key === "star" || key === "excited") coreModel.setParameterValueById('Param37', 1); // 星星 Star Eyes
            } catch (e) {}
        }
    }, [emotion]);

    return (
        <canvas 
            ref={canvasRef} 
            style={{ 
                width: '100%', 
                height: '100%', 
                display: 'block', 
                pointerEvents: 'auto' 
            }} 
        />
    );
}
