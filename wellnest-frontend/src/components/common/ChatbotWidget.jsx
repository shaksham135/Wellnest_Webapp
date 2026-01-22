import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend, FiCpu } from 'react-icons/fi';
import apiClient from '../../api/apiClient';
import { Link } from 'react-router-dom';
import './ChatbotWidget.css';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I'm Wellnest AI. How can I help you regarding your health today?", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const [token, setToken] = useState(localStorage.getItem('token'));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Check for token changes (Logout/Login)
    useEffect(() => {
        const handleStorageChange = () => {
            const currentToken = localStorage.getItem('token');
            if (currentToken !== token) {
                setToken(currentToken);
                // Reset Chat on Auth Change
                setMessages([
                    { text: "Hi! I'm Wellnest AI. How can I help you regarding your health today?", sender: 'bot' }
                ]);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        // Also verify on mount/interval to catch local changes
        const interval = setInterval(() => {
            const currentToken = localStorage.getItem('token');
            if (currentToken !== token) {
                setToken(currentToken);
                setMessages([
                    { text: "Hi! I'm Wellnest AI. How can I help you regarding your health today?", sender: 'bot' }
                ]);
            }
        }, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [token]);

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

        // Basic Keyword Check for Guests (Frontend Gatekeeper)
        const token = localStorage.getItem('token');
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

    return (
        <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
            {/* Toggle Button */}
            {!isOpen && (
                <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
                    <FiMessageCircle size={28} />
                </button>
            )}

            {/* Chat Window */}
            <div className={`chatbot-window ${isOpen ? 'visible' : ''}`}>
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
