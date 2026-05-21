unit DM1;

interface

uses
  System.SysUtils, System.Classes, UniProvider, MySQLUniProvider, Data.DB,
  System.RegularExpressions, FMX.TMSTreeViewBase, FMX.TMSTreeViewData,
  FMX.TMSCustomTreeView, Windows, FMX.TMSTreeView, DBAccess, Uni, FMX.Types,
  FMX.Controls, System.ImageList, FMX.ImgList, FMX.ListBox, System.UITypes,
  System.StrUtils, System.DateUtils, System.Math, MemDS, SalsaObj, RSAObj,
  HashObj, X509Obj, XAdESObj, AdESObj, CAdESObj, PAdESObj, X509Values, AESObj,
  SPECKObj, MiscObj, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Platform,
  CryptBase, Generics.Defaults, FMX.ListView.Types, FMX.ListView.Appearances,
  FMX.ListView.Adapters.Base, FMX.ListView, Generics.Collections, FMX.ScrollBox,
  FMX.Objects, System.UIConsts, FMX.TMSTableViewEx, FMX.TMSBaseControl,
  FMX.TMSListView, FMX.TMSTableView, FMX.TMSBitmapContainer, FMX.TMSBitmap,
  IdTCPConnection, IdTCPClient, FMX.TMSBarButton, FMX.TMSPopup, IdMessageClient,
  IdSMTP, IdExplicitTLSClientServerBase, IdSMTPBase, IdHTTP, SQLiteUniProvider,
  IdBaseComponent, IdCoder, IdCoder3to4, IdCoderMIME, IdGlobal, System.Types,
  ECCObj, IdComponent, IdIOHandler, IdIOHandlerSocket, IdIOHandlerStack, IdSSL,
  IdSSLOpenSSL, TMSEncryptedInifile, System.NetEncoding, System.IOUtils,
  System.Net.HttpClient, Soap.EncdDecd, FMX.Layouts, FMX.TMSCustomEdit,
  FMX.TMSSearchEdit, FMX.Effects, FMX.Memo.Types, FMX.TabControl,
  FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes,
  FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions, FMX.TMSFNCCustomControl,
  FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData, FMX.TMSFNCCustomGrid,
  FMX.TMSFNCGrid, System.Variants, FMX.TMSFNCListBox, FMX.Controls.Presentation,
  FMX.StdCtrls, FMX.TMSLed, FMX.TMSFNCTypes, FMX.TMSFNCTreeView, FMX.TMSGridCell,
  FMX.TMSGridOptions, FMX.TMSGridData, FMX.TMSCustomGrid, FMX.TMSGrid,
  FMX.TMSFNCTreeViewBase, FMX.TMSFNCTreeViewData, FMX.TMSFNCCustomTreeView,
  FMX.TMSFNCBitmapContainer, FMX.TMSFNCCustomComponent, FMX.DialogService,
  FMX.Edit, FMX.Menus, FMX.TreeView, FMX.TMSFNCSplitter,
  FMX.TMSFNCHTMLImageContainer, FMX.TMSFNCCheckBox, FMX.DateTimeCtrls,
  FMX.TextLayout, FMX.EditBox, FMX.NumberBox, FMX.TMSFNCCheckedListBox, FMX.Grid,
  TLHelp32, Winapi.ShellAPI, FMX.Memo, FMX.WindowsStore, WinInet,
  FMX.Toast.Windows, RegularExpressionsCore, FMX.TMSFNCChart, ShlObj, Masks,
  System.JSON, FlexCel.FMXSupport, FlexCel.Core, FlexCel.Render,
  System.Net.HttpClientComponent, FlexCel.XlsAdapter, InterBaseUniProvider,
  System.Net.URLClient, System.Threading, IdSSLOpenSSLHeaders,
  IdMultipartFormData, REST.Client, REST.Types, REST.Authenticator.Basic,
  UniDump, DADump, IdFTP, System.Rtti, fmx.Media, IdFTPCommon, Unit_UsersIni,
  System.SyncObjs, System.Generics.Collections, uApiGiProy, fProductoTienda;

const
  GoogleApi = 'AIzaSyDq6cn-KLsi0pOxr1vYR5ELV9Kf_ck_Xvw';
  URLCurrency = 'https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=';
  salsaKey = 'E8E3E105D8885187EB0408A1D1F57CD5';
  factorConversionDias = 1.36;
  plantillasBaseDir = 'Plantillas\';
  dbPass = 'INeA4scRb0A=dmiFcBhA9IUBHQ=='; // contraseña Online: G4^Xs&=h4f
  Pdeveloper = 'T9H8O_JatCQ=zZcRA55LQdE2';
  Udeveloper = 'yuwZSnDkC3U=Ip--Lc-Fj4-XATNQj3SDnQC9GcTi5Ik=';
  folder_actaConstitucion = 'Acta de Constitucion del Proyecto\';
  folder_analisis = 'Analisis\';
  folder_cronogramaTrabajo = 'Cronograma de Trabajo\';
  folder_cronogramaValorado = 'Cronograma Valorado\';
  folder_desagregacionTecnologica = 'Desagregacion Tecnologica';
  folder_equipoProyecto = 'Equipo del Proyecto (Stakeholders)\';
  folder_DescomposicionOrganizacion = 'Estructura Descomposicion Organizacion (EDO)\';
  folder_formulasPolinomicas = 'Formulas Polinomicas\';
  folder_porcentajesIndirectos = 'Porcentajes de Indirectos\';
  folder_presupuestos = 'Presupuestos\';
  folder_EDTDiccionario = 'EDT - Diccionario';
  folder_EDTListado = 'EDT - Listado';
  folder_EDTValorada = 'EDT - Valorada';
  folder_GestionTiempos = 'Gestion de Tiempos';
  fecha0 = '30/12/1899';
  Dia_de_semana: array[1..7] of string = ('Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado');
  Dia_de_semanaEspaniol: array[1..7] of string = ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo');
  tipo_de_recurso: array[1..6] of string = ('Equipos y Herramientas', 'Materiales', 'Transporte', 'Mano de Obra', 'Seguridad Industrial', 'Recurso');
  tipo_de_recursoPRJ: array[1..3] of string = ('Trabajo', 'Material', 'Costo');
  listadodecolumnas: array[1..3] of string = ('Cod. EDT', 'Cod. Item', 'Cod. APU');
  ordinalPeriodos: array[1..8] of string = ('Día', 'Semana', 'Quincena', 'Mes', 'Dos Meses', 'Tres Meses', 'Semestre', 'Año');
  VALOR_DEFECTO_IVA = 1;
  nombreBaseInstalacionEnc = 'giproylocal_base.sql.enc';
  nDBInicio = 'giproylocal';

  {(*}
  L1 =
    'CREATE USER IF NOT EXISTS ''Giproy''@''localhost'' IDENTIFIED WITH caching_sha2_password PASSWORD EXPIRE DEFAULT;';
  L2 = 'GRANT SELECT ON *.* TO ''Giproy''@''localhost'';';
  L3 = 'GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON giproylocal_4.* TO ''Giproy''@''localhost'';';
  {*)}

  // Gemini API KEY: AIzaSyB2kv9voHKfZipp7Qo1MAPXozPtN7cCo8w

  // https://nordvpn.com/es/what-is-my-ip/
  // giproylocal
  //  Giproy
  // neQ8%c5b&CZIrzDO
  // https://dev.mysql.com/downloads/file/?id=526927

  // Giproy Web
  // IP: 195.179.236.1
  // DB: u620211766_Bg0JT
  // User: u620211766_GiProy
  // Pass: G4^Xs&=h4f

  // GiProy Web Nueva
  // IP: 195.179.236.1
  // DB: u620211766_gproy
  // User: u620211766_admin
  // Pass: cUNKDGSYr$Z%i3rB

type
  TCategoriaFiltro = record
    Slugs: string;
    StartsWith: string;
    PerPage: Integer;
    Page: Integer;
  end;

type
  TWPCallback = reference to procedure(const Success: Boolean; const Message: string);

type
  TDatUsuario = record
    idUsuario: Int64;
    Nombre: string;
    Apellidos: string;
    usuario: string;
    fechaAlta: TDateTime;
    estado: Integer;
    profesion: string;
    tipo: string;
    direccion: string;
    Ciudad: string;
    Provincia: string;
    Pais: string;
    email: string;
    Tfno: string;
    computerIDPrincipal: string;
    fechahoraIDPrincipal: TDateTime;
    computerIDMudanza: string;
    fechaHoraIDMudanza: TDateTime;
    BackUpActivo: Integer;
    MudanzaActiva: Integer;
    idfiscal: string;
    descripcion: string;
    FechaInicio: TDateTime;
    FechaFin: TdateTime;
  end;

type
  TCrearUsuarioCallback = reference to procedure(const Exito: Boolean; const Mensaje: string);

type
  dat_respuesta1 = record
    codSubCategoria: string;
    codRecurso: string;
  end;

type
  dat_importRecursos = record
    idUnico: string;
    codRecurso: string;
    codRecursoCompleto: string;
    codCategoriaBase: string;
    codSubCategoria: string;
    descripcion: string;
    unidad: string;
    precio: string;
    rendimiento: string;
    cantidad: string;
    codCPC: string;
    tipoCPC: string;
    porcentajeCPC: string;
    fechaHoraCreacion: TdateTime;
    ultModificacion: TdateTime;
    codAPU: string;
    codBaseOrigen: string;
    especificaciones: string;
    especificaciones2: string;
  end;

type
  dat_importAPU = record
    codBaseOrigen: string;
    codPresupuestoOrigen: string;
    revisionOrigen: string;
    codAPUOrigen: string;
    codRecursoAPU: string;
    codAPU: string;
    descripcion: string;
    unidad: string;
    precio: string;
    cantidad: string;
    rendimiento: string;
    Categoria: string;
    fechaHoraCreacion: TdateTime;
    fechaHoraActualizacion: Tdatetime;
    codCategoriaApu: string;
    codSubCategoriaAPU: string;
    tipoImportacion: string;
    porcentajeIndirectos: string;
    totalConIndirectos: string;
    rendimientoHUnidad: string;
    HCuadrillas: string;
    anidado: Boolean;
    accion: string;
    idUnicoApuRecurso: string;
  end;

type
  dat_importAPUItem = record
    codBase: string;
    codAPU: string;
    CodCategoria: string;
    codSubCategoria: string;
    idUnicoRecurso: string;
    codRecurso: string;
    codRecursoCompleto: string;
    descripcion: string;
    Unidad: string;
    Precio: string;
    moneda: string;
    cantidadUnidad: string;
    rendimiento: string;
    total: string;
    porcentaje: string;
    codCPC: string;
    tipoCPC: string;
    porcentajeCPC: string;
    termino: string;
  end;

type
  OurArrayStr = array of string;

type
  dat_fpol2 = record
    codUnicoRecurso: string;
    codSubCategoria: string;
    Cantidad: string;
    precioBase: string;
  end;

type
  dat_fploIndices = record
    codigo: string;
    descripcion: string;
  end;

type
  dat_recursoFP = record
    codRecurso: string;
    cantidad: string;
    precio: string;
    total: string;
    indice: string;
    subcategoria: string;
  end;

type
  dat_RecursosAsumidos = record
    codApu: string;
    idUnicoRecurso: string;
    unidadesRecursos: Double;
  end;

type
  dat_recursosApu = record
    codApu: string;
    codRecurso: string;
    codCategoria: string;
    codSubCategoria: string;
    subCategoria: string;
    idUnicoRecurso: string;
    Descripcion: string;
    Precio: Double;
    CantidadUnidad: Double;
    Rendimiento: Double;
    Total: Double;
  end;

type
  dat_tmpAPU = record
    codUnicoAPU: string;
    cantidad: double;
  end;

type
  dat_grid = record
    C00: string;
    C01: string;
    C02: string;
    C03: string;
    C04: string;
    C05: string;
    C06: string;
    C07: string;
    C08: string;
    C09: string;
    C10: string;
    C11: string;
    C12: string;
    C13: string;
    C14: string;
    C15: string;
    C16: string;
    C17: string;
    C18: string;
    C19: string;
    C20: string;
  end;

type
  dat_pareto = record
    posgrid: Integer;
    codUnicoItem: string;
    valor: Double;
  end;

type
  dat_anotaciones = record
    idItem: string;
    fecha: TdateTime;
    codEDT: string;
    paquete: string;
    Descripcion: string;
    nota: string;
    autor: string;
    tipoNota: string;
    notaReferencia: string;
  end;

type
  dat_nota = record
    idItem: string;
    fecha: TdateTime;
    paquete: string;
    Descripcion: string;
    nota: string;
  end;

type
  dat_listaPorcentajeUsado = record
    Descripcion: string;
    id: string;
  end;

type
  dat_costoIndirectoPresupuesto = record
    cuenta: string;
    observaciones: string;
    porcentaje: string;
    codCuenta: string;
  end;

type
  dat_ItemPresupuesto = record
    Descripcion: string;
    codApu: string;
    unidad: string;
    cantidad: string;
    PrecioUnitario: string;
    PrecioTotal: string;
  end;

type
  dat_categoria = record
    categoriaBase: string;
    ciu: string;
    nombreBase: string;
    Descripcion: string;
    codExterno: string;
    comentarios: string;
    usado: Integer;
    fechaCreacion: TdateTime;
    sincronizada: Boolean;
    origen: string;
  end;

type
  dat_Recurso = record
    idUnicoRecurso: string;
    cod_Recurso: string;
    codCategoriaBase: string;
    codSubCategoria: string;
    Descripcion: string;
    unidad: string;
    Precio: string;
    PrecioLocal: string;
    termino: string;
    codAlternativo: string;
    codCPC: string;
    Especificaciones: string;
    fechaHoraCreacion: TdateTime;
    ultimaModificacion: TdateTime;
  end;

type
  dat_Apu = record
    codCategoria: string;
    codRecursoAPU: string;
    categoriaAPU: string;
    codApu: string;
    Descripcion: string;
    unidad: string;
    Rendimiento: string;
    rendimientotodoAnalisis: Boolean;
    rendimientoTodoEscenario: Boolean;
    costoDirectoTotal: string;
    costoIndirectoTotal: string;
    porcentajeCostoIndirecto: string;
    precioUnitarioTotal: string;
    codCPC: string;
    fechaHoraCreacion: TdateTime;
    ultimaModificaion: TdateTime;
    pendienteRevision: Boolean;
    rendimientoHUnidad: string;
    nhCuadrillas: string;
  end;

type
  dat_ItemsAPU = record
    codApu: string;
    codCategoria: string;
    codSubCategoria: string;
    idUnicoRecurso: string;
    codRecurso: string;
    Descripcion: string;
    unidad: string;
    Precio: string;
    CantidadUnidad: string;
    Rendimiento: string;
    Total: string;
    porcentaje: string;
  end;

type
  dat_Moneda = record
    ISO: string;
    nombre: string;
  end;

type
  item_twvr = record
    codigo: string;
    Descripcion: string;
    codExt: string;
    comentarios: string;
    codUnico: string;
    Categoria: string;
    accion: string;
  end;

type
  baseDatos = record
    codBase: string;
    nombre: string;
    Descripcion: string;
    indirectos: Double;
    TRendimiento: string;
    UMedida: string;
    pais: string;
    SeguridadIndustrial: Boolean;
    moneda: string;
    simboloMoneda: string;
    observaciones: string;
    BasesPadres: TStringList;
    idUsuario: integer;
  end;

type
  dat_StakesHolders = record
    rolProyecto: string;
    idFiscal: string;
    cargo: string;
    nombre: string;
    Apellidos: string;
    direccion: string;
    localidad: string;
    provincia: string;
    pais: string;
    telefono: string;
    email: string;
    titulacion: string;
    institucion: string;
  end;

type
  dat_Tproyectos = record
    codigo: string;
    Descripcion: string;
  end;

type
  TDModule_1 = class(TDataModule)
    il11: TImageList;
    stylbk_2: TStyleBook;
    il2: TImageList;
    il_PopupEDT: TImageList;
    untbl1: TUniTable;
    ds1: TUniDataSource;
    untbl2: TUniTable;
    ds2: TUniDataSource;
    ds13: TUniDataSource;
    untbl3: TUniTable;
    ds3: TUniDataSource;
    untbl4: TUniTable;
    ds4: TUniDataSource;
    mysqlnprvdr1: TMySQLUniProvider;
    untbl5: TUniTable;
    ds5: TUniDataSource;
    SalsaEnc_1: TSalsaEncryption;
    con2: TUniConnection;
    unsql_UpdateApusItems: TUniSQL;
    unsqlBorraApusItems: TUniSQL;
    unsqlUpdataDespuesAPusItems: TUniSQL;
    unsql_ActualizarDatosGenerales: TUniSQL;
    Unsql_generaTanteoAPUS: TUniSQL;
    StoreProc_CrearLineasTanteoAnidado: TUniStoredProc;
    StoreProc_calcular_ValoresApusTanteo: TUniStoredProc;
    StoreProc_DaValorAPU: TUniStoredProc;
    QAPU: TUniQuery;
    QFormulaPolinomica: TUniQuery;
    QIndicesFormulaPolinomica: TUniQuery;
    QDatosGeneralesPresupuesto: TUniQuery;
    QIndicesFormulaPolinomicadescripcion: TStringField;
    QIndicesFormulaPolinomicaterminoRecurso: TStringField;
    QIndicesFormulaPolinomicaSubtotalTermino: TFloatField;
    QAPUdescripcionAPU: TStringField;
    QAPUUnidadAPU: TStringField;
    QAPUCodCategoria: TStringField;
    QAPUDescripcion: TStringField;
    QAPUunidad: TStringField;
    QAPUCantidad: TFloatField;
    QAPUrendimiento: TFloatField;
    QAPUPrecio: TFloatField;
    QAPUCostoHora: TFloatField;
    QAPUTotal: TFloatField;
    QAPUcodCPC: TStringField;
    QAPUTipoCPC: TStringField;
    QAPUCostoDirectoTotal: TFloatField;
    QAPUpesoRelativo: TFloatField;
    QAPUVAER: TStringField;
    QAPUPtotalVAER: TFloatField;
    uProcSql_GeneraRecursos: TUniStoredProc;
    QDatosGeneralesPresupuestoid: TIntegerField;
    QDatosGeneralesPresupuestocodBase: TStringField;
    QDatosGeneralesPresupuestocodPresupuesto: TStringField;
    QDatosGeneralesPresupuestocodReferencial: TStringField;
    QDatosGeneralesPresupuestorevision: TStringField;
    QDatosGeneralesPresupuestodescripcion: TStringField;
    QDatosGeneralesPresupuestosubtotal: TFloatField;
    QDatosGeneralesPresupuestoiva: TFloatField;
    QDatosGeneralesPresupuestoindirectos: TFloatField;
    QDatosGeneralesPresupuestototal: TFloatField;
    QDatosGeneralesPresupuestofechaCreacion: TDateTimeField;
    QDatosGeneralesPresupuestofechaModificacion: TDateTimeField;
    QDatosGeneralesPresupuestondecimales: TIntegerField;
    QDatosGeneralesPresupuestondecimalesMoneda: TIntegerField;
    QDatosGeneralesPresupuestoporcentajeIVA: TFloatField;
    QDatosGeneralesPresupuestoactivo: TIntegerField;
    StoreProc_GuardarItemsProyecto: TUniStoredProc;
    QDaParametro: TUniQuery;
    QDaParametroValor: TStringField;
    QEmpresaAsignada: TUniQuery;
    QEmpresaAsignadacodUnico: TStringField;
    QEmpresaAsignadaidFiscal: TStringField;
    QEmpresaAsignadaNombre: TStringField;
    QEmpresaAsignadadireccion: TStringField;
    QEmpresaAsignadalocalidad: TStringField;
    QEmpresaAsignadaprovincia: TStringField;
    QEmpresaAsignadaemail: TStringField;
    QEmpresaAsignadatfno: TStringField;
    QEmpresaAsignadafechaCreacion: TDateTimeField;
    QEmpresaAsignadafechaModificacion: TDateTimeField;
    QEmpresaAsignadanDecimales: TIntegerField;
    QEmpresaAsignadanDecimalesMoneda: TIntegerField;
    QEmpresaAsignadaautoguardado: TIntegerField;
    QEmpresaAsignadatAutoguardado: TIntegerField;
    QEmpresaAsignadaRConstitucionProyecto: TStringField;
    QEmpresaAsignadaRAnalisisPrecios: TStringField;
    QEmpresaAsignadaRCronogramaTrabajo: TStringField;
    QEmpresaAsignadaRCronogramaValorado: TStringField;
    QEmpresaAsignadaRDesagregacionTecnologica: TStringField;
    QEmpresaAsignadaRDesagregacionTecnologicaAPUS: TStringField;
    QEmpresaAsignadaREDTDiccionario: TStringField;
    QEmpresaAsignadaREDTListado: TStringField;
    QEmpresaAsignadaREDTValorada: TStringField;
    QEmpresaAsignadaREquipoProyecto: TStringField;
    QEmpresaAsignadaRDescomposicionOrganizacion: TStringField;
    QEmpresaAsignadaRFormulaPolinomicas: TStringField;
    QEmpresaAsignadaRGestionTiempos: TStringField;
    QEmpresaAsignadaRPorcentajeIndirectos: TStringField;
    QEmpresaAsignadaRPresupuestos: TStringField;
    QEmpresaAsignadaRCurvaS: TStringField;
    QEmpresaAsignadaLogoEmpresa: TMemoField;
    QColaboradores: TUniQuery;
    ds_Colaboradores: TUniDataSource;
    QuComunicacion: TUniQuery;
    ds_uComunicacion: TUniDataSource;
    SQLGuardarComunicacionesRecibidas: TUniSQL;
    SQLInsertaComunicacion: TUniSQL;
    QUltimoIDComunicacion: TUniQuery;
    QUltimoIDComunicacionidExterno: TLargeintField;
    QColaboradoresid: TIntegerField;
    QColaboradoresEMail: TStringField;
    QColaboradoresNombre: TStringField;
    QuComunicacionid: TLargeintField;
    QuComunicaciongraficoImagen: TBlobField;
    QuComunicacionreceptor: TStringField;
    QuComunicaciontipoDescripcion: TStringField;
    QuComunicacionfechahoraEmision: TDateTimeField;
    QuComunicacionfechahoraRecepcion: TDateTimeField;
    QuComunicacionidUsuarioReceptor: TLargeintField;
    QuComunicacionidUsuarioEmisor: TLargeintField;
    QuComunicacionidExterno: TLargeintField;
    QuComunicacionidTipoComunicacion: TLargeintField;
    QuComunicaciondatoscomunicacion: TMemoField;
    QuComunicaciongraficoDescripcion: TStringField;
  private
    { Private declarations }
  public
    { Public declarations }

  end;

var
  DModule_1: TDModule_1;

  { --------------- Definición de Variables Globales --------------- }
  UsuarioGiproy: TDatUsuario;
  GlobalAuthToken: string = '';
  codIDUSuario: integer;
  usuarioP: string;
  passwordP: string;
  rutaApp: string;
  fileini: string;
  connDBStr: string;
  Nombre_usuario: string;
  Apellidos_usuario: string;
  ID_usuario: string;
  codigo_usuario: integer;
  TUsuario: string;
  DecimalSeparator: AnsiChar;
  GradienteSeleccion: TGradient;
  GradienteBase1: TGradient;
  base_activa: baseDatos;
  filtradoOPC2Rec: array of Boolean;
  recurso_activo: string;
  categoria_recurso_activo: string;
  OpcionPrincipal: Integer;
  CategoriaAPUSeleccionada: string;
  codCategoriaAPUSeleccionada: string;
  ndecimalesPresupuesto: Integer;
  ndecimalesMoneda: Integer;
  ordenacionlistadoCategoiraApus: Integer;
  EntrarAPUfrm: Boolean;
  descripcionAPUAntigua: string;
  listadoCodigoPaises: TStringList;
  listadoPaises: TStringList;
  listadoMonedas: TStringList;
  posicionEcuador: Integer;
  espaciosFinales: string = '   ';
  Encoder: TIdEncoderMIME;
  Decoder: TIdDecoderMIME;
  nPresupuestoOpc: Integer;
  listado_PresupuestoStake: array of dat_StakesHolders;
  listado_tipoProyectos: array of dat_Tproyectos;
  historicoEDO: TStringList;
  historicoEDT: TStringList;
  posEDT: Integer;
  posEDO: Integer;
  copynode: TTMSFNCTreeViewNode;
  derivacionPresupuesto: TStringList;
  FGroupedPresupuesto: Boolean;
  ItemTanteo: dat_ItemPresupuesto;
  listadoIndirectos: array of dat_costoIndirectoPresupuesto;
  IndirectosPresupuesto: Double;
  listaPorcentajeUsado: array of dat_listaPorcentajeUsado;
  listadoNotas: array of dat_nota;
  visorEDTActivo: Boolean;
  modoCopiaPresupuesto: Integer;
  celdasCopiar: array of dat_grid;
  listadoCodigoUnicosEDT: TStringList;
  GridEnvio: Integer;
  cancelarDerivacion: string;
  MSProject: string;
  listadoRecursosPresupuesto: array of dat_recursosApu;
  listadoRecursosAsumidos: array of dat_RecursosAsumidos;
  autocalcularfechaspresupuesto: Boolean;
  guardando: Boolean;
  listadoItemsGridTiempo: TStringList;
  listadoIndiceFpol: array of dat_fploIndices;
  proyectoNuevo: Boolean;
  listadoApusEnGrid: array of dat_tmpAPU;
  listadoRecursosFP: array of dat_recursoFP;
  codCategoriaRecursos: Integer;
  listadoAPUImportar: array of dat_importAPU;
  listadoRecursosImportar: array of dat_importRecursos;
  listadoRecursosImportarAPU: array of dat_importRecursos;
  idFiscalEmpresaSeleccionada: string;
  CodUnicoEmpresaActiva: string;
  dirGeoreferencia: string;
  dirImagenReferencia: string;
  isOnline: Boolean;
  tantear: Boolean;
  codProyecto: string;
  revision: string;
  contieneTanteo: Boolean;
  FechaHoraInternet: TDateTime;
  listadoRecursosTanteoAnidado: array of dat_ItemsAPU;
  cadenaCurrency: string;
  cadenaDecimales: string;
  Clave_del_Cliente: string;
  Clave_Secreta_de_cliente: string;
  HardwareKey: string;
  codSalsaExt: string;
  nombreDB: string;
  UserDB: string;
  PasswordDB: string;
  archivoIni: string;
  puedeHacerMigracion: Boolean;
  puedeHacerBackUp: Boolean;
  GPubLista: TArray<uApiGiProy.TPublicidadItem>;
  GPubIndex: Integer = -1;


  { ------------------------ Procedimientos ------------------------ }

/// <summary>TODO: Descripción de connectaDBEmb.</summary>
procedure connectaDBEmb();

/// <summary>TODO: Descripción de limpiaOpc.</summary>
procedure limpiaOpc();

procedure limpia_trvw(trvw: TTMSFMXTreeView; idTRVW: Integer);

/// <summary>TODO: Descripción de limpiatrvwApus.</summary>
procedure limpiatrvwApus();

/// <summary>TODO: Descripción de limpiasub3db.</summary>
procedure limpiasub3db();

/// <summary>TODO: Descripción de limpiaOPC1.</summary>
procedure limpiaOPC1();

/// <summary>TODO: Descripción de limpiaOPC2.</summary>
procedure limpiaOPC2();

/// <summary>TODO: Descripción de limpiaGridRecursos.</summary>
procedure limpiaGridRecursos();

/// <summary>TODO: Descripción de limpia_trvwAPUS.</summary>
/// <param name="trvw">TODO.</param>
procedure limpia_trvwAPUS(trvw: TTMSFMXTreeView);

/// <summary>TODO: Descripción de Limpia_gridAPUSDisponibles.</summary>
procedure Limpia_gridAPUSDisponibles();

/// <summary>TODO: Descripción de limpia_APUSVisor.</summary>
procedure limpia_APUSVisor();

/// <summary>TODO: Descripción de limpiaNuevaCategoria.</summary>
procedure limpiaNuevaCategoria();

/// <summary>TODO: Descripción de limpiaNuevaAPUs.</summary>
procedure limpiaNuevaAPUs();

/// <summary>TODO: Descripción de RefreshCategorias.</summary>
procedure RefreshCategorias();

procedure GuardaNuevaBase;

procedure GuardaCategoria(datos: item_twvr; origen: string);

procedure addItemTrvw(trvw: TTMSFMXTreeView; node: TTMSFMXTreeViewNode; DatNodo: item_twvr);

/// <summary>TODO: Descripción de borraDBCategoria.</summary>
/// <param name="codItem">TODO.</param>
procedure borraDBCategoria(codItem: string);

/// <summary>TODO: Descripción de activaBaseDatos.</summary>
/// <param name="codBase">TODO.</param>
procedure activaBaseDatos(codBase: string);

/// <summary>TODO: Descripción de IniciaNuevoRecurso.</summary>
procedure IniciaNuevoRecurso();

/// <summary>TODO: Descripción de IniciaNuevoProyecto.</summary>
procedure IniciaNuevoProyecto();

procedure MuestraRecursosGrid(Categoria, subCategoria: string; modo: Integer);

procedure cargarEditCloneRecurso(cod_categoria, cod_subcategoria, cod_Recurso: string; modo: Integer);

/// <summary>TODO: Descripción de BorrarRecurso.</summary>
/// <param name="codCategoria">TODO.</param>
/// <param name="codSubCategoria">TODO.</param>
/// <param name="codRecurso">TODO.</param>
procedure BorrarRecurso(codCategoria, codSubCategoria, codRecurso: string);

/// <summary>TODO: Descripción de muestraOPC.</summary>
/// <param name="estado">TODO.</param>
procedure muestraOPC(estado: Boolean);

/// <summary>TODO: Descripción de rellenaAPUSCategoria.</summary>
/// <param name="tOrdenacion">TODO.</param>
procedure rellenaAPUSCategoria(tOrdenacion: Integer);

/// <summary>TODO: Descripción de grabaNuevaUnidadMedidaRecursos.</summary>
/// <param name="subCategoria">TODO.</param>
/// <param name="unidad">TODO.</param>
procedure grabaNuevaUnidadMedidaRecursos(subCategoria, unidad: string);

/// <summary>TODO: Descripción de hacerPregunta.</summary>
/// <param name="Pregunta">TODO.</param>
/// <param name="Encabezado">TODO.</param>
/// <param name="modo">TODO.</param>
/// <param name="adicional">TODO.</param>
procedure hacerPregunta(Pregunta, Encabezado, modo, adicional: string);

procedure pausaForm(formulario: Integer; estado: Boolean);

/// <summary>TODO: Descripción de refrescalistaAPUsDisponibles.</summary>
procedure refrescalistaAPUsDisponibles();

/// <summary>TODO: Descripción de rellenaAPUSVisor.</summary>
/// <param name="cod_completoAPU">TODO.</param>
procedure rellenaAPUSVisor(cod_completoAPU: string);

/// <summary>TODO: Descripción de EnviarAltTab.</summary>
procedure EnviarAltTab();

/// <summary>TODO: Descripción de VerRecursosCompleto.</summary>
/// <param name="codCategoria">TODO.</param>
procedure VerRecursosCompleto(codCategoria: string);

/// <summary>TODO: Descripción de refrescalistaAPUscompleta.</summary>
procedure refrescalistaAPUscompleta();

/// <summary>TODO: Descripción de renombraUnidad.</summary>
/// <param name="codCategoria">TODO.</param>
/// <param name="nombreanterior">TODO.</param>
/// <param name="nombreNuevo">TODO.</param>
procedure renombraUnidad(codCategoria, nombreanterior, nombreNuevo: string);

procedure posicionaCombo(cbb: TComboBox; itm: string) overload;

procedure SimKey(VK: BYTE; Down: Boolean);

/// <summary>TODO: Descripción de cargaAPUEdicion.</summary>
/// <param name="codApu">TODO.</param>
procedure cargaAPUEdicion(codApu: string);

/// <summary>TODO: Descripción de BorrarAPU.</summary>
/// <param name="codApu">TODO.</param>
procedure BorrarAPU(codApu: string);

/// <summary>TODO: Descripción de posicionaAPUSCategoria.</summary>
/// <param name="codCategoriaBaseEnvio">TODO.</param>
procedure posicionaAPUSCategoria(codCategoriaBaseEnvio: string);

/// <summary>TODO: Descripción de ActualizaDescripcionAPU.</summary>
/// <param name="codApu">TODO.</param>
/// <param name="DescripcionAPU">TODO.</param>
/// <param name="UnidadAPU">TODO.</param>
procedure ActualizaDescripcionAPU(codApu, DescripcionAPU, UnidadAPU: string);

/// <summary>TODO: Descripción de MueveRecurso.</summary>
/// <param name="codRecursoCompleto">TODO.</param>
/// <param name="codUnicoRecurso">TODO.</param>
/// <param name="nuevaPosicion">TODO.</param>
procedure MueveRecurso(codRecursoCompleto, codUnicoRecurso, nuevaPosicion: string);

/// <summary>TODO: Descripción de cuentaItemsAPUSRecursos.</summary>
procedure cuentaItemsAPUSRecursos();

/// <summary>TODO: Descripción de MuestraSubCategoriaItemsAPUSRecursos.</summary>
/// <param name="codCompletoItem">TODO.</param>
procedure MuestraSubCategoriaItemsAPUSRecursos(codCompletoItem: string);

/// <summary>TODO: Descripción de mueveAPUS.</summary>
/// <param name="codAPUSCompleto">TODO.</param>
/// <param name="categoriaDrop">TODO.</param>
/// <param name="codUnicoAPU">TODO.</param>
procedure mueveAPUS(codAPUSCompleto, categoriaDrop, codUnicoAPU: string);

/// <summary>TODO: Descripción de actualizaRecursoTotal.</summary>
/// <param name="idUnicoRecurso">TODO.</param>
/// <param name="Descripcion">TODO.</param>
/// <param name="Precio">TODO.</param>
procedure actualizaRecursoTotal(idUnicoRecurso, Descripcion, Precio: string);

/// <summary>TODO: Descripción de ActualizaBaseDatos.</summary>
procedure ActualizaBaseDatos();

/// <summary>TODO: Descripción de cargaDatosBase.</summary>
procedure cargaDatosBase();

/// <summary>TODO: Descripción de cargaComboPaises.</summary>
procedure cargaComboPaises();

/// <summary>TODO: Descripción de sincronizarCodigosCategorias.</summary>
/// <param name="codBase">TODO.</param>
procedure sincronizarCodigosCategorias(codBase: string);

/// <summary>TODO: Descripción de BorrarDB.</summary>
/// <param name="codBaseBorrar">TODO.</param>
procedure BorrarDB(codBaseBorrar: string);

/// <summary>TODO: Descripción de addlistadoStakeOtros.</summary>
/// <param name="idFiscalStake">TODO.</param>
procedure addlistadoStakeOtros(idFiscalStake: string);

/// <summary>TODO: Descripción de cargaTipoProyectoPresupuesto.</summary>
procedure cargaTipoProyectoPresupuesto();

/// <summary>TODO: Descripción de cargaCategoriaProyectos.</summary>
/// <param name="codigo">TODO.</param>
procedure cargaCategoriaProyectos(codigo: string);

/// <summary>TODO: Descripción de RellenaPertenencia.</summary>
/// <param name="idUnicoRecurso">TODO.</param>
procedure RellenaPertenencia(idUnicoRecurso: string);

/// <summary>TODO: Descripción de populaStakesDisponibles.</summary>
/// <param name="filtro">TODO.</param>
procedure populaStakesDisponibles(filtro: string);

/// <summary>TODO: Descripción de limpiaGridStakeAsignados.</summary>
procedure limpiaGridStakeAsignados();

/// <summary>TODO: Descripción de cargaStakeAsignados.</summary>
procedure cargaStakeAsignados();

/// <summary>TODO: Descripción de addStakeHolder.</summary>
/// <param name="codSTK">TODO.</param>
procedure addStakeHolder(codSTK: string);

/// <summary>TODO: Descripción de populaRolStake.</summary>
procedure populaRolStake();

/// <summary>TODO: Descripción de iniciaEDO.</summary>
procedure iniciaEDO();

/// <summary>TODO: Descripción de limpiaGridEDOStakes.</summary>
procedure limpiaGridEDOStakes();

procedure AsignaRolEdo(subnodo: TTMSFNCTreeViewNode; rolSinAsignar, AValue: string);

/// <summary>TODO: Descripción de sincronizarEDO.</summary>
procedure sincronizarEDO();

/// <summary>TODO: Descripción de iniciaEDT.</summary>
procedure iniciaEDT();

/// <summary>TODO: Descripción de generaCodEDT.</summary>
/// <param name="node">TODO.</param>
procedure generaCodEDT(node: TTMSFNCTreeViewNode);

/// <summary>TODO: Descripción de populaResponsableEDT.</summary>
procedure populaResponsableEDT();

/// <summary>TODO: Descripción de GuardarProyecto.</summary>
procedure GuardarProyecto();

procedure WriteStreamStr(Stream: TStream; Str: string);

procedure WriteStreamInt(Stream: TStream; Num: Integer);

/// <summary>TODO: Descripción de borrarPresupuesto.</summary>
/// <param name="codPresupuesto">TODO.</param>
procedure borrarPresupuesto(codPresupuesto: string);

/// <summary>TODO: Descripción de cargaValoresSeriePresupuesto.</summary>
procedure cargaValoresSeriePresupuesto();

/// <summary>TODO: Descripción de GuardaSeriesPresupuestos.</summary>
procedure GuardaSeriesPresupuestos();

/// <summary>TODO: Descripción de calculaPlazosCronograma.</summary>
procedure calculaPlazosCronograma();

/// <summary>TODO: Descripción de SincronizaCronogramas.</summary>
procedure SincronizaCronogramas();

/// <summary>TODO: Descripción de cronogramasSincronizaItemsPresupuesto.</summary>
procedure cronogramasSincronizaItemsPresupuesto();

/// <summary>TODO: Descripción de calcularCantidadesObras.</summary>
procedure calcularCantidadesObras();

/// <summary>TODO: Descripción de calcularInversion.</summary>
procedure calcularInversion();

/// <summary>TODO: Descripción de cargaCategoriasIndirectosPresupuestos.</summary>
procedure cargaCategoriasIndirectosPresupuestos();

/// <summary>TODO: Descripción de cargaConceptosIndirectosFijos.</summary>
procedure cargaConceptosIndirectosFijos();

/// <summary>TODO: Descripción de cargaConceptosIndirectos.</summary>
/// <param name="codPadre">TODO.</param>
procedure cargaConceptosIndirectos(codPadre: string);

/// <summary>TODO: Descripción de CargaProyectosDisponibles.</summary>
/// <param name="fechaInicio">TODO.</param>
/// <param name="FechaFinal">TODO.</param>
procedure CargaProyectosDisponibles(fechaInicio, FechaFinal: TdateTime);

/// <summary>TODO: Descripción de generaTablaEDTValores.</summary>
procedure generaTablaEDTValores();

procedure colorRow(Grid: TTMSFNCGrid; row: Integer; background: TAlphaColor; FontColor: TAlphaColor);

procedure StringGridDeleteRow(Grid: TStringGrid; ARow: Integer);

/// <summary>TODO: Descripción de limpiaStringGrid.</summary>
/// <param name="Grid">TODO.</param>
procedure limpiaStringGrid(Grid: TTMSFMXGrid);

/// <summary>TODO: Descripción de SendText.</summary>
/// <param name="Value">TODO.</param>
procedure SendText(const Value: WideString);

/// <summary>TODO: Descripción de SeleccionaTabCrono.</summary>
/// <param name="tabsel">TODO.</param>
procedure SeleccionaTabCrono(tabsel: Integer);

/// <summary>TODO: Descripción de limpiaStringGridCol.</summary>
/// <param name="Grid">TODO.</param>
procedure limpiaStringGridCol(Grid: TTMSFMXGrid);

/// <summary>TODO: Descripción de calcularPorCentajeEjecucionObras.</summary>
procedure calcularPorCentajeEjecucionObras();

/// <summary>TODO: Descripción de limpiagridCrono.</summary>
/// <param name="Grid">TODO.</param>
procedure limpiagridCrono(Grid: TTMSFNCGrid);

procedure showHeader(Grid: TTMSFNCGrid; nPeriodo: Integer);

/// <summary>TODO: Descripción de calculaTiempoAPUS.</summary>
procedure calculaTiempoAPUS();

procedure addheadercrono01;

/// <summary>TODO: Descripción de iniciaTablaMemoria.</summary>
procedure iniciaTablaMemoria();

procedure actualizaaRecursoAnidado(posgrid: Integer; codApu: string);

procedure ocultaColumnasGrids(Grid: TTMSFNCGrid; ColumnaInicial: Integer);

procedure ocultaColumnasGridsT2(Grid: TTMSFMXGrid; ColumnaInicial: Integer);

/// <summary>TODO: Descripción de ReservarCodPresupuesto.</summary>
procedure ReservarCodPresupuesto();

/// <summary>TODO: Descripción de cargaPaisesRegistro.</summary>
procedure cargaPaisesRegistro();

/// <summary>TODO: Descripción de registrarUsuario.</summary>
procedure registrarUsuario();

/// <summary>TODO: Descripción de realizarRegistro.</summary>
procedure realizarRegistro();

/// <summary>TODO: Descripción de OSExecute.</summary>
/// <param name="ACommand">TODO.</param>
procedure OSExecute(const ACommand: string);

/// <summary>TODO: Descripción de borrarAnotacion.</summary>
/// <param name="codItem">TODO.</param>
procedure borrarAnotacion(codItem: string);

/// <summary>TODO: Descripción de guardaGridTiempoTemporal.</summary>
procedure guardaGridTiempoTemporal();

/// <summary>TODO: Descripción de ParetoGeneralTiempo.</summary>
procedure ParetoGeneralTiempo();

/// <summary>TODO: Descripción de presupuestoCalculaTotalesCrono01.</summary>
procedure presupuestoCalculaTotalesCrono01();

/// <summary>TODO: Descripción de borrarCPC.</summary>
procedure borrarCPC();

/// <summary>TODO: Descripción de EditarCPC.</summary>
procedure EditarCPC();

/// <summary>TODO: Descripción de limpiaLista.</summary>
/// <param name="Lista">TODO.</param>
procedure limpiaLista(Lista: TListView);

/// <summary>TODO: Descripción de generaRecursosPresupuesto.</summary>
procedure generaRecursosPresupuesto();

/// <summary>TODO: Descripción de verRecursoDesagregacion.</summary>
/// <param name="codCategoria">TODO.</param>
procedure verRecursoDesagregacion(codCategoria: Integer);

/// <summary>TODO: Descripción de resalta_desgPanelCategoria.</summary>
/// <param name="Panel">TODO.</param>
procedure resalta_desgPanelCategoria(Panel: Integer);

/// <summary>TODO: Descripción de limpiaGridDesagregacion.</summary>
procedure limpiaGridDesagregacion();

/// <summary>TODO: Descripción de sincronizaDesagregacion.</summary>
procedure sincronizaDesagregacion();

/// <summary>TODO: Descripción de PresentarRecursosDesagregacion.</summary>
/// <param name="codAPUDes">TODO.</param>
/// <param name="PrecioUnitarioAPU">TODO.</param>
procedure PresentarRecursosDesagregacion(codAPUDes, PrecioUnitarioAPU: string);

/// <summary>TODO: Descripción de actualizaCodigoRecursosCompletos.</summary>
procedure actualizaCodigoRecursosCompletos();

/// <summary>TODO: Descripción de calculaTotalesRecursosDesagregacion.</summary>
procedure calculaTotalesRecursosDesagregacion();

/// <summary>TODO: Descripción de sincronizaFooterDesagregacion.</summary>
procedure sincronizaFooterDesagregacion();

/// <summary>TODO: Descripción de sincronizaDesagCPC.</summary>
procedure sincronizaDesagCPC();

/// <summary>TODO: Descripción de iniciaDBPresupuestosRecursos.</summary>
procedure iniciaDBPresupuestosRecursos();

/// <summary>TODO: Descripción de resalta_FpoliPanelCategoria.</summary>
/// <param name="Panel">TODO.</param>
procedure resalta_FpoliPanelCategoria(Panel: Integer);

/// <summary>TODO: Descripción de muestraRecursosFpolinomica.</summary>
/// <param name="categoria">TODO.</param>
procedure muestraRecursosFpolinomica(categoria: string);

/// <summary>TODO: Descripción de limpiaGridFpolinomica.</summary>
procedure limpiaGridFpolinomica();

/// <summary>TODO: Descripción de completagridGeneralFP.</summary>
procedure completagridGeneralFP();

/// <summary>TODO: Descripción de actualizaTablasIndices.</summary>
procedure actualizaTablasIndices();

/// <summary>TODO: Descripción de limpia_gridFpolIndices.</summary>
procedure limpia_gridFpolIndices();

/// <summary>TODO: Descripción de cargaOpcionesIndices.</summary>
procedure cargaOpcionesIndices();

procedure ajustaValorIndice(indice: string; valor: double);

/// <summary>TODO: Descripción de sincronizaIndices.</summary>
/// <param name="indice">TODO.</param>
/// <param name="codUnicoItem">TODO.</param>
procedure sincronizaIndices(indice, codUnicoItem: string);

/// <summary>TODO: Descripción de cargaTablaIndicesSeleccionados.</summary>
/// <param name="modo">TODO.</param>
procedure cargaTablaIndicesSeleccionados(modo: string);

/// <summary>TODO: Descripción de calculaValoresIndices.</summary>
/// <param name="ARow">TODO.</param>
procedure calculaValoresIndices(ARow: integer);

/// <summary>TODO: Descripción de totalizaValoresIndice.</summary>
procedure totalizaValoresIndice();

/// <summary>TODO: Descripción de limpiaBaseDatos.</summary>
procedure limpiaBaseDatos();

/// <summary>TODO: Descripción de addlog.</summary>
/// <param name="Texto">TODO.</param>
procedure addlog(Texto: string);

/// <summary>TODO: Descripción de limpiaDatosDerivacion.</summary>
procedure limpiaDatosDerivacion();

/// <summary>TODO: Descripción de borraDBDatosDervicacion.</summary>
procedure borraDBDatosDervicacion();

procedure adicionaSumaApusEnGrid(codUnicoAPU: string; cantidad: Double);

procedure DatosRecursosFpolinomica;

/// <summary>TODO: Descripción de sincronizaIndiceyCoeficientes.</summary>
procedure sincronizaIndiceyCoeficientes();

/// <summary>TODO: Descripción de actualizaIndiceEnTabla.</summary>
/// <param name="codUnicoIndice">TODO.</param>
/// <param name="IndiceS">TODO.</param>
procedure actualizaIndiceEnTabla(codUnicoIndice, IndiceS: string);

/// <summary>TODO: Descripción de estadoIndices.</summary>
procedure estadoIndices();

/// <summary>TODO: Descripción de actualizaComboIndices.</summary>
procedure actualizaComboIndices();

/// <summary>TODO: Descripción de guardaTablaIndicesCuadrilla.</summary>
procedure guardaTablaIndicesCuadrilla();

/// <summary>TODO: Descripción de cargarValoresCuadrillaTipo.</summary>
procedure cargarValoresCuadrillaTipo();

/// <summary>TODO: Descripción de activa_gridCuadrillaTipo.</summary>
procedure activa_gridCuadrillaTipo();

/// <summary>TODO: Descripción de ComprobarInconsistenciaCuadrillas.</summary>
procedure ComprobarInconsistenciaCuadrillas();

/// <summary>TODO: Descripción de calculaResumenFpol.</summary>
procedure calculaResumenFpol();

/// <summary>TODO: Descripción de calculaResumenFpolCuadrilla.</summary>
procedure calculaResumenFpolCuadrilla();

/// <summary>TODO: Descripción de AjustaCurvaS.</summary>
procedure AjustaCurvaS();

/// <summary>TODO: Descripción de CambiaEstadoBase.</summary>
/// <param name="estado">TODO.</param>
procedure CambiaEstadoBase(estado: Boolean);

procedure daCodApusActualizar(listadoAPU: TStringList; idUnicoRecurso: string);

/// <summary>TODO: Descripción de generaListadoRecursosImportar.</summary>
procedure generaListadoRecursosImportar();

procedure actualizaDatosRecurso(idUnicoRecurso: string; descripcion: string; unidad: string; precio: string);

/// <summary>TODO: Descripción de actualizarApusBase.</summary>
/// <param name="codAPU">TODO.</param>
procedure actualizarApusBase(codAPU: string);

procedure AjustaGridAutomatico(grid: TTMSFNCGrid; columnaPrincipal: Integer);

/// <summary>TODO: Descripción de CreaSubCategoriasIniciales.</summary>
/// <param name="CodBase">TODO.</param>
/// <param name="nombreBase">TODO.</param>
procedure CreaSubCategoriasIniciales(CodBase, nombreBase: string);

procedure ImportarActualizarRecursoAPUDBOrigen(dbOrigen: string; codApuOrigen: string; CodAPUDestino: string; codPresupuestoOrigen: string; revisionOrigen: string);

/// <summary>TODO: Descripción de ActualizacionApusImportar.</summary>
/// <param name="datosImportar">TODO.</param>
procedure ActualizacionApusImportar(datosImportar: dat_importAPU);

/// <summary>TODO: Descripción de CreaItemsApuImportar.</summary>
procedure CreaItemsApuImportar();

/// <summary>TODO: Descripción de PasarAPUaRecurso.</summary>
/// <param name="APUDestino">TODO.</param>
procedure PasarAPUaRecurso(APUDestino: dat_importAPU);

/// <summary>TODO: Descripción de adicionaEmpresa.</summary>
procedure adicionaEmpresa(IdFiscal, nombre, direccion, localidad, provincia, email, tfno, LogoEmpresa: string);

/// <summary>TODO: Descripción de modificaEmpresa.</summary>
procedure modificaEmpresa(IdFiscal, nombre, direccion, localidad, provincia, email, tfno, CodUnico, LogoEmpresa: string);

/// <summary>TODO: Descripción de populaGridEmpresas.</summary>
procedure populaGridEmpresas();

/// <summary>TODO: Descripción de backgroundEmpresa.</summary>
/// <param name="estado">TODO.</param>
procedure backgroundEmpresa(estado: Boolean);

/// <summary>TODO: Descripción de rellenaConfigEmpresa.</summary>
procedure rellenaConfigEmpresa();

/// <summary>TODO: Descripción de editarEmpresa.</summary>
procedure editarEmpresa();

/// <summary>TODO: Descripción de borraEmpresa.</summary>
/// <param name="CodUnico">TODO.</param>
procedure borraEmpresa(CodUnico: string);

procedure calculaPorcentajePrecio(trvw: TTMSFMXTreeView; posicionMuestra: integer; costoTotal: Double);

/// <summary>TODO: Descripción de cargarValoresInicialesTrvw.</summary>
/// <param name="Trvw">TODO.</param>
procedure cargarValoresInicialesTrvw(Trvw: TTMSFMXTreeView);

/// <summary>TODO: Descripción de cargarValoresInicialesTrvw2.</summary>
/// <param name="Trvw">TODO.</param>
procedure cargarValoresInicialesTrvw2(Trvw: TTMSFMXTreeView);

procedure ajustaGridTMSAutomatico(grid: TTMSFMXGrid; columnaPrincipal: integer);

procedure guardacofiguracionDatosLocalUsuario(email: string; fechaInicio, FechaFin: TDateTime);

/// <summary>TODO: Descripción de cargaImagenesProyecto.</summary>
procedure cargaImagenesProyecto();

/// <summary>TODO: Descripción de addImagenesReferencia.</summary>
procedure addImagenesReferencia();

/// <summary>TODO: Descripción de exportaImagenRevisiones.</summary>
/// <param name="codProyecto">TODO.</param>
/// <param name="revision">TODO.</param>
/// <param name="nuevarevision">TODO.</param>
procedure exportaImagenRevisiones(codProyecto, revision, nuevarevision: string);

procedure AjustaFloatGrid(grid: TTMSFNCGrid; Columna: Integer);

/// <summary>TODO: Descripción de sincronizaTamanoGrid.</summary>
/// <param name="gridMaster">TODO.</param>
/// <param name="gridHijo">TODO.</param>
procedure sincronizaTamanoGrid(gridMaster, gridHijo: TTMSFNCGrid);

/// <summary>TODO: Descripción de recalculaCronogramas.</summary>
procedure recalculaCronogramas();

/// <summary>TODO: Descripción de cierraGridTanteo.</summary>
procedure cierraGridTanteo();

/// <summary>TODO: Descripción de abreGridTanteo.</summary>
/// <param name="posgrid">TODO.</param>
procedure abreGridTanteo(posgrid: Integer);

/// <summary>TODO: Descripción de contieneTanteos.</summary>
procedure contieneTanteos();

/// <summary>TODO: Descripción de IniciaCombosConfiguracion.</summary>
procedure IniciaCombosConfiguracion();

procedure RecorrerDirectorios(sRuta: string; bIncluirSubdirectorios: Boolean; ResultadosDir: TStringList);

/// <summary>TODO: Descripción de actualizaEstadoDecimales.</summary>
procedure actualizaEstadoDecimales();

/// <summary>TODO: Descripción de cumplimentaComboConfiguracion.</summary>
/// <param name="comboCfg">TODO.</param>
procedure cumplimentaComboConfiguracion(comboCfg: TComboBox);

procedure ArchivosDirectorio(dir, mascara: string; var lista: TStringList; const soloNombres: boolean);

procedure restaurarApuTanteo(codAPU: string; modo: integer);

/// <summary>TODO: Descripción de guardarTanteo_recursosApuAnidado.</summary>
procedure guardarTanteo_recursosApuAnidado();

/// <summary>TODO: Descripción de actualizaLineaPresupuestoItemsDB.</summary>
/// <param name="codApu">TODO.</param>
procedure actualizaLineaPresupuestoItemsDB(codApu: string);

procedure LimpiaTanteoDB(codAPU: string; modo: Integer);

/// <summary>TODO: Descripción de LimpiaTanteoTodaDB.</summary>
procedure LimpiaTanteoTodaDB();

/// <summary>TODO: Descripción de LimpiaDBHuerfanas.</summary>
procedure LimpiaDBHuerfanas();

/// <summary>TODO: Descripción de crearCadenacurrency.</summary>
procedure crearCadenacurrency();

/// <summary>TODO: Descripción de iniciaTreeViewTanteo.</summary>
procedure iniciaTreeViewTanteo();

procedure cargaCabeceraTanteoAPUS(codAPU: string; modo: Integer);

/// <summary>TODO: Descripción de ActualizaSimboloMonedaenDB.</summary>
procedure ActualizaSimboloMonedaenDB();

/// <summary>TODO: Descripción de iniciaTanteoCrono.</summary>
procedure iniciaTanteoCrono();

/// <summary>TODO: Descripción de ejecutaCronoDerivaciones.</summary>
procedure ejecutaCronoDerivaciones();

/// <summary>TODO: Descripción de crearCadenaDecimales.</summary>
procedure crearCadenaDecimales();

procedure ajustaPorcentajeItems(totalTanteo: double; modo: integer);

/// <summary>TODO: Descripción de DaSeleccionRolesStake.</summary>
procedure DaSeleccionRolesStake();

/// <summary>TODO: Descripción de borraStakeHolder.</summary>
/// <param name="idStake">TODO.</param>
procedure borraStakeHolder(idStake: string);

/// <summary>TODO: Descripción de DaSeleccionRolesStake2.</summary>
procedure DaSeleccionRolesStake2();

/// <summary>TODO: Descripción de actualizaRolgridStake.</summary>
/// <param name="IdUnico">TODO.</param>
/// <param name="newRolStake">TODO.</param>
procedure actualizaRolgridStake(IdUnico, newRolStake: string);

procedure addHito(NodoBase: TTMSFNCTreeViewNode; nombreHito: string);

/// <summary>TODO: Descripción de treeviewDesagregacionManualSize.</summary>
procedure treeviewDesagregacionManualSize();

/// <summary>TODO: Descripción de muestraRecursosDesagregacion.</summary>
/// <param name="codigo">TODO.</param>
procedure muestraRecursosDesagregacion(codigo: Integer);

/// <summary>TODO: Descripción de AbrirImagenConVisor.</summary>
procedure AbrirImagenConVisor();

/// <summary>TODO: Descripción de borrarImagenReferencial.</summary>
procedure borrarImagenReferencial();

procedure RegistraLogUsuario(const tIDUsuario, tipoEntrada: Integer; out tmpstr: string);

/// <summary>TODO: Descripción de guardarConfiguracionReportes.</summary>
procedure guardarConfiguracionReportes();

/// <summary>TODO: Descripción de cargarConfiguracionReportes.</summary>
procedure cargarConfiguracionReportes();

/// <summary>TODO: Descripción de borraConfiguracionReportes.</summary>
procedure borraConfiguracionReportes();

/// <summary>TODO: Descripción de guardaConfiguracionDecimales.</summary>
procedure guardaConfiguracionDecimales();

/// <summary>TODO: Descripción de Actualiza_UsuariosColaborador.</summary>
procedure Actualiza_UsuariosColaborador();

/// <summary>TODO: Descripción de WipeFile.</summary>
/// <param name="FileName">TODO.</param>
procedure WipeFile(FileName: string);

procedure CrearUsuarioWordPressAsync(const AToken, AUser, APass, AEmail, role: string; Callback: TCrearUsuarioCallback);

/// <summary>TODO: Descripción de PreparaBaseInicio.</summary>
/// <param name="archivoBase">TODO.</param>
procedure PreparaBaseInicio(archivoBase: string);

/// <summary>TODO: Descripción de GuardaFechaHoraEntrada.</summary>
procedure GuardaFechaHoraEntrada();

/// <summary>TODO: Descripción de MuestraMensajeGiproy.</summary>
/// <param name="Texto">TODO.</param>
procedure MuestraMensajeGiproy(Texto: string);

/// <summary>TODO: Descripción de AjustarEstadosBackUp_Mudanza.</summary>
procedure AjustarEstadosBackUp_Mudanza();

/// <summary>TODO: Descripción de activaLoopPublicidad.</summary>
procedure activaLoopPublicidad();

procedure EliminarUsuarioWordPressAsync(const AToken, AEmail: string; const Callback: TProc<Boolean, string>);

/// Abrir navegador predeterminado en la url definida.
procedure AbrirEnlace(const AUrl: string);

procedure CargarTiendaOnline;

{ ----------------------------------------------------------- }
{ ------------------------ Funciones ------------------------ }
{ ----------------------------------------------------------- }

function CheckInternet: boolean;

/// <summary>TODO: Descripción de compruebaUsuario.</summary>
/// <param name="User">TODO.</param>
/// <param name="password">TODO.</param>
/// <returns>TODO.</returns>
function compruebaUsuario(User, password: string): Boolean;

function addNodeEDT(node: TTMSFNCTreeViewNode; Texto: string): TTMSFNCTreeViewNode;

/// <summary>TODO: Descripción de categoriaExistente.</summary>
/// <param name="codCategoria">TODO.</param>
/// <param name="Descripcion">TODO.</param>
/// <returns>TODO.</returns>
function categoriaExistente(codCategoria, Descripcion: string): Boolean;

/// <summary>TODO: Descripción de Capitalize.</summary>
/// <param name="Str">TODO.</param>
/// <returns>TODO.</returns>
function Capitalize(Str: string): string;

/// <summary>TODO: Descripción de generaCodigoUnico.</summary>
/// <returns>TODO.</returns>
function generaCodigoUnico(): string;

/// <summary>TODO: Descripción de generaCodigoUnicoShort.</summary>
/// <returns>TODO.</returns>
function generaCodigoUnicoShort(): string;

/// <summary>TODO: Descripción de quitaHTML.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function quitaHTML(datos: string): string;

/// <summary>TODO: Descripción de decimal_correcto.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function decimal_correcto(datos: string): string;

/// <summary>TODO: Descripción de daCodigoCategoriaRecursos.</summary>
/// <returns>TODO.</returns>
function daCodigoCategoriaRecursos(): string;

/// <summary>TODO: Descripción de daCodigoSubCategoriaRecursos.</summary>
/// <param name="codCategoriaRecursos">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoSubCategoriaRecursos(codCategoriaRecursos: string): string;

/// <summary>TODO: Descripción de generaCodigoRecurso.</summary>
/// <param name="codCategoriaBase">TODO.</param>
/// <param name="codSubCategoria">TODO.</param>
/// <param name="codRecurso">TODO.</param>
/// <returns>TODO.</returns>
function generaCodigoRecurso(codCategoriaBase, codSubCategoria, codRecurso: string): string;

/// <summary>TODO: Descripción de daCodigoAPUSCategoriaRecurso.</summary>
/// <param name="codCompleto">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoAPUSCategoriaRecurso(codCompleto: string): string;

/// <summary>TODO: Descripción de daCodigoAPUSSubCategoriaRecurso.</summary>
/// <param name="codCompleto">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoAPUSSubCategoriaRecurso(codCompleto: string): string;

/// <summary>TODO: Descripción de daCodigoAPUSRecurso.</summary>
/// <param name="codCompleto">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoAPUSRecurso(codCompleto: string): string;

function PasarCadenaNDecimalesquitar(datos: string; nDecimales: Integer): string;

function daDatoCodigo(codigo: string; modo: Integer): string;

function ponerCerosInicio(datos: string; ceros: Integer): string;

/// <summary>TODO: Descripción de daCodigoParcialRecurso.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoParcialRecurso(datos: string): string;

function interpretaCodigoRecurso(codRecurso: string; posicion: Integer): string;

function GeneraCodUnicoAPU: string;

/// <summary>TODO: Descripción de duplicarAPU.</summary>
/// <param name="codApu">TODO.</param>
/// <param name="descripcionNueva">TODO.</param>
/// <returns>TODO.</returns>
function duplicarAPU(codApu, descripcionNueva: string): string;

/// <summary>TODO: Descripción de daNuevoNombreAPU.</summary>
/// <param name="nombreBase">TODO.</param>
/// <returns>TODO.</returns>
function daNuevoNombreAPU(nombreBase: string): string;

function NcaracteresDelante(datos: string; ncaracteres: Integer): string;

/// <summary>TODO: Descripción de nuevoCodigoRecurso.</summary>
/// <param name="Categoria">TODO.</param>
/// <param name="subCategoria">TODO.</param>
/// <returns>TODO.</returns>
function nuevoCodigoRecurso(Categoria, subCategoria: string): string;

function posicionLista(lst: TStringList; cadena: string): Integer;

/// <summary>TODO: Descripción de daDatosMonedaPais.</summary>
/// <param name="codPais">TODO.</param>
/// <returns>TODO.</returns>
function daDatosMonedaPais(codPais: string): string;

function redondeaquitar(cantidad: Double; redondeo: Integer): Double;

function existeCadena(Lista: TStringList; cadena: string): Boolean;

/// <summary>TODO: Descripción de trimExp.</summary>
/// <param name="cadena">TODO.</param>
/// <returns>TODO.</returns>
function trimExp(cadena: string): string;

function posicionaNodo(trvw: TTMSFNCTreeView; Texto: string; columna: Integer; aCase: Boolean): TTMSFNCTreeViewNode;

/// <summary>TODO: Descripción de BitmapToString.</summary>
/// <param name="img">TODO.</param>
/// <returns>TODO.</returns>
function BitmapToString(img: Tbitmap): string;

/// <summary>TODO: Descripción de StringToBitmap.</summary>
/// <param name="imgStr">TODO.</param>
/// <returns>TODO.</returns>
function StringToBitmap(imgStr: string): Tbitmap;

/// <summary>TODO: Descripción de ReadStreamStr.</summary>
/// <param name="Stream">TODO.</param>
/// <returns>TODO.</returns>
function ReadStreamStr(Stream: TStream): string;

/// <summary>TODO: Descripción de ReadStreamInt.</summary>
/// <param name="Stream">TODO.</param>
/// <returns>TODO.</returns>
function ReadStreamInt(Stream: TStream): Integer;

/// <summary>TODO: Descripción de generaCodigoPresupuesto.</summary>
/// <returns>TODO.</returns>
function generaCodigoPresupuesto(): string;

function existeNodo(trvw: TTMSFNCTreeView; textoBuscar: string): Boolean;

function posicionaNodoDesc(trvw: TTMSFNCTreeView; Texto: string; columna: Integer; aCase: Boolean): TTMSFNCTreeViewNode;

/// <summary>TODO: Descripción de creaSangria.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function creaSangria(datos: string): string;

/// <summary>TODO: Descripción de pasaFormatoCompleto.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function pasaFormatoCompleto(datos: Double): string;

/// <summary>TODO: Descripción de quitaSignoMiles.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function quitaSignoMiles(datos: string): string;

/// <summary>TODO: Descripción de codigoUnicoItemPresupuesto.</summary>
/// <returns>TODO.</returns>
function codigoUnicoItemPresupuesto(): string;

/// <summary>TODO: Descripción de daPaqueteItem.</summary>
/// <param name="posgrid">TODO.</param>
/// <returns>TODO.</returns>
function daPaqueteItem(posgrid: Integer): string;

/// <summary>TODO: Descripción de daCodEDT.</summary>
/// <param name="posgrid">TODO.</param>
/// <returns>TODO.</returns>
function daCodEDT(posgrid: Integer): string;

function cuentaCaracteres(cadena: string; caracter: string): Integer;

/// <summary>TODO: Descripción de getLastMemoLineNumber.</summary>
/// <param name="Memo">TODO.</param>
/// <returns>TODO.</returns>
function getLastMemoLineNumber(const Memo: TMemo): Integer;

/// <summary>TODO: Descripción de dasumaValoresEDT.</summary>
/// <param name="EDTFiltro">TODO.</param>
/// <returns>TODO.</returns>
function dasumaValoresEDT(EDTFiltro: string): Double;

function searchGrid(Grid: TTMSFNCGrid; columna: Integer; datosBusqueda: string): Integer;

function encuentraItemGrid(Grid: TTMSFNCGrid; columna: Integer; textoBuscar: string; CaseSensitive: Boolean): Integer;

function encuentraItemenCuenta(Grid: TTMSFNCGrid; filaRef: Integer; columna: Integer; textoBuscar: string; CaseSensitive: Boolean): Integer;

/// <summary>TODO: Descripción de cuentaItemsRealesGrid.</summary>
/// <returns>TODO.</returns>
function cuentaItemsRealesGrid(): Integer;

/// <summary>TODO: Descripción de generalistadoEDTCapitulos.</summary>
/// <returns>TODO.</returns>
function generalistadoEDTCapitulos(): TStringList;

function posicionPrimerItem(Grid: TTMSFNCGrid; codItem: string): Integer;

/// <summary>TODO: Descripción de quitaHtmlNegritas.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function quitaHtmlNegritas(datos: string): string;

/// <summary>TODO: Descripción de diasLaborables.</summary>
/// <param name="diaInicio">TODO.</param>
/// <param name="diaFin">TODO.</param>
/// <returns>TODO.</returns>
function diasLaborables(diaInicio, diaFin: TDateTime): Integer;

/// <summary>TODO: Descripción de daRendimiento.</summary>
/// <param name="codApu">TODO.</param>
/// <param name="codCategoria">TODO.</param>
/// <returns>TODO.</returns>
function daRendimiento(codApu, codCategoria: string): Double;

/// <summary>TODO: Descripción de daTrabajo.</summary>
/// <param name="codApu">TODO.</param>
/// <param name="codCategoria">TODO.</param>
/// <returns>TODO.</returns>
function daTrabajo(codApu, codCategoria: string): Double;

function daPorcentajeTiempo(codApu: string; duracionActividad: Double): Double;

/// <summary>TODO: Descripción de creaDataBaseDesdePadre.</summary>
/// <param name="BasePadre">TODO.</param>
/// <returns>TODO.</returns>
function creaDataBaseDesdePadre(BasePadre: string): string;

/// <summary>TODO: Descripción de validar_correo_electronico.</summary>
/// <param name="correo_electronico">TODO.</param>
/// <returns>TODO.</returns>
function validar_correo_electronico(correo_electronico: string): Boolean;

/// <summary>TODO: Descripción de IsAlphaNumeric.</summary>
/// <param name="C">TODO.</param>
/// <returns>TODO.</returns>
function IsAlphaNumeric(C: Char): Boolean;

/// <summary>TODO: Descripción de cuentaItemsRealesGridTiempo.</summary>
/// <returns>TODO.</returns>
function cuentaItemsRealesGridTiempo(): Integer;

/// <summary>TODO: Descripción de da20ParetoTiempo.</summary>
/// <param name="codCapitulo">TODO.</param>
/// <returns>TODO.</returns>
function da20ParetoTiempo(codCapitulo: string): Integer;

function ItemEnLista(AItem: string; Lista: TStringList): Boolean;

/// <summary>TODO: Descripción de generaDesagregacionAPUS.</summary>
/// <param name="codAPUSDes">TODO.</param>
/// <returns>TODO.</returns>
function generaDesagregacionAPUS(codAPUSDes: string): Double;

function calcularTotalRecursoDesagregacion(cantidad, Precio, Rendimiento: string; categoriaBase: Integer): string;

/// <summary>TODO: Descripción de IsConnected.</summary>
/// <returns>TODO.</returns>
function IsConnected(): Integer;

/// <summary>TODO: Descripción de buscacodigoIndiceFpol.</summary>
/// <param name="descripcion">TODO.</param>
/// <returns>TODO.</returns>
function buscacodigoIndiceFpol(descripcion: string): string;

/// <summary>TODO: Descripción de Guardar_DatosGenerales.</summary>
/// <param name="fechaCreacion">TODO.</param>
/// <returns>TODO.</returns>
function Guardar_DatosGenerales(fechaCreacion: TdateTime): Boolean;

/// <summary>TODO: Descripción de Guardar_DatosProyecto.</summary>
/// <param name="fechaCreacion">TODO.</param>
/// <returns>TODO.</returns>
function Guardar_DatosProyecto(fechaCreacion: TdateTime): boolean;

/// <summary>TODO: Descripción de Guardar_StakeHolders.</summary>
/// <returns>TODO.</returns>
function Guardar_StakeHolders(): Boolean;

/// <summary>TODO: Descripción de Guardar_EDO.</summary>
/// <returns>TODO.</returns>
function Guardar_EDO(): Boolean;

/// <summary>TODO: Descripción de Guardar_EDT.</summary>
/// <returns>TODO.</returns>
function Guardar_EDT(): Boolean;

/// <summary>TODO: Descripción de Guardar_Indirectos.</summary>
/// <returns>TODO.</returns>
function Guardar_Indirectos(): Boolean;

/// <summary>TODO: Descripción de guardar_ItemsPresupuesto.</summary>
/// <returns>TODO.</returns>
function guardar_ItemsPresupuesto(): Boolean;

/// <summary>TODO: Descripción de guardar_Anotaciones.</summary>
/// <returns>TODO.</returns>
function guardar_Anotaciones(): Boolean;

/// <summary>TODO: Descripción de borrado_tablasProyecto.</summary>
/// <returns>TODO.</returns>
function borrado_tablasProyecto(): boolean;

/// <summary>TODO: Descripción de ProyectocumpleRequisitosMinimos.</summary>
/// <returns>TODO.</returns>
function ProyectocumpleRequisitosMinimos(): Boolean;

/// <summary>TODO: Descripción de proyectoGuardado.</summary>
/// <returns>TODO.</returns>
function proyectoGuardado(): Boolean;

/// <summary>TODO: Descripción de compruebaCodigoProyectoRevisado.</summary>
/// <returns>TODO.</returns>
function compruebaCodigoProyectoRevisado(): string;

/// <summary>TODO: Descripción de cargar_DatosProyecto.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargar_DatosProyecto(codBase: string): Boolean;

/// <summary>TODO: Descripción de cargar_StakeHolders.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargar_StakeHolders(codBase: string): Boolean;

/// <summary>TODO: Descripción de asignarDBProyecto.</summary>
/// <param name="codProyecto">TODO.</param>
/// <param name="codbase">TODO.</param>
/// <returns>TODO.</returns>
function asignarDBProyecto(codProyecto, codbase: string): Boolean;

/// <summary>TODO: Descripción de compruebaEleccionBase.</summary>
/// <returns>TODO.</returns>
function compruebaEleccionBase(): Boolean;

/// <summary>TODO: Descripción de cargar_EDO.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargar_EDO(codBase: string): Boolean;

/// <summary>TODO: Descripción de cargar_EDT.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargar_EDT(codBase: string): Boolean;

/// <summary>TODO: Descripción de activa_DatosGeneralesProyecto.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function activa_DatosGeneralesProyecto(codBase: string): Boolean;

/// <summary>TODO: Descripción de cargar_indirectos.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargar_indirectos(codBase: string): Boolean;

/// <summary>TODO: Descripción de cargar_Items.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargar_Items(codBase: string): Boolean;

/// <summary>TODO: Descripción de cargarAnotaciones.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargarAnotaciones(codBase: string): Boolean;

/// <summary>TODO: Descripción de CargaProyecto.</summary>
/// <param name="CodBase">TODO.</param>
/// <returns>TODO.</returns>
function CargaProyecto(CodBase: string): string;

/// <summary>TODO: Descripción de guardaTablaIndicesSeleccionados.</summary>
/// <returns>TODO.</returns>
function guardaTablaIndicesSeleccionados(): Boolean;

/// <summary>TODO: Descripción de guardarDatosDerivacion.</summary>
/// <returns>TODO.</returns>
function guardarDatosDerivacion(): Boolean;

/// <summary>TODO: Descripción de cargarDatosDerivacion.</summary>
/// <returns>TODO.</returns>
function cargarDatosDerivacion(): Boolean;

/// <summary>TODO: Descripción de daNombreSubcategoriaFpol.</summary>
/// <param name="codCategoria">TODO.</param>
/// <param name="codSubCategoria">TODO.</param>
/// <returns>TODO.</returns>
function daNombreSubcategoriaFpol(codCategoria, codSubCategoria: string): string;
  /// <summary>TODO: Descripción de daValorUltCategoria.</summary>
/// <param name="categoriaBase">TODO.</param>
/// <returns>TODO.</returns>

function daValorUltCategoria(categoriaBase: string): integer;

/// <summary>TODO: Descripción de daDescripcionSubCategoria.</summary>
/// <param name="codBaseBusqueda">TODO.</param>
/// <param name="codCategoria">TODO.</param>
/// <param name="codSubCategoria">TODO.</param>
/// <returns>TODO.</returns>
function daDescripcionSubCategoria(codBaseBusqueda, codCategoria, codSubCategoria: string): string;

/// <summary>TODO: Descripción de existeSubCategoria.</summary>
/// <param name="codBaseBusqueda">TODO.</param>
/// <param name="codCategoria">TODO.</param>
/// <param name="descripcionBusqueda">TODO.</param>
/// <returns>TODO.</returns>
function existeSubCategoria(codBaseBusqueda, codCategoria, descripcionBusqueda: string): string;

/// <summary>TODO: Descripción de generaSiNoExisteCategoriaVarios.</summary>
/// <param name="codCategoria">TODO.</param>
/// <returns>TODO.</returns>
function generaSiNoExisteCategoriaVarios(codCategoria: string): string;

/// <summary>TODO: Descripción de daCodigoRecursoDestinoImportar.</summary>
/// <param name="codCategoria">TODO.</param>
/// <param name="codSubCategoria">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoRecursoDestinoImportar(codCategoria, codSubCategoria: string): string;

/// <summary>TODO: Descripción de CrearApuNuevoImportar.</summary>
/// <param name="codBaseOrigen">TODO.</param>
/// <param name="codApuOrigen">TODO.</param>
/// <returns>TODO.</returns>
function CrearApuNuevoImportar(codBaseOrigen, codApuOrigen: string): string;

/// <summary>TODO: Descripción de contarCaracteresenCadena.</summary>
/// <param name="cadena">TODO.</param>
/// <param name="caracter">TODO.</param>
/// <returns>TODO.</returns>
function contarCaracteresenCadena(cadena, caracter: string): integer;

/// <summary>TODO: Descripción de QuitarEspeciales.</summary>
/// <param name="Cad">TODO.</param>
/// <returns>TODO.</returns>
function QuitarEspeciales(const Cad: string): string;

/// <summary>TODO: Descripción de crearAccionImportacion.</summary>
/// <param name="datosImportar">TODO.</param>
/// <returns>TODO.</returns>
function crearAccionImportacion(datosImportar: dat_importAPU): string;

/// <summary>TODO: Descripción de crearApuImportar.</summary>
/// <param name="APUImportar">TODO.</param>
/// <returns>TODO.</returns>
function crearApuImportar(APUImportar: dat_importAPU): string;

/// <summary>TODO: Descripción de actualizarDatosAPUImportar.</summary>
/// <param name="APUImportar">TODO.</param>
/// <returns>TODO.</returns>
function actualizarDatosAPUImportar(APUImportar: dat_importAPU): dat_importAPU;

/// <summary>TODO: Descripción de daCodigoCategoriaGeneral.</summary>
/// <param name="codCategoriaBase">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoCategoriaGeneral(codCategoriaBase: string): dat_respuesta1;

/// <summary>TODO: Descripción de ImportacionApusNuevo.</summary>
/// <param name="datosImportar">TODO.</param>
/// <returns>TODO.</returns>
function ImportacionApusNuevo(datosImportar: dat_importAPU): dat_importAPU;

/// <summary>TODO: Descripción de ExisteEmpresa.</summary>
/// <param name="CodUnico">TODO.</param>
/// <returns>TODO.</returns>
function ExisteEmpresa(CodUnico: string): Boolean;

/// <summary>TODO: Descripción de generaCodigoUnicoConfig.</summary>
/// <returns>TODO.</returns>
function generaCodigoUnicoConfig(): string;

/// <summary>TODO: Descripción de calculaIndirectos.</summary>
/// <param name="costoDirecto">TODO.</param>
/// <returns>TODO.</returns>
function calculaIndirectos(costoDirecto: double): Double;

/// <summary>TODO: Descripción de danombrePlantilla.</summary>
/// <param name="nombrePlantilla">TODO.</param>
/// <returns>TODO.</returns>
function danombrePlantilla(nombrePlantilla: string): string;

/// <summary>TODO: Descripción de BorrarCarpeta.</summary>
/// <param name="vOrigen">TODO.</param>
/// <returns>TODO.</returns>
function BorrarCarpeta(const vOrigen: string): boolean;

function calculaPorcentajeIvaPrecios(total: Double; cantidadIva: double): Double;
  /// <summary>TODO: Descripción de daNombreMoneda.</summary>
/// <param name="moneda">TODO.</param>
/// <returns>TODO.</returns>

function daNombreMoneda(moneda: string): string;

/// <summary>TODO: Descripción de guardarcomoRevision.</summary>
/// <param name="codBase">TODO.</param>
/// <param name="revisionOrigen">TODO.</param>
/// <returns>TODO.</returns>
function guardarcomoRevision(codBase, revisionOrigen: string): string;

/// <summary>TODO: Descripción de existeRevisionCero.</summary>
/// <returns>TODO.</returns>
function existeRevisionCero(): Boolean;

/// <summary>TODO: Descripción de compruebaUSuarioOffline.</summary>
/// <param name="uSer">TODO.</param>
/// <param name="password">TODO.</param>
/// <returns>TODO.</returns>
function compruebaUSuarioOffline(uSer, password: string): Boolean;

/// <summary>TODO: Descripción de ImportarPlantillaProjectExcel.</summary>
/// <param name="archivoExcel">TODO.</param>
/// <returns>TODO.</returns>
function ImportarPlantillaProjectExcel(archivoExcel: string): string;

/// <summary>TODO: Descripción de daSQLQueryText.</summary>
/// <param name="Nconsulta">TODO.</param>
/// <returns>TODO.</returns>
function daSQLQueryText(Nconsulta: Integer): string;

/// <summary>TODO: Descripción de listaRevisionesBase.</summary>
/// <param name="codBaseTratar">TODO.</param>
/// <param name="codPresupuesto">TODO.</param>
/// <returns>TODO.</returns>
function listaRevisionesBase(codBaseTratar, codPresupuesto: string): tstringlist;
  /// <summary>TODO: Descripción de daCodProyectoDescripcionDB.</summary>
/// <param name="descripcion">TODO.</param>
/// <returns>TODO.</returns>

function daCodProyectoDescripcionDB(descripcion: string): string;

/// <summary>TODO: Descripción de daPorcentajeAsignadoRevision.</summary>
/// <returns>TODO.</returns>
function daPorcentajeAsignadoRevision(): Double;

function posicionaEnGrid(grid: TTMSFNCGrid; columna: integer; itm: string): Integer;

/// <summary>TODO: Descripción de deltree.</summary>
/// <param name="FileName">TODO.</param>
/// <returns>TODO.</returns>
function deltree(const FileName: string): Boolean;

/// <summary>TODO: Descripción de IsRunnig.</summary>
/// <param name="FicheroExe">TODO.</param>
/// <returns>TODO.</returns>
function IsRunnig(FicheroExe: string): boolean;

/// <summary>TODO: Descripción de daNHcuardillas.</summary>
/// <param name="codAPU">TODO.</param>
/// <returns>TODO.</returns>
function daNHcuardillas(codAPU: string): Integer;

/// <summary>TODO: Descripción de darendimientoHUnidad.</summary>
/// <param name="codAPU">TODO.</param>
/// <returns>TODO.</returns>
function darendimientoHUnidad(codAPU: string): Double;

/// <summary>TODO: Descripción de CuentaRevisiones.</summary>
/// <returns>TODO.</returns>
function CuentaRevisiones(): Integer;

/// <summary>TODO: Descripción de nApusAnidados.</summary>
/// <param name="codAPU">TODO.</param>
/// <param name="codAPUanidado">TODO.</param>
/// <returns>TODO.</returns>
function nApusAnidados(codAPU, codAPUanidado: string): integer;

function RecalculaApuAnidado(nuevoPrecioAnidado, codApuAnidado, codAPU: string; guardar: Boolean): Double;

/// <summary>TODO: Descripción de Porcentaje.</summary>
/// <param name="Valor">TODO.</param>
/// <param name="porcentaje">TODO.</param>
/// <returns>TODO.</returns>
function Porcentaje(Valor, porcentaje: Double): double;

/// <summary>TODO: Descripción de quitaSimboloMoneda.</summary>
/// <param name="Datos">TODO.</param>
/// <returns>TODO.</returns>
function quitaSimboloMoneda(Datos: string): string;

/// <summary>TODO: Descripción de generaCodigoPresupuestoNuevo.</summary>
/// <returns>TODO.</returns>
function generaCodigoPresupuestoNuevo(): string;

/// <summary>TODO: Descripción de quitaFormatFloat.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function quitaFormatFloat(datos: string): double;

function IsControlKeyPressed: Boolean;

function IsShiftKeyPressed: Boolean;

/// <summary>TODO: Descripción de faltaDatosDerivacion.</summary>
/// <returns>TODO.</returns>
function faltaDatosDerivacion(): integer;

/// <summary>TODO: Descripción de cantidadCronoDerivaciones.</summary>
/// <returns>TODO.</returns>
function cantidadCronoDerivaciones(): integer;

function forzarNdecimales(Valor: double; nDecimales: integer): string;

/// <summary>TODO: Descripción de compruebaTodoCPC.</summary>
/// <returns>TODO.</returns>
function compruebaTodoCPC(): boolean;

/// <summary>TODO: Descripción de compruebatodoFpolinomica.</summary>
/// <returns>TODO.</returns>
function compruebatodoFpolinomica(): Boolean;

function ForzarCadenaNDecimales(datos: string; nDecimales: integer): string;

/// <summary>TODO: Descripción de cargarTablaIndicesFPolinomica.</summary>
/// <returns>TODO.</returns>
function cargarTablaIndicesFPolinomica(): Boolean;

/// <summary>TODO: Descripción de compruebaCodigoIndiceRepetido.</summary>
/// <param name="codigoIndice">TODO.</param>
/// <returns>TODO.</returns>
function compruebaCodigoIndiceRepetido(codigoIndice: string): Boolean;

/// <summary>TODO: Descripción de daValorParametro.</summary>
/// <param name="idParametro">TODO.</param>
/// <returns>TODO.</returns>
function daValorParametro(idParametro: integer): string;

/// <summary>TODO: Descripción de compruebaModeloNegocio.</summary>
/// <param name="Modulo">TODO.</param>
/// <returns>TODO.</returns>
function compruebaModeloNegocio(Modulo: integer): boolean;

/// <summary>TODO: Descripción de daCantidadReportesRestantes.</summary>
/// <param name="idComplemento">TODO.</param>
/// <returns>TODO.</returns>
function daCantidadReportesRestantes(idComplemento: Integer): integer;

function ejecutaExportacionReporte(idComplemento: integer; triggerOperacion: string): string;

/// <summary>TODO: Descripción de enviar_invitacion_unirse_giproy.</summary>
/// <param name="email">TODO.</param>
/// <returns>TODO.</returns>
function enviar_invitacion_unirse_giproy(email: string): string;

/// <summary>TODO: Descripción de CuentaUsuariosColaboradores.</summary>
/// <returns>TODO.</returns>
function CuentaUsuariosColaboradores(): integer;

/// <summary>TODO: Descripción de comprobarModuloActivo.</summary>
/// <param name="idComplemento">TODO.</param>
/// <returns>TODO.</returns>
function comprobarModuloActivo(idComplemento: Integer): boolean;

function DarkenColor(const AColor: TAlphaColor; Factor: Single): TAlphaColor;

/// <summary>TODO: Descripción de ActivarLicenciaProducto.</summary>
/// <param name="LicenciaProducto">TODO.</param>
/// <returns>TODO.</returns>
function ActivarLicenciaProducto(LicenciaProducto: string): string;

/// <summary>TODO: Descripción de PrettyJSON.</summary>
/// <param name="JSONStr">TODO.</param>
/// <returns>TODO.</returns>
function PrettyJSON(const JSONStr: string): string;

/// <summary>TODO: Descripción de DescargaFTP.</summary>
/// <param name="nombreArchivo">TODO.</param>
/// <returns>TODO.</returns>
function DescargaFTP(nombreArchivo: string): string;

function DesencriptaFile(FInicio: string; keysalsa: string): string;

function importarDBG(ficheroImp: string; keysalsa: string): string;

/// <summary>TODO: Descripción de Borrarftp.</summary>
/// <param name="nombreArchivo">TODO.</param>
/// <returns>TODO.</returns>
function Borrarftp(nombreArchivo: string): string;

/// <summary>TODO: Descripción de RestaurarMudanzaSistema.</summary>
/// <returns>TODO.</returns>
function RestaurarMudanzaSistema(): boolean;

/// <summary>TODO: Descripción de RestaurarBackup.</summary>
/// <returns>TODO.</returns>
function RestaurarBackup(): Boolean;

/// <summary>TODO: Descripción de PreguntarSiEjecutarMudanza.</summary>
/// <returns>TODO.</returns>
function PreguntarSiEjecutarMudanza(): integer;

/// <summary>TODO: Descripción de realizarPreguntaSiNo.</summary>
/// <param name="TextoPregunta">TODO.</param>
/// <returns>TODO.</returns>
function realizarPreguntaSiNo(TextoPregunta: string): integer;

/// <summary>TODO: Descripción de recibeCodigoActualEncriptacion.</summary>
/// <param name="usuarioE">TODO.</param>
/// <param name="PasswordE">TODO.</param>
/// <returns>TODO.</returns>
function recibeCodigoActualEncriptacion(usuarioE, PasswordE: string): string;

function encriptaEx(datos: string; keysalsa: string): string;

function DesencriptaEx(datos: string; keysalsa: string): string;

/// <summary>TODO: Descripción de PreguntarSiRestaurarBackUp.</summary>
/// <returns>TODO.</returns>
function PreguntarSiRestaurarBackUp(): integer;

/// <summary>TODO: Descripción de InicializaDBGiProy.</summary>
/// <returns>TODO.</returns>
function InicializaDBGiProy(): Integer;

/// <summary>TODO: Descripción de importarDBG2.</summary>
/// <param name="ficheroImp">TODO.</param>
/// <returns>TODO.</returns>
function importarDBG2(ficheroImp: string): string;

/// <summary>TODO: Descripción de recibeCodigoDBInstalacion.</summary>
/// <param name="usuarioE">TODO.</param>
/// <param name="PasswordE">TODO.</param>
/// <returns>TODO.</returns>
function recibeCodigoDBInstalacion(usuarioE, PasswordE: string): string;

/// <summary>TODO: Descripción de generaKeySalsa.</summary>
/// <returns>TODO.</returns>
function generaKeySalsa(): string;

/// <summary>TODO: Descripción de activaDBUsuario.</summary>
/// <returns>TODO.</returns>
function activaDBUsuario(): Boolean;

/// <summary>TODO: Descripción de generaBackUP.</summary>
/// <param name="automatico">TODO.</param>
/// <returns>TODO.</returns>
function generaBackUP(automatico: Boolean): string;

function LoginUsuario(const AUsuario, APassword: string; out Datos: TDatUsuario): Boolean;

function ObtenerUltimoBackupDisponiblesFecha(const AUrl, AToken: string; AIdUsuario: Integer; out AFecha: TDateTime; out AJson: TJSONObject): Boolean;

function ParseMysqlDateTime(const S: string; out DT: TDateTime): Boolean;

function TryParseFechaPHP(const S: string; out DT: TDateTime): Boolean;

function ParsePhpDateTimeISO(const S: string; out DT: TDateTime): Boolean;

/// <summary>TODO: Descripción de ConsultaEstadoMigracion.</summary>
/// <returns>TODO.</returns>
function ConsultaEstadoMigracion(): boolean;

/// <summary>TODO: Descripción de ConsultaEstadoBackUP.</summary>
/// <returns>TODO.</returns>
function ConsultaEstadoBackUP(): boolean;

/// <summary>TODO: Descripción de DaPublicidadEmitir.</summary>
/// <returns>TODO.</returns>
function DaPublicidadEmitir(): string;

function CrearUsuarioWordPressSync(const AToken, ANombreCompleto, APassword, AEmail, ARol: string; out AMessage: string): Boolean;

function EliminarUsuarioWordPressSync(const AToken, AEmail: string; out AMessage: string): Boolean;

implementation

{%CLASSGROUP 'FMX.Controls.TControl'}
{$R *.dfm}

uses
  uMain, DM_Presupuestos, uNuevaCategoria, uNuevaBase, uNuevoRecurso, uPregunta,
  uAddAPU, uCronoDerivaciones, uPertenencia, uDuplicarBase, uStakes, ulistStakes,
  uVisorNotas, uRolProyecto, uOpcionesEDT, uPorcentajesIndirectos, uVisorEDT,
  uAbrirPresupuesto, DM2, DMOnline, uAddEditCPC, DMSeguridad,
  thActualizaCodEmpresaOnline, DM_EDO, uPreguntaSiNo, DMExportDB, UAuth,
  uFormImportando, uMensajes, uBitmapUtils;

{ TDModule_1 }

/// <summary>TODO: Descripción de activaLoopPublicidad.</summary>
procedure activaLoopPublicidad();
var
  J: TJSONObject;
  Ok: Boolean;
begin
  J := nil;
  try
    SetLength(GPubLista, 0);
    GPubIndex := -1;

    // Usa tu URL del endpoint y el token global de tu app
    Ok := ConsultarPublicidadActivaTipado(UrlVisorPublicidad, GlobalAuthToken, GPubLista, J);
    if Ok and (Length(GPubLista) > 0) then
      GPubIndex := 0; // apunta al primer elemento
  finally
    J.Free;
  end;
end;

/// <summary>TODO: Descripción de DaPublicidadEmitir.</summary>
/// <returns>TODO.</returns>
function DaPublicidadEmitir(): string;
begin
  // Si no hay lista cargada, intenta cargarla
  if (GPubIndex < 0) or (GPubIndex >= Length(GPubLista)) then
    activaLoopPublicidad;

  // Si sigue sin haber datos, devuelve vacío
  if (GPubIndex < 0) or (Length(GPubLista) = 0) then
    Exit('');

  // Devuelve el URI actual
  Result := GPubLista[GPubIndex].URI;

  // Avanza el puntero y si llegó al final, recarga desde el servidor
  Inc(GPubIndex);
  if GPubIndex >= Length(GPubLista) then
    activaLoopPublicidad();
end;

/// <summary>TODO: Descripción de AjustarEstadosBackUp_Mudanza.</summary>
procedure AjustarEstadosBackUp_Mudanza();
begin
  frmMain.rect_crearBackUp.Enabled := puedeHacerBackUp;
  frmMain.rect_RestaurarBackUp.enabled := puedeHacerBackUp;
  frmMain.rect_CrearMigracion.Enabled := puedeHacerMigracion;
end;

/// <summary>TODO: Descripción de MuestraMensajeGiproy.</summary>
/// <param name="Texto">TODO.</param>
procedure MuestraMensajeGiproy(Texto: string);
begin
  fMensajes.mmo_Mensaje.Text := Texto;
end;

function ConsultaEstadoMigracion: Boolean;
var
  J, Item: TJSONObject;
  Items: TJSONArray;
  Itotal, Iusados, Irestantes: Integer;
  SUltimoUso: string;
  FechaUltimoUso: TDateTime;
  FSOut: TFormatSettings;
begin
  Result := False;

  // Defaults UI
  frmMain.lbl_EstadoSuscripcionSincronizacion.Text := 'No Activo';
  frmMain.lbl_EstadoSuscripcionSincronizacion.TextSettings.FontColor := TAlphaColorRec.Red;
  frmMain.lbl_n_sincronizaciones.Text := '0';
  frmMain.lbl_n_sincronizacionesUsadas.Text := '0';
  frmMain.lbl_n_sincronizacionesRestantes.Text := '0';
  frmMain.lbl_EstadoSuscripcionFechaUltimoUso.Text := '-';
  frmMain.rect_CrearMigracion.Enabled := False;

  J := nil;

  // Formato SOLO para salida visual
  FSOut := TFormatSettings.Create;
  FSOut.DateSeparator := '/';
  FSOut.TimeSeparator := ':';
  FSOut.ShortDateFormat := 'dd/mm/yyyy';
  FSOut.LongTimeFormat := 'hh:nn:ss';
  try
    try
      if ConsultarEstadoSuscripcion(GlobalAuthToken, codIDUsuario, 13, J) then
      begin
        Items := J.GetValue<TJSONArray>('items');
        if (Items <> nil) and (Items.Count > 0) then
        begin
          Item := Items.Items[0] as TJSONObject;

          Itotal := Item.GetValue<Integer>('unidades_disponibles', 0);
          Iusados := Item.GetValue<Integer>('total_usados', 0);
          Irestantes := Itotal - Iusados;
          if Irestantes < 0 then
            Irestantes := 0;

          if Irestantes > 0 then
          begin
            frmMain.lbl_EstadoSuscripcionSincronizacion.Text := 'Activo';
            frmMain.lbl_EstadoSuscripcionSincronizacion.TextSettings.FontColor := TAlphaColorRec.Green;
            frmMain.rect_CrearMigracion.Enabled := True;
          end
          else
          begin
            frmMain.lbl_EstadoSuscripcionSincronizacion.Text := '0';
            frmMain.lbl_EstadoSuscripcionSincronizacion.TextSettings.FontColor := TAlphaColorRec.Red;
          end;

          // Parseo robusto de "ultima_uso"
          SUltimoUso := Item.GetValue<string>('ultima_uso').Trim;
          if SUltimoUso <> '' then
          begin
            if ParsePhpDateTimeISO(SUltimoUso, FechaUltimoUso) then
              frmMain.lbl_EstadoSuscripcionFechaUltimoUso.Text := FormatDateTime(FSOut.ShortDateFormat + ' ' + FSOut.LongTimeFormat, FechaUltimoUso)
            else
              frmMain.lbl_EstadoSuscripcionFechaUltimoUso.Text := SUltimoUso;
          end
          else
            frmMain.lbl_EstadoSuscripcionFechaUltimoUso.Text := '-';

        // Números
          frmMain.lbl_n_sincronizaciones.Text := IntToStr(Itotal);
          frmMain.lbl_n_sincronizacionesUsadas.Text := IntToStr(Iusados);
          frmMain.lbl_n_sincronizacionesRestantes.Text := IntToStr(Irestantes);

          Result := True;
        end
        else
        begin
          frmMain.lbl_EstadoSuscripcionSincronizacion.Text := 'No Activo';
          frmMain.lbl_EstadoSuscripcionSincronizacion.TextSettings.FontColor := TAlphaColorRec.Red;
          Result := False;
        end;
      end
      else
        Result := False;

    except
      on E: Exception do
      begin
        frmMain.lbl_EstadoSuscripcionSincronizacion.Text := 'Error consulta: ' + E.Message;
        frmMain.lbl_EstadoSuscripcionSincronizacion.TextSettings.FontColor := TAlphaColorRec.Red;
        Result := False;
      end;
    end;
  finally
    if Assigned(J) then
      J.Free;
  end;
end;

function ConsultaEstadoBackUP: Boolean;
var
  J, Item: TJSONObject;
  Items: TJSONArray;
  Estado: string;
  SValidez, SUltimoUso: string;
  FechaValidez, FechaUltimoUso: TDateTime;
  DiasRestantes: Integer;
  FSOut: TFormatSettings;
begin
  Result := False;

  // Formato SOLO de salida (lo que verá el usuario)
  FSOut := TFormatSettings.Create;
  FSOut.DateSeparator := '/';
  FSOut.TimeSeparator := ':';
  FSOut.ShortDateFormat := 'dd/mm/yyyy';
  FSOut.LongTimeFormat := 'hh:nn:ss';

  // Defaults de UI
  frmMain.lbl_EstadoSuscripcionBackUp.Text := 'No Activa';
  frmMain.lbl_EstadoSuscripcionBackUp.TextSettings.FontColor := TAlphaColorRec.Red;
  frmMain.lbl_FechaValidezBackup.Text := '-';
  frmMain.lbl_DiasRestantesBackup.Text := '0';
  frmMain.lbl_FechaUltimoBackup.Text := '-';

  J := nil;
  try
    try
    // idComplementos = 14 → Pack Respaldo
      if not ConsultarEstadoSuscripcion(GlobalAuthToken, codIDUsuario, 14, J) then
        Exit(False);

      Items := J.GetValue<TJSONArray>('items');
      if (Items = nil) or (Items.Count = 0) then
        Exit(False);

      Item := Items.Items[0] as TJSONObject;

    // Puede venir el texto "estado" desde el PHP (Activa/Caducada/...)
      Estado := Item.GetValue<string>('estado', '');

    // fecha_caducidad & dias_restantes (TipoProducto=2)
      SValidez := Item.GetValue<string>('fecha_caducidad', '').Trim;
      if (SValidez <> '') and ParsePhpDateTimeISO(SValidez, FechaValidez) then
        frmMain.lbl_FechaValidezBackup.Text := FormatDateTime(FSOut.ShortDateFormat + ' ' + FSOut.LongTimeFormat, FechaValidez)
      else
        frmMain.lbl_FechaValidezBackup.Text := '-';

    // Calcular/leer dias_restantes
      DiasRestantes := Item.GetValue<Integer>('dias_restantes', Max(0, Trunc(FechaValidez - Now)));
      if DiasRestantes < 0 then
        DiasRestantes := 0;
      frmMain.lbl_DiasRestantesBackup.Text := IntToStr(DiasRestantes);

    // ultima_uso
      SUltimoUso := Item.GetValue<string>('ultima_uso', '').Trim;
      if (SUltimoUso <> '') and ParsePhpDateTimeISO(SUltimoUso, FechaUltimoUso) then
        frmMain.lbl_FechaUltimoBackup.Text := FormatDateTime(FSOut.ShortDateFormat + ' ' + FSOut.LongTimeFormat, FechaUltimoUso)
      else if SUltimoUso <> '' then
        frmMain.lbl_FechaUltimoBackup.Text := SUltimoUso   // fallback textual
      else
        frmMain.lbl_FechaUltimoBackup.Text := '-';

    // Estado visual (verde/rojo). Si no hay 'estado', usamos días restantes.
      if (Estado.ToLower = 'activa') or (DiasRestantes > 0) then
      begin
        frmMain.lbl_EstadoSuscripcionBackUp.Text := 'Activa';
        frmMain.lbl_EstadoSuscripcionBackUp.TextSettings.FontColor := TAlphaColorRec.Green;
        Result := True;
      end
      else
      begin
        frmMain.lbl_EstadoSuscripcionBackUp.Text := IfThen(Estado <> '', Estado, 'No Activa');
        frmMain.lbl_EstadoSuscripcionBackUp.TextSettings.FontColor := TAlphaColorRec.Red;
        Result := False;
      end;

    except
      on E: Exception do
      begin
        frmMain.lbl_EstadoSuscripcionBackUp.Text := 'Error: ' + E.Message;
        frmMain.lbl_EstadoSuscripcionBackUp.TextSettings.FontColor := TAlphaColorRec.Red;
        Result := False;
      end;
    end;
  finally
    if Assigned(J) then
      J.Free;
  end;
end;

function ParsePhpDateTimeISO(const S: string; out DT: TDateTime): Boolean;
var
  s2: string;
  FSIn: TFormatSettings;
begin
  Result := False;
  if S.Trim = '' then
    Exit;

    // 1) Intento ISO8601 (acepta "YYYY-MM-DDThh:mm:ss[.sss][Z|±hh:mm]")
  if TryISO8601ToDate(S, DT, False) then
    Exit(True);

    // 2) Intento "YYYY-MM-DD hh:mm:ss" (MySQL típico)
  FSIn := TFormatSettings.Create;
  FSIn.DateSeparator := '-';
  FSIn.TimeSeparator := ':';
  FSIn.ShortDateFormat := 'yyyy-MM-dd';
  FSIn.LongTimeFormat := 'hh:nn:ss';

  s2 := StringReplace(S, 'T', ' ', [rfReplaceAll]); // por si viene con 'T'
    // quitar 'Z' final
  if (s2 <> '') and (s2[High(s2)] = 'Z') then
    Delete(s2, Length(s2), 1);

    // quitar offset si viniera (ej. 2025-10-17 11:00:00+02:00)
    // nos quedamos con los primeros 19 chars "YYYY-MM-DD hh:mm:ss"
  if Length(s2) >= 19 then
    s2 := Copy(s2, 1, 19);

  Result := TryStrToDateTime(s2, DT, FSIn);
end;

function ParseMysqlDateTime(const S: string; out DT: TDateTime): Boolean;
var
  T: string;
  Y, M, D, H, N, Sec: Integer;
begin
  Result := False;
  T := Trim(S);
  if Length(T) < 19 then
    Exit; // 'YYYY-MM-DD hh:mm:ss' = 19
  try
    Y := StrToInt(Copy(T, 1, 4));
    M := StrToInt(Copy(T, 6, 2));
    D := StrToInt(Copy(T, 9, 2));
    H := StrToInt(Copy(T, 12, 2));
    N := StrToInt(Copy(T, 15, 2));
    Sec := StrToInt(Copy(T, 18, 2));
    DT := EncodeDateTime(Y, M, D, H, N, Sec, 0);
    Result := True;
  except
    Result := False;
  end;
end;

function TryParseFechaPHP(const S: string; out DT: TDateTime): Boolean;
var
  FS: TFormatSettings;
  ISO: string;
begin
  // 1) Formato exacto MySQL con FS invariantes
  FS := TFormatSettings.Create;
  FS.DateSeparator := '-';
  FS.TimeSeparator := ':';
  FS.ShortDateFormat := 'yyyy-mm-dd';
  FS.LongTimeFormat := 'hh:nn:ss'; // minutos = nn

  Result := TryStrToDateTime(S, DT, FS);
  if Result then
    Exit;

  // 2) ISO 8601: sustituye espacio por 'T' y vuelve a intentar
  ISO := StringReplace(S, ' ', 'T', [rfReplaceAll]);
  if TryISO8601ToDate(ISO, DT) then
    Exit(True);

  // 3) Parser manual como red de seguridad
  Result := ParseMysqlDateTime(S, DT);
end;

/// <summary>TODO: Descripción de GuardaFechaHoraEntrada.</summary>
procedure GuardaFechaHoraEntrada();
var
  Http: TNetHTTPClient;
  Params: TStringList;
  Resp: IHTTPResponse;
  tmpstr: string;
begin
  Http := TNetHTTPClient.Create(nil);
  Params := TStringList.Create;
  try
    Http.CustomHeaders['Authorization'] := 'Bearer ' + GlobalAuthToken;
    Http.ContentType := 'application/x-www-form-urlencoded';

    Params.AddPair('idUsuario', IntToStr(codIDUSuario));
    Params.AddPair('FechaHora', FormatDateTime('yyyy-mm-dd hh:nn:ss', Now));

    Resp := Http.Post('https://app.62.171.171.124.sslip.io/GuardaHoraEntrada.php', Params);

    if Resp.StatusCode <> 200 then
      raise Exception.CreateFmt('HTTP %d: %s'#13#10'%s', [Resp.StatusCode, Resp.StatusText, Resp.ContentAsString(TEncoding.UTF8)]);

    tmpstr := 'OK: ' + Resp.ContentAsString;
  finally
    Params.Free;
    Http.Free;
  end;
end;

function LoginUsuario(const AUsuario, APassword: string; out Datos: TDatUsuario): Boolean;
var
  Http: TNetHTTPClient;
  Params: TStringList;
  Resp: IHTTPResponse;
  JSONRoot, JSONUser: TJSONObject;
  SResp, S: string;
begin
  Result := False;
  FillChar(Datos, SizeOf(Datos), 0);

  Http := TNetHTTPClient.Create(nil);
  Params := TStringList.Create;
  try
    Http.ConnectionTimeout := 15000;
    Http.ResponseTimeout := 30000;
    Params.Clear;
    Params.AddPair('usuario', AUsuario);
    Params.AddPair('password', APassword);
    Http.ContentType := 'application/x-www-form-urlencoded';
    Resp := Http.Post(AServerURLLogin, Params);

    if Resp.StatusCode <> 200 then
      raise Exception.CreateFmt('Error: HTTP %d: %s', [Resp.StatusCode, Resp.StatusText]);

    SResp := Resp.ContentAsString(TEncoding.UTF8);
    JSONRoot := TJSONObject.ParseJSONValue(SResp) as TJSONObject;
    if not Assigned(JSONRoot) then
      raise Exception.Create('Error: Respuesta JSON inválida');

    try
      if JSONRoot.GetValue<Boolean>('ok', False) then
      begin
        // Captura el token JWT devuelto por loginUsuario.php
        GlobalAuthToken := JSONRoot.GetValue<string>('token', '');

        JSONUser := JSONRoot.GetValue<TJSONObject>('usuario');
        if Assigned(JSONUser) then
        begin
          Datos.idUsuario := JSONUser.GetValue<Int64>('idUsuario', 0);
          Datos.Nombre := JSONUser.GetValue<string>('Nombre', '');
          Datos.Apellidos := JSONUser.GetValue<string>('Apellidos', '');
          Datos.usuario := JSONUser.GetValue<string>('usuario', '');

          // Fechas ISO 8601 (el PHP ya normaliza)
          S := JSONUser.GetValue<string>('fechaAlta', '');
          if S <> '' then
            Datos.fechaAlta := ISO8601ToDate(S, False);

          Datos.estado := JSONUser.GetValue<Integer>('estado', 0);
          Datos.profesion := JSONUser.GetValue<string>('profesion', '');
          Datos.tipo := JSONUser.GetValue<string>('tipo', '');
          Datos.direccion := JSONUser.GetValue<string>('direccion', '');
          Datos.Ciudad := JSONUser.GetValue<string>('Ciudad', '');
          Datos.Provincia := JSONUser.GetValue<string>('Provincia', '');
          Datos.Pais := JSONUser.GetValue<string>('Pais', '');
          Datos.email := JSONUser.GetValue<string>('email', '');
          Datos.Tfno := JSONUser.GetValue<string>('Tfno', '');
          Datos.computerIDPrincipal := JSONUser.GetValue<string>('computerIDPrincipal', '');
          Datos.descripcion := JSONUser.GetValue<string>('descripcion', '');
          S := JSONUser.GetValue<string>('FechaInicio', '');
          if S <> '' then
            Datos.FechaInicio := ISO8601ToDate(S, False);
          S := JSONUser.GetValue<string>('FechaFin', '');
          if S <> '' then
            Datos.FechaFin := ISO8601ToDate(S, False);
          S := JSONUser.GetValue<string>('fechahoraIDPrincipal', '');
          if S <> '' then
            Datos.fechahoraIDPrincipal := ISO8601ToDate(S, False);

          Datos.computerIDMudanza := JSONUser.GetValue<string>('computerIDMudanza', '');

          S := JSONUser.GetValue<string>('fechaHoraIDMudanza', '');
          if S <> '' then
            Datos.fechaHoraIDMudanza := ISO8601ToDate(S, False);

          Datos.BackUpActivo := JSONUser.GetValue<Integer>('BackUpActivo', 0);
          Datos.MudanzaActiva := JSONUser.GetValue<Integer>('MudanzaActiva', 0);
          Datos.idfiscal := JSONUser.GetValue<string>('idfiscal', '');

          Result := True;
        end
        else
          raise Exception.Create('Error: No se recibió el objeto "usuario"');
      end
      else
        raise Exception.Create('Error: Credenciales inválidas o error en la autenticación');
    finally
      JSONRoot.Free;
    end;

  finally
    Params.Free;
    Http.Free;
  end;
end;

function ObtenerUltimoBackupDisponiblesFecha(const AUrl, AToken: string; AIdUsuario: Integer; out AFecha: TDateTime; out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText, LFechaStr: string;
  JsonValue: TJSONValue;
  Stream: TStringStream;
begin
  Result := False;
  AJson := nil;
  AFecha := 0;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vacío');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vacío');
  if AIdUsuario <= 0 then
    raise EArgumentException.Create('AIdUsuario debe ser > 0');

  Client := TNetHTTPClient.Create(nil);
  try
    Client.ConnectionTimeout := 10000;
    Client.ResponseTimeout := 15000;
    Client.Accept := 'application/json';
    Client.AllowCookies := False;

    SetLength(Headers, 2);
    Headers[0].Name := 'Authorization';
    Headers[0].Value := 'Bearer ' + AToken;
    Headers[1].Name := 'Content-Type';
    Headers[1].Value := 'application/x-www-form-urlencoded; charset=utf-8';

    // El PHP espera idUsuario y devuelve { ok:true, Mensaje, adicional, fechaHoraEnvio, ... }
    Body := Format('idUsuario=%d', [AIdUsuario]);

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(AUrl, Stream, nil, Headers);  // ← CORREGIDO
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON válido', Resp.StatusCode);

    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('message', 'Error')]), Resp.StatusCode);

    if not AJson.GetValue<Boolean>('ok', False) then
      raise EApiException.Create('La API respondió ok=false: ' + AJson.GetValue<string>('message', 'Error'), Resp.StatusCode);

    // Tomar el campo devuelto por el SELECT del PHP:
    LFechaStr := AJson.GetValue<string>('fechaHoraEnvio', '');
    if LFechaStr <> '' then
    begin
      if not TryStrToDateTime(LFechaStr, AFecha, TFormatSettings.Create('es-ES')) then
        if not TryISO8601ToDate(LFechaStr, AFecha) then
          AFecha := 0;
    end;

    Result := AFecha > 0;
  finally
    Client.Free;
  end;
end;

/// <summary>TODO: Descripción de generaBackUP.</summary>
/// <param name="automatico">TODO.</param>
/// <returns>TODO.</returns>
function generaBackUP(automatico: Boolean): string;
var
  realizarBackup: Boolean;
  fechaUltimoBackUp: TDateTime;
  fechaCaducidadProducto: TDateTime;
  DiferenciaEnHoras: Double;
  Proceder: Boolean;
  nombreFichero: string;
  keySalsa: string;
  datosComunicacion: string;
  adicional: string;
  Ok: Boolean;
  Json: TJSONObject;
begin
  Result := 'error';
  realizarBackup := False;

  if automatico then
  begin
    Json := nil;
    try
      TThread.CreateAnonymousThread(
        procedure
        begin
          FormImportando.lblTextoAccion.Text := 'Obtener Ultimo BackUp.';

          Ok := ObtenerUltimoBackupDisponiblesFecha(UrlBackupDisponibles, GlobalAuthToken, codIDUSuario, fechaUltimoBackUp, Json);   // ok

          FormImportando.DetenerAnimacion;
        end).Start;

      if not Ok then
      begin
        realizarBackup := False;
      end
      else
      begin
        DiferenciaEnHoras := (Now - fechaUltimoBackUp) * 24;
        if DiferenciaEnHoras > 72 then
          realizarBackup := True
        else
          realizarBackup := False;
      end;
    finally
      Json.Free;
    end;
  end
  else
  begin
    realizarBackup := True;
  end;

  if realizarBackup then
  begin
    Proceder := False;
    Json := nil;
    try
      TThread.CreateAnonymousThread(
        procedure
        begin
          FormImportando.lblTextoAccion.Text := 'Obtener Ultimo BackUp.';
          Ok := DarFechaCaducidadProductoFecha(UrlDarFechaCaducidadProducto, GlobalAuthToken, codIDUSuario, 13 {idProducto Backup}, fechaCaducidadProducto, Json);   // ok
          FormImportando.DetenerAnimacion;
        end).Start;

      if Ok and (fechaCaducidadProducto > Now) then
        Proceder := True
      else
        Proceder := False;
    finally
      Json.Free;
    end;

    if Proceder then
    begin
      TThread.CreateAnonymousThread(
        procedure
        begin
          FormImportando.lblTextoAccion.Text := 'Obtener Ultimo BackUp.';
          nombreFichero := MigrarGiProy();
          if nombreFichero <> 'error' then
          begin
            keySalsa := generaKeySalsa;
            nombreFichero := Encripta_Envia(nombreFichero, keySalsa);
            if nombreFichero <> 'error' then
            begin
              adicional := FormatDateTime('dd/mm/yyyy', Now);
              datosComunicacion := encriptaEx(ExtractFileName(nombreFichero) + '&&' + keySalsa, codSalsaExt);
              EnviaExportacionDB(codIDUSuario, codIDUSuario, datosComunicacion, 8, adicional);          // ok
              WipeFile(nombreFichero);
            end
            else
              MuestraMensajeGiproy('Error');
          end;
          FormImportando.DetenerAnimacion;
        end).Start;
      Result := 'ok';
    end;
  end;
end;

/// <summary>TODO: Descripción de activaDBUsuario.</summary>
/// <returns>TODO.</returns>
function activaDBUsuario(): Boolean;
var
  tmpstr: string;
begin
  result := false;
  try
    if Assigned(frmMain.users) then
    begin
      frmmain.Users.GetDatabaseConfig(UserDB, PasswordDB, nombreDB);
      if Dmodule_1.con2.Connected then
        DModule_1.con2.Disconnect;
      DModule_1.con2.Username := UserDB;
      Dmodule_1.con2.Password := PasswordDB;
      DModule_1.con2.Database := nombreDB;
      Dmodule_1.con2.connect;
      if Dmodule_1.con2.Connected then
        result := True
      else
        Result := False;
    end
    else
      result := False;
  except
    result := false;
  end;
end;

/// <summary>TODO: Descripción de InicializaDBGiProy.</summary>
/// <returns>TODO.</returns>
function InicializaDBGiProy(): Integer;
var
  respuesta: string;
begin
  result := 0;
  try
    respuesta := DescargaFTP(nombreBaseInstalacionEnc);
    respuesta := DesencriptaFile(respuesta, codSalsaExt);
    PreparaBaseInicio(respuesta);
    result := 1;
  except
    result := 0;
  end;
end;

/// <summary>TODO: Descripción de PreparaBaseInicio.</summary>
/// <param name="archivoBase">TODO.</param>
procedure PreparaBaseInicio(archivoBase: string);
var
  localDBStr: TStringList;
  L1m, L2m, L3m: string;
  NewUserDB: string;
  NewPasswordDB: string;
  NewTableDB: string;
  respuesta: string;
  J: TJSONObject;
  Ok: Boolean;
begin
  localDBStr := TStringList.Create;
  try
    localDBStr.LoadFromFile(archivoBase);

    nombreDB := nDBInicio + '_' + IntToStr(codIDUSuario);
    NewUserDB := 'Giproy_' + IntToStr(codIDUSuario);
    NewPasswordDB := generaKeySalsa();

    L1m := AnsiReplaceStr(L1, 'Giproy', NewUserDB);
    L1m := 'DROP USER IF EXISTS ' + quotedstr(NewUserDB) + '@' + quotedstr('localhost') + ';' + Chr(13) + L1m;
    L1m := AnsiReplaceStr(L1m, 'caching_sha2_password PASSWORD EXPIRE DEFAULT', QuotedStr(NewPasswordDB));
    L1m := AnsiReplaceStr(L1m, 'WITH', 'BY');

    L3m := AnsiReplaceStr(L3, 'giproylocal_4', nombreDB);
    L2m := AnsiReplaceStr(L3m, 'Giproy', NewUserDB);

    localDBStr.Text := AnsiReplaceStr(localDBStr.Text, nDBInicio, nombreDB);
    localDBStr.Text := AnsiReplaceStr(localDBStr.Text, L1, L1m);
    localDBStr.Text := AnsiReplaceStr(localDBStr.Text, L2, L3);   // (respetado tal cual tu código)
    localDBStr.Text := AnsiReplaceStr(localDBStr.Text, L3, L2m);

    localDBStr.SaveToFile(archivoBase);
  finally
    localDBStr.Free;
  end;

  // Reconfigura conexión "root/admin" para ejecutar el script
  if Dmodule_1.con2.Connected then
    DModule_1.con2.Disconnect;
  DModule_1.con2.Username := userDB;
  DModule_1.con2.Password := passwordDB;
  DModule_1.con2.Database := '';
  DModule_1.con2.Connect;

  respuesta := 'error';
  if DModule_1.con2.Connected then
    respuesta := importarDBG2(archivoBase).Trim;

  if respuesta <> 'error' then
  begin
    // Guardamos credenciales del nuevo esquema de usuario/app
    frmMain.Users.SetDatabaseConfig(NewUserDB, NewPasswordDB, nombreDB);

    // ⬇️ Sustituye el SQL directo por la llamada a la API GuardarHardwareID
    //     - Usa la hora actual del equipo (helper ...Ahora)
    //     - Requiere GlobalAuthToken, codIDUSuario y HardwareKey ya disponibles en tu contexto
    J := nil;
    try
      Ok := GuardarHardwareIDAhora(GlobalAuthToken, codIDUSuario, HardwareKey, J);
      if not Ok then
        raise Exception.Create('No se pudo actualizar el HardwareID online (ok=false).');

      // (Opcional) puedes leer filas afectadas si te interesa:
      // var Rows: Integer := J.GetValue<Integer>('rows_affected', 0);

    finally
      J.Free;
    end;
  end;
end;

/// <summary>TODO: Descripción de importarDBG2.</summary>
/// <param name="ficheroImp">TODO.</param>
/// <returns>TODO.</returns>
function importarDBG2(ficheroImp: string): string;
var
  dump: TUniDump;
  fs: TMemoryStream;
  ficheroDB: string;
begin
  dump := TUniDump.Create(nil);
  fs := TMemoryStream.Create;
  try
    try
      fs.LoadFromFile(ficheroImp);
      fs.Position := 0;
      dump.Connection := DModule_1.con2;
      dump.SpecificOptions.Values['UseExtSyntax'] := 'False';
      dump.RestoreFromFile(ficheroImp);
      WipeFile(ficheroImp);
      Result := 'Importación Realizada';
    except
      Result := 'error';
    end;
  finally
    dump.Free;
    fs.Free;
  end;
end;

/// <summary>TODO: Descripción de generaKeySalsa.</summary>
/// <returns>TODO.</returns>
function generaKeySalsa(): string;
var
  s: string;
  kl: Integer;
  Conv: TConvert;
begin
  kl := 32;
  Conv := TConvert.Create(nil);
  try
    Conv.AType := hexa;
    s := Conv.RandomString(kl div 2);
    Result := s;
  finally
    Conv.free;
  end;
end;

/// <summary>TODO: Descripción de PreguntarSiRestaurarBackUp.</summary>
/// <returns>TODO.</returns>
function PreguntarSiRestaurarBackUp(): integer;
var
  respuesta: integer;
  datosBackUP: string;
  adicionales: string;
  respuestaDescripta: dat_respuestaFicheroImportacion;
  ficheroDatos: string;
  mensaje: string;
  x: integer;
  J: TJSONObject;
  Ok: Boolean;

  // nuevos
  FechaBk: TDateTime;
  MsgBk, AddBk: string;
begin
  Result := 0;

  respuesta := realizarPreguntaSiNo('¿Desea Restaurar Copia de Seguridad?' + sLineBreak + 'El ordenador de trabajo se definirá como el actual.');

  case respuesta of
    0:
      Exit(0);

    1:
      begin
        // === NUEVO: Consultar el backup disponible vía API ===
        J := nil;
        if not ConsultarBackupDisponibleDatos(UrlBackupDisponibles, GlobalAuthToken, codIDUSuario, FechaBk, MsgBk, AddBk, J) then
        begin
          if Assigned(J) then
            J.Free;
          MuestraMensajeGiproy('No hay copias de seguridad disponibles para restaurar.');
          Exit(0);
        end;

        try
          // Los campos vienen en MsgBk y AddBk (result.Mensaje y result.adicional)
          datosBackUP := MsgBk;
          adicionales := AddBk;
        finally
          J.Free;
        end;
        // =====================================================

        // Proceso original (desencriptar y preparar importación)
        datosBackUP := DesencriptaEx(datosBackUP, codSalsaExt);
        respuestaDescripta := frmMain.daRespuestaDesencripta(datosBackUP);

        // Descarga del fichero indicado en el mensaje
        ficheroDatos := DescargaFTP(respuestaDescripta.fichero);

        // Asegura que x tiene un valor antes del primer uso
        x := 0;

        if x < 1 then
        begin
          // Importación del backup
          mensaje := importarDBG(ficheroDatos, respuestaDescripta.claveSalsa);
          x := AnsiPos('error', LowerCase(mensaje));

          if x < 1 then
          begin
            // === NUEVO: Registrar HardwareID usando la API (sustituye SQL directo) ===
            J := nil;
            try
              Ok := GuardarHardwareIDAhora(GlobalAuthToken, codIDUSuario, HardwareKey, J);
              if not Ok then
              begin
                MuestraMensajeGiproy('Restauración completada, pero no se pudo registrar el HardwareID online.');
                Result := 0;
                Exit;
              end;
              // (Opcional) leer filas afectadas:
              // var Rows: Integer := J.GetValue<Integer>('rows_affected', 0);
            finally
              J.Free;
            end;
            // =======================================================================

            MuestraMensajeGiproy('Restauración Completa.');
            Result := 1;
          end
          else
          begin
            MuestraMensajeGiproy('Error 2 de importación.');
            Result := 0;
          end;
        end
        else
        begin
          MuestraMensajeGiproy('Error de importación.');
          Result := 0;
        end;
      end;
  end;
end;

/// <summary>TODO: Descripción de PreguntarSiEjecutarMudanza.</summary>
/// <returns>TODO.</returns>
function PreguntarSiEjecutarMudanza(): integer;
var
  respuesta: integer;
begin
  // 0 Salir de Sistema, 1 Realizar Mudanza
  Result := 0;
  respuesta := realizarPreguntaSiNo('¿Desea ejecutar la exportación hacia otro ordenador?');
  case respuesta of
    0:
      Result := 0;
    1:
      begin
        Result := 1;
        TThread.CreateAnonymousThread(
          procedure
          var
            JsonResp, JsonUpd: TJSONObject;
            fechaHora: TDateTime;
            datosMudanza: string;
            adicionales: string;
            respuestaDescripta: dat_respuestaFicheroImportacion;
            ficheroDatos: string;
            mensaje: string;
            x, RowsAffected: integer;
          begin
            JsonResp := nil;
            JsonUpd := nil;
            try
              FormImportando.lblTextoAccion.Text := 'Iniciando Exportación.';

              // === 1) Consulta HTTP a MigracionesDisponibles.php ===
              if not ConsultarMigracionDisponibleDatos(UrlMigracionesDisponibles, GlobalAuthToken,        // Bearer token
                codIDUSuario,           // idEmisor
                fechaHora, datosMudanza, adicionales, JsonResp) then
              begin
                TThread.Synchronize(nil,
                  procedure
                  begin
                    MuestraMensajeGiproy('No se encontraron migraciones disponibles en los últimos 3 días.');
                  end);
                Exit;
              end;

              // === 2) Descifrado e importación ===
              FormImportando.lblTextoAccion.Text := 'Descifrando paquete de exportación...';
              datosMudanza := DesencriptaEx(datosMudanza, codSalsaExt);

              respuestaDescripta := frmmain.daRespuestaDesencripta(datosMudanza);

              FormImportando.lblTextoAccion.Text := 'Descargando fichero...';
              ficheroDatos := DescargaFTP(respuestaDescripta.fichero);

              x := AnsiPos('error', LowerCase(ficheroDatos));
              if x < 1 then
              begin
                FormImportando.lblTextoAccion.Text := 'Importando base de datos...';
                mensaje := importarDBG(ficheroDatos, respuestaDescripta.claveSalsa);

                x := AnsiPos('error', LowerCase(mensaje));
                if x < 1 then
                begin
                  // === 3) Limpieza de fichero remoto ===
                  FormImportando.lblTextoAccion.Text := 'Limpiando y cerrando...';
                  Borrarftp(respuestaDescripta.fichero);

                  // === 4) ACTUALIZAR ESTADO MIGRACIÓN (HTTP) ===
                  // Sustituye el UPDATE local por el endpoint ActualizaEstadoMigracion.php
                  // Usa el helper "Ahora" para setear fecha actual automáticamente.
                  if not ActualizarEstadoMigracionAhora(UrlActualizaEstadoMigracion, GlobalAuthToken,                 // Bearer token
                    codigo_usuario,                  // idUsuario (mantengo tu variable original)
                    HardwareKey,                     // computerIDMudanza
                    RowsAffected,                    // OUT
                    JsonUpd                          // OUT JSON de respuesta
                  ) then
                  begin
                    // Si la función devolvió False, ya lanzó EApiException antes o no vino ok=true
                    TThread.Synchronize(nil,
                      procedure
                      begin
                        MuestraMensajeGiproy('No fue posible actualizar el estado de la mudanza en el servidor.');
                      end);
                    Exit;
                  end;

                  if RowsAffected <= 0 then
                  begin
                    TThread.Synchronize(nil,
                      procedure
                      begin
                        MuestraMensajeGiproy('Advertencia: el servidor no reportó cambios (rows_affected=0).');
                      end);
                  end;

                  // OK final
                  TThread.Synchronize(nil,
                    procedure
                    begin
                      MuestraMensajeGiproy('Exportación e importación completadas correctamente.');
                    end);
                end
                else
                begin
                  TThread.Synchronize(nil,
                    procedure
                    begin
                      MuestraMensajeGiproy('Error 2 de importación: ' + mensaje);
                    end);
                end;
              end
              else
              begin
                TThread.Synchronize(nil,
                  procedure
                  begin
                    MuestraMensajeGiproy('Error de importación: ' + ficheroDatos);
                  end);
              end;

            except
              on E: EApiException do
              begin
                // Errores HTTP/ok=false de cualquier endpoint
                TThread.Synchronize(nil,
                  procedure
                  begin
                    MuestraMensajeGiproy(Format('Error de API (HTTP %d): %s', [E.StatusCode, E.Message]));
                  end);
              end;
              on E: Exception do
              begin
                TThread.Synchronize(nil,
                  procedure
                  begin
                    MuestraMensajeGiproy('Error en la exportación: ' + E.Message);
                  end);
              end;
            end;

            // Limpieza UI
            TThread.Synchronize(nil,
              procedure
              begin
                FormImportando.DetenerAnimacion;
              end);

            // Liberar JSON si se obtuvo
                if Assigned(JsonResp) then
              JsonResp.Free;
            if Assigned(JsonUpd) then
              JsonUpd.Free;
          end).Start;
      end;
  end;
end;

function encriptaEx(datos: string; keysalsa: string): string;
var
  SalsaEnc: TSalsaEncryption;
begin
  SalsaEnc := TSalsaEncryption.Create(nil);
  try
    try
      SalsaEnc.keyLength := skl256;
      SalsaEnc.outputFormat := base64url;
      SalsaEnc.Unicode := yesUni;
      SalsaEnc.key := keysalsa;
      Result := SalsaEnc.Encrypt(datos);
    finally
      SalsaEnc.free;
    end;
  except
    result := 'error';
  end;
end;

function DesencriptaEx(datos: string; keysalsa: string): string;
var
  SalsaEnc: TSalsaEncryption;
begin
  SalsaEnc := TSalsaEncryption.Create(nil);
  try
    try
      SalsaEnc.keyLength := skl256;
      SalsaEnc.outputFormat := base64url;
      SalsaEnc.Unicode := yesUni;
      SalsaEnc.key := keysalsa;
      Result := SalsaEnc.Decrypt(datos);
    finally
      SalsaEnc.free;
    end;
  except
    result := 'error';
  end;
end;

/// <summary>TODO: Descripción de recibeCodigoActualEncriptacion.</summary>
/// <param name="usuarioE">TODO.</param>
/// <param name="PasswordE">TODO.</param>
/// <returns>TODO.</returns>
function recibeCodigoActualEncriptacion(usuarioE, PasswordE: string): string;
var
  Client: TNetHTTPClient;
  Params: TStringList;
  Resp: IHTTPResponse;
  AURL: string;
  x: integer;
  JsonResp: TJSONObject;
  Credentials: TJSONObject;
begin
  Result := '';
  AURL := 'https://app.62.171.171.124.sslip.io/pencript.php';
  Client := TNetHTTPClient.Create(nil);
  try
    Client.ConnectionTimeout := 15000;
    Client.ResponseTimeout := 30000;
    Params := TStringList.Create;
    try
      Params.Add('username=' + TNetEncoding.URL.Encode(usuarioE));
      Params.Add('password=' + TNetEncoding.URL.Encode(PasswordE));
      Resp := Client.Post(AURL, Params);
      Result := Resp.ContentAsString(TEncoding.UTF8);
      x := AnsiPos('SERVER ERROR', Result);
      if x > 0 then
        Result := 'Error'
      else
      begin
        JsonResp := TJSONObject.ParseJSONValue(Resp.ContentAsString(TEncoding.UTF8)) as TJSONObject;
        if Assigned(JsonResp) then
        begin
          Credentials := JsonResp.GetValue('credentials') as TJSONObject;
          Result := Credentials.GetValue('password').Value;
        end
        else
          Result := 'Error: respuesta no válida';
      end;
    finally
      Params.Free;
    end;
  finally
    Client.Free;
  end;
end;

/// <summary>TODO: Descripción de recibeCodigoDBInstalacion.</summary>
/// <param name="usuarioE">TODO.</param>
/// <param name="PasswordE">TODO.</param>
/// <returns>TODO.</returns>
function recibeCodigoDBInstalacion(usuarioE, PasswordE: string): string;
var
  Client: TNetHTTPClient;
  Params: TStringList;
  Resp: IHTTPResponse;
  AURL: string;
  x: integer;
  JsonResp: TJSONObject;
  Credentials: TJSONObject;
begin
  Result := '';
  AURL := 'https://app.62.171.171.124.sslip.io/dacredendialesDB.php';
  Client := TNetHTTPClient.Create(nil);
  try
    Client.ConnectionTimeout := 15000;
    Client.ResponseTimeout := 30000;
    Params := TStringList.Create;
    try
      Params.Add('username=' + TNetEncoding.URL.Encode(usuarioE));
      Params.Add('password=' + TNetEncoding.URL.Encode(PasswordE));
      Resp := Client.Post(AURL, Params);
      Result := Resp.ContentAsString(TEncoding.UTF8);
      x := AnsiPos('SERVER ERROR', Result);
      if x > 0 then
        Result := 'Error'
      else
      begin
        JsonResp := TJSONObject.ParseJSONValue(Resp.ContentAsString(TEncoding.UTF8)) as TJSONObject;
        if Assigned(JsonResp) then
        begin
          Credentials := JsonResp.GetValue('credentials') as TJSONObject;
          UserDB := Credentials.GetValue('userdb').Value;
          passwordDB := Credentials.GetValue('password').Value;
          Result := 'ok';
        end
        else
          Result := 'Error: respuesta no válida';
      end;
    finally
      Params.Free;
    end;
  finally
    Client.Free;
  end;
end;

/// <summary>TODO: Descripción de Borrarftp.</summary>
/// <param name="nombreArchivo">TODO.</param>
/// <returns>TODO.</returns>
function Borrarftp(nombreArchivo: string): string;
var
  IdFTP: TIdFTP;
  SSLIOHandler: TIdSSLIOHandlerSocketOpenSSL;
  remoteFile: string;
  listado: string;
  x: Integer;
begin
  IdFTP := TIdFTP.Create(nil);
  SSLIOHandler := TIdSSLIOHandlerSocketOpenSSL.Create(nil);
  try
    // Configure SSLIOHandler
    SSLIOHandler.SSLOptions.Method := sslvTLSv1_2;
    IdFTP.IOHandler := SSLIOHandler;

    // Configure FTP component
    IdFTP.Host := '62.171.171.124';
    IdFTP.Port := 21;
    IdFTP.Username := 'usuario_transferencia';
    IdFTP.Password := 'AC16AC662asdC_7A';
    IdFTP.UseTLS := utUseExplicitTLS;
    IdFTP.DataPortProtection := ftpdpsPrivate;
    IdFTP.Passive := True;

    // Connect
    IdFTP.Connect;
    if IdFTP.Connected then
    begin
      remoteFile := ExtractFileName(nombreArchivo);
      IdFTP.List('*.enc', True);
      listado := IdFTP.ListResult.Text;
      x := AnsiPos(remoteFile, listado);
      if x > 0 then
        IdFTP.Delete(remoteFile);
      Result := nombreArchivo;
    end;

    IdFTP.Disconnect;
  except
    on E: Exception do
      Result := 'Error connecting to FTPS: ' + E.Message;
  end;
  SSLIOHandler.Free;
  IdFTP.Free;
end;

function importarDBG(ficheroImp: string; keysalsa: string): string;
var
  dump: TUniDump;
  fs: TMemoryStream;
  ficheroDB: string;
begin
  dump := TUniDump.Create(nil);
  fs := TMemoryStream.Create;
  try
    try
      ficheroDB := DesencriptaFile(ficheroImp, keysalsa);
      fs.LoadFromFile(ficheroDB);
      fs.Position := 0;
      dump.Connection := DModule_1.con2;
      dump.SpecificOptions.Values['UseExtSyntax'] := 'False';
      dump.RestoreFromFile(ficheroDB);
      WipeFile(ficheroDB);
      Result := 'Importación Realizada';
    except
      Result := 'error';
    end;
  finally
    dump.Free;
    fs.Free;
  end;
end;

/// <summary>TODO: Descripción de WipeFile.</summary>
/// <param name="FileName">TODO.</param>
procedure WipeFile(FileName: string);
var
  buffer: array[0..4095] of Byte;
  max, n: LongInt;
  i: Integer;
  fs: TFileStream;

  procedure RandomizeBuffer;
  var
    i: Integer;
  begin
    for i := Low(buffer) to High(buffer) do
      buffer[i] := Random(256);
  end;

begin
  fs := TFilestream.Create(FileName, fmOpenReadWrite or fmShareExclusive);
  try
    for i := 1 to 3 do
    begin
      RandomizeBuffer;
      max := fs.Size;
      fs.Position := 0;
      while max > 0 do
      begin
        if max > SizeOf(buffer) then
          n := SizeOf(buffer)
        else
          n := max;
        fs.Write(buffer, n);
        max := max - n;
      end;
      FlushFileBuffers(fs.Handle);
    end;
  finally
    fs.Free;
    DeleteFile(PChar(FileName));
  end;
end;

/// <summary>TODO: Descripción de DescargaFTP.</summary>
/// <param name="nombreArchivo">TODO.</param>
/// <returns>TODO.</returns>
function DescargaFTP(nombreArchivo: string): string;
var
  IdFTP: TIdFTP;
  SSLIOHandler: TIdSSLIOHandlerSocketOpenSSL;
  localFile: string;
begin
  IdFTP := TIdFTP.Create(nil);
  SSLIOHandler := TIdSSLIOHandlerSocketOpenSSL.Create(nil);
  try
    // Configure SSLIOHandler
    SSLIOHandler.SSLOptions.Method := sslvTLSv1_2;
    IdFTP.IOHandler := SSLIOHandler;

    // Configure FTP component
    IdFTP.Host := '62.171.171.124';
    IdFTP.Port := 21;
    IdFTP.Username := 'usuario_transferencia';
    IdFTP.Password := 'AC16AC662asdC_7A';
    IdFTP.UseTLS := utUseExplicitTLS;
    IdFTP.DataPortProtection := ftpdpsPrivate;
    IdFTP.Passive := True;
    IdFTP.TransferType := ftBinary;
    IdFTP.ConnectTimeout := 30000;

    // Connect
    IdFTP.Connect;
    if IdFTP.Connected then
    begin
      localFile := IncludeTrailingPathDelimiter(rutaApp) + nombreArchivo;
      if FileExists(localFile) then
        DeleteFile(PWideChar(localFile));
      IdFTP.Get(nombreArchivo, localFile, False, False);
      if FileExists(PWideChar(localFile)) then
      begin
        //  Borrarftp(nombreArchivo); //
      end;
      Result := localFile;
    end;
    IdFTP.Disconnect;
  except
    on E: Exception do
      Result := 'Error connecting to FTPS: ' + E.Message;
  end;
  SSLIOHandler.Free;
  IdFTP.Free;
end;

function DesencriptaFile(FInicio: string; keysalsa: string): string;
var
  SalsaEnc: TSalsaEncryption;
  FicheroDesencriptado: string;
  x: Integer;
  ext: string;
begin
  SalsaEnc := TSalsaEncryption.Create(nil);
  // Rutina de encriptacion y borrado
  try
    try
      FicheroDesencriptado := FInicio;
      ext := ExtractFileExt(FicheroDesencriptado);
      FicheroDesencriptado := AnsiReplaceStr(FicheroDesencriptado, ext, '');

      SalsaEnc.keyLength := skl256;
      SalsaEnc.outputFormat := base64url;
      SalsaEnc.Unicode := yesUni;
      SalsaEnc.key := keysalsa;
      SalsaEnc.DecryptFile(FInicio, FicheroDesencriptado);
      Result := FicheroDesencriptado;
    finally
      SalsaEnc.free;
      WipeFile(FInicio);
    end;
  except
    result := 'error';
  end;
end;

/// <summary>TODO: Descripción de RealizarPreguntaSiNo.</summary>
/// <param name="TextoPregunta">TODO.</param>
/// <returns>TODO.</returns>
function RealizarPreguntaSiNo(TextoPregunta: string): Integer;
var
  F: TfrmPreguntaSiNo;
begin
  Result := 0;
  F := TfrmPreguntaSiNo.Create(nil);
  try
    if Assigned(F.lbl_TextoPregunta) then
      F.lbl_TextoPregunta.Text := TextoPregunta;
    if F.ShowModal = mrOk then
      Result := 1;
  finally
    F.Free;
  end;
end;

/// <summary>TODO: Descripción de RestaurarMudanzaSistema.</summary>
/// <returns>TODO.</returns>
function RestaurarMudanzaSistema(): boolean;
begin
  Result := False;
  if PreguntarSiEjecutarMudanza = 1 then
    result := True;
end;

/// <summary>TODO: Descripción de RestaurarBackup.</summary>
/// <returns>TODO.</returns>
function RestaurarBackup(): Boolean;
begin
  Result := False;
  if PreguntarSiRestaurarBackUp() = 1 then
    Result := True;
end;

/// <summary>TODO: Descripción de PrettyJSON.</summary>
/// <param name="JSONStr">TODO.</param>
/// <returns>TODO.</returns>
function PrettyJSON(const JSONStr: string): string;
var
  JSONValue: TJSONValue;
begin
  Result := '';
  JSONValue := TJSONObject.ParseJSONValue(JSONStr);
  if Assigned(JSONValue) then
  try
    Result := JSONValue.Format(2);
  finally
    JSONValue.Free;
  end
  else
    Result := JSONStr;
end;

/// <summary>TODO: Descripción de ActivarLicenciaProducto.</summary>
/// <param name="LicenciaProducto">TODO.</param>
/// <returns>TODO.</returns>
function ActivarLicenciaProducto(LicenciaProducto: string): string;
var
  LClient: TRESTClient;
  LRequest: TRESTRequest;
  LResponse: TRESTResponse;
  LAuth: THTTPBasicAuthenticator;
begin
  LClient := TRESTClient.Create('https://www.giproy.com');
  LAuth := THTTPBasicAuthenticator.Create(Clave_del_Cliente, Clave_Secreta_de_cliente);
  LClient.Authenticator := LAuth;
  LRequest := TRESTRequest.Create(nil);
  LRequest.Client := LClient;
  LResponse := TRESTResponse.Create(nil);
  try
    LRequest.Response := LResponse;
    LRequest.Resource := 'wp-json/lmfwc/v2/licenses/activate/' + LicenciaProducto;
    LRequest.Method := TRESTRequestMethod.rmGET;

    LRequest.Execute;

    if LResponse.StatusCode = 200 then
      Result := PrettyJSON(LResponse.Content)
    else
      Result := 'Error ' + LResponse.StatusCode.ToString + ': ' + LResponse.StatusText;
  finally
    LAuth.Free;
    LRequest.Free;
    LResponse.Free;
    LClient.Free;
  end;
end;

procedure EliminarUsuarioWordPressAsync(const AToken, AEmail: string; const Callback: TProc<Boolean, string>);
begin
  TTask.Run(
    procedure
    var
      HTTP: TNetHTTPClient;
      Resp: IHTTPResponse;
      JSONBody: TStringStream;
      Obj, RespuestaJSON: TJSONObject;
      ResultadoMsg: string;
      Exito: Boolean;
      LCallback: TProc<Boolean, string>;
    begin
      LCallback := Callback; // Copia local del callback
      Exito := False;
      ResultadoMsg := '';

      HTTP := TNetHTTPClient.Create(nil);
      try
        HTTP.ContentType := 'application/json';
        HTTP.Accept := 'application/json';

        Obj := TJSONObject.Create;
        try
          // Construcción del cuerpo JSON esperado por el endpoint
          Obj.AddPair('token', AToken);
          Obj.AddPair('email', AEmail);

          JSONBody := TStringStream.Create(Obj.ToJSON, TEncoding.UTF8);
          try
            try
              // 🔗 Endpoint WP REST API para eliminar usuario
              Resp := HTTP.Post('https://giproy.com/wp-json/miapi/v1/eliminar-usuario', JSONBody);

              if Resp.StatusCode = 200 then
              begin
                try
                  RespuestaJSON := TJSONObject.ParseJSONValue(Resp.ContentAsString) as TJSONObject;
                  if Assigned(RespuestaJSON) then
                  try
                    if RespuestaJSON.TryGetValue<Boolean>('success', Exito) then
                      ResultadoMsg := RespuestaJSON.GetValue<string>('message', Resp.ContentAsString)
                    else
                      ResultadoMsg := 'Respuesta JSON sin campo "success".';
                  finally
                    RespuestaJSON.Free;
                  end;
                except
                  ResultadoMsg := 'Error interpretando la respuesta JSON: ' + Resp.ContentAsString;
                end;
              end
              else
                ResultadoMsg := Format('Error HTTP %d: %s', [Resp.StatusCode, Resp.StatusText]);
            except
              on E: Exception do
                ResultadoMsg := 'Error de conexión: ' + E.Message;
            end;
          finally
            JSONBody.Free;
          end;
        finally
          Obj.Free;
        end;
      finally
        HTTP.Free;
      end;

      // Ejecuta el callback en el hilo principal (seguro para UI)
      TThread.Synchronize(nil,
        procedure
        begin
          if Assigned(LCallback) then
            LCallback(Exito, ResultadoMsg);
        end);
    end);
end;

procedure CrearUsuarioWordPressAsync(const AToken, AUser, APass, AEmail, role: string; Callback: TCrearUsuarioCallback);
begin
  TTask.Run(
    procedure
    var
      HTTP: TNetHTTPClient;
      Resp: IHTTPResponse;
      JSONBody: TStringStream;
      Obj, RespuestaJSON: TJSONObject;
      ResultadoMsg: string;
      Exito: Boolean;
      LCallback: TCrearUsuarioCallback;
    begin
      LCallback := Callback; // guardamos referencia local
      Exito := False;
      ResultadoMsg := '';

      HTTP := TNetHTTPClient.Create(nil);
      try
        HTTP.ContentType := 'application/json';
        HTTP.Accept := 'application/json';

        Obj := TJSONObject.Create;
        try
          Obj.AddPair('token', AToken);
          Obj.AddPair('username', AUser);
          Obj.AddPair('password', APass);
          Obj.AddPair('email', AEmail);
          Obj.AddPair('role', role);

          JSONBody := TStringStream.Create(Obj.ToJSON, TEncoding.UTF8);
          try
            try
              Resp := HTTP.Post('https://giproy.com/wp-json/miapi/v1/crear-usuario', JSONBody);

              if Resp.StatusCode = 200 then
              begin
                try
                  RespuestaJSON := TJSONObject.ParseJSONValue(Resp.ContentAsString) as TJSONObject;
                  if Assigned(RespuestaJSON) then
                  try
                    if RespuestaJSON.TryGetValue<Boolean>('success', Exito) then
                      ResultadoMsg := RespuestaJSON.GetValue<string>('message', Resp.ContentAsString)
                    else
                      ResultadoMsg := 'Respuesta JSON sin campo "success".';
                  finally
                    RespuestaJSON.Free;
                  end;
                except
                  ResultadoMsg := 'Error interpretando la respuesta JSON: ' + Resp.ContentAsString;
                end;
              end
              else
                ResultadoMsg := Format('Error HTTP %d: %s', [Resp.StatusCode, Resp.StatusText]);
            except
              on E: Exception do
                ResultadoMsg := 'Error de conexión: ' + E.Message;
            end;
          finally
            JSONBody.Free;
          end;
        finally
          Obj.Free;
        end;
      finally
        HTTP.Free;
      end;

      // Callback seguro en el hilo principal
      TThread.Synchronize(nil,
        procedure
        begin
          if Assigned(LCallback) then
            LCallback(Exito, ResultadoMsg);
        end);
    end);
end;

function EliminarUsuarioWordPressSync(const AToken, AEmail: string; out AMessage: string): Boolean;
var
  Done: TEvent;
  SuccessLocal: Boolean;
  MsgLocal: string;
begin
  Result := False;
  AMessage := '';
  Done := TEvent.Create(nil, True, False, '');
  try
    EliminarUsuarioWordPressAsync(AToken, AEmail, TProc<Boolean, string>(
      procedure(const Success: Boolean; const Message: string)
      begin
        SuccessLocal := Success;
        MsgLocal := Message;
        Done.SetEvent;
      end));

    if Done.WaitFor(30000) = wrSignaled then
    begin
      Result := SuccessLocal;
      AMessage := MsgLocal;
    end
    else
    begin
      Result := False;
      AMessage := 'Timeout al eliminar usuario en WordPress.';
    end;
  finally
    Done.Free;
  end;
end;

function DarkenColor(const AColor: TAlphaColor; Factor: Single): TAlphaColor;
var
  r, g, b, a: Byte;
begin
  a := TAlphaColorRec(AColor).a;
  r := Round(TAlphaColorRec(AColor).r * Factor);
  g := Round(TAlphaColorRec(AColor).g * Factor);
  b := Round(TAlphaColorRec(AColor).b * Factor);

  Result := (a shl 24) or (r shl 16) or (g shl 8) or b;
end;

/// <summary>TODO: Descripción de comprobarModuloActivo.</summary>
/// <param name="idComplemento">TODO.</param>
/// <returns>TODO.</returns>
function comprobarModuloActivo(idComplemento: Integer): Boolean;
var
  J: TJSONObject;
  Activo: Boolean;
  Conteo: Integer;
  Msg: string;
begin
  Result := False;
  J := nil;
  try
    if (idComplemento <= 0) then
      Exit(False);

    if ComprobarModuloDatos(UrlComprobarModulo, GlobalAuthToken, idComplemento, Activo, Conteo, Msg, J) then
    begin
      Result := Activo;
      // Opcional: usar Conteo / Msg para logging o UI
      // if not Activo then Log('Complemento inactivo: ' + Msg);
    end
    else
      Result := False;
  except
    on E: Exception do
      Result := False;
  end;
  J.Free;
end;


/// <summary>TODO: Descripción de CuentaUsuariosColaboradores.</summary>
/// <returns>TODO.</returns>
function CuentaUsuariosColaboradores(): integer;
var
  qry: TUniQuery;
begin
  Result := 0;
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      connection := dmodule_1.con2;
      close;
      sql.clear;
      {(*}
      sql.Add('SELECT ' + 'count(id) AS Contador ' + 'FROM ' + 'colaboradores '
        + 'WHERE ' + 'estado = 1 ' + 'AND idUsuario = :idUsuario');
        {*)}
      ParamByName('idUsuario').AsInteger := codigo_usuario;
      Prepare;
      ExecSql;
      Result := FieldByName('Contador').AsInteger;
    end;
  finally
    qry.free;
  end;
end;

/// <summary>TODO: Descripción de Actualiza_UsuariosColaborador.</summary>
procedure Actualiza_UsuariosColaborador();
begin
  // Colaboradores
  with dmodule_1.QColaboradores do
  begin
    active := False;
    parambyname('email').asstring := lowercase(ID_usuario);
    execSQL;
    active := True;
  end;
  dmodule_1.ds_Colaboradores.enabled := True;
  frmMain.DataGridDBConnector_Colaboradores.active := True;
  frmMain.DGrid_Colaboradores.columns[0].width := 50;
  frmMain.DGrid_Colaboradores.columns[1].width := 300;
  frmmain.DataGridDBConnector_Colaboradores.Columns[1].Header := 'E-Mail';
  frmMain.DGrid_Colaboradores.columns[2].width := 910;
  frmmain.DataGridDBConnector_Colaboradores.Columns[2].Header := 'Colaborador';

  // Comunicación
  with dmodule_1.QuComunicacion do
  begin
    active := False;
    parambyname('p_idUsuario').AsInteger := codigo_usuario;
    execSQL;
    active := True;
  end;
  dmodule_1.ds_uComunicacion.enabled := True;
  frmMain.DataGridDBConnector_Comunicacion.active := True;
  frmMain.DGrid_Comunicaciones.columns[0].width := 80;
  frmMain.DataGridDBConnector_Comunicacion.Columns[0].Header := 'ID.';
  frmMain.DGrid_Comunicaciones.columns[1].width := 80;
  frmMain.DataGridDBConnector_Comunicacion.Columns[1].Header := 'Tipo';
  frmMain.DataGridDBConnector_Comunicacion.Columns[1].PictureField := True;
  frmMain.DGrid_Comunicaciones.columns[2].width := 340;
  frmMain.DataGridDBConnector_Comunicacion.Columns[2].Header := 'Emisor';
  frmMain.DGrid_Comunicaciones.columns[3].width := 400;
  frmMain.DataGridDBConnector_Comunicacion.Columns[3].Header := 'Descripción';
  frmMain.DGrid_Comunicaciones.columns[4].width := 200;
  frmmain.DataGridDBConnector_Comunicacion.Columns[4].Header := 'F. Emisión';
  frmMain.DGrid_Comunicaciones.columns[5].Width := 120;
  frmMain.DataGridDBConnector_Comunicacion.Columns[5].Header := 'F. Recepción';

  frmMain.DGrid_Comunicaciones.columns[6].Width := 0;
  frmMain.DGrid_Comunicaciones.columns[7].Width := 0;
  frmMain.DGrid_Comunicaciones.columns[8].Width := 0;
  frmMain.DGrid_Comunicaciones.columns[9].Width := 0;
  frmMain.DGrid_Comunicaciones.columns[10].Width := 0;
end;

/// <summary>TODO: Descripción de enviar_invitacion_unirse_giproy.</summary>
/// <param name="email">TODO.</param>
/// <returns>TODO.</returns>
function enviar_invitacion_unirse_giproy(email: string): string;
var
  HTTP: TIdHTTP;
  SSL: TIdSSLIOHandlerSocketOpenSSL;
  Params: TStringList;
  Respuesta: string;
begin
  HTTP := TIdHTTP.Create(nil);
  SSL := TIdSSLIOHandlerSocketOpenSSL.Create(nil);
  Params := TStringList.Create;
  try
    // Configuración del handler SSL
    HTTP.IOHandler := SSL;
    HTTP.Request.ContentType := 'application/x-www-form-urlencoded';
    HTTP.Request.UserAgent := 'DelphiInvitador/1.0';

    // Parámetro POST: el email
    Params.Add('email=' + TNetEncoding.URL.Encode(email));
    Params.add('nombre_emisor' + ID_usuario);

    // Llamada HTTP POST
    Respuesta := HTTP.Post('https://app.62.171.171.124.sslip.io/recover-password-giproy/enviar_invitacion.php', Params);

    // Mostrar respuesta del servidor
    result := 'Servidor dice: ' + Respuesta;
  except
    on E: Exception do
      result := 'Error al enviar invitación: ' + E.Message;
  end;
  // Liberar recursos
  Params.Free;
  SSL.Free;
  HTTP.Free;
end;

/// <summary>TODO: Descripción de guardaConfiguracionDecimales.</summary>
procedure guardaConfiguracionDecimales();
var
  qry: TUniQuery;
  textoQry: string;
  textoQry2: string;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  nDecimalesPresupuesto := strtoint(frmmain.cbb_cfgnDecimales.items[frmMain.cbb_cfgnDecimales.itemindex]);
  nDecimalesMoneda := strtoint(frmmain.cbb_cfgnDecimalesMoneda.items[frmMain.cbb_cfgnDecimalesMoneda.itemindex]);
  {(*}
  textoQry := 'SELECT ' +
              '  id ' +
              'FROM ' +
              '  presupuestos_datosgenerales pd ' +
              'WHERE ' +
              '  pd.codPresupuesto = :codPresupuesto ' +
              '  AND pd.revision = :revision';
    {*)}
  {(*}
  textoQry2 :=  'UPDATE presupuestos_datosgenerales pd ' +
                'SET pd.ndecimales = :nDecimales, ' +
                'pd.ndecimalesMoneda = :nDecimalesMoneda ' +
                'WHERE ' +
                '  pd.codPresupuesto = :codPresupuesto ' +
                '  AND pd.revision = :revision';
    {*)}

  try
    with qry do
    begin
      connection := dmodule_1.con2;
      close;
      sql.clear;
      sql.add(textoQry);
      parambyname('codPresupuesto').asstring := codProyecto;
      parambyname('revision').asinteger := strtoint(Revision);
      Prepare;
      ExecSQL;
      tmpstr := fieldbyname('id').asstring;
      tmpstr := trim(tmpstr);
      if tmpstr <> '' then
      begin
        close;
        sql.clear;
        Sql.add(textoQry2);
        parambyname('nDecimales').asinteger := nDecimalesPresupuesto;
        parambyname('nDecimalesMoneda').asinteger := nDecimalesMoneda;
        parambyname('codPresupuesto').asstring := codProyecto;
        parambyname('revision').asinteger := strtoint(Revision);
        prepare;
        execsql;
      end;
    end;
  finally
    qry.free;
  end;
end;

/// <summary>TODO: Descripción de cargarConfiguracionReportes.</summary>
procedure cargarConfiguracionReportes(); // ???
var
  qry: TUniQuery;
  textoQry: string;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  IniciaCombosConfiguracion();
  {(*}
  textoQry := ' SELECT ' + '      RConstitucionProyecto ' +
    '     ,RAnalisisPrecios ' + '     ,RCronogramaTrabajo ' +
    '     ,RCronogramaValorado ' + '     ,RDesagregacionTecnologica ' +
    '     ,RDesagregacionTecnologicaAPUS ' + '     ,REDTDiccionario ' +
    '     ,REDTListado ' + '     ,REDTValorada ' + '     ,REquipoProyecto ' +
    '     ,RDescomposicionOrganizacion ' + '     ,RFormulaPolinomicas ' +
    '     ,RGestionTiempos ' + '     ,RPorcentajeIndirectos ' +
    '     ,RPresupuestos ' + '     ,RCurvaS ' + ' FROM presupuestos_configreportes '
    + 'WHERE codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
    {*)}
  try
    with qry do
    begin
      connection := dmodule_1.con2;
      close;
      sql.clear;
      sql.add(textoQry);
      Prepare;
      ExecSQL;

      tmpstr := fieldbyname('RConstitucionProyecto').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgActaConstitucion, tmpstr);
      end;
      tmpstr := fieldbyname('RAnalisisPrecios').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgAnalisisPrecios, tmpstr);
      end;
      tmpstr := fieldbyname('RCronogramaTrabajo').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgCronoTrabajo, tmpstr);
      end;
      tmpstr := fieldbyname('RCronogramaValorado').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgCronoValorado, tmpstr);
      end;
      tmpstr := fieldbyname('RDesagregacionTecnologica').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgDesagrecacionTecnologica, tmpstr);
      end;
      tmpstr := fieldbyname('REDTDiccionario').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgEDTDiccionario, tmpstr);
      end;
      tmpstr := fieldbyname('REDTListado').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgEDTListado, tmpstr);
      end;
      tmpstr := fieldbyname('REDTValorada').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgEDTValorada, tmpstr);
      end;
      tmpstr := fieldbyname('REquipoProyecto').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgEquipoProyecto, tmpstr);
      end;
      tmpstr := fieldbyname('RDescomposicionOrganizacion').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgDescomposicionOrganizacion, tmpstr);
      end;
      tmpstr := fieldbyname('RFormulaPolinomicas').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgFormulaPolinomica, tmpstr);
      end;
      tmpstr := fieldbyname('RGestionTiempos').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgGestionTiempos, tmpstr);
      end;
      tmpstr := fieldbyname('RPorcentajeIndirectos').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgPorcentajeIndirecto, tmpstr);
      end;
      tmpstr := fieldbyname('RPresupuestos').asstring;
      if tmpstr <> '' then
      begin
        posicionacombo(frmMain.cbb_cfgPresupuestos, tmpstr);
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de borraConfiguracionReportes.</summary>
procedure borraConfiguracionReportes();
var
  qry: TUniQuery;
  textoQry: string;
begin
  qry := TUniQuery.Create(nil);
  {(*}
  textoQry := '  DELETE ' + 'FROM ' + '  presupuestos_configreportes cr ' +
    'WHERE ' + '  cr.codPresupuesto = :codPresupuesto ' + '  AND cr.Revision = :revision  ';
    {*)}
  try
    with qry do
    begin
      connection := dmodule_1.con2;
      close;
      sql.clear;
      sql.Text := textoQry;
      Prepare;
      ParamByName('codPresupuesto').AsString := frmmain.edt_CodigoPresupuesto1.Text;
      ParamByName('revision').AsInteger := StrToIntDef(frmMain.lbl_RevisionPresupuesto.text, 0);
      ExecSQL;
    end;
  finally
    qry.Free;
  end;

end;

/// <summary>TODO: Descripción de guardarConfiguracionReportes.</summary>
procedure guardarConfiguracionReportes();
var
  qry: TUniQuery;
  textoQry, textoQry2: string;
  tmpstr: string;
begin
  {(*}
  textoQry := 'SELECT ' + '  id ' + 'FROM ' +
    '  presupuestos_datosgenerales pd ' + 'WHERE ' + '  pd.codPresupuesto = :codPresupuesto '
    + '  AND pd.revision = :revision';
    {*)}

  {(*}
  textoQry2 := 'INSERT INTO presupuestos_configreportes ' + '( ' +
    '  codPresupuesto ' + ' ,revision ' + ' ,RConstitucionProyecto ' +
    ' ,RAnalisisPrecios ' + ' ,RCronogramaTrabajo ' + ' ,RCronogramaValorado ' +
    ' ,RDesagregacionTecnologica ' + ' ,RDesagregacionTecnologicaAPUS ' +
    ' ,REDTDiccionario ' + ' ,REDTListado ' + ' ,REDTValorada ' +
    ' ,REquipoProyecto ' + ' ,RDescomposicionOrganizacion ' +
    ' ,RFormulaPolinomicas ' + ' ,RGestionTiempos ' + ' ,RPorcentajeIndirectos '
    + ' ,RPresupuestos ' + ' ,RCurvaS ' + ') ' + 'VALUES ' + '( ' +
    '  :codPresupuesto ' + ' ,:revision ' + ' ,:RConstitucionProyecto ' +
    ' ,:RAnalisisPrecios ' + ' ,:RCronogramaTrabajo ' +
    ' ,:RCronogramaValorado ' + ' ,:RDesagregacionTecnologica ' +
    ' ,:RDesagregacionTecnologicaAPUS ' + ' ,:REDTDiccionario ' +
    ' ,:REDTListado ' + ' ,:REDTValorada ' + ' ,:REquipoProyecto ' +
    ' ,:RDescomposicionOrganizacion ' + ' ,:RFormulaPolinomicas ' +
    ' ,:RGestionTiempos ' + ' ,:RPorcentajeIndirectos ' + ' ,:RPresupuestos ' + ' ,:RCurvaS ' + ')';
    {*)}
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      connection := dmodule_1.con2;
      close;
      sql.clear;
      Sql.text := textoQry;
      ParamByName('codPresupuesto').AsString := frmmain.edt_CodigoPresupuesto1.Text;
      ParamByName('revision').AsInteger := StrToIntDef(frmMain.lbl_RevisionPresupuesto.text, 0);
      Prepare;
      ExecSQL;
      tmpstr := fieldbyname('id').asstring;
      tmpstr := trim(tmpstr);
      if tmpstr <> '' then
      begin
        borraConfiguracionReportes();
        close;
        sql.clear;
        sql.Text := textoQry2;
        Prepare;
        ParamByName('codPresupuesto').AsString := frmmain.edt_CodigoPresupuesto1.Text;
        ParamByName('revision').AsInteger := StrToIntDef(frmMain.lbl_RevisionPresupuesto.text, 0);
        ParamByName('RConstitucionProyecto').AsString := frmMain.cbb_cfgActaConstitucion.Items[frmMain.cbb_cfgActaConstitucion.ItemIndex];
        ParamByName('RAnalisisPrecios').AsString := frmMain.cbb_cfgAnalisisPrecios.Items[frmMain.cbb_cfgAnalisisPrecios.ItemIndex];
        ParamByName('RCronogramaTrabajo').AsString := frmMain.cbb_cfgCronoTrabajo.Items[frmMain.cbb_cfgCronoTrabajo.ItemIndex];
        ParamByName('RCronogramaValorado').AsString := frmMain.cbb_cfgCronoValorado.Items[frmMain.cbb_cfgCronoValorado.ItemIndex];
        ParamByName('RDesagregacionTecnologica').AsString := frmMain.cbb_cfgDesagrecacionTecnologica.Items[frmMain.cbb_cfgDesagrecacionTecnologica.ItemIndex];
        ParamByName('RDesagregacionTecnologicaAPUS').AsString := '001 - VAE APU';
        ParamByName('REDTDiccionario').AsString := frmMain.cbb_cfgEDTDiccionario.Items[frmMain.cbb_cfgEDTDiccionario.ItemIndex];
        ParamByName('REDTListado').AsString := frmMain.cbb_cfgEDTListado.Items[frmMain.cbb_cfgEDTListado.ItemIndex];
        ParamByName('REDTValorada').AsString := frmMain.cbb_cfgEDTValorada.Items[frmMain.cbb_cfgEDTValorada.ItemIndex];
        ParamByName('REquipoProyecto').AsString := frmMain.cbb_cfgEquipoProyecto.Items[frmMain.cbb_cfgEquipoProyecto.ItemIndex];
        ParamByName('RDescomposicionOrganizacion').AsString := frmMain.cbb_cfgDescomposicionOrganizacion.Items[frmMain.cbb_cfgDescomposicionOrganizacion.ItemIndex];
        ParamByName('RFormulaPolinomicas').AsString := frmMain.cbb_cfgFormulaPolinomica.Items[frmMain.cbb_cfgFormulaPolinomica.ItemIndex];
        ParamByName('RGestionTiempos').AsString := frmMain.cbb_cfgGestionTiempos.Items[frmMain.cbb_cfgGestionTiempos.ItemIndex];
        ParamByName('RPorcentajeIndirectos').AsString := frmMain.cbb_cfgPorcentajeIndirecto.Items[frmMain.cbb_cfgPorcentajeIndirecto.ItemIndex];
        ParamByName('RPresupuestos').AsString := frmMain.cbb_cfgPresupuestos.Items[frmMain.cbb_cfgPresupuestos.ItemIndex];
        ParamByName('RCurvaS').AsString := '000 - Curva S';
        ExecSQL;
      end;
    end;
  finally
    qry.Free;
  end;
end;

function ejecutaExportacionReporte(idComplemento: integer; triggerOperacion: string): string;
var
  qry: TUniQuery;
  codValidacionReporte: string;
  Ok: Boolean;
  Json: TJSONObject;
  Restantes: Integer;
begin
  Result := '0';
  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    // 1) Verificar si ya existe un código previo para este usuario + trigger
    qry.Close;
    qry.SQL.Clear;
    qry.SQL.Add('SELECT gr.codValidacionReporte ' + 'FROM gestionexportacionreportes gr ' + 'WHERE gr.TriggerComprobacion = :TriggerComprobacion ' + '  AND gr.idUsuario = :idUsuario ' + 'ORDER BY gr.FechaHoraAdquisicion DESC ' + 'LIMIT 1');
    qry.ParamByName('TriggerComprobacion').AsString := triggerOperacion;
    qry.ParamByName('idUsuario').AsInteger := codIDUSuario;
    qry.Open;

    if not qry.Eof then
      codValidacionReporte := qry.FieldByName('codValidacionReporte').AsString.Trim
    else
      codValidacionReporte := '';

    // 2) Si no hay registro previo, intentar consumir complemento vía API PHP
    if codValidacionReporte = '' then
    begin
      Ok := UtilizarComplementoDatos(GlobalAuthToken, codIDUSuario, idComplemento, codValidacionReporte, Restantes, Json);

      if Assigned(Json) then
        Json.Free;

      // Si el backend devolvió código "0", significa sin saldo o error
      if (not Ok) or (codValidacionReporte = '0') then
        Exit('0');
    end;

    // 3) Si hay código válido, registrar adquisición localmente
    if codValidacionReporte <> '0' then
    begin
      qry.Close;
      qry.SQL.Clear;
      qry.SQL.Add('INSERT INTO gestionexportacionreportes (' + '  codValidacionReporte, idUsuario, idComplemento, TriggerComprobacion, FechaHoraAdquisicion' + ') VALUES (' + '  :codValidacionReporte, :idUsuario, :idComplemento, :TriggerComprobacion, :FechaHoraAdquisicion' + ')');
      qry.ParamByName('codValidacionReporte').AsString := codValidacionReporte;
      qry.ParamByName('idUsuario').AsInteger := codIDUSuario;
      qry.ParamByName('idComplemento').AsInteger := idComplemento;
      qry.ParamByName('TriggerComprobacion').AsString := triggerOperacion;
      qry.ParamByName('FechaHoraAdquisicion').AsDateTime := Now;
      qry.ExecSQL;
    end;

    Result := codValidacionReporte;

  except
    on E: Exception do
    begin
      // Puedes registrar el error si tienes logging
      // LogError('ejecutaExportacionReporte: ' + E.Message);
      Result := '0';
    end;
  end;

  qry.Free;
end;

/// <summary>TODO: Descripción de daCantidadReportesRestantes.</summary>
/// <param name="idComplemento">TODO.</param>
/// <returns>TODO.</returns>
function daCantidadReportesRestantes(idComplemento: Integer): Integer;
var
  Json: TJSONObject;
  Ok: Boolean;
  CantRestante, TotalComprado, TotalUsado: Integer;
begin
  Result := 0;
  try
    // Consulta al endpoint ComplementosSinUsar.php
    Ok := ObtenerComplementosSinUsarDatos(UrlComplementosSinUsar,   // URL definida en tus constantes o config
      GlobalAuthToken,          // token JWT actual
      codIDUsuario,             // usuario actual logueado
      idComplemento,            // complemento que se consulta
      CantRestante, TotalComprado, TotalUsado, Json);

    if Ok then
      Result := CantRestante
    else
      Result := 0;
  except
    on E: Exception do
    begin
      // Manejo tolerante de error, coherente con tu versión previa
      Result := 0;
    end;
  end;
end;

/// <summary>TODO: Descripción de compruebaModeloNegocio.</summary>
/// <param name="Modulo">TODO.</param>
/// <returns>TODO.</returns>
function compruebaModeloNegocio(Modulo: integer): boolean;
begin
  Result := True;
  case Modulo of
    1: // Importar APUS
      begin
        if LowerCase(TUsuario) = LowerCase('Expres') then
          Result := False;
      end;
    2: // Cronogramas
      begin
        if LowerCase(TUsuario) = LowerCase('Expres') then
          Result := False;
      end;
    3: // Desagregacion
      begin
        if LowerCase(TUsuario) = LowerCase('Expres') then
          Result := False;
      end;
    4: // Formula Polinomica
      begin
        if LowerCase(TUsuario) = LowerCase('Expres') then
          Result := False;
      end;
  end;
end;

procedure RegistraLogUsuario(const tIDUsuario, tipoEntrada: Integer; out tmpstr: string);
var
  Json: TJSONObject;
  Ok: Boolean;
begin
  tmpstr := '';
  Json := nil;
  Ok := False;
  try
    try
      if tIDUsuario <= 0 then
        raise Exception.Create('tIDUsuario debe ser > 0');

      if (tipoEntrada <> 1) and (tipoEntrada <> 2) then
        raise Exception.Create('tipoEntrada inválido (use 1=login, 2=logout)');

      if UrlLogEntrada.Trim = '' then
        raise Exception.Create('UrlLogEntrada no configurada');

      if GlobalAuthToken.Trim = '' then
        raise Exception.Create('GlobalAuthToken no configurado');

      case tipoEntrada of
        1:
          Ok := RegistrarLoginUsuario(UrlLogEntrada, GlobalAuthToken, tIDUsuario, Json);
        2:
          Ok := RegistrarLogoutUsuario(UrlLogEntrada, GlobalAuthToken, tIDUsuario, Json);
      end;

      if Ok and (Json <> nil) then
        tmpstr := Format('OK. filas=%d, ms=%d, ip=%s', [Json.GetValue<Integer>('rows_affected', 0), Json.GetValue<Integer>('elapsed_ms', -1), Json.GetValue<string>('ip', '')])
      else if Json <> nil then
        tmpstr := 'La API respondió ok=false: ' + Json.GetValue<string>('message', 'Error');

    except
      on E: EApiException do
        tmpstr := Format('Error API (HTTP %d): %s', [E.StatusCode, E.Message]);
      on E: Exception do
        tmpstr := 'Error inesperado: ' + E.Message;
    end;
  finally
    Json.Free;
  end;
end;

/// <summary>TODO: Descripción de daValorParametro.</summary>
/// <param name="idParametro">TODO.</param>
/// <returns>TODO.</returns>
function daValorParametro(idParametro: integer): string;
begin
  DModule_1.QDaParametro.close;
  DModule_1.QDaParametro.ParamByName('idParametros').AsInteger := idParametro;
  Dmodule_1.QDaParametro.Open;
  result := DModule_1.QDaParametroValor.AsString.trim;
end;

/// <summary>TODO: Descripción de compruebaCodigoIndiceRepetido.</summary>
/// <param name="codigoIndice">TODO.</param>
/// <returns>TODO.</returns>
function compruebaCodigoIndiceRepetido(codigoIndice: string): Boolean;
var
  x: integer;
  encontrado: Boolean;
  codActual: string;
begin
  encontrado := False;
  x := 1;
  while (not encontrado) and (x < frmMain.grid_FpolCuadrillaTipo.RowCount) do
  begin
    codActual := frmMain.grid_FpolCuadrillaTipo.cells[2, x];
    if codActual = codigoIndice then
      encontrado := True;
    inc(x);
  end;
  Result := encontrado;
end;

/// <summary>TODO: Descripción de muestrarecursosDesagregacion.</summary>
/// <param name="codigo">TODO.</param>
procedure muestrarecursosDesagregacion(codigo: Integer);
begin
  resalta_desgPanelCategoria(codigo);
  verRecursoDesagregacion(codigo);
end;

/// <summary>TODO: Descripción de compruebatodoFpolinomica.</summary>
/// <returns>TODO.</returns>
function compruebatodoFpolinomica(): Boolean;
var
  datos: string;
  valor: Integer;
begin
  result := False;
  datos := frmmain.lbl_RecursosPorAsignar.text;
  datos := AnsiReplaceStr(datos, 'Recursos por Asignar:', '').Trim;
  valor := StrToIntDef(datos, -1);
  if valor = 0 then
    Result := True;
end;

/// <summary>TODO: Descripción de compruebaTodoCPC.</summary>
/// <returns>TODO.</returns>
function compruebaTodoCPC(): boolean;
var
  x: integer;
  codApu: string;
begin
  result := True;
  with DModule_1.QAPU do
  begin
    for x := 1 to frmMain.grid_DesagregacionAPUS.RowCount - 1 do
    begin
      if Result then
      begin
        codApu := frmMain.grid_DesagregacionAPUS.cells[11, x];
        if codApu <> '' then
        begin
          close;
          parambyname('codBase').AsString := base_activa.codBase;
          ParamByName('codApu').AsString := codApu;
          Prepare;
          Execute;
          if FieldByName('codCPC').AsString.Trim = '' then
          begin
            result := False;
          end;
        end;
      end;
    end;
  end;
end;

function forzarNdecimales(Valor: double; nDecimales: integer): string;
var
  x: integer;
  cadenaDecimales: string;
begin
  cadenaDecimales := '';
  for x := 1 to nDecimales - 1 do
    cadenaDecimales := cadenaDecimales + '#';
  cadenaDecimales := '0.' + cadenaDecimales + '0';
  result := FormatFloat(cadenaDecimales, Valor);
end;

/// <summary>TODO: Descripción de actualizaRolgridStake.</summary>
/// <param name="IdUnico">TODO.</param>
/// <param name="newRolStake">TODO.</param>
procedure actualizaRolgridStake(IdUnico, newRolStake: string);
var
  res: TPoint;
begin
  res := frmMain.grid_stakesAsignados.FindFirst(IdUnico, []);
  frmmain.grid_stakesAsignados.cells[res.x - 1, res.Y] := newRolStake;
end;

/// <summary>TODO: Descripción de borraStakeHolder.</summary>
/// <param name="idStake">TODO.</param>
procedure borraStakeHolder(idStake: string);
var
  qry: TUniQuery;
begin
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('delete from stakeholders where idFiscal=:idFiscal');
      ParamByName('idFiscal').AsString := idStake;
      ExecSQL;
    end;
  finally
    qry.free;
  end;
end;

function IsControlKeyPressed: Boolean;
begin
  Result := GetKeyState(VK_CONTROL) < 0;
end;

function IsShiftKeyPressed: Boolean;
begin
  Result := GetKeyState(VK_SHIFT) < 0;
end;

procedure ajustaPorcentajeItems(totalTanteo: double; modo: integer);
var
  nodo: TTMSFNCTreeViewNode;
  sumaResilente: double;
  valorSubtotal: double;
  valorPorcentaje: double;
begin
  case modo of
    1:
      begin
        nodo := frmMain.Trvw_APUSTanteo.Nodes[0];
      end;
    2:
      begin
        nodo := frmMain.Trvw_TanteoCrono.Nodes[0];
      end;
  end;

  sumaResilente := 0;
  while Assigned(nodo) do
  begin
    if nodo.Text[6] <> '' then
    begin
      valorSubtotal := quitaFormatFloat(nodo.Text[6]);
      valorPorcentaje := (100 * valorSubtotal) / totalTanteo;
      sumaResilente := sumaResilente + valorPorcentaje;
      nodo.Text[7] := FloatToStr(valorPorcentaje) + ' %';
    end;
    nodo := nodo.GetNext;
  end;
  nodo := frmMain.Trvw_APUSTanteo.GetLastNode;
  sumaResilente := 100 - sumaResilente;
  if sumaResilente > 0 then
  begin
    valorPorcentaje := StrToFloat(ReplaceStr(nodo.Text[7], ' %', ''));
    valorPorcentaje := valorPorcentaje + sumaResilente;
    nodo.Text[7] := FloatToStr(valorPorcentaje) + ' %';
  end;
end;

/// <summary>TODO: Descripción de ejecutaCronoDerivaciones.</summary>
procedure ejecutaCronoDerivaciones();
var
  derivacionCompleta: integer;
begin
  // Revisar todas las rutinas
  frm_CronoDerivaciones.grid_DefDerivacion.StopEdit;
  frm_CronoDerivaciones.actualizaDerivacion;
  guardarDatosDerivacion;
  derivacionCompleta := faltaDatosDerivacion;
  if cantidadCronoDerivaciones > 0 then
  begin
    limpiagridCrono(frmmain.grid_Crono1);
    calcularPorCentajeEjecucionObras(); // crono1
    limpiagridCrono(frmmain.grid_Crono2);
    limpiagridCrono(frmmain.grid_CronoTotales);
    calcularInversion(); // crono2   y Gbarras
    limpiagridCrono(frmmain.grid_Crono3);
    calcularCantidadesObras(); // crono3
    frmmain.tbc1.ActiveTab := frmmain.tab_1;
    frmmain.grid_Crono1.SetFocus;
    SeleccionaTabCrono(1);
    cancelarDerivacion := frmmain.cbb_cronoTipoPeriodo.items[frmmain.cbb_cronoTipoPeriodo.ItemIndex] + ',' + frmmain.lbl_cronogramaNPeriodos.Text;
    if derivacionCompleta = 0 then
      AjustaCurvaS();
    sincronizaTamanoGrid(frmMain.grid_Crono1, frmMain.grid_CronoTotales);
    sincronizaTamanoGrid(frmmain.grid_crono1, frmMain.grid_crono2);
    sincronizaTamanoGrid(frmMain.grid_Crono1, frmmain.grid_crono3);
    sincronizaTamanoGrid(frmmain.grid_Crono1, frmmain.grid_GBarras);
    frmMain.grid_CronoTotales.ColumnCount := frmMain.grid_CronoTotales.ColumnCount - 1;
  end;
end;

/// <summary>TODO: Descripción de iniciaTanteoCrono.</summary>
procedure iniciaTanteoCrono();
var
  nodo: TTMSFNCTreeViewNode;
begin
  frmMain.trvw_TanteoCrono.ClearNodes;
  nodo := frmmain.trvw_TanteoCrono.addnode;
  nodo.Text[0] := 'Equipos y Herramientas';
  nodo.Extended := true;
  nodo := frmmain.trvw_TanteoCrono.addnode;
  nodo.Text[0] := 'Materiales';
  nodo.Extended := True;
  nodo := frmmain.trvw_TanteoCrono.addnode;
  nodo.Text[0] := 'Transporte';
  nodo.Extended := True;
  nodo := frmmain.trvw_TanteoCrono.addnode;
  nodo.Text[0] := 'Mano de Obra';
  nodo.Extended := True;
end;

/// <summary>TODO: Descripción de crearCadenacurrency.</summary>
procedure crearCadenacurrency();
var
  x: Integer;
  settings: TFormatSettings;
begin
  {
      0   = Before amount
      1   = After amount
      2   = Before amount with space
      3   = After amount with space
  }
  // $ #,###0.00
  cadenaCurrency := '';
  for x := 1 to ndecimalesMoneda do
    cadenaCurrency := cadenaCurrency + '0';
  cadenaCurrency := '0.' + cadenaCurrency;
  cadenaCurrency := '#,###' + cadenaCurrency;

  if base_activa.simboloMoneda <> '' then
  begin
    if base_activa.simboloMoneda = '$' then
      cadenaCurrency := (base_activa.simboloMoneda + ' ' + cadenaCurrency).trim
    else
      cadenaCurrency := (cadenaCurrency + ' ' + base_activa.simboloMoneda).trim;
  end
  else
  begin
    base_activa.simboloMoneda := '$';
    cadenaCurrency := (base_activa.simboloMoneda + ' ' + cadenaCurrency).trim
  end;
end;

/// <summary>TODO: Descripción de crearCadenaDecimales.</summary>
procedure crearCadenaDecimales();
var
  x: integer;
begin
  cadenaDecimales := '';
  for x := 1 to ndecimalesPresupuesto do
    cadenaDecimales := cadenaDecimales + '0';
  cadenaDecimales := '0.' + cadenaDecimales;
  cadenaDecimales := '#,###' + cadenaDecimales;
end;

/// <summary>TODO: Descripción de Porcentaje.</summary>
/// <param name="Valor">TODO.</param>
/// <param name="porcentaje">TODO.</param>
/// <returns>TODO.</returns>
function Porcentaje(Valor, porcentaje: Double): double;
begin
  try
    Result := (Valor * porcentaje) / 100;
  except

    result := 0;
  end;
end;

/// <summary>TODO: Descripción de actualizaLineaPresupuestoItemsDB.</summary>
/// <param name="codAPU">TODO.</param>
procedure actualizaLineaPresupuestoItemsDB(codAPU: string);
var
  SQLText: string;
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  SQLText := 'UPDATE presupuestos_items presupuesto ' + 'LEFT JOIN apus apu ON ( apu.codBase = presupuesto.codBase AND apu.CodAPU = presupuesto.CodAPU ) ' + 'LEFT JOIN presupuestos_datosgenerales datos ON ( datos.codBase = presupuesto.codBase AND datos.codPresupuesto = presupuesto.codPresupuesto AND datos.revision = presupuesto.revision ) ' + 'LEFT JOIN presupuestos_tanteo_apus tanteo ON (' + '  tanteo.codBase = presupuesto.codBase ' + '  AND tanteo.codPresupuesto = presupuesto.codPresupuesto ' +
    '  AND tanteo.revision = presupuesto.revision ' + '  AND tanteo.CodAPU = presupuesto.codAPU ' + ') ' + 'SET presupuesto.PUnitario = (' + '                              (IF ( tanteo.CostoDirectoTotal IS NULL, apu.CostoDirectoTotal, tanteo.CostoDirectoTotal )) + ' + '                              (( ( IF ( tanteo.CostoDirectoTotal IS NULL, apu.CostoDirectoTotal, tanteo.CostoDirectoTotal )) * datos.indirectos )/ 100 )' + '    ),' + '  presupuesto.Ptotal := presupuesto.PUnitario * presupuesto.cantidad ' + 'WHERE presupuesto.codAPU = :CodAPU ' + '  AND presupuesto.codPresupuesto = :codPresupuesto  AND presupuesto.codBase = :codBase ' + '  AND presupuesto.revision = :revision';
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      SQL.Clear;
      sql.Add(SQLText);
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codAPU').AsString := codAPU;
      Prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de LimpiaDBHuerfanas.</summary>
procedure LimpiaDBHuerfanas();
var
  qry: TUniQuery;
  SQLText: TStringList;
  tmpstr: string;
  baseHuerfana: string;
  x: integer;
begin
  if codProyecto <> '' then
  begin
    qry := TUniQuery.Create(nil);
    SQLText := TStringList.Create;
    {(*}
    SQLText.Add('SELECT ' + '  codBase' + 'FROM' + '  bases' + 'WHERE' +
      '  presupuestoAsignado = :PresupuestoAsignado');
      {*)}
    SQLText.Add('delete from apus where codBase=:codbase');
    SQLText.Add('delete from apus_items where codBase=:codbase');
    SQLText.Add('delete from recursos where codBase=:codBase');
    SQLText.Add('delete from bases where codBase=:codBase');
    SQLText.Add('delete from categoriaapus where codBase=:codBase');
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        SQL.Clear;
        sql.Add(SQLText[0]);
        ParamByName('presupuestoAsignado').AsString := codProyecto;
        Prepare;
        ExecSQL;
        baseHuerfana := FieldByName('codBase').AsString;
        if baseHuerfana <> '' then
        begin
          for x := 1 to SQLText.Count - 1 do
          begin
            Close;
            SQL.Clear;
            tmpstr := SQLText[x];
            sql.Add(tmpstr);
            ParamByName('codBase').AsString := baseHuerfana;
            Prepare;
            ExecSQL;
          end;
        end;
      end;
    finally
      qry.Free;
    end;
  end;
end;

/// <summary>TODO: Descripción de darendimientoHUnidad.</summary>
/// <param name="codAPU">TODO.</param>
/// <returns>TODO.</returns>
function darendimientoHUnidad(codAPU: string): Double;
var
  SQLText: string;
  qry: TUniQuery;
  tmpstr: string;
begin
  result := 0;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      SQL.Clear;
      {(*}
      SQLText := 'SELECT ' +
        '  redondea (sum(tanteo.Rendimiento * tanteo.CantidadUnidad), dg.ndecimalesMoneda) AS nhunidad ' +
        'FROM ' + '  presupuestos_tanteo_recursos tanteo ' +
        '  INNER JOIN apus_items items ON (items.CodAPU = tanteo.CodAPU AND items.idUnicoRecurso = tanteo.idUnicoRecurso AND items.codBase = tanteo.codBase) ' +
        '  INNER JOIN presupuestos_datosgenerales dg ON dg.codBase = tanteo.codBase ' +
        '  AND dg.codPresupuesto = tanteo.codPresupuesto ' +
        '  AND dg.revision = tanteo.revision ' + 'WHERE ' +
        '  tanteo.CodAPU = :codAPU ' + '  AND tanteo.codBase = :codBase ' +
        '  AND tanteo.codPresupuesto = :codPresupuesto ' +
        '  AND tanteo.revision = :revision ' + '  AND items.CodCategoria = 4 ' +
        'GROUP BY ' + '  tanteo.Rendimiento, ' + '  tanteo.CantidadUnidad, ' + '  dg.ndecimalesMoneda';
        {*)}
      sql.Add(SQLText);
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codAPU').AsString := codAPU;
      Prepare;
      ExecSQL;
      tmpstr := decimal_correcto(FieldByName('nhunidad').AsString);
      Result := StrToFloatDef(tmpstr, 0);
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de daNHcuardillas.</summary>
/// <param name="codAPU">TODO.</param>
/// <returns>TODO.</returns>
function daNHcuardillas(codAPU: string): Integer;
var
  SQLText: string;
  qry: TUniQuery;
  tmpstr: string;
  calculos: Integer;
begin
  result := 0;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      SQL.Clear;
      {(*}
      SQLText := 'SELECT ' + '  items.Descripcion, ' + '  IF( ' +
        '    tanteo.CodAPU IS NULL, ' + '    Redondea (items.CantidadUnidad, dg.ndecimalesMoneda), '
        + '    redondea (tanteo.CantidadUnidad, dg.ndecimalesMoneda) ' +
        '  ) AS CantidadUnidad ' + 'FROM ' + '  apus_items items ' +
        '  LEFT JOIN presupuestos_tanteo_recursos tanteo ON ( ' +
        '    tanteo.CodAPU = items.CodAPU ' + '    AND tanteo.codBase = items.codBase '
        + '    AND tanteo.codPresupuesto = :codPresupuesto ' +
        '    AND tanteo.revision = :revision ' + '    AND tanteo.idUnicoRecurso = items.idUnicoRecurso '
        + '  ) ' +
        '  INNER JOIN presupuestos_datosgenerales dg ON dg.codBase = items.codBase ' + '  AND dg.codPresupuesto = tanteo.codPresupuesto '
        + '  AND dg.revision = tanteo.revision ' + 'WHERE ' +
        '  items.CodAPU = :codAPU ' + '  AND items.codBase = :codBase ' + '  AND items.CodCategoria = 4';
        {*)}
      sql.Add(SQLText);
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codAPU').AsString := codAPU;
      Prepare;
      ExecSQL;
      calculos := 0;
      while not Eof do
      begin
        tmpstr := FieldByName('CantidadUnidad').AsString;
        calculos := calculos + StrToIntDef(tmpstr, 0);
        Next;
      end;
      Result := calculos;
    end;
  finally
    qry.Free;
  end;
end;

procedure LimpiaTanteoDB(codAPU: string; Modo: Integer);
var
  qry: TUniQuery;
  x: Integer;
  SQLText: string;
  costoDirectoAPU: Double;
  tmpstr: string;
  PpresupuestoIndirectos: Double;
  cantidad_presupuesto: Double;
  totalLinea: Double;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      SQL.Clear;
      sql.Add('delete from presupuestos_Tanteo_Apus where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision and codAPU=:codAPU');
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codAPU').AsString := codAPU;
      Prepare;
      ExecSQL;

      close;
      sql.Clear;
      sql.Add('delete from presupuestos_Tanteo_Recursos where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision and codAPU=:codAPU');
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codAPU').AsString := codAPU;
      Prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
    restaurarApuTanteo(codAPU, Modo);
  end;
end;

/// <summary>TODO: Descripción de LimpiaTanteoTodaDB.</summary>
procedure LimpiaTanteoTodaDB();
var
  qry: TUniQuery;
  x: Integer;
  codAPU: string;
  SQLText: string;
  costoDirectoAPU: Double;
  tmpstr: string;
  PpresupuestoIndirectos: Double;
  cantidad_presupuesto: Double;
  totalLinea: Double;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      SQL.Clear;
      sql.Add('delete from presupuestos_Tanteo_Apus where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision');
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      Close;
      SQL.Clear;
      sql.Add('delete from presupuestos_Tanteo_Apus_bkp where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision');
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;

      close;
      sql.Clear;
      sql.Add('delete from presupuestos_Tanteo_Recursos where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision');
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      close;
      sql.Clear;
      sql.Add('delete from presupuestos_Tanteo_Recursos_bkp where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision');
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
    DMPresupuesto.calculaTotal;
  end;
end;

procedure cargaCabeceraTanteoAPUS(codAPU: string; modo: Integer);
begin
  with DMPresupuesto.QTanteoAPUS do
  begin
    ParamByName('codBase').asstring := base_activa.codBase;
    ParamByName('codPresupuesto').AsString := codProyecto;
    ParamByName('revision').AsString := revision;
    ParamByName('codAPU').AsString := codAPU;
    ExecSQL;
  end;
  case modo of
    1:
      begin
        frmmain.edt_EditApuDescripcion.text := DMPresupuesto.QTanteoAPUSdescripcion.AsString;
        if frmMain.edt_EditApuDescripcion.text = '' then
        begin
          frmMain.edt_EditApuDescripcion.text := DMPresupuesto.QTPresupuestosItemsdescripcion.AsString;
          frmMain.edt_EditAPUUnidad.text := DMPresupuesto.QTPresupuestosItemsunidad.AsString;
          frmMain.lbl_TanteoCostoDirecto.text := FormatFloat(cadenaCurrency, 0);
          frmMain.lbl_TanteoCostoIndirecto.text := FormatFloat(cadenaCurrency, 0);
          frmMain.lbl_TanteoTotal.text := FormatFloat(cadenaCurrency, 0);
        end
        else
        begin
          frmMain.edt_EditAPUUnidad.text := DMPresupuesto.QTanteoAPUSunidad.AsString;
          frmMain.lbl_TanteoCostoDirecto.text := FormatFloat(cadenaCurrency, DMPresupuesto.QTanteoAPUScostodirectototal.AsFloat);
          frmMain.lbl_TanteoCostoIndirecto.text := FormatFloat(cadenaCurrency, DMPresupuesto.QTanteoAPUScostoindirectototal.AsFloat);
          frmMain.lbl_TanteoTotal.text := FormatFloat(cadenaCurrency, DMPresupuesto.QTanteoAPUSpreciounitariototal.AsFloat);
        end;
      end;
    2:
      begin
        frmMain.edt_TanteoCronoDescripcion.text := DMPresupuesto.QTanteoRecursoAPUSdescripcion.AsString;
        if frmMain.edt_TanteoCronoDescripcion.Text = '' then
        begin
          frmMain.edt_TanteoCronoUnidad.Text := DMPresupuesto.QTPresupuestosItemsunidad.AsString;
          frmmain.lbl_TanteoCronoCostoDirecto.Text := FormatFloat(cadenaCurrency, 0);
          frmMain.lbl_TanteoCronoCostoIndirecto.Text := FormatFloat(cadenaCurrency, 0);
          frmmain.lbl_TanteoCronoTotal.Text := FormatFloat(cadenaCurrency, 0);
        end
        else
        begin
          frmMain.edt_TanteoCronoUnidad.Text := DMPresupuesto.QTanteoAPUSunidad.AsString;
          frmMain.lbl_TanteoCostoDirecto.Text := FormatFloat(cadenaCurrency, DMPresupuesto.QTanteoAPUScostodirectototal.AsFloat);
          frmMain.lbl_TanteoCronoCostoIndirecto.Text := FormatFloat(cadenaCurrency, DMPresupuesto.QTanteoAPUScostoindirectototal.AsFloat);
          frmMain.lbl_TanteoCronoTotal.Text := FormatFloat(cadenaCurrency, DMPresupuesto.QTanteoAPUSpreciounitariototal.AsFloat);
        end;
      end;
  end;
end;

procedure restaurarApuTanteo(codAPU: string; modo: integer);
var
  nodo: TTMSFNCTreeViewNode;
  subtotal: Double;
  porcentajeIndirectos: double;
  indirectos: Double;
  total: double;
  tamanoTotal: double;
  tamanoDescripcion: double;
begin
  {modo  1:Tanteo de Presupuesto, 2:Tanteo de Cronogramas}
  tantear := False;
  DMPresupuesto.tanteoBackUpInicial(codAPU);
  cargaCabeceraTanteoAPUS(codAPU, modo);
  with DMPresupuesto.QTanteoRecursoAPUS do
  begin
    ParamByName('codBase').asstring := base_activa.codBase;
    ParamByName('codPresupuesto').AsString := codProyecto;
    ParamByName('revision').AsString := revision;
    ParamByName('codAPU').AsString := codAPU;
    ExecSQL;
    First;
    subtotal := 0;
    while not Eof do
    begin
      case modo of
        1:
          begin
            tamanoTotal := frmMain.Trvw_APUSTanteo.Width;
            nodo := frmMain.Trvw_APUSTanteo.AddNode(frmmain.Trvw_APUSTanteo.nodes[DMPresupuesto.QTanteoRecursoAPUSCodCategoria.AsInteger - 1]);
          end;
        2:
          begin
            tamanoTotal := frmmain.Trvw_TanteoCrono.Width;
            nodo := frmmain.Trvw_TanteoCrono.AddNode(frmmain.Trvw_TanteoCrono.Nodes[DMPresupuesto.QTanteoRecursoAPUSCodCategoria.AsInteger - 1]);
          end;
      end;
      nodo.text[0] := DMPresupuesto.QTanteoRecursoAPUScodRecursoCompleto.asstring;
      nodo.Text[1] := DMPresupuesto.QTanteoRecursoAPUSdescripcion.AsString;
      nodo.text[2] := DMPresupuesto.QTanteoRecursoAPUSunidad.AsString;
      nodo.text[3] := DMPresupuesto.QTanteoRecursoAPUSCantidadUnidad.AsString;
      nodo.text[4] := FormatFloat(cadenaCurrency, DMPresupuesto.QTanteoRecursoAPUSPrecio.AsFloat);
      if DMPresupuesto.QTanteoRecursoAPUSCodCategoria.AsInteger <> 2 then
      begin
        nodo.text[5] := DMPresupuesto.QTanteoRecursoAPUSRendimiento.AsString;
      end
      else
      begin
        nodo.text[5] := '';
      end;
      nodo.text[6] := FormatFloat(cadenaCurrency, DMPresupuesto.QTanteoRecursoAPUSTotal.AsFloat);
      subtotal := subtotal + DMPresupuesto.QTanteoRecursoAPUSTotal.AsFloat;
      nodo.text[7] := '%';
      nodo.text[8] := DMPresupuesto.QTanteoRecursoAPUSidunicorecurso.AsString;
      Next;
    end;
  end;

  porcentajeIndirectos := base_activa.indirectos;
  indirectos := (subtotal * porcentajeIndirectos) / 100;
  total := subtotal + indirectos;
  case modo of
    1:
      begin
        tamanoDescripcion := tamanoTotal - 690;
        frmmain.Trvw_APUSTanteo.Columns[0].Width := 150;
        frmMain.Trvw_APUSTanteo.Columns[1].width := tamanoDescripcion;
        frmmain.Trvw_APUSTanteo.columns[2].Width := 90;
        frmmain.Trvw_APUSTanteo.columns[3].Width := 90;
        frmmain.Trvw_APUSTanteo.columns[4].Width := 90;
        frmmain.Trvw_APUSTanteo.columns[5].Width := 90;
        frmmain.Trvw_APUSTanteo.columns[6].Width := 90;
        frmmain.Trvw_APUSTanteo.columns[7].Width := 90;
        frmmain.Trvw_APUSTanteo.columns[8].Width := 0;
        frmMain.Trvw_APUSTanteo.Columns[8].Visible := False;

        frmMain.Trvw_APUSTanteo.ExpandAll;

        frmMain.lbl_TanteoCostoDirecto.Text := FormatFloat(cadenaCurrency, subtotal);
        frmMain.lbl_TanteoCostoIndirecto.text := FormatFloat(cadenaCurrency, indirectos);
        frmmain.lbl_TanteoTotal.Text := FormatFloat(cadenaCurrency, total);
        ajustaPorcentajeItems(subtotal, 1);
      end;
    2:
      begin
        tamanoDescripcion := tamanoTotal - 690;
        frmmain.Trvw_TanteoCrono.Columns[0].Width := 150;
        frmMain.Trvw_TanteoCrono.Columns[1].width := tamanoDescripcion;
        frmmain.Trvw_TanteoCrono.columns[2].Width := 90;
        frmmain.Trvw_TanteoCrono.columns[3].Width := 90;
        frmmain.Trvw_TanteoCrono.columns[4].Width := 90;
        frmmain.Trvw_TanteoCrono.columns[5].Width := 90;
        frmmain.Trvw_TanteoCrono.columns[6].Width := 90;
        frmmain.Trvw_TanteoCrono.columns[7].Width := 90;
        frmmain.Trvw_TanteoCrono.columns[8].Width := 0;
        frmMain.Trvw_TanteoCrono.Columns[8].Visible := False;

        frmMain.Trvw_TanteoCrono.ExpandAll;

        frmMain.lbl_TanteoCronoCostoDirecto.text := FormatFloat(cadenaCurrency, subtotal);
        frmMain.lbl_TanteoCronoCostoIndirecto.text := FormatFloat(cadenaCurrency, indirectos);
        frmmain.lbl_TanteoCronoTotal.Text := FormatFloat(cadenaCurrency, total);
        ajustaPorcentajeItems(subtotal, 2);
      end;
  end;
end;

/// <summary>TODO: Descripción de iniciaTreeViewTanteo.</summary>
procedure iniciaTreeViewTanteo();
var
  nodo: TTMSFNCTreeViewNode;
begin
  frmMain.Trvw_APUSTanteo.ClearNodes;
  nodo := frmMain.Trvw_APUSTanteo.addnode;
  nodo.Text[0] := 'Equipos y Herramientas';
  nodo.Extended := true;
  nodo := frmMain.Trvw_APUSTanteo.AddNode;
  nodo.Text[0] := 'Materiales';
  nodo.Extended := True;
  nodo := frmMain.Trvw_APUSTanteo.AddNode;
  nodo.Text[0] := 'Transporte';
  nodo.Extended := True;
  nodo := frmMain.Trvw_APUSTanteo.AddNode;
  nodo.Text[0] := 'Mano de Obra';
  nodo.Extended := True;
end;

/// <summary>TODO: Descripción de IsRunnig.</summary>
/// <param name="FicheroExe">TODO.</param>
/// <returns>TODO.</returns>
function IsRunnig(FicheroExe: string): boolean;
var
  ContinueLoop: BOOL;
  FSnapshotHandle: THandle;
  FProcessEntry32: TProcessEntry32;
begin
  result := False;
  FicheroExe := extractfilename(FicheroExe);
  FSnapshotHandle := CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
  FProcessEntry32.dwSize := SizeOf(FProcessEntry32);
  ContinueLoop := Process32First(FSnapshotHandle, FProcessEntry32);
  Result := False;
  while Integer(ContinueLoop) <> 0 do
  begin
    if ((UpperCase(ExtractFileName(FProcessEntry32.szExeFile)) = UpperCase(FicheroExe)) or (UpperCase(FProcessEntry32.szExeFile) = UpperCase(FicheroExe))) then
    begin
      Result := True;
    end;
    ContinueLoop := Process32Next(FSnapshotHandle, FProcessEntry32);
  end;
  CloseHandle(FSnapshotHandle);
end;

/// <summary>TODO: Descripción de deltree.</summary>
/// <param name="FileName">TODO.</param>
/// <returns>TODO.</returns>
function deltree(const FileName: string): Boolean;
var
  Path: string;
  SearchRec: TSearchRec;

  /// <summary>TODO: Descripción de RemoveDirectory.</summary>
  /// <param name="Dir">TODO.</param>

  procedure RemoveDirectory(const Dir: string);
  var
    SearchRec: TSearchRec;
  begin
    if FindFirst(Dir + '\*', faAnyFile, SearchRec) = 0 then
    begin
      try
        repeat
          if (SearchRec.Attr and faDirectory) = faDirectory then
          begin
            if (SearchRec.Name <> '.') and (SearchRec.Name <> '..') then
              RemoveDirectory(Dir + '\' + SearchRec.Name)
          end
          else
            System.SysUtils.DeleteFile(Dir + '\' + SearchRec.Name);
        until FindNext(SearchRec) <> 0;
      finally
        System.SysUtils.FindClose(SearchRec);
      end;
    end;
    RemoveDir(Dir);
  end;

begin
  result := True;
  try
    if DirectoryExists(FileName) then
      RemoveDirectory(FileName)
    else if FindFirst(FileName, faAnyFile, SearchRec) = 0 then
    begin
      repeat
        if (SearchRec.Name = '.') or (SearchRec.Name = '..') then
          Continue;

        Path := ExtractFilePath(FileName) + '\' + SearchRec.Name;
        if DirectoryExists(Path) then
          RemoveDirectory(Path)
        else
          System.SysUtils.DeleteFile(Path);
      until FindNext(SearchRec) <> 0;

      System.SysUtils.FindClose(SearchRec);
    end;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de IniciaCombosConfiguracion.</summary>
procedure IniciaCombosConfiguracion();
begin
  cumplimentaComboConfiguracion(frmMain.cbb_cfgActaConstitucion);
  cumplimentaComboConfiguracion(frmmain.cbb_cfgAnalisisPrecios);
  cumplimentaComboConfiguracion(frmMain.cbb_cfgCronoTrabajo);
  cumplimentaComboConfiguracion(frmMain.cbb_cfgCronoValorado);
  cumplimentaComboConfiguracion(frmMain.cbb_cfgDesagrecacionTecnologica);
  cumplimentaComboConfiguracion(frmMain.cbb_cfgEDTDiccionario);
  cumplimentaComboConfiguracion(frmMain.cbb_cfgEDTListado);
  cumplimentaComboConfiguracion(frmMain.cbb_cfgEDTValorada);
  cumplimentaComboConfiguracion(frmMain.cbb_cfgEquipoProyecto);
  cumplimentaComboConfiguracion(frmMain.cbb_cfgDescomposicionOrganizacion);
  cumplimentaComboConfiguracion(frmMain.cbb_cfgFormulaPolinomica);
  cumplimentaComboConfiguracion(frmMain.cbb_cfgGestionTiempos);
  cumplimentaComboConfiguracion(frmMain.cbb_cfgPorcentajeIndirecto);
  cumplimentaComboConfiguracion(frmMain.cbb_cfgPresupuestos);
end;

/// <summary>TODO: Descripción de cumplimentaComboConfiguracion.</summary>
/// <param name="comboCfg">TODO.</param>
procedure cumplimentaComboConfiguracion(comboCfg: TComboBox);
var
  nombreCombo: string;
  folderCombo: string;
  rutaArchivosReporte: string;
  listadoReportes: Tstringlist;
  x: integer;
  tmpstr: string;
begin
  comboCfg.Items.Clear;
  nombreCombo := comboCfg.Name;
  if nombreCombo = 'cbb_cfgActaConstitucion' then
    folderCombo := folder_actaConstitucion;
  if nombreCombo = 'cbb_cfgAnalisisPrecios' then
    folderCombo := folder_analisis;
  if nombreCombo = 'cbb_cfgCronoTrabajo' then
    folderCombo := folder_cronogramaTrabajo;
  if nombreCombo = 'cbb_cfgCronoValorado' then
    folderCombo := folder_cronogramaValorado;
  if nombreCombo = 'cbb_cfgDesagrecacionTecnologica' then
    folderCombo := folder_desagregacionTecnologica;
  if nombreCombo = 'cbb_cfgEDTDiccionario' then
    folderCombo := folder_EDTDiccionario;
  if nombreCombo = 'cbb_cfgEDTListado' then
    folderCombo := folder_EDTListado;
  if nombreCombo = 'cbb_cfgEDTValorada' then
    folderCombo := folder_EDTValorada;
  if nombreCombo = 'cbb_cfgEquipoProyecto' then
    folderCombo := folder_equipoProyecto;
  if nombreCombo = 'cbb_cfgDescomposicionOrganizacion' then
    folderCombo := folder_DescomposicionOrganizacion;
  if nombreCombo = 'cbb_cfgFormulaPolinomica' then
    folderCombo := folder_formulasPolinomicas;
  if nombreCombo = 'cbb_cfgPorcentajeIndirecto' then
    folderCombo := folder_porcentajesIndirectos;
  if nombreCombo = 'cbb_cfgPresupuestos' then
    folderCombo := folder_presupuestos;
  if nombreCombo = 'cbb_cfgGestionTiempos' then
    folderCombo := folder_GestionTiempos;
  rutaArchivosReporte := rutaApp + 'Plantillas\' + folderCombo;
  listadoReportes := Tstringlist.Create;
  ArchivosDirectorio(rutaArchivosReporte, '*.zip', listadoReportes, True);
  for x := 0 to listadoReportes.Count - 1 do
  begin
    tmpstr := listadoReportes[x];
    tmpstr := ExtractFileName(tmpstr);
    tmpstr := ReplaceStr(tmpstr, '.zip', '');
    comboCfg.Items.Add(tmpstr);
  end;
  comboCfg.ItemIndex := 0;
end;

procedure ArchivosDirectorio(dir, mascara: string; var lista: TStringlist; const soloNombres: boolean);
var
  SR: TSearchRec;
begin
  dir := IncludeTrailingPathDelimiter(dir);
  if FindFirst(dir + mascara, faAnyFile, SR) = 0 then
  begin
    repeat
      if not soloNombres then
        lista.Add(ExtractFileName(ChangeFileExt(dir + SR.Name, '')))
      else
        lista.Add(dir + SR.Name);
    until FindNext(SR) <> 0;
    System.SysUtils.FindClose(SR);
  end;
end;

/// <summary>TODO: Descripción de daPorcentajeAsignadoRevision.</summary>
/// <returns>TODO.</returns>
function daPorcentajeAsignadoRevision(): Double;
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := Tuniquery.Create(nil);
  Result := 0;
  try
    with qry do
    begin
      connection := dmodule_1.con2;
      Close;
      sql.Clear;
      {(*}
      SQL.Add('SELECT ' + '  indirectos ' + 'FROM ' +
        '  presupuestos_datosgenerales ' + 'WHERE ' + '  codBase = :codBase ' +
        '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision');
        {*)}
      parambyname('codBase').AsString := base_activa.codBase;
      parambyname('codpresupuesto').AsString := codProyecto;
      parambyname('revision').AsString := revision;
      Prepare;
      execsql;
      tmpstr := fieldbyname('indirectos').AsString;
      if tmpstr = '' then
        tmpstr := '0';
      result := strtofloat(tmpstr);
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de daCodProyectoDescripcionDB.</summary>
/// <param name="descripcion">TODO.</param>
/// <returns>TODO.</returns>
function daCodProyectoDescripcionDB(descripcion: string): string;
var
  x: integer;
  tmpstr: string;
begin
  result := '';
  x := AnsiPos('P:', descripcion);
  if x > 0 then
  begin
    tmpstr := copy(descripcion, x + 2, Length(descripcion));
    result := tmpstr;
  end;
end;

/// <summary>TODO: Descripción de listaRevisionesBase.</summary>
/// <param name="codBaseTratar">TODO.</param>
/// <param name="codPresupuesto">TODO.</param>
/// <returns>TODO.</returns>
function listaRevisionesBase(codBaseTratar, codPresupuesto: string): tstringlist;
var
  qry: TUniQuery;
  tmplst: TStringList;
  tmpstr: string;
begin
  qry := Tuniquery.Create(nil);
  tmplst := TStringList.Create;
  try
    with qry do
    begin
      connection := dmodule_1.con2;
      Close;
      sql.Clear;
      {(*}
      SQL.Add('SELECT ' + '  Revision ' + 'FROM ' +
        '  presupuestos_datosGenerales ' + 'WHERE ' + '  codBase = :codBase ' +
        '  AND codPresupuesto = :codPresupuesto');
        {*)}
      parambyname('codBase').AsString := codBaseTratar;
      parambyname('codPresupuesto').AsString := codPresupuesto;
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        tmpstr := FieldByName('revision').AsString;
        tmplst.Add(tmpstr);
        Next;
      end;
    end;
  finally
    qry.Free;
  end;
  Result := tmplst;
end;

/// <summary>TODO: Descripción de abreGridTanteo.</summary>
/// <param name="posgrid">TODO.</param>
procedure abreGridTanteo(posgrid: Integer);
var
  codApu: string;
  ARow: integer;
begin
  frmMain.grid_Presupuestos.Enabled := False;
  frmMain.lyt_Tanteo.Height := 270;
  frmMain.iGlow_AbrirTanteo.Enabled := True;
  tantear := true;
  ARow := frmMain.grid_Presupuestos.selection.StartRow;
  with DMPresupuesto.dsTpresupuestosItems.DataSet do
  begin
    DisableControls;
    First;
    MoveBy(ARow - 1);
    EnableControls;
  end;
  codApu := DMPresupuesto.QTPresupuestosItemscodAPU.AsString;
  ItemTanteo.codApu := codApu;

  frmMain.edt_EditApuDescripcion.Text := DMPresupuesto.QTPresupuestosItemsdescripcion.AsString;

  frmMain.edt_EditAPUUnidad.Text := DMPresupuesto.QTPresupuestosItemsunidad.AsString;

  frmMain.chkTipoRendimientoAPUSPresupuesto.IsChecked := True;
end;

/// <summary>TODO: Descripción de cierraGridTanteo.</summary>
procedure cierraGridTanteo();
begin
  frmMain.iGlow_AbrirTanteo.Enabled := false;
  frmMain.lyt_Tanteo.Height := 0;
  tantear := false;
  frmMain.grid_Presupuestos.Enabled := True;
  frmMain.chkTipoRendimientoAPUSPresupuesto.IsChecked := True;
end;

/// <summary>TODO: Descripción de ImportarPlantillaProjectExcel.</summary>
/// <param name="archivoExcel">TODO.</param>
/// <returns>TODO.</returns>
function ImportarPlantillaProjectExcel(archivoExcel: string): string;
var
  excelFile: TExcelFile;
  nombreProyecto: string;
  nombreProyectoProject: string;
  valorC: TCellValue;
  x, y: Integer;
  sheet: integer;
  salir: Boolean;
  posicionInicioExcelC: integer;
  nperiodos: integer;
  tmpstr: string;
  listaDatos: TStringList;
  C, R: integer;
  valorF: double;
  ajuste: double;
begin
  result := 'Correcto';
  if FileExists(archivoExcel) then
  begin
    excelFile := TXlsFile.Create(true);
    try
      excelFile.Open(archivoExcel);
      // posicionarse en hoja de datos
      x := 1;
      salir := false;
      excelFile.ActiveSheet := 1;
      sheet := -1;
      while (not salir) and (x <= excelFile.SheetCount) do
      begin
        excelFile.ActiveSheet := x;
        if LowerCase(excelFile.SheetName) = 'uso de tareas' then
        begin
          salir := true;
          sheet := x;
        end;
        inc(x);
      end;
      if sheet > 0 then
      begin
        excelFile.ActiveSheet := sheet;
        nombreProyecto := frmmain.edt_descripcionPresupuesto.Text;

        valorC := excelFile.GetCellValue(6, 1);
        nombreProyectoProject := valorC.ToString;
        if lowerCase(nombreProyecto) = LowerCase(nombreProyectoProject) then
        begin
          posicionInicioExcelC := 7;
          nperiodos := StrToIntDef(frmMain.lbl_cronogramaNPeriodos.Text, 0);
          limpiagridCrono(frmmain.grid_crono1);
          for x := 1 to frmMain.grid_crono0.RowCount - 1 do
          begin
            // crear lineas de valores
            tmpstr := frmMain.grid_crono0.Cells[3, x];
            if tmpstr <> '' then
            begin
              listaDatos := TStringList.Create;
              R := x + posicionInicioExcelC;
              ajuste := 0;
              for C := 4 to 4 + nperiodos - 1 do
              begin
                valorC := excelFile.GetCellValue(R, C);
                tmpstr := valorC.ToString;
                tmpstr := decimal_correcto(tmpstr);
                valorF := StrToFloatDef(tmpstr, 0);
                valorF := valorF * 100;
                if C < (4 + nperiodos - 1) then
                begin
                  ajuste := ajuste + valorF;
                end
                else
                begin
                  valorF := 100 - ajuste;
                end;
                tmpstr := floattostr(valorF);
                listaDatos.Add(tmpstr);
              end;
              frmMain.grid_crono0.Cells[11, x] := listaDatos.Text;
            end;
          end;
          calcularPorCentajeEjecucionObras();
          recalculaCronogramas;
        end
        else
        begin
          result := 'Error: Proyecto no coincidente';
        end;
      end
      else
      begin
        Result := 'Error: Hoja de Datos no encontrada';
      end;
    except
      on ex: Exception do
      begin
        Result := 'Error: estructura de archivo no valida';
      end;
    end;
  end
  else
    result := 'Error: fichero no existe';
end;

/// <summary>TODO: Descripción de recalculaCronogramas.</summary>
procedure recalculaCronogramas();
var
  x: integer;
begin
  limpiagridCrono(frmmain.grid_Crono2);
  limpiagridCrono(frmmain.grid_CronoTotales);
  calcularInversion();
  limpiagridCrono(frmmain.grid_Crono3);
  calcularCantidadesObras();
  frmmain.tbc1.ActiveTab := frmmain.tab_1;
  frmmain.grid_Crono1.SetFocus;
  SeleccionaTabCrono(1);
  cancelarDerivacion := frmmain.cbb_cronoTipoPeriodo.items[frmmain.cbb_cronoTipoPeriodo.ItemIndex] + ',' + frmmain.lbl_cronogramaNPeriodos.Text;
  AjustaCurvaS();
  guardarDatosDerivacion;

  sincronizaTamanoGrid(frmMain.grid_Crono1, frmMain.grid_CronoTotales);
  sincronizaTamanoGrid(frmMain.grid_Crono1, frmmain.grid_crono3);
  frmMain.grid_CronoTotales.ColumnCount := frmMain.grid_CronoTotales.ColumnCount - 1;
end;

/// <summary>TODO: Descripción de sincronizaTamanoGrid.</summary>
/// <param name="gridMaster">TODO.</param>
/// <param name="gridHijo">TODO.</param>
procedure sincronizaTamanoGrid(gridMaster, gridHijo: TTMSFNCGrid);
var
  x: Integer;
begin
  gridHijo.ColumnCount := gridMaster.ColumnCount;
  for x := 0 to gridMaster.ColumnCount - 1 do
  begin
    gridHijo.Columns[x].Width := gridMaster.Columns[x].Width;
  end;
end;

function CheckInternet: boolean;
var
  vIdTCPClient: TIdTCPClient;
begin
  result := False;
  frmMain.led_OnlineDB.State := False;
  vIdTCPClient := TIdTCPClient.Create(nil);
  try
    try
      with vIdTCPClient do
      begin
        ReadTimeout := 1000;
        ConnectTimeout := 1000;
        Port := 80;
        Host := 'google.com';
        Connect;
        Disconnect;
      end;
      result := True;
      frmMain.led_OnlineDB.State := True;
    except
      result := False;
    end;
  finally
    FreeAndNil(vIdTCPClient);
  end;
end;

/// <summary>TODO: Descripción de CuentaRevisiones.</summary>
/// <returns>TODO.</returns>
function CuentaRevisiones(): Integer;
var
  qry: TUniQuery;
  SQLstring: string;
  tmpstr: string;
begin
  if base_activa.codBase <> '' then
  begin
    qry := Tuniquery.Create(nil);
    try
      with qry do
      begin
        connection := dmodule_1.con2;
        Close;
        sql.Clear;
        {(*}
        SQL.Add('SELECT ' + '  count(*) AS nrevisiones ' + 'FROM ' +
          '  Presupuestos_DatosGenerales ' + 'WHERE ' + '  codBase = :codBase '
          + '  AND codPresupuesto = :codPresupuesto');
          {*)}
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        Prepare;
        ExecSQL;
        Result := FieldByName('nrevisiones').AsInteger;
      end;
    finally
      qry.Free;
    end;
  end
  else
  begin
    Result := 0;
  end;
end;

/// <summary>TODO: Descripción de existeRevisionCero.</summary>
/// <returns>TODO.</returns>
function existeRevisionCero(): Boolean;
var
  qry: TUniQuery;
  SQLstring: string;
  codBase: string;
  tmpstr: string;
begin
  codBase := base_activa.codBase;
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      connection := dmodule_1.con2;
      Close;
      sql.Clear;
      {(*}
      SQL.Add('SELECT ' + '  revision ' + 'FROM ' +
        '  Presupuestos_DatosGenerales ' + 'WHERE ' + '  codBase = :codBase ' +
        '  AND codPresupuesto = :codPresupuesto ' + '  AND Revision = :revision');
        {*)}
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('revision').AsString;
      if tmpstr <> '' then
        result := True
      else
        result := False;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de guardarcomoRevision.</summary>
/// <param name="codBase">TODO.</param>
/// <param name="revisionOrigen">TODO.</param>
/// <returns>TODO.</returns>
function guardarcomoRevision(codBase, revisionOrigen: string): string;
var
  qry: TUniQuery;
  SQLstring: string;
  x: integer;
  nuevaRevision: string;
  datos: integer;
begin
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      connection := dmodule_1.con2;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'SELECT ' + '  revision ' + 'FROM ' +
        '  Presupuestos_DatosGenerales ' + 'WHERE ' + '  codBase = :codBase ' +
        '  AND codPresupuesto = :codPresupuesto ';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      Prepare;
      ExecSQL;
      Last;
      nuevaRevision := FieldByName('revision').AsString;
      x := StrToIntDef(nuevaRevision, -1);
      inc(x);
      nuevaRevision := inttostr(x);
      result := nuevaRevision;

      close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO Presupuestos_anotaciones ( ' + '  codBase, ' +
        '  codPresupuesto, ' + '  revision, ' + '  idItem, ' + '  fecha, ' +
        '  codEdt, ' + '  paquete, ' + '  descripcion, ' + '  nota, ' +
        '  autor, ' + '  notaReferencia, ' + '  tipoNota) ' + 'SELECT ' +
        '  codBase, ' + '  codPresupuesto, ' + '  :nuevaRevision, ' +
        '  idItem, ' + '  fecha, ' + '  codEdt, ' + '  paquete, ' +
        '  descripcion, ' + '  nota, ' + '  autor, ' + '  notaReferencia, ' +
        '  tipoNota ' + 'FROM ' + '  Presupuestos_Anotaciones ' + 'WHERE ' +
        '  codBase = :codBase ' + '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO Presupuestos_anotaciones ' + '  (codBase, ' +
        '  codPresupuesto, ' + '  revision, ' + '  idItem, ' + '  fecha, ' +
        '  codEdt, ' + '  paquete, ' + '  descripcion, ' + '  nota, ' +
        '  autor, ' + '  notaReferencia, ' + '  tipoNota) ' + 'SELECT ' +
        '  codBase, ' + '  codPresupuesto, ' + '  :nuevaRevision, ' +
        '  idItem, ' + '  fecha, ' + '  codEdt, ' + '  paquete, ' +
        '  descripcion, ' + '  nota, ' + '  autor, ' + '  notaReferencia, ' +
        '  tipoNota ' + 'FROM ' + '  Presupuestos_Anotaciones ' + 'WHERE ' +
        '  codBase = :codBase ' + '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO presupuestos_asignacionTerminos ( ' +
        '  codBase, ' + '  codPresupuesto, ' + '  revision, ' + '  asignacion, '
        + '  descripcion) ' + 'SELECT ' + '  codBase, ' + '  :nuevaRevision, ' +
        '  codPresupuesto, ' + '  asignacion, ' + '  descripcion ' + 'FROM ' +
        '  presupuestos_asignacionTerminos ' + 'WHERE ' +
        '  codBase = :codBase ' + '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO presupuestos_cronogramas ( ' + '  codBase, ' +
        '  codPresupuesto, ' + '  revision, ' + '  tipoPeriodo, ' +
        '  Periodos, ' + '  tipoDerivacion, ' + '  Derivacion) ' + 'SELECT ' +
        '  codBase, ' + '  codPresupuesto, ' + '  :nuevaRevision, ' +
        '  tipoPeriodo, ' + '  Periodos, ' + '  tipoDerivacion, ' +
        '  Derivacion ' + 'FROM ' + '  presupuestos_Cronogramas ' + 'WHERE ' +
        '  codBase = :codBase ' + '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO presupuestos_DatosGenerales ( ' + '  codBase, '
        + '  codPresupuesto, ' + '  codReferencial, ' + '  revision, ' +
        '  descripcion, ' + '  subtotal, ' + '  iva, ' + '  indirectos, ' +
        '  total, ' + '  fechaCreacion, ' + '  fechaModificacion, ' +
        '  porcentajeIVA) ' + 'SELECT ' + '  codBase, ' + '  codPresupuesto, ' +
        '  codReferencial, ' + '  :nuevaRevision, ' + '  descripcion, ' +
        '  subtotal, ' + '  iva, ' + '  indirectos, ' + '  total, ' +
        '  fechaCreacion, ' + '  :fechaModificacion, ' + '  porcentajeIVA ' +
        'FROM ' + '  presupuestos_DatosGenerales ' + 'WHERE ' +
        '  codBase = :codBase ' + '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      Parambyname('fechaModificacion').AsDateTime := Now;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO presupuestos_datosProyecto ( ' + '  codBase, ' +
        '  codPresupuesto, ' + '  revision, ' + '  codReferencial, ' +
        '  descripcion, ' + '  tipoProyecto, ' + '  categoria, ' +
        '  tipoConstruccion, ' + '  ambitoContratacion, ' + '  tipoContrato, ' +
        '  fechaInicio, ' + '  PlazoEjecucion, ' + '  fechaFinalizacion, ' +
        '  direccion, ' + '  ciudad, ' + '  provincia, ' + '  pais, ' +
        '  objetoContrato, ' + '  validezPropuesta, ' + '  foto1, ' +
        '  foto2, ' + '  fechaHoraCreacion, ' + '  Ultmodificacion, ' +
        '  latitud, ' + '  longitud, ' + '  Aterreno, ' + '  Aconstruccion ' +
        ') ' + 'SELECT ' + '  codBase, ' + '  codPresupuesto, ' +
        '  :nuevaRevision, ' + '  codReferencial, ' + '  descripcion, ' +
        '  tipoProyecto, ' + '  categoria, ' + '  tipoConstruccion, ' +
        '  ambitoContratacion, ' + '  tipoContrato, ' + '  fechaInicio, ' +
        '  PlazoEjecucion, ' + '  fechaFinalizacion, ' + '  direccion, ' +
        '  ciudad, ' + '  provincia, ' + '  pais, ' + '  objetoContrato, ' +
        '  validezPropuesta, ' + '  foto1, ' + '  foto2, ' +
        '  fechaHoraCreacion, ' + '  :Ultmodificacion, ' + '  latitud, ' +
        '  longitud, ' + '  Aterreno, ' + '  Aconstruccion ' + 'FROM ' +
        '  presupuestos_DatosProyecto ' + 'WHERE ' + '  codBase = :codBase ' +
        '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      PArambyName('ultmodificacion').AsDateTime := now;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO presupuestos_datosProyecto ( ' + '  codBase, ' +
        '  codPresupuesto, ' + '  revision, ' + '  codReferencial, ' +
        '  descripcion, ' + '  tipoProyecto, ' + '  categoria, ' +
        '  tipoConstruccion, ' + '  ambitoContratacion, ' + '  tipoContrato, ' +
        '  fechaInicio, ' + '  PlazoEjecucion, ' + '  fechaFinalizacion, ' +
        '  direccion, ' + '  ciudad, ' + '  provincia, ' + '  pais, ' +
        '  objetoContrato, ' + '  validezPropuesta, ' + '  foto1, ' +
        '  foto2, ' + '  fechaHoraCreacion, ' + '  Ultmodificacion, ' +
        '  latitud, ' + '  longitud, ' + '  Aterreno, ' + '  Aconstruccion ' +
        ') ' + 'SELECT ' + '  codBase, ' + '  codPresupuesto, ' +
        '  :nuevaRevision, ' + '  codReferencial, ' + '  descripcion, ' +
        '  tipoProyecto, ' + '  categoria, ' + '  tipoConstruccion, ' +
        '  ambitoContratacion, ' + '  tipoContrato, ' + '  fechaInicio, ' +
        '  PlazoEjecucion, ' + '  fechaFinalizacion, ' + '  direccion, ' +
        '  ciudad, ' + '  provincia, ' + '  pais, ' + '  objetoContrato, ' +
        '  validezPropuesta, ' + '  foto1, ' + '  foto2, ' +
        '  fechaHoraCreacion, ' + '  :Ultmodificacion, ' + '  latitud, ' +
        '  longitud, ' + '  Aterreno, ' + '  Aconstruccion ' + 'FROM ' +
        '  presupuestos_DatosProyecto ' + 'WHERE ' + '  codBase = :codBase ' +
        '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO presupuestos_EDO ( ' + '  codBase, ' +
        '  codPresupuesto, ' + '  revision, ' + '  datosEDO) ' + 'SELECT ' +
        '  codBase, ' + '  codPresupuesto, ' + '  :nuevaRevision, ' +
        '  datosEDO ' + 'FROM ' + '  presupuestos_EDO ' + 'WHERE ' +
        '  codBase = :codBase ' + '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO presupuestos_EDT ( ' + '  codBase, ' +
        '  codPresupuesto, ' + '  revision, ' + '  datosEDT) ' + 'SELECT ' +
        '  codBase, ' + '  codPresupuesto, ' + '  :nuevaRevision, ' +
        '  datosEDT ' + 'FROM ' + '  presupuestos_EDT ' + 'WHERE ' +
        '  codBase = :codBase ' + '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO presupuestos_FpolCuadrillas ( ' + '  codBase, '
        + '  codPresupuesto, ' + '  revision, ' + '  codIndice, ' + '  Indice, '
        + '  descripcion, ' + '  SalarioMinimo) ' + 'SELECT ' + '  codBase, ' +
        '  codPresupuesto, ' + '  :nuevaRevision, ' + '  codIndice, ' +
        '  Indice, ' + '  descripcion, ' + '  SalarioMinimo ' + 'FROM ' +
        '  presupuestos_FpolCuadrillas ' + 'WHERE ' + '  codBase = :codBase ' +
        '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO presupuestos_Fpolinomica ( ' + '  codBase, ' +
        '  codPresupuesto, ' + '  revision, ' + '  datosEDO, ' + '  tipo) ' +
        'SELECT ' + '  codBase, ' + '  codPresupuesto, ' + '  :nuevaRevision, '
        + '  datosEDO, ' + '  tipo ' + 'FROM ' + '  presupuestos_Fpolinomica ' +
        'WHERE ' + '  codBase = :codBase ' +
        '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO Presupuestos_indicesSeleccionados ( ' +
        '  codBase, ' + '  codPresupuesto, ' + '  revision, ' + '  codIndice, '
        + '  descripcion, ' + '  termino) ' + 'SELECT ' + '  codBase, ' +
        '  codPresupuesto, ' + '  :nuevaRevision, ' + '  codIndice, ' +
        '  descripcion, ' + '  termino ' + 'FROM ' +
        '  presupuestos_indicesSeleccionados ' + 'WHERE ' + '  codBase = :codBase '
        + '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO presupuestos_indirectos ( ' + '  codBase, ' +
        '  codPresupuesto, ' + '  revision, ' + '  cuenta, ' + '  codCuenta, ' +
        '  observaciones, ' + '  valor) ' + 'SELECT ' + '  codBase, ' +
        '  codPresupuesto, ' + '  :nuevaRevision, ' + '  cuenta, ' +
        '  codCuenta, ' + '  observaciones, ' + '  valor ' + 'FROM ' +
        '  presupuestos_indirectos ' + 'WHERE ' + '  codBase = :codBase ' +
        '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO presupuestos_items ( ' + '  codBase, ' +
        '  codPresupuesto, ' + '  revision, ' + '  codEdt, ' + '  codItems, ' +
        '  codUnicoItems, ' + '  codAPUGenerico, ' + '  codAPU, ' +
        '  descripcion, ' + '  unidad, ' + '  cantidad, ' + '  PUnitario, ' +
        '  Ptotal, ' + '  notas, ' + '  rendimientoHUnidad, ' +
        '  nhCuadrillas ' + ') ' + 'SELECT ' + '  codBase, ' +
        '  codPresupuesto, ' + '  :nuevaRevision, ' + '  codEdt, ' +
        '  codItems, ' + '  codUnicoItems, ' + '  codAPUGenerico, ' +
        '  codAPU, ' + '  descripcion, ' + '  unidad, ' + '  cantidad, ' +
        '  PUnitario, ' + '  Ptotal, ' + '  notas, ' + '  rendimientoHUnidad, '
        + '  nhCuadrillas ' + 'FROM ' + '  presupuestos_items ' + 'WHERE ' +
        '  codBase = :codBase ' + '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO Presupuestos_notasRevision ( ' + '  codBase, ' +
        '  codPresupuesto, ' + '  revision, ' + '  Seccion, ' + '  Nota, ' +
        '  FechaHora) ' + 'SELECT ' + '  codBase, ' + '  codPresupuesto, ' +
        '  :nuevaRevision, ' + '  Seccion, ' + '  Nota, ' + '  FechaHora ' +
        'FROM ' + '  presupuestos_NotasRevision ' + 'WHERE ' +
        '  codBase = :codBase ' + '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {}
      SQLstring := 'INSERT INTO Presupuestos_recursos ( ' + '  codBase, ' + '  codPresupuesto, ' + '  revision, ' + '  codAPU, ' + '  codCategoria, ' + '  codSubCategoria, ' + '  idUnicoRecurso, ' + '  codRecurso, ' + '  codRecursoCompleto, ' + '  Descripcion, ' + '  Unidad, ' + '  Precio, ' + '  moneda, ' + '  cantidadUnidad, ' + '  Rendimiento, ' + '  Total, ' + '  porcentaje, ' + '  codCPC, ' + '  TipoCPC, ' + '  porcentajeCPC, ' + '  termino ' + ') ' + 'SELECT ' + '  codBase, ' + '  codPresupuesto, ' +
        '  :nuevaRevision, ' + '  codAPU, ' + '  codCategoria, ' + '  codSubCategoria, ' + '  idUnicoRecurso, ' + '  codRecurso, ' + '  codRecursoCompleto, ' + '  Descripcion, ' + '  Unidad, ' + '  Precio, ' + '  moneda, ' + '  cantidadUnidad, ' + '  Rendimiento, ' + '  Total, ' + '  porcentaje, ' + '  codCPC, ' + '  TipoCPC, ' + '  porcentajeCPC, ' + '  termino ' + 'FROM ' + '  Presupuestos_recursos ' + 'WHERE ' + '  codBase = :codBase ' + '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
      {}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'INSERT INTO Presupuestos_StakeHolders ( ' + '  idGrid, ' +
        '  codBase, ' + '  codPresupuesto, ' + '  revision, ' +
        '  rolPresupuesto, ' + '  idFiscal, ' + '  nombre, ' + '  apellidos, ' +
        '  localidad, ' + '  provincia, ' + '  pais, ' + '  telefono, ' +
        '  email, ' + '  titulacion, ' + '  institucion, ' + '  cargo ' + ') ' +
        'SELECT ' + '  idGrid, ' + '  codBase, ' + '  codPresupuesto, ' +
        '  :nuevaRevision, ' + '  rolPresupuesto, ' + '  idFiscal, ' +
        '  nombre, ' + '  apellidos, ' + '  localidad, ' + '  provincia, ' +
        '  pais, ' + '  telefono, ' + '  email, ' + '  titulacion, ' +
        '  institucion, ' + '  cargo ' + 'FROM ' +
        '  presupuestos_stakeHolders ' + 'WHERE ' + '  codBase = :codBase ' +
        '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      ParamByName('codBase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revisionOrigen;
      ParamByName('nuevaRevision').AsString := nuevaRevision;
      prepare;
      ExecSQL;
      exportaImagenRevisiones(codProyecto, revisionOrigen, nuevaRevision);

      Close;
      sql.Clear;
      {(*}
      SQLstring := 'SELECT ' + '  count(codAPU) AS Datos ' + 'FROM ' +
        '  presupuestos_tanteo_apus ' + 'WHERE ' + '  codBase = :codBase ' +
        '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
        {*)}
      sql.Add(SQLstring);
      parambyname('codBase').AsString := codBase;
      parambyname('codPresupuesto').AsString := codProyecto;
      Parambyname('revision').AsString := revisionOrigen;
      Prepare;
      execSQL;
      datos := fieldbyname('datos').AsInteger;

      if datos > 0 then
      begin
        Close;
        sql.Clear;
        {(*}
        SQLstring := 'INSERT INTO presupuestos_tanteo_apus ( ' +
          '  codUnicoTanteo, ' + '  codBase, ' + '  codPresupuesto, ' +
          '  revision, ' + '  CodAPU, ' + '  CostoDirectoTotal, ' +
          '  ultimaModificacion) ' + 'SELECT ' + '  codUnicoTanteo, ' +
          '  :codBase, ' + '  :codPresupuesto, ' + '  :Nrevision, ' +
          '  CodAPU, ' + '  CostoDirectoTotal, ' + '  :ultimaModificacion ' +
          'FROM ' + '  presupuestos_tanteo_apus ' + 'WHERE ' +
          '  codBase = :codBase ' + '  AND codPresupuesto = :codPresupuesto ' + '  AND revision = :revision';
          {*)}
        sql.Add(SQLstring);
        parambyname('codBase').AsString := codBase;
        parambyname('codPresupuesto').AsString := codProyecto;
        Parambyname('revision').AsString := revisionOrigen;
        Parambyname('Nrevision').AsString := nuevaRevision;
        ParamByName('ultimaModificacion').AsDateTime := Now;
        Prepare;
        execSQL;

        close;
        sql.Clear;
        {(*}
        SQLstring := 'INSERT INTO presupuestos_tanteo_recursos ( ' +
          '  codUnicoTanteo, ' + '  codBase, ' + '  codPresupuesto, ' +
          '  revision, ' + '  CodAPU, ' + '  descripcion, ' +
          '  idUnicoRecurso, ' + '  Precio, ' + '  CantidadUnidad, ' +
          '  Rendimiento, ' + '  Total) ' + 'SELECT ' + '  codUnicoTanteo, ' +
          '  :codBase, ' + '  :codPresupuesto, ' + '  :Nrevision, ' +
          '  CodAPU, ' + '  descripcion, ' + '  idUnicoRecurso, ' + '  Precio, '
          + '  CantidadUnidad, ' + '  Rendimiento, ' + '  Total ' + 'FROM ' +
          '  presupuestos_tanteo_recursos; ' + 'codBase = :codBase ' +
          'AND codPresupuesto = :codPresupuesto ' + 'AND revision = :revision';
          {*)}
        sql.Add(SQLstring);
        parambyname('codBase').AsString := codBase;
        parambyname('codPresupuesto').AsString := codProyecto;
        Parambyname('revision').AsString := revisionOrigen;
        Parambyname('Nrevision').AsString := nuevaRevision;
        Prepare;
        execSQL;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de daNombreMoneda.</summary>
/// <param name="moneda">TODO.</param>
/// <returns>TODO.</returns>
function daNombreMoneda(moneda: string): string;
var
  qry: Tuniquery;
begin
  result := '';
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      connection := dmodule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT ' + '  money ' + 'FROM ' + '  currency ' + 'WHERE ' +
        '  CurrencyISO = :CurrencyISO ' + '  AND LANGUAGE = :language');
        {*)}
      ParamByName('CurrencyISO').AsString := moneda;
      ParamByName('language').AsString := 'ES';
      Prepare;
      ExecSQL;
      result := FieldByName('Money').AsString;
    end;
  finally
    qry.free;
  end;
end;

function calculaPorcentajeIvaPrecios(total: Double; cantidadIva: double): Double;
var
  tmpflt: Double;
begin
  tmpflt := cantidadIva / total;
  tmpflt := tmpflt * 100;
  result := tmpflt;
end;

/// <summary>TODO: Descripción de BorrarCarpeta.</summary>
/// <param name="vOrigen">TODO.</param>
/// <returns>TODO.</returns>
function BorrarCarpeta(const vOrigen: string): boolean;
var
  vCarpetas: TSHFileOpStruct;
begin
  FillChar(vCarpetas, SizeOf(vCarpetas), #0);
  vCarpetas.wFunc := FO_DELETE;
  vCarpetas.Wnd := GetDesktopWindow;
  vCarpetas.pFrom := PChar(vOrigen + #0#0);
  vCarpetas.fFlags := FOF_NOCONFIRMATION or FOF_SILENT or FOF_ALLOWUNDO;
  Result := (ShFileOperation(vCarpetas) = 0);
end;

procedure RecorrerDirectorios(sRuta: string; bIncluirSubdirectorios: Boolean; ResultadosDir: TStringList);
var
  Directorio: TSearchRec;
  iResultado: Integer;
  dirBuscarFichero: string;
begin
  if sRuta[Length(sRuta)] <> '\' then
    sRuta := sRuta + '\';

  if not DirectoryExists(sRuta) then
  begin
    Exit;
  end;
  iResultado := FindFirst(sRuta + '*.*', FaAnyfile, Directorio);
  while iResultado = 0 do
  begin
    if (Directorio.Attr and faDirectory = faDirectory) and bIncluirSubdirectorios then
    begin
      if (Directorio.Name <> '.') and (Directorio.Name <> '..') then
        RecorrerDirectorios(sRuta + Directorio.Name, True, ResultadosDir);
    end
    else if (Directorio.Attr and faVolumeId <> faVolumeID) then
    begin
      ResultadosDir.Add(sRuta + Directorio.Name);
    end;

    iResultado := FindNext(Directorio);
  end;
  System.SysUtils.FindClose(Directorio);
end;

/// <summary>TODO: Descripción de danombrePlantilla.</summary>
/// <param name="nombrePlantilla">TODO.</param>
/// <returns>TODO.</returns>
function danombrePlantilla(nombrePlantilla: string): string;
var
  pathPlantilla: string;
  listaResultados: Tstringlist;
  salir: boolean;
  tmpstr: string;
  x: integer;
begin
  result := '';
  listaResultados := Tstringlist.create;
  pathPlantilla := rutaApp + 'Plantillas\';
  RecorrerDirectorios(pathPlantilla, true, listaResultados);
  salir := False;
  x := 0;
  while (not salir) and (x < listaResultados.Count) do
  begin
    tmpstr := listaResultados[x];
    tmpstr := extractFilename(tmpstr);
    if tmpstr = nombrePlantilla + '.zip' then
    begin
      salir := true;
      result := listaResultados[x];
    end;
    inc(x);
  end;
end;

/// <summary>TODO: Descripción de cargarValoresInicialesTrvw.</summary>
/// <param name="Trvw">TODO.</param>
procedure cargarValoresInicialesTrvw(Trvw: TTMSFMXTreeView);
var
  nodo: TTMSFMXTreeViewNode;
  x: integer;
begin
  Trvw.ClearNodes;
  nodo := Trvw.AddNode;
  nodo.Text[0] := 'Equipos y Herramientas';
  nodo.Extended := true;
  nodo := Trvw.AddNode;
  nodo.Text[0] := 'Materiales';
  nodo.Extended := true;
  nodo := Trvw.AddNode;
  nodo.Text[0] := 'Transporte';
  nodo.Extended := true;
  nodo := Trvw.AddNode;
  nodo.Text[0] := 'Mano de Obra';
  nodo.Extended := true;
  if base_activa.SeguridadIndustrial then
  begin
    nodo := Trvw.AddNode;
    nodo.Text[0] := 'Seguridad Industrial';
    nodo.Extended := true;
  end;
  Trvw.ExpandAll;
end;

/// <summary>TODO: Descripción de cargarValoresInicialesTrvw2.</summary>
/// <param name="Trvw">TODO.</param>
procedure cargarValoresInicialesTrvw2(Trvw: TTMSFMXTreeView);
var
  nodo: TTMSFMXTreeViewNode;
  x: integer;
begin
  Trvw.ClearNodes;
  nodo := Trvw.AddNode;
  nodo.Text[0] := 'Equipos y Herramientas';
  nodo.Extended := true;
  nodo := Trvw.AddNode;
  nodo.Text[0] := 'Materiales';
  nodo.Extended := true;
  nodo := Trvw.AddNode;
  nodo.Text[0] := 'Transporte';
  nodo.Extended := true;
  nodo := Trvw.AddNode;
  nodo.Text[0] := 'Mano de Obra';
  nodo.Extended := true;
  if base_activa.SeguridadIndustrial then
  begin
    nodo := Trvw.AddNode;
    nodo.Text[0] := 'Seguridad Industrial';
    nodo.Extended := true;
  end;
  nodo := Trvw.AddNode;
  nodo.Text[0] := 'Precios Unitarios';
  nodo.Extended := true;
  Trvw.ExpandAll;
end;

/// <summary>TODO: Descripción de borraEmpresa.</summary>
/// <param name="CodUnico">TODO.</param>
procedure borraEmpresa(CodUnico: string);
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  if CodUnico <> '' then
  begin
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        SQL.Clear;
        sql.Add('delete from empresas where codUnico=' + QuotedStr(CodUnico));
        Prepare;
        ExecSQL;
        close;
        sql.Clear;
        sql.Add('delete from empresas_config where CodUnico=' + QuotedStr(CodUnico));
        Prepare;
        ExecSQL;
      end;
    finally
      qry.free;
    end;
  end;
end;

/// <summary>TODO: Descripción de editarEmpresa.</summary>
procedure editarEmpresa();
begin
  frmMain.edt_empresaNombre.ReadOnly := False;
  frmMain.edt_EmpresaDireccion.ReadOnly := False;
  frmMain.edt_EmpresaLocalidad.ReadOnly := False;
  frmMain.edt_EmpresaProvincia.ReadOnly := False;
  frmMain.edt_EmpresaEmail.ReadOnly := False;
  frmMain.edt_EmpresaCelular.ReadOnly := False;
  frmMain.cbb_Ndecimalesmoneda.Enabled := True;
  frmMain.cbb_NdecimalesPresupuestos.Enabled := True;
  backgroundEmpresa(true);
  frmMain.edt_empresaNombre.SetFocus;
end;

/// <summary>TODO: Descripción de backgroundEmpresa.</summary>
/// <param name="estado">TODO.</param>
procedure backgroundEmpresa(estado: Boolean);
begin
  frmMain.rect_backgEmpresaIDFiscal.fill.Kind := TBrushKind.None;
  frmMain.rect_backgEmpresaDireccion.Fill.Kind := TBrushKind.None;
  frmMain.rect_backgEmpresaNombre.Fill.Kind := TBrushKind.None;
  frmMain.rect_backgEmpresaLocalidad.Fill.Kind := TBrushKind.None;
  frmMain.rect_backgEmpresaProvincia.Fill.Kind := TBrushKind.None;
  frmMain.rect_backgEmpresaEmail.Fill.Kind := TBrushKind.None;
  frmMain.rect_backgEmpresaCelular.Fill.Kind := TBrushKind.None;
  frmMain.cbb_cfgGestionTiempos.Enabled := estado;
  frmMain.cbb_cfgAnalisisPrecios.Enabled := estado;
  frmMain.cbb_cfgPresupuestos.Enabled := estado;
  frmMain.cbb_cfgCronoValorado.Enabled := estado;
  frmMain.cbb_cfgActaConstitucion.Enabled := estado;
  frmMain.cbb_cfgCronoTrabajo.Enabled := estado;
  frmMain.cbb_cfgDesagrecacionTecnologica.Enabled := estado;
  frmMain.cbb_cfgEquipoProyecto.Enabled := estado;
  frmMain.cbb_cfgDescomposicionOrganizacion.Enabled := estado;
  frmMain.cbb_cfgFormulaPolinomica.Enabled := estado;
  frmMain.cbb_cfgPorcentajeIndirecto.Enabled := estado;
  frmMain.cbb_cfgEDTDiccionario.Enabled := estado;
  frmMain.cbb_cfgEDTListado.Enabled := estado;
  frmMain.cbb_cfgEDTValorada.Enabled := estado;
  frmMain.cbb_NdecimalesPresupuestos.Enabled := estado;
  frmMain.cbb_Ndecimalesmoneda.Enabled := estado;
  if estado then
  begin
    frmMain.rect_backgEmpresaIDFiscal.fill.Kind := TBrushKind.Gradient;
    frmMain.rect_backgEmpresaDireccion.Fill.Kind := TBrushKind.Gradient;
    frmMain.rect_backgEmpresaNombre.Fill.Kind := TBrushKind.Gradient;
    frmMain.rect_backgEmpresaLocalidad.Fill.Kind := TBrushKind.Gradient;
    frmMain.rect_backgEmpresaProvincia.Fill.Kind := TBrushKind.Gradient;
    frmMain.rect_backgEmpresaEmail.Fill.Kind := TBrushKind.Gradient;
    frmMain.rect_backgEmpresaCelular.Fill.Kind := TBrushKind.Gradient;
  end;
end;

function posicionaEnGrid(grid: TTMSFNCGrid; columna: integer; itm: string): integer;
var
  x: integer;
  salir: Boolean;
  posicionGrid: integer;
  tmpstr: string;
begin
  salir := false;
  x := 1;
  posicionGrid := -1;
  while (not salir) and (x < grid.RowCount) do
  begin
    tmpstr := grid.Cells[columna, x];
    if tmpstr = itm then
    begin
      salir := True;
      posicionGrid := x;
    end;
    inc(x);
  end;
  result := posicionGrid;
end;

/// <summary>TODO: Descripción de rellenaConfigEmpresa.</summary>
procedure rellenaConfigEmpresa();
var
  qry: TUniQuery;
  idFiscal: string;
  tmpstr: string;
  strLogoEmpresa: string;
  conDB: TUniConnection;
  th1: thActualizaCodEmpresaActiva;
begin
  frmMain.edt_EmpresaIDFiscal.text := '';
  frmMain.edt_empresaNombre.text := '';
  frmMain.edt_EmpresaDireccion.text := '';
  frmMain.edt_EmpresaLocalidad.text := '';
  frmMain.edt_EmpresaProvincia.text := '';
  frmmain.edt_EmpresaEmail.text := '';
  frmmain.edt_EmpresaCelular.text := '';
  frmMain.edt_empresaNombre.ReadOnly := true;
  frmMain.edt_EmpresaDireccion.ReadOnly := True;
  frmMain.edt_EmpresaLocalidad.ReadOnly := True;
  frmMain.edt_EmpresaProvincia.ReadOnly := true;
  frmMain.edt_EmpresaEmail.ReadOnly := True;
  frmMain.edt_EmpresaCelular.ReadOnly := True;
  frmMain.edt_EmpresaIDFiscal.ReadOnly := True;
  frmMain.cbb_NdecimalesPresupuestos.ItemIndex := 1;
  cargaValoresSeriePresupuesto();
  IniciaCombosConfiguracion;
  frmMain.nEDT_autoguardado.Value := 5;
  frmMain.chkAutoGuardado.IsChecked := true;
  conDB := TUniConnection.Create(nil);
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      {(*}
      sql.Add('SELECT ' + '  * ' + 'FROM ' + '  empresas ' + 'WHERE ' + '  codUnico = :codUnico');
      {*)}
      ParamByName('codUnico').AsString := CodUnicoEmpresaActiva;
      Prepare;
      ExecSQL;
      idFiscalEmpresaSeleccionada := FieldByName('idFiscal').AsString;
      frmMain.edt_EmpresaIDFiscal.text := idFiscalEmpresaSeleccionada;
      frmMain.edt_empresaNombre.text := FieldByName('nombre').AsString;
      frmmain.edt_EmpresaDireccion.text := FieldByName('direccion').AsString;
      frmmain.edt_EmpresaLocalidad.text := FieldByName('localidad').AsString;
      frmMain.edt_EmpresaProvincia.text := FieldByName('provincia').AsString;
      frmmain.edt_EmpresaEmail.Text := FieldByName('email').AsString;
      frmmain.edt_EmpresaCelular.text := FieldByName('tfno').AsString;
      close;
      SQL.Clear;
      {(*}
      sql.Add('SELECT ' + '  * ' + 'FROM ' + '  empresas_config ' + 'WHERE ' + '  codUnico = :codUnico');
        {*)}
      ParamByName('codUnico').AsString := CodUnicoEmpresaActiva;
      Prepare;
      ExecSQL;
      frmmain.cbb_NdecimalesPresupuestos.ItemIndex := FieldByName('ndecimales').AsInteger;
      ndecimalesPresupuesto := StrToIntdef(frmmain.cbb_NdecimalesPresupuestos.Items[frmmain.cbb_NdecimalesPresupuestos.ItemIndex], 2);

      frmMain.cbb_Ndecimalesmoneda.ItemIndex := FieldByName('NDecimalesMoneda').AsInteger;
      ndecimalesMoneda := StrToIntdef(frmmain.cbb_Ndecimalesmoneda.Items[frmmain.cbb_Ndecimalesmoneda.ItemIndex], 2);

      if Fieldbyname('autoguardado').asInteger = 1 then
        frmMain.chkAutoGuardado.IsChecked := True
      else
        frmmain.chkAutoGuardado.isChecked := False;
      frmMain.nEDT_autoguardado.Value := FieldByName('tautoguardado').AsFloat;
      // Combos de Reportes
      tmpstr := FieldByName('RConstitucionProyecto').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgActaConstitucion.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgActaConstitucion, tmpstr);

      tmpstr := FieldByName('RAnalisisPrecios').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgAnalisisPrecios.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgAnalisisPrecios, tmpstr);
      tmpstr := FieldByName('RCronogramaTrabajo').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgCronoTrabajo.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgCronoTrabajo, tmpstr);
      tmpstr := FieldByName('RCronogramaValorado').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgCronoValorado.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgCronoValorado, tmpstr);
      tmpstr := FieldByName('RDesagregacionTecnologica').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgDesagrecacionTecnologica.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgDesagrecacionTecnologica, tmpstr);
      tmpstr := FieldByName('REDTDiccionario').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgEDTDiccionario.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgEDTDiccionario, tmpstr);

      tmpstr := FieldByName('REDTListado').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgEDTListado.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgEDTListado, tmpstr);
      tmpstr := FieldByName('REDTValorada').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgEDTValorada.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgEDTValorada, tmpstr);
      tmpstr := FieldByName('REquipoProyecto').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgEquipoProyecto.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgEquipoProyecto, tmpstr);
      tmpstr := FieldByName('RDescomposicionOrganizacion').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgDescomposicionOrganizacion.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgDescomposicionOrganizacion, tmpstr);
      tmpstr := FieldByName('RFormulaPolinomicas').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgFormulaPolinomica.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgFormulaPolinomica, tmpstr);
      tmpstr := FieldByName('RGestionTiempos').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgGestionTiempos.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgGestionTiempos, tmpstr);
      tmpstr := FieldByName('RPorcentajeIndirectos').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgPorcentajeIndirecto.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgPorcentajeIndirecto, tmpstr);
      tmpstr := FieldByName('RPresupuestos').AsString;
      if tmpstr = '' then
        frmMain.cbb_cfgPresupuestos.ItemIndex := 0
      else
        posicionaCombo(frmmain.cbb_cfgPresupuestos, tmpstr);
      strLogoEmpresa := FieldByName('logoEmpresa').AsString;
      if strLogoEmpresa = '' then
      begin
        strLogoEmpresa := frmMain.rect_LogoEmpresaBase.Fill.Bitmap.Bitmap.SaveToBase64;
      end;
      frmMain.rect_LogoEmpresa.Fill.Bitmap.Bitmap.LoadFromBase64(strLogoEmpresa);
      close;
      sql.Clear;
      {(*}
      sql.Add('UPDATE usuarios ' + 'SET configBase = :configBase ' + 'WHERE ' + '  email = :email');
        {*)}
      ParamByName('configBase').AsString := CodUnicoEmpresaActiva;
      ParamByName('email').AsString := ID_usuario;
      prepare;
      ExecSQL;
    end;
  finally
    qry.free;
    conDB.Free;
    actualizaEstadoDecimales();
  end;
end;

/// <summary>TODO: Descripción de actualizaEstadoDecimales.</summary>
procedure actualizaEstadoDecimales();
begin
  frmMain.lbl_DecimalesTrabajo.Text := 'Decimales Calculo: ' + inttostr(ndecimalespresupuesto) + ' Decimales Moneda: ' + inttostr(ndecimalesMoneda);
end;

/// <summary>TODO: Descripción de populaGridEmpresas.</summary>
procedure populaGridEmpresas();
var
  x: integer;
  qry: TUniQuery;
  tmpstr: string;
  gridW: Double;
begin
  qry := TUniQuery.Create(nil);
  frmMain.grid_Empresas.ClearNormalCells;
  frmmain.grid_Empresas.RowCount := 1;
  frmmain.grid_Empresas.cells[0, 0] := '#';
  frmmain.grid_Empresas.cells[1, 0] := 'ID/DNI/RUC';
  frmmain.grid_Empresas.cells[2, 0] := 'Nombre';
  frmmain.grid_Empresas.cells[3, 0] := 'Dirección';
  frmmain.grid_Empresas.cells[4, 0] := 'Ciudad';
  frmmain.grid_Empresas.cells[5, 0] := 'Provincia';
  frmmain.grid_Empresas.cells[6, 0] := 'E-Mail';
  frmmain.grid_Empresas.cells[7, 0] := 'Tfno';
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      {(*}
      sql.Add('SELECT ' + '  * ' + 'FROM ' + '  empresas ' + 'ORDER BY ' + '  fechaModificacion ASC');
        {*)}
      prepare;
      ExecSQL;
      x := 1;
      while not Eof do
      begin
        frmmain.grid_Empresas.RowCount := x + 1;
        frmmain.grid_Empresas.cells[0, x] := ponerCerosInicio(IntToStr(x), 3);
        frmMain.grid_Empresas.cells[1, x] := FieldByName('IdFiscal').AsString;
        frmMain.grid_Empresas.cells[2, x] := FieldByName('nombre').AsString;
        tmpstr := FieldByName('direccion').AsString;
        if Length(tmpstr) > 20 then
          tmpstr := LeftStr(tmpstr, 17) + '...';
        frmMain.grid_Empresas.cells[3, x] := tmpstr;
        frmMain.grid_Empresas.cells[4, x] := FieldByName('localidad').AsString;
        frmMain.grid_Empresas.cells[5, x] := FieldByName('provincia').AsString;
        tmpstr := FieldByName('email').AsString;
        if Length(tmpstr) > 20 then
          tmpstr := LeftStr(tmpstr, 17) + '...';
        frmMain.grid_Empresas.cells[6, x] := tmpstr;
        frmmain.grid_Empresas.cells[7, x] := FieldByName('tfno').AsString;
        frmMain.grid_Empresas.cells[8, x] := FieldByName('CodUnico').AsString;
        Next;
        Inc(x);
      end;
    end;
  finally
    frmMain.grid_Empresas.AutoSizeColumn(0);
    frmMain.grid_Empresas.AutoSizeColumn(1);
    frmmain.grid_Empresas.Columns[3].Width := 0;
    frmmain.grid_Empresas.Columns[4].Width := 0;
    frmmain.grid_Empresas.Columns[5].Width := 0;
    frmmain.grid_Empresas.Columns[6].Width := 0;
    frmmain.grid_Empresas.Columns[7].Width := 0;
    frmMain.grid_Empresas.Columns[8].Width := 0;
    gridW := (frmmain.grid_Empresas.Columns[0].Width + frmmain.grid_Empresas.Columns[1].Width + frmmain.grid_Empresas.Columns[3].Width + frmmain.grid_Empresas.Columns[4].Width + frmmain.grid_Empresas.Columns[5].Width + frmmain.grid_Empresas.Columns[6].Width + frmmain.grid_Empresas.Columns[7].Width) + frmmain.grid_Empresas.Columns[8].Width;
    gridW := frmmain.lyt_gridEmpresas.Width - gridW;
    frmMain.grid_Empresas.Columns[2].Width := trunc(gridW) - 15;
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de adicionaEmpresa.</summary>
procedure adicionaEmpresa(IdFiscal, nombre, direccion, localidad, provincia, email, tfno, logoEmpresa: string);
var
  qry: TUniQuery;
  FechaHora: TDateTime;
  conDB: TUniConnection;
  th1: thActualizaCodEmpresaActiva;
begin
  qry := TUniQuery.Create(nil);
  conDB := TUniConnection.Create(nil);
  try
    with qry do
    begin
      FechaHora := now;
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      {(*}
      sql.Add('INSERT empresas ( ' + '  codUnico, ' + '  idFiscal, ' +
        '  nombre, ' + '  direccion, ' + '  localidad, ' + '  provincia, ' +
        '  email, ' + '  tfno, ' + '  fechaCreacion, ' + '  FechaModificacion) '
        + 'VALUES ' + '( ' + '  :CodUnico, ' + '  :idFiscal, ' + '  :nombre, ' +
        '  :direccion, ' + '  :localidad, ' + '  :provincia, ' + '  :email, ' +
        '  :tfno, ' + '  :fechaCreacion, ' + '  :FechaModificacion');
        {*)}
      ParamByName('CodUnico').AsString := CodUnicoEmpresaActiva;
      ParamByName('idfiscal').AsString := IdFiscal.Trim;
      ParamByName('nombre').AsString := nombre.Trim;
      ParamByName('direccion').AsString := direccion.Trim;
      ParamByName('localidad').AsString := localidad.Trim;
      ParamByName('provincia').AsString := provincia.Trim;
      ParamByName('email').AsString := email.Trim;
      ParamByName('tfno').AsString := tfno.Trim;
      ParamByName('fechaCreacion').AsDateTime := FechaHora;
      ParamByName('fechaModificacion').AsDateTime := FechaHora;
      Prepare;
      ExecSQL;
      Close;
      sql.Clear;
      {(*}
      sql.Add('INSERT empresas_config ( ' + '  codUnico, ' + '  idFiscal, ' +
        '  nDecimales, ' + '  nDecimalesMoneda, ' + '  autoguardado, ' +
        '  tAutoguardado, ' + '  RconstitucionProyecto, ' +
        '  RAnalisisPrecios, ' + '  RCronogramaTrabajo, ' +
        '  RcronogramaValorado, ' + '  RdesagregacionTecnologica, ' +
        '  REDTDiccionario, ' + '  REDTListado, ' + '  REDTValorada, ' +
        '  REquipoProyecto, ' + '  RDescomposicionOrganizacion, ' +
        '  RFormulaPolinomicas, ' + '  RGestionTiempos, ' +
        '  RPorcentajeIndirectos, ' + '  RPresupuestos, ' + '  LogoEmpresa ' +
        ') ' + 'VALUES ' + '( ' + '  :CodUnico, ' + '  :idFiscal, ' +
        '  :nDecimales, ' + '  :nDecimalesMoneda, ' + '  :autoguardado, ' +
        '  :tAutoguardado, ' + '  :RconstitucionProyecto, ' +
        '  :RAnalisisPrecios, ' + '  :RCronogramaTrabajo, ' +
        '  :RcronogramaValorado, ' + '  :RdesagregacionTecnologica, ' +
        '  :REDTDiccionario, ' + '  :REDTListado, ' + '  :REDTValorada, ' +
        '  :REquipoProyecto, ' + '  :RDescomposicionOrganizacion, ' +
        '  :RFormulaPolinomicas, ' + '  :RGestionTiempos, ' +
        '  :RPorcentajeIndirectos, ' + '  :RPresupuestos, ' + '  :LogoEmpresa)');
        {*)}
      ParamByName('CodUnico').AsString := CodUnicoEmpresaActiva;
      ParamByName('idFiscal').AsString := IdFiscal.Trim;
      ParamByName('nDecimales').AsInteger := frmmain.cbb_NdecimalesPresupuestos.ItemIndex;
      ParamByName('nDecimalesMoneda').AsInteger := frmmain.cbb_Ndecimalesmoneda.ItemIndex;
      ParamByName('autoguardado').AsBoolean := frmMain.chkAutoGuardado.IsChecked;
      ParamByName('tautoguardado').AsInteger := trunc(frmMain.nEDT_autoguardado.value);
      ParamByName('RConstitucionProyecto').AsString := frmMain.cbb_cfgActaConstitucion.Items[frmMain.cbb_cfgActaConstitucion.ItemIndex];
      ParamByName('RAnalisisPrecios').AsString := frmMain.cbb_cfgAnalisisPrecios.Items[frmMain.cbb_cfgAnalisisPrecios.ItemIndex];
      ParamByName('RCronogramaTrabajo').AsString := frmMain.cbb_cfgCronoTrabajo.Items[frmMain.cbb_cfgCronoTrabajo.ItemIndex];
      ParamByName('RCronogramaValorado').AsString := frmMain.cbb_cfgCronoValorado.Items[frmMain.cbb_cfgCronoValorado.ItemIndex];
      ParamByName('RDesagregacionTecnologica').AsString := frmMain.cbb_cfgDesagrecacionTecnologica.Items[frmMain.cbb_cfgDesagrecacionTecnologica.ItemIndex];
      ParamByName('REDTDiccionario').AsString := frmMain.cbb_cfgEDTDiccionario.Items[frmMain.cbb_cfgEDTDiccionario.ItemIndex];
      ParamByName('REDTListado').AsString := frmMain.cbb_cfgEDTListado.Items[frmMain.cbb_cfgEDTListado.ItemIndex];
      ParamByName('REDTValorada').AsString := frmMain.cbb_cfgEDTValorada.Items[frmMain.cbb_cfgEDTValorada.ItemIndex];
      ParamByName('REquipoProyecto').AsString := frmMain.cbb_cfgEquipoProyecto.Items[frmMain.cbb_cfgEquipoProyecto.ItemIndex];
      ParamByName('RDescomposicionOrganizacion').AsString := frmMain.cbb_cfgDescomposicionOrganizacion.Items[frmMain.cbb_cfgDescomposicionOrganizacion.ItemIndex];
      ParamByName('RFormulaPolinomicas').AsString := frmMain.cbb_cfgFormulaPolinomica.Items[frmMain.cbb_cfgFormulaPolinomica.ItemIndex];
      ParamByName('RGestionTiempos').AsString := frmMain.cbb_cfgGestionTiempos.Items[frmMain.cbb_cfgGestionTiempos.ItemIndex];
      ParamByName('RPorcentajeIndirectos').AsString := frmMain.cbb_cfgPorcentajeIndirecto.Items[frmMain.cbb_cfgPorcentajeIndirecto.ItemIndex];
      ParamByName('RPresupuestos').AsString := frmMain.cbb_cfgPresupuestos.Items[frmMain.cbb_cfgPresupuestos.ItemIndex];
      ParamByName('logoEmpresa').AsString := logoEmpresa;
      Prepare;
      ExecSQL;
      close;
      sql.Clear;
      close;
      sql.Clear;
      {(*}
      sql.add('UPDATE ' + '  usuarios ' + 'SET ' + '  configBase=:configBase ' + 'WHERE ' + '  email=:email');
        {*)}
      ParamByName('configBase').AsString := CodUnicoEmpresaActiva;
      ParamByName('email').AsString := ID_usuario;
      prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
    conDB.free;
  end;
end;

/// <summary>TODO: Descripción de modificaEmpresa.</summary>
procedure modificaEmpresa(IdFiscal, nombre, direccion, localidad, provincia, email, tfno, CodUnico, LogoEmpresa: string);
var
  qry: TUniQuery;
  FechaHora: TDateTime;
  ConDB: TUniConnection;
  th1: thActualizaCodEmpresaActiva;
begin
  qry := TUniQuery.Create(nil);
  ConDB := TUniConnection.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      FechaHora := now;
      close;
      SQL.Clear;
      {(*}
      sql.Add('UPDATE empresas ' + 'SET ' + '  nombre = :nombre, ' +
        '  direccion = :direccion, ' + '  localidad = :localidad, ' +
        '  provincia = :provincia, ' + '  email = :email, ' + '  tfno = :tfno, '
        + '  fechaModificacion = :fechaModificacion ' + 'WHERE ' + '  CodUnico = :CodUnico');
        {*)}
      ParamByName('CodUnico').AsString := CodUnico.Trim;
      ParamByName('nombre').AsString := nombre.Trim;
      ParamByName('direccion').AsString := direccion.Trim;
      ParamByName('localidad').AsString := localidad.Trim;
      ParamByName('provincia').AsString := provincia.Trim;
      ParamByName('email').AsString := email.Trim;
      ParamByName('tfno').AsString := tfno.Trim;
      ParamByName('fechaModificacion').AsDateTime := FechaHora;
      Prepare;
      ExecSQL;
      close;
      sql.Clear;
      {(*}
      sql.Add('UPDATE empresas_config' + 'SET nDecimales = :nDecimales,' +
        '    ndecimalesMoneda = :nDecimalesMoneda,' +
        '    autoguardado = :autoguardado,' + '    tAutoguardado = :tAutoguardado,'
        + '    RConstitucionProyecto = :RConstitucionProyecto,' +
        '    RAnalisisPrecios = :RAnalisisPrecios,' +
        '    RcronogramaTrabajo = :RCronogramaTrabajo,' + '    RCronogramaValorado = :RCronogramaValorado,'
        + '    RDesagregacionTecnologica = :RDesagregacionTecnologica,' +
        '    REDTDiccionario = :REDTDiccionario,' +
        '    REDTListado = :REDTListado,' + '    REDTValorada = :REDTValorada,'
        + '    REquipoProyecto = :REquipoProyecto,' +
        '    RDescomposicionOrganizacion = :RDescomposicionOrganizacion,' +
        '    RFormulaPolinomicas = :RFormulaPolinomicas,' +
        '    RGestionTiempos = :RGestionTiempos,' + '    RPorcentajeIndirectos = :RPorcentajeIndirectos,'
        + '    RPresupuestos = :RPresupuestos,' +
        '    LogoEmpresa = :LogoEmpresa ' + 'WHERE CodUnico = :CodUnico');
        {*)}
      ParamByName('codUnico').AsString := CodUnico.Trim;
      ParamByName('nDecimales').AsInteger := frmmain.cbb_NdecimalesPresupuestos.ItemIndex;
      ParamByName('nDecimalesMoneda').AsInteger := frmmain.cbb_Ndecimalesmoneda.ItemIndex;
      ParamByName('autoguardado').AsBoolean := frmMain.chkAutoGuardado.IsChecked;
      ParamByName('tAutoguardado').AsInteger := trunc(frmMain.nEDT_autoguardado.value);
      ParamByName('RConstitucionProyecto').AsString := frmMain.cbb_cfgActaConstitucion.Items[frmMain.cbb_cfgActaConstitucion.ItemIndex];
      ParamByName('RAnalisisPrecios').AsString := frmMain.cbb_cfgAnalisisPrecios.Items[frmMain.cbb_cfgAnalisisPrecios.ItemIndex];
      ParamByName('RCronogramaTrabajo').AsString := frmMain.cbb_cfgCronoTrabajo.Items[frmMain.cbb_cfgCronoTrabajo.ItemIndex];
      ParamByName('RCronogramaValorado').AsString := frmMain.cbb_cfgCronoValorado.Items[frmMain.cbb_cfgCronoValorado.ItemIndex];
      ParamByName('RDesagregacionTecnologica').AsString := frmMain.cbb_cfgDesagrecacionTecnologica.Items[frmMain.cbb_cfgDesagrecacionTecnologica.ItemIndex];
      ParamByName('REDTDiccionario').AsString := frmMain.cbb_cfgEDTDiccionario.Items[frmMain.cbb_cfgEDTDiccionario.ItemIndex];
      ParamByName('REDTListado').AsString := frmMain.cbb_cfgEDTListado.Items[frmMain.cbb_cfgEDTListado.ItemIndex];
      ParamByName('REDTValorada').AsString := frmMain.cbb_cfgEDTValorada.Items[frmMain.cbb_cfgEDTValorada.ItemIndex];
      ParamByName('REquipoProyecto').AsString := frmMain.cbb_cfgEquipoProyecto.Items[frmMain.cbb_cfgEquipoProyecto.ItemIndex];
      ParamByName('RDescomposicionOrganizacion').AsString := frmMain.cbb_cfgDescomposicionOrganizacion.Items[frmMain.cbb_cfgDescomposicionOrganizacion.ItemIndex];
      ParamByName('RFormulaPolinomicas').AsString := frmMain.cbb_cfgFormulaPolinomica.Items[frmMain.cbb_cfgFormulaPolinomica.ItemIndex];
      ParamByName('RGestionTiempos').AsString := frmMain.cbb_cfgGestionTiempos.Items[frmMain.cbb_cfgGestionTiempos.ItemIndex];
      ParamByName('RPorcentajeIndirectos').AsString := frmMain.cbb_cfgPorcentajeIndirecto.Items[frmMain.cbb_cfgPorcentajeIndirecto.ItemIndex];
      ParamByName('RPresupuestos').AsString := frmMain.cbb_cfgPresupuestos.Items[frmMain.cbb_cfgPresupuestos.ItemIndex];
      ParamByName('LogoEmpresa').AsString := LogoEmpresa;
      Prepare;
      ExecSQL;

      close;
      sql.Clear;
      close;
      sql.Clear;
      {(*}
      sql.add('UPDATE usuarios ' + 'SET ' + '  configBase=:configBase ' + 'WHERE email=:email');
      {*)}
      ParamByName('configBase').AsString := CodUnicoEmpresaActiva;
      ParamByName('email').AsString := ID_usuario;
      prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de ExisteEmpresa.</summary>
/// <param name="codUnico">TODO.</param>
/// <returns>TODO.</returns>
function ExisteEmpresa(codUnico: string): Boolean;
var
  qry: TUniQuery;
  tmpstr: string;
begin
  result := false;
  qry := TUniQuery.Create(nil);
  if codUnico <> '' then
  begin
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        SQL.Clear;
        sql.Add('select * from empresas where CodUnico=:CodUnico');
        ParamByName('codUnico').AsString := codUnico;
        prepare;
        ExecSQL;
        tmpstr := FieldByName('codUnico').AsString;
        if tmpstr <> '' then
          result := true;
      end;
    finally
      qry.free;
    end;
  end;
end;

/// <summary>TODO: Descripción de generaListadoRecursosImportar.</summary>
procedure generaListadoRecursosImportar();
var
  x: Integer;
  tmpstr: string;
begin
  for x := 0 to Length(listadoAPUImportar) - 1 do
  begin
    tmpstr := crearAccionImportacion(listadoAPUImportar[x]);
    if (tmpstr = 'Nuevo') or (tmpstr = 'Mantener') then
      listadoAPUImportar[x].accion := tmpstr;
    if (tmpstr <> 'Nuevo') and (tmpstr <> 'Mantener') then
    begin
      listadoAPUImportar[x].accion := 'Actualizar';
      listadoAPUImportar[x].codApu := tmpstr;
    end;
  end;
  for x := 0 to Length(listadoAPUImportar) - 1 do
  begin
    setlength(listadoRecursosImportarAPU, 0);

    if listadoAPUImportar[x].accion = 'Nuevo' then
    begin
      listadoAPUImportar[x] := actualizarDatosAPUImportar(listadoAPUImportar[x]);
      listadoAPUImportar[x] := ImportacionApusNuevo(listadoAPUImportar[x]);
      ImportarActualizarRecursoAPUDBOrigen(listadoAPUImportar[x].codBaseOrigen, listadoAPUImportar[x].codAPUOrigen, listadoAPUImportar[x].codApu, listadoAPUImportar[x].codPresupuestoOrigen, listadoAPUImportar[x].revisionOrigen);
      CreaItemsApuImportar;
      PasarAPUaRecurso(listadoAPUImportar[x]);
      actualizarApusBase(listadoAPUImportar[x].codApu);
    end;

    if listadoAPUImportar[x].accion = 'Actualizar' then
    begin
      ActualizacionApusImportar(listadoAPUImportar[x]);
      listadoAPUImportar[x] := actualizarDatosAPUImportar(listadoAPUImportar[x]);
      listadoAPUImportar[x] := ImportacionApusNuevo(listadoAPUImportar[x]);
      ImportarActualizarRecursoAPUDBOrigen(listadoAPUImportar[x].codBaseOrigen, listadoAPUImportar[x].codAPUOrigen, listadoAPUImportar[x].codApu, listadoAPUImportar[x].codPresupuestoOrigen, listadoAPUImportar[x].revisionOrigen);
      CreaItemsApuImportar;
      actualizarApusBase(listadoAPUImportar[x].codApu);
    end;
  end;
end;

/// <summary>TODO: Descripción de PasarAPUaRecurso.</summary>
/// <param name="APUDestino">TODO.</param>
procedure PasarAPUaRecurso(APUDestino: dat_importAPU);
var
  qry: TUniQuery;
  idUnicoRecurso: string;
  especificaciones: string;
  codRecursoApu: string;
  codRecursoCompleto: string;
  codCategoriaBase: string;
  codSubCategoria: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      especificaciones := 'APU: ' + APUDestino.codAPU;
      APUDestino.idUnicoApuRecurso := 'Rsr' + generaCodigoUnico;
      codSubCategoria := APUDestino.codSubCategoriaAPU;
      codRecursoApu := daCodigoRecursoDestinoImportar('6', codSubCategoria);
      codRecursoCompleto := generaCodigoRecurso('6', codSubCategoria, codRecursoApu);
      close;
      SQL.Clear;
      {(*}
      sql.Add('INSERT INTO recursos ' + '      ( ' + '        idunico, ' +
        '        codbase, ' + '        codrecurso, ' +
        '        codrecursocompleto, ' + '        codcategoriabase, ' +
        '        codsubcategoria, ' + '        descripcion, ' +
        '        unidad, ' + '        precio, ' + '        preciolocal, ' +
        '        moneda, ' + '        especificaciones, ' +
        '        fechahoracreacion, ' + '        ultimamodificacion ' +
        '      ) ' + 'VALUES ' + '      ( ' + '        :idUnico, ' +
        '        :codBase, ' + '        :codRecurso, ' +
        '        :codRecursoCompleto, ' + '        :codCategoriaBase, ' +
        '        :codSubCategoria, ' + '        :Descripcion, ' +
        '        :unidad, ' + '        :precio, ' + '        :preciolocal, ' +
        '        :moneda, ' + '        :especificaciones, ' +
        '        :fechahoraCreacion, ' + '        :ultimaModificacion ' + '    )');
        {*)}
      ParamByName('idUnico').AsString := APUDestino.idUnicoApuRecurso;
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codRecurso').AsString := codRecursoApu;
      ParamByName('codRecursoCompleto').AsString := codRecursoCompleto;
      ParamByName('codCategoriaBase').AsString := '6';
      ParamByName('codSubCategoria').AsString := codSubCategoria;
      ParamByName('Descripcion').AsString := APUDestino.descripcion;
      ParamByName('unidad').AsString := APUDestino.unidad;
      ParamByName('precio').AsFloat := StrToFloat(decimal_correcto(APUDestino.precio));
      ParamByName('precioLocal').AsFloat := StrToFloat(decimal_correcto(APUDestino.precio));
      ParamByName('moneda').AsString := base_activa.moneda;
      ParamByName('especificaciones').AsString := especificaciones;
      ParamByName('fechaHoraCreacion').AsDateTime := now;
      ParamByName('ultimaModificacion').AsDateTime := now;
      prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de ActualizacionApusImportar.</summary>
/// <param name="datosImportar">TODO.</param>
procedure ActualizacionApusImportar(datosImportar: dat_importAPU);
var
  codApuBorrar: string;
  qry: TUniQuery;
begin
  codApuBorrar := datosImportar.codAPU;
  if codApuBorrar <> '' then
  begin
    qry := TUniQuery.Create(nil);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        SQL.Clear;
        sql.Add('delete from apus_items where codApu=:codApu and codBase=:codBase');
        ParamByName('codApu').AsString := codApuBorrar;
        ParamByName('codBase').AsString := base_activa.codBase;
        Prepare;
        ExecSQL;
      end;
    finally
      qry.Free;
    end;
  end;
end;

/// <summary>TODO: Descripción de ImportacionApusNuevo.</summary>
/// <param name="datosImportar">TODO.</param>
/// <returns>TODO.</returns>
function ImportacionApusNuevo(datosImportar: dat_importAPU): dat_importAPU;
var
  CodAPUNueva: string;
begin
  CodAPUNueva := crearApuImportar(datosImportar);
  datosImportar.codAPU := CodAPUNueva;
  result := datosImportar;
end;

/// <summary>TODO: Descripción de CreaItemsApuImportar.</summary>
procedure CreaItemsApuImportar();
var
  qry: TUniQuery;
  x: Integer;
  Tprecio, Trendimiento, Tcantidad, Ttotal: Double;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Add('INSERT INTO apus_Items ' + '      ( ' + '        codBase, ' +
        '        codAPU, ' + '        codCategoria, ' +
        '        codSubCategoria, ' + '        idUnicoRecurso, ' +
        '        codRecurso, ' + '        codRecursoCompleto, ' +
        '        descripcion, ' + '        unidad, ' + '        precio, ' +
        '        moneda, ' + '        cantidadUnidad, ' +
        '        Rendimiento, ' + '        Total ' + '      ) ' + 'VALUES ' +
        '      ( ' + '        :codBase, ' + '        :codAPU, ' +
        '        :codCategoria, ' + '        :codSubCategoria, ' +
        '        :idUnicoRecurso, ' + '        :codRecurso, ' +
        '        :codRecursoCompleto, ' + '        :descripcion, ' +
        '        :unidad, ' + '        :precio, ' + '        :moneda, ' +
        '        :cantidadUnidad, ' + '        :Rendimiento, ' + '        :Total ' + '      )');
        {*)}
      for x := 0 to length(listadoRecursosImportarAPU) - 1 do
      begin
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codAPU').AsString := listadoRecursosImportarAPU[x].codApu;
        ParamByName('codCategoria').AsString := listadoRecursosImportarAPU[x].codCategoriaBase;
        ParamByName('codSubCategoria').AsString := listadoRecursosImportarAPU[x].codSubCategoria;
        ParamByName('idUnicoRecurso').AsString := listadoRecursosImportarAPU[x].IdUnico;
        ParamByName('codRecurso').AsString := listadoRecursosImportarAPU[x].codRecurso;
        ParamByName('codRecursoCompleto').AsString := listadoRecursosImportarAPU[x].codRecursoCompleto;
        ParamByName('descripcion').AsString := listadoRecursosImportarAPU[x].descripcion;
        ParamByName('unidad').AsString := listadoRecursosImportarAPU[x].unidad;
        ParamByName('precio').AsFloat := StrToFloat(decimal_correcto(listadoRecursosImportarAPU[x].precio));
        Tprecio := StrToFloat(decimal_correcto(listadoRecursosImportarAPU[x].precio));
        ParamByName('moneda').AsString := base_activa.moneda;
        ParamByName('cantidadUnidad').AsFloat := StrToFloat(decimal_correcto(listadoRecursosImportarAPU[x].cantidad));
        Tcantidad := StrToFloat(decimal_correcto(listadoRecursosImportarAPU[x].cantidad));
        ParamByName('rendimiento').AsFloat := StrToFloat(decimal_correcto(listadoRecursosImportarAPU[x].rendimiento));
        Trendimiento := StrToFloat(decimal_correcto(listadoRecursosImportarAPU[x].rendimiento));
        Ttotal := Trendimiento * Tcantidad * Tprecio;
        ParamByName('total').AsFloat := RoundTo(Ttotal, -2);
        ExecSQL;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure ImportarActualizarRecursoAPUDBOrigen(dbOrigen: string; codApuOrigen: string; CodAPUDestino: string; codPresupuestoOrigen: string; revisionOrigen: string);
var
  qry: TUniQuery;
  x: integer;
  idUnicoRecurso: string;
  codSubcategoria: string;
  tmpstr: string;
  codRecurso: string;
  codRecursoCompleto: string;
  respuesta1: dat_respuesta1;
  sqlstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      if codPresupuestoOrigen = '' then
      begin
        sqlstr := 'select * from apus_items where codBase=:codBase and codAPU=:codAPU';
        sql.Add(sqlstr);
      end
      else
      begin
        {(*}
        sqlstr := 'SELECT ' + '        RecursoBase.idUnicoRecurso, ' +
          '        COALESCE( ' + '          redondea( ' +
          '            RecursoTanteo.Precio, ' + '            dg.ndecimalesMoneda), '
          + '          redondea( ' + '            RecursoBase.Precio, ' +
          '            dg.ndecimalesMoneda)) AS Precio, ' + '        COALESCE( '
          + '          redondea( ' + '            RecursoTanteo.Rendimiento, ' +
          '            dg.ndecimalesMoneda), ' + '          redondea( ' +
          '            RecursoBase.Rendimiento, ' +
          '            dg.ndecimalesMoneda)) AS Rendimiento, ' + '        COALESCE( '
          + '          redondea( ' +
          '            RecursoTanteo.CantidadUnidad, ' + '            dg.ndecimalesMoneda), '
          + '          redondea( ' + '            RecursoBase.CantidadUnidad, '
          + '            dg.ndecimalesMoneda)) AS CantidadUnidad ' + 'FROM ' +
          '        apus_items RecursoBase ' + '    LEFT JOIN ' +
          '      presupuestos_tanteo_recursos RecursoTanteo ' +
          '        ON RecursoTanteo.codBase = RecursoBase.codBase ' +
          '          AND RecursoTanteo.idUnicoRecurso = RecursoBase.idUnicoRecurso ' +
          '          AND RecursoTanteo.codPresupuesto = :codPresupuesto ' +
          '          AND RecursoTanteo.revision = :revision ' +
          '    INNER JOIN ' + '      presupuestos_datosgenerales dg ' +
          '        ON dg.codBase = recursobase.codBase ' +
          '          AND dg.codPresupuesto = :codPresupuesto ' +
          '          AND dg.revision = :revision ' + 'WHERE ' +
          '        RecursoBase.codBase = :codBase ' + '        AND RecursoBase.codAPU = :codAPU';
          {*)}
        sql.Add(sqlstr);
        ParamByName('codPresupuesto').AsString := codPresupuestoOrigen;
        ParamByName('revision').AsString := revisionOrigen;
      end;

      ParamByName('codBase').AsString := dbOrigen;
      ParamByName('codAPU').AsString := codApuOrigen;
      Prepare;
      ExecSQL;
      x := length(listadoRecursosImportarAPU);
      while not Eof do
      begin
        SetLength(listadoRecursosImportarAPU, x + 1);
        listadoRecursosImportarAPU[x].IdUnico := FieldByName('idUnicoRecurso').AsString;
        listadoRecursosImportarAPU[x].codBaseOrigen := dbOrigen;
        listadoRecursosImportarAPU[x].rendimiento := decimal_correcto(fieldbyname('rendimiento').AsString);
        listadoRecursosImportarAPU[x].cantidad := decimal_correcto(FieldbyName('CantidadUnidad').AsString);
        listadoRecursosImportarAPU[x].codApu := CodAPUDestino;
        listadoRecursosImportarAPU[x].precio := decimal_correcto(FieldByName('precio').AsString);

        inc(x);
        Next;
      end;
      for x := 0 to length(listadoRecursosImportarAPU) - 1 do
      begin
        close;
        sql.Clear;
        sqlstr := 'select * from recursos where codBase=' + QuotedStr(listadoRecursosImportarAPU[x].codBaseOrigen) + ' and idUnico=' + QuotedStr(listadoRecursosImportarAPU[x].IdUnico);
        sql.Add(sqlstr);
        prepare;
        ExecSQL;
        listadoRecursosImportarAPU[x].codCategoriaBase := FieldByName('codCategoriaBase').AsString;
        listadoRecursosImportarAPU[x].descripcion := FieldByName('descripcion').AsString;
        listadoRecursosImportarAPU[x].unidad := FieldByName('unidad').AsString;
        listadoRecursosImportarAPU[x].especificaciones := FieldByName('especificaciones').AsString;
        listadoRecursosImportarAPU[x].especificaciones2 := FieldByName('especificaciones2').AsString.Trim;
        close;
        sql.clear;
        sql.Add('select * from recursos where codBase=' + QuotedStr(base_activa.codBase) + ' and descripcion=:descripcion and unidad=:unidad');
        ParamByName('descripcion').AsString := listadoRecursosImportarAPU[x].descripcion;
        ParamByName('unidad').AsString := listadoRecursosImportarAPU[x].unidad;
        Prepare;
        ExecSQL;
        idUnicoRecurso := FieldByName('idUnico').AsString;
        if idUnicoRecurso = '' then
        begin
          idUnicoRecurso := generaCodigoUnico;
          idUnicoRecurso := 'Rsr' + idUnicoRecurso;
          listadoRecursosImportarAPU[x].IdUnico := idUnicoRecurso;
          respuesta1 := daCodigoCategoriaGeneral(listadoRecursosImportarAPU[x].codCategoriaBase);
          listadoRecursosImportarAPU[x].codSubcategoria := respuesta1.codSubCategoria;
          listadoRecursosImportarAPU[x].codRecurso := respuesta1.codRecurso;
          codSubcategoria := respuesta1.codSubcategoria;
          codRecurso := respuesta1.codRecurso;
          codRecursoCompleto := generaCodigoRecurso(listadoRecursosImportarAPU[x].codCategoriaBase, codSubcategoria, codRecurso);
          listadoRecursosImportarAPU[x].codRecursoCompleto := codRecursoCompleto;
          Close;
          sql.Clear;
          {(*}
          sql.Add('INSERT INTO recursos ' + '      ( ' + '        idUnico, ' +
            '        codBase, ' + '        codRecurso, ' +
            '        codRecursoCompleto, ' + '        codCategoriaBase, ' +
            '        codSubCategoria, ' + '        descripcion, ' +
            '        unidad, ' + '        precio, ' + '        preciolocal, ' +
            '        moneda, ' + '        Especificaciones, ' +
            '        Especificaciones2, ' + '        fechaHoraCreacion, ' +
            '        ultimaModificacion ' + '      ) ' + 'VALUES ' + '    ( ' +
            '      :idUnico, ' + '      :codBase, ' + '      :codRecurso, ' +
            '      :codRecursoCompleto, ' + '      :codCategoriaBase, ' +
            '      :codSubCategoria, ' + '      :descripcion, ' +
            '      :unidad, ' + '      :precio, ' + '      :precioLocal, ' +
            '      :moneda, ' + '      :especificaciones, ' +
            '      :especificaciones2, ' + '      :fechaHoraCreacion, ' +
            '      :ultimaModificacion ' + '   )');
            {*)}
          ParamByName('idUnico').AsString := idUnicoRecurso;
          ParamByName('codBase').AsString := base_activa.codBase;
          ParamByName('codCategoriaBase').AsString := listadoRecursosImportarAPU[x].codCategoriaBase;
          ParamByName('codSubCategoria').AsString := codSubcategoria;
          ParamByName('codRecurso').AsString := codRecurso;
          ParamByName('codRecursoCompleto').AsString := codRecursoCompleto;
          ParamByName('descripcion').AsString := listadoRecursosImportarAPU[x].descripcion;
          ParamByName('unidad').AsString := listadoRecursosImportarAPU[x].unidad;
          ParamByName('precio').AsFloat := StrToFloat(decimal_correcto(listadoRecursosImportarAPU[x].precio));
          ParamByName('precioLocal').AsFloat := StrToFloat(decimal_correcto(listadoRecursosImportarAPU[x].precio));
          ParamByName('moneda').AsString := base_activa.moneda;
          ParamByName('especificaciones').AsString := listadoRecursosImportarAPU[x].especificaciones;
          ParamByName('especificaciones2').AsString := listadoRecursosImportarAPU[x].especificaciones2;
          ParamByName('fechaHoraCreacion').AsDateTime := Now;
          ParamByName('ultimaModificacion').AsDateTime := Now;
          Prepare;
          ExecSQL;
        end
        else
        begin
          listadoRecursosImportarAPU[x].IdUnico := idUnicoRecurso;
          listadoRecursosImportarAPU[x].codRecursoCompleto := FieldByName('codRecursoCompleto').AsString;
          close;
          sql.Clear;
          {(*}
          sql.Add('UPDATE ' + 'recursos ' + 'SET ' + '  precio = :precio, ' +
            '  precioLocal = :precioLocal, ' +
            '  ultimaModificacion = :ultimaModificacion ' + 'WHERE ' + '  idUnico = :idUnicoRecurso '
            + '  AND codBase = :codBase');
            {*)}
          Prepare;
          ParamByName('idUnicoRecurso').AsString := idUnicoRecurso;
          ParamByName('codBase').AsString := base_activa.codBase;
          ParamByName('precio').AsFloat := StrToFloat(decimal_correcto(listadoRecursosImportarAPU[x].precio));
          ParamByName('preciolocal').AsFloat := StrToFloat(decimal_correcto(listadoRecursosImportarAPU[x].precio));
          ParamByName('ultimaModificacion').AsDateTime := now;
          ExecSQL;
        end;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de daCodigoCategoriaGeneral.</summary>
/// <param name="codCategoriaBase">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoCategoriaGeneral(codCategoriaBase: string): dat_respuesta1;
var
  qry: TUniQuery;
  x: integer;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT Ciu ' + '  FROM categoriaapus ' +
        ' WHERE codBase = :codBase ' + '   AND categoria_base = :codCategoriaBase '
        + '   AND Descripcion = :descripcion');
        {*)}
      ParamByName('codbase').AsString := base_activa.codBase;
      ParamByName('codCategoriaBase').AsString := codCategoriaBase;
      ParamByName('descripcion').AsString := 'General';
      Prepare;
      ExecSQL;
      last;
      Result.codSubCategoria := FieldByName('Ciu').AsString;
      close;
      SQL.Clear;
      {(*}
      sql.Add('SELECT codRecurso ' + '  FROM recursos ' +
        ' WHERE codBase = :codBase ' + '   AND codCategoriaBase = :codCategoriaBase '
        + '   AND codSubCategoria = :codSubCategoria ' + ' ORDER BY codRecurso ASC');
        {*)}
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codCategoriaBase').AsString := codCategoriaBase;
      ParamByName('codSubCategoria').AsString := result.codSubCategoria;
      Prepare;
      ExecSQL;
      last;
      x := StrToIntDef(fieldbyname('codRecurso').asstring, 0);
      Inc(x);
      result.codRecurso := IntToStr(x);
    end;
  finally
    qry.free;
  end;
end;

/// <summary>TODO: Descripción de actualizarDatosAPUImportar.</summary>
/// <param name="APUImportar">TODO.</param>
/// <returns>TODO.</returns>
function actualizarDatosAPUImportar(APUImportar: dat_importAPU): dat_importAPU;
var
  qry: TUniQuery;
  tmpstr: string;
  codRecursoAPU: integer;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      {Actualizar codCategoriaApu y Recursos}
      sql.Clear;
      {(*}
      sql.Add('SELECT *' + ' FROM APUS ' + 'WHERE codBase = :codBase ' +
        '  AND CategoriaAPU = :CategoriaAPU ' + 'ORDER BY codRecursoAPU ASC');
        {*)}
      ParamByName('codbase').AsString := base_activa.codBase;
      ParamByName('categoriaAPU').AsString := APUImportar.Categoria;
      prepare;
      ExecSQL;
      Last;
      tmpstr := FieldByName('categoriaAPU').AsString;
      if tmpstr <> '' then
      begin
        codRecursoAPU := StrToIntDef(FieldByName('codRecursoAPU').AsString, 0);
        Inc(codRecursoAPU);
        APUImportar.codRecursoAPU := IntToStr(codRecursoAPU);
      end
      else
      begin
        close;
        sql.Clear;
        {(*}
        sql.Add('SELECT * ' + ' FROM categoriaApus ' +
          'WHERE codBase = :codBase ' + '  AND descripcion = :descripcion ' + '  AND categoria_base = 6');
          {*)}
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('descripcion').AsString := APUImportar.Categoria;
        prepare;
        ExecSQL;
        APUImportar.codCategoriaApu := FieldByName('ciu').AsString;
        APUImportar.codRecursoAPU := '1';
      end;
      {Actualizar Datos Adicionales desde Base de Origen}
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT * ' + '  FROM apus ' + ' WHERE codBase = :codBase ' + '   AND codAPU = :codAPU');
        {*)}
      ParamByName('codbase').AsString := APUImportar.codBaseOrigen;
      ParamByName('codAPU').AsString := APUImportar.codAPUOrigen;
      prepare;
      ExecSQL;
      APUImportar.rendimiento := decimal_correcto(fieldbyname('rendimiento').AsString);
      APUImportar.porcentajeIndirectos := decimal_correcto(FieldByName('PorcentajeCostoIndirecto').AsString);
      APUImportar.totalConIndirectos := decimal_correcto(FieldByName('PrecioUnitarioTotal').AsString);
      APUImportar.rendimientoHUnidad := decimal_correcto(FieldByName('rendimientoHUnidad').AsString);
      APUImportar.HCuadrillas := decimal_correcto(FieldByName('nhCuadrillas').AsString);
    end;
  finally
    qry.free;
    Result := APUImportar;
  end;
end;

/// <summary>TODO: Descripción de crearApuImportar.</summary>
/// <param name="APUImportar">TODO.</param>
/// <returns>TODO.</returns>
function crearApuImportar(APUImportar: dat_importAPU): string;
var
  qry: TUniQuery;
  codAPUNuevo: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      codAPUNuevo := GeneraCodUnicoAPU;
      close;
      sql.Clear;
      {(*}
      sql.Add('INSERT INTO apus ( ' + '  codBase, ' + '  codCategoriaAPU, ' +
        '  codRecursoAPU, ' + '  CategoriaAPU, ' + '  CodAPU, ' +
        '  Descripcion, ' + '  Unidad, ' + '  Rendimiento, ' +
        '  RendimientoTodoAnalisis, ' + '  RendimientoTodoEscenario, ' +
        '  FechaHoraCreacion, ' + '  CostoDirectoTotal, ' +
        '  CostoIndirectoTotal, ' + '  PorcentajeCostoIndirecto, ' +
        '  PrecioUnitarioTotal, ' + '  moneda, ' + '  ultimaModificacion, ' +
        '  pendienteRevision, ' + '  rendimientoHUnidad, ' + '  nhCuadrillas, '
        + '  anidado) ' + 'VALUES ( ' + '  :codBase, ' + '  :codCategoriaAPU, '
        + '  :codRecursoAPU, ' + '  :CategoriaAPU, ' + '  :CodAPU, ' +
        '  :Descripcion, ' + '  :Unidad, ' + '  :Rendimiento, ' +
        '  :RendimientoTodoAnalisis, ' + '  :RendimientoTodoEscenario, ' +
        '  :FechaHoraCreacion, ' + '  :CostoDirectoTotal, ' +
        '  :CostoIndirectoTotal, ' + '  :PorcentajeCostoIndirecto, ' +
        '  :PrecioUnitarioTotal, ' + '  :moneda, ' + '  :ultimaModificacion, ' +
        '  :pendienteRevision, ' + '  :rendimientoHUnidad, ' + '  :nhCuadrillas, ' + '  :anidado)');
        {*)}
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codCategoriaAPU').AsString := APUImportar.codSubCategoriaApu;
      ParamByName('codRecursoAPU').AsString := APUImportar.codRecursoAPU;
      ParamByName('CategoriaAPU').AsString := APUImportar.Categoria;
      ParamByName('codAPU').AsString := codAPUNuevo;
      ParamByName('Descripcion').AsString := APUImportar.descripcion;
      ParamByName('Unidad').AsString := APUImportar.unidad;
      ParamByName('RendimientoTodoAnalisis').AsBoolean := False;
      ParamByName('RendimientoTodoEscenario').AsBoolean := True;
      ParamByName('fechaHoraCreacion').AsDateTime := Now;
      ParamByName('CostoDirectoTotal').AsFloat := StrToFloat(decimal_correcto(APUImportar.precio));
      ParamByName('CostoIndirectoTotal').AsFloat := StrToFloat(decimal_correcto(APUImportar.totalConIndirectos));
      ParamByName('PorcentajeCostoIndirecto').AsFloat := StrToFloat(decimal_correcto(APUImportar.porcentajeIndirectos));
      ParamByName('PrecioUnitarioTotal').AsFloat := StrToFloat(decimal_correcto(APUImportar.totalConIndirectos));
      ParamByName('moneda').AsString := base_activa.moneda;
      ParamByName('ultimaModificacion').AsDateTime := Now;
      ParamByName('pendienteRevision').AsBoolean := False;
      ParamByName('rendimientoHUnidad').AsFloat := StrToFloat(decimal_correcto(APUImportar.rendimientoHUnidad));
      ParamByName('nhCuadrillas').AsFloat := StrToFloat(decimal_correcto(APUImportar.HCuadrillas));
      ParamByName('anidado').AsBoolean := APUImportar.anidado;
      Prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
    Result := codAPUNuevo;
  end;
end;

/// <summary>TODO: Descripción de crearAccionImportacion.</summary>
/// <param name="datosImportar">TODO.</param>
/// <returns>TODO.</returns>
function crearAccionImportacion(datosImportar: dat_importAPU): string;
var
  qry: TUniQuery;
  fechaOrigen: TdateTime;
  fechaDestino: TDatetime;
begin
  result := '';
  qry := TUniQuery.Create(nil);
  fechaOrigen := strtodatetime(fecha0);
  fechaDestino := strtodatetime(fecha0);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      fechaOrigen := datosImportar.fechaHoraActualizacion;
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT * ' + '  FROM APUS ' +
        ' WHERE descripcion = :descripcion ' + '   AND unidad = :unidad ' + '   AND codBase = :codBase');
        {*)}
      ParamByName('descripcion').AsString := datosImportar.descripcion;
      ParamByName('unidad').AsString := datosImportar.unidad;
      ParamByName('codBase').AsString := base_activa.codBase;
      Prepare;
      ExecSQL;
      fechaDestino := FieldByName('ultimaModificacion').AsDateTime;
      if fechaDestino = strtodate('30/12/1899') then
        result := 'Nuevo'
      else
      begin
        if fechaOrigen > fechaDestino then
        begin
          result := FieldByName('codAPU').AsString;
        end
        else
          Result := 'Mantener';
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de CreaSubCategoriasIniciales.</summary>
/// <param name="CodBase">TODO.</param>
/// <param name="nombreBase">TODO.</param>
procedure CreaSubCategoriasIniciales(CodBase, nombreBase: string);
const
  NombreCategoriaInicial = 'General';
var
  qry: TUniQuery;
  x: integer;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      for x := 1 to 6 do
      begin
        close;
        sql.Clear;
        {(*}
        sql.Add('INSERT INTO categoriaApus ( ' + '  codBase, ' +
          '  categoria_base, ' + '  ciu, ' + '  nombreBase, ' +
          '  Descripcion, ' + '  origen, ' + '  fechaCreacion) ' + 'VALUES ( ' +
          '  :codBase, ' + '  :categoria_base, ' + '  :ciu, ' +
          '  :nombreBase, ' + '  :Descripcion, ' + '  :origen, ' + '  :fechaCreacion)');
          {*)}
        ParamByName('codbase').AsString := CodBase;
        ParamByName('categoria_base').AsString := IntToStr(x);
        ParamByName('Ciu').AsString := '1';
        ParamByName('nombreBase').AsString := nombreBase;
        ParamByName('descripcion').AsString := NombreCategoriaInicial;
        ParamByName('origen').AsString := 'Usuario';
        ParamByName('fechaCreacion').AsDateTime := Now;
        Prepare;
        ExecSQL;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure AjustaGridTMSAutomatico(grid: TTMSFMXGrid; columnaPrincipal: Integer);
var
  x: integer;
  columnas: integer;
  valor1: Double;
  valor2: Double;
  tmpstr: string;
  ajustar: Boolean;
begin
  valor1 := grid.Width;
  valor2 := 0;
  columnas := grid.ColumnCount;
  grid.Columns[columnaPrincipal].Width := 0;
  for x := 0 to columnas - 1 do
  begin
    tmpstr := grid.Cells[x, 0];
    if grid.Columns[x].Width > 0 then
      ajustar := true
    else
      ajustar := False;
    if ajustar then
      grid.AutoSizeColumn(x);
    if (x <> columnaPrincipal) and (ajustar) then
    begin
      valor2 := valor2 + grid.Columns[x].Width;
    end;
  end;
  grid.Columns[columnaPrincipal].Width := valor1 - valor2 - 20;
end;

procedure AjustaGridAutomatico(grid: TTMSFNCGrid; columnaPrincipal: Integer);
var
  x: integer;
  columnas: integer;
  valor1: Double;
  valor2: Double;
  tmpstr: string;
  ajustar: Boolean;
begin
  valor1 := grid.Width;
  valor2 := 0;
  columnas := grid.ColumnCount;
  grid.Columns[columnaPrincipal].Width := 0;
  for x := 0 to columnas - 1 do
  begin
    tmpstr := grid.Cells[x, 0];
    if grid.Columns[x].Width > 0 then
      ajustar := true
    else
      ajustar := False;
    if ajustar then
      grid.AutoSizeColumn(x);
    if (x <> columnaPrincipal) and (ajustar) then
    begin
      valor2 := valor2 + grid.Columns[x].Width;
    end;
  end;
  grid.Columns[columnaPrincipal].Width := valor1 - valor2 - 20;
end;

/// <summary>TODO: Descripción de QuitarEspeciales.</summary>
/// <param name="Cad">TODO.</param>
/// <returns>TODO.</returns>
function QuitarEspeciales(const Cad: string): string;
const
  VALIDOS =[ ' ',  '0'.. '9',  'A'.. 'Z',  'a'.. 'z',  'á',  'é',  'í',  'ó',  'ú',  '.',  ',',  '-',  '_'];
var
  i: Integer;
begin
  Result := '';
  for i := 1 to Length(Cad) do
    if Cad[i] in VALIDOS then
      Result := Result + Cad[i]
end;

/// <summary>TODO: Descripción de actualizarApusBase.</summary>
/// <param name="codAPU">TODO.</param>
procedure actualizarApusBase(codAPU: string);
type
  dat_recursosAPUActualizar = record
    idUnicoRecurso: string;
    descripcion: string;
    Unidad: string;
    precio: string
  end;
var
  qry: TUniQuery;
  x: integer;
  especificacionesAPU: string;
  listaActualizar: array of dat_recursosAPUActualizar;
begin
  qry := TUniQuery.Create(nil);
  especificacionesAPU := 'APU: ' + codAPU;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      {(*}
      sql.Add('SELECT idUnicoRecurso, ' + '       descripcion, ' +
        '       unidad, ' + '       precio ' + '  FROM APUS_items ' +
        ' WHERE codAPU = :codAPU ' + '   AND codBase = :codBase');
        {*)}
      ParamByName('codAPU').AsString := codAPU;
      ParamByName('codBase').AsString := base_activa.codBase;
      prepare;
      ExecSQL;
      x := 0;
      while not Eof do
      begin
        SetLength(listaActualizar, x + 1);
        listaActualizar[x].idUnicoRecurso := FieldByName('idUnicoRecurso').AsString;
        listaActualizar[x].descripcion := FieldByName('descripcion').AsString;
        listaActualizar[x].Unidad := FieldByName('unidad').AsString;
        listaActualizar[x].precio := FieldByName('precio').AsString;
        Next;
        Inc(x);
      end;
    end;
    for x := 0 to length(listaActualizar) - 1 do
    begin
      actualizaDatosRecurso(listaActualizar[x].idUnicoRecurso, listaActualizar[x].descripcion, listaActualizar[x].Unidad, listaActualizar[x].precio);
    end;
  finally
    qry.Free;
  end;
end;

procedure actualizaDatosRecurso(idUnicoRecurso: string; descripcion: string; unidad: string; precio: string);
var
  qry: TUniQuery;
  listadoCodAPUsActualizar: TStringList;
  tmpstr: string;
  consultaSQL: string;
  x: integer;
  sTotalApu: string;
  subTotal: double;
  indirecto: Double;
  TotalAPU: Double;
  trigger: Boolean;
  Tprecio, Trendimiento, TcantidadUnidad: Double;
begin
  qry := TUniQuery.Create(nil);
  listadoCodAPUsActualizar := TStringList.Create;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      trigger := False;
      {Actualizar DB de Recursos}
      Close;
      sql.Clear;
      {(*}
      sql.Add('UPDATE recursos ' + '   SET descripcion = :descripcion, ' +
        '       unidad = :unidad, ' + '       precio = :precio, ' +
        '       preciolocal = :preciolocal, ' + '       ultimaModificacion = :ultimaModificacion '
        + 'WHERE codBase = :codBase ' + '  AND idUnico = :idUnicoRecurso');
        {*)}
      ParamByName('codbase').AsString := base_activa.codBase;
      ParamByName('idUnicoRecurso').AsString := idUnicoRecurso;
      ParamByName('descripcion').AsString := descripcion;
      ParamByName('unidad').AsString := unidad;
      ParamByName('precio').AsFloat := StrToFloat(decimal_correcto(precio));
      ParamByName('preciolocal').AsFloat := StrToFloat(decimal_correcto(precio));
      ParamByName('ultimaModificacion').AsDateTime := now;
      ExecSQL;

      {Actualizar DB de APUS_Items}

      // Listar APUS implicadas en actualizacion
      close;
      SQL.Clear;
      {(*}
      sql.Add('SELECT codAPU ' + '  FROM APUS_Items ' +
        ' WHERE codBase = :codBase ' + '   AND idUnicoRecurso = :idUnicoRecurso');
        {*)}
      ParamByName('codbase').AsString := base_activa.codBase;
      ParamByName('idUnicoRecurso').AsString := idUnicoRecurso;
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        tmpstr := FieldByName('codAPU').AsString;
        listadoCodAPUsActualizar.Add(tmpstr);
        Next;
      end;

      // Actualiza Precio, descripcion y unidad en los items de los apus
      close;
      SQL.Clear;
      {(*}
      sql.Add('UPDATE APUS_Items ' + '   SET descripcion = :descripcion, ' +
        '       unidad = :unidad, ' + '       precio = :precio ' +
        'WHERE codBase = :codBase ' + '  AND idUnicoRecurso = :idUnicoRecurso');
        {*)}
      ParamByName('codbase').AsString := base_activa.codBase;
      ParamByName('idUnicoRecurso').AsString := idUnicoRecurso;
      ParamByName('descripcion').AsString := descripcion;
      ParamByName('unidad').AsString := unidad;
      ParamByName('precio').Asfloat := strtofloat(decimal_correcto(precio));
      Prepare;
      ExecSQL;

      // Recalcular Valor de APUS
      for x := 0 to listadoCodAPUsActualizar.Count - 1 do
      begin
        close;
        SQL.Clear;
        {(*}
        consultaSQL := 'SELECT descripcion, ' + '       precio, ' +
          '       rendimiento, ' + '       cantidadUnidad ' +
          '  FROM APUS_Items ' + ' WHERE codBase = :codBase ' +
          '   AND idUnicoRecurso = :idUnicoRecurso ' + '   AND codAPU = :codAPU';
          {*)}
        SQL.Add(consultaSQL);
        ParamByName('codbase').AsString := base_activa.codBase;
        ParamByName('idUnicoRecurso').AsString := idUnicoRecurso;
        ParamByName('codAPU').AsString := listadoCodAPUsActualizar[x];
        Prepare;
        ExecSQL;
        tmpstr := FieldByName('descripcion').asstring;
        Tprecio := FieldByName('precio').AsFloat;
        Trendimiento := FieldByName('rendimiento').AsFloat;
        TcantidadUnidad := FieldByName('cantidadUnidad').AsFloat;
        TotalAPU := Tprecio * Trendimiento * TcantidadUnidad;

        close;
        sql.Clear;
        {(*}
        consultaSQL := 'UPDATE APUS_Items ' + '   SET total = :total ' +
          'WHERE codBase = :codBase ' + '  AND idUnicoRecurso = :idUnicoRecurso ' + '  AND codAPU = :codAPU';
          {*)}
        sql.Add(consultaSQL);
        ParamByName('codbase').AsString := base_activa.codBase;
        ParamByName('idUnicoRecurso').AsString := idUnicoRecurso;
        ParamByName('codAPU').AsString := listadoCodAPUsActualizar[x];
        ParamByName('total').AsFloat := TotalAPU;
        Prepare;
        ExecSQL;

        close;
        sql.Clear;
        {(*}
        consultaSQL := 'SELECT SUM(total) AS PrecioTotal ' +
          '  FROM APUS_Items ' + ' WHERE codBase = :codBase ' + '   AND codAPU = :codAPU';
          {*)}
        sql.Add(consultaSQL);
        ParamByName('codbase').AsString := base_activa.codBase;
        ParamByName('codAPU').AsString := listadoCodAPUsActualizar[x];
        prepare;
        ExecSQL;
        subTotal := FieldByName('PrecioTotal').AsFloat;
        indirecto := (base_activa.indirectos * subTotal) / 100;
        TotalAPU := subTotal + indirecto;
        close;
        sql.Clear;
        {(*}
        SQL.Add('UPDATE APUS ' +
          '   SET CostoDirectoTotal = :CostoDirectoTotal, ' + '       CostoIndirectoTotal = :CostoIndirectoTotal, '
          + '       PrecioUnitarioTotal = :precioUnitarioTotal, ' +
          '       ultimaModificacion = :ultimaModificacion ' +
          'WHERE codBase = :codBase ' + '  AND codAPU = :codAPU');
          {*)}
        ParamByName('codbase').AsString := base_activa.codBase;
        ParamByName('codAPU').AsString := listadoCodAPUsActualizar[x];
        ParamByName('CostoDirectoTotal').AsFloat := subTotal;
        ParamByName('costoIndirectoTotal').AsFloat := indirecto;
        ParamByName('PrecioUnitarioTotal').AsFloat := TotalAPU;
        ParamByName('ultimaModificacion').Asdatetime := Now;
        Prepare;
        ExecSQL;
      end;
    end;
  finally
    qry.Free;
    listadoCodAPUsActualizar.Free;
  end;
end;

/// <summary>TODO: Descripción de contarCaracteresenCadena.</summary>
/// <param name="cadena">TODO.</param>
/// <param name="caracter">TODO.</param>
/// <returns>TODO.</returns>
function contarCaracteresenCadena(cadena, caracter: string): integer;
var
  x, y: integer;
begin
  Result := -1;
  y := 0;
  for x := 1 to length(cadena) do
  begin
    if cadena[x] = caracter then
      inc(y);
  end;
  if y > 0 then
    result := y;
end;

/// <summary>TODO: Descripción de CrearApuNuevoImportar.</summary>
/// <param name="codBaseOrigen">TODO.</param>
/// <param name="codApuOrigen">TODO.</param>
/// <returns>TODO.</returns>
function CrearApuNuevoImportar(codBaseOrigen, codApuOrigen: string): string;
var
  qry: TUniQuery;
  APUOrigen: dat_importAPU;
  itemsAPU: array of dat_importAPUItem;
  codRecursoGenerado: string;
  costoDirectoAPU: double;
  porcentajeIndirectos: double;
  CostoTotalConIndirectos: Double;
  tmpstr: string;
  x: integer;
begin
  qry := TUniQuery.Create(nil);
  porcentajeIndirectos := base_activa.indirectos;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      {Crear APU como Recurso, guardar codRecursoGenerado}

      {Creacion APU}
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT * ' + '  FROM APUS ' + ' WHERE codBase = :codBase ' + '   AND codAPU = :codAPU');
        {*)}
      ParamByName('codbase').AsString := codBaseOrigen;
      ParamByName('codAPU').AsString := codApuOrigen;
      prepare;
      ExecSQL;
      APUOrigen.codCategoriaApu := FieldByName('codCategoriaApu').AsString;
      APUOrigen.codRecursoAPU := codRecursoGenerado;
      APUOrigen.Categoria := FieldByName('categoriaAPU').AsString;
      APUOrigen.codAPU := FieldByName('codAPU').AsString; // Revisar codigo
      APUOrigen.descripcion := FieldByName('descripcion').AsString;
      APUOrigen.unidad := FieldByName('unidad').AsString;
      APUOrigen.rendimiento := FieldByName('rendimiento').AsString;
      APUOrigen.fechaHoraCreacion := FieldByName('fechaHoraCreacoion').AsDateTime;
      APUOrigen.fechaHoraActualizacion := FieldByName('ultimaModificacion').AsDateTime;
      tmpstr := FieldByName('costoDirectoTotal').AsString;
      costoDirectoAPU := strtofloat(decimal_correcto(tmpstr));
      APUOrigen.precio := tmpstr;
      CostoTotalConIndirectos := costoDirectoAPU * (porcentajeIndirectos / 100);
      APUOrigen.porcentajeIndirectos := FloatToStr(porcentajeIndirectos);
      APUOrigen.totalConIndirectos := FloatToStr(CostoTotalConIndirectos);
      APUOrigen.rendimientoHUnidad := FieldByName('rendimientoHUnidad').AsString;
      APUOrigen.HCuadrillas := FieldByName('nhCuadrillas').AsString;
      APUOrigen.anidado := FieldByName('anidado').AsBoolean;
      close;
      sql.Clear;
      {(*}
      sql.Add('INSERT INTO apus ( ' + '  codBase, ' + '  codCategoriaAPU, ' +
        '  codRecursoAPU, ' + '  CategoriaAPU, ' + '  codAPU, ' +
        '  Descripcion, ' + '  Unidad, ' + '  Rendimiento, ' +
        '  RendimientoTodoAnalisis, ' + '  RendimientoTodoEscenario, ' +
        '  FechaHoraCreacion, ' + '  CostoDirectoTotal, ' +
        '  CostoIndirectoTotal, ' + '  PorcentajeCostoIndirecto, ' +
        '  PrecioUnitarioTotal, ' + '  moneda, ' + '  codCPC, ' +
        '  ultimaModificacion, ' + '  pendienteRevision, ' +
        '  rendimientoHUnidad, ' + '  nhCuadrillas, ' + '  anidado) ' +
        'VALUES ( ' + '  :codBase, ' + '  :codCategoriaAPU, ' +
        '  :codRecursoAPU, ' + '  :CategoriaAPU, ' + '  :codAPU, ' +
        '  :Descripcion, ' + '  :Unidad, ' + '  :Rendimiento, ' +
        '  :RendimientoTodoAnalisis, ' + '  :RendimientoTodoEscenario, ' +
        '  :FechaHoraCreacion, ' + '  :CostoDirectoTotal, ' +
        '  :costoIndirectoTotal, ' + '  :PorcentajeCostoIndirecto, ' +
        '  :PrecioUnitarioTotal, ' + '  :moneda, ' + '  :codCPC, ' +
        '  :ultimaModificacion, ' + '  :pendienteRevision, ' +
        '  :rendimientoHUnidad, ' + '  :nhCuadrillas, ' + '  :anidado)');
        {*)}
      Prepare;
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codCategoriaAPU').AsString := APUOrigen.codCategoriaApu;
      ParamByName('codRecursoAPU').AsString := APUOrigen.codRecursoAPU;
      ParamByName('categoriaAPU').AsString := APUOrigen.Categoria;
      ParamByName('codAPU').AsString := APUOrigen.codAPU;
      ParamByName('descripcion').AsString := APUOrigen.descripcion;
      ParamByName('unidad').AsString := APUOrigen.unidad;
      ParamByName('rendimiento').AsString := APUOrigen.rendimiento;
      ParamByName('rendimientoTodoAnalisis').AsString := '1';
      ParamByName('rendimientoTodoEscenario').AsString := '1';
      ParamByName('fechaHoraCreacion').AsDateTime := APUOrigen.fechaHoraCreacion;
      ParamByName('CostoDirectoTotal').AsString := APUOrigen.precio;
      ParamByName('PorcentajeCostoIndirecto').AsString := APUOrigen.porcentajeIndirectos;
      ParamByName('precioUnitarioTotal').AsString := APUOrigen.precio;
      ParamByName('moneda').AsString := base_activa.moneda;
      ParamByName('codCpc').AsString := '';
      ParamByName('ultimaModificacion').AsDateTime := APUOrigen.fechaHoraActualizacion;
      ParamByName('pendienteRevision').AsString := '0';
      ParamByName('rendimientoHUnidad').AsString := APUOrigen.rendimientoHUnidad;
      ParamByName('nhCuadrillas').AsString := APUOrigen.HCuadrillas;
      ParamByName('anidado').AsBoolean := APUOrigen.anidado;
      ExecSQL;
      {FIN de Creacion de APU}
      {Creacion de los Items de APU}
      x := 0;
      SetLength(itemsAPU, x);
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT * ' + '  FROM apus_Items ' + ' WHERE codBase = :codBase ' + '   AND codAPU = :codApu');
        {*)}
      ParamByName('codbase').AsString := codBaseOrigen;
      ParamByName('codAPU').AsString := codApuOrigen;
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        SetLength(itemsAPU, x + 1);
        itemsAPU[x].codBase := base_activa.codBase;
        itemsAPU[x].codApu := APUOrigen.codAPU;
        Inc(x);
        Next;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure daCodApusActualizar(listadoAPU: TStringList; idUnicoRecurso: string);
var
  qry: TUniQuery;
  tmpstr: string;
  posicion: integer;
  codApuActualizar: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      {}
      sql.Add('SELECT codAPU ' + '  FROM Apus_items ' + ' WHERE codBase = :codBase ' + '   AND idUnicoRecurso = :idUnicoRecurso');
      {}
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('idUnicoRecurso').AsString := idUnicoRecurso;
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        listadoAPU.Sort;
        codApuActualizar := FieldByName('codAPU').AsString;
        posicion := listadoAPU.IndexOf(codApuActualizar);
        if posicion = -1 then
        begin
          listadoAPU.Add(codApuActualizar);
          listadoAPU.Sort;
        end;
        Next;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de daCodigoRecursoDestinoImportar.</summary>
/// <param name="codCategoria">TODO.</param>
/// <param name="codSubCategoria">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoRecursoDestinoImportar(codCategoria, codSubCategoria: string): string;
var
  qry: TUniQuery;
  tmpstr: string;
  tmpint: Integer;
begin
  Result := '';
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT codRecurso ' + ' FROM recursos ' +
        'WHERE codBase = :codBase ' + '  AND codCategoriaBase = :codCategoriaBase '
        + '  AND codSubCategoria = :codSubCategoria ' + 'ORDER BY codRecurso ASC');
        {*)}
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codCategoriaBase').AsString := codCategoria;
      ParamByName('codSubCategoria').AsString := codSubCategoria;
      Prepare;
      ExecSQL;
      Last;
      tmpstr := FieldByName('codRecurso').AsString;
      tmpint := StrToIntDef(tmpstr, 0);
      Inc(tmpint);
      Result := IntToStr(tmpint);
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de generaSiNoExisteCategoriaVarios.</summary>
/// <param name="codCategoria">TODO.</param>
/// <returns>TODO.</returns>
function generaSiNoExisteCategoriaVarios(codCategoria: string): string;
var
  tmpstr: string;
  qry: TUniQuery;
  lastCiu: integer;
begin
  tmpstr := '';
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT ciu ' + '  FROM categoriaApus ' +
        ' WHERE codBase = :codBase ' + '   AND categoria_base = :categoria_base '
        + '   AND descripcion = :descripcion');
        {*)}
      ParamByName('codbase').AsString := base_activa.codBase;
      ParamByName('categoria_base').AsString := codCategoria;
      ParamByName('descripcion').AsString := 'Varios';
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('ciu').AsString;
      if tmpstr = '' then
      begin
        close;
        sql.Clear;
        {(*}
        SQL.Add('SELECT ciu ' + '  FROM categoriaApus ' +
          ' WHERE codBase = :codBase ' + '   AND categoria_base = :categoria_base ' + ' ORDER BY ciu ASC');
          {*)}
        ParamByName('codbase').AsString := base_activa.codBase;
        ParamByName('categoria_base').AsString := codCategoria;
        prepare;
        ExecSQL;
        tmpstr := FieldByName('ciu').AsString;
        lastCiu := StrToIntDef(tmpstr, 0);
        inc(lastCiu);
        tmpstr := IntToStr(lastCiu);
        close;
        sql.Clear;
        {(*}
        sql.Add('INSERT INTO categoriaApus ( ' + '  codBase, ' +
          '  Categoria_base, ' + '  ciu, ' + '  NombreBase, ' +
          '  Descripcion, ' + '  sincronizada, ' + '  origen, ' +
          '  fechaCreacion) ' + 'VALUES ( ' + '  :codBase, ' +
          '  :Categoria_base, ' + '  :ciu, ' + '  :NombreBase, ' +
          '  :Descripcion, ' + '  :sincronizada, ' + '  :origen, ' + '  :fechaCreacion)');
          {*)}
        ParamByName('codbase').AsString := base_activa.codBase;
        ParamByName('categoria_base').AsString := codCategoria;
        ParamByName('NombreBase').AsString := base_activa.nombre;
        ParamByName('ciu').AsString := tmpstr;
        ParamByName('Descripcion').AsString := 'Varios';
        ParamByName('sincronizada').AsBoolean := False;
        ParamByName('fechaCreacion').AsDateTime := now;
        Prepare;
        ExecSQL;
      end;
    end;
  finally
    qry.Free;
    result := tmpstr;
  end;
end;

/// <summary>TODO: Descripción de existeSubCategoria.</summary>
/// <param name="codBaseBusqueda">TODO.</param>
/// <param name="codCategoria">TODO.</param>
/// <param name="descripcionBusqueda">TODO.</param>
/// <returns>TODO.</returns>
function existeSubCategoria(codBaseBusqueda, codCategoria, descripcionBusqueda: string): string;
var
  qry: TUniQuery;
  tmpstr: string;
begin
  Result := '';
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT ciu ' + '  FROM categoriaApus ' +
        ' WHERE codBase = :codBase ' + '   AND categoria_base = :categoria_base '
        + '   AND descripcion = :descripcion');
        {*)}
      ParamByName('codbase').AsString := base_activa.codBase;
      ParamByName('categoria_base').AsString := codCategoria;
      ParamByName('descripcion').AsString := descripcionBusqueda;
      prepare;
      ExecSQL;
      tmpstr := FieldByName('ciu').AsString.Trim;
    end;
  finally
    qry.free;
  end;
end;

/// <summary>TODO: Descripción de daDescripcionSubCategoria.</summary>
/// <param name="codBaseBusqueda">TODO.</param>
/// <param name="codCategoria">TODO.</param>
/// <param name="codSubCategoria">TODO.</param>
/// <returns>TODO.</returns>
function daDescripcionSubCategoria(codBaseBusqueda, codCategoria, codSubCategoria: string): string;
var
  qry: TUniQuery;
begin
  Result := '';
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT Descripcion ' + '  FROM categoriaApus ' +
        ' WHERE codBase = :codBase ' + '   AND categoria_base = :categoria_base ' + '   AND Ciu = :ciu');
        {*)}
      ParamByName('codBase').AsString := codBaseBusqueda;
      ParamByName('categoria_base').AsString := codCategoria;
      ParamByName('ciu').AsString := codSubCategoria;
      Prepare;
      ExecSQL;
      result := FieldByName('Descripcion').AsString;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de daValorUltCategoria.</summary>
/// <param name="categoriaBase">TODO.</param>
/// <returns>TODO.</returns>
function daValorUltCategoria(categoriaBase: string): integer;
var
  qry: TUniQuery;
  codCategoriaBase: string;
  tmpstr: string;
  x: integer;
begin
  result := 1;
  if LowerCase(categoriaBase.Trim) = 'equipos y herramientas' then
    codCategoriaBase := '1';
  if LowerCase(categoriaBase.Trim) = 'materiales' then
    codCategoriaBase := '2';
  if LowerCase(categoriaBase.Trim) = 'transporte' then
    codCategoriaBase := '3';
  if LowerCase(categoriaBase.Trim) = 'mano de obra' then
    codCategoriaBase := '4';
  if LowerCase(categoriaBase.Trim) = 'seguridad industrial' then
    codCategoriaBase := '5';
  if LowerCase(categoriaBase.Trim) = 'precios unitarios' then
    codCategoriaBase := '6';
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT ciu ' + '  FROM categoriaapus ' +
        ' WHERE codBase = :codBase ' + '   AND categoria_base = :categoria_base');
        {*)}
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('categoria_base').AsString := categoriaBase;
      Prepare;
      ExecSQL;
      Last;
      tmpstr := FieldByName('ciu').AsString;
      if tmpstr <> '' then
      begin
        x := StrToInt(tmpstr);
        inc(x);
      end
      else
        x := 1;
      Result := x;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de AjustaCurvaS.</summary>
procedure AjustaCurvaS();
var
  CurvaS: string;
  TcurvaS: double;
  x: integer;
  s: TTMSFNCChartSerie;
  an: TTMSFNCChartAnnotation;
begin
  frmMain.chart_CurvaS.BeginUpdate;
  frmMain.chart_CurvaS.Clear;
  frmMain.chart_CurvaS.Series.Clear;
  frmMain.chart_CurvaS.Series.Add;
  s := frmmain.chart_CurvaS.Series[0];
  s.AddPoint(0);
  an := s.Points[0].Annotations.add;
  an.Text := base_activa.simboloMoneda + '0';
  for x := 0 to frmmain.grid_CronoTotales.Columns.Count - 2 do
  begin
    CurvaS := frmMain.grid_CronoTotales.Cells[x, 2];
    CurvaS := ReplaceStr(CurvaS, base_activa.simboloMoneda, '').Trim;
    TcurvaS := StrToFloatdef(CurvaS, 0);
    s.AddPoint(TcurvaS);
    an := s.Points[x + 1].Annotations.Add;
    an.Text := base_activa.simboloMoneda + CurvaS;
  end;
  frmMain.chart_CurvaS.EndUpdate;
end;

/// <summary>TODO: Descripción de calculaResumenFpolCuadrilla.</summary>
procedure calculaResumenFpolCuadrilla();
type
  dat_tmp = record
    Indice: string;
    precio: string;
    descripcion: string;
    coeficiente: string;
  end;
var
  x: integer;
  sumaTotal: double;
  tmpstr: string;
  valorIndice: Double;
  indice: double;
  FPolCuadrilla: string;
  listadoFpolCuadrillaT: array of dat_tmp;
begin
  sumaTotal := 0;
  frmMain.lbl_FpolCuadrilla.Text := '';
  frmMain.lbl_FpolCuadrilla.Hint := '';
  for x := 1 to frmMain.grid_FpolCuadrillaTipo.RowCount - 1 do
  begin
    tmpstr := frmMain.grid_FpolCuadrillaTipo.Cells[8, x];
    tmpstr := decimal_correcto(tmpstr);
    sumaTotal := sumaTotal + StrToFloatDef(tmpstr, 0);
  end;
  for x := 1 to frmMain.grid_FpolCuadrillaTipo.RowCount - 1 do
  begin
    SetLength(listadoFpolCuadrillaT, x);
    listadoFpolCuadrillaT[x - 1].indice := frmMain.grid_FpolCuadrillaTipo.Cells[3, x];
    listadoFpolCuadrillaT[x - 1].descripcion := frmMain.grid_FpolCuadrillaTipo.Cells[4, x];
    listadoFpolCuadrillaT[x - 1].coeficiente := frmMain.grid_FpolCuadrillaTipo.Cells[9, x];
  end;
  // Ordenar Array of record
  TArray.Sort<dat_tmp>(listadoFpolCuadrillaT, TComparer<dat_tmp>.Construct(
    function(const Left, Right: dat_tmp): Integer
    begin
      Result := CompareText(Left.indice, Right.indice);
    end));

  // Genera Cadena de Formula
  FPolCuadrilla := '';
  for x := 0 to Length(listadoFpolCuadrillaT) - 1 do
  begin
    FPolCuadrilla := FPolCuadrilla + listadoFpolCuadrillaT[x].coeficiente + '(SHR ' + listadoFpolCuadrillaT[x].descripcion + ')i + ';
  end;
  FPolCuadrilla := copy(FPolCuadrilla, 1, length(FPolCuadrilla) - 2);
  FPolCuadrilla := 'Bi= ' + FPolCuadrilla;
  frmMain.lbl_FpolCuadrilla.Text := FPolCuadrilla;
  frmMain.lbl_FpolCuadrilla.Hint := FPolCuadrilla;
  frmMain.lbl_FpolCuadrilla.ShowHint := True;
end;

/// <summary>TODO: Descripción de calculaResumenFpol.</summary>
procedure calculaResumenFpol();
type
  dat_tmp = record
    indice: string;
    precio: string;
    coeficiente: string;
  end;
var
  fPolGeneral: string;
  x, y, z: integer;
  indice, coeficiente: string;
  tmpstr: string;
  sumaTotal: Double;
  ValorIndice: Double;
  Tcoeficiente: Double;
  listadoFpolGeneral: array of dat_tmp;
  nuevo: Boolean;
  tfloat: double;
begin
  // Formula General
  sumaTotal := 0;
  frmMain.lbl_FpolGeneral.Text := '';
  frmMain.lbl_FpolGeneral.Hint := '';
  // Calcula Total
  for x := 0 to length(listadoRecursosFP) - 1 do
  begin
    tmpstr := listadoRecursosFP[x].total;
    sumaTotal := sumaTotal + StrToFloatDef(tmpstr, 0);
  end;
  // Calcula Indices
  for x := 1 to frmMain.grid_FpolIndicesDisponibles.RowCount - 1 do
  begin
    SetLength(listadoFpolGeneral, x);
    listadoFpolGeneral[x - 1].indice := frmMain.grid_FpolIndicesDisponibles.Cells[1, x];
    listadoFpolGeneral[x - 1].coeficiente := frmMain.grid_FpolIndicesDisponibles.Cells[5, x];
  end;
  // Ordenar Array of record
  TArray.Sort<dat_tmp>(listadoFpolGeneral, TComparer<dat_tmp>.Construct(
    function(const Left, Right: dat_tmp): Integer
    begin
      Result := CompareText(Left.indice, Right.indice);
    end));

  // Genera Cadena Formula
  // PR = P0 (0,278B1/B0 + 0,057D1/D0 + 0,177E1/E0 + 0,257M1/M0 + 0,073P1/P0 + 0,158X1/X0)
  fPolGeneral := '';
  for x := 0 to Length(listadoFpolGeneral) - 1 do
  begin
    fPolGeneral := fPolGeneral + listadoFpolGeneral[x].coeficiente + listadoFpolGeneral[x].indice + '1/' + listadoFpolGeneral[x].indice + '0 + ';
  end;
  fPolGeneral := Copy(fPolGeneral, 1, Length(fPolGeneral) - 2);
  fPolGeneral := 'PR = P0 (' + fPolGeneral + ')';
  frmMain.lbl_FpolGeneral.Text := fPolGeneral;
  frmMain.lbl_FpolGeneral.Hint := fPolGeneral;
  frmMain.lbl_FpolGeneral.ShowHint := True;
end;

/// <summary>TODO: Descripción de ComprobarInconsistenciaCuadrillas.</summary>
procedure ComprobarInconsistenciaCuadrillas();
var
  x: Integer;
  tmpstr: string;
  inconsistencia: Boolean;
begin
  inconsistencia := False;
  x := 1;
  while (x < frmMain.grid_FpolCuadrillaTipo.RowCount) and (not inconsistencia) do
  begin
    tmpstr := frmMain.grid_FpolCuadrillaTipo.Cells[10, x];
    if tmpstr <> '' then
      inconsistencia := true;
    Inc(x);
  end;
  if inconsistencia then
    frmMain.grid_FpolCuadrillaTipo.Columns[10].Width := 100
  else
    frmMain.grid_FpolCuadrillaTipo.Columns[10].Width := 0;
end;

/// <summary>TODO: Descripción de activa_gridCuadrillaTipo.</summary>
procedure activa_gridCuadrillaTipo();
type
  dat_fpolCuadrilla = record
    codSubCategoria: string;
    descripcionSubCategoria: string;
    horasLaboradas: string;
    precioBase: string;
    inconsistencia: Boolean;
  end;
var
  listaIndicesB: array of dat_fpol2;
  tmpstr: string;
  x, y: integer;
  Salir: Boolean;
  TvalHoras: Double;
  TotalPrecio: double;
  TotalTrabajo: Double;
  listadoHorasCuadrillas: array of dat_fpolCuadrilla;
  precio1, precio2: string;
  Coeficiente: Double;
begin
  frmMain.grid_FpolCuadrillaTipo.ClearNormalCells;
  frmmain.grid_FpolCuadrillaTipo.Cells[0, 0] := '#';
  frmMain.grid_FpolCuadrillaTipo.Cells[1, 0] := 'Término';
  frmMain.grid_FpolCuadrillaTipo.Cells[2, 0] := 'Código';
  frmMain.grid_FpolCuadrillaTipo.Cells[3, 0] := 'Descripción de Indices';
  frmMain.grid_FpolCuadrillaTipo.Cells[4, 0] := 'SubCategoría';
  frmMain.grid_FpolCuadrillaTipo.Cells[5, 0] := 'S.H.M.';
  frmMain.grid_FpolCuadrillaTipo.Cells[6, 0] := 'S.H.R.';
  frmMain.grid_FpolCuadrillaTipo.Cells[7, 0] := 'Trabajo';
  frmmain.grid_FpolCuadrillaTipo.Cells[8, 0] := 'C. Directo';
  frmMain.grid_FpolCuadrillaTipo.Cells[9, 0] := 'Coeficiente';
  frmMain.grid_FpolCuadrillaTipo.Cells[10, 0] := 'Inconsistencia Precios';
  SetLength(listaIndicesB, 0);
  y := 0;
  for x := 0 to Length(listadoRecursosFP) - 1 do
  begin
    tmpstr := listadoRecursosFP[x].indice;
    if tmpstr = 'B' then
    begin
      SetLength(listaIndicesB, y + 1);
      listaIndicesB[y].codUnicoRecurso := listadoRecursosFP[x].codRecurso;
      listaIndicesB[y].codSubCategoria := listadoRecursosFP[x].subcategoria;
      listaIndicesB[y].Cantidad := listadoRecursosFP[x].cantidad;
      listaIndicesB[y].precioBase := listadoRecursosFP[x].precio;
      Inc(y);
    end;
  end;
  { ORDENACION DE ARRAY DE RECORDS }
  TArray.Sort<dat_fpol2>(listaIndicesB, TComparer<dat_fpol2>.Construct(
    function(const Left, Right: dat_fpol2): Integer
    begin
      Result := CompareText(Left.codSubCategoria, Right.codSubCategoria);
    end));

  SetLength(listadoHorasCuadrillas, 0);
  for x := 0 to length(listaIndicesB) - 1 do
  begin
    tmpstr := listaIndicesB[x].codSubCategoria;
    y := 0;
    Salir := False;
    while (not Salir) and (y < Length(listadoHorasCuadrillas)) do
    begin
      if tmpstr = listadoHorasCuadrillas[y].codSubCategoria then
      begin
        Salir := True;
        TvalHoras := StrToFloat(listadoHorasCuadrillas[y].horasLaboradas);
        TvalHoras := TvalHoras + strtofloat(listaIndicesB[x].Cantidad);
        listadoHorasCuadrillas[y].horasLaboradas := FloatToStr(TvalHoras);
        precio1 := listadoHorasCuadrillas[y].precioBase;
        precio2 := listaIndicesB[x].precioBase;
        if precio1 <> precio2 then
        begin
          listadoHorasCuadrillas[y].inconsistencia := true;
        end;
      end;
      Inc(y);
    end;
    if not Salir then
    begin
      y := Length(listadoHorasCuadrillas);
      SetLength(listadoHorasCuadrillas, y + 1);
      listadoHorasCuadrillas[y].codSubCategoria := tmpstr;
      listadoHorasCuadrillas[y].descripcionSubCategoria := daNombreSubcategoriaFpol('4', tmpstr);
      listadoHorasCuadrillas[y].horasLaboradas := listaIndicesB[x].Cantidad;
      listadoHorasCuadrillas[y].precioBase := listaIndicesB[x].precioBase;
      listadoHorasCuadrillas[y].inconsistencia := False;
    end;
  end;
  TotalPrecio := 0;
  TotalTrabajo := 0;
  TvalHoras := 0;
  frmMain.grid_FpolCuadrillaTipo.Columns[10].Width := 0;
  for x := 0 to length(listadoHorasCuadrillas) - 1 do
  begin
    frmMain.grid_FpolCuadrillaTipo.RowCount := x + 1;
    frmMain.grid_FpolCuadrillaTipo.cells[0, x + 1] := ponerCerosInicio(IntToStr(x + 1), 3);
    frmMain.grid_FpolCuadrillaTipo.cells[1, x + 1] := 'B';
    frmMain.grid_FpolCuadrillaTipo.Cells[4, x + 1] := listadoHorasCuadrillas[x].descripcionSubCategoria;
    frmmain.grid_FpolCuadrillaTipo.Cells[5, x + 1] := ForzarCadenaNDecimales(listadoHorasCuadrillas[x].precioBase, ndecimalesMoneda);
    frmmain.grid_FpolCuadrillaTipo.Cells[6, x + 1] := ForzarCadenaNDecimales(listadoHorasCuadrillas[x].precioBase, ndecimalesMoneda);
    TvalHoras := StrToFloat(ForzarCadenaNDecimales(listadoHorasCuadrillas[x].precioBase, 2));
    frmmain.grid_FpolCuadrillaTipo.Cells[7, x + 1] := ForzarCadenaNDecimales(listadoHorasCuadrillas[x].horasLaboradas, ndecimalesMoneda);
    TotalTrabajo := TotalTrabajo + strtofloatdef(listadoHorasCuadrillas[x].horasLaboradas, 0);
    TvalHoras := TvalHoras * strtofloatdef(listadoHorasCuadrillas[x].horasLaboradas, 0);
    TotalPrecio := TotalPrecio + TvalHoras;
    frmMain.grid_FpolCuadrillaTipo.Cells[8, x + 1] := ForzarCadenaNDecimales(FloatToStr(TvalHoras), ndecimalesMoneda);
    if listadoHorasCuadrillas[x].inconsistencia then
    begin
      frmmain.grid_FpolCuadrillaTipo.Cells[10, x + 1] := 'Revisar';
    end;
  end;
  frmMain.grid_FpolCuadrillaTipo.RowCount := x + 1;
  frmmain.lbl_CuadrillaTrabajo.Text := ForzarCadenaNDecimales(FloatToStr(TotalTrabajo), ndecimalesPresupuesto);
  frmMain.lbl_CuadrillaCosto.Text := ForzarCadenaNDecimales(FloatToStr(TotalPrecio), ndecimalesMoneda);
  frmMain.lbl_CuadrillaIndice.Text := decimal_correcto('1,000');
  for x := 1 to frmmain.grid_FpolCuadrillaTipo.RowCount - 1 do
  begin
    TvalHoras := StrToFloatDef(frmmain.grid_FpolCuadrillaTipo.Cells[8, x], 0);
    Coeficiente := TvalHoras / TotalPrecio;
    frmMain.grid_FpolCuadrillaTipo.Cells[9, x] := ForzarCadenaNDecimales(FloatToStr(Coeficiente), ndecimalesMoneda);
  end;
  ComprobarInconsistenciaCuadrillas();
end;

/// <summary>TODO: Descripción de daNombreSubcategoriaFpol.</summary>
/// <param name="codCategoria">TODO.</param>
/// <param name="codSubCategoria">TODO.</param>
/// <returns>TODO.</returns>
function daNombreSubcategoriaFpol(codCategoria, codSubCategoria: string): string;
var
  qry: TUniQuery;
begin
  result := '';
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT Descripcion ' + '  FROM categoriaApus ' +
        ' WHERE codBase = :codBase ' + '   AND categoria_base = :categoria_base ' + '   AND ciu = :ciu');
        {*)}
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('ciu').AsString := codSubCategoria;
      ParamByName('categoria_base').AsString := codCategoria;
      prepare;
      ExecSQL;
      result := FieldByName('Descripcion').AsString;
    end;
  finally
    qry.free;
  end;
end;

/// <summary>TODO: Descripción de estadoIndices.</summary>
procedure estadoIndices();
var
  recursosSinAsignar: integer;
  x: integer;
  tmpstr: string;
begin
  recursosSinAsignar := 0;
  for x := 0 to length(listadoRecursosFP) - 1 do
  begin
    tmpstr := listadoRecursosFP[x].indice;
    if tmpstr = '' then
    begin
      Inc(recursosSinAsignar);
    end;
  end;
  frmMain.lbl_RecursosPorAsignar.Text := 'Recursos por Asignar: ' + IntToStr(recursosSinAsignar);
  if recursosSinAsignar = 0 then
  begin
    calculaResumenFpol();
  end
  else
  begin
    frmMain.lbl_FpolGeneral.Text := '';
  end;
end;

/// <summary>TODO: Descripción de sincronizaIndiceyCoeficientes.</summary>
procedure sincronizaIndiceyCoeficientes();
var
  x, y: integer;
  indiceS: string;
  totalIndice: double;
  resilencia: double;
  porcentaje: double;
  tmpstr: string;
begin
  for x := 1 to frmMain.grid_FpolIndicesDisponibles.RowCount - 1 do
  begin
    indiceS := frmmain.grid_FpolIndicesDisponibles.Cells[1, x];
    if indiceS <> '' then
    begin
      totalIndice := 0;
      for y := 0 to Length(listadoRecursosFP) - 1 do
      begin
        if indiceS = listadoRecursosFP[y].indice then
        begin
          tmpstr := listadoRecursosFP[y].total;
          tmpstr := decimal_correcto(tmpstr);
          totalIndice := totalIndice + strtofloatdef(tmpstr, 0);
        end;
      end;
      frmmain.grid_FpolIndicesDisponibles.Cells[4, x] := base_activa.simboloMoneda + FloatToStr(totalIndice);
    end;
  end;
  totalIndice := 0;
  for x := 1 to frmMain.grid_FpolIndicesDisponibles.RowCount - 1 do
  begin
    tmpstr := frmMain.grid_FpolIndicesDisponibles.Cells[4, x];
    tmpstr := ReplaceStr(tmpstr, base_activa.simboloMoneda, '');
    totalIndice := totalIndice + StrToFloatdef(tmpstr, 0);
  end;
  tmpstr := FloatToStr(totalIndice);
  frmMain.lbl_ValorTotalIndice.Text := base_activa.simboloMoneda + tmpstr;
  resilencia := 0;
  for x := 1 to frmMain.grid_FpolIndicesDisponibles.RowCount - 2 do
  begin
    tmpstr := frmMain.grid_FpolIndicesDisponibles.Cells[4, x];
    tmpstr := ReplaceStr(tmpstr, base_activa.simboloMoneda, '');
    porcentaje := StrToFloat(tmpstr);
    porcentaje := porcentaje / totalIndice;
    resilencia := resilencia + porcentaje;
    tmpstr := FloatToStr(porcentaje);
    frmmain.grid_FpolIndicesDisponibles.Cells[5, x] := tmpstr;
  end;
  porcentaje := 1 - resilencia;
  tmpstr := FloatToStr(porcentaje);
  frmmain.grid_FpolIndicesDisponibles.Cells[5, x] := tmpstr;
  frmMain.lbl_CoeficienteTotalFpol.Text := decimal_correcto('1.000');
end;

/// <summary>TODO: Descripción de addlog.</summary>
/// <param name="Texto">TODO.</param>
procedure addlog(Texto: string);
var
  listaLog: Tstringlist;
  ficheroLog: string;
  datos: string;
begin
  listaLog := TStringList.Create;

  rutaApp := ExtractFilePath(rutaApp);
  ficheroLog := rutaApp;
  if RightStr(ficheroLog, 1) <> '\' then
    ficheroLog := ficheroLog + '\';
  ficheroLog := ficheroLog + 'GiProy_' + formatdatetime('yyyymmdd', now) + '.log';
  if FileExists(ficheroLog) then
    listaLog.LoadFromFile(ficheroLog);
  datos := FormatDateTime('dd/mm/yy hh:nn:ss', Now);
  datos := datos + ' --> ' + Texto;
  listaLog.Add(datos);
  listaLog.SaveToFile(ficheroLog);
end;

/// <summary>TODO: Descripción de limpiaDatosDerivacion.</summary>
procedure limpiaDatosDerivacion();
begin
  frm_CronoDerivaciones.chkHomogenea.IsChecked := False;
  frm_CronoDerivaciones.chkCustom.IsChecked := False;
  frm_CronoDerivaciones.grid_DefDerivacion.ClearNormalCells;
  calculaPlazosCronograma();
end;

/// <summary>TODO: Descripción de borraDBDatosDervicacion.</summary>
procedure borraDBDatosDervicacion();
var
  qry: TUniQuery;
begin
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('delete from presupuestos_cronogramas where codBase=' + QuotedStr(base_activa.codBase) + ' and codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr(revision));
      Prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de faltaDatosDerivacion.</summary>
/// <returns>TODO.</returns>
function faltaDatosDerivacion(): integer;
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  result := -1;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      {(*}
      sql.Add('SELECT COUNT(p.Descripcion) AS NDerivacion ' +
        '  FROM presupuestos_items p ' + '    LEFT JOIN presupuestos_cronogramas c '
        + '      ON c.codBase = p.codBase ' +
        '     AND c.codPresupuesto = p.codPresupuesto ' + '     AND c.revision = p.revision '
        + '     AND c.codUnicoItems = p.codUnicoItems ' +
        ' WHERE p.codBase = :codbase ' + '   AND p.codPresupuesto = :codPresupuesto '
        + '   AND p.revision = :revision ' + '   AND c.Derivacion IS NULL');
        {*)}
      ParamByName('codbase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      prepare;
      ExecSQL;
      Result := FieldByName('NDerivacion').AsInteger;
    end;
  finally
    qry.free;
  end;
end;

/// <summary>TODO: Descripción de cantidadCronoDerivaciones.</summary>
/// <returns>TODO.</returns>
function cantidadCronoDerivaciones(): integer;
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  result := -1;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      {(*}
      sql.Add('SELECT COUNT(id) AS NItems ' +
        '  FROM presupuestos_cronogramas p ' + ' WHERE p.codBase = :codbase ' +
        '   AND p.codPresupuesto = :codPresupuesto ' + '   AND p.revision = :revision');
        {*)}
      ParamByName('codbase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      prepare;
      ExecSQL;
      Result := FieldByName('NItems').AsInteger;
    end;
  finally
    qry.free;
  end;
end;

/// <summary>TODO: Descripción de cargarDatosDerivacion.</summary>
/// <returns>TODO.</returns>
function cargarDatosDerivacion(): Boolean;
var
  qry: TUniQuery;
  sqlstr: string;
  listadoDistribucion: TStringList;
  x: integer;
  tmpstr: string;
  derivado: Boolean;
  ndistribuciones: integer;
  cantidad1, cantidad2: Double;
begin
  Result := false;
  try
    qry := TUniQuery.Create(nil);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        SQL.Clear;
        {(*}
        sqlstr := 'select c.Derivacion ' + '  from presupuestos_cronogramas c '
          + ' where c.codBase=:codBase ' +
          '   and c.codPresupuesto=:codPresupuesto ' + '   and c.revision=:Revision '
          + '   and c.codUnicoItems=:codUnicoItems';
          {*)}
        sql.Add(sqlstr);
        for x := 1 to frmmain.grid_crono0.RowCount - 1 do
        begin
          if frmmain.grid_crono0.cells[10, x] <> '' then
          begin
            ParamByName('codBase').AsString := base_activa.codBase;
            ParamByName('codPresupuesto').AsString := codProyecto;
            ParamByName('revision').AsString := revision;
            ParamByName('codUnicoItems').AsString := frmmain.grid_crono0.cells[10, x];
            Prepare;
            ExecSQL;
            frmmain.grid_crono0.cells[11, x] := FieldByName('Derivacion').AsString;
          end;
        end;
        close;
        sql.Clear;
        {(*}
        sqlstr := 'select * ' + '  from presupuestos_cronogramas c ' +
          ' where c.codBase=:codBase ' + '   and c.codPresupuesto=:codPresupuesto '
          + '   and c.revision=:Revision ' + '   and c.codUnicoItems IS NOT NULL ' + ' LIMIT 1';
          {*)}
        sql.Add(sqlstr);
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        Prepare;
        ExecSQL;
        tmpstr := FieldByName('tipoPeriodo').AsString;
        if tmpstr <> '' then
        begin
          posicionaCombo(frmmain.cbb_cronoTipoPeriodo, tmpstr);
          frmMain.lbl_cronogramaNPeriodos.Text := FieldByName('periodos').AsString;
          tmpstr := FieldByName('tipoDerivacion').AsString;
          frm_CronoDerivaciones.chkHomogenea.IsChecked := false;
          frm_CronoDerivaciones.chkCustom.IsChecked := False;
          if tmpstr = 'Homogenea' then
          begin
            frm_CronoDerivaciones.chkHomogenea.IsChecked := true;
            listadoDistribucion := Tstringlist.Create;
            listadoDistribucion.Text := FieldByName('derivacion').AsString;
            frm_CronoDerivaciones.grid_DefDerivacion.ColumnCount := listadoDistribucion.Count;
            for x := 0 to listadoDistribucion.Count - 1 do
            begin
              frm_CronoDerivaciones.grid_DefDerivacion.Cells[x, 1] := listadoDistribucion[x];
              AjustaFloatGrid(frm_CronoDerivaciones.grid_DefDerivacion, x);
            end;
          end
          else
          begin
            frm_CronoDerivaciones.chkCustom.IsChecked := True;
          end;
        end
        else
        begin
          frmMain.cbb_cronoTipoPeriodo.ItemIndex := 3;
          frm_CronoDerivaciones.chkHomogenea.IsChecked := True;
          frm_CronoDerivaciones.chkCustom.IsChecked := False;
          listadoDistribucion := Tstringlist.Create;
          calculaPlazosCronograma();
          ndistribuciones := StrToInt(frmMain.lbl_cronogramaNPeriodos.text);
          cantidad2 := 0;
          cantidad1 := (100 / ndistribuciones);
          cantidad2 := 100 - (cantidad1 * (ndistribuciones - 1));
          for x := 1 to ndistribuciones - 1 do
          begin
            listadoDistribucion.Add(floattostr(cantidad1));
          end;
          listadoDistribucion.Add(FloatToStr(cantidad2));
          for x := 0 to listadoDistribucion.Count - 1 do
          begin
            frm_CronoDerivaciones.grid_DefDerivacion.Cells[x, 1] := listadoDistribucion[x];
            AjustaFloatGrid(frm_CronoDerivaciones.grid_DefDerivacion, x);
          end;
        end;
        result := True;
      end;
    finally
      if faltaDatosDerivacion = 0 then
      begin
        calculaPlazosCronograma();
      end;
      qry.Free;
    end;
  except
    result := false;
  end;
end;

/// <summary>TODO: Descripción de guardarDatosDerivacion.</summary>
/// <returns>TODO.</returns>
function guardarDatosDerivacion(): Boolean;
var
  qry: TUniQuery;
  sqlstr: string;
  x: integer;
  tmpstr: string;
begin
  Result := false;
  qry := TUniQuery.Create(nil);
  borraDBDatosDervicacion;
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        sql.Clear;
        {(*}
        sqlstr := 'INSERT INTO presupuestos_cronogramas ( ' + '  codBase, ' +
          '  codPresupuesto, ' + '  revision, ' + '  codUnicoItems, ' +
          '  tipoPeriodo, ' + '  Periodos, ' + '  tipoDerivacion, ' +
          '  derivacion) ' + 'VALUES ( ' + '  :codBase, ' +
          '  :codPresupuesto, ' + '  :revision, ' + '  :codUnicoItems, ' +
          '  :tipoPeriodo, ' + '  :Periodos, ' + '  :tipoDerivacion, ' + '  :derivacion)';
          {*)}
        sql.Add(sqlstr);
        for x := 1 to frmMain.grid_crono0.RowCount - 1 do
        begin
          ParamByName('codBase').AsString := base_activa.codBase;
          ParamByName('codPresupuesto').AsString := codProyecto;
          ParamByName('revision').AsString := revision;
          ParamByName('tipoPeriodo').AsString := frmMain.cbb_cronoTipoPeriodo.Items[frmmain.cbb_cronoTipoPeriodo.ItemIndex];
          ParamByName('Periodos').AsInteger := StrToIntDef(frmMain.lbl_cronogramaNPeriodos.Text, 1);
          ParamByName('codUnicoItems').AsString := frmmain.grid_crono0.cells[10, x];
          if frm_CronoDerivaciones.chkHomogenea.IsChecked then
          begin
            ParamByName('tipoderivacion').AsString := 'Homogenea';
          end
          else
          begin
            ParamByName('tipoderivacion').AsString := 'Distribuida';
          end;
          ParamByName('derivacion').AsString := frmMain.grid_crono0.cells[11, x];
          Prepare;
          ExecSQL;
        end;
        result := True;
      end;
    finally
      qry.free;
    end;
  except
    Result := False;
  end;
end;

/// <summary>TODO: Descripción de compruebaEleccionBase.</summary>
/// <returns>TODO.</returns>
function compruebaEleccionBase(): Boolean;
var
  qry: TUniQuery;
  codProyecto: string;
  revision: string;
  contador: Integer;
begin
  Result := false;
  codProyecto := frmmain.edt_CodigoPresupuesto1.Text;
  revision := frmmain.lbl_RevisionPresupuesto.Text;
  if revision = '0' then
  begin
    qry := TUniQuery.Create(nil);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        sql.Clear;
        {(*}
        sql.Add('SELECT COUNT(*) AS Contador ' +
          '  FROM presupuestos_DatosGenerales ' + ' WHERE codPresupuesto = :codPresupuesto');
          {*)}
        ParamByName('codPresupuesto').AsString := codProyecto;
        Prepare;
        ExecSQL;
        contador := FieldByName('contador').AsInteger;
        if contador > 1 then
          result := False
        else
        begin
          result := True;
        end;
      end;
    finally
      qry.Free;
    end;
  end;
end;

/// <summary>TODO: Descripción de totalizaValoresIndice.</summary>
procedure totalizaValoresIndice();
var
  qry: TUniQuery;
  listadoIndices: TStringList;
  listadoPrecioIndices: TStringList;
  x, y: integer;
  indice: string;
  salir: Boolean;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  listadoIndices := TStringList.Create;
  listadoPrecioIndices := TStringList.Create;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT termino ' + '  FROM presupuestos_IndicesSeleccionados ' +
        ' WHERE codBase = :codBase ' + '   AND codPresupuesto = :codPresupuesto '
        + '   AND revision = :revision');
        {*)}
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      prepare;
      ExecSQL;
      First;
      while not Eof do
      begin
        tmpstr := FieldByName('termino').AsString;
        listadoIndices.Add(tmpstr);
        Next;
      end;
      for x := 0 to listadoIndices.count - 1 do
      begin
        close;
        SQL.Clear;
        {(*}
        sql.Add('SELECT SUM(CantidadUnidad) AS cantidadRecurso ' +
          '  FROM apus_Items ' + ' WHERE codBase = :codBase ' + '   AND termino = :termino');
          {*)}
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('termino').AsString := listadoIndices[x];
        Prepare;
        ExecSQL;
        tmpstr := FieldByName('cantidadRecurso').AsString;
        if tmpstr = '' then
          tmpstr := '0';
        tmpstr := decimal_correcto(tmpstr);
        listadoPrecioIndices.Add(tmpstr);
      end;
    end;
  finally
    for x := 1 to frmMain.grid_FpolIndicesDisponibles.RowCount - 1 do
    begin
      indice := frmMain.grid_FpolIndicesDisponibles.Cells[1, x];
      salir := false;
      y := 0;
      while (not salir) and (y < listadoIndices.Count) do
      begin
        if indice = listadoIndices[y] then
        begin
          salir := True;
          tmpstr := listadoPrecioIndices[y];
          frmmain.grid_FpolIndicesDisponibles.Cells[4, x] := tmpstr;
        end;
        Inc(y);
      end;
    end;
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de calculaValoresIndices.</summary>
/// <param name="ARow">TODO.</param>
procedure calculaValoresIndices(ARow: integer);
var
  x: integer;
  valorAnterior: double;
  tmpfloat: Double;
  indice: string;
  tmpstr: string;
  codUnicoItem: string;
begin
  indice := frmMain.grid_Fpolinomica.Cells[1, ARow];
  valorAnterior := 0;
  if indice <> '' then
  begin
    for x := 0 to frmMain.grid_Fpolinomica.RowCount - 1 do
    begin
      if indice = frmmain.grid_Fpolinomica.Cells[1, x] then
      begin
        tmpstr := frmmain.grid_Fpolinomica.Cells[7, x];
        tmpstr := ReplaceStr(tmpstr, base_activa.simboloMoneda, '');
        tmpstr := decimal_correcto(tmpstr);
        valorAnterior := valorAnterior + StrToFloatDef(tmpstr, 0);
      end;
    end;
    ajustaValorIndice(indice, valorAnterior);
    codUnicoItem := frmMain.grid_Fpolinomica.Cells[9, ARow];
    sincronizaIndices(indice, codUnicoItem);
  end;
  estadoIndices();
end;

/// <summary>TODO: Descripción de cargaTablaIndicesSeleccionados.</summary>
/// <param name="modo">TODO.</param>
procedure cargaTablaIndicesSeleccionados(modo: string);
const
  cCaseStrings: array[0..3] of string = ('E', 'B', 'OTROS', 'TODOS');
var
  qry: TUniQuery;
  x: integer;
  tmpstr: string;
  SQLText: string;
  entrar: Boolean;
begin
  qry := TUniQuery.Create(nil);
  modo := AnsiUpperCase(modo);
  limpia_gridFpolIndices();
  entrar := True;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select count(*) as nItems from presupuestos_indicesSeleccionados where codPresupuesto=' + QuotedStr(codProyecto) + ' and codBase=' + QuotedStr(base_activa.codBase) + ' and revision=' + QuotedStr(revision));
      prepare;
      ExecSQL;
      tmpstr := FieldByName('nItems').AsString;
      x := StrToIntDef(tmpstr, 0);
      if x > 0 then
        entrar := False;
      close;
      sql.Clear;
      case IndexStr(modo, cCaseStrings) of
        0:
          begin
            SQLText := 'select * from presupuestos_indicesSeleccionados where codPresupuesto=' + QuotedStr(codProyecto) + ' and codBase=' + QuotedStr(base_activa.codBase) + ' and revision=' + QuotedStr(revision) + ' and termino=' + QuotedStr(modo);
          end;
        1:
          begin
            SQLText := 'select * from presupuestos_indicesSeleccionados where codPresupuesto=' + QuotedStr(codProyecto) + ' and codBase=' + QuotedStr(base_activa.codBase) + ' and revision=' + QuotedStr(revision) + ' and termino=' + QuotedStr(modo);
          end;
        2:
          begin
            SQLText := 'select * from presupuestos_indicesSeleccionados where codPresupuesto=' + QuotedStr(codProyecto) + ' and codBase=' + QuotedStr(base_activa.codBase) + ' and revision=' + QuotedStr(revision) + ' and termino<>' + QuotedStr('E') + ' and termino<>' + QuotedStr('B');
          end;
        3:
          begin
            SQLText := 'select * from presupuestos_indicesSeleccionados where codPresupuesto=' + QuotedStr(codProyecto) + ' and codBase=' + QuotedStr(base_activa.codBase) + ' and revision=' + QuotedStr(revision);
          end;
      end;
      sql.Add(SQLText);
      Prepare;
      ExecSQL;
      x := 1;
      while not Eof do
      begin
        frmMain.grid_FpolIndicesDisponibles.RowCount := x + 1;
        frmmain.grid_FpolIndicesDisponibles.Cells[0, x] := ponerCerosInicio(IntToStr(x), 3);
        frmmain.grid_FpolIndicesDisponibles.Cells[1, x] := FieldByName('termino').AsString;
        frmMain.grid_FpolIndicesDisponibles.Cells[2, x] := FieldByName('codIndice').AsString;
        frmMain.grid_FpolIndicesDisponibles.Cells[3, x] := FieldByName('descripcion').AsString;
        Next;
        inc(x);
      end;
    end;
    if frmMain.grid_FpolIndicesDisponibles.RowCount = 1 then
    begin
      frmMain.grid_FpolIndicesDisponibles.Cells[0, 1] := '001';
      frmMain.grid_FpolIndicesDisponibles.Cells[1, 1] := 'E';
      frmMain.grid_FpolIndicesDisponibles.Cells[2, 1] := '90';
      frmmain.grid_FpolIndicesDisponibles.Cells[3, 1] := 'Equipo y maquinaria de Construc. vial';
      frmMain.grid_FpolIndicesDisponibles.Cells[0, 2] := '002';
      frmmain.grid_FpolIndicesDisponibles.Cells[1, 2] := 'B';
      frmMain.grid_FpolIndicesDisponibles.Cells[2, 2] := '75';
      frmMain.grid_FpolIndicesDisponibles.cells[3, 2] := 'Cuadrilla Tipo';
      frmmain.grid_FpolIndicesDisponibles.RowCount := 3;
      guardaTablaIndicesSeleccionados;
    end;
  finally
    frmMain.grid_Fpolinomica.Columns[1].ComboItems.Clear;
    for x := 1 to frmmain.grid_FpolIndicesDisponibles.RowCount - 1 do
    begin
      tmpstr := frmMain.grid_FpolIndicesDisponibles.Cells[1, x];
      if tmpstr <> '' then
      begin
        tmpstr := UpperCase(tmpstr);
        frmMain.grid_FpolIndicesDisponibles.Cells[1, x] := tmpstr;
        frmMain.grid_Fpolinomica.Columns[1].ComboItems.Add(tmpstr);
      end;
    end;
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de actualizaComboIndices.</summary>
procedure actualizaComboIndices();
var
  x: integer;
  tmpstr: string;
begin
  cargaOpcionesIndices();
  frmMain.grid_Fpolinomica.Columns[1].ComboItems.Clear;
  frmMain.grid_FpolCuadrillaTipo.columns[1].ComboItems.Clear;
  for x := 1 to frmmain.grid_FpolIndicesDisponibles.RowCount - 1 do
  begin
    tmpstr := frmMain.grid_FpolIndicesDisponibles.Cells[1, x];
    if tmpstr <> '' then
    begin
      tmpstr := UpperCase(tmpstr);
      frmMain.grid_Fpolinomica.Columns[1].ComboItems.Add(tmpstr);
      frmMain.grid_FpolCuadrillaTipo.Columns[1].ComboItems.Add(tmpstr);
    end;
  end;
end;

/// <summary>TODO: Descripción de guardaTablaIndicesCuadrilla.</summary>
procedure guardaTablaIndicesCuadrilla();
var
  qry: TUniQuery;
  x: integer;
  salarioMinimo: string;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('delete from Presupuestos_FpolCuadrillas where codBase=' + QuotedStr(base_activa.codBase) + ' and codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr(revision));
      Prepare;
      ExecSQL;
      close;
      sql.Clear;
      sql.Add('insert into Presupuestos_FpolCuadrillas (codBase, codPresupuesto, revision, indice, codIndice, descripcion, salarioMinimo, SHR, Trabajo, Coeficiente, costoDirecto) ');
      sql.Add('Values (:codBase, :codPresupuesto, :revision,  :codIndice, :indice, :descripcion, :salarioMinimo, :SHR, :Trabajo, :Coeficiente, :costoDirecto)');
      for x := 1 to frmMain.grid_FpolCuadrillaTipo.RowCount - 1 do
      begin
        if frmmain.grid_FpolCuadrillaTipo.Cells[3, x] <> '' then
        begin
          Prepare;
          ParamByName('codBase').AsString := base_activa.codBase;
          ParamByName('codPresupuesto').AsString := codProyecto;
          ParamByName('revision').AsString := revision;
          ParamByName('Indice').AsString := frmMain.grid_FpolCuadrillaTipo.Cells[2, x];
          ParamByName('codIndice').AsString := frmmain.grid_FpolCuadrillaTipo.Cells[3, x];
          ParamByName('descripcion').AsString := frmmain.grid_FpolCuadrillaTipo.Cells[4, x];
          salarioMinimo := frmMain.grid_FpolCuadrillaTipo.Cells[5, x];
          salarioMinimo := decimal_correcto(salarioMinimo);
          ParamByName('salarioMinimo').Asfloat := strtofloatdef(salarioMinimo, 0);
          tmpstr := decimal_correcto(frmmain.grid_FpolCuadrillaTipo.cells[6, x]);
          ParamByName('SHR').AsFloat := StrToFloatDef(tmpstr, 0);
          tmpstr := decimal_correcto(frmmain.grid_FpolCuadrillaTipo.cells[7, x]);
          ParamByName('trabajo').AsFloat := StrToFloatDef(tmpstr, 0);
          tmpstr := decimal_correcto(frmMain.grid_FpolCuadrillaTipo.cells[8, x]);
          ParamByName('costoDirecto').AsFloat := StrToFloatDef(tmpstr, 0);
          tmpstr := decimal_correcto(frmMain.grid_FpolCuadrillaTipo.cells[9, x]);
          ParamByName('coeficiente').AsFloat := StrToFloatDef(tmpstr, 0);
          ExecSQL;
        end;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de cargarValoresCuadrillaTipo.</summary>
procedure cargarValoresCuadrillaTipo();
var
  qry: TUniQuery;
  x: integer;
  tmpstr: string;
  descripcion, codIndice, indice, salarioMinimo: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from Presupuestos_FpolCuadrillas where codBase=' + QuotedStr(base_activa.codBase) + ' and codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr(revision) + ' and descripcion=:descripcion');
      for x := 1 to frmMain.grid_FpolCuadrillaTipo.RowCount - 1 do
      begin
        Prepare;
        descripcion := frmMain.grid_FpolCuadrillaTipo.Cells[4, x];
        if descripcion <> '' then
        begin
          ParamByName('descripcion').AsString := descripcion;
          ExecSQL;
          indice := FieldByName('indice').AsString;
          codIndice := FieldByName('codIndice').AsString;
          salarioMinimo := FieldByName('salarioMinimo').AsString;
          salarioMinimo := decimal_correcto(salarioMinimo);
          frmMain.grid_FpolCuadrillaTipo.Cells[2, x] := codIndice;
          frmMain.grid_FpolCuadrillaTipo.Cells[3, x] := indice;
          if salarioMinimo <> '' then
            frmMain.grid_FpolCuadrillaTipo.Cells[5, x] := ForzarCadenaNDecimales(salarioMinimo, ndecimalesMoneda);
        end;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de guardaTablaIndicesSeleccionados.</summary>
/// <returns>TODO.</returns>
function guardaTablaIndicesSeleccionados(): Boolean;
var
  qry: TUniQuery;
  x: Integer;
  indiceS: string;
begin
  qry := TUniQuery.Create(nil);
  result := true;
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        sql.Clear;
        sql.Add('delete from presupuestos_indicesSeleccionados where codPresupuesto=' + QuotedStr(codProyecto) + ' and codBase=' + QuotedStr(base_activa.codBase) + ' and revision=' + QuotedStr(revision));
        prepare;
        ExecSQL;
        close;
        sql.Clear;
        sql.add('insert into presupuestos_indicesSeleccionados (codBase, codPresupuesto, revision, codIndice, descripcion, termino) VALUES (:codBase, :codPresupuesto, :revision, :codIndice, :descripcion, :termino)');
        Prepare;
        for x := 1 to frmMain.grid_FpolIndicesDisponibles.RowCount - 1 do
        begin
          indiceS := frmMain.grid_FpolIndicesDisponibles.Cells[1, x];
          if indiceS <> '' then
          begin
            ParamByName('codBase').AsString := base_activa.codBase;
            ParamByName('codPresupuesto').AsString := codProyecto;
            ParamByName('revision').AsString := frmmain.lbl_RevisionPresupuesto.Text;
            ParamByName('codIndice').AsString := frmMain.grid_FpolIndicesDisponibles.Cells[2, x];
            ParamByName('descripcion').AsString := frmMain.grid_FpolIndicesDisponibles.Cells[3, x];
            ParamByName('termino').AsString := indiceS;
            ExecSQL;
          end;
        end;
      end;
    finally
      qry.Free;
    end;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de sincronizaIndices.</summary>
/// <param name="indice">TODO.</param>
/// <param name="codUnicoItem">TODO.</param>
procedure sincronizaIndices(indice, codUnicoItem: string);
var
  qry: TUniQuery;
begin
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('update apus_items set termino=:termino where idUnicoRecurso=' + QuotedStr(codUnicoItem) + ' and codBase=' + QuotedStr(base_activa.codBase));
      prepare;
      ParamByName('termino').AsString := indice;
      ExecSQL;
      close;
      sql.Clear;
      sql.Add('update presupuestos_recursos set termino=:termino where idUnicoRecurso=' + QuotedStr(codUnicoItem) + ' and codBase=' + QuotedStr(base_activa.codBase));
      prepare;
      ParamByName('termino').AsString := indice;
      ExecSQL;
    end;
  finally
    actualizaIndiceEnTabla(codUnicoItem, indice);
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de actualizaIndiceEnTabla.</summary>
/// <param name="codUnicoIndice">TODO.</param>
/// <param name="IndiceS">TODO.</param>
procedure actualizaIndiceEnTabla(codUnicoIndice, IndiceS: string);
var
  x: integer;
  salir: Boolean;
begin
  salir := False;
  x := 0;
  while (not salir) and (x < Length(listadoRecursosFP)) do
  begin
    if codUnicoIndice = listadoRecursosFP[x].codRecurso then
    begin
      salir := True;
      listadoRecursosFP[x].indice := IndiceS;
    end;
    Inc(x);
  end;
end;

procedure ajustaValorIndice(indice: string; valor: double);
var
  x: integer;
  tmpstr: string;
  sumador: Double;
  coeficiente: double;
  sumador2: double;
begin
  sumador := 0;
  for x := 1 to frmmain.grid_FpolIndicesDisponibles.RowCount - 1 do
  begin
    if frmmain.grid_FpolIndicesDisponibles.Cells[1, x] = indice then
    begin
      tmpstr := FloatToStr(valor);
      frmmain.grid_FpolIndicesDisponibles.Cells[4, x] := base_activa.simboloMoneda + tmpstr;
    end;
    tmpstr := frmMain.grid_FpolIndicesDisponibles.Cells[4, x];
    tmpstr := ReplaceStr(tmpstr, base_activa.simboloMoneda, '');
    tmpstr := decimal_correcto(tmpstr);
    sumador := sumador + StrToFloatDef(tmpstr, 0);
  end;
  tmpstr := FloatToStr(sumador);
  frmMain.lbl_ValorTotalIndice.Text := base_Activa.simboloMoneda + tmpstr;
  coeficiente := 0;
  sumador2 := 0;
  for x := 1 to frmMain.grid_FpolIndicesDisponibles.RowCount - 1 do
  begin
    tmpstr := frmmain.grid_FpolIndicesDisponibles.Cells[4, x];
    if tmpstr <> '' then
    begin
      tmpstr := replacestr(tmpstr, base_Activa.simboloMoneda, '');
      tmpstr := decimal_correcto(tmpstr);
      coeficiente := StrToFloat(tmpstr);
      coeficiente := coeficiente / sumador;
      sumador2 := sumador2 + coeficiente;
      tmpstr := FloatToStr(coeficiente);
      frmMain.grid_FpolIndicesDisponibles.Cells[5, x] := tmpstr;
    end;
  end;
  tmpstr := FloatToStr(sumador2);
  frmmain.lbl_CoeficienteTotalFpol.Text := tmpstr;
end;

/// <summary>TODO: Descripción de cargaOpcionesIndices.</summary>
procedure cargaOpcionesIndices();
var
  qry: TUniQuery;
  codigo: string;
  descripcion: string;
  x: integer;
  tmpstr: string;
  categoria: string;
begin
  qry := TUniQuery.Create(nil);
  frmMain.grid_FpolIndicesDisponibles.Columns[3].ComboItems.Clear;
  frmMain.grid_FpolIndicesDisponibles.Columns[2].ComboItems.Clear;
  frmMain.grid_FpolCuadrillaTipo.Columns[2].ComboItems.Clear;
  frmMain.grid_FpolCuadrillaTipo.Columns[3].ComboItems.Clear;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      sql.Add('select * from IndicesPrecios order by descripcion');
      Prepare;
      ExecSQL;
      x := 0;
      SetLength(listadoIndiceFpol, x);
      while not Eof do
      begin
        SetLength(listadoIndiceFpol, x + 1);
        codigo := FieldByName('codIndice').AsString;
        descripcion := FieldByName('descripcion').AsString;
        listadoIndiceFpol[x].codigo := codigo;
        listadoIndiceFpol[x].descripcion := descripcion;
        frmmain.grid_FpolIndicesDisponibles.Columns[3].ComboItems.Add(descripcion);
        categoria := FieldByName('categoria').AsString;
        if categoria = '2' then
          frmMain.grid_FpolCuadrillaTipo.Columns[3].ComboItems.Add(descripcion);
        Inc(x);
        Next;
      end;
    end;
  finally
    qry.free;
  end;
end;

/// <summary>TODO: Descripción de buscacodigoIndiceFpol.</summary>
/// <param name="descripcion">TODO.</param>
/// <returns>TODO.</returns>
function buscacodigoIndiceFpol(descripcion: string): string;
var
  salir: boolean;
  x: integer;
  tmpstr: string;
begin
  x := 0;
  salir := False;
  result := '';
  while (not salir) and (x < Length(listadoIndiceFpol) - 1) do
  begin
    tmpstr := listadoIndiceFpol[x].descripcion;
    if tmpstr = descripcion then
    begin
      result := listadoIndiceFpol[x].codigo;
      salir := true;
    end;
    inc(x);
  end;
end;

/// <summary>TODO: Descripción de limpia_gridFpolIndices.</summary>
procedure limpia_gridFpolIndices();
begin
  frmmain.grid_FpolIndicesDisponibles.ClearNormalCells;
  frmMain.grid_FpolIndicesDisponibles.Cells[0, 0] := '#';
  frmMain.grid_FpolIndicesDisponibles.Cells[1, 0] := 'Término';
  frmMain.grid_FpolIndicesDisponibles.Cells[2, 0] := 'Código';
  frmMain.grid_FpolIndicesDisponibles.Cells[3, 0] := 'Descripción de Indice';
  frmmain.grid_FpolIndicesDisponibles.Cells[4, 0] := 'C. Directo';
  frmmain.grid_FpolIndicesDisponibles.Cells[5, 0] := 'Coeficiente';
  frmMain.grid_FpolIndicesDisponibles.RowCount := 1;
end;

function IsConnected: Integer;
var
  dwFlags: DWORD;
begin
  Result := -1;
  if InternetGetConnectedState(@dwFlags, 0) then
  begin
    if (dwFlags and INTERNET_CONNECTION_MODEM) = INTERNET_CONNECTION_MODEM then
      Result := 0 // Modem Connection
    else if (dwFlags and INTERNET_CONNECTION_LAN) = INTERNET_CONNECTION_LAN then
      Result := 1 // LAN Connection
    else if (dwFlags and INTERNET_CONNECTION_PROXY) = INTERNET_CONNECTION_PROXY then
      Result := 2 // Connection thru Proxy
    else if (dwFlags and INTERNET_CONNECTION_OFFLINE) = INTERNET_CONNECTION_OFFLINE then
      Result := -1 // Local system in offline mode
    else if (dwFlags and INTERNET_CONNECTION_CONFIGURED) = INTERNET_CONNECTION_CONFIGURED then
      Result := 4
        // Valid connection exists, but might or might not be connected
  end
  else
    Result := -1; // Not Connected.
end;

/// <summary>TODO: Descripción de actualizaTablasIndices.</summary>
procedure actualizaTablasIndices();
type
  dat_indice = record
    codIndice: integer;
    descripcion: string;
  end;

  dat_valorIndice = record
    codIndice: integer;
    mesAnio: string;
    valor: string;
  end;
var
  qry2: TUniQuery;
  indices: array of dat_indice;
  valores: array of dat_valorIndice;
  x: integer;

  // HTTP
  J1, J2: TJSONObject;
  ListaPrecios: TArray<TIndicePrecioItem>;
  ListaValores: TArray<TIndiceValorItem>;
  OkHTTP1, OkHTTP2: Boolean;
begin
  qry2 := TUniQuery.Create(nil);
  J1 := nil;
  J2 := nil;
  try
    if IsConnected > -1 then
    begin
      // =======================
      // OBTENER INDICESPRECIOS
      // =======================
      SetLength(indices, 0);
      OkHTTP1 := False;
      try
        OkHTTP1 := ConsultarIndicesPreciosTipado(GlobalAuthToken, ListaPrecios, J1);
      except
        OkHTTP1 := False;
      end;

      if OkHTTP1 and (Length(ListaPrecios) > 0) then
      begin
        SetLength(indices, Length(ListaPrecios));
        for x := 0 to High(ListaPrecios) do
        begin
          indices[x].codIndice := StrToIntDef(ListaPrecios[x].codIndice, 0);
          indices[x].descripcion := ListaPrecios[x].descripcion;
        end;
      end
      else
      begin
        // Si falla la API, dejamos el array vacío (no hay fallback SQL)
        SetLength(indices, 0);
      end;

      // ====================
      // OBTENER INDICESVALOR
      // ====================
      SetLength(valores, 0);
      OkHTTP2 := False;
      try
        OkHTTP2 := ConsultarIndicesValorTipado(GlobalAuthToken, ListaValores, J2);
      except
        OkHTTP2 := False;
      end;

      if OkHTTP2 and (Length(ListaValores) > 0) then
      begin
        SetLength(valores, Length(ListaValores));
        for x := 0 to High(ListaValores) do
        begin
          valores[x].codIndice := ListaValores[x].codIndice;
          valores[x].mesAnio := ListaValores[x].MesAnio;
          valores[x].valor := ListaValores[x].valor;
        end;
      end
      else
      begin
        // Si falla la API, dejamos el array vacío (no hay fallback SQL)
        SetLength(valores, 0);
      end;

      // ======================
      // VOLCADO A con2 (DEST)
      // ======================
      with qry2 do
      begin
        Connection := DModule_1.con2;

        // Limpieza
        Close;
        SQL.Clear;
        SQL.Add('delete from indicesPrecios');
        Prepare;
        ExecSQL;
        Close;
        SQL.Clear;
        SQL.Add('delete from indicesValor');
        Prepare;
        ExecSQL;

        // Insertar precios
        if Length(indices) > 0 then
        begin
          Close;
          SQL.Clear;
          SQL.Add('insert into indicesPrecios (codIndice, descripcion) values (:codIndice, :descripcion)');
          Prepare;
          for x := 0 to High(indices) do
          begin
            ParamByName('codIndice').AsInteger := indices[x].codIndice;
            ParamByName('descripcion').AsString := indices[x].descripcion;
            ExecSQL;
          end;
        end;

        // Insertar valores
        if Length(valores) > 0 then
        begin
          Close;
          SQL.Clear;
          SQL.Add('insert into indicesValor (codIndice, mesAnio, valor) values (:codIndice, :mesAnio, :valor)');
          Prepare;
          for x := 0 to High(valores) do
          begin
            ParamByName('codIndice').AsInteger := valores[x].codIndice;
            ParamByName('mesAnio').AsString := valores[x].mesAnio;
            ParamByName('valor').AsString := valores[x].valor;
            ExecSQL;
          end;
        end;
      end;
    end;
  finally
    J1.Free;
    J2.Free;
    qry2.Free;
  end;
end;

/// <summary>TODO: Descripción de limpiaGridFpolinomica.</summary>
procedure limpiaGridFpolinomica();
begin
  frmMain.grid_Fpolinomica.ClearNormalCells;
  frmmain.grid_Fpolinomica.Cells[0, 0] := '#';
  frmmain.grid_Fpolinomica.Cells[1, 0] := 'Término';
  frmMain.grid_Fpolinomica.Cells[2, 0] := 'Código';
  frmMain.grid_Fpolinomica.Cells[3, 0] := 'Descripción';
  frmmain.grid_Fpolinomica.Cells[4, 0] := 'Unidad';
  frmMain.grid_Fpolinomica.Cells[5, 0] := 'Precio';
  frmMain.grid_Fpolinomica.Cells[6, 0] := 'Cantidad';
  frmmain.grid_Fpolinomica.Cells[7, 0] := 'C. Directo';
  frmMain.grid_Fpolinomica.Cells[8, 0] := '% Incidencia';
  frmmain.grid_Fpolinomica.RowCount := 1;
end;

/// <summary>TODO: Descripción de DatosRecursosFpolinomica.</summary>
procedure DatosRecursosFpolinomica();
var
  qry: TUniQuery;
  posgrid: integer;
  codAPU: string;
  x, y: Integer;
  cantidadAPU: Double;
  tmpstr: string;
  codApuCompleto: string;
  listadoControlRecursos: TStringList;
  codUnicoRecursoFP: string;
  salir: Boolean;
  CantidadAnterior: string;
  dCantidadAnterior: double;
  dCantidadActualizada: double;
  dCantidadRecursoTotal: double;
  CantidadRecurso: string;
  dCantidadRecurso: Double;
  RendimientoRecurso: string;
  dRendimientoRecurso: double;
  dCantidadPresupuesto: double;
  dCostoDirectoTotal: double;
  PrecioRecurso: string;
  dPrecioRecurso: double;
  indiceS: string;
  codCategoria: string;
  listadoE: TStringList;
  listadoB: TStringList;
  subCategoria: string;
begin
  listadoE := TStringList.Create;
  listadoB := TStringList.Create;
  SetLength(listadoApusEnGrid, 0);
  SetLength(ListadoRecursosFP, 0);
  // listado de apus utilizadas sin repetir y con cantidades sumadas
  for posgrid := 1 to frmMain.grid_Presupuestos.RowCount - 1 do
  begin
    with DMPresupuesto.dsTpresupuestosItems.DataSet do
    begin
      DisableControls;
      First;
      MoveBy(posgrid - 1);
      codAPU := DMPresupuesto.QTPresupuestosItemscodAPU.AsString;
      EnableControls;
      if codAPU <> '' then
      begin
        tmpstr := DMPresupuesto.QTPresupuestosItemsCantidad.AsString;
        tmpstr := decimal_correcto(tmpstr);
        cantidadAPU := StrToFloatDef(tmpstr, 0);
        codApuCompleto := DMPresupuesto.QTPresupuestosItemscodAPU.AsString;
        adicionaSumaApusEnGrid(codApuCompleto, cantidadAPU);
      end;
    end;
  end;

  qry := TUniQuery.Create(nil);
  listadoControlRecursos := TStringList.Create;
  listadoControlRecursos.Sorted := True;
  try
    with qry do
    begin
      connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Add('SELECT ' +
              'ai.codBase, ' +
              'ai.CodAPU, ' +
              'ai.codAPUAlternativo, ' +
              'ai.CodCategoria, ' +
              'ai.codSubCategoria, ' +
              'ai.idUnicoRecurso, ' +
              'ai.codRecurso, ' +
              'ai.codRecursoCompleto, ' +
              'ai.Descripcion, ' + 'ai.Unidad, ' +
              'redondea(ai.Precio, b.nDecimalesMoneda) as Precio, ' +
              'ai.moneda, ' +
              'redondea(ai.CantidadUnidad, b.nDecimalesMoneda) as CantidadUnidad, ' +
              'redondea(ai.Rendimiento, b.nDecimalesMoneda) as Rendimiento, ' +
              'redondea(ai.Total, b.nDecimalesMoneda) as Total, ' +
              'redondea(ai.porcentaje, b.nDecimalesMoneda) as porcentaje, ' +
              'ai.codCPC, ' +
              'ai.TipoCPC, ' +
              'ai.porcentajeCPC, ' +
              'ai.termino ' +
              'FROM apus_items ai ' +
              'INNER JOIN bases b on b.codBase=ai.codBase ' +
              'WHERE ' +
              'ai.codAPU = :codAPU ' +
              'AND ai.codBase = :codBase ' +
              'ORDER BY ' + 'ai.descripcion ASC');
        {*)}
      for x := 0 to length(listadoApusEnGrid) - 1 do
      begin
        ParamByName('codApu').AsString := listadoApusEnGrid[x].codUnicoAPU;
        ParamByName('codBase').AsString := base_activa.codBase;
        Prepare;
        ExecSQL;
        while not eof do
        begin
          codUnicoRecursoFP := FieldByName('idUnicoRecurso').AsString;
          codCategoria := FieldByName('codCategoria').AsString;
          subCategoria := FieldByName('codSubCategoria').AsString;
          CantidadRecurso := FieldByName('cantidadUnidad').AsString;
          dCantidadRecurso := StrToFloatDef(decimal_correcto(CantidadRecurso), 0);
          RendimientoRecurso := FieldByName('rendimiento').AsString;
          dRendimientoRecurso := StrToFloatDef(decimal_correcto(RendimientoRecurso), 0);
          PrecioRecurso := FieldByName('precio').AsString;
          dPrecioRecurso := StrToFloatDef(decimal_correcto(PrecioRecurso), 0);
          dCantidadPresupuesto := listadoApusEnGrid[x].cantidad;
          dCantidadRecursoTotal := dCantidadRecurso * dRendimientoRecurso * dCantidadPresupuesto;

          indiceS := FieldByName('termino').AsString;
          if (codCategoria = '1') and (indiceS = '') then
          begin
            listadoE.Add(codUnicoRecursoFP);
            indiceS := 'E';
          end;
          if (codCategoria = '4') and (indiceS = '') then
          begin
            listadoB.Add(codUnicoRecursoFP);
            indiceS := 'B';
            if not listadoControlRecursos.Find(codUnicoRecursoFP, y) then
            begin
              listadoControlRecursos.Add(codUnicoRecursoFP);
              y := Length(listadoRecursosFP);
              SetLength(listadoRecursosFP, y + 1);
              listadoRecursosFP[y].codRecurso := codUnicoRecursoFP;
              listadoRecursosFP[y].subCategoria := subCategoria;
              listadoRecursosFP[y].cantidad := FloatToStr(dCantidadRecursoTotal);
              listadoRecursosFP[y].precio := FloatToStr(dPrecioRecurso);
              listadoRecursosFP[y].total := FloatToStr(dCantidadRecursoTotal * dPrecioRecurso);
              listadoRecursosFP[y].indice := indiceS;
            end
            else
            begin
              salir := false;
              y := 0;
              while (not salir) and (y < Length(listadoRecursosFP)) do
              begin
                if codUnicoRecursoFP = listadoRecursosFP[y].codRecurso then
                begin
                  salir := True;
                  CantidadAnterior := listadoRecursosFP[y].cantidad;
                  if CantidadAnterior = '' then
                    CantidadAnterior := '0';
                  dCantidadAnterior := StrToFloatdef(decimal_correcto(CantidadAnterior), 0);
                  dCantidadActualizada := dCantidadAnterior + dCantidadRecursoTotal;
                  listadoRecursosFP[y].cantidad := FloatToStr(dCantidadActualizada);
                  dCostoDirectoTotal := dCantidadActualizada * dPrecioRecurso;
                  listadoRecursosFP[y].total := FloatToStr(dCostoDirectoTotal);
                end;
                Inc(y);
              end;
            end;
            Next;
          end;
        end;
      end;
    end;
  finally
    for x := 0 to listadoE.Count - 1 do
    begin
      sincronizaIndices('E', listadoE[x]);
    end;
    for x := 0 to listadoE.Count - 1 do
    begin
      sincronizaIndices('B', listadoB[x]);
    end;
    qry.Free;
  end;
end;

procedure adicionaSumaApusEnGrid(codUnicoAPU: string; cantidad: Double);
var
  x: integer;
  salir: Boolean;
  nuevoAPU: boolean;
  cantidadFinal: double;
begin
  x := 0;
  salir := False;
  nuevoAPU := True;
  while (not salir) and (x < Length(listadoApusEnGrid)) do
  begin
    if listadoApusEnGrid[x].codUnicoAPU = codUnicoAPU then
    begin
      nuevoAPU := False;
      salir := True;
      cantidadFinal := listadoApusEnGrid[x].cantidad;
      cantidadFinal := cantidadFinal + cantidad;
      listadoApusEnGrid[x].cantidad := cantidadFinal;
    end;
    inc(x);
  end;
  if nuevoAPU then
  begin
    x := Length(listadoApusEnGrid);
    SetLength(listadoApusEnGrid, x + 1);
    listadoApusEnGrid[x].codUnicoAPU := codUnicoAPU;
    listadoApusEnGrid[x].cantidad := cantidad;
  end;
end;

/// <summary>TODO: Descripción de muestraRecursosFpolinomica.</summary>
/// <param name="categoria">TODO.</param>
procedure muestraRecursosFpolinomica(categoria: string);
var
  qry: TUniQuery;
  x: integer;
  y: integer;
  codUnicoRecursoFP: string;
  tmpfloat1, tmpfloat2: double;
  tmpstr: string;
  codProyecto: string;
  codBase: string;
begin
  limpiaGridFpolinomica();
  qry := TUniQuery.Create(nil);
  codBase := base_activa.codBase;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      sql.Add('select * from presupuestos_recursos where codBase=' + QuotedStr(base_activa.codBase) + ' and codCategoria=' + QuotedStr(categoria) + ' and revision=' + quotedstr(revision) + ' order by descripcion asc');
      Prepare;
      ExecSQL;
      x := 1;
      while not Eof do
      begin
        frmMain.grid_Fpolinomica.RowCount := x + 1;
        frmMain.grid_Fpolinomica.Cells[0, x] := ponerCerosInicio(IntToStr(x), 4);
        tmpstr := UpperCase(FieldByName('termino').AsString);
        if (tmpstr = '') and (categoria = '1') then
          tmpstr := 'E';
        if (tmpstr = '') and (categoria = '4') then
          tmpstr := 'B';
        frmmain.grid_Fpolinomica.Cells[1, x] := tmpstr;
        frmMain.grid_Fpolinomica.Cells[2, x] := FieldByName('codRecursoCompleto').AsString;
        frmMain.grid_Fpolinomica.Cells[3, x] := FieldByName('descripcion').AsString;
        frmmain.grid_Fpolinomica.Cells[4, x] := FieldByName('unidad').AsString;
        frmMain.grid_Fpolinomica.Cells[5, x] := '';
        frmMain.grid_Fpolinomica.Cells[6, x] := '';
        frmMain.grid_Fpolinomica.Cells[7, x] := '';
        frmMain.grid_Fpolinomica.Cells[8, x] := FieldByName('termino').AsString;
        codUnicoRecursoFP := FieldByName('idUnicoRecurso').AsString;
        frmmain.grid_Fpolinomica.Cells[9, x] := codUnicoRecursoFP;
        Inc(x);
        Next;
      end;
    end;
  finally
    qry.free;
    frmMain.grid_Fpolinomica.Columns[9].Width := 0;
    completagridGeneralFP();
  end;
end;

/// <summary>TODO: Descripción de completagridGeneralFP.</summary>
procedure completagridGeneralFP();
var
  x: integer;
  y: integer;
  salir: Boolean;
  idRecursoBusqueda: string;
  TotalCalculo: double;
  tmpstr: string;
  tmpfloat1, tmpfloat2: double;
  Residual: double;
begin
  TotalCalculo := 0;
  for x := 0 to frmMain.grid_Fpolinomica.RowCount - 1 do
  begin
    salir := false;
    idRecursoBusqueda := frmMain.grid_Fpolinomica.Cells[9, x];
    y := 0;
    while (not salir) and (idRecursoBusqueda <> '') do
    begin
      if listadoRecursosFP[y].codRecurso = idRecursoBusqueda then
      begin
        salir := true;
        frmMain.grid_Fpolinomica.Cells[5, x] := base_activa.simboloMoneda + listadoRecursosFP[y].precio;
        frmMain.grid_Fpolinomica.Cells[6, x] := listadoRecursosFP[y].cantidad;
        frmMain.grid_Fpolinomica.Cells[7, x] := base_activa.simboloMoneda + listadoRecursosFP[y].total;
        tmpstr := listadoRecursosFP[y].total;
        tmpstr := decimal_correcto(tmpstr);
        TotalCalculo := TotalCalculo + strtofloatdef(tmpstr, 0);
      end;
      Inc(y);
    end;
  end;
  Residual := 0;
  for x := 0 to frmMain.grid_Fpolinomica.RowCount - 2 do
  begin
    tmpstr := frmmain.grid_Fpolinomica.Cells[9, x];
    if tmpstr <> '' then
    begin
      tmpstr := frmMain.grid_Fpolinomica.Cells[7, x];
      tmpstr := ReplaceStr(tmpstr, base_activa.simboloMoneda, '');
      tmpfloat1 := StrToFloat(tmpstr);
      tmpfloat2 := (tmpfloat1 / TotalCalculo) * 100;
      tmpstr := FloatToStr(tmpfloat2);
      Residual := Residual + tmpfloat2;
      frmMain.grid_Fpolinomica.Cells[8, x] := tmpstr + '%';
    end;
  end;
  Residual := 100 - Residual;
  x := frmMain.grid_Fpolinomica.RowCount - 1;
  tmpstr := frmMain.grid_Fpolinomica.Cells[9, x];
  if tmpstr <> '' then
  begin
    tmpstr := FloatToStr(Residual);
    frmMain.grid_Fpolinomica.Cells[8, x] := tmpstr + '%';
  end;
end;

/// <summary>TODO: Descripción de iniciaDBPresupuestosRecursos.</summary>
procedure iniciaDBPresupuestosRecursos();
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('delete from presupuestos_Recursos');
      Prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de sincronizaDesagCPC.</summary>
procedure sincronizaDesagCPC();
var
  ARow: Integer;
  codAPUDes: string;
  PrecioUnitario: string;
begin
  ARow := frmmain.grid_DesagregacionAPUS.Selection.StartRow;
  if ARow > -1 then
  begin
    codAPUDes := frmmain.grid_DesagregacionAPUS.Cells[10, ARow];
    PrecioUnitario := frmmain.grid_DesagregacionAPUS.Cells[5, ARow];
    if codAPUDes <> '' then
    begin
      PresentarRecursosDesagregacion(codAPUDes, PrecioUnitario);
    end;
  end;
end;

/// <summary>TODO: Descripción de sincronizaFooterDesagregacion.</summary>
procedure sincronizaFooterDesagregacion();
var
  x: Integer;
  sizenew: Double;
begin
  for x := 0 to frmmain.grid_DesagregacionAPUSHeader.Columns.Count - 1 do
  begin
    frmmain.grid_DesagregacionAPUS.Columns[x].Width := frmmain.grid_DesagregacionAPUSHeader.Columns[x].Width;
  end;

  sizenew := 0;
  for x := 0 to 5 do
  begin
    sizenew := sizenew + frmmain.grid_DesagregacionAPUS.Columns[x].Width;
  end;
  frmmain.lyt_DESGTotal0.Width := sizenew;
  frmmain.lyt_DESGTotal1.Width := frmmain.grid_DesagregacionAPUS.Columns[6].Width;
  frmmain.lyt_DESGTotal2.Width := frmmain.grid_DesagregacionAPUS.Columns[7].Width;
  frmmain.lyt_DESGTotal3.Width := frmmain.grid_DesagregacionAPUS.Columns[8].Width;
  frmmain.lyt_DESGTotal4.Width := frmmain.grid_DesagregacionAPUS.Columns[9].Width;
end;

/// <summary>TODO: Descripción de calculaTotalesRecursosDesagregacion.</summary>
procedure calculaTotalesRecursosDesagregacion();
var
  subtotal: Double;
  cantidadIndirecto: Double;
  porcentaje1, porcentaje2: Double;
  Total: Double;
  x: Integer;
  tmpstr: string;
  node: TTMSFNCTreeViewNode;
begin
  subtotal := 0;
  porcentaje1 := 0;
  porcentaje2 := 0;
  x := 0;
  node := frmmain.trvw_RecursosDesagregacion.Nodes[0];
  while Assigned(node) do
  begin
    tmpstr := node.Text[6];
    tmpstr := decimal_correcto(tmpstr);
    subtotal := subtotal + strtofloatdef(tmpstr, 0);
    tmpstr := node.Text[7];
    tmpstr := ReplaceStr(tmpstr, '%', '');
    tmpstr := decimal_correcto(tmpstr);
    porcentaje1 := porcentaje1 + strtofloatdef(tmpstr, 0);
    tmpstr := node.Text[11];
    tmpstr := ReplaceStr(tmpstr, '%', '');
    tmpstr := decimal_correcto(tmpstr);
    porcentaje2 := porcentaje2 + strtofloatdef(tmpstr, 0);
    node := node.GetNext;
  end;
  tmpstr := FloatToStr(subtotal);
  tmpstr := Base_activa.simboloMoneda + tmpstr;
  frmmain.lbl_DesgRecursoSubtotal.Text := tmpstr;
  tmpstr := FloatToStr(porcentaje1);
  tmpstr := forzarNdecimales(porcentaje1, 2);
  frmmain.lbl_DesgRecursoPorcentaje1.Text := tmpstr + '%';
  tmpstr := FloatToStr(porcentaje2);
  tmpstr := forzarNdecimales(porcentaje2, 2);
  frmmain.lbl_DesgRecursoPorcentaje2.Text := tmpstr + '%';
  cantidadIndirecto := (IndirectosPresupuesto * subtotal) / 100;
  tmpstr := FloatToStr(cantidadIndirecto);
  frmmain.lbl_DesgRecursoIndirectos.Text := base_activa.simboloMoneda + tmpstr;
  Total := subtotal + cantidadIndirecto;
  tmpstr := FloatToStr(Total);
  frmmain.lbl_DesgRecursoCostoTotal.Text := base_activa.simboloMoneda + tmpstr;
  frmmain.lbl_DesgRecursoValorOfertado.Text := base_activa.simboloMoneda + tmpstr;
end;

/// <summary>TODO: Descripción de actualizaCodigoRecursosCompletos.</summary>
procedure actualizaCodigoRecursosCompletos();
var
  tabla: TUniTable;
  codCategoriaBase, codSubCategoria, codRecurso: string;
  codRecursoCompleto: string;
begin
  tabla := TUniTable.Create(nil);
  tabla := DModule_1.untbl4;
  tabla.Active := True;
  tabla.First;
  while not tabla.Eof do
  begin
    codCategoriaBase := tabla.FieldByName('codCategoria').AsString;
    codSubCategoria := tabla.FieldByName('codSubCategoria').AsString;
    codRecurso := tabla.FieldByName('codRecurso').AsString;
    codRecursoCompleto := generaCodigoRecurso(codCategoriaBase, codSubCategoria, codRecurso);
    tabla.Edit;
    tabla.FieldByName('codRecursoCompleto').AsString := codRecursoCompleto;
    tabla.Post;
    tabla.Next;
  end;
end;

/// <summary>TODO: Descripción de treeviewDesagregacionManualSize.</summary>
procedure treeviewDesagregacionManualSize();
var
  NewSize: double;
  offset: Double;
begin
  offset := 20;
  NewSize := frmMain.trvw_RecursosDesagregacion.Width;
  frmMain.trvw_RecursosDesagregacion.Columns[0].Width := 130;
  frmMain.trvw_RecursosDesagregacion.Columns[1].Width := NewSize - 910 - offset;
  frmMain.trvw_RecursosDesagregacion.Columns[2].Width := 70;
  frmMain.trvw_RecursosDesagregacion.Columns[3].Width := 80;
  frmMain.trvw_RecursosDesagregacion.Columns[4].Width := 60;
  frmMain.trvw_RecursosDesagregacion.Columns[5].Width := 80;
  frmMain.trvw_RecursosDesagregacion.Columns[6].Width := 60;
  frmMain.trvw_RecursosDesagregacion.Columns[7].Width := 70;
  frmMain.trvw_RecursosDesagregacion.Columns[8].Width := 100;
  frmMain.trvw_RecursosDesagregacion.Columns[9].Width := 70;
  frmMain.trvw_RecursosDesagregacion.Columns[10].Width := 50;
  frmMain.trvw_RecursosDesagregacion.Columns[11].Width := 100;
  frmMain.trvw_RecursosDesagregacion.Columns[12].Width := 0;
  frmMain.trvw_RecursosDesagregacion.Columns[13].Width := 0;
end;

/// <summary>TODO: Descripción de PresentarRecursosDesagregacion.</summary>
/// <param name="codAPUDes">TODO.</param>
/// <param name="PrecioUnitarioAPU">TODO.</param>
procedure PresentarRecursosDesagregacion(codAPUDes, PrecioUnitarioAPU: string);
var
  qry: TUniQuery;
  tipoRecurso: Integer;
  x: Integer;
  codRecursoCompleto: string;
  codRecurso: string;
  codCategoriaBase: Integer;
  codSubCategoria: string;
  Descripcion: string;
  unidad: string;
  Precio: string;
  fPrecio: Double;
  fTotal: Double;
  moneda: string;
  cantidad: string;
  Rendimiento: string;
  Total: string;
  codCPC: string;
  tipoCPC: string;
  porcentajeCPC: string;
  idUnicoRecurso: string;
  node: TTMSFNCTreeViewNode;
  n: TTMSFNCTreeViewNode;
  porcentaje: string;
  fPorcentaje: Double;
  VAECalculado: string;
  vae1, vae2: Double;
  nnodos: integer;
  precioRelativo: double;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  nnodos := 3;
  if base_activa.SeguridadIndustrial then
    nnodos := 4;
  for x := 0 to nnodos do
  begin
    node := frmmain.trvw_RecursosDesagregacion.Nodes[x];
    node.RemoveChildren;
  end;
  frmmain.trvw_RecursosDesagregacion.BeginUpdate;
  porcentaje := '';
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from apus where codBase=' + QuotedStr(base_activa.codBase) + ' and codApu=' + QuotedStr(codAPUDes));
      Prepare;
      ExecSQL;
      PrecioUnitarioAPU := FieldByName('CostoDirectoTotal').AsString;
      PrecioUnitarioAPU := decimal_correcto(PrecioUnitarioAPU);
      fTotal := StrToFloat(PrecioUnitarioAPU);
      Close;
      sql.Clear;
      sql.Add('select * from apus_items where codBase=' + QuotedStr(base_activa.codBase) + ' and codAPU=' + QuotedStr(codAPUDes) + ' order by codCategoria, descripcion');
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        codCategoriaBase := FieldByName('codCategoria').AsInteger;
        codRecursoCompleto := FieldByName('codRecursoCompleto').AsString;
        Descripcion := FieldByName('descripcion').AsString;
        unidad := FieldByName('unidad').AsString;
        cantidad := FieldByName('cantidadUnidad').AsString;
        cantidad := decimal_correcto(cantidad);
        Precio := FieldByName('Precio').AsString;
        Precio := decimal_correcto(Precio);
        tmpstr := FieldByName('total').AsString.Trim;
        tmpstr := decimal_correcto(tmpstr);
        precioRelativo := strtofloatdef(tmpstr, 0);
        Rendimiento := FieldByName('rendimiento').AsString;
        Rendimiento := decimal_correcto(Rendimiento);
        Rendimiento := forzarNdecimales(StrToFloat(Rendimiento), 2);
        idUnicoRecurso := FieldByName('idUnicoRecurso').AsString;
        codCPC := FieldByName('codCPC').AsString;
        tipoCPC := FieldByName('tipoCPC').AsString;
        porcentajeCPC := FieldByName('porcentajeCPC').AsString;
        if codCategoriaBase = 6 then
          codCategoriaBase := 2;
        n := frmmain.trvw_RecursosDesagregacion.Nodes[codCategoriaBase - 1];
        node := frmmain.trvw_RecursosDesagregacion.AddNode(n);
        node.Text[0] := codRecursoCompleto;
        node.Text[1] := Descripcion;
        node.Text[2] := unidad;
        node.Text[3] := forzarNdecimales(StrToFloat(cantidad), 2);
        node.Text[4] := forzarNdecimales(StrToFloat(Precio), 2);
        node.Text[5] := '';
        fPorcentaje := (precioRelativo / fTotal) * 100;
        porcentaje := FloatToStr(fPorcentaje);
        case codCategoriaBase of
          1:
            begin
              node.Text[5] := Rendimiento;
            end;
          3:
            begin
              node.Text[5] := Rendimiento;
            end;
          4:
            begin
              node.Text[5] := Rendimiento;
            end;
        end;
        node.Text[6] := forzarNdecimales(precioRelativo, 2);
        vae1 := strtofloatdef(porcentaje, 0);
        node.Text[7] := forzarNdecimales(StrToFloat(porcentaje), 2) + '%';
        node.Text[8] := 'N/D';
        node.Text[9] := '';
        node.Text[10] := '';
        node.Text[11] := '';
        if codCPC <> '' then
        begin
          vae2 := StrToFloat(porcentajeCPC);
          vae2 := vae2 / 100;
          vae2 := vae1 * vae2;
          VAECalculado := forzarNdecimales(vae2, 2);
          node.Text[8] := codCPC;
          node.Text[9] := tipoCPC;
          node.Text[10] := forzarNdecimales(StrToFloat(porcentajeCPC), 2) + '%';
          node.Text[11] := VAECalculado + '%';
        end;
        node.Text[12] := idUnicoRecurso;
        node.Text[13] := inttostr(codCategoriaBase);
        Next;
      end;
    end;
  finally
    frmmain.trvw_RecursosDesagregacion.EndUpdate;
    qry.Free;
    calculaTotalesRecursosDesagregacion();
  end;
end;

function calcularTotalRecursoDesagregacion(cantidad, Precio, Rendimiento: string; categoriaBase: Integer): string;
var
  Tcantidad: Double;
  Tprecio: Double;
  TRendimiento: Double;
  tTotal: Double;
  tipoBase: Integer;
begin
  result := '0';
  tipoBase := 1;
  if base_activa.TRendimiento = 'Rendimiento Unitario (Tiempo/Unidad)' then
  begin
    tipoBase := 1;
  end
  else
  begin
    tipoBase := 2
  end;
  Tcantidad := StrToFloat(decimal_correcto(cantidad));
  Tprecio := StrToFloat(decimal_correcto(Precio));
  if Rendimiento <> '' then
  begin
    TRendimiento := StrToFloat(decimal_correcto(Rendimiento));
  end
  else
  begin
    TRendimiento := 1;
  end;
  if tipoBase = 2 then
  begin
    TRendimiento := 1 / TRendimiento;
  end;
  tTotal := 0;
  tTotal := Tcantidad * Tprecio;
  tTotal := tTotal * TRendimiento;
  result := decimal_correcto(FloatToStr(tTotal));
end;

/// <summary>TODO: Descripción de generaDesagregacionAPUS.</summary>
/// <param name="codAPUSDes">TODO.</param>
/// <returns>TODO.</returns>
function generaDesagregacionAPUS(codAPUSDes: string): Double;
type
  dat_recurdesg = record
    codUnicoRecurso: string;
    CostoRecurso: Double;
    codCPC: string;
    tipo: string;
    porcentajeCPC: Double;
    pesoRelativo: Double;
    VAE: Double;
  end;
var
  qry: TUniQuery;
  CostoDirectoAPU: Double;
  costoRecurso: Double;
  tmpstr: string;
  x: Integer;
  calcular: Double;
  listadoRecursosDESG: array of dat_recurdesg;
  sumar: Boolean;
begin
  result := -1;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from APUS where codAPU=' + QuotedStr(codAPUSDes) + ' and codbase=' + QuotedStr(base_activa.codBase));
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('costoDirectoTotal').AsString;
      tmpstr := decimal_correcto(tmpstr);
      CostoDirectoAPU := strtofloatdef(tmpstr, -1);
      Close;
      sql.Clear;
      sql.Add('select * from APUS_items where codAPU=' + QuotedStr(codAPUSDes) + ' and codBase=' + QuotedStr(base_activa.codBase));
      Prepare;
      ExecSQL;
      x := 0;
      sumar := True;
      while not Eof do
      begin
        setlength(listadoRecursosDESG, x + 1);
        listadoRecursosDESG[x].codUnicoRecurso := FieldByName('idUnicoRecurso').AsString;
        tmpstr := FieldByName('codCPC').AsString;
        if tmpstr <> '' then
        begin
          listadoRecursosDESG[x].codCPC := tmpstr;
          listadoRecursosDESG[x].tipo := FieldByName('tipoCPC').AsString;
          tmpstr := FieldByName('porcentajeCPC').AsString;
          tmpstr := decimal_correcto(tmpstr);
          listadoRecursosDESG[x].porcentajeCPC := StrToFloat(tmpstr);
          tmpstr := FieldByName('Total').AsString;
          tmpstr := decimal_correcto(tmpstr);
          listadoRecursosDESG[x].costoRecurso := StrToFloat(tmpstr);
          // Peso Relativo
          costoRecurso := StrToFloat(tmpstr);
          calcular := (costoRecurso / CostoDirectoAPU) * 100;
          calcular := RoundTo(calcular, -2);
          listadoRecursosDESG[x].pesoRelativo := calcular;
          // VAE
          calcular := listadoRecursosDESG[x].pesoRelativo * listadoRecursosDESG[x].porcentajeCPC;
          listadoRecursosDESG[x].VAE := calcular;
        end
        else
        begin
          sumar := False;
          result := -1;
        end;
        Inc(x);
        Next;
      end;
    end;
    if sumar then
    begin
      calcular := 0;
      for x := 0 to length(listadoRecursosDESG) - 1 do
      begin
        calcular := calcular + (listadoRecursosDESG[x].VAE / 100);
      end;
      result := calcular;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de limpiaGridDesagregacion.</summary>
procedure limpiaGridDesagregacion();
begin
  frmmain.grid_DesagregacionAPUSHeader.ClearNormalCells;
  frmmain.grid_DesagregacionAPUS.ClearNormalCells;
  frmmain.grid_DesagregacionAPUS.AutoSizeRow(2);
  frmmain.grid_DesagregacionAPUS.RowCount := 0;
  frmmain.grid_DesagregacionAPUSHeader.Cells[0, 0] := 'Item';
  frmmain.grid_DesagregacionAPUSHeader.Cells[1, 0] := 'Código';
  frmmain.grid_DesagregacionAPUSHeader.Cells[2, 0] := 'Descripción del Rubro';
  frmmain.grid_DesagregacionAPUSHeader.Cells[3, 0] := 'Unidad';
  frmmain.grid_DesagregacionAPUSHeader.Cells[4, 0] := 'Cantidad';
  frmmain.grid_DesagregacionAPUSHeader.Cells[5, 0] := 'Precio Unitario del Rubro (' + base_activa.simboloMoneda + ')';
  frmmain.grid_DesagregacionAPUSHeader.Cells[6, 0] := 'Precio Global del Rubro (' + base_activa.simboloMoneda + ')';
  frmmain.grid_DesagregacionAPUSHeader.Cells[7, 0] := 'Peso Relativo del Rubro (%)';
  frmmain.grid_DesagregacionAPUSHeader.Cells[8, 0] := 'Agregado Ecuatoriano del Rubro (%)';
  frmmain.grid_DesagregacionAPUSHeader.Cells[9, 0] := 'Agregado Ecuatoriano Ponderado (%)';
  frmmain.grid_DesagregacionAPUS.Columns[0].Width := frmmain.grid_DesagregacionAPUSHeader.Columns[0].Width;
  frmmain.grid_DesagregacionAPUS.Columns[1].Width := frmmain.grid_DesagregacionAPUSHeader.Columns[1].Width;
  frmmain.grid_DesagregacionAPUS.Columns[2].Width := frmmain.grid_DesagregacionAPUSHeader.Columns[2].Width;
  frmmain.grid_DesagregacionAPUS.Columns[3].Width := frmmain.grid_DesagregacionAPUSHeader.Columns[3].Width;
  frmmain.grid_DesagregacionAPUS.Columns[4].Width := frmmain.grid_DesagregacionAPUSHeader.Columns[4].Width;
  frmmain.grid_DesagregacionAPUS.Columns[5].Width := frmmain.grid_DesagregacionAPUSHeader.Columns[5].Width;
  frmmain.grid_DesagregacionAPUS.Columns[6].Width := frmmain.grid_DesagregacionAPUSHeader.Columns[6].Width;
  frmmain.grid_DesagregacionAPUS.Columns[7].Width := frmmain.grid_DesagregacionAPUSHeader.Columns[7].Width;
  frmmain.grid_DesagregacionAPUS.Columns[8].Width := frmmain.grid_DesagregacionAPUSHeader.Columns[8].Width;
  frmmain.grid_DesagregacionAPUS.Columns[9].Width := frmmain.grid_DesagregacionAPUSHeader.Columns[9].Width;
  frmmain.grid_DesagregacionAPUS.Columns[10].Width := 0;
  sincronizaFooterDesagregacion();
end;

/// <summary>TODO: Descripción de sincronizaDesagregacion.</summary>
procedure sincronizaDesagregacion();
var
  x, y: Integer;
  totalSinIva: Double;
  TotalItem: Double;
  tmpstr: string;
  pesoRelativo: Double;
  ValorUnitarioAPU: Double;
  Agregado: Double;
  AgregadoPonderado: Double;
  codApuDesg: string;
  TAgregadoPonderado: Double;
  TAgregado: Double;
begin
  tmpstr := frmmain.lbl_SubtotalPresupuesto.Text;
  tmpstr := AnsiReplaceStr(tmpstr, base_activa.simboloMoneda, '').Trim;
  tmpstr := quitaSignoMiles(tmpstr);
  tmpstr := decimal_correcto(tmpstr);
  totalSinIva := strtofloatdef(tmpstr, 0);
  frmMain.grid_DesagregacionAPUS.Columns[11].Width := 0;
  TAgregadoPonderado := 0;
  TAgregado := 0;
  for y := 1 to frmmain.grid_Presupuestos.RowCount - 1 do
  begin
    with DMPresupuesto.dsTpresupuestosItems.DataSet do
    begin
      DisableControls;
      First;
      MoveBy(y - 1);
      EnableControls;
    end;
    frmmain.grid_DesagregacionAPUS.RowCount := y;
    frmmain.grid_DesagregacionAPUS.Cells[0, y - 1] := ponerCerosInicio(inttostr(y), 6);
    frmMain.grid_DesagregacionAPUS.cells[1, y - 1] := DMPresupuesto.QTPresupuestosItemscodAPUGenerico.AsString;
    frmMain.grid_DesagregacionAPUS.Cells[2, y - 1] := DMPresupuesto.QTPresupuestosItemsdescripcion.AsString;
    frmMain.grid_DesagregacionAPUS.Cells[3, y - 1] := DMPresupuesto.QTPresupuestosItemsunidad.AsString;
    frmMain.grid_DesagregacionAPUS.Cells[4, y - 1] := DMPresupuesto.QTPresupuestosItemsCantidad.AsString;
    frmMain.grid_DesagregacionAPUS.Cells[5, y - 1] := FormatFloat(cadenaCurrency, DMPresupuesto.QTPresupuestosItemsPUnitario.AsFloat);
    frmMain.grid_DesagregacionAPUS.Cells[6, y - 1] := FormatFloat(cadenaCurrency, DMPresupuesto.QTPresupuestosItemsPtotal.AsFloat);
    frmMain.grid_DesagregacionAPUS.Cells[11, y - 1] := DMPresupuesto.QTPresupuestosItemscodAPU.AsString;
    frmmain.grid_DesagregacionAPUS.AutoSizeRow(y - 1);

    if DMPresupuesto.QTPresupuestosItemsPUnitario.AsString <> '' then
    begin
      // Peso Relativo
      tmpstr := DMPresupuesto.QTPresupuestosItemsPtotal.AsString;
      tmpstr := quitaSignoMiles(tmpstr);
      tmpstr := decimal_correcto(tmpstr);
      TotalItem := strtofloatdef(tmpstr, 0);
      pesoRelativo := TotalItem / totalSinIva;
      pesoRelativo := pesoRelativo * 100;
      pesoRelativo := RoundTo(pesoRelativo, -2);
      tmpstr := FloatToStr(pesoRelativo);
      frmmain.grid_DesagregacionAPUS.Cells[7, y - 1] := tmpstr + '%';
      codApuDesg := DMPresupuesto.QTPresupuestosItemscodAPU.AsString;
      frmmain.grid_DesagregacionAPUS.Cells[10, y - 1] := codApuDesg;
      Agregado := generaDesagregacionAPUS(codApuDesg);
      if Agregado > -1 then
      begin

        tmpstr := FloatToStr(Agregado);
        tmpstr := tmpstr + '%';
        frmmain.grid_DesagregacionAPUS.Cells[8, y - 1] := tmpstr;
        AgregadoPonderado := Agregado * (pesoRelativo / 100);
        tmpstr := FloatToStr(AgregadoPonderado);
        frmmain.grid_DesagregacionAPUS.Cells[9, y - 1] := tmpstr + '%';
      end;
      tmpstr := frmmain.grid_DesagregacionAPUS.Cells[7, y - 1];
      tmpstr := ReplaceStr(tmpstr, '%', '');
      tmpstr := trim(tmpstr);
      TAgregado := TAgregado + strtofloatdef(tmpstr, 0);
      tmpstr := frmmain.grid_DesagregacionAPUS.Cells[9, y - 1];
      tmpstr := ReplaceStr(tmpstr, '%', '');
      tmpstr := trim(tmpstr);
      TAgregadoPonderado := TAgregadoPonderado + strtofloatdef(tmpstr, 0);
    end;
  end;

  frmmain.lbl_DesagPrecioTotalRubro.Text := FormatFloat(cadenaCurrency, totalSinIva);
  frmmain.lbl_DesgPesoRelativoRublo.Text := FormatFloat(cadenaDecimales, TAgregado) + '%';
  frmmain.lbl_DesgAgregadoPonderado.Text := FormatFloat(cadenaDecimales, TAgregadoPonderado) + '%';
end;

/// <summary>TODO: Descripción de verRecursoDesagregacion.</summary>
/// <param name="codCategoria">TODO.</param>
procedure verRecursoDesagregacion(codCategoria: Integer);
var
  filtro: string;
begin
  DModule_1.untbl2.Active := False;
  frmmain.dbGridConnect_Desagregacion.Active := True;
  DModule_1.untbl2.Filtered := False;
  DModule_1.untbl2.FilterSQL := '';
  filtro := 'codCategoria=' + inttostr(codCategoria) + ' and codBase=' + QuotedStr(base_activa.codBase);
  if frmMain.chkRecursosSoloFaltantes.IsChecked then
  begin
    filtro := filtro + ' and (codCPC is Null or codCPC=' + QuotedStr('') + ')';
  end;
  DModule_1.untbl2.FilterSQL := filtro;
  DModule_1.untbl2.Filtered := True;
  DModule_1.untbl2.Active := True;
  DModule_1.untbl2.First;
end;

/// <summary>TODO: Descripción de resalta_desgPanelCategoria.</summary>
/// <param name="Panel">TODO.</param>
procedure resalta_desgPanelCategoria(Panel: Integer);
begin
  frmmain.rct_desgEquiposHerramientas.Fill.Color := $FF606060;
  frmmain.rct_desgMateriales.Fill.Color := $FF606060;
  frmmain.rct_desgTransporte.Fill.Color := $FF606060;
  frmmain.rct_desgManoObra.Fill.Color := $FF606060;
  frmmain.rct_desgSeguridadIndustrial.Fill.Color := $FF606060;
  case Panel of
    1:
      begin
        frmmain.rct_desgEquiposHerramientas.Fill.Color := $FFE94E1B;
      end;
    2:
      begin
        frmmain.rct_desgMateriales.Fill.Color := $FFE94E1B;
      end;
    3:
      begin
        frmmain.rct_desgTransporte.Fill.Color := $FFE94E1B;
      end;
    4:
      begin
        frmmain.rct_desgManoObra.Fill.Color := $FFE94E1B;
      end;
    5:
      begin
        frmmain.rct_desgSeguridadIndustrial.Fill.Color := $FFE94E1B;
      end;
  end;
end;

/// <summary>TODO: Descripción de resalta_FpoliPanelCategoria.</summary>
/// <param name="Panel">TODO.</param>
procedure resalta_FpoliPanelCategoria(Panel: Integer);
begin
  frmmain.rect_FpoliEquiposyHerramientas.Fill.Color := $FF606060;
  frmmain.rect_FpoliMateriales.Fill.Color := $FF606060;
  frmmain.rect_FpoliTransporte.Fill.Color := $FF606060;
  frmmain.rect_FpoliManoObra.Fill.Color := $FF606060;
  frmmain.rect_FpoliSeguridadIndustrial.Fill.Color := $FF606060;
  case Panel of
    1:
      begin
        frmmain.rect_FpoliEquiposyHerramientas.Fill.Color := $FFE94E1B;
        cargaTablaIndicesSeleccionados('E');
      end;
    2:
      begin
        frmmain.rect_FpoliMateriales.Fill.Color := $FFE94E1B;
        cargaTablaIndicesSeleccionados('OTROS');
      end;
    3:
      begin
        frmmain.rect_FpoliTransporte.Fill.Color := $FFE94E1B;
        cargaTablaIndicesSeleccionados('OTROS');
      end;
    4:
      begin
        frmmain.rect_FpoliManoObra.Fill.Color := $FFE94E1B;
        cargaTablaIndicesSeleccionados('B');
      end;
    5:
      begin
        frmmain.rect_FpoliSeguridadIndustrial.Fill.Color := $FFE94E1B;
      end;
  end;
  muestraRecursosFpolinomica(IntToStr(Panel));
end;

/// <summary>TODO: Descripción de limpiaLista.</summary>
/// <param name="Lista">TODO.</param>
procedure limpiaLista(Lista: TListView);
begin
  Lista.Items.Clear;
end;

/// <summary>TODO: Descripción de generaRecursosPresupuesto.</summary>
procedure generaRecursosPresupuesto();
begin
  DModule_1.uProcSql_GeneraRecursos.ParamByName('icodBase').AsString := base_activa.codBase;
  DModule_1.uProcSql_GeneraRecursos.ParamByName('icodPresupuesto').AsString := codProyecto;
  DModule_1.uProcSql_GeneraRecursos.ParamByName('irevision').AsString := revision;
  DModule_1.uProcSql_GeneraRecursos.Execute;
end;

function ItemEnLista(AItem: string; Lista: TStringList): Boolean;
var
  k: Integer;
begin
  result := False;
  for k := 0 to Lista.Count - 1 do
  begin
    result := AItem = Lista[k];
    if result then
      break;
  end;
end;

/// <summary>TODO: Descripción de EditarCPC.</summary>
procedure EditarCPC();
var
  codCPCEditar: string;
  x, y: Integer;
  Tipo: string;
  porcentaje: string;
begin
  DModule_1.untbl1.DisableControls;
  DModule_1.untbl1.First;
  y := 0;
  x := frmmain.grid_desagregacionCPC.Selection.StartRow;
  if x > -1 then
  begin
    if frmmain.grid_desagregacionCPC.RowSelect[x] then
    begin
      DModule_1.untbl1.MoveBy(x - 1 - y);
      codCPCEditar := DModule_1.untbl1.FieldByName('codCPC').AsString;
      y := x - 1;
      if codCPCEditar <> '' then
      begin
        frm_AddEditCPC.lbl_modo.Text := '2';
        frm_AddEditCPC.edt_codCPC.Text := DModule_1.untbl1.FieldByName('codCPC').AsString;
        frm_AddEditCPC.edt_codCPC.ReadOnly := True;
        frm_AddEditCPC.edt_DescripcionCPC.Text := DModule_1.untbl1.FieldByName('descripcion').AsString;
        Tipo := DModule_1.untbl1.FieldByName('tipo').AsString;
        porcentaje := DModule_1.untbl1.FieldByName('porcentaje').AsString;
        if Tipo = 'NP' then
        begin
          frm_AddEditCPC.cbb_tipo.ItemIndex := 0;
          frm_AddEditCPC.lbl_porcentaje.Text := '0 %';
        end;
        if Tipo = 'EP' then
        begin
          frm_AddEditCPC.cbb_tipo.ItemIndex := 1;
          frm_AddEditCPC.lbl_porcentaje.Text := '100 %';
        end;
        if Tipo = 'ND' then
        begin
          frm_AddEditCPC.cbb_tipo.ItemIndex := 2;
          frm_AddEditCPC.lbl_porcentaje.Text := '40 %';
        end;
        frm_AddEditCPC.lbl_1.Text := 'Editar CPC';
        frm_AddEditCPC.lbl_2.Text := 'Edición CPC';
        frm_AddEditCPC.ShowModal;
      end;
    end;
  end;
  DModule_1.untbl1.EnableControls;
end;

/// <summary>TODO: Descripción de borrarCPC.</summary>
procedure borrarCPC();
var
  x, y: Integer;
  tmpstr: string;
  listadoBorrar: TStringList;
  qry: TUniQuery;
begin
  DModule_1.untbl1.DisableControls;
  DModule_1.untbl1.First;
  listadoBorrar := TStringList.Create;
  y := 0;
  for x := frmmain.grid_desagregacionCPC.Selection.StartRow to frmmain.grid_desagregacionCPC.Selection.EndRow do
  begin
    if frmmain.grid_desagregacionCPC.RowSelect[x] then
    begin
      DModule_1.untbl1.MoveBy(x - 1 - y);
      tmpstr := DModule_1.untbl1.FieldByName('codCPC').AsString;
      listadoBorrar.Add(tmpstr);
      y := x - 1;
    end;
  end;
  for x := 0 to listadoBorrar.Count - 1 do
  begin
    if DModule_1.untbl1.Locate('codCPC', listadoBorrar[x], []) then
    begin
      DModule_1.untbl1.Edit;
      DModule_1.untbl1.Delete;
    end;
  end;
  DModule_1.untbl1.EnableControls;
  DModule_1.untbl1.First;
end;

/// <summary>TODO: Descripción de ParetoTiempoCuentaPaquete.</summary>
procedure ParetoTiempoCuentaPaquete();
var
  nItemsPareto: Integer;
  codTempProyecto: string;
  valor: Double;
  qry: TUniQuery;
  listadoFiltrado: TStringList;
  x: Integer;
  tmpstr: string;
  listadoEdtCapitulos: TStringList;
begin
  listadoFiltrado := TStringList.Create;
  codTempProyecto := frmmain.lbl_codUnicoTemporal.Text;
  listadoEdtCapitulos := TStringList.Create;
  listadoEdtCapitulos := generalistadoEDTCapitulos();
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      for x := 0 to listadoEdtCapitulos.Count - 1 do
      begin
        nItemsPareto := da20ParetoTiempo(listadoEdtCapitulos[x]);
        Close;
        sql.Clear;
        sql.Add('select * from TGrid2Items where codTempProyecto=' + QuotedStr(codTempProyecto) + ' and codEDT like ' + QuotedStr(trim(listadoEdtCapitulos[x]) + '%') + ' order by valor desc Limit ' + inttostr(nItemsPareto));
        Prepare;
        ExecSQL;
        while not Eof do
        begin
          tmpstr := FieldByName('codUnicoItem').AsString;
          listadoFiltrado.Add(tmpstr);
          Next;
        end;
      end;
    end;
  finally
    qry.Free;
  end;
  //aplicaParetoTiempo(listadoFiltrado);
end;

/// <summary>TODO: Descripción de ParetoGeneralTiempo.</summary>
procedure ParetoGeneralTiempo();
var
  NitemsTotales: Integer;
  nItemsPareto: Integer;
  codTempProyecto: string;
  valor: Double;
  qry: TUniQuery;
  listadoFiltrado: TStringList;
  x: Integer;
  tmpstr: string;
begin
  NitemsTotales := cuentaItemsRealesGridTiempo();
  valor := (NitemsTotales * 20) / 100;
  nItemsPareto := trunc(valor);
  valor := frac(valor);
  if valor > 0 then
    Inc(nItemsPareto);
  listadoFiltrado := TStringList.Create;
  codTempProyecto := frmmain.lbl_codUnicoTemporal.Text;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from TGrid2Items where codTempProyecto=' + QuotedStr(codTempProyecto) + ' order by valor desc');
      Prepare;
      ExecSQL;
      for x := 0 to nItemsPareto - 1 do
      begin
        tmpstr := FieldByName('CodUnicoItem').AsString;
        listadoFiltrado.Add(tmpstr);
        Next;
      end;
    end;
  finally
    qry.Free;
    // aplicaParetoTiempo(listadoFiltrado);
  end;
end;

/// <summary>TODO: Descripción de cuentaItemsRealesGridTiempo.</summary>
/// <returns>TODO.</returns>
function cuentaItemsRealesGridTiempo(): Integer;
var
  qry: TUniQuery;
  codTempProyecto: string;
begin
  qry := TUniQuery.Create(nil);
  result := -1;
  codTempProyecto := frmmain.lbl_codUnicoTemporal.Text;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select count(*) as counter from TGrid2Items where codTempProyecto=' + QuotedStr(codTempProyecto));
      Prepare;
      ExecSQL;
      result := FieldByName('counter').AsInteger;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de guardaGridTiempoTemporal.</summary>
procedure guardaGridTiempoTemporal();
var
  qry: TUniQuery;
  codTemporalPresupuesto: string;
  codigoUnicoItem: string;
  x: Integer;
  codEDTGrid: string;
  valor: Double;
  tmpstr: string;
begin
  codTemporalPresupuesto := frmmain.lbl_codUnicoTemporal.Text;
  listadoCodigoUnicosEDT := TStringList.Create;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('delete from TGridItems where codTempProyecto=' + QuotedStr(codTemporalPresupuesto));
      Prepare;
      ExecSQL;
    end;
    for x := 1 to frmmain.grid_crono01.RowCount - 1 do
    begin
      if frmmain.grid_crono01.Cells[1, x] <> '' then
      begin
        codEDTGrid := trim(frmmain.grid_crono01.Cells[1, x]);
        tmpstr := frmmain.grid_crono01.Cells[10, x];
        listadoCodigoUnicosEDT.Add(tmpstr);
      end;
      if frmmain.grid_calcTiempos.Cells[9, x] <> '' then
      begin
        codigoUnicoItem := frmmain.grid_calcTiempos.Cells[9, x];
        tmpstr := frmmain.grid_calcTiempos.Cells[4, x];
        tmpstr := quitaSignoMiles(tmpstr);
        valor := StrToFloat(tmpstr);
        with qry do
        begin
          Connection := DModule_1.con2;
          Close;
          sql.Clear;
          sql.Add('insert into tGrid2Items (codTempProyecto, codEDT, codUnicoItem, valor) ');
          sql.Add('VALues (:codTempProyecto, :codEDT, :codUnicoItem, :valor)');
          Prepare;
          ParamByName('codTempProyecto').AsString := codTemporalPresupuesto;
          ParamByName('codEdt').AsString := codEDTGrid;
          ParamByName('codUnicoItem').AsString := codigoUnicoItem;
          ParamByName('valor').AsFloat := valor;
          ExecSQL;
        end;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de borrarAnotacion.</summary>
/// <param name="codItem">TODO.</param>
procedure borrarAnotacion(codItem: string);
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('delete from TAnotaciones where idItem=' + QuotedStr(codItem));
      Prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de OSExecute.</summary>
/// <param name="ACommand">TODO.</param>
procedure OSExecute(const ACommand: string);
begin
  ShellExecute(0, 'OPEN', PChar(ACommand), '', '', SW_SHOWNORMAL);
end;

/// <summary>TODO: Descripción de IsAlphaNumeric.</summary>
/// <param name="C">TODO.</param>
/// <returns>TODO.</returns>
function IsAlphaNumeric(C: Char): Boolean;
begin
  result := CharInSet(C, ['a'..'z', 'A'..'Z', '0'..'9']);
end;

/// <summary>TODO: Descripción de registrarUsuario.</summary>
procedure registrarUsuario();
begin
  cargaPaisesRegistro();
  frmmain.tbc_PreciosUnitarios.ActiveTab := frmmain.tab_registroUsuario;
end;

function CrearUsuarioWordPressSync(const AToken, ANombreCompleto, APassword, AEmail, ARol: string; out AMessage: string): Boolean;
var
  Done: TEvent;
  SuccessLocal: Boolean;
  MsgLocal: string;
begin
  Result := False;
  AMessage := '';
  Done := TEvent.Create(nil, True, False, '');
  try
    CrearUsuarioWordPressAsync(AToken, ANombreCompleto, APassword, AEmail, ARol,
      procedure(const Success: Boolean; const Message: string)
      begin
        SuccessLocal := Success;
        MsgLocal := Message;
        Done.SetEvent;
      end);
    // Espera (ajusta el timeout si quieres). 30000 ms = 30 s
    if Done.WaitFor(30000) = wrSignaled then
    begin
      Result := SuccessLocal;
      AMessage := MsgLocal;
    end
    else
    begin
      Result := False;
      AMessage := 'Timeout al crear usuario en WordPress.';
    end;
  finally
    Done.Free;
  end;
end;

/// <summary>TODO: Descripción de realizarRegistro.</summary>
procedure realizarRegistro();
var
  hayInternet: Boolean;
  email: string;
  nombreRegistro: string;
  apellidosRegistro: string;
  paisRegistro: string;
  ciudadRegistro: string;
  passwordRegistro: string;
  // HTTP check
  J: TJSONObject;
  Existe: Boolean;
  // WP
  WpMsg: string;
  TokenWP: string;
  JTok: TJSONObject;
  OkToken: Boolean;
  // Backend (alta usuario)
  JIns: TJSONObject;
  OkIns: Boolean;
  NuevoID: Integer;
  EmailEco, Msg: string;
  // Control de rollback
  WPCreado: Boolean;
  // Email bienvenida
  cuerpo: TStringList;
begin
  email := frmmain.edt_RegistroEmail.Text.Trim.ToLower;
  nombreRegistro := frmmain.edt_RegistroNombre.Text.Trim;
  apellidosRegistro := frmmain.edt_RegistroApellidos.Text.Trim;
  ciudadRegistro := frmmain.edt_RegistroCiudad.Text.Trim;
  passwordRegistro := frmmain.edt_RegistroPassword.Text;
  paisRegistro := frmmain.cbb_registroPais.Items[frmmain.cbb_registroPais.ItemIndex];

  // Validaciones mínimas
  if (email = '') or (not validar_correo_electronico(email)) or (nombreRegistro = '') or (apellidosRegistro = '') or (paisRegistro = '') or (ciudadRegistro = '') or (passwordRegistro = '') then
  begin
    MuestraMensajeGiproy('Debe rellenar todos los campos con datos válidos. Gracias.');
    Exit;
  end;

  hayInternet := CheckInternet;
  if not hayInternet then
  begin
    MuestraMensajeGiproy('Es necesaria conexión a internet para realizar el registro. Por favor, compruebe la conexión.');
    Exit;
  end;

  // 1) Comprobar existencia en servidor (SIN token)
  J := nil;
  try
    if not CompruebaUsuarioPorEmailExiste(UrlCompruebaUsuarioPorEmail, email, Existe, {AEmailEcho}email, J) then
    begin
      MuestraMensajeGiproy('No se pudo comprobar el email en el servidor. Inténtelo de nuevo.');
      Exit;
    end;
    if Existe then
    begin
      MuestraMensajeGiproy('Usuario ya registrado. Si no recuerda sus datos, solicite un cambio de contraseña. Gracias');
      Exit;
    end;
  finally
    J.Free;
  end;

  // 2) Crear primero en WordPress (sincrónico)
  TokenWP := '';
  JTok := nil;
  WPCreado := False;
  try
    OkToken := ObtenerTokenWP(UrlDaTokenWP, email, passwordRegistro, TokenWP, JTok);
    if (not OkToken) or (TokenWP = '') then
    begin
      WpMsg := 'No se pudo obtener el Token WP';
      if Assigned(JTok) then
        WpMsg := WpMsg + ': ' + JTok.GetValue<string>('error', JTok.GetValue<string>('message', JTok.GetValue<string>('msg', 'Error')));
      MuestraMensajeGiproy(WpMsg);
      Exit;
    end;

    if not CrearUsuarioWordPressSync(TokenWP, nombreRegistro + ' ' + apellidosRegistro, passwordRegistro, email, 'customer', WpMsg) then
    begin
      MuestraMensajeGiproy('No se pudo completar el registro en WordPress: ' + WpMsg);
      Exit; // no seguimos si WP falla
    end;

    WPCreado := True;
  finally
    JTok.Free;
  end;

  // 3) Crear usuario en tu backend (HTTP)
  JIns := nil;
  try
    OkIns := CrearUsuarioNuevoDatos(UrlCreaUsuarioNuevo, nombreRegistro, apellidosRegistro, email, passwordRegistro, '',        // fechaAlta => PHP usa Now
      '',        // estado   => 'activo'
      '',        // tipo     => 'customer'
      ciudadRegistro, paisRegistro, NuevoID, EmailEco, Msg, JIns);

    if (not OkIns) or (NuevoID <= 0) then
    begin
      // === ROLLBACK en WordPress ===
      if WPCreado then
      begin
        if not EliminarUsuarioWordPressSync(TokenWP, email, WpMsg) then
          MuestraMensajeGiproy('Fallo en backend y no fue posible revertir el usuario en WordPress: ' + WpMsg);
      end;

      MuestraMensajeGiproy('No se pudo completar el registro en el servidor: ' + Msg);
      Exit;
    end;
  finally
    JIns.Free;
  end;

  // 4) Enviar email de bienvenida SOLO si todo fue exitoso
  cuerpo := TStringList.Create;
  try
    cuerpo.Add('¡Bienvenido/a a la plataforma!');
    cuerpo.Add('');
    cuerpo.Add('Hola ' + nombreRegistro + ',');
    cuerpo.Add('Tu registro se ha completado correctamente.');
    cuerpo.Add('Podrás acceder con este correo: ' + email);
    cuerpo.Add('');
    cuerpo.Add('Gracias por registrarte.');
    if not envia_email(email, 'Bienvenido/a', cuerpo) then
      MuestraMensajeGiproy('Registro completado, pero no se pudo enviar el email de bienvenida.');
  finally
    cuerpo.Free;
  end;

  // 5) Confirmación final
  MuestraMensajeGiproy('Usuario registrado correctamente. Ya puede usar sus credenciales para acceder.');
  frmmain.tmr_Inicio.Enabled := True;
end;

/// <summary>TODO: Descripción de validar_correo_electronico.</summary>
/// <param name="correo_electronico">TODO.</param>
/// <returns>TODO.</returns>
function validar_correo_electronico(correo_electronico: string): Boolean;
var
  regex: TRegEx;
begin
  regex := TRegEx.Create('^[^\s@]+@[^\s@]+\.[^\s@]+$');
  result := regex.IsMatch(correo_electronico);
end;

/// <summary>TODO: Descripción de creaDataBaseDesdePadre.</summary>
/// <param name="BasePadre">TODO.</param>
/// <returns>TODO.</returns>
function creaDataBaseDesdePadre(BasePadre: string): string;
var
  qry: TUniQuery;
  nPresupuesto: string;
  codBaseTrabajo: string;
  codNuevaBase: string;
  nombreBase: string;
  descripcionBase: string;
begin
  nPresupuesto := frmmain.edt_CodigoPresupuesto1.Text;
  codNuevaBase := 'DB' + generaCodigoUnicoShort;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from bases where codbase=' + QuotedStr(BasePadre));
      Prepare;
      ExecSQL;
      descripcionBase := frmmain.edt_descripcionPresupuesto.Text;
      nombreBase := FieldByName('nombre').AsString;
      nombreBase := nombreBase + ' P:' + frmmain.edt_CodigoPresupuesto1.Text;
      Close;
      sql.Clear;
      sql.Add('select * from bases where presupuestoAsignado=' + QuotedStr(nPresupuesto));
      Prepare;
      ExecSQL;
      codBaseTrabajo := FieldByName('codBase').AsString;
      if codBaseTrabajo <> '' then
      begin
        // Borrado de anteriores DB
        { Base General }
        Close;
        sql.Clear;
        sql.Add('delete from bases where codBase=' + QuotedStr(codBaseTrabajo));
        Prepare;
        ExecSQL;
        { Categoria APUS }
        Close;
        sql.Clear;
        sql.Add('delete from categoriaapus where codBase=' + QuotedStr(codBaseTrabajo));
        Prepare;
        ExecSQL;
        { APUS }
        Close;
        sql.Clear;
        sql.Add('delete from APUS where codBase=' + QuotedStr(codBaseTrabajo));
        Prepare;
        ExecSQL;
        { APUS Items }
        Close;
        sql.Clear;
        sql.Add('delete from APUS_Items where codBase=' + QuotedStr(codBaseTrabajo));
        Prepare;
        ExecSQL;
      end;
      // Creacion de Base de Presupuesto
      { Base General }
      Close;
      sql.Clear;
      sql.Add('insert into bases (codBase, nombre, descripcion, indirectos, TRendimiento, UTiempo, SeguridadIndustrial, Observaciones,');
      sql.Add(' FechaHoraCreacion, FechaHoraModificacion, pais, cambioAplicado, sincronizada, moneda, basesPadres, presupuestoAsignado) ');
      sql.Add('select ' + QuotedStr(codNuevaBase) + ', ' + QuotedStr(nombreBase) + ', ' + QuotedStr(descripcionBase) + ', indirectos, TRendimiento, UTiempo, SeguridadIndustrial, Observaciones,');
      sql.Add(' FechaHoraCreacion, :FechaHoraModificacion , pais, cambioAplicado, sincronizada, moneda, ' + QuotedStr(BasePadre) + ', ' + QuotedStr(nPresupuesto) + ' from bases where codBase=' + QuotedStr(BasePadre));
      ParamByName('FechaHoraModificacion').AsDateTime := now;
      Prepare;
      ExecSQL;
      { Categoria APUS }
      Close;
      sql.Clear;
      sql.Add('insert into categoriaapus (Categoria_base, Ciu, codBase, NombreBase, Descripcion, codExterno, comentarios, Usado, sincronizada, origen, fechaCreacion) ');
      sql.Add('select Categoria_base, Ciu, ' + QuotedStr(codNuevaBase) + ', ' + QuotedStr(nombreBase) + ', Descripcion, codExterno, comentarios, Usado, sincronizada, origen, fechaCreacion from categoriaapus where codBase=' + QuotedStr(BasePadre));
      Prepare;
      ExecSQL;
      { APUS }
      Close;
      sql.Clear;
      sql.Add('insert into APUS (codBase, codCategoriaAPU, codRecursoAPU, CategoriaAPU, codAPU, Descripcion, Unidad, Rendimiento, RendimientoTodoAnalisis,');
      sql.Add(' RendimientoTodoEscenario, FechaHoraCreacion, CostoDirectoTotal, CostoIndirectoTotal, PorcentajeCostoIndirecto, PrecioUnitarioTotal, moneda,');
      sql.Add(' codCPC, ultimaModificacion, pendienteRevision, rendimientoHUnidad, nhCuadrillas, anidado) ');
      sql.Add('select ' + QuotedStr(codNuevaBase) + ', codCategoriaAPU, codRecursoAPU, CategoriaAPU, codAPU, Descripcion, Unidad, Rendimiento, RendimientoTodoAnalisis,');
      sql.Add(' RendimientoTodoEscenario, FechaHoraCreacion, CostoDirectoTotal, CostoIndirectoTotal, PorcentajeCostoIndirecto, PrecioUnitarioTotal, moneda,');
      sql.Add(' codCPC, :ultimaModificacion , pendienteRevision, rendimientoHUnidad, nhCuadrillas, anidado from APUS where codBase=' + QuotedStr(BasePadre));
      ParamByName('ultimaModificacion').AsDateTime := now;
      Prepare;
      ExecSQL;
      { APUS Items }
      Close;
      sql.Clear;
      sql.Add('insert into APUS_Items (codBase, codAPU, codCategoria, codSubCategoria, idUnicoRecurso, codRecurso, codRecursoCompleto, Descripcion, Unidad, Precio, moneda, CantidadUnidad, Rendimiento, Total, porcentaje, codCPC, tipoCPC, porcentajeCPC) ');
      sql.Add('select ' + QuotedStr(codNuevaBase) + ', codAPU, codCategoria, codSubCategoria, idUnicoRecurso, codRecurso, codRecursoCompleto, Descripcion, Unidad, Precio, moneda, CantidadUnidad, Rendimiento, Total, porcentaje, codCPC, tipoCPC, porcentajeCPC from APUS_Items where codBase=' + QuotedStr(BasePadre));
      Prepare;
      ExecSQL;
      { Recursos }
      close;
      SQL.Clear;
      SQL.Add('insert into Recursos (idUnico, codBase, codRecurso, codRecursoCompleto, codCategoriaBase, codSubCategoria, Descripcion, unidad, precio, preciolocal, precioBase, moneda, termino,' + ' codAlternativo, codCPC, tipoCPC, porcentajeCPC, Especificaciones, Especificaciones2, fechaHoraCreacion, ultimaModificacion, codDistribuidor, distribuidor) ');
      sql.add('select idUnico, ' + QuotedStr(codNuevaBase) + ', codRecurso, codRecursoCompleto, codCategoriaBase, codSubCategoria, Descripcion, unidad, precio, preciolocal, precioBase, moneda, termino, codAlternativo, codCPC, tipoCPC, porcentajeCPC, Especificaciones, Especificaciones2, ' + 'fechaHoraCreacion, :ultimaModificacion, codDistribuidor, distribuidor from Recursos where codBase=' + QuotedStr(BasePadre));
      ParamByName('ultimaModificacion').AsDateTime := now;
      Prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
    result := codNuevaBase;
  end;
end;

procedure addheadercrono01;
begin
  frmmain.grid_calcTiemposheader.Cells[0, 0] := 'Trabajo ' + #13 + 'Total';
  frmmain.grid_calcTiemposheader.Cells[1, 0] := 'Unidades' + #13 + 'Asignación';
  frmmain.grid_calcTiemposheader.Cells[2, 0] := 'Duración' + #13 + '(Horas)';
  frmmain.grid_calcTiemposheader.Cells[3, 0] := 'Nº Hombres' + #13 + 'Cuadrilla';
  frmmain.grid_calcTiemposheader.Cells[4, 0] := 'Días' + #13 + 'Utiles';
  frmmain.grid_calcTiemposheader.Cells[5, 0] := 'Factor' + #13 + 'Conversión';
  frmmain.grid_calcTiemposheader.Cells[6, 0] := 'Días' + #13 + 'Calendario';
end;

/// <summary>TODO: Descripción de calculaTiempoAPUS.</summary>
procedure calculaTiempoAPUS();
var
  RendimientoUnitatioTotalEquipo: Double;
  TrabajoEquipo: Double;
  RendimientoUnitarioTotalManoObra: Double;
  TrabajoManoObra: Double;
  TrabajoTotal: Double;
  UnidadesRecurso: Double;
  DiasUtiles: Double;
  DiasCalendarios: Double;
  duracionActividad: Double;
  tmpstr: string;
  qry: TUniQuery;
  x, y, z: Integer;
  codApu: string;
  cantidadPresupuesto: Double;
  duracionHoras: Double;
  hombresCuadrilla: Double;
  horasLaborales: Double;
  costoDirecto: Double;
  unidades: Double;
  PrecioTotal: Double;
  valorIndirecto: Double;
  anidado: Boolean;
  tmptime: TTime;
  SQLText: string;
begin
  frmmain.grid_calcTiempos.RowCount := frmmain.grid_crono01.RowCount - 1;
  qry := TUniQuery.Create(nil);
  qry.Connection := DModule_1.con2;
  try
    setlength(listadoRecursosAsumidos, 0);
    for x := 1 to frmmain.grid_crono01.RowCount - 1 do
    begin
      codApu := frmmain.grid_crono01.Cells[14, x];
      if codApu <> '' then
      begin
        anidado := False;
        RendimientoUnitatioTotalEquipo := daRendimiento(codApu, '1');
        tmpstr := frmmain.grid_crono01.Cells[5, x];
        tmpstr := AnsiReplaceStr(tmpstr, base_activa.simboloMoneda, '');
        tmpstr := quitaSignoMiles(tmpstr).Trim;
        tmpstr := decimal_correcto(tmpstr);
        cantidadPresupuesto := StrToFloat(tmpstr);
        TrabajoEquipo := daTrabajo(codApu, '1');
        TrabajoEquipo := TrabajoEquipo * cantidadPresupuesto;
        RendimientoUnitarioTotalManoObra := daRendimiento(codApu, '4');
        TrabajoManoObra := daTrabajo(codApu, '4');
        TrabajoManoObra := TrabajoManoObra * cantidadPresupuesto;
        TrabajoTotal := TrabajoEquipo + TrabajoManoObra;
        if RendimientoUnitatioTotalEquipo > RendimientoUnitarioTotalManoObra then
        begin
          duracionActividad := RendimientoUnitatioTotalEquipo;
        end
        else
        begin
          duracionActividad := RendimientoUnitarioTotalManoObra;
        end;
        UnidadesRecurso := daPorcentajeTiempo(codApu, duracionActividad);
        duracionHoras := TrabajoTotal / UnidadesRecurso;
        hombresCuadrilla := daNHcuardillas(codApu);
        tmpstr := frmmain.edt_HorasJornada.Text;
        horasLaborales := StrToFloatDef(tmpstr, 8);
        DiasUtiles := duracionHoras / horasLaborales;

        DiasCalendarios := DiasUtiles * factorConversionDias;

        frmmain.grid_calcTiempos.Cells[0, x - 1] := FloatToStr(TrabajoTotal);
        frmmain.grid_calcTiempos.Cells[1, x - 1] := FloatToStr(UnidadesRecurso);
        frmmain.grid_calcTiempos.Cells[2, x - 1] := FloatToStr(duracionHoras);
        frmmain.grid_calcTiempos.Cells[3, x - 1] := FloatToStr(hombresCuadrilla);
        frmmain.grid_calcTiempos.Cells[4, x - 1] := FloatToStr(DiasUtiles);
        frmmain.grid_calcTiempos.Cells[5, x - 1] := FloatToStr(factorConversionDias);
        frmmain.grid_calcTiempos.Cells[6, x - 1] := FloatToStr(DiasCalendarios);
        frmmain.grid_calcTiempos.Cells[9, x - 1] := frmmain.grid_crono01.Cells[10, x];
        with qry do
        begin
          Close;
          sql.Clear;
          {(*}
          SQLText :=  'SELECT ' +
                      'items.anidado, ' +
                      'IF(tanteo.CostoDirectoTotal IS NULL, items.CostoDirectoTotal, tanteo.CostoDirectoTotal) AS CostoDirectoTotal ' +
                      'FROM ' +
                      'apus items ' +
                      'LEFT JOIN presupuestos_tanteo_apus tanteo ON ( ' +
                      'tanteo.codBase = items.codBase ' +
                      'AND tanteo.CodAPU = items.CodAPU ' +
                      'AND tanteo.codPresupuesto = :codPresupuesto ' +
                      'AND tanteo.revision = :revision ' +
                      ') ' +
                      'WHERE ' +
                      'items.codBase = :codBase ' +
                      'AND items.codAPU = :codAPU';
            {*)}
          sql.Add(SQLText);
          ParamByName('codBase').AsString := base_activa.codBase;
          ParamByName('codApu').AsString := codApu;
          ParamByName('codPresupuesto').AsString := codProyecto;
          ParamByName('revision').AsString := revision;
          Prepare;
          ExecSQL;
          anidado := FieldByName('anidado').AsBoolean;
          tmpstr := FieldByName('CostoDirectoTotal').AsString;
          tmpstr := decimal_correcto(tmpstr);
          costoDirecto := strtofloatdef(tmpstr, 0);
          tmpstr := frmmain.grid_crono01.Cells[5, x];
          tmpstr := ansireplacestr(tmpstr, base_activa.simboloMoneda, '');
          tmpstr := quitaSignoMiles(tmpstr).Trim;
          tmpstr := decimal_correcto(tmpstr);
          unidades := strtofloatdef(tmpstr, 0);
          costoDirecto := costoDirecto * unidades;
          tmpstr := FloatToStr(costoDirecto);
          frmmain.grid_calcTiempos.Cells[7, x - 1] := tmpstr;
          // Costo Directo Completo
          costoDirecto := StrToFloat(tmpstr);
          tmpstr := frmmain.grid_crono01.Cells[7, x];
          tmpstr := ansireplaceStr(tmpstr, base_activa.simboloMoneda, '');
          tmpstr := quitaSignoMiles(tmpstr).Trim;
          tmpstr := decimal_correcto(tmpstr);
          PrecioTotal := StrToFloat(tmpstr);
          valorIndirecto := PrecioTotal - costoDirecto;
          tmpstr := FloatToStr(valorIndirecto);
          frmmain.grid_calcTiempos.Cells[8, x - 1] := tmpstr;
          // costo Indirecto Completo
          frmmain.grid_calcTiempos.Columns[7].Width := 0;
          frmmain.grid_calcTiempos.Columns[8].Width := 0;
          frmmain.grid_calcTiempos.Columns[9].Width := 0;
        end;
        if anidado then
        begin
          actualizaaRecursoAnidado(x, codApu);
        end;
      end
      else
      begin
        for z := 0 to frmmain.grid_calcTiempos.Columns.Count do
          frmmain.grid_calcTiempos.Colors[z, x - 1] := $FFE0E0E0;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure actualizaaRecursoAnidado(posgrid: Integer; codApu: string);
var
  qry: TUniQuery;
  tmpstr: string;
  listadoRecursosPrincipal: arrayRecursos;
  listaRecursosAnidados: arrayRecursos;
  listaRecursosInternaAnidados: arrayRecursos;
  x, y, z: Integer;
  cantidadPrincipal: Double;
  rendimientoRecursoAnidadoRecalculado: Double;
  idRecursoAnidado: string;
  precioRecurso: Double;
  cantidadRecurso: Double;
  nuevoTotalRecurso: Double;
  nuevoRendimiento: Double;
  nuevaCantidad: Double;
  nuevoTotal: Double;
  PrecioBase: Double;
  duracionActividad: Double;
  SQLText: string;
begin
  // Realizar con Matrices
  qry := TUniQuery.Create(nil);
  setlength(listadoRecursosPrincipal, 0);
  setlength(listaRecursosInternaAnidados, 0);
  with qry do
  begin
    Connection := DModule_1.con2;
    Close;
    sql.Clear;
    {(*}
    SQLText :=  'SELECT ' +
                'items.idUnicoRecurso, ' +
                'items.Descripcion, ' +
                'IF(tanteo.Total IS NULL, items.Total, tanteo.Total) AS Total, ' +
                'items.precio, ' +
                'IF(tanteo.Rendimiento IS NULL, items.Rendimiento, tanteo.Rendimiento) AS Rendimiento, ' +
                'items.CodCategoria, ' +
                'items.CantidadUnidad ' +
                'FROM ' +
                'apus_items items ' +
                'LEFT JOIN presupuestos_tanteo_recursos tanteo ON tanteo.codBase = items.codBase ' +
                'AND tanteo.CodAPU = items.CodAPU ' +
                'AND tanteo.codPresupuesto = :codPresupuesto ' +
                'AND tanteo.revision = :revision ' +
                'AND tanteo.idUnicoRecurso = items.idUnicoRecurso ' +
                'WHERE ' +
                'items.codBase = :codBase ' +
                'AND items.codAPU = :codAPU ' +
                'AND items.CodCategoria IN (1, 4)';
      {*)}
    sql.Add(SQLText);
    ParamByName('codBase').AsString := base_activa.codBase;
    ParamByName('codApu').AsString := codApu;
    ParamByName('codPresupuesto').AsString := codProyecto;
    ParamByName('revision').AsString := revision;
    Prepare;
    ExecSQL;
    x := 0;
    while not Eof do
    begin
      setlength(listadoRecursosPrincipal, x + 1);
      tmpstr := FieldByName('idUnicoRecurso').AsString;
      listadoRecursosPrincipal[x].codUnicoRecurso := tmpstr;
      listadoRecursosPrincipal[x].descripcion := FieldByName('descripcion').AsString;
      tmpstr := FieldByName('total').AsString;
      tmpstr := decimal_correcto(tmpstr);
      listadoRecursosPrincipal[x].PrecioTotal := tmpstr;
      tmpstr := FieldByName('precio').AsString;
      tmpstr := decimal_correcto(tmpstr);
      listadoRecursosPrincipal[x].PrecioCosto := tmpstr;
      tmpstr := FieldByName('rendimiento').AsString;
      tmpstr := decimal_correcto(tmpstr);
      listadoRecursosPrincipal[x].Rendimiento := tmpstr;
      listadoRecursosPrincipal[x].tipoRecurso := FieldByName('codCategoria').AsString;
      tmpstr := FieldByName('cantidadUnidad').AsString;
      tmpstr := decimal_correcto(tmpstr);
      listadoRecursosPrincipal[x].cantidad := tmpstr;
      listadoRecursosPrincipal[x].tipoRecurso := FieldByName('codCategoria').AsString;
      Inc(x);
      Next;
    end;
    Close;
    sql.Clear;
    sql.Add('select * from apus_items where (codAPU=' + QuotedStr(codApu) + ' and codBase=' + QuotedStr(base_activa.codBase) + ' and codCategoria=6)');
    Prepare;
    ExecSQL;
    x := 0;
    while not Eof do
    begin
      tmpstr := FieldByName('idUnicoRecurso').AsString;
      tmpstr := ReplaceStr(tmpstr, 'APU: ', '');
      setlength(listaRecursosAnidados, x + 1);
      listaRecursosAnidados[x].codApu := tmpstr;
      tmpstr := FieldByName('cantidadUnidad').AsString;
      tmpstr := decimal_correcto(tmpstr);
      listaRecursosAnidados[x].cantidad := tmpstr;
      listaRecursosAnidados[x].descripcion := FieldByName('descripcion').AsString;
      Inc(x);
      Next;
    end;
    y := 0;
    for x := 0 to length(listaRecursosAnidados) - 1 do
    begin
      Close;
      sql.Clear;
      {(*}
      SQLText :=  'SELECT ' +
                  'items.idUnicoRecurso, ' +
                  'items.precio, ' +
                  'IF(tanteo.Rendimiento IS NULL, items.Rendimiento, tanteo.Rendimiento) AS Rendimiento, ' +
                  'items.CantidadUnidad ' +
                  'FROM ' +
                  'apus_items items ' +
                  'LEFT JOIN presupuestos_tanteo_recursos tanteo ON tanteo.codBase = items.codBase ' +
                  'AND tanteo.CodAPU = items.CodAPU ' +
                  'AND tanteo.codPresupuesto = codPresupuesto ' +
                  'AND tanteo.revision = :revision ' +
                  'AND tanteo.idUnicoRecurso = items.idUnicoRecurso ' +
                  'WHERE ' +
                  'items.codBase = :codBase ' +
                  'AND items.codAPU = :codAPU ' +
                  'AND items.CodCategoria IN (1, 4)';
        {*)}
      sql.Add(SQLText);
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codApu').AsString := codApu;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      cantidadPrincipal := StrToFloat(listaRecursosAnidados[x].cantidad);
      while not Eof do
      begin
        setlength(listaRecursosInternaAnidados, y + 1);
        listaRecursosInternaAnidados[y].codUnicoRecurso := FieldByName('idUnicoRecurso').AsString;
        tmpstr := FieldByName('rendimiento').AsString;
        tmpstr := decimal_correcto(tmpstr);
        rendimientoRecursoAnidadoRecalculado := StrToFloat(tmpstr) * cantidadPrincipal;
        rendimientoRecursoAnidadoRecalculado := RoundTo(rendimientoRecursoAnidadoRecalculado, -4);
        listaRecursosInternaAnidados[y].Rendimiento := FloatToStr(rendimientoRecursoAnidadoRecalculado);
        tmpstr := FieldByName('precio').AsString;
        tmpstr := decimal_correcto(tmpstr);
        precioRecurso := StrToFloat(tmpstr);
        tmpstr := FieldByName('cantidadUnidad').AsString;
        tmpstr := decimal_correcto(tmpstr);
        listaRecursosInternaAnidados[y].cantidad := tmpstr;
        cantidadRecurso := StrToFloat(tmpstr);
        nuevoTotalRecurso := rendimientoRecursoAnidadoRecalculado * precioRecurso * cantidadRecurso;
        nuevoTotalRecurso := RoundTo(nuevoTotalRecurso, -2);
        listaRecursosInternaAnidados[y].PrecioTotal := FloatToStr(nuevoTotalRecurso);

        Inc(y);
        Next;
      end;
    end;
  end;
  for x := 0 to length(listadoRecursosPrincipal) - 1 do
  begin
    tmpstr := listadoRecursosPrincipal[x].PrecioCosto;
    tmpstr := decimal_correcto(tmpstr);
    PrecioBase := StrToFloat(tmpstr);
    tmpstr := dasumaCantidadItemAnidados(listaRecursosInternaAnidados, listadoRecursosPrincipal[x].codUnicoRecurso, listadoRecursosPrincipal[x].cantidad);
    listadoRecursosPrincipal[x].cantidad := tmpstr;
    nuevaCantidad := StrToFloat(tmpstr);
    tmpstr := dasumaTotalesItemAnidados(listaRecursosInternaAnidados, listadoRecursosPrincipal[x].codUnicoRecurso, listadoRecursosPrincipal[x].PrecioTotal);
    listadoRecursosPrincipal[x].PrecioTotal := tmpstr;
    nuevoTotal := StrToFloat(tmpstr);
    nuevoRendimiento := nuevoTotal / nuevaCantidad;
    nuevoRendimiento := nuevoRendimiento / PrecioBase;
    nuevoRendimiento := RoundTo(nuevoRendimiento, -4);
    listadoRecursosPrincipal[x].Rendimiento := FloatToStr(nuevoRendimiento);
  end;
  duracionActividad := daDuracionActividadAnidados(listadoRecursosPrincipal);
  recalculaTiemposAnidados(listadoRecursosPrincipal, duracionActividad, posgrid);
end;

function daRendimiento(codApu: string; codCategoria: string): Double;
var
  qry: TUniQuery;
  tmpstr: string;
  SQLText: string;
begin
  result := 0;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      {(*}
      SQLText :=  'SELECT ' +
                  'SUM(IF(tanteo.Rendimiento IS NULL, items.Rendimiento, tanteo.Rendimiento)) AS Srendimiento ' +
                  'FROM ' +
                  'apus_items items ' +
                  'LEFT JOIN presupuestos_tanteo_recursos tanteo ON ( ' +
                  'tanteo.codBase = items.codBase ' +
                  'AND tanteo.CodAPU = items.CodAPU ' +
                  'AND tanteo.codPresupuesto = :codPresupuesto ' +
                  'AND tanteo.revision = :revision ' +
                  'AND tanteo.idUnicoRecurso = items.idUnicoRecurso ' +
                  ') ' +
                  'WHERE ' +
                  'items.codBase = :codBase ' +
                  'AND items.CodAPU = :codAPU ' +
                  'AND items.CodCategoria = :codCategoria';
        {*)}
      SQl.Add(SQLText);
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codAPU').AsString := codApu;
      ParamByName('codpresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codCategoria').AsString := codCategoria;
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('SRendimiento').AsString;
      if tmpstr = '' then
        tmpstr := '0';
      tmpstr := decimal_correcto(tmpstr);
      result := StrToFloat(tmpstr);
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de daTrabajo.</summary>
/// <param name="codApu">TODO.</param>
/// <param name="codCategoria">TODO.</param>
/// <returns>TODO.</returns>
function daTrabajo(codApu, codCategoria: string): Double;
var
  qry: TUniQuery;
  tmpstr: string;
  SQLText: string;
begin
  result := 0;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      {(*}
      SQLText :=  'SELECT ' +
                  'sum(IF(tanteo.Rendimiento IS NULL, items.Rendimiento * items.CantidadUnidad, tanteo.CantidadUnidad * tanteo.Rendimiento)) AS Suma ' +
                  'FROM ' +
                  'apus_items items ' +
                  'LEFT JOIN presupuestos_tanteo_recursos tanteo ON ( ' +
                  'tanteo.codBase = items.codBase ' +
                  'AND tanteo.CodAPU = items.CodAPU ' +
                  'AND tanteo.codPresupuesto = :codPresupuesto ' +
                  'AND tanteo.revision = :revision ' +
                  'AND tanteo.idUnicoRecurso = items.idUnicoRecurso ' +
                  ') ' +
                  'WHERE ' +
                  'items.codBase = :codBase ' +
                  'AND items.codAPU = :codAPU ' +
                  'AND items.codCategoria = :codCategoria';
        {*)}
      sql.Add(SQLText);
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codAPU').AsString := codApu;
      ParamByName('codpresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codCategoria').AsString := codCategoria;
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('Suma').AsString;
      if tmpstr = '' then
        tmpstr := '0';
      tmpstr := decimal_correcto(tmpstr);
      result := StrToFloat(tmpstr);
    end;
  finally
    qry.Free;
  end;
end;

function daPorcentajeTiempo(codApu: string; duracionActividad: Double): Double;
var
  qry: TUniQuery;
  tmpstr: string;
  x: Integer;
  porcentajeTiempo: Double;
  cantidadRecurso: Double;
  UnidadesRecurso: Double;
  sumatoriaAsumidos: Double;
  SQLText: string;
begin
  x := length(listadoRecursosAsumidos);
  sumatoriaAsumidos := 0;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      {(*}
      SQLText :=  'SELECT ' +
                  'items.idUnicoRecurso, ' +
                  'IF(tanteo.Rendimiento IS NULL, items.Rendimiento, tanteo.Rendimiento) AS Rendimiento, ' +
                  'IF(tanteo.CantidadUnidad IS NULL, items.CantidadUnidad, tanteo.CantidadUnidad) AS CantidadUnidad, ' +
                  'items.Descripcion ' +
                  'FROM ' +
                  'apus_items items ' +
                  'LEFT JOIN presupuestos_tanteo_recursos tanteo ON ( ' +
                  'tanteo.codBase = items.codBase ' +
                  'AND tanteo.CodAPU = items.CodAPU ' +
                  'AND tanteo.codPresupuesto = :codPresupuesto ' +
                  'AND tanteo.revision = :revision ' +
                  'AND tanteo.idUnicoRecurso = items.idUnicoRecurso ' +
                  ') ' +
                  'WHERE ' +
                  'items.codBase = :codBase ' +
                  'AND items.CodAPU = :codApu ' +
                  'AND items.codCategoria IN (1, 4)';
        {*)}
      sql.Add(SQLText);
      ParamByName('codbase').AsString := base_activa.codBase;
      ParamByName('codAPU').AsString := codApu;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        setlength(listadoRecursosAsumidos, x + 1);
        listadoRecursosAsumidos[x].codApu := codApu;
        listadoRecursosAsumidos[x].idUnicoRecurso := FieldByName('idUnicoRecurso').AsString;
        tmpstr := FieldByName('Rendimiento').AsString;
        if tmpstr = '' then
          tmpstr := '0';
        tmpstr := decimal_correcto(tmpstr);
        porcentajeTiempo := StrToFloat(tmpstr);
        porcentajeTiempo := porcentajeTiempo / duracionActividad;
        tmpstr := FieldByName('cantidadUnidad').AsString;
        if tmpstr = '' then
          tmpstr := '0';
        tmpstr := decimal_correcto(tmpstr);
        cantidadRecurso := StrToFloat(tmpstr);
        UnidadesRecurso := cantidadRecurso * porcentajeTiempo;
        listadoRecursosAsumidos[x].unidadesRecursos := UnidadesRecurso;
        sumatoriaAsumidos := sumatoriaAsumidos + UnidadesRecurso;
        Next;
        Inc(x);
      end;
    end;
  finally
    qry.Free;
  end;
  result := sumatoriaAsumidos;
end;

/// <summary>TODO: Descripción de limpiagridCrono.</summary>
/// <param name="Grid">TODO.</param>
procedure limpiagridCrono(Grid: TTMSFNCGrid);
var
  x: Integer;
begin
  Grid.ClearNormalCells;
  Grid.Options.ColumnSize.StretchAll := True;
end;

procedure showHeader(Grid: TTMSFNCGrid; nPeriodo: Integer);
var
  x: Integer;
begin
  for x := 0 to Grid.ColumnCount - 2 do
  begin
    Grid.Cells[x, 0] := 'P ' + inttostr(x + 1);
  end;
  Grid.Cells[Grid.ColumnCount - 1, 0] := 'Total';
end;

/// <summary>TODO: Descripción de diasLaborables.</summary>
/// <param name="diaInicio">TODO.</param>
/// <param name="diaFin">TODO.</param>
/// <returns>TODO.</returns>
function diasLaborables(diaInicio, diaFin: TDateTime): Integer;
var
  diastotales: Integer;
  finSemana: Integer;
begin
  diastotales := DaysBetween(diaInicio, diaFin);
  finSemana := WeeksBetween(diaInicio, diaFin);
  finSemana := finSemana * 2;
  result := diastotales - finSemana;
end;

/// <summary>TODO: Descripción de SeleccionaTabCrono.</summary>
/// <param name="tabsel">TODO.</param>
procedure SeleccionaTabCrono(tabsel: Integer);
begin
  frmmain.rect_tab1.Fill.Color := $FF606060;
  frmmain.rect_tab2.Fill.Color := $FF606060;
  frmmain.rect_tab3.Fill.Color := $FF606060;
  frmmain.rect_tab4.Fill.Color := $FF606060;
  frmmain.rect_tab5.Fill.Color := $FF606060;
  case tabsel of
    1:
      begin
        frmmain.rect_tab1.Fill.Color := $FFF39200;
      end;
    2:
      begin
        frmmain.rect_tab2.Fill.Color := $FFF39200;
      end;
    3:
      begin
        frmmain.rect_tab3.Fill.Color := $FFF39200;
      end;
    4:
      begin
        frmmain.rect_tab4.Fill.Color := $FFF39200;
      end;
    5:
      begin
        frmmain.rect_tab5.Fill.Color := $FFF39200;
      end;
  end;
end;

/// <summary>TODO: Descripción de SendText.</summary>
/// <param name="Value">TODO.</param>
procedure SendText(const Value: WideString);
var
  I: Integer;
  S: WideString;
  TI: TInput;
  KI: TKeybdInput;
const
  KEYEVENTF_UNICODE = $0004;
begin
  S := WideUpperCase(Value);
  TI.Itype := INPUT_KEYBOARD;
  for I := 1 to length(S) do
  begin
    KI.wVk := 0;
    KI.dwFlags := KEYEVENTF_UNICODE;
    KI.wScan := Ord(S[I]);
    TI.KI := KI;
    SendInput(1, TI, SizeOf(TI));
  end;
end;

/// <summary>TODO: Descripción de da20ParetoTiempo.</summary>
/// <param name="codCapitulo">TODO.</param>
/// <returns>TODO.</returns>
function da20ParetoTiempo(codCapitulo: string): Integer;
var
  qry: TUniQuery;
  codTempProyecto: string;
  itemsSubCapitulos: Integer;
  valor: Double;
begin
  qry := TUniQuery.Create(nil);
  result := -1;
  codCapitulo := trim(codCapitulo);
  codTempProyecto := frmmain.lbl_codUnicoTemporal.Text;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select count(*) as counter from TGrid2Items where codTempProyecto=' + QuotedStr(codTempProyecto) + ' and codEDT like ' + QuotedStr(codCapitulo + '%'));
      Prepare;
      ExecSQL;
      itemsSubCapitulos := FieldByName('counter').AsInteger;
    end;
  finally
    qry.Free;
  end;
  valor := (itemsSubCapitulos * 20) / 100;
  result := trunc(valor);
  valor := frac(valor);
  if valor > 0 then
    Inc(result);
end;

/// <summary>TODO: Descripción de generalistadoEDTCapitulos.</summary>
/// <returns>TODO.</returns>
function generalistadoEDTCapitulos(): TStringList;
var
  nodo: TTMSFNCTreeViewNode;
  tmpstr: string;
  listadoEdtCapitulos: TStringList;
begin
  nodo := frmmain.Trvw_EDT.Nodes[0];
  nodo := nodo.GetFirstChild;
  listadoEdtCapitulos := TStringList.Create;
  if Assigned(nodo) then
  begin
    while nodo <> nil do
    begin
      tmpstr := nodo.Text[0];
      if tmpstr <> '' then
      begin
        listadoEdtCapitulos.Add(tmpstr);
      end;
      nodo := nodo.GetNextSibling;
    end;
  end;
  result := listadoEdtCapitulos;
end;

/// <summary>TODO: Descripción de cuentaItemsRealesGrid.</summary>
/// <returns>TODO.</returns>
function cuentaItemsRealesGrid(): Integer;
var
  qry: TUniQuery;
  codTempProyecto: string;
begin
  qry := TUniQuery.Create(nil);
  result := -1;
  codTempProyecto := frmmain.lbl_codUnicoTemporal.Text;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select count(*) as counter from TGridItems where codTempProyecto=' + QuotedStr(codTempProyecto));
      Prepare;
      ExecSQL;
      result := FieldByName('counter').AsInteger;
    end;
  finally
    qry.Free;
  end;
end;

function encuentraItemenCuenta(Grid: TTMSFNCGrid; filaRef: Integer; columna: Integer; textoBuscar: string; CaseSensitive: Boolean): Integer;
var
  x: Integer;
  filaInicio, filaFin: Integer;
  tmpstr: string;
  salir: Boolean;
  textoComparar: string;
begin
  result := -1;
  // encontrar FilaInicio
  x := filaRef;
  salir := False;
  while (not salir) and (x > 0) do
  begin
    if Grid.Cells[1, x] <> '' then
    begin
      filaInicio := x;
      salir := True;
    end;
    x := x - 1;
  end;
  // enctronrar FilaFin
  x := filaInicio + 1;
  salir := False;
  filaFin := Grid.RowCount;
  while (not salir) and (x < Grid.RowCount) do
  begin
    if Grid.Cells[1, x] <> '' then
    begin
      filaFin := x;
      salir := True;
    end;
    x := x + 1;
  end;

  x := filaInicio;
  salir := False;
  while (x <= filaFin) and (not salir) do
  begin
    textoComparar := Grid.Cells[columna, x];
    if not CaseSensitive then
    begin
      textoComparar := LowerCase(textoComparar);
      textoBuscar := LowerCase(textoBuscar);
    end;
    if textoComparar = textoBuscar then
    begin
      result := x;
      salir := True;
    end;
    Inc(x);
  end;
end;

function encuentraItemGrid(Grid: TTMSFNCGrid; columna: Integer; textoBuscar: string; CaseSensitive: Boolean): Integer;
var
  x: Integer;
  salir: Boolean;
  textoComparar: string;
begin
  result := -1;
  x := 0;
  salir := False;
  while (x < Grid.RowCount) and (not salir) do
  begin
    textoComparar := Grid.Cells[columna, x];
    if not CaseSensitive then
    begin
      textoComparar := LowerCase(textoComparar);
      textoBuscar := LowerCase(textoBuscar);
    end;
    if textoComparar = textoBuscar then
    begin
      result := x;
      salir := True;
    end;
    Inc(x);
  end;
end;

procedure colorRow(Grid: TTMSFNCGrid; row: Integer; background: TAlphaColor; FontColor: TAlphaColor);
var
  x: Integer;
begin
  for x := 0 to Grid.Columns.Count - 1 do
  begin
    Grid.Colors[x, row] := background;
    Grid.FontColors[x, row] := FontColor;
  end;
end;

function searchGrid(Grid: TTMSFNCGrid; columna: Integer; datosBusqueda: string): Integer;
var
  x: Integer;
  salir: Boolean;
begin
  result := -1;
  x := 0;
  salir := False;
  while (x < Grid.RowCount) and (not salir) do
  begin
    if trim(Grid.Cells[columna, x]) = trim(datosBusqueda) then
    begin
      salir := True;
      result := x;
    end;
    Inc(x);
  end;
end;

/// <summary>TODO: Descripción de generaTablaEDTValores.</summary>
procedure generaTablaEDTValores();
var
  nodo: TTMSFNCTreeViewNode;
  edt, Descripcion, valor: string;
  qry: TUniQuery;
  codBase: string;
begin
  codBase := base_activa.codBase;
  qry := TUniQuery.Create(nil);
  nodo := frmVisorEDT.Trvw_VisorEDT.Nodes[0];
  qry.Connection := DModule_1.con2;
  with qry do
  begin
    Close;
    sql.Clear;
    {(*}
    sql.Add(  'DELETE ' +
              'FROM ' +
              'TvaloresEDT ' +
              'WHERE ' +
              'codBase = :codBase ' +
              'AND codPresupuesto = :codPresupuesto ' +
              'AND revision = :revision');
      {*)}
    ParamByName('codbase').AsString := codBase;
    ParamByName('codPresupuesto').AsString := codProyecto;
    ParamByName('revision').AsString := revision;
    Prepare;
    ExecSQL;
  end;
  try
    if Assigned(nodo) then
    begin
      while nodo <> nil do
      begin
        edt := nodo.Text[0];
        Descripcion := nodo.Text[1];
        valor := quitaSignoMiles(nodo.Text[2]);
        if valor = '' then
          valor := decimal_correcto('0.00');
        if edt <> '' then
        begin
          with qry do
          begin
            Close;
            sql.Clear;
            {(*}
            sql.Add('INSERT INTO TvaloresEDT (codBase, ' +
                    'codPresupuesto, ' +
                    'revision, ' +
                    'EDT, ' +
                    'Valor) ' +
                    'VALUES ' +
                    '(:codBase, ' +
                    ':codPresupuesto, ' +
                    ':revision, ' +
                    ':EDT, ' +
                    ':Valor)');
              {*)}
            ParamByName('codbase').AsString := codBase;
            ParamByName('codPresupuesto').AsString := codProyecto;
            ParamByName('revision').AsString := revision;
            ParamByName('EDT').AsString := edt;
            ParamByName('Valor').AsFloat := StrToFloat(valor);
            Prepare;
            ExecSQL;
          end;
        end;
        nodo := nodo.GetNext;
      end;
    end;
  finally
    qry.Free
  end;
end;

/// <summary>TODO: Descripción de dasumaValoresEDT.</summary>
/// <param name="EDTFiltro">TODO.</param>
/// <returns>TODO.</returns>
function dasumaValoresEDT(EDTFiltro: string): Double;
var
  tmpstr: string;
  qry: TUniQuery;
  codBase: string;
begin
  result := 0;
  qry := TUniQuery.Create(nil);
  codBase := base_activa.codBase;

  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select sum(valor) as SumaEDT from TvaloresEDT where (EDT like ' + QuotedStr(EDTFiltro + '%') + ') and (codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision)');
      ParamByName('codbase').AsString := codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('SumaEDT').AsString;
      tmpstr := decimal_correcto(tmpstr);
      result := strtofloatdef(tmpstr, 0);
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de getLastMemoLineNumber.</summary>
/// <param name="Memo">TODO.</param>
/// <returns>TODO.</returns>
function getLastMemoLineNumber(const Memo: TMemo): Integer;
var
  oldCaretPosition: TCaretPosition;
begin
  Assert(Assigned(Memo));
  oldCaretPosition := Memo.CaretPosition;

  try
    Memo.GoToTextEnd();
    result := Memo.CaretPosition.Line;
  finally
    Memo.CaretPosition := oldCaretPosition;
  end;
end;

function cuentaCaracteres(cadena: string; caracter: string): Integer;
var
  x, y: Integer;
  tchar: string;
begin
  y := 0;
  for x := 0 to length(cadena) - 1 do
  begin
    tchar := MidStr(cadena, x, Length(caracter));
    if tchar = caracter then
      Inc(y);
  end;
  Result := y;
end;

/// <summary>TODO: Descripción de iniciaTablaMemoria.</summary>
procedure iniciaTablaMemoria();
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('delete from TAnotaciones');
      Prepare;
      ExecSQL;
    end;
  finally
    qry.Free
  end;
end;

/// <summary>TODO: Descripción de daPaqueteItem.</summary>
/// <param name="posgrid">TODO.</param>
/// <returns>TODO.</returns>
function daPaqueteItem(posgrid: Integer): string;
var
  paquete: string;
  tmpstr: string;
begin
  paquete := '';
  while (paquete = '') and (posgrid > 0) do
  begin
    with DMPresupuesto.dsTpresupuestosItems.DataSet do
    begin
      DisableControls;
      First;
      MoveBy(posgrid - 1);
      EnableControls;
    end;

    tmpstr := DMPresupuesto.QTPresupuestosItemsunidad.AsString;
    if tmpstr = '' then
    begin
      paquete := dmpresupuesto.QTPresupuestosItemsdescripcion.AsString;
    end;
    posgrid := posgrid - 1;
  end;
  paquete := ReplaceStr(paquete, '<b>', '');
  paquete := ReplaceStr(paquete, '</b>', '');
  result := paquete;
end;

/// <summary>TODO: Descripción de daCodEDT.</summary>
/// <param name="posgrid">TODO.</param>
/// <returns>TODO.</returns>
function daCodEDT(posgrid: Integer): string;
var
  paquete: string;
  tmpstr: string;
begin
  paquete := '';
  while (paquete = '') and (posgrid > 0) do
  begin
    with DMPresupuesto.dsTpresupuestosItems.DataSet do
    begin
      DisableControls;
      First;
      MoveBy(posgrid - 1);
      EnableControls;
    end;
    tmpstr := DMPresupuesto.QTPresupuestosItemsunidad.AsString;
    if tmpstr = '' then
    begin
      paquete := DMPresupuesto.QTPresupuestosItemscodEDT.AsString;
    end;
    posgrid := posgrid - 1;
  end;
  paquete := ReplaceStr(paquete, '<b>', '');
  paquete := ReplaceStr(paquete, '</b>', '');
  result := paquete;
end;

/// <summary>TODO: Descripción de CargaProyectosDisponibles.</summary>
/// <param name="fechaInicio">TODO.</param>
/// <param name="FechaFinal">TODO.</param>
procedure CargaProyectosDisponibles(fechaInicio, FechaFinal: TdateTime);
var
  qry: TUniQuery;
  x: Integer;
  tmpstr: string;
  TFecha: string;
  valor: Tdatetime;
  f1, f2: string;
  nodo, subnodo: TTMSFNCTreeViewNode;
  nRevision: string;
  codProyecto: string;
  Descripcion: string;
  codReferencial: string;
  subtotal, iva, Total: string;
  codBase: string;
  tmpD: double;
begin
  frmAbrirPresupuesto.Trvw_ProyectosDisponibles.ClearNodes;
  frmAbrirPresupuesto.Trvw_ProyectosDisponibles.Columns[0].Text := 'Proyecto';
  frmAbrirPresupuesto.Trvw_ProyectosDisponibles.Columns[1].Text := 'Subtotal';
  frmAbrirPresupuesto.Trvw_ProyectosDisponibles.Columns[2].Text := 'IVA';
  frmAbrirPresupuesto.Trvw_ProyectosDisponibles.Columns[3].Text := 'Total';
  frmAbrirPresupuesto.Trvw_ProyectosDisponibles.Columns[4].Text := 'Fecha';
  frmAbrirPresupuesto.Trvw_ProyectosDisponibles.Columns[5].Width := 0;
  if (fechaInicio > 0) then
  begin
    f1 := FloatToStr(fechaInicio);
    f1 := ReplaceStr(f1, ',', '.');
    f2 := FloatToStr(FechaFinal);
    f2 := ReplaceStr(f2, ',', '.');
    qry := TUniQuery.Create(nil);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        sql.Add('select * from Presupuestos_DatosGenerales where (fechaModificacion between ' + f1 + ' and ' + f2 + ') and activo=1');
        Prepare;
        ExecSQL;
        while not Eof do
        begin
          nRevision := 'Rev. ' + FieldByName('revision').AsString;
          codProyecto := FieldByName('codPresupuesto').AsString;
          codProyecto := '<B>' + codProyecto + '</B>';
          codBase := FieldByName('codBase').AsString;
          codReferencial := FieldByName('codReferencial').AsString;
          Descripcion := FieldByName('descripcion').AsString;
          Descripcion := '<B>' + Descripcion + '</B>';
          tmpstr := FieldByName('subtotal').AsString;
          if tmpstr = '' then
            tmpstr := '0';
          subtotal := tmpstr;
          tmpstr := FieldByName('iva').AsString;
          if tmpstr = '' then
            tmpstr := '0';
          iva := tmpstr;
          tmpstr := FieldByName('total').AsString;
          if tmpstr = '' then
            tmpstr := '0';
          Total := tmpstr;
          valor := FieldByName('fechaModificacion').AsDateTime;
          TFecha := formatdatetime('dd/mm/yyyy', valor);
          if codReferencial <> '' then
          begin
            codReferencial := '(' + codReferencial + ')';
            codProyecto := codProyecto + '  ' + codReferencial + '  ' + Descripcion;
          end
          else
          begin
            codProyecto := codProyecto + '  ' + Descripcion;
          end;
          if nRevision = 'Rev. ' + '0' then
          begin
            nodo := frmAbrirPresupuesto.Trvw_ProyectosDisponibles.AddNode;
            nodo.Extended := True;
            nodo.Text[0] := codProyecto;
          end
          else
          begin
            nodo := posicionaNodo(frmAbrirPresupuesto.Trvw_ProyectosDisponibles, codProyecto, 0, True);
          end;
          subnodo := frmAbrirPresupuesto.Trvw_ProyectosDisponibles.AddNode(nodo);
          subnodo.Text[0] := nRevision;
          subnodo.Text[1] := subtotal;
          subnodo.Text[2] := iva;
          subnodo.Text[3] := Total;
          subnodo.Text[4] := TFecha;
          subnodo.Text[5] := codBase;
          Next;
        end;
      end;
    finally
      qry.Free;
    end;
  end
  else
  begin
    qry := TUniQuery.Create(nil);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        sql.Add('SELECT * FROM Presupuestos_DatosGenerales WHERE activo=1');
        Prepare;
        ExecSQL;
        while not Eof do
        begin
          nRevision := 'Rev. ' + FieldByName('revision').AsString;
          codProyecto := FieldByName('codPresupuesto').AsString;
          codProyecto := '<B>' + codProyecto + '</B>';
          codBase := FieldByName('codBase').AsString;
          codReferencial := FieldByName('codReferencial').AsString;
          Descripcion := FieldByName('descripcion').AsString;
          Descripcion := '<B>' + Descripcion + '</B>';
          tmpstr := decimal_correcto(FieldByName('subtotal').AsString);
          if tmpstr = '' then
            tmpstr := '0';
          subtotal := tmpstr;
          tmpstr := decimal_correcto(FieldByName('iva').AsString);
          if tmpstr = '' then
            tmpstr := '0';
          iva := tmpstr;
          tmpstr := decimal_correcto(FieldByName('total').AsString);
          if tmpstr = '' then
            tmpstr := '0';
          Total := tmpstr;
          valor := FieldByName('fechaModificacion').AsDateTime;
          TFecha := formatdatetime('dd/mm/yyyy', valor);
          if codReferencial <> '' then
          begin
            codReferencial := '(' + codReferencial + ')';
            codProyecto := codProyecto + '  ' + codReferencial + '  ' + Descripcion;
          end
          else
          begin
            codProyecto := codProyecto + '  ' + Descripcion;
          end;
          if nRevision = 'Rev. ' + '0' then
          begin
            nodo := frmAbrirPresupuesto.Trvw_ProyectosDisponibles.AddNode;
            nodo.Extended := True;
            nodo.Text[0] := codProyecto;
          end
          else
          begin
            nodo := posicionaNodo(frmAbrirPresupuesto.Trvw_ProyectosDisponibles, codProyecto, 0, True);
          end;
          subnodo := frmAbrirPresupuesto.Trvw_ProyectosDisponibles.AddNode(nodo);
          subnodo.Text[0] := nRevision;
          subnodo.Text[1] := subtotal;
          subnodo.Text[2] := iva;
          subnodo.Text[3] := Total;
          subnodo.Text[4] := TFecha;
          subnodo.Text[5] := codBase;
          Next;
        end;
      end;
    finally
      qry.Free;
      frmAbrirPresupuesto.Trvw_ProyectosDisponibles.Columns[5].Width := 0;
    end;
  end;
end;

/// <summary>TODO: Descripción de cargaCategoriasIndirectosPresupuestos.</summary>
procedure cargaCategoriasIndirectosPresupuestos();
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  frmPorcentajesIndirectos.cbb_costosIndirectosCat.Items.Clear;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from CatIndirectos');
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        tmpstr := FieldByName('codigo').AsString;
        tmpstr := tmpstr + ' ' + FieldByName('descripcion').AsString;
        frmPorcentajesIndirectos.cbb_costosIndirectosCat.Items.Add(tmpstr);
        Next;
      end;
    end;
  finally
    qry.Free;
    frmPorcentajesIndirectos.cbb_costosIndirectosCat.ItemIndex := 0;
  end;
end;

/// <summary>TODO: Descripción de cargaConceptosIndirectos.</summary>
/// <param name="codPadre">TODO.</param>
procedure cargaConceptosIndirectos(codPadre: string);
var
  x: Integer;
  qry: TUniQuery;
  tmpstr: string;
begin
  if codPadre <> '' then
  begin
    qry := TUniQuery.Create(nil);
    setlength(listaPorcentajeUsado, 0);
    x := AnsiPos(' ', codPadre);
    codPadre := Copy(codPadre, 1, x - 1);
    codPadre := trim(codPadre);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        sql.Add('SELECT * FROM conceptosIndirectos WHERE codPadre= ' + QuotedStr(codPadre));
        Prepare;
        ExecSQL;
        frmPorcentajesIndirectos.cbb_CostosIndirectosConceptos.Items.Clear;
        x := 0;
        while not Eof do
        begin
          tmpstr := FieldByName('codigoCuenta').AsString;
          frmPorcentajesIndirectos.cbb_CostosIndirectosConceptos.Items.Add(tmpstr);
          setlength(listaPorcentajeUsado, x + 1);
          listaPorcentajeUsado[x].descripcion := tmpstr;
          listaPorcentajeUsado[x].id := FieldByName('id').AsString;
          Inc(x);
          Next;
        end;
      end;
    finally
      qry.Free;
      if frmPorcentajesIndirectos.cbb_CostosIndirectosConceptos.Items.Count - 1 > 0 then
        frmPorcentajesIndirectos.cbb_CostosIndirectosConceptos.ItemIndex := 0;
    end;
  end;
end;

/// <summary>TODO: Descripción de DaSeleccionRolesStake.</summary>
procedure DaSeleccionRolesStake();
var
  qry: TUniQuery;
  tmpstr: string;
begin
  frmMain.grid_stakesAsignados.Columns[6].ComboItems.Clear;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.add('SELECT * FROM rolesstakes ORDER BY id');
      prepare;
      execSql;
      while not Eof do
      begin
        tmpstr := FieldByName('descripcion').AsString;
        frmMain.grid_stakesAsignados.Columns[6].ComboItems.Add(tmpstr);
        Next;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de DaSeleccionRolesStake2.</summary>
procedure DaSeleccionRolesStake2();
var
  qry: TUniQuery;
  tmpstr: string;
begin
  frmMain.grid_EDOStakes.Columns[3].ComboItems.Clear;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.add('SELECT * FROM rolesstakes ORDER BY id');
      prepare;
      execSql;
      while not Eof do
      begin
        tmpstr := FieldByName('descripcion').AsString;
        frmMain.grid_EDOStakes.Columns[3].ComboItems.Add(tmpstr);
        Next;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de cargaConceptosIndirectosFijos.</summary>
procedure cargaConceptosIndirectosFijos();
var
  qry: TUniQuery;
  x: Integer;
begin
  qry := TUniQuery.Create(nil);
  frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.ClearNormalCells;
  frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[0, 0] := '#';
  frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[1, 0] := 'Cuenta';
  frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[3, 0] := 'Observaciones';
  frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[2, 0] := '%';
  frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.RowCount := 1;
  x := 1;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from conceptosIndirectos where fijo=True');
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.RowCount := x + 1;
        frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[0, x] := inttostr(x);
        frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[1, x] := FieldByName('CodigoCuenta').AsString;
        frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[2, x] := '0%';
        frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[4, x] := FieldByName('id').AsString;
        Inc(x);
        Next;
      end;
    end;
  finally
    qry.Free;
  end;
end;

function RecalculaApuAnidado(nuevoPrecioAnidado, codApuAnidado, codAPU: string; guardar: Boolean): Double;
var
  qry: TUniQuery;
  x: integer;
  SQLText: string;
  strComparacion: string;
  cantidadUnidad, precio, rendimiento, totalAPU: Double;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  SetLength(listadoRecursosTanteoAnidado, 0);
  x := 0;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      {(*}
      SQLText :=  'SELECT ' +
                  'items.descripcion, ' +
                  'items.Precio, ' +
                  'items.idUnicoRecurso, ' +
                  'IF(tanteo.descripcion IS NULL, items.CantidadUnidad, tanteo.CantidadUnidad) AS CantidadUnidad, ' +
                  'IF(tanteo.descripcion IS NULL, items.Rendimiento, tanteo.Rendimiento) AS Rendimiento ' +
                  'FROM ' +
                  'apus_items items ' +
                  'LEFT JOIN presupuestos_tanteo_recursos tanteo ON ( ' +
                  'tanteo.codBase = items.codBase ' +
                  'AND tanteo.idUnicoRecurso = items.idUnicoRecurso ' +
                  'AND tanteo.CodAPU = items.CodAPU ' +
                  'AND tanteo.codPresupuesto = :codPresupuesto ' +
                  'AND tanteo.revision = :revision ' +
                  ') ' +
                  'WHERE ' +
                  'items.CodAPU = :codAPUAnidado ' +
                  'AND items.codBase = :codBase';
        {*)}
      sql.Add(SQLText);
      ParamByName('codAPUAnidado').AsString := codApuAnidado;
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      strComparacion := 'APU: ' + codAPU;
      totalAPU := 0;
      while not Eof do
      begin
        if FieldByName('idUnicoRecurso').AsString = strComparacion then
          precio := StrToFloat(decimal_correcto(nuevoPrecioAnidado))
        else
          precio := FieldByName('precio').AsFloat;
        cantidadUnidad := FieldByName('cantidadUnidad').AsFloat;
        tmpstr := decimal_correcto(FieldByName('rendimiento').AsString);
        rendimiento := StrToFloatDef(tmpstr, 1);
        totalAPU := totalAPU + (precio * cantidadUnidad * rendimiento);
        if guardar then /// ?????
        begin
          SetLength(listadoRecursosTanteoAnidado, x + 1);
          listadoRecursosTanteoAnidado[x].codAPU := codApuAnidado;
          listadoRecursosTanteoAnidado[x].descripcion := FieldByName('descripcion').AsString;
          listadoRecursosTanteoAnidado[x].idUnicoRecurso := FieldByName('idUnicoRecurso').AsString;
          listadoRecursosTanteoAnidado[x].precio := FloatToStr(precio);
          listadoRecursosTanteoAnidado[x].cantidadUnidad := FloatToStr(cantidadUnidad);
          listadoRecursosTanteoAnidado[x].rendimiento := FloatToStr(rendimiento);
          listadoRecursosTanteoAnidado[x].total := FloatToStr((precio * cantidadUnidad * rendimiento));
        end;
        inc(x);
        Next;
      end;
    end;
  finally
    qry.Free;
    if guardar then ///// ?????
      guardarTanteo_recursosApuAnidado();
    Result := totalAPU;
  end;
end;

/// <summary>TODO: Descripción de guardarTanteo_recursosApuAnidado.</summary>
procedure guardarTanteo_recursosApuAnidado();
var
  qry: TUniQuery;
  x: integer;
  SQLText: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      SQLText := 'delete from presupuestos_tanteo_recursos where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision and codAPU=:codApu';
      SQL.Add(SQLText);
      ParamByName('codAPU').AsString := listadoRecursosTanteoAnidado[0].codApu;
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      close;
      SQL.Clear;
      {(*}
      SQLText :=  'INSERT INTO presupuestos_tanteo_recursos ' +
                  '( ' +
                  'codBase, ' +
                  'codPresupuesto, ' +
                  'revision, ' +
                  'codApu, ' +
                  'descripcion, ' +
                  'idUnicoRecurso, ' +
                  'Precio, ' +
                  'CantidadUnidad, ' +
                  'Rendimiento, ' +
                  'Total) ' +
                  'VALUES ' +
                  '( ' +
                  ':codBase, ' +
                  ':codPresupuesto, ' +
                  ':revision, ' +
                  ':codApu, ' +
                  ':descripcion, ' +
                  ':idUnicoRecurso, ' +
                  ':Precio, ' +
                  ':CantidadUnidad, ' +
                  ':Rendimiento, ' +
                  ':Total ' +
                  ')';
        {*)}
      sql.Add(SQLText);
      Prepare;
      for x := 0 to Length(listadoRecursosTanteoAnidado) - 1 do
      begin
        ParamByName('codAPU').AsString := listadoRecursosTanteoAnidado[x].codApu;
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('descripcion').AsString := listadoRecursosTanteoAnidado[x].descripcion;
        ParamByName('idUnicoRecurso').AsString := listadoRecursosTanteoAnidado[x].idUnicoRecurso;
        ParamByName('Precio').AsFloat := StrToFloat(decimal_correcto(listadoRecursosTanteoAnidado[x].precio));
        ParamByName('CantidadUnidad').AsFloat := StrToFloat(decimal_correcto(listadoRecursosTanteoAnidado[x].cantidadUnidad));
        ParamByName('Rendimiento').AsFloat := strtofloat(decimal_correcto(listadoRecursosTanteoAnidado[x].Rendimiento));
        ParamByName('Total').AsFloat := strtofloat(decimal_correcto(listadoRecursosTanteoAnidado[x].total));
        ExecSQL;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de nApusAnidados.</summary>
/// <param name="codAPU">TODO.</param>
/// <param name="codAPUanidado">TODO.</param>
/// <returns>TODO.</returns>
function nApusAnidados(codAPU, codAPUanidado: string): integer;
var
  qry: TUniQuery;
  SQLText: string;
  x: Integer;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      SQLText := 'SELECT count(*) as nAnidado FROM' + '  apus_items items WHERE items.CodAPU = :codApu ' + '  AND items.codBase = :codBase ' + '  AND items.idUnicoRecurso = CONCAT(''APU: '', :codApuAnidado)';
      sql.Add(SQLText);
      ParamByName('codAPU').AsString := codAPU;
      ParamByName('codAPUAnidado').AsString := codAPUanidado;
      ParamByName('codBase').AsString := base_activa.codBase;
      Prepare;
      ExecSQL;
      Result := FieldByName('nAnidado').AsInteger;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de presupuestoCalculaTotalesCrono01.</summary>
procedure presupuestoCalculaTotalesCrono01();
var
  cantidad: Double;
  Total: Double;
  totalSinIva: Double;
  porcentaje: Double;
  tmpstr: string;
  x: Integer;
  ivaPresupuesto: Double;
  PrecioReferencia: Double;
  control: string;
begin
  cantidad := 0;
  Total := 0;
  ivaPresupuesto := strtofloatdef(frmmain.edt_porcentajeIVANuevoPresupuesto.Text, 12);
  tmpstr := frmmain.edt_NPresupuestoPrecioReferencia.Text;
  tmpstr := quitaSignoMiles(tmpstr);
  PrecioReferencia := strtofloatdef(tmpstr, 0);
  for x := 1 to frmmain.grid_crono01.RowCount - 1 do
  begin
    tmpstr := frmmain.grid_crono01.Cells[7, x];
    control := frmmain.grid_crono01.Cells[6, x];
    if (tmpstr <> '') and (control <> '') then
    begin
      tmpstr := quitaSignoMiles(tmpstr);
      tmpstr := ansireplacestr(tmpstr, base_activa.simboloMoneda, '').Trim;
      cantidad := StrToFloat(tmpstr);
      Total := Total + cantidad;
    end;
  end;
  Total := RoundTo(Total, (0 - ndecimalesMoneda));
  totalSinIva := Total;
  frmmain.lbl_APUT2SubTotal.Text := FormatFloat(cadenaCurrency, Total);
  ivaPresupuesto := (Total * ivaPresupuesto) / 100;
  ivaPresupuesto := RoundTo(ivaPresupuesto, (0 - ndecimalesMoneda));
  frmmain.lbl_APUT2Iva.Text := formatfloat(cadenaCurrency, ivaPresupuesto);
  Total := Total + ivaPresupuesto;
  Total := RoundTo(Total, (0 - ndecimalesMoneda));
  cantidad := totalSinIva - PrecioReferencia;
  frmmain.lbl_PresupuestoDiferencia.text := FormatFloat(cadenaCurrency, cantidad);
  if PrecioReferencia <> 0 then
  begin
    porcentaje := (100 * cantidad) / PrecioReferencia;
    frmmain.lbl_PresupuestoDiferenciaPorcentaje.Text := FloatToStr(porcentaje) + '%';
  end
  else
  begin
    frmmain.lbl_PresupuestoDiferenciaPorcentaje.Text := '0%';
  end;
  frmmain.lbl_APUT2Total.Text := formatfloat(cadenacurrency, Total);
end;

/// <summary>TODO: Descripción de quitaSignoMiles.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function quitaSignoMiles(datos: string): string;
var
  caracterDecimal: string;
  caracterMiles: string;
begin
  caracterDecimal := decimal_correcto(',');
  if caracterDecimal = ',' then
    caracterMiles := '.'
  else
    caracterMiles := ',';
  result := ReplaceStr(datos, caracterMiles, '');
end;

/// <summary>TODO: Descripción de quitaHtmlNegritas.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function quitaHtmlNegritas(datos: string): string;
begin
  datos := ReplaceStr(datos, '<b>', '');
  datos := ReplaceStr(datos, '</b>', '');
  datos := ReplaceStr(datos, '<B>', '');
  datos := ReplaceStr(datos, '</B>', '');
  result := datos;
end;

/// <summary>TODO: Descripción de pasaFormatoCompleto.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function pasaFormatoCompleto(datos: Double): string;
var
  partedecimal: Double;
  parteEntera: Integer;
  Tentero: Integer;
  Tdecimal: Integer;
  x, y: Integer;
  tmpstr: string;
begin
  parteEntera := trunc(datos);
  partedecimal := frac(datos);
  tmpstr := inttostr(parteEntera);
  Tentero := length(tmpstr);
  tmpstr := FloatToStr(partedecimal);
  Tdecimal := length(tmpstr) - 2;
  if Tdecimal > ndecimalesMoneda then
  begin
    partedecimal := partedecimal;
  end;
  tmpstr := FloatToStr(partedecimal);
  tmpstr := Copy(tmpstr, 3, length(tmpstr));
  if tmpstr = '' then
    tmpstr := ponerCerosInicio('', ndecimalesmoneda - 1);
  result := FloatToStrF(parteEntera, ffNumber, Tentero, 0);
  result := result + decimal_correcto(',');
  result := result + tmpstr;
end;

/// <summary>TODO: Descripción de calcularPorCentajeEjecucionObras.</summary>
procedure calcularPorCentajeEjecucionObras();
var
  nperiodos: Integer;
  amplitudItems: Integer;
  derivacion: TStringList;
  tmpstr: string;
  x, y, z: Integer;
  valorEjecucion: string;
  valor: Double;
  porcentajeEjecucion: Double;
  dblTmp: Double;
  sumatorioValores: Double;
  resilente: Double;
  lineasCSV: TStringList;
  lineaDatos: string;
  ntemporal: string;
begin
  nperiodos := strtoint(frmmain.lbl_cronogramaNPeriodos.Text);
  amplitudItems := frmmain.grid_crono0.RowCount;
  frmmain.grid_Crono1.ColumnCount := nperiodos;
  lineasCSV := TStringList.Create;
  if frmmain.grid_crono0.Cells[11, 1] <> '' then
  begin
    for x := 1 to amplitudItems - 1 do
    begin
      lineaDatos := '';
      sumatorioValores := 0;
      if frmmain.grid_crono0.Cells[0, x] = '' then
      begin
        derivacion := TStringList.Create;
        tmpstr := frmmain.grid_crono0.Cells[11, x];
        if tmpstr <> '' then
        begin
          derivacion.Text := tmpstr;
          valorEjecucion := quitaSignoMiles(quitaHtmlNegritas(frmmain.grid_crono0.Cells[7, x]));
          valorEjecucion := quitaSimboloMoneda(valorEjecucion);
          if valorEjecucion <> '' then
          begin
            valor := StrToFloat(valorEjecucion);
            resilente := 0;
            z := 0;
            for y := 1 to nperiodos - 1 do
            begin
              porcentajeEjecucion := StrToFloat(derivacion[z]);
              Inc(z);
              dblTmp := (porcentajeEjecucion * valor) / 100;
              dblTmp := (dblTmp * 100) / valor;
              dblTmp := RoundTo(dblTmp, (0 - ndecimalesMoneda));
              tmpstr := FloatToStr(dblTmp);
              sumatorioValores := sumatorioValores + StrToFloat(tmpstr);
              resilente := resilente + StrToFloat(tmpstr);
              lineaDatos := lineaDatos + tmpstr + '%' + ';';
            end;
            tmpstr := FloatToStr(resilente);
            dblTmp := 0;
            dblTmp := 100 - StrToFloat(tmpstr);
            tmpstr := FloatToStr(dblTmp);
            sumatorioValores := sumatorioValores + StrToFloat(tmpstr);
            lineaDatos := lineaDatos + tmpstr + '%' + ';' + FloatToStr(sumatorioValores) + '%';
          end;
        end;
      end
      else
      begin
        for y := 1 to nperiodos do
          lineaDatos := lineaDatos + ';';
      end;
      lineasCSV.Add(lineaDatos);
    end;

    ntemporal := formatdatetime('ddmmyyyyhhnnss', now);
    ntemporal := rutaApp + '\' + ntemporal + '.csv';
    lineasCSV.SaveToFile(ntemporal);
    frmmain.grid_Crono1.DefaultColumnWidth := 70;
    // Ajuste del tamaño de las celdas de los grids
    frmmain.grid_Crono1.LoadFromCSV(ntemporal);
    DeleteFile(PWideChar(ntemporal));
    showHeader(frmmain.grid_Crono1, nperiodos);
    frmMain.grid_Crono1.BeginUpdate;
    for x := 0 to frmMain.grid_Crono1.ColumnCount - 1 do
    begin
      frmMain.grid_Crono1.Columns[x].FixedFont.Style := [];
      frmMain.grid_Crono1.Columns[x].Font.Style := [];
      frmmain.grid_crono1.Columns[x].HorzAlignment := TTMSFNCGraphicsTextAlign.gtaCenter;
    end;
  end;
  frmmain.grid_Crono1.EndUpdate;
end;

/// <summary>TODO: Descripción de quitaSimboloMoneda.</summary>
/// <param name="Datos">TODO.</param>
/// <returns>TODO.</returns>
function quitaSimboloMoneda(Datos: string): string;
begin
  if base_activa.simboloMoneda = '' then
    base_activa.simboloMoneda := '$';
  Datos := AnsiReplaceStr(Datos, base_activa.simboloMoneda, '');
  Result := Datos;
end;

/// <summary>TODO: Descripción de calcularCantidadesObras.</summary>
procedure calcularCantidadesObras();
var
  nperiodos: Integer;
  amplitudItems: Integer;
  derivacion: TStringList;
  tmpstr: string;
  x, y, z: Integer;
  valorEjecucion: string;
  valor: Double;
  porcentajeEjecucion: Double;
  dblTmp: Double;
  sumatorioValores: Double;
  resilente: Double;
  lineasCSV: TStringList;
  lineaDatos: string;
  ntemporal: string;
begin
  nperiodos := strtoint(frmmain.lbl_cronogramaNPeriodos.Text);
  amplitudItems := frmmain.grid_crono0.RowCount;
  frmmain.grid_crono3.ColumnCount := nperiodos;
  lineasCSV := TStringList.Create;
  if frmmain.grid_crono0.Cells[11, 1] <> '' then
  begin
    for x := 1 to amplitudItems - 1 do
    begin
      lineaDatos := '';
      sumatorioValores := 0;
      if frmmain.grid_crono0.Cells[0, x] = '' then
      begin
        derivacion := TStringList.Create;
        tmpstr := frmmain.grid_crono0.Cells[11, x];
        if tmpstr <> '' then
        begin
          derivacion.Text := tmpstr;
          valorEjecucion := quitaSignoMiles(quitaHtmlNegritas(frmmain.grid_crono0.Cells[5, x]));
          valorEjecucion := quitaSimboloMoneda(valorEjecucion);
          if valorEjecucion <> '' then
          begin
            valor := StrToFloat(valorEjecucion);
            resilente := 0;
            z := 0;
            for y := 1 to nperiodos - 1 do
            begin
              porcentajeEjecucion := StrToFloat(derivacion[z]);
              Inc(z);
              dblTmp := (porcentajeEjecucion * valor) / 100;
              dblTmp := RoundTo(dblTmp, (0 - ndecimalesPresupuesto));
              tmpstr := FloatToStr(dblTmp);
              sumatorioValores := sumatorioValores + StrToFloat(tmpstr);
              resilente := resilente + StrToFloat(tmpstr);
              lineaDatos := lineaDatos + tmpstr + ';';
            end;
            tmpstr := FloatToStr(resilente);
            dblTmp := 0;
            dblTmp := valor - StrToFloat(tmpstr);
            dblTmp := RoundTo(dblTmp, 0 - ndecimalesPresupuesto);
            tmpstr := FloatToStr(dblTmp);
            sumatorioValores := sumatorioValores + StrToFloat(tmpstr);
            lineaDatos := lineaDatos + tmpstr + ';' + FloatToStr(sumatorioValores);
          end;
        end;
      end
      else
      begin
        for y := 1 to nperiodos do
          lineaDatos := lineaDatos + ';';
      end;
      lineasCSV.Add(lineaDatos);
    end;

    ntemporal := formatdatetime('ddmmyyyyhhnnss', now);
    ntemporal := rutaApp + '\' + ntemporal + '.csv';
    lineasCSV.SaveToFile(ntemporal);
    frmmain.grid_crono3.LoadFromCSV(ntemporal);
    DeleteFile(PWideChar(ntemporal));
    showHeader(frmmain.grid_crono3, nperiodos);
    for x := 0 to frmMain.grid_Crono3.ColumnCount - 1 do
    begin
      frmmain.grid_crono3.Columns[x].HorzAlignment := TTMSFNCGraphicsTextAlign.gtaCenter;
    end;
  end;
end;

/// <summary>TODO: Descripción de calcularInversion.</summary>
procedure calcularInversion();
var
  nperiodos: Integer;
  amplitudItems: Integer;
  derivacion: TStringList;
  tmpstr: string;
  x, y, z: Integer;
  valorEjecucion: string;
  valor: Double;
  valorP1, valorP2: Double;
  porcentajeEjecucion: Double;
  dblTmp, dblTmp2: Double;
  sumatorioValores: Double;
  resilente: Double;
  lineasCSV: TStringList;
  lineaDatos: string;
  ntemporal: string;
  sumaColumnas: array of string;
  porcentajeParcial: string;
  ValorAcumulado: string;
  totalSinIva: Double;
  f: double;
  porcentajeAcumulado: string;
  lineaDatos1: string;
  lineaDatos2: string;
  lineaDatos3: string;
  lineaDatos4: string;
begin
  if base_activa.simboloMoneda = '' then
    base_activa.simboloMoneda := '$';
  nperiodos := strtoint(frmmain.lbl_cronogramaNPeriodos.Text);
  amplitudItems := frmmain.grid_crono0.RowCount;
  frmmain.grid_crono2.ColumnCount := nperiodos;
  frmmain.grid_GBarras.ColumnCount := nperiodos;
  setlength(sumaColumnas, nperiodos);
  lineasCSV := TStringList.Create;
  tmpstr := frmmain.lbl_SubtotalPresupuesto.Text;
  tmpstr := AnsiReplaceStr(tmpstr, base_Activa.simboloMoneda, '');
  tmpstr := quitaSignoMiles(tmpstr).Trim;

  totalSinIva := strtofloatdef(tmpstr, 0);
  if frmmain.grid_crono0.Cells[10, 1] <> '' then
  begin
    for x := 1 to amplitudItems - 1 do
    begin
      lineaDatos := '';
      sumatorioValores := 0;
      if frmmain.grid_crono0.Cells[0, x].Trim = '' then
      begin
        derivacion := TStringList.Create;
        tmpstr := frmmain.grid_crono0.Cells[11, x];
        if tmpstr <> '' then
        begin
          derivacion.Text := tmpstr;
          valorEjecucion := quitaSignoMiles(quitaHtmlNegritas(frmmain.grid_crono0.Cells[7, x]));
          valorEjecucion := quitaSimboloMoneda(valorEjecucion);
          if valorEjecucion <> '' then
          begin
            valor := StrToFloat(valorEjecucion);
            resilente := 0;
            z := 0;
            for y := 1 to nperiodos - 1 do
            begin
              porcentajeEjecucion := StrToFloat(derivacion[z]);
              Inc(z);
              dblTmp := (porcentajeEjecucion * valor) / 100;
              dblTmp := RoundTo(dblTmp, (0 - ndecimalesMoneda));
              tmpstr := FloatToStr(dblTmp);
              resilente := resilente + StrToFloat(tmpstr);
              lineaDatos := lineaDatos + FormatFloat(cadenaCurrency, dblTmp) + ';';
              sumatorioValores := sumatorioValores + dblTmp;
              tmpstr := sumaColumnas[y - 1];
              if tmpstr = '' then
                tmpstr := '0';
              dblTmp2 := StrToFloat(tmpstr);
              dblTmp2 := dblTmp2 + dblTmp;
              sumaColumnas[y - 1] := FloatToStr(dblTmp2);
            end;
            tmpstr := FloatToStr(resilente);
            dblTmp := 0;
            dblTmp := valor - StrToFloat(tmpstr);
            dblTmp := RoundTo(dblTmp, 0 - ndecimalesMoneda);
            tmpstr := FloatToStr(dblTmp);
            sumatorioValores := sumatorioValores + StrToFloat(tmpstr);
            lineaDatos := lineaDatos + formatFloat(cadenaCurrency, dblTmp) + ';' + formatfloat(cadenaCurrency, sumatorioValores);
            tmpstr := sumaColumnas[nperiodos - 1];
            if tmpstr = '' then
              tmpstr := '0';
            dblTmp2 := StrToFloat(tmpstr);
            dblTmp2 := dblTmp2 + dblTmp;
            sumaColumnas[nperiodos - 1] := FloatToStr(dblTmp2);
          end;
        end;
      end
      else
      begin
        for y := 1 to nperiodos do
          lineaDatos := lineaDatos + ';';
      end;
      lineasCSV.Add(lineaDatos);
    end;
  end;
  porcentajeParcial := '';
  ValorAcumulado := '';
  dblTmp := 0;
  dblTmp2 := 0;
  valor := 0;
  valorP1 := 0;
  valorP2 := 0;
  sumatorioValores := 0;
  porcentajeAcumulado := '';
  lineaDatos1 := '';
  for y := 0 to nperiodos - 1 do
  begin
    tmpstr := sumaColumnas[y];
    if tmpstr = '' then
    begin
      tmpstr := '0';
      totalSinIva := 1;
    end;

    if y < nperiodos - 1 then
      lineaDatos1 := lineaDatos1 + base_activa.simboloMoneda + tmpstr + ';'
    else
      lineaDatos1 := lineaDatos1 + base_activa.simboloMoneda + tmpstr;
    valor := StrToFloat(decimal_correcto(tmpstr));

    valor := valor / totalSinIva;
    valor := valor * 100;
    valor := roundto(valor, 0 - ndecimalesMoneda);
    tmpstr := FloatToStr(valor);

    if y < nperiodos - 1 then
    begin
      sumatorioValores := sumatorioValores + StrToFloat(tmpstr);
      porcentajeParcial := porcentajeParcial + base_activa.simboloMoneda + tmpstr + '%' + ';';
      valorP1 := StrToFloat(tmpstr);
      valorP2 := valorP2 + valorP1;
      tmpstr := FloatToStr(valorP2);
      porcentajeAcumulado := porcentajeAcumulado + tmpstr + '%' + ';';
      tmpstr := sumaColumnas[y];
      if tmpstr = '' then
      begin
        tmpstr := '0';
        totalSinIva := 1;
      end;
      dblTmp := StrToFloat(tmpstr);
      dblTmp2 := dblTmp2 + dblTmp;
      tmpstr := FloatToStr(dblTmp2);
      ValorAcumulado := ValorAcumulado + base_activa.simboloMoneda + tmpstr + ';';
    end
    else
    begin
      sumatorioValores := 100 - sumatorioValores;
      tmpstr := FloatToStr(sumatorioValores);
      porcentajeParcial := porcentajeParcial + base_activa.simboloMoneda + tmpstr + '%';
      valorP1 := StrToFloat(tmpstr);
      valorP2 := valorP2 + valorP1;
      tmpstr := FloatToStr(valorP2);
      porcentajeAcumulado := porcentajeAcumulado + tmpstr + '%';
      tmpstr := FloatToStr(totalSinIva);
      ValorAcumulado := ValorAcumulado + base_activa.simboloMoneda + tmpstr;
    end;
  end;
  ntemporal := formatdatetime('ddmmyyyyhhnnss', now);
  ntemporal := rutaApp + ntemporal + '.csv';
  lineasCSV.SaveToFile(ntemporal);
  frmmain.grid_crono2.DefaultColumnWidth := 50;
  frmMain.grid_GBarras.DefaultColumnWidth := 50;
  frmMain.grid_GBarras.LoadFromCSV(ntemporal);
  frmmain.grid_crono2.LoadFromCSV(ntemporal);
  DeleteFile(PWideChar(ntemporal));
  showHeader(frmmain.grid_crono2, nperiodos);
  showHeader(frmMain.grid_GBarras, nperiodos);
  lineasCSV := TStringList.Create;
  lineaDatos2 := ReplaceStr(porcentajeParcial, base_Activa.simboloMoneda, '').Trim;
  lineaDatos3 := ValorAcumulado;
  lineaDatos4 := porcentajeAcumulado;
  lineasCSV.Add(lineaDatos1);
  lineasCSV.Add(lineaDatos2);
  lineasCSV.Add(lineaDatos3);
  lineasCSV.Add(lineaDatos4);
  ntemporal := formatdatetime('ddmmyyyyhhnnss', now);
  ntemporal := rutaApp + ntemporal + '.csv';
  lineasCSV.SaveToFile(ntemporal);
  frmmain.grid_cronoTotales.LoadFromCSV(ntemporal);
  DeleteFile(PWideChar(ntemporal));
  frmMain.grid_GBarras.BeginUpdate;
  for x := 0 to frmMain.grid_GBarras.RowCount - 1 do
  begin
    for y := 0 to frmMain.grid_GBarras.Columns.Count - 2 do
    begin
      frmMain.grid_GBarras.Columns[y].Width := frmMain.grid_crono2.Columns[y].Width;
      tmpstr := frmMain.grid_GBarras.Cells[y, x];
      f := strtofloatdef(replacestr(tmpstr, base_Activa.simboloMoneda, ''), 0);
      if f > 0 then
      begin
        frmMain.grid_GBarras.Colors[y, x] := $FF648EA9;
        frmmain.grid_GBarras.HorzAlignments[y, x] := TTMSFNCGraphicsTextAlign.gtaTrailing;
      end;
    end;
  end;
  for x := 0 to frmMain.grid_Crono2.ColumnCount - 1 do
  begin
    frmmain.grid_crono2.Columns[x].HorzAlignment := TTMSFNCGraphicsTextAlign.gtaCenter;
    frmmain.grid_GBarras.Columns[x].HorzAlignment := TTMSFNCGraphicsTextAlign.gtaCenter;
  end;
  for x := 0 to frmmain.grid_CronoTotales.ColumnCount - 1 do
  begin
    frmMain.grid_CronoTotales.Columns[x].HorzAlignment := TTMSFNCGraphicsTextAlign.gtaCenter;
  end;
  frmMain.grid_GBarras.EndUpdate;
end;

function RunCmdAndWait(hWnd: hWnd; aParameters: string): Cardinal;
var
  sei: TShellExecuteInfo;
  aFile, dir: string;
begin
  result := 0;
  dir := rutaApp;
  SetCurrentDir(dir);
  FillChar(sei, SizeOf(sei), 0);
  sei.cbSize := SizeOf(sei);
  sei.Wnd := hWnd;
  sei.fMask := { SEE_MASK_FLAG_NO_UI or }SEE_MASK_NOCLOSEPROCESS;
  sei.lpVerb := 'open';
  aFile := 'cmd';
  sei.lpFile := PChar(aParameters);
  sei.lpParameters := ''; // PChar(aParameters);
  sei.lpDirectory := PChar(dir);
  sei.nShow := SW_SHOWNORMAL;

  if not ShellExecuteEx(@sei) then
  begin
    RaiseLastOSError;
  end;
  if sei.hProcess <> 0 then
  begin
    while WaitForSingleObject(sei.hProcess, 250) = WAIT_TIMEOUT do
      Application.ProcessMessages;
    GetExitCodeProcess(sei.hProcess, result);
    CloseHandle(sei.hProcess);
  end;
end;

/// <summary>TODO: Descripción de cronogramasSincronizaItemsPresupuesto.</summary>
procedure cronogramasSincronizaItemsPresupuesto();
var
  ficheroIntercambio: string;
  tmpstr: string;
  y, z: integer;
begin
  limpiaStringGrid(frmmain.grid_crono0);
  limpiaStringGrid(frmmain.grid_crono01);
  ficheroIntercambio := ExtractFilePath(ParamStr(0)) + 'gridtmp.dat';
  frmMain.dbGridConnect_TPresupuestosItems.LoadAllDataAndDisconnect;
  frmMain.grid_Presupuestos.SaveToFile(ficheroIntercambio);
  frmMain.dbGridConnect_TPresupuestosItems.Active := True;
  frmMain.grid_crono0.LoadFromFile(ficheroIntercambio);
  frmMain.grid_crono01.LoadFromFile(ficheroIntercambio);
  DeleteFile(PWideChar(ficheroIntercambio));

  frmmain.grid_crono0.Columns[9].Width := 0;
  frmmain.grid_crono0.Columns[10].Width := 0;
  frmmain.grid_crono0.Columns[11].Width := 0;
  frmmain.grid_crono0.Columns[12].Width := 0;
  frmmain.grid_crono0.Columns[13].Width := 0;

  frmmain.grid_crono0.Cells[0, 0] := 'Cod. EDT';
  frmmain.grid_crono0.Cells[1, 0] := 'Items';
  frmmain.grid_crono0.Cells[2, 0] := 'Cod. APU';
  frmmain.grid_crono0.Cells[3, 0] := 'Descripción';
  frmmain.grid_crono0.Cells[4, 0] := 'Unidad';
  frmmain.grid_crono0.Cells[5, 0] := 'Cantidad';
  frmmain.grid_crono0.Cells[6, 0] := 'P. Unitario';
  frmmain.grid_crono0.Cells[7, 0] := 'P. Total';
  frmMain.grid_crono0.Columns[1].HorzAlignment := TTextAlign.Center;
  frmMain.grid_crono0.Columns[2].HorzAlignment := TTextAlign.Center;
  frmMain.grid_crono0.Columns[4].HorzAlignment := TTextAlign.Center;
  frmMain.grid_crono0.Columns[5].HorzAlignment := TTextAlign.Center;
  frmMain.grid_crono0.Columns[6].HorzAlignment := TTextAlign.Trailing;
  frmMain.grid_crono0.Columns[7].HorzAlignment := TTextAlign.Trailing;

  frmmain.grid_crono01.Cells[0, 0] := 'Cod. EDT';
  frmmain.grid_crono01.Cells[1, 0] := 'Items';
  frmmain.grid_crono01.Cells[2, 0] := 'Cod. APU';
  frmmain.grid_crono01.Cells[3, 0] := 'Descripción';
  frmmain.grid_crono01.Cells[4, 0] := 'Unidad';
  frmmain.grid_crono01.Cells[5, 0] := 'Cantidad';
  frmmain.grid_crono01.Cells[6, 0] := 'P. Unitario';
  frmmain.grid_crono01.Cells[7, 0] := 'P. Total';
  frmmain.grid_crono01.Columns[8].Width := 0;
  frmmain.grid_crono01.Columns[9].Width := 0;
  frmmain.grid_crono01.Columns[10].Width := 0; // CodUnicoItems
  frmmain.grid_crono01.Columns[11].Width := 0;
  frmmain.grid_crono01.Columns[12].Width := 0;

  for y := 0 to frmmain.grid_crono0.RowCount - 1 do
  begin
    if frmmain.grid_crono0.Cells[0, y] <> '' then
    begin
      for z := 0 to frmmain.grid_crono0.Columns.Count do
      begin
        if (z = 3) or (z = 7) then
        begin
          tmpstr := frmmain.grid_crono0.Cells[z, y];
          tmpstr := ReplaceStr(tmpstr, '<b>', '');
          tmpstr := ReplaceStr(tmpstr, '</b>', '');
          frmmain.grid_crono0.Cells[z, y] := tmpstr;
          frmmain.grid_crono01.Cells[z, y] := tmpstr;
        end;
        frmmain.grid_crono0.Colors[z, y] := $FFE0E0E0;
        frmmain.grid_crono01.Colors[z, y] := $FFE0E0E0;
      end;
    end;
  end;
end;

/// <summary>TODO: Descripción de calculaPlazosCronograma.</summary>
procedure calculaPlazosCronograma();
var
  tipoCrono: Integer;
  nDias: Integer;
  divisorPeriodo: Integer;
  operacion: Double;
  Periodos: Integer;
  tmpstr: string;
  x: Integer;
  entrar: Boolean;
begin
  if frmmain.tbcPresupuestos.ActiveTab = frmmain.tab_6PresupuestoCronogramas then
  begin
    tmpstr := frmmain.grid_crono0.Cells[11, 1];
    entrar := False;
    if tmpstr <> '' then
      entrar := True;

    tipoCrono := frmmain.cbb_cronoTipoPeriodo.ItemIndex;
    nDias := StrToIntDef(frmmain.lbl_cronoPlazoEjecucion.Text, -1);
    if nDias > 0 then
    begin
      case tipoCrono of
        0:
          begin
            // diario
            divisorPeriodo := 1;
          end;
        1:
          begin
            // Semanal
            divisorPeriodo := 7;
          end;
        2:
          begin
            // Quincenal
            divisorPeriodo := 15;
          end;
        3:
          begin
            // Mensual
            divisorPeriodo := 30;
          end;
        4:
          begin
            // Bimensual
            divisorPeriodo := 60;
          end;
        5:
          begin
            // Trimestral
            divisorPeriodo := 90;
          end;
        6:
          begin
            // Semestral
            divisorPeriodo := 180;
          end;
        7:
          begin
            // Anual
            divisorPeriodo := 360;
          end;
      end;
      operacion := nDias / divisorPeriodo;
      Periodos := trunc(operacion);
      operacion := frac(operacion);
      if operacion > 0 then
        Inc(Periodos);
      frmmain.lbl_cronogramaNPeriodos.Text := inttostr(Periodos);
    end;
  end;
end;

procedure StringGridDeleteRow(Grid: TStringGrid; ARow: Integer);
var
  I, j: Integer;
begin
  for I := ARow to Grid.RowCount - 2 do
    for j := 0 to Grid.ColumnCount - 1 do
      Grid.Cells[j, I] := Grid.Cells[j, I + 1];
  Grid.RowCount := Grid.RowCount - 1;
end;

/// <summary>TODO: Descripción de SincronizaCronogramas.</summary>
procedure SincronizaCronogramas();
begin
  limpiaStringGrid(frmmain.grid_crono0);
  frmmain.grid_crono0.Options.ScrollBar.VerticalScrollBarVisible := False;
  //  frmmain.grid_crono0.Columns[0].Width := 20;
  frmmain.grid_crono0.Columns[0].Width := 68;
  frmmain.grid_crono0.Columns[1].Width := 68;
  frmmain.grid_crono0.Columns[2].Width := 140;
  frmmain.grid_crono0.Columns[3].Width := 300;
  frmmain.grid_crono0.Columns[4].Width := 68;
  frmmain.grid_crono0.Columns[5].Width := 68;
  frmmain.grid_crono0.Columns[6].Width := 68;
  frmmain.grid_crono0.Columns[7].Width := 68;
  frmmain.grid_crono0.Columns[8].Width := 0;
  frmmain.grid_crono0.Columns[9].Width := 0;
  limpiaStringGrid(frmmain.grid_crono01);
  frmmain.grid_crono01.Options.ScrollBar.VerticalScrollBarVisible := False;
  //  frmmain.grid_crono01.Columns[0].Width := 20;
  frmmain.grid_crono01.Columns[0].Width := 68;
  frmmain.grid_crono01.Columns[1].Width := 68;
  frmmain.grid_crono01.Columns[2].Width := 140;
  frmmain.grid_crono01.Columns[3].Width := 300;
  frmmain.grid_crono01.Columns[4].Width := 68;
  frmmain.grid_crono01.Columns[5].Width := 68;
  frmmain.grid_crono01.Columns[6].Width := 68;
  frmmain.grid_crono01.Columns[7].Width := 68;
  frmmain.grid_crono01.Columns[8].Width := 0;
  frmmain.grid_crono01.Columns[9].Width := 0;
end;

/// <summary>TODO: Descripción de limpiaStringGrid.</summary>
/// <param name="Grid">TODO.</param>
procedure limpiaStringGrid(Grid: TTMSFMXGrid);
var
  x, y: Integer;
begin
  for x := 1 to Grid.RowCount - 1 do
  begin
    for y := 0 to Grid.ColumnCount - 1 do
      Grid.Cells[y, x] := '';
  end;
  Grid.RowCount := 1;
end;

/// <summary>TODO: Descripción de limpiaStringGridCol.</summary>
/// <param name="Grid">TODO.</param>
procedure limpiaStringGridCol(Grid: TTMSFMXGrid);
var
  x: Integer;
begin
  for x := 1 to Grid.ColumnCount - 1 do
  begin
    Grid.DeleteColumn(0);
  end;
end;

/// <summary>TODO: Descripción de GuardaSeriesPresupuestos.</summary>
procedure GuardaSeriesPresupuestos();
var
  qry: TUniQuery;
  part1, part2, part3: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('SELECT * FROM configuracion');
      prepare;
      ExecSQL;
      First;
      part1 := FieldByName('PresupuestoValor1').AsString;
      if part1 <> '' then
      begin
        close;
        sql.Clear;
        sql.Add('UPDATE configuracion SET PresupuestoValor1=:PresupuestoValor1, PresupuestoValor2=:PresupuestoValor2, PresupuestoValor3=:PresupuestoValor3');
        sql.Add(' WHERE id_usuario=' + QuotedStr(ID_usuario));
        Prepare;
        ParamByName('PresupuestoValor1').AsString := frmmain.edt_PresupuestoSerie1.Text;
        ParamByName('PresupuestoValor2').AsString := frmmain.edt_PresupuestoSerie2.Text;
        ParamByName('PresupuestoValor3').AsString := frmmain.edt_PresupuestoSerie3.Text;
        ExecSQL;
      end
      else
      begin
        close;
        SQL.Clear;
        SQL.Add('INSERT INTO configuracion (id_usuario ,PresupuestoValor1, PresupuestoValor2, PresupuestoValor3) ');
        sql.Add('VALUES (:id_usuario ,:PresupuestoValor1, :PresupuestoValor2, :PresupuestoValor3) ');
        ParamByName('id_usuario').AsString := ID_usuario;
        ParamByName('PresupuestoValor1').AsString := frmmain.edt_PresupuestoSerie1.Text;
        ParamByName('PresupuestoValor2').AsString := frmmain.edt_PresupuestoSerie2.Text;
        ParamByName('PresupuestoValor3').AsString := frmmain.edt_PresupuestoSerie3.Text;
        Prepare;
        ExecSQL;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de cargaValoresSeriePresupuesto.</summary>
procedure cargaValoresSeriePresupuesto();
var
  qry: TUniQuery;
  SQLText: string;
  part1, part2, part3: string;
  npart3: Integer;
begin
  if proyectonuevo then
  begin
    qry := TUniQuery.Create(nil);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        sql.Add('select * from configuracion');
        Prepare;
        ExecSQL;
        part1 := FieldByName('PresupuestoValor1').AsString;
        part2 := FieldByName('PresupuestoValor2').AsString;
        close;
        sql.Clear;
        if not (base_activa.codBase = '') then
        begin
          SQLText := 'SELECT * FROM presupuestos_datosGenerales WHERE codBase=:codBase AND (codPresupuesto like ' + QuotedStr(part1 + '-' + part2 + '%') + ')';
          SQL.Add(SQLText);

          ParamByName('codBase').AsString := base_activa.codBase;
        end
        else
        begin
          SQLText := 'SELECT * FROM presupuestos_datosGenerales WHERE codPresupuesto LIKE ' + QuotedStr(part1 + '-' + part2 + '%');
          SQL.Add(SQLText);
        end;
        prepare;
        ExecSQL;
        Last;
        part3 := FieldByName('codPresupuesto').AsString;
        part3 := rightstr(part3, 4);
      end;

      if part1 <> '' then
      begin
        npart3 := strtointdef(part3, 0);
        Inc(npart3);
        part3 := inttostr(npart3);
        part3 := ponerCerosInicio(part3, 3);
        frmmain.edt_PresupuestoSerie1.Text := part1;
        frmmain.edt_PresupuestoSerie2.Text := part2;
        frmmain.edt_PresupuestoSerie3.Text := part3;
      end
      else
      begin
        part2 := inttostr(trunc(System.SysUtils.CurrentYear));
        frmmain.edt_PresupuestoSerie1.Text := 'GiPROY';
        frmmain.edt_PresupuestoSerie2.Text := part2;
        frmmain.edt_PresupuestoSerie3.Text := '0001';
      end;
    finally
      qry.Free;
    end;
  end;
end;

/// <summary>TODO: Descripción de generaCodigoPresupuesto.</summary>
/// <returns>TODO.</returns>
function generaCodigoPresupuesto(): string;
var
  part1, part2, part3: string;
  qry: TUniQuery;
  x: integer;
  cnt: integer;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('SELECT * FROM configuracion WHERE email=:email ');
      prepare;
      ParamByName('email').AsString := ID_usuario;
      ExecSQL;
      part1 := FieldByName('presupuestoValor1').AsString;
      part2 := FieldByName('PresupuestoValor2').AsString;
      close;
      sql.clear;
      sql.add('SELECT codPresupuesto FROM presupuestos_datosgenerales ORDER BY codPresupuesto DESC LIMIT 1');
      prepare;
      ExecSQL;
      part3 := FieldByName('codPresupuesto').AsString;
      if part3 <> '' then
      begin
        part3 := AnsiReverseString(part3);
        x := AnsiPos('-', part3);
        part3 := copy(part3, 1, x - 1);
        part3 := AnsiReverseString(part3);
        cnt := StrToIntDef(part3, 0);
      end
      else
      begin
        cnt := 0;
      end;
      inc(cnt);
      part3 := ponerCerosInicio(inttostr(cnt), 5);
      close;
      sql.Clear;
      sql.Add('UPDATE configuracion SET presupuestoValor3=:presupuestoValor3 WHERE email=:email');
      ParamByName('presupuestoValor3').AsString := part3;
      ParamByName('email').AsString := ID_usuario;
      prepare;
      ExecSQL;
    end;
  finally
    qry.free;
  end;
  result := part1 + '-' + part2 + '-' + part3;
end;

/// <summary>TODO: Descripción de generaCodigoPresupuestoNuevo.</summary>
/// <returns>TODO.</returns>
function generaCodigoPresupuestoNuevo(): string;
var
  part1, part2, part3: string;
  qry: TUniQuery;
begin
  Randomize;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('SELECT presupuestoValor1, presupuestoValor2 FROM configuracion WHERE email=:email ');
      prepare;
      ParamByName('email').AsString := ID_usuario;
      ExecSQL;
      part1 := FieldByName('presupuestoValor1').AsString;
      part2 := FieldByName('PresupuestoValor2').AsString;
    end;
  finally
    qry.free;
  end;
  part3 := 'T' + inttostr(random(99999));
  result := part1 + '-' + part2 + '-' + part3;
end;

/// <summary>TODO: Descripción de borrarPresupuesto.</summary>
/// <param name="codPresupuesto">TODO.</param>
procedure borrarPresupuesto(codPresupuesto: string);
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('DELETE FROM Presupuestos_DatosProyecto WHERE codPresupuesto=' + QuotedStr(codPresupuesto));
      Close;
      sql.Clear;
      sql.Add('DELETE FROM Presupuestos_StokeHolders WHERE codPresupuesto=' + QuotedStr(codPresupuesto));
      Close;
      sql.Clear;
      sql.Add('DELETE FROM Presupuestos_EDT WHERE codPresupuesto=' + QuotedStr(codPresupuesto));
      Close;
      sql.Clear;
      sql.Add('DELETE FROM Presupuestos_EDO WHERE codPresupuesto=' + QuotedStr(codPresupuesto));
      Close;
      sql.Clear;
      sql.Add('DELETE FROM Presupuestos_Items WHERE codPresupuesto=' + QuotedStr(codPresupuesto));
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de limpiaBaseDatos.</summary>
procedure limpiaBaseDatos();
var
  tmplst: TStringList;
begin
  tmplst := TStringList.Create;
  base_activa.codBase := '';
  base_activa.nombre := '';
  base_activa.Descripcion := '';
  base_activa.indirectos := 0;
  base_activa.TRendimiento := '';
  base_activa.UMedida := '';
  base_activa.pais := '';
  base_activa.SeguridadIndustrial := False;
  base_activa.moneda := '';
  base_activa.simboloMoneda := '';
  base_activa.observaciones := '';
  tmplst.Text := '';
  base_activa.BasesPadres := tmplst;
  frmMain.lbl_BaseActiva.Text := '';
  codProyecto := '';
  revision := '';
end;

/// <summary>TODO: Descripción de CargaProyecto.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function CargaProyecto(codBase: string): string;
var
  qry: TUniQuery;
  img: Tbitmap;
  x: Integer;
  Stream: TMemoryStream;
  tmpstr: string;
  listadoAnotaciones: array of dat_anotaciones;
  correcto: Boolean;
  errorPos: integer;
  errorsite: string;
begin
  frmmain.rct_1Presupuesto.Fill.Color := $FFE94E1B;
  frmmain.rct_1Presupuesto.Fill.Color := $FF606060;
  frmmain.rct_2Presupuesto.Fill.Color := $FF606060;
  frmmain.rct_3Presupuesto.Fill.Color := $FF606060;
  frmmain.rct_4Presupuesto.Fill.Color := $FF606060;
  frmmain.rct_5Presupuesto.Fill.Color := $FFE94E1B;
  frmmain.rct_6Presupuesto.Fill.Color := $FF606060;
  frmmain.rct_7Presupuesto.Fill.Color := $FF606060;
  frmmain.rct_8Presupuesto.Fill.Color := $FF606060;

  correcto := True;
  errorPos := 1;
  frmmain.iGlow_OPC2_CrearPresupuesto.Enabled := True;

  {Cargar Datos Generales}
  errorsite := 'Datos Generales';
  if correcto then
  begin
    correcto := activa_DatosGeneralesProyecto(codBase);
    Inc(errorPos);
  end;

  {Cargar Datos Proyecto}
  if correcto then
  begin
    correcto := cargar_DatosProyecto(codBase);
    Inc(errorPos);
    errorsite := 'Datos Proyecto';
  end;

  {Cargar Stakeholders Disponibles}
  if correcto then
  begin
    correcto := cargar_StakeHolders(codBase);
    inc(errorPos);
    errorsite := 'Datos Stake Disponibles';
  end;

  {Cargar Datos EDO}
  if correcto then
  begin
    correcto := cargar_EDO(codBase);
    Inc(errorPos);
    errorsite := 'EDO';
  end;

  {Cargar Datos EDT}
  if correcto then
  begin
    correcto := cargar_EDT(codBase);
    Inc(errorPos);
    errorsite := 'EDT';
  end;

  {Cargar Indirectos}
  if correcto then
  begin
    correcto := cargar_indirectos(codBase);
    Inc(errorPos);
    errorsite := 'Indirectos';
  end;

  {Cargar Items Presupuesto}
  if correcto then
  begin
    correcto := cargar_Items(codBase);
    inc(errorPos);
    errorsite := 'Items Presupuestos';
  end;

  if correcto then
  begin
    DMPresupuesto.activar_presupuesto;
  end;

  {Cargar Anotaciones Presupuesto}
  if correcto then
  begin
    correcto := cargarAnotaciones(codBase);
    inc(errorPos);
    errorsite := 'Anotaciones';
  end;
  if correcto then
  begin
    frmMain.tbc_PreciosUnitarios.ActiveTab := frmMain.tab_PresupuestosGeneral;
    frmMain.tbcPresupuestos.ActiveTab := frmMain.tab_1PresupuestoDatos;
    Inc(errorPos);
    errorsite := 'Posicionamiento Inicial';
  end;
  if correcto then
  begin
    cargaImagenesProyecto;
    inc(errorPos);
    errorsite := 'Imagenes Proyecto';
  end;
  {Cargar Configuración de Reportes}
  if correcto then
  begin
    cargarConfiguracionReportes();
    inc(errorPos);
    errorsite := 'Configuración Reportes';
  end;

  // cargar indices de tabla de formula polinomica (necesario para que no se borre valores adicionales)

  if correcto then
  begin
    cargaTablaIndicesSeleccionados('TODOS');
  end;

  if correcto then
  begin
    DMPresupuesto.QNumeroDeItemsPresupuesto.close;
    DMPresupuesto.QNumeroDeItemsPresupuesto.ParamByName('codBase').AsString := base_activa.codBase;
    DMPresupuesto.QNumeroDeItemsPresupuesto.ParamByName('codPresupuesto').AsString := codProyecto;
    DMPresupuesto.QNumeroDeItemsPresupuesto.ParamByName('revision').AsString := revision;
    DMPresupuesto.QNumeroDeItemsPresupuesto.Execute;
    if DMPresupuesto.QNumeroDeItemsPresupuestoNItemsPresupuesto.AsInteger = 0 then
      DMPresupuesto.sincronizaEdt2Presupuesto;
    Result := '0';
  end
  else
    result := inttostr(errorPos) + ' - ' + errorsite;
end;

/// <summary>TODO: Descripción de cargarTablaIndicesFPolinomica.</summary>
/// <returns>TODO.</returns>
function cargarTablaIndicesFPolinomica(): Boolean;
begin
  Result := False;
  try
    Result := True;
  except
    Result := False;
  end;
end;

/// <summary>TODO: Descripción de cargaImagenesProyecto.</summary>
procedure cargaImagenesProyecto();
var
  imagenReferenciaProyecto: string;
begin
  imagenReferenciaProyecto := dirImagenReferencia + base_activa.codBase + codProyecto + '.jpg';
  if not FileExists(imagenReferenciaProyecto) then
  begin
    imagenReferenciaProyecto := dirImagenReferencia + base_activa.codBase + codProyecto + '.png';
  end;
  if FileExists(imagenReferenciaProyecto) then
    frmMain.imgReferencial.Bitmap.LoadFromFile(imagenReferenciaProyecto);
end;

/// <summary>TODO: Descripción de addImagenesReferencia.</summary>
procedure addImagenesReferencia();
var
  OpenDialog: TOpenDialog;
  imagenSeleccionada: string;
  imagenReferenciaProyecto: string;
begin
  OpenDialog := TOpenDialog.Create(nil);
  try
    OpenDialog.Filter := 'Archivos de imagen|*.jpg;*.png';
    if OpenDialog.Execute then
    begin
      imagenSeleccionada := OpenDialog.FileName;
      if (imagenSeleccionada <> '') and (FileExists(imagenSeleccionada)) then
      begin
        if not DirectoryExists(dirImagenReferencia) then
          CreateDir(PWideChar(dirImagenReferencia));
        imagenReferenciaProyecto := base_activa.codBase + codProyecto + ExtractFileExt(imagenSeleccionada);
        CopyFile(PWideChar(imagenSeleccionada), PWideChar(dirImagenReferencia + imagenReferenciaProyecto), False);
      end;
    end;
  finally
    OpenDialog.Free;
    cargaImagenesProyecto();
  end;
end;

/// <summary>TODO: Descripción de exportaImagenRevisiones.</summary>
/// <param name="codProyecto">TODO.</param>
/// <param name="revision">TODO.</param>
/// <param name="nuevarevision">TODO.</param>
procedure exportaImagenRevisiones(codProyecto, revision, nuevarevision: string);
var
  imgReferencial, imgGeoReferencia: string;
  NimgReferencial, NimgGeoReferencia: string;
  extension: string;
  x: integer;
  tmpstr: string;
begin
  imgReferencial := dirImagenReferencia + '\' + 'imgREF' + codProyecto + '-' + revision;
  imgGeoReferencia := dirGeoreferencia + '\' + 'imgGEO' + codProyecto + '-' + revision;
  tmpstr := ReverseString(imgReferencial);
  x := AnsiPos('-', tmpstr);
  tmpstr := Copy(tmpstr, x + 1, length(tmpstr));
  tmpstr := ReverseString(tmpstr);
  tmpstr := tmpstr + '-' + nuevarevision;

  if FileExists(imgReferencial + '.jpg') then
  begin
    NimgReferencial := tmpstr;
    imgReferencial := imgReferencial + '.jpg';
    NimgReferencial := NimgReferencial + '.jpg';
  end
  else if FileExists(imgReferencial + '.png') then
  begin
    NimgReferencial := tmpstr;
    imgReferencial := imgReferencial + '.png';
    NimgReferencial := NimgReferencial + '.png';
  end;

  tmpstr := ReverseString(imgGeoReferencia);
  x := AnsiPos('-', tmpstr);
  tmpstr := Copy(tmpstr, x + 1, length(tmpstr));
  tmpstr := ReverseString(tmpstr);
  tmpstr := tmpstr + '-' + nuevarevision;
  if FileExists(imgGeoReferencia + '.jpg') then
  begin
    NimgGeoReferencia := tmpstr;
    imgGeoReferencia := imgGeoReferencia + '.jpg';
    NimgGeoReferencia := NimgGeoReferencia + '.jpg';
  end
  else if FileExists(imgGeoReferencia + '.png') then
  begin
    NimgGeoReferencia := tmpstr;
    imgGeoReferencia := imgGeoReferencia + '.png';
    NimgGeoReferencia := NimgGeoReferencia + '.png';
  end;

  if FileExists(imgReferencial) then
  begin
    if FileExists(NimgReferencial) then
      DeleteFile(PWideChar(NimgReferencial));
    TFile.Copy(imgReferencial, NimgReferencial);
  end;

  if FileExists(imgGeoReferencia) then
  begin
    if FileExists(NimgGeoReferencia) then
      DeleteFile(PWideChar(NimgGeoReferencia));
    TFile.Copy(imgGeoReferencia, NimgGeoReferencia);
  end;
end;

/// <summary>TODO: Descripción de cargarAnotaciones.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargarAnotaciones(codBase: string): Boolean;
var
  qry: TUniQuery;
  tmpstr: string;
  x: integer;
  stream: TMemoryStream;
  listadoAnotaciones: array of dat_anotaciones;
  sqlstr: string;
begin
  qry := TUniQuery.Create(nil);
  stream := TMemoryStream.Create;
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        Close;
        sql.Clear;
        sqlstr := 'SELECT * FROM presupuestos_Anotaciones WHERE codPresupuesto=' + QuotedStr(codProyecto) + ' AND revision=' + QuotedStr(revision);
        if codBase <> '' then
          sqlstr := sqlstr + ' AND codBase=' + QuotedStr(codBase);
        sql.Add(sqlstr);
        Prepare;
        ExecSQL;
        x := 0;
        setlength(listadoAnotaciones, x);
        while not Eof do
        begin
          setlength(listadoAnotaciones, x + 1);
          listadoAnotaciones[x].idItem := FieldByName('idItem').AsString;
          listadoAnotaciones[x].fecha := FieldByName('fecha').AsDatetime;
          listadoAnotaciones[x].codEDT := FieldByName('codEdt').AsString;
          listadoAnotaciones[x].paquete := FieldByName('paquete').AsString;
          listadoAnotaciones[x].descripcion := FieldByName('descripcion').AsString;
          listadoAnotaciones[x].nota := FieldByName('nota').AsString;
          listadoAnotaciones[x].autor := FieldByName('autor').AsString;
          listadoAnotaciones[x].tipoNota := FieldByName('tipoNota').AsString;
          listadoAnotaciones[x].notaReferencia := FieldByName('notaReferencia').AsString;
          Inc(x);
          Next;
        end;
        Close;
        sql.Clear;
        sql.Add('DELETE FROM Tanotaciones');
        Prepare;
        ExecSQL;
        Close;
        sql.Clear;
        sqlstr := 'INSERT INTO Tanotaciones (idItem, fecha, codEdt, paquete, descripcion, nota, autor, tipoNota, notaReferencia) ';
        sqlstr := sqlstr + 'VALUES (:idItem, :fecha, :codEdt, :paquete, :descripcion, :nota, :autor, :tipoNota, :notaReferencia)';
        sql.Add(sqlstr);
        Prepare;
        for x := 0 to length(listadoAnotaciones) - 1 do
        begin
          ParamByName('idItem').AsString := listadoAnotaciones[x].idItem;
          ParamByName('fecha').AsDateTime := listadoAnotaciones[x].fecha;
          ParamByName('codEdt').AsString := listadoAnotaciones[x].codEDT;
          ParamByName('paquete').AsString := listadoAnotaciones[x].paquete;
          ParamByName('descripcion').AsString := listadoAnotaciones[x].descripcion;
          ParamByName('nota').AsString := listadoAnotaciones[x].nota;
          ParamByName('autor').AsString := listadoAnotaciones[x].autor;
          ParamByName('tipoNota').AsString := listadoAnotaciones[x].tipoNota;
          ParamByName('notaReferencia').AsString := listadoAnotaciones[x].notaReferencia;
          ExecSQL;
        end;

        // Anotaciones p2
        Close;
        stream := TMemoryStream.Create;
        sql.Clear;
        sqlstr := 'SELECT * FROM Presupuestos_AnotacionesP2 WHERE codPresupuesto=' + QuotedStr(codProyecto) + ' AND revision=' + QuotedStr(revision);
        if codBase <> '' then
          sqlstr := sqlstr + ' AND codBase=' + QuotedStr(codBase);
        sql.Add(sqlstr);
        Prepare;
        ExecSQL;
        tmpstr := FieldByName('DatosAnotaciones').AsString;
        if tmpstr <> '' then
        begin
          WriteStreamStr(stream, tmpstr);
          stream.Position := 0;
          frmVisorNotas.Trvw_VisorAnotaciones.LoadFromJSONStream(stream);
        end;
        result := True;
      end;
    finally
      qry.free;
      stream.free;
    end;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de cargar_Items.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargar_Items(codBase: string): Boolean;
var
  qry: TUniQuery;
begin
  qry := Tuniquery.create(nil);
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        addlog('G1');
        sql.Clear;
        sql.Add('DELETE FROM presupuestos_items_trabajo WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision');
        ParamByName('codbase').AsString := codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        Prepare;
        ExecSQL;
        addlog('G2');
        close;
        sql.Clear;
        addlog('G3');
        {(*}
        sql.Add(  'INSERT INTO presupuestos_items_trabajo SELECT ' +
                  '* ' +
                  'FROM ' +
                  'presupuestos_items ' +
                  'WHERE ' +
                  'codBase = :codBase ' +
                  'AND codPresupuesto = :codPresupuesto ' +
                  'AND revision = :revision');
          {*)}
        ParamByName('codbase').AsString := codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        Prepare;
        ExecSQL;
        addlog('G4');
        Result := True;
      end;
      with DMPresupuesto.QTPresupuestosItems do
      begin
        ParamByName('icodBase').AsString := base_activa.codBase;
        ParamByName('icodPresupuesto').AsString := codProyecto;
        ParamByName('iRevision').AsString := revision;
        Execute;
        addlog('G5');
      end;
    finally
      DMPresupuesto.activaSubcategoriayApusPresupuesto;
      addlog('G6');
      frmMain.dbGridConnect_TPresupuestosItems.DataSource := DMPresupuesto.dsTpresupuestosItems;
      DMPresupuesto.QTPresupuestosItems.Active := True;
      DMPresupuesto.dsTpresupuestosItems.Enabled := True;
      frmMain.dbGridConnect_TPresupuestosItems.Enabled := True;
      addlog('G7');
      DMPresupuesto.calculaTotal;
      addlog('G8');
      qry.Free;
    end;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de cargar_indirectos.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargar_indirectos(codBase: string): Boolean;
var
  qry: TUniQuery;
  tmpstr: string;
  x: integer;
  sqlstr: string;
begin
  qry := Tuniquery.create(nil);
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        sqlstr := 'SELECT * FROM presupuestos_indirectos WHERE codPresupuesto=' + QuotedStr(codProyecto) + ' AND revision=' + QuotedStr(revision);
        if codBase <> '' then
          sqlstr := sqlstr + ' AND codBase=' + QuotedStr(codBase);
        sql.Add(sqlstr);
        Prepare;
        ExecSQL;
        x := 0;
        setlength(listadoIndirectos, x);
        while not Eof do
        begin
          setlength(listadoIndirectos, x + 1);
          listadoIndirectos[x].cuenta := FieldByName('cuenta').AsString;
          listadoIndirectos[x].codCuenta := FieldByName('codCuenta').AsString;
          listadoIndirectos[x].observaciones := FieldByName('observaciones').AsString;
          listadoIndirectos[x].porcentaje := FieldByName('valor').AsString;
          Inc(x);
          Next;
        end;
        result := true;
      end;
    finally
      qry.Free;
    end;
  except
    result := false;
  end;
end;

/// <summary>TODO: Descripción de activa_DatosGeneralesProyecto.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function activa_DatosGeneralesProyecto(codBase: string): Boolean;
var
  qry: TUniQuery;
  tmpstr: string;
  sqlstr: string;
  tndecimales, tnmoneda: integer;
begin
  qry := TUniQuery.Create(nil);
  addlog('Pos 1');
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        sqlstr := 'SELECT  * FROM presupuestos_datosGenerales WHERE codPresupuesto=' + QuotedStr(codProyecto) + ' AND revision=' + QuotedStr(revision);
        if codBase <> '' then
          sqlstr := sqlstr + ' and codBase=' + QuotedStr(codBase);
        sql.Add(sqlstr);
        Prepare;
        ExecSQL;
        frmmain.lbl_SubtotalPresupuesto.Text := FieldByName('subtotal').AsString;
        frmmain.lbl_CantIVAPresupuestos.Text := FieldByName('iva').AsString;
        frmmain.lbl_TotalIVAPresupuestos.Text := FieldByName('total').AsString;
        frmmain.edt_porcentajeIVANuevoPresupuesto.Text := floattostr(fieldbyname('porcentajeIVA').AsFloat);
        tmpstr := FieldByName('indirectos').AsString;
        tmpstr := decimal_correcto(tmpstr);
        IndirectosPresupuesto := StrToFloatdef(tmpstr, 15);
        frmMain.lbl_PresupuestoDiferenciaPorcentaje.Text := tmpstr + '%';
        codBase := FieldByName('codBase').AsString;
        ndecimalesPresupuesto := FieldByName('ndecimales').AsInteger;
        ndecimalesMoneda := FieldByName('ndecimalesMoneda').AsInteger;
        tndecimales := ndecimalesPresupuesto;
        tnmoneda := ndecimalesMoneda;
      end;
      result := True;
      addlog('Pos 2');
    finally
      if codBase <> '' then
        activaBaseDatos(codBase);
      addlog('Pos 3');
      ndecimalesPresupuesto := tndecimales;
      ndecimalesMoneda := tnmoneda;
      addlog('Pos 4');
      crearCadenacurrency;
      addlog('Pos 5');
      actualizaEstadoDecimales();
      // formato de presentacion de numero de grid items
      addlog('Pos 6');
      DMPresupuesto.QTPresupuestosItemsCantidad.DisplayFormat := cadenaDecimales;
      // '#,##0.00';
      DMPresupuesto.QTPresupuestosItemsPUnitario.DisplayFormat := cadenaCurrency;
      DMPresupuesto.QTPresupuestosItemsPtotal.DisplayFormat := cadenaCurrency;
      DMPresupuesto.qryParetoCantidad.DisplayFormat := '#.##';
      DMPresupuesto.qryParetoPUnitario.DisplayFormat := cadenaCurrency;
      DMPresupuesto.qryParetoPtotal.DisplayFormat := cadenaCurrency;
      DMPresupuesto.qryPCapituloCantidad.DisplayFormat := '#.##';
      DMPresupuesto.qryPCapituloPUnitario.DisplayFormat := cadenaCurrency;
      DMPresupuesto.qryPCapituloPtotal.DisplayFormat := cadenaCurrency;
      qry.Free;
      addlog('Pos 7');
    end;
  except
    Result := false;
  end;
end;

/// <summary>TODO: Descripción de cargar_EDT.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargar_EDT(codBase: string): Boolean;
type
  datNodo = record
    codEDT: string;
    descripcion: string;
    Responsable: string;
    Definicion: string;
    codigoUnicoItemPresupuesto: string;
  end;

  /// <summary>TODO: Descripción de daCodigoNodoPadre.</summary>
  /// <param name="Datos">TODO.</param>
  /// <returns>TODO.</returns>

  function daCodigoNodoPadre(Datos: string): string;
  var
    x: integer;
  begin
    Datos := AnsiReverseString(Datos);
    x := AnsiPos('.', Datos);
    Datos := Copy(Datos, x + 1, Length(Datos));
    Datos := AnsiReverseString(Datos);
    result := Datos;
  end;

var
  qry: TUniQuery;
  nodobase, nodo, subnodo: TTMSFNCTreeViewNode;
  datosNodo: array of datNodo;
  codEDTPadre: string;
  x, y: integer;
begin
  qry := TUniQuery.Create(nil);
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        {(*}
        sql.add(  'SELECT ' +
                  'CodEDT, ' +
                  'Descripcion, ' +
                  'Responsable, ' +
                  'Definicion, ' +
                  'codUnicoItemPresupuesto ' +
                  'FROM ' +
                  'presupuestos_edt ' +
                  'WHERE ' +
                  'codBase = :codBase ' +
                  'AND codPresupuesto = :codPresupuesto ' +
                  'AND Revision =:Revision');
          {*)}
        parambyname('codbase').AsString := base_activa.codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ExecSQL;
        x := 0;
        while not Eof do
        begin
          SetLength(datosNodo, x + 1);
          datosNodo[x].codEDT := FieldByName('codEDT').AsString;
          datosNodo[x].descripcion := FieldByName('Descripcion').AsString;
          datosNodo[x].responsable := FieldByName('Responsable').AsString;
          datosNodo[x].Definicion := FieldByName('Definicion').AsString;
          datosNodo[x].codigoUnicoItemPresupuesto := FieldByName('codUnicoItemPresupuesto').AsString;
          Inc(x);
          Next;
        end;
        // Generar TreeView
        frmMain.trvw_edt.ClearNodes;
        if Length(datosNodo) > 0 then
        begin
          nodobase := frmmain.Trvw_EDT.addnode;
          nodobase.Text[1] := frmMain.edt_descripcionPresupuesto.Text;
        end;
        for x := 0 to length(datosNodo) - 1 do
        begin
          y := datosNodo[x].codEDT.CountChar('.');
          if y = 0 then
          begin
            subnodo := frmMain.Trvw_EDT.AddNode(nodobase);
          end
          else
          begin
            codEDTPadre := daCodigoNodoPadre(datosNodo[x].codEDT);
            nodo := posicionaNodoDesc(frmMain.Trvw_EDT, codEDTPadre, 0, true);
            subnodo := frmmain.Trvw_EDT.AddNode(nodo);
          end;
          subnodo.Text[0] := datosNodo[x].codEDT;
          subnodo.text[1] := datosNodo[x].descripcion;
          subnodo.text[2] := datosNodo[x].Responsable;
          subnodo.Text[3] := datosNodo[x].Definicion;
          subnodo.Text[4] := datosNodo[x].codigoUnicoItemPresupuesto;
        end;

        result := true;
        frmMain.Trvw_EDT.ExpandAll;
      end;
    except
      Result := False;
    end;
  finally
    qry.free;
  end;
end;

/// <summary>TODO: Descripción de cargar_EDO.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargar_EDO(codBase: string): Boolean;
var
  nodo: TTMSFNCTreeViewNode;
begin
  Result := False;
  try
    frmmain.Trvw_EDO.ClearNodes;
    nodo := frmMain.Trvw_EDO.AddNode;
    nodo.Text[0] := frmMain.edt_descripcionPresupuesto.Text;
    nodo.Extended := true;
    cargarHitoTreeView;
    cargarEDOCompleta;
    result := True;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de cargar_StakeHolders.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargar_StakeHolders(codBase: string): Boolean;
var
  qry: TUniQuery;
  tmpstr: string;
  Tfecha: Tdate;
  x: integer;
  sqlstr: string;
begin
  qry := TUniQuery.Create(nil);
  limpiaGridStakeAsignados;

  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        sql.Clear;
        sqlstr := 'SELECT * FROM Presupuestos_stakeHolders WHERE codPresupuesto=' + QuotedStr(codProyecto) + ' AND revision=' + QuotedStr(revision);
        if codBase <> '' then
          sqlstr := sqlstr + ' and codBase=' + QuotedStr(codBase);
        sql.Add(sqlstr);
        Prepare;
        ExecSQL;
        x := 1;
        while not Eof do
        begin
          frmmain.grid_stakesAsignados.RowCount := x + 1;
          frmMain.grid_stakesAsignados.Cells[0, x] := FieldByName('idGrid').AsString;
          frmmain.grid_stakesAsignados.Cells[1, x] := FieldByName('idFiscal').AsString;
          frmmain.grid_stakesAsignados.Cells[2, x] := FieldByName('nombre').AsString;
          frmmain.grid_stakesAsignados.Cells[3, x] := FieldByName('apellidos').AsString;
          frmmain.grid_stakesAsignados.cells[4, x] := FieldByName('email').AsString;
          frmmain.grid_stakesAsignados.Cells[5, x] := FieldByName('titulacion').AsString;
          frmmain.grid_stakesAsignados.Cells[6, x] := FieldByName('rolpresupuesto').AsString;
          frmMain.grid_stakesAsignados.cells[7, x] := FieldByName('idUnico').AsString;
          Inc(x);
          Next;
        end;
        result := True;
      end;
    finally
      qry.Free;
    end;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de asignarDBProyecto.</summary>
/// <param name="codProyecto">TODO.</param>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function asignarDBProyecto(codProyecto, codBase: string): Boolean;
var
  qry: TUniQuery;
begin
  Result := False;
  qry := TUniQuery.Create(nil);
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_Anotaciones set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_AnotacionesP2 set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_asignacionTerminos set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_Cronogramas set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_DatosGenerales set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_DatosProyecto set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_Desagregacion set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_EDO set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_EDT set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_Fpolinomica set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_indicesSeleccionados set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_indirectos set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_items set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_NotasRevision set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update presupuestos_Recursos set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        close;
        SQL.Clear;
        Sql.Add('update Presupuestos_StakeHolders set codBase=:codBase where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr('0'));
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ExecSQL;
        Result := True;
      end;
    finally
      qry.free
    end;
  except
    Result := False;
  end;
end;

/// <summary>TODO: Descripción de cargar_DatosProyecto.</summary>
/// <param name="codBase">TODO.</param>
/// <returns>TODO.</returns>
function cargar_DatosProyecto(codBase: string): Boolean;
var
  qry: TUniQuery;
  tmpstr: string;
  Tfecha: Tdate;
  img: TBitmap;
  sqlstr: string;
begin
  qry := TUniQuery.Create(nil);
  img := TBitmap.Create;
  addlog('Pos B1');
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        sql.Clear;
        sqlstr := 'SELECT * FROM presupuestos_datosProyecto WHERE codPresupuesto=' + QuotedStr(codProyecto) + ' AND revision=' + QuotedStr(revision);
        if codBase <> '' then
          sqlstr := sqlstr + ' and codBase=' + QuotedStr(codBase);
        sql.Add(sqlstr);
        Prepare;
        ExecSQL;
        addlog('Pos B2');
        frmMain.edt_CodigoPresupuesto1.Text := codProyecto;
        frmMain.lbl_RevisionPresupuesto.Text := revision;
        frmMain.edt_descripcionPresupuesto.Text := FieldByName('descripcion').AsString;
        frmMain.edt_NPresupuestoCodReferencial.Text := FieldByName('codReferencial').AsString;
        tmpstr := FieldByName('TipoProyecto').AsString;
        posicionaCombo(frmMain.cbb_TProyectosPrespuesto, tmpstr);
        tmpstr := FieldByName('categoria').AsString;
        posicionaCombo(frmMain.cbb_CategoriaPresupuesto, tmpstr);
        tmpstr := FieldByName('TipoConstruccion').AsString;
        posicionaCombo(frmMain.cbb_TConstruccion, tmpstr);
        tmpstr := FieldByName('ambitoContratacion').AsString;
        posicionaCombo(frmMain.cbb_ambitoContratacion, tmpstr);
        tmpstr := FieldByName('TipoContrato').AsString;
        addlog('Pos B3');
        posicionaCombo(frmMain.cbb_TipoContrato, tmpstr);
        frmMain.edt_AreaTerrenoPresupuesto.Text := FieldByName('ATerreno').AsString;
        frmMain.edt_AConstruccionPresupuesto.Text := FieldByName('AConstruccion').AsString;
        frmMain.dedt_PresentacionPresupuesto.Date := FieldByName('fechaInicio').AsDateTime;
        tmpstr := FieldByName('PlazoEjecucion').AsString;
        frmmain.edt_PlazoEjecucionPresupuesto.Text := tmpstr;
        frmMain.lbl_PresupuestoFinalizacion.Text := FormatDateTime('dd/mm/yyyy', FieldByName('FechaFinalizacion').AsDateTime);
        frmMain.edt_NPresupuestoDireccion.Text := FieldByName('direccion').AsString;
        frmMain.edt_NPresupuestoCiudad.Text := FieldByName('ciudad').AsString;
        frmMain.edt_NPresupuestoProvincia.Text := fieldbyname('Provincia').AsString;
        addlog('Pos B4');
        tmpstr := FieldByName('pais').AsString;
        posicionaCombo(frmMain.cbb_paisNPresupuesto, tmpstr);
        frmMain.mmo_ObjetoPresupuesto.Text := FieldByName('ObjetoContrato').AsString;
        frmMain.edt_ValidezPresupuesto.Text := decimal_correcto(FieldByName('ValidezPropuesta').AsString);
        addlog('Pos B5');
        tmpstr := FieldByName('latitud').AsString;
        if tmpstr <> '' then
        begin
          frmmain.edt_Latitud.Text := tmpstr;
          frmMain.lbl_nProyectoLatitud.Text := 'Latitud: ' + tmpstr;
        end
        else
        begin
          frmMain.edt_Latitud.Text := '0';
        end;
        addlog('Pos B6');
        tmpstr := FieldByName('longitud').AsString;
        if tmpstr <> '' then
        begin
          frmmain.edt_longitud.text := tmpstr;
        end
        else
        begin
          frmmain.edt_longitud.text := '0';
        end;
        Addlog('Pos B7');
        result := True;
      end;
    finally
      qry.Free;
      img.Free;
    end;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de ReadStreamInt.</summary>
/// <param name="Stream">TODO.</param>
/// <returns>TODO.</returns>
function ReadStreamInt(Stream: TStream): Integer;
{ returns an integer from stream }
begin
  Stream.ReadBuffer(result, SizeOf(Integer));
end;

/// <summary>TODO: Descripción de ReadStreamStr.</summary>
/// <param name="Stream">TODO.</param>
/// <returns>TODO.</returns>
function ReadStreamStr(Stream: TStream): string;
var
  SS: TStringStream;
begin
  if Stream <> nil then
  begin
    SS := TStringStream.Create('');
    try
      SS.CopyFrom(Stream, 0); // No need to position at 0 nor provide size
      result := SS.DataString;
    finally
      SS.Free;
    end;
  end
  else
  begin
    result := '';
  end;
end;

procedure WriteStreamStr(Stream: TStream; Str: string);
{ writes a string to the stream }

var
  StringStream: TStringStream;
begin
  StringStream := TStringStream.Create(Str);
  try
    Stream.CopyFrom(StringStream, 0);
  finally
    StringStream.Free;
  end;
end;

procedure WriteStreamInt(Stream: TStream; Num: Integer);
{ writes an integer to the stream }
begin
  Stream.WriteBuffer(Num, SizeOf(Integer));
end;

/// <summary>TODO: Descripción de ReservarCodPresupuesto.</summary>
procedure ReservarCodPresupuesto();
var
  part1, part2, part3: string;
  qry: TUniQuery;
  x: Integer;
  codProyectoT: string;
begin
  codProyectoT := codProyecto;
  x := AnsiPos('-', codProyectoT);
  part1 := Copy(codProyectoT, 1, x - 1);
  codProyectoT := Copy(codProyectoT, x + 1, length(codProyectoT));
  x := AnsiPos('-', codProyectoT);
  part2 := Copy(codProyectoT, 1, x - 1);
  part3 := Copy(codProyectoT, x + 1, length(codProyectoT));
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('UPDATE configuracion SET PresupuestoValor1=:PresupuestoValor1, PresupuestoValor2=:PresupuestoValor2, PresupuestoValor3=:PresupuestoValor3');
      sql.Add(' WHERE id_usuario=' + QuotedStr(ID_usuario));
      Prepare;
      ParamByName('PresupuestoValor1').AsString := part1;
      ParamByName('PresupuestoValor2').AsString := part2;
      ParamByName('PresupuestoValor3').AsString := part3;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de GuardarProyecto.</summary>
procedure GuardarProyecto();
var
  qry: TUniQuery;
  tmpstr: string;
  fechaCreacion: Tdatetime;
  correcto: Boolean;
  errorPos: integer;
begin
  guardando := True;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      // Iniciar presupuestos
      if not proyectoNuevo then
      begin
        Close;
        sql.Clear;
        sql.Add('SELECT * FROM Presupuestos_datosProyecto WHERE codPresupuesto=' + QuotedStr(codProyecto) + ' AND revision=' + QuotedStr(revision) + ' AND codBase=' + QuotedStr(base_activa.codBase));
        Prepare;
        ExecSQL;
        fechaCreacion := FieldByName('fechaHoraCreacion').AsDatetime;
      end
      else
      begin
        codProyecto := generaCodigoPresupuesto;
        fechaCreacion := Now;
      end;
      errorPos := 0;
      correcto := True;
      {Inicializacion y borrado inicial de datos antiguos}
      if correcto then
      begin
        correcto := borrado_tablasProyecto();
        Inc(errorPos);
      end;

      {Guardar Datos Generales}
      if correcto then
      begin
        correcto := Guardar_DatosGenerales(fechaCreacion);
        Inc(errorPos);
      end;

      {Guardar Datos Proyecto}
      if correcto then
      begin
        correcto := Guardar_DatosProyecto(fechaCreacion);
        Inc(errorPos);
      end;

      {Guardar StakeHolders}
      if correcto then
      begin
        correcto := Guardar_StakeHolders();
        Inc(errorPos);
      end;

      {Guardar EDO}
      if correcto then
      begin
        correcto := Guardar_EDO();
        Inc(errorPos);
      end;

      {Guardar EDT}
      if correcto then
      begin
        correcto := Guardar_EDT();
        Inc(errorPos);
      end;

      {Guardar Indirectos}
      if correcto then
      begin
        correcto := Guardar_Indirectos;
        Inc(errorPos);
      end;

      {Guardar Items del Presupuesto}
      if correcto then
      begin
        correcto := guardar_ItemsPresupuesto;
        Inc(errorPos);
      end;

      {Guardar Anotaciones}
      if correcto then
      begin
        correcto := guardar_Anotaciones;
        Inc(errorPos);
      end;

      {Guardar Cronogramas}
      // Ejecucion en tiempo Real no es necesario guardar datos
      // Guardar datos de derivacion de cronogramas.... Revisar rutina de sincronización
      Inc(errorPos);

      {Guardar Desagregacion}
      // codigos CPC Generados en tiempo Real, ¿es necesario aislarlo?
      Inc(errorPos);

      {Guardar Formula Polinomica}
      // Guardar def de indices, resto se genera en tiempo real
      if correcto then
      begin
        correcto := guardaTablaIndicesSeleccionados();
        Inc(errorPos);
      end;
      if correcto then
      begin
        try
          guardarConfiguracionReportes();
          correcto := True;
        except
          correcto := False;
        end;
      end;

      {Actualizar Datos Generales}
      with Dmodule_1.unsql_ActualizarDatosGenerales do
      begin
        parambyname('icodPresupuesto').AsString := codProyecto;
        Parambyname('iRevision').AsString := revision;
        Parambyname('iCodBase').AsString := base_activa.codBase;
        execute;
      end;
    end;
  finally
    qry.Free;
    guardando := False;
  end;
end;

/// <summary>TODO: Descripción de proyectoGuardado.</summary>
/// <returns>TODO.</returns>
function proyectoGuardado(): Boolean;
var
  qry: TUniQuery;
  proyectoGuardado: Boolean;
  tmpstr: string;
  codBase: string;
begin
  qry := TUniQuery.Create(nil);
  codBase := base_activa.codBase;
  proyectoGuardado := false;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      sql.Add('SELECT * FROM Presupuestos_DatosGenerales WHERE codBase=' + QuotedStr(codBase) + ' AND codPresupuesto=' + QuotedStr(codProyecto) + ' AND revision=' + QuotedStr(revision));
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('codPresupuesto').AsString;
      if tmpstr <> '' then
        proyectoGuardado := True;
    end;
  finally
    qry.Free;
  end;
  Result := proyectoGuardado;
end;

/// <summary>TODO: Descripción de ProyectocumpleRequisitosMinimos.</summary>
/// <returns>TODO.</returns>
function ProyectocumpleRequisitosMinimos(): Boolean;
var
  cumpleRequisitos: Boolean;
begin
  cumpleRequisitos := True;
  if frmmain.edt_descripcionPresupuesto.Text = '' then
    cumpleRequisitos := False;
  if frmMain.edt_AreaTerrenoPresupuesto.Text = '' then
    cumpleRequisitos := False;
  if frmMain.edt_AConstruccionPresupuesto.Text = '' then
    cumpleRequisitos := False;
  if frmMain.edt_NPresupuestoDireccion.Text = '' then
    cumpleRequisitos := False;
  if frmMain.edt_NPresupuestoCiudad.Text = '' then
    cumpleRequisitos := false;
  if frmMain.edt_NPresupuestoProvincia.Text = '' then
    cumpleRequisitos := false;
  if frmMain.mmo_ObjetoPresupuesto.Text = '' then
    cumpleRequisitos := False;
  if base_activa.codBase = '' then
    cumpleRequisitos := False;
  Result := cumpleRequisitos;
end;

/// <summary>TODO: Descripción de borrado_tablasProyecto.</summary>
/// <returns>TODO.</returns>
function borrado_tablasProyecto(): boolean;
var
  qry: TUniQuery;
  x: integer;
  codBase: string;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  codBase := base_activa.codBase;
  Result := False;
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        // Borrado tabla datos Generales 28112013 revisada
        Close;
        sql.Clear;
        sql.Add('DELETE FROM presupuestos_datosProyecto');
        sql.Add('WHERE codPresupuesto = :codPresupuesto');
        sql.Add('  AND revision = :revision');
        sql.Add('  AND codBase = :codBase');

        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;

        Prepare;
        ExecSQL;


        // Borrado Tabla stakeHolders 28112013 revisada
        Close;
        sql.Clear;
        sql.Add('DELETE FROM Presupuestos_StakeHolders');
        sql.Add('WHERE codPresupuesto = :codPresupuesto');
        sql.Add('  AND revision = :revision');
        sql.Add('  AND codBase = :codBase');

        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;

        Prepare;
        ExecSQL;



        // Borrado tabla Presupuestos_EDO 28112013 revisada
        Close;
        sql.Clear;
        sql.Add('DELETE FROM Presupuestos_EDO');
        sql.Add('WHERE codPresupuesto = :codPresupuesto');
        sql.Add('  AND revision = :revision');
        sql.Add('  AND codBase = :codBase');

        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;

        Prepare;
        ExecSQL;

        // Borrado tabla Presupuestos_edt 28112013 revisada
        Close;
        sql.Clear;
        sql.Add('DELETE FROM Presupuestos_EDT');
        sql.Add('WHERE codPresupuesto = :codPresupuesto');
        sql.Add('  AND revision = :revision');
        sql.Add('  AND codBase = :codBase');

        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;
        Prepare;
        ExecSQL;

        // borrado tabla presupuesto_indirectos 28112013 revisada
        Close;
        sql.Clear;
        sql.Add('delete from presupuestos_indirectos where codPresupuesto=' + QuotedStr(codProyecto) + ' and revision=' + QuotedStr(revision) + ' and codBase=' + QuotedStr(base_activa.codBase));
        Prepare;
        ExecSQL;

        // borrado tabla presupuestos_anotaciones 28112013 revisada
        Close;
        sql.Clear;
        sql.Add('DELETE FROM presupuestos_Anotaciones');
        sql.Add('WHERE codPresupuesto = :codPresupuesto');
        sql.Add('  AND revision = :revision');
        sql.Add('  AND codBase = :codBase');

        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;

        Prepare;
        ExecSQL;

        // borrado tabla presupuestos_anotacionesP2 28112013 revisada
        Close;
        sql.Clear;
        sql.Add('DELETE FROM presupuestos_AnotacionesP2');
        sql.Add('WHERE codPresupuesto = :codPresupuesto');
        sql.Add('  AND revision = :revision');
        sql.Add('  AND codBase = :codBase');

        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;

        Prepare;
        ExecSQL;

        // borrado tabla Presupuestos_cronogramas 28112013 revisada
      { Close;
        sql.Clear;
        sql.Add('DELETE FROM presupuestos_cronogramas');
        sql.Add('WHERE codPresupuesto = :codPresupuesto');
        sql.Add('  AND revision = :revision');
        sql.Add('  AND codBase = :codBase');

        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;


        Prepare;
        ExecSQL;    }

        // borrado tabla presupuestos_indicesSeleccionado 28112013 revisada
        Close;
        sql.Clear;
        sql.Add('DELETE FROM presupuestos_indicesSeleccionados');
        sql.Add('WHERE codPresupuesto = :codPresupuesto');
        sql.Add('  AND revision = :revision');
        sql.Add('  AND codBase = :codBase');

        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;

        Prepare;
        ExecSQL;

        // borrado tabla presupuestos_Recursos 28112013 revisada
        Close;
        sql.Clear;
        sql.Add('DELETE FROM presupuestos_Recursos');
        sql.Add('WHERE codPresupuesto = :codPresupuesto');
        sql.Add('  AND revision = :revision');
        sql.Add('  AND codBase = :codBase');

        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;

        Prepare;
        ExecSQL;

        // borrado tabla presupuestos_notasRevision 28112013 revisada
        Close;
        sql.Clear;
        sql.Add('DELETE FROM presupuestos_NotasRevision');
        sql.Add('WHERE codPresupuesto = :codPresupuesto');
        sql.Add('  AND revision = :revision');
        sql.Add('  AND codBase = :codBase');

        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;

        Prepare;
        ExecSQL;

        // borrado tabla presupuestos_FPolinomica 28112013 revisada
        Close;
        sql.Clear;
        sql.Add('DELETE FROM presupuestos_FPolinomica');
        sql.Add('WHERE codPresupuesto = :codPresupuesto');
        sql.Add('  AND revision = :revision');
        sql.Add('  AND codBase = :codBase');

        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;

        Prepare;
        ExecSQL;
        result := true;
      end;
    finally
      qry.Free
    end;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de guardar_Anotaciones.</summary>
/// <returns>TODO.</returns>
function guardar_Anotaciones(): Boolean;
var
  qry: TUniQuery;
  x: integer;
  codBase: string;
  Stream: TMemoryStream;
  tmpstr: string;
  listadoAnotaciones: array of dat_anotaciones;
begin
  // Anotaciones
  qry := TUniQuery.Create(nil);
  Stream := TMemoryStream.Create;
  codBase := base_activa.codBase;
  Result := False;
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        x := 0;
        Close;
        sql.Clear;
        sql.Add('select * from Tanotaciones');
        Prepare;
        setlength(listadoAnotaciones, 0);
        ExecSQL;
        while not Eof do
        begin
          setlength(listadoAnotaciones, x + 1);
          listadoAnotaciones[x].idItem := FieldByName('idItem').AsString;
          listadoAnotaciones[x].fecha := FieldByName('fecha').AsDateTime;
          listadoAnotaciones[x].codEDT := FieldByName('codEdt').AsString;
          listadoAnotaciones[x].paquete := FieldByName('paquete').AsString;
          listadoAnotaciones[x].descripcion := FieldByName('descripcion').AsString;
          listadoAnotaciones[x].nota := FieldByName('nota').AsString;
          listadoAnotaciones[x].autor := FieldByName('autor').AsString;
          listadoAnotaciones[x].tipoNota := FieldByName('tipoNota').AsString;
          listadoAnotaciones[x].notaReferencia := FieldByName('notaReferencia').AsString;
          Next;
          Inc(x);
        end;
        Close;
        sql.Clear;
        sql.Add('INSERT INTO presupuestos_Anotaciones');
        sql.Add('(codBase, codPresupuesto, revision, idItem, fecha, codEdt, paquete, descripcion, nota, autor, tipoNota, NotaReferencia)');
        sql.Add('VALUES (:codBase, :codPresupuesto, :revision, :idItem, :fecha, :codEdt, :paquete, :descripcion, :nota, :autor, :tipoNota, :NotaReferencia)');
        Prepare;
        for x := 0 to length(listadoAnotaciones) - 1 do
        begin
          ParamByName('codBase').AsString := codBase;
          ParamByName('codPresupuesto').AsString := codProyecto;
          ParamByName('revision').AsString := revision;
          ParamByName('idItem').AsString := listadoAnotaciones[x].idItem;
          ParamByName('fecha').AsDatetime := listadoAnotaciones[x].fecha;
          ParamByName('codEDT').AsString := listadoAnotaciones[x].codEDT;
          ParamByName('paquete').AsString := listadoAnotaciones[x].paquete;
          ParamByName('descripcion').AsString := listadoAnotaciones[x].descripcion;
          ParamByName('nota').AsString := listadoAnotaciones[x].nota;
          ParamByName('autor').AsString := listadoAnotaciones[x].autor;
          ParamByName('tipoNota').AsString := listadoAnotaciones[x].tipoNota;
          ParamByName('notaReferencia').AsString := listadoAnotaciones[x].notaReferencia;
          ExecSQL;
        end;

        // Anotaciones P2
        frmVisorNotas.Trvw_VisorAnotaciones.SaveToJSONStream(Stream);
        Stream.Position := 0;
        tmpstr := ReadStreamStr(Stream);
        Close;
        sql.Clear;
        sql.Add('insert into Presupuestos_AnotacionesP2 (codBase, codPresupuesto, revision, DatosAnotaciones) VALUES (:codBase, :codPresupuesto, :revision, :DatosAnotaciones) ');
        Prepare;
        ParamByName('codBase').AsString := codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('DatosAnotaciones').AsString := tmpstr;
        result := True;
        ExecSQL;
      end;
    finally
      qry.free;
      Stream.Free;
    end;
  except
    result := false;
  end;
end;

/// <summary>TODO: Descripción de guardar_ItemsPresupuesto.</summary>
/// <returns>TODO.</returns>
function guardar_ItemsPresupuesto(): Boolean;
begin
  Result := False;
  try
    DModule_1.StoreProc_GuardarItemsProyecto.ParamByName('icodBase').AsString := base_activa.codBase;
    DModule_1.StoreProc_GuardarItemsProyecto.ParamByName('icodPresupuesto').AsString := codProyecto;
    DModule_1.StoreProc_GuardarItemsProyecto.ParamByName('iRevision').AsString := revision;
    DModule_1.StoreProc_GuardarItemsProyecto.Execute;
    Result := True;
  except
    Result := False;
  end;
end;

/// <summary>TODO: Descripción de Guardar_Indirectos.</summary>
/// <returns>TODO.</returns>
function Guardar_Indirectos(): Boolean;
var
  qry: TUniQuery;
  x: integer;
  codBase: string;
  tmpstr: string;
begin
  // Indirectos
  qry := TUniQuery.Create(nil);
  codBase := base_activa.codBase;
  Result := False;
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        sql.Add('insert into presupuestos_indirectos (codBase, codPresupuesto, revision, cuenta, codCuenta, observaciones, valor) ');
        sql.Add('VALUES (:codBase, :codPresupuesto, :revision,:cuenta, :codCuenta, :observaciones, :valor) ');
        Prepare;
        for x := 0 to length(listadoIndirectos) - 1 do
        begin
          ParamByName('codBase').AsString := codBase;
          ParamByName('codPresupuesto').AsString := codProyecto;
          ParamByName('revision').AsString := revision;
          ParamByName('codCuenta').AsString := listadoIndirectos[x].codCuenta;
          ParamByName('cuenta').AsString := listadoIndirectos[x].cuenta;
          ParamByName('valor').AsString := listadoIndirectos[x].porcentaje;
          ParamByName('observaciones').AsString := listadoIndirectos[x].observaciones;
          ExecSQL;
        end;
        result := True;
      end;
    finally
      qry.Free;
    end;
  except
    Result := False;
  end;
end;

/// <summary>TODO: Descripción de Guardar_DatosGenerales.</summary>
/// <param name="fechaCreacion">TODO.</param>
/// <returns>TODO.</returns>
function Guardar_DatosGenerales(fechaCreacion: TdateTime): Boolean;
var
  qry: TUniQuery;
  codBase: string;
  codProyectoRevisado: string;
  fechaModificacion: TdateTime;
begin
  {Datos Generales Presupuesto}
  qry := TUniQuery.Create(nil);
  codBase := base_activa.codBase;
  Result := False;
  if ProyectoNuevo then
    fechaCreacion := now;
  fechaModificacion := Now;
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        if (ProyectoNuevo) then
        begin
          // Nuevo Proyecto
          if revision = '0' then
          begin
            codProyectoRevisado := compruebaCodigoProyectoRevisado();
            frmMain.edt_CodigoPresupuesto1.Text := codProyectoRevisado;
            codProyecto := codProyectoRevisado;
          end;
          Close;
          sql.Clear;
          sql.Add('insert into presupuestos_datosGenerales (codBase, codPresupuesto, codReferencial, revision, descripcion, subtotal, iva, indirectos, total, fechaCreacion, fechamodificacion, ndecimales, ndecimalesMoneda, porcentajeIVA, activo, idEmpresaAsignada) ');
          sql.Add('Values (:codBase, :codPresupuesto, :codReferencial, :revision, :descripcion, :subtotal, :iva, :indirectos, :total, :fechaCreacion, :fechamodificacion, :ndecimales, :ndecimalesMoneda, :porcentajeIVA, :activo, :idEmpresaAsignada)');
          Prepare;
          ParamByName('codBase').AsString := codBase;
          ParamByName('codPresupuesto').AsString := codProyecto;
          ParamByName('revision').AsString := revision;
          ParamByName('codReferencial').AsString := frmmain.edt_NPresupuestoCodReferencial.Text;
          ParamByName('descripcion').AsString := frmmain.edt_descripcionPresupuesto.Text;

          if frmMain.lbl_SubtotalPresupuesto.text = '' then
            frmmain.lbl_SubtotalPresupuesto.text := '0';

          ParamByName('subtotal').AsFloat := quitaFormatFloat(frmmain.lbl_SubtotalPresupuesto.Text);
          if frmMain.lbl_CantIVAPresupuestos.text = '' then
            frmMain.lbl_cantIVaPresupuestos.text := '0';

          ParamByName('iva').AsFloat := quitaFormatFloat(frmmain.lbl_CantIVAPresupuestos.Text);

          ParamByName('indirectos').AsFloat := IndirectosPresupuesto;

          if frmMain.lbl_TotalIVAPresupuestos.Text = '' then
            frmMain.lbl_TotalIVAPresupuestos.text := '0';
          ParamByName('total').AsFloat := quitaFormatFloat(frmmain.lbl_TotalIVAPresupuestos.Text);

          ParamByName('fechaCreacion').AsDateTime := fechaCreacion;
          ParamByName('fechaModificacion').AsDateTime := fechaModificacion;
          ParamByName('ndecimales').AsInteger := ndecimalesPresupuesto;
          Parambyname('porcentajeIVA').AsFloat := strtofloatdef(frmmain.edt_porcentajeIVANuevoPresupuesto.Text, 15);
          Parambyname('activo').AsBoolean := True;
          ParamByName('ndecimalesmoneda').AsInteger := ndecimalesMoneda;
          /// ???
          ExecSQL;
          result := True;
        end
        else
        begin
          // Actualizar Proyecto
          close;
          sql.Clear;
          sql.add('update presupuestos_datosGenerales set codReferencial=:codReferencial, descripcion=:descripcion, subtotal=:subtotal, iva=:iva, indirectos=:indirectos, total=:total, fechamodificacion=:fechaModificacion, porcentajeIVA=:porcentajeIVA ');
          sql.add('where codPresupuesto=' + QuotedStr(codProyecto) + ' and codBase=' + QuotedStr(codBase) + ' and revision=' + QuotedStr(revision));
          ParamByName('porcentajeIVA').AsFloat := strtofloatDef(frmmain.edt_PorcentajeIVANuevoPresupuesto.Text, 15);
          ParamByName('codReferencial').AsString := frmmain.edt_NPresupuestoCodReferencial.Text;
          ParamByName('descripcion').AsString := frmmain.edt_descripcionPresupuesto.Text;

          ParamByName('subtotal').AsFloat := quitaFormatFloat(frmmain.lbl_SubtotalPresupuesto.Text);
          ParamByName('iva').AsFloat := quitaFormatFloat(frmmain.lbl_CantIVAPresupuestos.Text);
          ParamByName('indirectos').AsFloat := IndirectosPresupuesto;
          ParamByName('total').AsFloat := quitaFormatFloat(frmmain.lbl_TotalIVAPresupuestos.Text);
          ParamByName('fechaModificacion').AsDateTime := fechaModificacion;
          Prepare;
          ExecSQL;
          Result := True;
        end;
      end;
    finally
      qry.Free;
    end;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de compruebaCodigoProyectoRevisado.</summary>
/// <returns>TODO.</returns>
function compruebaCodigoProyectoRevisado(): string;
var
  qry: TUniQuery;
  tmpstr: string;
  salir: Boolean;
  codPart: string;
  codPart3: string;
  iCodPart3: integer;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      SQL.Add('select * from presupuestos_DatosProyecto where codPresupuesto=' + QuotedStr(codProyecto));
      prepare;
      ExecSQL;
      tmpstr := FieldByName('codPresupuesto').AsString;
      if tmpstr = '' then
      begin
        close;
        sql.Clear;
        sql.Add('update configuracion set PresupuestoValor3=PresupuestoValor3+1');
        Prepare;
        ExecSQL;
        result := codProyecto;
      end
      else
      begin
        codPart3 := RightStr(codProyecto, 4);
        codPart := ReplaceStr(codProyecto, codPart3, '');
        iCodPart3 := StrToIntDef(codPart3, 1);
        inc(iCodPart3);
        codProyecto := codPart + ponerCerosInicio(IntToStr(iCodPart3), 3);
        tmpstr := compruebaCodigoProyectoRevisado();
        if tmpstr = codProyecto then
          Result := codProyecto;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de Guardar_EDT.</summary>
/// <returns>TODO.</returns>
function Guardar_EDT(): Boolean;
var
  qry: TUniQuery;
  nodo: TTMSFNCTreeViewNode;
begin
  try
    qry := TUniQuery.Create(nil);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        sql.Clear;
        sql.Add('delete from presupuestos_edt where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision');
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('Revision').AsString := revision;
        Prepare;
        ExecSQL;
        close;
        sql.Clear;
        {(*}
        sql.Add('INSERT INTO presupuestos_edt ' +
                '( ' +
                'codBase, ' +
                'codPresupuesto, ' +
                'Revision, ' +
                'CodEDT, ' +
                'Descripcion, ' +
                'Responsable, ' +
                'Definicion, ' +
                'codUnicoItemPresupuesto) ' +
                'VALUES ' +
                '( ' +
                ':codBase, ' +
                ':codPresupuesto, ' +
                ':Revision, ' +
                ':CodEDT, ' +
                ':Descripcion, ' +
                ':Responsable, ' +
                ':Definicion, ' +
                ':codUnicoItemPresupuesto)');
          {*)}
        if frmMain.Trvw_EDT.Nodes.Count > 0 then
          nodo := frmMain.Trvw_EDT.Nodes[0];
        while Assigned(nodo) do
        begin
          if nodo.text[0] <> '' then
          begin
            ParamByName('codBase').AsString := base_activa.codBase;
            ParamByName('codPresupuesto').AsString := codProyecto;
            parambyname('revision').AsString := revision;
            parambyname('codEdt').AsString := nodo.text[0];
            parambyname('descripcion').AsString := nodo.text[1];
            ParamByName('Responsable').AsString := nodo.text[2];
            parambyname('Definicion').AsString := nodo.text[3];
            parambyname('codUnicoItemPresupuesto').AsString := nodo.text[4];
            prepare;
            execsql;
          end;
          nodo := nodo.GetNext;
        end;
        result := True;
      end;
    finally
      qry.free;
    end;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de Guardar_EDO.</summary>
/// <returns>TODO.</returns>
function Guardar_EDO(): Boolean;
begin
  {Guardar EDO}
  Result := False;
  try
    ActualizaHitosyEdos(frmMain.Trvw_EDO);
    Result := True;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de Guardar_StakeHolders.</summary>
/// <returns>TODO.</returns>
function Guardar_StakeHolders(): Boolean;
var
  qry: TUniQuery;
  x: integer;
begin
  {Stake Asignados}
  qry := TUniQuery.Create(nil);
  Result := False;
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        SQL.Clear;
        sql.Add('delete from presupuestos_stakeholders where codbase = :codbase and codPresupuesto = :codPresupuesto and revision = :revision');
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        Prepare;
        ExecSQL;
        Close;
        sql.Clear;
        {(*}
        sql.Add('INSERT INTO Presupuestos_StakeHolders ' +
                '( ' +
                'codBase, ' +
                'codPresupuesto, ' +
                'revision, ' +
                'idGrid, ' +
                'rolPresupuesto, ' +
                'idFiscal, ' +
                'nombre, ' +
                'apellidos, ' +
                'titulacion, ' +
                'email, ' +
                'idUnico) ' +
                'VALUES ' +
                '( ' +
                ':codBase, ' +
                ':codPresupuesto, ' +
                ':revision, ' +
                ':idGrid, ' +
                ':rolPresupuesto, ' +
                ':idFiscal, ' +
                ':nombre, ' +
                ':apellidos, ' +
                ':titulacion, ' +
                ':email, ' +
                ':idUnico ' +
                ')');
          {*)}
        Prepare;
        for x := 1 to frmmain.grid_stakesAsignados.RowCount - 1 do
        begin
          ParamByName('codBase').AsString := base_activa.codBase;
          ParamByName('codPresupuesto').AsString := codProyecto;
          ParamByName('revision').AsString := revision;
          ParamByName('idGrid').AsString := frmMain.grid_stakesAsignados.Cells[0, x];
          ParamByName('idFiscal').AsString := frmmain.grid_stakesAsignados.Cells[1, x];
          ParamByName('nombre').AsString := frmmain.grid_stakesAsignados.Cells[2, x];
          ParamByName('apellidos').AsString := frmmain.grid_stakesAsignados.Cells[3, x];
          ParamByName('email').AsString := frmmain.grid_stakesAsignados.Cells[4, x];
          ParamByName('titulacion').AsString := frmmain.grid_stakesAsignados.Cells[5, x];
          ParamByName('rolPresupuesto').AsString := frmmain.grid_stakesAsignados.Cells[6, x];
          ParamByName('idUnico').AsString := frmmain.grid_stakesAsignados.cells[7, x];
          ExecSQL;
        end;
        result := True;
      end;
    finally
      qry.free;
    end;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de Guardar_DatosProyecto.</summary>
/// <param name="fechaCreacion">TODO.</param>
/// <returns>TODO.</returns>
function Guardar_DatosProyecto(fechaCreacion: TdateTime): boolean;
var
  qry: TUniQuery;
  codBase: string;
  fechaModificacion: TdateTime;
  img: TBitmap;
  tmpstr: string;
  x: integer;
begin
  {Datos Generales Proyecto}
  qry := TUniQuery.Create(nil);
  codBase := base_activa.codBase;
  Result := False;
  img := TBitmap.Create;
  if fechaCreacion = strtodateTime(fecha0) then
    fechaCreacion := Now;
  fechaModificacion := Now;
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        {(*}
        sql.Add('INSERT INTO Presupuestos_DatosProyecto ' +
                '( ' +
                'codBase, ' +
                'codPresupuesto, ' +
                'codReferencial, ' +
                'revision, ' +
                'descripcion, ' +
                'tipoProyecto, ' +
                'categoria, ' +
                'tipoConstruccion, ' +
                'AmbitoContratacion, ' +
                'tipoContrato, ' +
                'fechaInicio, ' +
                'PlazoEjecucion, ' +
                'fechaFinalizacion, ' +
                'direccion, ' +
                'ciudad, ' +
                'provincia, ' +
                'pais, ' +
                'objetoContrato, ' +
                'validezPropuesta, ' +
                'Foto1, ' +
                'Foto2, ' +
                'latitud, ' +
                'longitud, ' +
                'fechaHoraCreacion, ' +
                'UltModificacion, ' +
                'ATerreno, ' +
                'AConstruccion ' +
                ') ' +
                'VALUES ' +
                '( ' +
                ':codBase, ' +
                ':codPresupuesto, ' +
                ':CodReferencial, ' +
                ':revision, ' +
                ':descripcion, ' +
                ':tipoProyecto, ' +
                ':categoria, ' +
                ':tipoConstruccion, ' +
                ':AmbitoContratacion, ' +
                ':tipoContrato, ' +
                ':fechaInicio, ' +
                ':PlazoEjecucion, ' +
                ':fechaFinalizacion, ' +
                ':direccion, ' +
                ':ciudad, ' +
                ':provincia, ' +
                ':pais, ' +
                ':objetoContrato, ' +
                ':validezPropuesta, ' +
                ':Foto1, ' +
                ':Foto2, ' +
                ':latitud, ' +
                ':longitud, ' +
                ':fechaHoraCreacion, ' +
                ':UltModificacion, ' +
                ':ATerreno, ' +
                ':AConstruccion ' +
                ')');
          {*)}
        Prepare;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := codBase;
        ParamByName('codReferencial').AsString := frmmain.edt_NPresupuestoCodReferencial.Text;
        ParamByName('descripcion').AsString := frmmain.edt_descripcionPresupuesto.Text;
        ParamByName('tipoProyecto').AsString := frmmain.cbb_TProyectosPrespuesto.Items[frmmain.cbb_TProyectosPrespuesto.ItemIndex];
        ParamByName('categoria').AsString := frmmain.cbb_CategoriaPresupuesto.Items[frmmain.cbb_CategoriaPresupuesto.ItemIndex];
        ParamByName('TipoConstruccion').AsString := frmmain.cbb_TConstruccion.Items[frmmain.cbb_TConstruccion.ItemIndex];
        ParamByName('AmbitoContratacion').AsString := frmmain.cbb_ambitoContratacion.Items[frmmain.cbb_ambitoContratacion.ItemIndex];
        ParamByName('TipoContrato').AsString := frmmain.cbb_TipoContrato.Items[frmmain.cbb_TipoContrato.ItemIndex];
        ParamByName('fechaInicio').AsDateTime := frmmain.dedt_PresentacionPresupuesto.Date;
        ParamByName('PlazoEjecucion').AsString := frmmain.edt_PlazoEjecucionPresupuesto.Text;
        ParamByName('fechaFinalizacion').AsDateTime := StrToDateTime(frmmain.lbl_PresupuestoFinalizacion.Text);
        ParamByName('direccion').AsString := frmmain.edt_NPresupuestoDireccion.Text;
        ParamByName('ciudad').AsString := frmmain.edt_NPresupuestoCiudad.Text;
        ParamByName('provincia').AsString := frmmain.edt_NPresupuestoProvincia.Text;
        ParamByName('pais').AsString := frmmain.cbb_paisNPresupuesto.Items[frmmain.cbb_paisNPresupuesto.ItemIndex];
        ParamByName('objetoContrato').AsString := frmmain.mmo_ObjetoPresupuesto.Text;
        ParamByName('validezPropuesta').AsString := frmmain.edt_ValidezPresupuesto.Text;
        ParamByName('fechaHoraCreacion').AsDateTime := fechaCreacion;
        ParamByName('UltModificacion').AsDateTime := fechaModificacion;
        ParamByName('ATerreno').AsString := frmmain.edt_AreaTerrenoPresupuesto.Text;
        ParamByName('AConstruccion').AsString := frmmain.edt_AConstruccionPresupuesto.Text;

        {Fin}
        tmpstr := frmMain.edt_Latitud.text.Trim;
        if tmpstr = '' then
          tmpstr := '0';
        ParamByName('latitud').AsFloat := strtofloatdef(tmpstr, 0);
        tmpstr := frmmain.edt_longitud.Text;
        if tmpstr = '' then
          tmpstr := '0';
        ParamByName('longitud').AsFloat := strtofloatdef(tmpstr, 0);
        ExecSQL;
        result := True;
      end;
    finally
      qry.Free;
    end;
  except
    result := False;
  end;
end;

/// <summary>TODO: Descripción de BitmapToString.</summary>
/// <param name="img">TODO.</param>
/// <returns>TODO.</returns>
function BitmapToString(img: Tbitmap): string;
var
  tms: TMemoryStream;
  tss: TStringStream;
  ts: string;
begin
  tms := TMemoryStream.Create;
  img.SaveToStream(tms);
  tss := TStringStream.Create('');
  tms.Position := 0;
  Encoder.EncodeStream(tms, tss);
  ts := tss.DataString;
  tms.Free;
  tss.Free;
  result := ts;
end;

/// <summary>TODO: Descripción de StringToBitmap.</summary>
/// <param name="imgStr">TODO.</param>
/// <returns>TODO.</returns>
function StringToBitmap(imgStr: string): Tbitmap;
var
  tms: TMemoryStream;
  bitmap: Tbitmap;
begin
  tms := TMemoryStream.Create;
  Decoder.DecodeStream(imgStr, tms);
  tms.Position := 0;
  bitmap := Tbitmap.Create;
  bitmap.LoadFromStream(tms);
  tms.Free;
  result := bitmap;
end;

function posicionaNodo(trvw: TTMSFNCTreeView; Texto: string; columna: Integer; aCase: Boolean): TTMSFNCTreeViewNode;
var
  x: Integer;
  salir: Boolean;
  nodoConsulta: TTMSFNCTreeViewNode;
  tmpstr: string;
begin
  salir := False;
  x := trvw.Nodes.Count;
  if x > 0 then
  begin
    nodoConsulta := trvw.Nodes[0];

    while (not salir) and (Assigned(nodoConsulta)) do
    begin
      tmpstr := nodoConsulta.Text[columna];
      if aCase then
      begin
        tmpstr := LowerCase(tmpstr);
        Texto := LowerCase(tmpstr);
      end;
      if Texto = tmpstr then
      begin
        salir := True;
        result := nodoConsulta;
      end;
      nodoConsulta := nodoConsulta.GetNext;
    end;
    if not salir then
    begin
      nodoConsulta := nil;
      result := nodoConsulta;
    end;
  end
  else
  begin
    nodoConsulta := TTMSFNCTreeViewNode.Create(nil);
    nodoConsulta := nil;
    result := nodoConsulta;
  end;
end;

function posicionaNodoDesc(trvw: TTMSFNCTreeView; Texto: string; columna: Integer; aCase: Boolean): TTMSFNCTreeViewNode;
var
  x: Integer;
  salir: Boolean;
  nodoConsulta: TTMSFNCTreeViewNode;
  tmpstr: string;
  descNodo: string;
begin
  salir := False;
  nodoConsulta := trvw.Nodes[0];
  while (not salir) and (Assigned(nodoConsulta)) do
  begin
    tmpstr := nodoConsulta.Text[columna];
    x := AnsiPos(' ', tmpstr);
    tmpstr := Copy(tmpstr, x + 1, length(tmpstr));
    if aCase then
    begin
      tmpstr := LowerCase(tmpstr);
      Texto := LowerCase(Texto);
    end;
    if Texto = tmpstr then
    begin
      salir := True;
      result := nodoConsulta;
    end;
    nodoConsulta := nodoConsulta.GetNext;
  end;
end;

function posicionPrimerItem(Grid: TTMSFNCGrid; codItem: string): Integer;
var
  fnc: TTMSFNCGridFindParams;
  rv: TPoint;
  tmpstr: string;
  x: integer;
  salir: Boolean;
const
  CResultInvalidInt = -1;
begin
  Result := -1;
  fnc := [TTMSFNCGridFindParameters.fnAutoGoto, TTMSFNCGridFindParameters.fnFindInPresetCol, TTMSFNCGridFindParameters.fnMatchFull];
  result := -1;
  if codItem <> '' then
  begin
    Grid.FindCol := 10;
    rv := Grid.FindFirst(codItem, fnc);
    tmpstr := Grid.Cells[10, rv.y];
    if rv.y <> -1 then
      result := rv.y;
  end;
end;

function existeNodo(trvw: TTMSFNCTreeView; textoBuscar: string): Boolean;
var
  salir: Boolean;
  subnodo: TTMSFNCTreeViewNode;
  tmpstr: string;
  x: Integer;
begin
  subnodo := trvw.Nodes[0];
  salir := False;
  result := False;
  while (subnodo <> nil) and (not salir) do
  begin
    tmpstr := subnodo.Text[0];
    x := AnsiPos(' ', tmpstr);
    tmpstr := Copy(tmpstr, x + 1, length(tmpstr));
    tmpstr := trim(tmpstr);
    if tmpstr = textoBuscar then
    begin
      result := True;
      salir := True;
    end;
    subnodo := subnodo.GetNext;
  end;
end;

/// <summary>TODO: Descripción de generaCodEDT.</summary>
/// <param name="node">TODO.</param>
procedure generaCodEDT(node: TTMSFNCTreeViewNode);
var
  subNode, Tnode: TTMSFNCTreeViewNode;
  x, y: Integer;
  tmpstr: string;
  codigo: string;
  prefijo: string;
  root: Boolean;
begin
  prefijo := '';
  subNode := node.GetParent;
  if not Assigned(subNode) then
  begin
    subNode := frmmain.Trvw_EDT.Nodes[0];
    root := True;
  end
  else
  begin
    Tnode := subNode.GetParent;
    if not Assigned(Tnode) then
      root := True
    else
      root := False;
  end;
  if Assigned(subNode) then
  begin
    if not root then
      prefijo := subNode.Text[0];
    x := 1;
    subNode := subNode.GetFirstChild;
    while subNode <> nil do
    begin
      if prefijo = '' then
        codigo := inttostr(x)
      else
        codigo := prefijo + '.' + inttostr(x);
      Inc(x);
      y := subNode.GetChildCount;
      subNode.Text[0] := codigo;
      if y > 0 then
      begin
        generaCodEDT(subNode.GetNext);
      end;
      subNode := subNode.GetNextSibling;
    end;
  end;
end;

/// <summary>TODO: Descripción de populaResponsableEDT.</summary>
procedure populaResponsableEDT();
var
  x: Integer;
  tmpstr: string;
begin
  frmOpcionesEDT.cbb_EDTResponsable.Clear;
  for x := 1 to frmmain.grid_stakesAsignados.RowCount - 1 do
  begin
    tmpstr := trim(frmmain.grid_stakesAsignados.cells[1, x]) + ' - ' + trim(frmmain.grid_stakesAsignados.cells[2, x]) + ' ' + trim(frmmain.grid_stakesAsignados.cells[3, x]) + ' (' + trim(frmmain.grid_stakesAsignados.cells[4, x]) + ')';
    frmOpcionesEDT.cbb_EDTResponsable.Items.Add(tmpstr);
  end;
  frmOpcionesEDT.cbb_EDTResponsable.ItemIndex := -1;
end;

function addNodeEDT(node: TTMSFNCTreeViewNode; Texto: string): TTMSFNCTreeViewNode;
var
  subNode: TTMSFNCTreeViewNode;
begin
  subNode := frmmain.Trvw_EDO.AddNode(node);
  subNode.Text[1] := '1';
  subNode.Text[2] := Texto;
  subNode.Text[3] := '';
  subNode.Text[4] := '';
  subNode.Text[5] := '';
  result := subNode;
end;

function daValorUltimoNodoRama(Nodo: TTMSFNCTreeViewNode; extendido: Boolean): TTMSFNCTreeViewNode;
var
  subnodo: TTMSFNCTreeViewNode;
  I: Integer;
  x: integer;
begin
  result := nil;
  I := Nodo.Nodes.Count - 1;
  for x := 1 to I do
  begin
    Nodo := Nodo.GetNext;
    if extendido then
    begin
      if Nodo.Extended then
        Result := Nodo;
    end
    else
    begin
      Result := Nodo;
    end;
  end;
end;

procedure addHito(NodoBase: TTMSFNCTreeViewNode; nombreHito: string);
var
  codHito: string;
  Nodo: TTMSFNCTreeViewNode;
  subnodo: TTMSFNCTreeViewNode;
  x: integer;
  prefijo: string;
  sufijo: string;
  nodoLevel: integer;
begin
  if not NodoBase.Extended then
  begin
    NodoBase := NodoBase.GetPreviousSibling;
  end;
  nodoLevel := NodoBase.VirtualNode.Level;
  Nodo := frmmain.Trvw_EDO.AddNode(NodoBase);
  Nodo.Extended := true;
  x := nodoLevel;
  if x = 0 then
  begin
    NodoBase := daValorUltimoNodoRama(NodoBase, True);
    if assigned(NodoBase) then
      codHito := NodoBase.Text[0]
    else
      codHito := '';
    if codHito = '' then
      codHito := '001'
    else
    begin

      x := ansipos(' - ', codHito);
      codHito := copy(codHito, 1, x - 1).Trim;
      x := strtointdef(codHito, 0);
      inc(x);
      codHito := ponerCerosInicio(inttostr(x), 3);
    end;
    codHito := codHito + ' - ' + nombreHito;
  end
  else
  begin
    subnodo := daValorUltimoNodoRama(NodoBase, True);
    if assigned(subnodo) then
    begin
      sufijo := subnodo.Text[0];

      x := ansipos(' - ', sufijo);
      sufijo := copy(sufijo, 1, x - 1).Trim;
      prefijo := AnsiReverseString(sufijo);
      x := AnsiPos('.', prefijo);
      if x > 0 then
      begin
        sufijo := copy(prefijo, x + 1, length(prefijo));
        prefijo := copy(prefijo, 1, x - 1).Trim;

        sufijo := AnsiReverseString(sufijo).Trim;
        prefijo := AnsiReverseString(prefijo);
        x := strtointdef(prefijo, 0);
        inc(x);
        prefijo := ponerCerosInicio(inttostr(x), 3);
      end
      else
      begin
        prefijo := '001';
      end;

    end
    else
    begin
      prefijo := '001';
    end;
    codHito := sufijo + '.' + prefijo + ' - ' + nombreHito;
  end;

  Nodo.text[0] := codHito;
  Nodo.Expand(true);
end;

/// <summary>TODO: Descripción de sincronizarEDO.</summary>
procedure sincronizarEDO();
type
  dat_edoP = record
    valor: string;
    idStaker: string;
    nombre: string;
    rol: string;
    IdUnico: string;
  end;
var
  listadoEDO: TStringList;
  x, y, z: Integer;
  nodoPadre, subNodo: TTMSFNCTreeViewNode;
  tmpstr: string;
  idStake: string;
  nombreStake: string;
  codStake: string;
  tmpint: Integer;
  encontrado: Boolean;
  rolStakeAsignado: string;
  listadoEdoT: array of dat_edoP;
begin
  // Stakes Sin Asignar
  limpiaGridEDOStakes;
  y := 0;
  z := 0;
  for x := 1 to frmmain.grid_stakesAsignados.RowCount - 1 do
  begin
    rolStakeAsignado := trim(frmmain.grid_stakesAsignados.cells[6, x]);
    y := frmMain.grid_EDOStakes.RowCount;
    frmMain.grid_EDOStakes.RowCount := y + 1;
    frmMain.grid_EDOStakes.cells[0, y] := ponerCerosInicio(frmmain.grid_stakesAsignados.cells[0, x], 2);
    frmmain.grid_EDOStakes.cells[1, y] := Trim(frmMain.grid_stakesAsignados.cells[1, x]);
    frmMain.grid_EDOStakes.cells[2, y] := Trim(frmmain.grid_stakesAsignados.cells[2, x]) + ' ' + trim(frmMain.grid_stakesAsignados.cells[3, x]);
    frmmain.grid_EDOStakes.cells[3, y] := frmmain.grid_stakesAsignados.cells[6, x];
    frmMain.grid_EDOStakes.cells[4, y] := frmMain.grid_stakesAsignados.cells[7, x];
  end;
  DaSeleccionRolesStake2();
  frmMain.grid_EDOStakes.Columns[4].Width := 0;
  if frmmain.Trvw_EDO.Nodes.Count > 0 then
  begin
    if frmMain.Trvw_EDO.Nodes[0].Text[0] <> frmMain.edt_descripcionPresupuesto.Text then
    begin
      nodoPadre := frmMain.Trvw_EDO.AddNode;
      nodoPadre.Extended := True;
      nodoPadre.Text[0] := frmMain.edt_descripcionPresupuesto.text;
    end;
  end;
  frmMain.Trvw_EDO.Columns[5].Visible := False;
  frmMain.Trvw_EDO.ExpandAll;
end;

procedure AsignaRolEdo(subnodo: TTMSFNCTreeViewNode; rolSinAsignar, AValue: string);
var
  x: Integer;
  tmpstr: string;
  posgrid: Integer;
begin
  x := AnsiPos(' - ', rolSinAsignar);
  tmpstr := Copy(rolSinAsignar, 1, x - 1);
  tmpstr := trim(tmpstr);
  posgrid := strtoint(tmpstr);
  frmmain.grid_stakesAsignados.Cells[1, posgrid] := AValue;
  AValue := tmpstr + ' - ' + AValue;
  subnodo.Text[0] := AValue;
end;

/// <summary>TODO: Descripción de limpiaGridEDOStakes.</summary>
procedure limpiaGridEDOStakes();
begin
  frmmain.grid_EDOStakes.ClearNormalCells;
  frmmain.grid_EDOStakes.Cells[0, 0] := '#';
  frmmain.grid_EDOStakes.Cells[1, 0] := 'Id Stakeholder';
  frmmain.grid_EDOStakes.Cells[2, 0] := 'Nombre';
  frmmain.grid_EDOStakes.Cells[3, 0] := 'Rol';
  frmmain.grid_EDOStakes.RowCount := 1;
end;

/// <summary>TODO: Descripción de iniciaEDO.</summary>
procedure iniciaEDO();
var
  nombreProyecto: string;
  subNode: TTMSFNCTreeViewNode;
begin
  historicoEDO := TStringList.Create;
  posEDO := 0;
  frmmain.Trvw_EDO.ClearNodes;
  frmmain.Trvw_EDO.Columns[0].Text := '#';
  frmmain.Trvw_EDO.Columns[1].Text := 'Rol Proyecto';
  frmmain.Trvw_EDO.Columns[2].Text := 'Id Stake';
  frmmain.Trvw_EDO.Columns[3].Text := 'Nombre';
  frmmain.Trvw_EDO.Columns[4].Text := 'Actividades Clave';
  frmmain.Trvw_EDO.ExpandAll;
end;

/// <summary>TODO: Descripción de iniciaEDT.</summary>
procedure iniciaEDT();
var
  nombreProyecto: string;
  subNode: TTMSFNCTreeViewNode;
begin
  historicoEDT := TStringList.Create;
  posEDT := 0;
  frmmain.Trvw_EDT.ClearNodes;
  frmmain.Trvw_EDT.Columns[0].Text := 'Cod. EDT';
  frmmain.Trvw_EDT.Columns[1].Text := 'Descripción';
  frmmain.Trvw_EDT.Columns[2].Text := 'Responsable';
  frmmain.Trvw_EDT.Columns[3].Text := 'Definición';
  frmmain.Trvw_EDT.Columns[4].Width := 0;
  nombreProyecto := frmmain.edt_descripcionPresupuesto.Text;
  if nombreProyecto = '' then
    nombreProyecto := 'Descripción del Proyecto sin definir';
  subNode := frmmain.Trvw_EDT.AddNode();

  subNode.Text[1] := nombreProyecto;
  frmmain.Trvw_EDT.SelectNode(subNode);
  frmmain.Trvw_EDT.ExpandAll;
end;

/// <summary>TODO: Descripción de populaRolStake.</summary>
procedure populaRolStake();
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from RolesStakes');
      Prepare;
      ExecSQL;
      frmRolProyecto.cbb_RolesStakes.Clear;
      while not Eof do
      begin
        tmpstr := FieldByName('descripcion').AsString;
        frmRolProyecto.cbb_RolesStakes.Items.Add(tmpstr);
        Next;
      end;
    end;
  finally
    qry.Free;
    frmRolProyecto.cbb_RolesStakes.ItemIndex := 0;
  end;
end;

/// <summary>TODO: Descripción de trimExp.</summary>
/// <param name="cadena">TODO.</param>
/// <returns>TODO.</returns>
function trimExp(cadena: string): string;
begin
  result := ReplaceStr(cadena, ' ', '');
end;

/// <summary>TODO: Descripción de addStakeHolder.</summary>
/// <param name="CodSTK">TODO.</param>
procedure addStakeHolder(CodSTK: string);
var
  posNgrid: Integer;
begin
  DMPresupuesto.QBuscarStake.close;
  DMPresupuesto.QBuscarStake.ParamByName('codSTK').AsString := CodSTK;
  DMPresupuesto.QBuscarStake.Open;
  posNgrid := frmmain.grid_stakesAsignados.RowCount;
  frmMain.grid_stakesAsignados.RowCount := posNgrid + 1;
  frmMain.grid_stakesAsignados.cells[0, posNgrid] := ponerCerosInicio(inttostr(posNgrid), 3);
  frmmain.grid_stakesAsignados.cells[1, posNgrid] := DMPresupuesto.QBuscarStakeidFiscal.AsString;
  frmmain.grid_stakesAsignados.cells[2, posNgrid] := DMPresupuesto.QBuscarStakeNombre.AsString;
  frmmain.grid_stakesAsignados.cells[3, posNgrid] := DMPresupuesto.QBuscarStakeApellidos.AsString;
  frmmain.grid_stakesAsignados.cells[4, posNgrid] := DMPresupuesto.QBuscarStakeemail.AsString;
  frmMain.grid_stakesAsignados.cells[5, posNgrid] := DMPresupuesto.QBuscarStakeTitulacion.AsString;
  frmmain.grid_stakesAsignados.cells[6, posNgrid] := 'Sin Asignar';
  frmmain.grid_stakesAsignados.cells[7, posNgrid] := generaGUID;
  frmmain.grid_stakesAsignados.Columns[7].Width := 0;
end;

/// <summary>TODO: Descripción de limpiaGridStakeAsignados.</summary>
procedure limpiaGridStakeAsignados();
begin
  frmmain.grid_stakesAsignados.ClearNormalCells;
  frmmain.grid_stakesAsignados.RowCount := 1;
  frmmain.grid_stakesAsignados.Cells[0, 0] := '#';
  frmmain.grid_stakesAsignados.Cells[1, 0] := 'Id';
  frmmain.grid_stakesAsignados.Cells[2, 0] := 'Nombres';
  frmmain.grid_stakesAsignados.Cells[3, 0] := 'Apellidos';
  frmmain.grid_stakesAsignados.Cells[4, 0] := 'e-mail';
  frmmain.grid_stakesAsignados.Cells[5, 0] := 'Profesión';
  frmmain.grid_stakesAsignados.Cells[6, 0] := 'Rol Asignado';
  frmMain.grid_stakesAsignados.Columns[7].Width := 0;
  DaSeleccionRolesStake();
end;

/// <summary>TODO: Descripción de cargaStakeAsignados.</summary>
procedure cargaStakeAsignados();
var
  qry: TUniQuery;
  x: Integer;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('SELECT *');
      sql.Add('FROM stakeholdersAsignados');
      sql.Add('WHERE codProyecto = :codProyecto');
      sql.Add('ORDER BY apellidos ASC');
      Prepare;
      ParamByName('codProyecto').AsString := codProyecto;
      ExecSQL;
      limpiaGridStakeAsignados;
      x := 1;
      while not Eof do
      begin
        frmmain.grid_stakesAsignados.RowCount := x + 1;
        frmmain.grid_stakesAsignados.Cells[0, x] := ponerCerosInicio(inttostr(x), 3);
        frmmain.grid_stakesAsignados.Cells[1, x] := FieldByName('idFiscal').AsString + espaciosFinales;
        frmmain.grid_stakesAsignados.Cells[2, x] := FieldByName('nombre').AsString + espaciosFinales;
        frmmain.grid_stakesAsignados.Cells[3, x] := FieldByName('Apellidos').AsString + espaciosFinales;
        frmmain.grid_stakesAsignados.Cells[4, x] := FieldByName('profesion').AsString + espaciosFinales;
        frmmain.grid_stakesAsignados.Cells[5, x] := FieldByName('rolproyectp').AsString + espaciosFinales;
        frmmain.grid_stakesAsignados.Cells[6, x] := FieldByName('localidad').AsString + espaciosFinales;
        frmmain.grid_stakesAsignados.Cells[7, x] := FieldByName('provincia').AsString + espaciosFinales;
        frmmain.grid_stakesAsignados.Cells[8, x] := FieldByName('pais').AsString + espaciosFinales;
        frmmain.grid_stakesAsignados.Cells[9, x] := FieldByName('telefono').AsString + espaciosFinales;
        frmmain.grid_stakesAsignados.Cells[10, x] := FieldByName('Institucion').AsString + espaciosFinales;
        Next;
        Inc(x);
      end;
    end;
  finally
    frmmain.grid_stakesAsignados.AutoSizeColumn(0);
    frmmain.grid_stakesAsignados.AutoSizeColumn(1);
    frmmain.grid_stakesAsignados.AutoSizeColumn(2);
    frmmain.grid_stakesAsignados.AutoSizeColumn(3);
    frmmain.grid_stakesAsignados.AutoSizeColumn(4);
    frmmain.grid_stakesAsignados.AutoSizeColumn(5);
    frmmain.grid_stakesAsignados.AutoSizeColumn(6);
    frmmain.grid_stakesAsignados.AutoSizeColumn(7);
    frmmain.grid_stakesAsignados.AutoSizeColumn(8);
    frmmain.grid_stakesAsignados.AutoSizeColumn(9);
    frmmain.grid_stakesAsignados.AutoSizeColumn(10);
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de populaStakesDisponibles.</summary>
/// <param name="filtro">TODO.</param>
procedure populaStakesDisponibles(filtro: string);
var
  qry: TUniQuery;
  tmpstr: string;
  x: Integer;
  nodo, subnodo: TTMSFNCTreeViewNode;
begin
  frmMain.Trvw_StakeHolderDisponibles.ClearNodes;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      if filtro = '' then
      begin
        sql.Add('select * from stakeholders order by apellidos asc');
      end
      else
      begin
        sql.Add('SELECT *');
        sql.Add('FROM stakeholders');
        sql.Add('WHERE lower(nombre) LIKE :filtro');
        sql.Add('   OR lower(apellidos) LIKE :filtro');
        sql.Add('ORDER BY apellidos ASC');
        ParamByName('filtro').AsString := '%' + LowerCase(filtro) + '%';
      end;
      Prepare;
      ExecSQL;
      x := 1;
      while not Eof do
      begin
        nodo := frmMain.Trvw_StakeHolderDisponibles.AddNode;
        nodo.Extended := True;
        nodo.Text[0] := FieldByName('idFiscal').AsString + ' - ' + FieldByName('Nombre').AsString + ' ' + FieldByName('apellidos').AsString;
        subnodo := frmMain.Trvw_StakeHolderDisponibles.AddNode(nodo);
        subnodo.Extended := False;
        subnodo.Text[0] := 'Profesión: ';
        subnodo.Text[1] := FieldByName('Titulacion').AsString;
        subnodo := frmMain.Trvw_StakeHolderDisponibles.AddNode(nodo);
        subnodo.Extended := False;
        subnodo.Text[0] := 'Direccion: ';
        subnodo.Text[1] := FieldByName('Direccion').AsString;
        subnodo := frmMain.Trvw_StakeHolderDisponibles.AddNode(nodo);
        subnodo.Extended := False;
        subnodo.Text[0] := 'Localidad: ';
        subnodo.Text[1] := FieldByName('Localidad').AsString;
        subnodo := frmMain.Trvw_StakeHolderDisponibles.AddNode(nodo);
        subnodo.Extended := False;
        subnodo.Text[0] := 'Provincia: ';
        subnodo.Text[1] := FieldByName('Provincia').AsString;
        subnodo := frmMain.Trvw_StakeHolderDisponibles.AddNode(nodo);
        subnodo.Extended := False;
        subnodo.Text[0] := 'Pais: ';
        subnodo.Text[1] := FieldByName('Pais').AsString;
        subnodo := frmMain.Trvw_StakeHolderDisponibles.AddNode(nodo);
        subnodo.Extended := False;
        subnodo.Text[0] := 'E-Mail: ';
        subnodo.Text[1] := FieldByName('email').AsString;
        subnodo := frmMain.Trvw_StakeHolderDisponibles.AddNode(nodo);
        subnodo.Extended := False;
        subnodo.Text[0] := 'Institucion: ';
        subnodo.Text[1] := FieldByName('institucion').AsString;
        Next;
        Inc(x);
      end;
    end;
  finally
    frmmain.Trvw_StakeHolderDisponibles.CollapseAll;
    qry.Free;
  end;
end;

function existeCadena(Lista: TStringList; cadena: string): Boolean;
var
  posicion: Integer;
begin
  Lista.Sort;
  existeCadena := Lista.Find(cadena, posicion);
end;

/// <summary>TODO: Descripción de RellenaPertenencia.</summary>
/// <param name="idUnicoRecurso">TODO.</param>
procedure RellenaPertenencia(idUnicoRecurso: string);
var
  qry: TUniQuery;
  x: Integer;
  listadoApus: TStringList;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  listadoApus := TStringList.Create;
  frmPertenencia.grid_Pertenencia.ClearNormalCells;
  frmPertenencia.grid_Pertenencia.Cells[0, 0] := '#';
  frmPertenencia.grid_Pertenencia.Cells[1, 0] := 'Codigo APUS';
  frmPertenencia.grid_Pertenencia.Cells[2, 0] := 'Categiria APUS';
  frmPertenencia.grid_Pertenencia.Cells[3, 0] := 'Descripcion';
  frmPertenencia.grid_Pertenencia.Cells[4, 0] := 'Unidad';
  frmPertenencia.grid_Pertenencia.Cells[5, 0] := 'Precio';
  frmPertenencia.grid_Pertenencia.RowCount := 1;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from APUS_items where idUnicoRecurso=' + QuotedStr(idUnicoRecurso));
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        tmpstr := FieldByName('codAPU').AsString;
        if not existeCadena(listadoApus, tmpstr) then
        begin
          listadoApus.Add(tmpstr);
        end;
        Next;
      end;
    end;
    for x := 0 to listadoApus.Count - 1 do
    begin
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        sql.Add('select * from APUS where codApu=' + QuotedStr(listadoApus[x]));
        Prepare;
        ExecSQL;
        while not Eof do
        begin
          frmPertenencia.grid_Pertenencia.RowCount := x + 1;
          frmPertenencia.grid_Pertenencia.Cells[0, x + 1] := inttostr(x + 1);
          frmPertenencia.grid_Pertenencia.Cells[1, x + 1] := listadoApus[x];
          frmPertenencia.grid_Pertenencia.Cells[2, x + 1] := FieldByName('CategoriaApu').AsString;
          frmPertenencia.grid_Pertenencia.Cells[3, x + 1] := FieldByName('Descripcion').AsString;
          frmPertenencia.grid_Pertenencia.Cells[4, x + 1] := FieldByName('Unidad').AsString;
          frmPertenencia.grid_Pertenencia.Cells[5, x + 1] := FieldByName('PrecioUnitarioTotal').AsString;
          frmPertenencia.grid_Pertenencia.Cells[5, x + 1] := decimal_correcto(frmPertenencia.grid_Pertenencia.Cells[4, x + 1]);
        end;
      end;
    end;
  finally
    frmPertenencia.grid_Pertenencia.StretchColumn(0);
    frmPertenencia.grid_Pertenencia.StretchColumn(1);
    frmPertenencia.grid_Pertenencia.StretchColumn(2);
    frmPertenencia.grid_Pertenencia.StretchColumn(3);
    frmPertenencia.grid_Pertenencia.StretchColumn(4);
    frmPertenencia.grid_Pertenencia.StretchColumn(5);

    qry.Free;
  end;
end;

function redondeaquitar(cantidad: Double; redondeo: Integer): Double;
var
  parteEntera, Partedecimal: string;
  tmpstr: string;
  tmpstr2: string;
  separadorDecimal: string;
  x, y: integer;
  Tdecimal: double;
  posicionRendodeo: integer;
  strDecimalTratar: string;
  decimalTratar: integer;
begin
  separadorDecimal := decimal_correcto(',');
  tmpstr := FloatToStr(cantidad);
  x := AnsiPos(separadorDecimal, tmpstr);
  if x > 0 then
  begin
    parteEntera := Copy(tmpstr, 1, x - 1).Trim;
    Partedecimal := Copy(tmpstr, x + 1, length(tmpstr)).Trim;
    if Partedecimal = '' then
    begin
      Partedecimal := '0';
    end;
    Partedecimal := '0' + separadorDecimal + Partedecimal;
    Tdecimal := StrToFloat(Partedecimal);
    if Tdecimal > 0 then
    begin
      x := length(Partedecimal) - 2;
      while x > redondeo do
      begin
        strDecimalTratar := RightStr(Partedecimal, 1);
        decimalTratar := StrToInt(strDecimalTratar);
        Partedecimal := Copy(Partedecimal, 1, Length(Partedecimal) - 1);
        case decimalTratar of
          5..9:
            begin
              decimalTratar := StrToInt(RightStr(Partedecimal, 1));
              Inc(decimalTratar);

              if (decimalTratar < 10) then
              begin
                Partedecimal := Copy(Partedecimal, 1, Length(Partedecimal) - 1) + inttostr(decimalTratar);
              end
              else
              begin
                if x = redondeo + 2 then
                begin
                  Tdecimal := strtofloat(Partedecimal);
                  Tdecimal := RoundTo(Tdecimal, 0 - redondeo);
                  Partedecimal := floattostr(Tdecimal);
                  x := 0;
                end;
              end;
            end;
        end;
        dec(x);
      end;
    end;
  end
  else
  begin
    parteEntera := tmpstr;
    Partedecimal := '0';
  end;
  Result := StrToFloat(parteEntera) + StrToFloat(Partedecimal);
end;

/// <summary>TODO: Descripción de cargaTipoProyectoPresupuesto.</summary>
procedure cargaTipoProyectoPresupuesto();
var
  qry: TUniQuery;
  x: Integer;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from TProyectos');
      Prepare;
      ExecSQL;
      frmmain.cbb_TProyectosPrespuesto.Clear;
      x := 0;

      while not Eof do
      begin
        setlength(listado_tipoProyectos, x + 1);
        listado_tipoProyectos[x].codigo := FieldByName('codigo').AsString;
        tmpstr := FieldByName('descripcion').AsString;
        listado_tipoProyectos[x].descripcion := tmpstr;
        frmmain.cbb_TProyectosPrespuesto.Items.Add(tmpstr);
        Next;
        Inc(x);
      end;
    end;
  finally
    frmmain.cbb_TProyectosPrespuesto.ItemIndex := 0;
    cargaCategoriaProyectos('01');
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de cargaCategoriaProyectos.</summary>
/// <param name="codigo">TODO.</param>
procedure cargaCategoriaProyectos(codigo: string);
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from TProyectosItems where codCategoriaBase=' + QuotedStr(codigo));
      Prepare;
      ExecSQL;
      frmmain.cbb_CategoriaPresupuesto.Clear;
      while not Eof do
      begin
        tmpstr := FieldByName('codigoItem').AsString + ' - ' + FieldByName('descripcion').AsString;
        frmmain.cbb_CategoriaPresupuesto.Items.Add(tmpstr);
        Next;
      end;
    end;
  finally
    qry.Free;
    frmmain.cbb_CategoriaPresupuesto.ItemIndex := 0;
  end;
end;

/// <summary>TODO: Descripción de addlistadoStakeOtros.</summary>
/// <param name="idFiscalStake">TODO.</param>
procedure addlistadoStakeOtros(idFiscalStake: string);
var
  nStake: Integer;
  qry: TUniQuery;
  tmpstr: string;
begin
  nStake := length(listado_PresupuestoStake);
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from Stakeholders where idFiscal=' + QuotedStr(idFiscalStake));
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('idFiscal').AsString;
      if tmpstr <> '' then
      begin
        setlength(listado_PresupuestoStake, nStake + 1);
        listado_PresupuestoStake[nStake].idFiscal := tmpstr;
        listado_PresupuestoStake[nStake].cargo := FieldByName('cargo').AsString;
        listado_PresupuestoStake[nStake].nombre := FieldByName('nombre').AsString;
        listado_PresupuestoStake[nStake].Apellidos := FieldByName('apellidos').AsString;
        listado_PresupuestoStake[nStake].direccion := FieldByName('direccion').AsString;
        listado_PresupuestoStake[nStake].localidad := FieldByName('localidad').AsString;
        listado_PresupuestoStake[nStake].provincia := FieldByName('provincia').AsString;
        listado_PresupuestoStake[nStake].pais := FieldByName('pais').AsString;
        listado_PresupuestoStake[nStake].telefono := FieldByName('telefono').AsString;
        listado_PresupuestoStake[nStake].email := FieldByName('telefono').AsString;
        listado_PresupuestoStake[nStake].titulacion := FieldByName('titulacion').AsString;
        listado_PresupuestoStake[nStake].institucion := FieldByName('institucion').AsString;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de BorrarDB.</summary>
/// <param name="codBaseBorrar">TODO.</param>
procedure BorrarDB(codBaseBorrar: string);
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      with qry do
      begin
        Close;
        sql.Clear;
        sql.Add('delete from bases where codBase=' + QuotedStr(codBaseBorrar));
        Prepare;
        ExecSQL;
        Close;
        sql.Clear;
        sql.Add('delete from categoriaapus where codBase=' + QuotedStr(codBaseBorrar));
        Prepare;
        ExecSQL;
        Close;
        sql.Clear;
        sql.Add('delete from recursos where codBase=' + QuotedStr(codBaseBorrar));
        Prepare;
        ExecSQL;
        Close;
        sql.Clear;
        sql.Add('delete from apus where codBase=' + QuotedStr(codBaseBorrar));
        Prepare;
        ExecSQL;
        Close;
        sql.Clear;
        sql.Add('delete from apus_items where codBase=' + QuotedStr(codBaseBorrar));
        Prepare;
        ExecSQL;
      end;
    end;
  finally
    qry.Free;
    base_activa.codBase := '';
    base_activa.nombre := '';
    base_activa.Descripcion := '';
    base_activa.indirectos := 0;
    base_activa.TRendimiento := '';
    base_activa.UMedida := '';
    base_activa.SeguridadIndustrial := False;
    base_activa.observaciones := '';
    frmmain.lbl_BaseActiva.Text := 'Base Activa: ' + base_activa.nombre;
    frmmain.lbl_APUSRendimiento.Text := base_activa.TRendimiento;
  end;
end;

/// <summary>TODO: Descripción de sincronizarCodigosCategorias.</summary>
/// <param name="codBase">TODO.</param>
procedure sincronizarCodigosCategorias(codBase: string);
var
  listadoTemporal: TStringList;
  qry: TUniQuery;
  y: Integer;
  ct1: Integer;
  z: Integer;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    for y := 0 to 6 do
    begin
      listadoTemporal := TStringList.Create;
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        sql.Add('select * from categoriaapus where codBase=' + QuotedStr(codBase) + ' and categoria_Base=' + inttostr(y));
        Prepare;
        ExecSQL;
        while not Eof do
        begin
          tmpstr := FieldByName('id').AsString;
          listadoTemporal.Add(tmpstr);
          Next;
        end;
      end;
      ct1 := 1;
      for z := 0 to listadoTemporal.Count - 1 do
      begin
        with qry do
        begin
          Connection := DModule_1.con2;
          Close;
          sql.Clear;
          sql.Add('update categoriaapus set ciu=:ciu where id=' + listadoTemporal[z]);
          Prepare;
          ParamByName('ciu').AsInteger := ct1;
          ExecSQL;
          Inc(ct1);
        end;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de daDatosMonedaPais.</summary>
/// <param name="codPais">TODO.</param>
/// <returns>TODO.</returns>
function daDatosMonedaPais(codPais: string): string;
var
  qry: TUniQuery;
  tmpstr: string;
begin
  result := 'Sin Datos';
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from currency where  CurrencyISO=' + QuotedStr(codPais));
      Prepare;
      ExecSQL;
      result := FieldByName('CurrencyName').AsString;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de cargaPaisesRegistro.</summary>
procedure cargaPaisesRegistro();
var
  x: Integer;
  paisAdd: string;
  posicionEcuador: Integer;
begin
  frmmain.cbb_registroPais.Items.Clear;
  posicionEcuador := posicionLista(listadoPaises, 'Ecuador');
  for x := 0 to listadoPaises.Count - 1 do
  begin
    paisAdd := listadoPaises[x];
    frmmain.cbb_registroPais.Items.Add(paisAdd);
  end;
  frmmain.cbb_registroPais.ItemIndex := posicionEcuador;
end;

/// <summary>TODO: Descripción de cargaComboPaises.</summary>
procedure cargaComboPaises();
var
  qry: TUniQuery;
  tmpstr: string;
  x: Integer;
begin
  qry := TUniQuery.Create(nil);
  listadoCodigoPaises := TStringList.Create;
  listadoPaises := TStringList.Create;
  listadoMonedas := TStringList.Create;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from monedaspaises order by pais asc');
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        tmpstr := FieldByName('Pais').AsString;
        listadoPaises.Add(tmpstr);
        tmpstr := FieldByName('CodMoneda').AsString;
        listadoCodigoPaises.Add(tmpstr);
        tmpstr := FieldByName('Moneda').AsString;
        listadoMonedas.Add(tmpstr);
        Next;
      end;
    end;
    posicionEcuador := posicionLista(listadoPaises, 'Ecuador');
  finally
    qry.Free;
  end;
end;

function posicionLista(lst: TStringList; cadena: string): Integer;
var
  x: Integer;
  salir: Boolean;
begin
  result := -1;
  x := 0;
  salir := False;
  while (not salir) and (x < lst.Count - 1) do
  begin
    if cadena = lst[x] then
    begin
      result := x;
      salir := True;
    end;
    Inc(x);
  end;
end;

/// <summary>TODO: Descripción de ActualizaBaseDatos.</summary>
procedure ActualizaBaseDatos();
type
  datCalculoIndirectos = record
    codApu: string;
    CostoDirectoTotal: Double;
    costoIndirectoTotal: Double;
    porcentajeIndirecto: Double;
    precioUnitarioTotal: Double;
  end;
type
  datCalculoItemAPUS = record
    idUnicoRecurso: string;
    codApu: string;
    precio: Double;
    cantidad: Double;
    Rendimiento: Double;
    total: Double;
  end;
var
  qry: TUniQuery;
  indirecto: Double;
  nuevoIndirecto: Double;
  listadoAPUSCambio: array of datCalculoIndirectos;
  listadoItemsAPUSCambio: array of datCalculoItemAPUS;
  x: Integer;
  costoDirecto: Double;
  Total: Double;
  fechaHoraModificacion: TDateTime;
begin
  qry := TUniQuery.Create(nil);
  fechaHoraModificacion := now;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('update bases set descripcion=:descripcion, indirectos=:indirectos, ' + 'seguridadIndustrial=:seguridadIndustrial, observaciones=:observaciones,');
      sql.Add(' fechaHoraModificacion=:fechaHoraModificacion, pais=:pais, cambioAplicado=:cambioAplicado, ' + 'moneda=:moneda where codBase=' + QuotedStr(base_activa.codBase));
      Prepare;
      ParamByName('descripcion').AsString := frmNuevaBase.edt_Descripcion.Text;
      ParamByName('seguridadIndustrial').AsBoolean := frmNuevaBase.chk_SeguridadIndustrial.IsChecked;
      ParamByName('observaciones').AsString := frmNuevaBase.mmo_Observaciones.Text;
      ParamByName('Indirectos').AsFloat := StrToFloat(decimal_correcto(frmNuevaBase.edt_Indirectos.Text));
      ParamByName('fechaHoraModificacion').AsDateTime := fechaHoraModificacion;
      ParamByName('pais').AsString := frmNuevaBase.cbb_pais.Items[frmNuevaBase.cbb_pais.ItemIndex];
      ParamByName('cambioAplicado').AsString := frmNuevaBase.lbl_moneda.Text;
      ParamByName('moneda').AsString := frmNuevaBase.lbl_moneda_pais.Text;
      ExecSQL;

      // Actualizacion de Apus si se cambia el porcentaje de indirectos
      indirecto := base_activa.indirectos;
      nuevoIndirecto := StrToFloat(decimal_correcto(frmNuevaBase.edt_Indirectos.Text));
      if indirecto <> nuevoIndirecto then
      begin
        Close;
        sql.Clear;
        sql.Add('select * from APUS where codBase=' + QuotedStr(base_activa.codBase));
        Prepare;
        x := 0;
        ExecSQL;
        while not Eof do
        begin
          setlength(listadoAPUSCambio, x + 1);
          listadoAPUSCambio[x].codApu := FieldByName('codAPU').AsString;
          listadoAPUSCambio[x].CostoDirectoTotal := FieldByName('costoDirectoTotal').AsFloat;
          listadoAPUSCambio[x].porcentajeIndirecto := FieldByName('porcentajeCostoIndirecto').AsFloat;
          costoDirecto := listadoAPUSCambio[x].CostoDirectoTotal;
          indirecto := nuevoIndirecto;
          Total := (costoDirecto * indirecto) / 100;
          listadoAPUSCambio[x].costoIndirectoTotal := Total;
          Total := costoDirecto + Total;
          listadoAPUSCambio[x].precioUnitarioTotal := Total;
          Next;
          Inc(x);
        end;
        for x := 0 to length(listadoAPUSCambio) - 1 do
        begin
          Close;
          sql.Clear;
          sql.Add('update APUS set porcentajecostoIndirecto=:porcentajecostoIndirecto, costoIndirectoTotal=:costoIndirectoTotal, PrecioUnitarioTotal=:PrecioUnitarioTotal, ultimaModificacion=:ultimaModificacion where codAPU=' + QuotedStr(listadoAPUSCambio[x].codApu));
          Prepare;
          ParamByName('porcentajeCostoIndirecto').AsFloat := nuevoIndirecto;
          ParamByName('costoIndirectoTotal').AsFloat := listadoAPUSCambio[x].costoIndirectoTotal;
          ParamByName('PrecioUnitarioTotal').AsFloat := listadoAPUSCambio[x].precioUnitarioTotal;
          ParamByName('ultimaModificacion').AsDateTime := fechaHoraModificacion;
          ExecSQL;
        end;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de cargaDatosBase.</summary>
procedure cargaDatosBase();
var
  x: Integer;
begin
  cambiaEstadoBase(false);
  frmNuevaBase.edt_NombreBase.Text := base_activa.nombre;
  frmNuevaBase.edt_Descripcion.Text := base_activa.Descripcion;
  frmNuevaBase.edt_Indirectos.Text := FloatToStr(base_activa.indirectos);
  if base_activa.TRendimiento = 'Rendimiento Unitario (Tiempo/Unidad)' then
    frmNuevaBase.cbb_Rendimiento.ItemIndex := 0
  else
    frmNuevaBase.cbb_Rendimiento.ItemIndex := 1;
  frmNuevaBase.cbb_UTiempos.ItemIndex := 0;
  for x := 0 to frmNuevaBase.cbb_UTiempos.Items.Count - 1 do
  begin
    if base_activa.UMedida = frmNuevaBase.cbb_UTiempos.Items[x] then
    begin
      frmNuevaBase.cbb_UTiempos.ItemIndex := x;
    end;
  end;
  frmNuevaBase.lbl_moneda.Text := '';
  posicionaCombo(frmNuevaBase.cbb_pais, base_activa.pais);
  frmNuevaBase.mmo_Observaciones.Text := base_activa.observaciones;
  frmNuevaBase.chk_SeguridadIndustrial.IsChecked := base_activa.SeguridadIndustrial;
end;

/// <summary>TODO: Descripción de CambiaEstadoBase.</summary>
/// <param name="estado">TODO.</param>
procedure CambiaEstadoBase(estado: Boolean);
begin
  frmNuevaBase.edt_NombreBase.ReadOnly := not estado;
  frmNuevaBase.cbb_Rendimiento.Enabled := False;
  frmNuevaBase.cbb_UTiempos.Enabled := False;
end;

/// <summary>TODO: Descripción de actualizaRecursoTotal.</summary>
/// <param name="idUnicoRecurso">TODO.</param>
/// <param name="Descripcion">TODO.</param>
/// <param name="Precio">TODO.</param>
procedure actualizaRecursoTotal(idUnicoRecurso, Descripcion, Precio: string);
type
  datAPUST = record
    codApu: string;
    cantidad: string;
    Rendimiento: string;
    TotalAPU: string;
    porcentajeCostoIndirecto: string;
  end;
var
  qry: TUniQuery;
  tmpstr: string;
  listadoAPUSModificar: array of datAPUST;
  x: Integer;
  Total: Double;
  Rendimiento: Double;
  cantidadArt: Double;
  tmpflt, tmpflt2, tmpflt3: Double;
  numeroDoble: double;
begin
  qry := TUniQuery.Create(nil);
  Precio := decimal_correcto(Precio);

  try
    with qry do
    begin
      Connection := DModule_1.con2;

      // Actualizar recursos
      Close;
      sql.Clear;
      sql.Add('update recursos set descripcion=:descripcion, precio=:precio where codBase=' + QuotedStr(base_activa.codBase) + ' and idUnico=' + QuotedStr(idUnicoRecurso));
      Prepare;
      ParamByName('descripcion').AsString := Descripcion;
      ParamByName('precio').AsFloat := StrToFloat(Precio);
      ExecSQL;

      // Crear lista de APUS a modificar
      Close;
      sql.Clear;
      sql.Add('select * from APUS_Items where  idUnicoRecurso=' + QuotedStr(idUnicoRecurso) + ' and codBase=' + QuotedStr(base_activa.codBase));
      Prepare;
      ExecSQL;
      x := 0;
      while not Eof do
      begin
        setlength(listadoAPUSModificar, x + 1);
        tmpstr := FieldByName('codAPU').AsString;
        listadoAPUSModificar[x].codApu := tmpstr;
        tmpstr := FieldByName('cantidadUnidad').AsString;
        listadoAPUSModificar[x].cantidad := decimal_correcto(tmpstr);
        tmpstr := FieldByName('rendimiento').AsString;
        listadoAPUSModificar[x].Rendimiento := decimal_correcto(tmpstr);
        Inc(x);
        Next;
      end;

      // actualizar items
      Close;
      sql.Clear;
      sql.Add('update APUS_Items set descripcion=:descripcion, cantidadUnidad=:cantidadUnidad, precio=:precio, total=:total where codbase=' + QuotedStr(base_activa.codBase) + ' and idUnicoRecurso=' + QuotedStr(idUnicoRecurso) + ' and codAPU=:codAPU');
      Prepare;
      for x := 0 to length(listadoAPUSModificar) - 1 do
      begin
        ParamByName('codAPU').AsString := listadoAPUSModificar[x].codApu;
        cantidadArt := StrToFloat(listadoAPUSModificar[x].cantidad);
        Rendimiento := StrToFloat(listadoAPUSModificar[x].Rendimiento);
        if not (base_activa.TRendimiento = 'Rendimiento Unitario (Tiempo/Unidad)') then
        begin
          Rendimiento := 1 / Rendimiento;
        end;
        Total := StrToFloat(Precio);
        Total := Total * cantidadArt * Rendimiento;
        ParamByName('descripcion').AsString := Descripcion;
        ParamByName('precio').AsFloat := StrToFloat(Precio);
        ParamByName('cantidadUnidad').AsFloat := cantidadArt;
        ParamByName('total').AsFloat := Total;
        ExecSQL;
      end;

      // calcular totales
      for x := 0 to length(listadoAPUSModificar) - 1 do
      begin
        Close;
        sql.Clear;
        sql.Add('select SUM(total) as TotalesRecalculados from APUS_Items where codBase=' + QuotedStr(base_activa.codBase) + ' and codAPU=' + QuotedStr(listadoAPUSModificar[x].codApu));
        Prepare;
        ExecSQL;
        tmpstr := FieldByName('totalesRecalculados').AsString;
        tmpstr := decimal_correcto(tmpstr);
        Total := StrToFloatdef(tmpstr, 0);
        listadoAPUSModificar[x].TotalAPU := FloatToStr(Total);
      end;

      // Actualizar totales en APUS
      for x := 0 to length(listadoAPUSModificar) - 1 do
      begin
        Close;
        sql.Clear;
        sql.Add('select * from APUS where codAPU=' + QuotedStr(listadoAPUSModificar[x].codApu) + ' and codBase=' + QuotedStr(base_activa.codBase));
        Prepare;
        ExecSQL;
        listadoAPUSModificar[x].porcentajeCostoIndirecto := FieldByName('porcentajeCostoIndirecto').AsString;
      end;

      for x := 0 to length(listadoAPUSModificar) - 1 do
      begin
        Close;
        sql.Clear;
        sql.Add('update APUS set costoDirectoTotal=:costoDirectoTotal, CostoIndirectoTotal=:costoIndirectoTotal, PrecioUnitarioTotal=:PrecioUnitarioTotal where codAPU=' + QuotedStr(listadoAPUSModificar[x].codApu) + ' and codBase=' + QuotedStr(base_activa.codBase));
        Prepare;
        tmpstr := listadoAPUSModificar[x].TotalAPU;
        numeroDoble := StrToFloatDef(tmpstr, 0);
        ParamByName('costoDirectoTotal').AsFloat := numeroDoble;
        tmpflt := StrToFloat(listadoAPUSModificar[x].TotalAPU);
        tmpflt2 := StrToFloat(listadoAPUSModificar[x].porcentajeCostoIndirecto);
        tmpflt3 := (tmpflt * tmpflt2) / 100;
        ParamByName('CostoIndirectoTotal').AsFloat := tmpflt3;
        tmpflt3 := tmpflt3 + tmpflt;
        ParamByName('PrecioUnitarioTotal').AsFloat := tmpflt3;
        ExecSQL;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de mueveAPUS.</summary>
/// <param name="codAPUSCompleto">TODO.</param>
/// <param name="categoriaDrop">TODO.</param>
/// <param name="codUnicoAPU">TODO.</param>
procedure mueveAPUS(codAPUSCompleto, categoriaDrop, codUnicoAPU: string);
var
  qry: TUniQuery;
  codRecursoAPU: string;
begin
  codRecursoAPU := nuevoCodigoRecurso('6', categoriaDrop);
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('update APUS set codCategoriaAPU=:codCategoriaAPU,codRecursoAPU=:codRecursoAPU  where codAPU=' + QuotedStr(codUnicoAPU) + ' and codBase=' + QuotedStr(base_activa.codBase));
      Prepare;
      ParamByName('codCategoriaAPU').AsString := categoriaDrop;
      ParamByName('codRecursoAPU').AsString := codRecursoAPU;
      ExecSQL;
      Close;
      sql.Clear;
      sql.Add('update recursos set codRecurso=:codRecurso, codSubCategoria=:codSubCategoria where codBase=' + QuotedStr(base_activa.codBase) + ' and Especificaciones=' + QuotedStr('APU: ' + codUnicoAPU));
      Prepare;
      ParamByName('codRecurso').AsString := codRecursoAPU;
      ParamByName('codSubCategoria').AsString := categoriaDrop;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de nuevoCodigoRecurso.</summary>
/// <param name="Categoria">TODO.</param>
/// <param name="subCategoria">TODO.</param>
/// <returns>TODO.</returns>
function nuevoCodigoRecurso(Categoria, subCategoria: string): string;
var
  qry: TUniQuery;
  x: Integer;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from Recursos where codCategoriaBase=' + QuotedStr(Categoria) + ' and codSubCategoria=' + QuotedStr(subCategoria) + ' and codBase=' + QuotedStr(base_activa.codBase) + ' order by codRecurso asc');
      Prepare;
      ExecSQL;
      x := 1;
      Last;
      tmpstr := FieldByName('codRecurso').AsString;
      x := strtointdef(tmpstr, 0);
      inc(x);
    end;
  finally
    result := inttostr(x);
    qry.Free;
  end;
end;

function NcaracteresDelante(datos: string; ncaracteres: Integer): string;
var
  x: Integer;
begin
  result := '';
  for x := 1 to ncaracteres - length(datos) do
  begin
    result := result + '0';
  end;
  result := result + datos;
end;

/// <summary>TODO: Descripción de MueveRecurso.</summary>
/// <param name="codRecursoCompleto">TODO.</param>
/// <param name="codUnicoRecurso">TODO.</param>
/// <param name="nuevaPosicion">TODO.</param>
procedure MueveRecurso(codRecursoCompleto, codUnicoRecurso, nuevaPosicion: string);
var
  nuevaSubcategoria: string;
  newCodRecurso: string;
  codCategoriaBase, codSubCategoria, codRecurso: string;
  nuevocodRecursoCompleto: string;
  qry: TUniQuery;
  x: Integer;
begin
  x := AnsiPos('_', nuevaPosicion);
  nuevaSubcategoria := Copy(nuevaPosicion, x + 1, length(nuevaPosicion));
  nuevaSubcategoria := trim(nuevaSubcategoria);
  codCategoriaBase := daDatoCodigo(codRecursoCompleto, 1);
  codSubCategoria := daDatoCodigo(codRecursoCompleto, 2);
  codRecurso := daDatoCodigo(codRecursoCompleto, 3);
  newCodRecurso := nuevoCodigoRecurso(codCategoriaBase, codSubCategoria);

  // nuevoCodRecurso(StrToInt(codCategoriaBase), StrToInt(codSubcategoria));
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('update recursos set codCategoriaBase=:codCategoriaBase, codSubCategoria=:codSubcategoria, codRecurso=:codRecurso where codBase=' + QuotedStr(base_activa.codBase) + ' and idUnico=' + QuotedStr(codUnicoRecurso));
      Prepare;
      ParamByName('codCategoriaBase').AsString := codCategoriaBase;
      ParamByName('codSubcategoria').AsString := nuevaSubcategoria;
      ParamByName('codRecurso').AsString := newCodRecurso;
      ExecSQL;
      Close;
      sql.Clear;
      sql.Add('update APUS_Items set codCategoria=:codCategoria, codSubCategoria=:codSubCategoria, codRecurso=:codRecurso, codRecursoCompleto=:codRecursoCompleto where codBase=' + QuotedStr(base_activa.codBase) + ' and idUnicoRecurso=' + QuotedStr(codUnicoRecurso));
      Prepare;
      nuevocodRecursoCompleto := generaCodigoRecurso(codCategoriaBase, nuevaSubcategoria, newCodRecurso);
      ParamByName('codCategoria').AsString := codCategoriaBase;
      ParamByName('codSubcategoria').AsString := nuevaSubcategoria;
      ParamByName('codRecurso').AsString := newCodRecurso;
      ParamByName('codRecursoCompleto').AsString := nuevocodRecursoCompleto;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de MuestraSubCategoriaItemsAPUSRecursos.</summary>
/// <param name="codCompletoItem">TODO.</param>
procedure MuestraSubCategoriaItemsAPUSRecursos(codCompletoItem: string);
var
  codCategoria, codSubCategoria: string;
  qry: TUniQuery;
begin
  frmAddAPU.lbl_CategoriaItemMostrado.Text := '';
  codCategoria := daDatoCodigo(codCompletoItem, 1);
  codSubCategoria := daDatoCodigo(codCompletoItem, 2);
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select descripcion from categoriaapus where codBase=' + QuotedStr(base_activa.codBase) + ' and categoria_Base=' + QuotedStr(codCategoria) + ' and ciu=' + QuotedStr(codSubCategoria));
      Prepare;
      ExecSQL;
      frmAddAPU.lbl_CategoriaItemMostrado.Text := FieldByName('descripcion').AsString;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de cuentaItemsAPUSRecursos.</summary>
procedure cuentaItemsAPUSRecursos();
var
  x: Integer;
begin
  x := frmAddAPU.grid_APUSRecursos.RowCount - 1;
  frmAddAPU.lbl_nItemsMostrados.Text := inttostr(x);
end;

/// <summary>TODO: Descripción de ActualizaDescripcionAPU.</summary>
/// <param name="codApu">TODO.</param>
/// <param name="DescripcionAPU">TODO.</param>
/// <param name="UnidadAPU">TODO.</param>
procedure ActualizaDescripcionAPU(codApu, DescripcionAPU, UnidadAPU: string);
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from apus where descripcion=' + QuotedStr(DescripcionAPU) + ' and unidad=' + QuotedStr(UnidadAPU) + ' and codbase=' + QuotedStr(base_activa.codBase));
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('descripcion').AsString;
      if tmpstr = '' then
      begin
        Close;
        sql.Clear;
        sql.Add('update APUS set descripcion=:descripcion, Unidad=:unidad where codAPU=' + QuotedStr(codApu));
        Prepare;
        ParamByName('descripcion').AsString := DescripcionAPU;
        ParamByName('unidad').AsString := UnidadAPU;
        ExecSQL;
        Close;
        sql.Clear;
        sql.Add('update Recursos set descripcion=:descripcion, Unidad=:unidad where Especificaciones=' + QuotedStr('APU: ' + codApu));
        Prepare;
        ParamByName('descripcion').AsString := DescripcionAPU;
        ParamByName('unidad').AsString := UnidadAPU;
        ExecSQL;
      end
      else
      begin
        MuestraMensajeGiproy('Descripción y unidad ya usada.')
      end;
    end;
  finally
    refrescalistaAPUsDisponibles();
    limpia_APUSVisor();
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de BorrarAPU.</summary>
/// <param name="codApu">TODO.</param>
procedure BorrarAPU(codApu: string);
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('delete from APUS where codAPU=' + QuotedStr(codApu) + ' and codBase=' + QuotedStr(base_activa.codBase));
      Prepare;
      ExecSQL;
      Close;
      sql.Clear;
      sql.Add('delete from APUS_Items where codAPU=' + QuotedStr(codApu) + ' and codBase=' + QuotedStr(base_activa.codBase));
      Prepare;
      ExecSQL;
      Close;
      sql.Clear;
      sql.Add('delete from recursos where codBase=' + QuotedStr(base_activa.codBase) + ' and especificaciones=' + QuotedStr('APU: ' + codApu));
      Prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de cargaAPUEdicion.</summary>
/// <param name="codApu">TODO.</param>
procedure cargaAPUEdicion(codApu: string);
var
  qry: TUniQuery;
  node, subNode: TTMSFMXTreeViewNode;
  x, y: Integer;
  categoriaBase: string;
  subCategoria: string;
  codRecurso: string;
  Rendimiento: string;
  Precio: string;
  Total: string;
  porcentaje: string;
  cantidad: string;
  SQLText: string;
  costoDirecto, costoIndirecto, porcentajeIndirecto, totalApu: double;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      if not contieneTanteo then
      begin

        sql.Add('select * from APUS where codAPU=' + QuotedStr(codApu) + ' and codBase=' + QuotedStr(base_activa.codBase));
        Prepare;
        ExecSQL;
        First;
        frmAddAPU.edt_APUSDescripcion.Text := FieldByName('descripcion').AsString;
        frmAddAPU.edt_APUSUnidad.Text := FieldByName('unidad').AsString;
        codCategoriaAPUSeleccionada := FieldByName('codCategoriaApu').AsString;
        CategoriaAPUSeleccionada := FieldByName('CategoriaAPU').AsString;
        frmAddAPU.lbl_codAPU.Text := codApu;
        frmAddAPU.lbl_APUSRendimiento.Text := FieldByName('rendimiento').AsString;
        frmAddAPU.lbl_APUCostoDirectoTotal.Text := FieldByName('CostoDirectoTotal').AsString;
        frmAddAPU.lbl_APUCostoIndirectoTotal.Text := FieldByName('CostoIndirectoTotal').AsString;
        if frmAddAPU.lbl_modo.Text <> '3' then
        begin
          frmAddAPU.edt_PorcentajeIndirecto.Text := FieldByName('PorcentajeCostoIndirecto').AsString;
        end
        else
        begin
          frmAddAPU.edt_PorcentajeIndirecto.Text := FloatToStr(IndirectosPresupuesto);
        end;
        frmAddAPU.lbl_APUPrecioUnitario.Text := decimal_correcto(FieldByName('PrecioUnitarioTotal').AsString);
        frmAddAPU.chkRevision.IsChecked := FieldByName('pendienteRevision').AsBoolean;
        Close;
        sql.Clear;
        sql.Add('select * from APUS_Items where codAPU=' + QuotedStr(codApu) + ' and codBase=' + QuotedStr(base_activa.codBase));
        Prepare;
        ExecSQL;
        while not Eof do
        begin
          x := FieldByName('codCategoria').AsInteger;
          if x = 6 then
            x := 2;
          if (not base_activa.SeguridadIndustrial) then
          begin
            if x <> 5 then
            begin
              node := frmAddAPU.trvw_APUS.Nodes[x - 1];
              subNode := frmAddAPU.trvw_APUS.AddNode(node);
              categoriaBase := FieldByName('codCategoria').AsString;
              subCategoria := FieldByName('codSubCategoria').AsString;
              codRecurso := FieldByName('codRecurso').AsString;
              subNode.Text[0] := generaCodigoRecurso(categoriaBase, subCategoria, codRecurso);
              subNode.Text[1] := FieldByName('descripcion').AsString;
              subNode.Text[2] := FieldByName('Unidad').AsString;
              cantidad := FieldByName('CantidadUnidad').AsString;
              subNode.Text[3] := cantidad;
              Precio := decimal_correcto(FieldByName('precio').AsString);
              subNode.Text[4] := Precio;
              if (categoriaBase = '1') or (categoriaBase = '3') or (categoriaBase = '4') then
              begin
                Rendimiento := FieldByName('rendimiento').AsString;
                subNode.Text[5] := Rendimiento;
              end
              else
              begin
                Rendimiento := '';
              end;
              Total := frmAddAPU.calcularTotal(cantidad, Precio, Rendimiento, strtoint(categoriaBase));
              subNode.Text[6] := Total;
              subNode.Text[7] := FieldByName('porcentaje').AsString + '%';
              subNode.Text[8] := categoriaBase;
              subNode.Text[9] := FieldByName('idUnicoRecurso').AsString;
            end;
          end
          else
          begin
            node := frmAddAPU.trvw_APUS.Nodes[x - 1];
            subNode := frmAddAPU.trvw_APUS.AddNode(node);
            categoriaBase := FieldByName('codCategoria').AsString;
            subCategoria := FieldByName('codSubCategoria').AsString;
            codRecurso := FieldByName('codRecurso').AsString;
            subNode.Text[0] := generaCodigoRecurso(categoriaBase, subCategoria, codRecurso);
            subNode.Text[1] := FieldByName('descripcion').AsString;
            subNode.Text[2] := FieldByName('Unidad').AsString;
            cantidad := FieldByName('CantidadUnidad').AsString;
            subNode.Text[3] := cantidad;
            Precio := decimal_correcto(FieldByName('precio').AsString);
            subNode.Text[4] := Precio;
            if (categoriaBase = '1') or (categoriaBase = '3') or (categoriaBase = '4') then
            begin
              Rendimiento := FieldByName('rendimiento').AsString;
              subNode.Text[5] := Rendimiento;
            end
            else
            begin
              Rendimiento := '';
            end;
            Total := frmAddAPU.calcularTotal(cantidad, Precio, Rendimiento, strtoint(categoriaBase));
            subNode.Text[6] := Total;
            subNode.Text[7] := FieldByName('porcentaje').AsString + '%';
            subNode.Text[8] := categoriaBase;
            subNode.Text[9] := FieldByName('idUnicoRecurso').AsString;
          end;
          Next;
        end;
      end
      else
      begin
        SQLText := daSQLQueryText(8);
        SQL.Add(SQLText);
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codAPU').AsString := codApu;
        Prepare;
        ExecSQL;
        First;
        frmAddAPU.edt_APUSDescripcion.Text := FieldByName('descripcion').AsString;
        frmAddAPU.edt_APUSUnidad.Text := FieldByName('unidad').AsString;
        codCategoriaAPUSeleccionada := FieldByName('codCategoriaApu').AsString;
        CategoriaAPUSeleccionada := FieldByName('CategoriaAPU').AsString;
        frmAddAPU.lbl_codAPU.Text := codApu;
        frmAddAPU.lbl_APUSRendimiento.Text := FieldByName('rendimiento').AsString;
        frmAddAPU.lbl_APUCostoDirectoTotal.Text := FieldByName('CostoDirectoTotal').AsString;
        costoDirecto := StrToFloat(decimal_correcto(frmAddAPU.lbl_APUCostoDirectoTotal.Text));

        if frmAddAPU.lbl_modo.Text <> '3' then
        begin
          frmAddAPU.edt_PorcentajeIndirecto.Text := FloatToStr(base_activa.indirectos);
        end
        else
        begin
          frmAddAPU.edt_PorcentajeIndirecto.Text := FloatToStr(IndirectosPresupuesto);
        end;
        porcentajeIndirecto := StrToFloat(decimal_correcto(frmAddAPU.edt_PorcentajeIndirecto.text));
        costoIndirecto := (costoDirecto * porcentajeIndirecto) / 100;
        totalApu := costoDirecto + costoIndirecto;
        frmAddAPU.lbl_APUCostoIndirectoTotal.Text := FloatToStr(costoIndirecto);

        frmAddAPU.lbl_APUPrecioUnitario.Text := FloatToStr(totalApu);
        frmAddAPU.chkRevision.IsChecked := FieldByName('pendienteRevision').AsBoolean;
        Close;
        sql.Clear;
        SQLText := daSQLQueryText(9);
        sql.Add(SQLText);
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codApu').AsString := codApu;
        Prepare;
        ExecSQL;
        while not Eof do
        begin
          x := FieldByName('codCategoria').AsInteger;
          if x = 6 then
            x := 2;
          if (not base_activa.SeguridadIndustrial) then
          begin
            if x <> 5 then
            begin
              node := frmAddAPU.trvw_APUS.Nodes[x - 1];
              subNode := frmAddAPU.trvw_APUS.AddNode(node);
              categoriaBase := FieldByName('codCategoria').AsString;
              subCategoria := FieldByName('codSubCategoria').AsString;
              codRecurso := FieldByName('codRecurso').AsString;
              subNode.Text[0] := generaCodigoRecurso(categoriaBase, subCategoria, codRecurso);
              subNode.Text[1] := FieldByName('descripcion').AsString;
              subNode.Text[2] := FieldByName('Unidad').AsString;
              cantidad := FieldByName('CantidadUnidad').AsString;
              subNode.Text[3] := cantidad;
              Precio := decimal_correcto(FieldByName('precio').AsString);
              subNode.Text[4] := Precio;
              if (categoriaBase = '1') or (categoriaBase = '3') or (categoriaBase = '4') then
              begin
                Rendimiento := FieldByName('rendimiento').AsString;
                subNode.Text[5] := Rendimiento;
              end
              else
              begin
                Rendimiento := '';
              end;
              Total := frmAddAPU.calcularTotal(cantidad, Precio, Rendimiento, strtoint(categoriaBase));
              subNode.Text[6] := Total;
              subNode.Text[7] := FieldByName('porcentaje').AsString + '%';
              subNode.Text[8] := categoriaBase;
              subNode.Text[9] := FieldByName('idUnicoRecurso').AsString;
            end;
          end
          else
          begin
            node := frmAddAPU.trvw_APUS.Nodes[x - 1];
            subNode := frmAddAPU.trvw_APUS.AddNode(node);
            categoriaBase := FieldByName('codCategoria').AsString;
            subCategoria := FieldByName('codSubCategoria').AsString;
            codRecurso := FieldByName('codRecurso').AsString;
            subNode.Text[0] := generaCodigoRecurso(categoriaBase, subCategoria, codRecurso);
            subNode.Text[1] := FieldByName('descripcion').AsString;
            subNode.Text[2] := FieldByName('Unidad').AsString;
            cantidad := FieldByName('CantidadUnidad').AsString;
            subNode.Text[3] := cantidad;
            Precio := decimal_correcto(FieldByName('precio').AsString);
            subNode.Text[4] := Precio;
            if (categoriaBase = '1') or (categoriaBase = '3') or (categoriaBase = '4') then
            begin
              Rendimiento := FieldByName('rendimiento').AsString;
              subNode.Text[5] := Rendimiento;
            end
            else
            begin
              Rendimiento := '';
            end;
            Total := frmAddAPU.calcularTotal(cantidad, Precio, Rendimiento, strtoint(categoriaBase));
            subNode.Text[6] := Total;
            subNode.Text[7] := FieldByName('porcentaje').AsString + '%';
            subNode.Text[8] := categoriaBase;
            subNode.Text[9] := FieldByName('idUnicoRecurso').AsString;
          end;
          Next;
        end;
      end;
    end;
  finally
    frmAddAPU.calculaTotales;
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de daNuevoNombreAPU.</summary>
/// <param name="nombreBase">TODO.</param>
/// <returns>TODO.</returns>
function daNuevoNombreAPU(nombreBase: string): string;
var
  x: Integer;
  salir: Boolean;
  nombreNuevo: string;

  /// <summary>TODO: Descripción de compruebaNombreAPUUsado.</summary>
  /// <param name="nombreNuevo">TODO.</param>
  /// <returns>TODO.</returns>

  function compruebaNombreAPUUsado(nombreNuevo: string): Boolean;
  var
    salir2: Boolean;
    I: Integer;
  begin
    result := False;
    I := 1;
    salir2 := False;
    while (not salir2) and (I < frmmain.grid_APUSRecursos.RowCount) do
    begin
      if nombreNuevo = frmmain.grid_APUSRecursos.Cells[2, I] then
      begin
        result := True;
        salir2 := True;
      end;
      Inc(I);
    end;
  end;

begin
  x := 1;
  salir := False;
  while not salir do
  begin
    nombreNuevo := nombreBase + '_(' + inttostr(x) + ')';
    if not compruebaNombreAPUUsado(nombreNuevo) then
    begin
      result := nombreNuevo;
      salir := True;
    end;
    Inc(x);
  end;
end;

/// <summary>TODO: Descripción de duplicarAPU.</summary>
/// <param name="codApu">TODO.</param>
/// <param name="descripcionNueva">TODO.</param>
/// <returns>TODO.</returns>
function duplicarAPU(codApu, descripcionNueva: string): string;
var
  codApuNueva: string;
  especificacionBusqueda: string;
  idRecursoAntiguo: string;
  idRecursoNuevo: string;
  qry: TUniQuery;
  especificaciones: string;
  categoria: string;
  codRecursoAPU: Integer;
  x: integer;
begin
  result := '';
  codApuNueva := GeneraCodUnicoAPU;
  idRecursoNuevo := 'Rsr' + generaCodigoUnico;
  especificaciones := 'APU: ' + codApuNueva;

  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      {Consigue idUnicoRecurso de APU}
      Close;
      sql.Clear;
      sql.Add('select * from recursos where codBase=:codBase and especificaciones=:especificaciones');
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('especificaciones').AsString := 'APU: ' + codApu;
      prepare;
      ExecSQL;
      idRecursoAntiguo := FieldByName('idUnico').AsString;
      close;
      sql.Clear;
      sql.add('select * from APUS where codCategoriaAPU IN (select codcategoriaAPU from APUS where codAPU=:codAPU and codBase=:codBase) order by codCategoriaAPU asc');
      ParamByName('codAPU').AsString := codApu;
      ParamByName('codBase').AsString := base_activa.codBase;
      prepare;
      ExecSQL;
      Last;
      categoria := FieldByName('codCategoriaAPU').AsString;
      codRecursoAPU := FieldByName('codRecursoAPU').AsInteger;
      inc(codRecursoAPU);

      {Duplicar Apu}
      Close;
      sql.Clear;
      sql.Add('insert into APUS (codBase, codCategoriaAPU, codRecursoAPU, CategoriaAPU, codAPU, descripcion, ' + 'Unidad, rendimiento, rendimientoTodoAnalisis, RendimientoTodoEscenario, FechaHoraCreacion, CostoDirectoTotal,' + ' CostoIndirectoTotal, PorcentajeCostoIndirecto, PrecioUnitarioTotal, moneda, codCPC, ultimaModificacion, pendienteRevision,' + ' rendimientoHUnidad, nhCuadrillas, anidado) ');
      sql.Add(' Select codBase, codCategoriaAPU, ' + QuotedStr(IntToStr(codRecursoAPU)) + ', CategoriaAPU, ' + quotedstr(codApuNueva) + ', ' + quotedstr(descripcionNueva) + ',' + ' Unidad, rendimiento, rendimientoTodoAnalisis, RendimientoTodoEscenario, FechaHoraCreacion, CostoDirectoTotal,' + ' CostoIndirectoTotal, PorcentajeCostoIndirecto, PrecioUnitarioTotal, moneda, codCPC, ultimaModificacion, pendienteRevision,' + ' rendimientoHUnidad, nhCuadrillas, anidado from APUS where codAPU=:codAPU and codBase=:codBase');
      ParamByName('codApu').AsString := codApu;
      ParamByName('codBase').AsString := base_activa.codBase;
      Prepare;
      ExecSQL;
      {Duplica Items del APU}
      close;
      SQL.Clear;
      sql.Add('insert into APUS_Items (codBase, codAPU, codCategoria, codSubCategoria, idUnicoRecurso, codRecurso,' + ' codRecursoCompleto, descripcion, unidad, precio, CantidadUnidad, rendimiento, Total, porcentaje, codCPC, tipoCPC, termino) ');
      sql.Add('select codBase, ' + QuotedStr(codApuNueva) + ', codCategoria, codSubCategoria, idUnicoRecurso, codRecurso, ' + 'codRecursoCompleto, descripcion, unidad, precio, CantidadUnidad, rendimiento, Total, porcentaje, codCPC, tipoCPC, termino' + ' from APUS_items where codAPU=:codAPU and codBase=:codBase ');
      ParamByName('codApu').AsString := codApu;
      ParamByName('codBase').AsString := base_activa.codBase;
      Prepare;
      ExecSQL;
      {Crear Apu duplicado como Recurso}
      close;
      sql.Clear;
      sql.Add('insert into recursos (idUnico, codBase, codRecurso, codRecursoCompleto, codCategoriaBase,' + ' codSubCategoria, descripcion, unidad, precio, preciolocal, precioBase, moneda, termino,' + ' codAlternativo, codCPC, tipoCPC, porcentajeCPC, especificaciones, fechaHoraCreacion,' + ' ultimaModificacion, codDistribuidor, distribuidor) ');
      sql.Add(' select ' + QuotedStr(idRecursoNuevo) + ', codBase, codRecurso, codRecursoCompleto, codCategoriaBase,' + ' codSubCategoria, descripcion, unidad, precio, preciolocal, precioBase, moneda, termino,' + ' codAlternativo, codCPC, tipoCPC, porcentajeCPC, ' + quotedstr(especificaciones) + ', fechaHoraCreacion,' + ' ultimaModificacion, codDistribuidor, distribuidor ');
      sql.Add(' from recursos where codBase=:codBase and idUnico=:idUnico');
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('idUnico').AsString := idRecursoAntiguo;
      prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
    result := codApuNueva;
  end;
end;

function GeneraCodUnicoAPU: string;
var
  tmpstr: string;
  test: integer;
begin
  test := random($7FFFFFFF);
  tmpstr := formatdatetime('yyyymmddhhnnss', now);
  tmpstr := 'APUsr' + tmpstr + inttostr(test);
  result := tmpstr;
end;

procedure posicionaCombo(cbb: TComboBox; itm: string) overload;
var
  x: Integer;
  salir: Boolean;
begin
  x := 0;
  salir := False;
  while (x < cbb.Items.Count) and not salir do
  begin
    if itm = cbb.Items[x] then
    begin
      cbb.ItemIndex := x;
      salir := True;
    end;
    x := x + 1;
  end;
end;

function interpretaCodigoRecurso(codRecurso: string; posicion: Integer): string;
var
  x: Integer;
  tmpstr: string;
begin
  result := '';
  if codRecurso <> '' then
  begin
    case posicion of
      1:
        begin
          result := LeftStr(codRecurso, 1);
        end;
      2:
        begin
          tmpstr := MidStr(codRecurso, 2, 4);
          x := strtoint(tmpstr);
          result := inttostr(x);
        end;
      3:
        begin
          tmpstr := RightStr(codRecurso, 5);
          x := strtoint(tmpstr);
          result := inttostr(x);
        end;
    end;
  end;
end;

/// <summary>TODO: Descripción de limpiaNuevaAPUs.</summary>
procedure limpiaNuevaAPUs();
var
  tmpstr: string;
begin
  frmAddAPU.lbl_APUCostoIndirectoTotal.Text := decimal_correcto('0,00');
  frmAddAPU.lbl_APUCostoDirectoTotal.Text := decimal_correcto('0,00');
  frmAddAPU.lbl_APUPrecioUnitario.Text := decimal_correcto('0,00');
  frmAddAPU.edt_FindCategorias.Text := '';
  frmAddAPU.edt_FindRecursos.Text := '';
  frmAddAPU.edt_APUSUnidad.Text := '';
  frmAddAPU.edt_APUSDescripcion.Text := '';
  tmpstr := FloatToStr(base_activa.indirectos);
  tmpstr := decimal_correcto(tmpstr);
  frmAddAPU.edt_PorcentajeIndirecto.Text := tmpstr;
  frmAddAPU.LimpiaAPU;
end;

/// <summary>TODO: Descripción de limpiaNuevaCategoria.</summary>
procedure limpiaNuevaCategoria();
begin
  frmNuevaCategoria.edt_Descripcion.Text := '';
  frmNuevaCategoria.edt_CodAdicional.Text := '';
  frmNuevaCategoria.mmo_Observaciones.Text := '';
end;

/// <summary>TODO: Descripción de categoriaExistente.</summary>
/// <param name="codCategoria">TODO.</param>
/// <param name="Descripcion">TODO.</param>
/// <returns>TODO.</returns>
function categoriaExistente(codCategoria, Descripcion: string): Boolean;
var
  qry: TUniQuery;
  tmpstr: string;
begin
  result := False;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from categoriaapus where descripcion=' + QuotedStr(Descripcion) + ' and categoria_base=' + QuotedStr(codCategoria) + ' and codBase=' + QuotedStr(base_activa.codBase));
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('descripcion').AsString;
      if tmpstr <> '' then
        result := True
      else
        result := False;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de renombraUnidad.</summary>
/// <param name="codCategoria">TODO.</param>
/// <param name="nombreanterior">TODO.</param>
/// <param name="nombreNuevo">TODO.</param>
procedure renombraUnidad(codCategoria, nombreanterior, nombreNuevo: string);
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('update unidades set descripcion=:descripcion where subCategoria=' + QuotedStr(codCategoria) + ' and descripcion=' + QuotedStr(nombreanterior));
      Prepare;
      ParamByName('descripcion').AsString := nombreNuevo;
      ExecSQL;
      Close;
      sql.Clear;
      sql.Add('update recursos set unidad=:unidad where codCategoriaBase=' + QuotedStr(codCategoria) + ' and unidad=' + QuotedStr(nombreanterior) + ' and codBase=' + QuotedStr(base_activa.codBase));
      Prepare;
      ParamByName('unidad').AsString := nombreNuevo;
      ExecSQL;
      Close;
      sql.Clear;
      sql.Add('update APUS_Items set unidad=:unidad where codCategoria=' + QuotedStr(codCategoria) + ' and unidad=' + QuotedStr(nombreanterior) + ' and codBase=' + QuotedStr(base_activa.codBase));
      Prepare;
      ParamByName('unidad').AsString := nombreNuevo;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de VerRecursosCompleto.</summary>
/// <param name="codCategoria">TODO.</param>
procedure VerRecursosCompleto(codCategoria: string);
var
  qry: TUniQuery;
  tmpstr: string;
  cod_Recurso: string;
  x: Integer;
begin
  limpiaGridRecursos;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from recursos where codCategoriaBase=' + QuotedStr(codCategoria) + ' and codBase=' + QuotedStr(base_activa.codBase) + ' order by descripcion asc');
      Prepare;
      ExecSQL;
      x := 1;
      while not Eof do
      begin

        tmpstr := '';
        if x < 10 then
          tmpstr := '00';
        if (x < 99) and (x > 9) then
          tmpstr := '0';
        frmmain.grid_Recursos.Cells[0, x] := tmpstr + inttostr(x);
        cod_Recurso := generaCodigoRecurso(FieldByName('codCategoriaBase').AsString, FieldByName('codSubcategoria').AsString, FieldByName('codRecurso').AsString);
        frmmain.grid_Recursos.Cells[1, x] := cod_Recurso;
        frmmain.grid_Recursos.Cells[2, x] := FieldByName('descripcion').AsString;
        frmmain.grid_Recursos.Cells[3, x] := FieldByName('unidad').AsString;
        tmpstr := FieldByName('Precio').AsString;
        tmpstr := base_activa.simboloMoneda + tmpstr;
        frmmain.grid_Recursos.Cells[4, x] := tmpstr;
        frmmain.grid_Recursos.Cells[7, x] := FieldByName('CodCPC').AsString;
        tmpstr := FieldByName('Especificaciones').AsString;
        if tmpstr = '' then
          tmpstr := 'Sin Especificaciones     ';
        if length(tmpstr) > 30 then
          tmpstr := Copy(tmpstr, 1, 30) + '...';
        frmmain.grid_Recursos.Cells[8, x] := tmpstr;
        frmmain.grid_Recursos.Cells[9, x] := FieldByName('idUnico').AsString;
        Inc(x);
        Next;
      end;
    end;
  finally
    frmmain.grid_Recursos.RowCount := x;
    frmmain.grid_Recursos.AutoSizeColumn(0, True, 10);
    frmmain.grid_Recursos.AutoSizeColumn(1, True, 10);
    frmmain.grid_Recursos.AutoSizeColumn(2, True, 10);
    frmmain.grid_Recursos.AutoSizeColumn(3, True, 10);
    frmmain.grid_Recursos.AutoSizeColumn(4, True, 10);
    frmmain.grid_Recursos.AutoSizeColumn(7, True, 10);
    frmmain.grid_Recursos.AutoSizeColumn(8, True, 10);
    frmmain.grid_Recursos.Columns[5].Width := 0;
    frmMain.grid_Recursos.Columns[6].Width := 0;
    frmmain.grid_Recursos.Columns[9].Width := 0;
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de populaPaises.</summary>
procedure populaPaises();
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from paises where nombre_pais is not null order by nombre_pais asc');
      Prepare;
      ExecSQL;
      frmNuevaBase.cbb_pais.Clear;
      frmmain.cbb_paisNPresupuesto.Clear;
      while not Eof do
      begin
        tmpstr := FieldByName('nombre_pais').AsString;
        frmNuevaBase.cbb_pais.Items.Add(tmpstr);
        frmmain.cbb_paisNPresupuesto.Items.Add(tmpstr);
        Next;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de EnviarAltTab.</summary>
procedure EnviarAltTab();
begin
  SimKey(VK_LWIN, True);
  SimKey(VK_TAB, True);
  SimKey(VK_LWIN, False);
  Application.ProcessMessages;
  Sleep(80);
end;

procedure SimKey(VK: BYTE; Down: Boolean);
var
  Input: TInput;
begin
  ZeroMemory(@Input, SizeOf(Input));
  Input.Itype := INPUT_KEYBOARD;
  Input.KI.wVk := VK;
  Input.KI.wScan := MapVirtualKey(VK, 0);
  Input.KI.dwFlags := KEYEVENTF_EXTENDEDKEY;
  if not Down then
    Input.KI.dwFlags := Input.KI.dwFlags or KEYEVENTF_KEYUP;
  Windows.SendInput(1, tagINPUT(Input), SizeOf(TInput));
end;

procedure AjustaFloatGrid(grid: TTMSFNCGrid; Columna: Integer);
begin
  grid.Columns[Columna].Editor := TTMSFNCGridEditorType.etFloatEdit;
end;

procedure ocultaColumnasGrids(Grid: TTMSFNCGrid; ColumnaInicial: Integer);
var
  x: Integer;
begin
  for x := ColumnaInicial to Grid.Columns.Count - 1 do
  begin
    Grid.Columns[x].Width := 0;
  end;
end;

procedure ocultaColumnasGridsT2(Grid: TTMSFMXGrid; ColumnaInicial: Integer);
var
  x: Integer;
begin
  for x := ColumnaInicial to Grid.Columns.Count - 1 do
  begin
    Grid.Columns[x].Width := 0;
  end;
end;

/// <summary>TODO: Descripción de creaSangria.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function creaSangria(datos: string): string;
var
  x: Integer;
  n: Integer;
begin
  result := '';
  n := 0;
  for x := 1 to length(datos) do
  begin
    if datos[x] = '.' then
      n := n + 1;
  end;
  for x := 1 to n do
  begin
    result := result + '   ';
  end;
end;

/// <summary>TODO: Descripción de daSQLQueryText.</summary>
/// <param name="Nconsulta">TODO.</param>
/// <returns>TODO.</returns>
function daSQLQueryText(Nconsulta: Integer): string;
var
  valorQry: string;
begin
  valorQry := '';
  case Nconsulta of
    {(*}
    1:
      begin
        valorQry := 'SELECT  ' + '  a.codCategoriaAPU, ' + '  a.codRecursoAPU, '
          + '  a.CodAPU, ' + '  a.Descripcion, ' +
          '  COALESCE(b.CostoDirectoTotal, a.CostoDirectoTotal) AS CostoDirecto, ' +
          '  a.Unidad, ' + '  a.rendimientoHUnidad, ' + '  a.nhCuadrillas ' +
          'FROM apus a ' + 'LEFT JOIN presupuestos_tanteo_apus b ' +
          '  ON b.codBase = a.codBase ' + '  AND b.CodAPU = a.CodAPU ' +
          '  AND b.revision = :revision ' + 'WHERE a.codBase = :codBase ' +
          '  AND a.CodAPU = :codAPU ' + 'ORDER BY a.descripcion ASC';


      end;
    2:
      begin
        valorQry := 'SELECT apu.codCategoriaAPU, ' +
          '       apu.codRecursoAPU, ' + '       apu.CodAPU, ' + '       apu.Descripcion, '
          + '       apu.anidado, ' + '       apu.Unidad, ' +
          '       apu.rendimientoHUnidad, ' + '       apu.nhCuadrillas ' +
          '  FROM apus apu ' + ' WHERE apu.codBase = :codBase ' +
          '   AND apu.codCategoriaAPU = :codCategoriaAPU ' + ' ORDER BY apu.descripcion ASC ';

      end;
    3:
      begin
        valorQry := 'SELECT apu.codCategoriaAPU, ' +
          '       apu.codRecursoAPU, ' + '       apu.CodAPU, ' + '       apu.Descripcion, '
          + '       apu.anidado, ' + '       apu.Unidad, ' +
          '       apu.rendimientoHUnidad, ' + '       apu.nhCuadrillas ' +
          '  FROM apus apu ' + ' WHERE apu.codBase = :codBase ' + ' ORDER BY apu.descripcion ASC ';

      end;
    4:
      begin
        valorQry := 'SELECT items.CodCategoria, ' +
          '       items.codSubCategoria, ' + '       items.codRecurso, ' +
          '       items.Descripcion, ' + '       items.Unidad, ' + '       IF '
          + '       (tanteo.CodAPU IS NULL, items.CantidadUnidad, tanteo.CantidadUnidad) CantidadUnidad, '
          + '       IF ' +
          '       (tanteo.CodAPU IS NULL, items.Precio, tanteo.Precio) AS Precio, ' + '       IF '
          + '       (tanteo.CodAPU IS NULL, items.Rendimiento, tanteo.Rendimiento) Rendimiento, '
          + '       IF ' +
          '       (tanteo.CodAPU IS NULL, items.total, tanteo.total) total, ' + '       items.porcentaje, '
          + '       items.idUnicoRecurso ' + '  FROM APUS_Items items ' +
          '    LEFT JOIN presupuestos_tanteo_recursos tanteo ' + '      ON ( ' +
          '        tanteo.codPresupuesto = :codPresupuesto ' +
          '        AND tanteo.revision = :revision ' + '        AND tanteo.CodAPU = items.CodAPU '
          + '        AND tanteo.codBase = items.codBase ' +
          '        AND tanteo.idUnicoRecurso = items.idUnicoRecurso ' +
          '     ) ' + ' WHERE items.codBase = :codBase ' + '   AND items.codAPU = :codAPU ';
      end;
    5:
      begin
        valorQry := 'SELECT ' + '  apu.codCategoriaAPU, ' +
          '  apu.codRecursoAPU, ' + '  apu.Descripcion, ' + '  apu.Unidad, ' +
          '  COALESCE(apuTanteo.CostoDirectoTotal, apu.CostoDirectoTotal) AS CostoDirectoTotal, ' +
          '  apu.CostoIndirectoTotal, ' + '  apu.PrecioUnitarioTotal, ' +
          '  apu.CodAPU, ' + '  CASE ' + '    WHEN apuTanteo.CostoDirectoTotal IS NOT NULL THEN TRUE '
          + '    ELSE FALSE ' + '  END AS ajusteTanteo ' + 'FROM APUS apu ' +
          'LEFT JOIN presupuestos_tanteo_apus apuTanteo ' +
          '  ON apuTanteo.codBase = :codBase ' + '     AND apuTanteo.codPresupuesto = :codPresupuesto '
          + '     AND apuTanteo.revision = :revision ' +
          '     AND apuTanteo.codAPU = apu.CodAPU ' + 'WHERE apu.codCategoriaAPU = :codCategoriaAPU '
          + '  AND apu.codBase = :codBase ' + 'ORDER BY apu.descripcion ASC ';

      end;
    6:
      begin
        valorQry := 'SELECT ' + '  apu.codCategoriaAPU, ' +
          '  apu.codRecursoAPU, ' + '  apu.Descripcion, ' + '  apu.Unidad, ' +
          '  COALESCE(apuTanteo.CostoDirectoTotal, apu.CostoDirectoTotal) AS CostoDirectoTotal, ' +
          '  apu.CostoIndirectoTotal, ' + '  apu.PrecioUnitarioTotal, ' +
          '  apu.CodAPU, ' + '  CASE ' + '    WHEN apuTanteo.CostoDirectoTotal IS NOT NULL THEN TRUE '
          + '    ELSE FALSE ' + '  END AS ajusteTanteo ' + 'FROM APUS apu ' +
          'LEFT JOIN presupuestos_tanteo_apus apuTanteo ' +
          '  ON apuTanteo.codBase = :codBase ' + '     AND apuTanteo.codPresupuesto = :codPresupuesto '
          + '     AND apuTanteo.revision = :revision ' +
          '     AND apuTanteo.CodAPU = apu.CodAPU ' + 'WHERE apu.codBase = :codBase '
          + 'ORDER BY apu.Descripcion ASC ';

      end;
    7:
      begin


      end;
    8:
      begin
        valorQry := 'SELECT ' + '  items.CodCategoria, ' +
          '  items.codSubCategoria, ' + '  items.codRecurso, ' +
          '  items.Descripcion, ' + '  items.Unidad, ' +
          '  COALESCE(tanteoRecursos.CantidadUnidad, items.CantidadUnidad) AS CantidadUnidad, ' +
          '  items.Precio, ' +
          '  COALESCE(tanteoRecursos.Rendimiento, items.Rendimiento) AS Rendimiento, ' + '  items.Total, '
          + '  items.porcentaje ' + 'FROM apus_items items ' +
          'LEFT JOIN presupuestos_tanteo_recursos tanteoRecursos ' +
          '  ON tanteoRecursos.codBase = items.codBase ' +
          '     AND tanteoRecursos.CodAPU = items.CodAPU ' + '     AND tanteoRecursos.codPresupuesto = :codPresupuesto '
          + '     AND tanteoRecursos.revision = :revision ' +
          '     AND tanteoRecursos.idUnicoRecurso = items.idUnicoRecurso ' +
          'WHERE items.CodAPU = :codAPU ' + '  AND items.codBase = :codBase ';

      end;
    9:
      begin
        valorQry := 'SELECT ' + '  items.CodCategoria, ' +
          '  items.codSubCategoria, ' + '  items.codRecurso, ' +
          '  items.Descripcion, ' + '  items.Unidad, ' +
          '  COALESCE(recursoTanteo.CantidadUnidad, items.CantidadUnidad) AS CantidadUnidad, ' +
          '  items.Precio, ' +
          '  COALESCE(recursoTanteo.Rendimiento, items.Rendimiento) AS Rendimiento, ' + '  items.porcentaje, '
          + '  items.idUnicoRecurso ' + 'FROM apus_items items ' +
          'LEFT JOIN presupuestos_tanteo_recursos recursoTanteo ' +
          '  ON recursoTanteo.codBase = items.codBase ' +
          '     AND recursoTanteo.CodAPU = items.CodAPU ' + '     AND recursoTanteo.codPresupuesto = :codPresupuesto '
          + '     AND recursoTanteo.revision = :revision ' +
          '     AND recursoTanteo.idUnicoRecurso = items.idUnicoRecurso ' +
          'WHERE items.CodAPU = :codApu ' + '  AND items.codBase = :codBase ';

      end;
      {*)}
  end;
  result := valorQry;
end;

/// <summary>TODO: Descripción de codigoUnicoItemPresupuesto.</summary>
/// <returns>TODO.</returns>
function codigoUnicoItemPresupuesto(): string;
var
  codItem: string;
begin
  codItem := formatdatetime('ddmmyyyyhhmmsszzz', now);
  codItem := 'I' + codItem;
  result := codItem;
end;

/// <summary>TODO: Descripción de borrarImagenReferencial.</summary>
procedure borrarImagenReferencial();
var
  imagenReferenciaProyecto: string;
begin
  imagenReferenciaProyecto := dirImagenReferencia + base_activa.codBase + codProyecto + '.jpg';
  if not FileExists(imagenReferenciaProyecto) then
  begin
    imagenReferenciaProyecto := dirImagenReferencia + base_activa.codBase + codProyecto + '.png';
  end;
  if FileExists(imagenReferenciaProyecto) then
    DeleteFile(PWideChar(imagenReferenciaProyecto));
end;

/// <summary>TODO: Descripción de AbrirImagenConVisor.</summary>
procedure AbrirImagenConVisor();
var
  imagenReferenciaProyecto: string;
begin
  imagenReferenciaProyecto := dirImagenReferencia + base_activa.codBase + codProyecto + '.jpg';
  if not FileExists(imagenReferenciaProyecto) then
  begin
    imagenReferenciaProyecto := dirImagenReferencia + base_activa.codBase + codProyecto + '.png';
  end;
  if FileExists(imagenReferenciaProyecto) then
    ShellExecute(0, 'open', PChar(imagenReferenciaProyecto), nil, nil, SW_SHOWNORMAL);
end;

/// <summary>TODO: Descripción de IniciaNuevoProyecto.</summary>
procedure IniciaNuevoProyecto();
begin
  frmMain.imgReferencial.Bitmap := nil;
  iniciaTablaMemoria();
  frmmain.lbl_codUnicoTemporal.Text := generaCodigoUnico;
  IndirectosPresupuesto := 0;
  derivacionPresupuesto := TStringList.Create;
  cargaValoresSeriePresupuesto();
  codProyecto := generaCodigoPresupuestoNuevo;
  revision := '0';
  frmmain.edt_CodigoPresupuesto1.Text := codProyecto;
  frmMain.lbl_RevisionPresupuesto.Text := revision;
  autocalcularfechaspresupuesto := False;
  frmmain.dedt_PresentacionPresupuesto.Date := now;
  autocalcularfechaspresupuesto := True;
  frmmain.edt_descripcionPresupuesto.Text := '';
  frmmain.mmo_ObjetoPresupuesto.Text := '';
  frmmain.edt_PlazoEjecucionPresupuesto.Text := '180';
  frmmain.edt_ValidezPresupuesto.Text := '30';
  frmmain.edt_descripcionPresupuesto.SetFocus;
  frmmain.edt_NPresupuestoCodReferencial.Text := '';
  frmMain.edt_AreaTerrenoPresupuesto.text := '';
  frmMain.edt_AConstruccionPresupuesto.Text := '';
  frmstakes.cbb_pais.Items.Text := listadoPaises.Text;
  frmstakes.cbb_pais.ItemIndex := posicionEcuador;
  frmmain.edt_NPresupuestoDireccion.Text := '';
  frmmain.edt_NPresupuestoProvincia.Text := '';
  frmmain.edt_NPresupuestoCiudad.Text := '';
  FGroupedPresupuesto := False;
  frmmain.lbl_porcentajesIndirectos.Text := '0%';
  frmmain.popupItem_Pareto_SinAplicar.IsChecked := true;
  frmmain.popupItem_Pareto_Global.IsChecked := False;
  frmmain.popupItem_Pareto_Cuenta.IsChecked := False;
  frmmain.iGlow_Pareto.Enabled := False;
  frmmain.iGlow_NotasGenerales.Enabled := False;
  frmmain.iGlow_AbrirTanteo.Enabled := False;
  frmmain.iGlow_Presupuestos_SeleccionarIndirectos.Enabled := False;
  frmmain.iGlow_Presupuestos_AbrirBase.Enabled := False;
  frmmain.lyt_Tanteo.Height := 0;
  cancelarDerivacion := '';
  setlength(listadoNotas, 0);
  frmmain.iGlow_OPC2_CrearPresupuesto.Enabled := True;
  setlength(listado_PresupuestoStake, 0);
  frmmain.cbb_paisNPresupuesto.Clear;
  frmmain.cbb_paisNPresupuesto.Items.Text := listadoPaises.Text;
  frmmain.cbb_paisNPresupuesto.ItemIndex := posicionEcuador;
  frmmain.edt_porcentajeIVANuevoPresupuesto.Text := '15';
  cargaTipoProyectoPresupuesto;
  frmmain.cbb_TConstruccion.ItemIndex := 0;
  frmmain.cbb_ambitoContratacion.ItemIndex := 0;
  frmmain.cbb_TipoContrato.ItemIndex := 0;
  limpiaGridStakeAsignados();
  iniciaEDO();
  populaStakesDisponibles('');
  iniciaEDT();
  historicoEDO := TStringList.Create;
  posEDO := -1;
  historicoEDT := TStringList.Create;
  posEDT := -1;
  frmmain.nEDT_autoguardado.Value := 10;
  frmmain.chkAutoGuardado.Enabled := True;
  iniciaDBPresupuestosRecursos();
  CargarTiendaOnline;
end;

/// <summary>TODO: Descripción de rellenaAPUSVisor.</summary>
/// <param name="cod_completoAPU">TODO.</param>
procedure rellenaAPUSVisor(cod_completoAPU: string);
var
  qry: TUniQuery;
  x: Integer;
  node, subNode: TTMSFMXTreeViewNode;
  codCategoria, codSubCategoria, codRecurso: string;
  entrar: Boolean;
  tmpstr: string;
  costoDirecto, indirecto: double;
  cantidad, precio, Rendimiento, totalRecurso: double;
  SQLText: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      if not contieneTanteo then
      begin
        sql.Add('select * from APUS_Items where codAPU=' + QuotedStr(cod_completoAPU) + ' and codBase=' + QuotedStr(base_activa.codBase));
        Prepare;
        ExecSQL;
        costoDirecto := 0;
        while not Eof do
        begin
          x := FieldByName('codCategoria').AsInteger;
          if x = 6 then
          begin
            x := 2;
          end;
          entrar := true;
          if (not base_activa.SeguridadIndustrial) and (x = 5) then
          begin
            entrar := False;
          end;
          if entrar then
          begin
            x := x - 1;
            node := frmmain.trvw_APUSVisor.Nodes[x];
            subNode := frmmain.trvw_APUSVisor.AddNode(node);
            codCategoria := FieldByName('codCategoria').AsString;
            codSubCategoria := FieldByName('codSubCategoria').AsString;
            codRecurso := FieldByName('codRecurso').AsString;
            subNode.Text[0] := generaCodigoRecurso(codCategoria, codSubCategoria, codRecurso);
            subNode.Text[1] := FieldByName('descripcion').AsString;
            subNode.Text[2] := FieldByName('Unidad').AsString;
            subNode.Text[3] := FormatFloat(cadenaDecimales, FieldByName('CantidadUnidad').AsFloat);
            subNode.Text[4] := FormatFloat(cadenaCurrency, FieldByName('Precio').AsFloat);
            if (codCategoria = '1') or (codCategoria = '4') then
            begin
              subNode.Text[5] := FormatFloat(cadenaDecimales, FieldByName('Rendimiento').AsFloat);
            end
            else
            begin
              subNode.Text[5] := '';
            end;
            subNode.Text[6] := FormatFloat(cadenaCurrency, FieldByName('total').AsFloat);
            tmpstr := subNode.Text[6];

            costoDirecto := costoDirecto + FieldByName('total').AsFloat;
            subNode.Text[7] := FieldByName('porcentaje').AsString + '%';
          end;
          Next;
        end;
      end
      else
      begin
        SQLText := daSQLQueryText(7);
        sql.Add(SQLText);
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codAPU').AsString := cod_completoAPU;
        Prepare;
        ExecSQL;
        costoDirecto := 0;
        while not Eof do
        begin
          x := FieldByName('codCategoria').AsInteger;
          if x = 6 then
          begin
            x := 2;
          end;
          entrar := true;
          if (not base_activa.SeguridadIndustrial) and (x = 5) then
          begin
            entrar := False;
          end;
          if entrar then
          begin
            x := x - 1;
            node := frmmain.trvw_APUSVisor.Nodes[x];
            subNode := frmmain.trvw_APUSVisor.AddNode(node);
            codCategoria := FieldByName('codCategoria').AsString;
            codSubCategoria := FieldByName('codSubCategoria').AsString;
            codRecurso := FieldByName('codRecurso').AsString;
            subNode.Text[0] := generaCodigoRecurso(codCategoria, codSubCategoria, codRecurso);
            subNode.Text[1] := FieldByName('descripcion').AsString;
            subNode.Text[2] := FieldByName('Unidad').AsString;
            subNode.Text[3] := FormatFloat(cadenaDecimales, FieldByName('CantidadUnidad').AsFloat);
            cantidad := FieldByName('CantidadUnidad').AsFloat;
            subNode.Text[4] := FormatFloat(cadenaCurrency, FieldByName('Precio').AsFloat);
            precio := FieldByName('Precio').AsFloat;
            if (codCategoria = '1') or (codCategoria = '4') then
            begin
              subNode.Text[5] := FormatFloat(cadenaDecimales, FieldByName('Rendimiento').AsFloat);
              Rendimiento := FieldByName('Rendimiento').AsFloat;
            end
            else
            begin
              subNode.Text[5] := '';
              Rendimiento := 1;
            end;
            totalRecurso := cantidad * precio * Rendimiento;
            tmpstr := FormatFloat(cadenaCurrency, totalRecurso);
            subNode.Text[6] := tmpstr;
            costoDirecto := costoDirecto + totalRecurso;
            subNode.Text[7] := FieldByName('porcentaje').AsString + '%';
          end;
          Next;
        end;
      end;
    end;
  finally
    frmMain.lbl_APUMCostoDirectoTotal.Text := FormatFloat(cadenaCurrency, costoDirecto);
    indirecto := calculaIndirectos(costoDirecto);
    frmMain.lbl_APUMCostoIndirectoTotal.Text := FormatFloat(cadenaCurrency, indirecto);
    frmMain.lbl_APUMPrecioUnitarioTotal.text := FormatFloat(cadenaCurrency, costoDirecto + indirecto);
    calculaPorcentajePrecio(frmmain.trvw_APUSVisor, 7, costoDirecto);
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de quitaFormatFloat.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function quitaFormatFloat(datos: string): double;
var
  SCurrency: string;
  simboloMiles: string;
begin
  SCurrency := base_activa.simboloMoneda;
  if SCurrency = '' then
    SCurrency := '$';
  datos := ReplaceStr(datos, SCurrency, '');
  simboloMiles := '0.0';
  simboloMiles := decimal_correcto(simboloMiles);
  simboloMiles := ReplaceStr(simboloMiles, '0', '');
  if simboloMiles = ',' then
    simboloMiles := '.'
  else
    simboloMiles := ',';
  datos := ReplaceStr(datos, simboloMiles, '');
  datos := trim(datos);
  result := StrToFloatDef(datos, 0);
end;

procedure calculaPorcentajePrecio(trvw: TTMSFMXTreeView; posicionMuestra: integer; costoTotal: Double);
var
  nodo: TTMSFMXTreeViewNode;
  PorcentajeEjecutado: double;
  costoParcial: double;
  tmpstr: string;
  calculo: Double;
begin
  nodo := trvw.Nodes[0];
  PorcentajeEjecutado := 0;
  while Assigned(nodo) do
  begin
    if not nodo.Extended then
    begin
      tmpstr := nodo.text[6].Trim;
      costoParcial := quitaFormatFloat(tmpstr);
      calculo := (costoParcial * 100) / costoTotal;
      PorcentajeEjecutado := PorcentajeEjecutado + calculo;
      tmpstr := FloatToStr(calculo);
      nodo.text[7] := tmpstr + '%';
    end;
    nodo := nodo.GetNext;
  end;
  nodo := trvw.GetLastNode;
  while (nodo.Extended) do
  begin
    nodo := nodo.GetPrevious;
  end;
  PorcentajeEjecutado := StrToFloat(FloatToStr(PorcentajeEjecutado));
  PorcentajeEjecutado := 100 - PorcentajeEjecutado;
  tmpstr := nodo.Text[7];
  tmpstr := ReplaceStr(tmpstr, '%', '').Trim;
  calculo := StrToFloat(tmpstr);
  calculo := calculo + PorcentajeEjecutado;
  nodo.text[7] := FloatToStr(calculo) + '%';
end;

/// <summary>TODO: Descripción de calculaIndirectos.</summary>
/// <param name="costoDirecto">TODO.</param>
/// <returns>TODO.</returns>
function calculaIndirectos(costoDirecto: double): Double;
var
  indirectoCalculo: double;
  calculo: double;
begin
  indirectoCalculo := base_activa.indirectos;
  calculo := (costoDirecto * indirectoCalculo) / 100;
  Result := calculo;
end;

function ponerCerosInicio(datos: string; ceros: Integer): string;
var
  x: Integer;
begin
  result := datos;
  for x := 1 to ceros - length(datos) do
  begin
    result := '0' + result;
  end;
end;

/// <summary>TODO: Descripción de limpia_APUSVisor.</summary>
procedure limpia_APUSVisor();
var
  node: TTMSFMXTreeViewNode;
  x: Integer;
begin
  cargarValoresInicialesTrvw(frmmain.trvw_APUSVisor);

  frmmain.edt_APUSDescripcion.Text := '';
  frmmain.edt_APUSUnidad.Text := '';
  frmmain.lbl_APUSRendimiento.Text := '';
  frmmain.lbl_APUMCostoDirectoTotal.Text := '0,00';
  frmmain.lbl_APUMCostoIndirectoTotal.Text := '0,00';
  frmmain.lbl_APUMPrecioUnitarioTotal.Text := '0,00';
end;

/// <summary>TODO: Descripción de Limpia_gridAPUSDisponibles.</summary>
procedure Limpia_gridAPUSDisponibles();
begin
  frmmain.grid_APUSRecursos.ClearNormalCells;
  frmmain.grid_APUSRecursos.RowCount := 1;
  frmmain.grid_APUSRecursos.Cells[0, 0] := '#';
  frmmain.grid_APUSRecursos.Cells[1, 0] := 'Cod. APU';
  frmmain.grid_APUSRecursos.Cells[2, 0] := 'Descripción';
  frmmain.grid_APUSRecursos.Cells[3, 0] := 'Unidad';
  // frmMain.grid_APUSRecursos.cells[4, 0] := 'Rendimiento';
  frmmain.grid_APUSRecursos.Cells[4, 0] := 'C. Directo';
  frmmain.grid_APUSRecursos.Cells[5, 0] := 'C. Indirecto';
  frmmain.grid_APUSRecursos.Cells[6, 0] := 'P. Unitario';
  frmmain.grid_APUSRecursos.Cells[7, 0] := 'Cod C.P.C.';
end;

/// <summary>TODO: Descripción de refrescalistaAPUscompleta.</summary>
procedure refrescalistaAPUscompleta();
var
  qry: TUniQuery;
  x: Integer;
  tmpstr: string;
  subCategoria: string;
  codRecurso: string;
  cadenaSQL: string;
  y: Integer;
  SQLText: string;
  esTanteo: string;
  porcentajeIndirectosBase: double;
  CostoDirectoTanteo: double;
  costoIndirectoTanteo: Double;
  PrecioUnitarioTanteo: double;
begin
  Limpia_gridAPUSDisponibles();
  porcentajeIndirectosBase := base_activa.indirectos;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      if not contieneTanteo then
      begin
        Close;
        sql.Clear;
        {(*}
        sql.Add('SELECT * ' + '  FROM APUS ' + ' WHERE codBase = :codBase ' + ' ORDER BY descripcion ASC ');
          {*)}
        ParamByName('codBase').AsString := base_activa.codBase;
        sql.Add(cadenaSQL);
        Prepare;
        ExecSQL;
        x := 1;
        while not Eof do
        begin
          frmmain.grid_APUSRecursos.Cells[0, x] := ponerCerosInicio(inttostr(x), 3);
          subCategoria := FieldByName('codCategoriaAPU').AsString;
          codRecurso := FieldByName('codRecursoAPU').AsString;
          tmpstr := generaCodigoRecurso('6', subCategoria, codRecurso);
          frmmain.grid_APUSRecursos.Cells[1, x] := tmpstr;
          frmmain.grid_APUSRecursos.Cells[2, x] := FieldByName('descripcion').AsString;
          frmmain.grid_APUSRecursos.Cells[3, x] := FieldByName('Unidad').AsString;
          frmmain.grid_APUSRecursos.Cells[4, x] := FormatFloat(cadenaCurrency, FieldByName('CostoDirectoTotal').AsFloat);
          frmmain.grid_APUSRecursos.Cells[5, x] := FormatFloat(cadenaCurrency, FieldByName('CostoIndirectoTotal').AsFloat);
          frmmain.grid_APUSRecursos.Cells[6, x] := FormatFloat(cadenaCurrency, FieldByName('PrecioUnitarioTotal').AsFloat);
          frmmain.grid_APUSRecursos.Cells[8, x] := FieldByName('codCategoriaAPU').AsString;
          frmmain.grid_APUSRecursos.Cells[9, x] := FieldByName('CodAPU').AsString;
          frmmain.grid_APUSRecursos.Columns[8].Width := 0;
          frmmain.grid_APUSRecursos.Columns[9].Width := 0;
          Inc(x);
          Next;
        end;
        frmmain.grid_APUSRecursos.RowCount := x;
      end
      else
      begin
        begin
          close;
          sql.Clear;
          SQLText := daSQLQueryText(6);
          sql.Add(SQLText);
          ParamByName('codBase').AsString := base_activa.codBase;
          ParamByName('codPresupuesto').AsString := codProyecto;
          ParamByName('revision').AsString := revision;
          Prepare;
          ExecSQL;
          x := 1;
          while not Eof do
          begin
            frmmain.grid_APUSRecursos.Cells[0, x] := ponerCerosInicio(inttostr(x), 3);
            subCategoria := FieldByName('codCategoriaAPU').AsString;
            codRecurso := FieldByName('codRecursoAPU').AsString;
            tmpstr := generaCodigoRecurso('6', subCategoria, codRecurso);
            frmmain.grid_APUSRecursos.Cells[1, x] := tmpstr;
            frmmain.grid_APUSRecursos.Cells[2, x] := FieldByName('descripcion').AsString;
            frmmain.grid_APUSRecursos.Cells[3, x] := FieldByName('Unidad').AsString;
            frmmain.grid_APUSRecursos.Cells[4, x] := FormatFloat(cadenaCurrency, FieldByName('CostoDirectoTotal').AsFloat);
            esTanteo := FieldByName('ajusteTanteo').Asstring;
            if esTanteo <> '1' then
            begin
              frmmain.grid_APUSRecursos.Cells[5, x] := FormatFloat(cadenaCurrency, FieldByName('CostoIndirectoTotal').AsFloat);
              frmmain.grid_APUSRecursos.Cells[6, x] := FormatFloat(cadenaCurrency, FieldByName('PrecioUnitarioTotal').AsFloat);
            end
            else
            begin
              CostoDirectoTanteo := StrToFloat(decimal_correcto(tmpstr));
              costoIndirectoTanteo := (CostoDirectoTanteo * porcentajeIndirectosBase) / 100;
              frmmain.grid_APUSRecursos.Cells[5, x] := FormatFloat(cadenaCurrency, costoIndirectoTanteo);
              PrecioUnitarioTanteo := CostoDirectoTanteo + costoIndirectoTanteo;
              frmmain.grid_APUSRecursos.Cells[6, x] := FormatFloat(cadenaCurrency, PrecioUnitarioTanteo);
            end;
            frmmain.grid_APUSRecursos.Cells[8, x] := subCategoria;
            frmmain.grid_APUSRecursos.Cells[9, x] := FieldByName('CodAPU').AsString;
            Inc(x);
            Next;
          end;
          frmmain.grid_APUSRecursos.Columns[8].Width := 0;
          frmmain.grid_APUSRecursos.Columns[9].Width := 0;
          frmmain.grid_APUSRecursos.RowCount := x;
        end;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de refrescalistaAPUsDisponibles.</summary>
procedure refrescalistaAPUsDisponibles();
var
  qry: TUniQuery;
  x: Integer;
  tmpstr: string;
  subCategoria: string;
  codRecurso: string;
  SQLText: string;
  esTanteo: string;
  porcentajeIndirectosBase: double;
  CostoDirectoTanteo: double;
  costoIndirectoTanteo: Double;
  PrecioUnitarioTanteo: double;
begin
  Limpia_gridAPUSDisponibles();
  porcentajeIndirectosBase := base_activa.indirectos;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      if not contieneTanteo then
      begin
        Close;
        sql.Clear;
        {(*}
        sql.Add('SELECT * ' + '  FROM APUS ' +
          ' WHERE codCategoriaAPU = :codCategoriaAPU ' + '   AND codBase = :codBase '
          + ' ORDER BY descripcion ASC ');
          {*)}
        sql.Add('select * from APUS where codCategoriaAPU=' + codCategoriaAPUSeleccionada + ' and codBase=' + QuotedStr(base_activa.codBase) + ' order by descripcion asc');
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codCategoriaAPU').AsString := codCategoriaAPUSeleccionada;
        Prepare;
        ExecSQL;
        x := 1;
        while not Eof do
        begin
          frmmain.grid_APUSRecursos.Cells[0, x] := ponerCerosInicio(inttostr(x), 3);
          subCategoria := FieldByName('codCategoriaAPU').AsString;
          codRecurso := FieldByName('codRecursoAPU').AsString;
          tmpstr := generaCodigoRecurso('6', subCategoria, codRecurso);
          frmmain.grid_APUSRecursos.Cells[1, x] := tmpstr;
          frmmain.grid_APUSRecursos.Cells[2, x] := FieldByName('descripcion').AsString;
          frmmain.grid_APUSRecursos.Cells[3, x] := FieldByName('Unidad').AsString;
          frmmain.grid_APUSRecursos.Cells[4, x] := FormatFloat(cadenaCurrency, FieldByName('CostoDirectoTotal').Asfloat);
          frmmain.grid_APUSRecursos.Cells[5, x] := FormatFloat(cadenaCurrency, FieldByName('CostoIndirectoTotal').AsFloat);
          frmmain.grid_APUSRecursos.Cells[6, x] := FormatFloat(cadenaCurrency, FieldByName('PrecioUnitarioTotal').AsFloat);
          frmmain.grid_APUSRecursos.Cells[8, x] := subCategoria;
          frmmain.grid_APUSRecursos.Cells[9, x] := FieldByName('CodAPU').AsString;
          Inc(x);
          Next;
        end;
        frmmain.grid_APUSRecursos.Columns[8].Width := 0;
        frmmain.grid_APUSRecursos.Columns[9].Width := 0;
        frmmain.grid_APUSRecursos.RowCount := x;
      end
      else
      begin
        close;
        sql.Clear;
        SQLText := daSQLQueryText(5);
        sql.Add(SQLText);
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codCategoriaAPU').AsString := codCategoriaAPUSeleccionada;
        Prepare;
        ExecSQL;
        x := 1;
        while not Eof do
        begin
          frmmain.grid_APUSRecursos.Cells[0, x] := ponerCerosInicio(inttostr(x), 3);
          subCategoria := FieldByName('codCategoriaAPU').AsString;
          codRecurso := FieldByName('codRecursoAPU').AsString;
          tmpstr := generaCodigoRecurso('6', subCategoria, codRecurso);
          frmmain.grid_APUSRecursos.Cells[1, x] := tmpstr;
          frmmain.grid_APUSRecursos.Cells[2, x] := FieldByName('descripcion').AsString;
          frmmain.grid_APUSRecursos.Cells[3, x] := FieldByName('Unidad').AsString;
          tmpstr := FieldByName('CostoDirectoTotal').AsString;
          frmmain.grid_APUSRecursos.Cells[4, x] := tmpstr;
          esTanteo := FieldByName('ajusteTanteo').Asstring;
          if esTanteo <> '1' then
          begin
            frmmain.grid_APUSRecursos.Cells[5, x] := FormatFloat(cadenaCurrency, FieldByName('CostoIndirectoTotal').AsFloat);
            frmmain.grid_APUSRecursos.Cells[6, x] := FormatFloat(cadenaCurrency, FieldByName('PrecioUnitarioTotal').AsFloat);
          end
          else
          begin
            CostoDirectoTanteo := StrToFloat(decimal_correcto(tmpstr));
            costoIndirectoTanteo := (CostoDirectoTanteo * porcentajeIndirectosBase) / 100;
            frmmain.grid_APUSRecursos.Cells[5, x] := FormatFloat(cadenaCurrency, costoIndirectoTanteo);
            PrecioUnitarioTanteo := CostoDirectoTanteo + costoIndirectoTanteo;

            frmmain.grid_APUSRecursos.Cells[6, x] := FormatFloat(cadenaCurrency, PrecioUnitarioTanteo);
          end;
          frmmain.grid_APUSRecursos.Cells[8, x] := subCategoria;
          frmmain.grid_APUSRecursos.Cells[9, x] := FieldByName('CodAPU').AsString;
          Inc(x);
          Next;
        end;
        frmmain.grid_APUSRecursos.Columns[8].Width := 0;
        frmmain.grid_APUSRecursos.Columns[9].Width := 0;
        frmmain.grid_APUSRecursos.RowCount := x;
      end;
    end;
  finally
    if frmmain.grid_APUSRecursos.Cells[1, 1] = '' then
      frmmain.grid_APUSRecursos.Cells[0, 1] := '';
    qry.Free;
  end;
end;

function daDatoCodigo(codigo: string; modo: Integer): string;
var
  x: Integer;
  tmpstr: string;
begin
  result := '';
  case modo of
    1:
      begin
        result := LeftStr(codigo, 1);
      end;
    2:
      begin
        result := Copy(codigo, 2, 4);
      end;
    3:
      begin
        result := RightStr(codigo, 5);
      end;
  end;
  if result <> '' then
  begin
    x := strtoint(result);
    result := inttostr(x);
  end;
end;

function ForzarCadenaNDecimales(datos: string; nDecimales: integer): string;
var
  valorFloat: Double;
begin
  valorFloat := StrToFloatDef(datos, 0);
  Result := forzarNdecimales(valorFloat, nDecimales);
end;

function PasarCadenaNDecimalesquitar(datos: string; nDecimales: Integer): string;
begin
  datos := ReplaceStr(datos, base_activa.simboloMoneda, '').Trim;
  datos := QuitarEspeciales(datos);
  result := decimal_correcto(datos);
end;

procedure pausaForm(formulario: Integer; estado: Boolean);
begin
  case formulario of
    1:
      begin
        if estado then
        begin
          frmNuevoRecurso.FormStyle := TFormStyle.Normal;
          frmNuevoRecurso.lyt_Body.Enabled := False;
        end
        else
        begin
          frmNuevoRecurso.FormStyle := TFormStyle.StayOnTop;
          frmNuevoRecurso.lyt_Body.Enabled := True;
        end;
      end;
  end;
end;

/// <summary>TODO: Descripción de hacerPregunta.</summary>
/// <param name="Pregunta">TODO.</param>
/// <param name="Encabezado">TODO.</param>
/// <param name="modo">TODO.</param>
/// <param name="adicional">TODO.</param>
procedure hacerPregunta(Pregunta, Encabezado, modo, adicional: string);
begin
  frmPregunta.lbl_banner1.Text := Encabezado;
  frmPregunta.lbl_banner2.Text := Pregunta;
  frmPregunta.edt_Descripcion.Text := '';
  frmPregunta.lbl_modo.Text := modo;
  frmPregunta.lbl_adicional.Text := adicional;
  frmPregunta.ShowModal;
end;

/// <summary>TODO: Descripción de grabaNuevaUnidadMedidaRecursos.</summary>
/// <param name="subCategoria">TODO.</param>
/// <param name="unidad">TODO.</param>
procedure grabaNuevaUnidadMedidaRecursos(subCategoria, unidad: string);
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      {(*}
      sql.Add('SELECT descripcion ' + '  FROM unidades ' +
        ' WHERE subCategoria = :subCategoria ' + '   AND descripcion = :descripcion ');
        {*)}
      sql.Add('select * from unidades where subCategoria=' + QuotedStr(subCategoria) + ' and descripcion=' + QuotedStr(unidad));
      parambyname('subcategoria').AsString := subCategoria;
      ParamByName('descripcion').AsString := unidad;
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('descripcion').AsString;
      if tmpstr = '' then
      begin
        Close;
        sql.Clear;
        {(*}
        sql.Add('INSERT INTO unidades ( ' + '  descripcion, ' +
          '  subcategoria, ' + '  fechaHora) ' + 'VALUES ( ' +
          '  :descripcion,  ' + '  :subcategoria,  ' + '  :fechaHora) ');
          {*)}
        Prepare;
        ParamByName('descripcion').AsString := unidad;
        ParamByName('subcategoria').AsString := subCategoria;
        ParamByName('fechahora').AsDateTime := now;
        ExecSQL;
      end;
    end;
  finally
    frmNuevoRecurso.populaUnidadesRecursos(subCategoria);
    frmNuevoRecurso.cbb_UTiempos.ItemIndex := frmNuevoRecurso.cbb_UTiempos.Items.Count - 2;
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de rellenaAPUSCategoria.</summary>
/// <param name="tOrdenacion">TODO.</param>
procedure rellenaAPUSCategoria(tOrdenacion: Integer);
var
  qry: TUniQuery;
  tmpstr: string;
  x: Integer;
  itm: TListViewItem;
  filtro: string;
begin
  frmmain.lv_APUSCategoria.Items.Clear;
  filtro := frmMain.edt_filtroLVApusCategoria.Text;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      case tOrdenacion of
        {(*}
        1:
          sql.Add('SELECT * ' + '  FROM categoriaapus ' +
            ' WHERE categoria_base = 6 ' + '   AND codBase = :codBase ' + ' ORDER BY descripcion ASC ');
        2:
          sql.Add('SELECT * ' + '  FROM categoriaapus ' +
            ' WHERE categoria_base = 6 ' + '   AND codBase = :codBase ' + ' ORDER BY descripcion DESC ');
          {*)}
      end;
      if filtro <> '' then
      begin
        filtro := '%' + LowerCase(filtro.Trim) + '%';
        AddWhere(' LOWER(Descripcion) like ' + QuotedStr(filtro));
      end;
      ParamByName('codBase').AsString := base_activa.codBase;
      Prepare;
      ExecSQL;
      frmmain.lv_APUSCategoria.BeginUpdate;
      while not Eof do
      begin
        itm := frmmain.lv_APUSCategoria.Items.Add;
        itm.Detail := FieldByName('ciu').AsString;
        itm.Text := FieldByName('Descripcion').AsString;
        Next;
      end;
      frmmain.lv_APUSCategoria.EndUpdate;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de posicionaAPUSCategoria.</summary>
/// <param name="codCategoriaBaseEnvio">TODO.</param>
procedure posicionaAPUSCategoria(codCategoriaBaseEnvio: string);
var
  x: Integer;
  salir: Boolean;
begin
  salir := False;
  x := 0;
  while (x < frmmain.lv_APUSCategoria.Items.Count - 1) and (not salir) do
  begin
    if frmmain.lv_APUSCategoria.Items[x].Detail = codCategoriaBaseEnvio then
    begin
      salir := True;
      frmmain.lv_APUSCategoria.ItemIndex := x;
      codCategoriaAPUSeleccionada := frmmain.lv_APUSCategoria.Items[x].Detail;
      CategoriaAPUSeleccionada := frmmain.lv_APUSCategoria.Items[x].Text;
    end;
    Inc(x);
  end;
end;

/// <summary>TODO: Descripción de daCodigoAPUSRecurso.</summary>
/// <param name="codCompleto">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoAPUSRecurso(codCompleto: string): string;
var
  tmpstr: string;
begin
  tmpstr := RightStr(codCompleto, 5);
  result := tmpstr;
end;

/// <summary>TODO: Descripción de daCodigoAPUSSubCategoriaRecurso.</summary>
/// <param name="codCompleto">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoAPUSSubCategoriaRecurso(codCompleto: string): string;
var
  x: Integer;
  tmpstr: string;
begin
  tmpstr := Copy(codCompleto, 2, 4);
  result := tmpstr;
end;

/// <summary>TODO: Descripción de muestraOPC.</summary>
/// <param name="estado">TODO.</param>
procedure muestraOPC(estado: Boolean);
begin
  frmmain.lyt_OPC1Recursos.Visible := estado;
  frmmain.lyt_OPC1_APUS.Visible := estado;
  frmmain.lyt_OPC1_Subcategorias.Visible := estado;
end;

/// <summary>TODO: Descripción de BorrarRecurso.</summary>
/// <param name="codCategoria">TODO.</param>
/// <param name="codSubCategoria">TODO.</param>
/// <param name="codRecurso">TODO.</param>
procedure BorrarRecurso(codCategoria, codSubCategoria, codRecurso: string);
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('delete from recursos where codBase=' + QuotedStr(base_activa.codBase) + ' and codRecurso=' + codRecurso + ' and codCategoriaBase=' + codCategoria + ' and codSubCategoria=' + codSubCategoria);
      Prepare;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

procedure cargarEditCloneRecurso(cod_categoria, cod_subcategoria, cod_Recurso: string; modo: Integer);
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      {(*}
      sql.Add('SELECT * ' + '  FROM recursos ' +
        ' WHERE codCategoriaBase = :cod_categoria ' + '   AND codSubCategoria = :cod_subcategoria '
        + '   AND codRecurso = :cod_Recurso ' + '   AND codBase = :codBase ');
        {*)}
      ParamByName('cod_categoria').AsString := cod_categoria;
      ParamByName('cod_subcategoria').AsString := cod_subcategoria;
      ParamByName('cod_recurso').AsString := cod_Recurso;
      ParamByName('codBase').AsString := base_activa.codBase;

      Prepare;
      ExecSQL;
      cod_Recurso := FieldByName('codRecurso').AsString;
      if cod_Recurso <> '' then
      begin
        frmNuevoRecurso.edt_Descripcion.Text := FieldByName('descripcion').AsString;
        tmpstr := FieldByName('precio').AsString;
        frmNuevoRecurso.edt_Precio.Text := decimal_correcto(tmpstr);
        frmNuevoRecurso.edt_codCPC.Text := FieldByName('codCPC').AsString;
        frmNuevoRecurso.mmo_Especificaciones.Text := FieldByName('especificaciones').AsString;
        case modo of
          1:
            begin
              frmNuevoRecurso.lbl_modo.Text := 'editar';
              frmNuevoRecurso.lbl_Codcategoria.Text := cod_categoria;
              frmNuevoRecurso.lbl_codSubcategoria.Text := cod_subcategoria;
              frmNuevoRecurso.lbl_codRecurso.Text := cod_Recurso;
              frmNuevoRecurso.lbl_banner1.Text := 'Editar Recurso';
              frmNuevoRecurso.lbl_banner2.Text := 'Edicción de Recurso';
            end;
          2:
            begin
              frmNuevoRecurso.lbl_modo.Text := 'clonar';
              frmNuevoRecurso.lbl_Codcategoria.Text := cod_categoria;
              frmNuevoRecurso.lbl_codSubcategoria.Text := cod_subcategoria;
              frmNuevoRecurso.lbl_banner1.Text := 'Duplicar Recurso';
              frmNuevoRecurso.lbl_banner2.Text := 'Duplicación de Recurso';
            end;
        end;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure MuestraRecursosGrid(Categoria, subCategoria: string; modo: Integer);
var
  qry: TUniQuery;
  x: Integer;
  cod_Recurso: string;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  limpiaGridRecursos;

  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      {(*}
      sql.Add('select * ' + '  from recursos ' +
        ' where codCategoriaBase = :codCategoriaBase ' + '   and codSubCategoria = :codSubCategoria '
        + '   and codBase = :codBase' + ' order by descripcion asc');
        {*)}
      ParamByName('codCategoriaBase').AsString := Categoria;
      ParamByName('codSubCategoria').AsString := subCategoria;
      ParamByName('codBase').AsString := base_activa.codBase;
      Prepare;
      ExecSQL;
      x := 1;
      while not Eof do
      begin
        case modo of
          1:
            begin
              tmpstr := '';
              if x < 10 then
                tmpstr := '00';
              if (x < 99) and (x > 9) then
                tmpstr := '0';
              frmmain.grid_Recursos.Cells[0, x] := tmpstr + inttostr(x);
              cod_Recurso := generaCodigoRecurso(FieldByName('codCategoriaBase').AsString, FieldByName('codSubcategoria').AsString, FieldByName('codRecurso').AsString);
              frmmain.grid_Recursos.Cells[1, x] := cod_Recurso;
              frmmain.grid_Recursos.Cells[2, x] := FieldByName('descripcion').AsString;
              frmmain.grid_Recursos.Cells[3, x] := FieldByName('unidad').AsString;
              tmpstr := FieldByName('Precio').AsString;
              tmpstr := base_activa.simboloMoneda + tmpstr;
              frmmain.grid_Recursos.Cells[4, x] := tmpstr;
              frmmain.grid_Recursos.Cells[7, x] := FieldByName('CodCPC').AsString;
              tmpstr := FieldByName('Especificaciones').AsString;
              if tmpstr = '' then
                tmpstr := 'Sin Especificaciones     ';
              if length(tmpstr) > 30 then
                tmpstr := Copy(tmpstr, 1, 30) + '...';
              frmmain.grid_Recursos.Cells[8, x] := tmpstr;
              frmmain.grid_Recursos.Cells[9, x] := FieldByName('idUnico').AsString;
            end;
          2:
            begin

              tmpstr := '';
              if x < 10 then
                tmpstr := '00';
              if (x < 99) and (x > 9) then
                tmpstr := '0';
              frmmain.grid_Recursos.Cells[0, x] := tmpstr + inttostr(x);
              cod_Recurso := generaCodigoRecurso(FieldByName('codCategoriaBase').AsString, FieldByName('codSubcategoria').AsString, FieldByName('codRecurso').AsString);
              frmmain.grid_Recursos.Cells[1, x] := cod_Recurso;
              frmmain.grid_Recursos.Cells[2, x] := FieldByName('descripcion').AsString;
              frmmain.grid_Recursos.Cells[3, x] := FieldByName('unidad').AsString;
              tmpstr := FieldByName('Precio').AsString;
              tmpstr := base_activa.simboloMoneda + tmpstr;
              frmmain.grid_Recursos.Cells[4, x] := tmpstr;
              frmmain.grid_Recursos.Cells[7, x] := FieldByName('CodCPC').AsString;
              tmpstr := FieldByName('Especificaciones').AsString;
              if tmpstr = '' then
                tmpstr := 'Sin Especificaciones     ';
              if length(tmpstr) > 30 then
                tmpstr := Copy(tmpstr, 1, 30) + '...';
              frmmain.grid_Recursos.Cells[8, x] := tmpstr;
              frmmain.grid_Recursos.Cells[9, x] := FieldByName('idUnico').AsString;
            end;
        end;

        x := x + 1;
        Next;
      end;
      frmmain.grid_Recursos.RowCount := x;
      case modo of
        1:
          begin
            frmmain.grid_Recursos.AutoSizeColumn(0, True, 10);
            frmmain.grid_Recursos.AutoSizeColumn(1, True, 10);
            frmmain.grid_Recursos.AutoSizeColumn(2, True, 10);
            frmmain.grid_Recursos.AutoSizeColumn(3, True, 10);
            frmmain.grid_Recursos.AutoSizeColumn(4, True, 10);
            frmMain.grid_Recursos.Columns[5].Width := 0;
            frmMain.grid_Recursos.Columns[6].Width := 0;
            frmmain.grid_Recursos.AutoSizeColumn(7, True, 10);
            frmmain.grid_Recursos.AutoSizeColumn(8, True, 10);
            frmmain.grid_Recursos.Columns[9].Width := 0;
          end;
        2:
          begin
            frmmain.grid_Recursos.AutoSizeColumn(0, True, 10);
            frmmain.grid_Recursos.AutoSizeColumn(1, True, 10);
            frmmain.grid_Recursos.AutoSizeColumn(2, True, 10);
            frmmain.grid_Recursos.AutoSizeColumn(3, True, 10);
            frmmain.grid_Recursos.AutoSizeColumn(4, True, 10);
            frmMain.grid_Recursos.Columns[5].Width := 0;
            frmMain.grid_Recursos.Columns[6].Width := 0;
            frmmain.grid_Recursos.AutoSizeColumn(7, True, 10);
            frmmain.grid_Recursos.AutoSizeColumn(8, True, 10);
            frmmain.grid_Recursos.Columns[9].Width := 0;
          end;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de generaCodigoRecurso.</summary>
/// <param name="codCategoriaBase">TODO.</param>
/// <param name="codSubCategoria">TODO.</param>
/// <param name="codRecurso">TODO.</param>
/// <returns>TODO.</returns>
function generaCodigoRecurso(codCategoriaBase, codSubCategoria, codRecurso: string): string;
var
  x: Integer;
  tmpstr: string;
begin
  result := codCategoriaBase;
  tmpstr := codSubCategoria;
  for x := 0 to 3 - length(codSubCategoria) do
  begin
    tmpstr := '0' + tmpstr;
  end;
  result := result + tmpstr;
  tmpstr := codRecurso;
  for x := 0 to 4 - length(codRecurso) do
  begin
    tmpstr := '0' + tmpstr;
  end;
  result := result + tmpstr;
end;

/// <summary>TODO: Descripción de daCodigoParcialRecurso.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoParcialRecurso(datos: string): string;
var
  x: Integer;
  tmpstr: string;
begin
  result := '';
  tmpstr := RightStr(datos, 5);
  try
    x := strtoint(tmpstr);
    result := inttostr(x);
  except
    result := '';
  end;
end;

/// <summary>TODO: Descripción de limpiaGridRecursos.</summary>
procedure limpiaGridRecursos();
begin
  frmmain.grid_Recursos.ClearNormalCells;
  frmmain.grid_Recursos.RowCount := 1;
  frmmain.grid_Recursos.Cells[1, 0] := 'Codigo';
  frmmain.grid_Recursos.Cells[2, 0] := 'Descripción';
  frmmain.grid_Recursos.Cells[3, 0] := 'Unidad';
  frmmain.grid_Recursos.Cells[4, 0] := 'Precio';
  frmmain.grid_Recursos.Cells[5, 0] := 'Termino';
  frmmain.grid_Recursos.Cells[6, 0] := 'Cod. Alternativo';
  frmmain.grid_Recursos.Cells[7, 0] := 'Cod. CPC';
  frmmain.grid_Recursos.Cells[8, 0] := 'Especificaciones';
  frmmain.grid_Recursos.Columns[5].Width := 0;
  frmMain.grid_Recursos.Columns[6].Width := 0;
  frmMain.grid_Recursos.Columns[9].Width := 0;
end;

/// <summary>TODO: Descripción de daCodigoSubCategoriaRecursos.</summary>
/// <param name="codCategoriaRecursos">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoSubCategoriaRecursos(codCategoriaRecursos: string): string;
var
  qry: TUniQuery;
  descripcionRecurso: string;
  lst: TListView;
  x: Integer;
begin
  x := strtoint(codCategoriaRecursos);
  result := '0';
  try
    case x of
      1:
        begin
          lst := frmmain.lvOPCRec1;
        end;
      2:
        begin
          lst := frmmain.lvOPCRec2;
        end;
      3:
        begin
          lst := frmmain.lvOPCRec3;
        end;
      4:
        begin
          lst := frmmain.lvOPCRec4;
        end;
      5:
        begin
          lst := frmmain.lvOPCRec5;
        end;
    end;
    descripcionRecurso := lst.Items[lst.ItemIndex].Text;
    qry := TUniQuery.Create(nil);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        {(*}
        sql.Add('select * ' + '  from categoriaapus ' +
          '  where descripcion = :descripcion ' + '   and categoria_base = :categoria_base '
          + '   and codBase = :codBase');
          {*)}
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('descripcion').AsString := descripcionRecurso;
        ParamByName('categoria_base').AsString := codCategoriaRecursos;
        Prepare;
        ExecSQL;
        result := FieldByName('ciu').AsString;
        if result = '' then
          result := '0';
      end;
    finally
      qry.Free;
    end;
  except
    result := '0';
  end;
end;

/// <summary>TODO: Descripción de daCodigoCategoriaRecursos.</summary>
/// <returns>TODO.</returns>
function daCodigoCategoriaRecursos(): string;
begin
  result := '0';
  if frmmain.rect_opcrec1.Fill.Color = $FFE94E1B then
  begin
    result := '1';
  end;
  if frmmain.rect_opcrec2.Fill.Color = $FFE94E1B then
  begin
    result := '2';
  end;
  if frmmain.rect_opcrec3.Fill.Color = $FFE94E1B then
  begin
    result := '3';
  end;
  if frmmain.rect_opcrec4.Fill.Color = $FFE94E1B then
  begin
    result := '4';
  end;
  if frmmain.rect_opcrec5.Fill.Color = $FFE94E1B then
  begin
    result := '5';
  end;
end;

/// <summary>TODO: Descripción de daCodigoAPUSCategoriaRecurso.</summary>
/// <param name="codCompleto">TODO.</param>
/// <returns>TODO.</returns>
function daCodigoAPUSCategoriaRecurso(codCompleto: string): string;
var
  tmpstr: string;
begin
  tmpstr := Copy(codCompleto, 1, 1);
  result := tmpstr;
end;

/// <summary>TODO: Descripción de IniciaNuevoRecurso.</summary>
procedure IniciaNuevoRecurso();
begin
  frmNuevoRecurso.edt_Descripcion.Text := '';
  frmNuevoRecurso.edt_Precio.Text := decimal_correcto('0.00');
  frmNuevoRecurso.edt_codCPC.Text := '';
  frmNuevoRecurso.cbb_UTiempos.ItemIndex := 0;
  frmNuevoRecurso.mmo_Especificaciones.Text := '';
end;

/// <summary>TODO: Descripción de activaBaseDatos.</summary>
/// <param name="codBase">TODO.</param>
procedure activaBaseDatos(codBase: string);
var
  qry: TUniQuery;
  x: Integer;
  tmpstr: string;
  BasesPadres: string;
  tmplst: TStringList;
begin
  qry := TUniQuery.Create(nil);
  tmplst := TStringList.Create;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      {(*}
      sql.Add('select * ' + '  from bases ' + '  where codBase=:codBase');
      {*)}
      ParamByName('codBase').AsString := codBase;
      Prepare;
      ExecSQL;
      base_activa.codBase := codBase;
      base_activa.nombre := FieldByName('nombre').AsString;
      base_activa.Descripcion := FieldByName('descripcion').AsString;
      base_activa.indirectos := FieldByName('indirectos').AsFloat;
      base_activa.TRendimiento := FieldByName('TRendimiento').AsString;
      base_activa.UMedida := FieldByName('UTiempo').AsString;
      base_activa.pais := FieldByName('pais').AsString;
      base_activa.moneda := FieldByName('moneda').AsString;
      base_activa.simboloMoneda := FieldByName('simboloMoneda').AsString;
      x := FieldByName('seguridadIndustrial').AsInteger;
      if x = 1 then
        base_activa.SeguridadIndustrial := True
      else
        base_activa.SeguridadIndustrial := False;
      base_activa.observaciones := FieldByName('observaciones').AsString;

      tmpstr := FieldByName('basesPadres').AsString;
      tmplst := TStringList.Create;
      tmplst.Text := tmpstr;
      base_activa.BasesPadres := tmplst;
      contieneTanteos;
      crearCadenacurrency;
    end;
  finally
    qry.Free;
  end;
  if base_activa.nombre <> '' then
  begin
    frmmain.lbl_BaseActiva.Text := 'Base Activa: ' + base_activa.nombre;
    frmmain.lbl_APUSRendimiento.Text := base_activa.TRendimiento;
    if (proyectoNuevo) and (frmMain.tbcPresupuestos.ActiveTab = frmMain.tab_5Presupuesto) then /// confirmar    si vale a abrir
    begin
      frmMain.edt_CodigoPresupuesto1.text := generaCodigoPresupuesto;
      codProyecto := frmMain.edt_CodigoPresupuesto1.text;
      revision := '0';
    end;
    frmMain.edt_CodigoPresupuesto1.text := codProyecto;
    frmMain.lbl_RevisionPresupuesto.text := revision;

    if base_activa.simboloMoneda = '' then
    begin
      base_activa.simboloMoneda := FormatSettings.CurrencyString;
      ActualizaSimboloMonedaenDB();
    end;
    frmMain.lbl_CostoIndirectoAPUS.Text := 'Costo Indirecto Total (' + FloatToStr(base_activa.indirectos) + '%):';
    // DMPresupuesto.sincronizaEdt2Presupuesto;
    DMPresupuesto.QTPresupuestosItems.Active := true;
    DMPresupuesto.dsTpresupuestosItems.Enabled := True;
    frmMain.dbGridConnect_TPresupuestosItems.Enabled := True;
    DMPresupuesto.QTPresupuestosItems.Refresh;
  end
  else
  begin
    frmmain.lbl_BaseActiva.Text := '';
  end;
end;

/// <summary>TODO: Descripción de ActualizaSimboloMonedaenDB.</summary>
procedure ActualizaSimboloMonedaenDB();
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Add('update bases ' + '   set simboloMoneda=:simboloMoneda ' + '  where codBase=:codBase ');
        {*)}
      ParamByName('simboloMoneda').AsString := FormatSettings.CurrencyString;
      ParamByName('codBase').AsString := base_activa.codBase;
      Prepare;
      ExecSQL;
    end;
  finally
    qry.free;
  end;
end;

/// <summary>TODO: Descripción de contieneTanteos.</summary>
procedure contieneTanteos();
var
  qry: TUniQuery;
begin
  contieneTanteo := false;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      {(*}
      sql.add('select codBase ' + '  from presupuestos_tanteo_Apus ' +
        ' where codBase=:codBase ' + '   and codPresupuesto=:codPresupuesto ' + '   and revision=:revision');
        {*)}
      Parambyname('codBase').AsString := base_activa.codBase;
      parambyname('codPresupuesto').AsString := codProyecto;
      Parambyname('revision').AsString := revision;
      Prepare;
      ExecSQL;
      if FieldByName('codBase').AsString <> '' then
        contieneTanteo := True
      else
        contieneTanteo := False;
    end;
  finally
    qry.Free;
  end;
end;

procedure GuardaNuevaBase;
var
  qry: TUniQuery;
  tmpstr: string;
  codBase: string;
begin
  if frmNuevaBase.edt_NombreBase.Text <> '' then
  begin
    qry := TUniQuery.Create(nil);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        {(*}
        sql.Add('Select nombre ' + '  from bases ' + ' where nombre = :nombre');
        {*)}
        ParamByName('nombre').AsString := frmNuevaBase.edt_NombreBase.Text;
        Prepare;
        ExecSQL;
        tmpstr := FieldByName('nombre').AsString;
        if tmpstr <> frmNuevaBase.edt_NombreBase.Text then
        begin
          Close;
          sql.Clear;
          {(*}
          sql.Add('INSERT INTO bases ( ' + ' codBase, ' + '  nombre, ' +
            '  descripcion, ' + '  indirectos, ' + '  TRendimiento, ' +
            '  UTiempo, ' + '  SeguridadIndustrial, ' + '  Observaciones, ' +
            '  fechaHoraCreacion, ' + '  fechaHoraModificacion, ' +
            '  sincronizada) ' + 'VALUES ( ' + '  :codBase, ' + '  :nombre, ' +
            '  :descripcion, ' + '  :indirectos, ' + '  :TRendimiento, ' +
            '  :UTiempo, ' + '  :SeguridadIndustrial, ' + '  :Observaciones, ' +
            '  :fechaHoraCreacion, ' + '  :fechaHoraModificacion, ' + '  :sincronizada)');
            {*)}
          codBase := 'DB' + generaCodigoUnicoShort;
          ParamByName('codBase').AsString := codBase;
          ParamByName('nombre').AsString := frmNuevaBase.edt_NombreBase.Text;
          ParamByName('descripcion').AsString := frmNuevaBase.edt_Descripcion.Text;
          try
            tmpstr := decimal_correcto(frmNuevaBase.edt_Indirectos.Text);
          except
            tmpstr := '0';
          end;
          ParamByName('indirectos').AsFloat := StrToFloat(tmpstr);
          ParamByName('Trendimiento').AsString := frmNuevaBase.cbb_Rendimiento.Items[frmNuevaBase.cbb_Rendimiento.ItemIndex];
          ParamByName('UTiempo').AsString := frmNuevaBase.cbb_UTiempos.Items[frmNuevaBase.cbb_UTiempos.ItemIndex];
          ParamByName('Observaciones').AsString := frmNuevaBase.mmo_Observaciones.Text;
          ParamByName('FechaHoraCreacion').AsDateTime := now;
          ParamByName('FechaHoraModificacion').AsDateTime := now;
          ParamByName('SeguridadIndustrial').AsBoolean := frmNuevaBase.chk_SeguridadIndustrial.IsChecked;
          ParamByName('Sincronizada').AsBoolean := False;
          Prepare;
          ExecSQL;
        end;
      end;
    finally
      qry.Free;
    end;
  end;
  activaBaseDatos(codBase);
end;

/// <summary>TODO: Descripción de limpiaOPC1.</summary>
procedure limpiaOPC1();
begin
  frmmain.rect_OPC1_Opciones.Fill.bitmap.bitmap := frmmain.img_OPC1_Opciones.MultiResBitmap[1].bitmap;
  frmmain.rect_OPC1_Subcategorias.Fill.bitmap.bitmap := frmmain.img_OPC1_Subcategorias.MultiResBitmap[1].bitmap;
  frmmain.rect_OPC1_Recursos.Fill.bitmap.bitmap := frmmain.img_OPC1_Recursos.MultiResBitmap[1].bitmap;
  frmmain.rect_OPC1_APUS.Fill.bitmap.bitmap := frmmain.img_OPC1_Apus.MultiResBitmap[1].bitmap;
end;

/// <summary>TODO: Descripción de limpiaOPC2.</summary>
procedure limpiaOPC2();
begin
  frmmain.rect_OPC2_CrearPresupuesto.Fill.bitmap.bitmap := frmmain.img_OPC2_CrearPresupuestos.MultiResBitmap[1].bitmap;
  frmmain.rect_OPC2_HistoricoPresupuestos.Fill.bitmap.bitmap := frmmain.img_OPC2_HistoricoPresupuestos.MultiResBitmap[1].bitmap;
end;

/// <summary>TODO: Descripción de decimal_correcto.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function decimal_correcto(datos: string): string;
var
  FSettings: TFormatSettings;
  separador: Char;
begin
  FSettings := TFormatSettings.Create();
  separador := FSettings.DecimalSeparator;
  if separador = '.' then
  begin
    datos := AnsiReplaceStr(datos, ',', '.');
  end
  else
  begin
    datos := AnsiReplaceStr(datos, '.', ',');
  end;
  result := datos;
end;

/// <summary>TODO: Descripción de limpiasub3db.</summary>
procedure limpiasub3db();
begin
  frmmain.rect_sub3DB1.Fill.Color := $007B7B7B;
  frmmain.rect_sub3DB2.Fill.Color := $007B7B7B;
  frmmain.rect_sub3DB4.Fill.Color := $007B7B7B;
  frmmain.rect_sub3DB5.Fill.Color := $007B7B7B;
end;

/// <summary>TODO: Descripción de limpiaOpc.</summary>
procedure limpiaOpc();
begin
  frmmain.glow_Opc2.Enabled := False;
  frmmain.glow_Opc3.Enabled := False;
  frmmain.rect_Opc1.Fill.Gradient := frmmain.rect_OpcBase.Fill.Gradient;
  frmmain.rect_Opc2.Fill.Gradient := frmmain.rect_OpcBase.Fill.Gradient;
  frmmain.rect_Opc3.Fill.Gradient := frmmain.rect_OpcBase.Fill.Gradient;
end;

/// <summary>TODO: Descripción de borraDBCategoria.</summary>
/// <param name="codItem">TODO.</param>
procedure borraDBCategoria(codItem: string);
var
  cod_categoria, ciu: Integer;
  tmpstr: string;
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  tmpstr := LeftStr(codItem, 1);
  cod_categoria := strtoint(tmpstr);
  tmpstr := RightStr(codItem, 3);
  ciu := strtoint(tmpstr);
  try
    try
      if (cod_categoria > 0) and (ciu > 0) then
      begin
        with qry do
        begin
          Connection := DModule_1.con2;
          Close;
          sql.Clear;
          sql.Add('delete from categoriaapus where categoria_base=' + inttostr(cod_categoria) + ' and ciu=' + inttostr(ciu) + ' and codBase=' + QuotedStr(base_activa.codBase));
          Prepare;
          ExecSQL;
        end;
      end;
    finally
      qry.Free;
    end;
  except
    on E: Exception do
    begin
      MuestraMensajeGiproy('Error: ' + E.ClassName + ' ' + E.Message);
    end;
  end;
end;

/// <summary>TODO: Descripción de quitaHTML.</summary>
/// <param name="datos">TODO.</param>
/// <returns>TODO.</returns>
function quitaHTML(datos: string): string;
var
  x, y: Integer;
  tmpstr: string;
begin
  x := AnsiPos('<', datos);
  y := AnsiPos('>', datos);
  if (x > 0) and (y > 0) then
  begin
    tmpstr := copy(datos, x, y - x + 1);
    datos := ReplaceStr(datos, tmpstr, '');
    datos := quitaHTML(datos);
  end;
  result := trim(datos);
end;

procedure GuardaCategoria(datos: item_twvr; origen: string);
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      DModule_1.con2.Connect;
      Close;
      sql.Clear;
      {(*}
      sql.Add('select descripcion  ' + '  from categoriaapus ' +
        ' where categoria_base = :categoria_base' + '   and ciu = :ciu' + '   and codBase = :codBase');
        {*)}
      ParamByName('categoria_base').AsString := datos.Categoria;
      ParamByName('ciu').AsString := datos.codigo;
      ParamByName('codBase').AsString := base_activa.codBase;
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('descripcion').AsString;
      if tmpstr = '' then
      begin
        Close;
        sql.Clear;
        {(*}
        sql.Add('INSERT INTO categoriaapus ( ' + '  categoria_base, ' +
          '  ciu, ' + '  descripcion, ' + '  codExterno, ' + '  comentarios, ' +
          '  usado, ' + '  fechaCreacion, ' + '  sincronizada, ' + '  origen, '
          + '  codBase, ' + '  nombreBase) ' + 'VALUES ( ' +
          '  :categoria_base, ' + '  :ciu, ' + '  :descripcion, ' +
          '  :codExterno, ' + '  :comentarios, ' + '  :usado, ' +
          '  :fechaCreacion, ' + '  :sincronizada, ' + '  :origen, ' + '  :codBase, ' + '  :nombreBase)');
          {*)}
        ParamByName('categoria_base').AsInteger := strtoint(datos.Categoria);
        ParamByName('ciu').AsInteger := strtoint(datos.codigo);
        ParamByName('descripcion').AsString := datos.Descripcion;
        ParamByName('codExterno').AsString := datos.codExt;
        ParamByName('comentarios').AsString := datos.comentarios;
        ParamByName('usado').AsBoolean := False;
        ParamByName('fechaCreacion').AsDateTime := now;
        ParamByName('sincronizada').AsBoolean := False;
        ParamByName('origen').AsString := origen;
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('nombreBase').AsString := base_activa.nombre;
        Prepare;
        ExecSQL;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure connectaDBEmb;
begin
  DModule_1.con2.Close;
  DModule_1.con2.Connect;
  if DModule_1.con2.Connected then
  begin
    frmmain.led_LocalDB.state := True;
  end
  else
  begin
    frmmain.led_LocalDB.state := False;
  end;
end;

/// <summary>TODO: Descripción de generaCodigoUnico.</summary>
/// <returns>TODO.</returns>
function generaCodigoUnico(): string;
var
  datos: string;
  test: Integer;
begin
  test := random($7FFFFFFF);
  datos := formatdatetime('yyyymmddhhnnss', now);
  result := inttostr(test) + datos;
end;

/// <summary>TODO: Descripción de generaCodigoUnicoConfig.</summary>
/// <returns>TODO.</returns>
function generaCodigoUnicoConfig(): string;
var
  datos: string;
  test: Integer;
begin
  test := random($7F);
  datos := formatdatetime('yyyymmddhhnnss', now);
  result := inttostr(test) + datos;
end;

/// <summary>TODO: Descripción de generaCodigoUnicoShort.</summary>
/// <returns>TODO.</returns>
function generaCodigoUnicoShort(): string;
var
  datos: string;
begin
  datos := formatdatetime('yyyymmddhhnnss', now);
  result := datos;
end;

/// <summary>TODO: Descripción de RefreshCategorias.</summary>
procedure RefreshCategorias();
var
  qry: TUniQuery;
  subn: TTMSFMXTreeViewNode;
  datos: item_twvr;
  modo: Integer;
  ciu: Integer;
  tmpstr: string;
begin
  limpiatrvwApus();
  if base_activa.codBase <> '' then
  begin
    qry := TUniQuery.Create(nil);
    try
      DModule_1.con2.Connect;
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        {(*}
        sql.Add('select * ' + '  from categoriaapus ' + ' where codbase = :codBase');
        {*)}
        ParamByName('codBase').AsString := base_activa.codBase;
        Prepare;
        ExecSQL;
        while not Eof do
        begin
          modo := FieldByName('Categoria_base').AsInteger;
          datos.Descripcion := FieldByName('descripcion').AsString;
          datos.codExt := FieldByName('codExterno').AsString;
          datos.comentarios := FieldByName('comentarios').AsString;
          ciu := FieldByName('ciu').AsInteger;
          tmpstr := '';
          if ciu < 10 then
            tmpstr := '00';
          if (ciu > 9) and (ciu < 100) then
            tmpstr := '0';
          tmpstr := tmpstr + inttostr(ciu);
          datos.codigo := inttostr(modo) + tmpstr;
          datos.accion := 'nuevo';
          case modo of
            1:
              begin
                subn := frmmain.trvw_cat1EquiposHerramientas.Nodes[0];
                addItemTrvw(frmmain.trvw_cat1EquiposHerramientas, subn, datos);
              end;
            2:
              begin
                subn := frmmain.trvw_cat2Materiales.Nodes[0];
                addItemTrvw(frmmain.trvw_cat2Materiales, subn, datos);
              end;
            3:
              begin
                subn := frmmain.trvw_cat3Transporte.Nodes[0];
                addItemTrvw(frmmain.trvw_cat3Transporte, subn, datos);
              end;
            4:
              begin
                subn := frmmain.trvw_cat4ManodeObra.Nodes[0];
                addItemTrvw(frmmain.trvw_cat4ManodeObra, subn, datos);
              end;
            5:
              begin
                subn := frmmain.trvw_cat5SeguridadIndustrial.Nodes[0];
                addItemTrvw(frmmain.trvw_cat5SeguridadIndustrial, subn, datos);
              end;
            6:
              begin
                subn := frmmain.trvw_cat6PreciosUnitarios.Nodes[0];
                addItemTrvw(frmmain.trvw_cat6PreciosUnitarios, subn, datos);
              end;
          end;
          Next;
        end;
      end;
    finally
      qry.Free;
    end;
  end;
end;

procedure addItemTrvw(trvw: TTMSFMXTreeView; node: TTMSFMXTreeViewNode; DatNodo: item_twvr);
var
  subn: TTMSFMXTreeViewNode;
begin
  trvw.BeginUpdate;
  subn := trvw.AddNode(node);
  subn.Text[0] := '<font color"#191919">' + DatNodo.Categoria + DatNodo.codigo + '</font>';
  subn.Text[1] := '<font color"#191919">' + DatNodo.Descripcion + '</font>';
  subn.Text[2] := '<font color"#191919">' + DatNodo.codExt + '</font>';
  subn.Text[3] := '<font color"#191919">' + DatNodo.comentarios + '</font>';
  subn.Text[4] := DatNodo.codUnico;
  subn.Text[5] := DatNodo.accion;
  trvw.EndUpdate;
end;

/// <summary>TODO: Descripción de Capitalize.</summary>
/// <param name="Str">TODO.</param>
/// <returns>TODO.</returns>
function Capitalize(Str: string): string;
var
  Index: Cardinal;
begin
  for Index := 1 to length(Str) do
    if (Index = 1) or (Str[Index - 1] = ' ') then
      if Str[Index] in ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'á', 'é', 'í', 'ó', 'ú', 'ñ'] then
        Dec(Str[Index], 32)
      else
    else if Str[Index] in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ'] then
      Inc(Str[Index], 32);
  result := Str;
end;

/// <summary>TODO: Descripción de limpiatrvwApus.</summary>
procedure limpiatrvwApus();
begin
  limpia_trvw(frmmain.trvw_cat1EquiposHerramientas, 1);
  limpia_trvw(frmmain.trvw_cat2Materiales, 2);
  limpia_trvw(frmmain.trvw_cat3Transporte, 3);
  limpia_trvw(frmmain.trvw_cat4ManodeObra, 4);
  limpia_trvw(frmmain.trvw_cat5SeguridadIndustrial, 5);
  limpia_trvw(frmmain.trvw_cat6PreciosUnitarios, 6);
  frmMain.trvw_cat1EquiposHerramientas.Columns[2].Width := 0;
  frmMain.trvw_cat2Materiales.Columns[2].Width := 0;
  frmMain.trvw_cat3Transporte.Columns[2].Width := 0;
  frmMain.trvw_cat4ManodeObra.Columns[2].Width := 0;
  frmmain.trvw_cat5SeguridadIndustrial.Columns[2].Width := 0;
  frmMain.trvw_cat6PreciosUnitarios.Columns[2].Width := 0;
end;

/// <summary>TODO: Descripción de compruebaUSuarioOffline.</summary>
/// <param name="uSer">TODO.</param>
/// <param name="password">TODO.</param>
/// <returns>TODO.</returns>
function compruebaUSuarioOffline(uSer, password: string): Boolean;
var
  qry: TUniQuery;
  fechaInicio: string;
  fechaFin: string;
  ultConexion: string;
  dias: Integer;
  diasSubcripcion: integer;
  tmpstr: string;
  passwordEnc: string;
begin
  uSer := LowerCase(uSer);
  Nombre_usuario := '';
  Apellidos_usuario := '';
  qry := TUniQuery.Create(nil);
  try
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        sql.Clear;
        {(*}
        sql.Add('select * ' + '  from usuarios ' + ' where email= :email ' + ' and estado=1');
        {*)}
        ParamByName('email').AsString := uSer;
        Prepare;
        ExecSQL;
        passwordEnc := DModule_1.SalsaEnc_1.Decrypt(FieldByName('password').AsString);
        if password = passwordEnc then
        begin
          codigo_usuario := Fieldbyname('idUsuario').AsInteger;
          Nombre_usuario := FieldByName('nombre').AsString;
          Apellidos_usuario := FieldByName('apellidos').AsString;
          ID_usuario := FieldByName('email').AsString;
          TUsuario := DModule_1.SalsaEnc_1.Decrypt(FieldByName('tipo').AsString);
          fechaFin := FieldByName('FechaFinInscripcion').AsString;
          ultConexion := FieldByName('UltConexion').AsString;
          tmpstr := DModule_1.SalsaEnc_1.Decrypt(ultConexion);
          dias := Trunc(now) - Trunc(StrTofloat(tmpstr));
          tmpstr := DModule_1.SalsaEnc_1.Decrypt(fechaFin);
          diasSubcripcion := Trunc(StrTofloat(tmpstr)) - trunc(Now);
          if (dias < 7) and (diasSubcripcion > 0) then
          begin
            if ID_usuario <> '' then
            begin
              frmmain.lbl_NUsuario.Text := 'Usuario: ' + Apellidos_usuario + ', ' + Nombre_usuario;
              frmmain.lbl_TSuscripcion.Text := 'Tipo: ' + Capitalize(TUsuario);
              result := True;
              CodUnicoEmpresaActiva := FieldByName('configBase').AsString;
              ndecimalesMoneda := 2;
              ndecimalesPresupuesto := 4;
              crearCadenacurrency;
              crearCadenaDecimales;
            end;
          end;
        end
        else
          Result := False;
      end;
    except
      Result := False;
    end;
  finally
    qry.Free;
    if CodUnicoEmpresaActiva <> '' then
      rellenaConfigEmpresa();
  end;
end;

/// <summary>TODO: Descripción de compruebaUsuario.</summary>
/// <param name="User">TODO.</param>
/// <param name="password">TODO.</param>
/// <returns>TODO.</returns>
function compruebaUsuario(User, password: string): Boolean;
var
  condb: TUniConnection;
  qry: TUniQuery;
  fechaInicio, fechaFin: TDateTime;
  HardwareIDOnline, HardwareIDMudanza: string;
  estadoEntrar: integer;
  mudanzaActiva: integer;
  BackUpActivo: integer;
  tmpstr: string;
  esOk: Boolean;
begin
  result := False;
  User := LowerCase(User);
  Nombre_usuario := '';
  Apellidos_usuario := '';

  esOk := LoginUsuario(User, password, UsuarioGiproy);
  try
    try
      if esOk then
      begin
        estadoEntrar := 0;
        Nombre_usuario := UsuarioGiproy.Nombre;
        codigo_usuario := UsuarioGiproy.idUsuario;
        Apellidos_usuario := UsuarioGiproy.Apellidos;
        ID_usuario := UsuarioGiproy.email;
        TUsuario := UsuarioGiproy.descripcion;
        fechaInicio := UsuarioGiproy.FechaInicio;
        fechaFin := UsuarioGiproy.FechaFin;
        CodUnicoEmpresaActiva := '';
        codIDUSuario := UsuarioGiproy.idUsuario;
        if fechaFin < now then
        begin
          ID_usuario := '';
        end;

        if ID_usuario <> '' then
        begin
          usuarioP := User;
          passwordP := password;
          codSalsaExt := recibeCodigoActualEncriptacion(usuarioP, passwordP);
          codSalsaExt := AnsiReplaceStr(codSalsaExt, #$A, '');
          if Assigned(frmMain.Users) then
          begin
            if frmMain.Users.UserExists(usuarioP) then
            begin
              // recuperar datos conexion db
              frmMain.Users.ChangePasswordDirect(UsuarioP, passwordP);
            end
            else
            begin
              frmmain.Users.AddUser(usuarioP, passwordP, TUsuario, True);
              frmMain.Users.SaveToFileAs(archivoIni);
            end;
          end;
          BackUpActivo := UsuarioGiproy.BackUpActivo;
          mudanzaActiva := UsuarioGiproy.MudanzaActiva;
          HardwareIDOnline := UsuarioGiproy.computerIDPrincipal;
          HardwareIDMudanza := UsuarioGiproy.computerIDMudanza;
          if HardwareIDOnline = '' then
          begin
            // Guardar Datos HardwareID
            if BackUpActivo = 1 then
            begin
              estadoEntrar := PreguntarSiRestaurarBackUp();
            end
            else
            begin
              recibeCodigoDBInstalacion(usuarioP, passwordP);
              estadoEntrar := InicializaDBGiProy();
            end;
          end
          else
          begin
            estadoEntrar := 0;
            if (HardwareKey = HardwareIDOnline) and (mudanzaActiva = 0) then
            begin
              // Entrar al sistema  (Ordenador Principal y no hay mudanza funcionando)
              estadoEntrar := 1;
            end;
            if (HardwareKey = HardwareIDOnline) and (mudanzaActiva = 1) then
            begin
              // Preguntar si desea anular la mudanza y entrar en caso de que asi lo especifique
              estadoEntrar := PreguntarSiEjecutarMudanza();
            end;

            if (HardwareKey = HardwareIDMudanza) and (mudanzaActiva = 1) then
            begin
              estadoEntrar := 1;
            end;

            if (HardwareKey <> HardwareIDOnline) and (HardwareIDMudanza <> '') then
            begin
              estadoEntrar := 0;
            end;

          end;
          case estadoEntrar of
            0:
              begin
                // Salir
                MuestraMensajeGiproy('El sistema no cumple requisitos de acceso 1.');
                Application.Terminate;
              end;
            1:
              begin
                // Entrar
                if not activaDBUsuario() then
                begin
                  MuestraMensajeGiproy('El sistema no cumple requisitos de acceso 2.');
                  Application.Terminate;
                end;
                TThread.Synchronize(nil,
                  procedure
                  begin
                    GuardaFechaHoraEntrada();
                    generaBackUP(True);
                  end);
              end;
            2:
              begin
                // Mudanza
                if not RestaurarMudanzaSistema() then
                  exit
              end;
            3:
              begin
                // Restaurar Backup ?
                if not RestaurarBackup() then
                  exit
              end;
          end;
          result := True;
          TThread.Synchronize(nil,
            procedure
            begin
              frmmain.lbl_NUsuario.Text := 'Usuario: ' + Apellidos_usuario + ', ' + Nombre_usuario;
              frmmain.lbl_TSuscripcion.Text := 'Tipo: ' + Capitalize(TUsuario);
              ndecimalesMoneda := 2;
              ndecimalesPresupuesto := 4;
              crearCadenacurrency;
              crearCadenaDecimales;
              RegistraLogUsuario(codIDUSuario, 1, tmpstr);
              guardacofiguracionDatosLocalUsuario(User, fechaInicio, fechaFin);
            end);

        end
        else
        begin
          result := False;
        end;

      end
      else
        MuestraMensajeGiproy('Error al iniciar sesión');
    except
      on E: Exception do
      begin
      // MuestraMensajeGiproy('Error: ' + E.Message);
        result := False;
      end;
    end;
  finally
    TThread.Synchronize(nil,
      procedure
      begin
        if CodUnicoEmpresaActiva <> '' then
          rellenaConfigEmpresa();
      end);
  end;
end;

procedure guardacofiguracionDatosLocalUsuario(email: string; fechaInicio, FechaFin: TDateTime);
var
  qry: TUniQuery;
  tmpstr: string;
  fechaUltimaConexion: double;
begin
  qry := TUniQuery.Create(nil);
  if FechaHoraInternet > 0 then
    fechaUltimaConexion := FechaHoraInternet
  else
    fechaUltimaConexion := now;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      {(*}
      sql.Add('select email ' + '  from usuarios ' + ' where email=:email');
      {*)}
      ParamByName('email').AsString := email;
      prepare;
      ExecSQL;
      tmpstr := FieldByName('email').AsString;
      if tmpstr = '' then
      begin
        close;
        SQL.Clear;
        {(*}
        sql.Add('INSERT INTO usuarios ( ' + '  id, ' + '  nombre, ' +
          '  apellidos, ' + '  email, ' + '  password, ' + '  id_usuario, ' +
          '  tipo, ' + '  UltConexion, ' + '  fechaInicioInscripcion, ' +
          '  fechaFinInscripcion, ' + '  estado) ' + 'VALUES ( ' + '  :id, ' +
          '  :nombre, ' + '  :apellidos, ' + '  :email, ' + '  :password, ' +
          '  :id_usuario, ' + '  :tipo, ' + '  :UltConexion, ' +
          '  :fechaInicioInscripcion, ' + '  :fechaFinInscripcion, ' + '  :estado)');
          {*)}
        ParamByName('id').asInteger := Codigo_usuario;
        ParamByName('nombre').AsString := Nombre_usuario;
        ParamByName('apellidos').AsString := Apellidos_usuario;
        ParamByName('email').AsString := frmMain.edt_UUsuario.Text;
        tmpstr := DModule_1.SalsaEnc_1.Encrypt(frmMain.edt_UPassword.Text);
        ParamByName('password').AsString := tmpstr;
        ParamByName('id_usuario').AsString := ID_usuario;
        ParamByName('tipo').AsString := TUsuario;
        tmpstr := DModule_1.SalsaEnc_1.Encrypt(FloatToStr(fechaUltimaConexion));
        ParamByName('UltConexion').Asstring := tmpstr;
        ParamByName('fechaInicioInscripcion').AsDateTime := fechaInicio;
        ParamByName('fechaFinInscripcion').AsDateTime := FechaFin;
        ParamByName('estado').AsInteger := 1;
        Prepare;
        ExecSQL;
      end
      else
      begin
        close;
        SQL.Clear;
        {(*}
        sql.Add('UPDATE usuarios ' + '   SET password = :password, ' +
          '       tipo = :tipo, ' + '       ultConexion = :ultConexion, ' +
          '       fechaInicioInscripcion = :fechaInicioInscripcion, ' +
          '       fechaFinInscripcion = :fechaFinInscripcion ' + 'WHERE email = :email');
          {*)}
        ParamByName('email').AsString := email;
        ParamByName('password').AsString := DModule_1.SalsaEnc_1.Encrypt(frmMain.edt_UPassword.Text);
        ParamByName('tipo').AsString := TUsuario;
        tmpstr := DModule_1.SalsaEnc_1.Encrypt(FloatToStr(fechaUltimaConexion));
        ParamByName('UltConexion').Asstring := tmpstr;
        ParamByName('fechaInicioInscripcion').AsDateTime := fechaInicio;
        ParamByName('fechaFinInscripcion').AsDateTime := FechaFin;
        Prepare;
        ExecSQL;
      end;
    end;
  finally
    qry.Free;
  end;
end;

/// <summary>TODO: Descripción de limpia_trvwAPUS.</summary>
/// <param name="trvw">TODO.</param>
procedure limpia_trvwAPUS(trvw: TTMSFMXTreeView);
var
  C: TTMSFMXTreeViewColumn;
  pn: TTMSFMXTreeViewNode;
  x: Integer;
begin
  trvw.ClearColumns;
  trvw.ClearNodes;

  trvw.BeginUpdate;
  C := trvw.Columns.Add;
  C.Text := 'Codigo';
  C.Width := 150;
  C := trvw.Columns.Add;
  C.Text := 'Descripción';
  C.Width := 350;
  C.WordWrapping := True;
  C := trvw.Columns.Add;
  C.Text := 'Cod. Ext';
  C.Width := 150;
  C := trvw.Columns.Add;
  C.Text := 'Comentarios';
  C.Width := 300;
  trvw.ColumnsAppearance.StretchAll := False;
  for x := 1 to 5 do
  begin
    pn := trvw.AddNode();
    case x of
      1:
        pn.Text[0] := '<font color"#191919">Equipos y Herramientas</font>';
      2:
        pn.Text[0] := '<font color"#191919">Materiales</font>';
      3:
        pn.Text[0] := '<font color"#191919">Transporte</font>';
      4:
        pn.Text[0] := '<font color"#191919">Mano de Obra</font>';
      5:
        pn.Text[0] := '<font color"#191919">Seguridad Industrial</font>';
      6:
        pn.Text[0] := '<font color"#191919">Precios Unitarios</font>';
    end;
  end;

  pn.Extended := True;
  trvw.EndUpdate;
  trvw.ExpandAll;
end;

procedure limpia_trvw(trvw: TTMSFMXTreeView; idTRVW: Integer);
var
  C: TTMSFMXTreeViewColumn;
  pn: TTMSFMXTreeViewNode;
begin
  trvw.ClearColumns;
  trvw.ClearNodes;

  trvw.BeginUpdate;
  C := trvw.Columns.Add;
  C.Text := 'Codigo';
  C.Width := 150;
  C := trvw.Columns.Add;
  C.Text := 'Descripción';
  C.Width := 350;
  C.WordWrapping := True;
  C := trvw.Columns.Add;
  C.Text := 'Cod. Ext';
  C.Width := 150;
  C := trvw.Columns.Add;
  C.Text := 'Comentarios';
  C.Width := 300;
  trvw.ColumnsAppearance.StretchAll := False;

  pn := trvw.AddNode();
  case idTRVW of
    1:
      pn.Text[0] := '<font color"#191919">Equipos y Herramientas</font>';
    2:
      pn.Text[0] := '<font color"#191919">Materiales</font>';
    3:
      pn.Text[0] := '<font color"#191919">Transporte</font>';
    4:
      pn.Text[0] := '<font color"#191919">Mano de Obra</font>';
    5:
      pn.Text[0] := '<font color"#191919">Seguridad Industrial</font>';
    6:
      pn.Text[0] := '<font color"#191919">Precios Unitarios</font>';
  end;

  pn.Extended := True;
  trvw.EndUpdate;
  trvw.ExpandAll;
end;

procedure AbrirEnlace(const AUrl: string);
begin
  ShellExecute(0, 'open', PChar(AUrl), nil, nil, SW_SHOWNORMAL);
end;

procedure CargarTiendaOnline;
begin
  // Ejecutar en segundo plano para no bloquear la UI
  TTask.Run(
    procedure
    var
      Error: string;
      Slugs: string;
      Ok: Boolean;
      Param: TParametroValor;
      listadoDatos: TArray<TProductoCategoriaItem>;

    begin
      // 1) Obtener los slugs desde el backend PHP
      Ok := ObtenerParametroDesdePHP(GlobalAuthToken, 5, Param, Error);
      if not Ok then
      begin
        // Mostrar error en el hilo principal si falla la obtención
        TThread.Queue(nil,
          procedure
          begin
            if (frmMain.lvTienda <> nil) and (frmMain.lvTienda.Scene <> nil) then
              ShowMessage('Error al obtener slugs: ' + Error);
          end);
        Exit;
      end;
      Slugs := Param.Valor;

      // 2) Obtener listado de productos usando los slugs
      Ok := ObtenerListadoProductosTipado(Slugs, 1000, 1, listadoDatos, Error);
      if not Ok then
      begin
        // Mostrar error en el hilo principal si falla la carga de productos
        TThread.Queue(nil,
          procedure
          begin
            if (frmMain.lvTienda <> nil) and (frmMain.lvTienda.Scene <> nil) then
              ShowMessage('Error al obtener productos: ' + Error);
          end);
        Exit;
      end;

      // 3) Poblar la interfaz gráfica con los productos obtenidos
      TThread.Queue(nil,
        procedure
        const
          WFrame = 448; // Ancho estimado de cada frame de producto
          HFrame = 116; // Alto estimado de cada frame de producto
        var
          Producto: TProductoCategoriaItem;
          Img: TBitmap;
          ImgError: string;
          LinkBtn: TListItemTextButton;
          frmProductoTienda: TfrmProductoTienda;
          item: TlistboxItem;
          x: integer;
          Wlv: double;
        begin
          // Validar que el ListView esté disponible
          if (frmMain.lvTienda = nil) or (frmMain.lvTienda.Scene = nil) then
            Exit;

          frmMain.lvTienda.BeginUpdate;
          try
            frmMain.lvTienda.items.Clear;

            // Calcular número de columnas según el ancho disponible
            frmMain.lvTienda.Columns := 4;

            // Iterar sobre los productos y crear ítems visuales
            for Producto in listadoDatos do
            begin
              x := frmMain.lvTienda.items.Count;
              frmMain.lvTienda.BeginUpdate;

              // Crear ítem y frame visual para el producto
              item := TlistboxItem.Create(nil);
              frmProductoTienda := TfrmProductoTienda.Create(nil);
              frmProductoTienda.Name := 'productoID_' + IntToStr(x);
              frmProductoTienda.lbl_Producto.Text := Producto.Nombre;
              frmProductoTienda.mmo_descripcion.Text := Producto.Descripcion;
              frmProductoTienda.lblPrecio.text := 'Precio: USD ' + Producto.Precio;

              // Cargar imagen desde base64 o URL, o usar imagen genérica
              Img := nil;
              if Producto.ImagenBase64 <> '' then
                Img := BitmapFromBase64(Producto.ImagenBase64, ImgError);
              if (Img = nil) and (Producto.ImagenURL <> '') then
                Img := DownloadBitmapFromUrl(Producto.ImagenURL, ImgError, 110, 112, bsmFit);
              if Img = nil then
                Img := frmMain.BitmapIconoGenerico.Bitmap;
              frmProductoTienda.img1.Bitmap := Img;

              // Asignar enlace del producto
              frmProductoTienda.lbl_link.Text := Producto.Enlace;

              // Configurar layout del frame dentro del ítem
              frmProductoTienda.Parent := item;
              frmProductoTienda.Margins.Bottom := 5;
              frmProductoTienda.Align := TAlignLayout.Client;

              // Agregar ítem al ListView
              item.Height := HFrame;
              item.Parent := frmMain.lvTienda;

              frmMain.lvTienda.EndUpdate;
            end;
          finally
            // Finalizar actualización del ListView
            frmMain.lvTienda.EndUpdate;
          end;
        end);
    end);
end;

{$REGION 'RESPONSIVE TIENDA: helpers UI + loaders a partir de matriz de categorías'}
(*
  ====================================================================
  BLOQUE UI RESPONSIVO + CARGA DESDE MATRIZ DE CATEGORÍAS
  --------------------------------------------------------------------
  ¿Qué añade?
    - ApplyResponsiveColumns: Ajusta dinámicamente el nº de columnas
      de un TListBox (tu lvTienda) en función del ancho disponible.
    - PintarProductosEnListView: Pinta la lista de productos en lvTienda
      reutilizando tus helpers de imagen (base64/URL) y el frame
      TfrmProductoTienda.
    - CargarTiendaOnlineDesdeMatriz: Obtiene productos para cada
      categoría dada en un array (p.ej. ['Plan','Modulos','Pack','otros'])
      y los pinta en la UI.
    - (Opcional) CargarTiendaOnlineDesdeMatrizConPrefijo: igual que
      el anterior, pero aplicando filtro starts_with por categoría,
      usando ObtenerListadoProductosPorPrefijoTipado.

  Requisitos:
    - Tener en la unidad (o accesible por uses) los tipos/funciones:
      TProductoCategoriaItem, BitmapFromBase64, DownloadBitmapFromUrl,
      ObtenerListadoProductosTipado, ObtenerListadoProductosPorPrefijoTipado (si usas el opcional),
      TfrmProductoTienda, frmMain.lvTienda (TListBox), frmMain.BitmapIconoGenerico.
    - FMX: TListBox, TListBoxItem, TBitmap, TAlignLayout.

  Integración recomendada:
    - Llamar a ApplyResponsiveColumns(lvTienda, 320, 1, 6) en el
      OnResize del formulario o OnResized del ListBox para recalcular
      las columnas cuando cambie el tamaño de la ventana.

  ====================================================================
*)


/// <summary>
///  Ajusta el número de columnas del ListBox de forma responsiva,
///  en base a un ancho objetivo por ítem (ATargetItemWidth) y límites
///  mínimos/máximos de columnas.
/// </summary>
/// <param name="AListBox">ListBox contenedor (ej. frmMain.lvTienda)</param>
/// <param name="ATargetItemWidth">Ancho objetivo por tarjeta (px)</param>
/// <param name="AMinCols">Mínimo de columnas</param>
/// <param name="AMaxCols">Máximo de columnas</param>
procedure ApplyResponsiveColumns(const AListBox: TListBox; const ATargetItemWidth: Single; const AMinCols, AMaxCols: Integer);
var
  Available: Single;
  Cols: Integer;
  MinCols, MaxCols: Integer;
  PaddingW: Single;
begin
  if (AListBox = nil) or (AListBox.Scene = nil) then
    Exit;

  // Si tu estilo tiene más relleno, ajústalo aquí
  PaddingW := AListBox.Padding.Left + AListBox.Padding.Right;

  // Ancho disponible real
  Available := max(0.0, AListBox.Width - PaddingW);

  MinCols := max(1, AMinCols);
  if AMaxCols <= 0 then
    MaxCols := 12
  else
    MaxCols := max(AMinCols, AMaxCols);

  if ATargetItemWidth <= 0 then
    Cols := MinCols
  else
    Cols := Trunc(Available / ATargetItemWidth);

  if Cols < MinCols then
    Cols := MinCols
  else if Cols > MaxCols then
    Cols := MaxCols;

  AListBox.Columns := Cols;

  // Opcional: repartir ancho de ítem para ocupar todo el espacio
  if Cols > 0 then
    AListBox.ItemWidth := IfThen(Cols > 0, Available / Cols, Available);
end;

/// <summary>
///  Pinta los productos en frmMain.lvTienda generando un TListBoxItem por
///  producto y embebiendo en él un TfrmProductoTienda (tu tarjeta).
///  Reutiliza: BitmapFromBase64, DownloadBitmapFromUrl.
/// </summary>
/// <param name="AProductos">Arreglo de productos tipados</param>
procedure PintarProductosEnListView(const AProductos: TArray<TProductoCategoriaItem>);
const
  // Alto fijo de la tarjeta. Puedes hacerlo dinámico si lo prefieres.
  HFrame = 116;
  // Ancho objetivo por tarjeta para el cálculo responsivo
  TargetItemWidth = 320;
  MinCols = 1;
  MaxCols = 6;
var
  Producto: TProductoCategoriaItem;
  Img: TBitmap;
  ImgError: string;
  frmProductoTienda: TfrmProductoTienda;
  item: TListBoxItem;
  x: Integer;
begin
  if (frmMain.lvTienda = nil) or (frmMain.lvTienda.Scene = nil) then
    Exit;

  frmMain.lvTienda.BeginUpdate;
  try
    frmMain.lvTienda.Items.Clear;

    // Cálculo inicial de columnas responsivas
    ApplyResponsiveColumns(frmMain.lvTienda, TargetItemWidth, MinCols, MaxCols);

    for Producto in AProductos do
    begin
      x := frmMain.lvTienda.Items.Count;

      // Crear item y el frame de producto
      item := TListBoxItem.Create(frmMain.lvTienda);
      item.Height := HFrame;

      frmProductoTienda := TfrmProductoTienda.Create(item);
      frmProductoTienda.Name := 'productoID_' + IntToStr(x);
      frmProductoTienda.lbl_Producto.Text := Producto.Nombre;
      frmProductoTienda.mmo_descripcion.Text := Producto.Descripcion;
      frmProductoTienda.lblPrecio.Text := 'Precio: USD ' + Producto.Precio;

      // Imagen: base64 → URL → genérica
      Img := nil;
      if Producto.ImagenBase64 <> '' then
        Img := BitmapFromBase64(Producto.ImagenBase64, ImgError);
      if (Img = nil) and (Producto.ImagenURL <> '') then
        Img := DownloadBitmapFromUrl(Producto.ImagenURL, ImgError, 110, 112, bsmFit);
      if Img = nil then
        Img := frmMain.BitmapIconoGenerico.Bitmap;
      frmProductoTienda.img1.Bitmap := Img;

      // Enlace del producto
      frmProductoTienda.lbl_link.Text := Producto.Enlace;

      // Layout dentro del item
      frmProductoTienda.Parent := item;
      frmProductoTienda.Margins.Bottom := 5;
      frmProductoTienda.Align := TAlignLayout.Client;

      // Añadir al ListBox
      item.Parent := frmMain.lvTienda;
    end;

    // Recalcular columnas por si el layout final cambia algo el ancho disponible
    ApplyResponsiveColumns(frmMain.lvTienda, TargetItemWidth, MinCols, MaxCols);
  finally
    frmMain.lvTienda.EndUpdate;
  end;
end;

/// <summary>
///  Carga productos desde una "matriz" (array) de categorías (slugs) y
///  los pinta en la UI. Reutiliza ObtenerListadoProductosTipado.
///  - En caso de error por categoría, lo notifica y continúa con el resto.
/// </summary>
/// <param name="ACategorias">Array de slugs de categoría (p.ej. ['Plan','Modulos'])</param>
procedure CargarTiendaOnlineDesdeMatriz(const ACategorias: TArray<string>);
begin
  TTask.Run(
    procedure
    var
      Error: string;
      Ok: Boolean;
      Cat: string;
      ListaCat: TArray<TProductoCategoriaItem>;
      Todos: TArray<TProductoCategoriaItem>;
      baseLen, j: Integer;
    begin
      SetLength(Todos, 0);

      // 1) Obtener productos de cada categoría y acumular
      for Cat in ACategorias do
      begin
        ListaCat := nil;
        Error := '';
        Ok := ObtenerListadoProductosTipado(Cat, 1000, 1, ListaCat, Error);
        if not Ok then
        begin
          TThread.Queue(nil,
            procedure
            begin
              if (frmMain.lvTienda <> nil) and (frmMain.lvTienda.Scene <> nil) then
                ShowMessage('Error al obtener productos de "' + Cat + '": ' + Error);
            end);
          Continue;
        end;

        if Length(ListaCat) > 0 then
        begin
          baseLen := Length(Todos);
          SetLength(Todos, baseLen + Length(ListaCat));
          for j := 0 to High(ListaCat) do
            Todos[baseLen + j] := ListaCat[j];
        end;
      end;

      // 2) Pintar el total en la UI en el hilo principal
      TThread.Queue(nil,
        procedure
        begin
          PintarProductosEnListView(Todos);
        end);
    end);
end;

(*
  --------- OPCIONAL: versión con filtro starts_with por categoría ---------
  Requiere que tengas implementada la función:
   function ObtenerListadoProductosPorPrefijoTipado(const ACategorySlugs, AStartsWith: string;
     APerPage, APage: Integer; out ALista: TArray<TProductoCategoriaItem>; out AError: string): Boolean;
*)



/// <summary>
///  Igual que CargarTiendaOnlineDesdeMatriz, pero aplicando un filtro
///  starts_with por categoría. Requiere tu función ObtenerListadoProductosPorPrefijoTipado.
/// </summary>
/// <param name="AFiltros">Array de filtros por categoría</param>
procedure CargarTiendaOnlineDesdeMatrizConPrefijo(const AFiltros: TArray<TCategoriaFiltro>);
begin
  TTask.Run(
    procedure
    var
      I, J, BaseLen: Integer;
      L: TCategoriaFiltro;
      ListaCat, Todos: TArray<TProductoCategoriaItem>;
      Ok: Boolean;
      Error: string;
    begin
      SetLength(Todos, 0);

      // 1) Traer cada bloque con su prefijo
      for I := 0 to High(AFiltros) do
      begin
        L := AFiltros[I];         // hacemos una COPIA local
        if L.PerPage <= 0 then
          L.PerPage := 1000;
        if L.Page <= 0 then
          L.Page := 1;

        ListaCat := nil;
        Error := '';
        Ok := ObtenerListadoProductosPorPrefijoTipado(L.Slugs, L.StartsWith, L.PerPage, L.Page, ListaCat, Error);
        if not Ok then
        begin
          TThread.Queue(nil,
            procedure
            begin
              if Assigned(frmMain) and Assigned(frmMain.lvTienda) and Assigned(frmMain.lvTienda.Scene) then
                ShowMessage('Error en "' + L.Slugs + '": ' + Error);
            end);
          Continue;
        end;

        if Length(ListaCat) > 0 then
        begin
          BaseLen := Length(Todos);
          SetLength(Todos, BaseLen + Length(ListaCat));
          for J := 0 to High(ListaCat) do
            Todos[BaseLen + J] := ListaCat[J];
        end;
      end;

      // 2) Pintar en la UI
      TThread.Queue(nil,
        procedure
        begin
          PintarProductosEnListView(Todos);
        end);
    end);
end;

{$ENDREGION}

end.

{-- End of AutoDoc --}


