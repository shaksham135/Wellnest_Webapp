import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    FiBarChart2, 
    FiActivity, 
    FiUsers, 
    FiTrendingUp
} from 'react-icons/fi';

const BottomNav = ({ isLoggedIn, userRole, onToggleMenu }) => {
    const location = useLocation();
    
    // Hide BottomNav if not logged in or on specific pages like Admin Dashboard
    const hideOnRoutes = ['/admin-dashboard', '/login', '/register', '/forgot-password', '/reset-password', '/setup-profile'];
    const shouldHide = !isLoggedIn || hideOnRoutes.some(route => location.pathname.startsWith(route)) || location.pathname === '/';

    if (shouldHide) return null;

    return (
        <nav className="bottom-nav">
            <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <FiBarChart2 />
                <span>Dashboard</span>
            </NavLink>
            
            <NavLink to="/trackers" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <FiActivity />
                <span>Trackers</span>
            </NavLink>

            <NavLink to="/analytics" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <FiTrendingUp />
                <span>Analytics</span>
            </NavLink>
            
            <NavLink to={userRole === 'ROLE_TRAINER' ? '/trainers' : '/trainers'} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <FiUsers />
                <span>{userRole === 'ROLE_TRAINER' ? 'Clients' : 'Trainers'}</span>
            </NavLink>

            <NavLink to="/community" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <FiUsers />
                <span>Feed</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
