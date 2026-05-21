unit uApiGiProy;

interface

uses
  System.SysUtils, System.Classes, System.Net.URLClient, System.Net.HttpClient,
  System.Net.HttpClientComponent, System.JSON, System.Math, FMX.Graphics, System.Types, FMX.Types,
  System.UITypes, System.StrUtils, System.NetEncoding, System.DateUtils;

/// Constantes de conexion

const
  AServerURLLogin = 'https://app.62.171.171.124.sslip.io/loginUsuario.php';
  UrlLogEntrada = 'https://app.62.171.171.124.sslip.io/RegistraLogEntradaUsuario.php';
  UrlBackupDisponibles = 'https://app.62.171.171.124.sslip.io/BackupDisponibles.php';
  UrlDarFechaCaducidadProducto = 'https://app.62.171.171.124.sslip.io/DarFechaCaducidadProducto.php';
  UrlEnviaComunicacion = 'https://app.62.171.171.124.sslip.io/EnviaComunicacion.php';
  UrlConsultaProducto = 'https://app.62.171.171.124.sslip.io/EstadoSuscripcion.php';
  UrlMigracionesDisponibles = 'https://app.62.171.171.124.sslip.io/MigracionesDisponibles.php';
  UrlComplementosSinUsar = 'https://app.62.171.171.124.sslip.io/ComplementosSinUsar.php';
  UrlUtilizarComplemento = 'https://app.62.171.171.124.sslip.io/UtilizarComplemento.php';
  UrlGuardaHardwareID = 'https://app.62.171.171.124.sslip.io/GuardarHardwareID.php';
  UrlActualizaEstadoMigracion = 'https://app.62.171.171.124.sslip.io/ActualizaEstadoMigracion.php';
  UrlRecibirComunicacion = 'https://app.62.171.171.124.sslip.io/RecibirComunicacion.php';
  UrlActualizaEstadoComunicaciones = 'https://app.62.171.171.124.sslip.io/ActualizaExtadoComunicaciones.php';
  UrlExisteUsuarioServer = 'https://app.62.171.171.124.sslip.io/ExisteUsuarioServer.php';
  UrlEnviarMensaje = 'https://app.62.171.171.124.sslip.io/EnviarMensaje.php';
  URI_Publicidad = 'https://app.62.171.171.124.sslip.io/publicidad/';
  UrlVisorPublicidad = 'https://app.62.171.171.124.sslip.io/VisorPublicidad.php';
  UrlComprobarModulo = 'https://app.62.171.171.124.sslip.io/ComprobarModulo.php';
  UrlIndicesPrecios = 'https://app.62.171.171.124.sslip.io/daIndicesPrecios.php';
  UrlIndicesValor = 'https://app.62.171.171.124.sslip.io/daIndicesValor.php';
  UrlCompruebaUsuarioPorEmail = 'https://app.62.171.171.124.sslip.io/CompruebaUsuarioPorEmail.php';
  UrlDaTokenWP = 'https://app.62.171.171.124.sslip.io/daTokenWP.php';
  UrlCreaUsuarioNuevo = 'https://app.62.171.171.124.sslip.io/CreaUsuarioNuevo.php';
  UrldaParametros = 'https://app.62.171.171.124.sslip.io/darParametro.php';
  UrlCompruebaIdFiscal = 'https://app.62.171.171.124.sslip.io/CompruebaIdFiscal.php';
  UrlDaTokenWebServiceRUC = 'https://app.62.171.171.124.sslip.io/daTokenWebServiceRUC.php';
  UrlConsultarRuc = 'https://app.62.171.171.124.sslip.io/ConsultarRuc.php';
  UrlRegistrarUsoReporteExpress = 'https://app.62.171.171.124.sslip.io/RegistrarUsoReporteExpress.php';


  // API WORDPRESS
  UrlTerminosCondiciones = 'https://giproy.com/terminos-y-condiciones-software-giproy/';
  UrlPoliticaPrivacidad = 'https://giproy.com/politica-de-privacidad-soft-giproy/';
  UrlWP_ProductoInfo = 'https://giproy.com/wp-json/giproy/v1/producto/';
  UrlWP_ListadoProductos = 'https://giproy.com/wp-json/giproy/v1/productos/';

/// Variante tipada: mapea cada item a record Delphi.
type
  TPublicidadItem = record
    Descripcion: string;
    URI: string;
  end;

type
  TIndicePrecioItem = record
    CodIndice: string;
    Descripcion: string;
    Categoria: string;
  end;

type
  TIndiceValorItem = record
    CodIndice: Integer;
    MesAnio: string;
    Valor: string;
  end;

type
  EApiException = class(Exception)
  private
    FStatusCode: Integer;
  public
    constructor Create(const Msg: string; AStatusCode: Integer); reintroduce;
    property StatusCode: Integer read FStatusCode;
  end;

type
  TProductoWCInfo = record
    ID: Integer;
    SKU: string;
    Title: string;
    Image: string;
    PriceHTML: string;
    Description: string;
    Permalink: string;
    Currency: string;
    PriceRaw: string; // numrico como string (p.ej. "19.99" o "")
    ImagenURL: string;
    IsVariation: Boolean;
  end;

type
  TObtenerProductoCallback = reference to procedure(const Success: Boolean; const Msg: string; const
    Producto: TProductoWCInfo);

type
  TBitmapScaleMode = (bsmFit, bsmCover);

type
  TProductoCategoriaItem = record
    ID: Integer;
    Nombre: string;
    Descripcion: string;
    Precio: string;
                // precio actual en string (Woo suele serializar como string)
    PrecioHTML: string;
    Moneda: string;
    SKU: string;
    Stock: string; // instock, outofstock, onbackorder
    Slug: string;
    Enlace: string;
    ImagenURL: string;
    ImagenBase64: string; // puede venir vaco si no hay destacada
  end;

type
  TParametroValor = record
    Descripcion: string;
    Valor: string;
  end;

type
  TNombreSeparado = record
    Nombre: string;
    Apellidos: string;
  end;

  // Información devuelta por ConsultarRuc.php
type
  TRucInfo = record
    NumeroRuc: string;
    RazonSocial: string;
    CodigoJurisdiccion: string;
    EstadoContribuyente: string;
    ClaseContribuyente: string;
    FechaInicioActividades: string;
    FechaActualizacion: string;
    FechaSuspensionDefinitiva: string;
    FechaReinicioActividades: string;
    Obligado: string;
    TipoContribuyente: string;
    NumeroEstablecimiento: Integer;
    NombreFantasiaComercial: string;
    EstadoEstablecimiento: string;
    DescripcionProvinciaEst: string;
    DescripcionCantonEst: string;
    DescripcionParroquiaEst: string;
    CodigoCIIU: string;
    ActividadEconomica: string;
    AgenteRetencion: string;
    Especial: string;
  end;


        /// Registra evento de usuario (1 = login, 2 = logout)
function RegistrarEventoUsuario(const AUrl, AToken: string; AIdUsuario, ATipo: Integer; out AJson:
  TJSONObject): Boolean;

/// Registra login (tipo = 1)
function RegistrarLoginUsuario(const AUrl, AToken: string; AIdUsuario: Integer; out AJson:
  TJSONObject): Boolean;

/// Registra logout (tipo = 2)
function RegistrarLogoutUsuario(const AUrl, AToken: string; AIdUsuario: Integer; out AJson:
  TJSONObject): Boolean;

/// Consulta DarFechaCaducidadProducto.php
/// { ok:true, FechaHoraCaducidad:"YYYY-MM-DD hh:mm:ss", ... }
function DarFechaCaducidadProducto(const AUrl, AToken: string; AIdUsuario, AIdProducto: Integer; out
  AJson: TJSONObject): Boolean;

/// Variante que adems intenta convertir "FechaHoraCaducidad" a TDateTime.
/// Devuelve True si ok=true y pudo parsearse la fecha.
function DarFechaCaducidadProductoFecha(const AUrl, AToken: string; AIdUsuario, AIdProducto: Integer;
  out AFechaCaducidad: TDateTime; out AJson: TJSONObject): Boolean;

/// Enva una comunicacin va HTTP al endpoint EnviaComunicacion.php
function EnviarComunicacion(const AUrl, AToken: string; AIdEmisor, AIdReceptor, ATipoMensaje:
  Integer; const AMensaje, AFechaHoraEnvio, AAdicional: string; out AJson: TJSONObject): Boolean;

/// Atajo: usa fechaHoraEnvio = Now (formato "YYYY-MM-DD hh:mm:ss")
function EnviarComunicacionAhora(const AUrl, AToken: string; AIdEmisor, AIdReceptor, ATipoMensaje:
  Integer; const AMensaje, AAdicional: string; out AJson: TJSONObject): Boolean;

/// Consulta EstadoSuscripcion.php
function ConsultarEstadoSuscripcion(const AToken: string; AIdUsuario: Integer; AIdComplementos:
  Integer; out AJson: TJSONObject): Boolean;

/// Consulta MigracionesDisponibles.php
/// POST: idEmisor
/// Respuesta OK: { ok:true, fechaHoraEnvio:"YYYY-MM-DD hh:mm:ss", Mensaje:"...", adicional:"..." }
function ConsultarMigracionDisponible(const AUrl, AToken: string; AIdEmisor: Integer; out AJson:
  TJSONObject): Boolean;

/// Variante que adems intenta convertir "fechaHoraEnvio" a TDateTime y devolver campos.
/// Devuelve True si ok=true y pudo parsearse la fecha correctamente.
function ConsultarMigracionDisponibleDatos(const AUrl, AToken: string; AIdEmisor: Integer; out
  AFechaHora: TDateTime; out AMensaje, AAdicional: string; out AJson: TJSONObject): Boolean;

/// Consulta ComplementosSinUsar.php
/// POST: idUsuario, idComplemento
/// Respuesta OK: { ok:true, cantidad_restante:int, total_comprado:int, total_usado:int, ... }
function ObtenerComplementosSinUsar(const AUrl, AToken: string; AIdUsuario, AIdComplemento: Integer;
  out AJson: TJSONObject): Boolean;

/// Variante que adems devuelve los valores enteros parseados.
/// Devuelve True si ok=true y existen los campos.
function ObtenerComplementosSinUsarDatos(const AUrl, AToken: string; AIdUsuario, AIdComplemento:
  Integer; out ACantidadRestante, ATotalComprado, ATotalUsado: Integer; out AJson: TJSONObject): Boolean;

/// Llama a UtilizarComplemento.php
/// POST: idUsuario, idComplemento
/// Respuesta OK: { ok:true, codigoUso:"<uuid|0>", restantes:int, ... }
function UtilizarComplemento(const AToken: string; AIdUsuario, AIdComplemento: Integer; out AJson:
  TJSONObject): Boolean;

/// Variante que adems devuelve codigoUso y restantes parseados.
/// Devuelve True si ok=true y existen los campos.
function UtilizarComplementoDatos(const AToken: string; AIdUsuario, AIdComplemento: Integer; out
  ACodigoUso: string; out ARestantes: Integer; out AJson: TJSONObject): Boolean;

/// Guarda/actualiza el hardware principal del usuario (ComputerIdPrincipal y su fecha/hora)
/// POST hacia URLGuardaHardwareID:
/// idUsuario (int), ComputerIDPrincipal (string), fechahoraIDPrincipal ("YYYY-MM-DD hh:mm:ss")
/// Respuesta OK: { ok:true, rows_affected:int, ... }
function GuardarHardwareID(const AToken: string; AIdUsuario: Integer; const AComputerIDPrincipal,
  AFechaHora: string; out AJson: TJSONObject): Boolean;

/// Atajo: usa fechaHora = Now (formato "YYYY-MM-DD hh:mm:ss")
function GuardarHardwareIDAhora(const AToken: string; AIdUsuario: Integer; const
  AComputerIDPrincipal: string; out AJson: TJSONObject): Boolean;

/// Consulta BackupDisponibles.php
/// POST: idUsuario
/// Respuesta OK: { ok:true, idUsuario:..., result:{ Mensaje:"...", adicional:"...", fechaHoraEnvio:"YYYY-MM-DD hh:mm:ss" }, ... }
function ConsultarBackupDisponible(const AUrl, AToken: string; AIdUsuario: Integer; out AJson:
  TJSONObject): Boolean;

/// Variante que adems intenta convertir "fechaHoraEnvio" a TDateTime y devolver campos.
/// Devuelve True si ok=true y pudo parsearse la fecha correctamente.
function ConsultarBackupDisponibleDatos(const AUrl, AToken: string; AIdUsuario: Integer; out
  AFechaHora: TDateTime; out AMensaje, AAdicional: string; out AJson: TJSONObject): Boolean;

/// Actualiza estado de mudanza del usuario (ActualizaEstadoMigracion.php)
/// POST (application/json):
/// { "idUsuario":int, "computerIDMudanza":string, "fechaHoraIDMudanza":"YYYY-MM-DD hh:mm:ss" }
/// Respuesta OK: { ok:true, rows_affected:int }
function ActualizarEstadoMigracion(const AUrl, AToken: string; AIdUsuario: Integer; const
  AComputerIDMudanza, AFechaHora: string; out AJson: TJSONObject): Boolean;

