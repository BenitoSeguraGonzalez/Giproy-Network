import React from 'react';

import BimGanttPanel from './BimGanttPanel';
import BimTimeline4dPanel from './BimTimeline4dPanel';

const BimPlanning4dPanel = ({
    projectId,
    empresaId,
    cutoff,
    selectedGuid,
    selectedActivityIds,
    primaryActivityId,
    onCutoffChange,
    onTimelineChange,
    onGanttChange,
    onSelectActivity,
    timelineApi,
    ganttApi,
}) => (
    <section className="flex h-full min-h-0 flex-col overflow-hidden border border-zinc-200 bg-white" data-bim-planning-4d>
        <BimTimeline4dPanel
            projectId={projectId}
            empresaId={empresaId}
            externalCutoff={cutoff}
            onCutoffChange={onCutoffChange}
            onTimelineChange={onTimelineChange}
            showActivityFocus={false}
            api={timelineApi}
        />
        <div className="min-h-0 flex-1">
            <BimGanttPanel
                projectId={projectId}
                empresaId={empresaId}
                cutoff={cutoff}
                selectedGuid={selectedGuid}
                selectedActivityIds={selectedActivityIds}
                primaryActivityId={primaryActivityId}
                onSelectActivity={onSelectActivity}
                onCutoffChange={onCutoffChange}
                onGanttChange={onGanttChange}
                api={ganttApi}
            />
        </div>
    </section>
);

export default BimPlanning4dPanel;
