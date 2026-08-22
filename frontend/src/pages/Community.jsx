import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    BellRing,
    Building2,
    ChevronDown,
    Flame,
    LayoutGrid,
    Globe2,
    Info,
    Lock,
    MessageSquareMore,
    Paperclip,
    Pencil,
    Pin,
    Plus,
    Search,
    Send,
    ShieldCheck,
    ShieldMinus,
    Star,
    Trash2,
    UsersRound,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { communityApi } from '../api/community';
import { maestrosApi } from '../api/maestros';
import { usuariosApi } from '../api/usuarios';
import { Card, CardContent } from '../components/ui/card';
import { AppModalBody, AppModalHeader, AppModalShell } from '../components/ui/app-modal';
import PersonnelFormFields from '../components/PersonnelFormFields';
import { appAlert, appConfirm } from '../utils/appDialog';
import { includesNormalized, normalizeSearchToken } from '../utils/normalizeSearch';
import AnimatedSelect from '../components/ui/AnimatedSelect';

const TABS = [
    { id: 'publico', label: 'Público', icon: Globe2 },
    { id: 'interno_empresa', label: 'Mi empresa', icon: Building2 },
    { id: 'mensajes_directos', label: 'Mensajes directos', icon: MessageSquareMore },
];

const DEFAULT_FEED_ORDER = 'recent_activity';

const SANCTION_OPTIONS = [
    { value: 'bloqueo_publico', label: 'Bloqueo público', scope: 'publico' },
    { value: 'bloqueo_interno', label: 'Bloqueo interno', scope: 'interno_empresa' },
    { value: 'bloqueo_dm', label: 'Bloqueo DM', scope: 'mensajes_directos' },
    { value: 'bloqueo_comunidad', label: 'Bloqueo Comunidad', scope: 'global' },
];

const ADMIN_WORKSPACE_TABS = [
    { id: 'overview', label: 'Resumen', icon: ShieldCheck },
    { id: 'governance', label: 'Gobernanza', icon: UsersRound },
    { id: 'users', label: 'Usuarios', icon: UsersRound },
    { id: 'moderation', label: 'Moderación', icon: ShieldMinus },
];

const EMPTY_TOPIC_FORM = {
    category_id: '',
    nombre: '',
    descripcion: '',
    is_restricted: false,
    user_ids: [],
};

const EMPTY_CATEGORY_FORM = {
    nombre: '',
    descripcion: '',
    orden: 0,
};

const EMPTY_COMMUNITY_USER_FORM = {
    email: '',
    password: '',
    confirmPassword: '',
    nombre_completo: '',
    rol: 'usuario_comunidad',
    empresa_id: '',
    ruc: '',
    nombres: '',
    apellidos: '',
    alias: '',
    nacionalidad: '',
    profesion: '',
    ciudad: '',
    provincia: '',
    canton: '',
    pais: '',
    movil: '',
    acepta_politica_privacidad: false,
    acepta_politicas_comunicacion: false,
    autoriza_publicidad: false,
};

const LOAD_LAYER_LABELS = {
    bootstrap: 'contexto base',
    categories_public: 'categorías públicas',
    categories_internal: 'categorías internas',
    topics_public: 'temas públicos',
    topics_internal: 'temas internos',
    posts_public: 'publicaciones públicas',
    posts_internal: 'publicaciones internas',
    dm_threads: 'mensajes directos',
    visible_users: 'usuarios visibles',
    sanctions: 'sanciones',
    sanction_appeals: 'apelaciones',
    admin_users: 'usuarios administrables',
    admin_alerts: 'alertas administrativas',
    infractions: 'infracciones',
    global_timeout: 'carga inicial',
};
const COMMUNITY_LOAD_TIMEOUT_MS = 12000;
const COMMUNITY_FAILSAFE_TIMEOUT_MS = 16000;

const COMMUNITY_SCOPE_LABELS = {
    publico: 'Público',
    interno_empresa: 'Mi empresa',
    mensajes_directos: 'Mensajes directos',
    global: 'Global',
};

const INFRACTION_TYPE_LABELS = {
    public_link_attempt: 'Intento de link público',
};

const ADMIN_ALERT_TYPE_LABELS = {
    infraction_public_link: 'Links públicos',
};

const getSettledData = (result, fallback) => (result?.status === 'fulfilled' ? result.value : fallback);
const getSettledError = (result) => result?.reason?.response?.data?.detail || result?.reason?.message || 'No disponible';
const MENTION_TOKEN_REGEX = /(\B@[a-z0-9._-]{2,50})/gi;

const withCommunityLoadTimeout = (promise, label, timeoutMs = COMMUNITY_LOAD_TIMEOUT_MS) => new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
        reject(new Error(`Tiempo de espera agotado al cargar ${label}.`));
    }, timeoutMs);

    promise
        .then((value) => {
            window.clearTimeout(timer);
            resolve(value);
        })
        .catch((error) => {
            window.clearTimeout(timer);
            reject(error);
        });
});

const renderTextWithMentions = (text, mentions = []) => {
    const content = String(text || '');
    if (!content) return null;
    if (!mentions.length) return content;
    const mentionMap = mentions.reduce((accumulator, mention) => {
        accumulator[`@${String(mention.handle || '').toLowerCase()}`] = mention;
        return accumulator;
    }, {});
    return content.split(MENTION_TOKEN_REGEX).map((part, index) => {
        const mention = mentionMap[String(part || '').toLowerCase()];
        if (!mention) {
            return <span key={`${index}-${part}`}>{part}</span>;
        }
        return (
            <span
                key={`${mention.handle}-${index}`}
                title={mention.display_name || mention.handle}
                className="inline-flex rounded-full border border-[#136191]/15 bg-blue-50 px-1.5 py-0.5 font-black text-[#136191]"
            >
                {part}
            </span>
        );
    });
};

