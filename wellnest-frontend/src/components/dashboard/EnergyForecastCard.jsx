import React from 'react';
import { FiTrendingUp, FiZap } from 'react-icons/fi';

const EnergyForecastCard = ({ forecast, currentEnergy }) => {
    if (!forecast || forecast.length === 0) return null;

    // Simple sparkline calculation
    const points = forecast.map((f, i) => `${i * 20},${60 - (f.energyValue / 2)}`).join(' ');

    return (
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#f59e0b',
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem'
                }}>
                    <FiZap />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.8px' }}>ENERGY FORECAST</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '60px', marginTop: '4px' }}>
                <svg width="120" height="60" viewBox="0 0 120 60" style={{ overflow: 'visible' }}>
                    <polyline
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                        style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' }}
                    />
                    {forecast.map((f, i) => (
                        <circle key={i} cx={i * 20} cy={60 - (f.energyValue / 2)} r="3" fill="#f59e0b" />
                    ))}
                </svg>
                <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Next 6h</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <FiTrendingUp style={{ fontSize: '1rem', color: '#10b981' }} />
                        {forecast[5]?.energyValue}%
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                <span>NOW</span>
                <span>+6 HOURS</span>
            </div>
        </div>
    );
};

export default EnergyForecastCard;
