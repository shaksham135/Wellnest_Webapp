import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend, FiCpu } from 'react-icons/fi';
import apiClient from '../../api/apiClient';
import { Link } from 'react-router-dom';
import './ChatbotWidget.css';

const ChatbotWidget = ({ isLoggedIn }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I'm Wellnest AI. How can I help you regarding your health today?", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    // Draggable State
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef(null);
    const offset = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 });
    const hasMovedSignificantly = useRef(false);

    // Sync with App's Auth State
    const [token, setToken] = useState(isLoggedIn ? localStorage.getItem('token') : null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Update token whenever isLoggedIn prop changes
    useEffect(() => {
        if (isLoggedIn) {
            setToken(localStorage.getItem('token'));
        } else {
            setToken(null);
            // Reset Chat on Logout
            setMessages([
                { text: "Hi! I'm Wellnest AI. How can I help you regarding your health today?", sender: 'bot' }
            ]);
        }
    }, [isLoggedIn]);

    // Helper to parse **bold** text
    const parseBold = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g); // Split by bold markers, keeping them
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Helper to format message with bullets and newlines
    const formatMessage = (text) => {
        if (!text) return null;

        // Pre-process: Force newlines before bullets if they are inline
        // Looks for: (space) * (space) OR (space) - (space)
        let formattedText = text.replace(/([^\n])\s(\*|-)\s/g, '$1\n$2 ');

        const lines = formattedText.split('\n');
        return lines.map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginLeft: '10px', marginBottom: '4px' }}>
                        <span style={{ marginRight: '6px' }}>•</span>
                        <span>{parseBold(trimmed.substring(2))}</span>
                    </div>
                );
            }
            // Preserve empty lines
            if (trimmed === '') return <br key={i} />;

            return <p key={i} style={{ margin: '0 0 6px 0', lineHeight: '1.4' }}>{parseBold(line)}</p>;
        });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
        setInput('');
        setLoading(true);

        const restrictedKeywords = ['diet plan', 'weight loss plan', 'my stats', 'analysis', 'diagnosis', 'routine'];
        const isRestricted = restrictedKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));

        if (!token && isRestricted) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: "I'd love to help with a personalized plan, but I need your health data first. Please login to unlock my full capabilities!",
                    sender: 'bot',
                    isLoginPrompt: true
                }]);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const response = await apiClient.post('/chat/ask', { query: userMessage });
            setMessages(prev => [...prev, { text: response.data.response, sender: 'bot' }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { text: "I'm having trouble connecting to the server. Please try again later.", sender: 'bot' }]);
        } finally {
            setLoading(false);
        }
    };

    // Drag Logic
    const handlePointerDown = (e) => {
        if (isOpen) return; // Don't drag if open
        setIsDragging(true);
        hasMovedSignificantly.current = false;
        startPos.current = { x: e.clientX, y: e.clientY };
        
        const rect = dragRef.current.getBoundingClientRect();
        offset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        
        // Track movement distance to distinguish between click and drag
        const dist = Math.sqrt(Math.pow(e.clientX - startPos.current.x, 2) + Math.pow(e.clientY - startPos.current.y, 2));
        if (dist > 10) {
            hasMovedSignificantly.current = true;
        }

        let newX = e.clientX - offset.current.x;
        let newY = e.clientY - offset.current.y;

        // Keep within viewport boundaries
        const padding = 20;
        const rect = dragRef.current.getBoundingClientRect();
        newX = Math.max(padding, Math.min(newX, window.innerWidth - rect.width - padding));
        newY = Math.max(padding, Math.min(newY, window.innerHeight - rect.height - padding));

        setPosition({
            x: window.innerWidth - (newX + rect.width),
            y: window.innerHeight - (newY + rect.height)
        });
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    const handleToggleClick = () => {
        // Only open if it wasn't a significant drag
        if (!hasMovedSignificantly.current) {
            setIsOpen(true);
        }
    };

    return (
        <div 
            className={`chatbot-container ${isOpen ? 'open' : ''}`}
            ref={dragRef}
            style={{ 
                right: `${position.x || 30}px`, 
                bottom: `${position.y || 30}px`,
                transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
        >
            {/* Toggle Button */}
            {!isOpen && (
                <button 
                    className="chatbot-toggle" 
                    onClick={handleToggleClick}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <FiMessageCircle size={28} />
                </button>
            )}

            {/* Chat Window */}
            <div 
                className={`chatbot-window ${isOpen ? 'visible' : ''}`}
                style={{
                    // Dynamic vertical alignment: If icon is in Top Half, open Down. Else open Up.
                    bottom: (position.y || 30) > window.innerHeight / 2 ? 'auto' : '80px',
                    top: (position.y || 30) > window.innerHeight / 2 ? '80px' : 'auto',
                    // Dynamic horizontal alignment: If icon is in Left Half, open Right. Else open Left.
                    // Note: position.x is offset from RIGHT.
                    right: (position.x || 30) > window.innerWidth / 2 ? 'auto' : '0',
                    left: (position.x || 30) > window.innerWidth / 2 ? '0' : 'auto'
                }}
            >
                <div className="chatbot-header">
                    <div className="header-title">
                        <FiCpu className="bot-icon" />
                        <div>
                            <span>Wellnest AI</span>
                            {token && <span style={{ fontSize: '10px', display: 'block', opacity: 0.8 }}>Connected</span>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="close-btn" onClick={() => setMessages([{ text: "Hi! I'm Wellnest AI. How can I help you regarding your health today?", sender: 'bot' }])} title="Reset Chat">
                            <FiMessageCircle size={16} />
                        </button>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>
                            <FiX size={20} />
                        </button>
                    </div>
                </div>

                <div className="chatbot-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender}`}>
                            <div className="message-content">
                                {formatMessage(msg.text)}
                                {msg.isLoginPrompt && (
                                    <div className="login-actions">
                                        <Link to="/login" className="chat-btn primary" onClick={() => setIsOpen(false)}>Login</Link>
                                        <Link to="/register" className="chat-btn secondary" onClick={() => setIsOpen(false)}>Sign Up</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="message bot">
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chatbot-input" onSubmit={handleSend}>
                    <input
                        type="text"
                        placeholder="Ask about health..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" disabled={!input.trim() || loading}>
                        <FiSend />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatbotWidget;
