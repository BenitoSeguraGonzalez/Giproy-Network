import React from 'react';

import BimFlowWorkspace from '../bim/BimFlowWorkspace';

const BimTab = ({ project, access, onNavigateTarget }) => {
    return <BimFlowWorkspace project={project} access={access} onNavigateTarget={onNavigateTarget} />;
};

export default BimTab;
