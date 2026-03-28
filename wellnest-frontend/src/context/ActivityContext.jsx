import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createActivity, getActivity } from '../api/trackerApi';
import toast from 'react-hot-toast';

const ActivityContext = createContext();

export const useActivity = () => useContext(ActivityContext);

export const ActivityProvider = ({ children }) => {
    const [liveSteps, setLiveSteps] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [isHealthConnected, setIsHealthConnected] = useState(false);
    const liveStepsRef = useRef(0);
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

    // Helper: Checks if a date string is today
    const isToday = (dateInput) => {
        const d = new Date(dateInput);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    };

    // --- A. Helper Functions First ---
    const syncHealthData = useCallback(async (retryCount = 0) => {
        if (!isNative) return;
        
        try {
            const { Health } = await import('@capgo/capacitor-health');
            const { Preferences } = await import('@capacitor/preferences');
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            
            const queryParams = {
                dataType: 'steps',
                startDate: new Date(startOfDay).toISOString(),
                endDate: new Date().toISOString(),
                bucket: 'day',
                aggregation: 'sum'
            };
            
            console.log(`ActivityContext: Sync attempt ${retryCount + 1}...`);
            let result;
            try {
                result = await Health.queryAggregated(queryParams);
            } catch (hErr) {
                console.error("Health Query fail:", hErr);
                if (retryCount < 3) {
                    setTimeout(() => syncHealthData(retryCount + 1), 3000);
                    return;
                }
                throw hErr;
            }
            
            if (result && result.samples && result.samples.length > 0) {
                const totalStepsFromHealth = Math.round(result.samples.reduce((sum, item) => sum + (item.value || 0), 0));
                
                // --- STATELESS / SERVER-AWARE SYNC LOGIC ---
                // 1. Fetch activities from backend for today
                let totalStepsInBackend = 0;
                try {
                    const res = await getActivity();
                    const activities = res.data || [];
                    totalStepsInBackend = activities
                        .filter(a => isToday(a.date || a.createdAt))
                        .reduce((sum, a) => sum + (a.steps || 0), 0);
                    
                    console.log(`ActivityContext: Backend steps today = ${totalStepsInBackend}`);
                } catch (backendErr) {
                    console.warn("Could not fetch backend baseline, falling back to Preferences", backendErr);
                    // Fallback to Preferences if server is down or returns error
                    const { value: lastSyncDataRaw } = await Preferences.get({ key: 'lastHealthSync' });
                    let lastSyncData = { date: '', steps: 0 };
                    try { if (lastSyncDataRaw) lastSyncData = JSON.parse(lastSyncDataRaw); } catch(e) {}
                    if (lastSyncData.date === todayStr) totalStepsInBackend = lastSyncData.steps;
                }

                // 2. Calculate the difference: ONLY sync what we don't have on the server
                const stepsToSync = Math.max(0, totalStepsFromHealth - totalStepsInBackend);

                if (stepsToSync > 0) {
                    console.log(`ActivityContext: Syncing ${stepsToSync} new steps (Health: ${totalStepsFromHealth}, Backend: ${totalStepsInBackend})`);
                    const calories = Math.round(stepsToSync * 0.04);
                    const distance = Number((stepsToSync * 0.0008).toFixed(2));
                    
                    try {
                        await createActivity({ steps: stepsToSync, activeCalories: calories, distanceKm: distance });
                        
                        // Update persistence both locally and for UI responsiveness
                        await Preferences.set({ 
                            key: 'lastHealthSync', 
                            value: JSON.stringify({ date: todayStr, steps: totalStepsFromHealth }) 
                        });
                        
                        toast.success(`Synced ${stepsToSync} new steps!`);
                    } catch (apiErr) {
                        console.error("Server Sync Error:", apiErr);
                        toast.error("Cloud sync failed (Server)");
                    }
                } else {
                    console.log("ActivityContext: No new steps to sync (Server already caught up).");
                }
            }
        } catch (err) {
            console.error("Sync Error:", err);
            if (retryCount >= 3) toast.error("Sync failed: " + err.message);
        }
    }, [isNative]);

    const connectHealth = async () => {
        if (!isNative) {
            toast.error("Health Connect is only available on the Android app");
            return;
        }

        try {
            const { Health } = await import('@capgo/capacitor-health');
            const { Preferences } = await import('@capacitor/preferences');
            
            const permissions = { 
                read: ['steps', 'calories', 'distance'], 
                write: ['steps'] 
            };

            const avail = await Health.isAvailable();
            if (!avail.available) {
                toast.error("Health Connect app not found.");
                return;
            }

            let result;
            try {
                if (Health.requestAuthorization) {
                    result = await Health.requestAuthorization(permissions);
                } else {
                    result = await Health.requestPermissions(permissions);
                }
            } catch (pErr) {
                result = await Health.requestPermissions(permissions);
            }

            const isAuthorized = result && result.readAuthorized && result.readAuthorized.includes('steps');

            if (isAuthorized) {
                setIsHealthConnected(true);
                await Preferences.set({ key: 'isHealthConnected', value: 'true' });
                toast.success("Health Connect connected!");
                
                // Initial Sync
                setTimeout(() => syncHealthData(), 2000);
            } else {
                toast.error(`Connection denied.`);
                setIsHealthConnected(false);
            }
        } catch (err) {
            console.error("Bridge Error:", err);
            toast.error(`Bridge fail: ${err.message}`);
        }
    };

    const startTracking = () => setIsTracking(true);
    const stopTracking = () => {
        setIsTracking(false);
        if (liveSteps > 0) {
            const calories = Math.round(liveSteps * 0.04);
            const distance = Number((liveSteps * 0.0008).toFixed(2));
            createActivity({ steps: liveSteps, activeCalories: calories, distanceKm: distance })
                .then(() => setLiveSteps(0))
                .catch(console.error);
        }
    };

    // --- B. Effects Second ---

    // Keep ref sync with state for background access
    useEffect(() => {
        liveStepsRef.current = liveSteps;
    }, [liveSteps]);

    // --- Background Sync on App Close/Minimize ---
    useEffect(() => {
        const handleBackgroundSync = async () => {
            const currentSteps = liveStepsRef.current;
            if (currentSteps >= 50) {
                try {
                    const { createActivity: syncCall } = await import('../api/trackerApi');
                    const calories = Math.round(currentSteps * 0.04);
                    const distance = Number((currentSteps * 0.0008).toFixed(2));
                    await syncCall({ steps: currentSteps, activeCalories: calories, distanceKm: distance });
                    setLiveSteps(0);
                    liveStepsRef.current = 0;
                } catch (err) {
                    console.error("Background sync failed:", err);
                }
            }
        };

        let appListener = null;
        if (isNative) {
            import('@capacitor/app').then(({ App }) => {
                appListener = App.addListener('appStateChange', ({ isActive }) => {
                    if (!isActive) handleBackgroundSync();
                });
            });
        }

        const handleUnload = () => { handleBackgroundSync(); };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            if (appListener) appListener.remove();
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [isNative]);

    // --- Persistence (Load state from phone storage) ---
    useEffect(() => {
        if (!isNative) return;
        const loadState = async () => {
            try {
                const { Preferences } = await import('@capacitor/preferences');
                const { value } = await Preferences.get({ key: 'isHealthConnected' });
                if (value === 'true') {
                    setIsHealthConnected(true);
                    syncHealthData();
                }
            } catch (err) {
                console.error("Persistence Load Error:", err);
            }
        };
        loadState();
    }, [isNative, syncHealthData]);

    // --- Persistent Sensor Tracking (devicemotion) ---
    useEffect(() => {
        if (!isTracking || !isNative) return;
        let lastX = 0, lastY = 0, lastZ = 0;
        let threshold = 12;
        let lastUpdate = 0;

        const handleMotion = (event) => {
            const { x, y, z } = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
            const currentTime = Date.now();
            if ((currentTime - lastUpdate) > 100) {
                const diff = Math.abs(x + y + z - lastX - lastY - lastZ);
                if (diff > threshold) setLiveSteps(prev => prev + 1);
                lastX = x; lastY = y; lastZ = z;
                lastUpdate = currentTime;
            }
        };

        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [isTracking, isNative]);

    // --- Auto-Sync Logic (Every 3 minutes) ---
    useEffect(() => {
        if (!isTracking) return;
        const syncInterval = setInterval(async () => {
            if (liveSteps > 0) {
                try {
                    const calories = Math.round(liveSteps * 0.04);
                    const distance = Number((liveSteps * 0.0008).toFixed(2));
                    await createActivity({ steps: liveSteps, activeCalories: calories, distanceKm: distance });
                    setLiveSteps(0);
                } catch (err) {
                    console.error("Auto-sync failed:", err);
                }
            }
        }, 3 * 60 * 1000);

        return () => clearInterval(syncInterval);
    }, [isTracking, liveSteps]);

    return (
        <ActivityContext.Provider value={{ 
            liveSteps, 
            isTracking, 
            isHealthConnected, 
            startTracking, 
            stopTracking, 
            connectHealth,
            syncHealthData
        }}>
            {children}
        </ActivityContext.Provider>
    );
};