/// Atajo: usa fechaHora = Now (formato "YYYY-MM-DD hh:mm:ss") y devuelve rows_affected
function ActualizarEstadoMigracionAhora(const AUrl, AToken: string; AIdUsuario: Integer; const
  AComputerIDMudanza: string; out ARowsAffected: Integer; out AJson: TJSONObject): Boolean;

/// Consulta RecibirComunicacion.php
/// POST/GET: ultimoID (opcional), limit (opcional)
/// Respuesta OK: { ok:true, desdeID:int, count:int, items:[ {...}, ... ] }
function RecibirComunicaciones(const AUrl, AToken: string; AUltimoID: Integer; ALimit: Integer; out
  AJson: TJSONObject): Boolean;

/// Variante que adems devuelve desdeID, count y un TJSONArray con los items.
/// Devuelve True si ok=true y existen los campos esperados.
function RecibirComunicacionesDatos(const AUrl, AToken: string; AUltimoID, ALimit: Integer; out
  ADesdeID, ACount: Integer; out AItems: TJSONArray; out AJson: TJSONObject): Boolean;

/// Actualiza la fecha/hora de recepcin de una comunicacin
/// POST: idComunicacion (bigint), fechaHoraRecepcion ("YYYY-MM-DD hh:mm:ss")
/// Respuesta OK: { ok:true, idComunicacion:<num>, fechaHoraRecepcion:"YYYY-MM-DD hh:mm:ss" }
function ActualizarEstadoComunicacion(const AUrl, AToken: string; AIdComunicacion: Int64; const
  AFechaHoraRecepcion: string; out AJson: TJSONObject): Boolean;

/// Atajo: usa fechaHoraRecepcion = Now (formato "YYYY-MM-DD hh:mm:ss")
function ActualizarEstadoComunicacionAhora(const AUrl, AToken: string; AIdComunicacion: Int64; out
  AJson: TJSONObject): Boolean;

/// Variante que adems devuelve los campos parseados (id y fecha)
function ActualizarEstadoComunicacionDatos(const AUrl, AToken: string; AIdComunicacion: Int64; const
  AFechaHoraRecepcion: string; out AIdEcho: Int64; out AFechaRecepcion: TDateTime; out AJson:
  TJSONObject): Boolean;

/// Consulta ExisteUsuarioServer.php
/// POST: email
/// Respuesta OK: { ok:true, NombreUsuario:"Apellidos, Nombre" }
function ExisteUsuarioServer(const AUrl, AToken, AEmail: string; out AJson: TJSONObject): Boolean;

/// Variante que, adems, devuelve el NombreUsuario ya parseado.
/// Devuelve True si ok=true y el campo existe.
function ExisteUsuarioServerNombre(const AUrl, AToken, AEmail: string; out ANombreUsuario: string;
  out AJson: TJSONObject): Boolean;

/// Enva un mensaje usando EnviarMensaje.php
/// POST (application/json):
/// { "idTipoMensaje":int, "idReceptor":int, "mensaje":string }
/// Respuesta OK: { ok:true, mensaje:"Mensaje enviado correctamente." }
function EnviarMensajeHTTP(const AUrl, AToken: string; AIdReceptor, ATipoMensaje: Integer; const
  AMensaje: string; out AJson: TJSONObject): Boolean;

/// Atajo que slo devuelve True/False (ignora el JSON)
function EnviarMensajeSimple(const AUrl, AToken: string; AIdReceptor, ATipoMensaje: Integer; const
  AMensaje: string): Boolean;

/// Consulta VisorPublicidad.php
/// GET sin cuerpo
/// Respuesta OK: { ok:true, data:[ { descripcion:"...", URI:"..." }, ... ] }

function ConsultarPublicidadActiva(const AUrl, AToken: string; out AJson: TJSONObject): Boolean;

/// Variante que adems devuelve el arreglo JSON de items (no liberar en el llamador).
/// Devuelve True si ok=true y existen campos.
function ConsultarPublicidadActivaDatos(const AUrl, AToken: string; out AItems: TJSONArray; out
  AJson: TJSONObject): Boolean;

/// Devuelve True si ok=true y pudo mapear la lista a un array tipado.
function ConsultarPublicidadActivaTipado(const AUrl, AToken: string; out ALista: TArray<
  TPublicidadItem>; out AJson: TJSONObject): Boolean;

/// Consulta ComprobarModulo.php
/// POST: idComplementos
/// Respuesta OK: { ok:true, activo:boolean, conteo:int, mensaje:string }
function ComprobarModulo(const AUrl, AToken: string; AIdComplementos: Integer; out AJson:
  TJSONObject): Boolean;

/// Variante que devuelve campos ya parseados.
function ComprobarModuloDatos(const AUrl, AToken: string; AIdComplementos: Integer; out AActivo:
  Boolean; out AConteo: Integer; out AMensaje: string; out AJson: TJSONObject): Boolean;

/// Atajo: devuelve slo si est activo (True/False). Lanza excepcin si la API falla.
function ComprobarModuloActivoSimple(const AUrl, AToken: string; AIdComplementos: Integer): Boolean;

/// daIndicesPrecios.php (usa UrlIndicesPrecios global)

function ConsultarIndicesPrecios(const AToken: string; out AJson: TJSONObject): Boolean;

function ConsultarIndicesPreciosDatos(const AToken: string; out AItems: TJSONArray; out AJson:
  TJSONObject): Boolean;

function ConsultarIndicesPreciosTipado(const AToken: string; out ALista: TArray<TIndicePrecioItem>;
  out AJson: TJSONObject): Boolean;

/// --- daIndicesValor.php ---
function ConsultarIndicesValor(const AToken: string; out AJson: TJSONObject): Boolean;

function ConsultarIndicesValorDatos(const AToken: string; out AItems: TJSONArray; out AJson:
  TJSONObject): Boolean;

function ConsultarIndicesValorTipado(const AToken: string; out ALista: TArray<TIndiceValorItem>; out
  AJson: TJSONObject): Boolean;

/// Variante con filtros opcionales (codIndice, mesAnio, paginacin)
function ConsultarIndicesValorParams(const AToken: string; ACodIndice: Integer; const AMesAnio:
  string; ALimit, AOffset: Integer; out AJson: TJSONObject): Boolean;

function ConsultarIndicesValorDatosParams(const AToken: string; ACodIndice: Integer; const AMesAnio:
  string; ALimit, AOffset: Integer; out AItems: TJSONArray; out AJson: TJSONObject): Boolean;

function ConsultarIndicesValorTipadoParams(const AToken: string; ACodIndice: Integer; const AMesAnio:
  string; ALimit, AOffset: Integer; out ALista: TArray<TIndiceValorItem>; out AJson: TJSONObject): Boolean;

/// CompruebaUsuarioPorEmail.php (sin auth)
/// POST: email
/// Respuesta OK: { ok:true, exists:boolean, email:string|null }
function CompruebaUsuarioPorEmail(const AEmail: string): Boolean;

/// --- daTokenWP.php ---
/// POST: username, password
/// Respuesta OK: { ok:true, token:"..." }

function ObtenerTokenWP(const AUsername, APassword: string; out AToken: string; out AJson:
  TJSONObject): Boolean;

/// CreaUsuarioNuevo.php (SIN auth)
/// POST JSON:
/// { nombre, apellidos, email, password, fechaAlta?, estado?, tipo?, ciudad?, pais? }
/// Respuesta OK: { ok:true, id:int, email:string, mensaje:string }
{(*}
function CrearUsuarioNuevo( const AUrl,
                                  AToken: string;
                            const ANombre,
                                  AApellidos,
                                  AAlias,
                                  AEmail,
                                  APassword: string;
                            const AIdFiscal,
                                  APais,
                                  ACiudad,
                                  AProvincia,
                                  AProfesion,
                                  ATfno: string;
                            const ANacionalidad,
                                  AEmpresa: string;
                              out IdUsuario: Integer;
                              out Error: string): Boolean;
{*)}
/// Obtiene un producto de WooCommerce (por ID o SKU) desde el plugin WP de GiProy

function ObtenerProductoWP(const AKey: string; out AProducto: TProductoWCInfo; out AMsg: string): Boolean;

function EnsureTrailingSlash(const S: string): string;

function BuildProductoUrl(const AKey: string): string;

/// Construye la URL final para /wp-json/giproy/v1/productos/{slug1,slug2}?per_page=&page=
function BuildListadoProductosUrl(const ACategorySlugs: string; APerPage, APage: Integer): string;

/// Llama al endpoint y devuelve el JSON tal cual (ok, count, productos[], etc.)
function ObtenerListadoProductosJSON(const ACategorySlugs: string; APerPage, APage: Integer; out
  AJson: TJSONObject; out AError: string): Boolean;

/// Llama al endpoint y mapea a array tipado de TProductoCategoriaItem (items = "productos")
function ObtenerListadoProductosTipado(const ACategorySlugs: string; APerPage, APage: Integer; out
  ALista: TArray<TProductoCategoriaItem>; out AError: string): Boolean;

/// Devuelve los parametros almacenado en el servidor
function ObtenerParametroDesdePHP(const Token: string; const ID: Integer; out Param: TParametroValor;
  out ErrorMsg: string): Boolean;

/// Construye la URL para /wp-json/giproy/v1/productos/{slug(s)}?per_page=&page=&starts_with=
function BuildListadoProductosStartsWithUrl(const ACategorySlugs, AStartsWith: string; APerPage,
  APage: Integer): string;

/// Llama al endpoint con filtro starts_with y devuelve productos tipados (como ObtenerListadoProductosTipado)
function ObtenerListadoProductosPorPrefijoTipadoWC(const ACategorySlugs, AStartsWith: string;
  APerPage, APage: Integer; out ALista: TArray<TProductoWCInfo>; out AError: string): Boolean;

/// Comprueba si un idFiscal existe en la base de datos remota.
/// Devuelve True si existe, False si no existe o hay error.
/// </summary>
/// <param name="AIdFiscal">Identificador fiscal a consultar.</param>
/// <param name="AError">Devuelve el mensaje de error si ocurre alguno.</param>
/// <returns>True si el idFiscal existe, False en caso contrario.</returns>
function ExisteIdFiscal(const AIdFiscal: string; out AError: string): Boolean; overload;

/// <summary>
/// Versión simplificada: devuelve True/False y descarta mensaje de error.
/// </summary>
function ExisteIdFiscal(const AIdFiscal: string): Boolean; overload;

/// Llama al servicio daTokenWebServiceRUC.php y devuelve el texto plano del PHP.
/// Devuelve True si pudo obtenerlo (AValor con contenido), False si hubo error (AError con detalle).
function ObtenerTokenWebServiceRUC(out AValor: string; out AError: string): Boolean;

/// Atajo que devuelve directamente el valor (o cadena vacía si hubo error).
function ObtenerTokenWebServiceRUCStr: string;

/// Llama a ConsultarRuc.php con RUC y token y devuelve los datos del contribuyente.
/// Devuelve True si ok=true en el JSON y se han mapeado los datos, False si hay error.
function ConsultarRuc(const ARuc, AToken: string; out AInfo: TRucInfo; out AError: string): Boolean; overload;

/// Versión simplificada: ignora el mensaje de error, sólo True/False.
function ConsultarRuc(const ARuc, AToken: string; out AInfo: TRucInfo): Boolean; overload;

/// Registra el uso mensual del Plan Exprés para un usuario.
/// POST JSON: { "idUsuario": int }
/// Respuesta OK: { ok:true, FechaUltimoReporteExpress:"YYYY-MM-DD hh:mm:ss" }
function RegistrarUsoReporteExpress(const AUrl, AToken: string; AIdUsuario: Integer; out AFecha:
  TDateTime; out AJson: TJSONObject): Boolean;

implementation

{ EApiException }

uses
  DM1;

constructor EApiException.Create(const Msg: string; AStatusCode: Integer);
begin
  inherited Create(Msg);
  FStatusCode := AStatusCode;
end;

function BuildProductoUrl(const AKey: string): string;
begin
  Result := EnsureTrailingSlash(UrlWP_ProductoInfo) + TNetEncoding.URL.Encode(AKey);
end;

function EnsureTrailingSlash(const S: string): string;
begin
  if (S <> '') and (S[High(S)] <> '/') then
    Result := S + '/'
  else
    Result := S;
end;

