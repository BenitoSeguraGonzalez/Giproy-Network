unit BrowserUtils;

interface

uses
  System.SysUtils, System.Classes;

procedure OpenURLInBrowser(const AURL: string);
function OpenURLInBrowserEx(const AURL: string): Boolean;

implementation

uses
  {$IFDEF MSWINDOWS}
  Winapi.Windows, Winapi.ShellAPI,
  {$ENDIF}
  FMX.Dialogs;

procedure OpenURLInBrowser(const AURL: string);
begin
  if not OpenURLInBrowserEx(AURL) then
    raise Exception.Create('No se pudo abrir el navegador para la URL: ' + AURL);
end;

function OpenURLInBrowserEx(const AURL: string): Boolean;
{$IFDEF MSWINDOWS}
var
  ReturnValue: Integer;
{$ENDIF}
begin
  Result := False;

  if AURL.Trim.IsEmpty then
    Exit(False);

  {$IFDEF MSWINDOWS}
  try
    ReturnValue := ShellExecute(
      0,               // Handle
      'open',          // Operación
      PChar(AURL),     // URL
      nil,             // Parámetros
      nil,             // Directorio
      SW_SHOWNORMAL    // Modo de visualización
    );

    // ShellExecute retorna >32 si tiene éxito
    Result := (ReturnValue > 32);

    if not Result then
    begin
      // Opcional: Registrar el error
      // ShowMessage('Error al abrir URL. Código: ' + IntToStr(ReturnValue));
    end;
  except
    on E: Exception do
    begin
      // ShowMessage('Error: ' + E.Message);
      Result := False;
    end;
  end;
  {$ELSEIF DEFINED(IOS) or DEFINED(ANDROID)}
  // Para móviles, usar FMX.Platform
  // Result := OpenURL(AURL); // Usando FMX.Helpers
  {$ELSE}
  raise Exception.Create('Plataforma no soportada para abrir URLs');
  {$ENDIF}
end;

end.
