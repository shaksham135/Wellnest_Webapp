import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiUpload, FiCheckCircle, FiClock, FiX, FiShield } from 'react-icons/fi';
import { getMyTrainerProfile, submitVerification } from '../api/trainerApi';

const VerificationUpload = () => {
    const [trainerProfile, setTrainerProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [certificates, setCertificates] = useState({ certificate1: '', certificate2: '', certificate3: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await getMyTrainerProfile();
            setTrainerProfile(res.data);
        } catch (err) {
            console.error('Failed to load trainer profile', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e, key) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Max 5MB allowed.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setCertificates(prev => ({ ...prev, [key]: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        const hasAny = certificates.certificate1 || certificates.certificate2 || certificates.certificate3;
        if (!hasAny) {
            toast.error('Please upload at least one certificate.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await submitVerification(certificates);
            setTrainerProfile(res.data);
            toast.success('Verification request submitted! Admin will review soon.');
        } catch (err) {
            console.error(err);
            toast.error('Failed to submit verification request.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading verification status...</p>;

    // Display verified badge
    if (trainerProfile?.verified) {
        return (
            <div style={{
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(79, 70, 229, 0.1))',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                borderRadius: '16px', padding: '28px', textAlign: 'center'
            }}>
                <FiCheckCircle size={48} style={{ color: '#2563eb', marginBottom: '12px' }} />
                <h3 style={{ color: 'var(--text-main)', margin: '0 0 8px' }}>✓ Verified Trainer</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
                    Your credentials have been reviewed and approved. A verified badge is visible on your profile.
                </p>
            </div>
        );
    }

    // Display pending review status
    if (trainerProfile?.verificationRequested) {
        return (
            <div style={{
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(234, 179, 8, 0.05))',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '16px', padding: '28px', textAlign: 'center'
            }}>
                <FiClock size={48} style={{ color: '#eab308', marginBottom: '12px' }} />
                <h3 style={{ color: 'var(--text-main)', margin: '0 0 8px' }}>⏳ Pending Review</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
                    Your {trainerProfile.certificateCount} certificate(s) have been submitted. Our admin team will review and approve them shortly.
                </p>
            </div>
        );
    }

    // Upload form
    return (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <FiShield size={24} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Get Verified</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                Upload your fitness certifications (e.g., NASM, ACE, CPT). Admin will review and add a verified badge to your profile.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                    { key: 'certificate1', label: 'Certificate 1 (Required)' },
                    { key: 'certificate2', label: 'Certificate 2 (Optional)' },
                    { key: 'certificate3', label: 'Certificate 3 (Optional)' },
                ].map(({ key, label }) => (
                    <div key={key}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                            {label}
                        </label>
                        <div style={{
                            border: `2px dashed ${certificates[key] ? 'var(--primary)' : 'var(--card-border)'}`,
                            borderRadius: '12px', padding: '16px', textAlign: 'center',
                            cursor: 'pointer', position: 'relative',
                            background: certificates[key] ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                            transition: 'all 0.2s'
                        }}>
                            {certificates[key] ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <img src={certificates[key]} alt="preview" style={{ height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                    <button
                                        onClick={() => setCertificates(prev => ({ ...prev, [key]: '' }))}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                    >
                                        <FiX size={18} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <FiUpload size={20} style={{ color: 'var(--text-muted)', marginBottom: '6px' }} />
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Click to upload (JPG, PNG, max 5MB)</p>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, key)}
                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button
                className="primary-btn"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ width: '100%', marginTop: '24px' }}
            >
                {submitting ? 'Submitting...' : '🛡️ Submit for Verification'}
            </button>
        </div>
    );
};

export default VerificationUpload;
