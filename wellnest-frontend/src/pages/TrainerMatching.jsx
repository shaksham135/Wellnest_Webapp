import React, { useState, useEffect } from 'react';
import TrainerCard from '../components/TrainerCard';
import { getAllTrainers, matchTrainers, getClientRequests } from '../api/trainerApi';
import { FiFilter, FiRefreshCw } from 'react-icons/fi';

const TrainerMatching = () => {
    const [filters, setFilters] = useState({
        goal: 'All',
        location: 'Any'
    });
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Store connection status by trainerId: { 1: 'PENDING', 2: 'ACTIVE' }
    const [clientRequests, setClientRequests] = useState({});

    const fetchTrainers = async () => {
        setLoading(true);
        setError('');
        try {
            let response;
            if (filters.goal === 'All' && filters.location === 'Any') {
                response = await getAllTrainers();
            } else {
                response = await matchTrainers(filters.goal, filters.location);
            }
            setTrainers(response.data || []);
        } catch (err) {
            console.error('Error fetching trainers:', err);
            setError('Failed to load trainers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchClientRequests = async () => {
        try {
            const res = await getClientRequests();
            // Map array to object: { trainerId: status }
            const requestsMap = {};
            if (res.data) {
                res.data.forEach(req => {
                    requestsMap[req.trainerId] = req.status;
                });
            }
            setClientRequests(requestsMap);
        } catch (err) {
            console.error("Error fetching client requests", err);
        }
    };

    // Initial load
    useEffect(() => {
        fetchTrainers();
        fetchClientRequests();
    }, []);

    // Filter whenever filters change
    useEffect(() => {
        fetchTrainers();
    }, [filters]);

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const resetFilters = () => {
        setFilters({ goal: 'All', location: 'Any' });
    };

    return (
        <div className="blog-page">
            <div className="blog-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Trainer Matching System</h1>
                        <p style={{ color: '#64748b', maxWidth: '600px', fontSize: '15px' }}>
                            Find the perfect coach to help you crush your fitness goals. We match you based on your unique needs and location preferences.
                        </p>
                    </div>
                    <button
                        className="ghost-btn"
                        onClick={() => { fetchTrainers(); fetchClientRequests(); }}
                        disabled={loading}
                        title="Refresh trainers"
                    >
                        <FiRefreshCw className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            <div style={{
                background: '#ffffff',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '32px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#0f172a', fontWeight: 700 }}>
                    <FiFilter style={{ color: '#2563eb' }} /> Filter Preferences
                </div>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>Fitness Goal</label>
                        <select
                            name="goal"
                            value={filters.goal}
                            onChange={handleChange}
                            className="role-select"
                            style={{ background: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1' }}
                        >
                            <option value="All">All Goals</option>
                            <option value="Muscle Gain">Muscle Gain</option>
                            <option value="Weight Loss">Weight Loss</option>
                            <option value="Yoga">Yoga / Flexibility</option>
                            <option value="Rehabilitation">Rehabilitation</option>
                            <option value="CrossFit">CrossFit</option>
                        </select>
                    </div>

                    <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>Location Preference</label>
                        <select
                            name="location"
                            value={filters.location}
                            onChange={handleChange}
                            className="role-select"
                            style={{ background: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1' }}
                        >
                            <option value="Any">Any Location</option>
                            <option value="Online">Online / Remote</option>
                            <option value="New York">New York</option>
                            <option value="San Francisco">San Francisco</option>
                            <option value="Chicago">Chicago</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '24px'
                }}>
                    {error}
                    <button
                        onClick={fetchTrainers}
                        style={{ marginLeft: '12px', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && trainers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                    <p>Loading trainers...</p>
                </div>
            )}

            {!loading && trainers.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {trainers.map(trainer => (
                        <TrainerCard
                            key={trainer.id}
                            trainer={trainer}
                            connectionStatus={clientRequests[trainer.id]}
                            onConnectRefresh={fetchClientRequests}
                        />
                    ))}
                </div>
            ) : !loading && !error ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                    <h3 style={{ color: '#0f172a' }}>No trainers found</h3>
                    <p>Try adjusting your filters to see more results.</p>
                    <button
                        className="ghost-btn"
                        onClick={resetFilters}
                        style={{ marginTop: '16px' }}
                    >
                        Reset Filters
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default TrainerMatching;