function RegistrarEventoUsuario(const AUrl, AToken: string; AIdUsuario, ATipo: Integer; out AJson:
  TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AIdUsuario <= 0 then
    raise EArgumentException.Create('AIdUsuario debe ser > 0');
  if (ATipo <> 1) and (ATipo <> 2) then
    raise EArgumentException.Create('ATipo debe ser 1 (login) o 2 (logout)');

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

    Body := Format('idUsuario=%d&tipo=%d', [AIdUsuario, ATipo]);

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(AUrl, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

    AJson := TJSONObject(JsonValue.Clone as TJSONObject);
    JsonValue.Free;

    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('message',
        'Error')]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('message',
        'Error'), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function RegistrarLoginUsuario(const AUrl, AToken: string; AIdUsuario: Integer; out AJson:
  TJSONObject): Boolean;
begin
  Result := RegistrarEventoUsuario(AUrl, AToken, AIdUsuario, 1, AJson);
end;

function RegistrarLogoutUsuario(const AUrl, AToken: string; AIdUsuario: Integer; out AJson:
  TJSONObject): Boolean;
begin
  Result := RegistrarEventoUsuario(AUrl, AToken, AIdUsuario, 2, AJson);
end;

function DarFechaCaducidadProducto(const AUrl, AToken: string; AIdUsuario, AIdProducto: Integer; out
  AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AIdUsuario <= 0 then
    raise EArgumentException.Create('AIdUsuario debe ser > 0');
  if AIdProducto <= 0 then
    raise EArgumentException.Create('AIdProducto debe ser > 0');

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

    Body := Format('idUsuario=%d&idProducto=%d', [AIdUsuario, AIdProducto]);

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(AUrl, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

                // Clonar para que el llamador sea dueo de AJson
    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('message',
        'Error')]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('message',
        'Error'), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function DarFechaCaducidadProductoFecha(const AUrl, AToken: string; AIdUsuario, AIdProducto: Integer;
  out AFechaCaducidad: TDateTime; out AJson: TJSONObject): Boolean;
var
  LFechaStr: string;
begin
  AFechaCaducidad := 0;
  Result := DarFechaCaducidadProducto(AUrl, AToken, AIdUsuario, AIdProducto, AJson);
  if not Result then
    Exit(False);
  LFechaStr := '';
  if Assigned(AJson) then
  begin
    if AJson.TryGetValue<string>('FechaHoraCaducidad', LFechaStr) then
      LFechaStr := Trim(LFechaStr);
  end;

  if LFechaStr = '' then
    Exit(False);

  if not TryParseFechaPHP(LFechaStr, AFechaCaducidad) then
    Exit(False);

  Result := True;
end;

function EnviarComunicacion(const AUrl, AToken: string; AIdEmisor, AIdReceptor, ATipoMensaje:
  Integer; const AMensaje, AFechaHoraEnvio, AAdicional: string; out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
  FechaStr: string;
  MsgEnc, AddEnc: string;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AIdEmisor <= 0 then
    raise EArgumentException.Create('AIdEmisor debe ser > 0');
  if AIdReceptor <= 0 then
    raise EArgumentException.Create('AIdReceptor debe ser > 0');
  if ATipoMensaje <= 0 then
    raise EArgumentException.Create('ATipoMensaje debe ser > 0');
  if AMensaje.Trim.IsEmpty then
    raise EArgumentException.Create('AMensaje no puede estar vaco');

        // Normaliza fecha
  if AFechaHoraEnvio.IsEmpty then
    FechaStr := FormatDateTime('yyyy"-"mm"-"dd hh":"nn":"ss', Now)
  else
    FechaStr := AFechaHoraEnvio;

        // URL-encode de campos string
  MsgEnc := TNetEncoding.URL.EncodeForm(AMensaje);
  AddEnc := TNetEncoding.URL.EncodeForm(AAdicional);

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

    Body := 'idEmisor=' + AIdEmisor.ToString + '&idReceptor=' + AIdReceptor.ToString +
      '&tipoMensaje=' + ATipoMensaje.ToString + '&Mensaje=' + MsgEnc + '&fechaHoraEnvio=' +
      TNetEncoding.URL.EncodeForm(FechaStr) + '&adicional=' + AddEnc;

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(AUrl, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

                // Manejo de errores HTTP y ok=false tolerante a 'error' o 'message'
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', 'Error'))]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', 'Error')), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function EnviarComunicacionAhora(const AUrl, AToken: string; AIdEmisor, AIdReceptor, ATipoMensaje:
  Integer; const AMensaje, AAdicional: string; out AJson: TJSONObject): Boolean;
begin
  Result := EnviarComunicacion(AUrl, AToken, AIdEmisor, AIdReceptor, ATipoMensaje, AMensaje,
    FormatDateTime('yyyy"-"mm"-"dd hh":"nn":"ss', Now), AAdicional, AJson);
end;

function ConsultarEstadoSuscripcion(const AToken: string; AIdUsuario: Integer; AIdComplementos:
  Integer; out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if UrlConsultaProducto.Trim.IsEmpty then
    raise EArgumentException.Create('Constante UrlConsultaProducto no puede estar vaca');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AIdUsuario <= 0 then
    raise EArgumentException.Create('AIdUsuario debe ser > 0');

        // Construccin del cuerpo POST
  Body := 'idUsuario=' + AIdUsuario.ToString;
  if AIdComplementos > 0 then
    Body := Body + '&idComplementos=' + AIdComplementos.ToString;

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

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(UrlConsultaProducto, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

                // Clonar para que el llamador maneje la memoria
    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

                // Validar errores HTTP
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', 'Error'))]), Resp.StatusCode);

                // Verificar campo ok
    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', 'Error')), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function ConsultarMigracionDisponible(const AUrl, AToken: string; AIdEmisor: Integer; out AJson:
  TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AIdEmisor <= 0 then
    raise EArgumentException.Create('AIdEmisor debe ser > 0');

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

    Body := 'idEmisor=' + AIdEmisor.ToString;

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(AUrl, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

                // Clonar para que el llamador administre la memoria
    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

                // Manejo de errores HTTP (tolerante a 'error' o 'message')
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', 'Error'))]), Resp.StatusCode);

                // ok=false desde el backend tambin se trata como error (coherencia con resto del PAS)
    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error'))), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function ConsultarMigracionDisponibleDatos(const AUrl, AToken: string; AIdEmisor: Integer; out
  AFechaHora: TDateTime; out AMensaje, AAdicional: string; out AJson: TJSONObject): Boolean;
var
  LFechaStr: string;
begin
  AFechaHora := 0;
  AMensaje := '';
  AAdicional := '';
  Result := ConsultarMigracionDisponible(AUrl, AToken, AIdEmisor, AJson);
  if not Result then
    Exit(False);

        // Extraer campos esperados del JSON
  if Assigned(AJson) then
  begin
    AJson.TryGetValue<string>('fechaHoraEnvio', LFechaStr);
    AJson.TryGetValue<string>('Mensaje', AMensaje);
    AJson.TryGetValue<string>('adicional', AAdicional);
  end;

  LFechaStr := Trim(LFechaStr);
  if LFechaStr = '' then
    Exit(False);

        // Reutiliza tu helper existente para fechas PHP/ISO
  if not TryParseFechaPHP(LFechaStr, AFechaHora) then
    Exit(False);

  Result := True;
end;

function ObtenerComplementosSinUsar(const AUrl, AToken: string; AIdUsuario, AIdComplemento: Integer;
  out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AIdUsuario <= 0 then
    raise EArgumentException.Create('AIdUsuario debe ser > 0');
  if AIdComplemento <= 0 then
    raise EArgumentException.Create('AIdComplemento debe ser > 0');

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

    Body := 'idUsuario=' + AIdUsuario.ToString + '&idComplemento=' + AIdComplemento.ToString;

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(AUrl, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

                // Clonar para que el llamador administre la memoria
    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

                // Manejo de errores HTTP (tolerante con 'error'/'message'/'msg')
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error')))]), Resp.StatusCode);

                // ok=false => tratar como error (coherente con el resto del unit)
    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error'))), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function ObtenerComplementosSinUsarDatos(const AUrl, AToken: string; AIdUsuario, AIdComplemento:
  Integer; out ACantidadRestante, ATotalComprado, ATotalUsado: Integer; out AJson: TJSONObject): Boolean;
begin
  ACantidadRestante := 0;
  ATotalComprado := 0;
  ATotalUsado := 0;

  Result := ObtenerComplementosSinUsar(AUrl, AToken, AIdUsuario, AIdComplemento, AJson);
  if not Result then
    Exit(False);

  if Assigned(AJson) then
  begin
    ACantidadRestante := AJson.GetValue<Integer>('cantidad_restante', 0);
    ATotalComprado := AJson.GetValue<Integer>('total_comprado', 0);
    ATotalUsado := AJson.GetValue<Integer>('total_usado', 0);
  end;

  Result := True;
end;

function UtilizarComplemento(const AToken: string; AIdUsuario, AIdComplemento: Integer; out AJson:
  TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if UrlUtilizarComplemento.Trim.IsEmpty then
    raise EArgumentException.Create('UrlUtilizarComplemento no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AIdUsuario <= 0 then
    raise EArgumentException.Create('AIdUsuario debe ser > 0');
  if AIdComplemento <= 0 then
    raise EArgumentException.Create('AIdComplemento debe ser > 0');

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

    Body := 'idUsuario=' + AIdUsuario.ToString + '&idComplemento=' + AIdComplemento.ToString;

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(UrlUtilizarComplemento, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error')))]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error'))), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function UtilizarComplementoDatos(const AToken: string; AIdUsuario, AIdComplemento: Integer; out
  ACodigoUso: string; out ARestantes: Integer; out AJson: TJSONObject): Boolean;
begin
  ACodigoUso := '';
  ARestantes := 0;

        // Llamada correcta: UtilizarComplemento NO recibe URL (usa UrlUtilizarComplemento)
  Result := UtilizarComplemento(AToken, AIdUsuario, AIdComplemento, AJson);
  if not Result then
    Exit(False);

  if Assigned(AJson) then
  begin
    ACodigoUso := AJson.GetValue<string>('codigoUso', '');
    ARestantes := AJson.GetValue<Integer>('restantes', 0);
  end;

        // La llamada fue correcta aunque codigoUso pueda ser "0"
  Result := True;
end;

function GuardarHardwareID(const AToken: string; AIdUsuario: Integer; const AComputerIDPrincipal,
  AFechaHora: string; out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
  FechaStr, CompEnc: string;
begin
  Result := False;
  AJson := nil;

  if URLGuardaHardwareID.Trim.IsEmpty then
    raise EArgumentException.Create('URLGuardaHardwareID no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AIdUsuario <= 0 then
    raise EArgumentException.Create('AIdUsuario debe ser > 0');
  if AComputerIDPrincipal.Trim.IsEmpty then
    raise EArgumentException.Create('AComputerIDPrincipal no puede estar vaco');

        // Normaliza/usa fecha
  if AFechaHora.Trim.IsEmpty then
    FechaStr := FormatDateTime('yyyy"-"mm"-"dd hh":"nn":"ss', Now)
  else
    FechaStr := AFechaHora.Trim;

        // URL-encode por si el ID tiene guiones, barras, etc.
  CompEnc := TNetEncoding.URL.EncodeForm(AComputerIDPrincipal);

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

    Body := 'idUsuario=' + AIdUsuario.ToString + '&ComputerIDPrincipal=' + CompEnc +
      '&fechahoraIDPrincipal=' + TNetEncoding.URL.EncodeForm(FechaStr);

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(URLGuardaHardwareID, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

                // Clonar para que el llamador administre la memoria
    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

                // Manejo de errores HTTP y backend (tolerante a 'error' / 'message' / 'msg')
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error')))]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error'))), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function GuardarHardwareIDAhora(const AToken: string; AIdUsuario: Integer; const
  AComputerIDPrincipal: string; out AJson: TJSONObject): Boolean;
begin
  Result := GuardarHardwareID(AToken, AIdUsuario, AComputerIDPrincipal, FormatDateTime('yyyy"-"mm"-"dd hh":"nn":"ss',
    Now), AJson);
end;

function ConsultarBackupDisponible(const AUrl, AToken: string; AIdUsuario: Integer; out AJson:
  TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
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

    Body := 'idUsuario=' + AIdUsuario.ToString;

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(AUrl, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

                // Clonar para que el llamador administre la memoria
    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

                // Manejo de errores HTTP y de backend (tolerante a 'error'/'message'/'msg')
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error')))]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error'))), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function ConsultarBackupDisponibleDatos(const AUrl, AToken: string; AIdUsuario: Integer; out
  AFechaHora: TDateTime; out AMensaje, AAdicional: string; out AJson: TJSONObject): Boolean;
var
  LRes: TJSONObject;
  LFechaStr: string;
  JV: TJSONValue;
begin
  AFechaHora := 0;
  AMensaje := '';
  AAdicional := '';
  Result := ConsultarBackupDisponible(AUrl, AToken, AIdUsuario, AJson);
  if not Result then
    Exit(False);

        // La API devuelve los datos dentro de "result": { Mensaje, adicional, fechaHoraEnvio }
  LRes := nil;
  if Assigned(AJson) then
  begin
    JV := AJson.Values['result'];
    if (JV <> nil) and (JV is TJSONObject) then
      LRes := TJSONObject(JV);
  end;

        // Fallback: por si el backend algn da deja los campos en raz (coherente con otras funciones)
  if LRes = nil then
    LRes := AJson;

  if LRes <> nil then
  begin
    AMensaje := LRes.GetValue<string>('Mensaje', '');
    AAdicional := LRes.GetValue<string>('adicional', '');
    LFechaStr := Trim(LRes.GetValue<string>('fechaHoraEnvio', ''));
  end
  else
    Exit(False);

  if LFechaStr = '' then
    Exit(False);

        // Reutiliza tu helper existente para fechas PHP/ISO
  if not TryParseFechaPHP(LFechaStr, AFechaHora) then
    Exit(False);

  Result := True;
end;

function ActualizarEstadoMigracion(const AUrl, AToken: string; AIdUsuario: Integer; const
  AComputerIDMudanza, AFechaHora: string; out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  RespText, FechaStr: string;
  JsonValue, Root: TJSONValue;
  Stream: TStringStream;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AIdUsuario <= 0 then
    raise EArgumentException.Create('AIdUsuario debe ser > 0');
  if AComputerIDMudanza.Trim.IsEmpty then
    raise EArgumentException.Create('AComputerIDMudanza no puede estar vaco');

        // Normaliza/usa fecha
  if AFechaHora.Trim.IsEmpty then
    FechaStr := FormatDateTime('yyyy"-"mm"-"dd hh":"nn":"ss', Now)
  else
    FechaStr := AFechaHora.Trim;

        // Cuerpo JSON que requiere ActualizaEstadoMigracion.php
  Root := TJSONObject.Create;
  try
    TJSONObject(Root).AddPair('idUsuario', TJSONNumber.Create(AIdUsuario));
    TJSONObject(Root).AddPair('computerIDMudanza', AComputerIDMudanza);
    TJSONObject(Root).AddPair('fechaHoraIDMudanza', FechaStr);

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
      Headers[1].Value := 'application/json; charset=utf-8';

      Stream := TStringStream.Create(TJSONObject(Root).ToJSON, TEncoding.UTF8);
      try
        Resp := Client.Post(AUrl, Stream, nil, Headers);
      finally
        Stream.Free;
      end;

      RespText := Resp.ContentAsString(TEncoding.UTF8);
      JsonValue := TJSONObject.ParseJSONValue(RespText);
      if (JsonValue = nil) or not (JsonValue is TJSONObject) then
        raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

                        // Clonar para que el llamador administre la memoria
      AJson := TJSONObject((JsonValue as TJSONObject).Clone);
      JsonValue.Free;

                        // Manejo de errores HTTP y backend (tolerante a 'error'/'message'/'msg')
      if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
        raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
          AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error')))]), Resp.StatusCode);

      Result := AJson.GetValue<Boolean>('ok', False);
      if not Result then
        raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
          AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error'))), Resp.StatusCode);

    finally
      Client.Free;
    end;
  finally
    Root.Free;
  end;
end;

function ActualizarEstadoMigracionAhora(const AUrl, AToken: string; AIdUsuario: Integer; const
  AComputerIDMudanza: string; out ARowsAffected: Integer; out AJson: TJSONObject): Boolean;
begin
  ARowsAffected := 0;
  Result := ActualizarEstadoMigracion(AUrl, AToken, AIdUsuario, AComputerIDMudanza, FormatDateTime('yyyy"-"mm"-"dd hh":"nn":"ss',
    Now), AJson);
  if not Result then
    Exit(False);

  if Assigned(AJson) then
    ARowsAffected := AJson.GetValue<Integer>('rows_affected', 0);

  Result := True;
end;

function RecibirComunicaciones(const AUrl, AToken: string; AUltimoID: Integer; ALimit: Integer; out
  AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if ALimit <= 0 then
    ALimit := 200;

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

                // El backend acepta GET/POST; aqu enviamos como x-www-form-urlencoded para uniformidad
    Body := 'ultimoID=' + AUltimoID.ToString + '&limit=' + ALimit.ToString;

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(AUrl, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

                // Clonar para que el llamador administre la memoria
    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

                // Manejo de errores HTTP (tolerante a 'error'/'message'/'msg')
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error')))]), Resp.StatusCode);

                // ok=false => tratar como error, coherente con el resto del unit
    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error'))), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function RecibirComunicacionesDatos(const AUrl, AToken: string; AUltimoID, ALimit: Integer; out
  ADesdeID, ACount: Integer; out AItems: TJSONArray; out AJson: TJSONObject): Boolean;
var
  JV: TJSONValue;
begin
  ADesdeID := 0;
  ACount := 0;
  AItems := nil;

  Result := RecibirComunicaciones(AUrl, AToken, AUltimoID, ALimit, AJson);
  if not Result then
    Exit(False);

  if not Assigned(AJson) then
    Exit(False);

  ADesdeID := AJson.GetValue<Integer>('desdeID', 0);
  ACount := AJson.GetValue<Integer>('count', 0);

  JV := AJson.Values['items'];
  if (JV <> nil) and (JV is TJSONArray) then
    AItems := TJSONArray(JV)
                // Nota: devuelto como referencia; no liberar en el llamador
  else
    AItems := nil;

  Result := True;
end;

function ActualizarEstadoComunicacion(const AUrl, AToken: string; AIdComunicacion: Int64; const
  AFechaHoraRecepcion: string; out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText, FechaStr: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AIdComunicacion <= 0 then
    raise EArgumentException.Create('AIdComunicacion debe ser > 0');

        // Normaliza/usa fecha
  if AFechaHoraRecepcion.Trim.IsEmpty then
    FechaStr := FormatDateTime('yyyy"-"mm"-"dd hh":"nn":"ss', Now)
  else
    FechaStr := AFechaHoraRecepcion.Trim;

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

    Body := 'idComunicacion=' + AIdComunicacion.ToString + '&fechaHoraRecepcion=' + TNetEncoding.URL.EncodeForm
      (FechaStr);

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(AUrl, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

                // Manejo de errores HTTP y backend
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error')))]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error'))), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function ActualizarEstadoComunicacionAhora(const AUrl, AToken: string; AIdComunicacion: Int64; out
  AJson: TJSONObject): Boolean;
begin
  Result := ActualizarEstadoComunicacion(AUrl, AToken, AIdComunicacion, FormatDateTime('yyyy"-"mm"-"dd hh":"nn":"ss',
    Now), AJson);
end;

function ActualizarEstadoComunicacionDatos(const AUrl, AToken: string; AIdComunicacion: Int64; const
  AFechaHoraRecepcion: string; out AIdEcho: Int64; out AFechaRecepcion: TDateTime; out AJson:
  TJSONObject): Boolean;
var
  FechaStr: string;
begin
  AIdEcho := 0;
  AFechaRecepcion := 0;
  Result := ActualizarEstadoComunicacion(AUrl, AToken, AIdComunicacion, AFechaHoraRecepcion, AJson);
  if not Result then
    Exit(False);

  if Assigned(AJson) then
  begin
    AIdEcho := StrToInt64Def(AJson.GetValue<string>('idComunicacion', '0'), 0);
    FechaStr := Trim(AJson.GetValue<string>('fechaHoraRecepcion', ''));
    if (FechaStr <> '') and (not TryParseFechaPHP(FechaStr, AFechaRecepcion)) then
      AFechaRecepcion := 0; // si no se pudo parsear, queda 0
  end;

  Result := True;
end;

function ExisteUsuarioServer(const AUrl, AToken, AEmail: string; out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
  EmailEnc: string;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AEmail.Trim.IsEmpty then
    raise EArgumentException.Create('AEmail no puede estar vaco');

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

    EmailEnc := TNetEncoding.URL.EncodeForm(AEmail.Trim.ToLower);
    Body := 'email=' + EmailEnc;

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(AUrl, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

                // Clonar para que el llamador administre la memoria
    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

                // Manejo de errores HTTP y backend (tolerante a 'error'/'message'/'msg')
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error')))]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error'))), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function ExisteUsuarioServerNombre(const AUrl, AToken, AEmail: string; out ANombreUsuario: string;
  out AJson: TJSONObject): Boolean;
begin
  ANombreUsuario := '';
  Result := ExisteUsuarioServer(AUrl, AToken, AEmail, AJson);
  if not Result then
    Exit(False);

  if Assigned(AJson) then
    ANombreUsuario := AJson.GetValue<string>('NombreUsuario', '');

        // Si ok=true pero no vino el campo, considera False para coherencia con "Datos"
  Result := (ANombreUsuario <> '');
end;

function EnviarMensajeHTTP(const AUrl, AToken: string; AIdReceptor, ATipoMensaje: Integer; const
  AMensaje: string; out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  RespText: string;
  JsonValue, Root: TJSONValue;
  Stream: TStringStream;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AIdReceptor <= 0 then
    raise EArgumentException.Create('AIdReceptor debe ser > 0');
  if ATipoMensaje <= 0 then
    raise EArgumentException.Create('ATipoMensaje debe ser > 0');
  if AMensaje.Trim.IsEmpty then
    raise EArgumentException.Create('AMensaje no puede estar vaco');

  Root := TJSONObject.Create;
  try
    TJSONObject(Root).AddPair('idReceptor', TJSONNumber.Create(AIdReceptor));
    TJSONObject(Root).AddPair('idTipoMensaje', TJSONNumber.Create(ATipoMensaje));
    TJSONObject(Root).AddPair('mensaje', AMensaje);

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
      Headers[1].Value := 'application/json; charset=utf-8';

      Stream := TStringStream.Create(TJSONObject(Root).ToJSON, TEncoding.UTF8);
      try
        Resp := Client.Post(AUrl, Stream, nil, Headers);
      finally
        Stream.Free;
      end;

      RespText := Resp.ContentAsString(TEncoding.UTF8);
      JsonValue := TJSONObject.ParseJSONValue(RespText);
      if (JsonValue = nil) or not (JsonValue is TJSONObject) then
        raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

                        // Clonar para que el llamador administre la memoria
      AJson := TJSONObject((JsonValue as TJSONObject).Clone);
      JsonValue.Free;

                        // Manejo de errores HTTP y ok=false (tolerante a 'error'/'message'/'msg')
      if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
        raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
          AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error')))]), Resp.StatusCode);

      Result := AJson.GetValue<Boolean>('ok', False);
      if not Result then
        raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
          AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error'))), Resp.StatusCode);

    finally
      Client.Free;
    end;
  finally
    Root.Free;
  end;
end;

function EnviarMensajeSimple(const AUrl, AToken: string; AIdReceptor, ATipoMensaje: Integer; const
  AMensaje: string): Boolean;
var
  J: TJSONObject;
begin
  J := nil;
  try
    Result := EnviarMensajeHTTP(AUrl, AToken, AIdReceptor, ATipoMensaje, AMensaje, J);
  finally
    J.Free;
  end;
end;

function ConsultarPublicidadActiva(const AUrl, AToken: string; out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  RespText: string;
  JsonValue: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');

  Client := TNetHTTPClient.Create(nil);
  try
    Client.ConnectionTimeout := 10000;
    Client.ResponseTimeout := 15000;
    Client.Accept := 'application/json';
    Client.AllowCookies := False;

    SetLength(Headers, 1);
    Headers[0].Name := 'Authorization';
    Headers[0].Value := 'Bearer ' + AToken;

                // El endpoint no necesita cuerpo; usamos GET
    Resp := Client.Get(AUrl, nil, Headers);

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

                // Clonamos para que el llamador sea dueo de AJson
    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

                // Manejo de errores HTTP / backend
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', 'Error'))]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', 'Error')), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function ConsultarPublicidadActivaDatos(const AUrl, AToken: string; out AItems: TJSONArray; out
  AJson: TJSONObject): Boolean;
var
  JV: TJSONValue;
begin
  AItems := nil;
  Result := ConsultarPublicidadActiva(AUrl, AToken, AJson);
  if not Result then
    Exit(False);

  if not Assigned(AJson) then
    Exit(False);

        // Esperamos "data":[ ... ]
  JV := AJson.Values['data'];
  if (JV <> nil) and (JV is TJSONArray) then
    AItems := TJSONArray(JV)
                // referencia; no liberar en el llamador
  else
    AItems := nil;

  Result := (AItems <> nil);
end;

function ConsultarPublicidadActivaTipado(const AUrl, AToken: string; out ALista: TArray<
  TPublicidadItem>; out AJson: TJSONObject): Boolean;
var
  Items: TJSONArray;
  I: Integer;
  Itm: TJSONObject;
  X: TPublicidadItem;
  JV: TJSONValue;
begin
  ALista := nil;
  Result := ConsultarPublicidadActivaDatos(AUrl, AToken, Items, AJson);
  if not Result or (Items = nil) then
    Exit(False);

  SetLength(ALista, Items.Count);
  for I := 0 to Items.Count - 1 do
  begin
    JV := Items.Items[I];
    if (JV <> nil) and (JV is TJSONObject) then
    begin
      Itm := TJSONObject(JV);
      X.Descripcion := Itm.GetValue<string>('descripcion', '');
      X.URI := Itm.GetValue<string>('URI', '');
    end
    else
    begin
      X.Descripcion := '';
      X.URI := '';
    end;
    ALista[I] := X;
  end;

  Result := True;
end;

function ComprobarModulo(const AUrl, AToken: string; AIdComplementos: Integer; out AJson:
  TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');
  if AIdComplementos <= 0 then
    raise EArgumentException.Create('AIdComplementos debe ser > 0');

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

    Body := 'idComplementos=' + AIdComplementos.ToString;

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      Resp := Client.Post(AUrl, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

    AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    JsonValue.Free;

                // Manejo de errores HTTP / backend (tolerante a 'error'/'message'/'msg')
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error')))]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error'))), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function ComprobarModuloDatos(const AUrl, AToken: string; AIdComplementos: Integer; out AActivo:
  Boolean; out AConteo: Integer; out AMensaje: string; out AJson: TJSONObject): Boolean;
begin
  AActivo := False;
  AConteo := 0;
  AMensaje := '';

  Result := ComprobarModulo(AUrl, AToken, AIdComplementos, AJson);
  if not Result then
    Exit(False);

  if Assigned(AJson) then
  begin
    AActivo := AJson.GetValue<Boolean>('activo', False);
    AConteo := AJson.GetValue<Integer>('conteo', 0);
    AMensaje := AJson.GetValue<string>('mensaje', '');
  end;

  Result := True;
end;

function ComprobarModuloActivoSimple(const AUrl, AToken: string; AIdComplementos: Integer): Boolean;
var
  J: TJSONObject;
  Activo: Boolean;
  Conteo: Integer;
  Msg: string;
begin
  J := nil;
  try
    if not ComprobarModuloDatos(AUrl, AToken, AIdComplementos, Activo, Conteo, Msg, J) then
      Exit(False);
    Result := Activo;
  finally
    J.Free;
  end;
end;

function ConsultarIndicesPrecios(const AToken: string; out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  RespText: string;
  JV: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if UrlIndicesPrecios.Trim.IsEmpty then
    raise EArgumentException.Create('UrlIndicesPrecios no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');

  Client := TNetHTTPClient.Create(nil);
  try
    Client.ConnectionTimeout := 10000;
    Client.ResponseTimeout := 15000;
    Client.Accept := 'application/json';
    Client.AllowCookies := False;

    SetLength(Headers, 1);
    Headers[0].Name := 'Authorization';
    Headers[0].Value := 'Bearer ' + AToken;

                // GET simple, sin cuerpo
    Resp := Client.Get(UrlIndicesPrecios, nil, Headers);

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JV := TJSONObject.ParseJSONValue(RespText);
    if (JV = nil) or not (JV is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

    AJson := TJSONObject((JV as TJSONObject).Clone);
    JV.Free;

                // Manejo de errores HTTP y ok=false (tolerante a 'error'/'message')
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', 'Error'))]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', 'Error')), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function ConsultarIndicesPreciosDatos(const AToken: string; out AItems: TJSONArray; out AJson:
  TJSONObject): Boolean;
var
  JV: TJSONValue;
begin
  AItems := nil;
  Result := ConsultarIndicesPrecios(AToken, AJson);
  if not Result then
    Exit(False);

  JV := AJson.Values['data'];
  if (JV <> nil) and (JV is TJSONArray) then
    AItems := TJSONArray(JV)
  else
    AItems := nil;

  Result := (AItems <> nil);
end;

function ConsultarIndicesPreciosTipado(const AToken: string; out ALista: TArray<TIndicePrecioItem>;
  out AJson: TJSONObject): Boolean;
var
  Arr: TJSONArray;
  I: Integer;
  Itm: TJSONObject;
  JV: TJSONValue;
  R: TIndicePrecioItem;
begin
  ALista := nil;
  Result := ConsultarIndicesPreciosDatos(AToken, Arr, AJson);
  if not Result or (Arr = nil) then
    Exit(False);

  SetLength(ALista, Arr.Count);
  for I := 0 to Arr.Count - 1 do
  begin
    JV := Arr.Items[I];
    if (JV <> nil) and (JV is TJSONObject) then
    begin
      Itm := TJSONObject(JV);
      R.CodIndice := Itm.GetValue<string>('CodIndice', '');
      R.Descripcion := Itm.GetValue<string>('Descripcion', '');
      R.Categoria := Itm.GetValue<string>('categoria', '');
    end
    else
    begin
      R.CodIndice := '';
      R.Descripcion := '';
      R.Categoria := '';
    end;
    ALista[I] := R;
  end;

  Result := True;
end;

function ConsultarIndicesValorParams(const AToken: string; ACodIndice: Integer; const AMesAnio:
  string; ALimit, AOffset: Integer; out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  RespText, URL: string;
  Q: TStringBuilder;
  JV: TJSONValue;
begin
  Result := False;
  AJson := nil;

  if UrlIndicesValor.Trim.IsEmpty then
    raise EArgumentException.Create('UrlIndicesValor no puede estar vaco');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vaco');

        // Construccin de querystring opcional
  Q := TStringBuilder.Create;
  try
                // codIndice
    if ACodIndice > 0 then
    begin
      if Q.Length = 0 then
        Q.Append('?')
      else
        Q.Append('&');
      Q.Append('codIndice=' + ACodIndice.ToString);
    end;

                // mesAnio (formato segn tu BD, se enva literal)
    if not AMesAnio.Trim.IsEmpty then
    begin
      if Q.Length = 0 then
        Q.Append('?')
      else
        Q.Append('&');
      Q.Append('mesAnio=' + System.NetEncoding.TNetEncoding.URL.EncodeForm(AMesAnio.Trim));
    end;

                // limit
    if ALimit > 0 then
    begin
      if Q.Length = 0 then
        Q.Append('?')
      else
        Q.Append('&');
      Q.Append('limit=' + ALimit.ToString);
    end;

                // offset
    if AOffset > 0 then
    begin
      if Q.Length = 0 then
        Q.Append('?')
      else
        Q.Append('&');
      Q.Append('offset=' + AOffset.ToString);
    end;

    URL := UrlIndicesValor + Q.ToString;
  finally
    Q.Free;
  end;

  Client := TNetHTTPClient.Create(nil);
  try
    Client.ConnectionTimeout := 10000;
    Client.ResponseTimeout := 15000;
    Client.Accept := 'application/json';
    Client.AllowCookies := False;

    SetLength(Headers, 1);
    Headers[0].Name := 'Authorization';
    Headers[0].Value := 'Bearer ' + AToken;

                // GET simple
    Resp := Client.Get(URL, nil, Headers);

    RespText := Resp.ContentAsString(TEncoding.UTF8);
    JV := TJSONObject.ParseJSONValue(RespText);
    if (JV = nil) or not (JV is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON vlido', Resp.StatusCode);

    AJson := TJSONObject((JV as TJSONObject).Clone);
    JV.Free;

                // Manejo de errores HTTP y ok=false (tolerante a 'error'/'message')
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', 'Error'))]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      raise EApiException.Create('La API respondi ok=false: ' + AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', 'Error')), Resp.StatusCode);

  finally
    Client.Free;
  end;
end;

function ConsultarIndicesValor(const AToken: string; out AJson: TJSONObject): Boolean;
begin
        // Sin filtros: delega a Params con valores "vacos"
  Result := ConsultarIndicesValorParams(AToken, -1, '', 0, 0, AJson);
end;

function ConsultarIndicesValorDatosParams(const AToken: string; ACodIndice: Integer; const AMesAnio:
  string; ALimit, AOffset: Integer; out AItems: TJSONArray; out AJson: TJSONObject): Boolean;
var
  JV: TJSONValue;
begin
  AItems := nil;
  Result := ConsultarIndicesValorParams(AToken, ACodIndice, AMesAnio, ALimit, AOffset, AJson);
  if not Result then
    Exit(False);

  JV := AJson.Values['data'];
  if (JV <> nil) and (JV is TJSONArray) then
    AItems := TJSONArray(JV)
  else
    AItems := nil;

  Result := (AItems <> nil);
end;

function ConsultarIndicesValorDatos(const AToken: string; out AItems: TJSONArray; out AJson:
  TJSONObject): Boolean;
begin
  Result := ConsultarIndicesValorDatosParams(AToken, -1, '', 0, 0, AItems, AJson);
end;

function ConsultarIndicesValorTipadoParams(const AToken: string; ACodIndice: Integer; const AMesAnio:
  string; ALimit, AOffset: Integer; out ALista: TArray<TIndiceValorItem>; out AJson: TJSONObject): Boolean;
var
  Arr: TJSONArray;
  I: Integer;
  Itm: TJSONObject;
  JV: TJSONValue;
  R: TIndiceValorItem;
begin
  ALista := nil;
  Result := ConsultarIndicesValorDatosParams(AToken, ACodIndice, AMesAnio, ALimit, AOffset, Arr, AJson);
  if not Result or (Arr = nil) then
    Exit(False);

  SetLength(ALista, Arr.Count);
  for I := 0 to Arr.Count - 1 do
  begin
    JV := Arr.Items[I];
    if (JV <> nil) and (JV is TJSONObject) then
    begin
      Itm := TJSONObject(JV);
      R.CodIndice := Itm.GetValue<Integer>('codIndice', 0);
      R.MesAnio := Itm.GetValue<string>('mesAnio', '');
      R.Valor := Itm.GetValue<string>('valor', '');
    end
    else
    begin
      R.CodIndice := 0;
      R.MesAnio := '';
      R.Valor := '';
    end;
    ALista[I] := R;
  end;

  Result := True;
end;

function ConsultarIndicesValorTipado(const AToken: string; out ALista: TArray<TIndiceValorItem>; out
  AJson: TJSONObject): Boolean;
begin
  Result := ConsultarIndicesValorTipadoParams(AToken, -1, '', 0, 0, ALista, AJson);
end;

function CompruebaUsuarioPorEmail(const AEmail: string): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body: TStringStream;
  RespText: string;
  JsonValue: TJSONValue;
  AJson: TJSONObject;
  StrAJson: string;
  Params: string;
begin
  Result := False;
  AJson := nil;

  if AEmail.Trim.IsEmpty then
    raise EArgumentException.Create('AEmail no puede estar vacio');

  Client := TNetHTTPClient.Create(nil);
  try
    Client.ConnectionTimeout := 10000;
    Client.ResponseTimeout := 15000;
    Client.Accept := 'application/json';
    Client.AllowCookies := False;

    // Usar form-urlencoded en lugar de JSON
    Params := 'email=' + TNetEncoding.URL.Encode(AEmail);
    Body := TStringStream.Create(Params, TEncoding.UTF8);

    // Headers para form-urlencoded
    SetLength(Headers, 2);
    Headers[0].Name := 'Content-Type';
    Headers[0].Value := 'application/x-www-form-urlencoded; charset=utf-8';
    Headers[1].Name := 'Content-Length';
    Headers[1].Value := IntToStr(Body.Size);

    try
      Resp := Client.Post(UrlCompruebaUsuarioPorEmail, Body, nil, Headers);

      RespText := Resp.ContentAsString(TEncoding.UTF8);
      // Log para depuración
      // OutputDebugString(PChar('Respuesta PHP: ' + RespText));

      JsonValue := TJSONObject.ParseJSONValue(RespText);
      if (JsonValue = nil) or not (JsonValue is TJSONObject) then
        raise EApiException.Create('Respuesta no es JSON válido: ' + RespText, Resp.StatusCode);

      AJson := TJSONObject((JsonValue as TJSONObject).Clone);
    finally
      JsonValue.Free;
      Body.Free;
    end;

    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(
        Format('HTTP %d: %s', [
          Resp.StatusCode,
          AJson.GetValue<string>('error',
            AJson.GetValue<string>('message',
              AJson.GetValue<string>('msg', 'Error')))
        ]),
        Resp.StatusCode
      );

    if not AJson.GetValue<Boolean>('ok', False) then
      raise EApiException.Create('La API respondió ok=false: ' +
        AJson.GetValue<string>('error',
          AJson.GetValue<string>('message',
            AJson.GetValue<string>('msg', 'Error'))),
        Resp.StatusCode
      );

    // El resultado es si existe o no
    Result := AJson.GetValue<Boolean>('exists', False);

  finally
    Client.Free;
    if Assigned(AJson) then
      AJson.Free;
  end;
end;

{(*}
function CrearUsuarioNuevo(const AUrl,
                                 AToken: string;
                           const ANombre,
                                 AApellidos,
                                 AAlias,
                                 AEmail,
                                 APassword: string;
                           const AIdFiscal,
                                 APais,
                                 ACiudad,
                                 AProvincia,
                                 AProfesion,
                                 ATfno: string;
                           const ANacionalidad,
                                 AEmpresa: string;
                           out IdUsuario: Integer;
                           out Error: string): Boolean;
{*)}
var
  HTTP: TNetHTTPClient;
  Resp: IHTTPResponse;
  Root: TJSONObject;
  Body: TStringStream;
  RespObj: TJSONObject;
  Headers: TNetHeaders;
  utcOffsetMin: Integer;

  function FinalUrl: string;
  begin
    if AUrl.Trim <> '' then
      Result := AUrl
    else
      Result := UrlCreaUsuarioNuevo;
  end;

begin
  Result := False;
  Error := '';
  IdUsuario := 0;

  HTTP := TNetHTTPClient.Create(nil);
  try
    Root := TJSONObject.Create;
    try
      { ====================== CAMPOS REQUERIDOS ====================== }

      // Token requerido
      Root.AddPair('token', AToken);

      // Datos personales requeridos
      Root.AddPair('nombre', ANombre);
      Root.AddPair('apellidos', AApellidos);

      // Acceso requerido
      Root.AddPair('email', AEmail.Trim.ToLower);
      Root.AddPair('password', APassword);

      // Identificación fiscal requerida
      Root.AddPair('idfiscal', AIdFiscal);

      // Datos de localización requeridos
      Root.AddPair('pais', APais);
      Root.AddPair('ciudad', ACiudad);
      Root.AddPair('provincia', AProvincia);

      // Datos profesionales requeridos
      Root.AddPair('profesion', AProfesion);

      // Contacto requerido
      Root.AddPair('Tfno', ATfno);

      // Nacionalidad requerida
      Root.AddPair('Nacionalidad', ANacionalidad);

      // ID de equipo principal requerido (computerIDPrincipal)
      Root.AddPair('computerIDPrincipal', HardwareKey);

      { ====================== CAMPOS OPCIONALES ====================== }

      // Alias opcional
      if AAlias.Trim <> '' then
        Root.AddPair('alias', AAlias)
      else
        Root.AddPair('alias', TJSONNull.Create); // opcional, el PHP lo trata como vacío

      // Empresa opcional
      if AEmpresa.Trim <> '' then
        Root.AddPair('Empresa', AEmpresa);
      // si está vacío, simplemente no se envía y el PHP lo deja en NULL

      { ====================== PISTAS DE ZONA HORARIA (OPCIONAL) ====================== }

      // utcOffsetMinutes opcional (ayuda al PHP a calcular la zona horaria)
      utcOffsetMin := -MinutesBetween(Now, TTimeZone.local.ToUniversalTime(Now));
      Root.AddPair('utcOffsetMinutes', TJSONNumber.Create(utcOffsetMin));

      { ====================== ENVÍO HTTP ====================== }

      Body := TStringStream.Create(Root.ToJSON, TEncoding.UTF8);
    finally
      Root.Free;
    end;

    SetLength(Headers, 2);
    Headers[0].Name := 'Accept';
    Headers[0].Value := 'application/json';
    Headers[1].Name := 'Content-Type';
    Headers[1].Value := 'application/json; charset=utf-8';

    Resp := HTTP.Post(FinalUrl, Body, nil, Headers);

    if Resp = nil then
    begin
      Error := 'Sin respuesta del servidor.';
      Exit;
    end;

    RespObj := TJSONObject.ParseJSONValue(Resp.ContentAsString(TEncoding.UTF8)) as TJSONObject;
    try
      if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      begin
        Error := RespObj.GetValue<string>('error', Resp.StatusText);
        Exit;
      end;

      if not RespObj.GetValue<Boolean>('ok', False) then
      begin
        Error := RespObj.GetValue<string>('error', 'Error desconocido');
        Exit;
      end;

      IdUsuario := RespObj.GetValue<Integer>('idUsuario', 0);
      Result := True;
    finally
      RespObj.Free;
    end;
  finally
    HTTP.Free;
  end;
end;

function ObtenerTokenWP(const AUsername, APassword: string; out AToken: string; out AJson:
  TJSONObject): Boolean;
var
  HTTP: TNetHTTPClient;
  Resp: IHTTPResponse;
  Body: TStringStream;
  ReqObj: TJSONObject;
  RespStr: string;
  Parsed: TJSONValue;
  JObj: TJSONObject;
  V: TJSONValue;
begin
  Result := False;
  AToken := '';
  AJson := nil;

  HTTP := TNetHTTPClient.Create(nil);
  try
    HTTP.ContentType := 'application/json';
    HTTP.Accept := 'application/json';
    HTTP.ConnectionTimeout := 15000;
    HTTP.ResponseTimeout := 30000;
    ReqObj := TJSONObject.Create;
    try
      ReqObj.AddPair('username', AUsername);
      ReqObj.AddPair('password', APassword);
      Body := TStringStream.Create(ReqObj.ToJSON, TEncoding.UTF8);
    finally
      ReqObj.Free;
    end;

    try
      Resp := HTTP.Post(UrlDaTokenWP, Body);
    finally
      Body.Free;
    end;

    if (Resp <> nil) and (Resp.StatusCode >= 200) and (Resp.StatusCode < 300) then
    begin
      RespStr := Resp.ContentAsString(TEncoding.UTF8);
      Parsed := TJSONObject.ParseJSONValue(RespStr);
      if Assigned(Parsed) and (Parsed is TJSONObject) then
      begin

        JObj := TJSONObject(Parsed);
        AJson := JObj;
        V := JObj.GetValue('token');
        if Assigned(V) then
          AToken := V.Value
        else
        begin
          V := JObj.GetValue('data');
          if (V is TJSONObject) then
          begin
            V := TJSONObject(V).GetValue('token');
            if Assigned(V) then
              AToken := V.Value;
          end;
        end;
        Result := AToken <> '';
      end
      else
      begin
        Result := False;
      end;
    end
    else
    begin
      RespStr := '';
      if Resp <> nil then
        RespStr := Resp.ContentAsString(TEncoding.UTF8);

      Parsed := TJSONObject.ParseJSONValue(RespStr);
      if Assigned(Parsed) and (Parsed is TJSONObject) then
      begin
        AJson := TJSONObject(Parsed);
        V := AJson.GetValue('message');
        if Assigned(V) then
          AToken := '';
      end
      else
      begin
        AJson := TJSONObject.Create;
        AJson.AddPair('http_status', TJSONNumber.Create(Resp.StatusCode));
        if Resp <> nil then
          AJson.AddPair('body', Resp.ContentAsString(TEncoding.UTF8));
      end;
      Result := False;
    end;

  except
    on E: Exception do
    begin
      if AJson = nil then
        AJson := TJSONObject.Create;
      AJson.AddPair('exception', E.ClassName);
      AJson.AddPair('message', E.Message);
      Result := False;
    end;
  end;
end;

function ObtenerProductoWP(const AKey: string; out AProducto: TProductoWCInfo; out AMsg: string): Boolean;
var
  HTTP: TNetHTTPClient;
  Resp: IHTTPResponse;
  JsonStr: string;
  URL: string;
  LObj: TJSONObject;
begin
  Result := False;
  FillChar(AProducto, SizeOf(AProducto), 0);
  AMsg := '';

  if Trim(AKey) = '' then
  begin
    AMsg := 'Debe especificar un ID o SKU.';
    Exit(False);
  end;

  URL := BuildProductoUrl(AKey);

  HTTP := TNetHTTPClient.Create(nil);
  try
    HTTP.ConnectionTimeout := 8000;
    HTTP.ResponseTimeout := 10000;
    HTTP.ContentType := 'application/json';
    HTTP.Accept := 'application/json';

    try
      Resp := HTTP.Get(URL);
    except
      on E: Exception do
      begin
        AMsg := 'Error de conexin: ' + E.Message;
        Exit(False);
      end;
    end;

    if not Assigned(Resp) then
    begin
      AMsg := 'Sin respuesta del servidor.';
      Exit(False);
    end;

    JsonStr := Resp.ContentAsString(TEncoding.UTF8);

    if Resp.StatusCode <> 200 then
    begin
      AMsg := Format('Error HTTP %d: %s', [Resp.StatusCode, JsonStr]);
      Exit(False);
    end;

    try
      LObj := TJSONObject.ParseJSONValue(JsonStr) as TJSONObject;
    except
      on E: Exception do
      begin
        AMsg := 'Respuesta JSON invlida: ' + E.Message;
        Exit(False);
      end;
    end;

    if not Assigned(LObj) then
    begin
      AMsg := 'No se pudieron leer los datos del producto.';
      Exit(False);
    end;

    try
      AProducto.ID := LObj.GetValue<Integer>('id');
      AProducto.SKU := LObj.GetValue<string>('sku');
      AProducto.Title := LObj.GetValue<string>('title');
      AProducto.Image := LObj.GetValue<string>('image');
      AProducto.PriceHTML := LObj.GetValue<string>('price_html');
      AProducto.Description := LObj.GetValue<string>('description');
      AProducto.Permalink := LObj.GetValue<string>('permalink');
      AProducto.Currency := LObj.GetValue<string>('currency');
      AProducto.PriceRaw := LObj.GetValue<string>('price_raw');
      AProducto.IsVariation := LObj.GetValue<Boolean>('is_variation');
      Result := True;
    except
      on E: Exception do
      begin
        AMsg := 'Error al mapear los datos: ' + E.Message;
        Exit(False);
      end;
    end;
  finally
    LObj.Free;
    HTTP.Free;
  end;
end;

function BuildListadoProductosUrl(const ACategorySlugs: string; APerPage, APage: Integer): string;

  function EncodeSlugListKeepCommas(const S: string): string;
  var
    L, Part: TStringList;
    I: Integer;
  begin
    L := TStringList.Create;
    try
      L.StrictDelimiter := True;
      L.Delimiter := ',';
      L.DelimitedText := S.Trim.ToLower; // separa por coma
      for I := 0 to L.Count - 1 do
      begin
        Part := TStringList.Create;
        try
                                        // Encode de cada slug individualmente
                                        // (preserva letras, nmeros, '-' y '_' sin problema; evita codificar la coma global)
          L[I] := TNetEncoding.URL.Encode(L[I]);
        finally
          Part.Free;
        end;
      end;
      Result := StringReplace(L.DelimitedText, '%2C', ',', [rfReplaceAll]);
                        // seguridad extra
    finally
      L.Free;
    end;
  end;

var
  Base, Slugs: string;
  Q: TStringBuilder;
begin
  Base := EnsureTrailingSlash(UrlWP_ListadoProductos);
  Slugs := EncodeSlugListKeepCommas(ACategorySlugs);

  Q := TStringBuilder.Create;
  try
    if APerPage > 0 then
      Q.Append(IfThen(Q.Length = 0, '?', '&') + 'per_page=' + APerPage.ToString);
    if APage > 0 then
      Q.Append(IfThen(Q.Length = 0, '?', '&') + 'page=' + APage.ToString);

    Result := Base + Slugs + Q.ToString;
  finally
    Q.Free;
  end;
end;

function ObtenerListadoProductosJSON(const ACategorySlugs: string; APerPage, APage: Integer; out
  AJson: TJSONObject; out AError: string): Boolean;
var
  HTTP: TNetHTTPClient;
  Resp: IHTTPResponse;
  URL, Body: string;
  JV: TJSONValue;
begin
  Result := False;
  AJson := nil;
  AError := '';

  if ACategorySlugs.Trim = '' then
  begin
    AError := 'Debe indicar al menos un slug de categora.';
    Exit(False);
  end;

  URL := BuildListadoProductosUrl(ACategorySlugs, APerPage, APage);

  HTTP := TNetHTTPClient.Create(nil);
  try
    HTTP.ConnectionTimeout := 10000;
    HTTP.ResponseTimeout := 15000;
    HTTP.Accept := 'application/json';
    HTTP.ContentType := 'application/json';

    try
      Resp := HTTP.Get(URL);
    except
      on E: Exception do
      begin
        AError := 'Error de conexin: ' + E.Message;
        Exit(False);
      end;
    end;

    if not Assigned(Resp) then
    begin
      AError := 'Sin respuesta del servidor.';
      Exit(False);
    end;

    Body := Resp.ContentAsString(TEncoding.UTF8);

    JV := TJSONObject.ParseJSONValue(Body);
    if (JV = nil) or not (JV is TJSONObject) then
    begin
      AError := Format('Respuesta no es JSON vlido (HTTP %d).', [Resp.StatusCode]);
      Exit(False);
    end;

    AJson := TJSONObject((JV as TJSONObject).Clone);
    JV.Free;

    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
    begin
      AError := Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('message', 'Error')]);
      Exit(False);
    end;

                // Chequea "ok"
    if not AJson.GetValue<Boolean>('ok', False) then
    begin
      AError := AJson.GetValue<string>('message', AJson.GetValue<string>('error',
        'La API respondi ok=false'));
      Exit(False);
    end;

    Result := True;
  finally
    HTTP.Free;
  end;
