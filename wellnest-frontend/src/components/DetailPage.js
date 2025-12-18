import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import './DetailPage.css';

const DetailPage = ({ title, children }) => {
    const navigate = useNavigate();

    return (
        <div className="detail-page-container">
            <div className="detail-page-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    <FiArrowLeft />
                    <span>Back</span>
                </button>
                <h1>{title}</h1>
            </div>
            <div className="detail-page-content">
                {children}
            </div>
        </div>
    );
};

export default DetailPage;
