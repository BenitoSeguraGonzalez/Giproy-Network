unit uGiProyCryptoEngine_v1_5;

interface

uses
  System.SysUtils,
  Winapi.Windows;

type
  ECryptoError = class(Exception);

  TGiProyCryptoEngine_v1_5 = class sealed
  private
    class procedure CheckNtStatus(Status: LongInt; const Msg: string); static;
    class function DeriveKeys(const MachineKey, Salt: TBytes): TBytes; static;
  public
    class function EncryptData(
      const PlainData, MachineKey: TBytes;
      out Salt, IV: TBytes
    ): TBytes; static;

    class function DecryptData(
      const EncryptedData, MachineKey, Salt, IV: TBytes
    ): TBytes; static;
  end;

implementation

type
  NTSTATUS = LongInt;
  BCRYPT_ALG_HANDLE = Pointer;
  BCRYPT_KEY_HANDLE = Pointer;
  BCRYPT_HASH_HANDLE = Pointer;

const
  BCRYPT_ALG_HANDLE_HMAC_FLAG = $00000008;
  BCRYPT_BLOCK_PADDING        = $00000001;
  BCRYPT_USE_SYSTEM_PREFERRED_RNG = $00000002;
  BCRYPT_OBJECT_LENGTH        = 'ObjectLength';
  BCRYPT_CHAINING_MODE        = 'ChainingMode';
  BCRYPT_CHAIN_MODE_CBC       = 'ChainingModeCBC';

function BCryptOpenAlgorithmProvider(phAlgorithm: Pointer; pszAlgId: PWideChar;
  pszImplementation: PWideChar; dwFlags: Cardinal): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptCloseAlgorithmProvider(hAlgorithm: Pointer;
  dwFlags: Cardinal): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptGetProperty(hObject: Pointer; pszProperty: PWideChar;
  pbOutput: PByte; cbOutput: Cardinal; pcbResult: PCardinal;
  dwFlags: Cardinal): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptSetProperty(hObject: Pointer; pszProperty: PWideChar;
  pbInput: PByte; cbInput: Cardinal; dwFlags: Cardinal): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptGenRandom(hAlgorithm: Pointer; pbBuffer: PByte;
  cbBuffer: Cardinal; dwFlags: Cardinal): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptDeriveKeyPBKDF2(hPrf: Pointer; pbPassword: PByte;
  cbPassword: Cardinal; pbSalt: PByte; cbSalt: Cardinal; cIterations: UInt64;
  pbDerivedKey: PByte; cbDerivedKey: Cardinal; dwFlags: Cardinal): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptGenerateSymmetricKey(hAlgorithm: Pointer;
  phKey: Pointer; pbKeyObject: PByte; cbKeyObject: Cardinal;
  pbSecret: PByte; cbSecret: Cardinal; dwFlags: Cardinal): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptEncrypt(hKey: Pointer; pbInput: PByte; cbInput: Cardinal;
  pPaddingInfo: Pointer; pbIV: PByte; cbIV: Cardinal; pbOutput: PByte;
  cbOutput: Cardinal; pcbResult: PCardinal; dwFlags: Cardinal): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptDecrypt(hKey: Pointer; pbInput: PByte; cbInput: Cardinal;
  pPaddingInfo: Pointer; pbIV: PByte; cbIV: Cardinal; pbOutput: PByte;
  cbOutput: Cardinal; pcbResult: PCardinal; dwFlags: Cardinal): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptDestroyKey(hKey: Pointer): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptCreateHash(hAlgorithm: Pointer; phHash: Pointer;
  pbHashObject: PByte; cbHashObject: Cardinal; pbSecret: PByte;
  cbSecret: Cardinal; dwFlags: Cardinal): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptHashData(hHash: Pointer; pbInput: PByte;
  cbInput: Cardinal; dwFlags: Cardinal): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptFinishHash(hHash: Pointer; pbOutput: PByte;
  cbOutput: Cardinal; dwFlags: Cardinal): NTSTATUS; stdcall; external 'bcrypt.dll';

function BCryptDestroyHash(hHash: Pointer): NTSTATUS; stdcall; external 'bcrypt.dll';

{ ================= UTIL ================= }

class procedure TGiProyCryptoEngine_v1_5.CheckNtStatus(
  Status: LongInt; const Msg: string);
