import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    Building2,
    Copy,
    DollarSign,
    Package,
    Pencil,
    PlusCircle,
    Power,
    ShoppingCart,
    Settings2,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Tag,
    TimerReset,
    Trash2,
    Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import marketplaceApi from '../api/marketplace';
import { AppModalBody, AppModalHeader, AppModalShell } from '../components/ui/app-modal';
import MotionScrollbar from '../components/ui/MotionScrollbar';
import { AuthContext } from '../context/AuthContext';
import ClearSearchField from '../components/ui/ClearSearchField';
import { appAlert, appConfirm } from '../utils/appDialog';
import { includesNormalized } from '../utils/normalizeSearch';
import {
    MarketplaceActionTile,
    MarketplaceDashboardHeader,
    MarketplaceEmptyState,
    MarketplaceModuleCard,
    MarketplaceQuickStat,
    MarketplaceSectionCard,
    MarketplaceSectionHeader,
    MarketplaceShell,
    MarketplaceTrustPanel,
    MarketplaceTypeBadge,
} from '../components/marketplace/MarketplaceVisualSystem';
import AnimatedSelect from '../components/ui/AnimatedSelect';
import { ProjectSectionIconButton } from '../components/projects/ProjectSectionReportButton';
import ProjectSegmentedSwitch from '../components/projects/ProjectSegmentedSwitch';

const initialForm = {
    titulo: '',
    resumen: '',
    descripcion: '',
    incluye: '',
    no_incluye: '',
    product_type: 'adicional',
    product_kind: 'manual',
    source_type: '',
    source_id: '',
    precio: '',
    moneda: 'USD',
    requiere_aprobacion: true,
    activo: true,
    category_id: '',
    etiquetas: '',
};

const INTERNAL_MODAL_HEADER_PROPS = {
    surfaceColor: '#1A1A1A',
    titleClassName: 'text-white',
    subtitleClassName: 'text-zinc-300',
    closeButtonClassName: 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/8 text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:border-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200]/35',
};

const MarketplaceModalScrollBody = ({ children, className = '' }) => {
    const scrollRef = useRef(null);

    return (
        <AppModalBody className="relative min-h-0 flex-1 overflow-hidden">
            <div ref={scrollRef} className={`giproy-motion-scrollbar-hide h-full min-h-0 overflow-y-auto overscroll-contain pr-6 ${className}`}>
                {children}
            </div>
            <MotionScrollbar targetRef={scrollRef} className="right-0" />
        </AppModalBody>
    );
};

const referencedProductTypeMap = {
    base_trabajo: 'base_maestra',
    apu: 'apu',
    proyecto: 'proyecto',
};

const CATEGORY_SCOPE_LABELS = {
    all: 'Todos',
    system: 'Sistema',
    users: 'Usuarios',
};

const SYSTEM_PRODUCT_OPTIONS = [
    ['licencia', 'Licencia'],
    ['addon', 'Actualización / Addon'],
    ['adicional', 'Adicional'],
    ['base_maestra', 'Base Maestra'],
    ['apu', 'APU'],
    ['proyecto', 'Proyecto'],
];

const USER_PRODUCT_OPTIONS = [
    ['base_maestra', 'Base Maestra'],
    ['apu', 'APU'],
    ['proyecto', 'Proyecto'],
];

const initialCategoryForm = {
    nombre: '',
    descripcion: '',
    visibility_scope: 'all',
    sort_order: 0,
    activa: true,
};

const buildFormFromProduct = (product) => ({
    titulo: product?.titulo || '',
    resumen: product?.resumen || '',
    descripcion: product?.descripcion || '',
    incluye: product?.incluye || '',
    no_incluye: product?.no_incluye || '',
    product_type: product?.product_type || 'adicional',
    product_kind: product?.product_kind || 'manual',
    source_type: product?.source_type || '',
    source_id: product?.source_id ? String(product.source_id) : '',
    precio: product?.precio != null ? String(product.precio) : '',
    moneda: product?.moneda || 'USD',
    requiere_aprobacion: Boolean(product?.requiere_aprobacion),
    activo: product?.activo !== false,
    category_id: product?.category_id ? String(product.category_id) : '',
    etiquetas: Array.isArray(product?.etiquetas) ? product.etiquetas.join(', ') : '',
});

const formatAmount = (value) => `${Number(value ?? 0).toFixed(2)}`;
const resolveCompanyName = (empresa) => empresa?.nombre || empresa?.razon_social || empresa?.nombre_comercial || 'Empresa activa';
const ALL_FILTER_VALUE = '__all__';
const resolveObservationTimestamp = (product) => product?.fecha_actualizacion || product?.fecha_creacion || null;

