import React from 'react';
import { FiCalendar } from 'react-icons/fi';
import PremiumGate from '../shared/PremiumGate';
import { toLocalDateString } from '../../utils/streakUtils';
import './ConsistencyHeatmap.css';

const ConsistencyHeatmap = ({ isPremium = false, activeDays = [] }) => {
    // Generate the last 30 days ending today
    const generateLast30Days = () => {
        const days = [];
        const today = new Date();
        
        // Normalize active days set
        const activeSet = new Set(
            activeDays.map(d => toLocalDateString(d)).filter(Boolean)
        );

        for (let i = 29; i >= 0; i--) {
            const checkDate = new Date();
            checkDate.setDate(today.getDate() - i);
            const dateStr = toLocalDateString(checkDate);
            
            const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 6 = Saturday
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            let status = 'missed';
            if (activeSet.has(dateStr)) {
                status = 'active';
            } else if (isWeekend) {
                status = 'grace';
            }

            days.push({
                dateStr,
                dateObj: checkDate,
                status,
                label: checkDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
            });
        }
        return days;
    };

    const heatmapDays = generateLast30Days();

    return (
        <PremiumGate
            isPremium={isPremium}
            featureName="30-Day Consistency Heatmap"
            featureDesc="Track your habits in a contribution grid, automatically scheduling rest weekends as Grace days."
        >
            <div className="consistency-heatmap-container card">
                <div className="heatmap-header">
                    <div className="title-section">
                        <FiCalendar className="calendar-icon" />
                        <h3>30-Day Consistency Heatmap</h3>
                    </div>
                    <span className="premium-badge">PREMIUM</span>
                </div>
                
                <p className="heatmap-desc">
                    A visual representation of your habit logging activity over the last 30 days.
                </p>

                <div className="heatmap-grid-wrapper">
                    <div className="heatmap-grid">
                        {heatmapDays.map((day, idx) => (
                            <div 
                                key={day.dateStr + idx}
                                className={`heatmap-cell ${day.status}`}
                                title={`${day.label}: ${day.status.toUpperCase()}`}
                            >
                                <span className="cell-tooltip">{day.label}: {day.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="heatmap-legend">
                    <div className="legend-item">
                        <span className="legend-box active"></span>
                        <span className="legend-label">Active</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-box grace"></span>
                        <span className="legend-label">Grace (Rest)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-box missed"></span>
                        <span className="legend-label">Missed</span>
                    </div>
                </div>
            </div>
        </PremiumGate>
    );
};

export default ConsistencyHeatmap;