begin
  if Status <> 0 then
    raise ECryptoError.Create(Msg + ' NTSTATUS=' + IntToHex(Status,8));
end;

class function TGiProyCryptoEngine_v1_5.DeriveKeys(
  const MachineKey, Salt: TBytes): TBytes;
var
  Alg: Pointer;
begin
  SetLength(Result, 64);

  CheckNtStatus(
    BCryptOpenAlgorithmProvider(@Alg,'SHA256',nil,
      BCRYPT_ALG_HANDLE_HMAC_FLAG),
    'PBKDF2 Open');

  try
    CheckNtStatus(
      BCryptDeriveKeyPBKDF2(
        Alg,
        @MachineKey[0],Length(MachineKey),
        @Salt[0],Length(Salt),
        150000,
        @Result[0],64,
        0),
      'PBKDF2 Derive');
  finally
    BCryptCloseAlgorithmProvider(Alg,0);
  end;
end;

{ ================= ENCRYPT ================= }

class function TGiProyCryptoEngine_v1_5.EncryptData(
  const PlainData, MachineKey: TBytes;
  out Salt, IV: TBytes): TBytes;
var
  Keys, AESKey, HMACKey: TBytes;
  Alg: Pointer;
  KeyHandle: Pointer;
  KeyObjLen, ResLen: Cardinal;
  KeyObj: TBytes;
  Cipher, HMAC: TBytes;
  HashAlg, HashHandle: Pointer;
  IVLocal: TBytes;
begin
  SetLength(Salt,16);
  CheckNtStatus(
    BCryptGenRandom(nil,@Salt[0],16,
      BCRYPT_USE_SYSTEM_PREFERRED_RNG),
    'GenRandom Salt');

  SetLength(IV,16);
  CheckNtStatus(
    BCryptGenRandom(nil,@IV[0],16,
      BCRYPT_USE_SYSTEM_PREFERRED_RNG),
    'GenRandom IV');

  Keys := DeriveKeys(MachineKey,Salt);
  AESKey := Copy(Keys,0,32);
  HMACKey := Copy(Keys,32,32);

  CheckNtStatus(
    BCryptOpenAlgorithmProvider(@Alg,'AES',nil,0),
    'AES Open');

  try
    // Modo CBC obligatorio
    CheckNtStatus(
      BCryptSetProperty(
        Alg,
        BCRYPT_CHAINING_MODE,
        PByte(PWideChar(BCRYPT_CHAIN_MODE_CBC)),
        Length(BCRYPT_CHAIN_MODE_CBC)*2,
        0),
      'Set CBC');

    // Obtener tamaño real de KeyObject
    CheckNtStatus(
      BCryptGetProperty(
        Alg,
        BCRYPT_OBJECT_LENGTH,
        @KeyObjLen,
        SizeOf(KeyObjLen),
        @ResLen,
        0),
      'Get ObjectLength');

    SetLength(KeyObj,KeyObjLen);

    CheckNtStatus(
      BCryptGenerateSymmetricKey(
        Alg,
        @KeyHandle,
        @KeyObj[0],
        KeyObjLen,
        @AESKey[0],
        32,
        0),
      'Generate Key');

    IVLocal := Copy(IV,0,16);

    BCryptEncrypt(KeyHandle,
      @PlainData[0],Length(PlainData),
      nil,@IVLocal[0],16,
      nil,0,@ResLen,
      BCRYPT_BLOCK_PADDING);

    SetLength(Cipher,ResLen);

    IVLocal := Copy(IV,0,16);

    CheckNtStatus(
      BCryptEncrypt(KeyHandle,
        @PlainData[0],Length(PlainData),
        nil,@IVLocal[0],16,
        @Cipher[0],ResLen,@ResLen,
        BCRYPT_BLOCK_PADDING),
      'Encrypt');

    SetLength(Cipher,ResLen);
    BCryptDestroyKey(KeyHandle);
  finally
    BCryptCloseAlgorithmProvider(Alg,0);
  end;

  // HMAC
  CheckNtStatus(
    BCryptOpenAlgorithmProvider(@HashAlg,'SHA256',nil,
      BCRYPT_ALG_HANDLE_HMAC_FLAG),
    'HMAC Open');

  try
    CheckNtStatus(
      BCryptCreateHash(HashAlg,@HashHandle,
        nil,0,@HMACKey[0],32,0),
      'CreateHash');

    BCryptHashData(HashHandle,@Salt[0],16,0);
    BCryptHashData(HashHandle,@IV[0],16,0);
    BCryptHashData(HashHandle,@Cipher[0],Length(Cipher),0);

    SetLength(HMAC,32);
    BCryptFinishHash(HashHandle,@HMAC[0],32,0);
    BCryptDestroyHash(HashHandle);
  finally
    BCryptCloseAlgorithmProvider(HashAlg,0);
  end;

  Result := Cipher + HMAC;
