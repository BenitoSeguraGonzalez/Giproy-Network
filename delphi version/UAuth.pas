unit UAuth;

interface

uses
  System.SysUtils, System.Classes, System.JSON, System.Net.HttpClient, System.Net.URLClient,
  System.Net.HttpClientComponent, System.DateUtils;

var
  GlobalAuthToken: string = ''; // almacena el JWT obtenido en el login

function DoLogin(const AUsuario, APassword: string): Boolean;

function GetProtegidoJSON(const ARelativePath: string; out AJSON: string): Boolean;

implementation

const
  BASE_URL = 'https://app.62.171.171.124.sslip.io/'; // tu servidor
  LOGIN_URL = BASE_URL + 'loginUsuario.php'; // login

function DoLogin(const AUsuario, APassword: string): Boolean;
var
  Http: TNetHTTPClient;
  Params: TStringList;
  Resp: IHTTPResponse;
  Root, UserObj: TJSONObject;
begin
  Result := False;
  GlobalAuthToken := '';

  Http := TNetHTTPClient.Create(nil);
  Params := TStringList.Create;
  try
    Params.Add('usuario=' + AUsuario);
    Params.Add('password=' + APassword);

    Resp := Http.Post(LOGIN_URL, Params);
    if Resp.StatusCode <> 200 then
      raise Exception.CreateFmt('Login HTTP %d: %s', [Resp.StatusCode, Resp.StatusText]);

    Root := TJSONObject.ParseJSONValue(Resp.ContentAsString) as TJSONObject;
    try
      if Assigned(Root) and Root.GetValue<Boolean>('ok', False) then
      begin
        GlobalAuthToken := Root.GetValue<string>('token', '');
                                // Si quieres, puedes extraer campos del usuario:
        UserObj := Root.GetValue<TJSONObject>('usuario');
                                // ...
        Result := GlobalAuthToken <> '';
      end
      else
        raise Exception.Create('Credenciales inválidas o respuesta de login no válida.');
    finally
      Root.Free;
    end;

  finally
    Params.Free;
    Http.Free;
  end;
end;

function GetProtegidoJSON(const ARelativePath: string; out AJSON: string): Boolean;
var
  Http: TNetHTTPClient;
  Resp: IHTTPResponse;
  URL: string;
begin
  Result := False;
  AJSON := '';
  if GlobalAuthToken = '' then
    raise Exception.Create('No hay token. Debes iniciar sesión primero.');

  URL := BASE_URL + ARelativePath;

  Http := TNetHTTPClient.Create(nil);
  try
    Http.CustomHeaders['Authorization'] := 'Bearer ' + GlobalAuthToken;
    Resp := Http.Get(URL);

    case Resp.StatusCode of
      200:
        begin
          AJSON := Resp.ContentAsString;
          Result := True;
        end;
      401:
        begin
                                        // Token inválido/expirado → informa claramente
          raise Exception.Create('401 Unauthorized: Token inválido o expirado. Vuelve a iniciar sesión.');
        end;
    else
      raise Exception.CreateFmt('Error HTTP %d: %s', [Resp.StatusCode, Resp.StatusText]);
    end;

  finally
    Http.Free;
  end;
end;

end.

