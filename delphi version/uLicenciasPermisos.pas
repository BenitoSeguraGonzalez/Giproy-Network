unit uLicenciasPermisos;

interface

uses
  System.SysUtils, System.DateUtils, Unit_UsersIni;

type
  // Estado interno del módulo/licencia
  TEstadoModulo = (emDesconocido, emActivo, emCaducado, emNoContratado);

  // Estado de confianza de la hora obtenida
  TEstadoHoraSegura = (ehDesconocida, ehServidor, ehLocalAjustada, ehSospechosa);

  // Tipo de plan según la descripción (TUsuario)
  TTipoPlanLicencia = (tpDesconocido, tpExpress, tpVisor, tpOtro);

  // Tipo de salida de reporte donde vamos a aplicar la regla
  TTipoSalidaReporte = (srPdf, srImpresion, srExcel);

  {
    Información de un módulo / complemento para un usuario concreto.
  }
  TInfoModuloUsuario = record
  private
    function GetSinRestriccion: Boolean;
  public
    IdComplemento: Integer;   // idComplementos (tabla Productos/Complementos)
    Descripcion: string;    // texto descriptivo (opcional)
    TipoProducto: Integer;   // campo TipoProducto de la tabla
    TipoComunicacion: Integer;   // campo TipoComunicacion
    FechaCaducidad: TDateTime; // 0 = sin fecha conocida
    Estado: TEstadoModulo;

    // True cuando TipoProducto = 0 (no se aplican restricciones)
    property SinRestriccion: Boolean read GetSinRestriccion;

    procedure Clear;
    // Devuelve si el módulo debe considerarse activo "ahora"
    function EstaActivoAhora: Boolean;

    /// <summary>
    ///  Determina el tipo de plan a partir del texto de descripción (TUsuario).
    ///  Busca palabras clave como 'Express', 'Exprés' o 'Visor'.
    ///
    ///  Ejemplo de uso:
    ///  var
    ///    T: TTipoPlanLicencia;
    ///  begin
    ///    T := TipoPlanDesdeDescripcion('Plan Exprés');
    ///  end;
    /// </summary>

    function TipoPlanDesdeDescripcion(const ADescripcion: string): TTipoPlanLicencia;

    /// <summary>
    ///  Valida si el usuario puede crear / imprimir / exportar un reporte según el plan.
    ///  - Plan Express: solo 1 reporte al mes (cualquier salida), siempre con marca de agua.
    ///  - Plan Visor: solo visualización, no se permite impresión ni exportación.
    ///  - Otros planes: sin límite ni marca de agua.
    ///
    ///  Devuelve True si se permite la operación; False si está bloqueada.
    ///  AForzarMarcaAgua = True cuando hay que aplicar marca de agua.
    ///  AMensajeError contiene el motivo cuando Result = False.
    ///
    ///  Ejemplo de uso:
    ///  var
    ///    ForzarMw: Boolean;
    ///    Msg: string;
    ///  begin
    ///    if ValidarOperacionReporte(TUsuario, ID_usuario, srPdf, ForzarMw, Msg) then
    ///      // seguir con la exportación
    ///    else
    ///      ShowMessage(Msg);
    ///  end;
    /// </summary>
    function ValidarOperacionReporte(const ADescripcionPlan, AUsuario: string; const ATipoSalida:
      TTipoSalidaReporte; out AForzarMarcaAgua: Boolean; out AMensajeError: string): Boolean;

  end;

  {
    Estructura principal con los datos de licencias de un usuario.
  }
  TInfoLicenciasUsuario = record
  public
    IdUsuario: Integer;           // id del usuario en tu sistema
    PlanPrincipal: Integer;           // idComplementos del plan elegido, si aplica
    ModulosActivos: TArray<TInfoModuloUsuario>;

    procedure Clear;
    // Comprueba si un IdComplemento concreto está activo (o sin restricción)
    function TieneModuloActivo(const AIdComplemento: Integer): Boolean;
  end;

