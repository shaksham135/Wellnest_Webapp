import React, { useState } from "react";
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
    FiX
} from "react-icons/fi";
import ThemeToggle from "../ThemeToggle"; // Adjust import path if needed

const Navbar = ({ isLoggedIn, userRole }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Force public view if on login or register page
    const isAuthPage = location.pathname === '/' || location.pathname === '/register' || location.pathname === '/login';
    const showAuthenticated = isLoggedIn && !isAuthPage;

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const closeMenu = () => {
        setIsOpen(false);
    };

    return (
        <header className="top-nav">
            <div className="nav-bar-header">
                <Link to={isLoggedIn ? "/dashboard" : "/"} className="logo" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                    <span className="logo-dot" />
                    Wellnest
                </Link>

                {/* Mobile Hamburger Toggle + Theme */}
                <div className="mobile-controls">
                    <ThemeToggle />
                    <button className="nav-toggle" onClick={toggleMenu} aria-label="Toggle Navigation" aria-expanded={isOpen}>
                        {isOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>
            </div>

            {/* Backdrop Overlay */}
            <div className={`nav-backdrop ${isOpen ? 'open' : ''}`} onClick={closeMenu}></div>

            <nav className={`nav-menu ${isOpen ? "open" : ""}`}>
                {/* Not logged in (or on Auth Page) */}
                {!showAuthenticated && (
                    <>
                        <NavLink to="/" className="nav-link" onClick={closeMenu}>
                            <FiHome />
                            <span>Login</span>
                        </NavLink>
                        <NavLink to="/register" className="nav-link" onClick={closeMenu}>
                            <FiUserPlus />
                            <span>Register</span>
                        </NavLink>

                    </>
                )}

                {/* Logged in AND not on auth page */}
                {showAuthenticated && (
                    <>
                        <NavLink to="/dashboard" className="nav-link" onClick={closeMenu}>
                            <FiBarChart2 />
                            <span>Dashboard</span>
                        </NavLink>

                        <NavLink to="/trackers" className="nav-link" onClick={closeMenu}>
                            <FiActivity />
                            <span>Trackers</span>
                        </NavLink>

                        <NavLink to="/analytics" className="nav-link" onClick={closeMenu}>
                            <FiTrendingUp />
                            <span>Analytics</span>
                        </NavLink>

                        <NavLink to="/profile" className="nav-link" onClick={closeMenu}>
                            <FiUser />
                            <span>Profile</span>
                        </NavLink>

                        <NavLink to="/blog" className="nav-link" onClick={closeMenu}>
                            <FiBookOpen />
                            <span>Health Blog</span>
                        </NavLink>

                        <NavLink to="/trainers" className="nav-link" onClick={closeMenu}>
                            <FiUsers />
                            <span>{userRole === 'ROLE_TRAINER' ? 'My Clients' : 'Trainer Matching'}</span>
                        </NavLink>

                        {userRole === 'ROLE_USER' && (
                            <NavLink to="/my-trainers" className="nav-link" onClick={closeMenu}>
                                <FiCheck />
                                <span>My Trainers</span>
                            </NavLink>
                        )}
                    </>
                )}

                {/* Desktop Theme Toggle (Rightmost on Desktop, Hidden on Mobile) */}
                <div className="desktop-toggle">
                    <ThemeToggle />
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
