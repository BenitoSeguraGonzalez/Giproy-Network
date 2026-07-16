import React from 'react'; import { createRoot } from 'react-dom/client'; import './index.css'; import BimSafetyRiskPanel from './components/bim/BimSafetyRiskPanel';
createRoot(document.getElementById('root')).render(<main className="mx-auto w-full max-w-[460px] p-3"><BimSafetyRiskPanel projectId={91} empresaId={7} /></main>);