end;

function ObtenerListadoProductosTipado(const ACategorySlugs: string; APerPage, APage: Integer; out
  ALista: TArray<TProductoCategoriaItem>; out AError: string): Boolean;
var
  LJson: TJSONObject;
  Items: TJSONArray;
  JV: TJSONValue;
  I: Integer;
  Itm: TJSONObject;
  X: TProductoCategoriaItem;
begin
  ALista := nil;
  AError := '';
  LJson := nil;

        // Ahora pedimos el JSON solo de forma interna
  Result := ObtenerListadoProductosJSON(ACategorySlugs, APerPage, APage, LJson, AError);
  if not Result then
    Exit(False);

  try
                // productos debe ser un array
    JV := LJson.Values['productos'];
    if (JV = nil) or not (JV is TJSONArray) then
    begin
      AError := 'Campo "productos" no encontrado o no es un array.';
      Exit(False);
    end;

    Items := TJSONArray(JV);
    SetLength(ALista, Items.Count);

    for I := 0 to Items.Count - 1 do
    begin
      FillChar(X, SizeOf(X), 0);
      if Items.Items[I] is TJSONObject then
      begin
        Itm := TJSONObject(Items.Items[I]);

        X.ID := Itm.GetValue<Integer>('id', 0);
        X.Nombre := Itm.GetValue<string>('nombre', '');
        X.Descripcion := Itm.GetValue<string>('descripcion', '');
        X.Precio := Itm.GetValue<string>('precio', '');
        X.PrecioHTML := Itm.GetValue<string>('precio_html', '');
        X.Moneda := Itm.GetValue<string>('moneda', '');
        X.SKU := Itm.GetValue<string>('sku', '');
        X.Stock := Itm.GetValue<string>('stock', '');
        X.Slug := Itm.GetValue<string>('slug', '');
        X.Enlace := Itm.GetValue<string>('enlace', '');

                                // imagen { url, base64 }
        var ImgV := Itm.Values['imagen'];
        if (ImgV <> nil) and (ImgV is TJSONObject) then
        begin
          X.ImagenURL := TJSONObject(ImgV).GetValue<string>('url', '');
          X.ImagenBase64 := TJSONObject(ImgV).GetValue<string>('base64', '');
        end;
      end;

      ALista[I] := X;
    end;

    Result := True;
  finally
    LJson.Free; // liberamos el JSON interno
  end;