const
  // TipoProducto = 0 => no se aplican restricciones de licencia
  TIPO_PRODUCTO_SIN_RESTRICCION = 0;
  // Regla 1: máximo de horas sin validación online
  MAX_HORAS_SIN_VERIF_LICENCIAS = 72;

type
  {
    Callback para obtener la información de un módulo desde la BD local
    (tabla Productos/Complementos).
  }
  TGetModuloInfoEvent = function(const AIdComplemento: Integer; out ADescripcion: string; out
    ATipoProducto, ATipoComunicacion, AIdProductoWP: Integer): Boolean of object;

  {
    Callback para obtener la hora actual del servidor (por internet).
    Sólo se usa para comprobar coherencia (no para reemplazar la hora local).
  }
  TOnObtenerHoraServidor = function(out AFechaHoraServidor: TDateTime): Boolean of object;

  {
    Callbacks para guardar / leer la última verificación online de licencias.
    Lo normal es que esto se persista en una tabla local o INI.
  }
  TGetUltimaVerifLicencias = function: TDateTime of object;

  TSetUltimaVerifLicencias = procedure(const AValor: TDateTime) of object;

var
  // Asignar desde DM1
  OnGetModuloInfo: TGetModuloInfoEvent = nil;
  OnObtenerHoraServidor: TOnObtenerHoraServidor = nil;
  OnGetUltimaVerifLicencias: TGetUltimaVerifLicencias = nil;
  OnSetUltimaVerifLicencias: TSetUltimaVerifLicencias = nil;

{-----------------------------------------------------------------------------
  Obtiene una "hora segura" basada en la hora LOCAL del sistema.

  - Siempre devuelve Now (hora local).
  - Si hay servidor, se usa sólo para comprobar que el reloj local es coherente.
  - Si el reloj local va hacia atrás o cambia mucho respecto al offset servidor,
    el estado se marca como ehSospechosa.
 -----------------------------------------------------------------------------}
function ObtenerFechaHoraSegura(out AEstado: TEstadoHoraSegura): TDateTime;

{-----------------------------------------------------------------------------
  Regla 1 (parte 1): registrar que se han verificado licencias online en
  el instante AHoraSegura (normalmente la hora segura actual).
  Devuelve False si no hay callback asignado.
 -----------------------------------------------------------------------------}
function RegistrarVerificacionLicenciasOnline(const AHoraSegura: TDateTime): Boolean;

{-----------------------------------------------------------------------------
  Regla 1 (parte 2): comprueba si el sistema puede seguir usando las licencias
  sólo con datos locales.

  - Devuelve False si:
      * han pasado más de MAX_HORAS_SIN_VERIF_LICENCIAS horas desde la última
        verificación online registrada, o
      * el estado de la hora es ehSospechosa (reloj manipulado).
  - AHorasDesdeUltimaVerif: número de horas transcurridas desde la última
    verificación online (0 si nunca se ha verificado).
 -----------------------------------------------------------------------------}
function PuedeUsarSistemaPorLicencias(out AHorasDesdeUltimaVerif: Double; out AEstadoHora:
  TEstadoHoraSegura): Boolean;

{-----------------------------------------------------------------------------
  Carga en ALicencias todos los módulos/licencias de AComplementos para el
  usuario AIdUsuario, evaluando caducidades contra la hora segura.

  Cada vez que se consigue hablar con la API (al menos un producto devuelve
  fecha OK), se registra una nueva verificación online mediante
  RegistrarVerificacionLicenciasOnline.
 -----------------------------------------------------------------------------}
function CargarLicenciasUsuarioPorFecha(const AIdUsuario: Integer; const AToken: string; const
  AComplementos: array of Integer; out ALicencias: TInfoLicenciasUsuario): Boolean;

implementation

uses
  System.JSON, uApiGiProy; // DarFechaCaducidadProductoFecha, UrlDarFechaCaducidadProducto, etc.

