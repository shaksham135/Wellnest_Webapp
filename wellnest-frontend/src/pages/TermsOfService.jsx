import React from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
    return (
        <div className="page-container" style={{ paddingTop: '80px', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-main)' }}>
            <div style={{ marginBottom: '40px' }}>
                <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>&larr; Back to Home</Link>
            </div>

            <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '24px' }}>Terms of Service</h1>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '40px' }}>Last updated: January 2026</p>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiCheckCircle className="text-primary" /> Acceptance of Terms
                </h2>
                <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    By accessing or using Wellnest, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiAlertCircle className="text-primary" /> Medical Disclaimer
                </h2>
                <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    Wellnest provides fitness and nutritional information for educational purposes only. It is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>User Responsibilities</h2>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '16px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    <li>You are responsible for maintaining the confidentiality of your account.</li>
                    <li>You agree to provide accurate and complete information.</li>
                    <li>You must not use the service for any illegal or unauthorized purpose.</li>
                    <li>You respect the rights and dignity of other users and trainers.</li>
                </ul>
            </section>

            <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid var(--card-border)' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Questions about the Terms of Service should be sent to us at <Link to="/support" style={{ color: 'var(--primary)' }}>support@wellnest.com</Link>.
                </p>
            </div>
        </div>
    );
};

export default TermsOfService;
