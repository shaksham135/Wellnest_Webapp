import React from 'react';
import { FiShield, FiLock, FiEye } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    return (
        <div className="page-container" style={{ paddingTop: '80px', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-main)' }}>
            <div style={{ marginBottom: '40px' }}>
                <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>&larr; Back to Home</Link>
            </div>

            <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '24px' }}>Privacy Policy</h1>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '40px' }}>Last updated: January 2026</p>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiShield className="text-primary" /> Information We Collect
                </h2>
                <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    At Wellnest, we collect information that you provide directly to us, such as when you create an account, update your profile, or use our tracking features. This includes:
                </p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '16px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    <li>Personal identification information (Name, email address, etc.)</li>
                    <li>Health and fitness data (Workouts, nutrition logs, body metrics)</li>
                    <li>Device information and usage data</li>
                </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiLock className="text-primary" /> How We Use Your Data
                </h2>
                <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    We use the information we collect to operate, maintain, and improve our services. Specifically, we use your data to:
                </p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '16px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    <li>Provide personalized health insights and analytics</li>
                    <li>Connect you with trainers and manage your progress</li>
                    <li>Send administrative information and technical notices</li>
                    <li>Monitor and analyze trends and usage</li>
                </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiEye className="text-primary" /> meaningful choice
                </h2>
                <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    You have control over your data. You can access, update, or delete your account information at any time through your profile settings. We do not sell your personal data to third parties.
                </p>
            </section>

            <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid var(--card-border)' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    If you have any questions about this Privacy Policy, please <Link to="/support" style={{ color: 'var(--primary)' }}>contact us</Link>.
                </p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