var
  GUltimaHoraLocal: TDateTime = 0;
  GUltimoOffsetSrvLocal: Double = 0; // ServerTime - LocalTime

function TInfoModuloUsuario.TipoPlanDesdeDescripcion(const ADescripcion: string): TTipoPlanLicencia;
var
  S: string;
begin
  // Ejemplo de uso:
  //   T := TipoPlanDesdeDescripcion(TUsuario);

  S := LowerCase(Trim(ADescripcion));

  if S = '' then
    Exit(tpDesconocido);

  if Pos('visor', S) > 0 then
    Exit(tpVisor);

  if (Pos('express', S) > 0) or (Pos('exprés', S) > 0) then
    Exit(tpExpress);

  Result := tpOtro;
end;

function TInfoModuloUsuario.ValidarOperacionReporte(const ADescripcionPlan, AUsuario: string; const
  ATipoSalida: TTipoSalidaReporte; out AForzarMarcaAgua: Boolean; out AMensajeError: string): Boolean;
var
  TipoPlan: TTipoPlanLicencia;
  UsersIni: TUsersIni;
  UltFecha: TDateTime;
begin
  // Ejemplo de uso:
  // var
  //   ForzarMw: Boolean;
  //   Msg: string;
  // begin
  //   if ValidarOperacionReporte(TUsuario, ID_usuario, srPdf, ForzarMw, Msg) then
  //     // seguir
  //   else
  //     ShowMessage(Msg);
  // end;

  Result := False;
  AForzarMarcaAgua := False;
  AMensajeError := '';

  TipoPlan := TipoPlanDesdeDescripcion(ADescripcionPlan);

  case TipoPlan of
    tpVisor:
      begin
        // Plan Visor: solo visualizar, no imprimir ni exportar
        AMensajeError := 'Su plan actual (Plan Visor) solo permite visualizar los reportes.' +
          sLineBreak + 'Para imprimir o exportar necesita un plan superior.';
        Exit(False);
      end;

    tpExpress:
      begin
        // Plan Express: 1 reporte al mes (cualquier salida), siempre con marca de agua
        AForzarMarcaAgua := True;

        // Refuerzo: si no hay INI de usuarios offline, no es seguro
        // decidir solo con datos locales -> obligamos a revalidar.
        if not TUsersIni.Exists then
        begin
          AMensajeError := 'No se ha encontrado la información local de control de reportes.' +
            sLineBreak + 'Debe iniciar sesión con conexión a internet para revalidar su licencia ' +
            'antes de poder generar nuevos reportes con el plan Exprés.';
          Exit(False);
        end;

        UsersIni := TUsersIni.Create;
        try
          UltFecha := UsersIni.GetLastReportDate(AUsuario);

          if (UltFecha > 0) and (YearOf(UltFecha) = YearOf(Now)) and (MonthOf(UltFecha) = MonthOf(Now)) then
          begin
            AMensajeError := 'Su plan Exprés solo permite generar un reporte al mes.' + sLineBreak +
              'Actualice su plan si necesita más descargas.';
            Exit(False);
          end;

          // Aún no se ha generado reporte este mes -> registrar ahora
          UsersIni.SetLastReportDate(AUsuario, Now);
        finally
          UsersIni.Free;
        end;

        Result := True;
      end;

    tpOtro, tpDesconocido:
      begin
        // Otros planes: sin límite ni marca de agua
        AForzarMarcaAgua := False;
        Result := True;
      end;
  end;
end;


{ Utilidad interna para añadir un módulo a un array dinámico }
procedure AddModulo(var AArray: TArray<TInfoModuloUsuario>; const AModulo: TInfoModuloUsuario);
var
  L: Integer;
begin
  L := Length(AArray);
  SetLength(AArray, L + 1);
  AArray[L] := AModulo;
end;

{ TInfoModuloUsuario }

procedure TInfoModuloUsuario.Clear;
begin
  IdComplemento := 0;
  Descripcion := '';
  TipoProducto := 0;
  TipoComunicacion := 0;
  FechaCaducidad := 0;
  Estado := emDesconocido;
