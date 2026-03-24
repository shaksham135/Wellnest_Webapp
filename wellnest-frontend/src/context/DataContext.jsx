import React, { createContext, useContext, useState, useCallback } from 'react';
import { fetchCurrentUser } from '../api/userApi';
import { getWorkouts, getMeals, getWater, getSleep } from '../api/trackerApi';
import { getMyDietPlan } from '../api/trainerApi';
import apiClient from '../api/apiClient';

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
    const [workouts, setWorkouts] = useState([]);
    const [meals, setMeals] = useState([]);
    const [water, setWater] = useState([]);
    const [sleep, setSleep] = useState([]);
    const [goalData, setGoalData] = useState(null);
    const [dietPlan, setDietPlan] = useState(null);
    
    const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
    const [isTrackersLoaded, setIsTrackersLoaded] = useState(false);

    const refreshUserData = useCallback(async () => {
        try {
            const res = await fetchCurrentUser();
            setUserData(res.data);
            setIsUserDataLoaded(true);
            return res.data;
        } catch (error) {
            console.error("DataContext: Failed to fetch user", error);
            throw error;
        }
    }, []);

    const refreshTrackers = useCallback(async () => {
        try {
            const [w, m, wa, s, g, p] = await Promise.all([
                getWorkouts().catch(() => ({ data: [] })),
                getMeals().catch(() => ({ data: [] })),
                getWater().catch(() => ({ data: [] })),
                getSleep().catch(() => ({ data: [] })),
                apiClient.get('/analytics/summary').catch(() => ({ data: {} })),
                getMyDietPlan().catch(() => ({ data: null }))
            ]);

            setWorkouts(w.data || []);
            setMeals(m.data || []);
            setWater(wa.data || []);
            setSleep(s.data || []);
            setGoalData(g.data?.goalProgress || null);
            setDietPlan(p.data || null);
            
            setIsTrackersLoaded(true);
        } catch (error) {
            console.error("DataContext: Failed to fetch trackers", error);
        }
    }, []);

    const clearAllData = useCallback(() => {
        setUserData(null);
        setWorkouts([]);
        setMeals([]);
        setWater([]);
        setSleep([]);
        setGoalData(null);
        setDietPlan(null);
        setIsUserDataLoaded(false);
        setIsTrackersLoaded(false);
    }, []);

    const value = {
        userData,
        setUserData,
        isUserDataLoaded,
        refreshUserData,
        
        workouts,
        meals,
        water,
        sleep,
        goalData,
        dietPlan,
        isTrackersLoaded,
        refreshTrackers,
        
        clearAllData
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
