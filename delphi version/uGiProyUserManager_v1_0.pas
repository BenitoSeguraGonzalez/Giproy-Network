
unit uGiProyUserManager_v1_0;

{
  ===============================================================
  GiProy User Manager
  Version: 1.0
  Control: GUM-1.0-LOCAL-SECURE
  ===============================================================

  - Gestiona usuarios GiProy locales
  - Usa uGiProySecureConfig_v1_0_2
  - Email es clave única
  - Id es Integer
  - DBName = giproylocal_<Id>
  - Control login offline (3 días)
}

interface

uses
  System.SysUtils,
  System.JSON,
  System.DateUtils,
  uGiProySecureConfig_v1_0_2;

type
  EUserManagerError = class(Exception);

  TGiProyUserManager_v1_0 = class
  private
    class function GetUsersArray: TJSONArray; static;
    class function FindUserIndexByEmail(const AEmail: string): Integer; static;
    class function GetNowUTC: TDateTime; static;
  public
    class procedure AddOrUpdateUser(
      const AId: Integer;
      const AEmail, ADBUser, ADBPassword: string
    ); static;

    class function UserExists(const AEmail: string): Boolean; static;

    class function ValidateOfflineLogin(const AEmail: string): Boolean; static;

    class procedure UpdateOnlineLoginWindow; static;

    class procedure RemoveUser(const AEmail: string); static;
  end;

implementation

{ ================= UTILIDADES ================= }

class function TGiProyUserManager_v1_0.GetUsersArray: TJSONArray;
var
  Root: TJSONObject;
begin
  Root := TGiProySecureConfig_v1_0_2.GetJSON;
  Result := Root.GetValue<TJSONArray>('Users');
  if not Assigned(Result) then
    raise EUserManagerError.Create('Users array no encontrado.');
end;

class function TGiProyUserManager_v1_0.FindUserIndexByEmail(
  const AEmail: string): Integer;
var
  Arr: TJSONArray;
  i: Integer;
begin
  Result := -1;
  Arr := GetUsersArray;

  for i := 0 to Arr.Count - 1 do
    if SameText(
      Arr.Items[i].GetValue<string>('Email'),
      AEmail
    ) then
      Exit(i);
end;

class function TGiProyUserManager_v1_0.GetNowUTC: TDateTime;
begin
  Result := TTimeZone.Local.ToUniversalTime(Now);
end;

{ ================= CORE ================= }

class procedure TGiProyUserManager_v1_0.AddOrUpdateUser(
  const AId: Integer;
  const AEmail, ADBUser, ADBPassword: string
);
var
  Arr: TJSONArray;
  Obj: TJSONObject;
  Index: Integer;
begin
  Arr := GetUsersArray;
  Index := FindUserIndexByEmail(AEmail);

  if Index = -1 then
  begin
    Obj := TJSONObject.Create;
    Obj.AddPair('Id', TJSONNumber.Create(AId));
    Obj.AddPair('Email', AEmail);
    Obj.AddPair('DBName', 'giproylocal_' + AId.ToString);
    Obj.AddPair('DBUser', ADBUser);
    Obj.AddPair('DBPassword', ADBPassword);
    Obj.AddPair('Active', TJSONBool.Create(True));
    Arr.AddElement(Obj);
  end
  else
  begin
    Obj := Arr.Items[Index] as TJSONObject;
    Obj.GetValue<TJSONNumber>('Id').AsInt := AId;
    Obj.GetValue<string>('DBName');
    Obj.RemovePair('DBName');
    Obj.AddPair('DBName', 'giproylocal_' + AId.ToString);
    Obj.RemovePair('DBUser');
    Obj.AddPair('DBUser', ADBUser);
    Obj.RemovePair('DBPassword');
    Obj.AddPair('DBPassword', ADBPassword);
  end;

  UpdateOnlineLoginWindow;
  TGiProySecureConfig_v1_0_2.Save;
end;

class function TGiProyUserManager_v1_0.UserExists(
  const AEmail: string): Boolean;
begin
  Result := FindUserIndexByEmail(AEmail) <> -1;
end;

class function TGiProyUserManager_v1_0.ValidateOfflineLogin(
  const AEmail: string): Boolean;
var
  Root: TJSONObject;
  OfflineUntil: string;
  LimitDate: TDateTime;
begin
  Result := False;

  if not UserExists(AEmail) then
    Exit;

  Root := TGiProySecureConfig_v1_0_2.GetJSON;
  OfflineUntil := Root.GetValue<string>('OfflineAllowedUntilUTC', '');

  if OfflineUntil = '' then
    Exit;

  if not TryISO8601ToDate(OfflineUntil, LimitDate) then
    Exit;

  Result := GetNowUTC <= LimitDate;
end;

class procedure TGiProyUserManager_v1_0.UpdateOnlineLoginWindow;
var
  Root: TJSONObject;
  NowUTC, LimitUTC: TDateTime;
begin
  Root := TGiProySecureConfig_v1_0_2.GetJSON;

  NowUTC := GetNowUTC;
  LimitUTC := IncDay(NowUTC, 3);

  Root.RemovePair('LastOnlineLoginUTC');
  Root.AddPair('LastOnlineLoginUTC',
    DateToISO8601(NowUTC, True));

  Root.RemovePair('OfflineAllowedUntilUTC');
  Root.AddPair('OfflineAllowedUntilUTC',
    DateToISO8601(LimitUTC, True));
end;

class procedure TGiProyUserManager_v1_0.RemoveUser(
  const AEmail: string);
var
  Arr: TJSONArray;
  Index: Integer;
begin
  Arr := GetUsersArray;
  Index := FindUserIndexByEmail(AEmail);

  if Index <> -1 then
  begin
    Arr.Remove(Index);
    TGiProySecureConfig_v1_0_2.Save;
  end;
end;

end.