end;

function ObtenerParametroDesdePHP(const Token: string; const ID: Integer; out Param: TParametroValor;
  out ErrorMsg: string): Boolean;
var
  HTTP: TNetHTTPClient;
  Resp: IHTTPResponse;
  RootObj, DataObj: TJSONObject;
  LValue: TJSONValue;
  URL, Body, Detalle: string;
begin
  Result := False;
  ErrorMsg := '';
  Param.Descripcion := '';
  Param.Valor := '';

  if ID <= 0 then
  begin
    ErrorMsg := 'Id invlido (debe ser > 0).';
    Exit;
  end;

        // <-- Clave! aade el id a la URL
  URL := Format('%s?id=%d', [UrldaParametros, ID]);

  HTTP := TNetHTTPClient.Create(nil);
  try
    HTTP.ConnectionTimeout := 10000;
    HTTP.ResponseTimeout := 20000;
    HTTP.Accept := 'application/json';
    HTTP.CustomHeaders['Authorization'] := 'Bearer ' + Token;

    Resp := HTTP.Get(URL);

    if (Resp = nil) then
    begin
      ErrorMsg := 'Sin respuesta del servidor.';
      Exit;
    end;

    Body := Resp.ContentAsString(TEncoding.UTF8);

    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
    begin
      ErrorMsg := Format('HTTP %d: %s', [Resp.StatusCode, Resp.StatusText]);
                        // Intenta extraer el mensaje JSON del PHP (error/detalle)
      RootObj := TJSONObject.ParseJSONValue(Body) as TJSONObject;
      try
        if RootObj <> nil then
        begin
          if RootObj.TryGetValue<string>('error', ErrorMsg) then
            ;
                                        // ya sobreescribimos ErrorMsg con 'error'
          if RootObj.TryGetValue<string>('detalle', Detalle) then
            ErrorMsg := ErrorMsg + ' | Detalle: ' + Detalle;
        end
        else if Body <> '' then
          ErrorMsg := ErrorMsg + ' | Body: ' + Body;
      finally
        RootObj.Free;
      end;
      Exit;
    end;

                // Parseo JSON ok
    RootObj := TJSONObject.ParseJSONValue(Body) as TJSONObject;
    try
      if RootObj = nil then
      begin
        ErrorMsg := 'Respuesta JSON invlida o vaca.';
        Exit;
      end;

      LValue := RootObj.Values['ok'];
      if (LValue = nil) or (not (LValue is TJSONBool)) or (not TJSONBool(LValue).AsBoolean) then
      begin
        if RootObj.TryGetValue<TJSONValue>('error', LValue) then
          ErrorMsg := LValue.Value
        else
          ErrorMsg := 'Operacin no exitosa (ok=false).';
        Exit;
      end;

      DataObj := RootObj.Values['data'] as TJSONObject;
      if DataObj = nil then
      begin
        ErrorMsg := 'No se encontr la seccin "data" en la respuesta.';
        Exit;
      end;

      if not DataObj.TryGetValue<string>('descripcion', Param.Descripcion) then
      begin
        ErrorMsg := 'Campo "descripcion" no presente en data.';
        Exit;
      end;

      if not DataObj.TryGetValue<string>('valor', Param.Valor) then
      begin
        ErrorMsg := 'Campo "valor" no presente en data.';
        Exit;
      end;

      Result := True;
    finally
      RootObj.Free;
    end;
  except
    on E: Exception do
    begin
      ErrorMsg := 'Excepcin: ' + E.Message;
      Result := False;
    end;
  end;
