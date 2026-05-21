import React from 'react';

import BimWorkspace from '../bim/BimWorkspace';

const BimTab = ({ project, access, onNavigateTarget }) => {
    return <BimWorkspace project={project} access={access} onNavigateTarget={onNavigateTarget} />;
};

export default BimTab;
