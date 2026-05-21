unit uGiProySecureConfig_v1_0_3;

interface

uses
  System.SysUtils,
  System.Classes,
  System.JSON,
  System.IOUtils,
  Winapi.Windows,
  uGiProyCryptoEngine_v1_5;

type
  ESecureConfigError = class(Exception);

  TGiProySecureConfig_v1_0_3 = class
  private
    class var FBasePath: string;
    class var FFilePath: string;
    class var FKeyPath: string;
    class var FLoadedJSON: TJSONObject;

    class function GetProgramDataPath: string; static;
    class procedure EnsureFolder; static;

    class function ProtectDataDPAPI(const Data: TBytes): TBytes; static;
    class function UnprotectDataDPAPI(const Data: TBytes): TBytes; static;
    class function GenerateMasterKey: TBytes; static;
    class function GetOrCreateMasterKey: TBytes; static;

    class procedure SaveInternal(const JSON: TJSONObject); static;
    class function LoadInternal: TJSONObject; static;

  public
    class procedure Initialize; static;
    class function GetJSON: TJSONObject; static;
    class procedure Save; static;
    class procedure ResetEmpty; static;
  end;

implementation

type
  DATA_BLOB = record
    cbData: DWORD;
    pbData: PByte;
  end;

const
  MAGIC: AnsiString = 'GPS1';
  VERSION: Byte = 1;
  CRYPTPROTECT_LOCAL_MACHINE = $4;
  BCRYPT_USE_SYSTEM_PREFERRED_RNG = $00000002;

function BCryptGenRandom(
  hAlgorithm: Pointer;
  pbBuffer: PByte;
  cbBuffer: Cardinal;
  dwFlags: Cardinal
): LongInt; stdcall; external 'bcrypt.dll';

function CryptProtectData(
  pDataIn: PDATA_BLOB;
  szDataDescr: PWideChar;
  pOptionalEntropy: PDATA_BLOB;
  pvReserved: Pointer;
  pPromptStruct: Pointer;
  dwFlags: DWORD;
  pDataOut: PDATA_BLOB
): BOOL; stdcall; external 'crypt32.dll';

function CryptUnprotectData(
  pDataIn: PDATA_BLOB;
  ppszDataDescr: PPWideChar;
  pOptionalEntropy: PDATA_BLOB;
  pvReserved: Pointer;
  pPromptStruct: Pointer;
  dwFlags: DWORD;
  pDataOut: PDATA_BLOB
): BOOL; stdcall; external 'crypt32.dll';

{ ================= PATH ================= }

class function TGiProySecureConfig_v1_0_3.GetProgramDataPath: string;
begin
  Result := TPath.Combine(GetEnvironmentVariable('ProgramData'), 'GiProy');
end;

class procedure TGiProySecureConfig_v1_0_3.EnsureFolder;
begin
  if not TDirectory.Exists(FBasePath) then
    TDirectory.CreateDirectory(FBasePath);
end;

{ ================= MASTER KEY ================= }

class function TGiProySecureConfig_v1_0_3.GenerateMasterKey: TBytes;
begin
  SetLength(Result, 32);
  if BCryptGenRandom(nil, @Result[0], 32,
    BCRYPT_USE_SYSTEM_PREFERRED_RNG) <> 0 then
    raise ESecureConfigError.Create('Error generando MasterKey');
end;

class function TGiProySecureConfig_v1_0_3.ProtectDataDPAPI(
  const Data: TBytes): TBytes;
var
  InBlob, OutBlob: DATA_BLOB;
begin
  InBlob.cbData := Length(Data);
  InBlob.pbData := @Data[0];

  if not CryptProtectData(@InBlob, nil, nil, nil, nil,
    CRYPTPROTECT_LOCAL_MACHINE, @OutBlob) then
    raise ESecureConfigError.Create('DPAPI Protect error');

  SetLength(Result, OutBlob.cbData);
  Move(OutBlob.pbData^, Result[0], OutBlob.cbData);
end;

class function TGiProySecureConfig_v1_0_3.UnprotectDataDPAPI(
  const Data: TBytes): TBytes;
var
  InBlob, OutBlob: DATA_BLOB;
begin
  InBlob.cbData := Length(Data);
  InBlob.pbData := @Data[0];

  if not CryptUnprotectData(@InBlob, nil, nil, nil, nil,
    CRYPTPROTECT_LOCAL_MACHINE, @OutBlob) then
    raise ESecureConfigError.Create('DPAPI Unprotect error');

  SetLength(Result, OutBlob.cbData);
  Move(OutBlob.pbData^, Result[0], OutBlob.cbData);
end;

