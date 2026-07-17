import axiosInstance from './axiosConfig';
import { withTenantConfig } from './tenant';

export const bimModelsApi = {
    getWorkspace: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/workspace`, withTenantConfig({}, empresaId));
        return response.data;
    },
    listByProject: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/models`, withTenantConfig({}, empresaId));
        return response.data;
    },
    compareVersions: async (projectId, baseVersionId, targetVersionId, empresaId = null) => {
        const response = await axiosInstance.get(
            `/bim/projects/${projectId}/versions/compare`,
            withTenantConfig({ params: { base_version_id: baseVersionId, target_version_id: targetVersionId } }, empresaId),
        );
        return response.data;
    },
    getFederation: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/federation`, withTenantConfig({}, empresaId));
        return response.data;
    },
    saveFederation: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.put(
            `/bim/projects/${projectId}/federation`,
            payload,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    getSiteGeoreference: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/site-georeference`, withTenantConfig({}, empresaId));
        return response.data;
    },
    saveSiteGeoreference: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.put(
            `/bim/projects/${projectId}/site-georeference`,
            payload,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    listIdsProfiles: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/ids/profiles`, withTenantConfig({}, empresaId));
        return response.data;
    },
    importIdsProfile: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/ids/profiles`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    validateIdsProfile: async (projectId, versionId, profileId, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/versions/${versionId}/ids/${profileId}/validate`, null, withTenantConfig({}, empresaId));
        return response.data;
    },
    exemptIdsFinding: async (projectId, findingId, reason, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/ids/findings/${findingId}/exception`, { reason }, withTenantConfig({}, empresaId));
        return response.data;
    },
    exportIdsValidation: async (projectId, validationId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/ids/validations/${validationId}.csv`, withTenantConfig({ responseType: 'blob' }, empresaId));
        return response.data;
    },
    listIssues: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/issues`, withTenantConfig({}, empresaId));
        return response.data;
    },
    createIssue: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/issues`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    updateIssue: async (projectId, issueId, payload, empresaId = null) => {
        const response = await axiosInstance.patch(`/bim/projects/${projectId}/issues/${issueId}`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    commentIssue: async (projectId, issueId, body, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/issues/${issueId}/comments`, { body }, withTenantConfig({}, empresaId));
        return response.data;
    },
    exportIssueBcf: async (projectId, issueId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/issues/${issueId}.bcf`, withTenantConfig({ responseType: 'blob' }, empresaId));
        return response.data;
    },
    uploadIssueAttachment: async (projectId, issueId, file, empresaId = null) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post(`/bim/projects/${projectId}/issues/${issueId}/attachments`, formData, withTenantConfig({ headers: { 'Content-Type': 'multipart/form-data' } }, empresaId));
        return response.data;
    },
    downloadIssueAttachment: async (projectId, issueId, attachmentId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/issues/${issueId}/attachments/${attachmentId}/content`, withTenantConfig({ responseType: 'blob' }, empresaId));
        return response.data;
    },
    getQuantityCandidates: async (projectId, elementId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/elements/${elementId}/quantity-candidates`, withTenantConfig({}, empresaId));
        return response.data;
    },
    createQuantityProposal: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/quantity-proposals`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    decideQuantityProposal: async (projectId, proposalId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/quantity-proposals/${proposalId}/decision`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    createQtoSnapshot: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/qto-snapshots`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    listQtoSnapshots: async (projectId, versionId = null, empresaId = null) => {
        const config = withTenantConfig({}, empresaId);
        config.params = { ...(config.params || {}), ...(versionId ? { version_id: versionId } : {}) };
        const response = await axiosInstance.get(`/bim/projects/${projectId}/qto-snapshots`, config);
        return response.data;
    },
    decideQtoSnapshot: async (projectId, snapshotId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/qto-snapshots/${snapshotId}/decision`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    getQto5dPackage: async (projectId, snapshotId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/qto-snapshots/${snapshotId}/5d-package`, withTenantConfig({}, empresaId));
        return response.data;
    },
    listCostEstimates: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/cost-estimates`, withTenantConfig({}, empresaId))).data,
    createCostEstimate: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/cost-estimates`, payload, withTenantConfig({}, empresaId))).data,
    decideCostEstimate: async (projectId, estimateId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/cost-estimates/${estimateId}/decision`, payload, withTenantConfig({}, empresaId))).data,
    listCostContracts: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/cost-contracts`, withTenantConfig({}, empresaId))).data,
    createCostContract: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/cost-contracts`, payload, withTenantConfig({}, empresaId))).data,
    transitionCostContract: async (projectId, contractId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/cost-contracts/${contractId}/transition`, payload, withTenantConfig({}, empresaId))).data,
    listPaymentApplications: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/payment-applications`, withTenantConfig({}, empresaId))).data,
    createPaymentApplication: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/payment-applications`, payload, withTenantConfig({}, empresaId))).data,
    submitPaymentApplication: async (projectId, applicationId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/payment-applications/${applicationId}/submit`, payload, withTenantConfig({}, empresaId))).data,
    decidePaymentApplication: async (projectId, applicationId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/payment-applications/${applicationId}/decision`, payload, withTenantConfig({}, empresaId))).data,
    listSchedulesOfValues: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/schedules-of-values`, withTenantConfig({}, empresaId))).data,
    createScheduleOfValues: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/schedules-of-values`, payload, withTenantConfig({}, empresaId))).data,
    decideScheduleOfValues: async (projectId, sovId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/schedules-of-values/${sovId}/decision`, payload, withTenantConfig({}, empresaId))).data,
    listChangeOrders: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/change-orders`, withTenantConfig({}, empresaId))).data,
    createChangeOrder: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/change-orders`, payload, withTenantConfig({}, empresaId))).data,
    transitionChangeOrder: async (projectId, changeId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/change-orders/${changeId}/transition`, payload, withTenantConfig({}, empresaId))).data,
    decideChangeOrder: async (projectId, changeId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/change-orders/${changeId}/decision`, payload, withTenantConfig({}, empresaId))).data,
    getActualCostLedger: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/actual-costs`, withTenantConfig({}, empresaId))).data,
    syncActualCostLedger: async (projectId, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/actual-costs/sync`, null, withTenantConfig({}, empresaId))).data,
    listCostForecasts: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/cost-forecasts`, withTenantConfig({}, empresaId))).data,
    createCostForecast: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/cost-forecasts`, payload, withTenantConfig({}, empresaId))).data,
    decideCostForecast: async (projectId, forecastId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/cost-forecasts/${forecastId}/decision`, payload, withTenantConfig({}, empresaId))).data,
    listAsBuiltAcceptances: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/as-built-acceptances`, withTenantConfig({}, empresaId))).data,
    createAsBuiltAcceptance: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/as-built-acceptances`, payload, withTenantConfig({}, empresaId))).data,
    decideAsBuiltAcceptance: async (projectId, acceptanceId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/as-built-acceptances/${acceptanceId}/decision`, payload, withTenantConfig({}, empresaId))).data,
    getCommissioningRegistry: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/commissioning`, withTenantConfig({}, empresaId))).data,
    createCommissioningSystem: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/commissioning/systems`, payload, withTenantConfig({}, empresaId))).data,
    createCommissioningAsset: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/commissioning/assets`, payload, withTenantConfig({}, empresaId))).data,
    createCommissioningTest: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/commissioning/tests`, payload, withTenantConfig({}, empresaId))).data,
    decideCommissioningTest: async (projectId, testId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/commissioning/tests/${testId}/decision`, payload, withTenantConfig({}, empresaId))).data,
    decideCommissioningAsset: async (projectId, assetId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/commissioning/assets/${assetId}/decision`, payload, withTenantConfig({}, empresaId))).data,
    acceptCommissioningSystem: async (projectId, systemId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/commissioning/systems/${systemId}/accept`, payload, withTenantConfig({}, empresaId))).data,
    listPunchClosures: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/punch-closures`, withTenantConfig({}, empresaId))).data,
    createPunchClosure: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/punch-closures`, payload, withTenantConfig({}, empresaId))).data,
    decidePunchClosure: async (projectId, closureId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/punch-closures/${closureId}/decision`, payload, withTenantConfig({}, empresaId))).data,
    listHandoverDossiers: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/handover-dossiers`, withTenantConfig({}, empresaId))).data,
    createHandoverDossier: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/handover-dossiers`, payload, withTenantConfig({}, empresaId))).data,
    decideHandoverDossier: async (projectId, dossierId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/handover-dossiers/${dossierId}/decision`, payload, withTenantConfig({}, empresaId))).data,
    listOperationsTransitions: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/operations-transitions`, withTenantConfig({}, empresaId))).data,
    createOperationsTransition: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/operations-transitions`, payload, withTenantConfig({}, empresaId))).data,
    decideOperationsTransition: async (projectId, transitionId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/operations-transitions/${transitionId}/decision`, payload, withTenantConfig({}, empresaId))).data,
    getCapabilities: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/capabilities`, withTenantConfig({}, empresaId));
        return response.data;
    },
    saveCapabilityGrant: async (projectId, userId, capabilities, empresaId = null) => {
        const response = await axiosInstance.put(
            `/bim/projects/${projectId}/capability-grants/${userId}`,
            { capabilities },
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    getOperationalMetrics: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/operational-metrics`, withTenantConfig({}, empresaId));
        return response.data;
    },
    getRolloutPlan: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/rollout`, withTenantConfig({}, empresaId));
        return response.data;
    },
    saveRolloutPlan: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.put(`/bim/projects/${projectId}/rollout`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    rehearseRolloutRollback: async (projectId, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/rollout/rehearse-rollback`,
            null,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    list4dActivities: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/activities`, withTenantConfig({}, empresaId));
        return response.data;
    },
    create4dActivitySnapshot: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/activities`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    list4dLinkProposals: async (projectId, elementId = null, empresaId = null) => {
        const response = await axiosInstance.get(
            `/bim/projects/${projectId}/4d/link-proposals`,
            withTenantConfig({ params: elementId ? { element_id: elementId } : {} }, empresaId),
        );
        return response.data;
    },
    create4dLinkProposal: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/link-proposals`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    decide4dLinkProposal: async (projectId, proposalId, payload, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/4d/link-proposals/${proposalId}/decision`,
            payload,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    report4dProgress: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/progress`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    get4dTimeline: async (projectId, cutoff, empresaId = null) => {
        const response = await axiosInstance.get(
            `/bim/projects/${projectId}/4d/timeline`,
            withTenantConfig({ params: { cutoff } }, empresaId),
        );
        return response.data;
    },
    list4dBaselines: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/baselines`, withTenantConfig({}, empresaId));
        return response.data;
    },
    create4dBaseline: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/baselines`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    get4dDeviation: async (projectId, baselineId, cutoff, empresaId = null) => {
        const response = await axiosInstance.get(
            `/bim/projects/${projectId}/4d/baselines/${baselineId}/deviation`,
            withTenantConfig({ params: { cutoff } }, empresaId),
        );
        return response.data;
    },
    get4dGantt: async (projectId, baselineId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/baselines/${baselineId}/gantt`, withTenantConfig({}, empresaId));
        return response.data;
    },
    list4dWorkAreas: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/work-areas`, withTenantConfig({}, empresaId));
        return response.data;
    },
    create4dWorkArea: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/work-areas`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    list4dComponents: async (projectId, workAreaId = null, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/constructible-components`, withTenantConfig({ params: workAreaId ? { work_area_id: workAreaId } : {} }, empresaId));
        return response.data;
    },
    create4dComponent: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/constructible-components`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    list4dScenarios: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/scenarios`, withTenantConfig({}, empresaId));
        return response.data;
    },
    get4dSpaceTimeConflicts: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/space-time-conflicts`, withTenantConfig({}, empresaId));
        return response.data;
    },
    create4dScenario: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/scenarios`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    list4dProductivityProposals: async (projectId, elementId = null, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/productivity-proposals`, withTenantConfig({ params: elementId ? { element_id: elementId } : {} }, empresaId));
        return response.data;
    },
    list4dResources: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/resources`, withTenantConfig({}, empresaId));
        return response.data;
    },
    list4dPartitionSpecs: async (projectId, elementId = null, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/partition-specs`, withTenantConfig({ params: elementId ? { element_id: elementId } : {} }, empresaId));
        return response.data;
    },
    create4dPartitionSpec: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/partition-specs`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    delete4dPartitionSpec: async (projectId, specId, empresaId = null) => {
        await axiosInstance.delete(`/bim/projects/${projectId}/4d/partition-specs/${specId}`, withTenantConfig({}, empresaId));
    },
    materialize4dPartitionSpec: async (projectId, specId, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/partition-specs/${specId}/materialize`, {}, withTenantConfig({}, empresaId));
        return response.data;
    },
    get4dPartitionArtifact: async (projectId, specId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/partition-specs/${specId}/artifact`, withTenantConfig({}, empresaId));
        return response.data;
    },
    create4dPartitionCsgArtifact: async (projectId, specId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/partition-specs/${specId}/csg-artifacts`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    list4dPartitionCsgArtifacts: async (projectId, specId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/partition-specs/${specId}/csg-artifacts`, withTenantConfig({}, empresaId));
        return response.data;
    },
    list4dEquipment: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/4d/equipment`, withTenantConfig({}, empresaId))).data,
    create4dEquipment: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/4d/equipment`, payload, withTenantConfig({}, empresaId))).data,
    list4dEquipmentMotion: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/4d/equipment-motion`, withTenantConfig({}, empresaId))).data,
    create4dEquipmentMotion: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/4d/equipment-motion`, payload, withTenantConfig({}, empresaId))).data,
    get4dEquipmentPlayback: async (projectId, motionPlanId, percent, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/4d/equipment-motion/${motionPlanId}/playback`, withTenantConfig({ params: { percent } }, empresaId))).data,
    get4dEquipmentConflicts: async (projectId, motionPlanId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/4d/equipment-motion/${motionPlanId}/conflicts`, withTenantConfig({}, empresaId))).data,
    list4dSafetyRisks: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/4d/safety-risks`, withTenantConfig({}, empresaId))).data,
    create4dSafetyRisk: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/4d/safety-risks`, payload, withTenantConfig({}, empresaId))).data,
    create4dSafetyInspection: async (projectId, riskId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/4d/safety-risks/${riskId}/inspections`, payload, withTenantConfig({}, empresaId))).data,
    list4dSafetyInspections: async (projectId, riskId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/4d/safety-risks/${riskId}/inspections`, withTenantConfig({}, empresaId))).data,
    list4dSafetyPunchItems: async (projectId, riskId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/4d/safety-risks/${riskId}/punch-items`, withTenantConfig({}, empresaId))).data,
    create4dSafetyPunchItem: async (projectId, riskId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/4d/safety-risks/${riskId}/punch-items`, payload, withTenantConfig({}, empresaId))).data,
    update4dSafetyPunchItem: async (projectId, riskId, punchId, payload, empresaId = null) => (await axiosInstance.patch(`/bim/projects/${projectId}/4d/safety-risks/${riskId}/punch-items/${punchId}`, payload, withTenantConfig({}, empresaId))).data,
    list4dUnplannedEvents: async (projectId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/4d/unplanned-events`, withTenantConfig({}, empresaId))).data,
    create4dUnplannedEvent: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/4d/unplanned-events`, payload, withTenantConfig({}, empresaId))).data,
    decide4dUnplannedEvent: async (projectId, eventId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/4d/unplanned-events/${eventId}/decision`, payload, withTenantConfig({}, empresaId))).data,
    list4dFieldResourceMovements: async (projectId, resourceId = null, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/4d/field-resource-movements`, withTenantConfig({ params: resourceId ? { resource_id: resourceId } : {} }, empresaId))).data,
    create4dFieldResourceMovement: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/4d/field-resource-movements`, payload, withTenantConfig({}, empresaId))).data,
    list4dCrews: async (projectId, activeOnly = false, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/4d/crews`, withTenantConfig({ params: activeOnly ? { active_only: true } : {} }, empresaId))).data,
    create4dCrew: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/4d/crews`, payload, withTenantConfig({}, empresaId))).data,
    list4dTimecards: async (projectId, crewId = null, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/4d/timecards`, withTenantConfig({ params: crewId ? { crew_id: crewId } : {} }, empresaId))).data,
    create4dTimecard: async (projectId, payload, empresaId = null) => (await axiosInstance.post(`/bim/projects/${projectId}/4d/timecards`, payload, withTenantConfig({}, empresaId))).data,
    get4dSafetyExposure: async (projectId, riskId, empresaId = null) => (await axiosInstance.get(`/bim/projects/${projectId}/4d/safety-risks/${riskId}/exposure`, withTenantConfig({}, empresaId))).data,
    create4dResource: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/resources`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    create4dResourceAssignment: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/resource-assignments`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    get4dResourceHistogram: async (projectId, resourceId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/resources/${resourceId}/histogram`, withTenantConfig({}, empresaId));
        return response.data;
    },
    create4dResourceLeveling: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/resource-leveling`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    list4dResourceLeveling: async (projectId, baselineId = null, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/resource-leveling`, withTenantConfig({ params: baselineId ? { baseline_id: baselineId } : {} }, empresaId));
        return response.data;
    },
    decide4dResourceLeveling: async (projectId, scenarioId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/resource-leveling/${scenarioId}/decision`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    get4dReport: async (projectId, reportType, params = {}, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/reports/${reportType}`, withTenantConfig({ params }, empresaId));
        return response.data;
    },
    download4dReportCsv: async (projectId, reportType, params = {}, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/reports/${reportType}`, withTenantConfig({ params: { ...params, format: 'csv' }, responseType: 'blob' }, empresaId));
        return response.data;
    },
    create4dProductivityProposal: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/productivity-proposals`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    decide4dProductivityProposal: async (projectId, proposalId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/productivity-proposals/${proposalId}/decision`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    list4dFieldReports: async (projectId, activitySnapshotId = null, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/field-reports`, withTenantConfig({ params: activitySnapshotId ? { activity_snapshot_id: activitySnapshotId } : {} }, empresaId));
        return response.data;
    },
    create4dFieldReport: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/field-reports`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    upload4dFieldEvidence: async (projectId, reportId, file, empresaId = null) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/field-reports/${reportId}/evidence`, formData, withTenantConfig({ headers: { 'Content-Type': 'multipart/form-data' } }, empresaId));
        return response.data;
    },
    previewScheduleInterchange: async (projectId, format, payload, empresaId = null) => {
        const formData = new FormData();
        formData.append('file', payload.file);
        formData.append('timezone_name', payload.timezone_name);
        formData.append('currency', payload.currency);
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/4d/schedule-interchange/${format}/import-preview`,
            formData,
            withTenantConfig({ headers: { 'Content-Type': 'multipart/form-data' } }, empresaId),
        );
        return response.data;
    },
    exportScheduleInterchange: async (projectId, format, document, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/4d/schedule-interchange/${format}/export`,
            document,
            withTenantConfig({ responseType: 'blob' }, empresaId),
        );
        return response.data;
    },
    createScheduleImportRevision: async (projectId, document, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/schedule-interchange/revisions`, document, withTenantConfig({}, empresaId));
        return response.data;
    },
    listScheduleImportRevisions: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/schedule-interchange/revisions`, withTenantConfig({}, empresaId));
        return response.data;
    },
    decideScheduleImportRevision: async (projectId, revisionId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/schedule-interchange/revisions/${revisionId}/decision`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    rollbackScheduleImportRevision: async (projectId, revisionId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/4d/schedule-interchange/revisions/${revisionId}/rollback`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    listCdeDocuments: async (projectId, includeArchived = false, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/cde/documents`, withTenantConfig({ params: { include_archived: includeArchived } }, empresaId));
        return response.data;
    },
    getCdeDashboard: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/cde/dashboard`, withTenantConfig({}, empresaId));
        return response.data;
    },
    uploadCdeDocument: async (projectId, payload, empresaId = null) => {
        const formData = new FormData();
        formData.append('document_code', payload.document_code);
        formData.append('title', payload.title);
        formData.append('category', payload.category);
        formData.append('version_label', payload.version_label);
        formData.append('notes', payload.notes || '');
        formData.append('file', payload.file);
        const response = await axiosInstance.post(`/bim/projects/${projectId}/cde/documents`, formData, withTenantConfig({ headers: { 'Content-Type': 'multipart/form-data' } }, empresaId));
        return response.data;
    },
    listCdeDocumentRevisions: async (projectId, documentId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/cde/documents/${documentId}/revisions`, withTenantConfig({}, empresaId));
        return response.data;
    },
    downloadCdeRevision: async (projectId, revisionId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/cde/revisions/${revisionId}/content`, withTenantConfig({ responseType: 'blob' }, empresaId));
        return response.data;
    },
    archiveCdeDocument: async (projectId, documentId, reason, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/cde/documents/${documentId}/archive`, { reason }, withTenantConfig({}, empresaId));
        return response.data;
    },
    listCdeAclUsers: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/cde/acl-users`, withTenantConfig({}, empresaId));
        return response.data;
    },
    listCdeDocumentAcl: async (projectId, documentId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/cde/documents/${documentId}/acl`, withTenantConfig({}, empresaId));
        return response.data;
    },
    saveCdeDocumentAcl: async (projectId, documentId, payload, empresaId = null) => {
        const response = await axiosInstance.put(`/bim/projects/${projectId}/cde/documents/${documentId}/acl`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    listCdeRfiAssignees: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/cde/rfi-assignees`, withTenantConfig({}, empresaId));
        return response.data;
    },
    listCdeRfis: async (projectId, status = null, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/cde/rfis`, withTenantConfig({ params: status ? { status } : {} }, empresaId));
        return response.data;
    },
    createCdeRfi: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/cde/rfis`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    transitionCdeRfi: async (projectId, rfiId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/cde/rfis/${rfiId}/transition`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    listCdeSubmittals: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/cde/submittals`, withTenantConfig({}, empresaId));
        return response.data;
    },
    createCdeSubmittal: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/cde/submittals`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    createCdeSubmittalRevision: async (projectId, submittalId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/cde/submittals/${submittalId}/revisions`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    transitionCdeSubmittal: async (projectId, submittalId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/cde/submittals/${submittalId}/transition`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    listCdeReviews: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/cde/reviews`, withTenantConfig({}, empresaId));
        return response.data;
    },
    createCdeReview: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/cde/reviews`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    commentCdeReview: async (projectId, reviewId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/cde/reviews/${reviewId}/comments`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    transitionCdeReview: async (projectId, reviewId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/cde/reviews/${reviewId}/transition`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    listCdeReviewNotifications: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/cde/review-notifications`, withTenantConfig({}, empresaId));
        return response.data;
    },
    readCdeReviewNotification: async (projectId, notificationId, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/cde/review-notifications/${notificationId}/read`, null, withTenantConfig({}, empresaId));
        return response.data;
    },
    download4dFieldEvidence: async (projectId, evidenceId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/4d/field-evidence/${evidenceId}/content`, withTenantConfig({ responseType: 'blob' }, empresaId));
        return response.data;
    },
    bootstrapDemo: async (projectId, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/bootstrap-demo`, null, withTenantConfig({}, empresaId));
        return response.data;
    },
    importJsonPackage: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/imports/json-package`,
            payload,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    importJsonBatch: async (projectId, packages, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/imports/json-batch`,
            { packages },
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    validateJsonBatch: async (projectId, packages, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/imports/json-validate`,
            { packages },
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    registerIfcManifest: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/imports/ifc-manifest`,
            payload,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    importIfcText: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/imports/ifc-text`,
            payload,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    importIfcFile: async (projectId, payload, empresaId = null) => {
        const formData = new FormData();
        formData.append('model_name', payload.model_name);
        formData.append('version_label', payload.version_label);
        if (payload.discipline) formData.append('discipline', payload.discipline);
        if (payload.description) formData.append('description', payload.description);
        if (payload.notes) formData.append('notes', payload.notes);
        if (typeof payload.activate === 'boolean') formData.append('activate', String(payload.activate));
        formData.append('file', payload.file);

        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/imports/ifc-file`,
            formData,
            withTenantConfig({ headers: { 'Content-Type': 'multipart/form-data' } }, empresaId),
        );
        return response.data;
    },
    createIfcImportJob: async (projectId, payload, empresaId = null) => {
        const formData = new FormData();
        formData.append('model_name', payload.model_name);
        formData.append('version_label', payload.version_label);
        if (payload.discipline) formData.append('discipline', payload.discipline);
        if (payload.description) formData.append('description', payload.description);
        if (payload.notes) formData.append('notes', payload.notes);
        formData.append('file', payload.file);

        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/imports/ifc-jobs`,
            formData,
            withTenantConfig({ headers: { 'Content-Type': 'multipart/form-data' } }, empresaId),
        );
        return response.data;
    },
    listImportJobs: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(
            `/bim/projects/${projectId}/imports/jobs`,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    getImportJob: async (projectId, jobId, empresaId = null) => {
        const response = await axiosInstance.get(
            `/bim/projects/${projectId}/imports/jobs/${jobId}`,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    cancelImportJob: async (projectId, jobId, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/imports/jobs/${jobId}/cancel`,
            null,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    retryImportJob: async (projectId, jobId, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/imports/jobs/${jobId}/retry`,
            null,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    getIfcQualityReport: async (projectId, versionId, empresaId = null) => {
        const response = await axiosInstance.get(
            `/bim/projects/${projectId}/versions/${versionId}/quality-report`,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    generateIfcQualityReport: async (projectId, versionId, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/versions/${versionId}/quality-report`,
            null,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    listArtifacts: async (projectId, versionId, empresaId = null) => {
        const response = await axiosInstance.get(
            `/bim/projects/${projectId}/versions/${versionId}/artifacts`,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    registerArtifact: async (projectId, versionId, payload, empresaId = null) => {
        const formData = new FormData();
        formData.append('artifact_type', payload.artifact_type);
        if (payload.source_checksum_sha256) formData.append('source_checksum_sha256', payload.source_checksum_sha256);
        formData.append('file', payload.file);
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/versions/${versionId}/artifacts`,
            formData,
            withTenantConfig({ headers: { 'Content-Type': 'multipart/form-data' } }, empresaId),
        );
        return response.data;
    },
    validateArtifact: async (projectId, artifactId, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/artifacts/${artifactId}/validate`,
            null,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    rollbackArtifact: async (projectId, artifactId, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/artifacts/${artifactId}/rollback`,
            null,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    downloadArtifact: async (projectId, artifactId, empresaId = null) => {
        const response = await axiosInstance.get(
            `/bim/projects/${projectId}/artifacts/${artifactId}/content`,
            withTenantConfig({ responseType: 'arraybuffer' }, empresaId),
        );
        return new Uint8Array(response.data);
    },
    generateViewerArtifact: async (projectId, versionId, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/versions/${versionId}/artifacts/viewer`,
            null,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
};
