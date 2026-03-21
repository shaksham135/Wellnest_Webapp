import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';

const BottomSheet = ({ isOpen, onClose, title, children }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
            setTimeout(() => setIsAnimating(false), 300);
        }
        
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    return (
        <div className={`bottom-sheet-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div 
                className={`bottom-sheet-content ${isOpen ? 'open' : ''}`} 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="bottom-sheet-handle-container" onClick={onClose}>
                    <div className="bottom-sheet-handle"></div>
                </div>

                {/* Header */}
                <div className="bottom-sheet-header">
                    <h3>{title}</h3>
                    <button className="bottom-sheet-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                {/* Body */}
                <div className="bottom-sheet-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BottomSheet;
