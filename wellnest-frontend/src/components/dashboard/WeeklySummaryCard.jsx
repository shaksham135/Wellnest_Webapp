import React from 'react';
import { FiActivity, FiDroplet, FiMoon, FiAward, FiBookOpen } from 'react-icons/fi';
import { toLocalDateString } from '../../utils/streakUtils';
import './WeeklySummaryCard.css';

const WeeklySummaryCard = ({ activeDays = [], analyticsData = {} }) => {
    // 1. Calculate Consistency % (last 7 days)
    const calculateConsistency = () => {
        if (!activeDays || activeDays.length === 0) return 0;
        const today = new Date();
        let activeInLast7 = 0;
        
        // Normalize dates to YYYY-MM-DD in local time
        const activeSet = new Set(
            activeDays.map(d => toLocalDateString(d)).filter(Boolean)
        );

        for (let i = 0; i < 7; i++) {
            const checkDate = new Date();
            checkDate.setDate(today.getDate() - i);
            const dateStr = toLocalDateString(checkDate);
            if (activeSet.has(dateStr)) {
                activeInLast7++;
            }
        }
        return Math.round((activeInLast7 / 7) * 100);
    };

    const consistencyVal = calculateConsistency();

    // 2. Hydration Avg
    const hydrationAvgMl = analyticsData.waterIntakeAnalytics?.avgDailyIntake || 0;
    const hydrationAvgL = (hydrationAvgMl / 1000).toFixed(1);

    // 3. Sleep Avg
    const sleepAvgHours = analyticsData.sleepAnalytics?.avgSleepDuration || 0;
    const sleepAvgStr = sleepAvgHours > 0 ? `${Math.floor(sleepAvgHours)}h ${Math.round((sleepAvgHours % 1) * 60)}m` : '0h';

    // 4. Step Target Completion %
    const daysMetSteps = analyticsData.dailyActivityAnalytics?.daysMetStepsGoal || 0;
    const stepCompletionPercent = Math.round((daysMetSteps / 7) * 100);

    // 5. Generate rule-based Free Coaching Insight
    const getFreeCoachingInsight = () => {
        if (consistencyVal >= 75) {
            return "Elite Consistency! You are showing incredible dedication to your goals. Maintain this momentum to build lasting habits.";
        }
        if (consistencyVal < 40) {
            return "Building habits starts small. Try committing to just one Quick Action today (like logging a single cup of water) to re-spark your streak.";
        }
        if (hydrationAvgMl > 0 && hydrationAvgMl < 1800) {
            return "Your hydration levels are slightly lower than optimal this week. Try placing a water bottle at your desk as a physical reminder.";
        }
        if (sleepAvgHours > 0 && sleepAvgHours < 6.5) {
            return "Sleep duration is below the target recovery range. Consider starting your wind-down routine 30 minutes earlier tonight.";
        }
        if (daysMetSteps > 0 && daysMetSteps < 3) {
            return "Steps target wasn't met on most days this week. A quick 10-minute walk after meals is an easy way to bump up your daily count.";
        }
        return "You are on track! Keep logging your daily metrics to gain deeper insights into your body's energy levels.";
    };

    const coachingInsight = getFreeCoachingInsight();

    return (
        <div className="weekly-summary-card card">
            <div className="summary-card-header">
                <FiAward className="summary-header-icon" />
                <div>
                    <h3>Weekly Summary</h3>
                    <p>Your holistic health snapshot over the last 7 days</p>
                </div>
            </div>

            <div className="summary-metrics-grid">
                <div className="summary-metric-box">
                    <div className="metric-icon-wrapper consistency-bg">
                        <FiActivity className="metric-icon" />
                    </div>
                    <div className="metric-details">
                        <span className="metric-label">Consistency</span>
                        <span className="metric-value">{consistencyVal}%</span>
                        <div className="metric-progress-bar">
                            <div className="progress-fill consistency-fill" style={{ width: `${consistencyVal}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="summary-metric-box">
                    <div className="metric-icon-wrapper hydration-bg">
                        <FiDroplet className="metric-icon" />
                    </div>
                    <div className="metric-details">
                        <span className="metric-label">Hydration Avg</span>
                        <span className="metric-value">{hydrationAvgL}L / day</span>
                        <div className="metric-progress-bar">
                            <div className="progress-fill hydration-fill" style={{ width: `${Math.min((hydrationAvgMl / 2500) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="summary-metric-box">
                    <div className="metric-icon-wrapper sleep-bg">
                        <FiMoon className="metric-icon" />
                    </div>
                    <div className="metric-details">
                        <span className="metric-label">Sleep Avg</span>
                        <span className="metric-value">{sleepAvgStr}</span>
                        <div className="metric-progress-bar">
                            <div className="progress-fill sleep-fill" style={{ width: `${Math.min((sleepAvgHours / 8) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="summary-metric-box">
                    <div className="metric-icon-wrapper steps-bg">
                        <FiAward className="metric-icon" />
                    </div>
                    <div className="metric-details">
                        <span className="metric-label">Step Goal Met</span>
                        <span className="metric-value">{daysMetSteps} / 7 Days</span>
                        <div className="metric-progress-bar">
                            <div className="progress-fill steps-fill" style={{ width: `${stepCompletionPercent}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="coaching-insight-box">
                <div className="insight-header">
                    <FiBookOpen className="insight-icon" />
                    <h4>Daily Habit Advisor</h4>
                </div>
                <p className="insight-text">"{coachingInsight}"</p>
            </div>
        </div>
    );
};

export default WeeklySummaryCard;
