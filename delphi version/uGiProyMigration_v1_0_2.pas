unit uGiProyMigration_v1_0_2;

{
  ===============================================================
  GiProy Legacy Migration
  Version: 1.0.2
  Control: GMIG-1.0.2-LEGACY-STABLE
  ===============================================================

  ✔ No lanza excepción si .legacy ya existe
  ✔ Solo migra si Users está vacío
  ✔ Validaciones robustas
  ✔ Compatible SecureConfig v1.0.3
}

interface

uses
  System.SysUtils,
  System.Classes,
  System.IniFiles,
  System.IOUtils,
  System.JSON,
  System.NetEncoding,
  uGiProyUserManager_v1_0_2,
  uGiProySecureConfig_v1_0_3;

type
  EMigrationError = class(Exception);

  TGiProyMigration_v1_0_2 = class
  private
    class function XORDecryptLegacy(const Encoded, Key: string): string; static;
  public
    class procedure TryMigrateLegacy(
      const AEmail: string;
      const AUserId: Integer
    ); static;
  end;

implementation

class function TGiProyMigration_v1_0_2.XORDecryptLegacy(
  const Encoded, Key: string): string;
var
  Bytes: TBytes;
  i: Integer;
begin
  if (Encoded = '') or (Key = '') then
    Exit('');

  Bytes := TNetEncoding.Base64.DecodeStringToBytes(Encoded);

  for i := 0 to High(Bytes) do
    Bytes[i] := Bytes[i] xor Byte(Key[(i mod Length(Key)) + 1]);

  Result := TEncoding.UTF8.GetString(Bytes);
end;

class procedure TGiProyMigration_v1_0_2.TryMigrateLegacy(
  const AEmail: string;
  const AUserId: Integer
);
var
  IniPath: string;
  LegacyPath: string;
  Ini: TMemIniFile;
  DBUser, DBPasswordEnc, DBPassword, DBName, Salt: string;
  ExpectedDB: string;
  Root: TJSONObject;
  UsersArray: TJSONArray;
begin
  // Ruta del ini antiguo
  IniPath := TPath.Combine(
    TPath.GetDocumentsPath,
    ChangeFileExt(ExtractFileName(ParamStr(0)), '.ini')
  );

  // Si no existe ini antiguo, no hay nada que migrar
  if not TFile.Exists(IniPath) then
    Exit;

  // Si ya existe .legacy, consideramos migrado
  LegacyPath := IniPath + '.legacy';
  if TFile.Exists(LegacyPath) then
    Exit;

  // Obtener JSON actual
  Root := TGiProySecureConfig_v1_0_3.GetJSON;
  if not Assigned(Root) then
    Exit;

  UsersArray := Root.GetValue('Users') as TJSONArray;

  // Si ya hay usuarios en el sistema moderno, no migrar
  if Assigned(UsersArray) and (UsersArray.Count > 0) then
    Exit;

  Ini := TMemIniFile.Create(IniPath, TEncoding.UTF8);
  try
    DBUser := Ini.ReadString('DBConfig', 'UserDB', '');
    DBPasswordEnc := Ini.ReadString('DBConfig', 'PasswordDB', '');
    DBName := Ini.ReadString('DBConfig', 'NombreDB', '');
    Salt := Ini.ReadString('DBConfig', 'Salt', 'EfficientteFixedSeed_v1');

    if (DBUser = '') or (DBPasswordEnc = '') or (DBName = '') then
      Exit;

    ExpectedDB := 'giproylocal_' + AUserId.ToString;

    if not SameText(DBName, ExpectedDB) then
      Exit;

    DBPassword := XORDecryptLegacy(DBPasswordEnc, Salt);

    if DBPassword = '' then
      Exit;

    // Registrar usuario en sistema nuevo
    TGiProyUserManager_v1_0_2.AddOrUpdateUser(
      AUserId,
      AEmail,
      DBUser,
      DBPassword
    );

  finally
    Ini.Free;
  end;

  // Renombrar ini antiguo a .legacy (sin lanzar excepción)
  try
    if TFile.Exists(IniPath) then
      TFile.Move(IniPath, LegacyPath);
  except
    // No hacemos nada si falla
  end;
end;

end.