end;

{ ================= DECRYPT ================= }

class function TGiProyCryptoEngine_v1_5.DecryptData(
  const EncryptedData, MachineKey, Salt, IV: TBytes): TBytes;
var
  Keys, AESKey, HMACKey: TBytes;
  Cipher, StoredHMAC, CalcHMAC: TBytes;
  HashAlg, HashHandle: Pointer;
  Alg, KeyHandle: Pointer;
  KeyObjLen, ResLen: Cardinal;
  KeyObj: TBytes;
  IVLocal: TBytes;
begin
  if Length(EncryptedData) < 32 then
    raise ECryptoError.Create('Datos inválidos');

  SetLength(Cipher,Length(EncryptedData)-32);
  Move(EncryptedData[0],Cipher[0],Length(Cipher));

  SetLength(StoredHMAC,32);
  Move(EncryptedData[Length(Cipher)],StoredHMAC[0],32);

  Keys := DeriveKeys(MachineKey,Salt);
  AESKey := Copy(Keys,0,32);
  HMACKey := Copy(Keys,32,32);

  // Verificar HMAC
  CheckNtStatus(
    BCryptOpenAlgorithmProvider(@HashAlg,'SHA256',nil,
      BCRYPT_ALG_HANDLE_HMAC_FLAG),
    'HMAC Open');

  try
    CheckNtStatus(
      BCryptCreateHash(HashAlg,@HashHandle,
        nil,0,@HMACKey[0],32,0),
      'CreateHash');

    BCryptHashData(HashHandle,@Salt[0],16,0);
    BCryptHashData(HashHandle,@IV[0],16,0);
    BCryptHashData(HashHandle,@Cipher[0],Length(Cipher),0);

    SetLength(CalcHMAC,32);
    BCryptFinishHash(HashHandle,@CalcHMAC[0],32,0);
    BCryptDestroyHash(HashHandle);
  finally
    BCryptCloseAlgorithmProvider(HashAlg,0);
  end;

  if not CompareMem(@StoredHMAC[0],@CalcHMAC[0],32) then
    raise ECryptoError.Create('HMAC inválido');

  CheckNtStatus(
    BCryptOpenAlgorithmProvider(@Alg,'AES',nil,0),
    'AES Open');

  try
    CheckNtStatus(
      BCryptSetProperty(
        Alg,
        BCRYPT_CHAINING_MODE,
        PByte(PWideChar(BCRYPT_CHAIN_MODE_CBC)),
        Length(BCRYPT_CHAIN_MODE_CBC)*2,
        0),
      'Set CBC');

    CheckNtStatus(
      BCryptGetProperty(
        Alg,
        BCRYPT_OBJECT_LENGTH,
        @KeyObjLen,
        SizeOf(KeyObjLen),
        @ResLen,
        0),
      'Get ObjectLength');

    SetLength(KeyObj,KeyObjLen);

    CheckNtStatus(
      BCryptGenerateSymmetricKey(
        Alg,@KeyHandle,
        @KeyObj[0],KeyObjLen,
        @AESKey[0],32,0),
      'Generate Key');

    IVLocal := Copy(IV,0,16);

    BCryptDecrypt(KeyHandle,
      @Cipher[0],Length(Cipher),
      nil,@IVLocal[0],16,
      nil,0,@ResLen,
      BCRYPT_BLOCK_PADDING);

    SetLength(Result,ResLen);

    IVLocal := Copy(IV,0,16);

    CheckNtStatus(
      BCryptDecrypt(KeyHandle,
        @Cipher[0],Length(Cipher),
        nil,@IVLocal[0],16,
        @Result[0],ResLen,@ResLen,
        BCRYPT_BLOCK_PADDING),
      'Decrypt');

    SetLength(Result,ResLen);
    BCryptDestroyKey(KeyHandle);
  finally
    BCryptCloseAlgorithmProvider(Alg,0);
  end;
end;

end.
