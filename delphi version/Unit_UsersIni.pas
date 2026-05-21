unit Unit_UsersIni;

interface

uses
  System.SysUtils, System.Classes, System.IniFiles, System.IOUtils, System.Hash, System.NetEncoding;

const
  C_DEFAULT_SALT = 'EfficientteFixedSeed_v1';

type
  TUsersIni = class
  private
    FFilePath: string;
    FEncKey: string;
    FGlobalSalt: string; // Salt global fijo
    function HashPassword(const APassword: string): string;
    function EncryptText(const S: string): string;
    function DecryptText(const S: string): string;
    function ReadString(const Section, Ident, Default: string): string;
    procedure WriteString(const Section, Ident, Value: string);
    function ReadDateTime(const Section, Ident: string; Default: TDateTime): TDateTime;
    procedure WriteDateTime(const Section, Ident: string; Value: TDateTime);
    function ValueExists(const Section, Ident: string): Boolean;
    procedure DeleteKey(const Section, Ident: string);
    procedure ReadSection(const Section: string; Strings: TStrings);
    procedure EnsureSaltInFile; // Asegura que el salt esté en el archivo
  public
    constructor Create(const AFileName: string = ''; const ACreateIfMissing: Boolean = False);
    destructor Destroy; override;

    class function GetDefaultFilePath(const AFileName: string = ''): string; static;
    class function Exists(const AFileName: string = ''): Boolean; static;

    // Gestión de usuarios
    procedure AddUser(const AUser, APassword, ARole: string; AActive: Boolean = True);
    procedure RemoveUser(const AUser: string);
    function CheckCredentials(const AUser, APassword: string): Boolean;
    function ChangePassword(const AUser, AOldPass, ANewPass: string): Boolean;
    procedure ChangePasswordDirect(const AUser, ANewPass: string);
    function GetUserRole(const AUser: string): string;
    function IsUserActive(const AUser: string): Boolean;
    procedure SetUserActive(const AUser: string; AActive: Boolean);
    function UserExists(const AUser: string): Boolean;
    function ListUsers: TStrings;

    // Gestión de base de datos
    procedure SetDatabaseConfig(const DBUser, DBPassword, DBTable: string);
    procedure GetDatabaseConfig(out DBUser, DBPassword, DBTable: string);

    // Gestión de archivo
    procedure LoadFromFile(const APath: string);
    procedure SaveToFileAs(const APath: string);
    procedure UpdateFile;

    property FilePath: string read FFilePath;

    // Gestión de reportes
    function GetLastReportDate(const AUser: string): TDateTime;
    procedure SetLastReportDate(const AUser: string; const AFecha: TDateTime);

    // Para depuración
    function DebugGetStoredHash(const AUser: string): string;
    function DebugGetCurrentHash(const APassword: string): string;
    function DebugGetSalt: string;

  end;

implementation

{ TUsersIni }

{---------------------------------------------------------------}
{ Codificación / Decodificación AES sencilla con Base64 }
{---------------------------------------------------------------}
function XOREncrypt(const Text, Key: string): string;
var
  i, K: Integer;
  Bytes: TBytes;
begin
  Bytes := TEncoding.UTF8.GetBytes(Text);
  for i := 0 to High(Bytes) do
  begin
    K := Byte(Key[(i mod Length(Key)) + 1]);
    Bytes[i] := Bytes[i] xor K;
  end;
  Result := TNetEncoding.Base64.EncodeBytesToString(Bytes);
end;

function XORDecrypt(const Encoded, Key: string): string;
var
  Bytes: TBytes;
  i, K: Integer;
begin
  Bytes := TNetEncoding.Base64.DecodeStringToBytes(Encoded);
  for i := 0 to High(Bytes) do
  begin
    K := Byte(Key[(i mod Length(Key)) + 1]);
    Bytes[i] := Bytes[i] xor K;
  end;
  Result := TEncoding.UTF8.GetString(Bytes);
end;

class function TUsersIni.GetDefaultFilePath(const AFileName: string): string;
var
  AppName: string;
begin
  if AFileName = '' then
  begin
    AppName := ChangeFileExt(ExtractFileName(ParamStr(0)), '.ini');
    Result := TPath.Combine(TPath.GetDocumentsPath, AppName);
  end
  else
    Result := AFileName;
end;