class function TGiProySecureConfig_v1_0_3.GetOrCreateMasterKey: TBytes;
begin
  if TFile.Exists(FKeyPath) then
    Exit(UnprotectDataDPAPI(TFile.ReadAllBytes(FKeyPath)));

  Result := GenerateMasterKey;
  TFile.WriteAllBytes(FKeyPath,
    ProtectDataDPAPI(Result));
end;

{ ================= SAVE ================= }

class procedure TGiProySecureConfig_v1_0_3.SaveInternal(
  const JSON: TJSONObject);
var
  MasterKey, Salt, IV, Cipher: TBytes;
  MS: TMemoryStream;
  TempFile: string;
begin
  MasterKey := GetOrCreateMasterKey;

  Cipher := TGiProyCryptoEngine_v1_5.EncryptData(
    TEncoding.UTF8.GetBytes(JSON.ToJSON),
    MasterKey,
    Salt,
    IV
  );

  TempFile := FFilePath + '.tmp';

  MS := TMemoryStream.Create;
  try
    MS.WriteBuffer(MAGIC[1], 4);
    MS.WriteBuffer(VERSION, SizeOf(Byte));
    MS.WriteBuffer(Salt[0], 16);
    MS.WriteBuffer(IV[0], 16);
    MS.WriteBuffer(Cipher[0], Length(Cipher));
    MS.SaveToFile(TempFile);
  finally
    MS.Free;
  end;

  if TFile.Exists(FFilePath) then
    TFile.Delete(FFilePath);

  TFile.Move(TempFile, FFilePath);
end;

{ ================= LOAD ================= }

class function TGiProySecureConfig_v1_0_3.LoadInternal: TJSONObject;
var
  MS: TMemoryStream;
  MagicRead: array[0..3] of AnsiChar;
  Ver: Byte;
  MasterKey, Salt, IV, Cipher, Plain: TBytes;
  JSONStr: string;
begin
  MS := TMemoryStream.Create;
  try
    MS.LoadFromFile(FFilePath);

    if MS.Size < (4 + 1 + 16 + 16 + 32) then
      raise ESecureConfigError.Create('Archivo corrupto');

    MS.ReadBuffer(MagicRead, 4);
    if not CompareMem(@MagicRead[0], @MAGIC[1], 4) then
      raise ESecureConfigError.Create('Magic inválido');

    MS.ReadBuffer(Ver, 1);
    if Ver <> VERSION then
      raise ESecureConfigError.Create('Versión inválida');

    MasterKey := GetOrCreateMasterKey;

    SetLength(Salt, 16);
    MS.ReadBuffer(Salt[0], 16);

    SetLength(IV, 16);
    MS.ReadBuffer(IV[0], 16);

    SetLength(Cipher, MS.Size - MS.Position);
    MS.ReadBuffer(Cipher[0], Length(Cipher));

    Plain := TGiProyCryptoEngine_v1_5.DecryptData(
      Cipher, MasterKey, Salt, IV);

    JSONStr := TEncoding.UTF8.GetString(Plain);

    Result := TJSONObject.ParseJSONValue(JSONStr) as TJSONObject;
    if not Assigned(Result) then
      raise ESecureConfigError.Create('JSON inválido');

  finally
    MS.Free;
  end;
end;

{ ================= PUBLIC ================= }

class procedure TGiProySecureConfig_v1_0_3.Initialize;
begin
  FBasePath := GetProgramDataPath;
  FFilePath := TPath.Combine(FBasePath, 'giproy.sec');
  FKeyPath  := TPath.Combine(FBasePath, 'giproy.key');

  EnsureFolder;

  if not TFile.Exists(FFilePath) then
    ResetEmpty
  else
  begin
    try
      FLoadedJSON := LoadInternal;
    except
      ResetEmpty;
    end;
  end;
end;

class function TGiProySecureConfig_v1_0_3.GetJSON: TJSONObject;
begin
  Result := FLoadedJSON;
end;

class procedure TGiProySecureConfig_v1_0_3.Save;
begin
  if Assigned(FLoadedJSON) then
    SaveInternal(FLoadedJSON);
end;

class procedure TGiProySecureConfig_v1_0_3.ResetEmpty;
begin
  FLoadedJSON := TJSONObject.Create;
  FLoadedJSON.AddPair('Root', TJSONNull.Create);
  FLoadedJSON.AddPair('Users', TJSONArray.Create);
  FLoadedJSON.AddPair('LastOnlineLoginUTC', TJSONNull.Create);
  FLoadedJSON.AddPair('OfflineAllowedUntilUTC', TJSONNull.Create);
  SaveInternal(FLoadedJSON);
end;

end.
