
unit uMain;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Clipboard, Winapi.ShellAPI,
  FMX.Dialogs, FMX.TabControl,
  FMX.Layouts, FMX.Effects, FMX.TMSGridData, FMX.Objects,
  FMX.Controls.Presentation, FMX.StdCtrls,
  FMX.TMSBaseControl, FMX.TMSLed, FMX.TMSTreeViewBase, FMX.TMSTreeViewData, Uni,
  FMX.DialogService,
  FMX.TMSCustomTreeView, FMX.TMSTreeView, FMX.Edit, FMX.Menus, FMX.TreeView,
  FMX.TMSFNCTypes,
  FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.textlayout, System.Math,
  System.StrUtils, FMX.Platform,
  Windows, FMX.TMSFNCGraphicsTypes, FMX.TMSFNCGridCell, System.DateUtils,
  FMX.TMSFNCGridOptions,
  IdBaseComponent, IdCoder, IdCoder3to4, IdCoderMIME, IdGlobal, IdMessageClient,
  IdSMTP,
  FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData,
  FMX.TMSFNCCustomGrid,
  FMX.TMSFNCGrid, FMX.TMSFNCTreeViewBase, FMX.TMSFNCTreeViewData,
  FMX.TMSFNCCustomTreeView,
  FMX.TMSFNCTreeView, FMX.ListView.Types, FMX.ListView.Appearances,
  FMX.ListView.Adapters.Base,
  FMX.ListView, System.ImageList, FMX.ImgList, FMX.TMSFNCSplitter,
  FMX.TMSFNCHTMLImageContainer,
  IdComponent, System.NetEncoding, IdSSLOpenSSL, IdTCPConnection, IdTCPClient,
  IdHTTP,
  FMX.TMSFNCCheckBox, FMX.Memo.Types, FMX.ScrollBox, FMX.Memo,
  FMX.DateTimeCtrls, FMX.EditBox,
  System.JSON, FMX.NumberBox, FMX.TMSFNCListBox, FMX.TMSFNCCheckedListBox,
  FMX.ListBox, FMX.Colors,
  FMX.TMSFNCCustomSelector, FMX.TMSFNCColorSelector, FMX.TMSFNCCustomComponent,
  FMX.DialogService.Sync, FMX.TMSFNCBitmapContainer, System.Rtti,
  FMX.Grid.Style, FMX.Grid,
  FMX.TMSGridCell, FMX.TMSGridOptions, FMX.TMSCustomGrid, FMX.TMSGrid,
  FMX.TMSFNCStyles,
  FMX.TMSFNCCustomPicker, FMX.TMSFNCComboBox, FMX.TMSFNCGridDatabaseAdapter,
  Data.DB,
  Datasnap.DBClient, Data.Bind.Controls, FMX.Bind.Navigator,
  Data.Bind.Components, Data.Bind.DBScope,
  FMX.Toast.Windows, FMX.TMSFNCChart, FMX.TMSFNCWebBrowser,
  FMX.TMSFNCEdgeWebBrowser,
  System.Bindings.Outputs, FMX.Bind.Editors, Data.Bind.EngExt,
  FMX.Bind.DBEngExt,
  FMX.TMSFNCDataGridCell, FMX.TMSFNCDataGridData, FMX.TMSFNCDataGridBase,
  FMX.TMSFNCDataGridCore, uGridFNC,
  FMX.TMSFNCDataGridRenderer, FMX.TMSFNCDataGrid,
  FMX.TMSFNCDataGridDatabaseAdapter,
  System.Win.ComObj, Winapi.ActiveX, System.Threading, Unit_UsersIni,
  System.Generics.Collections, MySQLUniProvider,
  FMX.TMSFNCDatePicker, uDB_borrarAPU,
  uGiProySecureConfig_v1_0_3,
  IdSSL;

// I3:q!gYF?Bu#

const
  REALIZA_LOGIN = 0;
  RUC_CHECK_DELAY_MS = 500;

  RAW_SMBIOS_FIRMWARE_TABLE = $52534D42;
  FirmwareTableTypeRaw = 1;
  DRAG_THRESHOLD = 6.0; // px
  COL_Enter = $FF191919;
  COL_Exit = $00191919;
  COL_Pendiente = $FFFFF6DF; //$FFFFE5A0;

type
  TReportes = record
    ActaConstitucion: string;
    AnalisisPrecios: string;
    CronoTrabajo: string;
    CronoValorado: string;
    DesagregacionTecnologica: string;
    DesagregacionTecnologicaAPUS: string;
    EDTDiccionario: string;
    EDTListado: string;
    EDTValorada: string;
    EquipoProyecto: string;
    DescomposicionOrganizacion: string;
    FormulaPolinomica: string;
    GestionTiempos: string;
    PorcentajeIndirecto: string;
    Presupuesto: string;
    CurvasS: string;
  end;

type
  TRecursoDragItem = record
    CodRecursoCompleto: string;
    CodUnicoRecurso: string;
  end;
type
  TRecursoProc = reference to procedure(
    const CodRecursoCompleto, CodUnicoRecurso: string
    );

type
  TDragPayload = class
  private
    FJsonText: string;
  public
    constructor Create(const AJson: TJSONObject);
    property JsonText: string read FJsonText;
  end;

type
  TButtonHack = type TRectangle;

type
  dat_respuestaFicheroImportacion = record
    fichero: string;
    claveSalsa: string;
  end;

type
  TfrmMain = class(TForm)
    lyt_Background: TLayout;
    pmAPUS: TPopupMenu;
    MenuItem15: TMenuItem;
    MenuItem16: TMenuItem;
    MenuItem17: TMenuItem;
    pmRecursos: TPopupMenu;
    MenuItem11: TMenuItem;
    MenuItem12: TMenuItem;
    MenuItem13: TMenuItem;
    MenuItem14: TMenuItem;
    MenuItem18: TMenuItem;
    rect_5: TRectangle;
    lyt_Footer: TLayout;
    lyt_LateralOpciones: TLayout;
    rect_Opc1: TRectangle;
    lbl_3: TLabel;
    rect_Opc2: TRectangle;
    lbl_19: TLabel;
    glow_Opc2: TGlowEffect;
    rect_Opc3: TRectangle;
    lbl_110: TLabel;
    glow_Opc3: TGlowEffect;
    rect_OpcBase: TRectangle;
    lbl_111: TLabel;
    glow_1: TGlowEffect;
    lyt_6: TLayout;
    rect_AppClose2: TRectangle;
    iGlow_AppClose2: TInnerGlowEffect;
    rect_OpcBase2: TRectangle;
    lbl_116: TLabel;
    glow_11: TGlowEffect;
    lyt_Cuerpo: TLayout;
    lyt_Header: TLayout;
    lyt_19: TLayout;
    rect_7: TRectangle;
    lyt_23: TLayout;
    rect_8: TRectangle;
    lyt_21: TLayout;
    grdpnlyt2: TGridPanelLayout;
    lyt_25: TLayout;
    ln_ln2: TLine;
    lbl_TSuscripcion: TLabel;
    lyt_28: TLayout;
    rect_14: TRectangle;
    lbl_NUsuario: TLabel;
    lyt_26: TLayout;
    lbl_20: TLabel;
    led_LocalDB: TTMSFMXLED;
    lbl_21: TLabel;
    led_OnlineDB: TTMSFMXLED;
    lyt_27: TLayout;
    ln_ln3: TLine;
    lyt_5: TLayout;
    lbl_Fecha: TLabel;
    lbl_Hora: TLabel;
    lyt_22: TLayout;
    grdpnlyt7: TGridPanelLayout;
    lyt_Sub2: TLayout;
    tbcSubMenu2: TTabControl;
    tab_Sub2_0Vacio: TTabItem;
    tab_Sub2_1PreciosUnitarios: TTabItem;
    grdpnlyt4: TGridPanelLayout;
    lyt_29: TLayout;
    rect_OPC1_Opciones: TRectangle;
    lbl_117: TLabel;
    img_OPC1_Opciones: TImage;
    iGlow_OPC1_Opciones: TInnerGlowEffect;
    lyt_OPC1_Subcategorias: TLayout;
    rect_OPC1_Subcategorias: TRectangle;
    lbl_118: TLabel;
    iGlow_OPC1_Subcategorias: TInnerGlowEffect;
    img_OPC1_Subcategorias: TImage;
    lyt_OPC1Recursos: TLayout;
    rect_OPC1_Recursos: TRectangle;
    lbl_119: TLabel;
    iGlow_OPC1_Recursos: TInnerGlowEffect;
    img_OPC1_Recursos: TImage;
    lyt_OPC1_APUS: TLayout;
    rect_OPC1_APUS: TRectangle;
    lbl_120: TLabel;
    iGlow_OPC1_Apus: TInnerGlowEffect;
    img_OPC1_Apus: TImage;
    tab_Sub2_2Presupuestos: TTabItem;
    lyt_57: TLayout;
    grdpnlyt1: TGridPanelLayout;
    lyt_58: TLayout;
    rect_OPC2_CrearPresupuesto: TRectangle;
    iGlow_OPC2_CrearPresupuesto: TInnerGlowEffect;
    lbl_9: TLabel;
    lyt_59: TLayout;
    rect_OPC2_HistoricoPresupuestos: TRectangle;
    iGlow_OPC2_HistoricoPresupuestos: TInnerGlowEffect;
    lbl_143: TLabel;
    lyt_Sub3: TLayout;
    tbcSubMenu3: TTabControl;
    tab_Sub3_0Vacio: TTabItem;
    tab_Sub3_1OpcionesDB: TTabItem;
    rect_SubMenu3_1: TRectangle;
    grdpnlyt3: TGridPanelLayout;
    lyt_30: TLayout;
    rect_sub3DB1: TRectangle;
    rect_2: TRectangle;
    lbl_1: TLabel;
    lyt_31: TLayout;
    rect_sub3DB2: TRectangle;
    rect_15: TRectangle;
    lbl_112: TLabel;
    lyt_33: TLayout;
    rect_sub3DB4: TRectangle;
    rect_17: TRectangle;
    lbl_114: TLabel;
    lyt_34: TLayout;
    rect_sub3DB5: TRectangle;
    rect_18: TRectangle;
    lbl_115: TLabel;
    tab_Sub3_2Categorias: TTabItem;
    rect_SubMenu3_2: TRectangle;
    grdpnlyt31: TGridPanelLayout;
    lyt_110: TLayout;
    rect_SUB32Crear: TRectangle;
    rect_110: TRectangle;
    lbl_121: TLabel;
    lyt_111: TLayout;
    rect_SUB32Duplicar: TRectangle;
    rect_112: TRectangle;
    lbl_122: TLabel;
    lyt_112: TLayout;
    rect_SUB32Editar: TRectangle;
    rect_114: TRectangle;
    lbl_123: TLabel;
    lyt_114: TLayout;
    rect_SUB32Borrar: TRectangle;
    rect_118: TRectangle;
    lbl_125: TLabel;
    lyt_39: TLayout;
    rect_SUB32Actualizar: TRectangle;
    rect_139: TRectangle;
    lbl_136: TLabel;
    tab_Sub3_3Recursos: TTabItem;
    rect_SubMenu3_3: TRectangle;
    grdpnlyt311: TGridPanelLayout;
    lyt_11: TLayout;
    rect_SUB33Crear: TRectangle;
    rect_12: TRectangle;
    lbl_11: TLabel;
    lyt_12: TLayout;
    rect_SUB33Duplicar: TRectangle;
    rect_19: TRectangle;
    lbl_12: TLabel;
    lyt_13: TLayout;
    rect_SUB33Editar: TRectangle;
    rect_113: TRectangle;
    lbl_13: TLabel;
    lyt_14: TLayout;
    rect_SUB33Buscar: TRectangle;
    rect_117: TRectangle;
    lbl_14: TLabel;
    lyt_SUB33Borrar: TLayout;
    rect_SUB33Borrar: TRectangle;
    rect_120: TRectangle;
    lbl_15: TLabel;
    lyt_16: TLayout;
    rect_SUB33Actializar: TRectangle;
    rect_122: TRectangle;
    lbl_16: TLabel;
    tab_Sub3_4APUs: TTabItem;
    rect_SubMenu3_4: TRectangle;
    grdpnlyt33: TGridPanelLayout;
    lyt_120: TLayout;
    rect_SUB34Crear: TRectangle;
    rect_129: TRectangle;
    lbl_131: TLabel;
    lyt_121: TLayout;
    rect_SUB34Duplicar: TRectangle;
    rect_131: TRectangle;
    lbl_132: TLabel;
    lyt_122: TLayout;
    rect_SUB34Editar: TRectangle;
    rect_133: TRectangle;
    lbl_133: TLabel;
    lyt_123: TLayout;
    rect_SUB34Importar: TRectangle;
    rect_135: TRectangle;
    lbl_134: TLabel;
    lyt_124: TLayout;
    lyt_36: TLayout;
    tab_Sub3_5CrearPresupuestos: TTabItem;
    tab_Sub3_6Presupuestos: TTabItem;
    tab_Sub3_7GestionClientes: TTabItem;
    tab_Sub3_8Reportes: TTabItem;
    lyt_20: TLayout;
    rect_9: TRectangle;
    tbc_PreciosUnitarios: TTabControl;
    tab_PU_0Vacio: TTabItem;
    tab_PU_1SubCategorias: TTabItem;
    lyt_42: TLayout;
    lyt_43: TLayout;
    grdpnlyt5: TGridPanelLayout;
    lyt_45: TLayout;
    rect_cat1EquiposHerramientas: TRectangle;
    lbl_4: TLabel;
    lyt_46: TLayout;
    rect_cat2Materiales: TRectangle;
    lbl_139: TLabel;
    lyt_47: TLayout;
    rect_cat3Transporte: TRectangle;
    lbl_cat3Transporte: TLabel;
    lyt_48: TLayout;
    rect_cat4ManodeObra: TRectangle;
    lbl_cat4ManodeObra: TLabel;
    lyt_49: TLayout;
    rect_cat5SeguridadIndustrial: TRectangle;
    lbl_cat5SeguridadIndustrial: TLabel;
    lyt_SubCategoriasPreciosUnitarios: TLayout;
    rect_cat6PreciosUnitarios: TRectangle;
    lbl_129: TLabel;
    lyt_44: TLayout;
    tbc_Categorias: TTabControl;
    tab_cat0Vacio: TTabItem;
    tmr_Inicio: TTimer;
    tab_cat1EquiposHerramients: TTabItem;
    tab_cat2Materiales: TTabItem;
    tab_cat3Transporte: TTabItem;
    tab_cat4ManodeObra: TTabItem;
    tab_cat5SeguridadIndustrial: TTabItem;
    tab_cat6PrecioUnitarios: TTabItem;
    tab_PU_2Recursos: TTabItem;
    lyt_2: TLayout;
    lyt_3: TLayout;
    rect_1: TRectangle;
    lyt_8: TLayout;
    lbl_5: TLabel;
    lyt_9: TLayout;
    rect_4: TRectangle;
    edt_BuscarRecursosCategoria: TEdit;
    lyt_7: TLayout;
    rect_6: TRectangle;
    scrollV_1: TVertScrollBox;
    lyt_OPCRec1: TLayout;
    rect_OPCRec1: TRectangle;
    lbl_2: TLabel;
    lvOPCRec1: TListView;
    lyt_OPCRec2: TLayout;
    rect_OPCRec2: TRectangle;
    lbl_166: TLabel;
    lvOPCRec2: TListView;
    lyt_OPCRec3: TLayout;
    rect_OPCRec3: TRectangle;
    lbl_126: TLabel;
    lvOPCRec3: TListView;
    lyt_OPCRec4: TLayout;
    rect_OPCRec4: TRectangle;
    lbl_127: TLabel;
    lvOPCRec4: TListView;
    lyt_OPCRec5: TLayout;
    rect_OPCRec5: TRectangle;
    lbl_128: TLabel;
    lvOPCRec5: TListView;
    lyt_4: TLayout;
    rect_3: TRectangle;
    grid_Recursos: TTMSFNCGrid;
    tmsfncspltr1: TTMSFNCSplitter;
    tab_PU_3APUs: TTabItem;
    lyt_50: TLayout;
    lyt_15: TLayout;
    rect_11: TRectangle;
    lyt_116: TLayout;
    lbl_130: TLabel;
    lyt_117: TLayout;
    rect_111: TRectangle;
    edt_filtroLVApusCategoria: TEdit;
    Shadow_1: TShadowEffect;
    rect_RecursosSeleccionarTodos: TRectangle;
    iGlow_RecursosSeleccionarTodos: TInnerGlowEffect;
    rect_115: TRectangle;
    iGlow_11: TInnerGlowEffect;
    rect_21: TRectangle;
    lv_APUSCategoria: TListView;
    lyt_10: TLayout;
    lyt_51: TLayout;
    rect_13: TRectangle;
    rect_22: TRectangle;
    grid_APUSRecursos: TTMSFNCGrid;
    lyt_128: TLayout;
    lbl_144: TLabel;
    lyt_129: TLayout;
    rect_142: TRectangle;
    edt_FiltroListadoApus: TEdit;
    Shadow_11: TShadowEffect;
    lyt_89: TLayout;
    cbbEstadoAPUS: TComboBox;
    lyt_52: TLayout;
    rect_20: TRectangle;
    rect_23: TRectangle;
    lyt_53: TLayout;
    lyt_54: TLayout;
    lbl_6: TLabel;
    edt_APUSDescripcion: TEdit;
    lbl_7: TLabel;
    edt_APUSUnidad: TEdit;
    lyt_132: TLayout;
    lyt_35: TLayout;
    lbl_8: TLabel;
    lbl_APUSRendimiento: TLabel;
    lyt_86: TLayout;
    lyt_87: TLayout;
    lbl_35: TLabel;
    lbl_CostoIndirectoAPUS: TLabel;
    lbl_37: TLabel;
    lyt_88: TLayout;
    lbl_APUMCostoDirectoTotal: TLabel;
    lbl_APUMCostoIndirectoTotal: TLabel;
    lbl_APUMPrecioUnitarioTotal: TLabel;
    trvw_APUSVisor: TTMSFMXTreeView;
    lyt_130: TLayout;
    lbl_145: TLabel;
    ln_ln11: TLine;
    tmsfncspltr3: TTMSFNCSplitter;
    tmsfncspltr2: TTMSFNCSplitter;
    tab_PresupuestosGeneral: TTabItem;
    tab_Login: TTabItem;
    lyt_38: TLayout;
    rect_10: TRectangle;
    lbl_BaseActiva: TLabel;
    Shadow_5: TShadowEffect;
    tmr_Hora: TTimer;
    rect_136: TRectangle;
    grdpnlyt331: TGridPanelLayout;
    lyt_1: TLayout;
    rect_Sub35Crear: TRectangle;
    rect_140: TRectangle;
    lbl_167: TLabel;
    lyt_166: TLayout;
    rect_SUB35Duplicar: TRectangle;
    rect_146: TRectangle;
    lbl_168: TLabel;
    lyt_24: TLayout;
    lyt_60: TLayout;
    img_OPC2_CrearPresupuestos: TImage;
    img_OPC2_HistoricoPresupuestos: TImage;
    MenuItem19: TMenuItem;
    pm_mapas: TPopupMenu;
    MenuItem10: TMenuItem;
    MenuItem20: TMenuItem;
    tbcPresupuestos: TTabControl;
    tab_1PresupuestoDatos: TTabItem;
    tab_3PresupuestoStake: TTabItem;
    tab_4PresupuestoEDT: TTabItem;
    tab_2PresupuestoEDO: TTabItem;
    tab_6PresupuestoCronogramas: TTabItem;
    tab_7Desagregacion: TTabItem;
    grdpnlyt11: TGridPanelLayout;
    lyt1: TLayout;
    lyt2: TLayout;
    lyt3: TLayout;
    lyt4: TLayout;
    lyt5: TLayout;
    lyt7: TLayout;
    lyt8: TLayout;
    lyt9: TLayout;
    rct_1Presupuesto: TRectangle;
    lbl_41: TLabel;
    rct_2Presupuesto: TRectangle;
    lbl_42: TLabel;
    rct_3Presupuesto: TRectangle;
    lbl_43: TLabel;
    rct_4Presupuesto: TRectangle;
    lbl_44: TLabel;
    rct_5Presupuesto: TRectangle;
    lbl_45: TLabel;
    rct_6Presupuesto: TRectangle;
    lbl_46: TLabel;
    rct_7Presupuesto: TRectangle;
    lbl_47: TLabel;
    rct_8Presupuesto: TRectangle;
    lbl_48: TLabel;
    lyt6: TLayout;
    lyt10: TLayout;
    lyt11: TLayout;
    rct_1: TRectangle;
    lyt: TLayout;
    lyt12: TLayout;
    lbl_1481: TLabel;
    lyt13: TLayout;
    lbl_101: TLabel;
    edt_CodigoPresupuesto1: TEdit;
    lyt14: TLayout;
    lbl_1491: TLabel;
    lyt15: TLayout;
    ln1: TLine;
    edt_descripcionPresupuesto: TEdit;
    lyt46: TLayout;
    lyt48: TLayout;
    lbl_231: TLabel;
    dedt_PresentacionPresupuesto: TDateEdit;
    lbl_241: TLabel;
    lyt49: TLayout;
    ln10: TLine;
    edt_PlazoEjecucionPresupuesto: TEdit;
    lbl_251: TLabel;
    lyt51: TLayout;
    lyt53: TLayout;
    mmo_ObjetoPresupuesto: TMemo;
    shdwfct1: TShadowEffect;
    lyt54: TLayout;
    lyt55: TLayout;
    lbl_1631: TLabel;
    lyt56: TLayout;
    lyt57: TLayout;
    ln12: TLine;
    edt_NPresupuestoDireccion: TEdit;
    lyt58: TLayout;
    lyt59: TLayout;
    ln13: TLine;
    lyt16: TLayout;
    lbl_2311: TLabel;
    lbl_2411: TLabel;
    cbb_TProyectosPrespuesto: TComboBox;
    cbb_CategoriaPresupuesto: TComboBox;
    lyt161: TLayout;
    lbl_23111: TLabel;
    cbb_ambitoContratacion: TComboBox;
    lyt17: TLayout;
    lyt19: TLayout;
    cbb_paisNPresupuesto: TComboBox;
    lyt1611: TLayout;
    lbl_241111: TLabel;
    cbb_TipoContrato: TComboBox;
    lbl_2512: TLabel;
    cbb_TConstruccion: TComboBox;
    lbl_1641: TLabel;
    edt_NPresupuestoProvincia: TEdit;
    lbl_16511: TLabel;
    lbl_PresupuestoFinalizacion: TLabel;
    lbl_221: TLabel;
    lyt18: TLayout;
    lbl_2611: TLabel;
    lyt21: TLayout;
    ln3: TLine;
    edt_ValidezPresupuesto: TEdit;
    lbl_2513: TLabel;
    grdpnlyt8: TGridPanelLayout;
    lyt_61: TLayout;
    lyt_62: TLayout;
    rect_24: TRectangle;
    lbl_10: TLabel;
    MenuItem21: TMenuItem;
    lyt_63: TLayout;
    lyt_125: TLayout;
    lbl_146: TLabel;
    ln_12: TLine;
    lyt_115: TLayout;
    lyt_118: TLayout;
    edt_FiltroStokeDisponibles: TEdit;
    lyt_119: TLayout;
    rect_StakeDisponibleAdicionar: TRectangle;
    rect_130: TRectangle;
    lyt_126: TLayout;
    lyt_127: TLayout;
    lbl_148: TLabel;
    ln_15: TLine;
    grid_stakesAsignados: TTMSFNCGrid;
    lyt_65: TLayout;
    pm_StakeAsignados: TPopupMenu;
    MenuItem22: TMenuItem;
    MenuItem23: TMenuItem;
    lyt_67: TLayout;
    Trvw_EDO: TTMSFNCTreeView;
    lyt_68: TLayout;
    lyt_90: TLayout;
    grid_EDOStakes: TTMSFNCGrid;
    pm_EDO: TPopupMenu;
    MenuItem24: TMenuItem;
    MenuItem25: TMenuItem;
    lyt_135: TLayout;
    pm_EDT: TPopupMenu;
    MenuItem28: TMenuItem;
    MenuItem29: TMenuItem;
    MenuItem30: TMenuItem;
    MenuItem31: TMenuItem;
    MenuItem32: TMenuItem;
    MenuItem33: TMenuItem;
    MenuItem34: TMenuItem;
    lyt_137: TLayout;
    MenuItem37: TMenuItem;
    MenuItem35: TMenuItem;
    Trvw_EDT: TTMSFNCTreeView;
    lbl_25: TLabel;
    lyt_92: TLayout;
    grdpnlyt10: TGridPanelLayout;
    lyt_93: TLayout;
    lyt_97: TLayout;
    lbl_nProyectoLatitud: TLabel;
    lbl_NProyectoLongitud: TLabel;
    lyt_136: TLayout;
    lbl_153: TLabel;
    pm_ImagenReferencial: TPopupMenu;
    MenuItem7: TMenuItem;
    MenuItem8: TMenuItem;
    pm_Geolocalizacion: TPopupMenu;
    MenuItem36: TMenuItem;
    MenuItem38: TMenuItem;
    rect_StakeDisponibleEditar: TRectangle;
    lbl_26: TLabel;
    edt_NPresupuestoCiudad: TEdit;
    lyt_98: TLayout;
    lyt_99: TLayout;
    ln_2: TLine;
    lyt_100: TLayout;
    MenuItem41: TMenuItem;
    MenuItem42: TMenuItem;
    pm_LogoEmpresa: TPopupMenu;
    MenuItem43: TMenuItem;
    MenuItem44: TMenuItem;
    MenuItem45: TMenuItem;
    MenuItem46: TMenuItem;
    MenuItem47: TMenuItem;
    MenuItem48: TMenuItem;
    lbl_177: TLabel;
    lyt_157: TLayout;
    ln_113: TLine;
    edt_NPresupuestoCodReferencial: TEdit;
    lyt_159: TLayout;
    lyt_160: TLayout;
    lyt_163: TLayout;
    lbl_TCronogramaInicioFecha: TLabel;
    lyt_164: TLayout;
    lbl_cronoFechaInicio: TLabel;
    lyt_165: TLayout;
    lbl_178: TLabel;
    lbl_cronoPlazoEjecucion: TLabel;
    lyt_169: TLayout;
    lbl_180: TLabel;
    lbl_cronoFechaFinalizacion: TLabel;
    rect_31: TRectangle;
    lbl_50: TLabel;
    lyt_170: TLayout;
    lbl_182: TLabel;
    cbb_cronoTipoPeriodo: TComboBox;
    lyt_171: TLayout;
    lbl_183: TLabel;
    lbl_cronogramaNPeriodos: TLabel;
    ln_10: TLine;
    lyt_172: TLayout;
    ln_20: TLine;
    rect_119: TRectangle;
    lbl_179: TLabel;
    lyt_173: TLayout;
    chk_cronoDenotar: TCheckBox;
    lyt_174: TLayout;
    edt_CronoDenotar: TEdit;
    cbbColor_cronogramaDenotar: TComboColorBox;
    lyt_175: TLayout;
    chk_CronoFiltrar: TCheckBox;
    lyt_176: TLayout;
    edt_12: TEdit;
    lyt_177: TLayout;
    btn_EjecucionGlobal: TButton;
    rect_127: TRectangle;
    lbl_181: TLabel;
    pm_NPresupuesto: TPopupMenu;
    MenuItem49: TMenuItem;
    MenuItem9: TMenuItem;
    lyt_194: TLayout;
    lyt_195: TLayout;
    lyt_196: TLayout;
    rect_SUB35Guardar: TRectangle;
    rect_160: TRectangle;
    lbl_190: TLabel;
    rect_SUB35Undo: TRectangle;
    rect_162: TRectangle;
    lbl_193: TLabel;
    lbl_56: TLabel;
    lbl_RevisionPresupuesto: TLabel;
    bitmapContainer_1: TTMSFNCBitmapContainer;
    MenuItem50: TMenuItem;
    MenuItem51: TMenuItem;
    MenuItem52: TMenuItem;
    lbl_codUnicoTemporal: TLabel;
    pm_Pareto: TPopupMenu;
    popupItem_pareto_SinAplicar: TMenuItem;
    popupItem_Pareto_Global: TMenuItem;
    popupItem_Pareto_Cuenta: TMenuItem;
    lyt_73: TLayout;
    lyt_161: TLayout;
    lyt_162: TLayout;
    lyt_cronoPresupuesto: TLayout;
    tmsfncspltr9: TTMSFNCSplitter;
    grid_crono0: TTMSFMXGrid;
    lyt_201: TLayout;
    tbc1: TTabControl;
    tab_1: TTabItem;
    tab_2: TTabItem;
    tab_3: TTabItem;
    tab_4: TTabItem;
    tab_5: TTabItem;
    grdpnlyt12: TGridPanelLayout;
    lyt_202: TLayout;
    lyt_203: TLayout;
    lyt_204: TLayout;
    lyt_205: TLayout;
    lyt_206: TLayout;
    rect_tab1: TRectangle;
    rect_tab2: TRectangle;
    rect_tab3: TRectangle;
    rect_tab4: TRectangle;
    rect_tab5: TRectangle;
    lbl_57: TLabel;
    lbl_58: TLabel;
    lbl_59: TLabel;
    lbl_60: TLabel;
    lbl_61: TLabel;
    lyt_totalesCrono: TLayout;
    lyt_200: TLayout;
    rect_34: TRectangle;
    lbl_62: TLabel;
    lbl_63: TLabel;
    lbl_64: TLabel;
    lbl_65: TLabel;
    pmCalculoTiempos: TPopupMenu;
    MenuItem56: TMenuItem;
    ln_21: TLine;
    tbc_Cronogramas: TTabControl;
    tab_Valorados: TTabItem;
    tab_Trabajo: TTabItem;
    lyt24: TLayout;
    Layout1: TLayout;
    lyt_cronoPresupuesto1: TLayout;
    grid_crono01: TTMSFMXGrid;
    tmsfncspltr10: TTMSFNCSplitter;
    lyt_cronoPresupuesto2: TLayout;
    lyt221: TLayout;
    grid_calcTiempos: TTMSFNCGrid;
    lyt_tanteoCrono: TLayout;
    lyt26: TLayout;
    lyt20: TLayout;
    rect_161: TRectangle;
    lyt22: TLayout;
    lyt27: TLayout;
    lbl_1841: TLabel;
    ln_1141: TLine;
    lyt28: TLayout;
    lyt29: TLayout;
    lyt30: TLayout;
    lyt31: TLayout;
    lbl_1851: TLabel;
    edt_TanteoCronoDescripcion: TEdit;
    lbl_1861: TLabel;
    edt_TanteoCronoUnidad: TEdit;
    lyt32: TLayout;
    lyt33: TLayout;
    lbl_1871: TLabel;
    lbl_1881: TLabel;
    btn31: TButton;
    lyt34: TLayout;
    chk_APUT2RendimientoIgual: TCheckBox;
    lyt35: TLayout;
    lyt36: TLayout;
    rect_163: TRectangle;
    rect_165: TRectangle;
    lyt37: TLayout;
    lyt38: TLayout;
    lbl_1891: TLabel;
    lbl_EditAPUPorcentajeCostoInDirecto1: TLabel;
    lbl_1911: TLabel;
    lyt39: TLayout;
    lbl_TanteoCronoCostoDirecto: TLabel;
    lbl_TanteoCronoCostoIndirecto: TLabel;
    lbl_TanteoCronoTotal: TLabel;
    lyt_1771: TLayout;
    rect_159: TRectangle;
    lbl_1811: TLabel;
    lyt23: TLayout;
    lbl1: TLabel;
    edt_HorasJornada: TEdit;
    lbl2: TLabel;
    lyt2311: TLayout;
    lbl111: TLabel;
    edt_DiasSemanas: TEdit;
    lbl211: TLabel;
    lyt23111: TLayout;
    lbl1111: TLabel;
    edt_HoraInicioJornada: TEdit;
    lyt40: TLayout;
    lyt41: TLayout;
    lbl_TCronogramaInicioFecha1: TLabel;
    lbl_cronoFechaInicio1: TLabel;
    lyt42: TLayout;
    lbl_1781: TLabel;
    lbl_cronoDiasEjecucion1: TLabel;
    lyt43: TLayout;
    lbl_1801: TLabel;
    lbl_cronoFechaFin1: TLabel;
    rect_166: TRectangle;
    lbl_501: TLabel;
    ln_22: TLine;
    lyt44: TLayout;
    rect_167: TRectangle;
    lbl_195: TLabel;
    btn5: TButton;
    lyt45: TLayout;
    grid_CalcTiemposHeader: TTMSFNCGrid;
    MenuItem57: TMenuItem;
    tmr_autoguardado: TTimer;
    tab_sub2_3OtrosServicios: TTabItem;
    lyt60: TLayout;
    grdpnlyt13: TGridPanelLayout;
    rct_2: TRectangle;
    lyt61: TLayout;
    lyt62: TLayout;
    lyt63: TLayout;
    lyt64: TLayout;
    lyt65: TLayout;
    lyt66: TLayout;
    lyt67: TLayout;
    lyt_BannerPublicidad: TLayout;
    lyt71: TLayout;
    rct__fondo: TRectangle;
    rct__marcadeagua: TRectangle;
    lyt72: TLayout;
    rct_11: TRectangle;
    shdwfct: TShadowEffect;
    lyt73: TLayout;
    rct_12: TRectangle;
    edt_UUsuario: TEdit;
    Shadow_UUsuario: TShadowEffect;
    rct_13: TRectangle;
    edt_UPassword: TEdit;
    Shadow_UPassword: TShadowEffect;
    rct_btnLogin: TRectangle;
    Shadow_btnLogin: TShadowEffect;
    lbl_162: TLabel;
    lbl_olvido: TLabel;
    rct_14: TRectangle;
    lbl_310: TLabel;
    lyt74: TLayout;
    lyt75: TLayout;
    lyt76: TLayout;
    lyt77: TLayout;
    lyt78: TLayout;
    tab_registroUsuario: TTabItem;
    lyt79: TLayout;
    rct_16: TRectangle;
    rct_17: TRectangle;
    lyt80: TLayout;
    rct_18: TRectangle;
    Shadow_12: TShadowEffect;
    lyt81: TLayout;
    lyt84: TLayout;
    rct_RegistrarUsuario: TRectangle;
    Shadow_15: TShadowEffect;
    lbl_1621: TLabel;
    lbl4: TLabel;
    lyt_RNombre_Apellidos: TLayout;
    grdpnlyt14: TGridPanelLayout;
    lyt822: TLayout;
    lyt823: TLayout;
    edt_RNombre: TEdit;
    edt_RApellidos: TEdit;
    lyt_RPaisyMovil: TLayout;
    grdpnlyt141: TGridPanelLayout;
    lyt86: TLayout;
    lyt87: TLayout;
    edt_RMovil: TEdit;
    cbb_RPais: TTMSFNCComboBox;
    lyt88: TLayout;
    lbl5: TLabel;
    lbl6: TLabel;
    lbl7: TLabel;
    lyt_REmailyPassword: TLayout;
    grdpnlyt142: TGridPanelLayout;
    lyt90: TLayout;
    edt_REmail: TEdit;
    lyt91: TLayout;
    edt_RPassword: TEdit;
    lyt82: TLayout;
    rct_5: TRectangle;
    lyt93: TLayout;
    lyt94: TLayout;
    lbl13: TLabel;
    lbl_23112: TLabel;
    lyt151: TLayout;
    ln11: TLine;
    edt_AreaTerrenoPresupuesto: TEdit;
    lbl_23113: TLabel;
    lbl_23114: TLabel;
    lyt1511: TLayout;
    edt_AConstruccionPresupuesto: TEdit;
    ln111: TLine;
    lbl_231141: TLabel;
    rct_6: TRectangle;
    rct_StakeBorrar: TRectangle;
    pm_StakesDisponibles: TPopupMenu;
    MenuItem27: TMenuItem;
    MenuItem58: TMenuItem;
    tmsfncspltr6: TTMSFNCSplitter;
    lyt_142: TLayout;
    rct_8: TRectangle;
    rct_9: TRectangle;
    edt_EDOStakesFiltro: TEdit;
    rct_10: TRectangle;
    rct_19: TRectangle;
    rct_20: TRectangle;
    lyt68: TLayout;
    rct_21: TRectangle;
    rct_22: TRectangle;
    edt_EDTBuscar: TEdit;
    rct_23: TRectangle;
    rct_24: TRectangle;
    rct_25: TRectangle;
    rct_26: TRectangle;
    pm_paretoTiempo: TPopupMenu;
    MenuItem59: TMenuItem;
    MenuItem60: TMenuItem;
    MenuItem61: TMenuItem;
    ln_23: TLine;
    ln_24: TLine;
    lyt441: TLayout;
    rct_110: TRectangle;
    lbl_147: TLabel;
    grdpnlyt9: TGridPanelLayout;
    lyt95: TLayout;
    lyt96: TLayout;
    lyt97: TLayout;
    lyt98: TLayout;
    lyt99: TLayout;
    lyt100: TLayout;
    lbl_23: TLabel;
    lbl_24: TLabel;
    lbl_66: TLabel;
    lbl_APUT2SubTotal: TLabel;
    lbl_APUT2Iva: TLabel;
    lbl_APUT2Total: TLabel;
    lyt101: TLayout;
    rct_crono01Pareto: TRectangle;
    rct_28: TRectangle;
    tmsfncspltr7: TTMSFNCSplitter;
    lyt25: TLayout;
    lyt102: TLayout;
    Z: TLayout;
    lyt104: TLayout;
    lyt105: TLayout;
    grid_desagregacionCPC: TTMSFNCGrid;
    lyt103: TLayout;
    rct_27: TRectangle;
    rct_29: TRectangle;
    edt_filtroCPC: TEdit;
    rct_edtFiltroCPCClear: TRectangle;
    tbcCPC: TTabControl;
    tab_DesagregacionCPC: TTabItem;
    tab_CPC1: TTabItem;
    lyt106: TLayout;
    cbb_campoCPC: TTMSFNCComboBox;
    rct_30: TRectangle;
    rct_31: TRectangle;
    rct_32: TRectangle;
    rct_33: TRectangle;
    dbGridConnect_1: TTMSFNCGridDatabaseAdapter;
    pm_CPC: TPopupMenu;
    MenuItem62: TMenuItem;
    MenuItem63: TMenuItem;
    tab_RecursosUsadoDesgregacion: TTabItem;
    lyt107: TLayout;
    lyt108: TLayout;
    rct_111: TRectangle;
    lyt109: TLayout;
    lbl_158: TLabel;
    lyt110: TLayout;
    lyt111: TLayout;
    rct_115: TRectangle;
    vrtscrlbx1: TVertScrollBox;
    lyt_desgEquiposHerramientas: TLayout;
    rct_desgEquiposHerramientas: TRectangle;
    lbl_161: TLabel;
    lyt_desgMateriales: TLayout;
    rct_desgMateriales: TRectangle;
    lbl_197: TLabel;
    lyt_desgTransporte: TLayout;
    rct_desgTransporte: TRectangle;
    lbl_198: TLabel;
    lyt_desgManoObra: TLayout;
    rct_desgManoObra: TRectangle;
    lbl_199: TLabel;
    lyt_desgSeguridadIndustrial: TLayout;
    rct_desgSeguridadIndustrial: TRectangle;
    lbl_1100: TLabel;
    lyt117: TLayout;
    rct_121: TRectangle;
    grid_DesgRecursos: TTMSFNCGrid;
    tmsfncspltr11: TTMSFNCSplitter;
    rct_34: TRectangle;
    dbGridConnect_Desagregacion: TTMSFNCGridDatabaseAdapter;
    rct_35: TRectangle;
    lyt112: TLayout;
    tmsfncspltr12: TTMSFNCSplitter;
    lyt113: TLayout;
    rct_36: TRectangle;
    grid_DesagregacionAPUSHeader: TTMSFNCGrid;
    grid_DesagregacionAPUS: TTMSFNCGrid;
    lyt115: TLayout;
    lyt_91: TLayout;
    lyt_DesRecurso5: TLayout;
    lyt_DesRecurso4: TLayout;
    lyt_DesRecurso2: TLayout;
    lyt_DesRecurso1: TLayout;
    grdpnlyt15: TGridPanelLayout;
    lyt_95: TLayout;
    lyt_96: TLayout;
    lyt_138: TLayout;
    lyt_179: TLayout;
    lyt_199: TLayout;
    grdpnlyt151: TGridPanelLayout;
    lyt_1100: TLayout;
    lyt_1101: TLayout;
    lyt_1102: TLayout;
    lyt_1103: TLayout;
    lyt_1104: TLayout;
    lbl_67: TLabel;
    lbl_68: TLabel;
    lbl_69: TLabel;
    lbl_70: TLabel;
    lbl_71: TLabel;
    lbl_DesgRecursoSubtotal: TLabel;
    lbl_DesgRecursoPorcentaje2: TLabel;
    lyt_DesRecurso3: TLayout;
    lbl_DesgRecursoPorcentaje1: TLabel;
    rect_25: TRectangle;
    lbl_DesgRecursoIndirectos: TLabel;
    lbl_DesgRecursoCostoTotal: TLabel;
    lbl_DesgRecursoValorOfertado: TLabel;
    lyt_207: TLayout;
    rect_26: TRectangle;
    lyt_DESGTotal0: TLayout;
    lbl_72: TLabel;
    lyt_DESGTotal1: TLayout;
    rect_27: TRectangle;
    lyt_DESGTotal2: TLayout;
    rect_147: TRectangle;
    lyt_DESGTotal3: TLayout;
    rect_151: TRectangle;
    lyt_DESGTotal4: TLayout;
    rect_152: TRectangle;
    lbl_DesagPrecioTotalRubro: TLabel;
    lbl_DesgPesoRelativoRublo: TLabel;
    lbl_75: TLabel;
    lbl_DesgAgregadoPonderado: TLabel;
    tab_8FPolinomica: TTabItem;
    lyt_208: TLayout;
    lyt_1105: TLayout;
    rect_153: TRectangle;
    lyt_1106: TLayout;
    lbl_1101: TLabel;
    lyt_1108: TLayout;
    rect_158: TRectangle;
    scrollV_11: TVertScrollBox;
    lyt_1109: TLayout;
    rect_FpoliEquiposyHerramientas: TRectangle;
    lbl_1102: TLabel;
    lyt_1110: TLayout;
    rect_FpoliMateriales: TRectangle;
    lbl_1103: TLabel;
    lyt_1111: TLayout;
    rect_FpoliTransporte: TRectangle;
    lbl_1104: TLabel;
    lyt_1112: TLayout;
    rect_FpoliManoObra: TRectangle;
    lbl_1105: TLabel;
    lyt_1113: TLayout;
    rect_FpoliSeguridadIndustrial: TRectangle;
    lbl_1106: TLabel;
    lyt_209: TLayout;
    lyt_210: TLayout;
    tmsfncspltr13: TTMSFNCSplitter;
    lyt_211: TLayout;
    lyt_213: TLayout;
    grid_Fpolinomica: TTMSFNCGrid;
    tbc_Fpolinomica: TTabControl;
    tab_Fpol_2Cuadrilla: TTabItem;
    lyt_215: TLayout;
    tab_Fpol_1IndicesyCoeficientes: TTabItem;
    lyt_217: TLayout;
    lyt_218: TLayout;
    grid_FpolIndicesDisponibles: TTMSFNCGrid;
    rect_ActualizaIndices: TRectangle;
    rect_AdicionarIndice: TRectangle;
    lyt_219: TLayout;
    lyt_220: TLayout;
    lyt_221: TLayout;
    lyt_222: TLayout;
    lbl_ValorTotalIndice: TLabel;
    lbl_CoeficienteTotalFpol: TLabel;
    lyt_1107: TLayout;
    rect_154: TRectangle;
    lyt_1114: TLayout;
    grid_FpolCuadrillaTipo: TTMSFNCGrid;
    lyt_1115: TLayout;
    lyt_cuadrillaInicio: TLayout;
    lyt_CuadrillaTrabajo: TLayout;
    lbl_CuadrillaCosto: TLabel;
    lyt_CuadrillaCosto: TLayout;
    lbl_CuadrillaTrabajo: TLabel;
    rect_32: TRectangle;
    lbl_RecursosPorAsignar: TLabel;
    lyt_CuadrillaIndice: TLayout;
    lbl_CuadrillaIndice: TLabel;
    rect_35: TRectangle;
    lyt_1116: TLayout;
    lbl_74: TLabel;
    lbl_FpolGeneral: TLabel;
    lyt_223: TLayout;
    lbl_1107: TLabel;
    lbl_FpolCuadrilla: TLabel;
    lytBackCurvaS: TLayout;
    chart_CurvaS: TTMSFNCLineChart;
    lytBackgroundGantt: TLayout;
    grid_GBarras: TTMSFNCGrid;
    pm_subCategorias: TPopupMenu;
    MenuItem64: TMenuItem;
    MenuItem65: TMenuItem;
    MenuItem66: TMenuItem;
    lyt114: TLayout;
    edt_subCategoriaFilter: TEdit;
    lyt116: TLayout;
    lyt118: TLayout;
    rctngl1: TRectangle;
    edt_FiltroRecursos: TEdit;
    rect_Sub35Reportes: TRectangle;
    lbl_1108: TLabel;
    rect_37: TRectangle;
    pmCrono0: TPopupMenu;
    MenuItem1: TMenuItem;
    pmCrono1: TPopupMenu;
    MenuItem2: TMenuItem;
    MenuItem3: TMenuItem;
    grid_Crono1: TTMSFNCGrid;
    grid_CronoTotales: TTMSFNCGrid;
    grid_crono2: TTMSFNCGrid;
    grid_crono3: TTMSFNCGrid;
    MenuItem4: TMenuItem;
    OpenDialog: TOpenDialog;
    lyt_Reporte: TLayout;
    rect_CPC: TRectangle;
    lbl_154: TLabel;
    rect_RecursosUsados: TRectangle;
    lbl_156: TLabel;
    lbl_DecimalesTrabajo: TLabel;
    rect_38: TRectangle;
    lyt_214: TLayout;
    dbGridConnect_TPresupuestosItems: TTMSFNCGridDatabaseAdapter;
    popupItem_1: TMenuItem;
    tab_5Presupuesto: TTabItem;
    lyt_PresupuestosOpciones1: TLayout;
    lyt_225: TLayout;
    tmsfncspltr14: TTMSFNCSplitter;
    lyt_226: TLayout;
    lyt_Tanteo: TLayout;
    tmsfncspltr15: TTMSFNCSplitter;
    lyt_228: TLayout;
    lyt_229: TLayout;
    Layout2: TLayout;
    rect_Presupuestos_SeleccionarIndirectos: TRectangle;
    iGlow_Presupuestos_SeleccionarIndirectos: TInnerGlowEffect;
    rect_Presupuestos_NotasGenerales: TRectangle;
    iGlow_NotasGenerales: TInnerGlowEffect;
    rect_Presupuesto_AdicionarNota: TRectangle;
    rect_Presupuestos_AbrirTanteo: TRectangle;
    iGlow_AbrirTanteo: TInnerGlowEffect;
    rect_Presupuestos_VisorEDT: TRectangle;
    iGlow_VisorEDT: TInnerGlowEffect;
    rect_Presupuesto_OpcionesPareto: TRectangle;
    iGlow_Pareto: TInnerGlowEffect;
    rect_Presupuestos_LimpiarTanteo: TRectangle;
    InnerGlowEffect8: TInnerGlowEffect;
    lyt_gridSubCategorias: TLayout;
    lyt_1124: TLayout;
    lbl_1115: TLabel;
    lyt_PresupuestoAPUS: TLayout;
    tmsfncspltr16: TTMSFNCSplitter;
    lyt_1125: TLayout;
    lbl_1116: TLabel;
    ln_17: TLine;
    lyt_1126: TLayout;
    lyt_1127: TLayout;
    edt_FiltroSubCategorias: TEdit;
    lyt_1128: TLayout;
    lyt_1129: TLayout;
    edt_FiltroAPUS: TEdit;
    lyt_1130: TLayout;
    rect_148: TRectangle;
    grdpnlyt61: TGridPanelLayout;
    lyt_1131: TLayout;
    lbl_PresupuestoNLineas: TLabel;
    lbl_1118: TLabel;
    lyt_1132: TLayout;
    lbl_1119: TLabel;
    edt_NPresupuestoPrecioReferencia: TEdit;
    lyt_1133: TLayout;
    lbl_1120: TLabel;
    lyt_1134: TLayout;
    lbl_SubtotalPresupuesto: TLabel;
    lyt_1135: TLayout;
    lbl_PresupuestoNItems: TLabel;
    lbl_1123: TLabel;
    lyt_1136: TLayout;
    lbl_PresupuestoDiferencia: TLabel;
    lbl_1125: TLabel;
    lyt_1137: TLayout;
    lbl_1126: TLabel;
    lbl_1127: TLabel;
    edt_porcentajeIVANuevoPresupuesto: TEdit;
    lyt_1138: TLayout;
    lbl_CantIVAPresupuestos: TLabel;
    lyt_1139: TLayout;
    lbl_1129: TLabel;
    lbl_porcentajesIndirectos: TLabel;
    lyt_1140: TLayout;
    lbl_PresupuestoDiferenciaPorcentaje: TLabel;
    lbl_1132: TLabel;
    lyt_1141: TLayout;
    lbl_1133: TLabel;
    lyt_1142: TLayout;
    lbl_TotalIVAPresupuestos: TLabel;
    TWToast_infoPresupuesto: TWindowsToastDialog;
    grid_PresupuestosSubCategoria: TTMSFNCGrid;
    grid_PresupuestosAPUS: TTMSFNCGrid;
    dbGridConnect_PresupuestoSubCategoiras: TTMSFNCGridDatabaseAdapter;
    dbGridConnect_PresupuestoAPUS: TTMSFNCGridDatabaseAdapter;
    Rectangle2: TRectangle;
    Layout3: TLayout;
    Layout4: TLayout;
    Label2: TLabel;
    Line1: TLine;
    Layout5: TLayout;
    Layout6: TLayout;
    Layout7: TLayout;
    Layout8: TLayout;
    Label3: TLabel;
    edt_EditApuDescripcion: TEdit;
    Label4: TLabel;
    edt_EditAPUUnidad: TEdit;
    Label5: TLabel;
    Layout9: TLayout;
    Layout10: TLayout;
    Label6: TLabel;
    Label7: TLabel;
    Layout11: TLayout;
    chkTipoRendimientoAPUSPresupuesto: TCheckBox;
    CheckBox2: TCheckBox;
    Layout12: TLayout;
    GridPanelLayout1: TGridPanelLayout;
    rect_AceptarTanteo: TRectangle;
    rect_RestauraTanteo: TRectangle;
    rect_BorrarTanteo: TRectangle;
    Layout13: TLayout;
    Layout14: TLayout;
    Rectangle6: TRectangle;
    Rectangle7: TRectangle;
    Layout15: TLayout;
    Layout16: TLayout;
    Label8: TLabel;
    Label9: TLabel;
    Label10: TLabel;
    Layout17: TLayout;
    lbl_TanteoCostoDirecto: TLabel;
    lbl_TanteoCostoIndirecto: TLabel;
    lbl_TanteoTotal: TLabel;
    lyt_56: TLayout;
    grid_Presupuestos: TTMSFNCGrid;
    rect_FiltroSubcategoria_todos: TRectangle;
    iGlow_FiltroSubcategorias_todos: TInnerGlowEffect;
    rect_FiltroAPUS_Todos: TRectangle;
    iGlow_FiltroAPUS_Todos: TInnerGlowEffect;
    Trvw_APUSTanteo: TTMSFNCTreeView;
    lbl_CodAPUAnterior: TLabel;
    Trvw_TanteoCrono: TTMSFNCTreeView;
    lyt_69: TLayout;
    lyt_146: TLayout;
    grdpnlyt6: TGridPanelLayout;
    rect_TanteoCronoAceptar: TRectangle;
    rect_TanteoCronoRestaurar: TRectangle;
    rect_TanteoCronoBorrar: TRectangle;
    lbl_FiltroSubCategoriaID: TLabel;
    lyt_stakeAsignacion: TLayout;
    lyt_StakeDisponibles: TLayout;
    tmsfncspltr4: TTMSFNCSplitter;
    Trvw_StakeHolderDisponibles: TTMSFNCTreeView;
    il_NPresupuesto: TImageList;
    lyt_66: TLayout;
    Layout18: TLayout;
    popupItem_2: TMenuItem;
    popupItem_3: TMenuItem;
    trvw_RecursosDesagregacion: TTMSFNCTreeView;
    chkRecursosSoloFaltantes: TCheckBox;
    rect_33: TRectangle;
    il1: TImageList;
    lyt47: TLayout;
    imgReferencial: TImage;
    mItem_1: TMenuItem;
    webBrowser_1: TTMSFNCEdgeWebBrowser;
    edt_Latitud: TEdit;
    edt_longitud: TEdit;
    lyt50: TLayout;
    lyt52: TLayout;
    lbl_165111: TLabel;
    BindSourceDB1: TBindSourceDB;
    BindingsList1: TBindingsList;
    LinkFillControlToField1: TLinkFillControlToField;
    rect_configRepotes: TRectangle;
    tab_OtrosServicios: TTabItem;
    grdpnlyt16: TGridPanelLayout;
    lyt_OPCGrupo: TLayout;
    lyt_OPCSincronizar: TLayout;
    lyt_OPCTienda: TLayout;
    lyt_OPCVarios: TLayout;
    lbl14: TLabel;
    lbl15: TLabel;
    lbl16: TLabel;
    lbl17: TLabel;
    tbc_Opciones_OtrosServicios: TTabControl;
    tab_Grupo: TTabItem;
    tab_Sincronizar: TTabItem;
    tab_Suscripciones: TTabItem;
    rect_29: TRectangle;
    lyt121: TLayout;
    lyt1211: TLayout;
    rect_123: TRectangle;
    lyt12111: TLayout;
    rect_132: TRectangle;
    lyt121111: TLayout;
    rect_134: TRectangle;
    iGlow_Grupo: TInnerGlowEffect;
    iGlow_Sincronizar: TInnerGlowEffect;
    iGlow_Varios: TInnerGlowEffect;
    iGlow_Suscripciones: TInnerGlowEffect;
    tab_Varios: TTabItem;
    lyt_ServSincronizar: TLayout;
    lyt_ServSuscripciones: TLayout;
    lyt_ServVarios: TLayout;
    lbl3: TLabel;
    lyt_ServGrupo: TLayout;
    lyt_GrupoOpc: TLayout;
    lyt_1251: TLayout;
    lbl_1461: TLabel;
    ln_121: TLine;
    lyt69: TLayout;
    rect_addReferido: TRectangle;
    iGlow_addReferido: TInnerGlowEffect;
    rect_RefrescaReferido: TRectangle;
    iGlow_RefrescaReferido: TInnerGlowEffect;
    rect_enviosDatos: TRectangle;
    iGlow_EnviosDatos: TInnerGlowEffect;
    lyt_1252: TLayout;
    lyt_12511: TLayout;
    lbl_14611: TLabel;
    ln_1211: TLine;
    tmsfncspltr5: TTMSFNCSplitter;
    lyt_1253: TLayout;
    lyt_125111: TLayout;
    lbl_146111: TLabel;
    ln_12111: TLine;
    DGrid_Colaboradores: TTMSFNCDataGrid;
    DataGridDBConnector_Colaboradores: TTMSFNCDataGridDatabaseAdapter;
    DGrid_Comunicaciones: TTMSFNCDataGrid;
    DataGridDBConnector_Comunicacion: TTMSFNCDataGridDatabaseAdapter;
    tmrComunicacion: TTimer;
    rect_Mensajes: TRectangle;
    iGlow_Mensajes: TInnerGlowEffect;
    lyt_BodySincronizaryBackup: TLayout;
    lyt_Sincronizar: TLayout;
    lyt_Respaldo: TLayout;
    lyt70: TLayout;
    lbl19: TLabel;
    ln2: TLine;
    lyt119: TLayout;
    lbl20: TLabel;
    ln4: TLine;
    lbl21: TLabel;
    lyt120: TLayout;
    lbl_EstadoSuscripcionSincronizacion: TLabel;
    lyt1201: TLayout;
    lbl212: TLabel;
    lbl_n_sincronizaciones: TLabel;
    lbl213: TLabel;
    lbl_n_sincronizacionesUsadas: TLabel;
    lbl214: TLabel;
    lbl_n_sincronizacionesRestantes: TLabel;
    lyt1202: TLayout;
    lbl215: TLabel;
    lbl_EstadoSuscripcionFechaUltimoUso: TLabel;
    ln5: TLine;
    Layout43: TLayout;
    Label30: TLabel;
    lbl_FechaUltimoBackup: TLabel;
    Layout44: TLayout;
    Label32: TLabel;
    Layout45: TLayout;
    Label38: TLabel;
    lbl_EstadoSuscripcionBackUp: TLabel;
    lyt123: TLayout;
    rect_ActualizaMigraciones: TRectangle;
    iGlow_ActualizaMigraciones: TInnerGlowEffect;
    lyt124: TLayout;
    rect_ActualizaBackUp: TRectangle;
    iGlow_ActualizaBackUp: TInnerGlowEffect;
    lbl_FechaValidezBackup: TLabel;
    lbl22: TLabel;
    lbl_DiasRestantesBackup: TLabel;
    ln6: TLine;
    ln7: TLine;
    rect_CrearMigracion: TRectangle;
    iGlow_CrearMigracion: TInnerGlowEffect;
    rect_crearBackUp: TRectangle;
    iGlow_crearBackUP: TInnerGlowEffect;
    rect_RestaurarBackUp: TRectangle;
    iGlow_RestaurarBackUp: TInnerGlowEffect;
    lyt_Tienda: TLayout;
    BitmapIconoGenerico: TImage;
    lyt_RCiudadyProvincia: TLayout;
    GridPanelLayout3: TGridPanelLayout;
    Layout46: TLayout;
    edt_RCiudad: TEdit;
    Layout47: TLayout;
    edt_RProvincia: TEdit;
    lyt_RProfesionyEmpresa: TLayout;
    GridPanelLayout5: TGridPanelLayout;
    Layout52: TLayout;
    edt_REmpresa: TEdit;
    Layout53: TLayout;
    lyt_RFechayNacionalidad: TLayout;
    GridPanelLayout6: TGridPanelLayout;
    Layout55: TLayout;
    Layout56: TLayout;
    edt_RNacionalidad: TEdit;
    Layout39: TLayout;
    GridPanelLayout2: TGridPanelLayout;
    Layout41: TLayout;
    edt_RIdFiscal: TEdit;
    edt_RProfesion: TEdit;
    GridPanelLyt_Autorizaciones: TGridPanelLayout;
    lyt83: TLayout;
    lyt85: TLayout;
    lyt89: TLayout;
    lyt92: TLayout;
    lyt122: TLayout;
    chk_ProteccionDatos: TCheckBox;
    lbl9: TLabel;
    chk_AutorizacionGiproy: TCheckBox;
    lbl10: TLabel;
    lbl12: TLabel;
    edt_RAlias: TEdit;
    lbl8: TLabel;
    chk_AutorizacionPublicidad: TCheckBox;
    mItem_2: TMenuItem;
    mItem_3: TMenuItem;
    mItem_4: TMenuItem;
    mItem_5: TMenuItem;
    trvw_cat1EquiposHerramientas: TTMSFNCTreeView;
    trvw_cat2Materiales: TTMSFNCTreeView;
    trvw_cat3Transporte: TTMSFNCTreeView;
    trvw_cat4ManodeObra: TTMSFNCTreeView;
    trvw_cat5SeguridadIndustrial: TTMSFNCTreeView;
    trvw_cat6PreciosUnitarios: TTMSFNCTreeView;
    MenuItem5: TMenuItem;
    MenuItem6: TMenuItem;
    Layout40: TLayout;
    rect_SUB34Pertenencia: TRectangle;
    rect_121: TRectangle;
    lbl_140: TLabel;
    rect_SUB34Reportes: TRectangle;
    rect_137: TRectangle;
    lbl_135: TLabel;
    rect_SUB34Borrar: TRectangle;
    Rectangle5: TRectangle;
    Label28: TLabel;
    MenuItem26: TMenuItem;
    MenuItem39: TMenuItem;
    MenuItem40: TMenuItem;
    MenuItem53: TMenuItem;
    MenuItem54: TMenuItem;
    MenuItem55: TMenuItem;
    Layout42: TLayout;
    Label29: TLabel;
    rect_Config: TRectangle;
    lbl_NBaseProyecto: TLabel;
    Label1: TLabel;

    /// <summary>
    /// Inicializa el formulario o componente en FormCreate.
    /// </summary>
    procedure FormCreate(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de tmr_HoraTimer.
    /// </summary>
    procedure tmr_HoraTimer(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de tmr_InicioTimer.
    /// </summary>
    procedure tmr_InicioTimer(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_Opc1MouseEnter.
    /// </summary>
    procedure rect_Opc1MouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_Opc1MouseLeave.
    /// </summary>
    procedure rect_Opc1MouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_Opc2MouseEnter.
    /// </summary>
    procedure rect_Opc2MouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_Opc2MouseLeave.
    /// </summary>
    procedure rect_Opc2MouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_Opc3MouseEnter.
    /// </summary>
    procedure rect_Opc3MouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_Opc3MouseLeave.
    /// </summary>
    procedure rect_Opc3MouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de lyt_19MouseDown.
    /// </summary>
    procedure lyt_19MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de lyt_24MouseDown.
    /// </summary>
    procedure lyt_24MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Libera recursos o cierra el formulario en rect_closeAppMouseUp.
    /// </summary>
    procedure rect_closeAppMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Manejador del evento de ratón en rect_AppClose2MouseEnter.
    /// </summary>
    procedure rect_AppClose2MouseEnter(Sender: TObject);
    /// <summary>
    /// Libera recursos o cierra el formulario en rect_AppClose2MouseLeave.
    /// </summary>
    procedure rect_AppClose2MouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_sub3DB1MouseEnter.
    /// </summary>
    procedure rect_sub3DB1MouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_sub3DB1MouseLeave.
    /// </summary>
    procedure rect_sub3DB1MouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_sub3DB2MouseEnter.
    /// </summary>
    procedure rect_sub3DB2MouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_sub3DB2MouseLeave.
    /// </summary>
    procedure rect_sub3DB2MouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_sub3DB4MouseLeave.
    /// </summary>
    procedure rect_sub3DB4MouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_sub3DB5MouseLeave.
    /// </summary>
    procedure rect_sub3DB5MouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_sub3DB4MouseEnter.
    /// </summary>
    procedure rect_sub3DB4MouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_sub3DB5MouseEnter.
    /// </summary>
    procedure rect_sub3DB5MouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_OPC1_OpcionesMouseEnter.
    /// </summary>
    procedure rect_OPC1_OpcionesMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_OPC1_OpcionesMouseLeave.
    /// </summary>
    procedure rect_OPC1_OpcionesMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_OPC1_SubcategoriasMouseEnter.
    /// </summary>
    procedure rect_OPC1_SubcategoriasMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_OPC1_SubcategoriasMouseLeave.
    /// </summary>
    procedure rect_OPC1_SubcategoriasMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_OPC1_RecursosMouseEnter.
    /// </summary>
    procedure rect_OPC1_RecursosMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_OPC1_RecursosMouseLeave.
    /// </summary>
    procedure rect_OPC1_RecursosMouseLeave(Sender: TObject);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en rect_OPC1_APUSMouseLeave.
    /// </summary>
    procedure rect_OPC1_APUSMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_OPC1_APUSMouseEnter.
    /// </summary>
    procedure rect_OPC1_APUSMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB32CrearMouseLeave.
    /// </summary>
    procedure rect_SUB32CrearMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB32DuplicarMouseEnter.
    /// </summary>
    procedure rect_SUB32DuplicarMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB32EditarMouseEnter.
    /// </summary>
    procedure rect_SUB32EditarMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB32BorrarMouseEnter.
    /// </summary>
    procedure rect_SUB32BorrarMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB32ActualizarMouseEnter.
    /// </summary>
    procedure rect_SUB32ActualizarMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB32DuplicarMouseLeave.
    /// </summary>
    procedure rect_SUB32DuplicarMouseLeave(Sender: TObject);

    /// <summary>
    /// Implementa la lógica principal de rect_SUB32BorrarMouseLeave.
    /// </summary>
    procedure rect_SUB32BorrarMouseLeave(Sender: TObject);
    /// <summary>
    /// Actualiza la interfaz o los datos asociados en rect_SUB32ActualizarMouseLeave.
    /// </summary>
    procedure rect_SUB32ActualizarMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_cat1EquiposHerramientasMouseEnter.
    /// </summary>
    procedure rect_cat1EquiposHerramientasMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_cat1EquiposHerramientasMouseLeave.
    /// </summary>
    procedure rect_cat1EquiposHerramientasMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_cat2MaterialesMouseEnter.
    /// </summary>
    procedure rect_cat2MaterialesMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_cat3TransporteMouseEnter.
    /// </summary>
    procedure rect_cat3TransporteMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_cat4ManodeObraMouseEnter.
    /// </summary>
    procedure rect_cat4ManodeObraMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_cat5SeguridadIndustrialMouseEnter.
    /// </summary>
    procedure rect_cat5SeguridadIndustrialMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_cat2MaterialesMouseLeave.
    /// </summary>
    procedure rect_cat2MaterialesMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_cat3TransporteMouseLeave.
    /// </summary>
    procedure rect_cat3TransporteMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_cat4ManodeObraMouseLeave.
    /// </summary>
    procedure rect_cat4ManodeObraMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_cat5SeguridadIndustrialMouseLeave.
    /// </summary>
    procedure rect_cat5SeguridadIndustrialMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB33CrearMouseEnter.
    /// </summary>
    procedure rect_SUB33CrearMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB33ActializarMouseEnter.
    /// </summary>
    procedure rect_SUB33ActializarMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB33BuscarMouseEnter.
    /// </summary>
    procedure rect_SUB33BuscarMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB33DuplicarMouseEnter.
    /// </summary>
    procedure rect_SUB33DuplicarMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB33EditarMouseEnter.
    /// </summary>
    procedure rect_SUB33EditarMouseEnter(Sender: TObject);

    /// <summary>
    /// Implementa la lógica principal de rect_SUB33CrearMouseLeave.
    /// </summary>
    procedure rect_SUB33CrearMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB33ActializarMouseLeave.
    /// </summary>
    procedure rect_SUB33ActializarMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB33BuscarMouseLeave.
    /// </summary>
    procedure rect_SUB33BuscarMouseLeave(Sender: TObject);

    /// <summary>
    /// Implementa la lógica principal de rect_SUB33DuplicarMouseLeave.
    /// </summary>
    procedure rect_SUB33DuplicarMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB33EditarMouseLeave.
    /// </summary>
    procedure rect_SUB33EditarMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_OPCRec1MouseEnter.
    /// </summary>
    procedure rect_OPCRec1MouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_OPCRec1MouseLeave.
    /// </summary>
    procedure rect_OPCRec1MouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_OPCRec2MouseEnter.
    /// </summary>
    procedure rect_OPCRec2MouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_OPCRec3MouseEnter.
    /// </summary>
    procedure rect_OPCRec3MouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_OPCRec4MouseEnter.
    /// </summary>
    procedure rect_OPCRec4MouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_OPCRec5MouseEnter.
    /// </summary>
    procedure rect_OPCRec5MouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_OPCRec2MouseLeave.
    /// </summary>
    procedure rect_OPCRec2MouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_OPCRec3MouseLeave.
    /// </summary>
    procedure rect_OPCRec3MouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_OPCRec4MouseLeave.
    /// </summary>
    procedure rect_OPCRec4MouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_OPCRec5MouseLeave.
    /// </summary>
    procedure rect_OPCRec5MouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_OPC2Rec4EMouseUp.
    /// </summary>
    procedure rect_OPC2Rec4EMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de grid_RecursosSelectCell.
    /// </summary>
    procedure grid_RecursosSelectCell(Sender: TObject; ACol, ARow: Integer;
      var Allow: Boolean);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB33BorrarMouseEnter.
    /// </summary>
    procedure rect_SUB33BorrarMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB33BorrarMouseLeave.
    /// </summary>
    procedure rect_SUB33BorrarMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB34CrearMouseLeave.
    /// </summary>
    procedure rect_SUB34CrearMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB34CrearMouseEnter.
    /// </summary>
    procedure rect_SUB34CrearMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB32CrearMouseEnter.
    /// </summary>
    procedure rect_SUB32CrearMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_cat6PreciosUnitariosMouseEnter.
    /// </summary>
    procedure rect_cat6PreciosUnitariosMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_cat6PreciosUnitariosMouseLeave.
    /// </summary>
    procedure rect_cat6PreciosUnitariosMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de lv_APUSCategoriaItemClick.
    /// </summary>
    procedure lv_APUSCategoriaItemClick(const Sender: TObject;
      const AItem: TListViewItem);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB34DuplicarMouseEnter.
    /// </summary>
    procedure rect_SUB34DuplicarMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB34ImportarMouseEnter.
    /// </summary>
    procedure rect_SUB34ImportarMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB34EditarMouseEnter.
    /// </summary>
    procedure rect_SUB34EditarMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB34PertenenciaMouseEnter.
    /// </summary>
    procedure rect_SUB34PertenenciaMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_crearPresupuestoMouseUp.
    /// </summary>
    procedure rect_crearPresupuestoMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);

    /// <summary>
    /// Implementa la lógica principal de rect_HistoricoPresupuestosMouseUp.
    /// </summary>
    procedure rect_HistoricoPresupuestosMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de rect_123MouseUp.
    /// </summary>
    procedure rect_123MouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de rect_127MouseUp.
    /// </summary>
    procedure rect_127MouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Manejador del evento OnClick de rect_adicionarDBPresupuestosClick.
    /// </summary>
    procedure rect_adicionarDBPresupuestosClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de lyt_62MouseDown.
    /// </summary>
    procedure lyt_62MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Manejador del evento de ratón en rect_RecursosSeleccionarTodosMouseEnter.
    /// </summary>
    procedure rect_RecursosSeleccionarTodosMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_RecursosSeleccionarTodosMouseLeave.
    /// </summary>
    procedure rect_RecursosSeleccionarTodosMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem12Click.
    /// </summary>
    procedure MenuItem12Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem13Click.
    /// </summary>
    procedure MenuItem13Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem14Click.
    /// </summary>
    procedure MenuItem14Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB34DuplicarMouseLeave.
    /// </summary>
    procedure rect_SUB34DuplicarMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB34EditarMouseLeave.
    /// </summary>
    procedure rect_SUB34EditarMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB34ImportarMouseLeave.
    /// </summary>
    procedure rect_SUB34ImportarMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem15Click.
    /// </summary>
    procedure MenuItem15Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem17Click.
    /// </summary>
    procedure MenuItem17Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem16Click.
    /// </summary>
    procedure MenuItem16Click(Sender: TObject);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en lv_APUSCategoriaChange.
    /// </summary>
    procedure lv_APUSCategoriaChange(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de grid_APUSRecursosCellClick.
    /// </summary>
    procedure grid_APUSRecursosCellClick(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Implementa la lógica principal de grid_RecursosMouseDown.
    /// </summary>
    procedure grid_RecursosMouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de grid_RecursosMouseMove.
    /// </summary>
    procedure grid_RecursosMouseMove(Sender: TObject; Shift: TShiftState;
      X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de grid_RecursosMouseUp.
    /// </summary>
    procedure grid_RecursosMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de lvOPCRec1DragOver.
    /// </summary>
    procedure lvOPCRec1DragOver(Sender: TObject; const Data: TDragObject;
      const Point: TPointF; var Operation: TDragOperation);
    /// <summary>
    /// Implementa la lógica principal de lvOPCRec2DragOver.
    /// </summary>
    procedure lvOPCRec2DragOver(Sender: TObject; const Data: TDragObject;
      const Point: TPointF; var Operation: TDragOperation);
    /// <summary>
    /// Implementa la lógica principal de lvOPCRec3DragOver.
    /// </summary>
    procedure lvOPCRec3DragOver(Sender: TObject; const Data: TDragObject;
      const Point: TPointF; var Operation: TDragOperation);
    /// <summary>
    /// Implementa la lógica principal de lvOPCRec4DragOver.
    /// </summary>
    procedure lvOPCRec4DragOver(Sender: TObject; const Data: TDragObject;
      const Point: TPointF; var Operation: TDragOperation);
    /// <summary>
    /// Implementa la lógica principal de lvOPCRec5DragOver.
    /// </summary>
    procedure lvOPCRec5DragOver(Sender: TObject; const Data: TDragObject;
      const Point: TPointF; var Operation: TDragOperation);
    /// <summary>
    /// Implementa la lógica principal de lvOPCRec2DragDrop.
    /// </summary>
    /// <summary>
    /// Manejador del evento OnClick de MenuItem18Click.
    /// </summary>
    procedure MenuItem18Click(Sender: TObject);

    /// <summary>
    /// Gestiona operaciones relacionadas con APU en grid_APUSRecursosMouseUp.
    /// </summary>
    procedure grid_APUSRecursosMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en grid_APUSRecursosMouseMove.
    /// </summary>
    procedure grid_APUSRecursosMouseMove(Sender: TObject; Shift: TShiftState;
      X, Y: Single);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en lv_APUSCategoriaDragDrop.
    /// </summary>
    procedure lv_APUSCategoriaDragDrop(Sender: TObject; const Data: TDragObject;
      const Point: TPointF);
    /// <summary>
    /// Manejador del evento de ratón en rect_OPC2_CrearPresupuestoMouseEnter.
    /// </summary>
    procedure rect_OPC2_CrearPresupuestoMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_OPC2_CrearPresupuestoMouseLeave.
    /// </summary>
    procedure rect_OPC2_CrearPresupuestoMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_OPC2_HistoricoPresupuestosMouseEnter.
    /// </summary>
    procedure rect_OPC2_HistoricoPresupuestosMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_OPC2_HistoricoPresupuestosMouseLeave.
    /// </summary>
    procedure rect_OPC2_HistoricoPresupuestosMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_Sub35CrearMouseEnter.
    /// </summary>
    procedure rect_Sub35CrearMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB35DuplicarMouseEnter.
    /// </summary>
    procedure rect_SUB35DuplicarMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_Sub35CrearMouseLeave.
    /// </summary>
    procedure rect_Sub35CrearMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB35DuplicarMouseLeave.
    /// </summary>
    procedure rect_SUB35DuplicarMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_24MouseUp.
    /// </summary>
    procedure rect_24MouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de rect_130MouseUp.
    /// </summary>
    procedure rect_130MouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de rect_132MouseUp.
    /// </summary>
    procedure rect_132MouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Manejador del evento de ratón en rct_1PresupuestoMouseEnter.
    /// </summary>
    procedure rct_1PresupuestoMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_2PresupuestoMouseEnter.
    /// </summary>
    procedure rct_2PresupuestoMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_3PresupuestoMouseEnter.
    /// </summary>
    procedure rct_3PresupuestoMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_4PresupuestoMouseEnter.
    /// </summary>
    procedure rct_4PresupuestoMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_5PresupuestoMouseEnter.
    /// </summary>
    procedure rct_5PresupuestoMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_6PresupuestoMouseEnter.
    /// </summary>
    procedure rct_6PresupuestoMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_7PresupuestoMouseEnter.
    /// </summary>
    procedure rct_7PresupuestoMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_8PresupuestoMouseEnter.
    /// </summary>
    procedure rct_8PresupuestoMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_8PresupuestoMouseLeave.
    /// </summary>
    procedure rct_8PresupuestoMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_7PresupuestoMouseLeave.
    /// </summary>
    procedure rct_7PresupuestoMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_6PresupuestoMouseLeave.
    /// </summary>
    procedure rct_6PresupuestoMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_5PresupuestoMouseLeave.
    /// </summary>
    procedure rct_5PresupuestoMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_4PresupuestoMouseLeave.
    /// </summary>
    procedure rct_4PresupuestoMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_3PresupuestoMouseLeave.
    /// </summary>
    procedure rct_3PresupuestoMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_2PresupuestoMouseLeave.
    /// </summary>
    procedure rct_2PresupuestoMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_1PresupuestoMouseLeave.
    /// </summary>
    procedure rct_1PresupuestoMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de cbb_TProyectosPrespuestoChange.
    /// </summary>
    procedure cbb_TProyectosPrespuestoChange(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_PlazoEjecucionPresupuestoChangeTracking.
    /// </summary>
    procedure edt_PlazoEjecucionPresupuestoChangeTracking(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem21Click.
    /// </summary>
    procedure MenuItem21Click(Sender: TObject);

    /// <summary>
    /// Manejador del evento OnClick de MenuItem22Click.
    /// </summary>
    procedure MenuItem22Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem23Click.
    /// </summary>
    procedure MenuItem23Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem25Click.
    /// </summary>
    procedure MenuItem25Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de pm_EDOPopup.
    /// </summary>
    procedure pm_EDOPopup(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem24Click.
    /// </summary>
    procedure MenuItem24Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem29Click.
    /// </summary>
    procedure MenuItem29Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem30Click.
    /// </summary>
    procedure MenuItem30Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem31Click.
    /// </summary>
    procedure MenuItem31Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem32Click.
    /// </summary>
    procedure MenuItem32Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem33Click.
    /// </summary>
    procedure MenuItem33Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem34Click.
    /// </summary>
    procedure MenuItem34Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem35Click.
    /// </summary>
    procedure MenuItem35Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem37Click.
    /// </summary>
    procedure MenuItem37Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de Trvw_EDTAfterDropNode.
    /// </summary>
    procedure Trvw_EDTAfterDropNode(Sender: TObject;
      AFromNode, AToNode: TTMSFNCTreeViewVirtualNode);
    /// <summary>
    /// Guarda información o cambios realizados en rct__GuardarNuevoPresupuestoMouseUp.
    /// </summary>
    procedure rct__GuardarNuevoPresupuestoMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem7Click.
    /// </summary>
    procedure MenuItem7Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem38Click.
    /// </summary>
    procedure MenuItem38Click(Sender: TObject);
    /// <summary>
    /// Manejador de eventos de teclado en grid_stakesAsignadosKeyUp.
    /// </summary>
    procedure grid_stakesAsignadosKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Manejador del evento de ratón en rect_StakeDisponibleAdicionarMouseEnter.
    /// </summary>
    procedure rect_StakeDisponibleAdicionarMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_StakeDisponibleAdicionarMouseLeave.
    /// </summary>
    procedure rect_StakeDisponibleAdicionarMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_StakeDisponibleEditarMouseEnter.
    /// </summary>
    procedure rect_StakeDisponibleEditarMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_StakeDisponibleEditarMouseLeave.
    /// </summary>
    procedure rect_StakeDisponibleEditarMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de grid_stakesDisponiblesColumnSize.
    /// </summary>
    procedure grid_stakesDisponiblesColumnSize(Sender: TObject; ACol: Integer;
      var NewWidth: Single);
    /// <summary>
    /// Asigna o modifica valores de propiedades en grid_stakesAsignadosColumnSize.
    /// </summary>
    procedure grid_stakesAsignadosColumnSize(Sender: TObject; ACol: Integer;
      var NewWidth: Single);
    /// <summary>
  /// Manejador del evento OnClick de MenuItem41Click.
  /// </summary>
    procedure MenuItem41Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem42Click.
    /// </summary>
    procedure MenuItem42Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de Trvw_EDTNodeChanged.
    /// </summary>
    procedure Trvw_EDTNodeChanged(Sender: TObject;
      ANode: TTMSFNCTreeViewVirtualNode);
    /// <summary>
    /// Asigna o modifica valores de propiedades en grid_stakesAsignadosMouseDown.
    /// </summary>
    procedure grid_stakesAsignadosMouseDown(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Asigna o modifica valores de propiedades en grid_stakesAsignadosMouseLeave.
    /// </summary>
    procedure grid_stakesAsignadosMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de Trvw_EDOBeforeSizeColumn.
    /// </summary>
    procedure Trvw_EDOBeforeSizeColumn(Sender: TObject; AColumn: Integer;
      AColumnSize: Double; var ANewColumnSize: Double; var AAllow: Boolean);
    /// <summary>
    /// Implementa la lógica principal de Trvw_EDTBeforeSizeColumn.
    /// </summary>
    procedure Trvw_EDTBeforeSizeColumn(Sender: TObject; AColumn: Integer;
      AColumnSize: Double; var ANewColumnSize: Double; var AAllow: Boolean);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem45Click.
    /// </summary>
    procedure MenuItem45Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem46Click.
    /// </summary>
    procedure MenuItem46Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de pm_EDTPopup.
    /// </summary>
    procedure pm_EDTPopup(Sender: TObject);
    /// <summary>
    /// Manejador de eventos de teclado en Trvw_EDTKeyUp.
    /// </summary>
    procedure Trvw_EDTKeyUp(Sender: TObject; var Key: Word; var KeyChar: Char;
      Shift: TShiftState);
    /// <summary>
    /// Manejador del evento OnClick de rect_NPresupuestoIMG1Click.
    /// </summary>
    procedure rect_NPresupuestoIMG1Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de cbb_cronoTipoPeriodoChange.
    /// </summary>
    procedure cbb_cronoTipoPeriodoChange(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de btn_EjecucionGlobalClick.
    /// </summary>
    procedure btn_EjecucionGlobalClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_NPresupuestoPrecioReferenciaChangeTracking.
    /// </summary>
    procedure edt_NPresupuestoPrecioReferenciaChangeTracking(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de Trvw_EDTBeforeDropNode.
    /// </summary>
    procedure Trvw_EDTBeforeDropNode(Sender: TObject;
      AFromNode, AToNode: TTMSFNCTreeViewVirtualNode; var ACanDrop: Boolean);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem49Click.
    /// </summary>
    procedure MenuItem49Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem9Click.
    /// </summary>
    procedure MenuItem9Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB35BorrarMouseUp.
    /// </summary>
    procedure rect_SUB35BorrarMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Manejador del evento OnClick de lbl_56Click.
    /// </summary>
    procedure lbl_56Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_EditaIndirectosMouseUp.
    /// </summary>
    procedure rect_EditaIndirectosMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Manejador del evento OnClick de Trvw_EDTDblClick.
    /// </summary>
    procedure Trvw_EDTDblClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB35GuardarMouseEnter.
    /// </summary>
    procedure rect_SUB35GuardarMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB35UndoMouseEnter.
    /// </summary>
    procedure rect_SUB35UndoMouseEnter(Sender: TObject);
    /// <summary>
    /// Guarda información o cambios realizados en rect_SUB35GuardarMouseLeave.
    /// </summary>
    procedure rect_SUB35GuardarMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB35UndoMouseLeave.
    /// </summary>
    procedure rect_SUB35UndoMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB35RedoMouseUp.
    /// </summary>
    procedure rect_SUB35RedoMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de rect_NotasPresupuestoMouseUp.
    /// </summary>
    procedure rect_NotasPresupuestoMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Manejador del evento OnClick de rect_PTanteoClick.
    /// </summary>
    procedure rect_PTanteoClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de grid_EDOStakesColumnSized.
    /// </summary>
    procedure grid_EDOStakesColumnSized(Sender: TObject; ACol: Integer;
      NewWidth: Single);
    /// <summary>
    /// Manejador del evento OnClick de Trvw_EDODblClick.
    /// </summary>
    procedure Trvw_EDODblClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_MuestraVisorEDTMouseUp.
    /// </summary>
    procedure rect_MuestraVisorEDTMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem50Click.
    /// </summary>
    procedure MenuItem50Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem51Click.
    /// </summary>
    procedure MenuItem51Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem52Click.
    /// </summary>
    procedure MenuItem52Click(Sender: TObject);
    /// <summary>
    /// Manejador de eventos de teclado en Trvw_EDOKeyUp.
    /// </summary>
    procedure Trvw_EDOKeyUp(Sender: TObject; var Key: Word; var KeyChar: Char;
      Shift: TShiftState);
    /// <summary>
    /// Manejador del evento OnClick de popupItem_pareto_SinAplicarClick.
    /// </summary>
    procedure popupItem_pareto_SinAplicarClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de popupItem_Pareto_GlobalClick.
    /// </summary>
    procedure popupItem_Pareto_GlobalClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de popupItem_Pareto_CuentaClick.
    /// </summary>
    procedure popupItem_Pareto_CuentaClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de tbc1Change.
    /// </summary>
    procedure tbc1Change(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_tab1Click.
    /// </summary>
    procedure rect_tab1Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_tab2Click.
    /// </summary>
    procedure rect_tab2Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_tab3Click.
    /// </summary>
    procedure rect_tab3Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_tab4Click.
    /// </summary>
    procedure rect_tab4Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_tab5Click.
    /// </summary>
    procedure rect_tab5Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de lyt_cronoPresupuestoResize.
    /// </summary>
    procedure lyt_cronoPresupuestoResize(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de grid_crono01CellClick.
    /// </summary>
    procedure grid_crono01CellClick(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Manejador de eventos de teclado en edt_DiasSemanasKeyUp.
    /// </summary>
    procedure edt_DiasSemanasKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Implementa la lógica principal de edt_DiasSemanasMouseLeave.
    /// </summary>
    procedure edt_DiasSemanasMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de btn5Click.
    /// </summary>
    procedure btn5Click(Sender: TObject);
    /// <summary>
    /// Libera recursos o cierra el formulario en dedt_PresentacionPresupuestoClosePicker.
    /// </summary>
    procedure dedt_PresentacionPresupuestoClosePicker(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem57Click.
    /// </summary>
    procedure MenuItem57Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_UUsuarioEnter.
    /// </summary>
    procedure edt_UUsuarioEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_UUsuarioExit.
    /// </summary>
    procedure edt_UUsuarioExit(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_UPasswordEnter.
    /// </summary>
    procedure edt_UPasswordEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_UPasswordExit.
    /// </summary>
    procedure edt_UPasswordExit(Sender: TObject);
    /// <summary>
    /// Manejador de eventos de teclado en edt_UUsuarioKeyDown.
    /// </summary>
    procedure edt_UUsuarioKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Manejador de eventos de teclado en edt_UUsuarioKeyUp.
    /// </summary>
    procedure edt_UUsuarioKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Manejador de eventos de teclado en edt_UPasswordKeyDown.
    /// </summary>
    procedure edt_UPasswordKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Implementa la lógica principal de rct_btnLoginMouseDown.
    /// </summary>
    procedure rct_btnLoginMouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de rct_btnLoginMouseLeave.
    /// </summary>
    procedure rct_btnLoginMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador de eventos de teclado en edt_RNombreKeyDown.
    /// </summary>
    procedure edt_RNombreKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Manejador de eventos de teclado en edt_RApellidosKeyDown.
    /// </summary>
    procedure edt_RApellidosKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Implementa la lógica principal de rct_5MouseDown.
    /// </summary>
    procedure rct_5MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de rct_5MouseLeave.
    /// </summary>
    procedure rct_5MouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_5MouseUp.
    /// </summary>
    procedure rct_5MouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de chk_ProteccionDatosChange.
    /// </summary>
    procedure chk_ProteccionDatosChange(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de lbl6Click.
    /// </summary>
    procedure lbl6Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_StakeBorrarMouseEnter.
    /// </summary>
    procedure rct_StakeBorrarMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_StakeBorrarMouseLeave.
    /// </summary>
    procedure rct_StakeBorrarMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de tbc_PreciosUnitariosChange.
    /// </summary>
    procedure tbc_PreciosUnitariosChange(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_EDOStakesFiltroChangeTracking.
    /// </summary>
    procedure edt_EDOStakesFiltroChangeTracking(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_10Click.
    /// </summary>
    procedure rct_10Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_19Click.
    /// </summary>
    procedure rct_19Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_20Click.
    /// </summary>
    procedure rct_20Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de lyt_68Resized.
    /// </summary>
    procedure lyt_68Resized(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_EDTBuscarChangeTracking.
    /// </summary>
    procedure edt_EDTBuscarChangeTracking(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_23Click.
    /// </summary>
    procedure rct_23Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_24Click.
    /// </summary>
    procedure rct_24Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_25Click.
    /// </summary>
    procedure rct_25Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_26Click.
    /// </summary>
    procedure rct_26Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem59Click.
    /// </summary>
    procedure MenuItem59Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem60Click.
    /// </summary>
    procedure MenuItem60Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem61Click.
    /// </summary>
    procedure MenuItem61Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de trvw_TanteoCronoGetInplaceEditor.
    /// </summary>
    procedure trvw_TanteoCronoGetInplaceEditor(Sender: TObject;
      ANode: TTMSFMXTreeViewVirtualNode; AColumn: Integer;
      var ATransparent: Boolean;
      var AInplaceEditorClass: TTMSFMXTreeViewInplaceEditorClass);
    /// <summary>
    /// Manejador del evento OnClick de rct_crono01ParetoClick.
    /// </summary>
    procedure rct_crono01ParetoClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_28Click.
    /// </summary>
    procedure rct_28Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de grid_calcTiemposCellClick.
    /// </summary>
    procedure grid_calcTiemposCellClick(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Implementa la lógica principal de grid_crono0SelectedCell.
    /// </summary>
    procedure grid_crono0SelectedCell(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Implementa la lógica principal de grid_crono01SelectedCell.
    /// </summary>
    procedure grid_crono01SelectedCell(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Manejador de eventos de teclado en grid_crono01KeyUp.
    /// </summary>
    procedure grid_crono01KeyUp(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Manejador de eventos de teclado en grid_crono01KeyDown.
    /// </summary>
    procedure grid_crono01KeyDown(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Implementa la lógica principal de grid_calcTiemposSelectedCell.
    /// </summary>
    procedure grid_calcTiemposSelectedCell(Sender: TObject;
      ACol, ARow: Integer);
    /// <summary>
    /// Manejador de eventos de teclado en grid_calcTiemposKeyUp.
    /// </summary>
    procedure grid_calcTiemposKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Manejador de eventos de teclado en grid_calcTiemposKeyDown.
    /// </summary>
    procedure grid_calcTiemposKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Implementa la lógica principal de edt_filtroCPCChangeTracking.
    /// </summary>
    procedure edt_filtroCPCChangeTracking(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_edtFiltroCPCClearClick.
    /// </summary>
    procedure rct_edtFiltroCPCClearClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_CPCClick.
    /// </summary>
    procedure rect_CPCClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_31Click.
    /// </summary>
    procedure rct_31Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_32Click.
    /// </summary>
    procedure rct_32Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_33Click.
    /// </summary>
    procedure rct_33Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem63Click.
    /// </summary>
    procedure MenuItem63Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem62Click.
    /// </summary>
    procedure MenuItem62Click(Sender: TObject);
    /// <summary>
    /// Manejador de eventos de teclado en grid_desagregacionCPCKeyUp.
    /// </summary>
    procedure grid_desagregacionCPCKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Manejador del evento OnClick de rect_RecursosUsadosClick.
    /// </summary>
    procedure rect_RecursosUsadosClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_34Click.
    /// </summary>
    procedure rct_34Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_desgSeguridadIndustrialMouseUp.
    /// </summary>
    procedure rct_desgSeguridadIndustrialMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de rct_desgSeguridadIndustrialMouseLeave.
    /// </summary>
    procedure rct_desgSeguridadIndustrialMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_desgTransporteMouseLeave.
    /// </summary>
    procedure rct_desgTransporteMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_desgMaterialesMouseLeave.
    /// </summary>
    procedure rct_desgMaterialesMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_desgManoObraMouseLeave.
    /// </summary>
    procedure rct_desgManoObraMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rct_desgEquiposHerramientasMouseLeave.
    /// </summary>
    procedure rct_desgEquiposHerramientasMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_desgSeguridadIndustrialMouseEnter.
    /// </summary>
    procedure rct_desgSeguridadIndustrialMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_desgTransporteMouseEnter.
    /// </summary>
    procedure rct_desgTransporteMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_desgMaterialesMouseEnter.
    /// </summary>
    procedure rct_desgMaterialesMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_desgManoObraMouseEnter.
    /// </summary>
    procedure rct_desgManoObraMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rct_desgEquiposHerramientasMouseEnter.
    /// </summary>
    procedure rct_desgEquiposHerramientasMouseEnter(Sender: TObject);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en grid_DesagregacionAPUSHeaderColumnSize.
    /// </summary>
    procedure grid_DesagregacionAPUSHeaderColumnSize(Sender: TObject;
      ACol: Integer; var NewWidth: Single);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en grid_DesagregacionAPUSHeaderColumnSized.
    /// </summary>
    procedure grid_DesagregacionAPUSHeaderColumnSized(Sender: TObject;
      ACol: Integer; NewWidth: Single);
    /// <summary>
    /// Manejador del evento OnClick de grid_DesagregacionAPUSCellClick.
    /// </summary>
    procedure grid_DesagregacionAPUSCellClick(Sender: TObject;
      ACol, ARow: Integer);
    /// <summary>
    /// Manejador del evento OnClick de grid_DesgRecursosCellDblClick.
    /// </summary>
    procedure grid_DesgRecursosCellDblClick(Sender: TObject;
      ACol, ARow: Integer);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en grid_DesagregacionAPUSColumnSize.
    /// </summary>
    procedure grid_DesagregacionAPUSColumnSize(Sender: TObject; ACol: Integer;
      var NewWidth: Single);
    /// <summary>
    /// Manejador del evento de ratón en rect_FpoliEquiposyHerramientasMouseEnter.
    /// </summary>
    procedure rect_FpoliEquiposyHerramientasMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_FpoliEquiposyHerramientasMouseLeave.
    /// </summary>
    procedure rect_FpoliEquiposyHerramientasMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_FpoliMaterialesMouseEnter.
    /// </summary>
    procedure rect_FpoliMaterialesMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_FpoliTransporteMouseEnter.
    /// </summary>
    procedure rect_FpoliTransporteMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_FpoliManoObraMouseEnter.
    /// </summary>
    procedure rect_FpoliManoObraMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_FpoliSeguridadIndustrialMouseEnter.
    /// </summary>
    procedure rect_FpoliSeguridadIndustrialMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_FpoliMaterialesMouseLeave.
    /// </summary>
    procedure rect_FpoliMaterialesMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_FpoliTransporteMouseLeave.
    /// </summary>
    procedure rect_FpoliTransporteMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_FpoliManoObraMouseLeave.
    /// </summary>
    procedure rect_FpoliManoObraMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_FpoliSeguridadIndustrialMouseLeave.
    /// </summary>
    procedure rect_FpoliSeguridadIndustrialMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_FpoliSeguridadIndustrialMouseUp.
    /// </summary>
    procedure rect_FpoliSeguridadIndustrialMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Manejador del evento OnClick de rect_ActualizaIndicesClick.
    /// </summary>
    procedure rect_ActualizaIndicesClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_AdicionarIndiceClick.
    /// </summary>
    procedure rect_AdicionarIndiceClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de tbc_FpolinomicaChange.
    /// </summary>
    procedure tbc_FpolinomicaChange(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_32Click.
    /// </summary>
    procedure rect_32Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_35Click.
    /// </summary>
    procedure rect_35Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_154Click.
    /// </summary>
    procedure rect_154Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de lbl_FpolGeneralClick.
    /// </summary>
    procedure lbl_FpolGeneralClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de lbl_FpolCuadrillaClick.
    /// </summary>
    procedure lbl_FpolCuadrillaClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem65Click.
    /// </summary>
    procedure MenuItem65Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem66Click.
    /// </summary>
    procedure MenuItem66Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem64Click.
    /// </summary>
    procedure MenuItem64Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_subCategoriaFilterChangeTracking.
    /// </summary>
    procedure edt_subCategoriaFilterChangeTracking(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_BuscarRecursosCategoriaChangeTracking.
    /// </summary>
    procedure edt_BuscarRecursosCategoriaChangeTracking(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_FiltroRecursosChangeTracking.
    /// </summary>
    procedure edt_FiltroRecursosChangeTracking(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de grid_RecursosCellDblClick.
    /// </summary>
    procedure grid_RecursosCellDblClick(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Implementa la lógica principal de grid_RecursosColumnSize.
    /// </summary>
    procedure grid_RecursosColumnSize(Sender: TObject; ACol: Integer;
      var NewWidth: Single);
    /// <summary>
    /// Manejador del evento OnClick de rect_SUB34ImportarClick.
    /// </summary>
    procedure rect_SUB34ImportarClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_16Click.
    /// </summary>
    procedure rect_16Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de lbl_73Click.
    /// </summary>
    procedure lbl_73Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_SUB34ReportesMouseEnter.
    /// </summary>
    procedure rect_SUB34ReportesMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_SUB34ReportesMouseLeave.
    /// </summary>
    procedure rect_SUB34ReportesMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_SUB34ReportesClick.
    /// </summary>
    procedure rect_SUB34ReportesClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_Sub35ReportesMouseEnter.
    /// </summary>
    procedure rect_Sub35ReportesMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_Sub35ReportesMouseLeave.
    /// </summary>
    procedure rect_Sub35ReportesMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_Sub35ReportesClick.
    /// </summary>
    procedure rect_Sub35ReportesClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_ImagenGeoReferenciaProyectoDblClick.
    /// </summary>
    procedure rect_ImagenGeoReferenciaProyectoDblClick(Sender: TObject);

    /// <summary>
    /// Gestiona operaciones relacionadas con APU en grid_APUSRecursosColumnSized.
    /// </summary>
    procedure grid_APUSRecursosColumnSized(Sender: TObject; ACol: Integer;
      NewWidth: Single);
    /// <summary>
    /// Implementa la lógica principal de edt_descripcionPresupuestoChange.
    /// </summary>
    procedure edt_descripcionPresupuestoChange(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem1Click.
    /// </summary>
    procedure MenuItem1Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de pmCrono0Popup.
    /// </summary>
    procedure pmCrono0Popup(Sender: TObject);
    /// <summary>
    /// Manejador de eventos de teclado en grid_crono0KeyDown.
    /// </summary>
    procedure grid_crono0KeyDown(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Manejador de eventos de teclado en grid_crono0KeyUp.
    /// </summary>
    procedure grid_crono0KeyUp(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    /// <summary>
    /// Manejador del evento OnClick de grid_Crono1CellClick.
    /// </summary>
    procedure grid_Crono1CellClick(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Manejador del evento OnClick de grid_crono3CellClick.
    /// </summary>
    procedure grid_crono3CellClick(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Manejador del evento OnClick de grid_GBarrasCellClick.
    /// </summary>
    procedure grid_GBarrasCellClick(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem2Click.
    /// </summary>
    procedure MenuItem2Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem3Click.
    /// </summary>
    procedure MenuItem3Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de grid_Crono1ClipboardAfterPasteCell.
    /// </summary>
    procedure grid_Crono1ClipboardAfterPasteCell(Sender: TObject;
      Col, Row: Integer; Value: string);
    /// <summary>
    /// Manejador del evento OnClick de grid_1CellClick.
    /// </summary>
    procedure grid_1CellClick(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Implementa la lógica principal de grid_1ClipboardAfterPasteCell.
    /// </summary>
    procedure grid_1ClipboardAfterPasteCell(Sender: TObject; Col, Row: Integer;
      Value: string);
    /// <summary>
    /// Manejador del evento OnClick de grid_crono2CellClick.
    /// </summary>
    procedure grid_crono2CellClick(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Implementa la lógica principal de grid_Crono1ClipboardBeforePasteCell.
    /// </summary>
    procedure grid_Crono1ClipboardBeforePasteCell(Sender: TObject;
      Col, Row: Integer; var Value: string; var Allow: Boolean);
    /// <summary>
    /// Manejador del evento OnClick de rect_OPC2_CrearPresupuestoClick.
    /// </summary>
    procedure rect_OPC2_CrearPresupuestoClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem4Click.
    /// </summary>
    procedure MenuItem4Click(Sender: TObject);
    /// <summary>
    /// Actualiza la interfaz o los datos asociados en tv_APUSEditorPresupuestoBeforeUpdateNode.
    /// </summary>
    procedure tv_APUSEditorPresupuestoBeforeUpdateNode(Sender: TObject;
      ANode: TTMSFMXTreeViewVirtualNode; AColumn: Integer; var AText: string;
      var ACanUpdate: Boolean);
    /// <summary>
    /// Implementa la lógica principal de edt_HorasJornadaChangeTracking.
    /// </summary>
    procedure edt_HorasJornadaChangeTracking(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_HoraInicioJornadaChangeTracking.
    /// </summary>
    procedure edt_HoraInicioJornadaChangeTracking(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_6PresupuestoClick.
    /// </summary>
    procedure rct_6PresupuestoClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_38Click.
    /// </summary>
    procedure rect_38Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de Rectangle1Click.
    /// </summary>
    procedure Rectangle1Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_Sub35CrearClick.
    /// </summary>
    procedure rect_Sub35CrearClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de grid_APUSRecursosCellDblClick.
    /// </summary>
    procedure grid_APUSRecursosCellDblClick(Sender: TObject;
      ACol, ARow: Integer);
    /// <summary>
    /// Manejador del evento OnClick de rect_SUB34EditarClick.
    /// </summary>
    procedure rect_SUB34EditarClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_SUB35GuardarClick.
    /// </summary>
    procedure rect_SUB35GuardarClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_SUB35DuplicarClick.
    /// </summary>
    procedure rect_SUB35DuplicarClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_porcentajeIVANuevoPresupuestoExit.
    /// </summary>
    procedure edt_porcentajeIVANuevoPresupuestoExit(Sender: TObject);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en grid_APUSRecursosCellEditDone.
    /// </summary>
    procedure grid_APUSRecursosCellEditDone(Sender: TObject;
      ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en grid_APUSRecursosCellEditGetData.
    /// </summary>
    procedure grid_APUSRecursosCellEditGetData(Sender: TObject;
      ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor;
      var CellString: string);
    /// <summary>
    /// Implementa la lógica principal de grid_desagregacionCPCCellEditDone.
    /// </summary>
    procedure grid_desagregacionCPCCellEditDone(Sender: TObject;
      ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
    /// <summary>
    /// Implementa la lógica principal de grid_FpolinomicaCellEditDone.
    /// </summary>
    procedure grid_FpolinomicaCellEditDone(Sender: TObject; ACol, ARow: Integer;
      CellEditor: TTMSFNCGridEditor);
    /// <summary>
    /// Implementa la lógica principal de grid_FpolIndicesDisponiblesCellEditDone.
    /// </summary>
    procedure grid_FpolIndicesDisponiblesCellEditDone(Sender: TObject;
      ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
    /// <summary>
    /// Implementa la lógica principal de grid_FpolIndicesDisponiblesCellEditValidateData.
    /// </summary>
    procedure grid_FpolIndicesDisponiblesCellEditValidateData(Sender: TObject;
      ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor;
      var CellString: string; var Allow: Boolean);
    /// <summary>
    /// Implementa la lógica principal de grid_FpolIndicesDisponiblesColumnSized.
    /// </summary>
    procedure grid_FpolIndicesDisponiblesColumnSized(Sender: TObject;
      ACol: Integer; NewWidth: Single);
    /// <summary>
    /// Implementa la lógica principal de grid_FpolCuadrillaTipoCellEditDone.
    /// </summary>
    procedure grid_FpolCuadrillaTipoCellEditDone(Sender: TObject;
      ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
    /// <summary>
    /// Implementa la lógica principal de grid_FpolCuadrillaTipoSelectCell.
    /// </summary>
    procedure grid_FpolCuadrillaTipoSelectCell(Sender: TObject;
      ACol, ARow: Integer; var Allow: Boolean);
    /// <summary>
    /// Manejador del evento OnClick de popupItem_1Click.
    /// </summary>
    procedure popupItem_1Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_5PresupuestoClick.
    /// </summary>
    procedure rct_5PresupuestoClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_FiltroSubCategoriasChangeTracking.
    /// </summary>
    procedure edt_FiltroSubCategoriasChangeTracking(Sender: TObject);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en edt_FiltroAPUSChangeTracking.
    /// </summary>
    procedure edt_FiltroAPUSChangeTracking(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_Presupuestos_SeleccionarIndirectosClick.
    /// </summary>
    procedure rect_Presupuestos_SeleccionarIndirectosClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_Presupuestos_AbrirTanteoClick.
    /// </summary>
    procedure rect_Presupuestos_AbrirTanteoClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_Presupuestos_LimpiarTanteoClick.
    /// </summary>
    procedure rect_Presupuestos_LimpiarTanteoClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_Presupuestos_VisorEDTClick.
    /// </summary>
    procedure rect_Presupuestos_VisorEDTClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_Presupuestos_NotasGeneralesClick.
    /// </summary>
    procedure rect_Presupuestos_NotasGeneralesClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_Presupuesto_AdicionarNotaClick.
    /// </summary>
    procedure rect_Presupuesto_AdicionarNotaClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_Presupuesto_OpcionesParetoClick.
    /// </summary>
    procedure rect_Presupuesto_OpcionesParetoClick(Sender: TObject);
    /// <summary>
    /// Manejador de eventos de teclado en edt_porcentajeIVANuevoPresupuestoKeyUp.
    /// </summary>
    procedure edt_porcentajeIVANuevoPresupuestoKeyUp(Sender: TObject;
      var Key: Word; var KeyChar: WideChar; Shift: TShiftState);
    /// <summary>
    /// Implementa la lógica principal de grid_PresupuestosCellEditDone.
    /// </summary>
    procedure grid_PresupuestosCellEditDone(Sender: TObject;
      ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
    /// <summary>
    /// Manejador de eventos de teclado en grid_PresupuestosKeyUp.
    /// </summary>
    procedure grid_PresupuestosKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    /// <summary>
    /// Manejador del evento OnClick de rect_BorrarTanteoClick.
    /// </summary>
    procedure rect_BorrarTanteoClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_AceptarTanteoClick.
    /// </summary>
    procedure rect_AceptarTanteoClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_RestauraTanteoClick.
    /// </summary>
    procedure rect_RestauraTanteoClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de grid_PresupuestosColumnSized.
    /// </summary>
    procedure grid_PresupuestosColumnSized(Sender: TObject; ACol: Integer;
      NewWidth: Single);
    /// <summary>
    /// Implementa la lógica principal de grid_PresupuestosMouseDown.
    /// </summary>
    procedure grid_PresupuestosMouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de rect_FiltroSubcategoria_todosMouseLeave.
    /// </summary>
    procedure rect_FiltroSubcategoria_todosMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_FiltroSubcategoria_todosMouseEnter.
    /// </summary>
    procedure rect_FiltroSubcategoria_todosMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_FiltroAPUS_TodosMouseEnter.
    /// </summary>
    procedure rect_FiltroAPUS_TodosMouseEnter(Sender: TObject);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en rect_FiltroAPUS_TodosMouseLeave.
    /// </summary>
    procedure rect_FiltroAPUS_TodosMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_FiltroSubcategoria_todosClick.
    /// </summary>
    procedure rect_FiltroSubcategoria_todosClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_FiltroAPUS_TodosClick.
    /// </summary>
    procedure rect_FiltroAPUS_TodosClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de lyt_gridSubCategoriasResize.
    /// </summary>
    procedure lyt_gridSubCategoriasResize(Sender: TObject);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en lyt_PresupuestoAPUSResize.
    /// </summary>
    procedure lyt_PresupuestoAPUSResize(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de lyt_PresupuestosOpciones1Resize.
    /// </summary>
    procedure lyt_PresupuestosOpciones1Resize(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de grid_PresupuestosAPUSCellDblClick.
    /// </summary>
    procedure grid_PresupuestosAPUSCellDblClick(Sender: TObject;
      ACol, ARow: Integer);
    /// <summary>
    /// Actualiza la interfaz o los datos asociados en Trvw_APUSTanteoAfterUpdateNode.
    /// </summary>
    procedure Trvw_APUSTanteoAfterUpdateNode(Sender: TObject;
      ANode: TTMSFNCTreeViewVirtualNode; AColumn: Integer);
    /// <summary>
    /// Manejador del evento OnClick de rct_7PresupuestoClick.
    /// </summary>
    procedure rct_7PresupuestoClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_4PresupuestoClick.
    /// </summary>
    procedure rct_4PresupuestoClick(Sender: TObject);
    /// <summary>
    /// Actualiza la interfaz o los datos asociados en Trvw_TanteoCronoAfterUpdateNode.
    /// </summary>
    procedure Trvw_TanteoCronoAfterUpdateNode(Sender: TObject;
      ANode: TTMSFNCTreeViewVirtualNode; AColumn: Integer);
    /// <summary>
    /// Manejador del evento OnClick de rect_TanteoCronoBorrarClick.
    /// </summary>
    procedure rect_TanteoCronoBorrarClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_TanteoCronoRestaurarClick.
    /// </summary>
    procedure rect_TanteoCronoRestaurarClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_TanteoCronoAceptarClick.
    /// </summary>
    procedure rect_TanteoCronoAceptarClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de tbc_CronogramasChange.
    /// </summary>
    procedure tbc_CronogramasChange(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_Opc3Click.
    /// </summary>
    procedure rect_Opc3Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_btnLoginClick.
    /// </summary>
    procedure rct_btnLoginClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_3PresupuestoClick.
    /// </summary>
    procedure rct_3PresupuestoClick(Sender: TObject);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en Trvw_APUSTanteoResize.
    /// </summary>
    procedure Trvw_APUSTanteoResize(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de Trvw_TanteoCronoResize.
    /// </summary>
    procedure Trvw_TanteoCronoResize(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_RecursosSeleccionarTodosClick.
    /// </summary>
    procedure rect_RecursosSeleccionarTodosClick(Sender: TObject);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en edt_FiltroListadoApusChangeTracking.
    /// </summary>
    procedure edt_FiltroListadoApusChangeTracking(Sender: TObject);
    /// <summary>
    /// Gestiona operaciones relacionadas con APU en edt_filtroLVApusCategoriaChangeTracking.
    /// </summary>
    procedure edt_filtroLVApusCategoriaChangeTracking(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_OPC1_APUSClick.
    /// </summary>
    procedure rect_OPC1_APUSClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_115Click.
    /// </summary>
    procedure rect_115Click(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de grid_PresupuestosSelectCell.
    /// </summary>
    procedure grid_PresupuestosSelectCell(Sender: TObject; ACol, ARow: Integer;
      var Allow: Boolean);
    /// <summary>
    /// Manejador del evento OnClick de grid_PresupuestosSubCategoriaCellClick.
    /// </summary>
    procedure grid_PresupuestosSubCategoriaCellClick(Sender: TObject;
      ACol, ARow: Integer);
    /// <summary>
    /// Manejador del evento OnClick de rect_StakeDisponibleAdicionarClick.
    /// </summary>
    procedure rect_StakeDisponibleAdicionarClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de Trvw_StakeHolderDisponiblesNodeDblClick.
    /// </summary>
    procedure Trvw_StakeHolderDisponiblesNodeDblClick(Sender: TObject;
      ANode: TTMSFNCTreeViewVirtualNode);
    /// <summary>
    /// Manejador del evento OnClick de rect_StakeVisualizarClick.
    /// </summary>
    procedure rect_StakeVisualizarClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_StakeDisponibleEditarClick.
    /// </summary>
    procedure rect_StakeDisponibleEditarClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_StakeBorrarClick.
    /// </summary>
    procedure rct_StakeBorrarClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de grid_EDOStakesCellDblClick.
    /// </summary>
    procedure grid_EDOStakesCellDblClick(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Manejador del evento OnClick de grid_EDOStakesCellClick.
    /// </summary>
    procedure grid_EDOStakesCellClick(Sender: TObject; ACol, ARow: Integer);
    /// <summary>
    /// Implementa la lógica principal de grid_EDOStakesCellEditSetData.
    /// </summary>
    procedure grid_EDOStakesCellEditSetData(Sender: TObject;
      ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor;
      var CellString: string);
    /// <summary>
    /// Manejador del evento OnClick de rct_2PresupuestoClick.
    /// </summary>
    procedure rct_2PresupuestoClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_FiltroStokeDisponiblesChangeTracking.
    /// </summary>
    procedure edt_FiltroStokeDisponiblesChangeTracking(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem47Click.
    /// </summary>
    procedure MenuItem47Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem48Click.
    /// </summary>
    procedure MenuItem48Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de popupItem_2Click.
    /// </summary>
    procedure popupItem_2Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de popupItem_3Click.
    /// </summary>
    procedure popupItem_3Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de trvw_RecursosDesagregacionNodeDblClick.
    /// </summary>
    procedure trvw_RecursosDesagregacionNodeDblClick(Sender: TObject;
      ANode: TTMSFNCTreeViewVirtualNode);
    /// <summary>
    /// Implementa la lógica principal de trvw_RecursosDesagregacionResize.
    /// </summary>
    procedure trvw_RecursosDesagregacionResize(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_8PresupuestoClick.
    /// </summary>
    procedure rct_8PresupuestoClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_FpoliEquiposyHerramientasClick.
    /// </summary>
    procedure rect_FpoliEquiposyHerramientasClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_FpoliMaterialesClick.
    /// </summary>
    procedure rect_FpoliMaterialesClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_FpoliTransporteClick.
    /// </summary>
    procedure rect_FpoliTransporteClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_FpoliManoObraClick.
    /// </summary>
    procedure rect_FpoliManoObraClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_desgEquiposHerramientasClick.
    /// </summary>
    procedure rct_desgEquiposHerramientasClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_desgMaterialesClick.
    /// </summary>
    procedure rct_desgMaterialesClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_desgTransporteClick.
    /// </summary>
    procedure rct_desgTransporteClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_desgManoObraClick.
    /// </summary>
    procedure rct_desgManoObraClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de chkRecursosSoloFaltantesChange.
    /// </summary>
    procedure chkRecursosSoloFaltantesChange(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de DGrid_ColaboradoresCellClick.
    /// </summary>
    procedure DGrid_ColaboradoresCellClick(Sender: TObject;
      AColumn, ARow: Integer);
    /// <summary>
    /// Implementa la lógica principal de rect_33MouseDown.
    /// </summary>
    procedure rect_33MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Implementa la lógica principal de rect_33MouseLeave.
    /// </summary>
    procedure rect_33MouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_33MouseUp.
    /// </summary>
    procedure rect_33MouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    /// <summary>
    /// Manejador del evento OnClick de lbl_olvidoClick.
    /// </summary>
    procedure lbl_olvidoClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de imgReferencialClick.
    /// </summary>
    procedure imgReferencialClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de MenuItem8Click.
    /// </summary>
    procedure MenuItem8Click(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de mItem_1Click.
    /// </summary>
    procedure mItem_1Click(Sender: TObject);
    /// <summary>
    /// Manejador de eventos de teclado en edt_LatitudKeyUp.
    /// </summary>
    procedure edt_LatitudKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    /// <summary>
    /// Manejador de eventos de teclado en edt_longitudKeyUp.
    /// </summary>
    procedure edt_longitudKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    /// <summary>
    /// Implementa la lógica principal de webBrowser_1Initialized.
    /// </summary>
    procedure webBrowser_1Initialized(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de webBrowser_1WebMessageReceived.
    /// </summary>
    procedure webBrowser_1WebMessageReceived(Sender: TObject;
      var Params: TTMSFNCWebBrowserWebMessageReceivedParams);
    /// <summary>
    /// Libera recursos o cierra el formulario en FormClose.
    /// </summary>
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    /// <summary>
    /// Manejador del evento OnClick de rect_configRepotesClick.
    /// </summary>
    procedure rect_configRepotesClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de lyt_OPCGrupoClick.
    /// </summary>
    procedure lyt_OPCGrupoClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en lyt_OPCGrupoMouseEnter.
    /// </summary>
    procedure lyt_OPCGrupoMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de lyt_OPCGrupoMouseLeave.
    /// </summary>
    procedure lyt_OPCGrupoMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en lyt_OPCSincronizarMouseEnter.
    /// </summary>
    procedure lyt_OPCSincronizarMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de lyt_OPCSincronizarMouseLeave.
    /// </summary>
    procedure lyt_OPCSincronizarMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de lyt_OPCTiendaMouseLeave.
    /// </summary>
    procedure lyt_OPCTiendaMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en lyt_OPCTiendaMouseEnter.
    /// </summary>
    procedure lyt_OPCTiendaMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de lyt_OPCVariosMouseLeave.
    /// </summary>
    procedure lyt_OPCVariosMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en lyt_OPCVariosMouseEnter.
    /// </summary>
    procedure lyt_OPCVariosMouseEnter(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de lyt_OPCSincronizarClick.
    /// </summary>
    procedure lyt_OPCSincronizarClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de lyt_OPCTiendaClick.
    /// </summary>
    procedure lyt_OPCTiendaClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de lyt_OPCVariosClick.
    /// </summary>
    procedure lyt_OPCVariosClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_addReferidoMouseEnter.
    /// </summary>
    procedure rect_addReferidoMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_addReferidoMouseLeave.
    /// </summary>
    procedure rect_addReferidoMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_RefrescaReferidoMouseEnter.
    /// </summary>
    procedure rect_RefrescaReferidoMouseEnter(Sender: TObject);
    /// <summary>
    /// Refresca la visualización o lista de datos en rect_RefrescaReferidoMouseLeave.
    /// </summary>
    procedure rect_RefrescaReferidoMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_enviosDatosMouseEnter.
    /// </summary>
    procedure rect_enviosDatosMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_enviosDatosMouseLeave.
    /// </summary>
    procedure rect_enviosDatosMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_addReferidoClick.
    /// </summary>
    procedure rect_addReferidoClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_enviosDatosClick.
    /// </summary>
    procedure rect_enviosDatosClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_RefrescaReferidoClick.
    /// </summary>
    procedure rect_RefrescaReferidoClick(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de tmrComunicacionTimer.
    /// </summary>
    procedure tmrComunicacionTimer(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de DGrid_ComunicacionesCellDblClick.
    /// </summary>
    procedure DGrid_ComunicacionesCellDblClick(Sender: TObject;
      AColumn, ARow: Integer);
    /// <summary>
    /// Manejador del evento de ratón en rect_MensajesMouseEnter.
    /// </summary>
    procedure rect_MensajesMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_MensajesMouseLeave.
    /// </summary>
    procedure rect_MensajesMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_MensajesClick.
    /// </summary>
    procedure rect_MensajesClick(Sender: TObject);
    /// <summary>
    /// Actualiza la interfaz o los datos asociados en rect_ActualizaMigracionesMouseLeave.
    /// </summary>
    procedure rect_ActualizaMigracionesMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_ActualizaMigracionesMouseEnter.
    /// </summary>
    procedure rect_ActualizaMigracionesMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de lyt_BodySincronizaryBackupResize.
    /// </summary>
    procedure lyt_BodySincronizaryBackupResize(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_ActualizaMigracionesClick.
    /// </summary>
    procedure rect_ActualizaMigracionesClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_ActualizaBackUpClick.
    /// </summary>
    procedure rect_ActualizaBackUpClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_CrearMigracionMouseEnter.
    /// </summary>
    procedure rect_CrearMigracionMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_CrearMigracionMouseLeave.
    /// </summary>
    procedure rect_CrearMigracionMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_CrearMigracionClick.
    /// </summary>
    procedure rect_CrearMigracionClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_crearBackUpClick.
    /// </summary>
    procedure rect_crearBackUpClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_crearBackUpMouseEnter.
    /// </summary>
    procedure rect_crearBackUpMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_crearBackUpMouseLeave.
    /// </summary>
    procedure rect_crearBackUpMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_ActualizaBackUpMouseEnter.
    /// </summary>
    procedure rect_ActualizaBackUpMouseEnter(Sender: TObject);
    /// <summary>
    /// Actualiza la interfaz o los datos asociados en rect_ActualizaBackUpMouseLeave.
    /// </summary>
    procedure rect_ActualizaBackUpMouseLeave(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rect_RestaurarBackUpClick.
    /// </summary>
    procedure rect_RestaurarBackUpClick(Sender: TObject);
    /// <summary>
    /// Manejador del evento de ratón en rect_RestaurarBackUpMouseEnter.
    /// </summary>
    procedure rect_RestaurarBackUpMouseEnter(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de rect_RestaurarBackUpMouseLeave.
    /// </summary>
    procedure rect_RestaurarBackUpMouseLeave(Sender: TObject);
    /// <summary>
    /// Implementa la lógica principal de edt_RIdFiscalExit.
    /// </summary>
    procedure edt_RIdFiscalExit(Sender: TObject);
    /// <summary>
    /// Manejador del evento OnClick de rct_RegistrarUsuarioClick.
    /// </summary>
    procedure rct_RegistrarUsuarioClick(Sender: TObject);
    /// <summary>
    /// Manejador de eventos de teclado en edt_RIdFiscalKeyUp.
    /// </summary>
    procedure edt_RIdFiscalKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure chk_AutorizacionGiproyChange(Sender: TObject);
    procedure rect_sub3DB2Click(Sender: TObject);
    procedure rect_sub3DB1Click(Sender: TObject);
    procedure rect_sub3DB4Click(Sender: TObject);
    procedure rect_sub3DB5Click(Sender: TObject);
    procedure rect_SUB32CrearClick(Sender: TObject);
    procedure rect_SUB32DuplicarClick(Sender: TObject);
    procedure rect_SUB32EditarClick(Sender: TObject);
    procedure rect_SUB32BorrarClick(Sender: TObject);
    procedure rect_SUB32ActualizarClick(Sender: TObject);
    procedure rect_SUB33CrearClick(Sender: TObject);
    procedure rect_SUB33DuplicarClick(Sender: TObject);
    procedure rect_SUB33EditarClick(Sender: TObject);
    procedure lbl9Click(Sender: TObject);
    procedure chk_AutorizacionPublicidadChange(Sender: TObject);
    procedure edt_RNombreEnter(Sender: TObject);
    procedure edt_RApellidosEnter(Sender: TObject);
    procedure edt_RProfesionEnter(Sender: TObject);
    procedure edt_RCiudadEnter(Sender: TObject);
    procedure edt_RProvinciaEnter(Sender: TObject);
    procedure edt_REmailEnter(Sender: TObject);
    procedure edt_RPasswordEnter(Sender: TObject);
    procedure edt_RAliasKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_RNacionalidadKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_REmpresaKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_RProfesionKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_RCiudadKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_RProvinciaKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_RMovilKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_REmailKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_RPasswordKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_RCiudadChangeTracking(Sender: TObject);
    procedure edt_RProvinciaChangeTracking(Sender: TObject);
    procedure edt_REmailChangeTracking(Sender: TObject);
    procedure edt_RPasswordChangeTracking(Sender: TObject);
    procedure edt_RProfesionChangeTracking(Sender: TObject);
    procedure edt_RApellidosChangeTracking(Sender: TObject);
    procedure edt_RNombreChangeTracking(Sender: TObject);
    procedure mItem_3Click(Sender: TObject);
    procedure mItem_2Click(Sender: TObject);
    procedure rect_cat1EquiposHerramientasClick(Sender: TObject);
    procedure rect_cat2MaterialesClick(Sender: TObject);
    procedure rect_cat3TransporteClick(Sender: TObject);
    procedure rect_cat4ManodeObraClick(Sender: TObject);
    procedure rect_cat5SeguridadIndustrialClick(Sender: TObject);
    procedure rect_cat6PreciosUnitariosClick(Sender: TObject);
    procedure rect_OPC1_RecursosClick(Sender: TObject);
    procedure rect_OPC1_OpcionesClick(Sender: TObject);
    procedure rect_OPC1_SubcategoriasClick(Sender: TObject);
    procedure mItem_4Click(Sender: TObject);
    procedure grid_RecursosMouseLeave(Sender: TObject);
    procedure lvOPCRec5DragDrop(Sender: TObject; const Data: TDragObject;
      const Point: TPointF);
    procedure lvOPCRec4DragDrop(Sender: TObject; const Data: TDragObject;
      const Point: TPointF);
    procedure lvOPCRec3DragDrop(Sender: TObject; const Data: TDragObject;
      const Point: TPointF);
    procedure lvOPCRec2DragDrop(Sender: TObject; const Data: TDragObject;
      const Point: TPointF);
    procedure lvOPCRec1DragDrop(Sender: TObject; const Data: TDragObject;
      const Point: TPointF);
    procedure rect_SUB33BuscarClick(Sender: TObject);
    procedure mItem_5Click(Sender: TObject);
    procedure rect_OPCRec1Click(Sender: TObject);
    procedure rect_OPCRec2Click(Sender: TObject);
    procedure rect_OPCRec3Click(Sender: TObject);
    procedure rect_OPCRec4Click(Sender: TObject);
    procedure rect_OPCRec5Click(Sender: TObject);
    procedure trvw_cat2MaterialesDblClick(Sender: TObject);
    procedure trvw_cat2MaterialesKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure trvw_cat3TransporteDblClick(Sender: TObject);
    procedure trvw_cat3TransporteKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure trvw_cat4ManodeObraDblClick(Sender: TObject);
    procedure trvw_cat4ManodeObraKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure trvw_cat5SeguridadIndustrialDblClick(Sender: TObject);
    procedure trvw_cat5SeguridadIndustrialKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure trvw_cat6PreciosUnitariosDblClick(Sender: TObject);
    procedure trvw_cat6PreciosUnitariosKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure trvw_cat1EquiposHerramientasDblClick(Sender: TObject);
    procedure trvw_cat1EquiposHerramientasKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure grid_RecursosDragEnd(Sender: TObject);
    procedure grdpnlyt311Click(Sender: TObject);
    procedure rect_SUB33BorrarClick(Sender: TObject);
    procedure MenuItem5Click(Sender: TObject);
    procedure MenuItem6Click(Sender: TObject);
    procedure grid_RecursosDblClick(Sender: TObject);
    procedure lvOPCRec4ItemClick(const Sender: TObject;
      const AItem: TListViewItem);
    procedure lvOPCRec1ItemClick(const Sender: TObject;
      const AItem: TListViewItem);
    procedure lvOPCRec2ItemClick(const Sender: TObject;
      const AItem: TListViewItem);
    procedure lvOPCRec3ItemClick(const Sender: TObject;
      const AItem: TListViewItem);
    procedure lvOPCRec5ItemClick(const Sender: TObject;
      const AItem: TListViewItem);
    procedure grid_RecursosKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure rect_SUB34CrearClick(Sender: TObject);
    procedure rect_SUB34DuplicarClick(Sender: TObject);
    procedure rect_SUB34BorrarClick(Sender: TObject);
    procedure MenuItem54Click(Sender: TObject);
    procedure rect_SUB34BorrarMouseEnter(Sender: TObject);
    procedure rect_SUB34BorrarMouseLeave(Sender: TObject);
    procedure rect_SUB34PertenenciaClick(Sender: TObject);
    procedure rect_SUB34PertenenciaMouseLeave(Sender: TObject);
    procedure rect_SUB35UndoClick(Sender: TObject);
    procedure grid_APUSRecursosKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure MenuItem26Click(Sender: TObject);
    procedure MenuItem39Click(Sender: TObject);
    procedure grid_APUSRecursosMouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure lv_APUSCategoriaDragOver(Sender: TObject; const Data: TDragObject;
      const Point: TPointF; var Operation: TDragOperation);
    procedure FormDestroy(Sender: TObject);
    procedure rect_SUB33ActializarClick(Sender: TObject);
    procedure rect_Opc2Click(Sender: TObject);
    procedure MenuItem40Click(Sender: TObject);
    procedure grid_APUSRecursosGetCellLayout(Sender: TObject; ACol,
      ARow: Integer; ALayout: TTMSFNCGridCellLayout;
      ACellState: TTMSFNCGridCellState);
    procedure cbbEstadoAPUSChange(Sender: TObject);
    procedure lyt_OPCRec1Click(Sender: TObject);
    procedure grid_APUSRecursosResize(Sender: TObject);
    procedure Rectangle4Click(Sender: TObject);
    procedure Layout42Click(Sender: TObject);
    procedure Layout42MouseEnter(Sender: TObject);
    procedure Layout42MouseLeave(Sender: TObject);
    procedure rct_1PresupuestoClick(Sender: TObject);
    procedure rect_AppClose2Click(Sender: TObject);
    procedure grid_stakesAsignadosCellClick(Sender: TObject; ACol,
      ARow: Integer);
    procedure grid_stakesAsignadosCellEditDone(Sender: TObject; ACol,
      ARow: Integer; CellEditor: TTMSFNCGridEditor);
    procedure grid_EDOStakesCellEditDone(Sender: TObject; ACol, ARow: Integer;
      CellEditor: TTMSFNCGridEditor);
    procedure rct_23MouseEnter(Sender: TObject);
    procedure rct_23MouseLeave(Sender: TObject);
    procedure rct_24MouseEnter(Sender: TObject);
    procedure rct_24MouseLeave(Sender: TObject);
    procedure rct_25MouseLeave(Sender: TObject);
    procedure rct_25MouseEnter(Sender: TObject);
    procedure rct_26MouseEnter(Sender: TObject);
    procedure rct_26MouseLeave(Sender: TObject);
    procedure rect_Presupuesto_OpcionesParetoMouseEnter(Sender: TObject);
    procedure rect_Presupuesto_OpcionesParetoMouseLeave(Sender: TObject);
    procedure rect_Presupuestos_AbrirTanteoMouseLeave(Sender: TObject);
    procedure rect_Presupuestos_AbrirTanteoMouseEnter(Sender: TObject);
    procedure rect_Presupuesto_AdicionarNotaMouseEnter(Sender: TObject);
    procedure rect_Presupuesto_AdicionarNotaMouseLeave(Sender: TObject);
    procedure rect_Presupuestos_LimpiarTanteoMouseEnter(Sender: TObject);
    procedure rect_Presupuestos_LimpiarTanteoMouseLeave(Sender: TObject);
    procedure rect_Presupuestos_NotasGeneralesMouseEnter(Sender: TObject);
    procedure rect_Presupuestos_NotasGeneralesMouseLeave(Sender: TObject);
    procedure rect_Presupuestos_SeleccionarIndirectosMouseLeave(
      Sender: TObject);
    procedure rect_Presupuestos_SeleccionarIndirectosMouseEnter(
      Sender: TObject);
    procedure rect_Presupuestos_VisorEDTMouseEnter(Sender: TObject);
    procedure rect_Presupuestos_VisorEDTMouseLeave(Sender: TObject);
    procedure grid_PresupuestosAPUSResize(Sender: TObject);
    procedure rect_Opc1Click(Sender: TObject);

  strict private
    { strict private declarations }
    pulsarTeclaGrid: Boolean;
    entradagridItems: Boolean;
    idUsuarioReceptor: Integer;
    nombreUsuarioReceptor: string;
    FCoInitialized: Boolean;
    FLastCheckedRuc: string;
    FCheckingRuc: Boolean;
    FLastRucCheckTime: TDateTime;
    FMouseDown: Boolean;
    FDragging: Boolean;
    FDownPos: TPointF;
    FDownRow: Integer;
    FBlockSelection: Boolean;
    FDragPayload: TDragPayload;
    FDragBitmap: FMX.Graphics.TBitmap;
    FDownIsValidDataCell: Boolean;
    FDragStart: TPointF;
    FUltimoFiltroAPUS: string;
    FApusCache: TStringList; // cada línea = serialización por columnas

    procedure AplicarFiltrosAPUS;
    procedure moverOpcionesPresupuestos(item: Integer);
    procedure AdicionaItem();
    procedure SeleccionaCategoria(opcion: Integer);
    procedure BorrarItemSubCategoria();
    procedure EditarItemSubCategoria();
    procedure ClonarItem(opcion: Integer);
    procedure seleccionOPC(opc: Integer);
    procedure limpiaGlowOPCPresupuestos();
    procedure compruebaEscrito();
    procedure loadMapHtml;
    procedure realizaLogin_old(); // deprecated ???
    procedure realizaLogin;
    procedure posicionOPC_OtrosServicios(opcion: Integer);
    procedure addusuarioColaborador(emailColaborador: string);
    procedure Opciones_Referidos(opcion: Integer);
    procedure ejecutarLeeBios;
    procedure CheckRucIfNeeded;
    procedure editarRecursos();
    procedure CrearRecursos();
    procedure ProcesarDobleClickGrid(const ACol, ARow: Integer);
    procedure AbrirSeleccionCPC(const ARow: Integer);
    procedure StartDragFromSelection();
    procedure cierraLVCategorias(opcion: integer);
    procedure ResaltaPanelOpciones(opcion: integer);
    procedure LVRecDragDropUnificado(Sender: TObject; const Data: TDragObject;
      const Point: TPointF);
    procedure LVOpcSelecciona(opcion: integer);
    procedure ImportarRecursosPortapapeles();
    procedure ImportarAPUsPortapapeles();
    procedure ExportarApuPortapapeles();
    procedure SeleccionaAPUSMostrar(ARow, ACol: integer);
    procedure ActivarGridPareto(ADataset: TDataSet; ADataSource: TDataSource);
    procedure EditarAPUCompleta(codAPUt: string);

    function ObtenerNumeroSerieBIOS: string;
    function ObtenerNumeroSerieHDDFisico: string;
    function catActiva(): Integer;
    function daCategoriaActivaRecursos(): Integer;
    function GetItemAt(Point: TPointF; Tltv: TListView): TListViewItem;
    function PreguntarSubirCertificadoRuc(const AMsgErrorWS: string): Boolean;
    function CargarRucDesdeCertificadoPdf: Boolean;
    function CompruebaAceptacionPoliticasyPublicidad(): Boolean;

    function TryParseCategoriaDrop(const CategoriaDrop: string;
      out CodCategoria, CodSubCategoria: string): Boolean;
    function GetListViewItemAtPoint(LV: TListView; const P: TPointF)
      : TListViewItem;
    function IsDataRow(const ARow: Integer): Boolean;
    function HitTestFNCGridCell(const P: TPointF; out ACol, ARow: Integer):
      Boolean;
    function ForEachRecursoFromDrag(const Data: TDragObject; const Proc:
      TRecursoProc): Boolean;

    function FormateaRendimiento(const Valor: Double): string;

  public
    { Public declarations }
    Users: TUsersIni;
    Reportes: TReportes;
    ColBuffers: TArray<TList<TListBoxItem>>;

    procedure moverTab(item: Integer);
    procedure rellenaCategoriaRecursos();
    procedure muevegrid(i, r: Integer);
    procedure abreMSProject(Datos: string);
    procedure moverTabPresupuesto(item: Integer);
    procedure ResetPassword(const Email: string);
    procedure posicionaCoordGPS(Latitud, Longitud: string);
    procedure CachearAPUSGrid;
    procedure AjustarGridPresupuestosAPUS;

    function daRespuestaDesencripta(Datos: string):
      dat_respuestaFicheroImportacion;
    function FormateaPorcentaje(const Valor: Double): string;
    function FormateaCantidad(const Valor: Double): string;

  end;

var
  frmMain: TfrmMain;
  FMouseDown: Boolean;
  rendimiento2Old: Double;
  movimientoAPU: TStringList;
  tmovimientoAPU: Integer;
  ARowDesagregacion: Integer;

function GetSystemFirmwareTable(ProviderSignature: DWORD; FirmwareTableID:
  DWORD; pFirmwareTableBuffer: Pointer; BufferSize: DWORD): DWORD; stdcall;
external kernel32 name 'GetSystemFirmwareTable';

function DaCodAPUCompletoDB(codAPU: string): string;

procedure ToggleRowSelection(Grid: TTMSFNCGrid; ARow: Integer);

implementation

{$R *.fmx}

uses
  DM1, DM2, DM_Presupuestos, uNuevaCategoria, uNuevaBase, uMetodosGuardar,
  uBuscar, uNuevoRecurso, uAddAPU, uReemplazar, uDuplicarBase, ulistStakes,
  uVisorEDT, uOpcionesEDT, uPertenencia, uStakes, uRolProyecto,
  uPorcentajesIndirectos,
  uEditApuPresupuesto, uAddEDO, uCronoDerivaciones, uAbrirPresupuesto,
  uNotaPresupuesto, uVisorNotas,
  uInputMemo, DMOnline, uPDFViewer, uAddEditCPC, uCPCSeleccion,
  uIndicesFPolinomica,
  uImportarSubCategorias, uImportarRecursos2, uAbrirBase3, uImportarApus,
  DMSeguridad, PlantillasExcel,
  thDafechaInternet, uNotasAPUEDT, DM_EDO, uTMSGridAutoSize, uVisorReportesExt,
  thRecibeComunicacion, thEnviarMensaje, uDisplayChat, uEnviosBasesProyectos,
  DMExportDB, uFormImportando, uApiGiProy,
  uPdfTool, BrowserUtils, uTrazabilidadRecursos, uTrazabilidadAPU,
  uConfiguracion, uRectFillBitmapColoriz;

{ TForm1 }

constructor TDragPayload.Create(const AJson: TJSONObject);
begin
  inherited Create;
  FJsonText := AJson.ToJSON;
end;

function TfrmMain.FormateaCantidad(const Valor: Double): string;
begin
  Result := FormatFloat('0.00', Valor);
end;

function TfrmMain.FormateaRendimiento(const Valor: Double): string;
var
  Mascara: string;
begin
  Mascara := '0.' + StringOfChar('0', ndecimalesPresupuesto);
  Result := FormatFloat(Mascara, Valor);
end;

function TfrmMain.FormateaPorcentaje(const Valor: Double): string;
begin
  Result := FormatFloat('0.00', Valor) + '%';
end;

function TfrmMain.ForEachRecursoFromDrag(const Data: TDragObject; const Proc:
  TRecursoProc): Boolean;
var
  Payload: TDragPayload;
  RootObj, Obj: TJSONObject;
  Arr: TJSONArray;
  i: Integer;
begin
  Result := False;

  if (Data.Source = nil) or not (Data.Source is TDragPayload) then
    Exit;

  Payload := TDragPayload(Data.Source);
  if Payload.Json.Trim = '' then
    Exit;

  RootObj := TJSONObject.ParseJSONValue(Payload.Json) as TJSONObject;
  if RootObj = nil then
    Exit;

  try
    Arr := RootObj.Values['CambioRecurso'] as TJSONArray;
    if (Arr = nil) or (Arr.Count = 0) then
      Exit;

    for i := 0 to Arr.Count - 1 do
    begin
      Obj := Arr.Items[i] as TJSONObject;
      if Obj = nil then
        Continue;

      Proc(
        Obj.GetValue<string>('codRecursoCompleto', ''),
        Obj.GetValue<string>('codUnicoRecurso', '')
        );
    end;

    Result := True;
  finally
    RootObj.Free;
  end;
end;

function DaCodAPUCompletoDB(codAPU: string): string;
var
  qry: TUniquery;
  TcodCategoria: string;
  TcodRecurso: string;
begin
  Result := '';
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.text :=
        'SELECT codCategoriaAPU, CodRecursoAPU FROM apus WHERE codBase=:codBase and codAPU=:codAPU';
      ParambyName('codBase').AsString := base_activa.codBase;
      ParambyName('codAPU').AsString := codAPU;
      Open;
      if Eof then
        Exit;
      TcodCategoria := FieldbyName('codCategoriaAPU').AsString;
      TcodRecurso := FieldbyName('CodRecursoAPU').AsString;
      Result := generaCodigoRecurso('6', TcodCategoria, TcodRecurso);
    end;
  finally
    qry.free;
  end;
end;

procedure TfrmMain.ExportarApuPortapapeles();
begin
  grid_ApusRecursos.CopyToClipboard(true);
end;

procedure ToggleRowSelection(Grid: TTMSFNCGrid; ARow: Integer);
var
  i: Integer;
begin
  if not grid.RowSelect[Arow] then
    exit;
  Grid.CellRange(0, ARow, Grid.ColumnCount - 1, ARow);
end;

// === Funciones de conversión seguras ===
function TfrmMain.IsDataRow(const ARow: Integer): Boolean;
begin
  Result :=
    (ARow >= grid_Recursos.FixedRows) and
    (ARow < grid_Recursos.RowCount - grid_Recursos.FixedFooterRows) and
    (grid_Recursos.Cells[1, ARow].Trim <> '') and
    (grid_Recursos.Cells[9, ARow].Trim <> '');
end;

procedure TfrmMain.Layout42Click(Sender: TObject);
var
  LForm: TfrmConfiguracion;
begin
  LForm := TfrmConfiguracion.Create(application);
  try
    LForm.ShowModal;
  finally
    LForm.free;
  end;
end;

procedure TfrmMain.Layout42MouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_Config, $FFF39200);
  label29.TextSettings.FontColor := $FFF39200;
end;

procedure TfrmMain.Layout42MouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_Config);
  label29.TextSettings.FontColor := $FFFFFFFF;
end;

function TfrmMain.HitTestFNCGridCell(const P: TPointF; out ACol, ARow: Integer):
  Boolean;
var
  X, Y, Acc, WorkH, WorkW: Single;
  r, c: Integer;
  FixedTopH, FixedBottomH, FixedLeftW, FixedRightW: Single;
  LastNormalRow, LastNormalCol: Integer;
begin
  Result := False;
  ACol := -1;
  ARow := -1;

  LastNormalRow := grid_Recursos.RowCount - 1 - grid_Recursos.FixedFooterRows;
  LastNormalCol := grid_Recursos.ColumnCount - 1 -
    grid_Recursos.FixedRightColumns;

  if (LastNormalRow < grid_Recursos.FixedRows) or (LastNormalCol <
    grid_Recursos.FixedColumns) then
    Exit;

  FixedTopH := 0;
  for r := 0 to grid_Recursos.FixedRows - 1 do
    FixedTopH := FixedTopH + grid_Recursos.RowHeights[r];

  FixedBottomH := 0;
  for r := grid_Recursos.RowCount - grid_Recursos.FixedFooterRows to
    grid_Recursos.RowCount - 1 do
    if r >= 0 then
      FixedBottomH := FixedBottomH + grid_Recursos.RowHeights[r];

  FixedLeftW := 0;
  for c := 0 to grid_Recursos.FixedColumns - 1 do
    FixedLeftW := FixedLeftW + grid_Recursos.ColumnWidths[c];

  FixedRightW := 0;
  for c := grid_Recursos.ColumnCount - grid_Recursos.FixedRightColumns to
    grid_Recursos.ColumnCount - 1 do
    if c >= 0 then
      FixedRightW := FixedRightW + grid_Recursos.ColumnWidths[c];

  WorkH := grid_Recursos.Height - FixedTopH - FixedBottomH;
  WorkW := grid_Recursos.Width - FixedLeftW - FixedRightW;
  if (WorkH <= 0) or (WorkW <= 0) then
    Exit;

  X := P.X;
  Y := P.Y;

  if (Y < FixedTopH) or (Y > (grid_Recursos.Height - FixedBottomH)) then
    Exit;
  if (X < FixedLeftW) or (X > (grid_Recursos.Width - FixedRightW)) then
    Exit;

  Y := Y - FixedTopH;
  X := X - FixedLeftW;

  Acc := 0;
  r := grid_Recursos.TopRow;
  while (r <= LastNormalRow) do
  begin
    Acc := Acc + grid_Recursos.RowHeights[r];
    if Y < Acc then
    begin
      ARow := r;
      Break;
    end;
    if Acc >= WorkH then
      Break;
    Inc(r);
  end;
  if ARow < 0 then
    Exit;

  Acc := 0;
  c := grid_Recursos.LeftCol;
  while (c <= LastNormalCol) do
  begin
    Acc := Acc + grid_Recursos.ColumnWidths[c];
    if X < Acc then
    begin
      ACol := c;
      Break;
    end;
    if Acc >= WorkW then
      Break;
    Inc(c);
  end;
  if ACol < 0 then
    Exit;

  Result := True;
end;

function SafeStrToInt(const S: string; const ADefault: Integer = 0): Integer;
begin
  if not TryStrToInt(S, Result) then
    Result := ADefault;
end;

function SafeSafeStrToFloat(const S: string;
  const ADefault: Double = 0): Double;
begin
  if not TryStrToFloat(S, Result) then
    Result := ADefault;
end;

// === Fin funciones de conversión seguras ===

// ===== Métodos de TfrmMain (ordenados por tipo y nombre) =====

function TfrmMain.catActiva(): Integer;
var
  entrar: Boolean;
begin
  Result := 0;
  entrar := True;
  if (rect_cat1EquiposHerramientas.Fill.Color = $FFE94E1B) and (entrar) then
    Result := 1;
  if (rect_cat2Materiales.Fill.Color = $FFE94E1B) and (entrar) then
    Result := 2;
  if (rect_cat3Transporte.Fill.Color = $FFE94E1B) and (entrar) then
    Result := 3;
  if (rect_cat4ManodeObra.Fill.Color = $FFE94E1B) and (entrar) then
    Result := 4;
  if (rect_cat5SeguridadIndustrial.Fill.Color = $FFE94E1B) and (entrar) then
    Result := 5;
  if (rect_cat6PreciosUnitarios.Fill.Color = $FFE94E1B) and (entrar) then
    Result := 6
end;

function TfrmMain.daCategoriaActivaRecursos(): Integer;
begin
  Result := 0;
  if tbc_PreciosUnitarios.ActiveTab = tab_PU_2Recursos then
  begin
    if rect_OPCRec1.Fill.Color = $FFE94E1B then
      Result := 1;
    if rect_OPCRec2.Fill.Color = $FFE94E1B then
      Result := 2;
    if rect_OPCRec3.Fill.Color = $FFE94E1B then
      Result := 3;
    if rect_OPCRec4.Fill.Color = $FFE94E1B then
      Result := 4;
    if rect_OPCRec5.Fill.Color = $FFE94E1B then
      Result := 5;
  end;
  if tbc_PreciosUnitarios.ActiveTab = tab_PU_1SubCategorias then
  begin
    if rect_cat1EquiposHerramientas.Fill.Color = $FFE94E1B then
    begin
      Result := 1;
    end;
    if rect_cat2Materiales.Fill.Color = $FFE94E1B then
    begin
      Result := 2;
    end;
    if rect_cat3Transporte.Fill.Color = $FFE94E1B then
    begin
      Result := 3;
    end;
    if rect_cat4ManodeObra.Fill.Color = $FFE94E1B then
    begin
      Result := 4;
    end;
    if rect_cat5SeguridadIndustrial.Fill.Color = $FFE94E1B then
    begin
      Result := 5;
    end;
    if rect_cat6PreciosUnitarios.Fill.Color = $FFE94E1B then
    begin
      Result := 6;
    end;
  end;
end;

function TfrmMain.daRespuestaDesencripta(Datos: string)
  : dat_respuestaFicheroImportacion;
var
  X: Integer;
begin
  Result.fichero := '';
  Result.claveSalsa := '';
  X := AnsiPos('&&', Datos);
  Result.fichero := Copy(Datos, 1, X - 1);
  Result.claveSalsa := Copy(Datos, X + 2, Length(Datos));
end;

function TfrmMain.GetItemAt(Point: TPointF; Tltv: TListView): TListViewItem;
var
  ItemIndex: Integer;
  ItemRect: TRectF;
begin
  Result := nil;
  for ItemIndex := 0 to Tltv.Items.Count - 1 do
  begin
    ItemRect := Tltv.GetItemRect(ItemIndex);
    if (Point.X >= ItemRect.Left) and (Point.X < ItemRect.Right) and
      (Point.Y >= ItemRect.Top) and (Point.Y < ItemRect.Bottom) then
    begin
      Result := Tltv.Items[ItemIndex];
      Break;
    end;
  end;
end;

procedure TfrmMain.abreMSProject(Datos: string);
var
  plantillaBase: string;
  ruta: string;
  comando: string;
  RutaPlantillaProyecto: string;
begin
  findMSProject();
  if not IsRunnig(MSProject) then
  begin
    if MSProject <> '' then
    begin
      ruta := ExtractFilePath(MSProject);
      plantillaBase := rutaApp + 'Plantillas\Cronograma de Trabajo\' +
        '001 - Exportacion Cronograma Trabajo - MS Project.zip';
      if DirectoryExists(rutaApp + 'MSproject') then
      begin
        deltree(rutaApp + 'MSproject');
        if DirectoryExists(rutaApp + 'MSProject') then
          RemoveDir(rutaApp + 'MSProject');
      end;
      CreateDir(rutaApp + 'MSProject');
      if FileExists(plantillaBase) then
      begin
        RutaPlantillaProyecto := descomprimeArchivoZIP(plantillaBase,
          rutaApp + 'MSProject');
        RutaPlantillaProyecto := desencriptafichero(RutaPlantillaProyecto);
        comando := '"' + MSProject + '"' + ' ' + '"' +
          RutaPlantillaProyecto + '"';
        ExecNewProcess(comando, False);
        Sleep(1000);
        comando := '"' + MSProject + '"' + ' ' + '"' + Datos + '"';
        ExecNewProcess(comando, False);
        deltree(rutaApp + 'MSProject');
      end;
    end
    else
    begin
      MuestraMensajeGiproy('Error',
        'Error 0013: MS Project no encontrado. Compruebe la instalación del software MS-Project.')
    end;
  end
  else
  begin
    MuestraMensajeGiproy('Advertencia',
      'MS Project en ejecucion. Por favor garde los cambios y cierre para proceder.');
  end;
end;

procedure TfrmMain.addusuarioColaborador(emailColaborador: string);
var
  nombreUsuarioColaborador: string;
  estadoInvitacion: string;
  SQLText1: string;
  qry: TUniQuery;
  nUsuariosActivos: Integer;
  entrar: Boolean;
  J: TJSONObject;
  Ok: Boolean;
begin
  entrar := False;
  // Modelo Negocio
  if (LowerCase(TUsuario) = 'estándar') or (LowerCase(TUsuario) = 'profesional')
    or (LowerCase(TUsuario) = 'empresarial') or
    (LowerCase(TUsuario) = 'administrador') then
    entrar := True
  else
  begin
    entrar := False;
    MuestraMensajeGiproy('Error',
      'Error 0014: Función no permitida en plan actual');
  end;

  if (LowerCase(TUsuario) = 'estándar') then
  begin
    nUsuariosActivos := CuentaUsuariosColaboradores;
    if nUsuariosActivos >= 3 then
    begin
      if comprobarModuloActivo(3) then
        entrar := True
      else
      begin
        entrar := False;
        MuestraMensajeGiproy('Error',
          'Error 0015: Limite de Usuarios Plan alcanzado o error de comprobación.');
      end;
    end;
  end;

  // Modelo Negocio
  if entrar then
  begin
    nombreUsuarioColaborador := '';
    J := nil;

    // === NUEVO: llamar al endpoint ExisteUsuarioServer.php vía uApiGiProy ===
    try
      Ok := ExisteUsuarioServerNombre(UrlExisteUsuarioServer,
        // URL del endpoint PHP
        GlobalAuthToken, // Token JWT actual
        LowerCase(Trim(emailColaborador)), nombreUsuarioColaborador, J);
    except
      on E: EApiException do
      begin
        MuestraMensajeGiproy('Error',
          Format('Error consultando usuario: %s (HTTP %d)',
          [E.Message, E.StatusCode]));
        Exit;
      end;
      on E: Exception do
      begin
        MuestraMensajeGiproy('Error', 'Error 0016 consultando usuario: ' +
          E.Message);
        Exit;
      end;
    end;
    if Assigned(J) then
      J.Free;

    if Ok and (nombreUsuarioColaborador <> '') then
    begin
      qry := TUniQuery.Create(nil);
      try
        SQLText1 := 'INSERT INTO colaboradores ' + '( ' + ' idUsuario ' +
          ',nombreColaborador ' + ',emailColaborador ' + ',estado ' +
          ',fechaHoraAlta ' + ') ' + 'VALUES ' + '( ' + ' :idUsuario ' +
          ',:nombreColaborador ' + ',:emailColaborador ' + ',:estadoUsuario ' +
          ',:fechaHoraAlta ' + ')';

        with qry do
        begin
          Connection := dmodule_1.con2;
          Close;
          SQL.Clear;
          SQL.Add(SQLText1);
          ParamByName('idUsuario').AsInteger := codigo_usuario;
          ParamByName('nombreColaborador').AsString := nombreUsuarioColaborador;
          ParamByName('emailColaborador').AsString :=
            LowerCase(Trim(emailColaborador));
          ParamByName('estadoUsuario').AsInteger := 1;
          ParamByName('fechaHoraAlta').AsDateTime := Now;
          Prepare;
          ExecSQL;

          // refrescos
          frmMain.tmrComunicacion.Enabled := False;
          frmMain.tmrComunicacion.Interval := 1;
          frmMain.tmrComunicacion.Enabled := True;
          Actualiza_UsuariosColaborador();
        end;
      finally
        qry.Free;
      end;
    end
    else
    begin
      if
        realizarPreguntaSiNo('Usuario no afiliado a GiProy, ¿desea enviarle una invitación por email?') <>
        mrOK then
        Exit;
      estadoInvitacion := enviar_invitacion_unirse_giproy
        (LowerCase(Trim(emailColaborador)));
      MuestraMensajeGiproy('Información', estadoInvitacion);
    end;
  end;
end;

procedure TfrmMain.AdicionaItem();
var
  categoriaActiva: Integer;
  LForm: TfrmNuevaCategoria;
begin
  // Categorias
  LForm := TfrmNuevaCategoria.Create(Application);
  try
    limpiaNuevaCategoria(LForm);
    LForm.lbl_banner1.Text := 'Nueva Subcategoría';
    LForm.lbl_banner2.Text := 'Creación de Nueva Subcategoría';
    categoriaActiva := daCategoriaActivaRecursos;
    LForm.lbl_Categoria.Text := IntToStr(categoriaActiva);
    LForm.lbl_funcion.Text := 'Adicionar';
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmMain.BorrarItemSubCategoria;
var
  codItem: string;
  categoriaActiva: Integer;
  trvw: TTMSFNCTreeView;
  subn: TTMSFNCTreeViewNode;
  SelectedNodes: TList<TTMSFNCTreeViewNode>;
  i: Integer;
begin
  categoriaActiva := catActiva;
  if categoriaActiva < 1 then
    Exit;

  // Asignar treeview según categoría
  case categoriaActiva of
    1:
      trvw := trvw_cat1EquiposHerramientas;
    2:
      trvw := trvw_cat2Materiales;
    3:
      trvw := trvw_cat3Transporte;
    4:
      trvw := trvw_cat4ManodeObra;
    5:
      trvw := trvw_cat5SeguridadIndustrial;
    6:
      trvw := trvw_cat6PreciosUnitarios;
  else
    Exit;
  end;

  // Crear lista de nodos seleccionados
  SelectedNodes := TList<TTMSFNCTreeViewNode>.Create;
  try
    // Recorrer todos los nodos
    for i := 0 to trvw.nodes[0].GetChildCount - 1 do
    begin
      subn := trvw.nodes[0].nodes[i];

      if trvw.IsNodeSelected(subn) then
        SelectedNodes.Add(subn);
    end;

    // Borrar los items seleccionados
    for i := 0 to SelectedNodes.Count - 1 do
    begin
      subn := SelectedNodes[i];
      codItem := quitaHTML(subn.Text[0]);
      try
        borraDBCategoria(codItem);
      except
        MuestraMensajeGiproy('Advertencia',
          'Subcategoria con Recursos. No se puede borrar.');
      end;
    end;
  finally
    SelectedNodes.Free;
  end;
end;

procedure TfrmMain.btn5Click(Sender: TObject);
begin
  exportaProject();
end;

procedure TfrmMain.btn_EjecucionGlobalClick(Sender: TObject);
var
  LForm: Tfrm_CronoDerivaciones;
begin
  LForm := Tfrm_CronoDerivaciones.Create(Application);
  try
    LForm.lbl_modo.Text := '0';
    LForm.lbl_TodoProyexto.Visible := True;
    LForm.lbl_cronoNPeriodos.Text := lbl_cronogramaNPeriodos.text;
    LForm.chkCustom.IsChecked := True;
    LForm.chkHomogenea.IsChecked := False;
    cargarDatosDerivacion(LForm);
    if LForm.grid_DefDerivacion.cells[0, 0] <> '' then
    begin
      if (LForm.chkHomogenea.IsChecked) or (LForm.chkCustom.IsChecked) then
      begin
        LForm.CalculaCronogramaEjecucionObras();
      end;
    end;
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

function TfrmMain.CargarRucDesdeCertificadoPdf: Boolean;
var
  Dlg: TOpenDialog;
  PdfFile: string;
  JsonStr, Err: string;
  Obj: TJSONObject;
  V: TJSONValue;
begin
  Result := False;

  Dlg := TOpenDialog.Create(Self);
  try
    Dlg.Filter := 'Certificado RUC (*.pdf)|*.pdf|Todos los archivos (*.*)|*.*';
    Dlg.Options := Dlg.Options + [TOpenOption.ofFileMustExist];
    if not Dlg.Execute then
      Exit;
    PdfFile := Dlg.FileName;
  finally
    Dlg.Free;
  end;

  // Llamada a la función principal de uPdfTool
  if not Pdf2Json(PdfFile, JsonStr, Err) then
  begin
    if Err = '' then
      Err := 'No se pudo leer el certificado RUC.';
    MuestraMensajeGiproy('Error', 'Error 0017: ' + Err);
    Exit;
  end;

  // Aunque Pdf2Json devuelva True, puede haber aviso de RUC vacío
  if Err <> '' then
    MuestraMensajeGiproy('Error', 'Error 0018: ' + Err);

  Obj := TJSONObject(TJSONObject.ParseJSONValue(JsonStr));
  try
    try
      if Obj = nil then
        raise Exception.Create('El JSON devuelto por Pdf2Json no es válido.');

      // ---------------------- RUC ----------------------
      V := Obj.Values['ruc'];
      if (V <> nil) and (V.Value <> '') then
        edt_RIdFiscal.Text := V.Value
      else
      begin
        MuestraMensajeGiproy('Error', 'Error 0019: ' +
          'No se encontró el número de RUC en el certificado.');
        Exit;
      end;

      // ---------------------- Nombre / razón social ----------------------
      // En el JSON viene como "apellidos_nombres"
      V := Obj.Values['apellidos_nombres'];
      if V <> nil then
      begin
        // Aquí podrías separar nombre/apellidos como hace RellenaDatosRegistro,
        // pero para empezar usamos la cadena tal cual como empresa/razón social.
        edt_REmpresa.Text := V.Value;
        // Si quieres, puedes dejar los campos de nombre/apellidos vacíos
        // y que se rellenen luego con CompruebaRuc, o aplicar tu propia separación.
        // edt_RNombre.Text := ...;
        // edt_RApellidos.Text := ...;
      end;

      // ---------------------- Provincia / Cantón ----------------------
      V := Obj.Values['provincia'];
      if V <> nil then
        edt_RProvincia.Text := V.Value;

      V := Obj.Values['canton'];
      if V <> nil then
        edt_RCiudad.Text := V.Value;

      // ---------------------- Email / Teléfono ----------------------
      V := Obj.Values['email'];
      if V <> nil then
        edt_REmail.Text := V.Value;

      V := Obj.Values['telefono'];
      if V <> nil then
        edt_RMovil.Text := V.Value;

      // Si quieres usar también direccion, estado, regimen, tipo, etc.:
      // V := Obj.Values['direccion'];
      // if V <> nil then
      // edt_RDireccion.Text := V.Value;  // si tienes este campo

      Result := True;
    except
      on E: Exception do
      begin
        MuestraMensajeGiproy('Error',
          'Error 0020: Procesando el certificado RUC: ' + E.Message);
        Result := False;
      end;
    end;
  finally
    Obj.Free;
  end;
end;

procedure TfrmMain.cbbEstadoAPUSChange(Sender: TObject);
begin
  AplicarFiltrosAPUS;
end;

procedure TfrmMain.cbb_cronoTipoPeriodoChange(Sender: TObject);
var
  tmpstr: string;
begin
  if tbcPresupuestos.ActiveTab <> tab_6PresupuestoCronogramas then
    exit;

  tmpstr := cbb_cronoTipoPeriodo.Items[cbb_cronoTipoPeriodo.ItemIndex] + ',' +
    lbl_cronogramaNPeriodos.Text;
  if tmpstr <> cancelarDerivacion then
  begin
    calculaPlazosCronograma;
    borraDBDatosDervicacion;
  end;
end;

procedure TfrmMain.cbb_TProyectosPrespuestoChange(Sender: TObject);
var
  codigo: string;
  idx: Integer;
begin
  if not Assigned(cbb_TProyectosPrespuesto) then
    Exit;

  idx := cbb_TProyectosPrespuesto.ItemIndex;

  if (idx < 0) or (idx > High(listado_tipoProyectos)) then
    Exit;

  codigo := listado_tipoProyectos[idx].codigo;

  if codigo <> '' then
    cargaCategoriaProyectos(codigo);
end;

function TfrmMain.CompruebaAceptacionPoliticasyPublicidad(): Boolean;
begin
  Result := False;
  if (edt_RIdFiscal.Text.Trim <> '') and (edt_RNombre.Text.Trim <> '') and
    (edt_RApellidos.Text.Trim <> '') and (edt_RProfesion.Text.Trim <> '') and
    (edt_RCiudad.Text.Trim <> '') and (edt_RProvincia.Text.Trim <> '') and
    (edt_REmail.Text.Trim <> '') and (edt_RPassword.Text.Trim <> '') and
    (chk_ProteccionDatos.IsChecked) and (chk_AutorizacionGiproy.IsChecked) and
    (chk_AutorizacionPublicidad.IsChecked) then
    Result := True;
end;

procedure TfrmMain.chk_AutorizacionGiproyChange(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.chk_AutorizacionPublicidadChange(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.chk_ProteccionDatosChange(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.chkRecursosSoloFaltantesChange(Sender: TObject);
begin
  if frmMain.rct_desgEquiposHerramientas.Fill.Color = $FFE94E1B then
  begin
    verRecursoDesagregacion(1);
  end;
  if frmMain.rct_desgMateriales.Fill.Color = $FFE94E1B then
  begin
    verRecursoDesagregacion(2);
  end;
  if frmMain.rct_desgTransporte.Fill.Color = $FFE94E1B then
  begin
    verRecursoDesagregacion(3);
  end;
  if frmMain.rct_desgManoObra.Fill.Color = $FFE94E1B then
  begin
    verRecursoDesagregacion(4);
  end;

end;

procedure TfrmMain.ClonarItem(opcion: Integer);
var
  subn, subm: TTMSFNCTreeViewNode;
  categoriaActiva: Integer;
  cnt: Integer;
  subcategoria: string;
  LForm: TfrmNuevaCategoria;
begin
  LForm := TfrmNuevaCategoria.Create(Application);
  try
    case opcion of
      1:
        begin
          // Categorias
          categoriaActiva := catActiva;
          LForm.lbl_Categoria.Text := IntToStr(categoriaActiva);
          LForm.lbl_funcion.Text := 'Clonar';
          cnt := 0;
          case categoriaActiva of
            1:
              begin
                subn := trvw_cat1EquiposHerramientas.SelectedNode;
                if Assigned(subn) then
                begin
                  subm := trvw_cat1EquiposHerramientas.nodes[0];
                  subcategoria := quitaHTML(subn.Text[1]);
                  while Assigned(subm) do
                  begin
                    if quitaHTML(subm.Text[1]) = subcategoria then
                      Inc(cnt);
                    subm := subm.GetNext;
                  end;
                end;
              end;
            2:
              begin
                subn := trvw_cat2Materiales.SelectedNode;
                if Assigned(subn) then
                begin
                  subm := trvw_cat2Materiales.nodes[0];
                  subcategoria := quitaHTML(subn.Text[1]);
                  while Assigned(subm) do
                  begin
                    if quitaHTML(subm.Text[1]) = subcategoria then
                      Inc(cnt);
                    subm := subm.GetNext;
                  end;
                end;
              end;
            3:
              begin
                subn := trvw_cat3Transporte.SelectedNode;
                if Assigned(subn) then
                begin
                  subm := trvw_cat3Transporte.nodes[0];
                  subcategoria := quitaHTML(subn.Text[1]);
                  while Assigned(subm) do
                  begin
                    if quitaHTML(subm.Text[1]) = subcategoria then
                      Inc(cnt);
                    subm := subm.GetNext;
                  end;
                end;
              end;
            4:
              begin
                subn := trvw_cat4ManodeObra.SelectedNode;
                if Assigned(subn) then
                begin
                  subm := trvw_cat4ManodeObra.nodes[0];
                  subcategoria := quitaHTML(subn.Text[1]);
                  while Assigned(subm) do
                  begin
                    if quitaHTML(subm.Text[1]) = subcategoria then
                      Inc(cnt);
                    subm := subm.GetNext;
                  end;
                end;
              end;
            5:
              begin
                subn := trvw_cat5SeguridadIndustrial.SelectedNode;
                if Assigned(subn) then
                begin
                  subm := trvw_cat5SeguridadIndustrial.nodes[0];
                  subcategoria := quitaHTML(subn.Text[1]);
                  while Assigned(subm) do
                  begin
                    if quitaHTML(subm.Text[1]) = subcategoria then
                      Inc(cnt);
                    subm := subm.GetNext;
                  end;
                end;
              end;
            6:
              begin
                subn := trvw_cat6PreciosUnitarios.SelectedNode;
                if Assigned(subn) then
                begin
                  subm := trvw_cat6PreciosUnitarios.nodes[0];
                  subcategoria := quitaHTML(subn.Text[1]);
                  while Assigned(subm) do
                  begin
                    if quitaHTML(subm.Text[1]) = subcategoria then
                      Inc(cnt);
                    subm := subm.GetNext;
                  end;
                end;
              end;
          end;
          if subn <> nil then
          begin

            LForm.lbl_banner1.Text := 'Duplicar Categoria';
            LForm.lbl_banner2.Text := 'Duplicar Categoria';
            LForm.lbl_Codigo.Text := quitaHTML(LForm.lbl_Codigo.Text);
            LForm.edt_descripcion.Text := quitaHTML(subn.Text[1]) + ' ' +
              ponerCerosInicio(IntToStr(cnt), 2);
            LForm.edt_CodAdicional.Text := quitaHTML(subn.Text[2]);
            LForm.mmo_Observaciones.lines.Text := quitaHTML(subn.Text[3]);
            LForm.ShowModal;
          end;
        end;
    end;
  finally
    LForm.Free;
  end;
end;

procedure TfrmMain.dedt_PresentacionPresupuestoClosePicker(Sender: TObject);
var
  tmpstr: string;
  FFin: Tdate;
begin
  try
    FFin := IncDay(dedt_PresentacionPresupuesto.Date,
      SafeStrToInt(edt_PlazoEjecucionPresupuesto.Text));
    lbl_PresupuestoFinalizacion.Text := FormatDateTime('dd/mm/yyyy', FFin);
  except
    lbl_PresupuestoFinalizacion.Text := '';
  end;
end;

procedure TfrmMain.DGrid_ColaboradoresCellClick(Sender: TObject;
  AColumn, ARow: Integer);
begin
  idUsuarioReceptor := StrToIntDef(DGrid_Colaboradores.cells[0,
    ARow].ToString, -1);
  nombreUsuarioReceptor := DGrid_Colaboradores.cells[2, ARow].ToString;
end;

procedure TfrmMain.DGrid_ComunicacionesCellDblClick(Sender: TObject;
  AColumn, ARow: Integer);
var
  mensaje: string;
  tipoMensaje: Integer;
  respuestaDescripta: dat_respuestaFicheroImportacion;
  ficheroDatos: string;
  X: Integer;
  LForm: TfChat;
begin

  tipoMensaje := dmodule_1.QuComunicacionidTipoComunicacion.AsInteger;
  case tipoMensaje of
    1:
      begin
        // Chat entre Usuarios
        LForm := TfChat.Create(Application);
        try
          LForm.idUsuarioReceptor :=
            dmodule_1.QuComunicacionidUsuarioEmisor.AsInteger;
          LForm.CargarChat();
          LForm.ShowModal;
        finally
          LForm.Free;
        end;
      end;
    2:
      begin
        // Archivo APU (3 dias para descarga)
      end;
    3:
      begin
        // Proyecto (3 dias para descarga)
        if realizarPreguntaSiNo('¿Quieres importar el Proyecto ?') <> mrOk then
          Exit;
        mensaje := dmodule_1.QuComunicaciondatoscomunicacion.AsString;
        mensaje := DesencriptaEx(mensaje, codSalsaExt);
        respuestaDescripta := daRespuestaDesencripta(mensaje);
        ficheroDatos := DescargaFTP(respuestaDescripta.fichero);
        X := AnsiPos('error', LowerCase(ficheroDatos));
        if X < 1 then
        begin
          // Correcto
          mensaje := importarDBG(ficheroDatos,
            respuestaDescripta.claveSalsa);
          X := AnsiPos('error', LowerCase(mensaje));
          if X < 1 then
          begin
            MuestraMensajeGiproy('Error', 'Error 0022: ' + mensaje);
          end
          else
          begin
            MuestraMensajeGiproy('Error',
              'Error 0021: Error de importacion.');
          end;
        end
        else
        begin
          MuestraMensajeGiproy('Error',
            'Error 0023: Error de importacion.');
        end;
      end;
    4:
      begin
        // Mensaje de GiProy
      end;
    7:
      begin
        // Base (3 dias para descarga)
        if realizarPreguntaSiNo('¿Quieres importar la base de datos?') <> mrOK
          then
          Exit;

        mensaje := dmodule_1.QuComunicaciondatoscomunicacion.AsString;
        mensaje := DesencriptaEx(mensaje, codSalsaExt);
        respuestaDescripta := daRespuestaDesencripta(mensaje);
        ficheroDatos := DescargaFTP(respuestaDescripta.fichero);
        X := AnsiPos('error', LowerCase(ficheroDatos));
        if X < 1 then
        begin
          // Correcto
          mensaje := importarDBG(ficheroDatos,
            respuestaDescripta.claveSalsa);
          X := AnsiPos('error', LowerCase(mensaje));
          if X < 1 then
          begin
            MuestraMensajeGiproy('Error', 'Error 0024: ' + mensaje);
          end
          else
          begin
            MuestraMensajeGiproy('Error',
              'Error 0025: Error de importacion.');
          end;
        end
        else
        begin
          MuestraMensajeGiproy('Error',
            'Error 0026: Error de importacion.');
        end;
      end;
  end;
end;

procedure TfrmMain.EditarItemSubCategoria;

  function SafeNodeText(ANode: TTMSFNCTreeViewNode; ACol: Integer): string;
  begin
    Result := '';
    if not Assigned(ANode) then
      Exit;

    try
      Result := ANode.Text[ACol];
    except
      // Evita que un índice inválido o un nodo inconsistente tumbe la app
      Result := '';
    end;
  end;

var
  LForm: TfrmNuevaCategoria;
  subn: TTMSFNCTreeViewNode;
  MR: TModalResult;
begin
  subn := nil;

  case catActiva of
    1:
      subn := trvw_cat1EquiposHerramientas.SelectedNode;
    2:
      subn := trvw_cat2Materiales.SelectedNode;
    3:
      subn := trvw_cat3Transporte.SelectedNode;
    4:
      subn := trvw_cat4ManodeObra.SelectedNode;
    5:
      subn := trvw_cat5SeguridadIndustrial.SelectedNode;
    6:
      subn := trvw_cat6PreciosUnitarios.SelectedNode;
  else
    Exit; // catActiva fuera de rango
  end;

  if not Assigned(subn) then
    Exit;

  LForm := TfrmNuevaCategoria.Create(nil);
  try
    LForm.lbl_Categoria.Text := IntToStr(catActiva);
    LForm.lbl_funcion.Text := 'Editar';

    LForm.lbl_banner1.Text := 'Editar Categoria';
    LForm.lbl_banner2.Text := 'Edición de Categoria';

    LForm.lbl_Codigo.Text := quitaHTML(SafeNodeText(subn, 0));
    LForm.edt_descripcion.Text := quitaHTML(SafeNodeText(subn, 1));
    LForm.edt_CodAdicional.Text := quitaHTML(SafeNodeText(subn, 2));
    LForm.mmo_Observaciones.lines.Text := quitaHTML(SafeNodeText(subn, 3));

    MR := LForm.ShowModal;
  finally
    LForm.Free;
  end;

  // Refrescar fuera del cierre del modal (y fuera del stack de destrucción)
  if MR = mrOk then
  begin
    TThread.Queue(nil,
      procedure
      begin
        DM1.RefreshCategorias;
        frmMain.rellenaCategoriaRecursos();
      end);
  end;
end;

procedure TfrmMain.edt_BuscarRecursosCategoriaChangeTracking(Sender: TObject);
var
  filtro: string;
begin
  filtro := edt_BuscarRecursosCategoria.Text.Trim;
  lvOPCRec1.Items.Filter := nil;
  lvOPCRec2.Items.Filter := nil;
  lvOPCRec3.Items.Filter := nil;
  lvOPCRec4.Items.Filter := nil;
  lvOPCRec5.Items.Filter := nil;
  if edt_BuscarRecursosCategoria.Text <> '' then
  begin
    lvOPCRec1.ItemIndex := -1;
    lvOPCRec1.Items.Filter := function(X: string): Boolean
    begin
      Result := (filtro = EmptyStr) or LowerCase(X).Contains(filtro);
    end;
    lvOPCRec2.ItemIndex := -1;
    lvOPCRec2.Items.Filter := function(X: string): Boolean
    begin
      Result := (filtro = EmptyStr) or LowerCase(X).Contains(filtro);
    end;
    lvOPCRec3.ItemIndex := -1;
    lvOPCRec3.Items.Filter := function(X: string): Boolean
    begin
      Result := (filtro = EmptyStr) or LowerCase(X).Contains(filtro);
    end;
    lvOPCRec4.ItemIndex := -1;
    lvOPCRec4.Items.Filter := function(X: string): Boolean
    begin
      Result := (filtro = EmptyStr) or LowerCase(X).Contains(filtro);
    end;
    lvOPCRec5.ItemIndex := -1;
    lvOPCRec5.Items.Filter := function(X: string): Boolean
    begin
      Result := (filtro = EmptyStr) or LowerCase(X).Contains(filtro);
    end;
  end;
end;

procedure TfrmMain.edt_descripcionPresupuestoChange(Sender: TObject);
begin
  if tbcSubMenu2.ActiveTab = tab_Sub2_2Presupuestos then
  begin
    if edt_descripcionPresupuesto.Text <> '' then
      lbl_BaseActiva.Text := 'Proyecto: ' + edt_descripcionPresupuesto.Text;
  end;
end;

procedure TfrmMain.edt_DiasSemanasKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
var
  X: Integer;
begin
  try
    X := SafeStrToInt(edt_DiasSemanas.Text);
    if X > 7 then
    begin
      X := 5;
      edt_DiasSemanas.Text := '5';
    end;
    calculaTiempoAPUS();
  except
  end;
end;

procedure TfrmMain.edt_DiasSemanasMouseLeave(Sender: TObject);
var
  X: Integer;
begin
  try
    X := SafeStrToInt(edt_DiasSemanas.Text);
    if X > 7 then
    begin
      X := 5;
      edt_DiasSemanas.Text := '5';
    end;
    calculaTiempoAPUS();
  except
  end;
end;

procedure TfrmMain.edt_EDOStakesFiltroChangeTracking(Sender: TObject);
var
  fltr: TTMSFNCGridFilterData;
begin
  grid_EDOStakes.Filter.Clear;
  grid_EDOStakes.UnHideRowsAll;
  grid_EDOStakes.RemoveFilters;
  if edt_EDOStakesFiltro.Text <> '' then
  begin
    fltr := grid_EDOStakes.Filter.Add;
    fltr.Column := 2;
    fltr.CaseSensitive := False;
    fltr.Condition := '*' + LowerCase(edt_EDOStakesFiltro.Text) + '*';
    ;
    grid_EDOStakes.ApplyFilter;
  end;
end;

procedure TfrmMain.edt_EDTBuscarChangeTracking(Sender: TObject);
var
  nodoEncontrado: TTMSFNCTreeViewNode;
  encontrado: Boolean;
  cadenaBusqueda: string;
  textonodo: string;
  X: Integer;
begin
  nodoEncontrado := Trvw_EDT.nodes[0];
  encontrado := False;
  cadenaBusqueda := edt_EDTBuscar.Text;
  while Assigned(nodoEncontrado) and (not encontrado) and
    (cadenaBusqueda <> '') do
  begin
    nodoEncontrado := nodoEncontrado.GetNext;
    if Assigned(nodoEncontrado) then
    begin
      textonodo := nodoEncontrado.Text[1];
      textonodo := LowerCase(textonodo);
      X := AnsiPos(cadenaBusqueda, textonodo);
      if X > 0 then
      begin
        encontrado := True;
        Trvw_EDT.SelectNode(nodoEncontrado);
      end;
    end;
  end;
end;

procedure TfrmMain.edt_FiltroAPUSChangeTracking(Sender: TObject);
var
  codSubCategoriaApu: Integer;
begin
  codSubCategoriaApu := StrToIntDef(lbl_FiltroSubCategoriaID.Text, -1);
  DMPresupuesto.filtrarAPUS_Categoria(edt_FiltroAPUS.Text, codSubCategoriaApu);
end;

procedure TfrmMain.edt_filtroCPCChangeTracking(Sender: TObject);
var
  tmpstr: string;
  fltr: TTMSFNCGridFilterData;
begin
  tmpstr := edt_filtroCPC.Text;
  if tmpstr = '' then
    rct_edtFiltroCPCClear.Visible := False
  else
    rct_edtFiltroCPCClear.Visible := True;
  dmodule_1.untbl1.Filtered := False;
  case cbb_campoCPC.ItemIndex of
    0:
      begin
        dmodule_1.untbl1.Filter := 'descripcion' + ' LIKE ' +
          QuotedStr('%' + tmpstr + '%');
        dmodule_1.untbl1.Filtered := True;
      end;
    1:
      begin
        dmodule_1.untbl1.Filter := 'CodCPC' + ' LIKE ' +
          QuotedStr('%' + tmpstr + '%');
        dmodule_1.untbl1.Filtered := True;
      end;
    2:
      begin
        dmodule_1.untbl1.Filter := 'tipo' + ' LIKE ' +
          QuotedStr('%' + tmpstr + '%');
        dmodule_1.untbl1.Filtered := True;
      end;
  end;
end;

procedure TfrmMain.edt_FiltroListadoApusChangeTracking(Sender: TObject);
var
  filtro: string;
begin
  AplicarFiltrosAPUS;
end;

procedure TfrmMain.AplicarFiltrosAPUS;
var
  filtroTexto: string;
  rOut, i, c: Integer;
  cols: TArray<string>;
  estado: Integer;
  esPendiente: Boolean;
  matchTexto: Boolean;

  function ContainsTextCI(const S, Sub: string): Boolean;
  begin
    Result := (Sub = '') or (Pos(LowerCase(Sub), LowerCase(S)) > 0);
  end;

begin
  if tbc_PreciosUnitarios.ActiveTab <> tab_PU_3APUs then
    Exit;

  filtroTexto := Trim(edt_FiltroListadoApus.Text);
  estado := cbbEstadoAPUS.ItemIndex; // 0 todos, 1 pendientes, 2 completados

  grid_APUSRecursos.BeginUpdate;
  try
    // reset grid a header + 1
    grid_APUSRecursos.RowCount := 2;
    rOut := 1;

    for i := 0 to FApusCache.Count - 1 do
    begin
      cols := FApusCache[i].Split([#9]);

      // seguridad
      if Length(cols) < 11 then
        Continue;

      // estado por col 10
      esPendiente := Trim(cols[10]) = '1';

      case estado of
        1: if not esPendiente then
            Continue; // pendientes
        2: if esPendiente then
            Continue; // completados
      end;

      // texto: buscar en col 1 y 2 (código y descripción)
      if Length(filtroTexto) >= 3 then
      begin
        matchTexto :=
          ContainsTextCI(cols[1], filtroTexto) or
          ContainsTextCI(cols[2], filtroTexto);

        if not matchTexto then
          Continue;
      end;

      // añadir fila
      if grid_APUSRecursos.RowCount <= rOut then
        grid_APUSRecursos.RowCount := rOut + 1;

      for c := 0 to 10 do
        grid_APUSRecursos.Cells[c, rOut] := cols[c];

      Inc(rOut);
    end;

    grid_APUSRecursos.RowCount := rOut;

    // ocultar cols internas
    grid_APUSRecursos.Columns[8].Width := 0;
    grid_APUSRecursos.Columns[9].Width := 0;
    grid_APUSRecursos.Columns[10].Width := 0;

  finally
    grid_APUSRecursos.EndUpdate;
  end;
end;

procedure TfrmMain.CachearAPUSGrid;
var
  r, c: Integer;
  line: string;
begin
  FApusCache.Clear;

  // asumo fila 0 es header; datos desde 1
  for r := 1 to grid_APUSRecursos.RowCount - 1 do
  begin
    // serializa columnas que te interesan (0..10)
    line := '';
    for c := 0 to 10 do
    begin
      if c > 0 then
        line := line + #9; // TAB separador
      line := line + grid_APUSRecursos.Cells[c, r];
    end;
    FApusCache.Add(line);
  end;
end;

procedure TfrmMain.edt_filtroLVApusCategoriaChangeTracking(Sender: TObject);
var
  filtro: string;
begin
  if tbc_PreciosUnitarios.ActiveTab = tab_PU_3APUs then
  begin
    rellenaAPUSCategoria(ordenacionlistadoCategoiraApus);
  end;
end;

procedure TfrmMain.edt_FiltroRecursosChangeTracking(Sender: TObject);
var
  filtro: string;
  f1, f2, f3: TTMSFNCGridFilterData;
begin
  filtro := edt_FiltroRecursos.Text;
  grid_Recursos.RemoveFilters;
  if filtro <> '' then
  begin
    f1 := grid_Recursos.Filter.Add;

    f1.CaseSensitive := False;
    f1.Column := 1;
    f1.Condition := '*' + filtro + '*';

    f2 := grid_Recursos.Filter.Add;
    f2.CaseSensitive := False;
    f2.Column := 2;
    f2.Condition := '*' + filtro + '*';
    f2.Operation := TTMSFNCGridFilterOperation.foOR;

    f3 := grid_Recursos.Filter.Add;
    f3.CaseSensitive := False;
    f3.Column := 3;
    f3.Condition := '*' + filtro + '*';
    f3.Operation := TTMSFNCGridFilterOperation.foOR;

    grid_Recursos.ApplyFilter;
  end;
end;

procedure TfrmMain.edt_FiltroStokeDisponiblesChangeTracking(Sender: TObject);
begin
  with edt_FiltroStokeDisponibles do
  begin
    if Text.Trim = '' then
      populaStakesDisponibles('')
    else if Length(Text.Trim) > 3 then
      populaStakesDisponibles(Text.Trim);
  end;
end;

procedure TfrmMain.edt_FiltroSubCategoriasChangeTracking(Sender: TObject);
var
  ARow: Integer;
  cadenaFiltrado: string;
begin
  cadenaFiltrado := edt_FiltroSubCategorias.Text;
  if cadenaFiltrado = '' then
  begin
    DMPresupuesto.filtrarNombreSubCategoria(-1, cadenaFiltrado);
    lbl_FiltroSubCategoriaID.Text := '-1';
  end
  else
  begin
    ARow := frmMain.grid_PresupuestosSubCategoria.Selection.StartRow;
    with DMPresupuesto.dsSubCategorias.DataSet do
    begin
      DisableControls;
      First;
      MoveBy(ARow - 1);
      EnableControls;
    end;
    DMPresupuesto.filtrarNombreSubCategoria
      (DMPresupuesto.QSubCategoriasciu.AsInteger, cadenaFiltrado);
  end;
  edt_FiltroAPUS.Text := '';
end;

procedure TfrmMain.edt_HoraInicioJornadaChangeTracking(Sender: TObject);
var
  Numero: string;
  tmpHora: TTime;
begin
  Numero := edt_HoraInicioJornada.Text;
  Numero := Numero + ':00';
  try
    tmpHora := StrToTimeDef(Numero, strtotime('07:00:00'));
  except
    tmpHora := strtotime('07:00:00');
  end;
  edt_HoraInicioJornada.Text := FormatDateTime('hh:nn', tmpHora);
  calculaTiempoAPUS();
end;

procedure TfrmMain.edt_HorasJornadaChangeTracking(Sender: TObject);
var
  Numero: string;
begin
  Numero := edt_HorasJornada.Text;
  try
    if (SafeStrToInt(Numero) > 24) or (SafeStrToInt(Numero) < 1) then
      edt_HorasJornada.Text := '8';
  except
    edt_HorasJornada.Text := '8';
  end;
  calculaTiempoAPUS();
end;

procedure TfrmMain.edt_LatitudKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
var
  Latitud, Longitud: string;
begin
  if Key = VK_RETURN then
  begin
    Latitud := edt_Latitud.Text.Trim;
    Longitud := edt_longitud.Text.Trim;
    posicionaCoordGPS(Latitud, Longitud);
  end;
end;

procedure TfrmMain.edt_longitudKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
var
  Latitud, Longitud: string;
begin
  if Key = VK_RETURN then
  begin
    Latitud := edt_Latitud.Text.Trim;
    Longitud := edt_longitud.Text.Trim;
    posicionaCoordGPS(Latitud, Longitud);
  end;
end;

procedure TfrmMain.edt_NPresupuestoPrecioReferenciaChangeTracking
  (Sender: TObject);
begin
  DMPresupuesto.calculaTotal;
end;

procedure TfrmMain.edt_PlazoEjecucionPresupuestoChangeTracking(Sender: TObject);
var
  tmpstr: string;
  FFin: Tdate;
begin
  try
    FFin := IncDay(dedt_PresentacionPresupuesto.Date,
      SafeStrToInt(edt_PlazoEjecucionPresupuesto.Text));
    lbl_PresupuestoFinalizacion.Text := FormatDateTime('dd/mm/yyyy', FFin);
  except
    lbl_PresupuestoFinalizacion.Text := '';
  end;
end;

procedure TfrmMain.edt_porcentajeIVANuevoPresupuestoExit(Sender: TObject);
begin
  with DMPresupuesto.unqry_ActualizarIVA do
  begin
    Close;
    ParamByName('iCodBase').AsString := base_activa.codBase;
    ParamByName('icodPresupuesto').AsString := codProyecto;
    ParamByName('irevision').AsString := revision;
    ParamByName('PorcentajeIVA').AsFloat :=
      StrToFloatDef(decimal_correcto(frmMain.edt_porcentajeIVANuevoPresupuesto.
      Text), 15);
    Execute;
  end;

  DMPresupuesto.calculaTotal;
end;

procedure TfrmMain.edt_porcentajeIVANuevoPresupuestoKeyUp(Sender: TObject;
  var Key: Word; var KeyChar: WideChar; Shift: TShiftState);
var
  valor: Double;
begin
  if Key = VK_RETURN then
  begin
    with DMPresupuesto.unqry_ActualizarIVA do
    begin
      Close;
      ParamByName('iCodBase').AsString := base_activa.codBase;
      ParamByName('icodPresupuesto').AsString := codProyecto;
      ParamByName('irevision').AsString := revision;
      ParamByName('PorcentajeIVA').AsFloat :=
        StrToFloatDef
        (decimal_correcto(frmMain.edt_porcentajeIVANuevoPresupuesto.Text), 15);
      Execute;
    end;
    DMPresupuesto.calculaTotal;
  end;
end;

procedure TfrmMain.edt_RAliasKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_RETURN then
    edt_RNacionalidad.SetFocus;
end;

procedure TfrmMain.edt_RApellidosChangeTracking(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RApellidosEnter(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RApellidosKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
begin
  if Key = VK_RETURN then
    edt_RAlias.SetFocus;
end;

procedure TfrmMain.edt_RCiudadChangeTracking(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RCiudadEnter(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RCiudadKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_RETURN then
    edt_RProvincia.SetFocus;
end;

procedure TfrmMain.edt_REmailChangeTracking(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_REmailEnter(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_REmailKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_RETURN then
    edt_RPassword.SetFocus;
end;

procedure TfrmMain.edt_REmpresaKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_RETURN then
    edt_RProfesion.SetFocus;
end;

procedure TfrmMain.edt_RIdFiscalExit(Sender: TObject);
begin
  CheckRucIfNeeded;
end;

procedure TfrmMain.edt_RIdFiscalKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
const
  REQUIRED_LENGTH = 13;
begin
  if (Now - FLastRucCheckTime) * 86400000 < RUC_CHECK_DELAY_MS then
    Exit;
  var
  CleanText := edt_RIdFiscal.Text.Trim;
  var
  TextLength := Length(CleanText);
  if ((Key = vkReturn) or (TextLength = REQUIRED_LENGTH)) and
    (TextLength = REQUIRED_LENGTH) then
  begin
    FLastRucCheckTime := Now;
    CheckRucIfNeeded;
    Key := 0;
  end;
end;

procedure TfrmMain.edt_RMovilKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_RETURN then
    edt_REmail.SetFocus;
end;

procedure TfrmMain.edt_RNacionalidadKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_RETURN then
    edt_REmpresa.SetFocus;
end;

procedure TfrmMain.edt_RNombreChangeTracking(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RNombreEnter(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RNombreKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
begin
  if Key = VK_RETURN then
    edt_RApellidos.SetFocus;
end;

procedure TfrmMain.edt_RPasswordChangeTracking(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RPasswordEnter(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RPasswordKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_RETURN then
    rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RProfesionChangeTracking(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RProfesionEnter(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RProfesionKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_RETURN then
    edt_RCiudad.SetFocus;
end;

procedure TfrmMain.edt_RProvinciaChangeTracking(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RProvinciaEnter(Sender: TObject);
begin
  rct_RegistrarUsuario.Enabled := CompruebaAceptacionPoliticasyPublicidad;
end;

procedure TfrmMain.edt_RProvinciaKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_RETURN then
    edt_RMovil.SetFocus;
end;

procedure TfrmMain.CheckRucIfNeeded;
var
  NewRuc: string;
  Ok: Boolean;
  Err: string;
begin
  // evita reentradas (por OnExit, cambios de foco, etc.)
  if FCheckingRuc then
    Exit;

  NewRuc := Trim(edt_RIdFiscal.Text);

  // si está vacío → aquí NO hacemos nada especial con PDF,
  // simplemente exigimos que ponga un RUC primero.
  if NewRuc = '' then
    Exit;

  // si es igual al previamente comprobado → no repetir
  if SameText(NewRuc, FLastCheckedRuc) then
    Exit;

  FCheckingRuc := True;
  try
    // 1) PRIMERO intentamos el webservice
    Ok := CompruebaRuc(Err);

    // guardamos el último RUC consultado
    FLastCheckedRuc := NewRuc;

    if Ok then
    begin
      // webservice respondió correctamente → nada más que hacer
      Exit;
    end;

    // 2) SI FALLA EL WEBSERVICE → preguntar si quiere usar certificado PDF
    if not PreguntarSubirCertificadoRuc(Err) then
    begin
      // Usuario dijo NO → limpiar RUC y seguir exigiendo uno válido
      edt_RIdFiscal.Text := '';
      FLastCheckedRuc := '';
      MuestraMensajeGiproy('Advertencia',
        'Por favor introduzca un número de RUC válido.');
      edt_RIdFiscal.SetFocus;
      Exit;
    end;

    // 3) Usuario dijo SÍ → intentamos cargar PDF
    if not CargarRucDesdeCertificadoPdf then
    begin
      // Hubo error o canceló el diálogo de archivo
      edt_RIdFiscal.Text := '';
      FLastCheckedRuc := '';
      MuestraMensajeGiproy('Advertencia',
        'No se pudo obtener los datos desde el certificado RUC. Por favor introduzca un RUC válido.');
      edt_RIdFiscal.SetFocus;
      Exit;
    end;

    // Si llegamos aquí, el PDF se procesó correctamente y
    // CargarRucDesdeCertificadoPdf ya habrá rellenado edt_RIdFiscal y demás.
    FLastCheckedRuc := Trim(edt_RIdFiscal.Text);
    // En este punto puedes optar por:
    // - NO volver a llamar al webservice (asumiendo PDF como fuente válida)
    // - O, si quieres, lanzar otra validación con CompruebaRuc.

  finally
    FCheckingRuc := False;
    // Inicializa los consetimientos.
    chk_ProteccionDatos.IsChecked := False;
    chk_AutorizacionGiproy.IsChecked := False;
    chk_AutorizacionPublicidad.IsChecked := False;
  end;
end;

procedure TfrmMain.edt_subCategoriaFilterChangeTracking(Sender: TObject);
var
  f: TTMSFNCTreeViewFilterData;
  filtro: string;
begin
  filtro := edt_subCategoriaFilter.Text;
  filtro := Trim(filtro);
  case codCategoriaRecursos of
    1:
      begin
        trvw_cat1EquiposHerramientas.RemoveFilter;
        if filtro <> '' then
        begin
          trvw_cat1EquiposHerramientas.Filter.Clear;
          f := trvw_cat1EquiposHerramientas.Filter.Add;
          f.Column := 1;
          f.CaseSensitive := False;
          f.Condition := '*' + filtro + '*';
          trvw_cat1EquiposHerramientas.ApplyFilter;
        end;
      end;
    2:
      begin
        trvw_cat2Materiales.RemoveFilter;
        if filtro <> '' then
        begin
          trvw_cat2Materiales.Filter.Clear;
          f := trvw_cat2Materiales.Filter.Add;
          f.Column := 1;
          f.CaseSensitive := False;
          f.Condition := '*' + filtro + '*';
          trvw_cat2Materiales.ApplyFilter;
        end;
      end;
    3:
      begin
        trvw_cat3Transporte.RemoveFilter;
        if filtro <> '' then
        begin
          trvw_cat3Transporte.Filter.Clear;
          f := trvw_cat3Transporte.Filter.Add;
          f.Column := 1;
          f.CaseSensitive := False;
          f.Condition := '*' + filtro + '*';
          trvw_cat3Transporte.ApplyFilter;
        end;
      end;
    4:
      begin
        trvw_cat4ManodeObra.RemoveFilter;
        if filtro <> '' then
        begin
          trvw_cat4ManodeObra.Filter.Clear;
          f := trvw_cat4ManodeObra.Filter.Add;
          f.Column := 1;
          f.CaseSensitive := False;
          f.Condition := '*' + filtro + '*';
          trvw_cat4ManodeObra.ApplyFilter;
        end;
      end;
    5:
      begin
        trvw_cat5SeguridadIndustrial.RemoveFilter;
        if filtro <> '' then
        begin
          trvw_cat5SeguridadIndustrial.Filter.Clear;
          f := trvw_cat5SeguridadIndustrial.Filter.Add;
          f.Column := 1;
          f.CaseSensitive := False;
          f.Condition := '*' + filtro + '*';
          trvw_cat5SeguridadIndustrial.ApplyFilter;
        end;
      end;
    6:
      begin
        trvw_cat6PreciosUnitarios.RemoveFilter;
        if filtro <> '' then
        begin
          trvw_cat6PreciosUnitarios.Filter.Clear;
          f := trvw_cat6PreciosUnitarios.Filter.Add;
          f.Column := 1;
          f.CaseSensitive := False;
          f.Condition := '*' + filtro + '*';
          trvw_cat6PreciosUnitarios.ApplyFilter;
        end;
      end;
  end;
end;

procedure TfrmMain.edt_UPasswordEnter(Sender: TObject);
begin
  Shadow_UPassword.Enabled := True;
end;

procedure TfrmMain.edt_UPasswordExit(Sender: TObject);
begin
  Shadow_UPassword.Enabled := False;
end;

procedure TfrmMain.edt_UPasswordKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
begin
  if Key = vkTab then
    edt_UUsuario.SetFocus;
  compruebaEscrito;
  if (Key = vkReturn) then
  begin
    realizaLogin_old;
  end;
end;

procedure TfrmMain.edt_UUsuarioEnter(Sender: TObject);
begin
  Shadow_UUsuario.Enabled := True;
end;

procedure TfrmMain.edt_UUsuarioExit(Sender: TObject);
begin
  Shadow_UUsuario.Enabled := False;
end;

procedure TfrmMain.edt_UUsuarioKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
begin
  if (Key = vkReturn) then
  begin
    edt_UPassword.SetFocus;
  end;
  compruebaEscrito;
end;

procedure TfrmMain.edt_UUsuarioKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
begin
  if (Key = vkReturn) or (Key = vkTab) then
    edt_UPassword.SetFocus;
end;

procedure TfrmMain.ejecutarLeeBios;
var
  SerieBIOS: string;
  SerieHDDFisico: string;
begin
  SerieBIOS := ObtenerNumeroSerieBIOS.Trim;
  SerieHDDFisico := ObtenerNumeroSerieHDDFisico.Trim;
  if (SerieBIOS <> '') or (SerieHDDFisico <> '') then
    HardwareKey := SerieBIOS + '&&' + SerieHDDFisico
  else
    HardwareKey := 'error';
end;

procedure TfrmMain.FormClose(Sender: TObject; var Action: TCloseAction);
var
  tmpstr: string;
begin
  if FCoInitialized then
    CoUninitialize;
  if codIDUSuario > 0 then
  begin
    RegistraLogUsuario(codIDUSuario, 2, tmpstr);
  end;
  dmodule_1.con2.Disconnect;
end;

procedure TfrmMain.FormCreate(Sender: TObject);
var
  th1: thFechaInternet;
  tmpstr: string;
begin
  Self.Caption := 'GiProy V. ' + GetAppVersion;
  // Bitmap mínimo válido (FMX) para Windows (evita acceso a width/height)
  FDragBitmap := FMX.Graphics.TBitmap.Create;
  FDragBitmap.SetSize(32, 32);
  FDragBitmap.Clear(TAlphaColors.Null);

  rutaApp := ParamStr(0);
  rutaApp := ExtractFilePath(rutaAPP);
  if rightstr(rutaApp, 1) <> '\' then
    rutaApp := rutaApp + '\';
  FUltimoFiltroAPUS := '';
  FCheckingRuc := False;
  PaisDefecto := 'Ecuador';
  CodPaisDefecto := 'EC';
  entradagridItems := False;
  Users := TUsersIni.Create('', False);
  HardwareKey := 'error';
  codProyecto := '1';
  FechaHoraInternet := 0;
  th1 := thFechaInternet.Create(True);
  th1.Start;
  lyt_Reporte.Visible := False;
  OpcionPrincipal := 0;
  nPresupuestoOpc := 0;
  FMouseDown := False;
  ndecimalesMoneda := 2;
  ndecimalespresupuesto := 4;
  visorEDTActivo := False;
  dirGeoreferencia := rutaApp + 'GeoReferencias\';
  dirImagenReferencia := rutaApp + 'ImagenReferencial\';
  if not DirectoryExists(dirGeoreferencia) then
    CreateDir(dirGeoreferencia);
  if not DirectoryExists(dirImagenReferencia) then
    CreateDir(dirImagenReferencia);
  tbc_PreciosUnitarios.ActiveTab := tab_PU_0Vacio;
  tbcSubMenu2.ActiveTab := tab_Sub2_0Vacio;
  tbcSubMenu3.ActiveTab := tab_Sub3_0Vacio;
  ordenacionlistadoCategoiraApus := 1;
  FCoInitialized := Succeeded(CoInitialize(nil));
  archivoIni := ChangeFileExt(ParamStr(0), '.ini');
  MostrarTienda := True;
  if FileExists(archivoIni) then
    Users.LoadFromFile(archivoIni);
  FS := TFormatSettings.Create;
  tmpstr := decimal_correcto('.');
  FS.DecimalSeparator := tmpstr[1];
  FS.ThousandSeparator := #0; // sin miles (opcional)
  FApusCache := TStringList.Create;
  TGiProySecureConfig_v1_0_3.Initialize;
  tmr_Inicio.Enabled := True;
  tmr_Hora.Enabled := True;

end;

procedure TfrmMain.FormDestroy(Sender: TObject);
begin
  FDragBitmap.Free;
  FreeAndNil(FApusCache);
end;

procedure TfrmMain.grid_1CellClick(Sender: TObject; ACol, ARow: Integer);
var
  i, J: Integer;
begin
  i := ARow;
  J := grid_Crono1.TopRow;
  muevegrid(i, J);
end;

procedure TfrmMain.grid_1ClipboardAfterPasteCell(Sender: TObject;
  Col, Row: Integer; Value: string);
var
  Y: Integer;
  tmpfloat: Double;
  tmpstr: string;
  totalRow: Double;
  listaActualizaCrono0: TStringList;
begin
  Value := ReplaceStr(Value, '%', '');
  tmpfloat := StrToFloatDef(Value, 0);
  if tmpfloat = 0 then
    grid_Crono1.cells[Col, Row] := '0%';
  if (Col = grid_Crono1.ColumnCount - 2) and (Value.Trim <> '') then
  begin
    totalRow := 0;
    listaActualizaCrono0 := TStringList.Create;
    for Y := 0 to Col do
    begin
      tmpstr := grid_Crono1.cells[Y, Row];
      tmpstr := ReplaceStr(tmpstr, '%', '');
      tmpfloat := StrToFloatDef(tmpstr, 0);
      listaActualizaCrono0.Add(tmpstr);
      if tmpfloat = 0 then
        grid_Crono1.cells[Y, Row] := '0%';
      totalRow := totalRow + tmpfloat;
    end;
    frmMain.grid_crono0.cells[11, Row] := listaActualizaCrono0.Text;
    grid_Crono1.cells[grid_Crono1.ColumnCount - 1, Row] :=
      FloatToStr(totalRow) + '%';
    if totalRow < 100 then
    begin
      tmpstr := grid_Crono1.cells[grid_Crono1.ColumnCount - 1, Row];
      tmpstr := '<P align="right"><font color="red">' + tmpstr + '</font></P>';
      grid_Crono1.cells[grid_Crono1.ColumnCount - 1, Row] := tmpstr;
    end
    else
    begin
      recalculaCronogramas;
    end;
  end;
end;

procedure TfrmMain.grid_APUSRecursosCellClick(Sender: TObject;
  ACol, ARow: Integer);
begin
  SeleccionaAPUSMostrar(ARow, ACol);
end;

procedure TfrmMain.SeleccionaAPUSMostrar(ARow, ACol: integer);
var
  posicion: Integer;
  cod_completoAPU: string;
  tmpstr: string;
begin
  posicion := ARow;
  if ARow > 0 then
  begin
    limpia_APUSVisor();
    cod_completoAPU := grid_APUSRecursos.cells[9, posicion];
    edt_APUSDescripcion.Text := grid_APUSRecursos.cells[2, posicion];
    edt_APUSUnidad.Text := grid_APUSRecursos.cells[3, posicion];
    codCategoriaAPUSeleccionada := grid_APUSRecursos.cells[8, posicion];
    tmpstr := grid_APUSRecursos.cells[4, posicion];
    tmpstr := decimal_correcto(tmpstr);
    lbl_APUMCostoDirectoTotal.Text := tmpstr;
    tmpstr := grid_APUSRecursos.cells[5, posicion];
    tmpstr := decimal_correcto(tmpstr);
    lbl_APUMCostoIndirectoTotal.Text := tmpstr;
    tmpstr := grid_APUSRecursos.cells[6, posicion];
    tmpstr := decimal_correcto(tmpstr);
    lbl_APUMPrecioUnitarioTotal.Text := tmpstr;
    posicionaAPUSCategoria(codCategoriaAPUSeleccionada);
    rellenaAPUSVisor(cod_completoAPU);
    if (ACol = 7) and (ARow > 0) then
    begin
      MuestraMensajeGiproy('Advertencia', 'Seleccionar CPC para APUS');
    end;
    trvw_APUSVisor.ExpandAll;
    AjustaGridAutomatico(grid_APUSRecursos, 2);
  end;
end;

procedure TfrmMain.grid_APUSRecursosCellDblClick(Sender: TObject;
  ACol, ARow: Integer);
var
  codApu: string;
  i: Integer;
  nodo: TTMSFMXTreeViewNode;
  LForm: TfrmAddAPU;
begin
  rect_SUB34Editar.Fill.Color := COL_Enter;
  if ARow > 0 then
  begin
    rect_SUB34Editar.OnClick(rect_SUB34Editar);
  end;
end;

procedure TfrmMain.grid_APUSRecursosCellEditDone(Sender: TObject;
  ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
var
  codApu, descripcionAPU, UnidadAPU: string;
  nuevaDescripcionAPU: string;
begin
  try
    nuevaDescripcionAPU := grid_APUSRecursos.cells[ACol, ARow];
    if nuevaDescripcionAPU <> descripcionAPUAntigua then
    begin
      codApu := grid_APUSRecursos.cells[9, ARow];
      try
        if codApu <> '' then
        begin
          descripcionAPU := grid_APUSRecursos.cells[2, ARow];
          UnidadAPU := grid_APUSRecursos.cells[3, ARow];
          ActualizaDescripcionAPU(codApu, descripcionAPU, UnidadAPU);
        end;
      except
      end;
    end;
    descripcionAPUAntigua := '';
  except
  end;
end;

procedure TfrmMain.grid_APUSRecursosCellEditGetData(Sender: TObject;
  ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor; var CellString: string);
begin
  if ARow > 0 then
    descripcionAPUAntigua := grid_APUSRecursos.cells[ACol, ARow]
  else
    descripcionAPUAntigua := '';
end;

procedure TfrmMain.grid_APUSRecursosColumnSized(Sender: TObject; ACol: Integer;
  NewWidth: Single);
begin
  if NewWidth < 50 then
  begin
    grid_APUSRecursos.Columns[ACol].Width := 50;
  end;
end;

procedure TfrmMain.grid_APUSRecursosGetCellLayout(Sender: TObject; ACol,
  ARow: Integer; ALayout: TTMSFNCGridCellLayout;
  ACellState: TTMSFNCGridCellState);
begin
  // Ignorar encabezado
  if ARow <= 0 then
    Exit;

  // Fila pendiente de revisión
  if grid_APUSRecursos.Cells[10, ARow] = '1' then
  begin
    ALayout.Fill.Kind := gfkSolid;
    ALayout.Fill.Color := Col_Pendiente;

    ALayout.Font.Color := TAlphaColorRec.Black;
    //    ALayout.Font.Style := [TFontStyle.fsBold];
  end;
end;

procedure TfrmMain.grid_APUSRecursosKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if key = VKDelete then
  begin
    rect_Sub34Borrar.OnClick(rect_Sub34Borrar);
  end;
end;

procedure TfrmMain.grid_APUSRecursosMouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  if Button <> TMouseButton.mbLeft then
    Exit;

  FDragStart := PointF(X, Y);
  FDragging := False;
end;

procedure TfrmMain.grid_APUSRecursosMouseMove(Sender: TObject;
  Shift: TShiftState; X, Y: Single);
var
  DragService: IFMXDragDropService;
  DragData: TDragObject;
  JSONRoot: TJSONObject;
  JSONArray: TJSONArray;
  Row: Integer;
  CodAPUSCompleto, CodUnicoAPU: string;
  JSONStr: string;
begin
  // 1. Solo botón izquierdo
  if not (ssLeft in Shift) then
    Exit;

  // 2. Evitar múltiples inicios
  if FDragging then
    Exit;

  // 3. Umbral mínimo de movimiento (evita drag accidental)
  if (Abs(X - FDragStart.X) < 6) and (Abs(Y - FDragStart.Y) < 6) then
    Exit;

  // 4. Servicio DragDrop disponible
  if not TPlatformServices.Current.SupportsPlatformService(
    IFMXDragDropService, DragService) then
    Exit;

  // 5. Construir JSON de selección
  JSONArray := TJSONArray.Create;
  try
    for Row := grid_APUSRecursos.FixedRows to grid_APUSRecursos.RowCount - 1 do
    begin
      if not grid_APUSRecursos.RowSelect[Row] then
        Continue;

      CodAPUSCompleto := grid_APUSRecursos.Cells[9, Row];
      CodUnicoAPU := grid_APUSRecursos.Cells[10, Row];

      if CodAPUSCompleto = '' then
        Continue;

      JSONArray.Add(
        TJSONObject.Create
        .AddPair('codAPUSCompleto', CodAPUSCompleto)
        .AddPair('codUnicoAPUS', CodUnicoAPU)
        );
    end;

    // 6. Nada seleccionado → no hay drag
    if JSONArray.Count = 0 then
      Exit;

    // 7. Serializar a STRING (FMX REQUIREMENT)
    JSONRoot := TJSONObject.Create;
    try
      JSONRoot.AddPair('CambioAPUS', JSONArray);
      JSONArray := nil; // propiedad transferida

      JSONStr := JSONRoot.ToJSON;
    finally
      JSONRoot.Free;
    end;

    // 8. Crear DragObject (RECORD)
    DragData := Default(TDragObject);
    DragData.Source := grid_APUSRecursos;
    DragData.Data := JSONStr;

    // 9. Marcar estado y lanzar Drag
    FDragging := True;
    DragService.BeginDragDrop(Self, DragData, FDragBitmap);

  finally
    JSONArray.Free; // solo si no fue transferido
  end;
end;

procedure TfrmMain.grid_APUSRecursosMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  FDragging := False;
end;

procedure TfrmMain.grid_APUSRecursosResize(Sender: TObject);
begin
  AjustaGridAutomatico(grid_ApusRecursos, 2);
end;

procedure TfrmMain.grid_calcTiemposCellClick(Sender: TObject;
  ACol, ARow: Integer);
var
  i, J: Integer;
begin
  i := ARow;
  J := grid_calcTiempos.TopRow;
  muevegrid(i, J);
end;

procedure TfrmMain.grid_calcTiemposKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
var
  i, J: Integer;
  ARow: Integer;
begin
  ARow := grid_calcTiempos.Selection.StartRow;
  i := ARow;
  J := grid_calcTiempos.TopRow;
  muevegrid(i, J);
end;

procedure TfrmMain.grid_calcTiemposKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
var
  i, J: Integer;
  ARow: Integer;
begin
  ARow := grid_calcTiempos.Selection.StartRow;
  i := ARow;
  J := grid_calcTiempos.TopRow;
  muevegrid(i, J);
end;

procedure TfrmMain.grid_calcTiemposSelectedCell(Sender: TObject;
  ACol, ARow: Integer);
var
  i, J: Integer;
begin
  i := ARow;
  J := grid_calcTiempos.TopRow;
  muevegrid(i, J);
end;

procedure TfrmMain.grid_crono01CellClick(Sender: TObject; ACol, ARow: Integer);
var
  codApu: string;
  i, J: Integer;
begin
  iniciaTanteoCrono();
  if ARow > 0 then
  begin
    i := ARow;
    J := grid_crono01.TopRow;
    muevegrid(i, J);
    codApu := grid_crono01.cells[14, ARow];
    if (codApu <> '') and (lyt_tanteoCrono.Height > 0) then
    begin
      edt_TanteoCronoDescripcion.Text := grid_crono01.cells[4, ARow];
      edt_TanteoCronoUnidad.Text := grid_crono01.cells[5, ARow];
      restaurarApuTanteo(codApu, 2);
    end;
  end;
end;

procedure TfrmMain.grid_crono01KeyDown(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
var
  i, J: Integer;
  ARow: Integer;
begin
  ARow := grid_crono01.Selection.StartRow;
  i := ARow;
  J := grid_crono01.TopRow;
  muevegrid(i, J);
end;

procedure TfrmMain.grid_crono01KeyUp(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
var
  i, J: Integer;
  ARow: Integer;
begin
  ARow := grid_crono01.Selection.StartRow;
  i := ARow;
  J := grid_crono01.TopRow;
  muevegrid(i, J);
end;

procedure TfrmMain.grid_crono01SelectedCell(Sender: TObject;
  ACol, ARow: Integer);
var
  i, J: Integer;
begin
  i := ARow;
  J := grid_crono01.TopRow;
  muevegrid(i, J);
end;

procedure TfrmMain.grid_crono0KeyDown(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
begin
  pulsarTeclaGrid := True;
end;

procedure TfrmMain.grid_crono0KeyUp(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
begin
  pulsarTeclaGrid := False;
end;

procedure TfrmMain.grid_crono0SelectedCell(Sender: TObject;
  ACol, ARow: Integer);
var
  i, J: Integer;
begin
  i := ARow;
  J := grid_crono0.TopRow;
  muevegrid(i, J);
end;

procedure TfrmMain.grid_Crono1CellClick(Sender: TObject; ACol, ARow: Integer);
var
  i, J: Integer;
begin
  i := ARow;
  J := grid_Crono1.TopRow;
  muevegrid(i, J);
end;

procedure TfrmMain.grid_Crono1ClipboardAfterPasteCell(Sender: TObject;
  Col, Row: Integer; Value: string);
var
  Y: Integer;
  tmpfloat: Double;
  tmpstr: string;
  totalRow: Double;
begin
  Value := ReplaceStr(Value, '%', '');
  tmpfloat := StrToFloatDef(Value, 0);
  if tmpfloat = 0 then
    grid_Crono1.cells[Col, Row] := '0%';
  if (Col = grid_Crono1.ColumnCount - 2) and (Value.Trim <> '') then
  begin
    totalRow := 0;

    for Y := 0 to Col do
    begin
      tmpstr := grid_Crono1.cells[Y, Row];
      tmpstr := ReplaceStr(tmpstr, '%', '');
      tmpfloat := StrToFloatDef(tmpstr, 0);
      if tmpfloat = 0 then
        grid_Crono1.cells[Y, Row] := '0%';
      totalRow := totalRow + tmpfloat;
    end;
    grid_Crono1.cells[grid_Crono1.ColumnCount - 1, Row] :=
      FloatToStr(totalRow) + '%';
    if totalRow < 100 then
    begin
      tmpstr := grid_Crono1.cells[grid_Crono1.ColumnCount - 1, Row];
      tmpstr := '<P align="right"><font color="red">' + tmpstr + '</font></P>';
      grid_Crono1.cells[grid_Crono1.ColumnCount - 1, Row] := tmpstr;
    end;
  end;
end;

procedure TfrmMain.grid_Crono1ClipboardBeforePasteCell(Sender: TObject;
  Col, Row: Integer; var Value: string; var Allow: Boolean);
var
  tmpstr: string;
begin
  tmpstr := frmMain.grid_crono0.cells[3, Row];
  if tmpstr = '' then
    Allow := False
  else
    Allow := True;
end;

procedure TfrmMain.grid_crono2CellClick(Sender: TObject; ACol, ARow: Integer);
var
  i, J: Integer;
begin
  i := ARow;
  J := grid_crono2.TopRow;
  muevegrid(i, J);
end;

procedure TfrmMain.grid_crono3CellClick(Sender: TObject; ACol, ARow: Integer);
var
  i, J: Integer;
begin
  i := ARow;
  J := grid_crono3.TopRow;
  muevegrid(i, J);
end;

procedure TfrmMain.grid_DesagregacionAPUSCellClick(Sender: TObject;
  ACol, ARow: Integer);
var
  codAPUDes: string;
  precioUnitario: string;
begin
  if ARow > -1 then
  begin
    ARowDesagregacion := ARow;
    codAPUDes := grid_DesagregacionAPUS.cells[11, ARow];
    precioUnitario := quitaSimboloMoneda(grid_DesagregacionAPUS.cells[5, ARow]);
    precioUnitario := quitaSignoMiles(precioUnitario).Trim;
    if codAPUDes <> '' then
    begin
      PresentarRecursosDesagregacion(codAPUDes, precioUnitario);
    end;
  end;
end;

procedure TfrmMain.grid_DesagregacionAPUSColumnSize(Sender: TObject;
  ACol: Integer; var NewWidth: Single);
var
  X: Integer;
  sizenew: Double;
begin
  if NewWidth < 50 then
    grid_DesagregacionAPUS.Columns[ACol].Width := 50;
  sizenew := 0;
  for X := 0 to 5 do
  begin
    sizenew := sizenew + grid_DesagregacionAPUS.Columns[X].Width;
  end;
  lyt_DESGTotal0.Width := sizenew;
  lyt_DESGTotal1.Width := grid_DesagregacionAPUS.Columns[6].Width;
  lyt_DESGTotal2.Width := grid_DesagregacionAPUS.Columns[7].Width;
  lyt_DESGTotal3.Width := grid_DesagregacionAPUS.Columns[8].Width;
  lyt_DESGTotal4.Width := grid_DesagregacionAPUS.Columns[9].Width;
end;

procedure TfrmMain.grid_DesagregacionAPUSHeaderColumnSize(Sender: TObject;
  ACol: Integer; var NewWidth: Single);
var
  X: Integer;
  sizenew: Double;
begin
  case ACol of
    0:
      begin
        if NewWidth < 60 then
          NewWidth := 60;
      end;
    1:
      begin
        if NewWidth < 100 then
          NewWidth := 100;
      end;
    2:
      begin
        if NewWidth < 520 then
          NewWidth := 520;
      end;
    3:
      begin
        if NewWidth < 60 then
          NewWidth := 60;
      end;
    4:
      begin
        if NewWidth < 80 then
          NewWidth := 80;
      end;
    5:
      begin
        if NewWidth < 80 then
          NewWidth := 80;
      end;
    6:
      begin
        if NewWidth < 80 then
          NewWidth := 80;
      end;
    7:
      begin
        if NewWidth < 80 then
          NewWidth := 80;
      end;
    8:
      begin
        if NewWidth < 90 then
          NewWidth := 90;
      end;
    9:
      begin
        if NewWidth < 100 then
          NewWidth := 100;
      end;
  end;
  grid_DesagregacionAPUSHeader.Columns[ACol].Width := NewWidth;
  sincronizaFooterDesagregacion();
end;

procedure TfrmMain.grid_DesagregacionAPUSHeaderColumnSized(Sender: TObject;
  ACol: Integer; NewWidth: Single);
var
  X: Integer;
begin
  if NewWidth < 30 then
    grid_DesagregacionAPUSHeader.Columns[ACol].Width := 30;
  for X := 0 to grid_DesagregacionAPUSHeader.Columns.Count - 1 do
  begin
    grid_DesagregacionAPUS.Columns[X].Width :=
      grid_DesagregacionAPUSHeader.Columns[X].Width;
  end;
end;

procedure TfrmMain.grid_desagregacionCPCCellEditDone(Sender: TObject;
  ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
var
  vTipo, vporcentaje: string;
begin
  vTipo := '';
  vporcentaje := '';
  case ACol of
    3:
      begin
        vTipo := grid_desagregacionCPC.cells[ACol, ARow];
        dmodule_1.untbl1.DisableControls;
        dmodule_1.untbl1.First;
        dmodule_1.untbl1.MoveBy(ARow - 1);
        dmodule_1.untbl1.Edit;
        if vTipo = 'NP' then
          dmodule_1.untbl1.FieldByName('porcentaje').AsString := '0';
        if vTipo = 'EP' then
          dmodule_1.untbl1.FieldByName('porcentaje').AsString := '100';
        if vTipo = 'ND' then
          dmodule_1.untbl1.FieldByName('porcentaje').AsString := '40';
        dmodule_1.untbl1.Post;
        dmodule_1.untbl1.EnableControls;
      end;
  end;
end;

procedure TfrmMain.grid_desagregacionCPCKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
begin
  if Key = VK_DELETE then
  begin
    if RealizarPreguntaSiNo('¿Borrar Codigo CPC?') <> mrOK then
      Exit;
    borrarCPC;
  end;
end;

procedure TfrmMain.grid_DesgRecursosCellDblClick(Sender: TObject;
  ACol, ARow: Integer);
var
  idUnicoRecurso, Descripcion: string;
  LForm: Tfrm_CPCSeleccion;
begin
  if ARow > -1 then
  begin
    LForm := Tfrm_CPCSeleccion.Create(Application);
    try
      dmodule_1.untbl2.DisableControls;
      dmodule_1.untbl2.First;
      dmodule_1.untbl2.MoveBy(ARow - 1);
      idUnicoRecurso := dmodule_1.untbl2.FieldByName('idUnicoRecurso').AsString;
      Descripcion := dmodule_1.untbl2.FieldByName('descripcion').AsString;
      dmodule_1.untbl2.EnableControls;
      LForm.lbl_Item.Text := 'Item Seleccionado: ' + Descripcion;
      LForm.lbl_modo.Text := idUnicoRecurso;
      LForm.lbl_adicional.Text := '1';
      LForm.ShowModal;
    finally
      LForm.Free;
    end;
  end;
end;

procedure TfrmMain.grid_EDOStakesCellClick(Sender: TObject;
  ACol, ARow: Integer);
begin
  grid_EDOStakes.Options.Editing.Enabled := False;
end;

procedure TfrmMain.grid_EDOStakesCellDblClick(Sender: TObject; ACol, ARow:
  Integer);
var
  nodoSeleccionado, nodoPadre, newNodo: TTMSFNCTreeViewNode;
  nombreStake, rolPresupuesto: string;
  idStake, codigoposicion: string;
  nodoIndex: Integer;
begin
  grid_EDOStakes.Options.Editing.Enabled := False;

  if ACol = 3 then
  begin
    grid_EDOStakes.Options.Editing.Enabled := True;
    Exit;
  end;

  codigoposicion := Trim(grid_EDOStakes.Cells[0, ARow]);
  idStake := Trim(grid_EDOStakes.Cells[1, ARow]);
  nombreStake := Trim(grid_EDOStakes.Cells[2, ARow]);
  rolPresupuesto := Trim(grid_EDOStakes.Cells[3, ARow]);

  if LowerCase(rolPresupuesto) = 'sin asignar' then
  begin
    MuestraMensajeGiproy('Advertencia',
      'Por favor, seleccione un rol para el Stakeholder');
    Exit;
  end;

  nodoSeleccionado := Trvw_EDO.SelectedNode;
  if (nodoSeleccionado = nil) or (nodoSeleccionado = Trvw_EDO.Nodes[0]) then
  begin
    MuestraMensajeGiproy('Advertencia', 'Seleccione un Hito válido');
    Exit;
  end;

  Trvw_EDO.BeginUpdate;
  try
    if nodoSeleccionado.Extended then
    begin
      nodoPadre := nodoSeleccionado;
      nodoIndex := nodoPadre.Nodes.Count;
      newNodo := Trvw_EDO.InsertNode(nodoIndex, nodoPadre);
    end
    else
    begin
      nodoPadre := nodoSeleccionado.getParent;
      nodoIndex := nodoSeleccionado.VirtualNode.Index + 1;
      newNodo := Trvw_EDO.InsertNode(nodoIndex, nodoPadre);
    end;

    newNodo.Text[0] := '';
    newNodo.Text[1] := rolPresupuesto;
    newNodo.Text[2] := idStake;
    newNodo.Text[3] := nombreStake;
    newNodo.Text[4] := '';

    newNodo.Extended := False;

    RenumerarEstructuraCompleta(Trvw_EDO);

  finally
    Trvw_EDO.EndUpdate;
  end;
end;

procedure TfrmMain.grid_EDOStakesCellEditDone(Sender: TObject; ACol,
  ARow: Integer; CellEditor: TTMSFNCGridEditor);
begin
  AjustaGrid_EDOStake();
end;

procedure TfrmMain.grid_EDOStakesCellEditSetData(Sender: TObject;
  ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor; var CellString: string);
var
  idUnico: string;
begin
  idUnico := grid_EDOStakes.cells[4, ARow];
  actualizaRolgridStake(idUnico, CellString);
  AjustaGrid_EDOStake();
end;

/// <summary>
/// Implementa la lógica principal de grid_EDOStakesColumnSized.
/// </summary>
procedure TfrmMain.grid_EDOStakesColumnSized(Sender: TObject; ACol: Integer;
  NewWidth: Single);
begin
  if NewWidth < 50 then
    grid_EDOStakes.Columns[ACol].Width := 50;
  AjustaGrid_EDOStake();
end;

procedure TfrmMain.grid_FpolCuadrillaTipoCellEditDone(Sender: TObject;
  ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
var
  X: Integer;
  tmpstr: string;
  TsalarioReal, TsalarioMinimo: Double;
  codigoIndice: string;
  guardarTabla: Boolean;
begin
  guardarTabla := True;
  if (ACol = 3) then
  begin
    codigoIndice := buscacodigoIndiceFpol(grid_FpolCuadrillaTipo.cells
      [ACol, ARow]);
    if not compruebaCodigoIndiceRepetido(codigoIndice) = True then
    begin
      grid_FpolCuadrillaTipo.cells[2, ARow] := codigoIndice;
      grid_FpolCuadrillaTipo.Repaint;
    end
    else
    begin
      guardarTabla := False;
      grid_FpolCuadrillaTipo.cells[2, ARow] := '';
      grid_FpolCuadrillaTipo.cells[3, ARow] := '';
      MuestraMensajeGiproy('Advertencia', 'Codigo de Indice ya Asignado');
    end;
  end;
  if (ACol = 5) then
  begin
    tmpstr := grid_FpolCuadrillaTipo.cells[5, ARow];
    if tmpstr = '' then
      tmpstr := '0';
    tmpstr := decimal_correcto(tmpstr);
    frmMain.grid_FpolCuadrillaTipo.cells[5, ARow] := tmpstr;
    TsalarioMinimo := StrToFloatDef(tmpstr, 0);
    tmpstr := grid_FpolCuadrillaTipo.cells[6, ARow];
    if tmpstr = '' then
      tmpstr := '0';
    tmpstr := decimal_correcto(tmpstr);

    TsalarioReal := StrToFloatDef(tmpstr, 0);
    if TsalarioMinimo > TsalarioReal then
    begin
      frmMain.grid_FpolCuadrillaTipo.cells[10, ARow] := 'Revisar';
    end
    else
      frmMain.grid_FpolCuadrillaTipo.cells[10, ARow] := '';
  end;
  if (ACol = 3) or (ACol = 5) then
  begin
    if guardarTabla then
      guardaTablaIndicesCuadrilla();
  end;
  ComprobarInconsistenciaCuadrillas();
end;

/// <summary>
/// Implementa la lógica principal de grid_FpolCuadrillaTipoSelectCell.
/// </summary>
procedure TfrmMain.grid_FpolCuadrillaTipoSelectCell(Sender: TObject;
  ACol, ARow: Integer; var Allow: Boolean);
begin
  if (ACol = 3) or (ACol = 5) then
    Allow := True
  else
    Allow := False;
end;

/// <summary>
/// Implementa la lógica principal de grid_FpolIndicesDisponiblesCellEditDone.
/// </summary>
procedure TfrmMain.grid_FpolIndicesDisponiblesCellEditDone(Sender: TObject;
  ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
var
  X: Integer;
  tmpstr: string;
begin
  if ACol = 3 then
  begin
    grid_FpolIndicesDisponibles.cells[2, ARow] :=
      buscacodigoIndiceFpol(grid_FpolIndicesDisponibles.cells[ACol, ARow]);
    grid_FpolIndicesDisponibles.Repaint;
  end;
  frmMain.grid_Fpolinomica.Columns[1].ComboItems.Clear;
  for X := 1 to frmMain.grid_FpolIndicesDisponibles.RowCount - 1 do
  begin
    tmpstr := frmMain.grid_FpolIndicesDisponibles.cells[1, X];
    if tmpstr <> '' then
    begin
      tmpstr := UpperCase(tmpstr);
      frmMain.grid_FpolIndicesDisponibles.cells[1, X] := tmpstr;
      frmMain.grid_Fpolinomica.Columns[1].ComboItems.Add(tmpstr);
    end;
  end;
  if (frmMain.grid_FpolIndicesDisponibles.cells[1, ARow] <> '') and
    (frmMain.grid_FpolIndicesDisponibles.cells[3, ARow] <> '') then
  begin
    guardaTablaIndicesSeleccionados;
  end;
end;

/// <summary>
/// Implementa la lógica principal de grid_FpolIndicesDisponiblesCellEditValidateData.
/// </summary>
procedure TfrmMain.grid_FpolIndicesDisponiblesCellEditValidateData
  (Sender: TObject; ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor;
  var CellString: string; var Allow: Boolean);
begin
  if grid_FpolIndicesDisponibles.cells[1, ARow] = 'E' then
    Allow := False;
end;

/// <summary>
/// Implementa la lógica principal de grid_FpolIndicesDisponiblesColumnSized.
/// </summary>
procedure TfrmMain.grid_FpolIndicesDisponiblesColumnSized(Sender: TObject;
  ACol: Integer; NewWidth: Single);
begin
  if NewWidth < 50 then
  begin
    grid_FpolIndicesDisponibles.Columns[ACol].Width := 50;
  end;
end;

/// <summary>
/// Implementa la lógica principal de grid_FpolinomicaCellEditDone.
/// </summary>
procedure TfrmMain.grid_FpolinomicaCellEditDone(Sender: TObject;
  ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
begin
  if ACol = 1 then
  begin
    calculaValoresIndices(ARow);
  end;
end;

/// <summary>
/// Manejador del evento OnClick de grid_GBarrasCellClick.
/// </summary>
procedure TfrmMain.grid_GBarrasCellClick(Sender: TObject; ACol, ARow: Integer);
var
  i, J: Integer;
begin
  i := ARow;
  J := grid_GBarras.TopRow;
  muevegrid(i, J);
end;

/// <summary>
/// Manejador del evento OnClick de grid_PresupuestosAPUSCellDblClick.
/// </summary>
procedure TfrmMain.grid_PresupuestosAPUSCellDblClick(Sender: TObject;
  ACol, ARow: Integer);
var
  codAPUT: string;
  tmpVal: double;
begin
  if ARow > 0 then
  begin
    with DMPresupuesto.dsPresupuestosAPUs.DataSet do
    begin
      DisableControls;
      First;
      MoveBy(ARow - 1);
      codAPUT :=
        dmpresupuesto.dsPresupuestosAPUs.DataSet.FieldByName('codAPU').AsString;
      tmpVal :=
        dmPresupuesto.dsPresupuestosAPUs.DataSet.FieldByName('CostoAPU').AsFloat;
      contieneTanteos(codAPUT);
      if DMPresupuesto.Validado(codAPUT) then
      begin
        DMPresupuesto.addAPUdb();
      end
      else
      begin
        if realizarPreguntaSiNo('APU sin validar, ¿Desea validarla?') = mrOK
          then
        begin
          EditarAPUCompleta(codAPUt);
        end;
      end;
      EnableControls;
    end;
  end;
end;

procedure TfrmMain.grid_PresupuestosAPUSResize(Sender: TObject);
begin
  AjustarGridPresupuestosAPUS;
end;

procedure TfrmMain.grid_PresupuestosCellEditDone(Sender: TObject;
  ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
var
  t: Double;
  tid: Integer;
  DS: TDataSet;
  codApu: string;
  BM: TBookmark;
  HasBM: Boolean;
  TCell: TTMSFNCGRIDCELLREC;
begin
  if (ACol <> 5) or (ARow < 0) then
    Exit;

  DS := DMPresupuesto.dsTpresupuestosItems.DataSet;
  if (not Assigned(DS)) or (not DS.Active) or DS.IsEmpty then
    Exit;
  // Valor editado (tu método actual)
  try
    t := StrToFloat(grid_Presupuestos.Cells[ACol, ARow]);
  except
    Exit;
  end;

  // Guardar bookmark del registro actual (por si necesitas volver)
  HasBM := False;

  try
    // En tu FNCGrid: ARow ya corresponde a RecNo (1-based en dataset)
    // Si confirmaste que ARow=1 es primer registro, esto es correcto:
    if ARow < 1 then
      Exit;

    // Posicionar dataset en la fila editada
    DS.RecNo := ARow;
    BM := nil;
    try
      BM := DS.GetBookmark;
      HasBM := DS.BookmarkValid(BM);
    except
      HasBM := False;
    end;

    // Validar que es una línea APU
    codApu := Trim(DS.FieldByName('codAPU').AsString);
    if codApu = '' then
      Exit;

    tid := DS.FieldByName('id').AsInteger;
    if tid <= 0 then
      Exit;

    // Mantener cantidad en dataset si el campo es editable
    if (DS.FindField('cantidad') <> nil) and (not
      DS.FieldByName('cantidad').ReadOnly) then
    begin
      if DS.State = dsBrowse then
        DS.Edit;
      DS.FieldByName('cantidad').AsFloat := t;
      DS.Post;
    end;

    // Persistir en MySQL
    DModule_1.con2.StartTransaction;
    try
      with DMPresupuesto.StoreProc_Presupuesto_actualizaLinea do
      begin
        Close;
        ParamByName('icodBase').AsString := base_activa.codBase;
        ParamByName('icodPresupuesto').AsString := codProyecto;
        ParamByName('iRevision').AsString := revision;
        ParamByName('idPresupuestoItems').AsInteger := tid;
        ParamByName('newCantidad').AsFloat := t;
        ExecProc;
      end;

      DModule_1.con2.Commit;

    except
      DModule_1.con2.Rollback;
      raise;
    end;

  finally
    // Volver al registro original SOLO si el bookmark sigue válido
    if HasBM then
    begin
      try
        if DS.Active and DS.BookmarkValid(BM) then
          DS.GotoBookmark(BM);
      except
        // ignorar: dataset pudo recargarse internamente
      end;
    end;

    try
      if HasBM then
      begin
        DS.FreeBookmark(BM);
      end;
    except
      // ignorar
    end;
  end;

  // Recalculo general
  DMPresupuesto.calculaTotal;
  TThread.Queue(nil,
    procedure
    begin
      PosicionarEnCelda(grid_Presupuestos, ACol, ARow);
    end);
  // Si necesitas que Ptotal se repinte desde SQL, entonces:
  // DS.Refresh;
end;

procedure TfrmMain.grid_PresupuestosColumnSized(Sender: TObject; ACol: Integer;
  NewWidth: Single);
begin
  case ACol of
    0:
      if NewWidth < 60 then
        NewWidth := 60;
    1:
      if NewWidth < 60 then
        NewWidth := 70;
    2:
      if NewWidth < 100 then
        NewWidth := 100;
    3:
      if NewWidth < 300 then
        NewWidth := 300;
    4:
      if NewWidth < 60 then
        NewWidth := 60;
    5:
      if NewWidth < 60 then
        NewWidth := 60;
    6:
      if NewWidth < 100 then
        NewWidth := 100;
    7:
      if NewWidth < 100 then
        NewWidth := 100;
    8:
      if NewWidth < 60 then
        NewWidth := 60;
  end;
  grid_Presupuestos.Columns[ACol].Width := NewWidth;
end;

procedure TfrmMain.grid_PresupuestosKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
var
  posItem: Integer;
  ARow: Integer;
  idPosGrid: Integer;
  QDeleteAPU: TUniquery;

begin
  entradagridItems := True;
  if (ssCtrl in Shift) and (Key = vkX) then
  begin
    DMPresupuesto.cortarAPUS();
  end;
  if (ssCtrl in Shift) and (Key = vkC) then
  begin
    DMPresupuesto.copiarAPUS();
  end;
  if (ssCtrl in Shift) and (Key = vkV) then
  begin
    DMPresupuesto.pegarAPUS();
  end;

  if Key = vkDelete then
  begin
    posItem := grid_Presupuestos.Selection.StartRow;
    if posItem > 0 then
    begin
      if realizarPreguntaSiNo('¿Borrar APUs Seleccionadas?') <> mrOK then
        exit;
      for ARow := grid_Presupuestos.Selection.StartRow to
        grid_Presupuestos.Selection.EndRow do
      begin
        if grid_Presupuestos.RowSelect[ARow] then
        begin
          with DMPresupuesto.dsTpresupuestosItems.DataSet do
          begin
            DisableControls;
            First;
            MoveBy(ARow - 1);
            idPosGrid := FieldByName('posgrid').AsInteger;
            if FieldByName('codAPU').AsString <> '' then
            begin
              QDeleteApu := TUniQuery.Create(nil);
              try
                with QDeleteApu do
                begin
                  Connection := DModule_1.con2;
                  Close;
                  SQL.Clear;
                  SQL.Text :=
                    'CALL Presupuestos_deleteItem(:icodBase, :icodPresupuesto, :iRevision, :iPosGrid)';
                  ParamByName('iposgrid').AsInteger := idPosGrid;
                  ParamByName('icodBase').AsString := base_activa.codBase;
                  ParamByName('icodPresupuesto').AsString := codProyecto;
                  ParamByName('irevision').AsString := revision;
                  try
                    ExecSQL;
                  except
                    on E: Exception do
                    begin
                      raise Exception.Create('Error eliminando item: ' +
                        E.Message);
                    end;
                  end;
                end;
              finally
                QDeleteApu.Free;
              end;
            end;
            EnableControls;
            DMPresupuesto.calculaTotal;
          end;
        end;
      end;
    end;
  end;
end;

procedure TfrmMain.grid_PresupuestosMouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
var
  pt: TPoint;
  ARowI, ARowF: Integer;
begin
  entradagridItems := True;
  if (Button = TMouseButton.mbRight) then
  begin
    ARowI := grid_Presupuestos.Selection.StartRow;
    ARowF := grid_Presupuestos.Selection.EndRow;
    if (ARowI - ARowF = 0) then
    begin
      grid_Presupuestos.SelectCell(grid_Presupuestos.XYToCell(X, Y));
    end;
    GetCursorPos(pt);
    pm_NPresupuesto.Popup(pt.X, pt.Y);
  end;
end;

/// <summary>
/// Manejador del evento OnClick de grid_PresupuestosSubCategoriaCellClick.
/// </summary>
procedure TfrmMain.grid_PresupuestosSubCategoriaCellClick(Sender: TObject;
  ACol, ARow: Integer);
begin
  if DMPresupuesto.QSubCategorias.Active then
  begin
    with DMPresupuesto.dsSubCategorias.DataSet do
    begin
      DisableControls;
      First;
      MoveBy(ARow - 1);
      EnableControls;
    end;
    lbl_FiltroSubCategoriaID.Text := DMPresupuesto.QSubCategoriasciu.AsString;
    DMPresupuesto.mostarAPU_SubCategoria(DMPresupuesto.QSubCategoriasciu.AsInteger);
    edt_FiltroAPUS.Text := '';
  end;
end;

/// <summary>
/// Manejador del evento OnClick de grid_RecursosCellDblClick.
/// </summary>
procedure TfrmMain.grid_RecursosCellDblClick(Sender: TObject;
  ACol, ARow: Integer);
begin
  ProcesarDobleClickGrid(ACol, ARow);
end;

procedure TfrmMain.AjustarGridPresupuestosAPUS;
var
  TotalFixed, AnchoDisponible: Single;
  i: Integer;
begin
  if not Assigned(grid_PresupuestosAPUS) then
    Exit;

  grid_PresupuestosAPUS.BeginUpdate;
  try
    // 1️⃣ Ajustar columnas 1,2,3 al contenido
    grid_PresupuestosAPUS.Columns[1].Width := 50;
    grid_PresupuestosAPUS.Columns[2].Width := 60;
    grid_PresupuestosAPUS.Columns[3].Width := 100;

    FillCol(grid_PresupuestosAPUS, 0);
  finally
    grid_PresupuestosAPUS.EndUpdate;
  end;
end;

/// <summary>
/// Implementa la lógica principal de grid_RecursosColumnSize.
/// </summary>
procedure TfrmMain.grid_RecursosColumnSize(Sender: TObject; ACol: Integer;
  var NewWidth: Single);
const
  MIN_WIDTH = 50.0;
begin
  if not (Sender is TStringGrid) then
    Exit;
  if (ACol < 0) or (ACol >= TStringGrid(Sender).ColumnCount) then
    Exit;

  if NewWidth < MIN_WIDTH then
    NewWidth := MIN_WIDTH;
end;

procedure TfrmMain.grid_PresupuestosSelectCell(Sender: TObject;
  ACol, ARow: Integer; var Allow: Boolean);
var
  nuevaNota: Boolean;
  codUnicoItems: string;
  codApu: string;
  codAPUAnterior: string;
  LForm: TfrmNotasAPUEDT;
begin
  if (tbcPresupuestos.ActiveTab = tab_5Presupuesto) and (entradagridItems) and
    (not IsControlKeyPressed) and (not IsShiftKeyPressed) then
  begin
    entradagridItems := False;
    grid_Presupuestos.Options.Editing.Enabled := False;
    with DMPresupuesto.dsTpresupuestosItems.DataSet do
    begin
      DisableControls;
      First;
      MoveBy(ARow - 1);
      codApu :=
        DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString;
      if ACol = 5 then
      begin
        if codApu <> '' then
        begin
          grid_Presupuestos.Options.Editing.Enabled := True;
        end;
      end;

      if ACol = 8 then
      begin
        LForm := TfrmNotasAPUEDT.Create(Application);
        try
          nuevaNota :=
            DMPresupuesto.QTPresupuestosItems.FieldByName('notas').AsInteger =
            1;
          codUnicoItems :=
            DMPresupuesto.QTPresupuestosItems.FieldByName('codUnicoItems').AsString;
          LForm.TextoNota.Text := '';
          LForm.cargaNotaIni(codUnicoItems, codApu);
          LForm.datosNota.codUnicoNota := codUnicoItems;
          LForm.datosNota.codApu := codApu;
          LForm.datosNota.nuevo := not nuevaNota;
          LForm.ShowModal;
        finally
          LForm.Free;
        end;
      end;

      if (lyt_Tanteo.Height > 0) and (not tantear) and (codApu <> '') then
      begin
        codAPUAnterior := lbl_CodAPUAnterior.Text;

        // Si es el mismo APU, no recargar nada (evita parpadeos y llamadas innecesarias)
        if SameText(codAPUAnterior, codApu) then
          Exit;

        iniciaTreeViewTanteo();
        CodAPUTanteo := codAPU;
        // Nuevo modelo: asegurar que existe el tanteo (si no existía, lo crea)
        DMPresupuesto.TanteoAsegurarInicio(codApu);

        // Cargar el tanteo del APU seleccionado (si está en edición, se verá lo editado; si no, se verá inicial)
        restaurarApuTanteo(codApu, 1);

        lbl_CodAPUAnterior.Text := codApu;

        // Recalcular (Presupuestos_DaTotalPresupuesto ya aplica estado=2)
        DMPresupuesto.calculaTotal;
      end;
      EnableControls;
    end;
  end;
end;

procedure TfrmMain.grid_RecursosDblClick(Sender: TObject);
begin
  if FDownRow < 0 then
  begin
    grid_Recursos.ClearSelection;
    ProcesarDobleClickGrid(-1, -1);
    Exit;
  end;

  ProcesarDobleClickGrid(grid_Recursos.Selection.StartCol, FDownRow);
end;

procedure TfrmMain.grid_RecursosDragEnd(Sender: TObject);
begin
  FreeAndNil(FDragPayload);
end;

procedure TfrmMain.grid_RecursosKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if key = vk_delete then
  begin
    rect_SUB33Borrar.OnClick(rect_SUB33Borrar);
  end;
end;

procedure TfrmMain.ProcesarDobleClickGrid(const ACol, ARow: Integer);

  function RowValida(const r: Integer): Boolean;
  begin
    Result := (r >= 1) and (r < grid_Recursos.RowCount);
  end;

  function ColValida(const C: Integer): Boolean;
  begin
    Result := (C >= 0) and (C < grid_Recursos.ColumnCount);
  end;

  function CellTrim(const C, r: Integer): string;
  begin
    if RowValida(r) and ColValida(C) then
      Result := grid_Recursos.cells[C, r].Trim
    else
      Result := '';
  end;

begin
  // Fila inválida o header → crear
  if not RowValida(ARow) then
  begin
    CrearRecursos;
    Exit;
  end;

  // Columna 7: selección CPC
  if (ACol = 7) and ColValida(9) and (CellTrim(1, ARow) <> '') then
  begin
    AbrirSeleccionCPC(ARow); // encapsula la lógica del modal CPC
    Exit;
  end;

  // Resto: editar o crear
  if CellTrim(1, ARow) <> '' then
    editarRecursos
  else
    CrearRecursos;
end;

procedure TfrmMain.AbrirSeleccionCPC(const ARow: Integer);
var
  LForm: Tfrm_CPCSeleccion;
begin
  // Validaciones básicas
  if (ARow < 1) or (ARow >= grid_Recursos.RowCount) then
    Exit;
  if (grid_Recursos.ColumnCount <= 9) then
    Exit; // necesitamos col 9
  if grid_Recursos.cells[1, ARow].Trim = '' then
    Exit; // no hay recurso

  LForm := Tfrm_CPCSeleccion.Create(Application);
  try
    LForm.edt_filtro.Text := '';
    LForm.lbl_posGrid.Text := ARow.ToString;
    LForm.lbl_idUnicoRecursoAsignado.Text := grid_Recursos.cells[9, ARow].Trim;

    // Define un solo valor coherente
    LForm.lbl_adicional.Text := '3';

    try
      if not LForm.QcodCPC.Active then
        LForm.QcodCPC.Open;
    except
      on E: Exception do
        Exit;
    end;

    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmMain.grid_RecursosMouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
var
  Col, Row: Integer;
begin
  if Button <> TMouseButton.mbLeft then
    Exit;

  FMouseDown := True;
  FDragging := False;
  FBlockSelection := False;
  FDownPos := PointF(X, Y);
  FDownRow := -1;

  // Detectar celda real (tu método es correcto)
  if HitTestFNCGridCell(PointF(X, Y), Col, Row) and IsDataRow(Row) then
  begin
    FDownRow := Row;

    // 🔑 SI hay multiselección activa → bloquear selección
    if (grid_Recursos.Selection.StartRow >= 0) and
      (grid_Recursos.Selection.EndRow > grid_Recursos.Selection.StartRow) then
      FBlockSelection := True;
  end;
end;

procedure TfrmMain.grid_RecursosMouseMove(
  Sender: TObject;
  Shift: TShiftState;
  X, Y: Single);
var
  dist: Single;
begin
  if not FMouseDown then
    Exit;

  // Si ya no está pulsado el botón izquierdo → reset total
  if not (ssLeft in Shift) then
  begin
    FMouseDown := False;
    FDragging := False;
    FBlockSelection := False;
    Exit;
  end;

  if FDragging then
    Exit;

  // Mientras Ctrl o Shift estén pulsados → NO drag
  if (ssCtrl in Shift) or (ssShift in Shift) then
    Exit;

  dist := Sqrt(Sqr(X - FDownPos.X) + Sqr(Y - FDownPos.Y));
  if dist < DRAG_THRESHOLD then
    Exit;

  if grid_Recursos.Selection.StartRow < 0 then
    Exit;

  FDragging := True;
  StartDragFromSelection;
end;

procedure TfrmMain.grid_RecursosMouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  if Button <> TMouseButton.mbLeft then
    Exit;

  FMouseDown := False;
  FDragging := False;
  FBlockSelection := False;
end;

procedure TfrmMain.grid_RecursosMouseLeave(Sender: TObject);
begin
  FMouseDown := False;
  FDragging := False;
  FBlockSelection := False;
  FDownRow := -1;
end;

procedure TfrmMain.grid_RecursosSelectCell(Sender: TObject; ACol, ARow: Integer;
  var Allow: Boolean);
begin
  if FBlockSelection then
  begin
    Allow := False;
    Exit;
  end;

  recurso_activo := grid_Recursos.Cells[1, ARow];
end;

/// <summary>
/// Asigna o modifica valores de propiedades en grid_stakesAsignadosColumnSize.
/// </summary>
procedure TfrmMain.grid_stakesAsignadosCellClick(Sender: TObject; ACol,
  ARow: Integer);
begin
  grid_stakesAsignados.Options.Editing.Enabled := False;
  if (ACol = 6) and (ARow > 0) then
  begin
    grid_stakesAsignados.Options.Editing.Enabled := True;
    grid_stakesAsignados.CellEdit;
  end;
end;

procedure TfrmMain.grid_stakesAsignadosCellEditDone(Sender: TObject; ACol,
  ARow: Integer; CellEditor: TTMSFNCGridEditor);
var
  Texto: string;
  AnchoNecesario: Single;
begin
  if ACol <> 6 then
    Exit;
  // 1. Ocultar primero
  HideCol(frmMain.grid_stakesAsignados, 7);

  // 2. Ajustar contenido
  FitCols(frmMain.grid_stakesAsignados, [0, 1, 2, 3, 4, 5, 6, 8, 9, 10], 15);

  // 3. Repartir el espacio restante
  FillCols(frmMain.grid_stakesAsignados, [2, 3, 4]);
end;

procedure TfrmMain.grid_stakesAsignadosColumnSize(Sender: TObject;
  ACol: Integer; var NewWidth: Single);
begin
  if (ACol > -1) and (ACol < 6) then
  begin
    if NewWidth < 50 then
      NewWidth := 50;
  end;
end;

procedure TfrmMain.grid_stakesAsignadosKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
var
  posgrid: Integer;
  fingrid: Integer;
  X: Integer;
  rolAsignado: string;
begin
  if Key = vkDelete then
  begin
    posgrid := grid_stakesAsignados.Selection.StartRow;
    if posgrid > 0 then
    begin
      if realizarPreguntaSiNo('¿Eliminar Stakeholder?') = mrOK then
      begin
        for X := 1 to grid_stakesAsignados.RowCount - 1 do
        begin
          if grid_stakesAsignados.RowSelect[X] then
          begin
            rolAsignado := grid_stakesAsignados.cells[1, X];
            grid_stakesAsignados.DeleteRow(posgrid);
          end;
        end;
        for X := 1 to grid_stakesAsignados.RowCount - 1 do
        begin
          grid_stakesAsignados.cells[0, X] :=
            ponerCerosInicio(IntToStr(X), 2);
        end;
      end;
    end;
  end;
end;

procedure TfrmMain.grid_stakesAsignadosMouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  FMouseDown := True;
end;

/// <summary>
/// Asigna o modifica valores de propiedades en grid_stakesAsignadosMouseLeave.
/// </summary>
procedure TfrmMain.grid_stakesAsignadosMouseLeave(Sender: TObject);
begin
  FMouseDown := False;
end;

/// <summary>
/// Implementa la lógica principal de grid_stakesDisponiblesColumnSize.
/// </summary>
procedure TfrmMain.grid_stakesDisponiblesColumnSize(Sender: TObject;
  ACol: Integer; var NewWidth: Single);
begin
  if (ACol > -1) and (ACol < 5) then
  begin
    if NewWidth < 50 then
      NewWidth := 50;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de imgReferencialClick.
/// </summary>
procedure TfrmMain.imgReferencialClick(Sender: TObject);
begin
  addImagenesReferencia;
end;

/// <summary>
/// Manejador del evento OnClick de lbl6Click.
/// </summary>
procedure TfrmMain.lbl6Click(Sender: TObject);
begin
  registrarUsuario();
end;

procedure TfrmMain.lbl9Click(Sender: TObject);
begin
  OpenURLInBrowser(URL_POLITICA_PRIVACIDAD);
end;

/// <summary>
/// Manejador del evento OnClick de lbl_56Click.
/// </summary>
procedure TfrmMain.lbl_56Click(Sender: TObject);
begin
  ItemTanteo.codApu := '-1';
end;

/// <summary>
/// Manejador del evento OnClick de lbl_73Click.
/// </summary>
procedure TfrmMain.lbl_73Click(Sender: TObject);
begin
  seleccionOPC(4);
end;

/// <summary>
/// Manejador del evento OnClick de lbl_FpolCuadrillaClick.
/// </summary>
procedure TfrmMain.lbl_FpolCuadrillaClick(Sender: TObject);
var
  uClipBoard: IFMXExtendedClipboardService;
begin
  if lbl_FpolCuadrilla.Text <> '' then
  begin
    if TPlatformServices.Current.SupportsPlatformService
      (IFMXExtendedClipboardService, uClipBoard) then
    begin
      uClipBoard.SetClipboard(lbl_FpolCuadrilla.Text);
      MuestraMensajeGiproy('Información',
        'Formula Polinomica Cuadrilla copiada al portapapeles');
    end;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de lbl_FpolGeneralClick.
/// </summary>
procedure TfrmMain.lbl_FpolGeneralClick(Sender: TObject);
var
  uClipBoard: IFMXExtendedClipboardService;
begin
  if lbl_FpolGeneral.Text <> '' then
  begin
    if TPlatformServices.Current.SupportsPlatformService
      (IFMXExtendedClipboardService, uClipBoard) then
    begin
      uClipBoard.SetClipboard(lbl_FpolGeneral.Text);
      MuestraMensajeGiproy('Información',
        'Formula Polinomica copiada al portapapeles');
    end;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de lbl_olvidoClick.
/// </summary>
procedure TfrmMain.lbl_olvidoClick(Sender: TObject);
begin
  hacerPregunta('¿Email de recuperación?', 'Recuperar Password', '3', '', nil);
end;

/// <summary>
/// Implementa la lógica principal de ResetPassword.
/// </summary>
procedure TfrmMain.limpiaGlowOPCPresupuestos();
begin
  iGlow_OPC2_CrearPresupuesto.Enabled := False;
  iGlow_OPC2_HistoricoPresupuestos.Enabled := False;
end;

/// <summary>
/// Carga datos o configura el estado inicial en loadMapHtml.
/// </summary>
procedure TfrmMain.loadMapHtml;
const
  HTMLMap: string = '<!DOCTYPE html>' + '<html>' + '<head>' +
    '<meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>'
    + '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>'
    + '<style>#map { height: 100vh; width: 100%; margin: 0; padding: 0; } body { margin: 0; }</style>'
    + '</head>' + '<body>' + '<div id="map"></div>' + '<script>' +
    'var map = L.map("map").setView([0, 0], 2);' +
    'L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {' +
    '  attribution: "© OpenStreetMap contributors"' + '}).addTo(map);' +
    'var marker;' +

  // Función para recibir coordenadas desde Delphi
  'function setCoordinatesFromApp(lat, lng) {' +
    '  if (marker) { map.removeLayer(marker); }' +
    '  marker = L.marker([lat, lng]).addTo(map);' +
    '  map.setView([lat, lng], 15);' + '}' +

  // Captura de clic en el mapa
  'map.on("click", function(e) {' + '  var lat = e.latlng.lat.toFixed(6);' +
    '  var lng = e.latlng.lng.toFixed(6);' +
    '  if (marker) { map.removeLayer(marker); }' +
    '  marker = L.marker([lat, lng]).addTo(map);' +

  // Envío de coordenadas a Delphi vía WebView2
  '  if (window.chrome && window.chrome.webview) {' +
    '    window.chrome.webview.postMessage("COORD:" + lat + "," + lng);' + '  }'
    + '});' + '</script>' + '</body>' + '</html>';
begin
  webBrowser_1.LoadHTML(HTMLMap);
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB32ActualizarMouseEnter.
/// </summary>
procedure TfrmMain.lv_APUSCategoriaChange(Sender: TObject);
var
  AItem: TListViewItem;
begin
  AItem := lv_APUSCategoria.Items[lv_APUSCategoria.ItemIndex];
  if Assigned(AItem) then
  begin
    CategoriaAPUSeleccionada := AItem.Text;
    codCategoriaAPUSeleccionada := AItem.Detail;
    refrescalistaAPUsDisponibles();
    limpia_APUSVisor();
  end;
  AjustaGridAutomatico(grid_APUSRecursos, 2);
end;

procedure TfrmMain.lv_APUSCategoriaDragDrop(
  Sender: TObject; const Data: TDragObject; const Point: TPointF);
var
  JSONStr: string;
  JSONRoot: TJSONObject;
  JSONArray: TJSONArray;
  ItemObj: TJSONObject;
  I: Integer;
  DropItem: TListViewItem;
  CategoriaDrop: string;
  CodAPUSCompleto, CodSubCategoriaOrigen: string;
begin
  if not Data.Data.IsType<string> then
    Exit;

  JSONStr := Data.Data.AsType<string>;

  JSONRoot := TJSONObject.ParseJSONValue(JSONStr) as TJSONObject;
  if JSONRoot = nil then
    Exit;

  try
    DropItem := GetItemAt(Point, lv_APUSCategoria);
    if not Assigned(DropItem) then
      Exit;

    CategoriaDrop := DropItem.Detail;

    JSONArray := JSONRoot.GetValue('CambioAPUS') as TJSONArray;
    if JSONArray = nil then
      Exit;

    for I := 0 to JSONArray.Count - 1 do
    begin
      ItemObj := JSONArray.Items[I] as TJSONObject;
      if ItemObj = nil then
        Continue;

      CodAPUSCompleto := ItemObj.GetValue('codAPUSCompleto').Value;

      // ⚠️ daDatoCodigo usa regex → protégelo
      try
        CodSubCategoriaOrigen := daDatoCodigo(CodAPUSCompleto, 2);
      except
        Exit; // ⛔ no seguir jamás
      end;

      if CodSubCategoriaOrigen <> CategoriaDrop then
      begin
        try
          mueveAPUS(CategoriaDrop, CodAPUSCompleto);
        except
          // ⛔ ERROR SQL → cancelar TODO
          Exit;
        end;
      end;
    end;

    // ✅ SOLO SI TODO FUE BIEN
    codCategoriaAPUSeleccionada := CategoriaDrop;
    posicionaAPUSCategoria(codCategoriaAPUSeleccionada);
    refrescalistaAPUsDisponibles;
    limpia_APUSVisor;

  finally
    JSONRoot.Free;
  end;
end;

procedure TfrmMain.lv_APUSCategoriaDragOver(Sender: TObject; const Data:
  TDragObject; const Point: TPointF;
  var Operation: TDragOperation);
begin
  // Aceptar SOLO si el drag trae un string (JSON serializado)
  if Data.Data.IsType<string> then
    Operation := TDragOperation.Move
  else
    Operation := TDragOperation.None;
end;

procedure TfrmMain.lv_APUSCategoriaItemClick(const Sender: TObject;
  const AItem: TListViewItem);
var
  tmpdbl: Double;
begin
  CategoriaAPUSeleccionada := AItem.Text;
  codCategoriaAPUSeleccionada := AItem.Detail;
  refrescalistaAPUsDisponibles();
  limpia_APUSVisor();
  tmpdbl := grid_APUSRecursos.Width;
  AjustaGridAutomatico(grid_APUSRecursos, 2);
end;

/// <summary>
/// Devuelve información calculada o consultada en GetItemAt.
/// </summary>
procedure TfrmMain.lvOPCRec1DragDrop(Sender: TObject; const Data: TDragObject;
  const Point: TPointF);
begin
  LVRecDragDropUnificado(Sender, Data, Point);
end;

procedure TfrmMain.lvOPCRec1DragOver(Sender: TObject; const Data: TDragObject;
  const Point: TPointF; var Operation: TDragOperation);
begin
  Operation := TDragOperation.None;

  if (Data.Source <> nil) and (Data.Source is TDragPayload) then
    Operation := TDragOperation.Move; // 🔑 MOVE, no COPY
end;

procedure TfrmMain.lvOPCRec1ItemClick(const Sender: TObject;
  const AItem: TListViewItem);
begin
  LVOpcSelecciona(1);
end;

/// <summary>
/// Implementa la lógica principal de lvOPCRec2DragOver.
/// </summary>
procedure TfrmMain.lvOPCRec2DragDrop(Sender: TObject; const Data: TDragObject;
  const Point: TPointF);
begin
  LVRecDragDropUnificado(Sender, Data, Point);
end;

procedure TfrmMain.lvOPCRec2DragOver(Sender: TObject; const Data: TDragObject;
  const Point: TPointF; var Operation: TDragOperation);
begin
  Operation := TDragOperation.None;

  // Validación mínima y estable
  if (Data.Source <> nil) and (Data.Source is TDragPayload) then
    Operation := TDragOperation.Move;
end;

procedure TfrmMain.lvOPCRec2ItemClick(const Sender: TObject;
  const AItem: TListViewItem);
begin
  LVOpcSelecciona(2);
end;

/// <summary>
/// Implementa la lógica principal de lvOPCRec3DragOver.
/// </summary>
procedure TfrmMain.lvOPCRec3DragDrop(Sender: TObject; const Data: TDragObject;
  const Point: TPointF);
begin
  LVRecDragDropUnificado(Sender, Data, Point);
end;

procedure TfrmMain.lvOPCRec3DragOver(Sender: TObject; const Data: TDragObject;
  const Point: TPointF; var Operation: TDragOperation);
begin
  Operation := TDragOperation.None;

  // Validación mínima y estable
  if (Data.Source <> nil) and (Data.Source is TDragPayload) then
    Operation := TDragOperation.Move;
end;

procedure TfrmMain.lvOPCRec3ItemClick(const Sender: TObject;
  const AItem: TListViewItem);
begin
  LVOpcSelecciona(3);
end;

/// <summary>
/// Implementa la lógica principal de lvOPCRec4DragOver.
/// </summary>
procedure TfrmMain.lvOPCRec4DragDrop(Sender: TObject; const Data: TDragObject;
  const Point: TPointF);
begin
  LVRecDragDropUnificado(Sender, Data, Point);
end;

procedure TfrmMain.lvOPCRec4DragOver(Sender: TObject; const Data: TDragObject;
  const Point: TPointF; var Operation: TDragOperation);
begin
  Operation := TDragOperation.None;

  // Validación mínima y estable
  if (Data.Source <> nil) and (Data.Source is TDragPayload) then
    Operation := TDragOperation.Move;
end;

procedure TfrmMain.lvOPCRec4ItemClick(const Sender: TObject;
  const AItem: TListViewItem);
begin
  LVOpcSelecciona(4);
end;

procedure TfrmMain.LVOpcSelecciona(opcion: Integer);
const
  MAX_ITEMS_VALIDOS = 6; // tu condición: posicion < 6
var
  posicion: Integer;
  valor2: string;
  CodCategoria, CodSubCategoria: string;
  X: Integer;
  LV: TListView;

  // ---------------- HELPERS incrustados ----------------

  function GetLVByOpcion(const AOpcion: Integer; out APos: Integer): TListView;
  begin
    Result := nil;
    APos := -1;

    case AOpcion of
      1:
        begin
          Result := lvOPCRec1;
          APos := lvOPCRec1.ItemIndex;
        end;
      2:
        begin
          Result := lvOPCRec2;
          APos := lvOPCRec2.ItemIndex;
        end;
      3:
        begin
          Result := lvOPCRec3;
          APos := lvOPCRec3.ItemIndex;
        end;
      4:
        begin
          Result := lvOPCRec4;
          APos := lvOPCRec4.ItemIndex;
        end;
      5:
        begin
          Result := lvOPCRec5;
          APos := lvOPCRec5.ItemIndex;
        end;
    end;
  end;

  procedure DeselectAllExcept(const KeepLV: TListView);
  begin
    if (lvOPCRec1 <> nil) and (lvOPCRec1 <> KeepLV) then
    begin
      lvOPCRec1.ItemIndex := -1;
      lvOPCRec1.Repaint;
    end;
    if (lvOPCRec2 <> nil) and (lvOPCRec2 <> KeepLV) then
    begin
      lvOPCRec2.ItemIndex := -1;
      lvOPCRec2.Repaint;
    end;
    if (lvOPCRec3 <> nil) and (lvOPCRec3 <> KeepLV) then
    begin
      lvOPCRec3.ItemIndex := -1;
      lvOPCRec3.Repaint;
    end;
    if (lvOPCRec4 <> nil) and (lvOPCRec4 <> KeepLV) then
    begin
      lvOPCRec4.ItemIndex := -1;
      lvOPCRec4.Repaint;
    end;
    if (lvOPCRec5 <> nil) and (lvOPCRec5 <> KeepLV) then
    begin
      lvOPCRec5.ItemIndex := -1;
      lvOPCRec5.Repaint;
    end;
  end;

  function IsValidIndex(const AListView: TListView; const AIndex: Integer):
      Boolean;
  begin
    Result := (AListView <> nil) and (AIndex >= 0) and (AIndex <
      AListView.Items.Count);
  end;

  function SplitCategoriaSubCategoria(const S: string; out ACat, ASub: string):
      Boolean;
  var
    p: Integer;
  begin
    ACat := '';
    ASub := '';
    p := AnsiPos('_', S);
    Result := p > 0;
    if Result then
    begin
      ACat := Copy(S, 1, p - 1);
      ASub := Copy(S, p + 1, MaxInt);
    end;
  end;

  procedure ForceSelectAndRepaint(const AListView: TListView; const AIndex:
    Integer);
  begin
    if AListView = nil then
      Exit;
    AListView.ItemIndex := AIndex;
    AListView.Repaint;
    // fuerza repintado para que se vea naranja (vía OnUpdateObjects)
  end;

  // -----------------------------------------------------

begin
  limpiaGridRecursos;
  categoria_recurso_activo := '';

  LV := GetLVByOpcion(opcion, posicion);
  if not IsValidIndex(LV, posicion) then
    Exit;

  // Asegura selección única visual (los demás se desmarcan)
  DeselectAllExcept(LV);
  ForceSelectAndRepaint(LV, posicion);

  // Toma el valor desde Detail (tu diseño)
  valor2 := LV.Items[posicion].Detail;

  // Mantengo tu regla exacta: (posicion > -1) and (posicion < 6)
  if (posicion > -1) and (posicion < MAX_ITEMS_VALIDOS) then
  begin
    categoria_recurso_activo := valor2;

    if SplitCategoriaSubCategoria(valor2, CodCategoria, CodSubCategoria) then
    begin
      MuestraRecursosGrid(CodCategoria, CodSubCategoria);
      ResaltaPanelOpciones(SafeStrToInt(CodCategoria));
    end;
  end;
end;

procedure TfrmMain.LVRecDragDropUnificado(Sender: TObject; const Data:
  TDragObject; const Point: TPointF);
var
  JsonObj: System.JSON.TJSONObject;
  LV: TListView;
  DropItem: TListViewItem;
  ArrMsg: System.JSON.TJSONArray;
  ObjMsg: System.JSON.TJSONObject;
  CategoriaDrop: string;
  CodCategoria, CodSubCategoria: string;
  CodRecursoCompleto, CodUnicoRecurso: string;
  i: Integer;
  valor2: string;
  posicion: integer;

  function SplitCategoriaSubCategoria(const S: string; out ACat, ASub: string):
      Boolean;
  var
    p: Integer;
  begin
    ACat := '';
    ASub := '';
    p := AnsiPos('_', S);
    Result := p > 0;
    if Result then
    begin
      ACat := Copy(S, 1, p - 1);
      ASub := Copy(S, p + 1, MaxInt);
    end;
  end;

  procedure SelectListViewItem(LV: TListView; Item: TListViewItem);
  begin
    if (LV = nil) or (Item = nil) then
      Exit;

    LV.BeginUpdate;
    try
      LV.Selected := Item;
      LV.ItemIndex := Item.Index;
    finally
      LV.EndUpdate;
    end;

    LV.Repaint;
  end;

begin
  if not (Data.Source is TDragPayload) then
    Exit;

  LV := TListView(Sender);

  codCategoria := rightstr(LV.Name, 1);

  // 🔑 reconstruir JSON desde TEXTO (siempre válido)
  JsonObj := TJSONObject.ParseJSONValue(
    TDragPayload(Data.Source).JsonText
    ) as TJSONObject;

  if JsonObj = nil then
    Exit;

  try
    if not JsonObj.TryGetValue<TJSONArray>('CambioRecurso', ArrMsg) then
      Exit;

    DropItem := GetListViewItemAtPoint(LV, Point);
    if DropItem = nil then
      Exit;

    // 🔑 SELECCIONAR VISUALMENTE EL ITEM DESTINO
    SelectListViewItem(LV, DropItem);

    CategoriaDrop := DropItem.Detail.Trim;
    if CategoriaDrop = '' then
      Exit;

    valor2 := categoriaDrop;
    if not SplitCategoriaSubcategoria(valor2, codCategoria, categoriaDrop) then
      exit;

    for i := 0 to ArrMsg.Count - 1 do
    begin
      ObjMsg := ArrMsg.Items[i] as TJSONObject;
      codRecursoCompleto := ObjMsg.GetValue<string>('codRecursoCompleto');
      codUnicoRecurso := ObjMsg.GetValue<string>('codUnicoRecurso');
      MueveRecurso(codRecursoCompleto, codUnicoRecurso, CategoriaDrop);
    end;

    MuestraRecursosGrid(CodCategoria, categoriaDrop);
    ResaltaPanelOpciones(SafeStrToInt(CodCategoria));

  finally
    JsonObj.Free;
  end;
end;

procedure TfrmMain.StartDragFromSelection;
var
  ddService: IFMXDragDropService;
  d: TDragObject;
  JsonMsg, ObjMsg: TJSONObject;
  ArrMsg: TJSONArray;
  i: Integer;
  codCompleto, codUnico: string;
begin
  if not TPlatformServices.Current.SupportsPlatformService(
    IFMXDragDropService, ddService) then
    Exit;

  FreeAndNil(FDragPayload);

  JsonMsg := TJSONObject.Create;
  ArrMsg := TJSONArray.Create;
  JsonMsg.AddPair('CambioRecurso', ArrMsg);

  // 🔑 AQUÍ ESTÁ LA CLAVE
  for i := grid_recursos.selection.StartRow to grid_recursos.selection.EndRow do
  begin
    if not grid_Recursos.RowSelect[i] then
      Continue;

    codCompleto := grid_Recursos.Cells[1, i].Trim;
    codUnico := grid_Recursos.Cells[9, i].Trim;

    if (codCompleto = '') or (codUnico = '') then
      Continue;

    ObjMsg := TJSONObject.Create;
    ObjMsg.AddPair('codRecursoCompleto', codCompleto);
    ObjMsg.AddPair('codUnicoRecurso', codUnico);
    ArrMsg.AddElement(ObjMsg);
  end;

  if ArrMsg.Count = 0 then
  begin
    JsonMsg.Free;
    Exit;
  end;

  FDragPayload := TDragPayload.Create(JsonMsg);

  FillChar(d, SizeOf(d), 0);
  d.Source := FDragPayload;

  ddService.BeginDragDrop(Self, d, FDragBitmap);
end;

function TfrmMain.TryParseCategoriaDrop(const CategoriaDrop: string;
  out CodCategoria, CodSubCategoria: string): Boolean;
var
  P: Integer;
  S: string;
begin
  CodCategoria := '';
  CodSubCategoria := '';
  S := CategoriaDrop.Trim;

  P := Pos('_', S);
  if P <= 1 then
    Exit(False);

  CodCategoria := Trim(Copy(S, 1, P - 1));
  CodSubCategoria := Trim(Copy(S, P + 1, MaxInt));

  Result := (CodCategoria <> '') and (CodSubCategoria <> '');
end;

function TfrmMain.GetListViewItemAtPoint(LV: TListView; const P: TPointF)
  : TListViewItem;
begin
  // Si ya tienes GetItemAt(Point, lvOPCRecX), crea esta versión y dentro llama a tu función
  Result := GetItemAt(P, LV);
end;

procedure TfrmMain.grdpnlyt311Click(Sender: TObject);
begin

end;

/// <summary>
/// Implementa la lógica principal de lvOPCRec5DragOver.
/// </summary>
procedure TfrmMain.lvOPCRec5DragDrop(Sender: TObject; const Data: TDragObject;
  const Point: TPointF);
begin
  LVRecDragDropUnificado(Sender, Data, Point);
end;

procedure TfrmMain.lvOPCRec5DragOver(Sender: TObject; const Data: TDragObject;
  const Point: TPointF; var Operation: TDragOperation);
begin
  Operation := TDragOperation.None;

  // Validación mínima y estable
  if (Data.Source <> nil) and (Data.Source is TDragPayload) then
    Operation := TDragOperation.Move;
end;

procedure TfrmMain.lvOPCRec5ItemClick(const Sender: TObject;
  const AItem: TListViewItem);
begin
  LVOpcSelecciona(5);
end;

/// <summary>
/// Gestiona operaciones relacionadas con APU en lv_APUSCategoriaChange.
/// </summary>
procedure TfrmMain.lyt_19MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  frmMain.StartWindowDrag;
end;

/// <summary>
/// Implementa la lógica principal de lyt_24MouseDown.
/// </summary>
procedure TfrmMain.lyt_24MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  frmMain.StartWindowResize;
end;

/// <summary>
/// Implementa la lógica principal de lyt_62MouseDown.
/// </summary>
procedure TfrmMain.lyt_62MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  frmMain.StartWindowResize;
end;

/// <summary>
/// Implementa la lógica principal de lyt_68Resized.
/// </summary>
procedure TfrmMain.lyt_68Resized(Sender: TObject);
begin
  if lyt_68.Width < 255 then
    lyt_68.Width := 255;
end;

/// <summary>
/// Implementa la lógica principal de lyt_BodySincronizaryBackupResize.
/// </summary>
procedure TfrmMain.lyt_BodySincronizaryBackupResize(Sender: TObject);
var
  X: Double;
begin
  X := trunc(lyt_BodySincronizaryBackup.Width / 2);
  lyt_Sincronizar.Width := X;
  lyt_Respaldo.Width := lyt_BodySincronizaryBackup.Width - X;
end;

/// <summary>
/// Implementa la lógica principal de lyt_cronoPresupuestoResize.
/// </summary>
procedure TfrmMain.lyt_cronoPresupuestoResize(Sender: TObject);
begin
  lyt_totalesCrono.Width := lyt_cronoPresupuesto.Width;
end;

/// <summary>
/// Implementa la lógica principal de lyt_gridSubCategoriasResize.
/// </summary>
procedure TfrmMain.lyt_gridSubCategoriasResize(Sender: TObject);
begin
  grid_PresupuestosSubCategoria.Columns[0].Width :=
    lyt_gridSubCategorias.Width - 10;
end;

/// <summary>
/// Manejador del evento OnClick de lyt_OPCGrupoClick.
/// </summary>
procedure TfrmMain.lyt_OPCGrupoClick(Sender: TObject);
begin
  posicionOPC_OtrosServicios(1);
end;

/// <summary>
/// Manejador del evento de ratón en lyt_OPCGrupoMouseEnter.
/// </summary>
procedure TfrmMain.lyt_OPCGrupoMouseEnter(Sender: TObject);
begin
  if iGlow_Grupo.GlowColor <> $FFE94E00 then
    iGlow_Grupo.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de lyt_OPCGrupoMouseLeave.
/// </summary>
procedure TfrmMain.lyt_OPCGrupoMouseLeave(Sender: TObject);
begin
  if iGlow_Grupo.GlowColor <> $FFE94E00 then
    iGlow_Grupo.Enabled := False;
end;

procedure TfrmMain.lyt_OPCRec1Click(Sender: TObject);
begin

end;

/// <summary>
/// Gestiona operaciones relacionadas con APU en lyt_PresupuestoAPUSResize.
/// </summary>
procedure TfrmMain.lyt_OPCSincronizarClick(Sender: TObject);
begin
  posicionOPC_OtrosServicios(2);
end;

/// <summary>
/// Manejador del evento de ratón en lyt_OPCSincronizarMouseEnter.
/// </summary>
procedure TfrmMain.lyt_OPCSincronizarMouseEnter(Sender: TObject);
begin
  if iGlow_Sincronizar.GlowColor <> $FFE94E00 then
    iGlow_Sincronizar.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de lyt_OPCSincronizarMouseLeave.
/// </summary>
procedure TfrmMain.lyt_OPCSincronizarMouseLeave(Sender: TObject);
begin
  if iGlow_Sincronizar.GlowColor <> $FFE94E00 then
    iGlow_Sincronizar.Enabled := False;
end;

/// <summary>
/// Manejador del evento OnClick de lyt_OPCVariosClick.
/// </summary>
procedure TfrmMain.lyt_OPCTiendaClick(Sender: TObject);
begin
  posicionOPC_OtrosServicios(4);
end;

/// <summary>
/// Manejador del evento de ratón en lyt_OPCTiendaMouseEnter.
/// </summary>
procedure TfrmMain.lyt_OPCTiendaMouseEnter(Sender: TObject);
begin
  if iGlow_Varios.GlowColor <> $FFE94E00 then
    iGlow_Varios.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de lyt_OPCTiendaMouseLeave.
/// </summary>
procedure TfrmMain.lyt_OPCTiendaMouseLeave(Sender: TObject);
begin
  if iGlow_Varios.GlowColor <> $FFE94E00 then
    iGlow_Varios.Enabled := False;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem12Click.
/// </summary>
procedure TfrmMain.lyt_OPCVariosClick(Sender: TObject);
begin
  posicionOPC_OtrosServicios(4);
end;

/// <summary>
/// Manejador del evento de ratón en lyt_OPCVariosMouseEnter.
/// </summary>
procedure TfrmMain.lyt_OPCVariosMouseEnter(Sender: TObject);
begin
  if iGlow_Suscripciones.GlowColor <> $FFE94E00 then
    iGlow_Suscripciones.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de lyt_OPCVariosMouseLeave.
/// </summary>
procedure TfrmMain.lyt_OPCVariosMouseLeave(Sender: TObject);
begin
  if iGlow_Suscripciones.GlowColor <> $FFE94E00 then
    iGlow_Suscripciones.Enabled := False;
end;

/// <summary>
/// Manejador del evento OnClick de lyt_OPCTiendaClick.
/// </summary>
procedure TfrmMain.lyt_PresupuestoAPUSResize(Sender: TObject);
var
  tWidth: Double;
begin
  tWidth := lyt_PresupuestoAPUS.Width;
  tWidth := tWidth - 210 - 10;
  if tWidth > 135 then
    grid_PresupuestosAPUS.Columns[0].Width := tWidth;
end;

/// <summary>
/// Implementa la lógica principal de lyt_PresupuestosOpciones1Resize.
/// </summary>
procedure TfrmMain.lyt_PresupuestosOpciones1Resize(Sender: TObject);
begin
  if lyt_PresupuestosOpciones1.Width < 290 then
    lyt_PresupuestosOpciones1.Width := 290;
end;

/// <summary>
/// Manejador del evento OnClick de lyt_OPCSincronizarClick.
/// </summary>
procedure TfrmMain.MenuItem12Click(Sender: TObject);
begin
  AdicionaItem();
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem13Click.
/// </summary>
procedure TfrmMain.MenuItem13Click(Sender: TObject);
var
  codCategoriaRecursos: string;
  codSubCategoriaRecursos: string;
  LForm: TfrmNuevoRecurso;
begin
  LForm := TfrmNuevoRecurso.Create(Application);
  try
    codCategoriaRecursos := daCodigoCategoriaRecursos;
    if codCategoriaRecursos <> '0' then
    begin
      codSubCategoriaRecursos := daCodigoSubCategoriaRecursos
        (codCategoriaRecursos);
      if codSubCategoriaRecursos <> '0' then
      begin
        IniciaNuevoRecurso(LForm);
        LForm.lbl_banner1.Text := 'Nuevo Recurso';
        LForm.lbl_banner2.Text := 'Creación de Nuevo Recurso';
        LForm.lbl_modo.Text := 'nuevo';
        LForm.edt_descripcion.Text := '';
        LForm.lbl_codCategoria.Text := codCategoriaRecursos;
        LForm.lbl_codSubCategoria.Text := codSubCategoriaRecursos;
        LForm.edt_descripcion.SetFocus;
        LForm.populaUnidadesRecursos(codCategoriaRecursos);
        LForm.ShowModal;
      end
      else
      begin
        MuestraMensajeGiproy('Advertencia',
          'Seleccione la categoria / Subcategoria padre');
      end;
    end
    else
    begin
      MuestraMensajeGiproy('Advertencia',
        'Seleccione la categoria / Subcategoria padre');
    end;
  finally
    LForm.Free;
  end;
end;

procedure TfrmMain.ImportarRecursosPortapapeles;
var
  Datos: TArray<string>;
  LForm: TfrmNuevoRecurso;
  i: Integer;
  Columnas: TArray<string>;
  codCategoriaRecursos, codSubCategoriaRecursos: string;

  function GetCol(const Arr: TArray<string>; Idx: Integer): string;
  begin
    if (Idx >= 0) and (Idx < Length(Arr)) then
      Result := Arr[Idx].Trim
    else
      Result := '';
  end;

  procedure EnsureCols(var Arr: TArray<string>; MinCols: Integer);
  var
    oldLen, J: Integer;
  begin
    oldLen := Length(Arr);
    if oldLen >= MinCols then
      Exit;
    SetLength(Arr, MinCols);
    for J := oldLen to MinCols - 1 do
      Arr[J] := '';
  end;

  function LineaUtil(const S: string): Boolean;
  var
    t: string;
  begin
    t := S.Trim;
    // descarta vacío o solo tabs
    Result := (t <> '') and (t <> #9) and (t.Replace(#9, '').Trim <> '');
  end;

begin
  ClipboardToStringArrayFMX(Datos);

  codCategoriaRecursos := daCodigoCategoriaRecursos;

  if Length(Datos) < 1 then
    Exit;

  if codCategoriaRecursos = '0' then
    Exit;

  codSubCategoriaRecursos := daCodigoSubCategoriaRecursos(codCategoriaRecursos);
  if codSubCategoriaRecursos = '0' then
    Exit;

  LForm := TfrmNuevoRecurso.Create(Application);
  try
    LForm.lbl_codCategoria.Text := codCategoriaRecursos;
    LForm.lbl_codSubCategoria.Text := codSubCategoriaRecursos;

    // Cargar unidades una sola vez (ajusta el parámetro si tu método espera subcategoría)
    LForm.populaUnidadesRecursos(codCategoriaRecursos);

    LForm.lbl_modo.Text := 'nuevo';
    LForm.Automatico := True; // usa property/campo correcto

    for i := 0 to High(Datos) do
    begin
      if not LineaUtil(Datos[i]) then
        Continue;

      Columnas := Datos[i].Split([#9]);

      // si Split devuelve 0, lo convertimos en 4 vacías
      EnsureCols(Columnas, 4);

      // si no hay descripción, no intentes guardar
      if GetCol(Columnas, 0) = '' then
        Continue;

      LForm.edt_descripcion.Text := GetCol(Columnas, 0);
      PosicionaComboEx(LForm.cbb_UTiempos, GetCol(Columnas, 1));
      LForm.edt_precio.Text := NormalizaDecimalTexto(GetCol(Columnas, 2));
      LForm.edt_codCPC.Text := GetCol(Columnas, 3);

      // NO llames OnClick. Llama a un método real.
      LForm.ProcesarAceptar;
    end;

  finally
    MuestraRecursosGrid(codCategoriaRecursos, codSubCategoriaRecursos);
    LForm.Free;
  end;
end;

procedure TfrmMain.ImportarAPUsPortapapeles();
var
  Datos: TArray<string>;
  Columnas: TArray<string>;
  codCategoriaAPU, CategoriaAPU: string;
  i: integer;
  DescripcionAPU, UnidadAPU: string;
  qry: TUniquery;

  function GetCol(const Arr: TArray<string>; Idx: Integer): string;
  begin
    if (Idx >= 0) and (Idx < Length(Arr)) then
      Result := Arr[Idx].Trim
    else
      Result := '';
  end;

  procedure EnsureCols(var Arr: TArray<string>; MinCols: Integer);
  var
    oldLen, J: Integer;
  begin
    oldLen := Length(Arr);
    if oldLen >= MinCols then
      Exit;
    SetLength(Arr, MinCols);
    for J := oldLen to MinCols - 1 do
      Arr[J] := '';
  end;

  function LineaUtil(const S: string): Boolean;
  var
    t: string;
  begin
    t := S.Trim;
    // descarta vacío o solo tabs
    Result := (t <> '') and (t <> #9) and (t.Replace(#9, '').Trim <> '');
  end;
begin
  ClipboardToStringArrayFMX(Datos);
  if codCategoriaAPUSeleccionada.Trim = '' then
  begin
    MuestraMensajeGiproy('Advertencia', 'Sin categoría asiganada');
    exit;
  end;
  if Length(Datos) < 1 then
  begin
    MuestraMensajeGiproy('Advertencia', 'Sin datos que importar');
    Exit;
  end;

  for i := 0 to High(datos) do
  begin
    if not LineaUtil(Datos[i]) then
      Continue;

    Columnas := Datos[i].Split([#9]);

    // si Split devuelve 0, lo convertimos en 4 vacías
    EnsureCols(Columnas, 2);

    // si no hay descripción, no intentes guardar
    if GetCol(Columnas, 0) = '' then
      Continue;
    descripcionAPU := GetCol(Columnas, 0);
    UnidadAPU := GetCol(Columnas, 1);
    qry := TUniquery.Create(nil);
    try
      with qry do
      begin
        connection := DModule_1.con2;
        close;
        SQL.Clear;
        SQL.Text :=
          'CALL crearAPUUnico(:p_codCategoriaAPU, :p_descripcion, :p_unidad, :p_codBase)';

        ParamByName('p_codCategoriaAPU').AsString :=
          codCategoriaAPUSeleccionada;
        ParamByName('p_descripcion').AsString := DescripcionAPU;
        ParamByName('p_unidad').AsString := UnidadAPU;
        ParamByName('p_codBase').AsString := base_activa.codBase;

        ExecSQL;
      end;
    finally
      qry.free;
    end;
  end;
  refrescalistaAPUsDisponibles();
  limpia_APUSVisor();
  AjustaGridAutomatico(grid_APUSRecursos, 2);
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem14Click.
/// </summary>
procedure TfrmMain.MenuItem14Click(Sender: TObject);
begin
  rect_SUB33Duplicar.OnClick(rect_SUB33Duplicar);
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem15Click.
/// </summary>
procedure TfrmMain.MenuItem15Click(Sender: TObject);
begin
  rect_SUB34Duplicar.OnClick(rect_SUB34Duplicar);
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem16Click.
/// </summary>
procedure TfrmMain.MenuItem16Click(Sender: TObject);
var
  codApu: string;
  posicion: Integer;
  i: Integer;
  LForm: TfrmAddAPU;
begin
  try
    posicion := grid_APUSRecursos.Selection.StartRow;
    if posicion > 0 then
    begin
      LForm := TfrmAddAPU.Create(Application);
      try
        codApu := grid_APUSRecursos.cells[9, posicion];
        contieneTanteos(codAPU);
        LForm.lbl_modo.Text := '';
        LForm.limpiaNuevaAPUs();
        LForm.actualizaListadoAPUSubcategoria;
        LForm.lbl_modo.Text := '2';
        LForm.cargaAPUEdicion(codApu);
        LForm.lbl_titulo1.Text := 'Editar APU';
        LForm.lbl_titulo2.Text := 'Edición de APU';
        LForm.ShowModal;
        LForm.calculaTotales();
      finally
        LForm.Free;
      end;
    end;
  except
    MuestraMensajeGiproy('Advertencia', 'Elija una APU para editar');
  end;
end;

procedure TfrmMain.MenuItem17Click(Sender: TObject);
begin
  rect_SUB34Borrar.OnClick(rect_SUB34Borrar);
end;

procedure TfrmMain.MenuItem18Click(Sender: TObject);
var
  posicion: Integer;
  LForm: TfrmReemplazar;
begin
  posicion := grid_Recursos.Selection.StartRow;
  if posicion > 0 then
  begin
    LForm := TfrmReemplazar.Create(Application);
    try
      LForm.lbl_banner1.Text := 'Reemplazar Recurso en DB';
      LForm.lbl_banner2.Text := 'Recurso para Reemplazar: ' +
        grid_Recursos.cells[2, posicion];
      LForm.lbl_Codigo.Text := grid_Recursos.cells[9, posicion];
      LForm.lbl_Categoria.Text := grid_Recursos.cells[1, posicion];
      LForm.edt_filtro.Text := '';
      LForm.ShowModal;
    finally
      LForm.Free;
    end;
  end;
end;

procedure TfrmMain.MenuItem1Click(Sender: TObject);
var
  tmpstr: string;
  derivacionAsignada: string;
  ARow: Integer;
  LForm: Tfrm_CronoDerivaciones;
begin
  LForm := Tfrm_CronoDerivaciones.Create(Application);
  try
    ARow := grid_crono0.Selected;
    tmpstr := grid_crono0.cells[1, ARow];
    derivacionAsignada := grid_crono0.cells[11, ARow];
    if tmpstr <> '' then
    begin
      LForm.lbl_modo.Text := '1';
    end
    else
    begin
      LForm.lbl_modo.Text := '2';
    end;
    LForm.lbl_TodoProyexto.Visible := False;
    LForm.chkCustom.IsChecked := True;
    LForm.chkHomogenea.IsChecked := False;

    LForm.lbl_codCuenta.Text := IntToStr(ARow);
    LForm.CalculaCronogramaEjecucionObras();
    LForm.cargaDerivacionAsignada(derivacionAsignada);

    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmMain.MenuItem21Click(Sender: TObject);
var
  posicion: Integer;
  idUnicoRecurso: string;
  LForm: TfrmPertenencia;
begin
  posicion := grid_Recursos.Selection.StartRow;
  if posicion > 0 then
  begin
    LForm := TfrmPertenencia.Create(Application);
    try
      idUnicoRecurso := '';
      RellenaPertenencia(idUnicoRecurso, LForm);
      LForm.ShowModal;
    finally
      LForm.Free;
    end;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem22Click.
/// </summary>
procedure TfrmMain.MenuItem22Click(Sender: TObject);
var
  posgrid: Integer;
  nombreStake: string;
  LForm: TfrmRolProyecto;
begin
  posgrid := grid_stakesAsignados.Selection.StartRow;
  if posgrid > 0 then
  begin
    LForm := TfrmRolProyecto.Create(Application);
    try
      nombreStake := Trim(grid_stakesAsignados.cells[2, posgrid]) + ' ' +
        Trim(grid_stakesAsignados.cells[3, posgrid]);
      LForm.lbl_modo.Text := IntToStr(posgrid);
      LForm.lbl_adicional.Text := '1';
      populaRolStake(LForm);
      LForm.ShowModal;
    finally
      LForm.Free;
    end;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem23Click.
/// </summary>
procedure TfrmMain.MenuItem23Click(Sender: TObject);
var
  X: Integer;
  AnySelected: Boolean;
begin
  // Nada seleccionado o solo cabecera
  if (grid_stakesAsignados.RowCount <= 1) then
    Exit;

  // Verifica si hay alguna fila marcada (evita preguntar si no hay nada)
  AnySelected := False;
  for X := 1 to grid_stakesAsignados.RowCount - 1 do
  begin
    if grid_stakesAsignados.RowSelect[X] then
    begin
      AnySelected := True;
      Break;
    end;
  end;

  if not AnySelected then
    Exit;

  if realizarPreguntaSiNo('¿Eliminar Stakeholder?') <> mrOK then
    Exit;

  // Borrar SIEMPRE de abajo hacia arriba para no saltarte filas
  for X := grid_stakesAsignados.RowCount - 1 downto 1 do
  begin
    if grid_stakesAsignados.RowSelect[X] then
      grid_stakesAsignados.DeleteRow(X);
  end;

  // Renumerar
  for X := 1 to grid_stakesAsignados.RowCount - 1 do
    grid_stakesAsignados.Cells[0, X] := ponerCerosInicio(IntToStr(X), 2);

  // Opcional: limpia selección para evitar referencias a filas que ya no existen
  grid_stakesAsignados.ClearSelection;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem24Click.
/// </summary>
procedure TfrmMain.MenuItem24Click(Sender: TObject);
var
  node: TTMSFNCTreeViewNode;
  LForm: TfrmAddEDO;
begin
  node := Trvw_EDO.SelectedNode;
  if Assigned(node) then
  begin
    LForm := TfrmAddEDO.Create(Application);
    try
      LForm.nodoSeleccionado := node;
      LForm.ShowModal;
    finally
      LForm.Free;
    end;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem25Click.
/// </summary>
procedure TfrmMain.MenuItem25Click(Sender: TObject);
var
  AValue: string;
  Descripcion: string;
  nodo, nodoSeleccionado: TTMSFNCTreeViewNode;
begin
  AValue := hacerPregunta('Descripción', 'Hito', '1', '', nil);

  if Trim(AValue) = '' then
    Exit;

  Descripcion := Trim(AValue);

  if Assigned(Trvw_EDO.SelectedNode) then
    nodoSeleccionado := Trvw_EDO.SelectedNode
  else
    nodoSeleccionado := Trvw_EDO.Nodes[0];

  // Si seleccionó un stake, subir al padre (hito)
  if not nodoSeleccionado.Extended then
    nodoSeleccionado := nodoSeleccionado.getParent;

  Trvw_EDO.BeginUpdate;
  try
    // Crear nodo SIN código
    nodo := Trvw_EDO.AddNode(nodoSeleccionado);
    nodo.Extended := True;

    // Solo descripción
    nodo.Text[0] := Descripcion;

    // Renumerar toda la estructura
    RenumerarEstructuraCompleta(Trvw_EDO);

  finally
    Trvw_EDO.EndUpdate;
  end;

  // Guardar después de renumerar
  guardarHitoCompleto(Trvw_EDO);
end;

procedure TfrmMain.MenuItem26Click(Sender: TObject);
begin
  // Importar APUS desde Portapapeles.
  if realizarPreguntaSiNo('¿Desea importar Apu desde portapapeles?' + #13 +
    'El formato debe de ser Descripcion + unidad') <> mrOk then
    Exit;
  ImportarAPUsPortapapeles;
  MuestraMensajeGiproy('Información', 'Importación realizada.');
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem29Click.
/// </summary>
procedure TfrmMain.MenuItem29Click(Sender: TObject);
begin
  AplicarColorNodoEX(Trvw_EDT, Trvw_EDT.SelectedNode, '#FF0007');
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem2Click.
/// </summary>
procedure TfrmMain.MenuItem2Click(Sender: TObject);
begin
  grid_Crono1.CopyToClipboard(True);
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem30Click.
/// </summary>
procedure TfrmMain.MenuItem30Click(Sender: TObject);
begin
  AplicarColorNodoEX(Trvw_EDT, Trvw_EDT.SelectedNode, '#00FF34');
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem31Click.
/// </summary>
procedure TfrmMain.MenuItem31Click(Sender: TObject);
begin
  AplicarColorNodoEX(Trvw_EDT, Trvw_EDT.SelectedNode, '#0034B4')
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem32Click.
/// </summary>
procedure TfrmMain.MenuItem32Click(Sender: TObject);
begin
  AplicarColorNodoEX(Trvw_EDT, Trvw_EDT.SelectedNode, '#FFCB4B');
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem33Click.
/// </summary>
procedure TfrmMain.MenuItem33Click(Sender: TObject);
begin
  AplicarColorNodoEX(Trvw_EDT, Trvw_EDT.SelectedNode, '');
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem34Click.
/// </summary>
procedure TfrmMain.MenuItem34Click(Sender: TObject);
var
  node, subnode: TTMSFNCTreeViewNode;
  Descripcion, codCuenta: string;
  LForm: TfrmOpcionesEDT;
begin
  node := Trvw_EDT.SelectedNode;
  if not assigned(node) then
    node := trvw_EDT.Nodes[0];

  if Assigned(node) then
  begin
    LForm := TfrmOpcionesEDT.Create(Application);
    try
      subnode := addNodeEDT(node, '');
      generaCodEDT(subnode);
      Trvw_EDT.ExpandNode(subnode);
      Descripcion := subnode.Text[2];
      codCuenta := subnode.Text[0];
      codCuenta := Trim(codCuenta);
      Descripcion := Trim(Descripcion);
      LForm.lbl_codCuenta.Text := 'Cod. EDT: ' + codCuenta;
      LForm.edt_EDTDescripcion.Text := Descripcion;
      LForm.mmo_EDTObservaciones.Text := subnode.Text[2];
      LForm.lbl_modo.Text := '1';
      populaResponsableEDT(LForm);
      LForm.cbb_EDTResponsable.ItemIndex := -1;
      if subnode.Text[1] <> '' then
      begin
        LForm.SeleccionarResponsable(subnode.Text[1]);
      end;
      LForm.nodoSeleccionado := subnode;
      LForm.ShowModal;
      LForm.edt_EDTDescripcion.SetFocus;
    finally
      LForm.Free;
    end;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem35Click.
/// </summary>
procedure TfrmMain.MenuItem35Click(Sender: TObject);
var
  tmpstr: string;
  subnode: TTMSFNCTreeViewNode;
begin
  if RealizarPreguntaSiNo('¿Borrar Nodo y Dependencias?') <> mrOK then
    Exit;
  subnode := Trvw_EDT.SelectedNode;
  if Assigned(subnode) then
  begin
    if subnode.GetParent <> nil then
    begin
      subnode.RemoveChildren;
      subnode.Destroy;
      generaCodEDT(Trvw_EDT.nodes[0]);
    end;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem37Click.
/// </summary>
procedure TfrmMain.MenuItem37Click(Sender: TObject);
var
  node: TTMSFNCTreeViewNode;
  codCuenta, descripcion, stakeholder, definicion: string;
  color0, color1, color2, color3: string;
  LForm: TfrmOpcionesEDT;
begin
  node := Trvw_EDT.SelectedNode;

  if not Assigned(node) then
    Exit;

  if node = Trvw_EDT.Nodes[0] then
    Exit;

  // 🔹 Extraer colores actuales
  color0 := ExtractFontColor(node.Text[0]);
  color1 := ExtractFontColor(node.Text[1]);
  color2 := ExtractFontColor(node.Text[2]);
  color3 := ExtractFontColor(node.Text[3]);

  // 🔹 Extraer texto limpio
  codCuenta := Trim(StripHtmlFont(node.Text[0]));
  descripcion := Trim(StripHtmlFont(node.Text[1]));
  stakeholder := Trim(StripHtmlFont(node.Text[2]));
  definicion := Trim(StripHtmlFont(node.Text[3]));

  LForm := TfrmOpcionesEDT.Create(Application);
  try
    LForm.lbl_codCuenta.Text := 'Cod. EDT: ' + codCuenta;
    LForm.edt_EDTDescripcion.Text := descripcion;
    LForm.mmo_EDTObservaciones.Text := definicion;
    LForm.lbl_modo.Text := '2';

    populaResponsableEDT(LForm);

    if stakeholder <> '' then
      posicionaCombo(LForm.cbb_EDTResponsable, stakeholder)
    else
      LForm.cbb_EDTResponsable.ItemIndex := -1;

    LForm.nodoSeleccionado := node;

    if LForm.ShowModal = mrOk then
    begin
      // 🔹 Recuperar nuevos valores
      codCuenta := LForm.lbl_codCuenta.Text.Replace('Cod. EDT: ', '');
      descripcion := LForm.edt_EDTDescripcion.Text;
      definicion := LForm.mmo_EDTObservaciones.Text;

      // 🔹 Reaplicar color si existía
      if color0 <> '' then
        node.Text[0] := '<font color="' + color0 + '">' + codCuenta + '</font>'
      else
        node.Text[0] := codCuenta;

      if color1 <> '' then
        node.Text[1] := '<font color="' + color1 + '">' + descripcion + '</font>'
      else
        node.Text[1] := descripcion;

      if color2 <> '' then
        node.Text[2] := '<font color="' + color2 + '">' + stakeholder + '</font>'
      else
        node.Text[2] := stakeholder;

      if color3 <> '' then
        node.Text[3] := '<font color="' + color3 + '">' + definicion + '</font>'
      else
        node.Text[3] := definicion;
    end;

  finally
    LForm.Free;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem38Click.
/// </summary>
procedure TfrmMain.MenuItem38Click(Sender: TObject);
begin
  edt_Latitud.Text := '0';
  edt_longitud.Text := '0';
end;

procedure TfrmMain.MenuItem39Click(Sender: TObject);
begin
  // Copiar a Portapapeles
  ExportarApuPortapapeles();
  MuestraMensajeGiproy('Información', 'Exportación Realizada');
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem3Click.
/// </summary>
procedure TfrmMain.MenuItem3Click(Sender: TObject);
begin
  grid_Crono1.PasteFromClipboard;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem41Click.
/// </summary>
procedure TfrmMain.MenuItem40Click(Sender: TObject);
begin
  rect_SUB34Pertenencia.OnClick(rect_SUB34Pertenencia);
end;

procedure TfrmMain.MenuItem41Click(Sender: TObject);
var
  bkp: TMemoryStream;
  tmpstream: string;
  X: Integer;
begin
  bkp := TMemoryStream.Create;
  tmpstream := '';
  X := historicoEDT.Count - 1;
  if X > -1 then
  begin
    posEDT := X;
    tmpstream := historicoEDT[X - 1];
    WriteStreamStr(bkp, tmpstream);
    bkp.Position := 0;
    Trvw_EDT.LoadFromStream(bkp);
  end;
  bkp.Free;
end;

procedure TfrmMain.MenuItem42Click(Sender: TObject);
var
  bkp: TMemoryStream;
  tmpstream: string;
  X: Integer;
begin
  bkp := TMemoryStream.Create;
  tmpstream := '';
  if (posEDT < historicoEDT.Count - 1) then
  begin
    Inc(posEDT);
    tmpstream := historicoEDO[posEDT];
    WriteStreamStr(bkp, tmpstream);
    bkp.Position := 0;
    Trvw_EDT.LoadFromStream(bkp);
  end;
  bkp.Free;
end;

procedure TfrmMain.MenuItem45Click(Sender: TObject);
begin
  copynode := TTMSFNCTreeViewNode.Create(nil);
  copynode := Trvw_EDT.SelectedNode;
end;

procedure TfrmMain.MenuItem46Click(Sender: TObject);
var
  PosNode: TTMSFNCTreeViewNode;
  X: Integer;
begin
  if Assigned(copynode) then
  begin
    PosNode := Trvw_EDT.SelectedNode;
    if PosNode <> Trvw_EDT.nodes[0] then
    begin
      Trvw_EDT.MoveNode(copynode, PosNode.GetParent, PosNode.Index);
      copynode := nil;
      generaCodEDT(Trvw_EDT.nodes[0]);
    end
    else
    begin
      PosNode := Trvw_EDT.GetFirstChildNode(Trvw_EDT.nodes[0]);
      Trvw_EDT.MoveNode(copynode, PosNode.GetParent, PosNode.Index);
      copynode := nil;
      generaCodEDT(Trvw_EDT.nodes[0]);
    end;
  end;
end;

procedure TfrmMain.MenuItem47Click(Sender: TObject);
begin
  if Trvw_EDO.SelectedNode <> nil then
    nodoCopy := Trvw_EDO.SelectedNode;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem48Click.
/// </summary>
procedure TfrmMain.MenuItem48Click(Sender: TObject);
var
  nodoDestino: TTMSFNCTreeViewNode;
  Orig_es_hito, Dest_es_hito: Boolean;
begin
  nodoDestino := Trvw_EDO.SelectedNode;

  if (nodoDestino = nil) or (nodoDestino = Trvw_EDO.Nodes[0]) then
    Exit;

  if (nodoCopy = nil) or (nodoDestino = nodoCopy) then
    Exit;

  Orig_es_hito := nodoCopy.Extended;
  Dest_es_hito := nodoDestino.Extended;

  Trvw_EDO.BeginUpdate;
  try
    // ===============================
    // HITO → HITO
    // ===============================
    if Orig_es_hito and Dest_es_hito then
    begin
      if realizarPreguntaSiNo('¿Insertar como Hito Hijo?') = mrOK then
      begin
        // mover como hijo
        Trvw_EDO.MoveNode(nodoCopy, nodoDestino);
      end
      else
      begin
        // mover como hermano debajo
        Trvw_EDO.MoveNode(nodoCopy,
          nodoDestino.getParent,
          nodoDestino.Index + 1);
      end;
    end

      // ===============================
      // STAKE → HITO
      // ===============================
    else if (not Orig_es_hito) and Dest_es_hito then
    begin
      Trvw_EDO.MoveNode(nodoCopy, nodoDestino);
    end

      // ===============================
      // HITO → STAKE
      // ===============================
    else if Orig_es_hito and (not Dest_es_hito) then
    begin
      Trvw_EDO.MoveNode(nodoCopy, nodoDestino.getParent);
    end

      // ===============================
      // STAKE → STAKE
      // ===============================
    else
    begin
      Trvw_EDO.MoveNode(nodoCopy,
        nodoDestino.getParent,
        nodoDestino.Index + 1);
    end;

    // 🔥 RENOMBRAR ESTRUCTURA COMPLETA
    RenumerarEstructuraCompleta(Trvw_EDO);

  finally
    Trvw_EDO.EndUpdate;
  end;

  nodoCopy := nil;

  guardarHitoCompleto(Trvw_EDO);
  guardarEDOCompleta(Trvw_EDO);
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem49Click.
/// </summary>
procedure TfrmMain.MenuItem49Click(Sender: TObject);
var
  ARow: Integer;
  idPosGrid: Integer;
  QDeleteAPU: TUniQuery;
begin
  if realizarPreguntaSiNo('¿Borrar APUs Seleccionadas?') <> mrOk then
    Exit;
  for ARow := grid_Presupuestos.Selection.StartRow to grid_Presupuestos.
    Selection.EndRow do
  begin
    if grid_Presupuestos.RowSelect[ARow] then
    begin

      with DMPresupuesto.dsTpresupuestosItems.DataSet do
      begin
        DisableControls;
        First;
        MoveBy(ARow - 1);
        idPosGrid := FieldByName('posgrid').AsInteger;
        if FieldByName('codAPU').AsString <> '' then
        begin
          QDeleteAPU := TUniquery.Create(nil);
          try
            with QDeleteAPU do
            begin
              Connection := DModule_1.con2;
              Close;
              SQL.Clear;
              SQL.Text :=
                'CALL Presupuestos_deleteItem(:icodBase, :icodPresupuesto, :iRevision, :iPosGrid)';
              ParamByName('iposgrid').AsInteger := idPosGrid;
              ParamByName('icodBase').AsString := base_activa.codBase;
              ParamByName('icodPresupuesto').AsString := codProyecto;
              ParamByName('irevision').AsString := revision;
              try
                ExecSQL;
              except
                on E: Exception do
                begin
                  raise Exception.Create('Error eliminando item: ' + E.Message);
                end;
              end;
            end;
          finally
            QDeleteAPU.free;
          end;
        end;
        EnableControls;
        DMPresupuesto.calculaTotal;
      end;
    end;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem4Click.
/// </summary>
procedure TfrmMain.MenuItem4Click(Sender: TObject);
begin
  OpenDialog.Execute;
  if OpenDialog.FileName <> '' then
  begin
    ImportarPlantillaProjectExcel(OpenDialog.FileName);
  end;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem50Click.
/// </summary>
procedure TfrmMain.MenuItem50Click(Sender: TObject);
begin
  DMPresupuesto.copiarAPUS;
end;

/// <summary>
/// Implementa la lógica principal de compruebaEscrito.
/// </summary>
procedure TfrmMain.compruebaEscrito;
begin
  if (edt_UUsuario.Text <> '') and (edt_UPassword.Text <> '') then
  begin
    Shadow_btnLogin.Enabled := True;
  end
  else
  begin
    Shadow_btnLogin.Enabled := False;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de DGrid_ColaboradoresCellClick.
/// </summary>
procedure TfrmMain.MenuItem51Click(Sender: TObject);
begin
  DMPresupuesto.cortarAPUS();
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem52Click.
/// </summary>
procedure TfrmMain.MenuItem52Click(Sender: TObject);
begin
  DMPresupuesto.pegarAPUS;
end;

procedure TfrmMain.MenuItem54Click(Sender: TObject);
begin
  rect_SUB34Crear.OnClick(rect_SUB34Crear);
end;

/// <summary>
/// Manejador del evento OnClick de popupItem_pareto_SinAplicarClick.
/// </summary>
procedure TfrmMain.MenuItem57Click(Sender: TObject);
var
  listadoCantidades: TStringList;
  Svc: IFMXClipboardService;
  Value: TValue;
  posgrid: Integer;
begin
  { https://www.clubdelphi.com/foros/archive/index.php?t-94065.html }
  listadoCantidades := TStringList.Create;
  posgrid := grid_Presupuestos.Selection.StartRow;
  if TPlatformServices.Current.SupportsPlatformService(IFMXClipboardService, Svc)
    then
  begin
    Value := Svc.GetClipboard;
    if not Value.IsEmpty then
    begin
      if Value.IsType<string> then
      begin
        listadoCantidades.Text := Value.AsString;
        DMPresupuesto.copiarCantidadesPresupuesto(listadoCantidades, posgrid);
      end;
    end;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem59Click.
/// </summary>
procedure TfrmMain.MenuItem59Click(Sender: TObject);
begin
  frmMain.grid_calcTiempos.UnHideRowsAll;
  frmMain.grid_calcTiempos.RemoveFilters;
  frmMain.grid_crono01.UnHideRowsAll;
  frmMain.grid_crono01.RemoveFilters;
end;

procedure TfrmMain.MenuItem5Click(Sender: TObject);
begin
  rect_SUB33Borrar.OnClick(rect_SUB33Borrar);
end;

procedure TfrmMain.MenuItem60Click(Sender: TObject);
begin
  frmMain.grid_calcTiempos.UnHideRowsAll;
  frmMain.grid_calcTiempos.RemoveFilters;
  frmMain.grid_crono01.UnHideRowsAll;
  frmMain.grid_crono01.RemoveFilters;
  guardaGridTiempoTemporal;
  ParetoGeneralTiempo();
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem61Click.
/// </summary>
procedure TfrmMain.MenuItem61Click(Sender: TObject);
begin
  frmMain.grid_calcTiempos.UnHideRowsAll;
  frmMain.grid_calcTiempos.RemoveFilters;
  frmMain.grid_crono01.UnHideRowsAll;
  frmMain.grid_crono01.RemoveFilters;
  guardaGridTiempoTemporal;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem62Click.
/// </summary>
procedure TfrmMain.MenuItem62Click(Sender: TObject);
begin
  EditarCPC();
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem63Click.
/// </summary>
procedure TfrmMain.MenuItem63Click(Sender: TObject);
begin
  borrarCPC;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem64Click.
/// </summary>
procedure TfrmMain.MenuItem64Click(Sender: TObject);
begin
  if realizarPreguntaSiNo('¿Borrar Categoría?') = mrOk then
  begin
    BorrarItemSubCategoria;
    RefreshCategorias();
  end;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem65Click.
/// </summary>
procedure TfrmMain.MenuItem65Click(Sender: TObject);
begin
  ClonarItem(1);
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem66Click.
/// </summary>
procedure TfrmMain.MenuItem66Click(Sender: TObject);
begin
  EditarItemSubCategoria;
end;

procedure TfrmMain.MenuItem6Click(Sender: TObject);
var
  ARow, ACol: Integer;
begin
  ARow := grid_Recursos.Selection.StartRow;
  ACol := grid_Recursos.Selection.StartCol;
  if ARow < 0 then
    exit;
  if ACol < 0 then
    exit;
  ProcesarDobleClickGrid(ACol, ARow);
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem7Click.
/// </summary>
procedure TfrmMain.MenuItem7Click(Sender: TObject);
begin
  addImagenesReferencia;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem8Click.
/// </summary>
procedure TfrmMain.MenuItem8Click(Sender: TObject);
begin
  if realizarPreguntaSiNo
    ('¿Deseas Limpiar (borrar) la imagen refencial del proyecto?') = mrOk then
  begin
    borrarImagenReferencial;
    imgReferencial.Bitmap := nil;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de MenuItem9Click.
/// </summary>
procedure TfrmMain.MenuItem9Click(Sender: TObject);
var
  posicion: Integer;
  codApu: string;

begin
  posicion := grid_Presupuestos.Selection.StartRow;
  if posicion > 0 then
  begin
    with DMPresupuesto.dsTpresupuestosItems.DataSet do
    begin
      DisableControls;
      First;
      MoveBy(posicion - 1);
      codApu := FieldByName('codAPU').AsString;
      contieneTanteos(codAPU);
      EditarAPUCompleta(codAPU);
      EnableControls;
    end;
    EntrarAPUfrm := True;
  end;
end;

procedure TfrmMain.EditarAPUCompleta(codAPUt: string);
var
  LForm: TfrmAddAPU;
  nodo: TTMSFMXTreeViewNode;
begin
  LForm := TfrmAddAPU.Create(Application);
  try
    ContieneTanteos(codAPUt);
    LForm.lbl_modo.Text := '';
    LForm.limpiaNuevaAPUs();
    LForm.edt_PorcentajeIndirecto.Text := FloatToStr(IndirectosPresupuesto);
    LForm.actualizaListadoAPUSubcategoria;
    LForm.lbl_modo.Text := '3';
    LForm.cargaAPUEdicion(codAput);
    LForm.lbl_titulo1.Text := 'Editar APU';
    LForm.lbl_titulo2.Text := 'Edición de APU';
    LForm.calculaTotales();
    nodo := LForm.tv_SubCategoriaAPU.nodes[0];
    LForm.tv_SubCategoriaAPU.SelectNode(nodo);
    LForm.muestraAPUSTodosRecursos(base_activa.codBase, '1');
    LForm.ShowModal;
  finally
    LForm.free;
  end;
end;

/// <summary>
/// Implementa la lógica principal de moverTab.
/// </summary>
procedure TfrmMain.mItem_1Click(Sender: TObject);
begin
  AbrirImagenConVisor();
end;

procedure TfrmMain.mItem_2Click(Sender: TObject);
var
  categoriaActiva: Integer;
  Clip: IFMXClipboardService;
  V: TValue;
  S: string;
begin
  categoriaActiva := daCategoriaActivaRecursos;
  case categoriaActiva of
    1:
      begin
        trvw_cat1EquiposHerramientas.CopyToClipboard(True);
      end;
    2:
      begin
        trvw_cat2Materiales.CopyToClipboard(True);
      end;
    3:
      begin
        trvw_cat3Transporte.CopyToClipboard(True);
      end;
    4:
      begin
        trvw_cat4ManodeObra.CopyToClipboard(True);
      end;
    5:
      begin
        trvw_cat5SeguridadIndustrial.CopyToClipboard(True);
      end;
    6:
      begin
        trvw_cat6PreciosUnitarios.CopyToClipboard(True);
      end;
  end;
  // Obtiene el contenido del portapapeles
  if TPlatformServices.Current.SupportsPlatformService(IFMXClipboardService,
    IInterface(Clip)) then
  begin
    V := Clip.GetClipboard;
    if not V.IsEmpty and V.IsType<string> then
    begin
      S := V.AsType<string>;
      // Elimina #TREEVIEW#
      S := StringReplace(S, '#TREEVIEW#', '', [rfReplaceAll]);
      // Reemplaza {1} por tab (#9)
      S := StringReplace(S, '{1}', #9, [rfReplaceAll]);
      // También puedes eliminar llaves sobrantes si las hubiera
      S := S.Replace('{', '').Replace('}', '');
      // Devuelve el texto limpio al portapapeles
      Clip.SetClipboard(TValue.From<string>(S));
    end;
  end;
  MuestraMensajeGiproy('Información', 'Datos Copiados.');
end;

procedure TfrmMain.mItem_3Click(Sender: TObject);
var
  LForm: TfrmNuevaCategoria;
  Clip: IFMXClipboardService;
  V: TValue;
  S, Line: string;
  SL: TStringList;
  i, N: Integer;
begin
  // Pegar y crear subcategoria desde una lista de categorias 1 x linea del portapapeles.
  if realizarPreguntaSiNo
    ('¿Desea importar el texto del portapapeles como categorias?') = mrOk then
  begin

    if not TPlatformServices.Current.SupportsPlatformService
      (IFMXClipboardService, IInterface(Clip)) then
      Exit;

    V := Clip.GetClipboard;
    if V.IsEmpty then
      Exit;

    if V.IsType<string> then
      S := V.AsType<string>
    else
      S := V.ToString;

    if S = '' then
      Exit;
    // Normalizar saltos de línea: CRLF / CR -> LF (para split consistente)
    S := S.Replace(#13#10, #10, [rfReplaceAll])
      .Replace(#13, #10, [rfReplaceAll]);

    SL := TStringList.Create;
    LForm := TfrmNuevaCategoria.Create(Application);

    try
      SL.Text := S; // TStringList reconoce saltos de línea y separa líneas
      N := 0;
      for i := 0 to SL.Count - 1 do
      begin
        if SL[i].Trim <> '' then
        begin
          LForm.edt_descripcion.Text := SL[i];
          LForm.mostrarMensajes := 1;
          LForm.lbl_funcion.Text := 'Adicionar';
          LForm.lbl_Categoria.Text := IntToStr(daCategoriaActivaRecursos);
          LForm.AdicionarCategoria;
        end;
      end;
    finally
      LForm.Free;
      SL.Free;
    end;
  end;
end;

procedure TfrmMain.mItem_4Click(Sender: TObject);
begin
  if realizarPreguntaSiNo('¿Desea importar recurso desde portapapeles?' + #13 +
    ' (Orden = Descripcion, Unidad, Precio, CodCPC, Observaciones(opcional))') =
    mrOk then
    ImportarRecursosPortapapeles();
end;

procedure TfrmMain.mItem_5Click(Sender: TObject);
begin
  grid_Recursos.CopyToClipboard(True);
  MuestraMensajeGiproy('Información', 'Copia realizada.');
end;

procedure TfrmMain.moverOpcionesPresupuestos(item: Integer);
var
  fechaInicio, FechaFinal: Tdate;
  valor: Double;
  LForm: TfrmAbrirPresupuesto;
begin
  distribucionDerivacion := 'Homogenea';
  if dmodule_1.con2.Connected then
  begin
    case item of
      1:
        begin
          proyectoNuevo := True;
          rct_1Presupuesto.Fill.Color := $FFE94E1B;
          limpiaBaseDatos;
          IniciaNuevoProyecto();
          codProyecto := frmMain.edt_CodigoPresupuesto1.Text;
          revision := frmMain.lbl_RevisionPresupuesto.Text;
          calculaPlazosCronograma();
          tbc_PreciosUnitarios.ActiveTab := tab_PresupuestosGeneral;
          tbcPresupuestos.ActiveTab := tab_1PresupuestoDatos;
          tbc_PreciosUnitarios.ActiveTab := tab_PresupuestosGeneral;
          tbcPresupuestos.ActiveTab := tab_1PresupuestoDatos;
          frmMain.tmr_autoguardado.Enabled := False;
          LimpiaDBHuerfanas();
          DMPresupuesto.activaSubcategoriayApusPresupuesto;
        end;
      2:
        begin
          LForm := TfrmAbrirPresupuesto.Create(Application);
          try

            { cerrar dataset si está abierto }
            if Assigned(DMPresupuesto.dsTpresupuestosItems) and
              Assigned(DMPresupuesto.dsTpresupuestosItems.DataSet) and
              DMPresupuesto.dsTpresupuestosItems.DataSet.Active then
              DMPresupuesto.dsTpresupuestosItems.DataSet.Close;

            FechaFinal := Now;
            fechaInicio := IncDay(Now, -31);
            ndecimalesMoneda := 2;

            CargaProyectosDisponibles(-1, -1, LForm);

            LForm.dedt_1.Date := IncDay(Now, -31);
            LForm.dedt_2.Date := Now;

            LForm.dedt_1.Enabled := True;
            LForm.dedt_2.Enabled := True;

            LForm.chk1.IsChecked := True;
            LForm.edt_descripcion.Text := '';

            proyectoNuevo := False;

            LForm.ShowModal;

            if LForm.ModalResult = mrOK then
              lbl_NBaseProyecto.Text := base_activa.Nombre;

          finally
            LForm.Free;
          end;
        end;
    end;
  end;
end;

/// <summary>
/// Implementa la lógica principal de moverTabPresupuesto.
/// </summary>
procedure TfrmMain.moverTab(item: Integer);
var
  posicion: Integer;
begin
  posicion := 0;
  // iniciaSeleccion();
  case item of
    0:
      begin
        // Seleccion Base de Datos
        tbc_Categorias.ActiveTab := tab_cat0Vacio;
        tbcSubMenu3.GotoVisibleTab(1, TTabTransition.Slide,
          TTabTransitionDirection.Normal);
        posicion := tab_PU_0Vacio.Index;
      end;
    1:
      begin
        // Categorias
        posicion := tab_PU_1SubCategorias.Index;
        RefreshCategorias;
        tbc_Categorias.ActiveTab := tab_cat1EquiposHerramients;
        tbcSubMenu3.GotoVisibleTab(2, TTabTransition.Slide,
          TTabTransitionDirection.Normal);
        SeleccionaCategoria(1);
      end;
    2:
      begin
        // Recursos
        if not base_activa.SeguridadIndustrial then
        begin
          lyt_OPCRec5.Visible := False;
        end
        else
        begin
          lyt_OPCRec5.Visible := True;
        end;
        posicion := tab_PU_2Recursos.Index;
        tbcSubMenu3.GotoVisibleTab(3, TTabTransition.Slide,
          TTabTransitionDirection.Normal);
        limpiaGridRecursos;
        rellenaCategoriaRecursos();
        codCategoriaRecursos := 1;
      end;
    3:
      begin
        // APUS
        ordenacionlistadoCategoiraApus := 1;
        edt_filtroLVApusCategoria.Text := '';
        edt_FiltroListadoApus.Text := '';
        posicion := tab_PU_3APUs.Index;
        tbcSubMenu3.GotoVisibleTab(4, TTabTransition.Slide,
          TTabTransitionDirection.Normal);
        rellenaAPUSCategoria(ordenacionlistadoCategoiraApus);
        Limpia_gridAPUSDisponibles;
        limpia_APUSVisor();
        refrescalistaAPUscompleta;
        lv_APUSCategoria.ItemIndex := -1;
        AjustaGridAutomatico(grid_APUSRecursos, 2);
      end;
  end;
  if posicion > -1 then
    tbc_PreciosUnitarios.GotoVisibleTab(posicion, TTabTransition.Slide,
      TTabTransitionDirection.Normal);
end;

procedure TfrmMain.moverTabPresupuesto(item: Integer);
var
  posicion: Integer;
  tmpstr: string;
  X: Integer;
  nperiodos: Integer;

  procedure ResetColores;
  begin
    rct_1Presupuesto.Fill.Color := $FF606060;
    rct_2Presupuesto.Fill.Color := $FF606060;
    rct_3Presupuesto.Fill.Color := $FF606060;
    rct_4Presupuesto.Fill.Color := $FF606060;
    rct_5Presupuesto.Fill.Color := $FF606060;
    rct_6Presupuesto.Fill.Color := $FF606060;
    rct_7Presupuesto.Fill.Color := $FF606060;
    rct_8Presupuesto.Fill.Color := $FF606060;
  end;

  procedure ResaltaItem(const AItem: Integer);
  begin
    case AItem of
      1: rct_1Presupuesto.Fill.Color := $FFE94E1B;
      2: rct_3Presupuesto.Fill.Color := $FFE94E1B;
      3: rct_2Presupuesto.Fill.Color := $FFE94E1B;
      4: rct_4Presupuesto.Fill.Color := $FFE94E1B;
      5: rct_5Presupuesto.Fill.Color := $FFE94E1B;
      6: rct_6Presupuesto.Fill.Color := $FFE94E1B;
      7: rct_7Presupuesto.Fill.Color := $FFE94E1B;
      8: rct_8Presupuesto.Fill.Color := $FFE94E1B;
    end;
  end;

  procedure RunInTransaction(const AProc: TProc);
  var
    StartedHere: Boolean;
  begin
    StartedHere := not DModule_1.con2.InTransaction;

    if StartedHere then
      DModule_1.con2.StartTransaction;

    try
      AProc;

      if StartedHere then
        DModule_1.con2.Commit;

    except
      on E: Exception do
      begin
        if StartedHere then
          DModule_1.con2.Rollback;
        raise;
      end;
    end;
  end;

begin
  posicion := tab_PresupuestosGeneral.Index;

  ResetColores;

  if not ProyectocumpleRequisitosMinimos then
    Exit;

  try
    case item of

      1:
        begin
          ResaltaItem(item);
          tbcPresupuestos.ActiveTab := tab_1PresupuestoDatos;
        end;

      2:
        begin
          ResaltaItem(item);

          grid_stakesAsignados.StopEdit;
          sincronizarEDO;

          tmpstr := edt_descripcionPresupuesto.Text;

          if Trvw_EDO.Nodes.Count = 0 then
          begin
            Trvw_EDO.AddNode;
            Trvw_EDO.Nodes[0].Extended := True;
          end;

          if tmpstr <> Trvw_EDO.Nodes[0].Text[0] then
            Trvw_EDO.Nodes[0].Text[0] := tmpstr;

          tbcPresupuestos.ActiveTab := tab_2PresupuestoEDO;
        end;

      3:
        begin
          ResaltaItem(item);
          tbcPresupuestos.ActiveTab := tab_3PresupuestoStake;
        end;

      4:
        begin
          ResaltaItem(item);
          tbcPresupuestos.ActiveTab := tab_4PresupuestoEDT;

          if edt_descripcionPresupuesto.Text <> '' then
          begin
            Trvw_EDT.ClearNodes;
            cargar_EDT(base_activa.codBase);

            X := Trvw_EDT.GetTotalNodeCount;

            if X = 0 then
            begin
              Trvw_EDT.AddNode;
              Trvw_EDT.Nodes[0].Text[1] := edt_descripcionPresupuesto.Text;
            end;
          end;
        end;
      5:
        begin
          ResaltaItem(item);

          RunInTransaction(
            procedure
            var
              qry: TUniQuery;
            begin

              { 1. Guardar EDT }
              Guardar_edt;

              { 2. Recalcular orden jerárquico }

              qry := TUniQuery.Create(nil);
              try
                qry.Connection := DModule_1.con2;

                qry.SQL.Text :=
                  'CALL ActualizaOrdenJerarquicoEDT(:codBase,:codPresupuesto,:revision)';

                qry.ParamByName('codBase').AsString := base_activa.codBase;
                qry.ParamByName('codPresupuesto').AsString := codProyecto;
                qry.ParamByName('revision').AsString := revision;

                qry.ExecSQL;

              finally
                qry.Free;
              end;

            end
            );

          { UI }

          iGlow_AbrirTanteo.Enabled := False;
          lyt_Tanteo.Height := 0;

          tbcPresupuestos.ActiveTab := tab_5Presupuesto;

          lbl_porcentajesIndirectos.Text :=
            FloatToStr(IndirectosPresupuesto) + '%';

          { refrescar dataset correctamente }

          with DMPresupuesto.QTPresupuestosItems do
          begin
            DisableControls;
            try
              Close;

              if Params.FindParam('ndec') <> nil then
                ParamByName('ndec').AsInteger := nDecimalesMoneda;

              if Params.FindParam('icodBase') <> nil then
                ParamByName('icodBase').AsString := base_activa.codBase;

              if Params.FindParam('icodPresupuesto') <> nil then
                ParamByName('icodPresupuesto').AsString := codProyecto;

              if Params.FindParam('irevision') <> nil then
                ParamByName('irevision').AsString := revision;

              Open;

            finally
              EnableControls;
            end;
          end;

          ajustargridPresupuestosAPUS;

        end;

      6:
        begin
          if (base_activa.codBase = '') or (grid_Presupuestos.RowCount <= 1)
            then
          begin
            MuestraMensajeGiproy('Advertencia',
              'Por favor agregue items al presupuesto');
            Exit;
          end;

          ResaltaItem(item);

          RunInTransaction(
            procedure
            begin
              GuardarProyecto;
              cargar_Items(base_activa.codBase);

            end
            );

          CopiarDatasetACrono0;
          chart_CurvaS.Clear;
          lyt_tanteoCrono.Height := 0;

          lbl_cronoFechaInicio.Text :=
            FormatDateTime('dd/mm/yyyy', dedt_PresentacionPresupuesto.Date);

          lbl_cronoFechaInicio1.Text := lbl_cronoFechaInicio.Text;
          lbl_cronoFechaFinalizacion.Text := lbl_PresupuestoFinalizacion.Text;
          lbl_cronoFechaFin1.Text := lbl_cronoFechaFinalizacion.Text;

          lbl_cronoPlazoEjecucion.Text := IntToStr(daDiasPlazoEjecucion);
          lbl_cronoDiasEjecucion1.Text := lbl_cronoPlazoEjecucion.Text;

          // ============================
          // NUEVA LÓGICA: Config global
          // ============================
          // 1) Por defecto mensual
          cbb_cronoTipoPeriodo.ItemIndex := 3;

          // 2) Calcula periodos y asegura que exista config global (si es primera vez)
          calculaPlazosCronograma;
          AseguraCronoConfigGlobalPorDefecto;

          // 3) Si ya existía config global, la aplica a UI (tipoPeriodo/Periodos) y a grid_crono0 col 11
          AplicaCronoConfigGlobalAUI;

          // 4) Periodos definitivos
          nperiodos := StrToIntDef(lbl_cronogramaNPeriodos.Text, 1);
          if nperiodos <= 0 then
            nperiodos := 1;

          // ============================
          // Preparación UI/Grids
          // ============================
          tbc_Cronogramas.ActiveTab := tab_Valorados;
          tbcPresupuestos.ActiveTab := tab_6PresupuestoCronogramas;

          addheadercrono01;

          grid_Crono1.ColumnCount := nperiodos + 1;
          grid_crono2.ColumnCount := nperiodos + 1;
          grid_crono3.ColumnCount := nperiodos + 1;
          grid_GBarras.ColumnCount := nperiodos;
          grid_CronoTotales.ColumnCount := nperiodos;

          grid_Crono1.RowCount := Max(2, grid_crono0.RowCount);
          grid_crono2.RowCount := grid_Crono1.RowCount;
          grid_crono3.RowCount := grid_Crono1.RowCount;
          grid_GBarras.RowCount := grid_Crono1.RowCount;

          sincronizaTamanoGrid(grid_Crono1, grid_crono2);
          sincronizaTamanoGrid(grid_Crono1, grid_crono3);
          sincronizaTamanoGrid(grid_Crono1, grid_GBarras);

          showHeader(grid_Crono1, nperiodos);
          showHeader(grid_crono2, nperiodos);
          showHeader(grid_crono3, nperiodos);
          showHeader(grid_GBarras, nperiodos);

          // ============================
          // Cálculo cronogramas
          // ============================
          // Este procedimiento ahora:
          // - asegura global
          // - aplica global/overrides efectivos a grid_crono0 col 11
          // - NO se corta por "cantidadCronoDerivaciones"
          ejecutaCronoDerivaciones;

          // ============================
          // Tiempos / Totales
          // ============================
          grid_calcTiempos.RowCount := grid_crono01.RowCount;

          if grid_crono01.Columns.Count > 14 then
            grid_crono01.Columns[14].Width := 0;

          calculaTiempoAPUS;

          ocultaColumnasGridsT2(grid_crono0, 9);
          ocultaColumnasGridsT2(grid_crono01, 9);

          presupuestoCalculaTotalesCrono01;

          // Recalcula por si UI cambió (opcional, pero lo dejas como antes)
          calculaPlazosCronograma;

          cierraGridTanteo;
        end;

      7:
        begin
          ResaltaItem(item);

          RunInTransaction(
            procedure
            begin
              GuardarProyecto;
              cargar_Items(base_activa.codBase);
            end
            );

          dbGridConnect_1.Active := False;
          dbGridConnect_1.Grid := grid_desagregacionCPC;
          DModule_1.untbl1.Active := True;
          dbGridConnect_1.Active := True;

          edt_filtroCPC.Text := '';
          tbcCPC.ActiveTab := tab_CPC1;
          tbcPresupuestos.ActiveTab := tab_7Desagregacion;

          limpiaGridDesagregacion;
          sincronizaDesagregacion;
        end;

      8:
        begin
          ResaltaItem(item);

          RunInTransaction(
            procedure
            begin
              GuardarProyecto;
              cargar_Items(base_activa.codBase);
            end
            );

          generaRecursosPresupuesto;
          limpiaGridFpolinomica;
          limpia_gridFpolIndices;
          cargaOpcionesIndices;
          cargaTablaIndicesSeleccionados('TODOS');
          DatosRecursosFpolinomica;

          tbcPresupuestos.ActiveTab := tab_8FPolinomica;

          sincronizaIndiceyCoeficientes;
          estadoIndices;
          tbc_Fpolinomica.ActiveTab :=
            tab_Fpol_1IndicesyCoeficientes;
          resalta_fPoliPanelCategoria(1);
        end;
    end;

    if posicion > 0 then
      tbc_PreciosUnitarios.GotoVisibleTab(
        posicion,
        TTabTransition.Slide,
        TTabTransitionDirection.Normal
        );

    tbc_PreciosUnitarios.Repaint;

  except
    on E: Exception do
    begin
      MuestraMensajeGiproy(
        'Error',
        'moverTabPresupuesto item=' + item.ToString +
        sLineBreak + E.ClassName + ': ' + E.Message
        );
      raise;
    end;
  end;
end;

procedure TfrmMain.muevegrid(i, r: Integer);
begin
  if not pulsarTeclaGrid then
  begin
    grid_Crono1.UnSelectRows(0, grid_Crono1.RowCount - 1);
    grid_crono2.UnSelectRows(0, grid_crono2.RowCount - 1);
    grid_crono3.UnSelectRows(0, grid_crono3.RowCount - 1);
    grid_crono0.UnSelectRows(0, grid_crono0.RowCount - 1);
    grid_GBarras.UnSelectRows(0, grid_GBarras.RowCount - 1);
  end;
  if grid_crono0.RowCount >= i then
    grid_crono0.SelectRows(i, i);
  if grid_Crono1.RowCount >= i then
    grid_Crono1.SelectRows(i, i);
  if grid_crono2.RowCount >= i then
    grid_crono2.SelectRows(i, i);
  if grid_crono3.RowCount >= i then
    grid_crono3.SelectRows(i, i);
  if grid_GBarras.RowCount >= i then
    grid_GBarras.SelectRows(i, i);
end;

function TfrmMain.ObtenerNumeroSerieBIOS: string;
var
  BufferSize: DWORD;
  pBuffer: PByte;
  pString: PAnsiChar;
  TableLength: Word;
  i, Offset: Integer;
  MaxOffset: Integer;
  // Estructura de la cabecera SMBIOS
  SmbiosStruct: record Type_: Byte;
    Length: Byte;
    Handle: Word;
  end;
begin
  Result := '';

  // 1. Obtener el tamaño necesario del buffer
  BufferSize := GetSystemFirmwareTable(RAW_SMBIOS_FIRMWARE_TABLE, 0, nil, 0);
  if BufferSize = 0 then
    Exit;

  // 2. Reservar memoria para el buffer
  GetMem(pBuffer, BufferSize);
  try
    // 3. Obtener los datos reales de la tabla SMBIOS
    if GetSystemFirmwareTable(RAW_SMBIOS_FIRMWARE_TABLE, 0, pBuffer,
      BufferSize) = 0 then
      Exit;

    // 4. Los primeros 8 bytes son una cabecera adicional, los saltamos.
    // El bloque de datos SMBIOS real comienza en el offset 8.
    Offset := 8;
    MaxOffset := BufferSize - SizeOf(SmbiosStruct);

    // 5. Recorrer las estructuras SMBIOS
    while Offset < MaxOffset do
    begin
      // Leer la cabecera de la estructura (Tipo y Longitud)
      Move(pBuffer[Offset], SmbiosStruct, SizeOf(SmbiosStruct));

      // El Tipo 1 es "Estructura de Información del Sistema", que contiene el número de serie.
      if SmbiosStruct.Type_ = 1 then
      begin
        // El campo del número de serie está en el offset 0x07 (7) dentro de esta estructura.
        // Este valor es un número que indica qué string en la tabla de strings following the structure holds the data.
        if (Offset + 7) < BufferSize then
        begin
          // Leemos el índice del string (offset 7)
          i := pBuffer[Offset + 7];
          if i > 0 then
          begin
            // Para encontrar el string, debemos saltar la parte fija de la estructura...
            pString := PAnsiChar(pBuffer + Offset + SmbiosStruct.Length);
            // ...y luego recorrer la lista de strings (terminada en doble null) hasta el i-ésimo.
            Dec(i);
            while (i > 0) and (pString^ <> #0) do
            begin
              Inc(pString, StrLen(pString) + 1);
              Dec(i);
            end;
            // Si encontramos el string, lo convertimos a Unicode y salimos.
            if pString^ <> #0 then
              Result := UTF8ToString(AnsiString(pString));
            Exit; // Salimos tan pronto como encontramos la estructura tipo 1.
          end;
        end;
      end;
      // Si no es la estructura que buscamos, avanzamos a la siguiente.
      // La longitud de la estructura fija está en SmbiosStruct.Length.
      // Luego vienen los strings, terminados por dos bytes nulos (0x0000).
      Inc(Offset, SmbiosStruct.Length);
      pString := PAnsiChar(pBuffer + Offset);
      // Avanzamos hasta encontrar el doble null que termina los strings de esta estructura.
      while (Offset < BufferSize - 1) and
        not ((pBuffer[Offset] = 0) and (pBuffer[Offset + 1] = 0)) do
        Inc(Offset);
      Inc(Offset, 2); // Saltamos los dos bytes nulos finales
    end;

  finally
    FreeMem(pBuffer);
  end;
end;

function TfrmMain.ObtenerNumeroSerieHDDFisico: string;
var
  objWMIService, colDrives, colPartitions, colLogicalDisks, colItem: OleVariant;
  oEnum: IEnumVariant;
  iValue: LongWord;
  SerialNumber, DeviceID, PartitionID, LogicalDiskID: string;
  DiskIndex: string;
begin
  Result := '';
  if not FCoInitialized then
    Exit;

  try
    objWMIService := CreateOleObject('WbemScripting.SWbemLocator');
    objWMIService := objWMIService.ConnectServer('localhost', 'root\cimv2');

    // Obtener la partición asociada a C:
    colLogicalDisks := objWMIService.ExecQuery
      ('SELECT * FROM Win32_LogicalDiskToPartition', 'WQL', 0);
    oEnum := IUnknown(colLogicalDisks._NewEnum) as IEnumVariant;

    PartitionID := '';
    while oEnum.Next(1, colItem, iValue) = 0 do
    begin
      LogicalDiskID := colItem.Dependent;
      if Pos('C:', LogicalDiskID) > 0 then
      begin
        PartitionID := colItem.Antecedent;
        Break;
      end;
    end;

    if PartitionID = '' then
    begin
      Result := 'No se encontró la partición de C:';
      Exit;
    end;

    // Extraer el índice del disco físico desde la partición
    colPartitions := objWMIService.ExecQuery
      ('SELECT * FROM Win32_DiskDriveToDiskPartition', 'WQL', 0);
    oEnum := IUnknown(colPartitions._NewEnum) as IEnumVariant;

    DiskIndex := '';
    while oEnum.Next(1, colItem, iValue) = 0 do
    begin
      if Pos(PartitionID, colItem.Dependent) > 0 then
      begin
        DeviceID := colItem.Antecedent;
        DiskIndex := Copy(DeviceID, Pos('DeviceID="', DeviceID) + 10, MaxInt);
        DiskIndex := Copy(DiskIndex, 1, Pos('"', DiskIndex) - 1);
        Break;
      end;
    end;

    if DiskIndex = '' then
    begin
      Result := 'No se encontró el disco físico para C:';
      Exit;
    end;

    // Obtener el número de serie del disco físico
    colDrives := objWMIService.ExecQuery
      ('SELECT * FROM Win32_PhysicalMedia WHERE Tag="' + DiskIndex + '"',
      'WQL', 0);
    oEnum := IUnknown(colDrives._NewEnum) as IEnumVariant;

    while oEnum.Next(1, colItem, iValue) = 0 do
    begin
      SerialNumber := colItem.SerialNumber;
      if SerialNumber <> '' then
        Result := Trim(SerialNumber)
      else
        Result := 'Error Serial Number: No disponible';
    end;
  except
    on E: Exception do
      Result := 'Error al acceder a WMI: ' + E.Message;
  end;

  if Pos('error', LowerCase(Result)) > 0 then
    Result := '';
end;

/// <summary>
/// Implementa la lógica principal de Opciones_Referidos.
/// </summary>
procedure TfrmMain.Opciones_Referidos(opcion: Integer);
var
  LForm: Tfrm_enviosDatosUsuarios;
  AValue: string;
begin
  iGlow_addReferido.Enabled := False;
  iGlow_RefrescaReferido.Enabled := False;
  iGlow_EnviosDatos.Enabled := False;
  iGlow_Mensajes.Enabled := False;
  iGlow_addReferido.GlowColor := TAlphaColorRec.Black;
  iGlow_RefrescaReferido.GlowColor := TAlphaColorRec.Black;
  iGlow_EnviosDatos.GlowColor := TAlphaColorRec.Black;
  iGlow_Mensajes.GlowColor := TAlphaColorRec.Black;
  case opcion of
    1:
      begin
        iGlow_addReferido.GlowColor := $FFE94E00;
        AValue := HacerPregunta('¿Email?', 'Nuevo Usuario colaborador', '1', '',
          nil);
        if AValue <> '' then
        begin
          addusuarioColaborador(AValue);
        end;
      end;
    2:
      begin
        // Refrescar
        tmrComunicacion.Enabled := False;
        tmrComunicacion.Interval := 1;
        tmrComunicacion.Enabled := True;
        Actualiza_UsuariosColaborador();
        iGlow_RefrescaReferido.GlowColor := $FFE94E00;
      end;
    3:
      begin
        // Mostrar Pago
        iGlow_Mensajes.GlowColor := $FFE94E00;

      end;
    4:
      begin
        // Mostrar Envio de bases y proyectos
        LForm := Tfrm_enviosDatosUsuarios.Create(Application);
        try
          iGlow_EnviosDatos.GlowColor := $FFE94E00;
          LForm.idUsusarioReceptor := idUsuarioReceptor;
          LForm.nombreUsuarioReceptor := nombreUsuarioReceptor;
          LForm.ShowModal;
        finally
          LForm.Free;
        end;
      end;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de grid_EDOStakesCellClick.
/// </summary>
procedure TfrmMain.pm_EDOPopup(Sender: TObject);
var
  Nodo: TTMSFNCTreeViewNode;
  EsHito: Boolean;
begin
  Nodo := Trvw_EDO.SelectedNode;

  // Reset general
  popupItem_2.Enabled := False; // eliminar
  popupItem_3.Enabled := False; // opción hito
  MenuItem24.Enabled := False; // opción stake
  MenuItem25.Enabled := False; // crear hito
  MenuItem47.Enabled := False; // copiar
  MenuItem48.Enabled := False; // pegar

  if Nodo = nil then
    Exit;

  EsHito := Nodo.Extended;

  // Siempre permitir eliminar
  popupItem_2.Enabled := True;

  if EsHito then
  begin
    popupItem_3.Enabled := True; // acciones de hito
    MenuItem25.Enabled := True; // crear subhito
    // Pegar solo si hay algo copiado
    if nodoCopy <> nil then
      MenuItem48.Enabled := True;
  end
  else
  begin
    MenuItem47.Enabled := True;
    MenuItem24.Enabled := True; // acciones de stake
  end;
end;

/// <summary>
/// Implementa la lógica principal de pm_EDTPopup.
/// </summary>
procedure TfrmMain.pm_EDTPopup(Sender: TObject);
begin
  if copynode = nil then
  begin
    MenuItem46.Enabled := False;
  end
  else
  begin
    MenuItem46.Enabled := True;
  end;
end;

/// <summary>
/// Implementa la lógica principal de ClonarItem.
/// </summary>
procedure TfrmMain.pmCrono0Popup(Sender: TObject);
var
  ARow: Integer;
begin
  ARow := grid_crono0.Selected;
  if grid_crono0.cells[5, ARow] <> '' then
  begin
    // Linea Solo
  end
  else
  begin
    // EDT completa
  end;
end;

/// <summary>
/// Implementa la lógica principal de pm_EDOPopup.
/// </summary>
procedure TfrmMain.popupItem_1Click(Sender: TObject);
var
  Svc: IFMXClipboardService;
  cantidadesCopiadas: TStringList;
  i: Integer;
begin
  cantidadesCopiadas := TStringList.Create;
  with DMPresupuesto.dsTpresupuestosItems.DataSet do
  begin
    DisableControls;
    for i := grid_Presupuestos.Selection.StartRow to grid_Presupuestos.
      Selection.EndRow do
    begin
      First;
      MoveBy(i - 1);
      if grid_Presupuestos.RowSelect[i] then
      begin
        if FieldByName('codAPU').AsString <> '' then
        begin
          cantidadesCopiadas.Add(FloatToStr(FieldByName('cantidad').AsFloat));
        end;
      end;
    end;
    EnableControls;
  end;
  if TPlatformServices.Current.SupportsPlatformService(IFMXClipboardService, Svc)
    then
  begin
    if cantidadesCopiadas.Text <> '' then
      Svc.SetClipboard(cantidadesCopiadas.Text);
  end;
end;

/// <summary>
/// Manejador del evento OnClick de popupItem_2Click.
/// </summary>
procedure TfrmMain.popupItem_2Click(Sender: TObject);
var
  Nodo: TTMSFNCTreeViewNode;
begin
  if Trvw_EDO.SelectedNode = nil then
    Exit;

  Nodo := Trvw_EDO.SelectedNode;

  // No permitir borrar el contenedor raíz
  if Nodo = Trvw_EDO.Nodes[0] then
    Exit;

  Trvw_EDO.BeginUpdate;
  try
    // Si es Hito, eliminar primero sus hijos
    if Nodo.Extended then
      Trvw_EDO.RemoveNodeChildren(Nodo);

    // Eliminar el nodo
    Trvw_EDO.RemoveNode(Nodo);

    // Renumerar toda la estructura
    RenumerarEstructuraCompleta(Trvw_EDO);

  finally
    Trvw_EDO.EndUpdate;
  end;

  // Si necesitas persistir en BD:
  guardarHitoCompleto(Trvw_EDO);
  guardarEDOCompleta(Trvw_EDO);
end;

/// <summary>
/// Manejador del evento OnClick de popupItem_3Click.
/// </summary>
procedure TfrmMain.popupItem_3Click(Sender: TObject);
var
  nodoSeleccionado: TTMSFNCTreeViewNode;
  ValorSeleccionado: string;
  X: Integer;
  Avalue: string;
begin
  nodoSeleccionado := Trvw_EDO.SelectedNode;
  if (nodoSeleccionado <> nil) and (nodoSeleccionado.Extended) then
  begin
    ValorSeleccionado := nodoSeleccionado.Text[0];
    X := AnsiPos(' - ', ValorSeleccionado);
    if X > 0 then
      ValorSeleccionado := Copy(ValorSeleccionado, X + 3,
        Length(ValorSeleccionado)).Trim;
    AValue := HacerPregunta('Descripción:', 'Hito', '1', '', nil);
    if AValue <> '' then
    begin
      RenombrarHito(Trvw_EDO, AValue);
    end;
  end;
end;

procedure TfrmMain.ActivarGridPareto(ADataset: TDataSet; ADataSource:
  TDataSource);
begin
  dbGridConnect_TPresupuestosItems.Active := False;

  if Assigned(ADataset) then
  begin
    if ADataset.Active then
      ADataset.Close;
    ADataset.Open;
  end;

  dbGridConnect_TPresupuestosItems.DataSource := ADataSource;
  dbGridConnect_TPresupuestosItems.Active := True;

  DMPresupuesto.EncabezadoGrid;
  DMPresupuesto.ajustaColor;
end;

procedure TfrmMain.popupItem_Pareto_CuentaClick(Sender: TObject);
begin
  popupItem_pareto_SinAplicar.IsChecked := False;
  popupItem_Pareto_Global.IsChecked := False;

  try
    DMPresupuesto.activaDataSet(3);

    try
      with DMPresupuesto.StoreProc_ParetoCapitulos do
      begin
        Close;
        ParamByName('iCodBase').AsString := base_activa.codBase;
        ParamByName('icodPresupuesto').AsString := codProyecto;
        ParamByName('iRevision').AsString := revision;
        Execute;
      end;
    except
      on E: Exception do
      begin
        MuestraMensajeGiproy('Error',
          'Error ejecutando StoreProc_ParetoCapitulos:' + sLineBreak +
          E.Message);
        Exit;
      end;
    end;

    try
      with DMPresupuesto.qryPCapitulo do
      begin
        Close;
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        Open;
      end;
    except
      on E: Exception do
      begin
        MuestraMensajeGiproy('Error', 'Error ejecutando qryPCapitulo:' +
          sLineBreak + E.Message);
        Exit;
      end;
    end;

    ActivarGridPareto(
      DMPresupuesto.qryPCapitulo,
      DMPresupuesto.dsPCapitulo
      );
  except
    on E: Exception do
      MuestraMensajeGiproy('Error', 'Error general Pareto por capítulo:' +
        sLineBreak +
        E.Message);
  end;
end;

procedure TfrmMain.popupItem_Pareto_GlobalClick(Sender: TObject);
begin
  popupItem_pareto_SinAplicar.IsChecked := False;
  popupItem_Pareto_Cuenta.IsChecked := False;

  try
    DMPresupuesto.activaDataSet(2);

    try
      with DMPresupuesto.StoreProc_ParetoGeneral do
      begin
        Close;
        ParamByName('iCodBase').AsString := base_activa.codBase;
        ParamByName('icodPresupuesto').AsString := codProyecto;
        ParamByName('iRevision').AsString := revision;
        Execute;
      end;
    except
      on E: Exception do
      begin
        MuestraMensajeGiproy('Error', 'Error ejecutando StoreProc_ParetoGeneral:'
          + sLineBreak +
          E.Message);
        Exit;
      end;
    end;

    try
      with DMPresupuesto.qryPareto do
      begin
        Close;
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        Open;
      end;
    except
      on E: Exception do
      begin
        MuestraMensajeGiproy('Error', 'Error ejecutando qryPareto:' + sLineBreak
          + E.Message);
        Exit;
      end;
    end;

    ActivarGridPareto(
      DMPresupuesto.qryPareto,
      DMPresupuesto.dsPareto
      );

  except
    on E: Exception do
      MuestraMensajeGiproy('Error', 'Error general Pareto: ' + sLineBreak +
        E.Message);
  end;
end;

procedure TfrmMain.popupItem_pareto_SinAplicarClick(Sender: TObject);
begin
  popupItem_Pareto_Global.IsChecked := False;
  popupItem_Pareto_Cuenta.IsChecked := False;

  DMPresupuesto.activaDataSet(1);

  ActivarGridPareto(
    DMPresupuesto.QTPresupuestosItems,
    DMPresupuesto.dsTpresupuestosItems
    );
end;

procedure TfrmMain.posicionaCoordGPS(Latitud, Longitud: string);
var
  comandoPosicion: string;
begin
  if Latitud = '' then
    Latitud := '0';
  if Longitud = '' then
    Longitud := '0';
  comandoPosicion := 'setCoordinatesFromApp(' + Latitud + ', ' +
    Longitud + ');';
  webBrowser_1.ExecuteJavascript(comandoPosicion);
end;

/// <summary>
/// Implementa la lógica principal de posicionOPC_OtrosServicios.
/// </summary>
procedure TfrmMain.posicionOPC_OtrosServicios(opcion: Integer);
var
  X: Integer;
  th2: thEnviarMensajeComicacion;
begin
  if opcion > 0 then
    tbc_PreciosUnitarios.ActiveTab := tab_OtrosServicios;
  iGlow_Grupo.Enabled := False;
  iGlow_Sincronizar.Enabled := False;
  iGlow_Varios.Enabled := False;
  iGlow_Suscripciones.Enabled := False;

  iGlow_Suscripciones.GlowColor := TAlphaColorRec.Black;
  iGlow_Varios.GlowColor := TAlphaColorRec.Black;
  iGlow_Grupo.GlowColor := TAlphaColorRec.Black;
  iGlow_Sincronizar.GlowColor := TAlphaColorRec.Black;
  case opcion of
    0:
      begin
        tbc_PreciosUnitarios.ActiveTab := tab_PU_0Vacio;
      end;
    1:
      begin
        frmMain.tmrComunicacion.Enabled := False;
        frmMain.tmrComunicacion.Interval := 1;
        frmMain.tmrComunicacion.Enabled := True;
        iGlow_Grupo.Enabled := True;
        iGlow_Grupo.GlowColor := $FFE94E00;
        Actualiza_UsuariosColaborador();
        tbc_Opciones_OtrosServicios.ActiveTab := tab_Grupo;
      end;
    2:
      begin
        iGlow_Sincronizar.Enabled := True;
        iGlow_Sincronizar.GlowColor := $FFE94E00;
        puedeHacerBackUp := ConsultaEstadoBackUP;
        puedeHacerMigracion := ConsultaEstadoMigracion;
        AjustarEstadosBackUp_Mudanza;
        tbc_Opciones_OtrosServicios.ActiveTab := tab_Sincronizar;
      end;
    3:
      begin
        iGlow_Varios.Enabled := True;
        iGlow_Varios.GlowColor := $FFE94E00;
        tbc_Opciones_OtrosServicios.ActiveTab := tab_Varios;
      end;
    4:
      begin
        iGlow_Suscripciones.Enabled := True;
        iGlow_Suscripciones.GlowColor := $FFE94E00;
        tbc_Opciones_OtrosServicios.ActiveTab := tab_Suscripciones;
      end;
  end;
end;

function TfrmMain.PreguntarSubirCertificadoRuc(const AMsgErrorWS
  : string): Boolean;
var
  Msg: string;
begin
  Msg := 'No se pudo validar el RUC en línea.' + sLineBreak + AMsgErrorWS +
    sLineBreak +
    '¿Desea cargar un certificado RUC en PDF para completar los datos?';

  if realizarPreguntaSiNo(Msg) = mrOk then
    Result := True
  else
    Result := False;
end;

/// <summary>
/// Manejador del evento OnClick de popupItem_Pareto_GlobalClick.
/// </summary>
procedure TfrmMain.rct_10Click(Sender: TObject);
var
  AValue: string;
  Descripcion: string;
  codhitoPadre: string;
  codHito: string;
  nodo, nodoSeleccionado: TTMSFNCTreeViewNode;
begin
  AValue := HacerPregunta('Descripcion', 'Hito', '1', '', nil);
  if AValue <> '' then
  begin
    Descripcion := AValue;
    if Assigned(Trvw_EDO.SelectedNode) then
    begin
      nodoSeleccionado := Trvw_EDO.SelectedNode;
    end
    else
    begin
      nodoSeleccionado := Trvw_EDO.nodes[0];
    end;

    codhitoPadre := daCodNodoHitoPadre(nodoSeleccionado);
    codHito := davalorSiguienteHitoRama(codhitoPadre);
    guardarHito(codhitoPadre, codhitoPadre + '.' + codHito, Descripcion,
      nodoSeleccionado.VirtualNode.Level);
    nodo := Trvw_EDO.AddNode(nodoSeleccionado);
    nodo.Extended := True;
    nodo.Text[0] := codhitoPadre + '.' + codHito + ' - ' + Descripcion;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_19Click.
/// </summary>
procedure TfrmMain.rct_19Click(Sender: TObject);
var
  es_Hito: Boolean;
  nodo: TTMSFNCTreeViewNode;
begin
  // Borrar
  if Trvw_EDO.SelectedNode <> nil then
  begin
    nodo := Trvw_EDO.SelectedNode;
    if nodo.Extended then
      es_Hito := True
    else
      es_Hito := False;
    if es_Hito then
    begin
      Trvw_EDO.RemoveNodeChildren(nodo);
    end;
    Trvw_EDO.RemoveNode(nodo);
    ActualizaHitosyEdos(Trvw_EDO);
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rct_1PresupuestoMouseEnter.
/// </summary>
procedure TfrmMain.rct_1PresupuestoClick(Sender: TObject);
begin
  moverTabPresupuesto(1);
end;

procedure TfrmMain.rct_1PresupuestoMouseEnter(Sender: TObject);
begin
  if rct_1Presupuesto.Fill.Color = $FF606060 then
  begin
    rct_1Presupuesto.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rct_1PresupuestoMouseLeave.
/// </summary>
procedure TfrmMain.rct_1PresupuestoMouseLeave(Sender: TObject);
begin
  if rct_1Presupuesto.Fill.Color = $FFF39200 then
  begin
    rct_1Presupuesto.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_20Click.
/// </summary>
procedure TfrmMain.rct_20Click(Sender: TObject);
var
  node: TTMSFNCTreeViewNode;
  LForm: TfrmAddEDO;
begin
  node := Trvw_EDO.SelectedNode;
  if Assigned(node) then
  begin
    LForm := TfrmAddEDO.Create(Application);
    try
      LForm.nodoSeleccionado := node;
      LForm.ShowModal;
    finally
      LForm.Free;
    end;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_23Click.
/// </summary>
procedure TfrmMain.rct_23Click(Sender: TObject);
var
  nodoEncontrado: TTMSFNCTreeViewNode;
  encontrado: Boolean;
  cadenaBusqueda: string;
  textonodo: string;
  X: Integer;
begin
  nodoEncontrado := Trvw_EDT.SelectedNode;
  if not assigned(nodoEncontrado) then
    exit;
  encontrado := False;
  cadenaBusqueda := edt_EDTBuscar.Text;
  while Assigned(nodoEncontrado) and (not encontrado) and
    (cadenaBusqueda <> '') do
  begin
    nodoEncontrado := nodoEncontrado.GetNext;
    if Assigned(nodoEncontrado) then
    begin
      textonodo := nodoEncontrado.Text[1];
      textonodo := LowerCase(textonodo);
      X := AnsiPos(cadenaBusqueda, textonodo);
      if X > 0 then
      begin
        encontrado := True;
        Trvw_EDT.SelectNode(nodoEncontrado);
      end;
    end;
  end;
end;

procedure TfrmMain.rct_23MouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rct_23, $FFF39200);
end;

procedure TfrmMain.rct_23MouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rct_23);
end;

procedure TfrmMain.rct_24MouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rct_24);
end;

procedure TfrmMain.rct_25MouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rct_25);
end;

procedure TfrmMain.rct_26MouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rct_26);
end;

procedure TfrmMain.rct_25MouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rct_25, $FFF39200);
end;

procedure TfrmMain.rct_26MouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rct_26, $FFF39200);
end;

/// <summary>
/// Manejador del evento OnClick de rct_24Click.
/// </summary>
procedure TfrmMain.rct_24Click(Sender: TObject);
var
  node, subnode: TTMSFNCTreeViewNode;
  Descripcion, codCuenta: string;
  LForm: TfrmOpcionesEDT;
begin
  node := Trvw_EDT.SelectedNode;
  if not assigned(node) then
    Exit;
  LForm := TfrmOpcionesEDT.Create(Application);
  try
    subnode := addNodeEDT(node, '');
    generaCodEDT(subnode);
    Trvw_EDT.ExpandNode(subnode);
    Descripcion := subnode.Text[2];
    codCuenta := subnode.Text[0];
    codCuenta := Trim(codCuenta);
    Descripcion := Trim(Descripcion);
    LForm.lbl_codCuenta.Text := 'Cod. EDT: ' + codCuenta;
    LForm.edt_EDTDescripcion.Text := Descripcion;
    LForm.mmo_EDTObservaciones.Text := subnode.Text[2];
    LForm.lbl_modo.Text := '1';
    populaResponsableEDT(LForm);
    LForm.cbb_EDTResponsable.ItemIndex := -1;
    if subnode.Text[1] <> '' then
    begin
      LForm.SeleccionarResponsable(subnode.Text[1]);
    end;
    LForm.nodoSeleccionado := subnode;
    LForm.ShowModal;
    LForm.edt_EDTDescripcion.SetFocus;
  finally
    LForm.Free;
  end;
end;

procedure TfrmMain.rct_24MouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rct_24, $FFF39200);
end;

procedure TfrmMain.rct_25Click(Sender: TObject);
var
  Point: TPointF;
  X: Integer;
  Y: Integer;
  node: TTMSFNCTreeViewNode;
  codCuenta: string;
  Descripcion: string;
  LForm: TfrmOpcionesEDT;
begin
  node := Trvw_EDT.SelectedNode;
  if not assigned(node) then
  begin
    MuestraMensajeGiproy('Advertencia',
      'Debe de seleccionar al menos una cuenta / apquete.');
    Exit;
  end;

  if node = trvw_edt.Nodes[0] then
  begin
    MuestraMensajeGiproy('Advertencia',
      'No se puede operar sobre Nodo Principal');
    Exit;
  end;

  LForm := TfrmOpcionesEDT.Create(Application);
  try
    Point := Screen.MousePos;
    Point := Application.MainForm.ScreenToClient(Point);
    X := trunc(Point.X);
    Y := trunc(Point.Y);
    LForm.Left := X;
    LForm.Top := Y;

    Descripcion := node.Text[1];
    codCuenta := node.Text[0];
    codCuenta := Trim(codCuenta);
    Descripcion := Trim(Descripcion);
    LForm.lbl_codCuenta.Text := 'Cod. EDT: ' + codCuenta;
    LForm.edt_EDTDescripcion.Text := Descripcion;
    LForm.mmo_EDTObservaciones.Text := node.Text[2];
    LForm.lbl_modo.Text := '2';
    populaResponsableEDT(LForm);
    LForm.cbb_EDTResponsable.ItemIndex := -1;
    if node.Text[1] <> '' then
    begin
      LForm.SeleccionarResponsable(node.Text[1]);
    end;
    LForm.nodoSeleccionado := node;
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_26Click.
/// </summary>
procedure TfrmMain.rct_26Click(Sender: TObject);
var
  subnode: TTMSFNCTreeViewNode;
begin
  subnode := Trvw_EDT.SelectedNode;
  if not assigned(subnode) then
  begin
    MuestraMensajeGiproy('Advertencia',
      'Debe de seleccionar al menos una cuenta / apquete.');
    Exit;
  end;

  if subnode = trvw_edt.Nodes[0] then
  begin
    MuestraMensajeGiproy('Advertencia',
      'No se puede operar sobre Nodo Principal');
    Exit;
  end;

  if realizarPreguntaSiNo('¿Borrar Nodo y Dependencias?') <> mrOK then
    Exit;

  if subnode.GetParent <> nil then
  begin
    subnode.RemoveChildren;
    subnode.Destroy;
    generaCodEDT(Trvw_EDT.nodes[0]);
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_28Click.
/// </summary>
procedure TfrmMain.rct_28Click(Sender: TObject);
begin
  if lyt_tanteoCrono.Height > 0 then
    lyt_tanteoCrono.Height := 0
  else
    lyt_tanteoCrono.Height := 175;
end;

/// <summary>
/// Manejador del evento OnClick de rct_2PresupuestoClick.
/// </summary>
procedure TfrmMain.rct_2PresupuestoClick(Sender: TObject);
begin
  moverTabPresupuesto(3);
end;

/// <summary>
/// Manejador del evento de ratón en rct_2PresupuestoMouseEnter.
/// </summary>
procedure TfrmMain.rct_2PresupuestoMouseEnter(Sender: TObject);
begin
  if rct_2Presupuesto.Fill.Color = $FF606060 then
  begin
    rct_2Presupuesto.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rct_2PresupuestoMouseLeave.
/// </summary>
procedure TfrmMain.rct_2PresupuestoMouseLeave(Sender: TObject);
begin
  if rct_2Presupuesto.Fill.Color = $FFF39200 then
  begin
    rct_2Presupuesto.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_31Click.
/// </summary>
procedure TfrmMain.rct_31Click(Sender: TObject);
begin
  borrarCPC;
end;

/// <summary>
/// Manejador del evento OnClick de rct_32Click.
/// </summary>
procedure TfrmMain.rct_32Click(Sender: TObject);
begin
  EditarCPC;
end;

/// <summary>
/// Manejador del evento OnClick de rct_33Click.
/// </summary>
procedure TfrmMain.rct_33Click(Sender: TObject);
var
  LForm: Tfrm_AddEditCPC;
begin
  LForm := Tfrm_AddEditCPC.Create(Application);
  try
    LForm.lbl_modo.Text := '1';
    LForm.edt_codCPC.Text := '';
    LForm.edt_codCPC.ReadOnly := False;
    LForm.edt_DescripcionCPC.Text := '';
    LForm.cbb_tipo.ItemIndex := 0;
    LForm.lbl_porcentaje.Text := '0 %';
    LForm.lbl_1.Text := 'Crear CPC';
    LForm.lbl_2.Text := 'Nuevo CPC';
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_34Click.
/// </summary>
procedure TfrmMain.rct_34Click(Sender: TObject);
begin
  case cbb_campoCPC.ItemIndex of
    0:
      begin
        dmodule_1.untbl1.OrderFields := 'Descripcion asc';
      end;
    1:
      begin
        dmodule_1.untbl1.OrderFields := 'codCPC asc';
      end;
    2:
      begin
        dmodule_1.untbl1.OrderFields := 'Tipo asc';
      end;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_3PresupuestoClick.
/// </summary>
procedure TfrmMain.rct_3PresupuestoClick(Sender: TObject);
begin
  moverTabPresupuesto(2);
end;

/// <summary>
/// Manejador del evento de ratón en rct_3PresupuestoMouseEnter.
/// </summary>
procedure TfrmMain.rct_3PresupuestoMouseEnter(Sender: TObject);
begin
  if rct_3Presupuesto.Fill.Color = $FF606060 then
  begin
    rct_3Presupuesto.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rct_3PresupuestoMouseLeave.
/// </summary>
procedure TfrmMain.rct_3PresupuestoMouseLeave(Sender: TObject);
begin
  if rct_3Presupuesto.Fill.Color = $FFF39200 then
  begin
    rct_3Presupuesto.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_4PresupuestoClick.
/// </summary>
procedure TfrmMain.rct_4PresupuestoClick(Sender: TObject);
begin
  moverTabPresupuesto(4);
end;

/// <summary>
/// Manejador del evento de ratón en rct_4PresupuestoMouseEnter.
/// </summary>
procedure TfrmMain.rct_4PresupuestoMouseEnter(Sender: TObject);
begin
  if rct_4Presupuesto.Fill.Color = $FF606060 then
  begin
    rct_4Presupuesto.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rct_4PresupuestoMouseLeave.
/// </summary>
procedure TfrmMain.rct_4PresupuestoMouseLeave(Sender: TObject);
begin
  if rct_4Presupuesto.Fill.Color = $FFF39200 then
  begin
    rct_4Presupuesto.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rct_5MouseDown.
/// </summary>
procedure TfrmMain.rct_5MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  edt_RPassword.Password := False;
end;

/// <summary>
/// Implementa la lógica principal de rct_5MouseLeave.
/// </summary>
procedure TfrmMain.rct_5MouseLeave(Sender: TObject);
begin
  edt_RPassword.Password := True;
end;

/// <summary>
/// Implementa la lógica principal de rct_5MouseUp.
/// </summary>
procedure TfrmMain.rct_5MouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  edt_RPassword.Password := True;
end;

/// <summary>
/// Manejador del evento OnClick de rct_5PresupuestoClick.
/// </summary>
procedure TfrmMain.rct_5PresupuestoClick(Sender: TObject);
begin
  moverTabPresupuesto(5);
end;

/// <summary>
/// Manejador del evento de ratón en rct_5PresupuestoMouseEnter.
/// </summary>
procedure TfrmMain.rct_5PresupuestoMouseEnter(Sender: TObject);
begin
  if rct_5Presupuesto.Fill.Color = $FF606060 then
  begin
    rct_5Presupuesto.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rct_5PresupuestoMouseLeave.
/// </summary>
procedure TfrmMain.rct_5PresupuestoMouseLeave(Sender: TObject);
begin
  if rct_5Presupuesto.Fill.Color = $FFF39200 then
  begin
    rct_5Presupuesto.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_6PresupuestoClick.
/// </summary>
procedure TfrmMain.rct_6PresupuestoClick(Sender: TObject);
begin
  if compruebaModeloNegocio(2) then
    moverTabPresupuesto(6);
end;

/// <summary>
/// Manejador del evento de ratón en rct_6PresupuestoMouseEnter.
/// </summary>
procedure TfrmMain.rct_6PresupuestoMouseEnter(Sender: TObject);
begin
  if rct_6Presupuesto.Fill.Color = $FF606060 then
  begin
    rct_6Presupuesto.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rct_6PresupuestoMouseLeave.
/// </summary>
procedure TfrmMain.rct_6PresupuestoMouseLeave(Sender: TObject);
begin
  if rct_6Presupuesto.Fill.Color = $FFF39200 then
  begin
    rct_6Presupuesto.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_7PresupuestoClick.
/// </summary>
procedure TfrmMain.rct_7PresupuestoClick(Sender: TObject);
begin
  if compruebaModeloNegocio(3) then
    moverTabPresupuesto(7);
end;

/// <summary>
/// Manejador del evento de ratón en rct_7PresupuestoMouseEnter.
/// </summary>
procedure TfrmMain.rct_7PresupuestoMouseEnter(Sender: TObject);
begin
  if rct_7Presupuesto.Fill.Color = $FF606060 then
  begin
    rct_7Presupuesto.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rct_7PresupuestoMouseLeave.
/// </summary>
procedure TfrmMain.rct_7PresupuestoMouseLeave(Sender: TObject);
begin
  if rct_7Presupuesto.Fill.Color = $FFF39200 then
  begin
    rct_7Presupuesto.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_8PresupuestoClick.
/// </summary>
procedure TfrmMain.rct_8PresupuestoClick(Sender: TObject);
begin
  if compruebaModeloNegocio(4) then
    moverTabPresupuesto(8);
end;

/// <summary>
/// Manejador del evento de ratón en rct_8PresupuestoMouseEnter.
/// </summary>
procedure TfrmMain.rct_8PresupuestoMouseEnter(Sender: TObject);
begin
  if rct_8Presupuesto.Fill.Color = $FF606060 then
  begin
    rct_8Presupuesto.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rct_8PresupuestoMouseLeave.
/// </summary>
procedure TfrmMain.rct_8PresupuestoMouseLeave(Sender: TObject);
begin
  if rct_8Presupuesto.Fill.Color = $FFF39200 then
  begin
    rct_8Presupuesto.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_btnLoginClick.
/// </summary>
procedure TfrmMain.rct__GuardarNuevoPresupuestoMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  if not guardando then
    GuardarProyecto();
end;

procedure TfrmMain.realizaLogin;
var
  MensajeError: string;
begin
  if (edt_UUsuario.Text = '') or (edt_UPassword.Text = '') then
    Exit;

  FormImportando.Visible := True;
  FormImportando.Show;
  FormImportando.IniciarAnimacion;

  TThread.CreateAnonymousThread(
    procedure
    var
      LoginOK: Boolean;
    begin

      if CheckInternet then
        LoginOK := compruebaUsuario(
          edt_UUsuario.Text,
          edt_UPassword.Text,
          MensajeError
          )
      else
        LoginOK := compruebaUsuarioOffline(
          edt_UUsuario.Text,
          edt_UPassword.Text
          );

      TThread.Synchronize(nil,
        procedure
        begin
          FormImportando.DetenerAnimacion;

          if LoginOK then
          begin
            IniciaNuevoProyecto;
            lyt_LateralOpciones.Enabled := True;
            tbc_PreciosUnitarios.ActiveTab := tab_PU_0Vacio;
            connectaDBEmb;
            SincronizarSecuenciasAPU();
            IniciaReportes('1');
            CargarDecimalesTrabajo;
            CargarPrefijosPaises;
          end
          else
          begin
            edt_UPassword.Text := '';
            edt_UPassword.SetFocus;

            if MensajeError <> '' then
              MuestraMensajeGiproy('Error', MensajeError)
            else
              MuestraMensajeGiproy('Error',
                'No se pudo iniciar sesión.');
          end;
        end);

    end).Start;
end;

procedure TfrmMain.realizaLogin_old;
var
  MensajeError: string;
begin
  if (edt_UUsuario.Text <> '') and (edt_UPassword.Text <> '') then
  begin
    FormImportando.Visible := True;
    FormImportando.Show;
    FormImportando.IniciarAnimacion;

    TThread.CreateAnonymousThread(
      procedure
      begin
        FormImportando.lblTextoAccion.Text := 'Iniciando Sistema y Usuario.';
        if CheckInternet then
        begin
          if compruebaUsuario_old(edt_UUsuario.Text, edt_UPassword.Text,
            MensajeError) then
          begin
            IniciaNuevoProyecto();
            lyt_LateralOpciones.Enabled := True;
            tbc_PreciosUnitarios.ActiveTab := tab_PU_0Vacio;
            TThread.Synchronize(nil,
              procedure
              begin
                EjecutarCargaTiendaOnlineEnThread;
              end);
          end
          else
          begin
            edt_UUsuario.Text := '';
            edt_UPassword.Text := '';
            edt_UUsuario.SetFocus;
            TThread.Synchronize(nil,
              procedure
              begin
                MuestraMensajeGiproy('Error', 'Error 0027: ' + MensajeError);
              end);
          end;
        end
        else
        begin
          if compruebaUsuarioOffline_old(edt_UUsuario.Text, edt_UPassword.Text)
            then
          begin
            IniciaNuevoProyecto();
            lyt_LateralOpciones.Enabled := True;
            tbc_PreciosUnitarios.ActiveTab := tab_PU_0Vacio;
          end
          else
          begin
            edt_UUsuario.Text := '';
            edt_UPassword.Text := '';
            edt_UUsuario.SetFocus;
          end;
        end;
        FormImportando.DetenerAnimacion;
      end).Start;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de Rectangle1Click.
/// </summary>
procedure TfrmMain.rct_btnLoginClick(Sender: TObject);
begin
  Shadow_btnLogin.Enabled := True;
  if REALIZA_LOGIN = 1 then
    realizaLogin_old
  else
  begin
    realizaLogin;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rct_btnLoginMouseDown.
/// </summary>
procedure TfrmMain.rct_btnLoginMouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  Shadow_btnLogin.Enabled := False;
end;

/// <summary>
/// Implementa la lógica principal de rct_btnLoginMouseLeave.
/// </summary>
procedure TfrmMain.rct_btnLoginMouseLeave(Sender: TObject);
begin
  Shadow_btnLogin.Enabled := True;
end;

/// <summary>
/// Manejador del evento OnClick de rect_CPCClick.
/// </summary>
procedure TfrmMain.rct_crono01ParetoClick(Sender: TObject);
var
  h: Single;
  pt: TPointF;
begin
  h := rct_crono01Pareto.Height;
  pt := rct_crono01Pareto.LocalToAbsolute(PointF(0, h));
  pt := Self.ClientToScreen(pt);
  pm_paretoTiempo.Popup(pt.X, pt.Y);
end;

/// <summary>
/// Manejador del evento OnClick de rct_desgEquiposHerramientasClick.
/// </summary>
procedure TfrmMain.rct_desgEquiposHerramientasClick(Sender: TObject);
begin
  muestrarecursosDesagregacion(1);
end;

/// <summary>
/// Manejador del evento de ratón en rct_desgEquiposHerramientasMouseEnter.
/// </summary>
procedure TfrmMain.rct_desgEquiposHerramientasMouseEnter(Sender: TObject);
begin
  if rct_desgEquiposHerramientas.Fill.Color <> $FFE94E1B then
    rct_desgEquiposHerramientas.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rct_desgEquiposHerramientasMouseLeave.
/// </summary>
procedure TfrmMain.rct_desgEquiposHerramientasMouseLeave(Sender: TObject);
begin
  if rct_desgEquiposHerramientas.Fill.Color <> $FFE94E1B then
    rct_desgEquiposHerramientas.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento OnClick de rct_desgManoObraClick.
/// </summary>
procedure TfrmMain.rct_desgManoObraClick(Sender: TObject);
begin
  muestrarecursosDesagregacion(4);
end;

/// <summary>
/// Manejador del evento de ratón en rct_desgManoObraMouseEnter.
/// </summary>
procedure TfrmMain.rct_desgManoObraMouseEnter(Sender: TObject);
begin
  if rct_desgManoObra.Fill.Color <> $FFE94E1B then
    rct_desgManoObra.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rct_desgManoObraMouseLeave.
/// </summary>
procedure TfrmMain.rct_desgManoObraMouseLeave(Sender: TObject);
begin
  if rct_desgManoObra.Fill.Color <> $FFE94E1B then
    rct_desgManoObra.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento OnClick de rct_desgMaterialesClick.
/// </summary>
procedure TfrmMain.rct_desgMaterialesClick(Sender: TObject);
begin
  muestrarecursosDesagregacion(2);
end;

/// <summary>
/// Manejador del evento de ratón en rct_desgMaterialesMouseEnter.
/// </summary>
procedure TfrmMain.rct_desgMaterialesMouseEnter(Sender: TObject);
begin
  if rct_desgMateriales.Fill.Color <> $FFE94E1B then
    rct_desgMateriales.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rct_desgMaterialesMouseLeave.
/// </summary>
procedure TfrmMain.rct_desgMaterialesMouseLeave(Sender: TObject);
begin
  if rct_desgMateriales.Fill.Color <> $FFE94E1B then
    rct_desgMateriales.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento de ratón en rct_desgSeguridadIndustrialMouseEnter.
/// </summary>
procedure TfrmMain.rct_desgSeguridadIndustrialMouseEnter(Sender: TObject);
begin
  if rct_desgSeguridadIndustrial.Fill.Color <> $FFE94E1B then
    rct_desgSeguridadIndustrial.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rct_desgSeguridadIndustrialMouseLeave.
/// </summary>
procedure TfrmMain.rct_desgSeguridadIndustrialMouseLeave(Sender: TObject);
begin
  if rct_desgSeguridadIndustrial.Fill.Color <> $FFE94E1B then
    rct_desgSeguridadIndustrial.Fill.Color := $FF606060;
end;

/// <summary>
/// Implementa la lógica principal de rct_desgSeguridadIndustrialMouseUp.
/// </summary>
procedure TfrmMain.rct_desgSeguridadIndustrialMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  resalta_desgPanelCategoria(5);
  verRecursoDesagregacion(5);
end;

/// <summary>
/// Manejador del evento OnClick de rct_desgTransporteClick.
/// </summary>
procedure TfrmMain.rct_desgTransporteClick(Sender: TObject);
begin
  muestrarecursosDesagregacion(3);
end;

/// <summary>
/// Manejador del evento de ratón en rct_desgTransporteMouseEnter.
/// </summary>
procedure TfrmMain.rct_desgTransporteMouseEnter(Sender: TObject);
begin
  if rct_desgTransporte.Fill.Color <> $FFE94E1B then
    rct_desgTransporte.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rct_desgTransporteMouseLeave.
/// </summary>
procedure TfrmMain.rct_desgTransporteMouseLeave(Sender: TObject);
begin
  if rct_desgTransporte.Fill.Color <> $FFE94E1B then
    rct_desgTransporte.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento OnClick de rct_edtFiltroCPCClearClick.
/// </summary>
procedure TfrmMain.rct_edtFiltroCPCClearClick(Sender: TObject);
begin
  edt_filtroCPC.Text := '';
  rct_edtFiltroCPCClear.Visible := False;
end;

/// <summary>
/// Manejador del evento OnClick de rct_RegistrarUsuarioClick.
/// </summary>
procedure TfrmMain.rct_RegistrarUsuarioClick(Sender: TObject);
var
  Err: string;
  Ok: Boolean;
  LForm: TFormImportando;
begin
  LForm := TFormImportando.Create(Application);
  try
    LForm.Visible := True;
    LForm.Show;
    LForm.IniciarAnimacion;
    TThread.CreateAnonymousThread(
      procedure
      begin
        Ok := realizarRegistro(Err);
        if not Ok then
        begin
          TThread.Synchronize(nil,
            procedure
            begin
              MuestraMensajeGiproy('Error', 'Error 0028: ' + Err);
            end);

        end
        else
        begin
          TThread.Synchronize(nil,
            procedure
            begin
              MuestraMensajeGiproy('Información',
                'Usuario Creado. Por favor verifique su email para confirmar el registro.');
              // frmMain.tmr_Inicio.Enabled := True;
              frmMain.tbc_PreciosUnitarios.ActiveTab := frmMain.tab_Login;
            end);
        end;
        LForm.DetenerAnimacion;
      end).Start;
  finally
    LForm.Free;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_RecursosUsadosClick.
/// </summary>
procedure TfrmMain.rct_StakeBorrarClick(Sender: TObject);
var
  idStake: string;
  nodo: TTMSFNCTreeViewNode;
begin
  if realizarPreguntaSiNo('¿Desea eliminar el Stakeholder seleccionado?' + #13 +
    'Este proceso no es reversible.') <> mrOK then
    Exit;
  nodo := Trvw_StakeHolderDisponibles.SelectedNode;
  if Assigned(nodo) then
  begin
    if not nodo.Extended then
    begin
      nodo := nodo.GetPrevious;
    end;
    idStake := nodo.Text[0];
    borraStakeHolder(idStake);
    populaStakesDisponibles('');
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rct_StakeBorrarMouseEnter.
/// </summary>
procedure TfrmMain.rct_StakeBorrarMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rct_StakeBorrar, $FFF39200);
end;

/// <summary>
/// Implementa la lógica principal de rct_StakeBorrarMouseLeave.
/// </summary>
procedure TfrmMain.rct_StakeBorrarMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rct_StakeBorrar);
end;

/// <summary>
/// Guarda información o cambios realizados en rct__GuardarNuevoPresupuestoMouseUp.
/// </summary>
procedure TfrmMain.rect_115Click(Sender: TObject);
begin
  if ordenacionlistadoCategoiraApus = 1 then
    ordenacionlistadoCategoiraApus := 2
  else
    ordenacionlistadoCategoiraApus := 1;
  rellenaAPUSCategoria(ordenacionlistadoCategoiraApus);
end;

/// <summary>
/// Manejador del evento OnClick de rect_StakeDisponibleAdicionarClick.
/// </summary>
procedure TfrmMain.rect_123MouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  { frmStakes.cbb_Roles.itemindex := 3;
    frmStakes.cbb_Roles.enabled := False;
    limpiaGridStakedisponible();
    frmStakes.lbl_modo.text := '3';
    cargaListadoStake();
    frmStakes.showmodal; }
end;

/// <summary>
/// Implementa la lógica principal de rect_127MouseUp.
/// </summary>
procedure TfrmMain.rect_127MouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  limpiaGlowOPCPresupuestos();
  moverTabPresupuesto(4);
end;

/// <summary>
/// Implementa la lógica principal de rect_130MouseUp.
/// </summary>
procedure TfrmMain.rect_130MouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  { frmStakes.cbb_Roles.itemindex := 2;
    frmStakes.cbb_Roles.enabled := False;
    limpiaGridStakedisponible();
    frmStakes.lbl_modo.text := '2';
    cargaListadoStake();
    frmStakes.showmodal; }
end;

/// <summary>
/// Implementa la lógica principal de rect_132MouseUp.
/// </summary>
procedure TfrmMain.rect_132MouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  { frmStakes.cbb_Roles.itemindex := 4;
    frmStakes.cbb_Roles.enabled := False;
    frmStakes.lbl_modo.text := '4';
    cargaListadoStake();
    limpiaGridStakedisponible();
    frmStakes.showmodal; }
end;

/// <summary>
/// Manejador del evento OnClick de rect_154Click.
/// </summary>
procedure TfrmMain.rect_154Click(Sender: TObject);
begin
  activa_gridCuadrillaTipo();
  cargarValoresCuadrillaTipo();
end;

/// <summary>
/// Manejador del evento OnClick de rect_16Click.
/// </summary>
procedure TfrmMain.rect_16Click(Sender: TObject);
begin
  seleccionOPC(4);
end;

/// <summary>
/// Implementa la lógica principal de rect_24MouseUp.
/// </summary>
procedure TfrmMain.rect_24MouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  { frmStakes.cbb_Roles.itemindex := 1;
    frmStakes.cbb_Roles.enabled := False;
    frmStakes.lbl_modo.text := '1';
    limpiaGridStakedisponible();
    cargaListadoStake();
    frmStakes.showmodal; }
end;

/// <summary>
/// Manejador del evento OnClick de rect_32Click.
/// </summary>
procedure TfrmMain.rect_32Click(Sender: TObject);
var
  LForm: TfrmIndicesFPolinomica;
begin
  LForm := TfrmIndicesFPolinomica.Create(Application);
  try
    dmodule_1.untbl5.Active := True;
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rect_33MouseDown.
/// </summary>
procedure TfrmMain.rect_33MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  edt_UPassword.Password := False;
  rect_33.Fill.Bitmap.Bitmap := il1.Source.Items[0].MultiResBitmap.Bitmaps[1];
end;

/// <summary>
/// Implementa la lógica principal de rect_33MouseLeave.
/// </summary>
procedure TfrmMain.rect_33MouseLeave(Sender: TObject);
begin
  edt_UPassword.Password := True;
  rect_33.Fill.Bitmap.Bitmap := il1.Source.Items[1].MultiResBitmap.Bitmaps[1];
end;

/// <summary>
/// Implementa la lógica principal de rect_33MouseUp.
/// </summary>
procedure TfrmMain.rect_33MouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  edt_UPassword.Password := True;
  rect_33.Fill.Bitmap.Bitmap := il1.Source.Items[1].MultiResBitmap.Bitmaps[1];
end;

/// <summary>
/// Manejador del evento OnClick de rect_35Click.
/// </summary>
procedure TfrmMain.rect_35Click(Sender: TObject);
var
  LForm: TfrmIndicesFPolinomica;
begin
  LForm := TfrmIndicesFPolinomica.Create(Application);
  try
    dmodule_1.untbl5.Active := True;
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmMain.rect_38Click(Sender: TObject);
begin
  frmMain.tbc_PreciosUnitarios.ActiveTab := frmMain.tab_Login;
end;

procedure TfrmMain.rect_AceptarTanteoClick(Sender: TObject);
var
  codApu: string;
begin
  codApu := DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString;
  if codApu = '' then
    Exit;

  tantear := True;
  try
    DMPresupuesto.TanteoAprobar(codApu);
    lbl_CodAPUAnterior.Text := '';
    MuestraMensajeGiproy('Información', 'Tanteo Aprobado');
  finally
    tantear := False;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_BorrarTanteoClick.
/// </summary>
procedure TfrmMain.rect_ActualizaBackUpClick(Sender: TObject);
begin
  puedeHacerBackUp := ConsultaEstadoBackUP;
end;

/// <summary>
/// Manejador del evento de ratón en rect_ActualizaBackUpMouseEnter.
/// </summary>
procedure TfrmMain.rect_ActualizaBackUpMouseEnter(Sender: TObject);
begin
  iGlow_ActualizaBackUp.Enabled := True;
end;

/// <summary>
/// Actualiza la interfaz o los datos asociados en rect_ActualizaBackUpMouseLeave.
/// </summary>
procedure TfrmMain.rect_ActualizaBackUpMouseLeave(Sender: TObject);
begin
  iGlow_ActualizaBackUp.Enabled := False;
end;

/// <summary>
/// Manejador del evento OnClick de rect_ActualizaMigracionesClick.
/// </summary>
procedure TfrmMain.rect_ActualizaIndicesClick(Sender: TObject);
begin
  actualizaTablasIndices();
  cargaOpcionesIndices();
  MuestraMensajeGiproy('Información', 'Actualización Completa');
end;

/// <summary>
/// Manejador del evento OnClick de rect_ActualizaBackUpClick.
/// </summary>
procedure TfrmMain.rect_ActualizaMigracionesClick(Sender: TObject);
begin
  puedeHacerMigracion := ConsultaEstadoMigracion;
end;

/// <summary>
/// Manejador del evento de ratón en rect_ActualizaMigracionesMouseEnter.
/// </summary>
procedure TfrmMain.rect_ActualizaMigracionesMouseEnter(Sender: TObject);
begin
  iGlow_ActualizaMigraciones.Enabled := True;
end;

/// <summary>
/// Actualiza la interfaz o los datos asociados en rect_ActualizaMigracionesMouseLeave.
/// </summary>
procedure TfrmMain.rect_ActualizaMigracionesMouseLeave(Sender: TObject);
begin
  iGlow_ActualizaMigraciones.Enabled := False;
end;

/// <summary>
/// Manejador del evento OnClick de rect_StakeDisponibleEditarClick.
/// </summary>
procedure TfrmMain.rect_addReferidoClick(Sender: TObject);
begin
  Opciones_Referidos(1);
end;

/// <summary>
/// Manejador del evento de ratón en rect_addReferidoMouseEnter.
/// </summary>
procedure TfrmMain.rect_addReferidoMouseEnter(Sender: TObject);
begin
  if iGlow_addReferido.GlowColor <> $FFE94E00 then
    iGlow_addReferido.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_addReferidoMouseLeave.
/// </summary>
procedure TfrmMain.rect_addReferidoMouseLeave(Sender: TObject);
begin
  if iGlow_addReferido.GlowColor <> $FFE94E00 then
    iGlow_addReferido.Enabled := False;
end;

/// <summary>
/// Manejador del evento OnClick de rect_adicionarDBPresupuestosClick.
/// </summary>
procedure TfrmMain.rect_adicionarDBPresupuestosClick(Sender: TObject);
var
  LForm: TfrmAbrirBase3;
begin
  if (revision = '0') and (CuentaRevisiones < 2) then
  begin
    LForm := TfrmAbrirBase3.Create(Application);
    try
      LForm.lbl_modo.Text := '2';
      LForm.tmr1.Enabled := True;
      LForm.ShowModal;
    finally
      LForm.Free;
    end;
  end
  else
  begin
    MuestraMensajeGiproy('Advertencia',
      'Existe más de una revisión. No es posible cambiar la base de trabajo.');
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_AdicionarIndiceClick.
/// </summary>
procedure TfrmMain.rect_AdicionarIndiceClick(Sender: TObject);
var
  id: Integer;
begin
  if grid_FpolIndicesDisponibles.RowCount < 12 then
  begin
    grid_FpolIndicesDisponibles.RowCount :=
      grid_FpolIndicesDisponibles.RowCount + 1;
    id := grid_FpolIndicesDisponibles.RowCount;
    grid_FpolIndicesDisponibles.cells[0, id - 1] :=
      ponerCerosInicio(IntToStr(id - 1), 2);
    grid_FpolIndicesDisponibles.cells[4, id - 1] := '0,00';
    grid_FpolIndicesDisponibles.cells[5, id - 1] := '0,000';
  end
  else
  begin
    MuestraMensajeGiproy('Advertencia', 'Solo 11 Registros Permitidos.');
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rect_AppClose2MouseEnter.
/// </summary>
procedure TfrmMain.rect_AppClose2Click(Sender: TObject);
begin
  frmMain.tmr_Inicio.Enabled := True;
end;

procedure TfrmMain.rect_AppClose2MouseEnter(Sender: TObject);
begin
  iGlow_AppClose2.Enabled := True;
end;

/// <summary>
/// Libera recursos o cierra el formulario en rect_AppClose2MouseLeave.
/// </summary>
procedure TfrmMain.rect_AppClose2MouseLeave(Sender: TObject);
begin
  iGlow_AppClose2.Enabled := False;
end;

/// <summary>
/// Manejador del evento de ratón en rect_sub3DB1MouseEnter.
/// </summary>
procedure TfrmMain.rect_BorrarTanteoClick(Sender: TObject);
var
  codApu: string;
begin
  if realizarPreguntaSiNo('¿Desea borrar el Tanteo de esta APU?') <> mrOK then
    Exit;

  codApu := DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString;
  if codApu = '' then
    Exit;

  tantear := True;
  try
    DMPresupuesto.TanteoRechazar(codApu);
    cierraGridTanteo();
  finally
    tantear := False;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_115Click.
/// </summary>
procedure TfrmMain.rect_cat1EquiposHerramientasClick(Sender: TObject);
begin
  SeleccionaCategoria(1);
end;

procedure TfrmMain.rect_cat1EquiposHerramientasMouseEnter(Sender: TObject);
begin
  if rect_cat1EquiposHerramientas.Fill.Color = $FF606060 then
  begin
    rect_cat1EquiposHerramientas.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rect_cat1EquiposHerramientasMouseLeave.
/// </summary>
procedure TfrmMain.rect_cat1EquiposHerramientasMouseLeave(Sender: TObject);
begin
  if rect_cat1EquiposHerramientas.Fill.Color = $FFF39200 then
  begin
    rect_cat1EquiposHerramientas.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rect_cat2MaterialesMouseEnter.
/// </summary>
procedure TfrmMain.rect_cat2MaterialesClick(Sender: TObject);
begin
  SeleccionaCategoria(2);
end;

procedure TfrmMain.rect_cat2MaterialesMouseEnter(Sender: TObject);
begin
  if rect_cat2Materiales.Fill.Color = $FF606060 then
  begin
    rect_cat2Materiales.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rect_cat2MaterialesMouseLeave.
/// </summary>
procedure TfrmMain.rect_cat2MaterialesMouseLeave(Sender: TObject);
begin
  if rect_cat2Materiales.Fill.Color = $FFF39200 then
  begin
    rect_cat2Materiales.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rect_cat3TransporteMouseEnter.
/// </summary>
procedure TfrmMain.rect_cat3TransporteClick(Sender: TObject);
begin
  SeleccionaCategoria(3);
end;

procedure TfrmMain.rect_cat3TransporteMouseEnter(Sender: TObject);
begin
  if rect_cat3Transporte.Fill.Color = $FF606060 then
  begin
    rect_cat3Transporte.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rect_cat3TransporteMouseLeave.
/// </summary>
procedure TfrmMain.rect_cat3TransporteMouseLeave(Sender: TObject);
begin
  if rect_cat3Transporte.Fill.Color = $FFF39200 then
  begin
    rect_cat3Transporte.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rect_cat4ManodeObraMouseEnter.
/// </summary>
procedure TfrmMain.rect_cat4ManodeObraClick(Sender: TObject);
begin
  SeleccionaCategoria(4);
end;

procedure TfrmMain.rect_cat4ManodeObraMouseEnter(Sender: TObject);
begin
  if rect_cat4ManodeObra.Fill.Color = $FF606060 then
  begin
    rect_cat4ManodeObra.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rect_cat4ManodeObraMouseLeave.
/// </summary>
procedure TfrmMain.rect_cat4ManodeObraMouseLeave(Sender: TObject);
begin
  if rect_cat4ManodeObra.Fill.Color = $FFF39200 then
  begin
    rect_cat4ManodeObra.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rect_cat5SeguridadIndustrialMouseEnter.
/// </summary>
procedure TfrmMain.rect_cat5SeguridadIndustrialClick(Sender: TObject);
begin
  SeleccionaCategoria(5);
end;

procedure TfrmMain.rect_cat5SeguridadIndustrialMouseEnter(Sender: TObject);
begin
  if rect_cat5SeguridadIndustrial.Fill.Color = $FF606060 then
  begin
    rect_cat5SeguridadIndustrial.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rect_cat5SeguridadIndustrialMouseLeave.
/// </summary>
procedure TfrmMain.rect_cat5SeguridadIndustrialMouseLeave(Sender: TObject);
begin
  if rect_cat5SeguridadIndustrial.Fill.Color = $FFF39200 then
  begin
    rect_cat5SeguridadIndustrial.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rect_Opc1MouseEnter.
/// </summary>
procedure TfrmMain.rect_cat6PreciosUnitariosClick(Sender: TObject);
begin
  SeleccionaCategoria(6);
end;

procedure TfrmMain.rect_cat6PreciosUnitariosMouseEnter(Sender: TObject);
begin
  if rect_cat6PreciosUnitarios.Fill.Color = $FF606060 then
  begin
    rect_cat6PreciosUnitarios.Fill.Color := $FFF39200;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rect_cat6PreciosUnitariosMouseLeave.
/// </summary>
procedure TfrmMain.rect_cat6PreciosUnitariosMouseLeave(Sender: TObject);
begin
  if rect_cat6PreciosUnitarios.Fill.Color = $FFF39200 then
  begin
    rect_cat6PreciosUnitarios.Fill.Color := $FF606060;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rct_10Click.
/// </summary>
procedure TfrmMain.rect_closeAppMouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  frmMain.Close;
end;

/// <summary>
/// Manejador del evento OnClick de rect_configRepotesClick.
/// </summary>
procedure TfrmMain.rect_configRepotesClick(Sender: TObject);
var
  LForm: TfrmAbrirBase3;
begin
  if ProyectocumpleRequisitosMinimos() then
  begin
    if (revision = '0') and (CuentaRevisiones < 2) then
    begin
      LForm := TfrmAbrirBase3.Create(Application);
      try
        LForm.lbl_modo.Text := '2';
        LForm.tmr1.Enabled := True;
        LForm.ShowModal;
        if LForm.ModalResult = mrOK then
        begin
          lbl_NBaseProyecto.Text := base_activa.Nombre;
        end;
      finally
        LForm.Free;
      end;
    end
    else
    begin
      MuestraMensajeGiproy('Advertencia',
        'Existe más de una revisión. No es posible cambiar la base de trabajo.');
    end;
  end
  else
  begin
    MuestraMensajeGiproy('Advertencia',
      'Complete los datos antes de seleccionar la base padre de trabajo.');
  end;
end;

/// <summary>
/// Implementa la lógica principal de rect_crearPresupuestoMouseUp.
/// </summary>
procedure TfrmMain.rect_CPCClick(Sender: TObject);
begin
  if tbcCPC.ActiveTab = tab_DesagregacionCPC then
  begin
    tbcCPC.ActiveTab := tab_CPC1;
    grid_desagregacionCPC.Options.Selection.Mode :=
      TTMSFNCGridSelectionMode(smSingleRow);
    grid_desagregacionCPC.Options.ColumnSize.Stretch := True;
  end
  else
  begin
    tbcCPC.ActiveTab := tab_DesagregacionCPC;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_crearBackUpClick.
/// </summary>
procedure TfrmMain.rect_crearBackUpClick(Sender: TObject);
var
  respuesta: Integer;
begin
  respuesta := realizarPreguntaSiNo
    ('¿Desea ejecutar la mudanza en este ordenador?');
  if respuesta = 1 then
    generaBackUP(False);
end;

/// <summary>
/// Manejador del evento de ratón en rect_crearBackUpMouseEnter.
/// </summary>
procedure TfrmMain.rect_crearBackUpMouseEnter(Sender: TObject);
begin
  iGlow_crearBackUP.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_crearBackUpMouseLeave.
/// </summary>
procedure TfrmMain.rect_crearBackUpMouseLeave(Sender: TObject);
begin
  iGlow_crearBackUP.Enabled := False;
end;

/// <summary>
/// Manejador del evento OnClick de rect_CrearMigracionClick.
/// </summary>
procedure TfrmMain.rect_CrearMigracionClick(Sender: TObject);
begin
  if PreguntarSiEjecutarMudanza = 1 then
  begin
    MuestraMensajeGiproy('Información',
      'Sincronización para mudanza realizada.');
  end
  else
  begin
    MuestraMensajeGiproy('Error',
      'Error 0029: Error al realizar la Sincronización.');
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rect_CrearMigracionMouseEnter.
/// </summary>
procedure TfrmMain.rect_CrearMigracionMouseEnter(Sender: TObject);
begin
  if rect_CrearMigracion.Enabled then
    iGlow_CrearMigracion.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_CrearMigracionMouseLeave.
/// </summary>
procedure TfrmMain.rect_CrearMigracionMouseLeave(Sender: TObject);
begin
  if rect_CrearMigracion.Enabled then
    iGlow_CrearMigracion.Enabled := False;
end;

/// <summary>
/// Manejador del evento OnClick de rct_crono01ParetoClick.
/// </summary>
procedure TfrmMain.rect_crearPresupuestoMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  limpiaGlowOPCPresupuestos();
  moverTabPresupuesto(1);
end;

/// <summary>
/// Implementa la lógica principal de rect_HistoricoPresupuestosMouseUp.
/// </summary>
procedure TfrmMain.rect_EditaIndirectosMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
var
  i: Integer;
  LForm: TfrmPorcentajesIndirectos;
begin
  LForm := TfrmPorcentajesIndirectos.Create(Application);
  try
    if Length(listadoIndirectos) > -1 then
    begin
      iGlow_Presupuestos_SeleccionarIndirectos.Enabled := True;
      LForm.grid_CostosIndirectosPresupuesto.ClearNormalCells;
      LForm.grid_CostosIndirectosPresupuesto.cells[0, 0] := '#';
      LForm.grid_CostosIndirectosPresupuesto.cells[1, 0] := 'Cuenta';
      LForm.grid_CostosIndirectosPresupuesto.cells[3, 0] := 'Observaciones';
      LForm.grid_CostosIndirectosPresupuesto.cells[2, 0] := '%';
      LForm.grid_CostosIndirectosPresupuesto.RowCount := 1;
      for i := 0 to Length(listadoIndirectos) - 1 do
      begin
        LForm.grid_CostosIndirectosPresupuesto.RowCount := i + 2;
        LForm.grid_CostosIndirectosPresupuesto.cells[0, i + 1] :=
          IntToStr(i + 1);
        LForm.grid_CostosIndirectosPresupuesto.cells[1, i + 1] :=
          listadoIndirectos[i].cuenta;
        LForm.grid_CostosIndirectosPresupuesto.cells[3, i + 1] :=
          listadoIndirectos[i].observaciones;
        LForm.grid_CostosIndirectosPresupuesto.cells[2, i + 1] :=
          listadoIndirectos[i].porcentaje;
      end;
      LForm.lbl_modo.Text := '2';
      LForm.cbb_costosIndirectosCat.ItemIndex := 0;
      LForm.ShowModal;
    end;
  finally
    LForm.Free;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_PTanteoClick.
/// </summary>
procedure TfrmMain.rect_enviosDatosClick(Sender: TObject);
begin
  Opciones_Referidos(4);
end;

/// <summary>
/// Manejador del evento de ratón en rect_enviosDatosMouseEnter.
/// </summary>
procedure TfrmMain.rect_enviosDatosMouseEnter(Sender: TObject);
begin
  if iGlow_EnviosDatos.GlowColor <> $FFE94E00 then
    iGlow_EnviosDatos.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_enviosDatosMouseLeave.
/// </summary>
procedure TfrmMain.rect_enviosDatosMouseLeave(Sender: TObject);
begin
  if iGlow_EnviosDatos.GlowColor <> $FFE94E00 then
    iGlow_EnviosDatos.Enabled := True;
end;

/// <summary>
/// Manejador del evento OnClick de rect_MensajesClick.
/// </summary>
procedure TfrmMain.rect_FiltroAPUS_TodosClick(Sender: TObject);
var
  CodSubCategoria: Integer;
begin
  edt_FiltroAPUS.Text := '';
  CodSubCategoria := StrToIntDef(lbl_FiltroSubCategoriaID.Text, -1);
  DMPresupuesto.filtrarAPUS_Categoria('', CodSubCategoria);
end;

/// <summary>
/// Manejador del evento de ratón en rect_FiltroAPUS_TodosMouseEnter.
/// </summary>
procedure TfrmMain.rect_FiltroAPUS_TodosMouseEnter(Sender: TObject);
begin
  iGlow_FiltroAPUS_Todos.Enabled := True;
end;

/// <summary>
/// Gestiona operaciones relacionadas con APU en rect_FiltroAPUS_TodosMouseLeave.
/// </summary>
procedure TfrmMain.rect_FiltroAPUS_TodosMouseLeave(Sender: TObject);
begin
  iGlow_FiltroAPUS_Todos.Enabled := False;
end;

/// <summary>
/// Manejador del evento OnClick de rect_FiltroSubcategoria_todosClick.
/// </summary>
procedure TfrmMain.rect_FiltroSubcategoria_todosClick(Sender: TObject);
var
  codSubCategoriaApu: Integer;
begin
  lbl_FiltroSubCategoriaID.Text := '-1';
  codSubCategoriaApu := StrToIntDef(lbl_FiltroSubCategoriaID.Text, -1);
  edt_FiltroSubCategorias.Text := '';
  edt_FiltroAPUS.Text := '';
  DMPresupuesto.filtrarNombreSubCategoria(-1, edt_FiltroSubCategorias.Text);
  DMPresupuesto.filtrarAPUS_Categoria(edt_FiltroAPUS.Text, codSubCategoriaApu);
end;

/// <summary>
/// Manejador del evento de ratón en rect_FiltroSubcategoria_todosMouseEnter.
/// </summary>
procedure TfrmMain.rect_FiltroSubcategoria_todosMouseEnter(Sender: TObject);
begin
  iGlow_FiltroSubcategorias_todos.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_FiltroSubcategoria_todosMouseLeave.
/// </summary>
procedure TfrmMain.rect_FiltroSubcategoria_todosMouseLeave(Sender: TObject);
begin
  iGlow_FiltroSubcategorias_todos.Enabled := False;
end;

/// <summary>
/// Manejador del evento OnClick de rect_FpoliEquiposyHerramientasClick.
/// </summary>
procedure TfrmMain.rect_FpoliEquiposyHerramientasClick(Sender: TObject);
begin
  resalta_fPoliPanelCategoria(1);
end;

/// <summary>
/// Manejador del evento de ratón en rect_FpoliEquiposyHerramientasMouseEnter.
/// </summary>
procedure TfrmMain.rect_FpoliEquiposyHerramientasMouseEnter(Sender: TObject);
begin
  if rect_FpoliEquiposyHerramientas.Fill.Color <> $FFE94E1B then
    rect_FpoliEquiposyHerramientas.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rect_FpoliEquiposyHerramientasMouseLeave.
/// </summary>
procedure TfrmMain.rect_FpoliEquiposyHerramientasMouseLeave(Sender: TObject);
begin
  if rect_FpoliEquiposyHerramientas.Fill.Color <> $FFE94E1B then
    rect_FpoliEquiposyHerramientas.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento OnClick de rect_FpoliManoObraClick.
/// </summary>
procedure TfrmMain.rect_FpoliManoObraClick(Sender: TObject);
begin
  resalta_fPoliPanelCategoria(4);
end;

/// <summary>
/// Manejador del evento de ratón en rect_FpoliManoObraMouseEnter.
/// </summary>
procedure TfrmMain.rect_FpoliManoObraMouseEnter(Sender: TObject);
begin
  if rect_FpoliManoObra.Fill.Color <> $FFE94E1B then
    rect_FpoliManoObra.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rect_FpoliManoObraMouseLeave.
/// </summary>
procedure TfrmMain.rect_FpoliManoObraMouseLeave(Sender: TObject);
begin
  if rect_FpoliManoObra.Fill.Color <> $FFE94E1B then
    rect_FpoliManoObra.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento OnClick de rect_FpoliMaterialesClick.
/// </summary>
procedure TfrmMain.rect_FpoliMaterialesClick(Sender: TObject);
begin
  resalta_fPoliPanelCategoria(2);
end;

/// <summary>
/// Manejador del evento de ratón en rect_FpoliMaterialesMouseEnter.
/// </summary>
procedure TfrmMain.rect_FpoliMaterialesMouseEnter(Sender: TObject);
begin
  if rect_FpoliMateriales.Fill.Color <> $FFE94E1B then
    rect_FpoliMateriales.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rect_FpoliMaterialesMouseLeave.
/// </summary>
procedure TfrmMain.rect_FpoliMaterialesMouseLeave(Sender: TObject);
begin
  if rect_FpoliMateriales.Fill.Color <> $FFE94E1B then
    rect_FpoliMateriales.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento de ratón en rect_FpoliSeguridadIndustrialMouseEnter.
/// </summary>
procedure TfrmMain.rect_FpoliSeguridadIndustrialMouseEnter(Sender: TObject);
begin
  if rect_FpoliSeguridadIndustrial.Fill.Color <> $FFE94E1B then
    rect_FpoliSeguridadIndustrial.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rect_FpoliSeguridadIndustrialMouseLeave.
/// </summary>
procedure TfrmMain.rect_FpoliSeguridadIndustrialMouseLeave(Sender: TObject);
begin
  if rect_FpoliSeguridadIndustrial.Fill.Color <> $FFE94E1B then
    rect_FpoliSeguridadIndustrial.Fill.Color := $FF606060;
end;

/// <summary>
/// Implementa la lógica principal de rect_FpoliSeguridadIndustrialMouseUp.
/// </summary>
procedure TfrmMain.rect_FpoliSeguridadIndustrialMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  resalta_fPoliPanelCategoria(5);
end;

/// <summary>
/// Manejador del evento OnClick de rect_FpoliTransporteClick.
/// </summary>
procedure TfrmMain.rect_FpoliTransporteClick(Sender: TObject);
begin
  resalta_fPoliPanelCategoria(3);
end;

/// <summary>
/// Manejador del evento de ratón en rect_FpoliTransporteMouseEnter.
/// </summary>
procedure TfrmMain.rect_FpoliTransporteMouseEnter(Sender: TObject);
begin
  if rect_FpoliTransporte.Fill.Color <> $FFE94E1B then
    rect_FpoliTransporte.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rect_FpoliTransporteMouseLeave.
/// </summary>
procedure TfrmMain.rect_FpoliTransporteMouseLeave(Sender: TObject);
begin
  if rect_FpoliTransporte.Fill.Color <> $FFE94E1B then
    rect_FpoliTransporte.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento de ratón en rect_AceptarEditSeriesMouseEnter.
/// </summary>
procedure TfrmMain.rect_HistoricoPresupuestosMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  limpiaGlowOPCPresupuestos();
  moverTabPresupuesto(2);
end;

/// <summary>
/// Manejador del evento OnClick de rect_ImagenGeoReferenciaProyectoDblClick.
/// </summary>
procedure TfrmMain.rect_ImagenGeoReferenciaProyectoDblClick(Sender: TObject);
var
  codProyecto, revision: string;
begin
  codProyecto := frmMain.edt_CodigoPresupuesto1.Text;
  revision := frmMain.lbl_RevisionPresupuesto.Text;
  { if (codProyecto <> '') and (revision <> '') then
    cargaImagenesReferencia(codProyecto, revision, 2); }
end;

/// <summary>
/// Implementa la lógica principal de rect_NotasPresupuestoMouseUp.
/// </summary>
procedure TfrmMain.rect_MensajesClick(Sender: TObject);
begin
  Opciones_Referidos(3);
end;

/// <summary>
/// Manejador del evento de ratón en rect_MensajesMouseEnter.
/// </summary>
procedure TfrmMain.rect_MensajesMouseEnter(Sender: TObject);
begin
  if iGlow_Mensajes.GlowColor <> $FFE94E00 then
    iGlow_Mensajes.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_MensajesMouseLeave.
/// </summary>
procedure TfrmMain.rect_MensajesMouseLeave(Sender: TObject);
begin
  if iGlow_Mensajes.GlowColor <> $FFE94E00 then
    iGlow_Mensajes.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_MuestraVisorEDTMouseUp.
/// </summary>
procedure TfrmMain.rect_MuestraVisorEDTMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
var
  LForm: TfrmVisorEDT;
begin
  iGlow_VisorEDT.Enabled := True;
  LForm := TfrmVisorEDT.Create(application);
  try
    Lform.ShowModal;
  finally
    Lform.free;
  end;
  iGlow_VisorEDT.Enabled := False;
end;

/// <summary>
/// Implementa la lógica principal de rect_EditaIndirectosMouseUp.
/// </summary>
procedure TfrmMain.rect_NotasPresupuestoMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
var
  LForm: TfrmVisorNotas;
begin
  LForm := TfrmVisorNotas.Create(Application);
  try
    LForm.mostrarNotasExt;
    iGlow_NotasGenerales.Enabled := True;
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_NPresupuestoIMG1Click.
/// </summary>
procedure TfrmMain.rect_NPresupuestoIMG1Click(Sender: TObject);
var
  OpenDialog: TOpenDialog;
begin
  OpenDialog := TOpenDialog.Create(Self);
  OpenDialog.InitialDir := 'C:\';
  OpenDialog.Filter := 'Imagen JPG (*.jpg)|*.jpg|Imagen PNG (*.png)|*.png';
  OpenDialog.Execute;
  if OpenDialog.FileName <> '' then
  begin

  end;
  OpenDialog.Free;
end;

/// <summary>
/// Manejador del evento OnClick de lbl10Click.
/// </summary>
procedure TfrmMain.rect_OPC1_APUSClick(Sender: TObject);
begin
  if base_activa.codBase <> '' then
  begin
    limpiaOPC1;
    rect_OPC1_APUS.Fill.Bitmap.Bitmap := img_OPC1_Apus.MultiResBitmap[0].Bitmap;
    tbcSubMenu3.GotoVisibleTab(4, TTabTransition.Slide,
      TTabTransitionDirection.Normal);
    moverTab(3);
  end
  else
  begin
    MuestraMensajeGiproy('Advertencia',
      'Por favor, seleccione o cree una base de trabajo.');
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rect_OPC1_APUSMouseEnter.
/// </summary>
procedure TfrmMain.rect_OPC1_APUSMouseEnter(Sender: TObject);
begin
  iGlow_OPC1_Apus.Enabled := True;
end;

/// <summary>
/// Gestiona operaciones relacionadas con APU en rect_OPC1_APUSMouseLeave.
/// </summary>
procedure TfrmMain.rect_OPC1_APUSMouseLeave(Sender: TObject);
begin
  iGlow_OPC1_Apus.Enabled := False;
end;

/// <summary>
/// Manejador del evento de ratón en rect_OPC1_OpcionesMouseEnter.
/// </summary>
procedure TfrmMain.rect_OPC1_OpcionesClick(Sender: TObject);
begin
  limpiaOPC1;
  rect_OPC1_Opciones.Fill.Bitmap.Bitmap := img_OPC1_Opciones.MultiResBitmap
    [0].Bitmap;
  moverTab(0);
end;

procedure TfrmMain.rect_OPC1_OpcionesMouseEnter(Sender: TObject);
begin
  iGlow_OPC1_Opciones.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_OPC1_OpcionesMouseLeave.
/// </summary>
procedure TfrmMain.rect_OPC1_OpcionesMouseLeave(Sender: TObject);
begin
  iGlow_OPC1_Opciones.Enabled := False;
end;

/// <summary>
/// Manejador del evento de ratón en rect_OPC1_RecursosMouseEnter.
/// </summary>
procedure TfrmMain.rect_OPC1_RecursosClick(Sender: TObject);
begin
  if base_activa.codBase <> '' then
  begin
    limpiaOPC1;
    rect_OPC1_Recursos.Fill.Bitmap.Bitmap := img_OPC1_Recursos.MultiResBitmap
      [0].Bitmap;
    moverTab(2);
  end
  else
  begin
    MuestraMensajeGiproy('Advertencia',
      'Por favor, seleccione o cree una base de trabajo.');
  end;
end;

procedure TfrmMain.rect_OPC1_RecursosMouseEnter(Sender: TObject);
begin
  iGlow_OPC1_Recursos.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_OPC1_RecursosMouseLeave.
/// </summary>
procedure TfrmMain.rect_OPC1_RecursosMouseLeave(Sender: TObject);
begin
  iGlow_OPC1_Recursos.Enabled := False;
end;

/// <summary>
/// Manejador del evento de ratón en rect_OPC1_SubcategoriasMouseEnter.
/// </summary>
procedure TfrmMain.rect_OPC1_SubcategoriasClick(Sender: TObject);
begin
  if base_activa.codBase <> '' then
  begin
    limpiaOPC1;
    rect_OPC1_Subcategorias.Fill.Bitmap.Bitmap :=
      img_OPC1_Subcategorias.MultiResBitmap[0].Bitmap;
    moverTab(1);
  end
  else
  begin
    MuestraMensajeGiproy('Advertencia',
      'Por favor, seleccione o cree una base de trabajo.');
  end;
end;

procedure TfrmMain.rect_OPC1_SubcategoriasMouseEnter(Sender: TObject);
begin
  iGlow_OPC1_Subcategorias.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_OPC1_SubcategoriasMouseLeave.
/// </summary>
procedure TfrmMain.rect_OPC1_SubcategoriasMouseLeave(Sender: TObject);
begin
  iGlow_OPC1_Subcategorias.Enabled := False;
end;

/// <summary>
/// Manejador del evento de ratón en rect_OPCRec1MouseEnter.
/// </summary>
procedure TfrmMain.rect_Opc1Click(Sender: TObject);
begin
  seleccionOPC(1);
end;

procedure TfrmMain.rect_Opc1MouseEnter(Sender: TObject);
begin
  if tbcSubMenu2.ActiveTab <> tab_Sub2_1PreciosUnitarios then
  begin
    rect_Opc1.Fill.Gradient := rect_OpcBase2.Fill.Gradient;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rect_Opc1MouseLeave.
/// </summary>
procedure TfrmMain.rect_Opc1MouseLeave(Sender: TObject);
begin
  if tbcSubMenu2.ActiveTab <> tab_Sub2_1PreciosUnitarios then
  begin
    rect_Opc1.Fill.Gradient := rect_OpcBase.Fill.Gradient;
  end;
end;

procedure TfrmMain.rect_OPC2_CrearPresupuestoClick(Sender: TObject);
begin
  limpiaOPC2;
  rect_OPC2_CrearPresupuesto.Fill.Bitmap.Bitmap :=
    img_OPC2_CrearPresupuestos.MultiResBitmap[0].Bitmap;
  tbcSubMenu3.GotoVisibleTab(5, TTabTransition.Slide,
    TTabTransitionDirection.Normal);
  tbc_PreciosUnitarios.ActiveTab := tab_PU_0Vacio;
end;

/// <summary>
/// Manejador del evento de ratón en rect_OPC2_CrearPresupuestoMouseEnter.
/// </summary>
procedure TfrmMain.rect_OPC2_CrearPresupuestoMouseEnter(Sender: TObject);
begin
  iGlow_OPC2_CrearPresupuesto.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_OPC2_CrearPresupuestoMouseLeave.
/// </summary>
procedure TfrmMain.rect_OPC2_CrearPresupuestoMouseLeave(Sender: TObject);
begin
  iGlow_OPC2_CrearPresupuesto.Enabled := False;
end;

/// <summary>
/// Manejador del evento de ratón en rect_OPC2_HistoricoPresupuestosMouseEnter.
/// </summary>
procedure TfrmMain.rect_OPC2_HistoricoPresupuestosMouseEnter(Sender: TObject);
begin
  iGlow_OPC2_HistoricoPresupuestos.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_OPC2_HistoricoPresupuestosMouseLeave.
/// </summary>
procedure TfrmMain.rect_OPC2_HistoricoPresupuestosMouseLeave(Sender: TObject);
begin
  iGlow_OPC2_HistoricoPresupuestos.Enabled := False;
end;

/// <summary>
/// Manejador del evento OnClick de rect_Opc3Click.
/// </summary>
procedure TfrmMain.rect_Opc2Click(Sender: TObject);
begin
  limpiaGlowOPCPresupuestos();
  seleccionOPC(2);
end;

procedure TfrmMain.rect_Opc2MouseEnter(Sender: TObject);
begin
  if tbcSubMenu2.ActiveTab <> tab_Sub2_2Presupuestos then
    rect_Opc2.Fill.Gradient := rect_OpcBase2.Fill.Gradient;
end;

/// <summary>
/// Implementa la lógica principal de rect_Opc2MouseLeave.
/// </summary>
procedure TfrmMain.rect_Opc2MouseLeave(Sender: TObject);
begin
  if tbcSubMenu2.ActiveTab <> tab_Sub2_2Presupuestos then
  begin
    rect_Opc2.Fill.Gradient := rect_OpcBase.Fill.Gradient;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rect_OPC2Rec4EMouseUp.
/// </summary>
procedure TfrmMain.rect_OPC2Rec4EMouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  if lyt_OPCRec4.Height = 400 then
  begin
    lyt_OPCRec4.Height := 35;
  end
  else
  begin
    lyt_OPCRec4.Height := 400;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_OPC2_CrearPresupuestoClick.
/// </summary>
procedure TfrmMain.rect_Opc3Click(Sender: TObject);
begin
  limpiaGlowOPCPresupuestos();
  seleccionOPC(3);
end;

/// <summary>
/// Manejador del evento de ratón en rect_Opc3MouseEnter.
/// </summary>
procedure TfrmMain.rect_Opc3MouseEnter(Sender: TObject);
begin
  if tbcSubMenu2.ActiveTab <> tab_sub2_3OtrosServicios then
  begin
    rect_Opc3.Fill.Gradient := rect_OpcBase2.Fill.Gradient;
  end;
end;

/// <summary>
/// Implementa la lógica principal de rect_Opc3MouseLeave.
/// </summary>
procedure TfrmMain.rect_Opc3MouseLeave(Sender: TObject);
begin
  if tbcSubMenu2.ActiveTab <> tab_sub2_3OtrosServicios then
  begin
    rect_Opc3.Fill.Gradient := rect_OpcBase.Fill.Gradient;
  end;
end;

/// <summary>
/// Libera recursos o cierra el formulario en rect_closeAppMouseUp.
/// </summary>
procedure TfrmMain.rect_OPCRec1Click(Sender: TObject);
begin
  cierraLVCategorias(1);
end;

procedure TfrmMain.cierraLVCategorias(opcion: integer);
begin
  lyt_OPCRec1.Height := 35;
  lyt_OPCRec2.Height := 35;
  lyt_OPCRec3.Height := 35;
  lyt_OPCRec4.Height := 35;
  lyt_OPCRec5.Height := 35;
  rect_OPCRec1.Fill.Color := $FF606060;
  rect_OPCRec2.Fill.Color := $FF606060;
  rect_OPCRec3.Fill.Color := $FF606060;
  rect_OPCRec4.Fill.Color := $FF606060;
  rect_OPCRec5.Fill.Color := $FF606060;
  ResaltaPanelOpciones(Opcion);
  VerRecursosCompleto(inttostr(opcion));
end;

procedure TfrmMain.ResaltaPanelOpciones(opcion: integer);
begin
  case opcion of
    1:
      begin
        lvOPCRec2.Selected := nil;
        lvOPCRec3.Selected := nil;
        lvOPCRec4.Selected := nil;
        lvOPCRec5.Selected := nil;

        lyt_OPCRec1.Height := 400;
        rect_OPCRec1.Fill.Color := $FFE94E1B;
      end;
    2:
      begin
        lvOPCRec1.Selected := nil;
        lvOPCRec3.Selected := nil;
        lvOPCRec4.Selected := nil;
        lvOPCRec5.Selected := nil;

        lyt_OPCRec2.Height := 400;
        rect_OPCRec2.Fill.Color := $FFE94E1B;

      end;
    3:
      begin
        lvOPCRec1.Selected := nil;
        lvOPCRec2.Selected := nil;
        lvOPCRec4.Selected := nil;
        lvOPCRec5.Selected := nil;

        lyt_OPCRec3.Height := 400;
        rect_OPCRec3.Fill.Color := $FFE94E1B;
      end;
    4:
      begin
        lvOPCRec1.Selected := nil;
        lvOPCRec2.Selected := nil;
        lvOPCRec3.Selected := nil;
        lvOPCRec5.Selected := nil;

        lyt_OPCRec4.Height := 400;
        rect_OPCRec4.Fill.Color := $FFE94E1B;
      end;
    5:
      begin
        lvOPCRec1.Selected := nil;
        lvOPCRec2.Selected := nil;
        lvOPCRec3.Selected := nil;
        lvOPCRec4.Selected := nil;

        lyt_OPCRec5.Height := 400;
        rect_OPCRec5.Fill.Color := $FFE94E1B;
      end;
  end;
end;

procedure TfrmMain.rect_OPCRec1MouseEnter(Sender: TObject);
begin
  if rect_OPCRec1.Fill.Color <> $FFE94E1B then
    rect_OPCRec1.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rect_OPCRec1MouseLeave.
/// </summary>
procedure TfrmMain.rect_OPCRec1MouseLeave(Sender: TObject);
begin
  if rect_OPCRec1.Fill.Color <> $FFE94E1B then
    rect_OPCRec1.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento de ratón en rect_OPCRec2MouseEnter.
/// </summary>
procedure TfrmMain.rect_OPCRec2Click(Sender: TObject);
begin
  cierraLVCategorias(2);
end;

procedure TfrmMain.rect_OPCRec2MouseEnter(Sender: TObject);
begin
  if rect_OPCRec2.Fill.Color <> $FFE94E1B then
    rect_OPCRec2.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rect_OPCRec2MouseLeave.
/// </summary>
procedure TfrmMain.rect_OPCRec2MouseLeave(Sender: TObject);
begin
  if rect_OPCRec2.Fill.Color <> $FFE94E1B then
    rect_OPCRec2.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento de ratón en rect_OPCRec3MouseEnter.
/// </summary>
procedure TfrmMain.rect_OPCRec3Click(Sender: TObject);
begin
  cierraLVCategorias(3);
end;

procedure TfrmMain.rect_OPCRec3MouseEnter(Sender: TObject);
begin
  if rect_OPCRec3.Fill.Color <> $FFE94E1B then
    rect_OPCRec3.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rect_OPCRec3MouseLeave.
/// </summary>
procedure TfrmMain.rect_OPCRec3MouseLeave(Sender: TObject);
begin
  if rect_OPCRec3.Fill.Color <> $FFE94E1B then
    rect_OPCRec3.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento de ratón en rect_OPCRec4MouseEnter.
/// </summary>
procedure TfrmMain.rect_OPCRec4Click(Sender: TObject);
begin
  cierraLVCategorias(4);
end;

procedure TfrmMain.rect_OPCRec4MouseEnter(Sender: TObject);
begin
  if rect_OPCRec4.Fill.Color <> $FFE94E1B then
    rect_OPCRec4.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rect_OPCRec4MouseLeave.
/// </summary>
procedure TfrmMain.rect_OPCRec4MouseLeave(Sender: TObject);
begin
  if rect_OPCRec4.Fill.Color <> $FFE94E1B then
    rect_OPCRec4.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento de ratón en rect_OPCRec5MouseEnter.
/// </summary>
procedure TfrmMain.rect_OPCRec5Click(Sender: TObject);
begin
  cierraLVCategorias(5);
end;

procedure TfrmMain.rect_OPCRec5MouseEnter(Sender: TObject);
begin
  if rect_OPCRec5.Fill.Color <> $FFE94E1B then
    rect_OPCRec5.Fill.Color := $FFF39200;
end;

/// <summary>
/// Implementa la lógica principal de rect_OPCRec5MouseLeave.
/// </summary>
procedure TfrmMain.rect_OPCRec5MouseLeave(Sender: TObject);
begin
  if rect_OPCRec5.Fill.Color <> $FFE94E1B then
    rect_OPCRec5.Fill.Color := $FF606060;
end;

/// <summary>
/// Manejador del evento OnClick de rect_RecursosSeleccionarTodosClick.
/// </summary>
procedure TfrmMain.rect_Presupuesto_AdicionarNotaClick(Sender: TObject);
var
  tmpstr: string;
  LForm: TfrmNotaPresupuesto;
begin
  LForm := TfrmNotaPresupuesto.Create(Application);
  try
    LForm.lbl_adicional.Text := '0';
    LForm.lbl_descripcionCompleta.Text := 'Nota General';
    LForm.lbl_descripcion.Text := tmpstr;
    LForm.lbl_paquete.Text := 'General';
    LForm.lbl_codEDT.Text := '0';
    LForm.lbl_modo.Text := '2';
    LForm.cargaNota;
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmMain.rect_Presupuesto_AdicionarNotaMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_Presupuesto_AdicionarNota, $FFF39200);
end;

procedure TfrmMain.rect_Presupuesto_AdicionarNotaMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_Presupuesto_AdicionarNota);
end;

/// <summary>
/// Manejador del evento OnClick de rect_Presupuesto_OpcionesParetoClick.
/// </summary>
procedure TfrmMain.rect_Presupuesto_OpcionesParetoClick(Sender: TObject);
var
  h: Single;
  pt: TPointF;
begin
  h := rect_Presupuesto_OpcionesPareto.Height;
  pt := rect_Presupuesto_OpcionesPareto.LocalToAbsolute(PointF(0, h));
  pt := Self.ClientToScreen(pt);
  pm_Pareto.Popup(pt.X, pt.Y);
end;

procedure TfrmMain.rect_Presupuesto_OpcionesParetoMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_Presupuesto_OpcionesPareto, $FFF39200);
end;

procedure TfrmMain.rect_Presupuesto_OpcionesParetoMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_Presupuesto_OpcionesPareto);
end;

procedure TfrmMain.rect_Presupuestos_AbrirTanteoClick(Sender: TObject);
var
  X: Double;
  ARow: Integer;
  codEDT: string;
begin
  X := lyt_Tanteo.Height;
  if X > 0 then
  begin
    cierraGridTanteo
  end
  else
  begin
    ARow := grid_Presupuestos.Selection.StartRow;

    codEDT :=
      DMPresupuesto.dsTpresupuestosItems.DataSet.FieldByName('codEDT').AsString;
    codAPUTanteo :=
      DMPresupuesto.dsTpresupuestosItems.DataSet.FieldByName('codAPU').AsString;

    if (codApuTanteo <> '') and (ARow > 0) then
    begin
      frmMain.lyt_Tanteo.Height := 270;
      iniciaTreeViewTanteo();
      DMPresupuesto.TanteoAsegurarInicio(codApuTanteo);
      restaurarApuTanteo(codApuTanteo, 1);
    end;
  end;
end;

procedure TfrmMain.rect_Presupuestos_AbrirTanteoMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_Presupuestos_AbrirTanteo, $FFF39200);
end;

procedure TfrmMain.rect_Presupuestos_AbrirTanteoMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_Presupuestos_AbrirTanteo);
end;

/// <summary>
/// Manejador del evento OnClick de rect_Presupuestos_LimpiarTanteoClick.
/// </summary>
procedure TfrmMain.rect_Presupuestos_LimpiarTanteoClick(Sender: TObject);
var
  codApu: string;
  X: Integer;
begin
  if realizarPreguntaSiNo('¿Desea borrar TODOS los tanteos del Proyecto?') <>
    mrOK then
    Exit;
  LimpiaTanteoTodaDB;
  cierraGridTanteo;
  DMPresupuesto.calculaTotal;
end;

procedure TfrmMain.rect_Presupuestos_LimpiarTanteoMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_Presupuestos_LimpiarTanteo, $FFF39200);
end;

procedure TfrmMain.rect_Presupuestos_LimpiarTanteoMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_Presupuestos_LimpiarTanteo);
end;

/// <summary>
/// Manejador del evento OnClick de rect_Presupuestos_VisorEDTClick.
/// </summary>
procedure TfrmMain.rect_Presupuestos_NotasGeneralesClick(Sender: TObject);
var
  LForm: TfrmVisorNotas;
begin
  LForm := TfrmVisorNotas.Create(Application);
  try
    LForm.mostrarNotasExt;
    iGlow_NotasGenerales.Enabled := True;
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
  iGlow_NotasGenerales.Enabled := False;
end;

procedure TfrmMain.rect_Presupuestos_NotasGeneralesMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_Presupuestos_NotasGenerales, $FFF39200);
end;

procedure TfrmMain.rect_Presupuestos_NotasGeneralesMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_Presupuestos_NotasGenerales);
end;

procedure TfrmMain.rect_Presupuestos_SeleccionarIndirectosClick(Sender:
  TObject);

  procedure MarcarRecalculoLineas;
  begin
    DMPresupuesto.FLineasNecesitanRecalculo := True;
  end;

  procedure RefreshQueryGrid(
    AQry: TUniQuery;
    AGrid: TTMSFNCGrid;
    const ABase, APresupuesto, ARevision: string;
    ANDec: Integer);
  begin
    AGrid.BeginUpdate;
    try
      AQry.DisableControls;
      try
        if AQry.State in dsEditModes then
          AQry.Post;

        AQry.Close;

        if AQry.Params.FindParam('ndec') <> nil then
          AQry.ParamByName('ndec').AsInteger := ANDec;

        if AQry.Params.FindParam('icodBase') <> nil then
          AQry.ParamByName('icodBase').AsString := ABase;

        if AQry.Params.FindParam('icodPresupuesto') <> nil then
          AQry.ParamByName('icodPresupuesto').AsString := APresupuesto;

        if AQry.Params.FindParam('irevision') <> nil then
          AQry.ParamByName('irevision').AsString := ARevision;

        AQry.Open;
      finally
        AQry.EnableControls;
      end;
    finally
      AGrid.EndUpdate;
    end;
  end;

  procedure RefreshAPUS;
  begin
    grid_PresupuestosAPUS.BeginUpdate;
    try
      DMPresupuesto.QAPUS.DisableControls;
      try
        DMPresupuesto.QAPUS.Close;

        DMPresupuesto.QAPUS.ParamByName('codBase').AsString :=
          base_activa.codBase;
        DMPresupuesto.QAPUS.ParamByName('codPresupuesto').AsString :=
          codProyecto;
        DMPresupuesto.QAPUS.ParamByName('revision').AsString := revision;

        DMPresupuesto.QAPUS.ParamByName('porcentaje').AsFloat :=
          indirectosPresupuesto;

        DMPresupuesto.QAPUS.Open;
      finally
        DMPresupuesto.QAPUS.EnableControls;
      end;
    finally
      grid_PresupuestosAPUS.EndUpdate;
    end;
  end;

  procedure RecalcularYRefrescarPresupuesto;
  begin
    MarcarRecalculoLineas;

    DMPresupuesto.calculaTotal;

    if DModule_1.con2.InTransaction then
      DModule_1.con2.Commit;

    RefreshQueryGrid(
      DMPresupuesto.QTPresupuestosItems,
      grid_presupuestos,
      base_activa.codBase,
      codProyecto,
      revision,
      ndecimalesmoneda
      );

    RefreshAPUS;
  end;

var
  LForm: TfrmPorcentajesIndirectos;
begin
  iGlow_Presupuestos_SeleccionarIndirectos.Enabled := True;

  cargar_indirectos(base_activa.codBase);

  LForm := TfrmPorcentajesIndirectos.Create(Application);
  try
    LForm.lbl_modo.Text := '2';

    LForm.ShowModal;

    if LForm.ModalResult = mrOK then
      RecalcularYRefrescarPresupuesto;

  finally
    LForm.Free;
  end;
end;

procedure TfrmMain.rect_Presupuestos_SeleccionarIndirectosMouseEnter(
  Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_Presupuestos_SeleccionarIndirectos,
    $FFF39200);
end;

procedure TfrmMain.rect_Presupuestos_SeleccionarIndirectosMouseLeave(
  Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_Presupuestos_SeleccionarIndirectos);
end;

/// <summary>
/// Manejador del evento OnClick de rect_Presupuesto_AdicionarNotaClick.
/// </summary>
procedure TfrmMain.rect_Presupuestos_VisorEDTClick(Sender: TObject);
var
  LForm: TfrmVisorEDT;
begin
  LForm := TfrmVisorEdt.Create(application);
  try
    iGlow_VisorEDT.Enabled := True;
    LForm.ShowModal;
  finally
    LForm.free;
    frmmain.iGlow_VisorEDT.Enabled := False;
  end;
end;

procedure TfrmMain.rect_Presupuestos_VisorEDTMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_Presupuestos_VisorEDT, $FFF39200);
end;

procedure TfrmMain.rect_Presupuestos_VisorEDTMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_Presupuestos_VisorEDT);
end;

/// <summary>
/// Manejador del evento OnClick de rect_Presupuestos_NotasGeneralesClick.
/// </summary>
procedure TfrmMain.rect_PTanteoClick(Sender: TObject);
var
  X: Double;
  ARow: Integer;
  codApu: string;
  codEDT: string;
begin
  X := lyt_Tanteo.Height;
  ARow := grid_Presupuestos.Selection.StartRow;
  with DMPresupuesto.dsTpresupuestosItems.DataSet do
  begin
    DisableControls;
    First;
    MoveBy(ARow - 1);
    codApu := FieldByName('codAPU').AsString;
    codEDT := FieldByName('codEDT').AsString;
    EnableControls;
  end;

  if X = 0 then
  begin

    if (codEDT <> '') and (ARow > 0) then
    begin
      abreGridTanteo(ARow);
    end;
  end
  else
  begin
    if codApu <> '' then
      restaurarApuTanteo(codApu, 1);
    cierraGridTanteo();
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_Presupuestos_abrirBaseClick.
/// </summary>
procedure TfrmMain.rect_RecursosSeleccionarTodosClick(Sender: TObject);
begin
  edt_filtroLVApusCategoria.Text := '';
  refrescalistaAPUscompleta;
  lv_APUSCategoria.ItemIndex := -1;
end;

/// <summary>
/// Manejador del evento de ratón en rect_RecursosSeleccionarTodosMouseEnter.
/// </summary>
procedure TfrmMain.rect_RecursosSeleccionarTodosMouseEnter(Sender: TObject);
begin
  iGlow_RecursosSeleccionarTodos.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_RecursosSeleccionarTodosMouseLeave.
/// </summary>
procedure TfrmMain.rect_RecursosSeleccionarTodosMouseLeave(Sender: TObject);
begin
  iGlow_RecursosSeleccionarTodos.Enabled := False;
end;

/// <summary>
/// Implementa la lógica principal de ResaltaPanelOpciones.
/// </summary>
procedure TfrmMain.rect_RecursosUsadosClick(Sender: TObject);
begin
  generaRecursosPresupuesto();
  if tbcCPC.ActiveTab = tab_RecursosUsadoDesgregacion then
    tbcCPC.ActiveTab := tab_CPC1
  else
  begin
    tbcCPC.ActiveTab := tab_RecursosUsadoDesgregacion;
    ocultaColumnasGrids(grid_DesgRecursos, 9);
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_RefrescaReferidoClick.
/// </summary>
procedure TfrmMain.rect_RefrescaReferidoClick(Sender: TObject);
begin
  Opciones_Referidos(2);
end;

/// <summary>
/// Manejador del evento de ratón en rect_RefrescaReferidoMouseEnter.
/// </summary>
procedure TfrmMain.rect_RefrescaReferidoMouseEnter(Sender: TObject);
begin

  if iGlow_RefrescaReferido.GlowColor <> $FFE94E00 then
    iGlow_RefrescaReferido.Enabled := True;
end;

/// <summary>
/// Refresca la visualización o lista de datos en rect_RefrescaReferidoMouseLeave.
/// </summary>
procedure TfrmMain.rect_RefrescaReferidoMouseLeave(Sender: TObject);
begin
  if iGlow_RefrescaReferido.GlowColor <> $FFE94E00 then
    iGlow_RefrescaReferido.Enabled := False;
end;

/// <summary>
/// Manejador del evento OnClick de rct_StakeBorrarClick.
/// </summary>
procedure TfrmMain.rect_RestaurarBackUpClick(Sender: TObject);
begin
  //
end;

/// <summary>
/// Manejador del evento de ratón en rect_RestaurarBackUpMouseEnter.
/// </summary>
procedure TfrmMain.rect_RestaurarBackUpMouseEnter(Sender: TObject);
begin
  iGlow_RestaurarBackUp.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de rect_RestaurarBackUpMouseLeave.
/// </summary>
procedure TfrmMain.rect_RestaurarBackUpMouseLeave(Sender: TObject);
begin
  iGlow_RestaurarBackUp.Enabled := False;
end;

procedure TfrmMain.rect_RestauraTanteoClick(Sender: TObject);
begin
  if codApuTanteo = '' then
    Exit;

  tantear := True;
  try
    DMPresupuesto.TanteoRechazar(codApuTanteo);

  finally
    tantear := False;
    cierraGridTanteo();
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_AceptarTanteoClick.
/// </summary>
procedure TfrmMain.rect_StakeDisponibleAdicionarClick(Sender: TObject);
var
  LForm: TfrmStakes;
begin
  LForm := TfrmStakes.Create(Application);
  try
    LForm.lbl_modo.Text := '1';
    LForm.limpiaNuevoStake;
    LForm.IdFiscal := LForm.CrearIDStake;
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rect_StakeDisponibleAdicionarMouseEnter.
/// </summary>
procedure TfrmMain.rect_StakeDisponibleAdicionarMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_StakeDisponibleAdicionar, $FFF39200);
end;

/// <summary>
/// Implementa la lógica principal de rect_StakeDisponibleAdicionarMouseLeave.
/// </summary>
procedure TfrmMain.rect_StakeDisponibleAdicionarMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_StakeDisponibleAdicionar);
end;

/// <summary>
/// Implementa la lógica principal de rect_123MouseUp.
/// </summary>
procedure TfrmMain.rect_StakeDisponibleEditarClick(Sender: TObject);
var
  nodo: TTMSFNCTreeViewNode;
  X: Integer;
  tmpstr: string;
  salir: Boolean;
  LForm: TfrmStakes;
begin
  LForm := TfrmStakes.Create(Application);
  try
    nodo := Trvw_StakeHolderDisponibles.SelectedNode;
    salir := False;
    if Assigned(nodo) then
    begin
      if not nodo.Extended then
      begin
        while not salir do
        begin
          nodo := nodo.GetPrevious;
          if nodo.Extended then
            salir := True;
        end;
      end;
      tmpstr := nodo.Text[0];
      X := AnsiPos(' - ', tmpstr);
      tmpstr := Copy(tmpstr, 1, X - 1).Trim;
      LForm.IdFiscal := tmpstr;
      LForm.lbl_2.Text := 'Editar Stakeholder';
      LForm.lbl_modo.Text := '2';
      LForm.cargaStake(tmpstr);
      LForm.ShowModal;
    end;
  finally
    LForm.Free;
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rect_StakeDisponibleEditarMouseEnter.
/// </summary>
procedure TfrmMain.rect_StakeDisponibleEditarMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_StakeDisponibleEditar, $FFF39200);
end;

/// <summary>
/// Implementa la lógica principal de rect_StakeDisponibleEditarMouseLeave.
/// </summary>
procedure TfrmMain.rect_StakeDisponibleEditarMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_StakeDisponibleEditar);
end;

/// <summary>
/// Manejador del evento OnClick de rect_StakeVisualizarClick.
/// </summary>
procedure TfrmMain.rect_StakeVisualizarClick(Sender: TObject);
var
  LForm: TfrmRolProyecto;
begin
  LForm := TfrmRolProyecto.Create(Application);
  try
    populaRolStake(LForm);
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_addReferidoClick.
/// </summary>
procedure TfrmMain.rect_SUB32ActualizarClick(Sender: TObject);
var
  LForm: TfrmImportarSubCategorias;
begin
  // Rutina de Importacion de SubCategorias
  LForm := TfrmImportarSubCategorias.Create(Application);
  try
    LForm.cargaSubcategoriasDB;
    LForm.cargaDBs;
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
  rect_Sub32Actualizar.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB32ActualizarMouseEnter(Sender: TObject);
begin
  rect_SUB32Actualizar.Fill.Color := COL_Enter;
end;

/// <summary>
/// Actualiza la interfaz o los datos asociados en rect_SUB32ActualizarMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB32ActualizarMouseLeave(Sender: TObject);
begin
  rect_SUB32Actualizar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB32BorrarMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB32BorrarClick(Sender: TObject);
begin
  if realizarPreguntaSiNo('¿Borrar Categoría?') <> mrOk then
  begin
    rect_Sub32Borrar.Fill.Color := COL_Exit;
    exit;
  end;
  BorrarItemSubCategoria;
  RefreshCategorias();
  rect_Sub32Borrar.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB32BorrarMouseEnter(Sender: TObject);
begin
  rect_SUB32Borrar.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB32BorrarMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB32BorrarMouseLeave(Sender: TObject);
begin
  rect_SUB32Borrar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB32CrearMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB32CrearClick(Sender: TObject);
begin
  AdicionaItem();
  rect_Sub32Crear.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB32CrearMouseEnter(Sender: TObject);
begin
  rect_SUB32Crear.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB32CrearMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB32CrearMouseLeave(Sender: TObject);
begin
  rect_SUB32Crear.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB32DuplicarMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB32DuplicarClick(Sender: TObject);
begin
  ClonarItem(1);
  rect_Sub32Duplicar.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB32DuplicarMouseEnter(Sender: TObject);
begin
  rect_SUB32Duplicar.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB32DuplicarMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB32DuplicarMouseLeave(Sender: TObject);
begin
  rect_SUB32Duplicar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB32EditarMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB32EditarClick(Sender: TObject);
begin
  EditarItemSubCategoria;
  rect_Sub32Editar.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB32EditarMouseEnter(Sender: TObject);
begin
  rect_SUB32Editar.Fill.Color := COL_Enter;
end;

procedure TfrmMain.rect_SUB34PertenenciaClick(Sender: TObject);
var
  LForm: TfrmTrazabilidadAPU;
  posicion: Integer;
  TCodAPU: string;
  TDescripcion: string;
  x: integer;
begin
  posicion := grid_APUSRecursos.Selection.StartRow;
  if posicion < 0 then
  begin
    rect_SUB34Pertenencia.Fill.Color := COL_Exit;
    Exit;
  end;
  TcodAPU := grid_APUSRecursos.cells[9, posicion].Trim;
  if TcodAPU = '' then
  begin
    rect_SUB34Pertenencia.Fill.Color := COL_Exit;
    Exit;
  end;
  TDescripcion := grid_ApusRecursos.Cells[2, posicion].Trim;

  LForm := TfrmTrazabilidadAPU.Create(application);
  try
    with LForm do
    begin
      DBAdapter_APUsAnidados.Active := False;
      DBAdapter_ProyectosAsociados.Active := False;
      QApusAnidados.close;
      QApusAnidados.ParamByName('codBase').AsString := base_activa.codBase;
      QApusAnidados.ParamByName('codAPU').AsString := TcodAPU;
      QApusAnidados.Open;

      QProyectosAsociados.close;
      QProyectosAsociados.ParamByName('codBase').AsString :=
        base_activa.codBase;
      QProyectosAsociados.ParamByName('codAPU').AsString := TcodAPU;
      QProyectosAsociados.Open;

      DBAdapter_APUsAnidados.Active := True;
      DBAdapter_ProyectosAsociados.Active := True;

      lbl_apu.text := 'Trazabilidad APU: ' + TDescripcion;
      AutoSizeGridPorContenido(Grid_APUsAnidados, 2, [0, 400]);
      AutoSizeGridPorContenido(Grid_ProyectosAsociados, 3, [100, 50, 400]);

      ShowModal;
      if LForm.ModalResult = mrOK then
      begin
        case LForm.TipoSalida of
          0:
            begin
              // No hacer nada
            end;
          1:
            begin
              // Salida desde APUs Anidados
              edt_FiltroListadoAPUS.Text :=
                DaCodAPUCompletoDB(LForm.TApusAnidado);
              SeleccionaAPUSMostrar(1, 1);
            end;
          2:
            begin
              // Salida desde Proyectos y Revision
              rect_Opc2.OnClick(rect_Opc2);
              codProyecto := TCodProyecto;
              Revision := TRevision;
              x := StrToIntDef(CargaProyecto(Base_activa.codBase), 1);
              if x > 0 then
              begin
                MuestraMensajeGiProy('Error', 'Error en el proyecto. codigo: ' +
                  IntToStr(X));
                LForm.free;
                rect_SUB34Pertenencia.Fill.Color := COL_Exit;
                exit;
              end;
              proyectoNuevo := False;
              tbcPresupuestos.ActiveTab := frmmain.tab_5Presupuesto;
            end;
        end;
      end;
    end;
  finally
    LForm.free;
  end;
  rect_SUB34Pertenencia.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB33ActializarClick(Sender: TObject);
var
  LForm: TfrmTrazabilidadRecursos;
  TidUnicoRecurso: string;
  posicion: Integer;
begin
  posicion := grid_Recursos.Selection.StartRow;
  if posicion < 0 then
    Exit;

  TidUnicoRecurso := Trim(grid_Recursos.Cells[9, posicion]);
  if TidUnicoRecurso = '' then
    Exit;

  LForm := TfrmTrazabilidadRecursos.Create(Application);
  try
    with LForm do
    begin
      // 🔴 APAGAR ADAPTER
      DBAdapter_1.Active := False;

      // 🔴 DATASET
      QAPUsRelacionados.Close;
      QAPUsRelacionados.SQL.Text :=
        'SELECT ' +
        'a.codAPU, ' +
        'a.Descripcion, ' +
        'a.Unidad, ' +
        'a.CostoDirectoTotal, ' +
        'a.CostoIndirectoTotal, ' +
        'a.PrecioUnitarioTotal, ' +
        'a.codCPC ' +
        'FROM apus a ' +
        'INNER JOIN apus_items ai ON ai.CodAPU = a.CodAPU ' +
        'WHERE a.CodBase = :codBase ' +
        'AND ai.idUnicoRecurso = :idUnicoRecurso';

      QAPUsRelacionados.ParamByName('codBase').AsString := base_activa.codBase;
      QAPUsRelacionados.ParamByName('idUnicoRecurso').AsString :=
        TidUnicoRecurso;

      // 🔴 ADAPTER ENLACES
      {DBAdapter_1.DataSource := DS_QAPUsRelacionados;
      DBAdapter_1.DetailControl := grid_APUsRelacionados;}

      // 🔴 ABRIR DATASET
      QAPUsRelacionados.Open;

      // 🔴 ENCENDER ADAPTER (ESTO ES CLAVE)
      DBAdapter_1.Active := True;
      QAPUsRelacionados.Active := True;

      lbl_Recurso.Text :=
        'Trazabilidad del Recurso: ' + grid_Recursos.Cells[2, posicion];

      ShowModal;
      if LForm.ModalResult = mrOk then
      begin
        rect_OPC1_APUS.OnClick(rect_OPC1_APUS);
        edt_FiltroListadoAPUS.Text := DaCodAPUCompletoDB(LForm.TcodAPU);
      end;
    end;
  finally
    LForm.Free;
  end;
end;

procedure TfrmMain.rect_SUB33ActializarMouseEnter(Sender: TObject);
begin
  rect_SUB33Actializar.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB33ActializarMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB33ActializarMouseLeave(Sender: TObject);
begin
  rect_SUB33Actializar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB33BorrarMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB33BorrarClick(Sender: TObject);
var
  x, y: Integer;
  CodCategoria: string;
  CodSubCategoria: string;
  codRecurso: string;
  codCompletoRecurso: string;
  codigos: array of integer;
begin
  if realizarPreguntaSiNo('¿Borrar Recurso(s)?') <> mrOk then
  begin
    rect_Sub33Borrar.Fill.Color := COL_Exit;
    exit;
  end;
  y := 0;
  for x := grid_recursos.Selection.StartRow to grid_recursos.Selection.EndRow do
  begin
    if grid_recursos.rowselect[x] then
    begin
      setlength(codigos, y + 1);
      codigos[y] := x;
      inc(y);
    end;
  end;
  for x := 0 to length(codigos) - 1 do
  begin
    y := codigos[x];
    codCompletoRecurso := grid_Recursos.cells[1, y];
    CodCategoria := interpretaCodigoRecurso(codCompletoRecurso, 1);
    CodSubCategoria := interpretaCodigoRecurso(codCompletoRecurso, 2);
    codRecurso := interpretaCodigoRecurso(codCompletoRecurso, 3);
    BorrarRecurso(CodCategoria, CodSubCategoria, codRecurso);
    MuestraRecursosGrid(CodCategoria, CodSubCategoria);
  end;
  rect_Sub33Borrar.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB33BorrarMouseEnter(Sender: TObject);
begin
  rect_SUB33Borrar.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB33BorrarMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB33BorrarMouseLeave(Sender: TObject);
begin
  rect_SUB33Borrar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB33BuscarMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB33BuscarClick(Sender: TObject);
var
  LForm: TfrmImportarRecursos2;
begin
  LForm := TfrmImportarRecursos2.Create(Application);
  try
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
  rect_Sub33Buscar.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB33BuscarMouseEnter(Sender: TObject);
begin
  rect_SUB33Buscar.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB33BuscarMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB33BuscarMouseLeave(Sender: TObject);
begin
  rect_SUB33Buscar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB33CrearMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB33CrearClick(Sender: TObject);
begin
  CrearRecursos();
end;

procedure TfrmMain.CrearRecursos();
var
  codCategoriaRecursos: string;
  codSubCategoriaRecursos: string;
  LForm: TfrmNuevoRecurso;
begin
  LForm := TfrmNuevoRecurso.Create(Application);
  try
    codCategoriaRecursos := daCodigoCategoriaRecursos;
    if codCategoriaRecursos <> '0' then
    begin
      codSubCategoriaRecursos := daCodigoSubCategoriaRecursos
        (codCategoriaRecursos);
      if codSubCategoriaRecursos <> '0' then
      begin
        IniciaNuevoRecurso(LForm);
        LForm.lbl_banner1.Text := 'Nuevo Recurso';
        LForm.lbl_banner2.Text := 'Creación de Nuevo Recurso';
        LForm.lbl_modo.Text := 'nuevo';
        LForm.edt_descripcion.Text := '';
        LForm.lbl_codCategoria.Text := codCategoriaRecursos;
        LForm.lbl_codSubCategoria.Text := codSubCategoriaRecursos;
        LForm.edt_descripcion.SetFocus;
        LForm.populaUnidadesRecursos(codCategoriaRecursos);
        LForm.ShowModal;
      end
      else
      begin
        MuestraMensajeGiproy('Advertencia',
          'Seleccione la categoria / Subcategoria padre');
      end;
    end
    else
    begin
      MuestraMensajeGiproy('Advertencia',
        'Seleccione la categoria / Subcategoria padre');
    end;
  finally
    LForm.Free;
  end;
  rect_Sub33Crear.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB33CrearMouseEnter(Sender: TObject);
begin
  rect_SUB33Crear.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB33CrearMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB33CrearMouseLeave(Sender: TObject);
begin
  rect_SUB33Crear.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB33DuplicarMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB33DuplicarClick(Sender: TObject);
var
  codCategoriaRecursos: string;
  codSubCategoriaRecursos: string;
  codRecursoaDuplicar: string;
  posicion: Integer;
  tmpstr: string;
  LForm: TfrmNuevoRecurso;
begin
  LForm := TfrmNuevoRecurso.Create(Application);
  try
    posicion := grid_Recursos.Selection.StartRow;
    if posicion > 0 then
    begin
      codCategoriaRecursos := interpretaCodigoRecurso
        (grid_Recursos.cells[1, posicion], 1);
      codSubCategoriaRecursos := interpretaCodigoRecurso
        (grid_Recursos.cells[1, posicion], 2);
      codRecursoaDuplicar := interpretaCodigoRecurso
        (grid_Recursos.cells[1, posicion], 3);

      IniciaNuevoRecurso(LForm);
      LForm.lbl_banner1.Text := 'Nuevo Recurso';
      LForm.lbl_banner2.Text := 'Creación de Nuevo Recurso';
      LForm.lbl_modo.Text := 'nuevo';
      LForm.edt_descripcion.Text := '';
      LForm.lbl_codCategoria.Text := codCategoriaRecursos;
      LForm.lbl_codSubCategoria.Text := codSubCategoriaRecursos;
      LForm.populaUnidadesRecursos(codCategoriaRecursos);
      LForm.edt_descripcion.Text := grid_Recursos.cells[2, posicion] +
        '_duplicado';
      tmpstr := grid_Recursos.cells[3, posicion];
      posicionaCombo(LForm.cbb_UTiempos, tmpstr);
      tmpstr := grid_Recursos.cells[4, posicion];
      tmpstr := ReplaceStr(tmpstr, '$', '').Trim;
      LForm.edt_precio.Text := tmpstr;
      LForm.edt_codCPC.Text := grid_Recursos.cells[7, posicion];
      LForm.mmo_especificaciones.Text := grid_Recursos.cells[8, posicion];
      LForm.ShowModal;
      LForm.edt_descripcion.SetFocus;
    end
    else
    begin
      MuestraMensajeGiproy('Advertencia', 'Selecione un recurso a duplicar.');
    end;
  finally
    LForm.Free;
  end;
  rect_Sub33Duplicar.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB33DuplicarMouseEnter(Sender: TObject);
begin
  rect_SUB33Duplicar.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB33DuplicarMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB33DuplicarMouseLeave(Sender: TObject);
begin
  rect_SUB33Duplicar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB33EditarMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB33EditarClick(Sender: TObject);
var
  ARow: Integer;
begin
  ARow := grid_Recursos.Selection.StartRow;
  if ARow > 0 then
    editarRecursos();
  rect_Sub33Editar.Fill.Color := COL_Exit;
end;

procedure TfrmMain.editarRecursos;
var
  Row: Integer;
  CodCat, CodSubCat, CodRec, CodCPC, IdUnico: string;
  PrecioStr, UnidadStr: string;
  LForm: TfrmNuevoRecurso;

begin
  Row := grid_Recursos.Selection.StartRow;

  // Validaciones mínimas
  if (Row <= 0) or (Row >= grid_Recursos.RowCount) then
  begin
    MuestraMensajeGiproy('Advertencia', 'Seleccione un recurso para editar.');
    Exit;
  end;

  LForm := TfrmNuevoRecurso.Create(nil);
  try
    CodCat := interpretaCodigoRecurso(grid_Recursos.Cells[1, Row], 1);
    CodSubCat := interpretaCodigoRecurso(grid_Recursos.Cells[1, Row], 2);
    CodRec := interpretaCodigoRecurso(grid_Recursos.Cells[1, Row], 3);
    CodCPC := grid_Recursos.Cells[7, Row].Trim;
    IdUnico := grid_Recursos.Cells[9, Row].Trim;

    IniciaNuevoRecurso(LForm);

    // Banner / modo
    LForm.lbl_banner1.Text := 'Editar Recurso';
    LForm.lbl_banner2.Text := 'Edición de Recurso';
    LForm.lbl_modo.Text := 'editar';

    // Cargar datos
    LForm.lbl_codCategoria.Text := CodCat;
    LForm.lbl_codSubCategoria.Text := CodSubCat;
    LForm.lbl_codRecurso.Text := CodRec;
    LForm.lbl_idUnicoRecurso.Text := IdUnico;

    LForm.populaUnidadesRecursos(CodCat);

    LForm.edt_codCPC.Text := CodCPC;
    LForm.edt_descripcion.Text := grid_Recursos.Cells[2, Row];
    LForm.mmo_especificaciones.Text := grid_Recursos.Cells[8, Row];

    UnidadStr := grid_Recursos.Cells[3, Row].Trim;
    posicionaCombo(LForm.cbb_UTiempos, UnidadStr);

    PrecioStr := grid_Recursos.Cells[4, Row];
    PrecioStr := ReplaceStr(PrecioStr, base_activa.simboloMoneda, '');
    LForm.edt_precio.Text := Trim(PrecioStr);

    // Asegura foco real para escribir al abrir
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmMain.rect_SUB33EditarMouseEnter(Sender: TObject);
begin
  rect_SUB33Editar.Fill.Color := COL_Enter;
end;

procedure TfrmMain.rect_SUB33EditarMouseLeave(Sender: TObject);
begin
  rect_SUB33Editar.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB34BorrarClick(Sender: TObject);
var
  CodAPU: string;
  RowIni, RowFin, Row: Integer;
  Seleccionados, Borrados, NoBorrados, Errores: Integer;
  Detalle: string;
  Res: uDB_BorrarAPU.TBorrarAPUResultado;
  Msg: string;
begin
  if realizarPreguntaSiNo('¿Borrar APU Seleccionada?') <> mrOk then
  begin
    rect_SUB34Borrar.Fill.Color := COL_Exit;
    Exit;
  end;

  RowIni := grid_apusRecursos.Selection.StartRow;
  RowFin := grid_apusRecursos.Selection.EndRow;

  Seleccionados := 0;
  Borrados := 0;
  NoBorrados := 0;
  Errores := 0;

  for Row := RowIni to RowFin do
  begin
    if not grid_apusRecursos.RowSelect[Row] then
      Continue;

    Inc(Seleccionados);

    // Columna 9: CodAPU (según tu código)
    CodAPU := Trim(grid_apusRecursos.Cells[9, Row]);

    if CodAPU = '' then
      Continue;

    // Llamada correcta según la unit: (AConn, CodBase, CodAPU, out Detalle)
    Res := uDB_BorrarAPU.BorrarAPUSiNoUsado(base_Activa.codBase, CodAPU,
      Detalle);

    case Res of
      barExito:
        Inc(Borrados);

      barIntegrado:
        Inc(NoBorrados);

      barError:
        begin
          Inc(Errores);
          // Si quieres, loguea Detalle en un memo/log:
          // LogError('Borrar APU ' + CodAPU + ': ' + Detalle);
        end;
    end;
  end;

  refrescalistaAPUscompleta;
  limpia_APUSVisor();

  if Seleccionados = 0 then
    Exit;

  if (NoBorrados > 0) or (Errores > 0) then
  begin
    Msg := '';

    if Borrados > 0 then
      Msg := Msg + Format('Borrados: %d', [Borrados]);

    if NoBorrados > 0 then
    begin
      if Msg <> '' then
        Msg := Msg + sLineBreak;
      Msg := Msg + Format('No borrados (anidados / usados en presupuestos): %d',
        [NoBorrados]);
    end;

    if Errores > 0 then
    begin
      if Msg <> '' then
        Msg := Msg + sLineBreak;
      Msg := Msg + Format('Errores: %d', [Errores]);
    end;

    MuestraMensajeGiproy('Advertencia', Msg);
  end;
  rect_SUB34Borrar.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB34BorrarMouseEnter(Sender: TObject);
begin
  rect_SUB34Borrar.Fill.Color := COL_Enter;
end;

procedure TfrmMain.rect_SUB34BorrarMouseLeave(Sender: TObject);
begin
  rect_SUB34Borrar.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB34CrearClick(Sender: TObject);
var
  nodo: TTMSFMXTreeViewNode;
  subnodo, subnodo2: TTMSFMXTreeViewNode;
  LForm: TfrmAddAPU;
begin
  if codCategoriaAPUSeleccionada <> '' then
  begin
    LForm := TfrmAddAPU.Create(Application);
    try
      contieneTanteos('');
      LForm.cargarValoresInicialesTrvw(LForm.trvw_apus);
      LForm.cargarValoresInicialesTrvw2(LForm.tv_SubCategoriaAPU);
      EntrarAPUfrm := True;
      LForm.lbl_modo.Text := '';
      LForm.lbl_codAPU.Text := '';
      LForm.limpiaNuevaAPUs();
      rect_SUB34Crear.Fill.Color := COL_Exit;
      LForm.actualizaListadoAPUSubcategoria;
      LForm.edt_PorcentajeIndirecto.Text := FloatToStr(base_activa.indirectos);
      LForm.edt_PorcentajeIndirecto.Text :=
        decimal_correcto(LForm.edt_PorcentajeIndirecto.Text);
      LForm.lbl_modo.Text := '1';
      LForm.lbl_titulo1.Text := 'Nueva APU';
      LForm.lbl_titulo2.Text := 'Creación de Nueva APU';
      LForm.lbl_codSubCategoria.Text := codCategoriaAPUSeleccionada;
      LForm.edt_APUSDescripcion.ReadOnly := False;
      LForm.muestraAPUSTodosRecursos(base_activa.codBase, '1');
      LForm.chkRevision.IsChecked := False;
      LForm.ShowModal;
    finally
      LForm.Free;
    end;
  end
  else
  begin
    MuestraMensajeGiproy('Advertencia', 'Seleccione una categoria, por favor.')
  end;
  rect_Sub34Crear.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB34CrearMouseEnter(Sender: TObject);
begin
  rect_SUB34Crear.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB34CrearMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB34CrearMouseLeave(Sender: TObject);
begin
  rect_SUB34Crear.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB34DuplicarMouseEnter.
/// </summary>

procedure TfrmMain.rect_SUB34DuplicarClick(Sender: TObject);
var
  codApu, codAPUNueva: string;
  posicion: Integer;
  codRecAPU: string;
  AItem: TListViewItem;
  descripcionBase, descripcionNueva: string;
  LForm: TfrmAddAPU;
  function NextDescripcionDuplicada(const ADescBase: string): string;
  var
    Q: TUniQuery;
    baseDesc: string;
    n: Integer;
  begin
    Result := Trim(ADescBase);
    if Result = '' then
      Exit;
    baseDesc := Result;
    Q := TUniQuery.Create(nil);
    try
      Q.Connection := DModule_1.con2;
      for n := 1 to 999 do
      begin
        Result := Format('%s_(%d)', [baseDesc, n]);
        Q.Close;
        Q.SQL.Text :=
          'SELECT 1 FROM apus ' +
          'WHERE codBase = :b AND descripcion = :d ' +
          'LIMIT 1';
        Q.ParamByName('b').AsString := base_activa.codBase;
        Q.ParamByName('d').AsString := Result;
        Q.Open;

        if Q.IsEmpty then
          Exit;
      end;

      // fallback (si todo está ocupado)
      Result := Format('%s_(%s)', [baseDesc, FormatDateTime('yyyymmddhhnnss',
            Now)]);
    finally
      Q.Free;
    end;
  end;
  function DaCodRecurApuNueva(const CodAPUNueva: string): string;
  var
    Q: TUniQuery;
  begin
    Result := '';
    Q := TUniQuery.Create(nil);
    try
      Q.Connection := DModule_1.con2;
      Q.Close;
      Q.sql.Clear;
      Q.SQL.Text :=
        'Select codRecursoCompleto from recursos where especificaciones = :especificaciones and codbase = :codBase';
      Q.ParamByName('especificaciones').AsString := 'APU: ' + codAPUNueva;
      Q.ParamByName('codBase').AsString := base_activa.codBase;
      Q.ExecSQL;
      Result := Q.FieldByName('codRecursoCompleto').AsString;
    finally
      Q.Free;
    end;
  end;

begin
  // Validaciones duras
  if (grid_APUSRecursos.Selection.StartRow <= 0) then
  begin
    MuestraMensajeGiproy('Advertencia', 'Elija una APU para Duplicar.');
    Exit;
  end;

  if (lv_APUSCategoria.ItemIndex < 0) or (lv_APUSCategoria.ItemIndex >=
    lv_APUSCategoria.Items.Count) then
  begin
    MuestraMensajeGiproy('Advertencia', 'Seleccione una categoría de APU.');
    Exit;
  end;

  posicion := grid_APUSRecursos.Selection.StartRow;
  codApu := Trim(grid_APUSRecursos.Cells[9, posicion]);
  if codApu = '' then
  begin
    MuestraMensajeGiproy('Advertencia', 'No se pudo leer el codAPU.');
    Exit;
  end;

  if realizarPreguntaSiNo('¿Duplicar APUS?') <> mrOk then
  begin
    rect_SUB34Duplicar.Fill.Color := COL_Exit;
    Exit;
  end;

  // descripción base (col 2 según tu ejemplo)
  descripcionBase := Trim(grid_APUSRecursos.Cells[2, posicion]);
  if descripcionBase = '' then
    descripcionBase := 'APU';

  // genera descripción nueva NO repetida
  descripcionNueva := NextDescripcionDuplicada(descripcionBase);

  // duplica en BD (SP debe crear también el recurso APU y copiar items)
  codAPUNueva := DuplicarAPU_Completo(codApu, descripcionNueva);
  if Trim(codAPUNueva) = '' then
  begin
    MuestraMensajeGiproy('Advertencia',
      'No se pudo duplicar la APU (cod nuevo vacío).');
    Exit;
  end;
  codRecAPU := DaCodRecurApuNueva(codAPUNueva);
  // refresca UI y abre form ya en edición de la nueva
  LForm := TfrmAddAPU.Create(Application);
  try
    AItem := lv_APUSCategoria.Items[lv_APUSCategoria.ItemIndex];
    contieneTanteos(codREcAPU);
    refrescalistaAPUsDisponibles();

    LForm.limpiaNuevaAPUs();
    LForm.actualizaListadoAPUSubcategoria;
    LForm.codRecApuT := codRecAPU;
    LForm.lbl_modo.Text := '2'; // edición
    LForm.cargaAPUEdicion(codAPUNueva);

    LForm.lbl_titulo1.Text := 'Nueva APU';
    LForm.lbl_titulo2.Text := 'Creación de Nueva APU';

    LForm.calculaTotales();
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
  rect_SUB34Duplicar.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB34DuplicarMouseEnter(Sender: TObject);
begin
  rect_SUB34Duplicar.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB34DuplicarMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB34DuplicarMouseLeave(Sender: TObject);
begin
  rect_SUB34Duplicar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento OnClick de rect_SUB34EditarClick.
/// </summary>
procedure TfrmMain.rect_SUB34EditarClick(Sender: TObject);
var
  codApu: string;
  posicion: Integer;
  i: Integer;
  nodo: TTMSFMXTreeViewNode;
  LForm: TfrmAddAPU;
  codRecAPU: string;
begin

  posicion := grid_APUSRecursos.Selection.StartRow;
  if posicion > 0 then
  begin
    LForm := TfrmAddAPU.Create(Application);
    try
      EntrarAPUfrm := True;
      codRecAPU := grid_apusRecursos.cells[1, posicion];
      contieneTanteos(codRecAPU);
      LForm.lbl_modo.Text := '';
      LForm.codRecApuT := codRecAPU;
      LForm.cargarValoresInicialesTrvw(LForm.trvw_apus);
      LForm.cargarValoresInicialesTrvw2(LForm.tv_SubCategoriaAPU);
      LForm.limpiaNuevaAPUs();
      LForm.actualizaListadoAPUSubcategoria;
      codApu := grid_APUSRecursos.cells[9, posicion];
      LForm.lbl_modo.Text := '2';
      LForm.cargaAPUEdicion(codApu);
      LForm.lbl_titulo1.Text := 'Editar APU';
      LForm.lbl_titulo2.Text := 'Edición de APU';
      LForm.trvw_apus.ExpandAll;
      LForm.calculaTotales();
      nodo := LForm.tv_SubCategoriaAPU.nodes[0];
      LForm.tv_SubCategoriaAPU.SelectNode(nodo);
      LForm.muestraAPUSTodosRecursos(base_activa.codBase, '1');
      LForm.ShowModal;
    finally
      LForm.Free;
    end;
  end;
  rect_SUB34Editar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB34EditarMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB34EditarMouseEnter(Sender: TObject);
begin
  rect_SUB34Editar.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB34EditarMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB34EditarMouseLeave(Sender: TObject);
begin
  rect_SUB34Editar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB34PertenenciaMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB34ImportarClick(Sender: TObject);
var
  LForm: TfrmImportarApus;
begin

  if compruebaModeloNegocio(1) then
  begin
    LForm := TfrmImportarApus.Create(Application);
    try
      LForm.TreeView_APusDisponibles.ClearNodes;
      LForm.cargaDBs;
      LForm.cargaCategoriasyAPUS;
      LForm.ShowModal;
    finally
      LForm.Free;
    end;
  end;
  rect_SUB34Importar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB34ImportarMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB34ImportarMouseEnter(Sender: TObject);
begin
  rect_SUB34Importar.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB34ImportarMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB34ImportarMouseLeave(Sender: TObject);
begin
  rect_SUB34Importar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB34CrearMouseEnter.
/// </summary>

procedure TfrmMain.rect_SUB34PertenenciaMouseEnter(Sender: TObject);
begin
  rect_SUB34Pertenencia.Fill.Color := COL_Enter;
end;

procedure TfrmMain.rect_SUB34PertenenciaMouseLeave(Sender: TObject);
begin
  rect_SUB34Pertenencia.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento OnClick de rect_SUB34ReportesClick.
/// </summary>
procedure TfrmMain.rect_SUB34ReportesClick(Sender: TObject);
var
  X: Integer;
  idAPU: string;
  RutaPlantilla: string;
  nombrePlantilla: string;
  carpetaGuardadoTemporal: string;
  LForm: TfVisorReportesExt;
begin
  if grid_APUSRecursos.Selection.StartRow > 0 then
  begin
    nombrePlantilla := frmMain.Reportes.AnalisisPrecios;
    carpetaGuardadoTemporal := rutaApp + FormatDateTime('yyyymmddhhnnss', Now) +
      '\';
    RutaPlantilla := danombrePlantilla(nombrePlantilla);
    RutaPlantilla := descomprimeArchivoZIP2excel(RutaPlantilla,
      carpetaGuardadoTemporal);
    RutaPlantilla := desencriptafichero(RutaPlantilla);
    LForm := TfVisorReportesExt.Create(Application);
    try
      if RutaPlantilla <> '' then
      begin
        LForm.IncluirApusAnidados := False;
        if realizarPreguntaSiNO('¿Desea incluir los anidados de los APUs?') =
          mrOK then
          LForm.IncluirApusAnidados := True;
        LForm.SSO := False;
        // Seguridad Industrial no se tiene en cuenta
        LForm.listadoApusReporteAnalisis := TStringList.Create;
        for X := grid_APUSRecursos.Selection.StartRow to grid_APUSRecursos.
          Selection.EndRow do
        begin
          if grid_APUSRecursos.RowSelect[X] then
          begin
            idAPU := grid_APUSRecursos.cells[9, X];
            LForm.listadoApusReporteAnalisis.Add(idAPU);
          end;
        end;
        LForm.carpetaGuardadoTemporal := carpetaGuardadoTemporal;
        LForm.Modo := 2;
        LForm.XLSPlantilla := RutaPlantilla;
        LForm.ShowModal;
      end;
    finally
      LForm.Free;
    end;
  end
  else
  begin
    MuestraMensajeGiproy('Advertencia', 'Seleccione el/los APUS a utilizar.');
  end;
  rect_SUB34Reportes.Fill.Color := Col_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB34ReportesMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB34ReportesMouseEnter(Sender: TObject);
begin
  rect_SUB34Reportes.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB34ReportesMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB34ReportesMouseLeave(Sender: TObject);
begin
  rect_SUB34Reportes.Fill.Color := COL_Exit;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB35BorrarMouseUp.
/// </summary>
procedure TfrmMain.rect_SUB35BorrarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  moverTabPresupuesto(9);
end;

/// <summary>
/// Manejador del evento OnClick de rect_Sub35CrearClick.
/// </summary>
procedure TfrmMain.rect_Sub35CrearClick(Sender: TObject);
begin
  moverOpcionesPresupuestos(1);
  rect_sub35crear.Fill.Color := Col_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_Sub35CrearMouseEnter.
/// </summary>
procedure TfrmMain.rect_Sub35CrearMouseEnter(Sender: TObject);
begin
  rect_Sub35Crear.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_Sub35CrearMouseLeave.
/// </summary>
procedure TfrmMain.rect_Sub35CrearMouseLeave(Sender: TObject);
begin
  rect_Sub35Crear.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento OnClick de rect_SUB35DuplicarClick.
/// </summary>
procedure TfrmMain.rect_SUB35DuplicarClick(Sender: TObject);
begin
  moverOpcionesPresupuestos(2);
  rect_sub35Duplicar.Fill.Color := Col_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB35DuplicarMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB35DuplicarMouseEnter(Sender: TObject);
begin
  rect_SUB35Duplicar.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB35DuplicarMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB35DuplicarMouseLeave(Sender: TObject);
begin
  rect_SUB35Duplicar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento OnClick de rect_SUB35GuardarClick.
/// </summary>
procedure TfrmMain.rect_SUB35GuardarClick(Sender: TObject);
var
  cumpleRequisitos: Boolean;
  LForm: TfrmMetodosGuardado;
begin
  cumpleRequisitos := ProyectocumpleRequisitosMinimos;
  if (cumpleRequisitos) and (base_activa.codBase <> '') then
  begin
    if not guardando then
    begin
      LForm := TfrmMetodosGuardado.Create(Application);
      try
        LForm.ShowModal;
      finally
        LForm.Free;
      end;
    end;
  end
  else
  begin
    MuestraMensajeGiproy('Advertencia',
      'No cumple Requisitos minimos para el guardado.' + #13 +
      'Datos Generales Proyecto + Base de Trabajo.');
  end;
  rect_sub35guardar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB35GuardarMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB35GuardarMouseEnter(Sender: TObject);
begin
  rect_SUB35Guardar.Fill.Color := COL_Enter;
end;

/// <summary>
/// Guarda información o cambios realizados en rect_SUB35GuardarMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB35GuardarMouseLeave(Sender: TObject);
begin
  rect_SUB35Guardar.Fill.Color := COL_Exit;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB35RedoMouseUp.
/// </summary>
procedure TfrmMain.rect_SUB35RedoMouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
var
  bkp: TMemoryStream;
  tmpstream: string;
begin
  if tbcPresupuestos.ActiveTab = tab_4PresupuestoEDT then
  begin
    bkp := TMemoryStream.Create;
    tmpstream := '';
    if (posEDT < historicoEDT.Count - 1) then
    begin
      Inc(posEDT);
      tmpstream := historicoEDO[posEDT];
      WriteStreamStr(bkp, tmpstream);
      bkp.Position := 0;
      Trvw_EDT.LoadFromStream(bkp);
    end;
    bkp.Free;
  end;
  if tbcPresupuestos.ActiveTab = tab_2PresupuestoEDO then
  begin
    bkp := TMemoryStream.Create;
    tmpstream := '';
    if (posEDO < historicoEDO.Count - 1) then
    begin
      Inc(posEDO);
      tmpstream := historicoEDO[posEDO];
      WriteStreamStr(bkp, tmpstream);
      bkp.Position := 0;
      Trvw_EDO.LoadFromStream(bkp);
    end;
    bkp.Free;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de rect_Sub35ReportesClick.
/// </summary>
procedure TfrmMain.rect_Sub35ReportesClick(Sender: TObject);
var
  LForm: TfVisorReportesExt;
begin
  if (base_activa.codBase <> '') and (codProyecto <> '') and (revision <> '')
    then
  begin
    LForm := TfVisorReportesExt.Create(Application);
    try
      if tbcPresupuestos.ActiveTab = tab_5Presupuesto then
      begin
        LForm.Modo := 14;
        LForm.cbbConApus.ItemIndex := 0;
        LForm.ShowModal;
      end;
      if tbcPresupuestos.ActiveTab = tab_1PresupuestoDatos then
      begin
        LForm.Modo := 1;
        LForm.ShowModal;
      end;
      if tbcPresupuestos.ActiveTab = tab_6PresupuestoCronogramas then
      begin
        LForm.Modo := 4;
        LForm.ShowModal;
      end;
      if tbcPresupuestos.ActiveTab = tab_4PresupuestoEDT then
      begin
        if guardar_EDT() then
        begin
          LForm.Modo := 6;
          LForm.ShowModal;
        end;
      end;
      if tbcPresupuestos.ActiveTab = tab_2PresupuestoEDO then
      begin
        if Guardar_EDO() then
        begin
          LForm.Modo := 10;
          LForm.ShowModal;
        end;
      end;
      if tbcPresupuestos.ActiveTab = tab_3PresupuestoStake then
      begin
        if Guardar_StakeHolders() then
        begin
          LForm.Modo := 9;
          LForm.ShowModal;
        end;
      end;
      if tbcPresupuestos.ActiveTab = tab_7Desagregacion then
      begin
        if compruebaTodoCPC then
        begin
          LForm.Modo := 5;
          LForm.cbbConApus.ItemIndex := 0;
          LForm.ShowModal;
        end
        else
        begin
          MuestraMensajeGiproy('Advertencia',
            'Complete la asignación de CPCs en recursos');
        end;
      end;
      if tbcPresupuestos.ActiveTab = tab_8FPolinomica then
      begin
        if compruebatodoFpolinomica then
        begin
          activa_gridCuadrillaTipo();
          cargarValoresCuadrillaTipo();
          calculaResumenFpolCuadrilla();
          LForm.Modo := 11;
          LForm.ShowModal;
        end
        else
        begin
          MuestraMensajeGiproy('Advertencia',
            'Complete la asignación de Indices en recursos');
        end;
      end;
    finally
      LForm.Free;
    end;
  end;
  rect_Sub35Reportes.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_Sub35ReportesMouseEnter.
/// </summary>
procedure TfrmMain.rect_Sub35ReportesMouseEnter(Sender: TObject);
begin
  rect_Sub35Reportes.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_Sub35ReportesMouseLeave.
/// </summary>
procedure TfrmMain.rect_Sub35ReportesMouseLeave(Sender: TObject);
begin
  rect_Sub35Reportes.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_SUB35UndoMouseEnter.
/// </summary>
procedure TfrmMain.rect_SUB35UndoClick(Sender: TObject);
var
  codBase: string;
begin
  codBase := base_activa.codBase;
  proyectoNuevo := False;
  CargaProyecto(codBase);
  rect_sub35Undo.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_SUB35UndoMouseEnter(Sender: TObject);
begin
  rect_SUB35Undo.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_SUB35UndoMouseLeave.
/// </summary>
procedure TfrmMain.rect_SUB35UndoMouseLeave(Sender: TObject);
begin
  rect_SUB35Undo.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_cat6PreciosUnitariosMouseEnter.
/// </summary>
procedure TfrmMain.rect_sub3DB1Click(Sender: TObject);
var
  LForm: TfrmDuplicarBase;
begin
  limpiasub3db;

  LForm := TfrmDuplicarBase.Create(Application);
  try
    LForm.lbl_moneda.Text := '';
    LForm.cbb_pais.Clear;
    LForm.cbb_pais.Items.Text := listadoPaises.Text;
    LForm.chk_soloBasesPadres.IsChecked := False;
    LForm.edt_NombreBase.Text := '';
    LForm.lbl_banner1.Text := 'Crear / Duplicar Base';
    LForm.lbl_banner2.Text := 'Creación y/o Duplicación de Bases de Datos';
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
  rect_sub3DB1.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_sub3DB1MouseEnter(Sender: TObject);
begin
  rect_sub3DB1.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_sub3DB1MouseLeave.
/// </summary>
procedure TfrmMain.rect_sub3DB1MouseLeave(Sender: TObject);
begin
  rect_sub3DB1.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_sub3DB2MouseEnter.
/// </summary>
procedure TfrmMain.rect_sub3DB2Click(Sender: TObject);
var
  LForm: TfrmAbrirBase3;
begin
  LForm := TfrmAbrirBase3.Create(Application);
  try
    limpiasub3db;
    codProyecto := '';
    revision := '';
    proyectoNuevo := False;
    LForm.PopulaGridBase;
    LForm.lbl_modo.Text := '1';
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
  rect_sub3DB2.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_sub3DB2MouseEnter(Sender: TObject);
begin
  rect_sub3DB2.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_sub3DB2MouseLeave.
/// </summary>
procedure TfrmMain.rect_sub3DB2MouseLeave(Sender: TObject);
begin
  rect_sub3DB2.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_sub3DB4MouseEnter.
/// </summary>
procedure TfrmMain.rect_sub3DB4Click(Sender: TObject);
var
  LForm: TfrmNuevaBase;
begin
  if base_activa.codBase <> '' then
  begin
    LForm := TfrmNuevaBase.Create(Application);
    try
      limpiasub3db;

      LForm.lbl_modo.Text := '2';
      LForm.cbb_pais.Clear;
      LForm.cbb_pais.Items.Text := listadoPaises.Text;
      LForm.chk_SeguridadIndustrial.IsChecked := False;
      LForm.chk_SeguridadIndustrial.Visible := False;
      cargaDatosBase(LForm);
      LForm.ShowModal;
    finally
      LForm.Free;
    end;
  end
  else
  begin
    MuestraMensajeGiproy('Advertencia', 'Seleccione o Cree una Base de Datos.');
  end;
  rect_sub3db4.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_sub3DB4MouseEnter(Sender: TObject);
begin
  rect_sub3DB4.Fill.Color := COL_Enter;
end;

/// <summary>
/// Implementa la lógica principal de rect_sub3DB4MouseLeave.
/// </summary>
procedure TfrmMain.rect_sub3DB4MouseLeave(Sender: TObject);
begin
  rect_sub3DB4.Fill.Color := COL_Exit;
end;

/// <summary>
/// Manejador del evento de ratón en rect_sub3DB5MouseEnter.
/// </summary>
procedure TfrmMain.rect_sub3DB5Click(Sender: TObject);
var
  nombreBase: string;
begin
  limpiasub3db;

  if realizarPreguntaSiNo('¿Borrar Base de Datos Activa?' + #13 +
    'Todos los datos (recursos, categorias, APUS, presupuestos, etc) se eliminaran.') <>
    mrOK then
    Exit;
  nombreBase := base_activa.nombre;
  BorrarDB(base_activa.codBase);
  MuestraMensajeGiproy('Advertencia', 'Base de Datos ' + nombreBase +
    ' borrada. Por favor seleccione o cree una base de datos.');
  rect_sub3DB5.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_sub3DB5MouseEnter(Sender: TObject);
begin
  rect_sub3DB5.Fill.Color := COL_Enter;
end;

procedure TfrmMain.rect_sub3DB5MouseLeave(Sender: TObject);
begin
  rect_sub3DB5.Fill.Color := COL_Exit;
end;

procedure TfrmMain.rect_tab1Click(Sender: TObject);
begin
  SeleccionaTabCrono(1);
  tbc1.ActiveTab := tab_1;
end;

procedure TfrmMain.rect_tab2Click(Sender: TObject);
begin
  SeleccionaTabCrono(2);
  tbc1.ActiveTab := tab_2;
end;

/// <summary>
/// Manejador del evento OnClick de rect_tab3Click.
/// </summary>
procedure TfrmMain.rect_tab3Click(Sender: TObject);
begin
  SeleccionaTabCrono(3);
  tbc1.ActiveTab := tab_3;
end;

/// <summary>
/// Manejador del evento OnClick de rect_tab4Click.
/// </summary>
procedure TfrmMain.rect_tab4Click(Sender: TObject);
begin
  SeleccionaTabCrono(4);
  tbc1.ActiveTab := tab_4;
end;

/// <summary>
/// Manejador del evento OnClick de rect_tab5Click.
/// </summary>
procedure TfrmMain.rect_tab5Click(Sender: TObject);
begin
  SeleccionaTabCrono(5);
  tbc1.ActiveTab := tab_5;
  AjustaCurvaS();
end;

/// <summary>
/// Manejador del evento OnClick de rect_TanteoCronoAceptarClick.
/// </summary>
procedure TfrmMain.rect_TanteoCronoAceptarClick(Sender: TObject);
var
  codApu: string;
begin
  codApu := DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString;
  if codapu.trim = '' then
    exit;

  DMPresupuesto.TanteoAprobar(codApu);
  moverTabPresupuesto(6);
end;

/// <summary>
/// Manejador del evento OnClick de rect_TanteoCronoBorrarClick.
/// </summary>
procedure TfrmMain.rect_TanteoCronoBorrarClick(Sender: TObject);
var
  codApu: string;
begin
  if realizarPreguntaSiNo('¿Desea borrar el Tanteo de esta APU?') <> mrOK then
    Exit;

  codApu := DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString;
  if codApu <> '' then
    LimpiaTanteoDB(codApu, 2);
  DMPresupuesto.calculaTotal;
  moverTabPresupuesto(6);
end;

procedure TfrmMain.rect_TanteoCronoRestaurarClick(Sender: TObject);
var
  codApu: string;
begin
  codApu := DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString;

  if codApu = '' then
    Exit;

  DMPresupuesto.TanteoRechazar(codApu);

  moverTabPresupuesto(6);
end;

/// <summary>
/// Implementa la lógica principal de rellenaCategoriaRecursos.
/// </summary>
procedure TfrmMain.Rectangle1Click(Sender: TObject);
var
  codApu: string;
  X: Integer;
begin
  if realizarPreguntaSiNo('¿Desea borrar TODOS los tanteos del Proyecto?') = mrOk
    then
  begin
    LimpiaTanteoTodaDB;
    cierraGridTanteo;
  end;
end;

procedure TfrmMain.Rectangle4Click(Sender: TObject);
begin
  limpiaGlowOPCPresupuestos();
  moverTabPresupuesto(9);
end;

/// <summary>
/// Manejador del evento OnClick de rect_RestaurarBackUpClick.
/// </summary>
procedure TfrmMain.rellenaCategoriaRecursos;
var
  qry: TUniQuery;
  LItem: TListViewItem;
  LViews: array[1..5] of TListView;
  Cat: Integer;
begin
  // Mapear listviews
  LViews[1] := lvOPCRec1;
  LViews[2] := lvOPCRec2;
  LViews[3] := lvOPCRec3;
  LViews[4] := lvOPCRec4;
  LViews[5] := lvOPCRec5;

  // Limpiar
  for Cat := 1 to 5 do
  begin
    LViews[Cat].BeginUpdate;
    LViews[Cat].Items.Clear;
  end;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := dmodule_1.con2;
    qry.SQL.Text :=
      { (* }
    'SELECT descripcion, categoria_base, ciu ' + 'FROM categoriaapus ' +
      'WHERE codBase = :codBase ' + 'ORDER BY categoria_base, descripcion';
    { *) }
    qry.ParamByName('codBase').AsString := base_activa.codBase;
    qry.Open;

    while not qry.Eof do
    begin
      Cat := qry.FieldByName('categoria_base').AsInteger;

      if (Cat >= 1) and (Cat <= 5) then
      begin
        LItem := LViews[Cat].Items.Add;
        LItem.Text := qry.FieldByName('descripcion').AsString;
        LItem.Detail := qry.FieldByName('categoria_base').AsString + '_' +
          qry.FieldByName('ciu').AsString;
      end;
      qry.Next;
    end;
  finally
    qry.Free;
    for Cat := 1 to 5 do
      LViews[Cat].EndUpdate;
  end;
end;

/// <summary>
/// Manejador del evento de ratón en rect_Opc2MouseEnter.
/// </summary>
procedure TfrmMain.ResetPassword(const Email: string);
var
  HTTP: TIdHTTP;
  SSL: TIdSSLIOHandlerSocketOpenSSL;
  PostData: TStringStream;
  URL: string;
  ResponseStr: string;
begin
  HTTP := TIdHTTP.Create(nil);
  SSL := TIdSSLIOHandlerSocketOpenSSL.Create(nil);
  PostData := nil;

  try
    // 🔐 Configuración SSL
    SSL.SSLOptions.Method := sslvTLSv1_2;
    SSL.SSLOptions.Mode := sslmClient;
    SSL.SSLOptions.VerifyMode := [];
    SSL.SSLOptions.VerifyDepth := 0;

    HTTP.IOHandler := SSL;

    // ⏱ Timeouts
    HTTP.ConnectTimeout := 10000; // 10 seg
    HTTP.ReadTimeout := 15000; // 15 seg

    // 🧾 Cabeceras
    HTTP.Request.ContentType := 'application/x-www-form-urlencoded';
    HTTP.Request.UserAgent := 'GiProy-FMX-Client';
    HTTP.Request.CharSet := 'utf-8';

    URL :=
      'https://app.62.171.171.124.sslip.io/recover-password-giproy/send_reset_email.php';

    PostData := TStringStream.Create(
      'email=' + TNetEncoding.URL.Encode(Email),
      TEncoding.UTF8
      );

    try
      ResponseStr := HTTP.Post(URL, PostData);

      if HTTP.ResponseCode = 200 then
      begin
        // El PHP devuelve {"status":"ok"}
        MuestraMensajeGiproy('Información',
          'Si el correo existe, se enviaron instrucciones para cambiar su email.');
      end
      else
      begin
        MuestraMensajeGiproy('Error',
          'Error del servidor (' + HTTP.ResponseCode.ToString + ')');
      end;

    except
      on E: EIdHTTPProtocolException do
      begin
        MuestraMensajeGiproy('Error HTTP',
          'Código: ' + E.ErrorCode.ToString + sLineBreak + E.Message);
      end;

      on E: Exception do
      begin
        MuestraMensajeGiproy('Error de conexión', E.Message);
      end;
    end;

  finally
    PostData.Free;
    HTTP.Free;
    SSL.Free;
  end;
end;

/// <summary>
/// Implementa la lógica principal de limpiaGlowOPCPresupuestos.
/// </summary>

procedure TfrmMain.SeleccionaCategoria(opcion: Integer);
begin
  rect_cat1EquiposHerramientas.Fill.Color := $FF606060;
  rect_cat2Materiales.Fill.Color := $FF606060;
  rect_cat3Transporte.Fill.Color := $FF606060;
  rect_cat4ManodeObra.Fill.Color := $FF606060;
  rect_cat5SeguridadIndustrial.Fill.Color := $FF606060;
  rect_cat6PreciosUnitarios.Fill.Color := $FF606060;
  edt_subCategoriaFilter.Text := '';
  codCategoriaRecursos := opcion;

  trvw_cat1EquiposHerramientas.RemoveFilter;
  trvw_cat1EquiposHerramientas.Filter.Clear;

  trvw_cat2Materiales.RemoveFilter;
  trvw_cat2Materiales.Filter.Clear;

  trvw_cat3Transporte.RemoveFilter;
  trvw_cat3Transporte.Filter.Clear;

  trvw_cat4ManodeObra.RemoveFilter;
  trvw_cat4ManodeObra.Filter.Clear;

  trvw_cat5SeguridadIndustrial.RemoveFilter;
  trvw_cat5SeguridadIndustrial.Filter.Clear;

  trvw_cat6PreciosUnitarios.RemoveFilter;
  trvw_cat6PreciosUnitarios.Filter.Clear;

  case opcion of
    1:
      begin
        rect_cat1EquiposHerramientas.Fill.Color := $FFE94E1B;
        ExpandTreeDeferred(trvw_cat1EquiposHerramientas);
        tbc_Categorias.GotoVisibleTab(1, TTabTransition.Slide,
          TTabTransitionDirection.Normal);
      end;
    2:
      begin
        rect_cat2Materiales.Fill.Color := $FFE94E1B;
        ExpandTreeDeferred(trvw_cat2Materiales);
        tbc_Categorias.GotoVisibleTab(2, TTabTransition.Slide,
          TTabTransitionDirection.Normal);
      end;
    3:
      begin
        rect_cat3Transporte.Fill.Color := $FFE94E1B;
        ExpandTreeDeferred(trvw_cat3Transporte);
        Opciones_Referidos(0);
        tbc_Categorias.GotoVisibleTab(3, TTabTransition.Slide,
          TTabTransitionDirection.Normal);
      end;
    4:
      begin
        rect_cat4ManodeObra.Fill.Color := $FFE94E1B;
        ExpandTreeDeferred(trvw_cat4ManodeObra);
        tbc_Categorias.GotoVisibleTab(4, TTabTransition.Slide,
          TTabTransitionDirection.Normal);
      end;
    5:
      begin
        rect_cat5SeguridadIndustrial.Fill.Color := $FFE94E1B;
        ExpandTreeDeferred(trvw_cat5SeguridadIndustrial);
        tbc_Categorias.GotoVisibleTab(5, TTabTransition.Slide,
          TTabTransitionDirection.Normal);
      end;
    6:
      begin
        rect_cat6PreciosUnitarios.Fill.Color := $FFE94E1B;
        ExpandTreeDeferred(trvw_cat6PreciosUnitarios);
        tbc_Categorias.GotoVisibleTab(6, TTabTransition.Slide,
          TTabTransitionDirection.Normal);
      end;
  end;
end;

/// <summary>
/// Implementa la lógica principal de seleccionOPC.
/// </summary>
procedure TfrmMain.seleccionOPC(opc: Integer);
var
  TieneBase: Boolean;
  TieneProyecto: Boolean;

  procedure SeleccionarRect(R: TRectangle);
  begin
    if Assigned(R) then
      R.Fill.Gradient := GradienteSeleccion;
  end;

  procedure EjecutarClick(Handler: TNotifyEvent; Sender: TObject);
  begin
    if Assigned(Handler) then
      Handler(Sender);
  end;

  procedure RefrescarEmpresaAsignada;
  begin
    with dmodule_1.QEmpresaAsignada do
    begin
      DisableControls;
      try
        if Active then
          Refresh
        else
          Open;
      finally
        EnableControls;
      end;
    end;
  end;

begin
  // ==========================
  // Estado general inicial
  // ==========================
  try
    actualizaEstadoDecimales;
    limpiaOpc;

    OpcionPrincipal := opc;
    tbc_PreciosUnitarios.ActiveTab := tab_PU_0Vacio;
    tmr_autoguardado.Enabled := False;

    TieneBase := base_activa.codBase.Trim <> '';
    TieneProyecto := not ((codProyecto.Trim = '') or (codProyecto.Trim = '1'));

    // ==========================
    // Selección principal
    // ==========================
    case opc of

      // =====================================================
      // OPCIÓN 1 – PRECIOS UNITARIOS / BASE
      // =====================================================
      1:
        begin
          SeleccionarRect(rect_Opc1);

          if TieneBase then
          begin
            if base_activa.nombre <> '' then
              muestraOPC(True);

            tbcSubMenu2.ActiveTab := tab_Sub2_1PreciosUnitarios;
            tbcSubMenu3.ActiveTab := tab_Sub3_2Categorias;

            EjecutarClick(rect_OPC1_APUS.OnClick, rect_OPC1_APUS);
          end
          else
          begin
            tbcSubMenu3.ActiveTab := tab_Sub3_0Vacio;
            tbcSubMenu2.GotoVisibleTab(1,
              TTabTransition.Slide,
              TTabTransitionDirection.Normal);
          end;
          lbl_BaseActiva.Text := 'Base Activa: ' + base_activa.Nombre;
        end;

      // =====================================================
      // OPCIÓN 2 – PRESUPUESTOS
      // =====================================================
      2:
        begin
          nPresupuestoOpc := 0;
          SeleccionarRect(rect_Opc2);
          lbl_BaseActiva.Text := 'Proyecto: ' + edt_descripcionPresupuesto.Text;
          tbcSubMenu2.GotoVisibleTab(2,
            TTabTransition.Slide,
            TTabTransitionDirection.Normal);

          if not TieneProyecto then
          begin
            // Crear o cargar presupuesto
            tbcSubMenu3.ActiveTab := tab_Sub3_0Vacio;

            EjecutarClick(rect_OPC2_CrearPresupuesto.OnClick,
              rect_OPC2_CrearPresupuesto);

            RefrescarEmpresaAsignada;
          end
          else
          begin
            // Presupuesto ya activo
            tbcSubMenu3.ActiveTab := tab_Sub3_5CrearPresupuestos;
            tbc_PreciosUnitarios.ActiveTab := tab_PresupuestosGeneral;

            moverTabPresupuesto(5);
          end;
          lbl_BaseActiva.Text := 'Proyecto: ' + edt_descripcionPresupuesto.Text;
        end;

      // =====================================================
      // OPCIÓN 3 – OTROS SERVICIOS
      // =====================================================
      3:
        begin
          nPresupuestoOpc := 0;
          SeleccionarRect(rect_Opc3);

          tbcSubMenu3.ActiveTab := tab_Sub3_0Vacio;
          posicionOPC_OtrosServicios(0);

          tbcSubMenu2.GotoVisibleTab(3,
            TTabTransition.Slide,
            TTabTransitionDirection.Normal);
        end;
    end;

  except
    on E: Exception do
    begin
      // Evita estados inconsistentes de UI
      tmr_autoguardado.Enabled := False;
      MuestraMensajeGiproy('Error', 'Error en seleccionOPC: ' + E.Message);
    end;
  end;
end;

/// <summary>
/// Implementa la lógica principal de tbc1Change.
/// </summary>
procedure TfrmMain.tbc1Change(Sender: TObject);
begin
  if tbc1.ActiveTab = tab_1 then
  begin
    grid_Crono1.SetFocus;
  end;
  if tbc1.ActiveTab = tab_2 then
  begin
    grid_crono2.SetFocus;
  end;
  if tbc1.ActiveTab = tab_3 then
  begin
    grid_crono3.SetFocus;
  end;
end;

/// <summary>
/// Implementa la lógica principal de tbc_CronogramasChange.
/// </summary>
procedure TfrmMain.tbc_CronogramasChange(Sender: TObject);
begin
  lyt_tanteoCrono.Height := 0;
end;

/// <summary>
/// Implementa la lógica principal de tbc_FpolinomicaChange.
/// </summary>
procedure TfrmMain.tbc_FpolinomicaChange(Sender: TObject);
var
  indicesFaltantes: Integer;
  tmpstr: string;
begin
  tmpstr := lbl_RecursosPorAsignar.Text;
  tmpstr := ReplaceStr(tmpstr, 'Recursos por Asignar: ', '').Trim;
  indicesFaltantes := StrToIntDef(tmpstr, -1);
  if indicesFaltantes <> 0 then
  begin
    tbc_Fpolinomica.ActiveTab := tab_Fpol_1IndicesyCoeficientes;
  end
  else
  begin
    if tbc_Fpolinomica.ActiveTab = tab_Fpol_2Cuadrilla then
    begin
      activa_gridCuadrillaTipo();
      cargarValoresCuadrillaTipo();
      calculaResumenFpolCuadrilla();
    end;
  end;
end;

/// <summary>
/// Implementa la lógica principal de tbc_PreciosUnitariosChange.
/// </summary>
procedure TfrmMain.tbc_PreciosUnitariosChange(Sender: TObject);
begin
  if tbc_PreciosUnitarios.ActiveTab = tab_PresupuestosGeneral then
  begin
    lyt_Reporte.Visible := True;
  end
  else
  begin
    lyt_Reporte.Visible := False;
  end;
end;

/// <summary>
/// Implementa la lógica principal de tmr_HoraTimer.
/// </summary>
procedure TfrmMain.tmr_HoraTimer(Sender: TObject);
var
  fecha: string;
  hora: string;
begin
  fecha := FormatDateTime('AAAA DD/MM/YYYYY', Now);
  hora := FormatDateTime('hh:nn:ss', Now);
  frmMain.lbl_Fecha.Text := Capitalize(fecha);
  frmMain.lbl_Hora.Text := hora;
end;

/// <summary>
/// Implementa la lógica principal de tmr_InicioTimer.
/// </summary>
procedure TfrmMain.tmr_InicioTimer(Sender: TObject);
var
  tmpdate: Tdate;
begin
  tmr_Inicio.Enabled := False;
  puedeHacerMigracion := False;
  puedeHacerBackUp := False;
  AjustarEstadosBackUp_Mudanza;
  lbl_BaseActiva.Text := '';
  if FCoInitialized then
    ejecutarLeeBios
  else
  begin
    MuestraMensajeGiproy('Error',
      'Error 0030: Error al adquirir condiciones de licencia.');
    Application.Terminate;
    Exit;
  end;
  if HardwareKey = 'error' then
  begin
    MuestraMensajeGiproy('Error',
      'Error 0031: Error al adquirir condiciones de licencia.');
    Application.Terminate;
    Exit;
  end;
  dmodule_1.SalsaEnc_1.Key := salsaKey;
  DM_Seguridad.SalsaEnc_Fichero.Key := salsaKey;
  tbc_PreciosUnitarios.ActiveTab := tab_Login;
  lyt_LateralOpciones.Enabled := False;
  Encoder := TIdEncoderMIME.Create;
  Decoder := TIdDecoderMIME.Create;
  guardando := False;
  muestraOPC(False);
  GradienteSeleccion := rct_btnLogin.Fill.Gradient;
  gradienteBase1 := frmMain.rect_Opc1.Fill.Gradient;
  lbl_NUsuario.Text := '';
  cargaComboPaises();

  if FileExists(rutaApp + 'uMain.dcu') then
  begin
    edt_UUsuario.Text := dmodule_1.SalsaEnc_1.Decrypt(Udeveloper);
    edt_UPassword.Text := dmodule_1.SalsaEnc_1.Decrypt(Pdeveloper);
  end
  else
  begin
    edt_UUsuario.Text := '';
    edt_UPassword.Text := '';
  end;
  edt_UUsuario.SetFocus;
  compruebaEscrito;
end;

/// <summary>
/// Actualiza la interfaz o los datos asociados en Trvw_APUSTanteoAfterUpdateNode.
/// </summary>
procedure TfrmMain.tmrComunicacionTimer(Sender: TObject);
var
  th1: recibeComunicacion;
begin
  tmrComunicacion.Enabled := False;
  if codigo_usuario > 0 then
  begin
    th1 := recibeComunicacion.Create(False, codigo_usuario);
    th1.Resume;
  end;
  tmrComunicacion.Interval := 30000;
  tmrComunicacion.Enabled := True;
end;

/// <summary>
/// Implementa la lógica principal de tmr_autoguardadoTimer.
/// </summary>
procedure TfrmMain.Trvw_APUSTanteoAfterUpdateNode(Sender: TObject;
  ANode: TTMSFNCTreeViewVirtualNode; AColumn: Integer);
var
  v_recurso: Double;
begin
  // Guarda los nuevos valores del tanteo
  tantear := True;
  with DMPresupuesto.StoreProc_TanteoGuardaItems do
  begin
    ParamByName('icodBase').AsString := base_activa.codBase;
    ParamByName('icodPresupuesto').AsString := codProyecto;
    ParamByName('iRevision').AsString := revision;
    ParamByName('icodAPU').AsString :=
      DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString;
    ParamByName('newCantidad').AsFloat := quitaFormatFloat(ANode.Text[3]);
    if ANode.Text[5] = '' then
      v_recurso := 1
    else
      v_recurso := quitaFormatFloat(ANode.Text[5]);
    ParamByName('newRendimiento').AsFloat := v_recurso;
    ParamByName('iIDUnicoItem').AsString := ANode.Text[8];
    Execute;
  end;
  // Actualizar totales de linea de tanteo
  with DMPresupuesto.QLeerLineaTanteo do
  begin
    ParamByName('codBase').AsString := base_activa.codBase;
    ParamByName('codPresupuesto').AsString := codProyecto;
    ParamByName('Revision').AsString := revision;
    ParamByName('codAPU').AsString :=
      DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString;
    ParamByName('idUnicoRecurso').AsString := ANode.Text[8];
    ExecSQL;
    ANode.node.Text[6] := FormatFloat(cadenaCurrency,
      FieldByName('total').AsFloat);
  end;
  // Actualizar Valor total apu tanteo
  cargaCabeceraTanteoAPUS(DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString, 1);
  // Ajustar % de Items tanteo
  ajustaPorcentajeItems(quitaFormatFloat(lbl_TanteoCostoDirecto.Text), 1);
  // Actualizar valores Presupuesto
  DMPresupuesto.calculaTotal;
  tantear := False;
end;

/// <summary>
/// Gestiona operaciones relacionadas con APU en Trvw_APUSTanteoResize.
/// </summary>
procedure TfrmMain.Trvw_APUSTanteoResize(Sender: TObject);
var
  tamanoDescripcion, tamanoTotal: Double;
begin
  if tbcPresupuestos.ActiveTab = tab_5Presupuesto then
  begin
    tamanoTotal := frmMain.Trvw_APUSTanteo.Width;
    tamanoDescripcion := tamanoTotal - 600;
    frmMain.Trvw_APUSTanteo.Columns[0].Width := 150;
    frmMain.Trvw_APUSTanteo.Columns[1].Width := tamanoDescripcion;
    frmMain.Trvw_APUSTanteo.Columns[2].Width := 90;
    frmMain.Trvw_APUSTanteo.Columns[3].Width := 90;
    frmMain.Trvw_APUSTanteo.Columns[4].Width := 90;
    frmMain.Trvw_APUSTanteo.Columns[5].Width := 90;
    frmMain.Trvw_APUSTanteo.Columns[6].Width := 90;
    frmMain.Trvw_APUSTanteo.Columns[7].Width := 90;
    frmMain.Trvw_APUSTanteo.Columns[8].Width := 0;
    frmMain.Trvw_APUSTanteo.Columns[8].Visible := False;
  end;
end;

/// <summary>
/// Manejador de eventos de teclado en trvw_cat2MaterialesKeyUp.
/// </summary>
procedure TfrmMain.trvw_cat1EquiposHerramientasDblClick(Sender: TObject);
begin
  AdicionaItem();
end;

procedure TfrmMain.trvw_cat1EquiposHerramientasKeyUp(Sender: TObject;
  var Key: Word; var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_DELETE then
  begin
    rect_SUB32Borrar.OnClick(rect_SUB32Borrar);
  end;
end;

procedure TfrmMain.trvw_cat2MaterialesDblClick(Sender: TObject);
begin
  AdicionaItem();
end;

procedure TfrmMain.trvw_cat2MaterialesKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_DELETE then
  begin
    rect_SUB32Borrar.OnClick(rect_SUB32Borrar);
  end;
end;

/// <summary>
/// Manejador del evento OnClick de trvw_cat3TransporteDblClick.
/// </summary>
procedure TfrmMain.trvw_cat3TransporteDblClick(Sender: TObject);
begin
  AdicionaItem();
end;

procedure TfrmMain.trvw_cat3TransporteKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_DELETE then
  begin
    rect_SUB32Borrar.OnClick(rect_SUB32Borrar);
  end;
end;

/// <summary>
/// Manejador de eventos de teclado en trvw_cat4ManodeObraKeyUp.
/// </summary>
procedure TfrmMain.trvw_cat4ManodeObraDblClick(Sender: TObject);
begin
  AdicionaItem();
end;

procedure TfrmMain.trvw_cat4ManodeObraKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_DELETE then
  begin
    rect_SUB32Borrar.OnClick(rect_SUB32Borrar);
  end;
end;

/// <summary>
/// Manejador de eventos de teclado en trvw_cat5SeguridadIndustrialKeyUp.
/// </summary>
procedure TfrmMain.trvw_cat5SeguridadIndustrialDblClick(Sender: TObject);
begin
  AdicionaItem();
end;

procedure TfrmMain.trvw_cat5SeguridadIndustrialKeyUp(Sender: TObject;
  var Key: Word; var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VK_DELETE then
  begin
    rect_SUB32Borrar.OnClick(rect_SUB32Borrar);
  end;
end;

/// <summary>
/// Manejador de eventos de teclado en trvw_cat6PreciosUnitariosKeyUp.
/// </summary>
procedure TfrmMain.trvw_cat6PreciosUnitariosDblClick(Sender: TObject);
var
  tv: TTMSFNCTreeView;
begin
  if FClearingTree then
    Exit;

  tv := Sender as TTMSFNCTreeView;
  if (tv = nil) or (tv.SelectedNode = nil) then
    Exit;

  AdicionaItem();
end;

procedure TfrmMain.trvw_cat6PreciosUnitariosKeyUp(Sender: TObject;
  var Key: Word; var KeyChar: WideChar; Shift: TShiftState);
var
  tv: TTMSFNCTreeView;
begin
  if FClearingTree then
    Exit;

  tv := Sender as TTMSFNCTreeView;
  if (tv = nil) or (tv.SelectedNode = nil) then
    Exit;

  if Key = VK_DELETE then
  begin
    rect_SUB32Borrar.OnClick(rect_SUB32Borrar);
  end;
end;

/// <summary>
/// Implementa la lógica principal de Trvw_EDOBeforeSizeColumn.
/// </summary>
procedure TfrmMain.Trvw_EDOBeforeSizeColumn(Sender: TObject; AColumn: Integer;
  AColumnSize: Double; var ANewColumnSize: Double; var AAllow: Boolean);
begin
  if ANewColumnSize < 50 then
    AAllow := False;
end;

/// <summary>
/// Manejador del evento OnClick de Trvw_EDODblClick.
/// </summary>
procedure TfrmMain.Trvw_EDODblClick(Sender: TObject);
var
  node: TTMSFNCTreeViewNode;
  LForm: TfrmAddEDO;
begin
  LForm := TfrmAddEDO.Create(Application);
  try
    node := Trvw_EDO.SelectedNode;
    if Assigned(node) then
    begin
      LForm.nodoSeleccionado := node;
      LForm.ShowModal;
    end;
  finally
    LForm.Free;
  end;
end;

/// <summary>
/// Manejador de eventos de teclado en Trvw_EDOKeyUp.
/// </summary>
procedure TfrmMain.Trvw_EDOKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
var
  tmpstr: string;
  subnode: TTMSFNCTreeViewNode;
begin
  if Key = vkDelete then
  begin
    if realizarPreguntaSiNo('¿Borrar Nodo y Dependencias?') = mrOk then
    begin
      subnode := Trvw_EDO.SelectedNode;
      if Assigned(subnode) then
      begin
        if subnode.GetParent <> nil then
        begin
          subnode.RemoveChildren;
          subnode.Destroy;
          sincronizarEDO();
        end;
      end;
    end;
  end;
end;

/// <summary>
/// Implementa la lógica principal de Trvw_EDTAfterDropNode.
/// </summary>
procedure TfrmMain.Trvw_EDTAfterDropNode(Sender: TObject;
  AFromNode, AToNode: TTMSFNCTreeViewVirtualNode);
begin
  generaCodEDT(Trvw_EDT.nodes[0]);
end;

/// <summary>
/// Implementa la lógica principal de Trvw_EDTBeforeDropNode.
/// </summary>
procedure TfrmMain.Trvw_EDTBeforeDropNode(Sender: TObject;
  AFromNode, AToNode: TTMSFNCTreeViewVirtualNode; var ACanDrop: Boolean);
var
  subnode: TTMSFNCTreeViewVirtualNode;
begin
  if Assigned(AToNode) then
  begin
    subnode := AToNode.GetParent;
    if not Assigned(subnode) then
    begin
      ACanDrop := False;
    end
    else
    begin
      if AToNode.Level = 0 then
        ACanDrop := False;
    end
  end
  else
    ACanDrop := False;
end;

/// <summary>
/// Implementa la lógica principal de Trvw_EDTBeforeSizeColumn.
/// </summary>
procedure TfrmMain.Trvw_EDTBeforeSizeColumn(Sender: TObject; AColumn: Integer;
  AColumnSize: Double; var ANewColumnSize: Double; var AAllow: Boolean);
begin
  if ANewColumnSize < 50 then
    AAllow := False;
end;

/// <summary>
/// Manejador del evento OnClick de Trvw_EDTDblClick.
/// </summary>
procedure TfrmMain.Trvw_EDTDblClick(Sender: TObject);
var
  node, subnode: TTMSFNCTreeViewNode;
  Descripcion, codCuenta: string;
  LForm: TfrmOpcionesEDT;
begin
  node := Trvw_EDT.SelectedNode;
  if Assigned(node) then
  begin
    LForm := TfrmOpcionesEDT.Create(Application);
    try
      subnode := addNodeEDT(node, '');
      generaCodEDT(subnode);
      Trvw_EDT.ExpandNode(node);
      Descripcion := subnode.Text[2];
      codCuenta := subnode.Text[0];
      codCuenta := Trim(codCuenta);
      Descripcion := Trim(Descripcion);
      LForm.lbl_codCuenta.Text := 'Cod. EDT: ' + codCuenta;
      LForm.edt_EDTDescripcion.Text := Descripcion;
      LForm.mmo_EDTObservaciones.Text := subnode.Text[2];
      LForm.lbl_modo.Text := '1';
      populaResponsableEDT(LForm);
      LForm.cbb_EDTResponsable.ItemIndex := -1;
      if subnode.Text[1] <> '' then
      begin
        LForm.SeleccionarResponsable(subnode.Text[1]);
      end;
      LForm.nodoSeleccionado := subnode;
      LForm.ShowModal;
      LForm.edt_EDTDescripcion.SetFocus;
    finally
      LForm.Free;
    end;
  end;
end;

/// <summary>
/// Manejador de eventos de teclado en Trvw_EDTKeyUp.
/// </summary>
procedure TfrmMain.Trvw_EDTKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
var
  PosNode: TTMSFNCTreeViewNode;
  X: Integer;
  node: TTMSFNCTreeViewNode;
  Descripcion, codCuenta: string;
  LForm: TfrmOpcionesEDT;
  tmpstr: string;
  subnode: TTMSFNCTreeViewNode;
begin
  if (ssCtrl in Shift) and (Key = vkX) then
  begin
    copynode := TTMSFNCTreeViewNode.Create(nil);
    copynode := Trvw_EDT.SelectedNode;
  end;
  if (ssCtrl in Shift) and (Key = vkV) then
  begin
    if Assigned(copynode) then
    begin
      PosNode := Trvw_EDT.SelectedNode;
      Trvw_EDT.MoveNode(copynode, PosNode.GetParent, PosNode.Index);
      copynode := nil;
    end;
  end;
  if Key = vkDelete then
  begin
    if realizarPreguntaSiNo('¿Borrar Nodo y Dependencias?') = mrOk then

    begin
      subnode := Trvw_EDT.SelectedNode;
      if Assigned(subnode) then
      begin
        if subnode.GetParent <> nil then
        begin
          subnode.RemoveChildren;
          subnode.Destroy;
          generaCodEDT(Trvw_EDT.nodes[0]);
        end;
      end;
    end;
  end;
  if Key = vkReturn then
  begin
    node := Trvw_EDT.SelectedNode;
    LForm := TfrmOpcionesEDT.Create(Application);
    try
      if Assigned(node) then
      begin
        subnode := addNodeEDT(node, '');
        generaCodEDT(subnode);
        Trvw_EDT.ExpandNode(subnode);
        Descripcion := subnode.Text[2];
        codCuenta := subnode.Text[0];
        codCuenta := Trim(codCuenta);
        Descripcion := Trim(Descripcion);
        LForm.lbl_codCuenta.Text := 'Cod. EDT: ' + codCuenta;
        LForm.edt_EDTDescripcion.Text := Descripcion;
        LForm.mmo_EDTObservaciones.Text := subnode.Text[2];
        LForm.lbl_modo.Text := '1';
        populaResponsableEDT(LForm);
        LForm.cbb_EDTResponsable.ItemIndex := -1;
        if subnode.Text[1] <> '' then
        begin
          LForm.SeleccionarResponsable(subnode.Text[1]);
        end;
        LForm.lbl_modo.Text := subnode.Text[4];
        LForm.nodoSeleccionado := subnode;
        LForm.ShowModal;
        LForm.edt_EDTDescripcion.SetFocus;
      end
      else
      begin
        node := Trvw_EDT.nodes[0];
        subnode := addNodeEDT(node, '');
        generaCodEDT(subnode);
        Trvw_EDT.ExpandNode(subnode);
        Descripcion := subnode.Text[1];
        codCuenta := subnode.Text[0];
        codCuenta := Trim(codCuenta);
        Descripcion := Trim(Descripcion);
        LForm.lbl_codCuenta.Text := 'Cod. EDT: ' + codCuenta;
        LForm.edt_EDTDescripcion.Text := Descripcion;
        LForm.mmo_EDTObservaciones.Text := subnode.Text[2];
        LForm.lbl_modo.Text := '1';
        populaResponsableEDT(LForm);
        LForm.cbb_EDTResponsable.ItemIndex := -1;
        if subnode.Text[1] <> '' then
        begin
          LForm.SeleccionarResponsable(subnode.Text[1]);
        end;
        LForm.nodoSeleccionado := subnode;
        LForm.ShowModal;
        LForm.edt_EDTDescripcion.SetFocus;
      end;
    finally
      LForm.Free;
    end;
  end;
end;

/// <summary>
/// Implementa la lógica principal de Trvw_EDTNodeChanged.
/// </summary>
procedure TfrmMain.Trvw_EDTNodeChanged(Sender: TObject;
  ANode: TTMSFNCTreeViewVirtualNode);
var
  bkp: TMemoryStream;
begin
  // Rutina undo-redo
  bkp := TMemoryStream.Create;
  Trvw_EDT.SaveToJSONStream(bkp);
  bkp.Position := 0;
  historicoEDT.Add(bkp.ToString);
  bkp.Free;
end;

/// <summary>
/// Manejador del evento OnClick de trvw_RecursosDesagregacionNodeDblClick.
/// </summary>
procedure TfrmMain.trvw_RecursosDesagregacionNodeDblClick(Sender: TObject;
  ANode: TTMSFNCTreeViewVirtualNode);
var
  valorFiltro: string;
  codAPUDes: string;
  precioUnitario: string;
  LForm: Tfrm_CPCSeleccion;
begin
  LForm := Tfrm_CPCSeleccion.Create(Application);
  try
    if ANode.Text[3] <> '' then
    begin
      LForm.QcodCPC.Active := True;
      LForm.ds1.Enabled := True;
      LForm.dbGridConnect_SelCPC.Active := True;
      LForm.edt_filtro.Text := '';
      LForm.lbl_Item.Text := 'Item Seleccionado: ' + ANode.Text[1];
      LForm.lbl_modo.Text := ANode.Text[12];
      if ANode.Text[8] = 'N/D' then
      begin
        LForm.edt_filtro.Text := ANode.Text[1];
      end
      else
      begin
        LForm.edt_filtro.Text := ANode.Text[8];
      end;
      LForm.filtrarCodCPC(LForm.edt_filtro.Text);
      LForm.lbl_adicional.Text := '1';
      LForm.ShowModal;

      if ARowDesagregacion > -1 then
      begin
        codAPUDes := grid_DesagregacionAPUS.cells[11, ARowDesagregacion];
        precioUnitario := quitaSimboloMoneda(grid_DesagregacionAPUS.cells[5,
          ARowDesagregacion]);
        precioUnitario := quitaSignoMiles(precioUnitario).Trim;
        if codAPUDes <> '' then
        begin
          PresentarRecursosDesagregacion(codAPUDes, precioUnitario);
        end;
      end;
    end;
  finally
    LForm.Free;
  end;
end;

/// <summary>
/// Implementa la lógica principal de trvw_RecursosDesagregacionResize.
/// </summary>
procedure TfrmMain.trvw_RecursosDesagregacionResize(Sender: TObject);
var
  parte1: Double;
  X: Integer;
begin
  treeviewDesagregacionManualSize();
  if (tbc_PreciosUnitarios.ActiveTab = tab_PresupuestosGeneral) and
    (tbcPresupuestos.ActiveTab = tab_7Desagregacion) and
    (base_activa.codBase <> '') then
  begin
    parte1 := 0;
    for X := 0 to 5 do
    begin
      parte1 := parte1 + trvw_RecursosDesagregacion.Columns[X].Width;
    end;
    lyt_DesRecurso1.Width := parte1;

    lyt_DesRecurso2.Width := trvw_RecursosDesagregacion.Columns[6].Width;
    lyt_DesRecurso3.Width := trvw_RecursosDesagregacion.Columns[7].Width;

    parte1 := 0;
    for X := 8 to 10 do
    begin
      parte1 := parte1 + trvw_RecursosDesagregacion.Columns[X].Width;
    end;
    lyt_DesRecurso4.Width := parte1;
    lyt_DesRecurso5.Width := trvw_RecursosDesagregacion.Columns[11].Width;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de Trvw_StakeHolderDisponiblesNodeDblClick.
/// </summary>
procedure TfrmMain.Trvw_StakeHolderDisponiblesNodeDblClick(Sender: TObject;
  ANode: TTMSFNCTreeViewVirtualNode);
var
  salir: Boolean;
  nodo: TTMSFNCTreeViewNode;
  codSTK: string;
  X: Integer;
begin
  nodo := ANode.node;
  if not nodo.Extended then
  begin
    salir := False;
    while not salir do
    begin
      nodo := nodo.GetPrevious;
      if nodo.Extended then
        salir := True;
    end;
  end;
  X := AnsiPos(' - ', nodo.Text[0]);
  if X > 0 then
  begin
    codSTK := Copy(nodo.Text[0], 1, X - 1).Trim;
    addStakeHolder(codSTK);
  end;
end;

/// <summary>
/// Actualiza la interfaz o los datos asociados en Trvw_TanteoCronoAfterUpdateNode.
/// </summary>
procedure TfrmMain.Trvw_TanteoCronoAfterUpdateNode(Sender: TObject;
  ANode: TTMSFNCTreeViewVirtualNode; AColumn: Integer);
begin
  // Guarda los nuevos valores del tanteo
  tantear := True;
  with DMPresupuesto.StoreProc_TanteoGuardaItems do
  begin
    ParamByName('icodBase').AsString := base_activa.codBase;
    ParamByName('icodPresupuesto').AsString := codProyecto;
    ParamByName('iRevision').AsString := revision;
    ParamByName('icodAPU').AsString :=
      DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString;
    ParamByName('newCantidad').AsFloat := StrToFloatDef(ANode.Text[2], 0);
    ParamByName('newRendimiento').AsFloat := StrToFloatDef(ANode.Text[3], 0);
    ParamByName('iIDUnicoItem').AsString := ANode.Text[5];
    Execute;
  end;
  // Actualizar totales de linea de tanteo
  with DMPresupuesto.QLeerLineaTanteo do
  begin
    ParamByName('codBase').AsString := base_activa.codBase;
    ParamByName('codPresupuesto').AsString := codProyecto;
    ParamByName('Revision').AsString := revision;
    ParamByName('codAPU').AsString :=
      DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString;
    ParamByName('idUnicoRecurso').AsString := ANode.Text[5];
    ExecSQL;
    ANode.node.Text[4] := FormatFloat(cadenaCurrency,
      FieldByName('total').AsFloat);
  end;
  // Actualizar Valor total apu tanteo
  cargaCabeceraTanteoAPUS(DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString, 2);
  // Actualizar valores Presupuesto
  DMPresupuesto.calculaTotal;
  tantear := False;
end;

/// <summary>
/// Actualiza la interfaz o los datos asociados en tv_APUSEditorPresupuestoBeforeUpdateNode.
/// </summary>
procedure TfrmMain.trvw_TanteoCronoGetInplaceEditor(Sender: TObject;
  ANode: TTMSFMXTreeViewVirtualNode; AColumn: Integer; var ATransparent:
  Boolean;
  var AInplaceEditorClass: TTMSFMXTreeViewInplaceEditorClass);
var
  tmpstr: string;
begin
  tmpstr := ANode.Text[5];
  tmpstr := decimal_correcto(tmpstr);
  rendimiento2Old := StrToFloat(tmpstr);
end;

/// <summary>
/// Implementa la lógica principal de Trvw_TanteoCronoResize.
/// </summary>
procedure TfrmMain.Trvw_TanteoCronoResize(Sender: TObject);
var
  tamanoDescripcion, tamanoTotal: Double;
begin
  if tbcPresupuestos.ActiveTab = tab_6PresupuestoCronogramas then
  begin
    tamanoTotal := frmMain.Trvw_TanteoCrono.Width;
    tamanoDescripcion := tamanoTotal - 600;
    frmMain.Trvw_TanteoCrono.Columns[0].Width := 150;
    frmMain.Trvw_TanteoCrono.Columns[1].Width := tamanoDescripcion;
    frmMain.Trvw_TanteoCrono.Columns[2].Width := 90;
    frmMain.Trvw_TanteoCrono.Columns[3].Width := 90;
    frmMain.Trvw_TanteoCrono.Columns[4].Width := 90;
    frmMain.Trvw_TanteoCrono.Columns[5].Width := 90;
    frmMain.Trvw_TanteoCrono.Columns[6].Width := 90;
    frmMain.Trvw_TanteoCrono.Columns[7].Width := 90;
    frmMain.Trvw_TanteoCrono.Columns[8].Width := 0;
    frmMain.Trvw_TanteoCrono.Columns[8].Visible := False;
  end;
end;

/// <summary>
/// Manejador del evento OnClick de trvw_cat1EquiposHerramientasDblClick.
/// </summary>
procedure TfrmMain.tv_APUSEditorPresupuestoBeforeUpdateNode(Sender: TObject;
  ANode: TTMSFMXTreeViewVirtualNode; AColumn: Integer; var AText: string;
  var ACanUpdate: Boolean);
var
  valor: Double;
begin
  valor := StrToFloatDef(decimal_correcto(AText), -1);
  if valor < 0 then
    ACanUpdate := False
  else
  begin
    if AColumn = 3 then
      ANode.node.Text[3] := decimal_correcto(AText);
    if AColumn = 5 then
      ANode.node.Text[5] := decimal_correcto(AText);
  end;
end;

/// <summary>
/// Implementa la lógica principal de webBrowser_1Initialized.
/// </summary>
procedure TfrmMain.webBrowser_1Initialized(Sender: TObject);
begin
  loadMapHtml;
end;

/// <summary>
/// Implementa la lógica principal de webBrowser_1WebMessageReceived.
/// </summary>
procedure TfrmMain.webBrowser_1WebMessageReceived(Sender: TObject;
  var Params: TTMSFNCWebBrowserWebMessageReceivedParams);
var
  Msg, Lat, Lng: string;
  SepPos: Integer;
begin
  Msg := Params.WebMessageAsJSON;
  Msg := AnsiDequotedStr(Msg, Char(34));

  if Msg.StartsWith('COORD:') then
  begin
    Msg := Msg.Substring(6);
    SepPos := Pos(',', Msg);
    if SepPos > 0 then
    begin
      Lat := Copy(Msg, 1, SepPos - 1);
      Lng := Copy(Msg, SepPos + 1, Length(Msg));
      edt_Latitud.Text := Lat;
      edt_longitud.Text := Lng;
    end;
  end;
end;

end.

