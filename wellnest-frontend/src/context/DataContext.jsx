import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { fetchCurrentUser } from '../api/userApi';
import { getWorkouts, getMeals, getWater, getSleep } from '../api/trackerApi';
import { getMyDietPlan } from '../api/trainerApi';
import apiClient from '../api/apiClient';
import storageService from '../api/storageService';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [lastLoggedAction, setLastLoggedAction] = useState(null);
    const [workouts, setWorkouts] = useState([]);
    const [meals, setMeals] = useState([]);
    const [water, setWater] = useState([]);
    const [sleep, setSleep] = useState([]);
    const [activities, setActivities] = useState([]);
    const [mentalStates, setMentalStates] = useState([]);
    const [goalData, setGoalData] = useState(null);
    const [dietPlan, setDietPlan] = useState(null);
    
    const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
    const [isTrackersLoaded, setIsTrackersLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [energyForecast, setEnergyForecast] = useState(null);
    const [isMentalSyncing, setIsMentalSyncing] = useState(false);
    const [latestMentalState, setLatestMentalState] = useState(null);
    
    // Sync Guard Ref
    const syncInProgress = useRef(false);
 
    // --- INDUSTRY-READY OFFLINE CACHING ---
    useEffect(() => {
        const loadFromCache = async () => {
            const manifestStr = await storageService.getItem('dashboard_manifest');
            if (manifestStr) {
                try {
                    const manifest = JSON.parse(manifestStr);
                    setUserData(manifest.user || null);
                    setWorkouts(manifest.workouts || []);
                    setMeals(manifest.meals || []);
                    setWater(manifest.water || []);
                    setSleep(manifest.sleep || []);
                    setActivities(manifest.activities || []);
                    setMentalStates(manifest.mentalStates || []);
                    setGoalData(manifest.goalData || null);
                    setDietPlan(manifest.dietPlan || null);
                    setEnergyForecast(manifest.energyForecast || null);
                    setLatestMentalState(manifest.latestMentalState || null);
                    
                    // Show cached data instantly
                    setIsUserDataLoaded(!!manifest.user);
                    setIsTrackersLoaded(true);
                    console.log("DataContext: Instant Load from offline manifest complete. 📱🚀");
                } catch (e) {
                    console.error("DataContext: Failed to parse cache.", e);
                }
            }
        };
        loadFromCache();
    }, []);

    const saveToCache = useCallback(async (data) => {
        const currentManifestStr = await storageService.getItem('dashboard_manifest');
        let currentManifest = {};
        try {
            currentManifest = currentManifestStr ? JSON.parse(currentManifestStr) : {};
        } catch (e) {}

        const updatedManifest = { ...currentManifest, ...data };
        await storageService.setItem('dashboard_manifest', JSON.stringify(updatedManifest));
    }, []);

    useEffect(() => {
        if (userData?.activeTheme) {
            document.documentElement.setAttribute("data-user-theme", userData.activeTheme);
        } else {
            document.documentElement.removeAttribute("data-user-theme");
        }
    }, [userData?.activeTheme]);

    const refreshUserData = useCallback(async () => {
        try {
            const res = await fetchCurrentUser();
            setUserData(res.data);
            setIsUserDataLoaded(true);
            saveToCache({ user: res.data });
            return res.data;
        } catch (error) {
            console.error("DataContext: Failed to fetch user", error);
            throw error;
        }
    }, [saveToCache]);

    const refreshEnergyForecast = useCallback(async () => {
        try {
            const res = await apiClient.get('/analytics/energy-forecast');
            setEnergyForecast(res.data);
            saveToCache({ energyForecast: res.data });
        } catch (error) {
            console.error("DataContext: Energy Forecast fetch failed", error);
        }
    }, [saveToCache]);

    const refreshMentalState = useCallback(async () => {
        try {
            const res = await apiClient.get('/mental/latest');
            if (res.data) {
                setLatestMentalState(res.data);
                saveToCache({ latestMentalState: res.data });
            }
        } catch (error) {
            console.error("DataContext: Mental State fetch failed", error);
        }
    }, [saveToCache]);

    const submitVoiceScan = useCallback(async (audioBlob) => {
        try {
            setIsMentalSyncing(true);
            
            // Industrial-Grade Binary Upload
            const formData = new FormData();
            formData.append('audio', audioBlob, 'scan.webm');

            const res = await apiClient.post('/mental/voice-scan', formData);

            if (res.data) {
                // Instantly update the forecast and latest state result
                await Promise.all([
                    refreshEnergyForecast(),
                    refreshMentalState()
                ]);
                return res.data;
            }
        } catch (error) {
            console.error("DataContext: Voice Scan failed", error);
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        } finally {
            setIsMentalSyncing(false);
        }
    }, [refreshEnergyForecast, refreshMentalState]);

    const refreshTrackers = useCallback(async () => {
        if (syncInProgress.current) {
            console.log("DataContext: Sync already in progress, skipping redundant pulse... 🛡️");
            return;
        }

        try {
            syncInProgress.current = true;
            setIsSyncing(true);
            const [w, m, wa, s, a, g, p, ms] = await Promise.all([
                getWorkouts().catch(() => ({ data: [] })),
                getMeals().catch(() => ({ data: [] })),
                getWater().catch(() => ({ data: [] })),
                getSleep().catch(() => ({ data: [] })),
                apiClient.get('/trackers/activity').catch(() => ({ data: [] })),
                apiClient.get('/analytics/summary').catch(() => ({ data: {} })),
                getMyDietPlan().catch(() => ({ data: null })),
                apiClient.get('/mental').catch(() => ({ data: [] })),
                refreshMentalState().catch(() => null)
            ]);

            const freshData = {
                workouts: w.data || [],
                meals: m.data || [],
                water: wa.data || [],
                sleep: s.data || [],
                activities: a.data || [],
                mentalStates: ms.data || [],
                goalData: g.data?.goalProgress || null,
                dietPlan: p.data || null
            };

            setWorkouts(freshData.workouts);
            setMeals(freshData.meals);
            setWater(freshData.water);
            setSleep(freshData.sleep);
            setActivities(freshData.activities);
            setMentalStates(freshData.mentalStates);
            setGoalData(freshData.goalData);
            setDietPlan(freshData.dietPlan);
            
            saveToCache(freshData);
            setIsTrackersLoaded(true);
        } catch (error) {
            console.error("DataContext: Failed to fetch trackers", error);
        } finally {
            setIsSyncing(false);
            syncInProgress.current = false;
        }
    }, [saveToCache, refreshMentalState]);

    const submitVoiceCommand = useCallback(async (input) => {
        try {
            setIsSyncing(true);
            let res;
            
            if (typeof input === 'string') {
                res = await apiClient.post('/ai/voice-command', null, {
                    params: { text: input }
                });
            } else {
                const formData = new FormData();
                formData.append('audio', input, 'command.webm');
                res = await apiClient.post('/ai/voice-command', formData);
            }
            
            if (res.data && res.data.status === 'SUCCESS') {
                // Refresh all trackers and user profile to update daily limit counts
                await Promise.all([
                    refreshTrackers(),
                    refreshUserData()
                ]);
                
                if (res.data.createdId && res.data.createdType) {
                    setLastLoggedAction({
                        id: res.data.createdId,
                        type: res.data.createdType,
                        message: res.data.displayMessage
                    });
                }
                
                return res.data;
            } else {
                throw new Error(res.data?.displayMessage || res.data?.message || "AI Command Sync failed");
            }
        } catch (error) {
            console.error("DataContext: Voice Command failed", error);
            if (error.response?.data) {
                const serverErr = new Error(error.response.data.displayMessage || error.response.data.error || "AI Command Sync failed");
                serverErr.voiceMessage = error.response.data.voiceMessage;
                throw serverErr;
            }
            throw error;
        } finally {
            setIsSyncing(false);
        }
    }, [refreshTrackers, refreshUserData]);

    const undoVoiceCommand = useCallback(async (type, id) => {
        try {
            setIsSyncing(true);
            await apiClient.post('/trackers/undo', null, {
                params: { type, id }
            });
            await Promise.all([
                refreshTrackers(),
                refreshUserData()
            ]);
        } catch (error) {
            console.error("DataContext: Undo Voice Command failed", error);
            throw error;
        } finally {
            setIsSyncing(false);
        }
    }, [refreshTrackers, refreshUserData]);

    const undoLastAction = useCallback(async () => {
        if (!lastLoggedAction) return;
        try {
            await undoVoiceCommand(lastLoggedAction.type, lastLoggedAction.id);
            setLastLoggedAction(null);
        } catch (e) {
            console.error("Failed to undo last action", e);
        }
    }, [lastLoggedAction, undoVoiceCommand]);

    const clearAllData = useCallback(() => {
        setUserData(null);
        setWorkouts([]);
        setMeals([]);
        setWater([]);
        setSleep([]);
        setActivities([]);
        setGoalData(null);
        setDietPlan(null);
        setLatestMentalState(null);
        setLastLoggedAction(null);
        setIsUserDataLoaded(false);
        setIsTrackersLoaded(false);
    }, []);

    const value = useMemo(() => ({
        userData,
        setUserData,
        isUserDataLoaded,
        refreshUserData,
        
        workouts,
        setWorkouts,
        meals,
        setMeals,
        water,
        setWater,
        sleep,
        setSleep,
        activities,
        setActivities,
        mentalStates,
        setMentalStates,
        goalData,
        setGoalData,
        dietPlan,
        isTrackersLoaded,
        refreshTrackers,
        isSyncing,
        
        energyForecast,
        refreshEnergyForecast,
        
        submitVoiceScan,
        submitVoiceCommand,
        undoVoiceCommand,
        lastLoggedAction,
        setLastLoggedAction,
        undoLastAction,
        latestMentalState,
        isMentalSyncing,
        refreshMentalState,
        
        clearAllData
    }), [
        userData, isUserDataLoaded, refreshUserData,
        workouts, meals, water, sleep, activities, mentalStates, goalData, dietPlan, isTrackersLoaded, refreshTrackers, isSyncing,
        energyForecast, refreshEnergyForecast,
        submitVoiceScan, submitVoiceCommand, undoVoiceCommand, lastLoggedAction, undoLastAction, latestMentalState, isMentalSyncing, refreshMentalState,
        clearAllData
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
