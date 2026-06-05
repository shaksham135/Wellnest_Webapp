import React, { useEffect } from 'react';
import { useData } from '../../context/DataContext';

const UndoBanner = () => {
    const { lastLoggedAction, setLastLoggedAction, undoLastAction } = useData();

    useEffect(() => {
        if (!lastLoggedAction) return;

        const timer = setTimeout(() => {
            setLastLoggedAction(null);
        }, 5000);

        return () => clearTimeout(timer);
    }, [lastLoggedAction, setLastLoggedAction]);

    if (!lastLoggedAction) return null;

    return (
        <div className="undo-banner">
            <div className="undo-banner-content">
                <span className="undo-banner-message">
                    {lastLoggedAction.message || "Logged successfully"}
                </span>
                <button className="undo-btn" onClick={undoLastAction}>
                    Undo
                </button>
            </div>
            <div className="undo-progress-track">
                <div className="undo-progress-bar" />
            </div>
        </div>
    );
};

export default UndoBanner;