class function TUsersIni.Exists(const AFileName: string): Boolean;
begin
  Result := TFile.Exists(GetDefaultFilePath(AFileName));
end;

constructor TUsersIni.Create(const AFileName: string; const ACreateIfMissing: Boolean);
begin
  if AFileName = '' then
    FFilePath := GetDefaultFilePath('')
  else
    FFilePath := AFileName;

  // Salt GLOBAL FIJO - ¡ESTO ES CLAVE!
  // Usamos un salt fijo derivado del nombre de la aplicación para consistencia
  FGlobalSalt := THashSHA2.GetHashString('GiProyV2SaltKey', SHA256);

  // Clave de cifrado derivada del nombre del ejecutable
  FEncKey := THashSHA2.GetHashString(ExtractFileName(ParamStr(0)), SHA256);

  // Crear archivo solo si no existe y ACreateIfMissing = True
  if ACreateIfMissing and (not TFile.Exists(FFilePath)) then
  begin
    EnsureSaltInFile;
  end;
end;

destructor TUsersIni.Destroy;
begin
  inherited;
end;

procedure TUsersIni.EnsureSaltInFile;
var
  Ini: TMemIniFile;
  ExistingSalt: string;
begin
  // Solo escribir el salt si no existe o es diferente
  if TFile.Exists(FFilePath) then
  begin
    Ini := TMemIniFile.Create(FFilePath, TEncoding.UTF8);
    try
      ExistingSalt := Ini.ReadString('Config', 'Salt', '');
      if (ExistingSalt = '') or (ExistingSalt <> FGlobalSalt) then
      begin
        Ini.WriteString('Config', 'Salt', FGlobalSalt);
        Ini.UpdateFile;
      end;
    finally
      Ini.Free;
    end;
  end
  else
  begin
    // Crear archivo con salt
    Ini := TMemIniFile.Create(FFilePath, TEncoding.UTF8);
    try
      Ini.WriteString('Config', 'Salt', FGlobalSalt);
      Ini.UpdateFile;
    finally
      Ini.Free;
    end;
  end;
end;

function TUsersIni.HashPassword(const APassword: string): string;
var
  FullString: string;
begin
  // Usamos SIEMPRE el mismo salt global
  FullString := FGlobalSalt + APassword;

  // DEBUG: Para verificar
  // ShowMessage('HashPassword:' + sLineBreak +
  //            'Salt: ' + FGlobalSalt + sLineBreak +
  //            'Password: ' + APassword + sLineBreak +
  //            'FullString: ' + FullString);

  Result := THashSHA2.GetHashString(FullString, SHA256);

  // DEBUG: Para verificar el hash resultante
  // ShowMessage('Hash resultante: ' + Result);
end;

function TUsersIni.EncryptText(const S: string): string;
var
  I: Integer;
  Key: string;
  B: TBytes;
begin
  if S = '' then
    Exit('');
  Key := FEncKey;
  SetLength(B, Length(S));
  for I := 1 to Length(S) do
    B[I - 1] := Byte(S[I]) xor Byte(Key[(I - 1) mod Length(Key) + 1]);
  Result := TNetEncoding.Base64.EncodeBytesToString(B);
end;

function TUsersIni.DecryptText(const S: string): string;
var
  B: TBytes;
  I: Integer;
  Key: string;
  OutS: TBytes;
begin
  if S = '' then
    Exit('');
  Key := FEncKey;
  B := TNetEncoding.Base64.DecodeStringToBytes(S);
  SetLength(OutS, Length(B));
  for I := 0 to High(B) do
    OutS[I] := B[I] xor Byte(Key[I mod Length(Key) + 1]);
  Result := TEncoding.UTF8.GetString(OutS);
end;

function TUsersIni.ReadString(const Section, Ident, Default: string): string;
var
  Ini: TMemIniFile;
begin
  if not TFile.Exists(FFilePath) then
    Exit(Default);

  Ini := TMemIniFile.Create(FFilePath, TEncoding.UTF8);
  try
    Result := Ini.ReadString(Section, Ident, Default);
  finally
    Ini.Free;
  end;
end;

procedure TUsersIni.WriteString(const Section, Ident, Value: string);
var
  Ini: TMemIniFile;