end;

function TInfoModuloUsuario.GetSinRestriccion: Boolean;
begin
  Result := TipoProducto = TIPO_PRODUCTO_SIN_RESTRICCION;
end;

function TInfoModuloUsuario.EstaActivoAhora: Boolean;
begin
  // Los TipoProducto = 0 no tienen restricciones: siempre activos
  if SinRestriccion then
    Exit(True);

  case Estado of
    emActivo:
      Result := True;

    emCaducado, emNoContratado:
      Result := False;
  else
    // Estado desconocido: si tenemos fecha futura, lo damos por activo
    if (FechaCaducidad <> 0) and (FechaCaducidad > Now) then
      Result := True
    else
      Result := False;
  end;
end;

{ TInfoLicenciasUsuario }

procedure TInfoLicenciasUsuario.Clear;
begin
  IdUsuario := 0;
  PlanPrincipal := 0;
  ModulosActivos := nil;
end;

function TInfoLicenciasUsuario.TieneModuloActivo(const AIdComplemento: Integer): Boolean;
var
  M: TInfoModuloUsuario;
begin
  Result := False;
  for M in ModulosActivos do
    if M.IdComplemento = AIdComplemento then
    begin
      Result := M.EstaActivoAhora;
      Exit;
    end;
end;

{ Hora segura basada en hora local }

function ObtenerFechaHoraSegura(out AEstado: TEstadoHoraSegura): TDateTime;
const
  // margen para aceptar pequeños retrocesos de reloj (minutos)
  MARGEN_ATRAS_MINUTOS = 5;
  // diferencia máxima aceptable entre offset inicial y actual (minutos)
  MARGEN_OFFSET_MINUTOS = 10;
var
  LocalNow: TDateTime;
  ServerTime: TDateTime;
  OffsetActual: Double;
begin
  LocalNow := Now;
  Result := LocalNow;         // SIEMPRE devolvemos la hora del sistema
  AEstado := ehLocalAjustada;  // estado por defecto

  // 1) Detectar retrocesos grandes en el reloj local
  if GUltimaHoraLocal <> 0 then
  begin
    if LocalNow + (MARGEN_ATRAS_MINUTOS / 1440) < GUltimaHoraLocal then
      AEstado := ehSospechosa; // el reloj ha ido claramente hacia atrás
  end;

  GUltimaHoraLocal := LocalNow;

  // 2) Comprobar coherencia con hora de servidor (si hay callback)
  if Assigned(OnObtenerHoraServidor) and OnObtenerHoraServidor(ServerTime) and (ServerTime > 0) then
  begin
    OffsetActual := ServerTime - LocalNow; // diferencia servidor - equipo

    if GUltimoOffsetSrvLocal = 0 then
    begin
      // Primera vez que medimos el offset -> lo guardamos como referencia
      GUltimoOffsetSrvLocal := OffsetActual;
      AEstado := ehServidor; // hora local validada contra servidor
    end
    else
    begin
      // Comparamos con el offset de referencia.
      if Abs((OffsetActual - GUltimoOffsetSrvLocal) * 1440) > MARGEN_OFFSET_MINUTOS then
        AEstado := ehSospechosa
      else
        AEstado := ehServidor; // sigue siendo coherente con el servidor
    end;
  end;
end;

{ Regla 1: registro de verificación online }

function RegistrarVerificacionLicenciasOnline(const AHoraSegura: TDateTime): Boolean;
begin
  Result := Assigned(OnSetUltimaVerifLicencias);
  if Result then
    OnSetUltimaVerifLicencias(AHoraSegura);
end;

function PuedeUsarSistemaPorLicencias(out AHorasDesdeUltimaVerif: Double; out AEstadoHora:
  TEstadoHoraSegura): Boolean;
var
  AhoraSeguro: TDateTime;
  UltimaVerif: TDateTime;
