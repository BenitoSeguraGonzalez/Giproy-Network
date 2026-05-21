unit uAppLogger;

interface

uses
  System.SysUtils,
  System.Classes,
  System.UITypes,
  System.Threading,
  FMX.Dialogs,
  FMX.Types;

type
  TAppLogLevel = (llInfo, llWarning, llError);

  { TAppLogger
    Clase sencilla para centralizar el registro y visualización
    de mensajes de la aplicación. Actualmente redirige los mensajes
    a ShowMessage ejecutado siempre en el hilo principal.
    En el futuro se puede extender para escribir a fichero,
    enviar telemetría, etc. }
  TAppLogger = class
  public
    class procedure Log(const Msg: string; Level: TAppLogLevel = llInfo;
      const ATag: string = ''); static;
    class procedure Info(const Msg: string); static;
    class procedure Warn(const Msg: string); static;
    class procedure Error(const Msg: string; const E: Exception = nil); static;
  end;

implementation

{ TAppLogger }

class procedure TAppLogger.Log(const Msg: string; Level: TAppLogLevel;
  const ATag: string);
begin
  TThread.Queue(nil,
    procedure
    var
      Prefix: string;
      Text: string;
    begin
      case Level of
        llInfo:    Prefix := 'INFO';
        llWarning: Prefix := 'WARN';
        llError:   Prefix := 'ERROR';
      else
        Prefix := 'LOG';
      end;

      if ATag <> '' then
        Text := Format('[%s][%s] %s', [Prefix, ATag, Msg])
      else
        Text := Format('[%s] %s', [Prefix, Msg]);

      ShowMessage(Text);
    end);
end;

class procedure TAppLogger.Info(const Msg: string);
begin
  Log(Msg, llInfo);
end;

class procedure TAppLogger.Warn(const Msg: string);
begin
  Log(Msg, llWarning);
end;

class procedure TAppLogger.Error(const Msg: string; const E: Exception);
var
  FullMsg: string;
begin
  if Assigned(E) then
    FullMsg := Format('%s: %s', [Msg, E.Message])
  else
    FullMsg := Msg;

  Log(FullMsg, llError);
end;

end.
