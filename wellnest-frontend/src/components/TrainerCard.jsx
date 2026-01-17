import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { FiStar, FiMapPin, FiPhone, FiMail, FiCopy, FiCheck, FiUserPlus, FiMessageSquare, FiX, FiSend } from 'react-icons/fi';
import { requestConnection, getChatHistory, sendMessage, rateTrainer } from '../api/trainerApi';

const TrainerCard = ({ trainer, connectionStatus, onConnectRefresh, onViewDiet }) => {
    const [copiedField, setCopiedField] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState("Hi, I'd like to train with you!");
    const [loading, setLoading] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const [rating, setRating] = useState(trainer.rating || 0);
    const [userRating, setUserRating] = useState(() => {
        const saved = localStorage.getItem(`user_rating_${trainer.id}`);
        return saved ? parseInt(saved) : null;
    }); // Explicitly track user's input

    // Sync rating if parent updates
    useEffect(() => {
        setRating(trainer.rating || 0);
    }, [trainer.rating]);

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

    const handleSendRequest = async () => {
        setLoading(true);
        try {
            await requestConnection(trainer.id, message);
            setShowModal(false);
            setMessage("Hi, I'd like to train with you!");
            toast.success(`Request sent to ${trainer.name}!`);
            if (onConnectRefresh) onConnectRefresh();
        } catch (error) {
            console.error("Failed to send request", error);
            toast.error("Failed to send request. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChat = async () => {
        setChatOpen(true);
        try {
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
            const res = await getChatHistory(trainer.userId);
            setChatHistory(res.data || []);
        } catch (error) {
            console.error("Failed to send", error);
        }
    };

    const handleRate = async (newRating) => {
        // Optimistic UI update: Show user's rating immediately
        setUserRating(newRating);
        localStorage.setItem(`user_rating_${trainer.id}`, newRating);

        try {
            const res = await rateTrainer(trainer.id, newRating);
            // Update local state with the new average returned from server
            if (res.data && res.data.rating) {
                setRating(res.data.rating);
            }
            // User rating implies we rely on local visual, so no need to force update average visually immediately if visual prioritized userRating.
        } catch (err) {
            console.error("Rate failed", err);
            toast.error("Failed to rate trainer");
        }
    };

    useEffect(() => {
        if (chatOpen && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory, chatOpen]);


    const isPending = connectionStatus === 'PENDING';
    const isActive = connectionStatus === 'ACTIVE';

    // Helper to calculate star fill
    const getFill = (star) => {
        // Logic: if hovering, use hoverRating. 
        // Else if user has rated locally, use userRating.
        // Else use global average rating.
        const val = hoverRating || (userRating !== null ? userRating : Math.round(rating));
        return val >= star;
    };

    return (
        <>
            <div className="trainer-card">
                <div className="trainer-header">
                    <img
                        src={trainer.image}
                        alt={trainer.name}
                        className="trainer-avatar"
                    />
                    <div className="trainer-info">
                        <h3>{trainer.name}</h3>
                        <div className="trainer-meta" style={{ display: 'flex', alignItems: 'center' }}>
                            <div
                                style={{ display: 'flex', gap: '2px', cursor: 'pointer', marginRight: '6px' }}
                                onMouseLeave={() => setHoverRating(0)}
                            >
                                {[1, 2, 3, 4, 5].map(star => {
                                    const isFilled = getFill(star);
                                    return (
                                        <span
                                            key={star}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onClick={() => handleRate(star)}
                                            style={{ display: 'flex' }}
                                        >
                                            <FiStar
                                                fill={isFilled ? '#eab308' : 'none'}
                                                color='#eab308'
                                                size={16}
                                            />
                                        </span>
                                    );
                                })}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                                {rating ? Number(rating).toFixed(1) : 'New'}
                            </span>
                        </div>
                        <div className="trainer-meta" style={{ marginTop: '4px' }}>
                            <FiMapPin /> {trainer.location}
                        </div>
                    </div>
                </div>

                <div className="trainer-specialties">
                    {trainer.specialties.map(spec => (
                        <span key={spec} className="trainer-tag">
                            {spec}
                        </span>
                    ))}
                </div>

                <p className="trainer-bio">
                    {trainer.bio}
                </p>

                <div className="trainer-footer">
                    {/* Email Row */}
                    <div className="trainer-email-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="icon-box">
                                <FiMail />
                            </div>
                            <span style={{ wordBreak: 'break-all' }}>{trainer.email}</span>
                        </div>
                        <button
                            className="copy-btn"
                            onClick={() => handleCopy(trainer.email, 'email')}
                            title="Copy Email"
                        >
                            {copiedField === 'email' ? <FiCheck style={{ color: '#16a34a' }} /> : <FiCopy />}
                        </button>
                    </div>

                    {/* Connect / Status Button */}
                    <div>
                        {isActive ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="primary-btn"
                                    onClick={handleOpenChat}
                                    style={{ flex: 1 }}
                                >
                                    <FiMessageSquare /> Chat
                                </button>
                                {onViewDiet && (
                                    <button
                                        className="secondary-btn"
                                        onClick={onViewDiet}
                                        style={{ flex: 1 }}
                                    >
                                        Diet Plan
                                    </button>
                                )}
                            </div>
                        ) : isPending ? (
                            <button className="secondary-btn" disabled style={{ width: '100%', opacity: 0.7 }}>
                                Request Pending...
                            </button>
                        ) : connectionStatus === 'REJECTED' ? (
                            <button
                                className="secondary-btn"
                                style={{ width: '100%', background: 'var(--card-bg)', color: '#ef4444', borderColor: '#ef4444' }}
                                onClick={() => setShowModal(true)}
                            >
                                Request Rejected - Resend?
                            </button>
                        ) : (
                            <button
                                className="primary-btn"
                                onClick={() => setShowModal(true)}
                            >
                                <FiUserPlus /> Request to Connect
                            </button>
                        )}
                    </div>
                </div>

                {/* Connection Request Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ padding: '24px' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '16px' }}>Connect with {trainer.name}</h4>
                            <textarea
                                className="connect-textarea"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write a short message..."
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="secondary-btn" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button className="primary-btn" onClick={handleSendRequest} disabled={loading} style={{ flex: 1 }}>
                                    {loading ? 'Sending...' : 'Send Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Modal */}
            {chatOpen && (
                <div className="modal-overlay">
                    <div className="chat-modal-content">
                        {/* Header */}
                        <div className="modal-header">
                            <div>Chat with {trainer.name}</div>
                            <button className="modal-close-btn" onClick={() => setChatOpen(false)}>
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages-area">
                            {chatHistory.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No messages yet. Say hi!</p>}
                            {chatHistory.map((msg, idx) => {
                                const isMe = msg.receiverId === trainer.userId;
                                return (
                                    <div key={idx} className={`chat-bubble ${isMe ? 'me' : 'them'}`}>
                                        {msg.content}
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="chat-input-area">
                            <input
                                type="text"
                                className="chat-input"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                            />
                            <button
                                onClick={handleSendMessage}
                                className="chat-send-btn"
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
