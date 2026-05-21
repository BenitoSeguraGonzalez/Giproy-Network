
unit uGiProyDBActivator_v1_0;

{
  ===============================================================
  GiProy DB Activator
  Version: 1.0
  Control: GDBA-1.0-LOCAL
  ===============================================================

  - Activa conexión MySQL local por usuario
  - Usa SecureConfig + UserManager
  - Reemplaza activaDBUsuario()
  - Compatible UniDAC (TUniConnection)
}

interface

uses
  System.SysUtils,
  System.JSON,
  uGiProySecureConfig_v1_0_3,
  uGiProyUserManager_v1_0_2,
  Uni;

type
  EDBActivatorError = class(Exception);

  TGiProyDBActivator_v1_0 = class
  public
    class function ActivateUserDatabase(
      const AEmail: string;
      AConnection: TUniConnection
    ): Boolean; static;
  end;

implementation

class function TGiProyDBActivator_v1_0.ActivateUserDatabase(
  const AEmail: string;
  AConnection: TUniConnection
): Boolean;
var
  Root: TJSONObject;
  Users: TJSONArray;
  i: Integer;
  Obj: TJSONObject;
  DBUser, DBPassword, DBName: string;
begin
  Result := False;

  if not Assigned(AConnection) then
    raise EDBActivatorError.Create('Conexión no asignada.');

  Root := TGiProySecureConfig_v1_0_3.GetJSON;
  Users := Root.GetValue('Users') as TJSONArray;

  if not Assigned(Users) then
    raise EDBActivatorError.Create('No existen usuarios registrados.');

  for i := 0 to Users.Count - 1 do
  begin
    Obj := Users.Items[i] as TJSONObject;

    if SameText(Obj.GetValue('Email').Value, AEmail) then
    begin
      DBUser := Obj.GetValue('DBUser').Value;
      DBPassword := Obj.GetValue('DBPassword').Value;
      DBName := Obj.GetValue('DBName').Value;

      if AConnection.Connected then
        AConnection.Disconnect;

      AConnection.Username := DBUser;
      AConnection.Password := DBPassword;
      AConnection.Database := DBName;

      AConnection.Connect;

      Result := AConnection.Connected;
      Exit;
    end;
  end;

  raise EDBActivatorError.Create('Usuario no encontrado en configuración segura.');
end;

end.
