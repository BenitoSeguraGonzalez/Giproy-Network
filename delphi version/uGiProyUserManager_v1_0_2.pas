unit uGiProyUserManager_v1_0_2;

{
  ===============================================================
  GiProy User Manager
  Version: 1.0.2
  Control: GUM-1.0.2-DB-VALIDATION
  ===============================================================
}

interface

uses
  System.SysUtils,
  System.JSON,
  System.DateUtils,
  uGiProySecureConfig_v1_0_3;

type
  EUserManagerError = class(Exception);

  TGiProyUserManager_v1_0_2 = class
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

    class function UserHasDatabase(
      const AEmail: string;
      out ADBUser, ADBPassword: string
    ): Boolean; static;

    class function ValidateOfflineLogin(const AEmail: string): Boolean; static;

    class procedure UpdateOnlineLoginWindow; static;

    class procedure RemoveUser(const AEmail: string); static;
  end;

implementation

class function TGiProyUserManager_v1_0_2.GetUsersArray: TJSONArray;
var
  Root: TJSONObject;
begin
  Root := TGiProySecureConfig_v1_0_3.GetJSON;

  if not Assigned(Root) then
    raise EUserManagerError.Create('Root JSON no asignado.');

  Result := Root.GetValue('Users') as TJSONArray;

  if not Assigned(Result) then
    raise EUserManagerError.Create('Users array no encontrado.');
end;

class function TGiProyUserManager_v1_0_2.FindUserIndexByEmail(
  const AEmail: string): Integer;
var
  Arr: TJSONArray;
  i: Integer;
  Obj: TJSONObject;
begin
  Result := -1;
  Arr := GetUsersArray;

  for i := 0 to Arr.Count - 1 do
  begin
    Obj := Arr.Items[i] as TJSONObject;

    if SameText(
         Obj.GetValue('Email').Value,
         AEmail
       ) then
      Exit(i);
  end;
end;

class function TGiProyUserManager_v1_0_2.GetNowUTC: TDateTime;
begin
  Result := TTimeZone.Local.ToUniversalTime(Now);
end;

{ ================= CORE ================= }

class function TGiProyUserManager_v1_0_2.UserHasDatabase(
  const AEmail: string;
  out ADBUser, ADBPassword: string
): Boolean;
var
  Arr: TJSONArray;
  Index: Integer;
  Obj: TJSONObject;
begin
  Result := False;
  ADBUser := '';
  ADBPassword := '';

  Arr := GetUsersArray;
  Index := FindUserIndexByEmail(AEmail);

  if Index = -1 then
    Exit;

  Obj := Arr.Items[Index] as TJSONObject;

  ADBUser := Obj.GetValue('DBUser').Value;
  ADBPassword := Obj.GetValue('DBPassword').Value;

  Result := (ADBUser <> '') and (ADBPassword <> '');
end;

class procedure TGiProyUserManager_v1_0_2.AddOrUpdateUser(
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

    Obj.RemovePair('Id');
    Obj.AddPair('Id', TJSONNumber.Create(AId));

    Obj.RemovePair('DBName');
    Obj.AddPair('DBName', 'giproylocal_' + AId.ToString);

    Obj.RemovePair('DBUser');
    Obj.AddPair('DBUser', ADBUser);

    Obj.RemovePair('DBPassword');
    Obj.AddPair('DBPassword', ADBPassword);
  end;

  UpdateOnlineLoginWindow;
  TGiProySecureConfig_v1_0_3.Save;
end;

class function TGiProyUserManager_v1_0_2.UserExists(
  const AEmail: string): Boolean;
begin
  Result := FindUserIndexByEmail(AEmail) <> -1;
end;

class function TGiProyUserManager_v1_0_2.ValidateOfflineLogin(
  const AEmail: string): Boolean;
var
  Root: TJSONObject;
  OfflineUntil: string;
  LimitDate: TDateTime;
begin
  Result := False;

  if not UserExists(AEmail) then
    Exit;

  Root := TGiProySecureConfig_v1_0_3.GetJSON;
  OfflineUntil := Root.GetValue('OfflineAllowedUntilUTC').Value;

  if OfflineUntil = '' then
    Exit;

  if not TryISO8601ToDate(OfflineUntil, LimitDate) then
    Exit;

  Result := GetNowUTC <= LimitDate;
end;

class procedure TGiProyUserManager_v1_0_2.UpdateOnlineLoginWindow;
var
  Root: TJSONObject;
  NowUTC, LimitUTC: TDateTime;
begin
  Root := TGiProySecureConfig_v1_0_3.GetJSON;

  NowUTC := GetNowUTC;
  LimitUTC := IncDay(NowUTC, 3);

  Root.RemovePair('LastOnlineLoginUTC');
  Root.AddPair('LastOnlineLoginUTC',
    DateToISO8601(NowUTC, True));

  Root.RemovePair('OfflineAllowedUntilUTC');
  Root.AddPair('OfflineAllowedUntilUTC',
    DateToISO8601(LimitUTC, True));
end;

class procedure TGiProyUserManager_v1_0_2.RemoveUser(
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
    TGiProySecureConfig_v1_0_3.Save;
  end;
end;

end.