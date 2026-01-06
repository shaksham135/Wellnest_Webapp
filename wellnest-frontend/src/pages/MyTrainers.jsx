import React, { useState, useEffect } from 'react';
import { getClientRequests, getAllTrainers } from '../api/trainerApi';
import TrainerCard from '../components/TrainerCard';
import { FiUsers } from 'react-icons/fi';

const MyTrainers = () => {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestsMap, setRequestsMap] = useState({});

    // We fetch connected trainers by:
    // 1. Fetching user's requests.
    // 2. Identifying ACTIVE requests.
    // 3. Fetching full trainer details for those.
    // Efficiently: fetch all trainers (or specific ones if API supported) and client requests.
    // Since we don't have 'getTrainersByIds' endpoint yet, we might rely on 'getAllTrainers' and filter. 
    // Optimization: Add 'getConnectedTrainers' endpoint that returns list of TrainerResponse. 
    // But for now, let's use what we have or filtering. 
    // Actually, I can update 'getConnectedTrainers' on backend to return TrainerResponse, but currently it returns ConnectionResponseDto.
    // The previous prompt's Plan Part 2 mentioned "Add getConnectedTrainers for User (returns List<TrainerResponse>)". I didn't enforce valid endpoint yet.
    // To match user's request quickly without extra backend cycle if possible: 
    // Let's stick to client-side filtering for now IF list is small, or use ConnectionResponse and extra fetch.

    // Better approach:
    // User sees "My Trainers".
    // We call `getClientRequests`.
    // We filter `status === 'ACTIVE'`.
    // For each active request, we have `trainerId`.
    // We fetch trainer details. We have `getTrainerById(id)`.

    const fetchData = async () => {
        setLoading(true);
        try {
            const reqRes = await getClientRequests();
            const allRequests = reqRes.data || [];

            const activeReqs = allRequests.filter(r => r.status === 'ACTIVE');
            const map = {};
            allRequests.forEach(r => map[r.trainerId] = r.status);
            setRequestsMap(map);

            // Fetch trainer details for active ones
            // Parallel fetch
            const trainerPromises = activeReqs.map(r =>
                // We need to fetch trainer by ID. The previous TrainerApi didn't have getTrainerById exported?
                // Let's check. Yes `getTrainerById` is there.
                import('../api/trainerApi').then(module => module.getTrainerById(r.trainerId))
            );

            const trainersResponses = await Promise.all(trainerPromises);
            setTrainers(trainersResponses.map(res => res.data));

        } catch (error) {
            console.error("Failed to load my trainers", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="blog-page">
            <div className="blog-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>My Trainers</h1>
                <p style={{ color: '#64748b', maxWidth: '600px', fontSize: '15px' }}>
                    Your connected fitness coaches. Chat and track your progress here.
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : trainers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                    <FiUsers size={48} style={{ marginBottom: '16px', color: '#cbd5e1' }} />
                    <h3 style={{ color: '#0f172a' }}>No connected trainers yet</h3>
                    <p>Go to Trainer Matching to find a coach!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {trainers.map(trainer => (
                        <TrainerCard
                            key={trainer.id}
                            trainer={trainer}
                            connectionStatus={requestsMap[trainer.id]}
                            onConnectRefresh={fetchData}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyTrainers;
