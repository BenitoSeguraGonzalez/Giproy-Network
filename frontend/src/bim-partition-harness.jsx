import React from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import BimConstructiblePartitionPanel from './components/bim/BimConstructiblePartitionPanel';

const element = { id: 701, global_id: 'GUID-PARTITION-HARNESS', nombre: 'Muro particionable' };
createRoot(document.getElementById('root')).render(<main className="mx-auto w-full max-w-[420px] p-3"><BimConstructiblePartitionPanel projectId={91} empresaId={7} element={element} /></main>);
