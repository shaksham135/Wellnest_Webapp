import React from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import {
    FiHome,
    FiUserPlus,
    FiUser,
    FiBarChart2,
    FiActivity,
    FiTrendingUp,
    FiBookOpen,
    FiUsers,
    FiCheck,
    FiMenu,
    FiX,
    FiChevronDown,
    FiAward,
    FiBell
} from "react-icons/fi";
import { useNotifications } from "../../context/NotificationContext";
import ThemeToggle from "../ThemeToggle"; // Adjust import path if needed

import logo from '../../assets/logo.png';

const Navbar = ({ isLoggedIn, userRole, isOpen, onToggle, onClose }) => {
    const location = useLocation();
    const { unreadCount } = useNotifications() || { unreadCount: 0 };

    // Force public view if on login or register page
    const isAuthPage = location.pathname === '/' || location.pathname === '/register' || location.pathname === '/login';
    const showAuthenticated = isLoggedIn && !isAuthPage;

    return (
        <header className="top-nav">
            <div className="nav-bar-header">
                <Link to={isLoggedIn ? (userRole === 'ROLE_ADMIN' ? "/admin-dashboard" : "/dashboard") : "/"} className="logo-link">
                    <img src={logo} alt="Wellnest" className="logo-image" />
                    <span className="logo-text">Wellnest</span>
                </Link>

                {/* Mobile Controls: Theme + Profile/Menu */}
                <div className="mobile-controls">
                    <ThemeToggle />
                    {showAuthenticated && (
                        <Link to="/notifications" className="nav-toggle notification-toggle" style={{ position: 'relative' }} aria-label="Notifications">
                            <FiBell />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '0px',
                                    right: '0px',
                                    background: 'var(--accent-red)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    border: '1.5px solid var(--card-bg)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                    )}
                    {showAuthenticated ? (
                        <button type="button" className="nav-toggle profile-toggle" onClick={onToggle} aria-label="Open Menu">
                            <FiUser />
                        </button>
                    ) : (
                        (!isAuthPage || location.pathname.startsWith('/admin-dashboard')) && (
                            <button type="button" className="nav-toggle" onClick={onToggle} aria-label="Toggle Navigation" aria-expanded={isOpen}>
                                {isOpen ? <FiX /> : <FiMenu />}
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Backdrop Overlay */}
            <div className={`nav-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}></div>

            <nav className={`nav-menu ${isOpen ? "open" : ""}`}>
                {/* Not logged in (or on Auth Page) */}
                {!showAuthenticated && (
                    <>
                        <NavLink to="/" className="nav-link" onClick={onClose}>
                            <FiHome />
                            <span>Login</span>
                        </NavLink>
                        <NavLink to="/register" className="nav-link" onClick={onClose}>
                            <FiUserPlus />
                            <span>Register</span>
                        </NavLink>
                    </>
                )}

                {/* Logged in AND not on auth page */}
                {showAuthenticated && (
                    <>
                        {userRole === 'ROLE_ADMIN' ? (
                            // ADMIN NAVIGATION
                            <>
                                <NavLink to="/admin-dashboard" className="nav-link" onClick={onClose}>
                                    <FiBarChart2 />
                                    <span>Dashboard</span>
                                </NavLink>
                                {/* ... existing admin links ... */}
                            </>
                        ) : (
                            // USER / TRAINER NAVIGATION
                             <>
                                <NavLink to="/dashboard" className="nav-link desktop-only" onClick={onClose}>
                                    <FiBarChart2 />
                                    <span>Dashboard</span>
                                </NavLink>

                                <NavLink to="/trackers" className="nav-link desktop-only" onClick={onClose}>
                                    <FiActivity />
                                    <span>Trackers</span>
                                </NavLink>

                                <NavLink to="/analytics" className="nav-link desktop-only" onClick={onClose}>
                                    <FiTrendingUp />
                                    <span>Analytics</span>
                                </NavLink>

                                {/* Community Dropdown */}
                                <div className="nav-dropdown-container">
                                    <button type="button" className="nav-link dropdown-trigger" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        <FiUsers />
                                        <span style={{ fontFamily: 'inherit' }}>Community</span>
                                        <FiChevronDown style={{ marginLeft: '4px', fontSize: '14px' }} />
                                    </button>
                                    <div className="nav-dropdown-menu">
                                        <NavLink to="/leaderboard" className="nav-link" onClick={onClose}>
                                            <FiAward />
                                            <span>Leaderboard</span>
                                        </NavLink>
                                        <NavLink to="/blog" className="nav-link" onClick={onClose}>
                                            <FiBookOpen />
                                            <span>Articles</span>
                                        </NavLink>
                                        <NavLink to="/community" className="nav-link" onClick={onClose}>
                                            <FiUsers />
                                            <span>Community Feed</span>
                                        </NavLink>
                                        <NavLink to="/trainers" className="nav-link" onClick={onClose}>
                                            <FiUsers />
                                            <span>{userRole === 'ROLE_TRAINER' ? 'My Clients' : 'Trainer Matching'}</span>
                                        </NavLink>
                                        {userRole === 'ROLE_USER' && (
                                            <NavLink to="/my-trainers" className="nav-link" onClick={onClose}>
                                                <FiCheck />
                                                <span>My Trainers</span>
                                            </NavLink>
                                        )}
                                    </div>
                                </div>

                                 <NavLink to="/profile" className="nav-link profile-toggle-link" onClick={onClose}>
                                    <FiUser />
                                    <span>My Profile</span>
                                </NavLink>
                            </>
                        )}
                    </>
                )}

                {/* Desktop Controls (Notification + Theme) */}
                <div className="desktop-toggle" style={{ gap: '12px' }}>
                    {showAuthenticated && (
                        <Link to="/notifications" className="nav-link" style={{ position: 'relative', padding: '8px', minWidth: 'auto' }} aria-label="Notifications">
                            <FiBell style={{ fontSize: '20px' }} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    right: '-2px',
                                    background: 'var(--accent-red)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    border: '1.5px solid var(--card-bg)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                    )}
                    <ThemeToggle />
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