end;


// === [IMPLEMENTATION] pega esto junto al resto de funciones de WooCommerce ===

function BuildListadoProductosStartsWithUrl(const ACategorySlugs, AStartsWith: string; APerPage,
  APage: Integer): string;
var
  Base, CatPath, QS: string;
begin
  Base := EnsureTrailingSlash(UrlWP_ListadoProductos);
        // ya existe en tu unidad
        // Permite múltiples slugs separados por coma, conservándolas (como ya haces en otras partes)
  CatPath := ACategorySlugs.Trim;
  if CatPath <> '' then
    CatPath := TNetEncoding.URL.Encode(CatPath) + '/';

  QS := '';
  if APerPage > 0 then
    QS := QS + IfThen(QS = '', '?', '&') + 'per_page=' + APerPage.ToString;
  if APage > 0 then
    QS := QS + IfThen(QS = '', '?', '&') + 'page=' + APage.ToString;
  if AStartsWith.Trim <> '' then
    QS := QS + IfThen(QS = '', '?', '&') + 'starts_with=' + TNetEncoding.URL.Encode(AStartsWith.Trim);

  Result := Base + CatPath + QS;
end;

function ObtenerListadoProductosPorPrefijoTipadoWC(const ACategorySlugs, AStartsWith: string;
  APerPage, APage: Integer; out ALista: TArray<TProductoWCInfo>; out AError: string): Boolean;