const renderAttachmentList = (attachments = [], action = null) => {
    if (!attachments.length) return null;
    return (
        <div className="mt-4 flex flex-wrap gap-2">
            {attachments.map((attachment) => {
                const isImage = String(attachment.content_type || '').startsWith('image/');
                return (
                    <div
                        key={attachment.id}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold ${isImage ? 'border-blue-200 bg-blue-50 text-[#136191]' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}
                    >
                        <a
                            href={attachment.public_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2"
                        >
                            <Paperclip className="h-3.5 w-3.5" />
                            <span className="max-w-[220px] truncate">{attachment.file_name}</span>
                        </a>
                        {action && (
                            <button
                                onClick={() => action.onClick(attachment)}
                                className="rounded-full border border-red-200 bg-white p-1 text-red-500"
                                title={action.title}
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const getValidDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getForumCategoryPresentation = (scope, categoryName = '', isActive = false) => {
    const normalized = String(categoryName || '').toLowerCase();
    if (normalized.includes('alert') || normalized.includes('moder') || normalized.includes('norm')) {
        return {
            Icon: BellRing,
            accent: isActive ? 'border-[#136191] bg-[#136191] text-white' : 'border-blue-200 bg-blue-50 text-[#136191]',
        };
    }
    if (normalized.includes('priv') || normalized.includes('intern')) {
        return {
            Icon: Lock,
            accent: isActive ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
        };
    }
    if (scope === 'publico') {
        return {
            Icon: Globe2,
            accent: isActive ? 'border-[#F39200] bg-[#F39200] text-white' : 'border-amber-200 bg-amber-50 text-[#F39200]',
        };
    }
    if (scope === 'interno_empresa') {
        return {
            Icon: Building2,
            accent: isActive ? 'border-[#136191] bg-[#136191] text-white' : 'border-blue-200 bg-blue-50 text-[#136191]',
        };
    }
    return {
        Icon: LayoutGrid,
        accent: isActive ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600',
    };
};

const getForumScopeAppearance = (scope) => {
    if (scope === 'publico') {
        return {
            eyebrow: 'Foro público',
            title: 'Comunidad pública',
            description: 'Espacio transversal del producto para conversación abierta dentro de Comunidad, con reglas públicas y moderación global.',
            shell: 'border-[#F4D58D] bg-[#FFF8E8]',
            divider: 'divide-[#F4E7BF]',
            iconWrap: 'border-[#F39200]/20 bg-[#F39200] text-white',
            Icon: Globe2,
        };
    }
    return {
        eyebrow: 'Foro interno',
        title: 'Mi empresa',
        description: 'Espacio privado ajustado a la empresa activa, orientado a coordinación interna y temas operativos propios.',
        shell: 'border-[#CFE3F0] bg-[#F7FBFE]',
        divider: 'divide-[#DCEAF3]',
        iconWrap: 'border-[#136191]/20 bg-[#136191] text-white',
        Icon: Building2,
    };
};

const Community = () => {
    const navigate = useNavigate();
    const { user, selectedEmpresa } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('publico');
    const [bootstrap, setBootstrap] = useState(null);
    const [posts, setPosts] = useState({ publico: [], interno_empresa: [] });
    const [allPostsByScope, setAllPostsByScope] = useState({ publico: [], interno_empresa: [] });
    const [postRepliesById, setPostRepliesById] = useState({});
    const [expandedRepliesById, setExpandedRepliesById] = useState({});
    const [replyFormsByPostId, setReplyFormsByPostId] = useState({});
    const [replyAttachmentsByPostId, setReplyAttachmentsByPostId] = useState({});
    const [editingPostId, setEditingPostId] = useState(null);
    const [editingPostForm, setEditingPostForm] = useState({ title: '', body: '' });
    const [editingReplyId, setEditingReplyId] = useState(null);
    const [editingReplyBody, setEditingReplyBody] = useState('');
    const [threads, setThreads] = useState([]);
    const [messagesByThread, setMessagesByThread] = useState({});
    const [visibleUsers, setVisibleUsers] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [categoriesByScope, setCategoriesByScope] = useState({ publico: [], interno_empresa: [] });
    const [topicsByScope, setTopicsByScope] = useState({ publico: [], interno_empresa: [] });
    const [selectedTopicByScope, setSelectedTopicByScope] = useState({ publico: '', interno_empresa: '' });
    const [followingTopicId, setFollowingTopicId] = useState(null);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingTopicId, setEditingTopicId] = useState(null);
    const [sanctions, setSanctions] = useState([]);
    const [sanctionAppeals, setSanctionAppeals] = useState([]);
    const [infractions, setInfractions] = useState([]);
    const [adminAlerts, setAdminAlerts] = useState([]);
    const [adminAlertFilter, setAdminAlertFilter] = useState('unread');
    const [adminAlertTypeFilter, setAdminAlertTypeFilter] = useState('all');
    const [infractionScopeFilter, setInfractionScopeFilter] = useState('all');
    const [infractionSearchTerm, setInfractionSearchTerm] = useState('');
    const [appealStatusFilter, setAppealStatusFilter] = useState('open');
    const [appealSearchTerm, setAppealSearchTerm] = useState('');
    const [sanctionScopeFilter, setSanctionScopeFilter] = useState('all');
    const [sanctionSearchTerm, setSanctionSearchTerm] = useState('');
    const [selectedModerationUserId, setSelectedModerationUserId] = useState(null);
    const [selectedInfractionId, setSelectedInfractionId] = useState(null);
    const [selectedSanctionId, setSelectedSanctionId] = useState(null);
    const [selectedThreadId, setSelectedThreadId] = useState(null);
    const [selectedRecipientId, setSelectedRecipientId] = useState('');
    const [postSearchTerm, setPostSearchTerm] = useState('');
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [isTopicComposerModalOpen, setIsTopicComposerModalOpen] = useState(false);
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    const [structureModalTab, setStructureModalTab] = useState('topic');
    const [dmSearchTerm, setDmSearchTerm] = useState('');
    const [postForm, setPostForm] = useState({ title: '', body: '' });
    const [postAttachments, setPostAttachments] = useState([]);
    const [dmForm, setDmForm] = useState({ body: '' });
    const [sanctionForm, setSanctionForm] = useState({
        target_user_id: '',
        sanction_type: 'bloqueo_interno',
        reason: '',
    });
    const [appealDraftsBySanctionId, setAppealDraftsBySanctionId] = useState({});
    const [appealResolutionDraftsById, setAppealResolutionDraftsById] = useState({});
    const [topicForm, setTopicForm] = useState(EMPTY_TOPIC_FORM);
    const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [dmSending, setDmSending] = useState(false);
    const [moderatingPostId, setModeratingPostId] = useState(null);
    const [error, setError] = useState('');
    const [loadWarnings, setLoadWarnings] = useState([]);
    const [loadFailureMap, setLoadFailureMap] = useState({});
    const [selectedLoadWarningKey, setSelectedLoadWarningKey] = useState(null);
    const [showControlPanel, setShowControlPanel] = useState(false);
    const [adminWorkspaceTab, setAdminWorkspaceTab] = useState('overview');
    const [communityUserForm, setCommunityUserForm] = useState(EMPTY_COMMUNITY_USER_FORM);
    const [communityUserSubmitting, setCommunityUserSubmitting] = useState(false);
    const loadRequestRef = useRef(0);
    const loadFailsafeTimerRef = useRef(null);
    const [paises, setPaises] = useState([]);

    const empresaId = selectedEmpresa?.id || user?.empresa_id || null;
    const normalizedRole = (user?.rol || '').toLowerCase();
    const isSuperadmin = normalizedRole === 'superadministrador';
    const isCompanyAdmin = normalizedRole === 'administrador';
    const isCommunityModerator = ['administrador', 'superadministrador'].includes(normalizedRole);
    const canSeeAdminEntry = Boolean(
        isSuperadmin
        || (normalizedRole === 'administrador' && activeTab === 'interno_empresa' && bootstrap?.can_moderate_internal)
    );

    const activeCompanyLabel = bootstrap?.active_company_name || 'Mi empresa';
    const activeScopeLabel = useMemo(() => (
        activeTab === 'interno_empresa'
            ? activeCompanyLabel
            : activeTab === 'publico'
                ? 'Comunidad pública'
                : 'Mensajería directa'
    ), [activeCompanyLabel, activeTab]);

    const canModerateAny = Boolean(bootstrap?.can_moderate_public || bootstrap?.can_moderate_internal);
    const currentMessages = selectedThreadId ? (messagesByThread[selectedThreadId] || []) : [];
    const selectedThread = selectedThreadId ? threads.find((thread) => thread.id === selectedThreadId) || null : null;
    const selectedRecipient = visibleUsers.find((candidate) => candidate.id === Number(selectedRecipientId));
    const selectedModerationUser = adminUsers.find((candidate) => candidate.id === selectedModerationUserId)
        || visibleUsers.find((candidate) => candidate.id === selectedModerationUserId)
        || null;
    const availableSanctionOptions = bootstrap?.is_superadmin
        ? SANCTION_OPTIONS
        : SANCTION_OPTIONS.filter((option) => option.value === 'bloqueo_interno');
    const managementScope = activeTab === 'mensajes_directos' ? 'interno_empresa' : activeTab;
    const currentTopics = useMemo(() => topicsByScope[managementScope] || [], [managementScope, topicsByScope]);
    const currentCategories = useMemo(() => categoriesByScope[managementScope] || [], [categoriesByScope, managementScope]);
    const selectedTopicId = selectedTopicByScope[managementScope];
    const selectedTopic = currentTopics.find((topic) => String(topic.id) === String(selectedTopicId)) || null;
    const canCreateCurrentScopeStructures = managementScope !== 'mensajes_directos';
    const canEditCurrentScopeTopics = managementScope === 'publico'
        ? Boolean(isSuperadmin)
        : Boolean(isSuperadmin || (isCompanyAdmin && bootstrap?.can_moderate_internal));
    const filteredPosts = useMemo(() => {
        const items = posts[activeTab] || [];
        const term = normalizeSearchToken(postSearchTerm);
        if (!term || activeTab === 'mensajes_directos') return items;
        return items.filter((post) =>
            [
                post.title,
                post.body,
                post.author_name,
                post.topic_name,
                post.target_company_name,
            ]
                .filter(Boolean)
                .some((value) => includesNormalized(String(value), term))
        );
    }, [activeTab, postSearchTerm, posts]);
    const filteredThreads = useMemo(() => {
        const term = normalizeSearchToken(dmSearchTerm);
        if (!term) return threads;
        return threads.filter((thread) =>
            [thread.counterpart_name, thread.counterpart_company_name, thread.last_message_preview]
                .filter(Boolean)
                .some((value) => includesNormalized(String(value), term))
        );
    }, [dmSearchTerm, threads]);
    const latestAppealBySanctionId = useMemo(() => {
        const index = {};
        sanctionAppeals.forEach((appeal) => {
            if (!index[appeal.sanction_id]) {
                index[appeal.sanction_id] = appeal;
            }
        });
        return index;
    }, [sanctionAppeals]);
    const appealSummary = useMemo(() => ({
        total: sanctionAppeals.length,
        abiertas: sanctionAppeals.filter((appeal) => appeal.status === 'abierta').length,
        resueltas: sanctionAppeals.filter((appeal) => appeal.status !== 'abierta').length,
    }), [sanctionAppeals]);
    const filteredAppeals = useMemo(
        () => sanctionAppeals.filter((appeal) => {
            if (appealStatusFilter === 'open' && appeal.status !== 'abierta') return false;
            if (appealStatusFilter === 'resolved' && appeal.status === 'abierta') return false;
            if (selectedModerationUserId && appeal.appellant_user_id !== selectedModerationUserId && appeal.sanction_target_user_id !== selectedModerationUserId) {
                return false;
            }
            const term = normalizeSearchToken(appealSearchTerm);
            if (!term) return true;
            return [
                appeal.appellant_user_name,
                appeal.reason,
                appeal.sanction_type,
                appeal.sanction_scope,
                appeal.resolution_note,
            ]
                .filter(Boolean)
                .some((value) => includesNormalized(String(value), term));
        }),
        [sanctionAppeals, appealStatusFilter, appealSearchTerm, selectedModerationUserId],
    );
    const unreadAdminAlertsCount = useMemo(
        () => adminAlerts.filter((alert) => !alert.is_read).length,
        [adminAlerts],
    );
    const adminAlertTypes = useMemo(
        () => Array.from(new Set(adminAlerts.map((alert) => alert.alert_type).filter(Boolean))),
        [adminAlerts],
    );
    const filteredAdminAlerts = useMemo(
        () => adminAlerts.filter((alert) => {
            if (adminAlertFilter !== 'all' && alert.is_read) return false;
            if (adminAlertTypeFilter !== 'all' && alert.alert_type !== adminAlertTypeFilter) return false;
            if (selectedModerationUserId && alert.target_user_id !== selectedModerationUserId) return false;
            return true;
        }),
        [adminAlertFilter, adminAlertTypeFilter, adminAlerts, selectedModerationUserId],
    );
    const infractionSummary = useMemo(() => ({
        total: infractions.length,
        publico: infractions.filter((item) => item.scope === 'publico').length,
        interno_empresa: infractions.filter((item) => item.scope === 'interno_empresa').length,
        escaladas: infractions.filter((item) => Boolean(item.triggered_sanction_id)).length,
    }), [infractions]);
    const filteredInfractions = useMemo(
        () => infractions.filter((infraction) => {
            if (infractionScopeFilter !== 'all' && infraction.scope !== infractionScopeFilter) return false;
            if (selectedModerationUserId && infraction.target_user_id !== selectedModerationUserId) return false;
            const term = normalizeSearchToken(infractionSearchTerm);
            if (!term) return true;
            return [
                infraction.target_user_name,
                infraction.content_excerpt,
                infraction.detected_link,
                infraction.target_empresa_name,
                INFRACTION_TYPE_LABELS[infraction.infraction_type] || infraction.infraction_type,
            ]
                .filter(Boolean)
                .some((value) => includesNormalized(String(value), term));
        }),
        [infractions, infractionScopeFilter, infractionSearchTerm, selectedModerationUserId],
    );
    const sanctionSummary = useMemo(() => ({
        total: sanctions.length,
        active: sanctions.filter((item) => item.is_active).length,
        appealed: sanctions.filter((item) => Boolean(latestAppealBySanctionId[item.id])).length,
    }), [sanctions, latestAppealBySanctionId]);
    const filteredSanctions = useMemo(
        () => sanctions.filter((sanction) => {
            if (sanctionScopeFilter !== 'all' && sanction.scope !== sanctionScopeFilter) return false;
            if (selectedModerationUserId && sanction.target_user_id !== selectedModerationUserId) return false;
            const term = normalizeSearchToken(sanctionSearchTerm);
            if (!term) return true;
            return [
                sanction.target_user_name,
                sanction.reason,
                sanction.sanction_type,
                sanction.target_empresa_name,
            ]
                .filter(Boolean)
                .some((value) => includesNormalized(String(value), term));
        }),
        [sanctions, sanctionScopeFilter, sanctionSearchTerm, selectedModerationUserId],
    );
    const infractionsByTriggeredSanctionId = useMemo(
        () => infractions.reduce((accumulator, infraction) => {
            if (infraction.triggered_sanction_id && !accumulator[infraction.triggered_sanction_id]) {
                accumulator[infraction.triggered_sanction_id] = infraction;
            }
            return accumulator;
        }, {}),
        [infractions],
    );
    const selectedInfraction = useMemo(
        () => infractions.find((item) => item.id === selectedInfractionId) || null,
        [infractions, selectedInfractionId],
    );
    const selectedSanction = useMemo(
        () => sanctions.find((item) => item.id === selectedSanctionId) || null,
        [sanctions, selectedSanctionId],
    );
    const selectedSanctionAppeal = useMemo(
        () => selectedSanction ? latestAppealBySanctionId[selectedSanction.id] || null : null,
        [latestAppealBySanctionId, selectedSanction],
    );
    const selectedSanctionInfraction = useMemo(
        () => selectedSanction ? infractionsByTriggeredSanctionId[selectedSanction.id] || null : null,
        [infractionsByTriggeredSanctionId, selectedSanction],
    );
    const moderationOverview = useMemo(() => ({
        alerts: filteredAdminAlerts.length,
        infractions: filteredInfractions.length,
        appeals: filteredAppeals.length,
        sanctions: filteredSanctions.length,
    }), [filteredAdminAlerts.length, filteredAppeals.length, filteredInfractions.length, filteredSanctions.length]);
    const selectedLoadWarning = useMemo(
        () => loadWarnings.find((item) => item.key === selectedLoadWarningKey) || loadWarnings[0] || null,
        [loadWarnings, selectedLoadWarningKey],
    );
    const currentScopedSearchTerm = activeTab === 'mensajes_directos' ? dmSearchTerm : postSearchTerm;
    const setCurrentScopedSearchTerm = (value) => {
        if (activeTab === 'mensajes_directos') {
            setDmSearchTerm(value);
            return;
        }
        setPostSearchTerm(value);
    };
    const currentScopedSearchPlaceholder = activeTab === 'mensajes_directos'
        ? 'Buscar conversación o usuario...'
        : activeTab === 'interno_empresa'
            ? 'Buscar en Mi Empresa...'
            : 'Buscar en Público...';
    const directoryPosts = useMemo(() => allPostsByScope[activeTab] || [], [activeTab, allPostsByScope]);
    const topicMetricsById = useMemo(() => {
        const index = {};
        currentTopics.forEach((topic) => {
            index[String(topic.id)] = {
                postsCount: 0,
                repliesCount: 0,
                pinnedCount: 0,
                hiddenCount: 0,
                closedCount: 0,
                latestPost: null,
                latestAt: 0,
            };
        });
        directoryPosts.forEach((post) => {
            const topicKey = String(post.topic_id || '');
            if (!index[topicKey]) {
                index[topicKey] = {
                    postsCount: 0,
                    repliesCount: 0,
                    pinnedCount: 0,
                    hiddenCount: 0,
                    closedCount: 0,
                    latestPost: null,
                    latestAt: 0,
                };
            }
            index[topicKey].postsCount += 1;
            index[topicKey].repliesCount += Number(post.replies_count || 0);
            if (post.is_pinned) index[topicKey].pinnedCount += 1;
            if (post.status === 'oculto') index[topicKey].hiddenCount += 1;
            if (post.status === 'cerrado') index[topicKey].closedCount += 1;
            const latestDate = getValidDate(post.last_activity_at || post.created_at);
            const latestAt = latestDate ? latestDate.getTime() : 0;
            if (latestAt >= index[topicKey].latestAt) {
                index[topicKey].latestAt = latestAt;
                index[topicKey].latestPost = post;
            }
        });
        return index;
    }, [currentTopics, directoryPosts]);
    const selectedTopicMetrics = selectedTopic ? (topicMetricsById[String(selectedTopic.id)] || {
        postsCount: 0,
        repliesCount: 0,
        pinnedCount: 0,
        hiddenCount: 0,
        closedCount: 0,
        latestPost: null,
        latestAt: 0,
    }) : null;
    const sortTopicsByFollowAndActivity = useCallback((items) => (
        [...(items || [])].sort((left, right) => {
            const leftFollowing = Boolean(left?.is_following);
            const rightFollowing = Boolean(right?.is_following);
            if (leftFollowing !== rightFollowing) return Number(rightFollowing) - Number(leftFollowing);
            const leftLatestAt = topicMetricsById[String(left.id)]?.latestAt || 0;
            const rightLatestAt = topicMetricsById[String(right.id)]?.latestAt || 0;
            if (leftLatestAt !== rightLatestAt) return rightLatestAt - leftLatestAt;
            return String(left?.nombre || '').localeCompare(String(right?.nombre || ''), 'es', { sensitivity: 'base' });
        })
    ), [topicMetricsById]);
    const orderedCurrentTopics = useMemo(
        () => sortTopicsByFollowAndActivity(currentTopics),
        [currentTopics, sortTopicsByFollowAndActivity],
    );
    const forumScopeAppearance = useMemo(() => getForumScopeAppearance(activeTab), [activeTab]);
    const forumDirectoryRows = useMemo(() => {
        if (activeTab === 'mensajes_directos') return [];

        const categoryMap = new Map();
        currentCategories.forEach((category) => {
            categoryMap.set(String(category.id), {
                id: `category-${category.id}`,
                category,
                topics: [],
            });
        });

        const uncategorizedKey = 'uncategorized';
        currentTopics.forEach((topic) => {
            const key = topic.category_id ? String(topic.category_id) : uncategorizedKey;
            if (!categoryMap.has(key)) {
                categoryMap.set(key, {
                    id: key,
                    category: key === uncategorizedKey ? {
                        id: 'uncategorized',
                        nombre: 'Temas sueltos',
                        descripcion: 'Temas visibles sin categoría explícita.',
                        orden: 9999,
                        topic_count: 0,
                    } : null,
                    topics: [],
                });
            }
            categoryMap.get(key).topics.push(topic);
        });

        const term = normalizeSearchToken(postSearchTerm);
        return Array.from(categoryMap.values())
            .filter((entry) => entry.topics.length > 0)
            .map((entry) => {
                const topics = sortTopicsByFollowAndActivity(entry.topics);
                const aggregate = topics.reduce((accumulator, topic) => {
                    const metrics = topicMetricsById[String(topic.id)] || {};
                    accumulator.postsCount += metrics.postsCount || 0;
                    accumulator.repliesCount += metrics.repliesCount || 0;
                    if (topic.is_following) accumulator.followedCount += 1;
                    if ((metrics.latestAt || 0) >= accumulator.latestAt) {
                        accumulator.latestAt = metrics.latestAt || 0;
                        accumulator.latestPost = metrics.latestPost || null;
                    }
                    return accumulator;
                }, { postsCount: 0, repliesCount: 0, latestAt: 0, latestPost: null, followedCount: 0 });

                return {
                    id: entry.id,
                    category: entry.category,
                    topics,
                    postsCount: aggregate.postsCount,
                    repliesCount: aggregate.repliesCount,
                    latestPost: aggregate.latestPost,
                    latestAt: aggregate.latestAt,
                    followedCount: aggregate.followedCount,
                    hasFollowedTopics: aggregate.followedCount > 0,
                    isActive: topics.some((topic) => String(topic.id) === String(selectedTopicId)),
                };
            })
            .filter((row) => {
                if (!term) return true;
                return [
                    row.category?.nombre,
                    row.category?.descripcion,
                    row.latestPost?.title,
                    row.latestPost?.author_name,
                    ...row.topics.flatMap((topic) => [topic.nombre, topic.descripcion]),
                ]
                    .filter(Boolean)
                    .some((value) => includesNormalized(String(value), term));
            })
            .sort((left, right) => {
                if (left.hasFollowedTopics !== right.hasFollowedTopics) {
                    return Number(right.hasFollowedTopics) - Number(left.hasFollowedTopics);
                }
                if (left.latestAt !== right.latestAt) return right.latestAt - left.latestAt;
                const leftOrder = Number(left.category?.orden ?? 9999);
                const rightOrder = Number(right.category?.orden ?? 9999);
                if (leftOrder !== rightOrder) return leftOrder - rightOrder;
                return String(left.category?.nombre || '').localeCompare(String(right.category?.nombre || ''), 'es', { sensitivity: 'base' });
            });
    }, [activeTab, currentCategories, currentTopics, postSearchTerm, selectedTopicId, sortTopicsByFollowAndActivity, topicMetricsById]);

    const resetTopicForm = () => {
        setTopicForm(EMPTY_TOPIC_FORM);
        setEditingTopicId(null);
    };

    const resetCategoryForm = () => {
        setCategoryForm(EMPTY_CATEGORY_FORM);
        setEditingCategoryId(null);
    };

    const closeStructureModal = () => {
        setIsStructureModalOpen(false);
        resetTopicForm();
        resetCategoryForm();
    };

    const startPostEdit = (post) => {
        setEditingPostId(post.id);
        setEditingPostForm({ title: post.title, body: post.body });
    };

    const resetPostEdit = () => {
        setEditingPostId(null);
        setEditingPostForm({ title: '', body: '' });
    };

    const startReplyEdit = (reply) => {
        setEditingReplyId(reply.id);
        setEditingReplyBody(reply.body);
    };

    const resetReplyEdit = () => {
        setEditingReplyId(null);
        setEditingReplyBody('');
    };

    const loadThreadMessages = async (threadId) => {
        if (!threadId) return;
        const items = await communityApi.getDmThreadMessages(threadId, empresaId);
        setMessagesByThread((current) => ({ ...current, [threadId]: items }));
    };

    const loadReplies = async (postId) => {
        const items = await communityApi.getPostReplies(postId, empresaId);
        setPostRepliesById((current) => ({ ...current, [postId]: items }));
    };

    const loadCommunityData = useCallback(async () => {
        const requestId = loadRequestRef.current + 1;
        loadRequestRef.current = requestId;
        if (loadFailsafeTimerRef.current) {
            window.clearTimeout(loadFailsafeTimerRef.current);
            loadFailsafeTimerRef.current = null;
        }
        setLoading(true);
        setError('');
        setLoadWarnings([]);
        setLoadFailureMap({});
        loadFailsafeTimerRef.current = window.setTimeout(() => {
            if (loadRequestRef.current !== requestId) return;
            const detail = 'La carga inicial de Comunidad tardó demasiado. Revise conectividad, backend o capas bloqueadas y reintente.';
            setLoadWarnings((current) => (
                current.some((item) => item.key === 'global_timeout')
                    ? current
                    : [...current, { key: 'global_timeout', label: LOAD_LAYER_LABELS.global_timeout, detail }]
            ));
            setSelectedLoadWarningKey((current) => current || 'global_timeout');
            setLoadFailureMap((current) => ({ ...current, global_timeout: detail }));
            setError(detail);
            setLoading(false);
        }, COMMUNITY_FAILSAFE_TIMEOUT_MS);
        try {
            const results = await Promise.allSettled([
                withCommunityLoadTimeout(communityApi.getBootstrap(empresaId), 'contexto base'),
                withCommunityLoadTimeout(communityApi.getCategories('publico', empresaId), 'categorías públicas'),
                withCommunityLoadTimeout(communityApi.getCategories('interno_empresa', empresaId), 'categorías internas'),
                withCommunityLoadTimeout(communityApi.getTopics('publico', empresaId), 'temas públicos'),
                withCommunityLoadTimeout(communityApi.getTopics('interno_empresa', empresaId), 'temas internos'),
                    withCommunityLoadTimeout(communityApi.getPosts('publico', empresaId, DEFAULT_FEED_ORDER), 'publicaciones públicas'),
                    withCommunityLoadTimeout(communityApi.getPosts('interno_empresa', empresaId, DEFAULT_FEED_ORDER), 'publicaciones internas'),
                withCommunityLoadTimeout(communityApi.getDmThreads(empresaId), 'mensajes directos'),
                withCommunityLoadTimeout(communityApi.getVisibleUsers(empresaId), 'usuarios visibles'),
                withCommunityLoadTimeout(communityApi.getSanctions(empresaId), 'sanciones'),
                withCommunityLoadTimeout(communityApi.getSanctionAppeals(empresaId), 'apelaciones'),
                isCommunityModerator ? withCommunityLoadTimeout(communityApi.getAdminUsers(empresaId), 'usuarios administrables') : Promise.resolve([]),
                isSuperadmin ? withCommunityLoadTimeout(communityApi.getAdminAlerts(empresaId), 'alertas administrativas') : Promise.resolve([]),
                isSuperadmin ? withCommunityLoadTimeout(communityApi.getInfractions(empresaId), 'infracciones') : Promise.resolve([]),
            ]);
            if (loadRequestRef.current !== requestId) return;
            const [bootstrapResult, publicCategoriesResult, internalCategoriesResult, publicTopicsResult, internalTopicsResult, publicPostsResult, internalPostsResult, dmThreadsResult, usersResult, sanctionsResult, sanctionAppealsResult, adminUsersResult, adminAlertsResult, infractionsResult] = results;
            const bootstrapData = getSettledData(bootstrapResult, null);
            const publicCategories = getSettledData(publicCategoriesResult, []);
            const internalCategories = getSettledData(internalCategoriesResult, []);
            const publicTopics = getSettledData(publicTopicsResult, []);
            const internalTopics = getSettledData(internalTopicsResult, []);
            const publicPosts = getSettledData(publicPostsResult, []);
            const internalPosts = getSettledData(internalPostsResult, []);
            const dmThreads = getSettledData(dmThreadsResult, []);
            const users = getSettledData(usersResult, []);
            const activeSanctions = getSettledData(sanctionsResult, []);
            const activeAppeals = getSettledData(sanctionAppealsResult, []);
            const adminUsersData = getSettledData(adminUsersResult, []);
            const adminAlertsData = getSettledData(adminAlertsResult, []);
            const infractionsData = getSettledData(infractionsResult, []);

            const warningKeys = [
                'bootstrap',
                'categories_public',
                'categories_internal',
                'topics_public',
                'topics_internal',
                'posts_public',
                'posts_internal',
                'dm_threads',
                'visible_users',
                'sanctions',
                'sanction_appeals',
                'admin_users',
                'admin_alerts',
                'infractions',
            ];
            const warnings = results
                .map((result, index) => ({ result, key: warningKeys[index] }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, key }) => ({
                    key,
                    label: LOAD_LAYER_LABELS[key] || 'módulo parcial',
                    detail: getSettledError(result),
                }));

            if (warnings.length > 0) {
                setLoadWarnings(warnings);
                setSelectedLoadWarningKey((current) => (
                    current && warnings.some((item) => item.key === current)
                        ? current
                        : warnings[0]?.key || null
                ));
                setLoadFailureMap(
                    warnings.reduce((accumulator, item) => {
                        accumulator[item.key] = item.detail;
                        return accumulator;
                    }, {})
                );
            }
            if (!bootstrapData) {
                const bootstrapFailure = warnings.find((item) => item.key === 'bootstrap');
                throw new Error(bootstrapFailure?.detail || 'No se pudo inicializar el contexto base de Comunidad.');
            }
            setBootstrap(bootstrapData);
            setCategoriesByScope({ publico: publicCategories, interno_empresa: internalCategories });
            setTopicsByScope({ publico: publicTopics, interno_empresa: internalTopics });
            setPosts({ publico: publicPosts, interno_empresa: internalPosts });
            setAllPostsByScope({ publico: publicPosts, interno_empresa: internalPosts });
            setPostRepliesById({});
            setExpandedRepliesById({});
            setReplyFormsByPostId({});
            setReplyAttachmentsByPostId({});
            setThreads(dmThreads);
            setVisibleUsers(users);
            setSanctions(activeSanctions);
            setSanctionAppeals(activeAppeals);
            setAdminUsers(adminUsersData);
            setAdminAlerts(adminAlertsData);
            setInfractions(infractionsData);
            setSelectedTopicByScope((current) => ({
                publico: current.publico && publicTopics.some((topic) => String(topic.id) === String(current.publico)) ? current.publico : '',
                interno_empresa: current.interno_empresa && internalTopics.some((topic) => String(topic.id) === String(current.interno_empresa)) ? current.interno_empresa : '',
            }));
            if (dmThreads.length > 0) {
                const preferredThreadId = selectedThreadId && dmThreads.some((thread) => thread.id === selectedThreadId)
                    ? selectedThreadId
                    : dmThreads[0].id;
                setSelectedThreadId(preferredThreadId);
                try {
                    const items = await withCommunityLoadTimeout(
                        communityApi.getDmThreadMessages(preferredThreadId, empresaId),
                        'mensajes del hilo activo',
                    );
                    if (loadRequestRef.current !== requestId) return;
                    setMessagesByThread((current) => ({ ...current, [preferredThreadId]: items }));
                } catch (threadError) {
                    if (loadRequestRef.current !== requestId) return;
                    const detail = threadError?.response?.data?.detail || 'No se pudieron cargar los mensajes del hilo activo.';
                    setLoadWarnings((current) => [...current, { key: 'dm_thread_messages', label: 'mensajes del hilo activo', detail }]);
                    setSelectedLoadWarningKey((current) => current || 'dm_thread_messages');
                    setLoadFailureMap((current) => ({ ...current, dm_thread_messages: detail }));
                    setMessagesByThread({});
                }
            } else {
                setSelectedThreadId(null);
                setMessagesByThread({});
            }
        } catch (err) {
            if (loadRequestRef.current !== requestId) return;
            setError(err?.response?.data?.detail || err?.message || 'No se pudo cargar Comunidad.');
        } finally {
            if (loadFailsafeTimerRef.current && loadRequestRef.current === requestId) {
                window.clearTimeout(loadFailsafeTimerRef.current);
                loadFailsafeTimerRef.current = null;
            }
            if (loadRequestRef.current === requestId) {
                setLoading(false);
            }
        }
    }, [empresaId, isCommunityModerator, isSuperadmin, selectedThreadId]);

    useEffect(() => () => {
        if (loadFailsafeTimerRef.current) {
            window.clearTimeout(loadFailsafeTimerRef.current);
        }
    }, []);

    useEffect(() => {
        loadCommunityData();
    }, [empresaId, loadCommunityData]);

    useEffect(() => {
        resetTopicForm();
        resetCategoryForm();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'mensajes_directos' || showControlPanel) {
            setIsTopicModalOpen(false);
            setIsStructureModalOpen(false);
        }
    }, [activeTab, showControlPanel]);

    useEffect(() => {
        if (!canModerateAny) {
            setShowControlPanel(false);
        }
    }, [canModerateAny]);

    useEffect(() => {
        if (!canSeeAdminEntry && showControlPanel) {
            setShowControlPanel(false);
        }
    }, [canSeeAdminEntry, showControlPanel]);

    useEffect(() => {
        if (activeTab === 'mensajes_directos' && adminWorkspaceTab === 'governance') {
            setActiveTab('interno_empresa');
        }
    }, [activeTab, adminWorkspaceTab]);

    useEffect(() => {
        setCommunityUserForm((current) => ({
            ...current,
            empresa_id: empresaId || '',
            rol: 'usuario_comunidad',
        }));
    }, [empresaId, loadCommunityData]);

    useEffect(() => {
        const loadPaises = async () => {
            try {
                const data = await maestrosApi.getPaises();
                setPaises(Array.isArray(data) ? data : []);
            } catch {
                setPaises([]);
            }
        };
        loadPaises();
    }, []);

    const canModeratePost = (post) => {
        if (bootstrap?.is_superadmin) return true;
        return Boolean(
            bootstrap?.can_moderate_internal &&
            post.scope === 'interno_empresa' &&
            post.target_company_id === bootstrap?.active_company_id,
        );
    };

    const handlePublish = async () => {
        if (activeTab === 'mensajes_directos') return;
        if (!selectedTopicId) {
            await appAlert('Seleccione un tema antes de crear una publicación. En Comunidad no se permiten publicaciones fuera de un tema.');
            return;
        }
        if (!postForm.title.trim() || !postForm.body.trim()) return;
        setSubmitting(true);
        setError('');
        try {
            const createdPost = await communityApi.createPost(
                {
                    scope: activeTab,
                    topic_id: selectedTopicId ? Number(selectedTopicId) : null,
                    title: postForm.title,
                    body: postForm.body,
                    allow_replies: true,
                },
                empresaId,
            );
            for (const file of postAttachments) {
                await communityApi.uploadPostAttachment(createdPost.id, file, empresaId);
            }
            setPostForm({ title: '', body: '' });
            setPostAttachments([]);
            await loadCommunityData();
            setIsTopicComposerModalOpen(false);
        } catch (err) {
            setError(err?.response?.data?.detail || 'No se pudo publicar.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTopicChange = async (scope, nextTopicId) => {
        setSelectedTopicByScope((current) => ({ ...current, [scope]: nextTopicId }));
        try {
            const items = nextTopicId
                ? await communityApi.getPostsByTopic(scope, Number(nextTopicId), empresaId, DEFAULT_FEED_ORDER)
                : await communityApi.getPosts(scope, empresaId, DEFAULT_FEED_ORDER);
            setPosts((current) => ({ ...current, [scope]: items }));
            setLoadFailureMap((current) => {
                const key = scope === 'publico' ? 'posts_public' : 'posts_internal';
                const next = { ...current };
                delete next[key];
                return next;
            });
        } catch (err) {
            setError(err?.response?.data?.detail || 'No se pudo filtrar el tema seleccionado.');
        }
    };

    const handleOpenTopicModal = async (scope, nextTopicId) => {
        await handleTopicChange(scope, nextTopicId);
        setIsTopicComposerModalOpen(false);
        setIsTopicModalOpen(Boolean(nextTopicId));
    };

    const handleCloseTopicModal = () => {
        setIsTopicModalOpen(false);
        setIsTopicComposerModalOpen(false);
    };

    const handleOpenTopicComposerModal = () => {
        if (!selectedTopic) return;
        setIsTopicComposerModalOpen(true);
    };

    const handleCloseTopicComposerModal = () => {
        setIsTopicComposerModalOpen(false);
    };

    const handleToggleTopicFollow = async (topic, scope = activeTab) => {
        if (!topic?.id) return;
        setFollowingTopicId(String(topic.id));
        setError('');
        try {
            const updatedTopic = topic.is_following
                ? await communityApi.unfollowTopic(topic.id, empresaId)
                : await communityApi.followTopic(topic.id, empresaId);
            setTopicsByScope((current) => ({
                ...current,
                [scope]: (current[scope] || []).map((item) => (
                    item.id === updatedTopic.id ? { ...item, ...updatedTopic } : item
                )),
            }));
        } catch (err) {
            setError(err?.response?.data?.detail || 'No se pudo actualizar el seguimiento del tema.');
        } finally {
            setFollowingTopicId(null);
        }
    };

    const handleEditTopic = (topic) => {
        setEditingTopicId(topic.id);
        setTopicForm({
            category_id: topic.category_id ? String(topic.category_id) : '',
            nombre: topic.nombre || '',
            descripcion: topic.descripcion || '',
            is_restricted: Boolean(topic.is_restricted),
            user_ids: (topic.member_user_ids || []).map((value) => String(value)),
        });
        setStructureModalTab('topic');
        setIsStructureModalOpen(true);
    };

    const handleEditCategory = (category) => {
        setEditingCategoryId(category.id);
        setCategoryForm({
            nombre: category.nombre || '',
            descripcion: category.descripcion || '',
            orden: category.orden ?? 0,
        });
        setStructureModalTab('category');
        setIsStructureModalOpen(true);
    };

    const handleCreateCategoryFromSurface = () => {
        resetCategoryForm();
        setStructureModalTab('category');
        setIsStructureModalOpen(true);
    };

    const handleCreateTopicFromSurface = (categoryId = '') => {
        resetTopicForm();
        setTopicForm((current) => ({ ...current, category_id: categoryId ? String(categoryId) : '' }));
        setStructureModalTab('topic');
        setIsStructureModalOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.nombre.trim()) return;
        try {
            const payload = {
                scope: managementScope,
                nombre: categoryForm.nombre,
                descripcion: categoryForm.descripcion,
                orden: Number(categoryForm.orden || 0),
            };
            if (editingCategoryId) {
                await communityApi.updateCategory(editingCategoryId, payload, empresaId);
            } else {
                await communityApi.createCategory(payload, empresaId);
            }
            closeStructureModal();
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo guardar la categoría.');
        }
    };

    const handleSaveTopic = async () => {
        if (!topicForm.nombre.trim()) return;
        try {
            const payload = {
                scope: managementScope,
                category_id: topicForm.category_id ? Number(topicForm.category_id) : null,
                nombre: topicForm.nombre,
                descripcion: topicForm.descripcion,
                is_restricted: topicForm.is_restricted,
                user_ids: topicForm.is_restricted ? topicForm.user_ids.map((value) => Number(value)) : [],
            };
            if (editingTopicId) {
                await communityApi.updateTopic(editingTopicId, payload, empresaId);
            } else {
                await communityApi.createTopic(payload, empresaId);
            }
            closeStructureModal();
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo guardar el tema.');
        }
    };

    const handleDeactivateCategory = async (category) => {
        const confirmed = await appConfirm(`¿Desea ocultar la sección "${category.nombre}"?`);
        if (!confirmed) return;
        try {
            await communityApi.updateCategory(category.id, { is_active: false }, empresaId);
            if (editingCategoryId === category.id) {
                resetCategoryForm();
            }
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo ocultar la sección.');
        }
    };

    const handleDeactivateTopic = async (topic) => {
        const confirmed = await appConfirm(`¿Desea ocultar el tema "${topic.nombre}"?`);
        if (!confirmed) return;
        try {
            await communityApi.updateTopic(topic.id, { is_active: false }, empresaId);
            if (editingTopicId === topic.id) {
                resetTopicForm();
            }
            if (String(selectedTopicId) === String(topic.id)) {
                setSelectedTopicByScope((current) => ({ ...current, [managementScope]: '' }));
                setIsTopicModalOpen(false);
            }
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo ocultar el tema.');
        }
    };

    const handleMarkAlertRead = async (alertId) => {
        try {
            await communityApi.markAdminAlertRead(alertId, empresaId);
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo marcar la alerta.');
        }
    };

    const handleMarkAllAlertsRead = async () => {
        try {
            await communityApi.markAllAdminAlertsRead(empresaId);
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudieron marcar todas las alertas.');
        }
    };

    const handleInspectInfraction = (infractionId) => {
        setSelectedInfractionId(infractionId);
        setShowControlPanel(true);
    };

    const handleInspectSanction = (sanctionId) => {
        setSelectedSanctionId(sanctionId);
        setShowControlPanel(true);
    };

    const handleFocusModerationUser = (candidate) => {
        setSelectedModerationUserId(candidate.id);
        setSanctionForm((current) => ({ ...current, target_user_id: String(candidate.id) }));
    };

    const handlePrepareSanctionFromInfraction = (infraction) => {
        if (!infraction?.target_user_id) return;
        const suggestedSanctionType = infraction.scope === 'publico' ? 'bloqueo_publico' : 'bloqueo_interno';
        const suggestedReasonParts = [
            `Seguimiento de infracción: ${INFRACTION_TYPE_LABELS[infraction.infraction_type] || infraction.infraction_type}.`,
            infraction.content_excerpt ? `Extracto: ${infraction.content_excerpt}` : null,
            infraction.detected_link ? `Link detectado: ${infraction.detected_link}` : null,
        ].filter(Boolean);

        setSelectedModerationUserId(infraction.target_user_id);
        setSanctionForm({
            target_user_id: String(infraction.target_user_id),
            sanction_type: suggestedSanctionType,
            reason: suggestedReasonParts.join(' '),
        });
        setShowControlPanel(true);
    };

    const handleResetModerationFilters = () => {
        setSelectedModerationUserId(null);
        setAdminAlertFilter('unread');
        setAdminAlertTypeFilter('all');
        setInfractionScopeFilter('all');
        setInfractionSearchTerm('');
        setAppealStatusFilter('open');
        setAppealSearchTerm('');
        setSanctionScopeFilter('all');
        setSanctionSearchTerm('');
    };

    const handleCreateCommunityUser = async () => {
        if (!communityUserForm.nombre_completo.trim() || !communityUserForm.email.trim() || !communityUserForm.password) return;
        if (communityUserForm.password !== communityUserForm.confirmPassword) {
            await appAlert('Las contraseñas no coinciden.');
            return;
        }
        if (!empresaId) {
            await appAlert('No hay empresa activa para crear el usuario de Comunidad.');
            return;
        }
        setCommunityUserSubmitting(true);
        try {
            const payload = { ...communityUserForm };
            delete payload.confirmPassword;
            await usuariosApi.create({
                ...payload,
                empresa_id: empresaId,
                rol: 'usuario_comunidad',
            }, { empresa_id: empresaId });
            setCommunityUserForm({
                ...EMPTY_COMMUNITY_USER_FORM,
                empresa_id: empresaId,
                rol: 'usuario_comunidad',
            });
            setAdminWorkspaceTab('users');
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo crear el usuario de Comunidad.');
        } finally {
            setCommunityUserSubmitting(false);
        }
    };

    const handleModeratePost = async (post, action) => {
        const labels = {
            ocultar: 'Ocultar',
            cerrar: 'Cerrar',
            publicar: 'Restaurar',
            fijar: 'Fijar',
            desfijar: 'Desfijar',
            eliminar: 'Eliminar',
        };
        const confirmed = await appConfirm({
            title: `${labels[action]} publicación`,
            message: `¿Desea ${labels[action].toLowerCase()} "${post.title}"?`,
            confirmLabel: labels[action],
            tone: action === 'eliminar' ? 'danger' : 'warning',
        });
        if (!confirmed) return;
        setModeratingPostId(post.id);
        try {
            await communityApi.moderatePost(post.id, action, empresaId);
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo moderar la publicación.');
        } finally {
            setModeratingPostId(null);
        }
    };

    const handleToggleReplies = async (postId) => {
        const nextExpanded = !expandedRepliesById[postId];
        setExpandedRepliesById((current) => ({ ...current, [postId]: nextExpanded }));
        if (nextExpanded && !postRepliesById[postId]) {
            try {
                await loadReplies(postId);
            } catch (err) {
                setError(err?.response?.data?.detail || 'No se pudieron cargar las respuestas.');
            }
        }
    };

    const handleReplySubmit = async (post) => {
        const body = (replyFormsByPostId[post.id] || '').trim();
        if (!body) return;
        try {
            const createdReply = await communityApi.createReply(post.id, { body }, empresaId);
            for (const file of replyAttachmentsByPostId[post.id] || []) {
                await communityApi.uploadReplyAttachment(createdReply.id, file, empresaId);
            }
            setReplyFormsByPostId((current) => ({ ...current, [post.id]: '' }));
            setReplyAttachmentsByPostId((current) => ({ ...current, [post.id]: [] }));
            await loadReplies(post.id);
            await loadCommunityData();
            setExpandedRepliesById((current) => ({ ...current, [post.id]: true }));
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo responder la publicación.');
        }
    };

    const handleDeletePostAttachment = async (attachment) => {
        const confirmed = await appConfirm({
            title: 'Eliminar adjunto',
            message: `¿Desea eliminar "${attachment.file_name}"?`,
            confirmLabel: 'Eliminar',
            tone: 'danger',
        });
        if (!confirmed) return;
        try {
            await communityApi.deletePostAttachment(attachment.id, empresaId);
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo eliminar el adjunto.');
        }
    };

    const handleDeleteReplyAttachment = async (postId, attachment) => {
        const confirmed = await appConfirm({
            title: 'Eliminar adjunto',
            message: `¿Desea eliminar "${attachment.file_name}"?`,
            confirmLabel: 'Eliminar',
            tone: 'danger',
        });
        if (!confirmed) return;
        try {
            await communityApi.deleteReplyAttachment(attachment.id, empresaId);
            await loadReplies(postId);
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo eliminar el adjunto.');
        }
    };

    const handleModerateAttachment = async (attachment) => {
        const confirmed = await appConfirm({
            title: 'Retirar adjunto',
            message: `¿Desea retirar "${attachment.file_name}" por moderación?`,
            confirmLabel: 'Retirar',
            tone: 'danger',
        });
        if (!confirmed) return;
        try {
            await communityApi.moderateAttachment(attachment.id, empresaId);
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo retirar el adjunto.');
        }
    };

    const handleSendDm = async () => {
        const recipientId = selectedThread?.counterpart_user_id || Number(selectedRecipientId);
        if (!recipientId || !dmForm.body.trim()) return;
        setDmSending(true);
        setError('');
        try {
            await communityApi.sendDmMessage({
                recipient_user_id: recipientId,
                body: dmForm.body,
            }, empresaId);
            setDmForm({ body: '' });
            const refreshedThreads = await communityApi.getDmThreads(empresaId);
            setThreads(refreshedThreads);
            const resolvedThread = refreshedThreads.find((thread) => thread.counterpart_user_id === recipientId);
            if (resolvedThread) {
                setSelectedThreadId(resolvedThread.id);
                await loadThreadMessages(resolvedThread.id);
            }
        } catch (err) {
            setError(err?.response?.data?.detail || 'No se pudo enviar el mensaje directo.');
        } finally {
            setDmSending(false);
        }
    };

    const handleToggleDmBlock = async () => {
        if (!selectedThread) return;
        const isBlocked = Boolean(selectedThread.blocked_at);
        const canUnblock = Boolean(selectedThread.blocked_by_me);
        const confirmed = await appConfirm({
            title: isBlocked ? 'Reactivar conversación' : 'Bloquear conversación',
            message: isBlocked
                ? `¿Desea reactivar la conversación con ${selectedThread.counterpart_name}?`
                : `¿Desea bloquear la conversación con ${selectedThread.counterpart_name}?`,
            confirmLabel: isBlocked ? 'Reactivar' : 'Bloquear',
            tone: isBlocked ? 'warning' : 'danger',
        });
        if (!confirmed) return;
        try {
            if (isBlocked) {
                if (!canUnblock) {
                    await appAlert('Solo el usuario que bloqueó esta conversación puede reactivarla.');
                    return;
                }
                await communityApi.unblockDmThread(selectedThread.id, empresaId);
            } else {
                await communityApi.blockDmThread(selectedThread.id, empresaId);
            }
            const refreshedThreads = await communityApi.getDmThreads(empresaId);
            setThreads(refreshedThreads);
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo actualizar el estado de la conversación.');
        }
    };

    const handleCreateSanction = async () => {
        if (!sanctionForm.target_user_id || !sanctionForm.reason.trim()) return;
        const option = SANCTION_OPTIONS.find((item) => item.value === sanctionForm.sanction_type);
        if (!option) return;
        try {
            await communityApi.createSanction({
                target_user_id: Number(sanctionForm.target_user_id),
                sanction_type: sanctionForm.sanction_type,
                scope: option.scope,
                reason: sanctionForm.reason,
                target_empresa_id: option.scope === 'interno_empresa' ? empresaId : null,
            }, empresaId);
            setSanctionForm((current) => ({ ...current, target_user_id: '', reason: '' }));
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo registrar la sanción.');
        }
    };

    const handleCreateAppeal = async (sanctionId) => {
        const reason = (appealDraftsBySanctionId[sanctionId] || '').trim();
        if (!reason) return;
        try {
            await communityApi.createSanctionAppeal({ sanction_id: sanctionId, reason }, empresaId);
            setAppealDraftsBySanctionId((current) => ({ ...current, [sanctionId]: '' }));
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo registrar la apelación.');
        }
    };

    const handleUpdatePost = async (post) => {
        if (!editingPostForm.title.trim() || !editingPostForm.body.trim()) return;
        try {
            await communityApi.updatePost(post.id, { title: editingPostForm.title, body: editingPostForm.body }, empresaId);
            resetPostEdit();
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo actualizar la publicación.');
        }
    };

    const handleDeletePostByAuthor = async (post) => {
        const confirmed = await appConfirm({
            title: 'Eliminar publicación propia',
            message: 'Esta acción ocultará su publicación del feed. No podrá recuperarla desde la interfaz.',
            confirmLabel: 'Eliminar',
            tone: 'danger',
        });
        if (!confirmed) return;
        try {
            await communityApi.deletePost(post.id, empresaId);
            resetPostEdit();
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo eliminar la publicación.');
        }
    };

    const handleUpdateReply = async (reply) => {
        if (!editingReplyBody.trim()) return;
        try {
            await communityApi.updateReply(reply.id, { body: editingReplyBody }, empresaId);
            resetReplyEdit();
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo actualizar la respuesta.');
        }
    };

    const handleDeleteReplyByAuthor = async (reply) => {
        const confirmed = await appConfirm({
            title: 'Eliminar respuesta propia',
            message: 'Esta acción ocultará su respuesta de la conversación.',
            confirmLabel: 'Eliminar',
            tone: 'danger',
        });
        if (!confirmed) return;
        try {
            await communityApi.deleteReply(reply.id, empresaId);
            resetReplyEdit();
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo eliminar la respuesta.');
        }
    };

    const handleResolveAppeal = async (appealId, status) => {
        const resolutionNote = (appealResolutionDraftsById[appealId] || '').trim();
        if (!resolutionNote) return;
        try {
            await communityApi.resolveSanctionAppeal(appealId, { status, resolution_note: resolutionNote }, empresaId);
            setAppealResolutionDraftsById((current) => ({ ...current, [appealId]: '' }));
            await loadCommunityData();
        } catch (err) {
            await appAlert(err?.response?.data?.detail || 'No se pudo resolver la apelación.');
        }
    };

    const renderPostList = (items, scope) => {
        const scopeFailure = scope === 'publico'
            ? loadFailureMap.posts_public
            : scope === 'interno_empresa'
                ? loadFailureMap.posts_internal
                : '';

        if (scopeFailure) {
            return (
                <Card className="rounded-[2rem] border border-amber-200 bg-amber-50 shadow-none">
                    <CardContent className="p-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-500">Carga parcial</p>
                        <h3 className="mt-3 text-xl font-black uppercase tracking-tight text-[#1A1A1A]">
                            El feed no se pudo cargar, pero el módulo sigue operativo
                        </h3>
                        <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600">
                            La capa de publicaciones devolvió: <span className="font-black">{scopeFailure}</span>. Puede reintentar sin perder el resto del contexto.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <button
                                onClick={loadCommunityData}
                                className="rounded-2xl bg-[#1A1A1A] px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#F39200]"
                            >
                                Reintentar carga
                            </button>
                            <span className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                                {scope === 'publico' ? 'Foro público' : 'Foro interno'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (items.length === 0) {
            return (
                <Card className="rounded-[2rem] border border-dashed border-zinc-200 bg-white shadow-none">
                    <CardContent className="p-10 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Sin actividad</p>
                        <h3 className="mt-3 text-xl font-black uppercase tracking-tight text-[#1A1A1A]">
                            Aún no hay publicaciones en este ámbito
                        </h3>
                        <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-zinc-500">
                            {scope === 'publico'
                                ? 'Empiece con una publicación visible para toda la comunidad autenticada o cambie a un tema concreto para revisar mejor el espacio.'
                                : 'El área interna todavía no tiene conversación visible para la empresa activa. Puede abrir un tema o publicar el primer hilo operativo.'}
                        </p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="space-y-4">
                {items.map((post) => (
                    <Card key={post.id} className="rounded-[2rem] border-none bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
                        <CardContent className="p-7">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">
                                        {post.author_name}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-300">
                                        {new Date(post.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        title={post.scope === 'publico' ? 'Ámbito público' : 'Ámbito interno de empresa'}
                                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${post.scope === 'publico' ? 'border-blue-200 bg-blue-50 text-[#136191]' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
                                    >
                                        {post.scope === 'publico' ? <Globe2 className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                                    </span>
                                    <span
                                        title={`Estado: ${post.status}`}
                                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${post.status === 'publicado' ? 'border-zinc-200 bg-zinc-50 text-zinc-500' : post.status === 'cerrado' ? 'border-orange-200 bg-orange-50 text-[#F39200]' : 'border-red-200 bg-red-50 text-red-600'}`}
                                    >
                                        <Info className="h-3.5 w-3.5" />
                                    </span>
                                    {post.topic_name && (
                                        <span
                                            title={`Tema: ${post.topic_name}`}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#136191]/20 bg-blue-50 text-[#136191]"
                                        >
                                            <MessageSquareMore className="h-3.5 w-3.5" />
                                        </span>
                                    )}
                                    {post.category_name && (
                                        <span
                                            title={`Sección: ${post.category_name}`}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500"
                                        >
                                            <LayoutGrid className="h-3.5 w-3.5" />
                                        </span>
                                    )}
                                    {post.target_company_name && (
                                        <span
                                            title={`Empresa objetivo: ${post.target_company_name}`}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500"
                                        >
                                            <Building2 className="h-3.5 w-3.5" />
                                        </span>
                                    )}
                                    {post.is_pinned && (
                                        <span
                                            title="Publicación fijada"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700"
                                        >
                                            <Pin className="h-3.5 w-3.5" />
                                        </span>
                                    )}
                                </div>
                            </div>

                            {editingPostId === post.id ? (
                                <div className="mt-4 space-y-3 rounded-[1.5rem] border border-[#136191]/15 bg-blue-50/60 p-4">
                                    <input
                                        value={editingPostForm.title}
                                        onChange={(event) => setEditingPostForm((current) => ({ ...current, title: event.target.value }))}
                                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none"
                                    />
                                    <textarea
                                        value={editingPostForm.body}
                                        onChange={(event) => setEditingPostForm((current) => ({ ...current, body: event.target.value }))}
                                        rows={4}
                                        className="w-full rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none resize-none"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleUpdatePost(post)}
                                            disabled={!editingPostForm.title.trim() || !editingPostForm.body.trim()}
                                            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#136191] px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                        <button
                                            onClick={resetPostEdit}
                                            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h3 className="mt-4 text-2xl font-black tracking-tight text-[#1A1A1A]">
                                        {renderTextWithMentions(post.title, post.mentions)}
                                    </h3>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        {canModeratePost(post) && post.status !== 'cerrado' && (
                                            <button
                                                onClick={() => handleModeratePost(post, 'cerrar')}
                                                disabled={moderatingPostId === post.id}
                                                title="Cerrar publicación"
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-[#F39200] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Lock className="h-4 w-4" />
                                            </button>
                                        )}
                                        {canModeratePost(post) && post.status !== 'oculto' && (
                                            <button
                                                onClick={() => handleModeratePost(post, 'ocultar')}
                                                disabled={moderatingPostId === post.id}
                                                title="Ocultar publicación"
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <ShieldMinus className="h-4 w-4" />
                                            </button>
                                        )}
                                        {canModeratePost(post) && (
                                            <button
                                                onClick={() => handleModeratePost(post, post.is_pinned ? 'desfijar' : 'fijar')}
                                                disabled={moderatingPostId === post.id}
                                                title={post.is_pinned ? 'Desfijar publicación' : 'Fijar publicación'}
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-[#136191] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Pin className="h-4 w-4" />
                                            </button>
                                        )}
                                        {canModeratePost(post) && (
                                            <button
                                                onClick={() => handleModeratePost(post, 'eliminar')}
                                                disabled={moderatingPostId === post.id}
                                                title="Eliminar publicación"
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                        {post.can_edit && (
                                            <button
                                                onClick={() => startPostEdit(post)}
                                                title="Editar publicación propia"
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#136191]/20 bg-blue-50 text-[#136191]"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                        )}
                                        {post.can_delete && (
                                            <button
                                                onClick={() => handleDeletePostByAuthor(post)}
                                                title="Eliminar publicación propia"
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-600">
                                        {renderTextWithMentions(post.body, post.mentions)}
                                    </p>
                                    {post.scope !== 'publico' && renderAttachmentList(post.attachments, post.can_edit
                                        ? { onClick: handleDeletePostAttachment, title: 'Eliminar adjunto propio' }
                                        : canModeratePost(post)
                                            ? { onClick: handleModerateAttachment, title: 'Retirar adjunto por moderación' }
                                            : null)}
                                </>
                            )}

                            <div className="mt-5 border-t border-zinc-100 pt-4">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleToggleReplies(post.id)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            handleToggleReplies(post.id);
                                        }
                                    }}
                                    className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3 transition-colors hover:border-[#136191]/20 hover:bg-blue-50/60"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">
                                            {post.replies_count} respuestas
                                        </p>
                                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">
                                            {expandedRepliesById[post.id]
                                                ? 'Pulse para ocultar respuestas y formulario'
                                                : 'Pulse para abrir respuestas y formulario'}
                                        </p>
                                    </div>
                                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500">
                                        <ChevronDown
                                            className={`h-4 w-4 transition-transform ${expandedRepliesById[post.id] ? 'rotate-180 text-[#136191]' : ''}`}
                                        />
                                    </div>
                                </div>
                                {expandedRepliesById[post.id] && (
                                    <div className="mt-4 space-y-3">
                                        {(postRepliesById[post.id] || []).length === 0 ? (
                                            <div className="rounded-[1.25rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">
                                                Aún no hay respuestas visibles.
                                            </div>
                                        ) : (
                                            (postRepliesById[post.id] || []).map((reply) => (
                                                <div key={reply.id} className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                            {reply.author_name}
                                                        </span>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300">
                                                            {new Date(reply.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {editingReplyId === reply.id ? (
                                                        <div className="mt-3 space-y-3">
                                                            <textarea
                                                                value={editingReplyBody}
                                                                onChange={(event) => setEditingReplyBody(event.target.value)}
                                                                rows={3}
                                                                className="w-full rounded-[1rem] border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none resize-none"
                                                            />
                                                            <div className="flex gap-3">
                                                                <button
                                                                    onClick={() => handleUpdateReply(reply)}
                                                                    disabled={!editingReplyBody.trim()}
                                                                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#136191] px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Guardar
                                                                </button>
                                                                <button
                                                                    onClick={resetReplyEdit}
                                                                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-600">
                                                                {renderTextWithMentions(reply.body, reply.mentions)}
                                                            </p>
                                                            {post.scope !== 'publico' && renderAttachmentList(reply.attachments, reply.can_edit
                                                                ? { onClick: (attachment) => handleDeleteReplyAttachment(post.id, attachment), title: 'Eliminar adjunto propio' }
                                                                : canModeratePost(post)
                                                                    ? { onClick: handleModerateAttachment, title: 'Retirar adjunto por moderación' }
                                                                    : null)}
                                                        </>
                                                    )}
                                                    {(reply.can_edit || reply.can_delete) && (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {reply.can_edit && (
                                                                <button
                                                                    onClick={() => startReplyEdit(reply)}
                                                                    className="rounded-full border border-[#136191]/20 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]"
                                                                >
                                                                    Editar propia
                                                                </button>
                                                            )}
                                                            {reply.can_delete && (
                                                                <button
                                                                    onClick={() => handleDeleteReplyByAuthor(reply)}
                                                                    className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-600"
                                                                >
                                                                    Eliminar propia
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                        {post.allow_replies && post.status === 'publicado' && (
                                            <div className="rounded-[1.35rem] border border-zinc-200 bg-white p-4">
                                                <textarea
                                                    value={replyFormsByPostId[post.id] || ''}
                                                    onChange={(event) => setReplyFormsByPostId((current) => ({ ...current, [post.id]: event.target.value }))}
                                                    rows={3}
                                                    placeholder="Escriba una respuesta..."
                                                    className="w-full rounded-[1rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 outline-none resize-none"
                                                />
                                                {activeTab !== 'publico' && (
                                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                            <Paperclip className="h-3.5 w-3.5" />
                                                            Adjuntar
                                                            <input
                                                                type="file"
                                                                multiple
                                                                onChange={(event) => setReplyAttachmentsByPostId((current) => ({
                                                                    ...current,
                                                                    [post.id]: Array.from(event.target.files || []),
                                                                }))}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        {(replyAttachmentsByPostId[post.id] || []).length > 0 && (
                                                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">
                                                                {(replyAttachmentsByPostId[post.id] || []).length} adjunto(s) listo(s)
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="mt-3 flex items-center justify-between gap-3">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">
                                                        Use `@handle`
                                                    </p>
                                                    <button
                                                        onClick={() => handleReplySubmit(post)}
                                                        disabled={!String(replyFormsByPostId[post.id] || '').trim()}
                                                        className="rounded-2xl bg-[#1A1A1A] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#F39200] disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Responder
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    const renderTopicComposer = () => {
        if (!selectedTopic) return null;
        return (
            <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
                <CardContent className="p-6 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#136191]">Nueva publicación</p>
                            <h3 className="mt-2 text-lg font-black tracking-tight text-[#1A1A1A]">Publicar en {selectedTopic.nombre}</h3>
                            <p className="mt-1 text-sm font-medium text-zinc-500">
                                Este modal concentra la conversación y la creación de entradas del tema activo.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                {activeTab === 'publico' ? 'Público' : activeCompanyLabel}
                            </span>
                            {selectedTopic.is_restricted && (
                                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">
                                    {selectedTopic.member_count} miembros
                                </span>
                            )}
                        </div>
                    </div>
                    <input
                        value={postForm.title}
                        onChange={(event) => setPostForm((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Título de la publicación"
                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none"
                    />
                    <textarea
                        value={postForm.body}
                        onChange={(event) => setPostForm((current) => ({ ...current, body: event.target.value }))}
                        rows={5}
                        placeholder="Escriba aquí el contenido de la publicación..."
                        className="w-full rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-800 outline-none resize-none"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            {activeTab !== 'publico' && (
                                <>
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                        <Paperclip className="h-3.5 w-3.5" />
                                        Adjuntar
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(event) => setPostAttachments(Array.from(event.target.files || []))}
                                            className="hidden"
                                        />
                                    </label>
                                    {postAttachments.length > 0 && (
                                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">
                                            {postAttachments.length} adjunto(s) listo(s)
                                        </span>
                                    )}
                                </>
                            )}
                            {activeTab === 'publico' && (
                                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                    Público sin adjuntos
                                </span>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">
                                Use `@handle`
                            </span>
                        </div>
                        <button
                            onClick={handlePublish}
                            disabled={submitting || !postForm.title.trim() || !postForm.body.trim() || !selectedTopicId}
                            className="inline-flex items-center justify-center rounded-2xl bg-[#1A1A1A] px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#F39200] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Publicar
                        </button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderAdminWorkspace = () => (
        <section className="space-y-6">
            <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                <CardContent className="p-6 md:p-7">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div className="max-w-3xl space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#136191]">Zona administrativa</p>
                            <h2 className="text-3xl font-black uppercase tracking-tight text-[#1A1A1A]">Control de Comunidad</h2>
                            <p className="text-sm font-medium leading-relaxed text-zinc-500">
                                Aquí vive la gobernanza del módulo: temas, categorías, usuarios asignados, altas de `usuario_comunidad`, sanciones y apelaciones.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {ADMIN_WORKSPACE_TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = adminWorkspaceTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setAdminWorkspaceTab(tab.id)}
                                        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition-colors ${isActive ? 'border-[#136191] bg-[#136191] text-white' : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setShowControlPanel(false)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700"
                            >
                                Volver al feed
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {adminWorkspaceTab === 'overview' && (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                        <CardContent className="p-6 space-y-5">
                            <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Frentes administrativos</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <button onClick={() => setAdminWorkspaceTab('governance')} className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5 text-left transition-colors hover:border-[#136191]/30 hover:bg-blue-50/50">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Gobernanza</p>
                                    <p className="mt-2 text-lg font-black text-[#1A1A1A]">{currentTopics.length} temas</p>
                                    <p className="mt-2 text-sm font-medium text-zinc-500">Categorías, temas y membresía restringida.</p>
                                </button>
                                <button onClick={() => setAdminWorkspaceTab('users')} className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5 text-left transition-colors hover:border-[#136191]/30 hover:bg-blue-50/50">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Usuarios</p>
                                    <p className="mt-2 text-lg font-black text-[#1A1A1A]">{adminUsers.length} usuarios</p>
                                    <p className="mt-2 text-sm font-medium text-zinc-500">Asignación, estado y alta de `usuario_comunidad`.</p>
                                </button>
                                <button onClick={() => setAdminWorkspaceTab('moderation')} className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5 text-left transition-colors hover:border-[#136191]/30 hover:bg-blue-50/50">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Moderación</p>
                                    <p className="mt-2 text-lg font-black text-[#1A1A1A]">{sanctionSummary.active} sanciones activas</p>
                                    <p className="mt-2 text-sm font-medium text-zinc-500">Sanciones, apelaciones, alertas e infracciones.</p>
                                </button>
                                <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Contexto activo</p>
                                    <p className="mt-2 text-lg font-black text-[#1A1A1A]">{bootstrap?.active_company_name || 'Sin empresa'}</p>
                                    <p className="mt-2 text-sm font-medium text-zinc-500">Las decisiones administrativas respetan la empresa activa y el ámbito permitido.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                        <CardContent className="p-6 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Indicadores</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Categorías</p><p className="mt-2 text-2xl font-black text-[#1A1A1A]">{currentCategories.length}</p></div>
                                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Apelaciones abiertas</p><p className="mt-2 text-2xl font-black text-[#1A1A1A]">{appealSummary.abiertas}</p></div>
                                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Alertas</p><p className="mt-2 text-2xl font-black text-[#1A1A1A]">{adminAlerts.length}</p></div>
                                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Usuarios Comunidad</p><p className="mt-2 text-2xl font-black text-[#1A1A1A]">{adminUsers.filter((item) => String(item.rol || '').toLowerCase() === 'usuario_comunidad').length}</p></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {adminWorkspaceTab === 'governance' && (
                <div className="space-y-6">
                    <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                        <CardContent className="p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Ámbito de gobernanza</p>
                                    <p className="mt-1 text-sm font-medium text-zinc-500">Administre público e interno desde la misma zona.</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => setActiveTab('publico')} className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${managementScope === 'publico' ? 'border-[#F39200] bg-orange-50 text-[#F39200]' : 'border-zinc-200 bg-white text-zinc-500'}`}>Público</button>
                                    <button onClick={() => setActiveTab('interno_empresa')} className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${managementScope === 'interno_empresa' ? 'border-[#136191] bg-blue-50 text-[#136191]' : 'border-zinc-200 bg-white text-zinc-500'}`}>Mi empresa</button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid gap-6 xl:grid-cols-2">
                        <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                            <CardContent className="p-6 space-y-4">
                                <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">{editingCategoryId ? 'Editar categoría' : 'Categorías'}</h3>
                                <input value={categoryForm.nombre} onChange={(event) => setCategoryForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Nombre de la categoría" className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none" />
                                <textarea value={categoryForm.descripcion} onChange={(event) => setCategoryForm((current) => ({ ...current, descripcion: event.target.value }))} rows={2} placeholder="Descripción breve..." className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-800 outline-none resize-none" />
                                <input type="number" value={categoryForm.orden} onChange={(event) => setCategoryForm((current) => ({ ...current, orden: event.target.value }))} placeholder="Orden" className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none" />
                                <div className="flex gap-3">
                                    <button onClick={handleSaveCategory} disabled={!categoryForm.nombre.trim() || !canEditCurrentScopeTopics} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#136191] disabled:cursor-not-allowed disabled:opacity-50">{editingCategoryId ? 'Guardar categoría' : 'Crear categoría'}</button>
                                    {editingCategoryId && <button onClick={resetCategoryForm} className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700">Cancelar</button>}
                                </div>
                                <div className="space-y-2">
                                    {currentCategories.length === 0 ? <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">No hay categorías creadas en este ámbito.</div> : currentCategories.map((category) => (
                                        <div key={category.id} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-black text-[#1A1A1A]">{category.nombre}</p>
                                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{category.topic_count} temas · orden {category.orden}</p>
                                                </div>
                                                {canEditCurrentScopeTopics && <button onClick={() => handleEditCategory(category)} className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">Editar</button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                            <CardContent className="p-6 space-y-4">
                                <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">{editingTopicId ? 'Editar tema' : 'Temas'}</h3>
                                <input value={topicForm.nombre} onChange={(event) => setTopicForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Nombre del tema" className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none" />
                                <AnimatedSelect value={topicForm.category_id} onChange={(event) => setTopicForm((current) => ({ ...current, category_id: event.target.value }))} className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none">
                                    <option value="">Sin categoría</option>
                                    {currentCategories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
                                </AnimatedSelect>
                                <textarea value={topicForm.descripcion} onChange={(event) => setTopicForm((current) => ({ ...current, descripcion: event.target.value }))} rows={3} placeholder="Descripción breve..." className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-800 outline-none resize-none" />
                                <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700"><input type="checkbox" checked={topicForm.is_restricted} onChange={(event) => setTopicForm((current) => ({ ...current, is_restricted: event.target.checked, user_ids: event.target.checked ? current.user_ids : [] }))} className="h-4 w-4" />Tema restringido</label>
                                {topicForm.is_restricted && <AnimatedSelect multiple value={topicForm.user_ids} onChange={(event) => setTopicForm((current) => ({ ...current, user_ids: Array.from(event.target.selectedOptions).map((option) => option.value) }))} className="min-h-[132px] w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 outline-none">{adminUsers.map((candidate) => <option key={candidate.id} value={candidate.id}>@{candidate.community_handle} · {candidate.nombre_completo} · {candidate.rol}</option>)}</AnimatedSelect>}
                                <div className="flex gap-3">
                                    <button onClick={handleSaveTopic} disabled={!topicForm.nombre.trim() || !canEditCurrentScopeTopics} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#136191] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50">{editingTopicId ? 'Guardar cambios' : 'Crear tema'}</button>
                                    {editingTopicId && <button onClick={resetTopicForm} className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700">Cancelar</button>}
                                </div>
                                <div className="space-y-2">
                                    {orderedCurrentTopics.length === 0 ? <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">No hay temas creados en este ámbito.</div> : orderedCurrentTopics.map((topic) => (
                                        <div key={topic.id} className={`rounded-[1.35rem] border px-4 py-3 ${String(selectedTopicId) === String(topic.id) ? 'border-[#F39200] bg-orange-50' : 'border-zinc-200 bg-zinc-50'}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <button onClick={() => handleTopicChange(managementScope, String(topic.id))} className="flex-1 text-left">
                                                    <p className="text-sm font-black text-[#1A1A1A]">{topic.nombre}</p>
                                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{topic.category_name ? `${topic.category_name} · ` : ''}{topic.is_restricted ? `${topic.member_count} miembros restringidos` : 'Abierto'}</p>
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleTopicFollow(topic, managementScope)}
                                                        disabled={followingTopicId === String(topic.id)}
                                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${topic.is_following ? 'border-amber-300 bg-amber-50 text-[#F39200]' : 'border-zinc-200 bg-white text-zinc-400 hover:border-amber-200 hover:text-[#F39200]'} disabled:cursor-not-allowed disabled:opacity-50`}
                                                        title={topic.is_following ? 'Dejar de seguir tema' : 'Seguir tema'}
                                                    >
                                                        <Star className="h-4 w-4" fill={topic.is_following ? 'currentColor' : 'none'} />
                                                    </button>
                                                    {canEditCurrentScopeTopics && <button onClick={() => handleEditTopic(topic)} className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">Editar</button>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {adminWorkspaceTab === 'users' && (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                        <CardContent className="p-6 space-y-5">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Crear usuario Comunidad</h3>
                                <p className="text-sm font-medium text-zinc-500">Alta específica de `usuario_comunidad` sin salir del módulo.</p>
                            </div>
                            <PersonnelFormFields formData={communityUserForm} setFormData={setCommunityUserForm} isSuperAdmin={bootstrap?.is_superadmin} hidePolicies paises={paises} availableRoles={['usuario_comunidad']} />
                            <button onClick={handleCreateCommunityUser} disabled={communityUserSubmitting || !communityUserForm.nombre_completo.trim() || !communityUserForm.email.trim() || !communityUserForm.password} className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1A1A1A] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#F39200] disabled:cursor-not-allowed disabled:opacity-50">
                                {communityUserSubmitting ? 'Creando usuario...' : 'Crear usuario Comunidad'}
                            </button>
                        </CardContent>
                    </Card>
                    <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Usuarios asignados</h3>
                            {adminUsers.length === 0 ? <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">No hay usuarios visibles en este contexto.</div> : adminUsers.map((candidate) => (
                                <div key={candidate.id} className={`rounded-[1.35rem] border p-4 ${selectedModerationUserId === candidate.id ? 'border-[#136191]/20 bg-blue-50/60' : 'border-zinc-200 bg-zinc-50'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-black text-[#1A1A1A]">{candidate.nombre_completo}</p>
                                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">@{candidate.community_handle} · {candidate.rol} · {candidate.community_state}</p>
                                        </div>
                                        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{candidate.last_active_at ? new Date(candidate.last_active_at).toLocaleString() : 'Sin conexión'}</span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button onClick={() => { handleFocusModerationUser(candidate); setAdminWorkspaceTab('moderation'); }} className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">Revisar en moderación</button>
                                        {candidate.active_sanctions?.length > 0 && <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">{candidate.active_sanctions.length} sanciones activas</span>}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}

            {adminWorkspaceTab === 'moderation' && (
                <div className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                            <CardContent className="p-6 space-y-4">
                                <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Sanciones</h3>
                                <AnimatedSelect value={sanctionForm.target_user_id} onChange={(event) => setSanctionForm((current) => ({ ...current, target_user_id: event.target.value }))} className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none"><option value="">Seleccionar usuario</option>{visibleUsers.map((candidate) => <option key={candidate.id} value={candidate.id}>@{candidate.community_handle} · {candidate.nombre_completo}</option>)}</AnimatedSelect>
                                <AnimatedSelect value={sanctionForm.sanction_type} onChange={(event) => setSanctionForm((current) => ({ ...current, sanction_type: event.target.value }))} className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none">{availableSanctionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</AnimatedSelect>
                                <textarea value={sanctionForm.reason} onChange={(event) => setSanctionForm((current) => ({ ...current, reason: event.target.value }))} rows={4} placeholder="Motivo de la sanción..." className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-800 outline-none resize-none" />
                                <button onClick={handleCreateSanction} disabled={!sanctionForm.target_user_id || !sanctionForm.reason.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#F39200] disabled:cursor-not-allowed disabled:opacity-50"><Lock className="h-4 w-4" />Aplicar sanción</button>
                            </CardContent>
                        </Card>
                        <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Resumen de moderación</p>
                                        <p className="mt-1 text-sm font-medium text-zinc-500">Panel operativo único para sanciones, alertas y apelaciones.</p>
                                    </div>
                                    <button onClick={handleResetModerationFilters} className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Restablecer filtros</button>
                                </div>
                                <div className="grid gap-3 md:grid-cols-4">
                                    <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Alertas</p><p className="mt-2 text-2xl font-black text-[#1A1A1A]">{moderationOverview.alerts}</p></div>
                                    <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Infracciones</p><p className="mt-2 text-2xl font-black text-[#1A1A1A]">{moderationOverview.infractions}</p></div>
                                    <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Apelaciones</p><p className="mt-2 text-2xl font-black text-[#1A1A1A]">{moderationOverview.appeals}</p></div>
                                    <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Sanciones</p><p className="mt-2 text-2xl font-black text-[#1A1A1A]">{moderationOverview.sanctions}</p></div>
                                </div>
                                {selectedModerationUser && <div className="rounded-[1.35rem] border border-[#136191]/15 bg-blue-50/60 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Foco de moderación</p><p className="mt-2 text-sm font-black text-[#1A1A1A]">{selectedModerationUser.nombre_completo}</p></div>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </section>
    );

    return (
        <div data-community-workspace="true" className="h-full min-h-0 overflow-hidden bg-[#F8FAFC]">
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-white/85 px-6 py-4 backdrop-blur-md md:px-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/servicios')} className="rounded-xl p-2 transition-colors hover:bg-zinc-100">
                            <ArrowLeft className="h-5 w-5 text-zinc-500" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900">Comunidad</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F39200]">
                                Público, empresa activa y mensajes directos
                            </p>
                        </div>
                    </div>
                    {bootstrap && (
                        <div className="hidden items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 md:flex">
                            <ShieldCheck className="h-4 w-4 text-[#F39200]" />
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Contexto activo</p>
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-700">
                                    {bootstrap.active_company_name || 'Sin empresa'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <main className="flex-1 min-h-0 overflow-hidden p-6 md:p-8 xl:p-10">
                    <div className="mx-auto flex h-full max-w-[1480px] flex-col gap-6 overflow-hidden">
                        <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:p-7">
                            <div className="space-y-5">
                                <div className="max-w-3xl space-y-2">
                                    <h2 className="text-3xl font-black uppercase tracking-tight text-[#1A1A1A]">{activeScopeLabel}</h2>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {TABS.map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeTab === tab.id && !showControlPanel;
                                        const basePalette = tab.id === 'publico'
                                            ? 'border-amber-200 bg-amber-50 text-[#F39200] hover:border-amber-300 hover:bg-amber-100'
                                            : tab.id === 'interno_empresa'
                                                ? 'border-blue-200 bg-blue-50 text-[#136191] hover:border-blue-300 hover:bg-blue-100'
                                                : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100';
                                        const activePalette = tab.id === 'publico'
                                            ? 'border-[#F39200] bg-[#F39200] text-white'
                                            : tab.id === 'interno_empresa'
                                                ? 'border-[#136191] bg-[#136191] text-white'
                                                : 'border-[#1A1A1A] bg-[#1A1A1A] text-white';
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => {
                                                    setShowControlPanel(false);
                                                    setActiveTab(tab.id);
                                                }}
                                                title={tab.id === 'interno_empresa' ? activeCompanyLabel : tab.label}
                                                aria-label={tab.id === 'interno_empresa' ? activeCompanyLabel : tab.label}
                                                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${isActive ? activePalette : basePalette}`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </button>
                                        );
                                    })}
                                    {canSeeAdminEntry && (
                                        <button
                                            onClick={() => {
                                                if (!isSuperadmin) {
                                                    setActiveTab('interno_empresa');
                                                }
                                                setShowControlPanel(true);
                                            }}
                                            title="Administración"
                                            aria-label="Administración"
                                            className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${showControlPanel ? 'border-[#7C3AED] bg-[#7C3AED] text-white' : 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100'}`}
                                        >
                                            <ShieldCheck className="h-5 w-5" />
                                        </button>
                                    )}
                                    {activeTab !== 'mensajes_directos' && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleCreateCategoryFromSurface}
                                                title="Crear sección"
                                                aria-label="Crear sección"
                                                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100"
                                            >
                                                <LayoutGrid className="h-5 w-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCreateTopicFromSurface()}
                                                title="Crear tema"
                                                aria-label="Crear tema"
                                                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </button>
                                        </>
                                    )}
                                    <div className="group relative">
                                        <button
                                            type="button"
                                            title={activeTab === 'mensajes_directos' ? 'Buscar en mensajes directos' : activeTab === 'interno_empresa' ? 'Buscar en Mi Empresa' : 'Buscar en Público'}
                                            aria-label={activeTab === 'mensajes_directos' ? 'Buscar en mensajes directos' : activeTab === 'interno_empresa' ? 'Buscar en Mi Empresa' : 'Buscar en Público'}
                                            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 focus-visible:text-emerald-800"
                                        >
                                            <Search className="h-5 w-5" />
                                        </button>
                                        <div className="pointer-events-none absolute left-0 top-[calc(100%+0.6rem)] z-20 w-80 max-w-[calc(100vw-3rem)] translate-y-1 rounded-[1.35rem] border border-zinc-200 bg-white p-4 opacity-0 shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition-all duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#136191]">Búsqueda contextual</p>
                                            <input
                                                value={currentScopedSearchTerm}
                                                onChange={(event) => setCurrentScopedSearchTerm(event.target.value)}
                                                placeholder={currentScopedSearchPlaceholder}
                                                className="mt-3 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="group relative">
                                        <button
                                            type="button"
                                            title="Métricas"
                                            aria-label="Métricas"
                                            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-100 focus-visible:text-sky-800"
                                        >
                                            <Info className="h-5 w-5" />
                                        </button>
                                        <div className="pointer-events-none absolute left-0 top-[calc(100%+0.6rem)] z-20 w-64 translate-y-1 rounded-[1.35rem] border border-[#F4D58D] bg-white p-4 opacity-0 shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition-all duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F39200]">Resumen</p>
                                            <div className="mt-3 grid gap-2">
                                                <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Publicaciones</span>
                                                    <span className="text-sm font-black text-[#1A1A1A]">{activeTab === 'mensajes_directos' ? filteredThreads.length : directoryPosts.length}</span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">{activeTab === 'mensajes_directos' ? 'Hilos' : 'Temas'}</span>
                                                    <span className="text-sm font-black text-[#1A1A1A]">{activeTab === 'mensajes_directos' ? threads.length : currentTopics.length}</span>
                                                </div>
                                                {activeTab !== 'mensajes_directos' && (
                                                    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Bloques</span>
                                                        <span className="text-sm font-black text-[#1A1A1A]">{forumDirectoryRows.length}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                        {error && (
                            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                {error}
                            </div>
                        )}
                        {loadWarnings.length > 0 && (
                            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3">
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Carga parcial</p>
                                            <p className="mt-2 text-sm font-semibold text-amber-800">
                                                Comunidad no quedó vacía: fallaron solo algunas capas secundarias.
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-amber-700">
                                                {loadWarnings.map((item) => item.label).join(', ')}.
                                            </p>
                                        </div>
                                        <button
                                            onClick={loadCommunityData}
                                            className="rounded-2xl border border-amber-300 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 transition-colors hover:border-amber-400"
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {loadWarnings.map((item) => (
                                            <button
                                                key={item.key}
                                                onClick={() => setSelectedLoadWarningKey(item.key)}
                                                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${selectedLoadWarning?.key === item.key ? 'border-amber-400 bg-white text-amber-700' : 'border-amber-200 bg-amber-100/70 text-amber-700'}`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedLoadWarning && (
                                        <div className="rounded-[1.25rem] border border-amber-200 bg-white/80 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Detalle de capa</p>
                                            <p className="mt-2 text-sm font-black text-amber-900">{selectedLoadWarning.label}</p>
                                            <p className="mt-2 text-sm font-medium leading-relaxed text-amber-800">{selectedLoadWarning.detail}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-none">
                                <CardContent className="p-10 text-center text-sm font-semibold text-zinc-500">
                                    Cargando Comunidad...
                                </CardContent>
                            </Card>
                        ) : showControlPanel && canModerateAny ? (
                            renderAdminWorkspace()
                        ) : activeTab === 'mensajes_directos' ? (
                            <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                                <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                    <CardContent className="p-6 space-y-5">
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Nuevo DM</h3>
                                            <p className="mt-2 text-sm font-medium text-zinc-500">
                                                El listado se restringe a usuarios activos del contexto de empresa actual.
                                            </p>
                                        </div>
                                        <AnimatedSelect
                                            value={selectedRecipientId}
                                            onChange={(event) => setSelectedRecipientId(event.target.value)}
                                            className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none"
                                        >
                                            <option value="">Seleccionar usuario</option>
                                            {visibleUsers.map((candidate) => (
                                                <option key={candidate.id} value={candidate.id}>
                                                    @{candidate.community_handle} · {candidate.nombre_completo} · {candidate.rol}
                                                </option>
                                            ))}
                                        </AnimatedSelect>
                                        <div className="space-y-3">
                                            {filteredThreads.length === 0 ? (
                                                <div className="rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">
                                                    No hay conversaciones que coincidan con la búsqueda actual.
                                                </div>
                                            ) : (
                                                filteredThreads.map((thread) => (
                                                    <button
                                                        key={thread.id}
                                                        onClick={async () => {
                                                            setSelectedThreadId(thread.id);
                                                            setSelectedRecipientId(String(thread.counterpart_user_id));
                                                            await loadThreadMessages(thread.id);
                                                        }}
                                                        className={`w-full rounded-[1.5rem] border p-4 text-left transition-colors ${selectedThreadId === thread.id ? 'border-[#F39200] bg-orange-50' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-black text-[#1A1A1A]">{thread.counterpart_name}</p>
                                                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{thread.counterpart_company_name}</p>
                                                            </div>
                                                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                {thread.messages_count}
                                                            </span>
                                                        </div>
                                                        {thread.blocked_at && (
                                                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
                                                                {thread.blocked_by_me ? 'Bloqueada por usted' : `Bloqueada por ${thread.blocked_by_name || 'la contraparte'}`}
                                                            </p>
                                                        )}
                                                        {thread.last_message_preview && (
                                                            <p className="mt-3 line-clamp-2 text-sm font-medium text-zinc-500">
                                                                {thread.last_message_preview}
                                                            </p>
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                    <CardContent className="flex h-full min-h-[640px] flex-col p-6">
                                        <div className="border-b border-zinc-100 pb-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">
                                                        {selectedThread ? selectedThread.counterpart_name : selectedRecipient ? selectedRecipient.nombre_completo : 'Mensajes directos'}
                                                    </h3>
                                                    <p className="mt-2 text-sm font-medium text-zinc-500">
                                                        {selectedThread ? selectedThread.counterpart_company_name : 'Seleccione un hilo o inicie una conversación nueva.'}
                                                    </p>
                                                    {(selectedThread || selectedRecipient) && (
                                                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">
                                                            Use `@{(selectedThread ? visibleUsers.find((candidate) => candidate.id === selectedThread.counterpart_user_id) : selectedRecipient)?.community_handle || 'handle'}`
                                                        </p>
                                                    )}
                                                    {selectedThread?.blocked_at && (
                                                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
                                                            {selectedThread.blocked_by_me
                                                                ? 'Usted bloqueó este hilo. No admite nuevos mensajes hasta reactivarlo.'
                                                                : `Este hilo fue bloqueado por ${selectedThread.blocked_by_name || selectedThread.counterpart_name}.`}
                                                        </p>
                                                    )}
                                                </div>
                                                {selectedThread && (
                                                    <button
                                                        onClick={handleToggleDmBlock}
                                                        disabled={Boolean(selectedThread.blocked_at && !selectedThread.blocked_by_me)}
                                                        className={`rounded-2xl border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${selectedThread.blocked_at ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'} disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400`}
                                                    >
                                                        {selectedThread.blocked_at
                                                            ? selectedThread.blocked_by_me
                                                                ? 'Reactivar hilo'
                                                                : 'Bloqueado por contraparte'
                                                            : 'Bloquear hilo'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-4 overflow-y-auto py-4">
                                            {currentMessages.length === 0 ? (
                                                <div className="rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm font-medium text-zinc-500">
                                                    Aún no hay mensajes cargados en este hilo.
                                                </div>
                                            ) : (
                                                currentMessages.map((message) => {
                                                    const isOwn = message.author_user_id === user?.id;
                                                    return (
                                                        <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[72%] rounded-[1.5rem] px-4 py-3 ${isOwn ? 'bg-[#1A1A1A] text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                                                                    {message.author_name}
                                                                </p>
                                                                <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed">
                                                                    {renderTextWithMentions(message.body, message.mentions)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                        <div className="border-t border-zinc-100 pt-4">
                                            <textarea
                                                value={dmForm.body}
                                                onChange={(event) => setDmForm({ body: event.target.value })}
                                                rows={4}
                                                placeholder="Escriba aquí el mensaje directo..."
                                                disabled={Boolean(selectedThread?.blocked_at)}
                                                className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-800 outline-none transition-colors focus:border-[#F39200] resize-none disabled:cursor-not-allowed disabled:opacity-60"
                                            />
                                            <div className="mt-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-[11px] font-semibold text-zinc-400">
                                                        {selectedThread ? 'Respuesta al hilo activo' : selectedRecipient ? `Nuevo mensaje a ${selectedRecipient.nombre_completo}` : 'Seleccione un usuario o un hilo'}
                                                    </p>
                                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">
                                                        Menciones básicas con `@handle`
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={handleSendDm}
                                                    disabled={dmSending || !dmForm.body.trim() || (!selectedThread && !selectedRecipientId) || Boolean(selectedThread?.blocked_at)}
                                                    className="inline-flex items-center gap-2 rounded-2xl bg-[#1A1A1A] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#F39200] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Send className="h-4 w-4" />
                                                    Enviar
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>
                        ) : (
                            <div className="grid gap-6">
                                <section className="space-y-6">
                                    <Card className={`overflow-hidden rounded-[2rem] border shadow-[0_18px_50px_rgba(15,23,42,0.04)] ${forumScopeAppearance.shell}`}>
                                        <CardContent className="p-0">
                                        <div className={`divide-y bg-white/70 ${forumScopeAppearance.divider}`}>
                                                {forumDirectoryRows.length === 0 ? (
                                                    <div className="px-6 py-10 text-center">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Sin estructura visible</p>
                                                        <p className="mt-3 text-sm font-medium text-zinc-500">
                                                            Todavía no hay categorías o temas cargados para este ámbito.
                                                        </p>
                                                    </div>
                                                ) : forumDirectoryRows.map((row) => {
                                                    const { Icon, accent } = getForumCategoryPresentation(activeTab, row.category?.nombre, row.isActive);
                                                    return (
                                                    <div key={row.id} className={`px-6 py-5 ${row.isActive ? 'bg-gradient-to-r from-orange-50/90 via-[#FFF8E8] to-white' : 'bg-transparent'}`}>
                                                        <div className="space-y-4">
                                                            <div className="flex gap-4">
                                                                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] border ${accent}`}>
                                                                    <Icon className="h-5 w-5" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <p className="text-xl font-black tracking-tight text-[#1A1A1A]">{row.category?.nombre || 'Temas sin categoría'}</p>
                                                                            {row.isActive && (
                                                                                <span className="rounded-full border border-[#F39200]/20 bg-[#F39200]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#F39200]">
                                                                                    activo
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleCreateTopicFromSurface(row.category?.id || '')}
                                                                                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-800"
                                                                            >
                                                                                <Plus className="h-3.5 w-3.5" />
                                                                                Tema
                                                                            </button>
                                                                            {row.category?.id && canEditCurrentScopeTopics && (
                                                                                <>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleEditCategory(row.category)}
                                                                                        className="inline-flex items-center gap-1 rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]"
                                                                                    >
                                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                                        Editar sección
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleDeactivateCategory(row.category)}
                                                                                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600"
                                                                                    >
                                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                                        Ocultar
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-500">
                                                                        {row.category?.descripcion || 'Bloque operativo del foro para concentrar conversación y publicaciones por tema.'}
                                                                    </p>
                                                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                                                        <span>{row.topics.length} temas</span>
                                                                        <span>{row.postsCount} posts</span>
                                                                        <span>{row.repliesCount} respuestas</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="grid gap-2">
                                                                {row.topics.map((topic) => {
                                                                    const isSelectedTopic = String(selectedTopicId) === String(topic.id);
                                                                    return (
                                                                    <div
                                                                        key={topic.id}
                                                                        className={`flex items-center gap-2 rounded-[1.1rem] border px-2 py-2 transition-colors ${isSelectedTopic ? 'border-[#136191] bg-[#136191] text-white shadow-[0_12px_24px_rgba(19,97,145,0.18)]' : 'border-zinc-200 bg-white text-zinc-600 hover:border-[#136191]/30 hover:bg-blue-50/40 hover:text-[#136191]'}`}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleTopicFollow(topic, activeTab)}
                                                                            disabled={followingTopicId === String(topic.id)}
                                                                            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${isSelectedTopic ? 'border-white/20 bg-white/10 text-white' : topic.is_following ? 'border-amber-300 bg-amber-50 text-[#F39200]' : 'border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-amber-200 hover:text-[#F39200]'} disabled:cursor-not-allowed disabled:opacity-50`}
                                                                            title={topic.is_following ? 'Dejar de seguir tema' : 'Seguir tema'}
                                                                        >
                                                                            <Star className="h-4 w-4" fill={topic.is_following ? 'currentColor' : 'none'} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenTopicModal(activeTab, String(topic.id))}
                                                                            className="flex min-w-0 flex-1 items-center justify-between gap-3 px-2 py-1 text-left"
                                                                        >
                                                                            <p className="min-w-0 truncate text-[11px] font-black uppercase tracking-[0.14em]">{topic.nombre}</p>
                                                                            {isSelectedTopic && <Flame className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />}
                                                                        </button>
                                                                        {canEditCurrentScopeTopics && (
                                                                            <div className="flex shrink-0 gap-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleEditTopic(topic)}
                                                                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${isSelectedTopic ? 'border-white/20 bg-white/10 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}
                                                                                >
                                                                                    <Pencil className="h-4 w-4" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleDeactivateTopic(topic)}
                                                                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${isSelectedTopic ? 'border-white/20 bg-white/10 text-white' : 'border-red-200 bg-red-50 text-red-600'}`}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )})}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )})}
                                            </div>
                                        </CardContent>
                                    </Card>

                                </section>
                                {canModerateAny && showControlPanel && (
                                    <>
                                        <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <UsersRound className="h-5 w-5 text-[#136191]" />
                                                    <div>
                                                        <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">
                                                            {editingCategoryId ? 'Editar categoría' : 'Categorías'}
                                                        </h3>
                                                        <p className="text-sm font-medium text-zinc-500">
                                                            Organice el foro por bloques antes de crear temas.
                                                        </p>
                                                    </div>
                                                </div>
                                                <input
                                                    value={categoryForm.nombre}
                                                    onChange={(event) => setCategoryForm((current) => ({ ...current, nombre: event.target.value }))}
                                                    placeholder="Nombre de la categoría"
                                                    className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none"
                                                />
                                                <textarea
                                                    value={categoryForm.descripcion}
                                                    onChange={(event) => setCategoryForm((current) => ({ ...current, descripcion: event.target.value }))}
                                                    rows={2}
                                                    placeholder="Descripción breve..."
                                                    className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-800 outline-none resize-none"
                                                />
                                                <input
                                                    type="number"
                                                    value={categoryForm.orden}
                                                    onChange={(event) => setCategoryForm((current) => ({ ...current, orden: event.target.value }))}
                                                    placeholder="Orden"
                                                    className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none"
                                                />
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={handleSaveCategory}
                                                        disabled={!categoryForm.nombre.trim() || !canEditCurrentScopeTopics}
                                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#136191] disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {editingCategoryId ? 'Guardar categoría' : 'Crear categoría'}
                                                    </button>
                                                    {editingCategoryId && (
                                                        <button
                                                            onClick={resetCategoryForm}
                                                            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    {currentCategories.length === 0 ? (
                                                        <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">
                                                            No hay categorías creadas en este ámbito.
                                                        </div>
                                                    ) : currentCategories.map((category) => (
                                                        <div
                                                            key={category.id}
                                                            className="w-full rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-left"
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="text-sm font-black text-[#1A1A1A]">{category.nombre}</p>
                                                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                                        {category.topic_count} temas · orden {category.orden}
                                                                    </p>
                                                                    {category.descripcion && (
                                                                        <p className="mt-2 text-xs font-medium leading-relaxed text-zinc-500">
                                                                            {category.descripcion}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {canEditCurrentScopeTopics && (
                                                                    <button
                                                                        onClick={() => handleEditCategory(category)}
                                                                        className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191] transition-colors hover:border-[#136191] hover:bg-blue-50"
                                                                    >
                                                                        Editar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <UsersRound className="h-5 w-5 text-[#136191]" />
                                                    <div>
                                                        <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">
                                                            {editingTopicId ? 'Editar tema' : 'Temas'}
                                                        </h3>
                                                        <p className="text-sm font-medium text-zinc-500">
                                                            Cree temas y gestione su membresía restringida por usuario.
                                                        </p>
                                                    </div>
                                                </div>
                                                <input
                                                    value={topicForm.nombre}
                                                    onChange={(event) => setTopicForm((current) => ({ ...current, nombre: event.target.value }))}
                                                    placeholder="Nombre del tema"
                                                    className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none"
                                                />
                                                <AnimatedSelect
                                                    value={topicForm.category_id}
                                                    onChange={(event) => setTopicForm((current) => ({ ...current, category_id: event.target.value }))}
                                                    className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none"
                                                >
                                                    <option value="">Sin categoría</option>
                                                    {currentCategories.map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.nombre}
                                                        </option>
                                                    ))}
                                                </AnimatedSelect>
                                                <textarea
                                                    value={topicForm.descripcion}
                                                    onChange={(event) => setTopicForm((current) => ({ ...current, descripcion: event.target.value }))}
                                                    rows={3}
                                                    placeholder="Descripción breve..."
                                                    className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-800 outline-none resize-none"
                                                />
                                                <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={topicForm.is_restricted}
                                                        onChange={(event) => setTopicForm((current) => ({
                                                            ...current,
                                                            is_restricted: event.target.checked,
                                                            user_ids: event.target.checked ? current.user_ids : [],
                                                        }))}
                                                        className="h-4 w-4"
                                                    />
                                                    Tema restringido
                                                </label>
                                                {topicForm.is_restricted && (
                                                    <AnimatedSelect
                                                        multiple
                                                        value={topicForm.user_ids}
                                                        onChange={(event) => setTopicForm((current) => ({
                                                            ...current,
                                                            user_ids: Array.from(event.target.selectedOptions).map((option) => option.value),
                                                        }))}
                                                        className="min-h-[132px] w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 outline-none"
                                                    >
                                                        {adminUsers.map((candidate) => (
                                                            <option key={candidate.id} value={candidate.id}>
                                                                @{candidate.community_handle} · {candidate.nombre_completo} · {candidate.rol}
                                                            </option>
                                                        ))}
                                                    </AnimatedSelect>
                                                )}
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={handleSaveTopic}
                                                        disabled={!topicForm.nombre.trim() || !canEditCurrentScopeTopics}
                                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#136191] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {editingTopicId ? 'Guardar cambios' : 'Crear tema'}
                                                    </button>
                                                    {editingTopicId && (
                                                        <button
                                                            onClick={resetTopicForm}
                                                            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    {orderedCurrentTopics.length === 0 ? (
                                                        <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">
                                                            No hay temas creados en este ámbito.
                                                        </div>
                                                    ) : orderedCurrentTopics.map((topic) => (
                                                        <div
                                                            key={topic.id}
                                                            className={`w-full rounded-[1.35rem] border px-4 py-3 text-left transition-colors ${String(selectedTopicId) === String(topic.id) ? 'border-[#F39200] bg-orange-50' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300'}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <button
                                                                    onClick={() => handleTopicChange(activeTab, String(topic.id))}
                                                                    className="flex-1 text-left"
                                                                >
                                                                    <p className="text-sm font-black text-[#1A1A1A]">{topic.nombre}</p>
                                                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                                        {topic.category_name ? `${topic.category_name} · ` : ''}{topic.is_restricted ? `${topic.member_count} miembros restringidos` : 'Abierto'}
                                                                    </p>
                                                                    {topic.descripcion && (
                                                                        <p className="mt-2 text-xs font-medium leading-relaxed text-zinc-500">
                                                                            {topic.descripcion}
                                                                        </p>
                                                                    )}
                                                                </button>
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleTopicFollow(topic, activeTab)}
                                                                        disabled={followingTopicId === String(topic.id)}
                                                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${topic.is_following ? 'border-amber-300 bg-amber-50 text-[#F39200]' : 'border-zinc-200 bg-white text-zinc-400 hover:border-amber-200 hover:text-[#F39200]'} disabled:cursor-not-allowed disabled:opacity-50`}
                                                                        title={topic.is_following ? 'Dejar de seguir tema' : 'Seguir tema'}
                                                                    >
                                                                        <Star className="h-4 w-4" fill={topic.is_following ? 'currentColor' : 'none'} />
                                                                    </button>
                                                                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                        {topic.scope === 'publico' ? 'Público' : 'Interno'}
                                                                    </span>
                                                                    {canEditCurrentScopeTopics && (
                                                                        <button
                                                                            onClick={() => handleEditTopic(topic)}
                                                                            className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191] transition-colors hover:border-[#136191] hover:bg-blue-50"
                                                                        >
                                                                            Editar
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <ShieldMinus className="h-5 w-5 text-[#F39200]" />
                                                    <div>
                                                        <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Sanciones</h3>
                                                        <p className="text-sm font-medium text-zinc-500">
                                                            Solo administradores dentro de su ámbito.
                                                        </p>
                                                    </div>
                                                </div>
                                                <AnimatedSelect
                                                    value={sanctionForm.target_user_id}
                                                    onChange={(event) => setSanctionForm((current) => ({ ...current, target_user_id: event.target.value }))}
                                                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none"
                                                >
                                                    <option value="">Seleccionar usuario</option>
                                                    {visibleUsers.map((candidate) => (
                                                        <option key={candidate.id} value={candidate.id}>
                                                            @{candidate.community_handle} · {candidate.nombre_completo}
                                                        </option>
                                                    ))}
                                                </AnimatedSelect>
                                                <AnimatedSelect
                                                    value={sanctionForm.sanction_type}
                                                    onChange={(event) => setSanctionForm((current) => ({ ...current, sanction_type: event.target.value }))}
                                                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none"
                                                >
                                                    {availableSanctionOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </AnimatedSelect>
                                                <textarea
                                                    value={sanctionForm.reason}
                                                    onChange={(event) => setSanctionForm((current) => ({ ...current, reason: event.target.value }))}
                                                    rows={4}
                                                    placeholder="Motivo de la sanción..."
                                                    className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-800 outline-none transition-colors focus:border-[#F39200] resize-none"
                                                />
                                                <button
                                                    onClick={handleCreateSanction}
                                                    disabled={!sanctionForm.target_user_id || !sanctionForm.reason.trim()}
                                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#F39200] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Lock className="h-4 w-4" />
                                                    Aplicar sanción
                                                </button>
                                            </CardContent>
                                        </Card>
                                        <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Usuarios y estado</h3>
                                                        <p className="text-sm font-medium text-zinc-500">
                                                            Seleccione un usuario para enfocar la revisión de moderación.
                                                        </p>
                                                    </div>
                                                    {selectedModerationUser && (
                                                        <button
                                                            onClick={() => setSelectedModerationUserId(null)}
                                                            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500"
                                                        >
                                                            Limpiar foco: {selectedModerationUser.nombre_completo}
                                                        </button>
                                                    )}
                                                </div>
                                                {adminUsers.length === 0 ? (
                                                    <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">
                                                        No hay usuarios visibles en este contexto.
                                                    </div>
                                                ) : (
                                                    adminUsers.slice(0, 10).map((candidate) => (
                                                        <div key={candidate.id} className={`rounded-[1.35rem] border p-4 ${selectedModerationUserId === candidate.id ? 'border-[#136191]/20 bg-blue-50/60' : 'border-zinc-200 bg-zinc-50'}`}>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="text-sm font-black text-[#1A1A1A]">{candidate.nombre_completo}</p>
                                                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                                        {candidate.rol} · {candidate.community_state}
                                                                    </p>
                                                                </div>
                                                                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                    {candidate.last_active_at ? new Date(candidate.last_active_at).toLocaleString() : 'Sin conexión'}
                                                                </span>
                                                            </div>
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <button
                                                                    onClick={() => handleFocusModerationUser(candidate)}
                                                                    className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]"
                                                                >
                                                                    {selectedModerationUserId === candidate.id ? 'Usuario enfocado' : 'Revisar en moderación'}
                                                                </button>
                                                                {candidate.active_sanctions?.length > 0 && (
                                                                    <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">
                                                                        {candidate.active_sanctions.length} sanciones activas
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </CardContent>
                                        </Card>
                                        {bootstrap?.is_superadmin && (
                                            <>
                                                {selectedModerationUser && (
                                                    <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                                        <CardContent className="p-6 space-y-4">
                                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Foco de moderación</p>
                                                                    <p className="mt-1 text-sm font-black text-[#1A1A1A]">{selectedModerationUser.nombre_completo}</p>
                                                                    <p className="mt-1 text-xs font-medium text-zinc-500">
                                                                        Las listas de infracciones, sanciones y apelaciones se filtran contra este usuario.
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => setSelectedModerationUserId(null)}
                                                                    className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500"
                                                                >
                                                                    Quitar foco
                                                                </button>
                                                            </div>
                                                            <div className="grid gap-3 md:grid-cols-4">
                                                                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Alertas</p>
                                                                    <p className="mt-2 text-2xl font-black text-[#1A1A1A]">{filteredAdminAlerts.length}</p>
                                                                </div>
                                                                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Infracciones</p>
                                                                    <p className="mt-2 text-2xl font-black text-[#1A1A1A]">{filteredInfractions.length}</p>
                                                                </div>
                                                                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Apelaciones</p>
                                                                    <p className="mt-2 text-2xl font-black text-[#1A1A1A]">{filteredAppeals.length}</p>
                                                                </div>
                                                                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Sanciones</p>
                                                                    <p className="mt-2 text-2xl font-black text-[#1A1A1A]">{filteredSanctions.length}</p>
                                                                </div>
                                                            </div>
                                                            {selectedModerationUser.active_sanctions?.length > 0 && (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {selectedModerationUser.active_sanctions.map((sanctionType) => (
                                                                        <span
                                                                            key={sanctionType}
                                                                            className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600"
                                                                        >
                                                                            {sanctionType}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                )}
                                                <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                                    <CardContent className="p-6 space-y-4">
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Resumen de moderación</p>
                                                                <p className="mt-1 text-sm font-medium text-zinc-500">
                                                                    Lectura consolidada del panel con los filtros actuales.
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={handleResetModerationFilters}
                                                                className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500"
                                                            >
                                                                Restablecer filtros
                                                            </button>
                                                        </div>
                                                        <div className="grid gap-3 md:grid-cols-4">
                                                            <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Alertas visibles</p>
                                                                <p className="mt-2 text-2xl font-black text-[#1A1A1A]">{moderationOverview.alerts}</p>
                                                            </div>
                                                            <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Infracciones visibles</p>
                                                                <p className="mt-2 text-2xl font-black text-[#1A1A1A]">{moderationOverview.infractions}</p>
                                                            </div>
                                                            <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Apelaciones visibles</p>
                                                                <p className="mt-2 text-2xl font-black text-[#1A1A1A]">{moderationOverview.appeals}</p>
                                                            </div>
                                                            <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Sanciones visibles</p>
                                                                <p className="mt-2 text-2xl font-black text-[#1A1A1A]">{moderationOverview.sanctions}</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                                    <CardContent className="p-6 space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <BellRing className="h-5 w-5 text-red-500" />
                                                            <div>
                                                                <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Alertas de infracción</h3>
                                                                <p className="text-sm font-medium text-zinc-500">
                                                                    Notificaciones automáticas para superadministración.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <button
                                                                onClick={() => setAdminAlertFilter('unread')}
                                                                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${adminAlertFilter === 'unread' ? 'border-red-200 bg-red-50 text-red-600' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                            >
                                                                No leídas ({unreadAdminAlertsCount})
                                                            </button>
                                                            <button
                                                                onClick={() => setAdminAlertFilter('all')}
                                                                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${adminAlertFilter === 'all' ? 'border-[#136191]/20 bg-blue-50 text-[#136191]' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                            >
                                                                Todas ({adminAlerts.length})
                                                            </button>
                                                            {unreadAdminAlertsCount > 0 && (
                                                                <button
                                                                    onClick={handleMarkAllAlertsRead}
                                                                    className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600"
                                                                >
                                                                    Marcar todas
                                                                </button>
                                                            )}
                                                            {adminAlertTypes.length > 0 && (
                                                                <>
                                                                    <button
                                                                        onClick={() => setAdminAlertTypeFilter('all')}
                                                                        className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${adminAlertTypeFilter === 'all' ? 'border-[#136191]/20 bg-blue-50 text-[#136191]' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                                    >
                                                                        Tipos: todos
                                                                    </button>
                                                                    {adminAlertTypes.map((alertType) => (
                                                                        <button
                                                                            key={alertType}
                                                                            onClick={() => setAdminAlertTypeFilter(alertType)}
                                                                            className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${adminAlertTypeFilter === alertType ? 'border-[#136191]/20 bg-blue-50 text-[#136191]' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                                        >
                                                                            {ADMIN_ALERT_TYPE_LABELS[alertType] || alertType}
                                                                        </button>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </div>
                                                        {filteredAdminAlerts.length === 0 ? (
                                                            <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">
                                                                No hay alertas para el filtro actual.
                                                            </div>
                                                        ) : (
                                                            filteredAdminAlerts.slice(0, 12).map((alert) => (
                                                                <div key={alert.id} className={`rounded-[1.35rem] border p-4 ${alert.is_read ? 'border-zinc-200 bg-zinc-50' : 'border-red-200 bg-red-50/60'}`}>
                                                                    <p className="text-sm font-black text-[#1A1A1A]">{alert.title}</p>
                                                                    <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">{alert.message}</p>
                                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${alert.is_read ? 'border-zinc-200 bg-white text-zinc-500' : 'border-red-200 bg-white text-red-600'}`}>
                                                                            {alert.is_read ? 'Leída' : 'No leída'}
                                                                        </span>
                                                                        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                            {ADMIN_ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                                                                        </span>
                                                                        {alert.target_empresa_name && (
                                                                            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                                {alert.target_empresa_name}
                                                                            </span>
                                                                        )}
                                                                        {alert.infraction_id && (
                                                                            <button
                                                                                onClick={() => handleInspectInfraction(alert.infraction_id)}
                                                                                className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]"
                                                                            >
                                                                                Ver infracción
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {!alert.is_read && (
                                                                        <button
                                                                            onClick={() => handleMarkAlertRead(alert.id)}
                                                                            className="mt-3 rounded-full border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600"
                                                                        >
                                                                            Marcar leída
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </CardContent>
                                                </Card>
                                                <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                                    <CardContent className="p-6 space-y-4">
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div>
                                                                <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Infracciones recientes</h3>
                                                                <p className="text-sm font-medium text-zinc-500">
                                                                    Filtros operativos para lectura rápida sin salir del panel.
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                                    Total {infractionSummary.total}
                                                                </span>
                                                                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">
                                                                    Público {infractionSummary.publico}
                                                                </span>
                                                                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                                                                    Interno {infractionSummary.interno_empresa}
                                                                </span>
                                                                <span className="rounded-full border border-[#136191]/20 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">
                                                                    Escaladas {infractionSummary.escaladas}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <button
                                                                onClick={() => setInfractionScopeFilter('all')}
                                                                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${infractionScopeFilter === 'all' ? 'border-[#136191]/20 bg-blue-50 text-[#136191]' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                            >
                                                                Todos
                                                            </button>
                                                            <button
                                                                onClick={() => setInfractionScopeFilter('publico')}
                                                                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${infractionScopeFilter === 'publico' ? 'border-red-200 bg-red-50 text-red-600' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                            >
                                                                Público
                                                            </button>
                                                            <button
                                                                onClick={() => setInfractionScopeFilter('interno_empresa')}
                                                                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${infractionScopeFilter === 'interno_empresa' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                            >
                                                                Mi empresa
                                                            </button>
                                                            <input
                                                                value={infractionSearchTerm}
                                                                onChange={(event) => setInfractionSearchTerm(event.target.value)}
                                                                placeholder="Buscar por usuario, extracto o link..."
                                                                className="min-w-[240px] flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 outline-none transition-colors focus:border-[#F39200]"
                                                            />
                                                        </div>
                                                        {filteredInfractions.length === 0 ? (
                                                            <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">
                                                                No hay infracciones para el filtro actual.
                                                            </div>
                                                        ) : (
                                                            filteredInfractions.slice(0, 8).map((infraction) => (
                                                                <div key={infraction.id} className={`rounded-[1.35rem] border p-4 ${selectedInfractionId === infraction.id ? 'border-[#136191]/20 bg-blue-50/60' : 'border-zinc-200 bg-zinc-50'}`}>
                                                                    <p className="text-sm font-black text-[#1A1A1A]">{infraction.target_user_name}</p>
                                                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
                                                                        {INFRACTION_TYPE_LABELS[infraction.infraction_type] || infraction.infraction_type}
                                                                    </p>
                                                                    <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">{infraction.content_excerpt}</p>
                                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                                        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                            {COMMUNITY_SCOPE_LABELS[infraction.scope] || infraction.scope}
                                                                        </span>
                                                                        {infraction.detected_link && (
                                                                            <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">
                                                                                Link detectado
                                                                            </span>
                                                                        )}
                                                                        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                            {new Date(infraction.created_at).toLocaleString()}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => handleInspectInfraction(infraction.id)}
                                                                            className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]"
                                                                        >
                                                                            Detalle
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </CardContent>
                                                </Card>
                                                {selectedInfraction && (
                                                    <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                                        <CardContent className="p-6 space-y-4">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Detalle de infracción</h3>
                                                                    <p className="text-sm font-medium text-zinc-500">
                                                                        Contexto operativo para revisión administrativa.
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => setSelectedInfractionId(null)}
                                                                    className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500"
                                                                >
                                                                    Cerrar
                                                                </button>
                                                            </div>
                                                            <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                                                                <p className="text-sm font-black text-[#1A1A1A]">{selectedInfraction.target_user_name}</p>
                                                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
                                                                    {(INFRACTION_TYPE_LABELS[selectedInfraction.infraction_type] || selectedInfraction.infraction_type)} · {(COMMUNITY_SCOPE_LABELS[selectedInfraction.scope] || selectedInfraction.scope)}
                                                                </p>
                                                                <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600">
                                                                    {selectedInfraction.content_excerpt || 'Sin extracto disponible.'}
                                                                </p>
                                                                <div className="mt-4 flex flex-wrap gap-2">
                                                                    {selectedInfraction.target_user_id && canModerateAny && (
                                                                        <button
                                                                            onClick={() => handlePrepareSanctionFromInfraction(selectedInfraction)}
                                                                            className="rounded-full border border-[#F39200]/30 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#F39200]"
                                                                        >
                                                                            Preparar sanción
                                                                        </button>
                                                                    )}
                                                                    {selectedInfraction.detected_link && (
                                                                        <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">
                                                                            {selectedInfraction.detected_link}
                                                                        </span>
                                                                    )}
                                                                    {selectedInfraction.triggered_sanction_id && (
                                                                        <button
                                                                            onClick={() => handleInspectSanction(selectedInfraction.triggered_sanction_id)}
                                                                            className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]"
                                                                        >
                                                                            Ver sanción #{selectedInfraction.triggered_sanction_id}
                                                                        </button>
                                                                    )}
                                                                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                        {new Date(selectedInfraction.created_at).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </>
                                        )}
                                        {isCommunityModerator && (
                                                <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                                    <CardContent className="p-6 space-y-4">
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div>
                                                                <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Apelaciones</h3>
                                                                <p className="text-sm font-medium text-zinc-500">
                                                                    Revise la apelación con contexto de sanción, sin salir del panel.
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                                                                    Abiertas {appealSummary.abiertas}
                                                                </span>
                                                                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                                    Resueltas {appealSummary.resueltas}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <button
                                                                onClick={() => setAppealStatusFilter('open')}
                                                                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${appealStatusFilter === 'open' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                            >
                                                                Abiertas
                                                            </button>
                                                            <button
                                                                onClick={() => setAppealStatusFilter('all')}
                                                                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${appealStatusFilter === 'all' ? 'border-[#136191]/20 bg-blue-50 text-[#136191]' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                            >
                                                                Todas
                                                            </button>
                                                            <button
                                                                onClick={() => setAppealStatusFilter('resolved')}
                                                                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${appealStatusFilter === 'resolved' ? 'border-zinc-300 bg-zinc-100 text-zinc-700' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                            >
                                                                Resueltas
                                                            </button>
                                                            <input
                                                                value={appealSearchTerm}
                                                                onChange={(event) => setAppealSearchTerm(event.target.value)}
                                                                placeholder="Buscar por usuario o motivo..."
                                                                className="min-w-[240px] flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 outline-none transition-colors focus:border-[#F39200]"
                                                            />
                                                        </div>
                                                        {filteredAppeals.length === 0 ? (
                                                            <div className="rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">
                                                                No hay apelaciones para el filtro actual.
                                                        </div>
                                                    ) : (
                                                        filteredAppeals.slice(0, 8).map((appeal) => (
                                                            <div key={appeal.id} className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-sm font-black text-[#1A1A1A]">{appeal.appellant_user_name}</p>
                                                                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                                            {appeal.sanction_type} · {appeal.sanction_scope}
                                                                        </p>
                                                                    </div>
                                                                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${appeal.status === 'abierta' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-zinc-200 bg-white text-zinc-600'}`}>
                                                                        {appeal.status}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600">{appeal.reason}</p>
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    <button
                                                                        onClick={() => handleInspectSanction(appeal.sanction_id)}
                                                                        className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]"
                                                                    >
                                                                        Ver sanción
                                                                    </button>
                                                                </div>
                                                                {appeal.status === 'abierta' ? (
                                                                    <>
                                                                        <textarea
                                                                            value={appealResolutionDraftsById[appeal.id] || ''}
                                                                            onChange={(event) => setAppealResolutionDraftsById((current) => ({ ...current, [appeal.id]: event.target.value }))}
                                                                            rows={3}
                                                                            placeholder="Nota de resolución..."
                                                                            className="mt-4 w-full rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none transition-colors focus:border-[#F39200] resize-none"
                                                                        />
                                                                        <div className="mt-4 flex gap-3">
                                                                            <button
                                                                                onClick={() => handleResolveAppeal(appeal.id, 'aceptada')}
                                                                                disabled={!String(appealResolutionDraftsById[appeal.id] || '').trim()}
                                                                                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                                            >
                                                                                Aceptar
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleResolveAppeal(appeal.id, 'rechazada')}
                                                                                disabled={!String(appealResolutionDraftsById[appeal.id] || '').trim()}
                                                                                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                                            >
                                                                                Rechazar
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                ) : appeal.resolution_note ? (
                                                                    <p className="mt-3 text-xs font-semibold leading-relaxed text-zinc-500">
                                                                        Resolución: {appeal.resolution_note}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        ))
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}
                                        <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Sanciones activas</h3>
                                                        <p className="text-sm font-medium text-zinc-500">
                                                            Lectura rápida de sanciones, apelaciones y trazas relacionadas.
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">
                                                            Activas {sanctionSummary.active}
                                                        </span>
                                                        <span className="rounded-full border border-[#136191]/20 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">
                                                            Con apelación {sanctionSummary.appealed}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => setSanctionScopeFilter('all')}
                                                        className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${sanctionScopeFilter === 'all' ? 'border-[#136191]/20 bg-blue-50 text-[#136191]' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                    >
                                                        Todos
                                                    </button>
                                                    <button
                                                        onClick={() => setSanctionScopeFilter('publico')}
                                                        className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${sanctionScopeFilter === 'publico' ? 'border-red-200 bg-red-50 text-red-600' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                    >
                                                        Público
                                                    </button>
                                                    <button
                                                        onClick={() => setSanctionScopeFilter('interno_empresa')}
                                                        className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${sanctionScopeFilter === 'interno_empresa' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                    >
                                                        Mi empresa
                                                    </button>
                                                    <button
                                                        onClick={() => setSanctionScopeFilter('mensajes_directos')}
                                                        className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${sanctionScopeFilter === 'mensajes_directos' ? 'border-zinc-300 bg-zinc-100 text-zinc-700' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                                    >
                                                        DM
                                                    </button>
                                                    <input
                                                        value={sanctionSearchTerm}
                                                        onChange={(event) => setSanctionSearchTerm(event.target.value)}
                                                        placeholder="Buscar por usuario o motivo..."
                                                        className="min-w-[240px] flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 outline-none transition-colors focus:border-[#F39200]"
                                                    />
                                                </div>
                                                {filteredSanctions.length === 0 ? (
                                                    <div className="rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">
                                                        No hay sanciones para el filtro actual.
                                                    </div>
                                                ) : (
                                                    filteredSanctions.slice(0, 8).map((sanction) => (
                                                        <div key={sanction.id} className={`rounded-[1.5rem] border p-4 ${selectedSanctionId === sanction.id ? 'border-[#136191]/20 bg-blue-50/60' : 'border-zinc-200 bg-zinc-50'}`}>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="text-sm font-black text-[#1A1A1A]">{sanction.target_user_name}</p>
                                                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{sanction.sanction_type}</p>
                                                                </div>
                                                                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">
                                                                    {COMMUNITY_SCOPE_LABELS[sanction.scope] || sanction.scope}
                                                                </span>
                                                            </div>
                                                            <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600">{sanction.reason}</p>
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <button
                                                                    onClick={() => handleInspectSanction(sanction.id)}
                                                                    className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]"
                                                                >
                                                                    Detalle
                                                                </button>
                                                                {infractionsByTriggeredSanctionId[sanction.id] && (
                                                                    <button
                                                                        onClick={() => handleInspectInfraction(infractionsByTriggeredSanctionId[sanction.id].id)}
                                                                        className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600"
                                                                    >
                                                                        Ver infracción vinculada
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {latestAppealBySanctionId[sanction.id] ? (
                                                                <div className="mt-4 rounded-[1.25rem] border border-zinc-200 bg-white p-3">
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                                        Apelación {latestAppealBySanctionId[sanction.id].status}
                                                                    </p>
                                                                    <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
                                                                        {latestAppealBySanctionId[sanction.id].reason}
                                                                    </p>
                                                                    {latestAppealBySanctionId[sanction.id].resolution_note && (
                                                                        <p className="mt-2 text-xs font-semibold leading-relaxed text-zinc-500">
                                                                            Resolución: {latestAppealBySanctionId[sanction.id].resolution_note}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : sanction.target_user_id === user?.id && sanction.is_active ? (
                                                                <div className="mt-4 space-y-3">
                                                                    <textarea
                                                                        value={appealDraftsBySanctionId[sanction.id] || ''}
                                                                        onChange={(event) => setAppealDraftsBySanctionId((current) => ({ ...current, [sanction.id]: event.target.value }))}
                                                                        rows={3}
                                                                        placeholder="Explique por qué apela esta sanción..."
                                                                        className="w-full rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none transition-colors focus:border-[#F39200] resize-none"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleCreateAppeal(sanction.id)}
                                                                        disabled={String(appealDraftsBySanctionId[sanction.id] || '').trim().length < 10}
                                                                        className="inline-flex w-full items-center justify-center rounded-2xl border border-[#136191]/20 bg-blue-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#136191] disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        Apelar sanción
                                                                    </button>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ))
                                                )}
                                            </CardContent>
                                        </Card>
                                        {selectedSanction && (
                                            <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                                                <CardContent className="p-6 space-y-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h3 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Detalle de sanción</h3>
                                                            <p className="text-sm font-medium text-zinc-500">
                                                                Contexto completo de revisión dentro del mismo panel.
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedSanctionId(null)}
                                                            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500"
                                                        >
                                                            Cerrar
                                                        </button>
                                                    </div>
                                                    <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                                                        <p className="text-sm font-black text-[#1A1A1A]">{selectedSanction.target_user_name}</p>
                                                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
                                                            {selectedSanction.sanction_type} · {COMMUNITY_SCOPE_LABELS[selectedSanction.scope] || selectedSanction.scope}
                                                        </p>
                                                        <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600">
                                                            {selectedSanction.reason || 'Sin motivo visible.'}
                                                        </p>
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${selectedSanction.is_active ? 'border-red-200 bg-red-50 text-red-600' : 'border-zinc-200 bg-white text-zinc-500'}`}>
                                                                {selectedSanction.is_active ? 'Activa' : 'Cerrada'}
                                                            </span>
                                                            {selectedSanction.issued_by_name && (
                                                                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                    Emitida por {selectedSanction.issued_by_name}
                                                                </span>
                                                            )}
                                                            {selectedSanction.target_empresa_name && (
                                                                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                    {selectedSanction.target_empresa_name}
                                                                </span>
                                                            )}
                                                            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                {new Date(selectedSanction.created_at).toLocaleString()}
                                                            </span>
                                                            {selectedSanction.expires_at && (
                                                                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                    Vigencia hasta {new Date(selectedSanction.expires_at).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {selectedSanctionAppeal && (
                                                        <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                                Apelación {selectedSanctionAppeal.status}
                                                            </p>
                                                            <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
                                                                {selectedSanctionAppeal.reason}
                                                            </p>
                                                            {selectedSanctionAppeal.resolution_note && (
                                                                <p className="mt-2 text-xs font-semibold leading-relaxed text-zinc-500">
                                                                    Resolución: {selectedSanctionAppeal.resolution_note}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {selectedSanctionInfraction && (
                                                        <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                                        Infracción vinculada
                                                                    </p>
                                                                    <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
                                                                        {selectedSanctionInfraction.content_excerpt || 'Sin extracto disponible.'}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleInspectInfraction(selectedSanctionInfraction.id)}
                                                                    className="rounded-full border border-[#136191]/20 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]"
                                                                >
                                                                    Ver infracción
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}
                                        </>
                                    )}
                            </div>
                        )}
                        </div>
                    </div>
                </main>

                <AppModalShell isOpen={isStructureModalOpen && activeTab !== 'mensajes_directos'} onClose={closeStructureModal} size="xl" zIndex="z-[135]">
                    <AppModalHeader
                        title={structureModalTab === 'category' ? 'Secciones de Comunidad' : 'Temas de Comunidad'}
                        subtitle={activeTab === 'publico' ? 'Ámbito público' : `Ámbito privado · ${activeCompanyLabel}`}
                        icon={structureModalTab === 'category' ? LayoutGrid : MessageSquareMore}
                        onClose={closeStructureModal}
                        actions={
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStructureModalTab('category')}
                                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${structureModalTab === 'category' ? 'border-[#136191] bg-[#136191] text-white' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                >
                                    Secciones
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStructureModalTab('topic')}
                                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${structureModalTab === 'topic' ? 'border-[#136191] bg-[#136191] text-white' : 'border-zinc-200 bg-white text-zinc-500'}`}
                                >
                                    Temas
                                </button>
                            </div>
                        }
                    />
                    <AppModalBody className="max-h-[80dvh] overflow-y-auto space-y-6 bg-[#F5F6F8]">
                        {structureModalTab === 'category' ? (
                            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                                <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
                                    <CardContent className="p-6 space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Nueva sección</p>
                                            <p className="mt-1 text-sm font-medium text-zinc-500">Todos los usuarios pueden proponer nuevas secciones para este ámbito.</p>
                                        </div>
                                        <input value={categoryForm.nombre} onChange={(event) => setCategoryForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Nombre de la sección" className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none" />
                                        <textarea value={categoryForm.descripcion} onChange={(event) => setCategoryForm((current) => ({ ...current, descripcion: event.target.value }))} rows={3} placeholder="Descripción breve..." className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-800 outline-none resize-none" />
                                        <input type="number" value={categoryForm.orden} onChange={(event) => setCategoryForm((current) => ({ ...current, orden: event.target.value }))} placeholder="Orden" className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none" />
                                        <div className="flex gap-3">
                                            <button onClick={handleSaveCategory} disabled={!categoryForm.nombre.trim() || !canCreateCurrentScopeStructures} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#136191] disabled:cursor-not-allowed disabled:opacity-50">
                                                {editingCategoryId ? 'Guardar sección' : 'Crear sección'}
                                            </button>
                                            {editingCategoryId && <button onClick={resetCategoryForm} className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700">Cancelar</button>}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
                                    <CardContent className="p-6 space-y-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Secciones existentes</p>
                                            <p className="mt-1 text-sm font-medium text-zinc-500">Edición y ocultación según permisos del ámbito activo.</p>
                                        </div>
                                        {currentCategories.length === 0 ? <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">No hay secciones creadas todavía.</div> : currentCategories.map((category) => (
                                            <div key={category.id} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-black text-[#1A1A1A]">{category.nombre}</p>
                                                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{category.topic_count} temas · orden {category.orden}</p>
                                                    </div>
                                                    {canEditCurrentScopeTopics && (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleEditCategory(category)} className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">Editar</button>
                                                            <button onClick={() => handleDeactivateCategory(category)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">Ocultar</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                                <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
                                    <CardContent className="p-6 space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Nuevo tema</p>
                                            <p className="mt-1 text-sm font-medium text-zinc-500">Todos los usuarios pueden crear temas base dentro del ámbito activo.</p>
                                        </div>
                                        <input value={topicForm.nombre} onChange={(event) => setTopicForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Nombre del tema" className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none" />
                                        <AnimatedSelect value={topicForm.category_id} onChange={(event) => setTopicForm((current) => ({ ...current, category_id: event.target.value }))} className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none">
                                            <option value="">Sin sección</option>
                                            {currentCategories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
                                        </AnimatedSelect>
                                        <textarea value={topicForm.descripcion} onChange={(event) => setTopicForm((current) => ({ ...current, descripcion: event.target.value }))} rows={3} placeholder="Descripción breve..." className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-800 outline-none resize-none" />
                                        <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700"><input type="checkbox" checked={topicForm.is_restricted} onChange={(event) => setTopicForm((current) => ({ ...current, is_restricted: event.target.checked, user_ids: event.target.checked ? current.user_ids : [] }))} className="h-4 w-4" />Tema restringido</label>
                                        {topicForm.is_restricted && <AnimatedSelect multiple value={topicForm.user_ids} onChange={(event) => setTopicForm((current) => ({ ...current, user_ids: Array.from(event.target.selectedOptions).map((option) => option.value) }))} className="min-h-[132px] w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 outline-none">{adminUsers.map((candidate) => <option key={candidate.id} value={candidate.id}>@{candidate.community_handle} · {candidate.nombre_completo} · {candidate.rol}</option>)}</AnimatedSelect>}
                                        <div className="flex gap-3">
                                            <button onClick={handleSaveTopic} disabled={!topicForm.nombre.trim() || !canCreateCurrentScopeStructures} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#136191] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50">
                                                {editingTopicId ? 'Guardar tema' : 'Crear tema'}
                                            </button>
                                            {editingTopicId && <button onClick={resetTopicForm} className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700">Cancelar</button>}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
                                    <CardContent className="p-6 space-y-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Temas existentes</p>
                                            <p className="mt-1 text-sm font-medium text-zinc-500">Cree siempre; edite u oculte según permisos del ámbito.</p>
                                        </div>
                                        {currentTopics.length === 0 ? <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-500">No hay temas creados todavía.</div> : currentTopics.map((topic) => (
                                            <div key={topic.id} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <button onClick={() => handleOpenTopicModal(managementScope, String(topic.id))} className="flex-1 text-left">
                                                        <p className="text-sm font-black text-[#1A1A1A]">{topic.nombre}</p>
                                                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{topic.category_name ? `${topic.category_name} · ` : ''}{topic.is_restricted ? `${topic.member_count} miembros restringidos` : 'Abierto'}</p>
                                                    </button>
                                                    {canEditCurrentScopeTopics && (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleEditTopic(topic)} className="rounded-full border border-[#136191]/20 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">Editar</button>
                                                            <button onClick={() => handleDeactivateTopic(topic)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">Ocultar</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </AppModalBody>
                </AppModalShell>

                <AppModalShell isOpen={isTopicModalOpen && Boolean(selectedTopic)} onClose={handleCloseTopicModal} size="2xl" zIndex="z-[140]">
                    <AppModalHeader
                        title={selectedTopic?.nombre || 'Tema'}
                        subtitle={selectedTopic?.category_name || (activeTab === 'publico' ? 'Tema público' : `Tema interno · ${activeCompanyLabel}`)}
                        icon={activeTab === 'publico' ? Globe2 : Building2}
                        onClose={handleCloseTopicModal}
                        actions={
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                {selectedTopic && activeTab !== 'mensajes_directos' && (
                                    <button
                                        onClick={handleOpenTopicComposerModal}
                                        className="inline-flex items-center gap-2 rounded-full border border-[#136191]/20 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Nueva publicación</span>
                                    </button>
                                )}
                                {selectedTopicMetrics && (
                                    <>
                                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                            {filteredPosts.length} publicaciones
                                        </span>
                                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                            {selectedTopicMetrics.repliesCount} respuestas
                                        </span>
                                    </>
                                )}
                            </div>
                        }
                    />
                    <AppModalBody className="max-h-[82dvh] space-y-5 overflow-y-auto bg-[#F5F6F8]">
                        {selectedTopic ? (
                            <Card className="rounded-[1.7rem] border border-[#136191]/15 bg-gradient-to-r from-[#F7FBFE] via-white to-[#FFF8E8] shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
                                <CardContent className="p-5">
                                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#136191]">Tema activo</p>
                                            <h3 className="text-xl font-black tracking-tight text-[#1A1A1A]">{selectedTopic.nombre}</h3>
                                            <p className="line-clamp-2 text-sm font-medium leading-relaxed text-zinc-500">
                                                {selectedTopic.descripcion || 'La conversación visible de este tema se gestiona desde esta ventana modal.'}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                {activeTab === 'publico' ? 'Público' : activeCompanyLabel}
                                            </span>
                                            {selectedTopic.is_restricted && (
                                                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">
                                                    {selectedTopic.member_count} miembros
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}
                        {renderPostList(filteredPosts, activeTab)}
                    </AppModalBody>
                </AppModalShell>

                <AppModalShell isOpen={isTopicComposerModalOpen && Boolean(selectedTopic)} onClose={handleCloseTopicComposerModal} size="2xl" zIndex="z-[150]">
                    <AppModalHeader
                        title={selectedTopic ? `Publicar en ${selectedTopic.nombre}` : 'Nueva publicación'}
                        subtitle={activeTab === 'publico' ? 'Nueva publicación en conversación pública' : `Nueva publicación en ${activeCompanyLabel}`}
                        icon={Plus}
                        onClose={handleCloseTopicComposerModal}
                    />
                    <AppModalBody className="max-h-[78dvh] overflow-y-auto bg-[#F5F6F8]">
                        {renderTopicComposer()}
                    </AppModalBody>
                </AppModalShell>
            </div>
        </div>
    );
};

export default Community;
