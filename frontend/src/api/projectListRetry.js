const TRANSIENT_PROJECT_LIST_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

export const PROJECT_LIST_RETRY_DELAYS_MS = [1000, 3000, 6000];

export const isTransientProjectListError = (error) => {
    if (!error?.response) {
        return true;
    }

    return TRANSIENT_PROJECT_LIST_STATUSES.has(Number(error.response.status));
};

const waitFor = (delayMs) => new Promise((resolve) => {
    setTimeout(resolve, delayMs);
});

export const requestProjectListWithRetry = async (
    request,
    { retryDelays = PROJECT_LIST_RETRY_DELAYS_MS, wait = waitFor } = {}
) => {
    let retryIndex = 0;

    while (true) {
        try {
            return await request();
        } catch (error) {
            if (!isTransientProjectListError(error) || retryIndex >= retryDelays.length) {
                throw error;
            }

            await wait(retryDelays[retryIndex]);
            retryIndex += 1;
        }
    }
};
