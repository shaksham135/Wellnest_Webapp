import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiUsers, FiClock, FiCheck, FiX, FiSend, FiActivity } from 'react-icons/fi';
import { getTrainerRequests, updateRequestStatus, getChatHistory, sendMessage, getClientDetails } from '../api/trainerApi';

const ClientDetails = () => {
    const [activeTab, setActiveTab] = useState('active');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Chat state
    const [selectedChatUser, setSelectedChatUser] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [chatMessage, setChatMessage] = useState("");

    // Client Details Modal State
    const [showClientModal, setShowClientModal] = useState(false);
    const [selectedClientDetails, setSelectedClientDetails] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await getTrainerRequests();
            setRequests(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateRequestStatus(id, status);
            fetchRequests(); // Refresh
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        }
    };

    const handleOpenChat = async (client) => {
        setSelectedChatUser(client);
        setActiveTab('chat');
        try {
            const res = await getChatHistory(client.clientId);
            setChatHistory(res.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleViewDetails = async (clientId) => {
        try {
            const res = await getClientDetails(clientId);
            setSelectedClientDetails(res.data);
            setShowClientModal(true);
        } catch (error) {
            console.error("Failed to fetch client details", error);
            alert("Could not load client details.");
        }
    };

    const handleSendMessage = async () => {
        if (!chatMessage.trim() || !selectedChatUser) return;
        try {
            await sendMessage(selectedChatUser.clientId, chatMessage);
            setChatMessage("");
            // Refresh chat
            const res = await getChatHistory(selectedChatUser.clientId);
            setChatHistory(res.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const activeClients = requests.filter(r => r.status === 'ACTIVE');
    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const pastClients = requests.filter(r => r.status === 'REJECTED' || r.status === 'COMPLETED');

    return (
        <div className="blog-page">
            <div className="blog-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Trainer Dashboard</h1>
                <p style={{ color: '#64748b', maxWidth: '600px', fontSize: '15px' }}>
                    Manage your clients, track their progress, and stay connected.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
                <button
                    onClick={() => setActiveTab('active')}
                    style={{
                        padding: '12px 16px',
                        borderBottom: activeTab === 'active' ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === 'active' ? '#2563eb' : '#64748b',
                        fontWeight: activeTab === 'active' ? 700 : 500,
                        background: 'transparent',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <FiUsers style={{ marginRight: 8 }} /> Active Clients ({activeClients.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    style={{
                        padding: '12px 16px',
                        borderBottom: activeTab === 'requests' ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === 'requests' ? '#2563eb' : '#64748b',
                        fontWeight: activeTab === 'requests' ? 700 : 500,
                        background: 'transparent',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <FiMessageSquare style={{ marginRight: 8 }} /> Requests ({pendingRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    style={{
                        padding: '12px 16px',
                        borderBottom: activeTab === 'chat' ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === 'chat' ? '#2563eb' : '#64748b',
                        fontWeight: activeTab === 'chat' ? 700 : 500,
                        background: 'transparent',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <FiMessageSquare style={{ marginRight: 8 }} /> Chat
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    style={{
                        padding: '12px 16px',
                        borderBottom: activeTab === 'past' ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === 'past' ? '#2563eb' : '#64748b',
                        fontWeight: activeTab === 'past' ? 700 : 500,
                        background: 'transparent',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <FiClock style={{ marginRight: 8 }} /> Past / Rejected
                </button>
            </div>

            {/* Content */}
            <div className="content-area">
                {activeTab === 'active' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {activeClients.length === 0 ? <p style={{ color: '#64748b' }}>No active clients yet.</p> : activeClients.map(req => (
                            <div key={req.id} style={{
                                background: '#ffffff',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>{req.clientName}</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px 0' }}>Connected since: {new Date(req.createdAt).toLocaleDateString()}</p>

                                <button className="primary-btn" style={{ width: '100%', fontSize: '14px', marginBottom: '8px' }} onClick={() => handleViewDetails(req.clientId)}>View Details / Diet</button>
                                <button className="secondary-btn" style={{ width: '100%', fontSize: '14px' }} onClick={() => handleOpenChat(req)}>Message</button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {pendingRequests.length === 0 ? <p style={{ color: '#64748b' }}>No pending requests.</p> : pendingRequests.map(req => (
                            <div key={req.id} style={{
                                background: '#ffffff',
                                padding: '20px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '16px'
                            }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>{req.clientName}</h4>
                                    <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>"{req.initialMessage}"</p>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(req.createdAt).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleStatusUpdate(req.id, 'ACTIVE')}
                                        style={{ background: '#dcfce7', color: '#166534', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        <FiCheck /> Accept
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                                        style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        <FiX /> Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div style={{ display: 'flex', height: '500px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        {/* Sidebar list of active clients */}
                        <div style={{ width: '250px', borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
                            <div style={{ padding: '16px', fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}>Chat with Clients</div>
                            {activeClients.map(req => (
                                <div
                                    key={req.id}
                                    onClick={() => handleOpenChat(req)}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        background: selectedChatUser?.id === req.id ? '#eff6ff' : 'transparent',
                                        borderBottom: '1px solid #f8fafc'
                                    }}
                                >
                                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{req.clientName}</div>
                                </div>
                            ))}
                        </div>

                        {/* Chat Area */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {selectedChatUser ? (
                                <>
                                    <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>
                                        {selectedChatUser.clientName}
                                    </div>
                                    <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {chatHistory.map((msg, idx) => {
                                            const isMe = msg.receiverId === selectedChatUser.clientId; // If I sent it, receiver is client
                                            // Wait, logic check.
                                            // msg.senderId is the ID of the sender.
                                            // If msg.senderId === myId? I don't have myId easily here unless I parse token again.
                                            // Better: compare msg.senderName !== selectedChatUser.clientName
                                            const isClient = msg.senderId === selectedChatUser.clientId;
                                            return (
                                                <div key={idx} style={{
                                                    alignSelf: isClient ? 'flex-start' : 'flex-end',
                                                    background: isClient ? '#ffffff' : '#3b82f6',
                                                    color: isClient ? '#0f172a' : '#ffffff',
                                                    padding: '8px 12px',
                                                    borderRadius: '12px',
                                                    maxWidth: '70%',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                    fontSize: '14px'
                                                }}>
                                                    {msg.content}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            value={chatMessage}
                                            onChange={(e) => setChatMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                        />
                                        <button onClick={handleSendMessage} className="primary-btn" style={{ padding: '0 20px', display: 'flex', alignItems: 'center' }}>
                                            <FiSend />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                    Select a client to start chatting
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'past' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {pastClients.length === 0 ? <p style={{ color: '#64748b' }}>No past clients.</p> : pastClients.map(req => (
                            <div key={req.id} style={{
                                background: '#f8fafc',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                opacity: 0.8
                            }}>
                                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>{req.clientName}</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px 0' }}>Status: {req.status}</p>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Created: {new Date(req.createdAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Client Details Modal */}
            {showClientModal && selectedClientDetails && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '600px', position: 'relative' }}>
                        <button onClick={() => setShowClientModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer' }}><FiX size={24} /></button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
                                {selectedClientDetails.name.charAt(0)}
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{selectedClientDetails.name}</h2>
                                <div style={{ color: '#64748b', fontSize: '14px' }}>{selectedClientDetails.email}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Age</label>
                                <div style={{ fontWeight: 700, fontSize: '20px', color: '#0f172a' }}>{selectedClientDetails.age || '-'} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>years</span></div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BMI</label>
                                <div style={{ fontWeight: 700, fontSize: '20px', color: '#0f172a' }}>
                                    {selectedClientDetails.height && selectedClientDetails.weight
                                        ? (selectedClientDetails.weight / ((selectedClientDetails.height / 100) ** 2)).toFixed(1)
                                        : '-'
                                    }
                                </div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Height</label>
                                <div style={{ fontWeight: 700, fontSize: '20px', color: '#0f172a' }}>{selectedClientDetails.height || '-'} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>cm</span></div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weight</label>
                                <div style={{ fontWeight: 700, fontSize: '20px', color: '#0f172a' }}>{selectedClientDetails.weight || '-'} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>kg</span></div>
                            </div>
                            <div style={{ gridColumn: '1 / -1', background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                <label style={{ fontSize: '12px', color: '#166534', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Fitness Goal</label>
                                <div style={{ fontSize: '16px', color: '#15803d' }}>{selectedClientDetails.fitnessGoal || 'No specific goal set'}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
                            <button className="primary-btn" style={{ flex: 1 }} onClick={() => { setShowClientModal(false); /* Maybe open diet plan modal? */ }}>
                                Create Diet Plan (Coming Soon)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDetails;
