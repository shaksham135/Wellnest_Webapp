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

    // --- A. Helper Functions First ---
    const syncHealthData = useCallback(async (retryCount = 0) => {
        if (!isNative) return;
        
        try {
            const { Health } = await import('@capgo/capacitor-health');
            const { Preferences } = await import('@capacitor/preferences');
            
            const now = new Date();
            // Look back 3 days to catch up on any missed data
            const lookbackDate = new Date();
            lookbackDate.setDate(lookbackDate.getDate() - 3);
            lookbackDate.setHours(0, 0, 0, 0);
            
            const startDate = lookbackDate.toISOString();
            const endDate = now.toISOString();
            
            console.log(`ActivityContext: Multi-day sync attempt ${retryCount + 1} (since ${startDate})...`);
            
            const dailyDataMap = {}; // Key: "YYYY-MM-DD"

            const processSamples = (samples, field) => {
                if (!samples) return;
                samples.forEach(s => {
                    const dateKey = new Date(s.startDate).toISOString().split('T')[0];
                    if (!dailyDataMap[dateKey]) dailyDataMap[dateKey] = { steps: 0, activeCalories: 0, distanceKm: 0, date: dateKey };
                    
                    if (field === 'distanceKm') {
                        dailyDataMap[dateKey][field] = Number((s.value / 1000).toFixed(2)); // m to km
                    } else {
                        dailyDataMap[dateKey][field] = Math.round(s.value || 0);
                    }
                });
            };

            try {
                // 1. Fetch all metrics bucketed by day
                const [stepsRes, calsRes, distRes, sleepRes] = await Promise.all([
                    Health.queryAggregated({ dataType: 'steps', startDate, endDate, bucket: 'day', aggregation: 'sum' }),
                    Health.queryAggregated({ dataType: 'active_calories', startDate, endDate, bucket: 'day', aggregation: 'sum' }),
                    Health.queryAggregated({ dataType: 'distance', startDate, endDate, bucket: 'day', aggregation: 'sum' }),
                    Health.query({ dataType: 'sleep', startDate, endDate }) // Fetch raw sleep sessions
                ]);

                processSamples(stepsRes.samples, 'steps');
                processSamples(calsRes.samples, 'activeCalories');
                processSamples(distRes.samples, 'distanceKm');

                // Process Sleep Sessions (Total hours per day)
                if (sleepRes.samples) {
                    sleepRes.samples.forEach(s => {
                        const dateKey = new Date(s.startDate).toISOString().split('T')[0];
                        if (!dailyDataMap[dateKey]) dailyDataMap[dateKey] = { steps: 0, activeCalories: 0, distanceKm: 0, date: dateKey, sleepHours: 0 };
                        
                        const durationHrs = (new Date(s.endDate) - new Date(s.startDate)) / (1000 * 60 * 60);
                        dailyDataMap[dateKey].sleepHours = Number((dailyDataMap[dateKey].sleepHours || 0 + durationHrs).toFixed(1));
                    });
                }

                console.log("ActivityContext: Phone samples grouped by date:", dailyDataMap);

                // 2. Fetch Backend baseline for the same window
                const res = await getActivity();
                const backendActivities = res.data || [];

                // 3. Compare and Sync each day
                let syncCount = 0;
                for (const dateKey of Object.keys(dailyDataMap)) {
                    const phone = dailyDataMap[dateKey];
                    const backend = backendActivities.find(a => (a.date === dateKey) || (new Date(a.date || a.createdAt).toISOString().split('T')[0] === dateKey));
                    
                    const bSteps = backend?.steps || 0;
                    const bCals  = backend?.activeCalories || 0;
                    const bDist  = backend?.distanceKm || 0;

                    // Sync activity if significantly different
                    if (phone.steps > bSteps || phone.activeCalories > bCals || phone.distanceKm > bDist) {
                        console.log(`ActivityContext: Syncing ${dateKey} activity`);
                        await createActivity({ ...phone, isSync: true });
                        syncCount++;
                    }

                    // Sync Sleep if auto-detected and not logged yet
                    if (phone.sleepHours > 0) {
                        // Assuming createSleep exists or using trackerApi
                        // For now, we'll focus on activity. If we had createSleep, we'd call it here.
                        console.log(`ActivityContext: Detected ${phone.sleepHours}h sleep for ${dateKey}`);
                    }
                }

                if (syncCount > 0) {
                    toast.success(`Synced ${syncCount} day(s) of health data!`);
                    // Update cache/preferences if needed
                    await Preferences.set({ 
                        key: 'lastHealthSyncCompleted', 
                        value: JSON.stringify({ at: new Date().toISOString(), days: syncCount }) 
                    });
                } else {
                    console.log("ActivityContext: Cloud is already up to date for all days.");
                }

            } catch (hErr) {
                console.error("Health Query/Sync fail:", hErr);
                if (retryCount < 2) {
                    setTimeout(() => syncHealthData(retryCount + 1), 3000);
                    return;
                }
            }
        } catch (err) {
            console.error("Critical Context Sync Error:", err);
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
            const localDate = new Date().toISOString().split('T')[0];
            createActivity({ steps: liveSteps, activeCalories: calories, distanceKm: distance, date: localDate })
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
                    const localDate = new Date().toISOString().split('T')[0];
                    await syncCall({ steps: currentSteps, activeCalories: calories, distanceKm: distance, date: localDate });
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
                    const localDate = new Date().toISOString().split('T')[0];
                    await createActivity({ steps: liveSteps, activeCalories: calories, distanceKm: distance, date: localDate });
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
