import React from 'react';
import { FiCheck, FiActivity, FiDroplet, FiMoon, FiTarget } from 'react-icons/fi';

const AssignedPlan = ({ plan }) => {
    if (!plan) return null;

    // Check if empty
    const isEmpty = !plan.breakfast && !plan.lunch && !plan.dinner && !plan.workoutCalories;
    if (isEmpty) return null;

    return (
        <div className="dashboard-card" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <FiTarget style={{ fontSize: '1.2rem', color: 'var(--primary)' }} />
                <h3 style={{ margin: 0 }}>Trainer's Plan</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {/* Diet Section */}
                <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>
                        Diet Plan
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {plan.breakfast && (
                            <div>
                                <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Breakfast</strong>
                                <p style={{ margin: '4px 0 0', fontSize: '0.95rem' }}>{plan.breakfast}</p>
                            </div>
                        )}
                        {plan.lunch && (
                            <div>
                                <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lunch</strong>
                                <p style={{ margin: '4px 0 0', fontSize: '0.95rem' }}>{plan.lunch}</p>
                            </div>
                        )}
                        {plan.dinner && (
                            <div>
                                <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dinner</strong>
                                <p style={{ margin: '4px 0 0', fontSize: '0.95rem' }}>{plan.dinner}</p>
                            </div>
                        )}
                        {plan.snacks && (
                            <div>
                                <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Snacks</strong>
                                <p style={{ margin: '4px 0 0', fontSize: '0.95rem' }}>{plan.snacks}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Targets Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Activity Targets */}
                    {(plan.workoutCalories || plan.waterLiters || plan.sleepHours || plan.stepsTarget) && (
                        <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', flex: 1 }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>
                                Daily Targets
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {plan.workoutCalories && (
                                    <div className="target-box" style={{ padding: '10px', background: 'var(--card-bg)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                                        <FiActivity style={{ color: '#ef4444', marginBottom: 4 }} />
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Burn</div>
                                        <div style={{ fontWeight: 700 }}>{plan.workoutCalories} kcal</div>
                                    </div>
                                )}
                                {plan.waterLiters && (
                                    <div className="target-box" style={{ padding: '10px', background: 'var(--card-bg)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                                        <FiDroplet style={{ color: '#3b82f6', marginBottom: 4 }} />
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Water</div>
                                        <div style={{ fontWeight: 700 }}>{plan.waterLiters} L</div>
                                    </div>
                                )}
                                {plan.sleepHours && (
                                    <div className="target-box" style={{ padding: '10px', background: 'var(--card-bg)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                                        <FiMoon style={{ color: '#8b5cf6', marginBottom: 4 }} />
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sleep</div>
                                        <div style={{ fontWeight: 700 }}>{plan.sleepHours} hrs</div>
                                    </div>
                                )}
                                {plan.stepsTarget && (
                                    <div className="target-box" style={{ padding: '10px', background: 'var(--card-bg)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                                        <FiActivity style={{ color: '#10b981', marginBottom: 4 }} />
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Steps</div>
                                        <div style={{ fontWeight: 700 }}>{plan.stepsTarget}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {plan.additionalNotes && (
                        <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FiCheck /> Trainer Notes
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                                "{plan.additionalNotes}"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignedPlan;
