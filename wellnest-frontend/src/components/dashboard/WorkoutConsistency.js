import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import './WorkoutConsistency.css';

const WorkoutConsistency = ({ data }) => {
    if (!data || !data.workoutCounts) return <p className="muted">No workout consistency data available.</p>;

    const { startDate, endDate, workoutCounts } = data;

    const values = Object.entries(workoutCounts).map(([date, count]) => ({
        date: new Date(date),
        count: count,
    }));

    return (
        <div>
            <h3>Workout Consistency</h3>
            <div className="heatmap-container">
                <CalendarHeatmap
                    startDate={new Date(startDate)}
                    endDate={new Date(endDate)}
                    values={values}
                    showWeekdayLabels={true}
                    classForValue={(value) => {
                        if (!value) {
                            return 'color-empty';
                        }
                        return `color-scale-${Math.min(value.count, 4)}`;
                    }}
                    tooltipDataAttrs={value => {
                        return {
                            'data-tip': `${value.date ? value.date.toISOString().slice(0, 10) : ''} has count: ${value.count}`,
                        };
                    }}
                    transformDayElement={(element, value, index) => {
                        if (value) {
                            return React.cloneElement(element, {
                                children: (
                                    <text x={element.props.x + 3} y={element.props.y + 10} style={{ fontSize: '5px', fill: 'white' }}>
                                        {value.date.getDate()}
                                    </text>
                                )
                            });
                        }
                        return element;
                    }}
                />
            </div>
            <div className="heatmap-legend">
                <span>Less</span>
                <div className="legend-item">
                    <div className="legend-color-box" style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}></div>
                </div>
                <div className="legend-item">
                    <div className="legend-color-box" style={{ backgroundColor: '#4f46e5' }}></div>
                </div>
                <div className="legend-item">
                    <div className="legend-color-box" style={{ backgroundColor: '#6366f1' }}></div>
                </div>
                <div className="legend-item">
                    <div className="legend-color-box" style={{ backgroundColor: '#818cf8' }}></div>
                </div>
                <div className="legend-item">
                    <div className="legend-color-box" style={{ backgroundColor: '#a5b4fc' }}></div>
                </div>
                <span>More</span>
            </div>
        </div>
    );
};

export default WorkoutConsistency;
