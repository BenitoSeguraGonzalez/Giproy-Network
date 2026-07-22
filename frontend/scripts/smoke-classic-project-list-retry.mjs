import assert from 'node:assert/strict';

import {
    isTransientProjectListError,
    requestProjectListWithRetry,
} from '../src/api/projectListRetry.js';

const recordedDelays = [];
let transientAttempts = 0;
const recovered = await requestProjectListWithRetry(
    async () => {
        transientAttempts += 1;
        if (transientAttempts < 3) {
            throw { response: { status: 502 } };
        }
        return ['project-1'];
    },
    {
        retryDelays: [10, 20, 30],
        wait: async (delay) => recordedDelays.push(delay),
    }
);

assert.deepEqual(recovered, ['project-1']);
assert.equal(transientAttempts, 3);
assert.deepEqual(recordedDelays, [10, 20]);
assert.equal(isTransientProjectListError(new Error('network unavailable')), true);
assert.equal(isTransientProjectListError({ response: { status: 503 } }), true);
assert.equal(isTransientProjectListError({ response: { status: 403 } }), false);

let forbiddenAttempts = 0;
await assert.rejects(
    requestProjectListWithRetry(
        async () => {
            forbiddenAttempts += 1;
            throw { response: { status: 403 } };
        },
        { retryDelays: [10], wait: async () => {} }
    ),
    (error) => error?.response?.status === 403
);
assert.equal(forbiddenAttempts, 1);

let exhaustedAttempts = 0;
await assert.rejects(
    requestProjectListWithRetry(
        async () => {
            exhaustedAttempts += 1;
            throw { response: { status: 504 } };
        },
        { retryDelays: [10, 20], wait: async () => {} }
    ),
    (error) => error?.response?.status === 504
);
assert.equal(exhaustedAttempts, 3);

console.log('PASS classic project list transient retry smoke');