var
  HTTP: TNetHTTPClient;
  Resp: IHTTPResponse;
  URL, Raw: string;
  Root, Node, Item: TJSONValue;
  Arr: TJSONArray;
  I: Integer;
  Prod: TProductoWCInfo;

  function GetStr(const Obj: TJSONObject; const Name, Default: string): string;
  var
    J: TJSONValue;
  begin
    if not Assigned(Obj) then
      Exit(Default);
    J := Obj.GetValue(Name);
    if not Assigned(J) then
      Exit(Default);
    if J is TJSONString then
      Exit(J.Value);
    Result := J.ToJSON;
                // fallback para números/bools convertidos a texto
  end;

  function GetInt(const Obj: TJSONObject; const Name: string; const Default: Integer): Integer;
  var
    J: TJSONValue;
  begin
    if not Assigned(Obj) then
      Exit(Default);
    J := Obj.GetValue(Name);
    if not Assigned(J) then
      Exit(Default);
    if J is TJSONNumber then
      Exit(TJSONNumber(J).AsInt);
    Result := StrToIntDef(J.Value, Default);
  end;

  function GetBoolLoose(const Obj: TJSONObject; const Name: string; const Default: Boolean): Boolean;
  var
    J: TJSONValue;
    S: string;
  begin
    if not Assigned(Obj) then
      Exit(Default);
    J := Obj.GetValue(Name);
    if not Assigned(J) then
      Exit(Default);
    if J is TJSONBool then
      Exit(TJSONBool(J).AsBoolean);
    S := LowerCase(J.Value);
    if (S = 'true') or (S = '1') then
      Exit(True);
    if (S = 'false') or (S = '0') then
      Exit(False);
    Result := Default;
  end;

  function FirstStr(const Obj: TJSONObject; const Names: array of string): string;
  var
    N, V: string;
  begin
    for N in Names do
    begin
      V := GetStr(Obj, N, '');
      if V <> '' then
        Exit(V);
    end;
    Result := '';
  end;

  function FindProductosArray(const JO: TJSONObject): TJSONArray;
  var
    V: TJSONValue;
    Sub: TJSONObject;
  begin
    V := JO.GetValue('productos');
    if V is TJSONArray then
      Exit(TJSONArray(V));
    V := JO.GetValue('items');
    if V is TJSONArray then
      Exit(TJSONArray(V));
    V := JO.GetValue('products');
    if V is TJSONArray then
      Exit(TJSONArray(V));
    V := JO.GetValue('data');
    if V is TJSONObject then
    begin
      Sub := TJSONObject(V);
      V := Sub.GetValue('products');
      if V is TJSONArray then
        Exit(TJSONArray(V));
      V := Sub.GetValue('productos');
      if V is TJSONArray then
        Exit(TJSONArray(V));
      V := Sub.GetValue('items');
      if V is TJSONArray then
        Exit(TJSONArray(V));
    end;
    Result := nil;
  end;

  procedure MapProductoWC(const JO: TJSONObject; out P: TProductoWCInfo);
  var
    V: TJSONValue;
    JImg: TJSONObject;
  begin
    FillChar(P, SizeOf(P), 0);

                // ID
    P.ID := GetInt(JO, 'id', GetInt(JO, 'ID', 0));

                // Campos de texto principales (del endpoint en es-ES, con fallbacks)
    P.SKU := FirstStr(JO, ['sku', 'SKU']);
    P.Title := FirstStr(JO, ['nombre', 'title', 'name']);
    P.Description := FirstStr(JO, ['descripcion', 'description', 'short_description']);
    P.Permalink := FirstStr(JO, ['enlace', 'permalink', 'link', 'url']);
    P.Currency := FirstStr(JO, ['moneda', 'currency']);

                // Precios
    P.PriceHTML := FirstStr(JO, ['precio_html', 'price_html']);
    P.PriceRaw := FirstStr(JO, ['precio', 'price', 'regular_price', 'sale_price']);

                // ---- IMAGEN ----
    P.Image := '';
    P.ImagenURL := '';

    V := JO.GetValue('imagen');
    if (V is TJSONObject) then
    begin
      JImg := TJSONObject(V);
                        // URL directa de la imagen destacada
      P.ImagenURL := FirstStr(JImg, ['url', 'src']);
                        // Contenido base64 si el endpoint lo incluyó
      P.Image := FirstStr(JImg, ['base64']);
    end;

                // Fallbacks si el endpoint cambiara o no hubiera objeto "imagen"
    if P.ImagenURL = '' then
      P.ImagenURL := FirstStr(JO, ['image', 'image_url', 'img', 'thumbnail']);

                // Si no hay base64, usa la URL también en Image para no dejar el campo vacío
    if P.Image = '' then
      P.Image := P.ImagenURL;

                // Variaciones (no aplican en el endpoint actual, pero dejamos compatibilidad)
    P.IsVariation := GetBoolLoose(JO, 'is_variation', False);
    if not P.IsVariation then
      P.IsVariation := SameText(FirstStr(JO, ['type', 'Type']), 'variation');
  end;

begin
  Result := False;
  SetLength(ALista, 0);
  AError := '';

  URL := BuildListadoProductosStartsWithUrl(ACategorySlugs, AStartsWith, APerPage, APage);

  HTTP := TNetHTTPClient.Create(nil);
  try
    HTTP.ConnectionTimeout := 10000;
    HTTP.ResponseTimeout := 20000;
    HTTP.UserAgent := 'GiProyClient/1.0';
    HTTP.Accept := 'application/json, text/plain, */*';

    Resp := HTTP.Get(URL);
    if Resp = nil then
    begin
      AError := 'Sin respuesta del servidor. URL=' + URL;
      Exit;
    end;

    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
    begin
      AError := Format('HTTP %d: %s. URL=%s', [Resp.StatusCode, Resp.StatusText, URL]);
      Exit;
    end;

    Raw := Resp.ContentAsString(TEncoding.UTF8);
    Root := TJSONObject.ParseJSONValue(Raw);
    try
      if not Assigned(Root) then
      begin
        AError := 'JSON inválido. RAW=' + Copy(Raw, 1, 1000);
        Exit;
      end;

      if not (Root is TJSONObject) then
      begin
        AError := 'Raíz JSON no es objeto. RAW=' + Copy(Raw, 1, 1000);
        Exit;
      end;

      Arr := FindProductosArray(TJSONObject(Root));
      if not Assigned(Arr) then
      begin
        AError := 'No se encontró el array de productos. RAW=' + Copy(Raw, 1, 1000);
        Exit;
      end;

      SetLength(ALista, Arr.Count);
      for I := 0 to Arr.Count - 1 do
      begin
        Item := Arr.Items[I];
        if Item is TJSONObject then
        begin
          MapProductoWC(TJSONObject(Item), Prod);
          ALista[I] := Prod;
        end;
      end;

      Result := True;
    finally
      Root.Free;
    end;

  except
    on E: Exception do
    begin
      AError := 'Excepción: ' + E.Message + ' URL=' + URL;
      Result := False;
    end;
  end;
end;

function ExisteIdFiscal(const AIdFiscal: string; out AError: string): Boolean; overload;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
  Obj: TJSONObject;
  OkVal: Boolean;