begin
  Ini := TMemIniFile.Create(FFilePath, TEncoding.UTF8);
  try
    Ini.WriteString(Section, Ident, Value);
    Ini.UpdateFile;
  finally
    Ini.Free;
  end;
end;

function TUsersIni.ReadDateTime(const Section, Ident: string; Default: TDateTime): TDateTime;
var
  Ini: TMemIniFile;
begin
  if not TFile.Exists(FFilePath) then
    Exit(Default);

  Ini := TMemIniFile.Create(FFilePath, TEncoding.UTF8);
  try
    Result := Ini.ReadDateTime(Section, Ident, Default);
  finally
    Ini.Free;
  end;
end;

procedure TUsersIni.WriteDateTime(const Section, Ident: string; Value: TDateTime);
var
  Ini: TMemIniFile;
begin
  Ini := TMemIniFile.Create(FFilePath, TEncoding.UTF8);
  try
    Ini.WriteDateTime(Section, Ident, Value);
    Ini.UpdateFile;
  finally
    Ini.Free;
  end;
end;

function TUsersIni.ValueExists(const Section, Ident: string): Boolean;
var
  Ini: TMemIniFile;
begin
  if not TFile.Exists(FFilePath) then
    Exit(False);

  Ini := TMemIniFile.Create(FFilePath, TEncoding.UTF8);
  try
    Result := Ini.ValueExists(Section, Ident);
  finally
    Ini.Free;
  end;
end;

procedure TUsersIni.DeleteKey(const Section, Ident: string);
var
  Ini: TMemIniFile;
begin
  if not TFile.Exists(FFilePath) then
    Exit;

  Ini := TMemIniFile.Create(FFilePath, TEncoding.UTF8);
  try
    Ini.DeleteKey(Section, Ident);
    Ini.UpdateFile;
  finally
    Ini.Free;
  end;
end;

procedure TUsersIni.ReadSection(const Section: string; Strings: TStrings);
var
  Ini: TMemIniFile;
begin
  if not TFile.Exists(FFilePath) then
    Exit;

  Ini := TMemIniFile.Create(FFilePath, TEncoding.UTF8);
  try
    Ini.ReadSection(Section, Strings);
  finally
    Ini.Free;
  end;
end;

procedure TUsersIni.AddUser(const AUser, APassword, ARole: string; AActive: Boolean);
var
  ActiveStr: string;
  HashedPassword: string;
begin
  // Asegurar que el salt esté en el archivo
  EnsureSaltInFile;

  if AActive then
    ActiveStr := '1'
  else
    ActiveStr := '0';

  // Calcular hash de la contraseña
  HashedPassword := HashPassword(APassword);
  WriteString('Users', AUser, HashedPassword);
  WriteString('Roles', AUser, EncryptText(ARole));
  WriteString('Flags', AUser, EncryptText(ActiveStr));
end;

procedure TUsersIni.RemoveUser(const AUser: string);
begin
  DeleteKey('Users', AUser);
  DeleteKey('Roles', AUser);
  DeleteKey('Flags', AUser);
end;

function TUsersIni.CheckCredentials(const AUser, APassword: string): Boolean;
var
  StoredHash: string;
  CalculatedHash: string;
begin
  Result := False;
  StoredHash := ReadString('Users', AUser, '');
  if StoredHash = '' then
    Exit(False);

  if not IsUserActive(AUser) then
    Exit(False);

  CalculatedHash := HashPassword(APassword);
  Result := SameText(StoredHash, CalculatedHash);
end;

function TUsersIni.ChangePassword(const AUser, AOldPass, ANewPass: string): Boolean;
var
  StoredHash: string;
begin
  Result := False;
  StoredHash := ReadString('Users', AUser, '');
  if StoredHash = '' then
    Exit(False);

  if not IsUserActive(AUser) then
    Exit(False);

  if SameText(StoredHash, HashPassword(AOldPass)) then
  begin
    WriteString('Users', AUser, HashPassword(ANewPass));
    Result := True;
  end;
end;

procedure TUsersIni.ChangePasswordDirect(const AUser, ANewPass: string);
begin
  if not UserExists(AUser) then
    raise Exception.CreateFmt('El usuario "%s" no existe.', [AUser]);

  WriteString('Users', AUser, HashPassword(ANewPass));
end;

function TUsersIni.GetUserRole(const AUser: string): string;
var
  Enc: string;
