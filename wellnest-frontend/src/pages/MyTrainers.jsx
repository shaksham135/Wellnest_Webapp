import React, { useState, useEffect } from 'react';
import { getClientRequests, getDietPlanForTrainer } from '../api/trainerApi';
import TrainerCard from '../components/TrainerCard';
import { FiUsers, FiX } from 'react-icons/fi';

const MyTrainers = () => {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestsMap, setRequestsMap] = useState({});

    // Diet Plan View State
    const [showDietModal, setShowDietModal] = useState(false);
    const [viewDietData, setViewDietData] = useState(null);
    const [viewDietLoading, setViewDietLoading] = useState(false);

    // ... (existing fetchData)

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
            const trainerPromises = activeReqs.map(r =>
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

    const handleViewDiet = async (trainerId) => {
        setViewDietLoading(true);
        setShowDietModal(true);
        setViewDietData(null);
        try {
            const res = await getDietPlanForTrainer(trainerId);
            setViewDietData(res.data);
        } catch (error) {
            console.error("Failed to load diet plan", error);
        } finally {
            setViewDietLoading(false);
        }
    };

    return (
        <div className="blog-page">
            <div className="blog-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>My Trainers</h1>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', fontSize: '15px' }}>
                    Your connected fitness coaches. Chat and track your progress here.
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : trainers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <FiUsers size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <h3 style={{ color: 'var(--text-main)' }}>No connected trainers yet</h3>
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
                            onViewDiet={() => handleViewDiet(trainer.id)}
                        />
                    ))}
                </div>
            )}

            {/* View Diet Plan Modal */}
            {showDietModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <div>Diet Plan</div>
                            <button className="modal-close-btn" onClick={() => setShowDietModal(false)}>
                                <FiX size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {viewDietLoading ? (
                                <p>Loading diet plan...</p>
                            ) : !viewDietData ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                    <p>No diet plan assigned by this trainer yet.</p>
                                </div>
                            ) : (
                                <div className="detail-grid" style={{ gridTemplateColumns: '1fr' }}>
                                    {['breakfast', 'lunch', 'dinner', 'snacks', 'additionalNotes'].map(meal => (
                                        viewDietData[meal] && (
                                            <div key={meal} className="detail-box" style={{ alignItems: 'flex-start' }}>
                                                <label className="detail-label" style={{ textTransform: 'capitalize' }}>
                                                    {meal.replace(/([A-Z])/g, ' $1').trim()}
                                                </label>
                                                <div className="detail-value" style={{ fontSize: '16px', fontWeight: 400, marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                                    {viewDietData[meal]}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                    {Object.values(viewDietData).every(v => !v || typeof v !== 'string' || !v.trim()) && (
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Empty diet plan.</p>
                                    )}
                                </div>
                            )}
                            <button className="secondary-btn" style={{ width: '100%', marginTop: '24px' }} onClick={() => setShowDietModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTrainers;