begin
  Result := False;
  AError := '';

  if AIdFiscal.Trim.IsEmpty then
  begin
    AError := 'El parámetro idFiscal está vacío.';
    Exit;
  end;

  Client := TNetHTTPClient.Create(nil);
  try
    try
      Client.ConnectionTimeout := 10000;
      Client.ResponseTimeout := 20000;
      Client.Accept := 'application/json';
      Client.AllowCookies := False;

      SetLength(Headers, 2);
      Headers[0].Name := 'Content-Type';
      Headers[0].Value := 'application/json; charset=utf-8';
      Headers[1].Name := 'Accept';
      Headers[1].Value := 'application/json';

      Body := Format('{"idFiscal":"%s"}', [AIdFiscal]);

      Stream := TStringStream.Create(Body, TEncoding.UTF8);
      try
        Resp := Client.Post(UrlCompruebaIdFiscal, Stream, nil, Headers);
      finally
        Stream.Free;
      end;

      if (Resp = nil) then
      begin
        AError := 'Sin respuesta del servidor.';
        Exit;
      end;

      RespText := Resp.ContentAsString(TEncoding.UTF8);

      JsonValue := TJSONObject.ParseJSONValue(RespText);
      try
        if (JsonValue = nil) or not (JsonValue is TJSONObject) then
        begin
          AError := 'Respuesta JSON inválida';
          Exit;
        end;

        Obj := TJSONObject(JsonValue);

        OkVal := Obj.GetValue<Boolean>('ok', False);
        if not OkVal then
        begin
          if Obj.GetValue('error') <> nil then
            AError := Obj.GetValue<string>('error', 'La API respondió ok=false')
          else
            AError := 'La respuesta indica ok=false o no contiene el campo "ok".';
          Exit;
        end;

        if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
        begin
          AError := Format('HTTP %d: %s', [Resp.StatusCode, Obj.GetValue<string>('message', Resp.StatusText)]);
          Exit;
        end;

        Result := Obj.GetValue<Boolean>('found', False);
        if not Result and (not Obj.TryGetValue<Boolean>('found', Result)) then
        begin
          AError := 'Campo "found" no presente o no booleano en la respuesta.';
          Result := False;
        end;

      finally
        JsonValue.Free;
      end;

    except
      on E: Exception do
      begin
        AError := 'Excepción: ' + E.Message;
        Result := False;
      end;
    end;
  finally
    Client.Free;
  end;
end;

function ExisteIdFiscal(const AIdFiscal: string): Boolean; overload;
var
  DummyErr: string;
begin
  Result := ExisteIdFiscal(AIdFiscal, DummyErr);
end;

function ObtenerTokenWebServiceRUC(out AValor: string; out AError: string): Boolean;
var
  HTTP: TNetHTTPClient;
  Resp: IHTTPResponse;
  Body: string;
begin
  Result := False;
  AValor := '';
  AError := '';

  HTTP := TNetHTTPClient.Create(nil);
  try
    HTTP.ConnectionTimeout := 10000;
    HTTP.ResponseTimeout := 20000;
    HTTP.UserAgent := 'GiProyClient/1.0';
    HTTP.Accept := 'text/plain, */*';
    HTTP.AllowCookies := False;

    try
      Resp := HTTP.Get(UrlDaTokenWebServiceRUC);

      if (Resp = nil) then
      begin
        AError := 'Sin respuesta del servidor. URL=' + UrlDaTokenWebServiceRUC;
        Exit(False);
      end;

      if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      begin
        AError := Format('HTTP %d %s', [Resp.StatusCode, Resp.StatusText]);
        Exit(False);
      end;

      Body := Resp.ContentAsString(TEncoding.UTF8).Trim;

      if Body.IsEmpty then
      begin
        AError := 'Respuesta vacía del servicio.';
        Exit(False);
      end;

      AValor := Body;
      Result := True;

    except
      on E: Exception do
      begin
        AError := 'Excepción HTTP: ' + E.Message;
        Exit(False);
      end;
    end;

  finally
    HTTP.Free;
  end;
end;

function ObtenerTokenWebServiceRUCStr: string;
var
  S, Err: string;
begin
  if ObtenerTokenWebServiceRUC(S, Err) then
    Result := S
  else
    Result := ''; // opcional: podrías hacer raise o log del error si lo prefieres
end;

function ConsultarRuc(const ARuc, AToken: string; out AInfo: TRucInfo; out AError: string): Boolean; overload;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText: string;
  Stream: TStringStream;
  JsonValue, DataVal: TJSONValue;
  Obj, DataObj: TJSONObject;
  OkVal: Boolean;
  I: Integer;
  RucClean, TokenClean: string;
begin
  Result := False;
  AError := '';
  FillChar(AInfo, SizeOf(AInfo), 0);

  // -------------------------
  // Validaciones básicas
  // -------------------------
  RucClean := ARuc.Trim;
  TokenClean := AToken.Trim;

  if RucClean = '' then
  begin
    AError := 'El RUC no puede estar vacío.';
    Exit(False);
  end;

  if Length(RucClean) <> 13 then
  begin
    AError := 'El RUC debe tener exactamente 13 dígitos.';
    Exit(False);
  end;

  // Validar que todos sean dígitos
  for I := 1 to Length(RucClean) do
  begin
    if not (RucClean[I] in ['0'..'9']) then
    begin
      AError := 'El RUC debe ser numérico.';
      Exit(False);
    end;
  end;

  if TokenClean = '' then
  begin
    AError := 'El token de autorización no puede estar vacío.';
    Exit(False);
  end;

  // -------------------------
  // Preparar llamada HTTP
  // -------------------------
  Client := TNetHTTPClient.Create(nil);
  try
    Client.ConnectionTimeout := 10000;
    Client.ResponseTimeout := 15000;
    Client.Accept := 'application/json';
    Client.AllowCookies := False;

    SetLength(Headers, 2);
    Headers[0].Name := 'Content-Type';
    Headers[0].Value := 'application/json; charset=utf-8';
    Headers[1].Name := 'Accept';
    Headers[1].Value := 'application/json';

    // JSON requerido por ConsultarRuc.php
    Body := Format('{"ruc":"%s","token":"%s"}', [RucClean, TokenClean]);

    Stream := TStringStream.Create(Body, TEncoding.UTF8);
    try
      // IMPORTANTE: aunque el servidor devuelva 400/404, aquí igualmente tendremos Resp
      Resp := Client.Post(UrlConsultarRuc, Stream, nil, Headers);
    finally
      Stream.Free;
    end;

    if Resp = nil then
    begin
      AError := 'Sin respuesta del servidor.';
      Exit(False);
    end;

    // Leer SIEMPRE el contenido, aunque el StatusCode sea 400 o 500
    RespText := Resp.ContentAsString(TEncoding.UTF8);

    // -------------------------
    // Procesar JSON recibido
    // -------------------------
    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
    begin
      // Si no es JSON válido, mostramos código HTTP + texto crudo
      AError := Format('HTTP %d %s. Respuesta: %s', [Resp.StatusCode, Resp.StatusText, RespText]);
      Exit(False);
    end;

    try
      Obj := TJSONObject(JsonValue);

      if not Obj.TryGetValue<Boolean>('ok', OkVal) then
      begin
        AError := 'El servidor no devolvió el campo "ok".';
        Exit(False);
      end;

      // --------- CASO ERROR LÓGICO DEL SERVIDOR (ok = false) ---------
      if not OkVal then
      begin
        // Leemos el mensaje "error" que envía ConsultarRuc.php
        if Obj.GetValue('error') <> nil then
          AError := Obj.GetValue<string>('error')
        else
          AError := 'Error desconocido devuelto por el servidor.';

        Exit(False);
      end;

      // --------- CASO OK (ok = true) ---------
      DataVal := Obj.GetValue('data');
      if (DataVal = nil) or not (DataVal is TJSONObject) then
      begin
        AError := 'Campo "data" no recibido o incorrecto.';
        Exit(False);
      end;

      DataObj := TJSONObject(DataVal);

      // Mapear datos al record TRucInfo
      AInfo.NumeroRuc := DataObj.GetValue<string>('NUMERO_RUC', '');
      AInfo.RazonSocial := DataObj.GetValue<string>('RAZON_SOCIAL', '');
      AInfo.CodigoJurisdiccion := DataObj.GetValue<string>('CODIGO_JURISDICCION', '');
      AInfo.EstadoContribuyente := DataObj.GetValue<string>('ESTADO_CONTRIBUYENTE', '');
      AInfo.ClaseContribuyente := DataObj.GetValue<string>('CLASE_CONTRIBUYENTE', '');
      AInfo.FechaInicioActividades := DataObj.GetValue<string>('FECHA_INICIO_ACTIVIDADES', '');
      AInfo.FechaActualizacion := DataObj.GetValue<string>('FECHA_ACTUALIZACION', '');
      AInfo.FechaSuspensionDefinitiva := DataObj.GetValue<string>('FECHA_SUSPENSION_DEFINITIVA', '');
      AInfo.FechaReinicioActividades := DataObj.GetValue<string>('FECHA_REINICIO_ACTIVIDADES', '');
      AInfo.Obligado := DataObj.GetValue<string>('OBLIGADO', '');
      AInfo.TipoContribuyente := DataObj.GetValue<string>('TIPO_CONTRIBUYENTE', '');
      AInfo.NumeroEstablecimiento := DataObj.GetValue<Integer>('NUMERO_ESTABLECIMIENTO', 0);
      AInfo.NombreFantasiaComercial := DataObj.GetValue<string>('NOMBRE_FANTASIA_COMERCIAL', '');
      AInfo.EstadoEstablecimiento := DataObj.GetValue<string>('ESTADO_ESTABLECIMIENTO', '');
      AInfo.DescripcionProvinciaEst := DataObj.GetValue<string>('DESCRIPCION_PROVINCIA_EST', '');
      AInfo.DescripcionCantonEst := DataObj.GetValue<string>('DESCRIPCION_CANTON_EST', '');
      AInfo.DescripcionParroquiaEst := DataObj.GetValue<string>('DESCRIPCION_PARROQUIA_EST', '');
      AInfo.CodigoCIIU := DataObj.GetValue<string>('CODIGO_CIIU', '');
      AInfo.ActividadEconomica := DataObj.GetValue<string>('ACTIVIDAD_ECONOMICA', '');
      AInfo.AgenteRetencion := DataObj.GetValue<string>('AGENTE_RETENCION', '');
      AInfo.Especial := DataObj.GetValue<string>('ESPECIAL', '');

      Result := True;
    finally
      JsonValue.Free;
    end;
  except
    on E: Exception do
    begin
      AError := 'Excepción: ' + E.Message;
      Result := False;
    end;
  end;

  Client.Free;
end;

function ConsultarRuc(const ARuc, AToken: string; out AInfo: TRucInfo): Boolean; overload;
var
  Err: string;
begin
  Result := ConsultarRuc(ARuc, AToken, AInfo, Err);
end;

function RegistrarUsoReporteExpress(const AUrl, AToken: string; AIdUsuario: Integer; out AFecha:
  TDateTime; out AJson: TJSONObject): Boolean;
var
  Client: TNetHTTPClient;
  Resp: IHTTPResponse;
  Headers: TNetHeaders;
  Body, RespText, S: string;
  Stream: TStringStream;
  JsonValue: TJSONValue;
  Obj: TJSONObject;
begin
  Result := False;
  AJson := nil;
  AFecha := 0;

  if AUrl.Trim.IsEmpty then
    raise EArgumentException.Create('AUrl no puede estar vacío');
  if AToken.Trim.IsEmpty then
    raise EArgumentException.Create('AToken no puede estar vacío');
  if AIdUsuario <= 0 then
    raise EArgumentException.Create('AIdUsuario no puede ser <= 0');

  Client := TNetHTTPClient.Create(nil);
  Stream := nil;
  try
    Headers := [TNameValuePair.Create('Authorization', 'Bearer ' + AToken), TNameValuePair.Create('Content-Type',
      'application/json; charset=utf-8')];

    Body := Format('{"idUsuario":%d}', [AIdUsuario]);
    Stream := TStringStream.Create(Body, TEncoding.UTF8);

    Resp := Client.Post(AUrl, Stream, nil, Headers);
    RespText := Resp.ContentAsString(TEncoding.UTF8);

    JsonValue := TJSONObject.ParseJSONValue(RespText);
    if (JsonValue = nil) or not (JsonValue is TJSONObject) then
      raise EApiException.Create('Respuesta no es JSON válido', Resp.StatusCode);

    Obj := TJSONObject(JsonValue);
    AJson := TJSONObject(Obj.Clone);
    JsonValue.Free;

    // Comprobamos HTTP y campo ok
    if (Resp.StatusCode < 200) or (Resp.StatusCode >= 300) then
      raise EApiException.Create(Format('HTTP %d: %s', [Resp.StatusCode, AJson.GetValue<string>('error',
        AJson.GetValue<string>('message', AJson.GetValue<string>('msg', 'Error')))]), Resp.StatusCode);

    Result := AJson.GetValue<Boolean>('ok', False);
    if not Result then
      Exit;

    // Intentar leer FechaUltimoReporteExpress
    S := AJson.GetValue<string>('FechaUltimoReporteExpress', '');
    if (S <> '') then
    begin
      if not TryParseFechaPHP(Trim(S), AFecha) then
        AFecha := 0;
    end;
  finally
    Stream.Free;
    if not Result and Assigned(AJson) then
    begin
      // En caso de fallo, puedes decidir liberar AJson o devolverlo
      // Ahora mismo lo devolvemos para depuración.
    end;
  end;
end;

end.

