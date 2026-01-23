import React, { useEffect, useState } from "react";
import { getWeeklyLeaderboard } from "../api/leaderboardApi";
import { FiAward, FiInfo } from "react-icons/fi";
import "../index.css";

const LeaderboardPage = () => {
    const [topUsers, setTopUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await getWeeklyLeaderboard();
                // Response structure: { topUsers: [...], currentUserEntry: {...} }
                setTopUsers(response.data.topUsers || []);
                setCurrentUser(response.data.currentUserEntry);
            } catch (err) {
                console.error(err);
                setError("Failed to load leaderboard");
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) {
        return <div className="dashboard-page"><div className="dashboard-card">Loading leaderboard...</div></div>;
    }

    if (error) {
        return <div className="dashboard-page"><div className="dashboard-card">{error}</div></div>;
    }

    const renderRow = (entry, isCurrentUser) => (
        <div key={entry.rank} className="leaderboard-item"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                borderBottom: '1px solid var(--card-border)',
                background: isCurrentUser ? 'rgba(79, 70, 229, 0.1)' : (entry.rank === 1 ? 'rgba(251, 191, 36, 0.1)' : 'transparent'),
                borderRadius: isCurrentUser ? '12px' : '0',
                border: isCurrentUser ? '1px solid var(--primary)' : 'none',
                borderBottom: isCurrentUser ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                marginBottom: isCurrentUser ? '0' : '0'
            }}>
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                marginRight: '16px',
                flexShrink: 0,
                color: entry.rank <= 3 ? '#fff' : 'var(--text-muted)',
                background: entry.rank === 1 ? '#fbbf24' : entry.rank === 2 ? '#94a3b8' : entry.rank === 3 ? '#b45309' : 'rgba(255,255,255,0.05)'
            }}>
                {entry.rank}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontWeight: '600',
                    fontSize: '16px',
                    color: isCurrentUser ? 'var(--primary)' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {isCurrentUser ? 'You' : entry.userName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {entry.rank === 1 ? '🥇 Current Champion' : (isCurrentUser ? 'Keep Climbing!' : 'Weekly Wellbeing')}
                </div>
            </div>
            <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '18px' }}>
                    {entry.score.toFixed(0)} <span style={{ fontSize: '14px' }}>pts</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Score</div>
            </div>
        </div>
    );

    const isUserInTop10 = currentUser && topUsers.some(u => u.rank === currentUser.rank);

    return (
        <div className="dashboard-page">
            <div className="dashboard-card" style={{ maxWidth: '800px', paddingBottom: '0' }}>
                <div className="dashboard-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FiAward size={28} style={{ color: '#fbbf24' }} />
                        <div>
                            <h1>Weekly Leaderboard</h1>
                            <p className="dashboard-subtitle">Top movers and shakers this week</p>
                        </div>
                    </div>
                </div>

                <div className="leaderboard-list" style={{ paddingBottom: '24px' }}>
                    {topUsers.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No activity logged this week yet. Be the first!
                        </div>
                    ) : (
                        <>
                            {topUsers.map((entry) => renderRow(entry, currentUser && entry.rank === currentUser.rank))}

                            {/* If User is NOT in Top 10, show separator and user row */}
                            {!isUserInTop10 && currentUser && (
                                <>
                                    <div style={{
                                        padding: '12px',
                                        textAlign: 'center',
                                        color: 'var(--text-muted)',
                                        fontSize: '20px',
                                        letterSpacing: '4px'
                                    }}>
                                        •••
                                    </div>
                                    {renderRow(currentUser, true)}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Score Calculation Info */}
                <div style={{
                    marginTop: '0',
                    padding: '20px',
                    background: 'rgba(255,255,255,0.03)',
                    borderTop: '1px solid var(--card-border)',
                    borderBottomLeftRadius: '24px',
                    borderBottomRightRadius: '24px',
                    margin: '0 -28px' // Negative margin to stretch full width of card padding
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-muted)' }}>
                        <FiInfo /> <span style={{ fontWeight: '600', fontSize: '14px' }}>How is this calculated?</span>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '12px',
                        fontSize: '13px',
                        color: 'var(--text-muted)'
                    }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                            <span style={{ display: 'block', color: 'var(--text-main)', fontWeight: '600' }}>🏋️ Workouts</span>
                            1 pt / min
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                            <span style={{ display: 'block', color: 'var(--text-main)', fontWeight: '600' }}>💧 Water</span>
                            20 pts / Liter
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                            <span style={{ display: 'block', color: 'var(--text-main)', fontWeight: '600' }}>😴 Sleep</span>
                            10 pts / Hour
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                            <span style={{ display: 'block', color: 'var(--text-main)', fontWeight: '600' }}>🥗 Meals</span>
                            10 pts / Log
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;