begin
  Enc := ReadString('Roles', AUser, '');
  if Enc <> '' then
    Result := DecryptText(Enc)
  else
    Result := 'user';
end;

function TUsersIni.IsUserActive(const AUser: string): Boolean;
var
  Enc, Decoded: string;
begin
  Result := False;
  Enc := ReadString('Flags', AUser, '');
  if Enc <> '' then
  begin
    Decoded := DecryptText(Enc);
    Result := Decoded = '1';
  end;
end;

procedure TUsersIni.SetUserActive(const AUser: string; AActive: Boolean);
var
  FlagEnc: string;
begin
  if AActive then
    FlagEnc := EncryptText('1')
  else
    FlagEnc := EncryptText('0');
  WriteString('Flags', AUser, FlagEnc);
end;

function TUsersIni.UserExists(const AUser: string): Boolean;
begin
  Result := ValueExists('Users', AUser);
end;

function TUsersIni.ListUsers: TStrings;
var
  L: TStrings;
begin
  Result := TStringList.Create;
  L := TStringList.Create;
  try
    ReadSection('Users', L);
    Result.Assign(L);
  finally
    L.Free;
  end;
end;

{---------------------------------------------------------------}
{ TUsersIni: configuración de la base de datos                  }
{---------------------------------------------------------------}

procedure TUsersIni.SetDatabaseConfig(const DBUser, DBPassword, DBTable: string);
var
  userSection: string;
  SaltValue: string;
  EncPassword: string;
begin
  userSection := 'DBConfig';
  SaltValue := ReadString(userSection, 'Salt', '');
  if SaltValue = '' then
  begin
    SaltValue := C_DEFAULT_SALT;
    WriteString(userSection, 'Salt', SaltValue);
  end;

  EncPassword := XOREncrypt(DBPassword, SaltValue);

  WriteString(userSection, 'UserDB', DBUser);
  WriteString(userSection, 'PasswordDB', EncPassword);
  WriteString(userSection, 'NombreDB', DBTable);

  UpdateFile;
end;

procedure TUsersIni.GetDatabaseConfig(out DBUser, DBPassword, DBTable: string);
var
  userSection: string;
  EncPassword: string;
  SaltValue: string;
begin
  userSection := 'DBConfig';
  DBUser := ReadString(userSection, 'UserDB', '');
  EncPassword := ReadString(userSection, 'PasswordDB', '');
  DBTable := ReadString(userSection, 'NombreDB', '');
  SaltValue := ReadString(userSection, 'Salt', '');
  if SaltValue = '' then
    SaltValue := C_DEFAULT_SALT;

  if EncPassword <> '' then
    DBPassword := XORDecrypt(EncPassword, SaltValue)
  else
    DBPassword := '';
end;

function TUsersIni.GetLastReportDate(const AUser: string): TDateTime;
var
  LUser: string;
begin
  LUser := LowerCase(Trim(AUser));
  Result := ReadDateTime('Reportes', LUser + '_Last', 0);
end;

procedure TUsersIni.SetLastReportDate(const AUser: string; const AFecha: TDateTime);
var
  LUser: string;
begin
  LUser := LowerCase(Trim(AUser));
  WriteDateTime('Reportes', LUser + '_Last', AFecha);
end;

procedure TUsersIni.UpdateFile;
begin
  // No necesitamos hacer nada aquí ya que cada operación ya guarda los cambios
end;

procedure TUsersIni.LoadFromFile(const APath: string);
begin
  if not FileExists(APath) then
    raise Exception.Create('El archivo especificado no existe: ' + APath);

  // Copiar el archivo
  TFile.Copy(APath, FFilePath, True);

  // Asegurar que el salt sea el correcto
  EnsureSaltInFile;
end;

procedure TUsersIni.SaveToFileAs(const APath: string);
begin
  // Simplemente copiar el archivo
  if TFile.Exists(FFilePath) then
    TFile.Copy(FFilePath, APath, True);
end;

// Métodos para depuración
function TUsersIni.DebugGetStoredHash(const AUser: string): string;
begin
  Result := ReadString('Users', AUser, '');
end;

function TUsersIni.DebugGetCurrentHash(const APassword: string): string;
begin
  Result := HashPassword(APassword);
end;

function TUsersIni.DebugGetSalt: string;
begin
  Result := FGlobalSalt;
end;

end.

