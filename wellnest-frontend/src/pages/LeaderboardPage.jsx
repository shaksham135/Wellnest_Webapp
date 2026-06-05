import React, { useEffect, useState } from "react";
import { getWeeklyLeaderboard } from "../api/leaderboardApi";
import { FiAward } from "react-icons/fi";
import cacheService from "../api/cacheService";
import "./LeaderboardPage.css";

const LeaderboardPage = () => {
    const cacheKey = '/leaderboard/weekly';
    const cachedData = cacheService.get(cacheKey) || {};
    
    const [topUsers, setTopUsers] = useState(cachedData.topUsers || []);
    const [currentUser, setCurrentUser] = useState(cachedData.currentUserEntry || null);
    const [loading, setLoading] = useState(!cachedData.topUsers);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await getWeeklyLeaderboard();
                setTopUsers(response.data.topUsers || []);
                setCurrentUser(response.data.currentUserEntry);
                cacheService.set(cacheKey, response.data);
            } catch (err) {
                console.error(err);
                setError("Failed to load leaderboard");
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const getInitials = (name) => {
        if (!name) return "?";
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading) {
        return <div className="dashboard-page"><div className="dashboard-card">Loading leaderboard...</div></div>;
    }

    if (error) {
        return <div className="dashboard-page"><div className="dashboard-card">{error}</div></div>;
    }

    // Split users for podium vs list
    const hasThreeOrMore = topUsers.length >= 3;
    const podiumUsers = hasThreeOrMore ? topUsers.slice(0, 3) : [];
    const listUsers = hasThreeOrMore ? topUsers.slice(3) : topUsers;

    const firstPlaceUser = podiumUsers[0];
    const secondPlaceUser = podiumUsers[1];
    const thirdPlaceUser = podiumUsers[2];

    const renderListRow = (entry, isCurrentUser) => (
        <div key={entry.rank} className={`leaderboard-list-row ${isCurrentUser ? 'is-current-user' : ''}`}>
            <div className="row-rank-num">
                {entry.rank}
            </div>
            <div className="row-user-details">
                <div className="row-user-left">
                    <div className="row-username-line">
                        <span className="row-name">
                            {isCurrentUser ? 'You' : entry.userName}
                        </span>
                        {entry.hasPremiumBadge && (
                            <span style={{ color: '#fbbf24', textShadow: '0 0 6px rgba(251, 191, 36, 0.5)' }} title="Elite Member">👑</span>
                        )}
                        <span className="leaderboard-badge level-badge">Lvl {entry.level || 1}</span>
                        <span className={`leaderboard-badge league-badge league-${(entry.league || 'Bronze').toLowerCase()}`}>
                            {entry.league || 'Bronze'}
                        </span>
                    </div>
                    <div className="row-status-text">
                        {entry.rank === 1 ? '🥇 Current Champion' : (isCurrentUser ? 'Keep Climbing!' : 'Weekly Wellbeing')}
                    </div>
                </div>
                <div className="row-user-right">
                    <div className="row-score-wrapper">
                        <div className="row-score-val">
                            {entry.score.toFixed(0)} <span className="row-score-label">pts</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const isUserInTopList = currentUser && topUsers.some(u => u.rank === currentUser.rank);

    return (
        <div className="leaderboard-page-container">
            {/* Header Section */}
            <div className="leaderboard-title-section">
                <div className="leaderboard-icon-wrapper">
                    <FiAward size={32} />
                </div>
                <div>
                    <h1>Weekly Leaderboard</h1>
                    <p>Top movers and shakers in the Wellnest community this week</p>
                </div>
            </div>

            {/* Podium (Top 3 Users) */}
            {hasThreeOrMore && (
                <div className="leaderboard-podium">
                    {/* 2nd Place */}
                    {secondPlaceUser && (
                        <div className="podium-card second-place">
                            <div className="podium-avatar-wrapper">
                                <div className="podium-avatar">
                                    {getInitials(secondPlaceUser.userName)}
                                </div>
                                <span className="podium-rank-badge">2nd</span>
                            </div>
                            <div className="podium-username" title={secondPlaceUser.userName}>
                                {secondPlaceUser.hasPremiumBadge && <span>👑</span>}
                                <span className="name-text">{secondPlaceUser.userName}</span>
                            </div>
                            <div className="podium-score">
                                {secondPlaceUser.score.toFixed(0)} <span>pts</span>
                            </div>
                            <div className="podium-badges">
                                <span className="leaderboard-badge level-badge">Lvl {secondPlaceUser.level || 1}</span>
                                <span className={`leaderboard-badge league-badge league-${(secondPlaceUser.league || 'Bronze').toLowerCase()}`}>
                                    {secondPlaceUser.league || 'Bronze'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 1st Place */}
                    {firstPlaceUser && (
                        <div className="podium-card first-place">
                            <span className="podium-crown">👑</span>
                            <div className="podium-avatar-wrapper">
                                <div className="podium-avatar">
                                    {getInitials(firstPlaceUser.userName)}
                                </div>
                                <span className="podium-rank-badge">1st</span>
                            </div>
                            <div className="podium-username" title={firstPlaceUser.userName}>
                                {firstPlaceUser.hasPremiumBadge && <span>👑</span>}
                                <span className="name-text">{firstPlaceUser.userName}</span>
                            </div>
                            <div className="podium-score">
                                {firstPlaceUser.score.toFixed(0)} <span>pts</span>
                            </div>
                            <div className="podium-badges">
                                <span className="leaderboard-badge level-badge">Lvl {firstPlaceUser.level || 1}</span>
                                <span className={`leaderboard-badge league-badge league-${(firstPlaceUser.league || 'Bronze').toLowerCase()}`}>
                                    {firstPlaceUser.league || 'Bronze'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 3rd Place */}
                    {thirdPlaceUser && (
                        <div className="podium-card third-place">
                            <div className="podium-avatar-wrapper">
                                <div className="podium-avatar">
                                    {getInitials(thirdPlaceUser.userName)}
                                </div>
                                <span className="podium-rank-badge">3rd</span>
                            </div>
                            <div className="podium-username" title={thirdPlaceUser.userName}>
                                {thirdPlaceUser.hasPremiumBadge && <span>👑</span>}
                                <span className="name-text">{thirdPlaceUser.userName}</span>
                            </div>
                            <div className="podium-score">
                                {thirdPlaceUser.score.toFixed(0)} <span>pts</span>
                            </div>
                            <div className="podium-badges">
                                <span className="leaderboard-badge level-badge">Lvl {thirdPlaceUser.level || 1}</span>
                                <span className={`leaderboard-badge league-badge league-${(thirdPlaceUser.league || 'Bronze').toLowerCase()}`}>
                                    {thirdPlaceUser.league || 'Bronze'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* List Section (Ranks 4-10) */}
            <div className="leaderboard-list-container">
                {topUsers.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No activity logged this week yet. Be the first to start climbing! 🚀
                    </div>
                ) : (
                    <>
                        {listUsers.map((entry) => renderListRow(entry, currentUser && entry.rank === currentUser.rank))}

                        {/* Current User Fallback Row if not in top list */}
                        {!isUserInTopList && currentUser && (
                            <>
                                <div style={{
                                    padding: '8px',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    fontSize: '18px',
                                    letterSpacing: '6px'
                                }}>
                                    •••
                                </div>
                                {renderListRow(currentUser, true)}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Rules panel at the bottom */}
            <div className="leaderboard-rules-panel">
                <div className="rules-panel-header">
                    <FiInfo size={16} /> <span>Score Calculation Rules</span>
                </div>
                <div className="rules-grid">
                    <div className="rule-metric-card">
                        <span className="rule-metric-title">🏋️ Workouts</span>
                        <span className="rule-metric-rate">1 pt per minute active</span>
                    </div>
                    <div className="rule-metric-card">
                        <span className="rule-metric-title">💧 Water Intake</span>
                        <span className="rule-metric-rate">20 pts per Liter logged</span>
                    </div>
                    <div className="rule-metric-card">
                        <span className="rule-metric-title">😴 Sleep Recovery</span>
                        <span className="rule-metric-rate">10 pts per Hour logged</span>
                    </div>
                    <div className="rule-metric-card">
                        <span className="rule-metric-title">🥗 Meal Logs</span>
                        <span className="rule-metric-rate">10 pts per logged meal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;
