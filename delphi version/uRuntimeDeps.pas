unit uRuntimeDeps;

interface

uses
  System.SysUtils, System.Classes, System.IOUtils, System.Net.HttpClient,
  System.Net.HttpClientComponent, System.Net.URLClient, System.Zip;

type
  ERuntimeDepsException = class(Exception);

  TRuntimeDeps = class
  private
    class function GetExeDir: string; static;
    class function GetBaseUrl: string; static;
    class procedure EnsureDir(const ADir: string); static;
    class function DownloadFile(const AUrl, ATarget: string): Boolean; static;
    class procedure UnzipFile(const AZip, ADestDir: string); static;
    class function FindFileRecursive(const RootDir, FileName: string): string; static;
  public
    // raíz donde se instalan los runtimes: .\runtime
    class function GetRuntimeRoot: string; static;

    // carpetas específicas (devuelven la carpeta REAL que contiene el exe)
    class function GetPopplerDir: string; static;
    class function GetTesseractDir: string; static;
    class function GetOpenSSLDir: string; static;

    // aseguradores
    class procedure EnsurePopplerWin32; static;
    class procedure EnsureTesseractWin32; static;
    class procedure EnsureOpenSSLWin32; static;
  end;

implementation

{ TRuntimeDeps }

class function TRuntimeDeps.GetExeDir: string;
begin
  Result := TPath.GetFullPath(ExtractFilePath(ParamStr(0)));
end;

class function TRuntimeDeps.GetBaseUrl: string;
begin
  // ajusta si cambias dominio/ruta
  Result := 'https://app.62.171.171.124.sslip.io/';
end;

class procedure TRuntimeDeps.EnsureDir(const ADir: string);
begin
  if not TDirectory.Exists(ADir) then
    TDirectory.CreateDirectory(ADir);
end;

class function TRuntimeDeps.DownloadFile(const AUrl, ATarget: string): Boolean;
var
  Client: TNetHTTPClient;
  FS: TFileStream;
begin
  Result := False;
  Client := TNetHTTPClient.Create(nil);
  try
    Client.UserAgent := 'DelphiRuntimeDeps';
    FS := TFileStream.Create(ATarget, fmCreate);
    try
      Client.Get(AUrl, FS);
      Result := TFile.Exists(ATarget);
    finally
      FS.Free;
    end;
  finally
    Client.Free;
  end;
end;

class procedure TRuntimeDeps.UnzipFile(const AZip, ADestDir: string);
begin
  if not TFile.Exists(AZip) then
    raise ERuntimeDepsException.CreateFmt('ZIP no encontrado: %s', [AZip]);

  EnsureDir(ADestDir);
  TZipFile.ExtractZipFile(AZip, ADestDir);
end;

class function TRuntimeDeps.FindFileRecursive(const RootDir, FileName: string): string;
var
  Files: TArray<string>;
begin
  Result := '';
  if not TDirectory.Exists(RootDir) then
    Exit;

  // Busca el fichero en todas las subcarpetas
  Files := TDirectory.GetFiles(RootDir, FileName, TSearchOption.soAllDirectories);
  if Length(Files) > 0 then
    Result := ExtractFilePath(Files[0]); // carpeta donde está el exe
end;

class function TRuntimeDeps.GetRuntimeRoot: string;
begin
  Result := TPath.Combine(GetExeDir, 'runtime');
end;

class function TRuntimeDeps.GetPopplerDir: string;
var
  BaseDir, FoundDir: string;
begin
  BaseDir := TPath.Combine(GetRuntimeRoot, 'poppler-win32');
  FoundDir := FindFileRecursive(BaseDir, 'pdftotext.exe');
  if FoundDir <> '' then
    Result := ExcludeTrailingPathDelimiter(FoundDir)
  else
    Result := BaseDir; // por si acaso, pero en condiciones normales ya existe
end;

class function TRuntimeDeps.GetTesseractDir: string;
var
  BaseDir, FoundDir: string;
begin
  BaseDir := TPath.Combine(GetRuntimeRoot, 'tesseract-win32');
  FoundDir := FindFileRecursive(BaseDir, 'tesseract.exe');
  if FoundDir <> '' then
    Result := ExcludeTrailingPathDelimiter(FoundDir)
  else
    Result := BaseDir;
