import React from 'react';
import { FiActivity, FiCoffee, FiDroplet, FiMoon, FiClock } from 'react-icons/fi';

const RecentActivity = ({ workouts, meals, water, sleep }) => {
    // Combine all activities
    const allActivities = [
        ...workouts.map(w => ({ ...w, _type: 'workout', date: w.performedAt })),
        ...meals.map(m => ({ ...m, _type: 'meal', date: m.loggedAt })),
        ...water.map(w => ({ ...w, _type: 'water', date: w.loggedAt })),
        ...sleep.map(s => ({ ...s, _type: 'sleep', date: s.sleepDate })) // Sleep often just has date, careful
    ];

    // Sort Descending
    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Take top 5
    const recent = allActivities.slice(0, 5);

    const getIcon = (type) => {
        switch (type) {
            case 'workout': return <FiActivity />;
            case 'meal': return <FiCoffee />;
            case 'water': return <FiDroplet />;
            case 'sleep': return <FiMoon />;
            default: return <FiClock />;
        }
    }

    const getColor = (type) => {
        switch (type) {
            case 'workout': return '#3b82f6'; // Blue
            case 'meal': return '#f59e0b'; // Orange
            case 'water': return '#0ea5e9'; // Cyan
            case 'sleep': return '#8b5cf6'; // Purple
            default: return '#9ca3af';
        }
    }

    const getLabel = (item) => {
        switch (item._type) {
            case 'workout': return `${item.type} (${item.durationMinutes} min)`;
            case 'meal': return `${item.mealType} (${item.calories} kcal)`;
            case 'water': return `Water (${item.liters || item.amountLiters || 0} L)`;
            case 'sleep': return `Sleep (${item.hours} hrs)`;
            default: return 'Activity';
        }
    }

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffHrs = diffMs / (1000 * 60 * 60);

        if (diffHrs < 1) return 'Just now';
        if (diffHrs < 24) return `${Math.floor(diffHrs)}h ago`;
        return date.toLocaleDateString();
    }

    if (recent.length === 0) {
        return (
            <div className="dashboard-card muted" style={{ textAlign: 'center', padding: '30px' }}>
                No recent activity. Start logging!
            </div>
        )
    }

    return (
        <div className="dashboard-card" style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <FiClock style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }} />
                <h3 style={{ margin: 0 }}>Recent Activity</h3>
            </div>

            <div className="activity-feed">
                {recent.map((item, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 0',
                        borderBottom: idx < recent.length - 1 ? '1px solid var(--card-border)' : 'none'
                    }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'var(--bg-main)',
                            border: `1px solid ${getColor(item._type)}`,
                            color: getColor(item._type),
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {getIcon(item._type)}
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{getLabel(item)}</div>
                            <div className="small" style={{ color: 'var(--text-muted)' }}>
                                {item.notes ? item.notes : item._type.toUpperCase()}
                            </div>
                        </div>

                        <div className="small" style={{ color: 'var(--text-muted)' }}>
                            {formatTime(item.date)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivity;
