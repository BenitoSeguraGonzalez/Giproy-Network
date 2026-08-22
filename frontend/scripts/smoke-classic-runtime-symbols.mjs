import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ganttSource = readFileSync(new URL('../src/components/projects/CronogramaGantt.jsx', import.meta.url), 'utf8');
const cronogramasSource = readFileSync(new URL('../src/components/projects/Cronogramas.jsx', import.meta.url), 'utf8');
const marketplaceSource = readFileSync(new URL('../src/pages/Marketplace.jsx', import.meta.url), 'utf8');
const edtValoradaSource = readFileSync(new URL('../src/components/presupuestos/EdtValoradaModal.jsx', import.meta.url), 'utf8');
const appRouterSource = readFileSync(new URL('../src/routes/AppRouter.jsx', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('../src/pages/Dashboard.jsx', import.meta.url), 'utf8');

for (const importStatement of [
    "import { lazy, Suspense } from 'react';",
    "import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';",
    "import ErrorBoundary from '../components/ErrorBoundary';",
]) {
    assert.equal(
        appRouterSource.includes(importStatement),
        true,
        `AppRouter debe conservar el import runtime: ${importStatement}`,
    );
}

for (const importStatement of [
    '    Calculator,',
    '    Building2,',
    '    ShieldCheck,',
    '    Wrench,',
    '    ArrowUpRight,',
    "import { Card, CardContent } from '../components/ui/card';",
]) {
    assert.equal(
        dashboardSource.includes(importStatement),
        true,
        `Dashboard debe conservar el import runtime JSX: ${importStatement}`,
    );
}

assert.equal(
    ganttSource.includes('activeSubbar?.id || periodToken'),
    false,
    'Gantt no debe usar periodToken fuera del alcance al reagrupar subbarras.',
);
assert.equal(
    ganttSource.includes('activeSubbar?.id || parentToken'),
    true,
    'Gantt debe usar la identidad de padre disponible como fallback estable.',
);

for (const token of [
    "const currency = cronograma?.moneda || 'USD';",
    'const decMoneda = cronograma?.dec_moneda ?? 2;',
    'const activeManualTemporalSummary = useMemo(',
    'const selectedDistributionModeLabel = DISTRIBUTION_OPTIONS.find(',
]) {
    assert.equal(
        cronogramasSource.includes(token),
        true,
        `Cronogramas debe declarar en el componente padre el símbolo runtime: ${token}`,
    );
}

assert.equal(
    marketplaceSource.includes('resolveLicenseOfferMeta('),
    false,
    'Marketplace no debe invocar el helper inexistente resolveLicenseOfferMeta.',
);
assert.equal(
    marketplaceSource.includes('resolveMarketplaceLicenseOfferMeta(cartLicenseProducts[0].product)'),
    true,
    'Marketplace debe resolver el aviso de checkout con el helper importado.',
);

const edtEarlyReturnIndex = edtValoradaSource.indexOf('if (!isOpen)');
for (const stateDeclaration of [
    'const [generatingReport, setGeneratingReport] = useState(null);',
    'const [reportPreview, setReportPreview] = useState(null);',
    'const [showReportPreview, setShowReportPreview] = useState(false);',
]) {
    const declarationIndex = edtValoradaSource.indexOf(stateDeclaration);
    assert.ok(declarationIndex >= 0, `EDT valorada debe conservar el estado: ${stateDeclaration}`);
    assert.ok(
        declarationIndex < edtEarlyReturnIndex,
        `EDT valorada no debe declarar hooks condicionales después del retorno por modal cerrado: ${stateDeclaration}`,
    );
}

console.log('smoke-classic-runtime-symbols: ok');