end;

class function TRuntimeDeps.GetOpenSSLDir: string;
begin
  // Para OpenSSL normalmente no hay subcarpetas, pero mantenemos el mismo esquema
  Result := TPath.Combine(GetRuntimeRoot, 'openssl-win32');
end;

class procedure TRuntimeDeps.EnsureOpenSSLWin32;
const
  ZIP_NAME = 'openssl-win32.zip';
  DLL_SSL = 'libssl-1_1.dll';
  DLL_CRYP = 'libcrypto-1_1.dll';
var
  TargetDir: string;
  ZipPath: string;
  Url: string;
begin
  TargetDir := GetOpenSSLDir;
  EnsureDir(TargetDir);

  if TFile.Exists(TPath.Combine(TargetDir, DLL_SSL)) and TFile.Exists(TPath.Combine(TargetDir, DLL_CRYP)) then
    Exit;

  Url := GetBaseUrl + ZIP_NAME;
  ZipPath := TPath.Combine(GetRuntimeRoot, ZIP_NAME);

  if not DownloadFile(Url, ZipPath) then
    raise ERuntimeDepsException.CreateFmt('No se pudo descargar %s', [Url]);

  UnzipFile(ZipPath, TargetDir);
  TFile.Delete(ZipPath);

  if not (TFile.Exists(TPath.Combine(TargetDir, DLL_SSL)) and TFile.Exists(TPath.Combine(TargetDir,
    DLL_CRYP))) then
    raise ERuntimeDepsException.Create('Faltan DLL de OpenSSL después de descomprimir.');
end;

class procedure TRuntimeDeps.EnsurePopplerWin32;
const
  ZIP_NAME = 'poppler-win32.zip';
  EXE_NAME = 'pdftotext.exe';
var
  TargetDir: string;
  ZipPath: string;
  Url: string;
  FoundDir: string;
begin
  TargetDir := TPath.Combine(GetRuntimeRoot, 'poppler-win32');
  EnsureDir(TargetDir);

  // ¿ya existe en alguna subcarpeta?
  FoundDir := FindFileRecursive(TargetDir, EXE_NAME);
  if FoundDir <> '' then
    Exit;

  // descargar e instalar
  Url := GetBaseUrl + ZIP_NAME;
  ZipPath := TPath.Combine(GetRuntimeRoot, ZIP_NAME);

  if not DownloadFile(Url, ZipPath) then
    raise ERuntimeDepsException.CreateFmt('No se pudo descargar %s', [Url]);

  UnzipFile(ZipPath, TargetDir);
  TFile.Delete(ZipPath);

  FoundDir := FindFileRecursive(TargetDir, EXE_NAME);
  if FoundDir = '' then
    raise ERuntimeDepsException.Create('pdftotext.exe no se encontró después de descomprimir.');
end;

class procedure TRuntimeDeps.EnsureTesseractWin32;
const
  ZIP_NAME = 'tesseract-win32.zip';
  EXE_NAME = 'tesseract.exe';
var
  TargetDir: string;
  ZipPath: string;
  Url: string;
  FoundDir: string;
begin
  TargetDir := TPath.Combine(GetRuntimeRoot, 'tesseract-win32');
  EnsureDir(TargetDir);

  FoundDir := FindFileRecursive(TargetDir, EXE_NAME);
  if FoundDir <> '' then
    Exit;

  Url := GetBaseUrl + ZIP_NAME;
  ZipPath := TPath.Combine(GetRuntimeRoot, ZIP_NAME);

  if not DownloadFile(Url, ZipPath) then
    raise ERuntimeDepsException.CreateFmt('No se pudo descargar %s', [Url]);

  UnzipFile(ZipPath, TargetDir);
  TFile.Delete(ZipPath);

  FoundDir := FindFileRecursive(TargetDir, EXE_NAME);
  if FoundDir = '' then
    raise ERuntimeDepsException.Create('tesseract.exe no se encontró después de descomprimir.');
end;

end.

