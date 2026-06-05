import React from 'react';
import FocusAura from './FocusAura';

// Legacy compatibility wrapper: CognitiveAura delegates to FocusAura
const CognitiveAura = ({ reserve }) => {
    return <FocusAura reserve={reserve} />;
};

export default CognitiveAura;
