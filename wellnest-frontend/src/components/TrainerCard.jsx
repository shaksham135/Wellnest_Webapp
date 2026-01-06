import React, { useState, useEffect, useRef } from 'react';
import { FiStar, FiMapPin, FiPhone, FiMail, FiCopy, FiCheck, FiUserPlus, FiMessageSquare, FiX, FiSend } from 'react-icons/fi';
import { requestConnection, getChatHistory, sendMessage } from '../api/trainerApi';

const TrainerCard = ({ trainer, connectionStatus, onConnectRefresh }) => {
    const [copiedField, setCopiedField] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState("Hi, I'd like to train with you!");
    const [loading, setLoading] = useState(false);

    // Chat State
    const [chatOpen, setChatOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef(null);

    const handleCopy = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleConnect = async () => {
        setLoading(true);
        try {
            await requestConnection(trainer.id, message);
            setShowModal(false);
            if (onConnectRefresh) onConnectRefresh();
        } catch (error) {
            console.error(error);
            alert("Failed to send request");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChat = async () => {
        setChatOpen(true);
        try {
            // trainer.userId is needed here. If not available, we might fail.
            // Assuming trainer object now has userId.
            if (!trainer.userId) {
                alert("Error: Missing trainer user ID");
                return;
            }
            const res = await getChatHistory(trainer.userId);
            setChatHistory(res.data || []);
        } catch (error) {
            console.error("Failed to load chat", error);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        try {
            await sendMessage(trainer.userId, chatInput);
            setChatInput("");
            // Refresh
            const res = await getChatHistory(trainer.userId);
            setChatHistory(res.data || []);
        } catch (error) {
            console.error("Failed to send", error);
        }
    };

    useEffect(() => {
        if (chatOpen && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory, chatOpen]);


    const isPending = connectionStatus === 'PENDING';
    const isActive = connectionStatus === 'ACTIVE';

    return (
        <>
            <div className="trainer-card" style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'all 0.2s',
                height: '100%',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img
                        src={trainer.image}
                        alt={trainer.name}
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid #e0f2fe'
                        }}
                    />
                    <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a', fontWeight: 700 }}>{trainer.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#64748b' }}>
                            <FiStar style={{ fill: '#eab308', color: '#eab308' }} /> {trainer.rating}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                            <FiMapPin /> {trainer.location}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {trainer.specialties.map(spec => (
                        <span key={spec} style={{
                            fontSize: '12px',
                            background: '#f1f5f9',
                            color: '#475569',
                            fontWeight: 500,
                            padding: '4px 10px',
                            borderRadius: '99px',
                        }}>
                            {spec}
                        </span>
                    ))}
                </div>

                <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6', flex: 1 }}>
                    {trainer.bio}
                </p>

                <div style={{
                    paddingTop: '16px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    {/* Email Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ padding: 8, background: '#eff6ff', borderRadius: 8, display: 'flex' }}>
                                <FiMail style={{ color: '#2563eb' }} />
                            </div>
                            <span>{trainer.email}</span>
                        </div>
                        <button
                            onClick={() => handleCopy(trainer.email, 'email')}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: copiedField === 'email' ? '#16a34a' : '#64748b' }}
                            title="Copy Email"
                        >
                            {copiedField === 'email' ? <FiCheck /> : <FiCopy />}
                        </button>
                    </div>

                    {/* Connect / Status Button */}
                    <div style={{ marginTop: '8px' }}>
                        {isActive ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="primary-btn"
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    onClick={handleOpenChat}
                                >
                                    <FiMessageSquare /> Chat with Trainer
                                </button>
                            </div>
                        ) : isPending ? (
                            <button className="secondary-btn" disabled style={{ width: '100%', opacity: 0.7 }}>
                                Request Pending...
                            </button>
                        ) : connectionStatus === 'REJECTED' ? (
                            <button
                                className="secondary-btn"
                                style={{ width: '100%', background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }}
                                onClick={() => setShowModal(true)}
                            >
                                Request Rejected - Resend?
                            </button>
                        ) : (
                            <button
                                className="primary-btn"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => setShowModal(true)}
                            >
                                <FiUserPlus /> Request to Connect
                            </button>
                        )}
                    </div>
                </div>

                {/* Connection Request Modal */}
                {showModal && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: '16px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        zIndex: 10
                    }}>
                        <h4 style={{ marginTop: 0 }}>Connect with {trainer.name}</h4>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write a short message..."
                            style={{
                                width: '100%',
                                height: '80px',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                marginBottom: '16px',
                                fontFamily: 'inherit'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="secondary-btn" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                            <button className="primary-btn" onClick={handleConnect} disabled={loading} style={{ flex: 1 }}>
                                {loading ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Modal (Fixed Overlay) */}
            {chatOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        width: '90%',
                        maxWidth: '500px',
                        height: '80vh',
                        background: 'white',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>Chat with {trainer.name}</div>
                            <button onClick={() => setChatOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><FiX size={20} /></button>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#ffffff' }}>
                            {chatHistory.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No messages yet. Say hi!</p>}
                            {chatHistory.map((msg, idx) => {
                                const isMe = msg.receiverId === trainer.userId; // If receiver is trainer, then I sent it
                                return (
                                    <div key={idx} style={{
                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                        maxWidth: '75%',
                                        background: isMe ? '#3b82f6' : '#f1f5f9',
                                        color: isMe ? '#ffffff' : '#0f172a',
                                        padding: '8px 12px',
                                        borderRadius: '12px',
                                        fontSize: '14px'
                                    }}>
                                        {msg.content}
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', background: '#f8fafc' }}>
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                                style={{ flex: 1, padding: '10px 16px', borderRadius: '99px', border: '1px solid #cbd5e1', outline: 'none' }}
                            />
                            <button
                                onClick={handleSendMessage}
                                className="primary-btn"
                                style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: '42px', height: '42px' }}
                            >
                                <FiSend />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TrainerCard;
