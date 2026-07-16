const uniqueValues = (values = []) => Array.from(new Set(values.filter((value) => value != null && value !== '')));

export const findActivitiesByGuid = (guid, gantt) => (
    guid && gantt?.activities
        ? gantt.activities.filter((activity) => (activity.global_ids || []).includes(guid))
        : []
);

export const createElementPlanningSelection = (guid, gantt) => {
    const activities = findActivitiesByGuid(guid, gantt);
    return {
        activityIds: activities.map((activity) => activity.id),
        primaryActivityId: activities[0]?.id || null,
        guids: guid ? [guid] : [],
        primaryGuid: guid || '',
        source: 'element',
        focusToken: null,
    };
};

export const createActivityPlanningSelection = (activity, focusToken = null) => {
    const guids = uniqueValues(activity?.global_ids);
    return {
        activityIds: activity?.id ? [activity.id] : [],
        primaryActivityId: activity?.id || null,
        guids,
        primaryGuid: guids[0] || '',
        source: 'activity',
        focusToken,
    };
};
