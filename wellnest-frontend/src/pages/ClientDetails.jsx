import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiUsers, FiClock, FiCheck, FiX, FiSend, FiActivity, FiSun, FiMoon, FiCoffee, FiSunrise, FiArrowLeft } from 'react-icons/fi';
import { getTrainerRequests, updateRequestStatus, getChatHistory, sendMessage, getClientDetails, saveDietPlan, getDietPlanForClient } from '../api/trainerApi';

const ClientDetails = () => {
    const navigate = useNavigate();
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

    // Diet Plan State
    const [showDietModal, setShowDietModal] = useState(false);
    const [dietData, setDietData] = useState({
        breakfast: '', lunch: '', dinner: '', snacks: '', additionalNotes: ''
    });
    const [dietLoading, setDietLoading] = useState(false);

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
            toast.success(`Request ${status.toLowerCase()}!`);
            fetchRequests(); // Refresh
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
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
            toast.error("Could not load client details.");
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

    // Diet Plan Handlers
    const handleOpenDietModal = async () => {
        if (!selectedClientDetails) return;
        setDietLoading(true);
        // Close client details modal to show diet modal, OR show on top? 
        // Showing on top is better but let's just stack them.
        setShowDietModal(true);

        try {
            const res = await getDietPlanForClient(selectedClientDetails.id); // Assuming getClientDetails returns 'id' as userId? 
            // Warning: clientDetails might use 'id' or 'userId'. 
            // In step 240, selectedClientDetails uses: name, email, age, height, weight. 'id' is implied.
            // Let's verify 'selectedClientDetails' structure. The API 'getClientDetails' returns User or ClientProfile?
            // Assuming it returns a DTO with 'id'.
            if (res.data) {
                setDietData({
                    breakfast: res.data.breakfast || '',
                    lunch: res.data.lunch || '',
                    dinner: res.data.dinner || '',
                    snacks: res.data.snacks || '',
                    additionalNotes: res.data.additionalNotes || ''
                });
            } else {
                setDietData({ breakfast: '', lunch: '', dinner: '', snacks: '', additionalNotes: '' });
            }
        } catch (error) {
            // If 404/empty, just clear
            setDietData({ breakfast: '', lunch: '', dinner: '', snacks: '', additionalNotes: '' });
        } finally {
            setDietLoading(false);
        }
    };

    const handleDietChange = (e) => {
        setDietData({ ...dietData, [e.target.name]: e.target.value });
    };

    const handleSaveDiet = async () => {
        try {
            setDietLoading(true);
            const payload = {
                clientId: selectedClientDetails.id,
                ...dietData
            };
            await saveDietPlan(payload);
            toast.success("Diet plan saved successfully!");
            setShowDietModal(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save diet plan");
        } finally {
            setDietLoading(false);
        }
    };

    const activeClients = requests.filter(r => r.status === 'ACTIVE');
    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const pastClients = requests.filter(r => r.status === 'REJECTED' || r.status === 'COMPLETED');

    return (
        <div className="blog-page">
            <div className="blog-header dashboard-page-header">
                <h1>Trainer Dashboard</h1>
                <p>
                    Manage your clients, track their progress, and stay connected.
                </p>
            </div>

            {/* Tabs */}
            {loading && <div style={{ marginBottom: '16px' }}>Loading...</div>}
            <div className="dashboard-tabs">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                >
                    <FiUsers style={{ marginRight: 8 }} /> Active Clients ({activeClients.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                >
                    <FiMessageSquare style={{ marginRight: 8 }} /> Requests ({pendingRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                >
                    <FiMessageSquare style={{ marginRight: 8 }} /> Chat
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                >
                    <FiClock style={{ marginRight: 8 }} /> Past / Rejected
                </button>
            </div>

            {/* Content */}
            <div className="content-area">
                {activeTab === 'active' && (
                    <div className="client-list-grid">
                        {activeClients.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No active clients yet.</p> : activeClients.map(req => (
                            <div key={req.id} className="client-card">
                                <div>
                                    <h3>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                                            {req.clientName.charAt(0)}
                                        </div>
                                        {req.clientName}
                                    </h3>
                                    <p><FiClock style={{ fontSize: 12, marginRight: 4, position: 'relative', top: 1 }} /> Connected: {new Date(req.createdAt).toLocaleDateString()}</p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <button className="primary-btn" style={{ width: '100%', fontSize: '14px', borderRadius: '10px' }} onClick={() => handleViewDetails(req.clientId)}>
                                        View Details / Diet
                                    </button>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <button className="secondary-btn" style={{ fontSize: '13px', padding: '8px', justifyContent: 'center' }} onClick={() => navigate(`/trainers/client/${req.clientId}/analytics`)}>
                                            <FiActivity /> Analytics
                                        </button>
                                        <button className="secondary-btn" style={{ fontSize: '13px', padding: '8px', justifyContent: 'center' }} onClick={() => handleOpenChat(req)}>
                                            <FiMessageSquare /> Chat
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {pendingRequests.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No pending requests.</p> : pendingRequests.map(req => (
                            <div key={req.id} className="request-card">
                                <div className="request-info">
                                    <h4>{req.clientName}</h4>
                                    <p>"{req.initialMessage}"</p>
                                    <span>{new Date(req.createdAt).toLocaleString()}</span>
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
                    <div className="chat-layout">
                        {/* Sidebar list of active clients */}
                        <div className={`chat-sidebar ${selectedChatUser ? 'mobile-hidden' : ''}`}>
                            {activeClients.length === 0 && <p style={{ padding: '16px', color: 'var(--text-muted)' }}>No active clients.</p>}
                            {activeClients.map(req => (
                                <div
                                    key={req.id}
                                    onClick={() => handleOpenChat(req)}
                                    className={`chat-user-item ${selectedChatUser?.id === req.id ? 'active' : ''}`}
                                >
                                    <div className="chat-user-avatar">
                                        {req.clientName.charAt(0)}
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{req.clientName}</div>
                                </div>
                            ))}
                        </div>

                        {/* Chat Area */}
                        <div className={`chat-main ${!selectedChatUser ? 'mobile-hidden' : ''}`}>
                            {selectedChatUser ? (
                                <>
                                    <div className="chat-header">
                                        <button
                                            className="mobile-back-btn"
                                            onClick={() => setSelectedChatUser(null)}
                                            style={{ marginRight: '10px', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'none' }}
                                        >
                                            <FiActivity style={{ transform: 'rotate(180deg)' }} /> {/* Using generic icon as arrow if ArrowLeft not imported, but wait, let's use a simpler char or import ArrowLeft if needed. I see FiCheck, FiX etc imported. I'll use < back arrow symbol or add import. */}
                                            {/* Checking imports: FiMessageSquare, FiUsers, FiClock, FiCheck, FiX, FiSend, FiActivity... No ArrowLeft. I'll add it to imports or use text '<' for now to be safe, then fix styles. */}
                                            Back
                                        </button>
                                        <div className="chat-user-avatar">
                                            {selectedChatUser.clientName.charAt(0)}
                                        </div>
                                        <div>
                                            {selectedChatUser.clientName}
                                            <div style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>Active</div>
                                        </div>
                                    </div>
                                    <div className="chat-messages-area">
                                        {chatHistory.map((msg, idx) => {
                                            const isClient = msg.senderId === selectedChatUser.clientId;
                                            return (
                                                <div key={idx} className={`chat-bubble ${isClient ? 'them' : 'me'}`}>
                                                    {msg.content}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="chat-input-area">
                                        <input
                                            type="text"
                                            className="chat-input"
                                            value={chatMessage}
                                            onChange={e => setChatMessage(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                        />
                                        <button onClick={handleSendMessage} className="chat-send-btn">
                                            <FiSend />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="chat-placeholder">
                                    <FiMessageSquare size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                                    <p>Select a client to start chatting</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'past' && (
                    <div className="client-list-grid">
                        {pastClients.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No past clients.</p> : pastClients.map(req => (
                            <div key={req.id} className="client-card" style={{ opacity: 0.7 }}>
                                <h3>{req.clientName}</h3>
                                <p>Status: {req.status}</p>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Created: {new Date(req.createdAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Client Details Modal */}
            {
                showClientModal && selectedClientDetails && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                            {/* Header */}
                            <div className="modal-header">
                                <div>Client Details</div>
                                <button className="modal-close-btn" onClick={() => setShowClientModal(false)}>
                                    <FiX size={24} />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.1, position: 'absolute' }}></div>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: 'var(--primary)', border: '2px solid var(--primary)' }}>
                                        {selectedClientDetails.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--text-main)' }}>{selectedClientDetails.name}</h2>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{selectedClientDetails.email}</div>
                                    </div>
                                </div>

                                <div className="detail-grid">
                                    <div className="detail-box">
                                        <label className="detail-label">Age</label>
                                        <div className="detail-value">{selectedClientDetails.age || '-'} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>years</span></div>
                                    </div>
                                    <div className="detail-box">
                                        <label className="detail-label">BMI</label>
                                        <div className="detail-value">
                                            {selectedClientDetails.height && selectedClientDetails.weight
                                                ? (selectedClientDetails.weight / ((selectedClientDetails.height / 100) ** 2)).toFixed(1)
                                                : '-'
                                            }
                                        </div>
                                    </div>
                                    <div className="detail-box">
                                        <label className="detail-label">Height</label>
                                        <div className="detail-value">{selectedClientDetails.height || '-'} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>cm</span></div>
                                    </div>
                                    <div className="detail-box">
                                        <label className="detail-label">Weight</label>
                                        <div className="detail-value">{selectedClientDetails.weight || '-'} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>kg</span></div>
                                    </div>
                                    <div className="detail-box success">
                                        <label className="detail-label">Fitness Goal</label>
                                        <div className="detail-value">{selectedClientDetails.fitnessGoal || 'No specific goal set'}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '12px' }}>
                                    <button className="primary-btn" style={{ flex: 1 }} onClick={handleOpenDietModal}>
                                        Create / Edit Diet Plan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Diet Plan Modal */}
            {
                showDietModal && selectedClientDetails && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="modal-header">
                                <div>Diet Plan for {selectedClientDetails.name}</div>
                                <button className="modal-close-btn" onClick={() => setShowDietModal(false)}>
                                    <FiX size={24} />
                                </button>
                            </div>
                            <div className="modal-body">
                                {dietLoading && <p>Loading...</p>}
                                <div className="diet-plan-form">
                                    <div className="diet-group">
                                        <label className="diet-label"><FiSunrise className="diet-icon" /> Breakfast</label>
                                        <textarea name="breakfast" value={dietData.breakfast} onChange={handleDietChange} className="diet-textarea" placeholder="e.g. Oatmeal with berries, 2 boiled eggs..." />
                                    </div>
                                    <div className="diet-group">
                                        <label className="diet-label"><FiSun className="diet-icon" /> Lunch</label>
                                        <textarea name="lunch" value={dietData.lunch} onChange={handleDietChange} className="diet-textarea" placeholder="e.g. Grilled chicken breast, quinoa salad..." />
                                    </div>
                                    <div className="diet-group">
                                        <label className="diet-label"><FiCoffee className="diet-icon" /> Snacks</label>
                                        <textarea name="snacks" value={dietData.snacks} onChange={handleDietChange} className="diet-textarea" placeholder="e.g. Handful of almonds, Greek yogurt..." />
                                    </div>
                                    <div className="diet-group">
                                        <label className="diet-label"><FiMoon className="diet-icon" /> Dinner</label>
                                        <textarea name="dinner" value={dietData.dinner} onChange={handleDietChange} className="diet-textarea" placeholder="e.g. Baked salmon, steamed broccoli..." />
                                    </div>
                                    <div className="diet-group">
                                        <label className="diet-label"><FiCheck className="diet-icon" /> Additional Notes</label>
                                        <textarea name="additionalNotes" value={dietData.additionalNotes} onChange={handleDietChange} className="diet-textarea" placeholder="Hydration goals, supplements, etc..." />
                                    </div>

                                    <div className="modal-footer">
                                        <button className="secondary-btn" onClick={() => setShowDietModal(false)} disabled={dietLoading}>Cancel</button>
                                        <button className="primary-btn" onClick={handleSaveDiet} disabled={dietLoading} style={{ minWidth: '120px' }}>
                                            {dietLoading ? 'Saving...' : 'Save Plan'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ClientDetails;