begin
  AHorasDesdeUltimaVerif := 0;
  AhoraSeguro := ObtenerFechaHoraSegura(AEstadoHora);

  // Si el reloj es sospechoso, no permitimos uso sólo con datos locales
  if AEstadoHora = ehSospechosa then
  begin
    Result := False;
    Exit;
  end;

  UltimaVerif := 0;
  if Assigned(OnGetUltimaVerifLicencias) then
    UltimaVerif := OnGetUltimaVerifLicencias;

  // Primera vez: nunca se ha validado online -> permitimos, pero horas=0
  if UltimaVerif <= 0 then
  begin
    Result := True;
    Exit;
  end;

  AHorasDesdeUltimaVerif := (AhoraSeguro - UltimaVerif) * 24.0;
  Result := AHorasDesdeUltimaVerif <= MAX_HORAS_SIN_VERIF_LICENCIAS;
end;

{ Cargar licencias de usuario }

function CargarLicenciasUsuarioPorFecha(const AIdUsuario: Integer; const AToken: string; const
  AComplementos: array of Integer; out ALicencias: TInfoLicenciasUsuario): Boolean;
var
  i: Integer;
  Info: TInfoModuloUsuario;
  Desc: string;
  TipoProd, TipoCom: Integer;
  IdProductoWP: Integer;
  FechaCad: TDateTime;
  Json: TJSONObject;
  EstadoHora: TEstadoHoraSegura;
  AhoraSeguro: TDateTime;
  HuboVerifOnline: Boolean;
begin
  Result := False;
  ALicencias.Clear;
  ALicencias.IdUsuario := AIdUsuario;
  SetLength(ALicencias.ModulosActivos, 0);

  if not Assigned(OnGetModuloInfo) then
    Exit; // No podemos continuar sin acceso a la tabla Productos

  // Hora segura (basada en sistema, monitorizada con servidor)
  AhoraSeguro := ObtenerFechaHoraSegura(EstadoHora);
  HuboVerifOnline := False;

  for i := 0 to High(AComplementos) do
  begin
    if not OnGetModuloInfo(AComplementos[i], Desc, TipoProd, TipoCom, IdProductoWP) then
      Continue; // complemento no encontrado en BD

    Info.Clear;
    Info.IdComplemento := AComplementos[i];
    Info.Descripcion := Desc;
    Info.TipoProducto := TipoProd;
    Info.TipoComunicacion := TipoCom;

    // 1) TipoProducto = 0 => sin restricciones
    if Info.SinRestriccion then
    begin
      Info.Estado := emActivo;
      Info.FechaCaducidad := 0;
      AddModulo(ALicencias.ModulosActivos, Info);
      Continue;
    end;

    // 2) Si no tenemos id_wpProducto válido, no podemos pedir fecha de caducidad
    if IdProductoWP <= 0 then
    begin
      Info.Estado := emDesconocido;
      AddModulo(ALicencias.ModulosActivos, Info);
      Continue;
    end;

    // 3) Pedir fecha de caducidad a la API
    FechaCad := 0;
    Json := nil;
    try
      if DarFechaCaducidadProductoFecha(UrlDarFechaCaducidadProducto, AToken, AIdUsuario,
        IdProductoWP, FechaCad, Json) then
      begin
        HuboVerifOnline := True;
        Info.FechaCaducidad := FechaCad;

        if (FechaCad = 0) or (FechaCad >= AhoraSeguro) then
          Info.Estado := emActivo
        else
          Info.Estado := emCaducado;
      end
      else
      begin
        Info.Estado := emDesconocido;
      end;
    finally
      Json.Free;
    end;

    AddModulo(ALicencias.ModulosActivos, Info);
  end;

  // Si hemos conseguido hablar con la API al menos una vez, registramos verificación online
  if HuboVerifOnline then
    RegistrarVerificacionLicenciasOnline(AhoraSeguro);

  Result := Length(ALicencias.ModulosActivos) > 0;
end;

end.

