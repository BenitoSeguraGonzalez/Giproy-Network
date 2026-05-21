
unit uGiProyMigration_v1_0;

{
  ===============================================================
  GiProy Legacy Migration
  Version: 1.0
  Control: GMIG-1.0-LEGACY
  ===============================================================

  - Detecta GiProyV2.ini legacy
  - Lee DBConfig
  - Desencripta PasswordDB (XOR antiguo)
  - Migra a SecureConfig moderno
  - Renombra INI a .legacy
}

interface

uses
  System.SysUtils,
  System.Classes,
  System.IniFiles,
  System.IOUtils,
  System.NetEncoding,
  uGiProyUserManager_v1_0_1,
  uGiProySecureConfig_v1_0_2;

type
  EMigrationError = class(Exception);

  TGiProyMigration_v1_0 = class
  private
    class function XORDecryptLegacy(const Encoded, Key: string): string; static;
  public
    class procedure TryMigrateLegacy(
      const AEmail: string;
      const AUserId: Integer
    ); static;
  end;

implementation

class function TGiProyMigration_v1_0.XORDecryptLegacy(
  const Encoded, Key: string): string;
var
  Bytes: TBytes;
  i: Integer;
begin
  Bytes := TNetEncoding.Base64.DecodeStringToBytes(Encoded);
  for i := 0 to High(Bytes) do
    Bytes[i] := Bytes[i] xor Byte(Key[(i mod Length(Key)) + 1]);
  Result := TEncoding.UTF8.GetString(Bytes);
end;

class procedure TGiProyMigration_v1_0.TryMigrateLegacy(
  const AEmail: string;
  const AUserId: Integer
);
var
  IniPath: string;
  Ini: TMemIniFile;
  DBUser, DBPasswordEnc, DBPassword, DBName, Salt: string;
  ExpectedDB: string;
  SecureRoot: TJSONObject;
begin
  IniPath := TPath.Combine(
    TPath.GetDocumentsPath,
    ChangeFileExt(ExtractFileName(ParamStr(0)), '.ini')
  );

  if not TFile.Exists(IniPath) then
    Exit;

  SecureRoot := TGiProySecureConfig_v1_0_2.GetJSON;

  if (SecureRoot.GetValue('Users') as TJSONArray).Count > 0 then
    Exit; // Ya migrado

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
      Exit; // No coincide con usuario real

    DBPassword := XORDecryptLegacy(DBPasswordEnc, Salt);

    TGiProyUserManager_v1_0_1.AddOrUpdateUser(
      AUserId,
      AEmail,
      DBUser,
      DBPassword
    );

    Ini.UpdateFile;
  finally
    Ini.Free;
  end;

  // Renombrar INI
  TFile.Move(IniPath, IniPath + '.legacy');

end;

end.
