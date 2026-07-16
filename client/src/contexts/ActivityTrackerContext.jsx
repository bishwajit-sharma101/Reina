import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const ActivityTrackerContext = createContext();

export const useActivityTracker = () => useContext(ActivityTrackerContext);

export const ActivityTrackerProvider = ({ children }) => {
    const [settings, setSettings] = useState({ enabled: false, persona: 'detective', cycleMinutes: 1 });
    const [metrics, setMetrics] = useState({ activeTime: 0, idleTime: 0, scrollDistance: 0 });
    const eventQueue = useRef([]);
    const timerRef = useRef(null);
    const lastActive = useRef(Date.now());

    // Fetch initial settings
    useEffect(() => {
        const fetchSettings = async () => {
            const token = Cookies.get('token');
            if (!token) return;
            try {
                const res = await axios.get('http://localhost:5000/api/v1/diary/settings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success && res.data.settings) {
                    setSettings(res.data.settings);
                }
            } catch (err) {
                console.error("Diary settings load fail", err);
            }
        };
        fetchSettings();
    }, []);

    // Automated Surveillance Listeners
    useEffect(() => {
        if (!settings.enabled) return;

        const handleInteraction = () => {
            const now = Date.now();
            const elapsed = now - lastActive.current;
            
            if (elapsed > 5000) {
                setMetrics(m => ({ ...m, idleTime: m.idleTime + elapsed }));
            } else {
                setMetrics(m => ({ ...m, activeTime: m.activeTime + elapsed }));
            }
            lastActive.current = now;
        };

        const handleScroll = () => {
            setMetrics(m => ({ ...m, scrollDistance: m.scrollDistance + Math.abs(window.scrollY) }));
            handleInteraction();
        };

        window.addEventListener('mousemove', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [settings.enabled]);

    const trackEvent = (eventStr) => {
        if (!settings.enabled) return;
        eventQueue.current.push(eventStr);
    };

    // Cycle Loop
    useEffect(() => {
        if (!settings.enabled) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        const flushEvents = async () => {
            const now = Date.now();
            const currentActive = metrics.activeTime + (now - lastActive.current);
            
            // Structured Data Batching
            const metaBatch = [
                ...eventQueue.current,
                `[DATA] metric:active_seconds | value:${Math.round(currentActive/1000)}`,
                `[DATA] metric:idle_seconds | value:${Math.round(metrics.idleTime/1000)}`,
                `[DATA] metric:scroll_intensity | value:${Math.round(metrics.scrollDistance / 100)}`,
                `[ACTION] heartbeat | session_sync:true`
            ];

            if (metaBatch.length === 0) return;
            
            const eventsToSend = [...metaBatch];
            eventQueue.current = [];
            setMetrics({ activeTime: 0, idleTime: 0, scrollDistance: 0 }); // Reset for next cycle

            try {
                const token = Cookies.get('token');
                await axios.post('http://localhost:5000/api/v1/diary/update', 
                    { rawEvents: eventsToSend },
                    { headers: { Authorization: `Bearer ${token}` }}
                );
            } catch (err) {
                console.error("Diary flush fail", err);
                eventQueue.current = [...eventsToSend, ...eventQueue.current];
            }
        };

        const cycleMs = settings.cycleMinutes * 60 * 1000;
        timerRef.current = setInterval(flushEvents, cycleMs);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [settings.enabled, settings.cycleMinutes]);

    return (
        <ActivityTrackerContext.Provider value={{ trackEvent, settings, setSettings }}>
            {children}
        </ActivityTrackerContext.Provider>
    );
};
