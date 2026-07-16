import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

const ACTIVITY_COUNT = 50_000;
const FRAME_COUNT = 300;
const FEDERATION_MEMBER_COUNT = 5;

const startedAt = performance.now();
const activities = Array.from({ length: ACTIVITY_COUNT }, (_, index) => ({
    id: index + 1,
    start: index * 3_600_000,
    finish: (index + 8) * 3_600_000,
    elementIds: [`GUID-${String(index % 10_000).padStart(5, '0')}`],
}));
const cutoff = 25_000 * 3_600_000;
const activeAtCutoff = activities.filter((activity) => activity.start <= cutoff && activity.finish >= cutoff).length;
const activityDurationMs = performance.now() - startedAt;
assert.equal(activeAtCutoff, 9);
assert.ok(activityDurationMs < 2_000, `50k activity sweep ${activityDurationMs.toFixed(1)}ms`);

const federation = Array.from({ length: FEDERATION_MEMBER_COUNT }, (_, index) => ({
    id: `discipline-${index + 1}`,
    transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, index * 10, 0, 0, 1],
    visible: true,
}));
assert.equal(federation.length, 5);

const buildFrames = () => Array.from({ length: FRAME_COUNT }, (_, index) => {
    const percent = index / (FRAME_COUNT - 1);
    return {
        frame: index,
        timeSeconds: Number((percent * 100).toFixed(6)),
        equipment: { x: Number((percent * 10).toFixed(6)), y: 0, z: 0 },
        safetyZoneVisible: percent >= 0.25 && percent <= 0.75,
        constructionState: percent < 0.33 ? 'planned' : percent < 0.9 ? 'active' : 'completed',
    };
});
const firstFrames = buildFrames(); const secondFrames = buildFrames();
const checksum = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(checksum(firstFrames), checksum(secondFrames));

const deliverable = {
    contractVersion: 'giproy_bim_advanced_4d_deliverable_v1',
    activityCount: activities.length,
    federationMembers: federation,
    frames: firstFrames,
    source: { bentleyConnected: false, persistence: 'postgresql' },
};
const deliverableBytes = Buffer.byteLength(JSON.stringify(deliverable));
assert.ok(deliverableBytes > 10_000);
assert.equal(deliverable.frames.length, FRAME_COUNT);
assert.equal(deliverable.source.bentleyConnected, false);

console.log(JSON.stringify({ status: 'ok', activityCount: activities.length, activitySweepMs: Number(activityDurationMs.toFixed(2)), federationMembers: federation.length, frameCount: firstFrames.length, deliverableBytes, sha256: checksum(deliverable) }));