const SellerDashboard = () => {
    const { user, selectedEmpresa } = useContext(AuthContext);
    const isSuperAdmin = (user?.rol || '').toLowerCase() === 'superadministrador';
    const [panelMode, setPanelMode] = useState(() => (isSuperAdmin ? (selectedEmpresa?.id ? 'company' : 'system') : 'company'));
    const [systemStats, setSystemStats] = useState(null);
    const [systemProducts, setSystemProducts] = useState([]);
    const [systemSales, setSystemSales] = useState([]);
    const [companyStats, setCompanyStats] = useState(null);
    const [companyProducts, setCompanyProducts] = useState([]);
    const [companySales, setCompanySales] = useState([]);
    const [categories, setCategories] = useState([]);
    const [managedCategories, setManagedCategories] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingProductId, setEditingProductId] = useState(null);
    const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [sourceSearch, setSourceSearch] = useState('');
    const [sourceOptions, setSourceOptions] = useState([]);
    const [sourcesLoading, setSourcesLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categorySubmitting, setCategorySubmitting] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [productStatusFilter, setProductStatusFilter] = useState(ALL_FILTER_VALUE);
    const [productTypeFilter, setProductTypeFilter] = useState(ALL_FILTER_VALUE);
    const [productCategoryFilter, setProductCategoryFilter] = useState(ALL_FILTER_VALUE);
    const [productActiveFilter, setProductActiveFilter] = useState(ALL_FILTER_VALUE);
    const [salesSearch, setSalesSearch] = useState('');
    const [salesTypeFilter, setSalesTypeFilter] = useState(ALL_FILTER_VALUE);
    const [productsWorkbenchOpen, setProductsWorkbenchOpen] = useState(false);
    const [salesWorkbenchOpen, setSalesWorkbenchOpen] = useState(false);
    const [moderationWorkbenchOpen, setModerationWorkbenchOpen] = useState(false);
    const [productEditorOpen, setProductEditorOpen] = useState(false);
    const [categoriesWorkbenchOpen, setCategoriesWorkbenchOpen] = useState(false);
    const [moderationView, setModerationView] = useState('all');
    const canSell = (user?.marketplace_permissions || []).includes('seller.publish');
    const companyCanSell = isSuperAdmin ? true : user?.empresa?.marketplace_can_sell !== false;
    const profileComplete = isSuperAdmin || Boolean(user?.marketplace_profile_complete);
    const isEditing = editingProductId !== null;
    const hasCompanyContext = Boolean(isSuperAdmin ? selectedEmpresa?.id : user?.empresa_id);
    const companyName = resolveCompanyName(isSuperAdmin ? selectedEmpresa : user?.empresa);
    const isSystemSellingContext = isSuperAdmin && panelMode === 'system';
    const requiresReference = form.product_kind === 'referenced';

    useEffect(() => {
        if (!isSuperAdmin) {
            setPanelMode('company');
            return;
        }
        setPanelMode((current) => (current === 'system' ? current : selectedEmpresa?.id ? 'company' : 'system'));
    }, [isSuperAdmin, selectedEmpresa?.id]);

    const visibleSellerCategories = useMemo(
        () => categories.filter((category) => {
            const scope = (category.visibility_scope || 'all').toLowerCase();
            if (isSystemSellingContext) return scope !== 'users';
            return scope !== 'system';
        }),
        [categories, isSystemSellingContext]
    );

    const selectedSourceOption = sourceOptions.find((item) => String(item.source_id) === String(form.source_id));
    const selectedCategory = visibleSellerCategories.find((item) => String(item.id) === String(form.category_id));
    const categoryOptions = isSystemSellingContext ? SYSTEM_PRODUCT_OPTIONS : USER_PRODUCT_OPTIONS;
    const canUseManualProducts = isSystemSellingContext;
    const currentProducts = isSystemSellingContext ? systemProducts : companyProducts;
    const currentSales = isSystemSellingContext ? systemSales : companySales;
    const editingProduct = useMemo(
        () => currentProducts.find((product) => product.id === editingProductId) || null,
        [currentProducts, editingProductId]
    );
    const editingProductNeedsResubmission = Boolean(
        editingProduct
        && !isSuperAdmin
        && editingProduct.requiere_aprobacion
        && (
            editingProduct.estado === 'rejected'
            || (editingProduct.admin_notes && String(editingProduct.admin_notes).trim())
        )
    );
    const filteredCurrentProducts = useMemo(() => currentProducts.filter((product) => {
        if (productStatusFilter !== ALL_FILTER_VALUE && product.estado !== productStatusFilter) return false;
        if (productTypeFilter !== ALL_FILTER_VALUE && product.product_type !== productTypeFilter) return false;
        if (productCategoryFilter !== ALL_FILTER_VALUE && String(product.category_id || '') !== productCategoryFilter) return false;
        if (productActiveFilter !== ALL_FILTER_VALUE) {
            const expectedActive = productActiveFilter === 'active';
            if (Boolean(product.activo) !== expectedActive) return false;
        }
        if (productSearch.trim()) {
            const haystack = [
                product.titulo,
                product.product_type,
                product.estado,
                product.category?.nombre,
                product.seller?.nombre_completo,
            ].filter(Boolean).join(' ');
            if (!includesNormalized(haystack, productSearch)) return false;
        }
        return true;
    }), [currentProducts, productActiveFilter, productCategoryFilter, productSearch, productStatusFilter, productTypeFilter]);
    const availableTypeFilters = useMemo(
        () => [...new Set(currentProducts.map((product) => product.product_type).filter(Boolean))],
        [currentProducts]
    );
    const availableStatusFilters = useMemo(
        () => [...new Set(currentProducts.map((product) => product.estado).filter(Boolean))],
        [currentProducts]
    );
    const availableCategoryFilters = useMemo(() => {
        const map = new Map();
        currentProducts.forEach((product) => {
            if (product.category_id && product.category?.nombre) {
                map.set(String(product.category_id), product.category.nombre);
            }
        });
        return [...map.entries()].map(([value, label]) => ({ value, label }));
    }, [currentProducts]);
    const filteredCurrentSales = useMemo(() => currentSales.filter((sale) => {
        if (salesTypeFilter !== ALL_FILTER_VALUE && sale.product_type_snapshot !== salesTypeFilter) return false;
        if (salesSearch.trim()) {
            const haystack = [
                sale.product_title_snapshot,
                sale.product_type_snapshot,
                sale.seller_name,
                sale.order_id ? `pedido ${sale.order_id}` : '',
            ].filter(Boolean).join(' ');
            if (!includesNormalized(haystack, salesSearch)) return false;
        }
        return true;
    }), [currentSales, salesSearch, salesTypeFilter]);
    const availableSalesTypeFilters = useMemo(
        () => [...new Set(currentSales.map((sale) => sale.product_type_snapshot).filter(Boolean))],
        [currentSales]
    );
    const sellerProductPreview = useMemo(() => filteredCurrentProducts.slice(0, 4), [filteredCurrentProducts]);
    const sellerSalesPreview = useMemo(() => filteredCurrentSales.slice(0, 4), [filteredCurrentSales]);
    const hasActiveProductFilters = Boolean(productSearch.trim())
        || productStatusFilter !== ALL_FILTER_VALUE
        || productTypeFilter !== ALL_FILTER_VALUE
        || productCategoryFilter !== ALL_FILTER_VALUE
        || productActiveFilter !== ALL_FILTER_VALUE;
    const hasActiveSalesFilters = Boolean(salesSearch.trim())
        || salesTypeFilter !== ALL_FILTER_VALUE;
    const actionableObservedProducts = useMemo(() => currentProducts
        .filter((product) => {
            if (product.seller_user_id !== user?.id) return false;
            const hasAdminNotes = Boolean(product.admin_notes && String(product.admin_notes).trim());
            return product.estado === 'rejected' || hasAdminNotes;
        })
        .sort((left, right) => {
            const leftRejected = left.estado === 'rejected' ? 1 : 0;
            const rightRejected = right.estado === 'rejected' ? 1 : 0;
            if (leftRejected !== rightRejected) return rightRejected - leftRejected;

            const leftDate = resolveObservationTimestamp(left) ? new Date(resolveObservationTimestamp(left)).getTime() : 0;
            const rightDate = resolveObservationTimestamp(right) ? new Date(resolveObservationTimestamp(right)).getTime() : 0;
            return rightDate - leftDate;
        }), [currentProducts, user?.id]);
    const resubmittedProducts = useMemo(() => currentProducts
        .filter((product) => {
            if (product.seller_user_id !== user?.id) return false;
            const hasAdminNotes = Boolean(product.admin_notes && String(product.admin_notes).trim());
            return product.estado === 'pending' && hasAdminNotes && Boolean(product.fecha_actualizacion);
        })
        .sort((left, right) => {
            const leftDate = left.fecha_actualizacion ? new Date(left.fecha_actualizacion).getTime() : 0;
            const rightDate = right.fecha_actualizacion ? new Date(right.fecha_actualizacion).getTime() : 0;
            return rightDate - leftDate;
        }), [currentProducts, user?.id]);
    const newPendingProducts = useMemo(() => currentProducts
        .filter((product) => {
            if (product.seller_user_id !== user?.id) return false;
            const hasAdminNotes = Boolean(product.admin_notes && String(product.admin_notes).trim());
            return product.estado === 'pending' && !hasAdminNotes;
        })
        .sort((left, right) => {
            const leftDate = left.fecha_creacion ? new Date(left.fecha_creacion).getTime() : 0;
            const rightDate = right.fecha_creacion ? new Date(right.fecha_creacion).getTime() : 0;
            return rightDate - leftDate;
        }), [currentProducts, user?.id]);
    const sellerModerationSummary = useMemo(() => {
        const sellerProducts = currentProducts.filter((product) => product.seller_user_id === user?.id);
        const pendingProducts = sellerProducts.filter((product) => product.estado === 'pending');
        const observedPending = sellerProducts.filter((product) => {
            const hasAdminNotes = Boolean(product.admin_notes && String(product.admin_notes).trim());
            return product.estado === 'pending' && hasAdminNotes;
        });

        return {
            correctionsRequired: actionableObservedProducts.length,
            resubmitted: resubmittedProducts.length,
            pendingTotal: pendingProducts.length,
            approvedTotal: sellerProducts.filter((product) => product.estado === 'approved').length,
            observedPending: observedPending.length,
            pendingNewTotal: newPendingProducts.length,
            pausedTotal: sellerProducts.filter((product) => !product.activo).length,
        };
    }, [actionableObservedProducts.length, currentProducts, newPendingProducts.length, resubmittedProducts.length, user?.id]);
    const approvedActiveProducts = useMemo(() => currentProducts
        .filter((product) => (
            product.seller_user_id === user?.id
            && product.estado === 'approved'
            && product.activo
        ))
        .sort((left, right) => {
            const leftDate = resolveObservationTimestamp(left) ? new Date(resolveObservationTimestamp(left)).getTime() : 0;
            const rightDate = resolveObservationTimestamp(right) ? new Date(resolveObservationTimestamp(right)).getTime() : 0;
            return rightDate - leftDate;
        }), [currentProducts, user?.id]);
    const pausedProducts = useMemo(() => currentProducts
        .filter((product) => (
            product.seller_user_id === user?.id
            && !product.activo
        ))
        .sort((left, right) => {
            const leftDate = resolveObservationTimestamp(left) ? new Date(resolveObservationTimestamp(left)).getTime() : 0;
            const rightDate = resolveObservationTimestamp(right) ? new Date(resolveObservationTimestamp(right)).getTime() : 0;
            return rightDate - leftDate;
        }), [currentProducts, user?.id]);

    const resetFormState = () => {
        setForm({
            ...initialForm,
            product_type: isSystemSellingContext ? 'adicional' : 'base_maestra',
            product_kind: isSystemSellingContext ? 'manual' : 'referenced',
        });
        setEditingProductId(null);
        setSourceSearch('');
        setSourceOptions([]);
    };

    const resetCategoryFormState = () => {
        setCategoryForm(initialCategoryForm);
        setEditingCategoryId(null);
    };

    const resetProductFilters = () => {
        setProductSearch('');
        setProductStatusFilter(ALL_FILTER_VALUE);
        setProductTypeFilter(ALL_FILTER_VALUE);
        setProductCategoryFilter(ALL_FILTER_VALUE);
        setProductActiveFilter(ALL_FILTER_VALUE);
    };

    const resetSalesFilters = () => {
        setSalesSearch('');
        setSalesTypeFilter(ALL_FILTER_VALUE);
    };

    const openProductEditor = () => {
        setProductsWorkbenchOpen(false);
        setSalesWorkbenchOpen(false);
        setModerationWorkbenchOpen(false);
        setProductEditorOpen(true);
    };

    const openNewProductEditor = () => {
        resetFormState();
        openProductEditor();
    };

    const openModerationWorkbench = (view = 'all') => {
        setModerationView(view);
        setModerationWorkbenchOpen(true);
    };

    const loadData = async () => {
        const requests = [
            marketplaceApi.getCategories(),
            marketplaceApi.getCompanyStats(),
            marketplaceApi.getCompanyProducts(),
            marketplaceApi.getCompanySales(),
            marketplaceApi.getSellerStats(),
            marketplaceApi.getSellerProducts(),
            marketplaceApi.getSellerSales(),
        ];
        if (isSuperAdmin) requests.push(marketplaceApi.getAdminCategories());

        const [
            categoriesRes,
            companyStatsRes,
            companyProductsRes,
            companySalesRes,
            sellerStatsRes,
            sellerProductsRes,
            sellerSalesRes,
            adminCategoriesRes,
        ] = await Promise.all(requests);

        setCategories(categoriesRes.data || []);
        setCompanyStats(companyStatsRes.data || null);
        setCompanyProducts(companyProductsRes.data || []);
        setCompanySales(companySalesRes.data || []);
        setSystemStats(sellerStatsRes.data || null);
        setSystemProducts(sellerProductsRes.data || []);
        setSystemSales(sellerSalesRes.data || []);
        setManagedCategories(adminCategoriesRes?.data || []);
    };

    useEffect(() => {
        if (!canSell || !companyCanSell || !profileComplete) return;
        if (isSuperAdmin && !selectedEmpresa?.id && panelMode === 'company') return;
        loadData().catch((error) => console.error('Error cargando panel vendedor marketplace:', error));
    }, [canSell, companyCanSell, profileComplete, isSuperAdmin, selectedEmpresa?.id, panelMode]);

    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            product_type: categoryOptions.some(([value]) => value === prev.product_type)
                ? prev.product_type
                : (isSystemSellingContext ? 'adicional' : 'base_maestra'),
            product_kind: canUseManualProducts ? prev.product_kind : 'referenced',
        }));
    }, [isSystemSellingContext, canUseManualProducts]);

    useEffect(() => {
        if (!requiresReference || !form.source_type || !canSell || !companyCanSell || !profileComplete || isSystemSellingContext) {
            setSourceOptions([]);
            return;
        }

        let cancelled = false;
        setSourcesLoading(true);
        marketplaceApi
            .getSellerSourceOptions({
                source_type: form.source_type,
                q: sourceSearch || undefined,
                limit: 50,
            })
            .then((response) => {
                if (!cancelled) setSourceOptions(response.data || []);
            })
            .catch((error) => {
                if (!cancelled) {
                    console.error('Error cargando opciones marketplace:', error);
                    setSourceOptions([]);
                }
            })
            .finally(() => {
                if (!cancelled) setSourcesLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [requiresReference, form.source_type, sourceSearch, canSell, companyCanSell, profileComplete, isSystemSellingContext]);

    useEffect(() => {
        resetFormState();
    }, [panelMode]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isEditing && requiresReference && !form.source_id) {
            await appAlert('Selecciona una entidad origen antes de publicar.');
            return;
        }
        try {
            setSubmitting(true);
            const categoryId = form.category_id ? Number(form.category_id) : null;
            const tags = form.etiquetas.split(',').map((item) => item.trim()).filter(Boolean);

            if (isEditing) {
                await marketplaceApi.updateSellerProduct(editingProductId, {
                    titulo: form.titulo,
                    resumen: form.resumen || null,
                    descripcion: form.descripcion || null,
                    incluye: form.incluye || null,
                    no_incluye: form.no_incluye || null,
                    precio: Number(form.precio || 0),
                    moneda: form.moneda,
                    requiere_aprobacion: form.requiere_aprobacion,
                    activo: form.activo,
                    category_id: categoryId,
                    etiquetas: tags,
                });
            } else {
                await marketplaceApi.createProduct({
                    titulo: form.titulo,
                    resumen: form.resumen || null,
                    descripcion: form.descripcion || null,
                    incluye: form.incluye || null,
                    no_incluye: form.no_incluye || null,
                    product_type: form.product_type,
                    product_kind: form.product_kind,
                    source_type: requiresReference ? form.source_type : null,
                    source_id: requiresReference ? Number(form.source_id) : null,
                    precio: Number(form.precio || 0),
                    moneda: form.moneda,
                    requiere_aprobacion: form.requiere_aprobacion,
                    activo: form.activo,
                    category_id: categoryId,
                    etiquetas: tags,
                });
            }
            resetFormState();
            setProductEditorOpen(false);
            await loadData();
        } catch (error) {
            console.error('Error publicando producto:', error);
            await appAlert(error?.response?.data?.detail || (isEditing ? 'No se pudo actualizar el producto.' : 'No se pudo publicar el producto.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditProduct = (product) => {
        if (product.seller_user_id !== user?.id) return;
        setEditingProductId(product.id);
        setSourceSearch('');
        setSourceOptions([]);
        setForm(buildFormFromProduct(product));
        openProductEditor();
    };

    const handleReviewCorrection = (product) => {
        handleEditProduct(product);
    };

    const handleToggleProductActive = async (product) => {
        if (product.seller_user_id !== user?.id) return;
        const nextActive = !product.activo;
        const confirmed = await appConfirm({
            title: nextActive ? 'Activar producto' : 'Desactivar producto',
            message: nextActive
                ? `¿Desea reactivar "${product.titulo}" en su catálogo?`
                : `¿Desea ocultar "${product.titulo}" del catálogo aprobado?`,
            confirmLabel: nextActive ? 'Activar' : 'Desactivar',
            tone: nextActive ? 'default' : 'danger',
        });
        if (!confirmed) return;
        try {
            await marketplaceApi.updateSellerProduct(product.id, { activo: nextActive });
            if (editingProductId === product.id) {
                setForm((prev) => ({ ...prev, activo: nextActive }));
            }
            await loadData();
        } catch (error) {
            console.error('Error actualizando estado del producto:', error);
            await appAlert(error?.response?.data?.detail || 'No se pudo actualizar el estado del producto.');
        }
    };

    const handleCloneProduct = async (product) => {
        if (product.seller_user_id !== user?.id) return;
        const confirmed = await appConfirm({
            title: 'Clonar publicación',
            message: `¿Desea crear una copia editable de "${product.titulo}"? La nueva publicación se generará como producto manual.`,
            confirmLabel: 'Clonar',
        });
        if (!confirmed) return;
        try {
            const response = await marketplaceApi.cloneSellerProduct(product.id);
            const clonedProduct = response?.data;
            if (clonedProduct?.id) {
                setEditingProductId(clonedProduct.id);
                setSourceSearch('');
                setSourceOptions([]);
                setForm(buildFormFromProduct(clonedProduct));
                openProductEditor();
            }
            await loadData();
        } catch (error) {
            console.error('Error clonando producto marketplace:', error);
            await appAlert(error?.response?.data?.detail || 'No se pudo clonar la publicación.');
        }
    };

    const handleDeleteProduct = async (product) => {
        if (product.seller_user_id !== user?.id) return;
        const confirmed = await appConfirm({
            title: 'Retirar publicación',
            message: `¿Desea retirar definitivamente "${product.titulo}"? Esta acción eliminará la publicación del panel vendedor.`,
            confirmLabel: 'Retirar',
            tone: 'danger',
        });
        if (!confirmed) return;
        try {
            await marketplaceApi.deleteSellerProduct(product.id);
            if (editingProductId === product.id) {
                resetFormState();
            }
            await loadData();
        } catch (error) {
            console.error('Error retirando producto marketplace:', error);
            await appAlert(error?.response?.data?.detail || 'No se pudo retirar la publicación.');
        }
    };

    const handleCategorySubmit = async (event) => {
        event.preventDefault();
        if (!isSuperAdmin) return;
        try {
            setCategorySubmitting(true);
            const payload = {
                nombre: categoryForm.nombre,
                descripcion: categoryForm.descripcion || null,
                visibility_scope: categoryForm.visibility_scope,
                sort_order: Number(categoryForm.sort_order || 0),
                activa: Boolean(categoryForm.activa),
            };
            if (editingCategoryId) {
                await marketplaceApi.updateAdminCategory(editingCategoryId, payload);
            } else {
                await marketplaceApi.createAdminCategory(payload);
            }
            resetCategoryFormState();
            await loadData();
        } catch (error) {
            console.error('Error guardando categoría marketplace:', error);
            await appAlert(error?.response?.data?.detail || 'No se pudo guardar la categoría.');
        } finally {
            setCategorySubmitting(false);
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategoryId(category.id);
        setCategoryForm({
            nombre: category.nombre || '',
            descripcion: category.descripcion || '',
            visibility_scope: category.visibility_scope || 'all',
            sort_order: Number(category.sort_order || 0),
            activa: category.activa !== false,
        });
    };

    const handleToggleCategoryActive = async (category) => {
        const nextActive = !category.activa;
        const confirmed = await appConfirm({
            title: nextActive ? 'Activar categoría' : 'Desactivar categoría',
            message: nextActive
                ? `¿Desea reactivar la categoría "${category.nombre}"?`
                : `¿Desea desactivar la categoría "${category.nombre}"?`,
            confirmLabel: nextActive ? 'Activar' : 'Desactivar',
            tone: nextActive ? 'default' : 'danger',
        });
        if (!confirmed) return;
        try {
            await marketplaceApi.updateAdminCategory(category.id, { activa: nextActive });
            if (editingCategoryId === category.id) {
                setCategoryForm((prev) => ({ ...prev, activa: nextActive }));
            }
            await loadData();
        } catch (error) {
            console.error('Error actualizando categoría marketplace:', error);
            await appAlert(error?.response?.data?.detail || 'No se pudo actualizar la categoría.');
        }
    };

    const handleProductKindChange = (nextKind) => {
        if (isEditing) return;
        if (nextKind === 'referenced') {
            setForm((prev) => ({
                ...prev,
                product_kind: nextKind,
                source_type: prev.source_type || 'base_trabajo',
                source_id: '',
                product_type: referencedProductTypeMap[prev.source_type || 'base_trabajo'],
            }));
            return;
        }
        setSourceSearch('');
        setSourceOptions([]);
        setForm((prev) => ({
            ...prev,
            product_kind: nextKind,
            source_type: '',
            source_id: '',
            product_type: isSystemSellingContext ? 'adicional' : 'base_maestra',
        }));
    };

    const handleSourceTypeChange = (nextSourceType) => {
        if (isEditing) return;
        setSourceSearch('');
        setSourceOptions([]);
        setForm((prev) => ({
            ...prev,
            source_type: nextSourceType,
            source_id: '',
            product_type: referencedProductTypeMap[nextSourceType] || prev.product_type,
        }));
    };

    const handleSourceSelection = (sourceId) => {
        if (isEditing) return;
        const option = sourceOptions.find((item) => String(item.source_id) === String(sourceId));
        setForm((prev) => ({
            ...prev,
            source_id: sourceId,
            product_type: option?.product_type || prev.product_type,
            titulo: prev.titulo || option?.title || prev.titulo,
            resumen: prev.resumen || option?.subtitle || prev.resumen,
            descripcion: prev.descripcion || option?.detail || prev.descripcion,
        }));
    };

    const renderStatsCards = (items) => (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {items.map((item) => (
                <MarketplaceQuickStat key={item.label} label={item.label} value={item.value} tone={item.tone} />
            ))}
        </section>
    );

    const renderSellerEmptyState = ({
        eyebrow,
        title,
        description,
        primaryActionLabel,
        onPrimaryAction,
        secondaryActionLabel,
        onSecondaryAction,
    }) => (
        <MarketplaceEmptyState
            eyebrow={eyebrow}
            title={title}
            description={description}
            primaryActionLabel={primaryActionLabel}
            onPrimaryAction={onPrimaryAction}
            secondaryActionLabel={secondaryActionLabel}
            onSecondaryAction={onSecondaryAction}
        />
    );

    const renderProductsSection = ({ sectionId, title, products, emptyLabel, showSeller = false, editable = false }) => (
        <section id={sectionId} className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
            <MarketplaceSectionHeader
                eyebrow="Catálogo comercial"
                title={title}
                description={editable
                    ? 'Edita tus publicaciones, controla su visibilidad y mantén ordenado el catálogo vivo del alcance actual.'
                    : 'Lectura consolidada del catálogo comercial del alcance activo.'}
                badge={`${products.length} items`}
            />
            <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-zinc-50/80 p-4">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
                    <ClearSearchField
                        value={productSearch}
                        onValueChange={setProductSearch}
                        placeholder="Buscar por título, tipo, estado, categoría o vendedor"
                        inputClassName="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-10 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]"
                    />
                    <AnimatedSelect value={productStatusFilter} onChange={(event) => setProductStatusFilter(event.target.value)} className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]">
                        <option value={ALL_FILTER_VALUE}>Todos los estados</option>
                        {availableStatusFilters.map((status) => <option key={status} value={status}>{status}</option>)}
                    </AnimatedSelect>
                    <AnimatedSelect value={productTypeFilter} onChange={(event) => setProductTypeFilter(event.target.value)} className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]">
                        <option value={ALL_FILTER_VALUE}>Todos los tipos</option>
                        {availableTypeFilters.map((type) => <option key={type} value={type}>{type}</option>)}
                    </AnimatedSelect>
                    <AnimatedSelect value={productCategoryFilter} onChange={(event) => setProductCategoryFilter(event.target.value)} className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]">
                        <option value={ALL_FILTER_VALUE}>Todas las categorías</option>
                        {availableCategoryFilters.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                    </AnimatedSelect>
                    <AnimatedSelect value={productActiveFilter} onChange={(event) => setProductActiveFilter(event.target.value)} className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]">
                        <option value={ALL_FILTER_VALUE}>Activos e inactivos</option>
                        <option value="active">Solo activos</option>
                        <option value="inactive">Solo inactivos</option>
                    </AnimatedSelect>
                </div>
            </div>
            <div className="mt-6 space-y-4">
                {products.length === 0 ? (
                    hasActiveProductFilters
                        ? renderSellerEmptyState({
                            eyebrow: 'Sin coincidencias',
                            title: 'Los filtros dejaron esta vista sin resultados',
                            description: `${emptyLabel} Limpia los filtros para recuperar la lectura completa o abre un nuevo producto si necesitas ampliar el catálogo.`,
                            primaryActionLabel: 'Limpiar filtros',
                            onPrimaryAction: resetProductFilters,
                            secondaryActionLabel: editable ? 'Nuevo producto' : undefined,
                            onSecondaryAction: editable ? openNewProductEditor : undefined,
                        })
                        : renderSellerEmptyState({
                            eyebrow: showSeller ? 'Catálogo empresa' : 'Catálogo sistema',
                            title: showSeller ? 'Todavía no hay publicaciones en este frente' : 'Sistema aún no tiene publicaciones visibles aquí',
                            description: emptyLabel,
                            primaryActionLabel: editable ? 'Crear producto' : undefined,
                            onPrimaryAction: editable ? openNewProductEditor : undefined,
                        })
                ) : products.map((product) => {
                    const canEditProduct = editable && product.seller_user_id === user?.id;
                    const hasAdminNotes = Boolean(product.admin_notes && String(product.admin_notes).trim());
                    const stateTone = product.estado === 'approved'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : product.estado === 'rejected'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-amber-200 bg-amber-50 text-[#A55A00]';
                    return (
                        <div key={product.id} className="rounded-[1.75rem] border border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfc_100%)] p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <MarketplaceTypeBadge type={product.product_type} />
                                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${stateTone}`}>
                                            {product.estado}
                                        </span>
                                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                            product.activo
                                                ? 'border-blue-200 bg-blue-50 text-[#136191]'
                                                : 'border-zinc-200 bg-zinc-100 text-zinc-600'
                                        }`}>
                                            {product.activo ? 'Activo' : 'Pausado'}
                                        </span>
                                    </div>
                                    <p className="text-lg font-black text-zinc-900">{product.titulo}</p>
                                    <p className="mt-2 text-sm font-semibold text-zinc-500">
                                        {product.category?.nombre || 'Sin categoría'}
                                        {showSeller && product.seller?.nombre_completo ? ` | ${product.seller.nombre_completo}` : ''}
                                    </p>
                                    <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600">
                                        {product.resumen || 'Publicación comercial lista para revisión, edición o seguimiento dentro del catálogo activo.'}
                                    </p>
                                    {product.product_kind === 'referenced' && (
                                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Referenciado desde {product.source_type} #{product.source_id}</p>
                                    )}
                                </div>
                                <div className="flex flex-col items-start gap-3 md:items-end">
                                    <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-right">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Precio</p>
                                        <p className="mt-1 text-2xl font-black text-zinc-900">{formatAmount(product.precio)} <span className="text-sm text-zinc-400">{product.moneda}</span></p>
                                    </div>
                                    {editable && (
                                        <div className="flex flex-wrap gap-2">
                                            <ProjectSectionIconButton
                                                icon={Pencil}
                                                label="Editar"
                                                hintContent="Editar publicación"
                                                onClick={() => handleEditProduct(product)}
                                                disabled={!canEditProduct}
                                                className="hover:text-[#F39200]"
                                            />
                                            <ProjectSectionIconButton
                                                icon={Copy}
                                                label="Clonar"
                                                hintContent="Clonar publicación"
                                                onClick={() => handleCloneProduct(product)}
                                                disabled={!canEditProduct}
                                            />
                                            <ProjectSectionIconButton
                                                icon={Power}
                                                label={product.activo ? 'Desactivar' : 'Activar'}
                                                hintContent={product.activo ? 'Pausar publicación' : 'Activar publicación'}
                                                onClick={() => handleToggleProductActive(product)}
                                                disabled={!canEditProduct}
                                                className={product.activo ? 'border-red-200 bg-red-50 text-red-700 hover:text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:text-emerald-700'}
                                            />
                                            <ProjectSectionIconButton
                                                icon={Trash2}
                                                label="Retirar"
                                                hintContent="Retirar publicación"
                                                onClick={() => handleDeleteProduct(product)}
                                                disabled={!canEditProduct}
                                                className="border-red-200 bg-white text-red-700 hover:text-red-700"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Creado</p>
                                    <p className="mt-1 text-sm font-black text-zinc-700">{product.fecha_creacion ? new Date(product.fecha_creacion).toLocaleDateString() : 'Sin fecha visible'}</p>
                                </div>
                                <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Actualizado</p>
                                    <p className="mt-1 text-sm font-black text-zinc-700">{product.fecha_actualizacion ? new Date(product.fecha_actualizacion).toLocaleDateString() : 'Sin cambios visibles'}</p>
                                </div>
                                <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Moderación</p>
                                    <p className="mt-1 text-sm font-black text-zinc-700">{product.requiere_aprobacion ? 'Con aprobación' : 'Publicación directa'}</p>
                                </div>
                            </div>
                            {hasAdminNotes ? (
                                <div className={`mt-4 rounded-[1.25rem] border p-4 ${
                                    product.estado === 'rejected'
                                        ? 'border-red-200 bg-red-50'
                                        : 'border-amber-200 bg-amber-50'
                                }`}>
                                    <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                                        product.estado === 'rejected' ? 'text-red-700' : 'text-amber-700'
                                    }`}>
                                        Observación administrativa
                                    </p>
                                    <p className={`mt-2 text-sm font-medium leading-relaxed ${
                                        product.estado === 'rejected' ? 'text-red-900' : 'text-amber-900'
                                    }`}>
                                        {product.admin_notes}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </section>
    );

    const renderObservedProductsQueue = ({ products, tone = 'company' }) => {
        if (products.length === 0) return null;

        const isSystemTone = tone === 'system';
        const sectionTone = isSystemTone
            ? 'border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50'
            : 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50';
        const badgeTone = isSystemTone
            ? 'border-violet-200 bg-white text-violet-700'
            : 'border-amber-200 bg-white text-[#A55A00]';
        const iconTone = isSystemTone
            ? 'border-violet-200 bg-violet-100 text-violet-700'
            : 'border-amber-200 bg-amber-100 text-[#A55A00]';

        return (
            <section id="seller-observed-queue" className={`rounded-[2rem] border p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)] ${sectionTone}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${iconTone}`}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Correcciones prioritarias</p>
                            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Publicaciones con observaciones</h2>
                            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">Atiende primero las publicaciones que necesitan corrección o una respuesta clara al equipo administrativo.</p>
                        </div>
                    </div>
                    <div className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${badgeTone}`}>
                        {products.length} en seguimiento
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {products.map((product) => {
                        const isRejected = product.estado === 'rejected';
                        const noteText = product.admin_notes || (isRejected ? 'La publicación fue rechazada y necesita corrección antes de volver a enviarse.' : 'La publicación tiene una observación administrativa pendiente.');
                        return (
                            <div key={`observed-${product.id}`} className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-base font-black text-zinc-900">{product.titulo}</p>
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                                isRejected
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {isRejected ? 'Rechazada' : 'Observada'}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm font-semibold text-zinc-500">
                                            {product.product_type}
                                            {product.category?.nombre ? ` | ${product.category.nombre}` : ''}
                                            {product.activo ? ' | activa' : ' | inactiva'}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                {resolveObservationTimestamp(product)
                                                    ? `Movimiento ${new Date(resolveObservationTimestamp(product)).toLocaleDateString()}`
                                                    : 'Sin fecha visible'}
                                            </span>
                                            <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                {formatAmount(product.precio)} {product.moneda}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-700">{noteText}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 xl:items-end">
                                        <ProjectSectionIconButton
                                            icon={Pencil}
                                            label="Corregir publicación"
                                            hintContent="Abrir editor para corregir publicación"
                                            onClick={() => handleReviewCorrection(product)}
                                            className={isRejected
                                                ? 'border-red-200 bg-red-50 text-red-700 hover:text-red-700'
                                                : (isSystemTone ? 'border-violet-200 bg-violet-50 text-violet-700 hover:text-violet-700' : 'text-[#136191]')}
                                        />
                                        <p className="text-[11px] font-semibold text-zinc-500 xl:text-right">Vuelve al editor acotado con el contexto de observación listo.</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        );
    };

    const renderResubmittedProductsQueue = ({ products, tone = 'company' }) => {
        if (products.length === 0) return null;

        const isSystemTone = tone === 'system';
        const sectionTone = isSystemTone
            ? 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50'
            : 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50';
        const badgeTone = isSystemTone
            ? 'border-sky-200 bg-white text-sky-700'
            : 'border-emerald-200 bg-white text-emerald-700';
        const iconTone = isSystemTone
            ? 'border-sky-200 bg-sky-100 text-sky-700'
            : 'border-emerald-200 bg-emerald-100 text-emerald-700';

        return (
            <section id="seller-resubmitted-queue" className={`rounded-[2rem] border p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)] ${sectionTone}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${iconTone}`}>
                            <TimerReset className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Seguimiento de revisión</p>
                            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Publicaciones reenviadas</h2>
                            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">Aquí solo ves publicaciones ya corregidas que esperan una nueva decisión administrativa.</p>
                        </div>
                    </div>
                    <div className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${badgeTone}`}>
                        {products.length} en revisión
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {products.map((product) => (
                        <div key={`resubmitted-${product.id}`} className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-base font-black text-zinc-900">{product.titulo}</p>
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                            Reenviada
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-zinc-500">
                                        {product.product_type}
                                        {product.category?.nombre ? ` | ${product.category.nombre}` : ''}
                                        {product.activo ? ' | activa' : ' | inactiva'}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                            {product.fecha_actualizacion ? `Reenviada ${new Date(product.fecha_actualizacion).toLocaleDateString()}` : 'Sin fecha visible'}
                                        </span>
                                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                            {formatAmount(product.precio)} {product.moneda}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-700">{product.admin_notes || 'La publicación volvió a revisión y está pendiente de una nueva decisión.'}</p>
                                </div>
                                <div className="flex flex-col gap-2 xl:items-end">
                                    <ProjectSectionIconButton
                                        icon={Pencil}
                                        label="Revisar edición"
                                        hintContent="Revisar cambios reenviados"
                                        onClick={() => handleReviewCorrection(product)}
                                    />
                                    <p className="text-[11px] font-semibold text-zinc-500 xl:text-right">Úsalo para comprobar qué se cambió antes de la nueva decisión.</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    };

    const renderApprovedProductsQueue = ({ products, tone = 'company' }) => {
        if (products.length === 0) return null;

        const isSystemTone = tone === 'system';
        const sectionTone = isSystemTone
            ? 'border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-pink-50'
            : 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-50';
        const badgeTone = isSystemTone
            ? 'border-fuchsia-200 bg-white text-fuchsia-700'
            : 'border-emerald-200 bg-white text-emerald-700';
        const iconTone = isSystemTone
            ? 'border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700'
            : 'border-emerald-200 bg-emerald-100 text-emerald-700';

        return (
            <section id="seller-approved-queue" className={`rounded-[2rem] border p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)] ${sectionTone}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${iconTone}`}>
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Catálogo vivo</p>
                            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Productos aprobados y activos</h2>
                            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">
                                Este bloque concentra tus publicaciones ya listas para vender, con acceso rápido a edición, clonación o pausa comercial.
                            </p>
                        </div>
                    </div>
                    <div className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${badgeTone}`}>
                        {products.length} en catálogo
                    </div>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                    {products.map((product) => (
                        <div key={`approved-${product.id}`} className="rounded-[1.5rem] border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-lg font-black text-zinc-900">{product.titulo}</p>
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                            Aprobada
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-zinc-500">
                                        {product.product_type}
                                        {product.category?.nombre ? ` | ${product.category.nombre}` : ''}
                                        {' | activa'}
                                    </p>
                                    <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-700">
                                        {product.resumen || 'Producto aprobado y activo dentro del catálogo comercial.'}
                                    </p>
                                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                                        Actualizada {resolveObservationTimestamp(product) ? new Date(resolveObservationTimestamp(product)).toLocaleDateString() : 'sin fecha visible'}
                                    </p>
                                </div>
                                <div className="flex flex-col items-start gap-3 lg:items-end">
                                    <p className="text-lg font-black text-zinc-700">{formatAmount(product.precio)} {product.moneda}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <ProjectSectionIconButton
                                            icon={Pencil}
                                            label="Editar"
                                            hintContent="Editar publicación aprobada"
                                            onClick={() => handleReviewCorrection(product)}
                                            className="hover:text-[#F39200]"
                                        />
                                        <ProjectSectionIconButton
                                            icon={Copy}
                                            label="Clonar"
                                            hintContent="Clonar publicación"
                                            onClick={() => handleCloneProduct(product)}
                                        />
                                        <ProjectSectionIconButton
                                            icon={Power}
                                            label="Pausar"
                                            hintContent="Pausar publicación"
                                            onClick={() => handleToggleProductActive(product)}
                                            className="border-red-200 bg-white text-red-700 hover:text-red-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    };

    const renderPausedProductsQueue = ({ products, tone = 'company' }) => {
        if (products.length === 0) return null;

        const isSystemTone = tone === 'system';
        const sectionTone = isSystemTone
            ? 'border-zinc-300 bg-gradient-to-br from-zinc-100 via-white to-slate-100'
            : 'border-stone-300 bg-gradient-to-br from-stone-100 via-white to-zinc-100';
        const badgeTone = isSystemTone
            ? 'border-zinc-300 bg-white text-zinc-700'
            : 'border-stone-300 bg-white text-stone-700';
        const iconTone = isSystemTone
            ? 'border-zinc-300 bg-zinc-200 text-zinc-700'
            : 'border-stone-300 bg-stone-200 text-stone-700';

        return (
            <section id="seller-paused-queue" className={`rounded-[2rem] border p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)] ${sectionTone}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${iconTone}`}>
                            <Power className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Catálogo pausado</p>
                            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Productos inactivos</h2>
                            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">Recupera publicaciones pausadas o revísalas antes de devolverlas al catálogo visible.</p>
                        </div>
                    </div>
                    <div className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${badgeTone}`}>
                        {products.length} pausadas
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {products.map((product) => (
                        <div key={`paused-${product.id}`} className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-base font-black text-zinc-900">{product.titulo}</p>
                                        <span className="rounded-full bg-stone-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-700">
                                            Pausada
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-zinc-500">
                                        {product.product_type}
                                        {product.category?.nombre ? ` | ${product.category.nombre}` : ''}
                                        {product.estado ? ` | ${product.estado}` : ''}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                            {resolveObservationTimestamp(product)
                                                ? `Movimiento ${new Date(resolveObservationTimestamp(product)).toLocaleDateString()}`
                                                : 'Sin fecha visible'}
                                        </span>
                                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                            {formatAmount(product.precio)} {product.moneda}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-700">{product.resumen || 'Publicación pausada fuera del catálogo comercial activo.'}</p>
                                </div>
                                <div className="flex flex-col gap-3 xl:items-end">
                                    <div className="flex flex-wrap gap-2">
                                        <ProjectSectionIconButton
                                            icon={Power}
                                            label="Reactivar"
                                            hintContent="Reactivar publicación"
                                            onClick={() => handleToggleProductActive(product)}
                                            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:text-emerald-700"
                                        />
                                        <ProjectSectionIconButton
                                            icon={Pencil}
                                            label="Revisar"
                                            hintContent="Revisar publicación pausada"
                                            onClick={() => handleReviewCorrection(product)}
                                            className="hover:text-[#F39200]"
                                        />
                                    </div>
                                    <p className="text-[11px] font-semibold text-zinc-500 xl:text-right">Reactivar devuelve el producto al catálogo; revisar te lleva al editor.</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    };

    const renderNewPendingProductsQueue = ({ products, tone = 'company' }) => {
        if (products.length === 0) return null;

        const isSystemTone = tone === 'system';
        const sectionTone = isSystemTone
            ? 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50'
            : 'border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-50';
        const badgeTone = isSystemTone
            ? 'border-blue-200 bg-white text-blue-700'
            : 'border-cyan-200 bg-white text-cyan-700';
        const iconTone = isSystemTone
            ? 'border-blue-200 bg-blue-100 text-blue-700'
            : 'border-cyan-200 bg-cyan-100 text-cyan-700';

        return (
            <section id="seller-new-pending-queue" className={`rounded-[2rem] border p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)] ${sectionTone}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${iconTone}`}>
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Primera revisión</p>
                            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Publicaciones nuevas pendientes</h2>
                            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">Aquí solo ves publicaciones nuevas que todavía no entraron en corrección ni reenviaron cambios.</p>
                        </div>
                    </div>
                    <div className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${badgeTone}`}>
                        {products.length} nuevas
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {products.map((product) => (
                        <div key={`new-pending-${product.id}`} className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-base font-black text-zinc-900">{product.titulo}</p>
                                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">
                                            Nueva
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-zinc-500">
                                        {product.product_type}
                                        {product.category?.nombre ? ` | ${product.category.nombre}` : ''}
                                        {' | pendiente'}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                            {product.fecha_creacion ? `Creada ${new Date(product.fecha_creacion).toLocaleDateString()}` : 'Sin fecha visible'}
                                        </span>
                                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                            {formatAmount(product.precio)} {product.moneda}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-700">{product.resumen || 'Publicación nueva en espera de la primera revisión administrativa.'}</p>
                                </div>
                                <div className="flex flex-col gap-3 xl:items-end">
                                    <div className="flex flex-wrap gap-2">
                                        <ProjectSectionIconButton
                                            icon={Pencil}
                                            label="Editar"
                                            hintContent="Editar publicación pendiente"
                                            onClick={() => handleReviewCorrection(product)}
                                            className="hover:text-[#F39200]"
                                        />
                                        <ProjectSectionIconButton
                                            icon={Power}
                                            label="Pausar"
                                            hintContent="Pausar publicación pendiente"
                                            onClick={() => handleToggleProductActive(product)}
                                            className="border-red-200 bg-white text-red-700 hover:text-red-700"
                                        />
                                    </div>
                                    <p className="text-[11px] font-semibold text-zinc-500 xl:text-right">Edita si todavía necesita ajuste o pausa si no debe entrar a revisión ahora.</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    };

    const renderSalesSection = ({ sectionId, title, sales, emptyLabel, showSeller = false }) => (
        <section id={sectionId} className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
            <MarketplaceSectionHeader
                eyebrow="Ventas y pedidos"
                title={title}
                description={showSeller ? 'Resumen consolidado de las transacciones cerradas por la empresa activa.' : 'Resumen de ventas liquidadas del alcance actual.'}
                badge={`${sales.length} ventas`}
            />
            <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-zinc-50/80 p-4">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                    <ClearSearchField
                        value={salesSearch}
                        onValueChange={setSalesSearch}
                        placeholder="Buscar por producto, tipo, vendedor o pedido"
                        inputClassName="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-10 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]"
                    />
                    <AnimatedSelect value={salesTypeFilter} onChange={(event) => setSalesTypeFilter(event.target.value)} className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]">
                        <option value={ALL_FILTER_VALUE}>Todos los tipos</option>
                        {availableSalesTypeFilters.map((type) => <option key={type} value={type}>{type}</option>)}
                    </AnimatedSelect>
                </div>
            </div>
            <div className="mt-6 space-y-4">
                {sales.length === 0 ? (
                    hasActiveSalesFilters
                        ? renderSellerEmptyState({
                            eyebrow: 'Sin coincidencias',
                            title: 'Los filtros dejaron esta lectura sin ventas visibles',
                            description: `${emptyLabel} Limpia los filtros para recuperar el histórico completo del alcance activo.`,
                            primaryActionLabel: 'Limpiar filtros',
                            onPrimaryAction: resetSalesFilters,
                            secondaryActionLabel: 'Ver catálogo',
                            onSecondaryAction: () => setProductsWorkbenchOpen(true),
                        })
                        : renderSellerEmptyState({
                            eyebrow: showSeller ? 'Ventas empresa' : 'Ventas sistema',
                            title: 'Todavía no hay ventas cerradas en este frente',
                            description: currentProducts.length > 0
                                ? `${emptyLabel} El siguiente paso natural es vigilar el catálogo activo mientras llegan las primeras transacciones.`
                                : `${emptyLabel} Aún no hay base comercial suficiente para registrar ventas en este alcance.`,
                            primaryActionLabel: currentProducts.length > 0 ? 'Ver catálogo' : (!isSuperAdmin || panelMode === 'system' ? 'Crear producto' : undefined),
                            onPrimaryAction: currentProducts.length > 0
                                ? () => setProductsWorkbenchOpen(true)
                                : (!isSuperAdmin || panelMode === 'system' ? openNewProductEditor : undefined),
                        })
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {sales.map((sale) => {
                            const saleStatus = String(sale.order_status || sale.order?.status || '').toLowerCase();
                            const isRefunded = saleStatus === 'refunded' || sale.is_refunded;
                            return (
                            <div key={sale.id} className={`rounded-[1.75rem] border bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfc_100%)] p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] ${isRefunded ? 'border-orange-200' : 'border-zinc-200'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <MarketplaceTypeBadge type={sale.product_type_snapshot} />
                                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isRefunded ? 'border-orange-200 bg-orange-50 text-[#A55A00]' : 'border-zinc-200 bg-zinc-50 text-zinc-500'}`}>
                                                {sale.order_id ? `Pedido #${sale.order_id}` : 'Venta directa'}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-lg font-black text-zinc-900">{sale.product_title_snapshot}</p>
                                        <p className="mt-2 text-sm font-semibold text-zinc-500">
                                            {showSeller && sale.seller_name ? `${sale.seller_name} | ` : ''}{(sale.created_at || sale.order?.created_at) ? new Date(sale.created_at || sale.order?.created_at).toLocaleDateString() : 'Sin fecha visible'}
                                        </p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-right">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">{isRefunded ? 'Devuelto' : 'Neto'}</p>
                                        <p className={`mt-1 text-2xl font-black ${isRefunded ? 'text-[#A55A00]' : 'text-zinc-900'}`}>
                                            {formatAmount(isRefunded ? sale.price : (sale.net_amount ?? sale.price))} <span className="text-sm text-zinc-400">{sale.currency || ''}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Producto</p>
                                        <p className="mt-1 text-sm font-black text-zinc-700">{sale.product_type_snapshot}</p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Comprador</p>
                                        <p className="mt-1 text-sm font-black text-zinc-700">{sale.order?.buyer_name || 'No visible'}</p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Estado</p>
                                        <p className={`mt-1 text-sm font-black ${isRefunded ? 'text-[#A55A00]' : 'text-zinc-700'}`}>{isRefunded ? 'Reembolsada' : (sale.order_status || sale.order?.status || 'Completada')}</p>
                                    </div>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                )}
            </div>
        </section>
    );

    const moderationPanels = [
        {
            key: 'observed',
            label: 'Correcciones',
            helper: 'Rechazadas u observadas',
            count: actionableObservedProducts.length,
            render: () => renderObservedProductsQueue({
                products: actionableObservedProducts,
                tone: panelMode === 'system' ? 'system' : 'company',
            }),
        },
        {
            key: 'resubmitted',
            label: 'Reenviadas',
            helper: 'Esperando decisión',
            count: resubmittedProducts.length,
            render: () => renderResubmittedProductsQueue({
                products: resubmittedProducts,
                tone: panelMode === 'system' ? 'system' : 'company',
            }),
        },
        {
            key: 'new',
            label: 'Nuevas',
            helper: 'Primera revisión',
            count: newPendingProducts.length,
            render: () => renderNewPendingProductsQueue({
                products: newPendingProducts,
                tone: panelMode === 'system' ? 'system' : 'company',
            }),
        },
        {
            key: 'paused',
            label: 'Pausadas',
            helper: 'Fuera de catálogo',
            count: pausedProducts.length,
            render: () => renderPausedProductsQueue({
                products: pausedProducts,
                tone: panelMode === 'system' ? 'system' : 'company',
            }),
        },
    ];
    const moderationVisiblePanels = moderationPanels.filter((panel) => (moderationView === 'all' ? panel.count > 0 : panel.key === moderationView));

    if (!canSell || !companyCanSell || !profileComplete) {
        return (
            <MarketplaceShell className="marketplace-internal-page">
                <div className="mx-auto max-w-[1200px]">
                    <MarketplaceEmptyState
                        eyebrow="Acceso restringido"
                        title="Panel vendedor"
                        description={!canSell
                            ? 'Solo administradores de empresa y superadministración pueden vender en marketplace.'
                            : !profileComplete
                                ? `Completa tu perfil en Ajustes > Personal antes de vender. Faltan: ${(user?.marketplace_profile_missing_labels || []).join(', ')}.`
                                : 'La superadministración revocó temporalmente la capacidad de venta de esta empresa.'}
                        primaryActionLabel={canSell && profileComplete ? undefined : 'Completar perfil'}
                        onPrimaryAction={canSell && !companyCanSell ? undefined : (!profileComplete ? () => { window.location.href = '/settings?tab=usuarios&edit_user=me'; } : undefined)}
                    />
                </div>
            </MarketplaceShell>
        );
    }

    const companyStatsCards = [
        { label: 'Productos empresa', value: companyStats?.products_count ?? 0, tone: 'blue' },
        { label: 'Ventas empresa', value: companyStats?.sales_count ?? 0, tone: 'orange' },
        { label: 'Bruto empresa', value: formatAmount(companyStats?.gross_income), tone: 'zinc' },
        { label: 'Neto empresa', value: formatAmount(companyStats?.net_income), tone: 'blue' },
        { label: 'Devoluciones', value: companyStats?.refunded_sales_count ?? 0, tone: 'orange' },
        { label: 'Devuelto', value: formatAmount(companyStats?.refunded_amount), tone: 'zinc' },
    ];

    const systemStatsCards = [
        { label: 'Productos sistema', value: systemStats?.products_count ?? 0, tone: 'blue' },
        { label: 'Ventas sistema', value: systemStats?.sales_count ?? 0, tone: 'orange' },
        { label: 'Bruto sistema', value: formatAmount(systemStats?.gross_income), tone: 'zinc' },
        { label: 'Neto sistema', value: formatAmount(systemStats?.net_income), tone: 'blue' },
        { label: 'Devoluciones', value: systemStats?.refunded_sales_count ?? 0, tone: 'orange' },
        { label: 'Devuelto', value: formatAmount(systemStats?.refunded_amount), tone: 'zinc' },
    ];
    return (
        <MarketplaceShell className="marketplace-internal-page">
            <div className="space-y-8">
                <MarketplaceDashboardHeader
                    backTo="/marketplace"
                    title="Mis ventas"
                    subtitle={isSuperAdmin
                        ? 'Backoffice comercial con lectura dual de Empresa y Sistema dentro de Tienda clásica'
                        : 'Backoffice comercial de la empresa activa para publicar, moderar y vender'}
                    contextLabel={isSuperAdmin
                        ? `Contexto actual · ${panelMode === 'system' ? 'Sistema GiProy' : companyName}`
                        : `Empresa activa · ${companyName}`}
                    actions={(
                        <div className="flex items-center gap-2">
                            <ProjectSectionIconButton
                                icon={Package}
                                label="Abrir catálogo"
                                hintContent="Abrir catálogo de publicaciones"
                                onClick={() => setProductsWorkbenchOpen(true)}
                            />
                            <ProjectSectionIconButton
                                icon={ShoppingCart}
                                label="Abrir ventas"
                                hintContent="Abrir bandeja de ventas"
                                onClick={() => setSalesWorkbenchOpen(true)}
                                className="text-[#136191]"
                            />
                        </div>
                    )}
                />

                {isSuperAdmin ? (
                    <section className="rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[3px_3px_10px_rgba(15,23,42,0.045),-3px_-3px_10px_rgba(255,255,255,0.82)]">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Contexto vendedor</p>
                                <p className="mt-1 text-sm font-semibold text-zinc-600">
                                    {panelMode === 'company'
                                        ? `Empresa activa: ${companyName}`
                                        : 'Operación directa como Sistema GiProy'}
                                </p>
                            </div>
                            <ProjectSegmentedSwitch
                                value={panelMode}
                                onChange={setPanelMode}
                                options={[
                                    { value: 'company', label: 'Empresa', title: companyName },
                                    { value: 'system', label: 'Sistema', title: 'Catálogo GiProy' },
                                ]}
                                size="sm"
                                minSegmentWidth={126}
                                ariaLabel="Seleccionar contexto vendedor"
                            />
                        </div>
                    </section>
                ) : null}

                <section className="grid gap-6 xl:grid-cols-3">
                    <MarketplaceSectionCard
                        eyebrow="Bandeja principal"
                        title="Catálogo publicado"
                        description="Empieza desde el listado real de productos para editar, activar, pausar o corregir publicaciones según su estado."
                        actionLabel="Abrir catálogo"
                        onAction={() => setProductsWorkbenchOpen(true)}
                    >
                        <div className="space-y-3">
                            {sellerProductPreview.length === 0 ? (
                                <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm font-medium text-zinc-500">
                                    No hay productos visibles en este contexto.
                                </div>
                            ) : sellerProductPreview.map((product) => {
                                const needsCorrection = product.estado === 'rejected' || Boolean(product.admin_notes && String(product.admin_notes).trim());
                                const nextActionLabel = !product.activo
                                    ? 'Reactivar o revisar'
                                    : needsCorrection
                                        ? 'Corregir observación'
                                        : product.estado === 'pending'
                                            ? 'Esperando moderación'
                                            : 'Catálogo activo';
                                return (
                                    <div key={`seller-product-preview-${product.id}`} className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div className="min-w-0">
                                                <p className="text-sm font-black uppercase tracking-[0.12em] text-zinc-900">{product.titulo}</p>
                                                <p className="mt-1 text-sm font-medium text-zinc-600">
                                                    {product.category?.nombre || 'Sin categoría'} · {product.estado || 'Sin estado'}
                                                </p>
                                            </div>
                                            <span className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                {formatAmount(product.precio)} {product.moneda}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                {nextActionLabel}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </MarketplaceSectionCard>

                    <MarketplaceSectionCard
                        eyebrow="Operación comercial"
                        title="Ventas recientes"
                        description="Empieza desde las ventas reales para abrir el pedido, revisar comprador y seguir el circuito comercial desde un listado útil."
                        actionLabel="Abrir ventas"
                        onAction={() => setSalesWorkbenchOpen(true)}
                    >
                        <div className="space-y-3">
                            {sellerSalesPreview.length === 0 ? (
                                <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm font-medium text-zinc-500">
                                    Todavía no hay ventas visibles en este contexto.
                                </div>
                            ) : sellerSalesPreview.map((sale) => {
                                const saleStatus = String(sale.order_status || sale.order?.status || '').toLowerCase();
                                const isRefunded = saleStatus === 'refunded' || sale.is_refunded;
                                const nextActionLabel = saleStatus === 'awaiting_manual_validation'
                                    ? 'Validar transferencia'
                                    : isRefunded
                                        ? 'Revisar devolución'
                                        : sale.order_id
                                            ? 'Abrir pedido'
                                            : 'Seguir venta';
                                return (
                                    <div key={`seller-sale-preview-${sale.id}`} className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div className="min-w-0">
                                                <p className="text-sm font-black uppercase tracking-[0.12em] text-zinc-900">{sale.product_title_snapshot}</p>
                                                <p className="mt-1 text-sm font-medium text-zinc-600">
                                                    {sale.order_id ? `Pedido #${sale.order_id}` : 'Venta directa'} · {sale.order?.buyer_name || 'Comprador no visible'}
                                                </p>
                                            </div>
                                            <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isRefunded ? 'border-orange-200 bg-orange-50 text-[#A55A00]' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                                                {isRefunded ? 'Devuelto' : 'Neto'} · {formatAmount(isRefunded ? sale.price : (sale.net_amount ?? sale.price))} {sale.currency || ''}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                {nextActionLabel}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </MarketplaceSectionCard>

                    <MarketplaceSectionCard
                        eyebrow="Atención comercial"
                        title="Moderación"
                        description="Aquí deben aparecer primero las publicaciones que requieren atención real: correcciones, reenvíos, pendientes nuevas y catálogo pausado."
                        actionLabel="Abrir moderación"
                        onAction={() => openModerationWorkbench()}
                    >
                        <div className="space-y-3">
                            {[
                                { label: 'Correcciones', value: sellerModerationSummary.correctionsRequired, helper: 'Rechazadas u observadas' },
                                { label: 'Reenviadas', value: sellerModerationSummary.resubmitted, helper: 'Esperando nueva decisión' },
                                { label: 'Nuevas', value: sellerModerationSummary.pendingNewTotal, helper: 'Primera revisión' },
                                { label: 'Pausadas', value: sellerModerationSummary.pausedTotal, helper: 'Fuera de catálogo' },
                            ].map((item) => (
                                <div key={`seller-moderation-preview-${item.label}`} className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-black uppercase tracking-[0.12em] text-zinc-900">{item.label}</p>
                                            <p className="mt-1 text-sm font-medium text-zinc-600">{item.helper}</p>
                                        </div>
                                        <span className="inline-flex min-w-[42px] items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
                                            {item.value}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </MarketplaceSectionCard>
                </section>

                {!isSuperAdmin ? (
                    <MarketplaceTrustPanel
                        title={`Operando en ${companyName}`}
                        items={[
                            'Este es el único alcance de venta disponible para administradores de empresa.',
                            'Aquí se gobiernan publicaciones, moderación, catálogo vivo y ventas de la empresa activa.',
                        ]}
                    />
                ) : null}
                {panelMode === 'company' && isSuperAdmin && !hasCompanyContext ? (
                    <section className="rounded-[2rem] border border-blue-200 bg-white p-10 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Panel empresa</p>
                        <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-zinc-900">Selecciona una empresa activa</h2>
                        <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">
                            La vista de empresa depende del tenant operativo actual. Selecciona una empresa desde el encabezado global y vuelve a esta pantalla para revisar su catálogo y sus ventas.
                        </p>
                    </section>
                ) : (
                    <>
                        {panelMode === 'company' ? renderStatsCards(companyStatsCards) : renderStatsCards(systemStatsCards)}
                        <section className="grid gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
                            {panelMode === 'system' || !isSuperAdmin ? (
                                <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${isSystemSellingContext ? 'border-violet-200 bg-violet-50' : 'border-blue-200 bg-blue-50'}`}>
                                                {isEditing ? <Pencil className={`h-5 w-5 ${isSystemSellingContext ? 'text-violet-700' : 'text-[#136191]'}`} /> : <PlusCircle className={`h-5 w-5 ${isSystemSellingContext ? 'text-violet-700' : 'text-[#136191]'}`} />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Editor comercial</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">{isEditing ? 'Edición en curso' : 'Publicar producto'}</h2>
                                            </div>
                                        </div>
                                        <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isSystemSellingContext ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-blue-200 bg-blue-50 text-[#136191]'}`}>
                                            {isSystemSellingContext ? 'Sistema' : companyName}
                                        </div>
                                    </div>

                                    <p className="mt-4 text-sm font-medium leading-relaxed text-zinc-600">
                                        El alta y edición de publicaciones ya vive en una superficie acotada, igual que el resto del backoffice comercial. Entra al editor cuando realmente vayas a publicar o corregir una ficha.
                                    </p>

                                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                                        <MarketplaceSectionCard
                                            eyebrow="Frente activo"
                                            title={isEditing ? (form.titulo || 'Edición de publicación') : 'Nueva publicación'}
                                            description={isEditing
                                                ? 'Hay una edición en curso lista para continuar dentro del editor modal.'
                                                : 'Empieza una nueva publicación sin invadir el lienzo principal de Mis ventas.'}
                                        >
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Modo</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-900">{isEditing ? 'Edición de publicación' : 'Nueva publicación'}</p>
                                                </div>
                                                <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Modalidad</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-900">{requiresReference ? 'Referenciado' : 'Manual'}</p>
                                                </div>
                                            </div>
                                        </MarketplaceSectionCard>
                                        <MarketplaceTrustPanel
                                            title="Edición concentrada y más limpia"
                                            items={[
                                                'El lienzo principal se mantiene enfocado en catálogo, ventas y moderación.',
                                                'El editor abre como un frente real y conserva la trazabilidad del producto activo.',
                                            ]}
                                        />
                                    </div>

                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <ProjectSectionIconButton
                                            icon={isEditing ? Pencil : PlusCircle}
                                            label={isEditing ? 'Abrir editor' : 'Nuevo producto'}
                                            hintContent={isEditing ? 'Abrir editor de producto' : 'Crear nuevo producto'}
                                            onClick={isEditing ? openProductEditor : openNewProductEditor}
                                            className="text-[#136191]"
                                        />
                                        {isEditing && (
                                            <ProjectSectionIconButton
                                                icon={Trash2}
                                                label="Limpiar edición"
                                                hintContent="Limpiar edición activa"
                                                onClick={resetFormState}
                                                className="border-red-200 bg-white text-red-700 hover:text-red-700"
                                            />
                                        )}
                                    </div>
                                </section>
                            ) : (
                                <section className="rounded-[2rem] border border-blue-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50">
                                            <Building2 className="h-5 w-5 text-[#136191]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Panel empresa</p>
                                            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">{companyName}</h2>
                                        </div>
                                    </div>
                                    <p className="mt-6 text-sm font-medium leading-relaxed text-zinc-600">
                                        Como <span className="font-black uppercase">Superadministrador</span> aquí ves el desempeño comercial agregado de la empresa activa, pero las publicaciones exclusivas de `Sistema` se administran en el panel homónimo.
                                    </p>
                                    <div className="mt-6 rounded-[1.5rem] border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-medium leading-relaxed text-[#136191]">
                                        Esta vista está pensada para supervisión y lectura operativa. Si necesitas revisar otra empresa, cambia primero la empresa activa desde el encabezado global.
                                    </div>
                                </section>
                            )}

                            <div className="space-y-8">
                                {(panelMode === 'system' || !isSuperAdmin) && (
                                    <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Operación comercial</p>
                                        <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-zinc-900">Frentes de trabajo activos</h2>
                                        <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600">
                                            El trabajo real de catálogo, ventas y moderación ya vive en sus bandejas modales. Aquí dejamos solo una lectura corta del contexto para no duplicar paneles técnicos.
                                        </p>
                                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                                            <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Catálogo activo</p>
                                                <p className="mt-2 text-2xl font-black text-zinc-900">{approvedActiveProducts.length}</p>
                                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Publicaciones visibles</p>
                                            </div>
                                            <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Moderación</p>
                                                <p className="mt-2 text-2xl font-black text-zinc-900">{sellerModerationSummary.correctionsRequired + sellerModerationSummary.pendingNewTotal + sellerModerationSummary.resubmitted}</p>
                                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Pendientes de atención</p>
                                            </div>
                                            <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Catálogo pausado</p>
                                                <p className="mt-2 text-2xl font-black text-zinc-900">{pausedProducts.length}</p>
                                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Fuera de catálogo</p>
                                            </div>
                                        </div>
                                        <div className="mt-5 flex flex-wrap gap-3">
                                            <ProjectSectionIconButton
                                                icon={Package}
                                                label="Abrir catálogo"
                                                hintContent="Abrir catálogo publicado"
                                                onClick={() => setProductsWorkbenchOpen(true)}
                                            />
                                            <ProjectSectionIconButton
                                                icon={ShoppingBag}
                                                label="Abrir ventas"
                                                hintContent="Abrir bandeja de ventas"
                                                onClick={() => setSalesWorkbenchOpen(true)}
                                                className="text-[#F39200] hover:text-[#F39200]"
                                            />
                                            <ProjectSectionIconButton
                                                icon={AlertTriangle}
                                                label="Abrir moderación"
                                                hintContent="Abrir moderación comercial"
                                                onClick={() => openModerationWorkbench()}
                                                className="text-[#F39200] hover:text-[#F39200]"
                                            />
                                        </div>
                                    </section>
                                )}
                                {isSuperAdmin && panelMode === 'system' && (
                                    <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50">
                                                    <Settings2 className="h-5 w-5 text-violet-700" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Sistema</p>
                                                    <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Gobierno de categorías</h2>
                                                </div>
                                            </div>
                                            <div className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700">
                                                {managedCategories.length} categorías
                                            </div>
                                        </div>
                                        <p className="mt-4 text-sm font-medium leading-relaxed text-zinc-600">
                                            La creación y ajuste de categorías ya vive en un frente acotado propio para que `Mis ventas` no mezcle catálogo, ventas y gobierno del sistema en un mismo lienzo.
                                        </p>
                                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                                            <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Activas</p>
                                                <p className="mt-2 text-2xl font-black text-zinc-900">{managedCategories.filter((category) => category.activa).length}</p>
                                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Visibles en catálogo</p>
                                            </div>
                                            <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Sistema</p>
                                                <p className="mt-2 text-2xl font-black text-zinc-900">{managedCategories.filter((category) => category.visibility_scope === 'system').length}</p>
                                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Uso exclusivo</p>
                                            </div>
                                            <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Globales</p>
                                                <p className="mt-2 text-2xl font-black text-zinc-900">{managedCategories.filter((category) => (category.visibility_scope || 'all') === 'all').length}</p>
                                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Compartidas</p>
                                            </div>
                                        </div>
                                        <div className="mt-5 flex flex-wrap gap-3">
                                            <ProjectSectionIconButton
                                                icon={Settings2}
                                                label="Abrir categorías"
                                                hintContent="Abrir gobierno de categorías"
                                                onClick={() => setCategoriesWorkbenchOpen(true)}
                                                className="border-violet-200 bg-violet-50 text-violet-700 hover:text-violet-700"
                                            />
                                        </div>
                                    </section>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </div>

            <AppModalShell
                isOpen={productEditorOpen}
                onClose={() => setProductEditorOpen(false)}
                size="3xl"
                panelClassName="max-h-[94vh] flex flex-col"
            >
                <AppModalHeader
                    {...INTERNAL_MODAL_HEADER_PROPS}
                    title={isEditing ? 'Editar producto' : 'Publicar producto'}
                    subtitle={isSystemSellingContext
                        ? 'Editor comercial acotado para el catálogo oficial de Sistema'
                        : 'Editor comercial acotado para publicar y ajustar la oferta de la empresa activa'}
                    icon={isEditing ? Pencil : PlusCircle}
                    iconClassName={isSystemSellingContext ? 'text-violet-700' : 'text-[#136191]'}
                    iconWrapClassName={isSystemSellingContext ? 'border-violet-200 bg-violet-50' : 'border-blue-200 bg-blue-50'}
                    onClose={() => setProductEditorOpen(false)}
                />
                <MarketplaceModalScrollBody>
                    <form id="seller-product-form" onSubmit={handleSubmit} className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${isSystemSellingContext ? 'border-violet-200 bg-violet-50' : 'border-blue-200 bg-blue-50'}`}>
                                    {isEditing ? <Pencil className={`h-5 w-5 ${isSystemSellingContext ? 'text-violet-700' : 'text-[#136191]'}`} /> : <PlusCircle className={`h-5 w-5 ${isSystemSellingContext ? 'text-violet-700' : 'text-[#136191]'}`} />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{isSystemSellingContext ? 'Panel sistema' : 'Panel empresa'}</p>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">{isEditing ? 'Editar producto' : 'Nuevo producto'}</h2>
                                </div>
                            </div>
                            <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isSystemSellingContext ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-blue-200 bg-blue-50 text-[#136191]'}`}>
                                {isSystemSellingContext ? 'Sistema' : companyName}
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3">
                            <MarketplaceActionTile
                                eyebrow={isEditing ? 'Edición' : 'Publicación'}
                                title={isEditing ? 'Ajusta una publicación existente' : 'Crea una nueva publicación'}
                                description={isSystemSellingContext
                                    ? 'Este formulario gobierna el catálogo comercial de Sistema con una lectura más clara y guiada.'
                                    : 'Desde aquí publicas y actualizas la oferta comercial de la empresa activa.'}
                                onClick={isEditing ? openProductEditor : openNewProductEditor}
                                tone={isSystemSellingContext ? 'warm' : 'cool'}
                            />
                        </div>

                        <div className="mt-6 grid gap-4 xl:grid-cols-2">
                            <MarketplaceSectionCard
                                eyebrow="Contexto comercial"
                                title={isSystemSellingContext ? 'Oferta oficial de Sistema' : 'Oferta comercial de empresa'}
                                description={isSystemSellingContext
                                    ? 'Aquí se gobiernan licencias, actualizaciones y adicionales con una lectura oficial dentro del catálogo GiProy.'
                                    : 'Aquí se construye la oferta vendible de la empresa activa para APUs, Bases Maestras y Proyectos.'}
                            >
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Alcance</p>
                                        <p className="mt-1 text-sm font-black text-zinc-900">{isSystemSellingContext ? 'Sistema' : companyName}</p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Modo</p>
                                        <p className="mt-1 text-sm font-black text-zinc-900">{isEditing ? 'Edición de publicación' : 'Nueva publicación'}</p>
                                    </div>
                                </div>
                            </MarketplaceSectionCard>
                            <MarketplaceTrustPanel
                                title={isEditing ? 'Edición segura y trazable' : 'Publicación guiada y consistente'}
                                items={isEditing
                                    ? [
                                        'La trazabilidad comercial se conserva aunque ajustes el contenido operativo.',
                                        'Si hay observaciones administrativas activas, el guardado reenviará la publicación a moderación.',
                                    ]
                                    : [
                                        'El tipo, la modalidad y la categoría definen la visibilidad final del item en catálogo.',
                                        'Las publicaciones referenciadas conservan vínculo con el activo origen para proteger el circuito comercial.',
                                    ]}
                            />
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="space-y-4 rounded-[1.75rem] border border-zinc-200 bg-zinc-50/60 p-5">
                                <MarketplaceSectionHeader
                                    eyebrow="Bloque 1"
                                    title="Identidad comercial"
                                    description="Define cómo se verá y se entenderá la publicación dentro del catálogo."
                                />
                                <div className="grid gap-4">
                                    {[
                                        ['titulo', 'Título'],
                                        ['resumen', 'Resumen'],
                                        ['descripcion', 'Descripción'],
                                        ['incluye', 'Qué incluye'],
                                        ['no_incluye', 'Qué no incluye'],
                                    ].map(([key, label]) => (
                                        <label key={key} className="block space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{label}</span>
                                            <input value={form[key]} onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))} className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]" />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 rounded-[1.75rem] border border-zinc-200 bg-zinc-50/60 p-5">
                                <MarketplaceSectionHeader
                                    eyebrow="Bloque 2"
                                    title="Configuración comercial"
                                    description="Define tipo, modalidad, categoría, precio y metadatos que afectan la clasificación del item."
                                />
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="block space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Tipo de producto</span>
                                        <AnimatedSelect value={form.product_type} onChange={(event) => setForm((prev) => ({ ...prev, product_type: event.target.value }))} disabled={requiresReference || isEditing} className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-black uppercase text-zinc-700 outline-none disabled:cursor-not-allowed disabled:bg-zinc-100">
                                            {categoryOptions.map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </AnimatedSelect>
                                    </label>

                                    <label className="block space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Modalidad</span>
                                        <AnimatedSelect value={form.product_kind} onChange={(event) => handleProductKindChange(event.target.value)} disabled={isEditing} className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-black uppercase text-zinc-700 outline-none disabled:cursor-not-allowed disabled:bg-zinc-100">
                                            {canUseManualProducts && <option value="manual">Manual</option>}
                                            <option value="referenced">Referenciado</option>
                                        </AnimatedSelect>
                                    </label>

                                    <label className="block space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Categoría</span>
                                        <AnimatedSelect value={form.category_id} onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))} className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]">
                                            <option value="">Sin categoría</option>
                                            {visibleSellerCategories.map((category) => (
                                                <option key={category.id} value={category.id}>{category.nombre}</option>
                                            ))}
                                        </AnimatedSelect>
                                    </label>

                                    <label className="block space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Precio</span>
                                        <input value={form.precio} onChange={(event) => setForm((prev) => ({ ...prev, precio: event.target.value }))} className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]" />
                                    </label>

                                    <label className="block space-y-2 md:col-span-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Etiquetas (coma separada)</span>
                                        <input value={form.etiquetas} onChange={(event) => setForm((prev) => ({ ...prev, etiquetas: event.target.value }))} className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]" />
                                    </label>
                                </div>
                            </div>

                            {selectedCategory && (
                                <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold leading-relaxed text-zinc-600">
                                    Categoría seleccionada: <span className="font-black text-zinc-900">{selectedCategory.nombre}</span>
                                </div>
                            )}
                            {requiresReference && (
                                <div className="space-y-4 rounded-[1.75rem] border border-orange-200 bg-orange-50/50 p-5">
                                    <MarketplaceSectionHeader
                                        eyebrow="Bloque 3"
                                        title="Vinculación con activo origen"
                                        description="Este producto se publicará como referencia a un activo ya existente dentro del ecosistema clásico."
                                    />
                                    <label className="block space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Tipo origen</span>
                                        <AnimatedSelect value={form.source_type} onChange={(event) => handleSourceTypeChange(event.target.value)} disabled={isEditing} className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-black uppercase text-zinc-700 outline-none disabled:cursor-not-allowed disabled:bg-zinc-100">
                                            <option value="base_trabajo">Base</option>
                                            <option value="apu">APU</option>
                                            <option value="proyecto">Proyecto</option>
                                        </AnimatedSelect>
                                    </label>
                                    <label className="block space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Buscar origen</span>
                                        <ClearSearchField
                                            value={sourceSearch}
                                            onValueChange={setSourceSearch}
                                            placeholder="Buscar por nombre, código o descripción"
                                            disabled={isEditing}
                                            inputClassName="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-10 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]"
                                        />
                                    </label>
                                    <label className="block space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Entidad origen</span>
                                        <AnimatedSelect value={form.source_id} onChange={(event) => handleSourceSelection(event.target.value)} disabled={isEditing} className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200] disabled:cursor-not-allowed disabled:bg-zinc-100">
                                            <option value="">{sourcesLoading ? 'Cargando opciones...' : 'Seleccionar entidad'}</option>
                                            {sourceOptions.map((option) => (
                                                <option key={`${option.source_type}-${option.source_id}`} value={option.source_id} disabled={option.already_published || !option.is_publishable}>
                                                    {option.title}{option.already_published ? ' | Ya publicado' : ''}{!option.is_publishable ? ' | Uso interno' : ''}
                                                </option>
                                            ))}
                                        </AnimatedSelect>
                                    </label>
                                    {selectedSourceOption && (
                                        <div className="rounded-[1.5rem] border border-orange-100 bg-orange-50/60 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200]">Origen seleccionado</p>
                                            <p className="mt-2 text-sm font-black text-zinc-900">{selectedSourceOption.title}</p>
                                            {selectedSourceOption.subtitle && <p className="mt-1 text-xs font-semibold text-zinc-600">{selectedSourceOption.subtitle}</p>}
                                            {selectedSourceOption.detail && <p className="mt-1 text-xs font-medium text-zinc-500">{selectedSourceOption.detail}</p>}
                                            {!selectedSourceOption.is_publishable && (
                                                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-red-600">
                                                    {selectedSourceOption.blocked_reason || 'Este activo no puede publicarse.'}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {sourceOptions.some((option) => !option.is_publishable) && (
                                        <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-[#A55A00]">
                                            Los activos adquiridos desde marketplace quedan habilitados para uso interno, pero no para republicación.
                                        </div>
                                    )}
                                </div>
                            )}

                            {isEditing && (
                                <div className="rounded-[1.25rem] border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold leading-relaxed text-[#136191]">
                                    En edición solo se actualizan los campos operativos del item. La modalidad, el tipo y el origen publicado se conservan para proteger la trazabilidad comercial.
                                </div>
                            )}
                            {isEditing && editingProductNeedsResubmission && (
                                <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-[#A55A00]">
                                    Esta publicación tiene observaciones administrativas activas. Al guardar cambios volverá automáticamente a revisión y quedará reactivada para moderación.
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex flex-col gap-3 md:flex-row">
                            <button type="submit" disabled={submitting} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-900 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#F39200] disabled:opacity-60">
                                {isEditing ? <Pencil className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                                {submitting ? (isEditing ? 'Guardando cambios' : 'Publicando') : (isEditing ? 'Guardar cambios' : 'Publicar producto')}
                            </button>
                            {isEditing && (
                                <button type="button" onClick={resetFormState} className="flex h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-zinc-400">
                                    Cancelar edición
                                </button>
                            )}
                        </div>
                    </form>
                </MarketplaceModalScrollBody>
            </AppModalShell>

            <AppModalShell
                isOpen={productsWorkbenchOpen}
                onClose={() => setProductsWorkbenchOpen(false)}
                size="2xl"
                panelClassName="max-h-[92vh] flex flex-col"
            >
                <AppModalHeader
                    {...INTERNAL_MODAL_HEADER_PROPS}
                    title="Catálogo publicado"
                    subtitle="Bandeja funcional de productos, estados y acciones comerciales"
                    icon={Package}
                    iconClassName="text-[#136191]"
                    iconWrapClassName="border-blue-200 bg-blue-50"
                    onClose={() => setProductsWorkbenchOpen(false)}
                />
                <MarketplaceModalScrollBody>
                    {panelMode === 'company'
                        ? renderProductsSection({
                            sectionId: 'seller-products-modal-section',
                            title: 'Productos de empresa',
                            products: filteredCurrentProducts,
                            emptyLabel: currentProducts.length === 0
                                ? 'La empresa activa aún no tiene productos publicados en marketplace.'
                                : 'No hay productos de empresa que coincidan con los filtros actuales.',
                            showSeller: true,
                            editable: !isSuperAdmin,
                        })
                        : renderProductsSection({
                            sectionId: 'seller-products-modal-section',
                            title: 'Productos de sistema',
                            products: filteredCurrentProducts,
                            emptyLabel: currentProducts.length === 0
                                ? 'Sistema aún no tiene productos publicados en este catálogo.'
                                : 'No hay productos de Sistema que coincidan con los filtros actuales.',
                            showSeller: false,
                            editable: true,
                        })}
                </MarketplaceModalScrollBody>
            </AppModalShell>

            <AppModalShell
                isOpen={salesWorkbenchOpen}
                onClose={() => setSalesWorkbenchOpen(false)}
                size="2xl"
                panelClassName="max-h-[92vh] flex flex-col"
            >
                <AppModalHeader
                    {...INTERNAL_MODAL_HEADER_PROPS}
                    title="Ventas"
                    subtitle="Bandeja funcional de ventas, pedidos y trazabilidad comercial"
                    icon={ShoppingBag}
                    iconClassName="text-[#F39200]"
                    iconWrapClassName="border-orange-200 bg-orange-50"
                    onClose={() => setSalesWorkbenchOpen(false)}
                />
                <MarketplaceModalScrollBody>
                    {panelMode === 'company'
                        ? renderSalesSection({
                            sectionId: 'seller-sales-modal-section',
                            title: 'Ventas de empresa',
                            sales: filteredCurrentSales,
                            emptyLabel: currentSales.length === 0
                                ? 'La empresa activa todavía no registra ventas cerradas en marketplace.'
                                : 'No hay ventas de empresa que coincidan con los filtros actuales.',
                            showSeller: true,
                        })
                        : renderSalesSection({
                            sectionId: 'seller-sales-modal-section',
                            title: 'Ventas de sistema',
                            sales: filteredCurrentSales,
                            emptyLabel: currentSales.length === 0
                                ? 'Sistema todavía no registra ventas cerradas en marketplace.'
                                : 'No hay ventas de Sistema que coincidan con los filtros actuales.',
                            showSeller: false,
                        })}
                </MarketplaceModalScrollBody>
            </AppModalShell>

            <AppModalShell
                isOpen={moderationWorkbenchOpen}
                onClose={() => setModerationWorkbenchOpen(false)}
                size="2xl"
                panelClassName="max-h-[92vh] flex flex-col"
            >
                <AppModalHeader
                    {...INTERNAL_MODAL_HEADER_PROPS}
                    title="Moderación comercial"
                    subtitle="Frente operativo para correcciones, reenvíos, nuevas revisiones y catálogo pausado"
                    icon={AlertTriangle}
                    iconClassName="text-[#F39200]"
                    iconWrapClassName="border-orange-200 bg-orange-50"
                    onClose={() => setModerationWorkbenchOpen(false)}
                />
                <MarketplaceModalScrollBody className="space-y-6">
                    {(panelMode === 'system' || !isSuperAdmin) && (
                        <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Bandeja de moderación</p>
                                    <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-zinc-900">Trabaja por frente, no por scroll</h2>
                                    <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
                                        Elige el frente que quieres atender y concentra la revisión en ese estado operativo.
                                    </p>
                                </div>
                                <div className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                    {moderationPanels.reduce((acc, panel) => acc + panel.count, 0)} items en atención
                                </div>
                            </div>
                            <div className="mt-5 flex flex-col gap-3">
                                <ProjectSegmentedSwitch
                                    value={moderationView}
                                    onChange={setModerationView}
                                    options={[
                                        { value: 'all', label: 'Todo', title: 'Vista completa' },
                                        ...moderationPanels.map((panel) => ({
                                            value: panel.key,
                                            label: panel.label,
                                            title: panel.helper,
                                        })),
                                    ]}
                                    size="sm"
                                    minSegmentWidth={112}
                                    ariaLabel="Filtrar moderación comercial"
                                />
                                <div className="flex flex-wrap gap-2">
                                    <span className="marketplace-internal-chip">
                                        Total {moderationPanels.reduce((acc, panel) => acc + panel.count, 0)}
                                    </span>
                                    {moderationPanels.map((panel) => (
                                        <span key={panel.key} className="marketplace-internal-chip" data-tone={panel.count > 0 ? 'orange' : 'green'}>
                                            {panel.label} {panel.count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                    {(panelMode === 'system' || !isSuperAdmin) && moderationVisiblePanels.map((panel) => (
                        <div key={`moderation-panel-${panel.key}`}>
                            {panel.render()}
                        </div>
                    ))}
                    {(panelMode === 'system' || !isSuperAdmin) && actionableObservedProducts.length === 0 && resubmittedProducts.length === 0 && newPendingProducts.length === 0 && pausedProducts.length === 0 ? (
                        <MarketplaceEmptyState
                            eyebrow="Sin pendientes"
                            title="No hay frentes de moderación abiertos"
                            description="El catálogo actual no tiene correcciones, reenvíos, nuevas revisiones ni pausas que requieran atención inmediata."
                        />
                    ) : null}
                </MarketplaceModalScrollBody>
            </AppModalShell>

            <AppModalShell
                isOpen={categoriesWorkbenchOpen}
                onClose={() => setCategoriesWorkbenchOpen(false)}
                size="2xl"
                panelClassName="max-h-[92vh] flex flex-col"
            >
                <AppModalHeader
                    {...INTERNAL_MODAL_HEADER_PROPS}
                    title="Categorías marketplace"
                    subtitle="Gobierno del catálogo base de Tienda para Sistema"
                    icon={Settings2}
                    iconClassName="text-violet-700"
                    iconWrapClassName="border-violet-200 bg-violet-50"
                    onClose={() => setCategoriesWorkbenchOpen(false)}
                />
                <MarketplaceModalScrollBody>
                    <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50">
                                    <Settings2 className="h-5 w-5 text-violet-700" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Sistema</p>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Categorías marketplace</h2>
                                </div>
                            </div>
                            <div className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700">
                                {managedCategories.length} categorías
                            </div>
                        </div>
                        <form onSubmit={handleCategorySubmit} className="mt-6 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="block space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Nombre</span>
                                    <input value={categoryForm.nombre} onChange={(event) => setCategoryForm((prev) => ({ ...prev, nombre: event.target.value }))} className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-violet-500" required />
                                </label>
                                <label className="block space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Alcance</span>
                                    <AnimatedSelect value={categoryForm.visibility_scope} onChange={(event) => setCategoryForm((prev) => ({ ...prev, visibility_scope: event.target.value }))} className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-black uppercase text-zinc-700 outline-none">
                                        <option value="all">Todos</option>
                                        <option value="system">Sistema</option>
                                        <option value="users">Usuarios</option>
                                    </AnimatedSelect>
                                </label>
                            </div>
                            <label className="block space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Descripción</span>
                                <textarea value={categoryForm.descripcion} onChange={(event) => setCategoryForm((prev) => ({ ...prev, descripcion: event.target.value }))} rows={3} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 outline-none focus:border-violet-500" />
                            </label>
                            <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
                                <label className="block space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Orden</span>
                                    <input type="number" value={categoryForm.sort_order} onChange={(event) => setCategoryForm((prev) => ({ ...prev, sort_order: event.target.value }))} className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-violet-500" />
                                </label>
                                <div className="flex items-end">
                                    <label className="flex h-12 items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-700">
                                        <input type="checkbox" checked={Boolean(categoryForm.activa)} onChange={(event) => setCategoryForm((prev) => ({ ...prev, activa: event.target.checked }))} />
                                        Categoría activa
                                    </label>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 md:flex-row">
                                <button type="submit" disabled={categorySubmitting} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-700 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-violet-800 disabled:opacity-60">
                                    <Settings2 className="h-4 w-4" />
                                    {categorySubmitting ? 'Guardando categoría' : editingCategoryId ? 'Guardar categoría' : 'Crear categoría'}
                                </button>
                                {editingCategoryId && (
                                    <button type="button" onClick={resetCategoryFormState} className="flex h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-zinc-400">
                                        Cancelar edición
                                    </button>
                                )}
                            </div>
                        </form>
                        <div className="mt-6 space-y-3">
                            {managedCategories.map((category) => (
                                <div key={category.id} className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-5">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="text-lg font-black text-zinc-900">{category.nombre}</p>
                                            <p className="text-sm font-semibold text-zinc-500">
                                                {CATEGORY_SCOPE_LABELS[category.visibility_scope] || category.visibility_scope} | {category.activa ? 'activa' : 'inactiva'} | orden {category.sort_order || 0}
                                            </p>
                                            {category.descripcion && <p className="mt-1 text-xs font-medium text-zinc-500">{category.descripcion}</p>}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <ProjectSectionIconButton
                                                icon={Pencil}
                                                label="Editar"
                                                hintContent="Editar categoría"
                                                onClick={() => handleEditCategory(category)}
                                                className="border-violet-200 bg-white text-violet-700 hover:text-violet-700"
                                            />
                                            <ProjectSectionIconButton
                                                icon={Power}
                                                label={category.activa ? 'Desactivar' : 'Activar'}
                                                hintContent={category.activa ? 'Desactivar categoría' : 'Activar categoría'}
                                                onClick={() => handleToggleCategoryActive(category)}
                                                className={category.activa
                                                    ? 'border-red-200 bg-red-50 text-red-700 hover:text-red-700'
                                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:text-emerald-700'}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </MarketplaceModalScrollBody>
            </AppModalShell>
        </MarketplaceShell>
    );
};

export default SellerDashboard;
