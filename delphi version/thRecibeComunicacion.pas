unit thRecibeComunicacion;

interface

uses
  System.Classes, Uni, UniProvider, MySQLUniProvider, DBAccess,
  System.StrUtils,
  System.SysUtils, System.JSON;

type
  recibeComunicacion = class(TThread)
  private
    { Private declarations }
    thidUsuario: Integer;

  protected
    { Protected declarations }
    procedure Execute; override;

  public
    { Public declarations }
    constructor Create(CreateSuspended: Boolean;
      TidUsuario: Integer);

  end;

implementation

{ recibeComunicacion }

uses
  DM1, uDisplayChat, uApiGiProy;

constructor recibeComunicacion.Create(CreateSuspended: Boolean;
  TidUsuario: Integer);
begin
  inherited Create(CreateSuspended);
  self.FreeOnTerminate := true;
  thidUsuario := TidUsuario;
end;

procedure recibeComunicacion.Execute;
var
  fechaHoraRecepcion: TDateTime;
  Error: Boolean;
  thUltimoID: Integer;

  // Para llamada HTTP
  Ok: Boolean;
  J: TJSONObject;
  Items: TJSONArray;
  DesdeID, Count, I: Integer;

  Itm: TJSONObject;
  LId: Int64; // <-- BIGINT en backend
  LIdEmisor, LIdReceptor, LTipoMensaje: Integer;
  LMensaje, LAdicional, LNombre, LEmail, LFechaStr: string;
  LFechaEmision: TDateTime;

  // Para actualización estado online
  JUpd: TJSONObject;
begin
  // 1) Obtener el último id externo procesado (local)
  DModule_1.QUltimoIDComunicacion.ParamByName('idUsuario').AsInteger :=
    thidUsuario;
  DModule_1.QUltimoIDComunicacion.ExecSQL;
  thUltimoID := DModule_1.QUltimoIDComunicacionidExterno.AsInteger;

  // 2) Llamar al endpoint RecibirComunicacion.php vía uApiGiProy
  Ok := RecibirComunicacionesDatos(UrlRecibirComunicacion,
    // URL completa del endpoint PHP
    GlobalAuthToken, // Token Bearer
    thUltimoID, // ultimoID
    200, // limit (ajusta si quieres)
    DesdeID, Count, Items, J);

  if not Ok then
    Exit;

  if (Items = nil) or (Items.Count = 0) then
  begin
    J.Free;
    Exit;
  end;

  // 3) Recorrer items del JSON y persistir en base local
  for I := 0 to Items.Count - 1 do
  begin
    if not (Items.Items[I] is TJSONObject) then
      Continue;

    Itm := TJSONObject(Items.Items[I]);

    // Lectura robusta de campos (coinciden con el SELECT del PHP)
    LId := StrToInt64Def(Itm.GetValue<string>('id', '0'), 0);
    // BIGINT
    LIdEmisor := Itm.GetValue<Integer>('idEmisor', 0);
    LIdReceptor := Itm.GetValue<Integer>('idReceptor', 0);
    LTipoMensaje := Itm.GetValue<Integer>('tipoMensaje', 0);
    LMensaje := Itm.GetValue<string>('Mensaje', '');
    LAdicional := Itm.GetValue<string>('adicional', '');
    LNombre := Itm.GetValue<string>('Nombre', 'Sistema');
    LEmail := Itm.GetValue<string>('email', '');

    LFechaStr := Trim(Itm.GetValue<string>('fechaHoraEnvio', ''));
    if (LFechaStr <> '') and TryParseFechaPHP(LFechaStr,
      LFechaEmision) then
      // ok
    else
      LFechaEmision := Now; // fallback prudente

    Error := False;
    try
      // === Guardar en base local ===
      DModule_1.SQLGuardarComunicacionesRecibidas.ParamByName
        ('idUsuarioEmisor').AsInteger := LIdEmisor;
      DModule_1.SQLGuardarComunicacionesRecibidas.ParamByName
        ('idUsuarioReceptor').AsInteger := LIdReceptor;
      DModule_1.SQLGuardarComunicacionesRecibidas.ParamByName
        ('emailReceptor').AsString := LEmail;
      DModule_1.SQLGuardarComunicacionesRecibidas.ParamByName
        ('Receptor').AsString := LNombre;
      DModule_1.SQLGuardarComunicacionesRecibidas.ParamByName
        ('idTipoComunicacion').AsInteger := LTipoMensaje;
      DModule_1.SQLGuardarComunicacionesRecibidas.ParamByName
        ('DatosComunicacion').AsString := LMensaje;
      DModule_1.SQLGuardarComunicacionesRecibidas.ParamByName
        ('fechahoraEmision').AsDateTime := LFechaEmision;

      fechaHoraRecepcion := Now;
      DModule_1.SQLGuardarComunicacionesRecibidas.ParamByName
        ('fechahoraRecepcion').AsDateTime :=
        fechaHoraRecepcion;

      DModule_1.SQLGuardarComunicacionesRecibidas.ParamByName
        ('idExterno').AsLargeInt := LId; // BIGINT
      DModule_1.SQLGuardarComunicacionesRecibidas.ParamByName
        ('adicional').AsString := LAdicional;

      DModule_1.SQLGuardarComunicacionesRecibidas.Execute;
    except
      Error := true;
    end;

    if not Error then
    begin
      // 4) Marcar como recibido en la base online mediante HTTP (uApiGiProy)
      try
        // Usa el atajo que ya formatea la fecha actual: "YYYY-MM-DD hh:mm:ss"
        JUpd := nil;
        ActualizarEstadoComunicacionAhora
          (UrlActualizaEstadoComunicaciones,
          // <-- define esta constante en tu módulo de URLs
          GlobalAuthToken, // <-- token JWT
          LId, // <-- BIGINT de la comunicación
          JUpd);
        if Assigned(JUpd) then
          JUpd.Free;
      except
        // si falla, no abortamos el lote; continúa con el siguiente
      end;
    end;
  end;

  // 5) Liberar JSON clonado por RecibirComunicacionesDatos
  J.Free;
end;

end.

