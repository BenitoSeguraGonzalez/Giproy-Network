import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    ADAPTIVE_UI_PROFILES,
    classifyAdaptiveProfile,
    resolveAdaptiveModuleEnabled,
    resolveAdaptiveUiEnabled,
} from '../src/utils/adaptiveLayout.js';
import { resolvePortableWorkspaceProfile } from '../src/utils/portableWorkspace.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, '..');

const environment = (width, height, options = {}) => ({
    visualWidth: width,
    visualHeight: height,
    coarsePointer: false,
    touchPoints: 0,
    ...options,
});

assert.equal(classifyAdaptiveProfile(environment(1920, 1080)).profile, ADAPTIVE_UI_PROFILES.WIDE);
assert.equal(classifyAdaptiveProfile(environment(1920, 1080)).density, 'comfortable');
assert.equal(classifyAdaptiveProfile(environment(1536, 864)).profile, ADAPTIVE_UI_PROFILES.COMPACT);
assert.equal(classifyAdaptiveProfile(environment(1536, 864)).density, 'compact');
assert.equal(classifyAdaptiveProfile(environment(1707, 960)).profile, ADAPTIVE_UI_PROFILES.WIDE);
assert.equal(classifyAdaptiveProfile(environment(2560, 1440)).profile, ADAPTIVE_UI_PROFILES.WIDE);
assert.equal(
    classifyAdaptiveProfile(environment(1920, 1080, { hoverAvailable: true, touchPoints: 2 })).profile,
    ADAPTIVE_UI_PROFILES.WIDE,
);
assert.equal(
    classifyAdaptiveProfile(environment(1472, 820, { coarsePointer: true, touchPoints: 10 })).profile,
    ADAPTIVE_UI_PROFILES.TABLET_LANDSCAPE,
);
assert.equal(
    classifyAdaptiveProfile(environment(1472, 820, { coarsePointer: true, touchPoints: 10 })).density,
    'touch',
);
assert.equal(
    classifyAdaptiveProfile(environment(920, 1472, { coarsePointer: true, touchPoints: 10 })).profile,
    ADAPTIVE_UI_PROFILES.TABLET_PORTRAIT,
);
assert.equal(classifyAdaptiveProfile(environment(1366, 768)).profile, ADAPTIVE_UI_PROFILES.COMPACT);
assert.equal(classifyAdaptiveProfile(environment(1024, 600)).profile, ADAPTIVE_UI_PROFILES.CONSTRAINED);

const unsafeWide = classifyAdaptiveProfile(environment(1536, 800), { mode: 'wide' });
assert.equal(unsafeWide.profile, ADAPTIVE_UI_PROFILES.COMPACT);
assert.equal(unsafeWide.requestedModeApplied, false);

const safeCompact = classifyAdaptiveProfile(environment(1920, 1080), { mode: 'compact' });
assert.equal(safeCompact.profile, ADAPTIVE_UI_PROFILES.COMPACT);
assert.equal(safeCompact.requestedModeApplied, true);

assert.equal(resolveAdaptiveUiEnabled({ buildFlag: false, storage: null }), false);
assert.equal(resolveAdaptiveUiEnabled({ buildFlag: 'true', storage: null }), true);
assert.equal(resolveAdaptiveUiEnabled({ buildFlag: false, storage: { getItem: () => 'true' } }), true);
assert.equal(resolveAdaptiveModuleEnabled({ masterEnabled: true, moduleKey: 'bim' }), true);
assert.equal(resolveAdaptiveModuleEnabled({
    masterEnabled: true,
    moduleKey: 'bim',
    buildFlags: '{"bim":false}',
}), false);
assert.equal(resolveAdaptiveModuleEnabled({
    masterEnabled: true,
    moduleKey: 'bim',
    buildFlags: '{"bim":false}',
    storage: { getItem: () => '{"bim":true}' },
}), true);
assert.equal(resolveAdaptiveModuleEnabled({
    masterEnabled: true,
    moduleKey: 'presupuesto',
    buildFlags: 'global:false,presupuesto:true',
}), false);

assert.equal(resolvePortableWorkspaceProfile({
    width: 1920,
    height: 1080,
    enabled: false,
    environment: environment(1920, 1080),
}), false, 'el rollout desactivado conserva exactamente el layout legacy');
assert.equal(resolvePortableWorkspaceProfile({
    width: 1536,
    height: 864,
    enabled: true,
    environment: environment(1536, 864),
}), true, 'Windows con escalado debe activar las superficies compactas existentes');
assert.equal(resolvePortableWorkspaceProfile({
    width: 1472,
    height: 820,
    enabled: true,
    environment: environment(1472, 820, { coarsePointer: true, touchPoints: 10 }),
}), true, 'la Lenovo horizontal debe activar las superficies compactas existentes');
assert.equal(resolvePortableWorkspaceProfile({
    width: 1920,
    height: 1080,
    enabled: true,
    environment: environment(1920, 1080),
}), false, 'Full HD a escala 100% conserva la geometria amplia');

const protectedFiles = [
    path.join(frontendRoot, 'src', 'layouts', 'AppLayout.jsx'),
    path.join(frontendRoot, 'src', 'utils', 'adaptiveLayout.js'),
    path.join(frontendRoot, 'src', 'hooks', 'useAdaptiveLayout.js'),
];
for (const target of protectedFiles) {
    const source = fs.readFileSync(target, 'utf8');
    assert.equal(/transform\s*:\s*scale|zoom\s*:/.test(source), false, `${path.basename(target)} no escala globalmente la UI`);
}

const appLayoutSource = fs.readFileSync(path.join(frontendRoot, 'src', 'layouts', 'AppLayout.jsx'), 'utf8');
const controlSource = fs.readFileSync(path.join(frontendRoot, 'src', 'components', 'ui', 'AdaptiveLayoutControl.jsx'), 'utf8');
assert.match(appLayoutSource, /data-adaptive-profile/);
assert.match(appLayoutSource, /AdaptiveLayoutControl/);
assert.match(controlSource, /Automático/);
assert.match(controlSource, /Restablecer distribución/);
assert.match(controlSource, /!layout\.wideSafe/);

console.log('smoke-adaptive-layout-profiles: ok');
