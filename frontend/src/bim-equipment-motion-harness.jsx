import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import BimEquipmentMotionPanel from './components/bim/BimEquipmentMotionPanel';

createRoot(document.getElementById('root')).render(<main className="mx-auto w-full max-w-[460px] p-3"><BimEquipmentMotionPanel projectId={91} empresaId={7} /></main>);
