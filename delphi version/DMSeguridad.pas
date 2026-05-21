unit DMSeguridad;

interface

uses
        System.SysUtils, System.Classes, CryptBase, SalsaObj, System.Zip,
        System.StrUtils;

type
        TDM_Seguridad = class(TDataModule)
                SalsaEnc_Fichero: TSalsaEncryption;
        private
                { Private declarations }
        public
                { Public declarations }
        end;

var
        DM_Seguridad: TDM_Seguridad;

function descomprimeArchivoZIP2excel(const ArchivoZip: string;
  const Destino: string): string;

function desencriptafichero(nombreFichero: string): string;

function descomprimeArchivoZIP(const ArchivoZip: string;
  const Destino: string): string;

implementation

{%CLASSGROUP 'FMX.Controls.TControl'}
{$R *.dfm}

uses
        DM1, dm2, uMain;

function descomprimeArchivoZIP2excel(const ArchivoZip: string;
  const Destino: string): string;
var
        ZipFile: TZipFile;
        tmpstr: string;
begin
        result := '';
        ZipFile := TZipFile.Create;
        try
                ZipFile.Open(ArchivoZip, zmRead);
                ZipFile.ExtractAll(Destino);
                tmpstr := ChangeFileExt(ArchivoZip, '.xlsx.enc');
                // 001 - APUS - General.xlsx.enc
                tmpstr := ChangeFilePath(tmpstr, Destino);
                if FileExists(tmpstr) then
                        result := tmpstr;
                if result = '' then
                begin
                        tmpstr := ChangeFileExt(ArchivoZip, '.xls.enc');
                        tmpstr := ChangeFilePath(tmpstr, Destino);
                        if FileExists(tmpstr) then
                                result := tmpstr;
                end;
        finally
                ZipFile.Close;
                ZipFile.Free;
        end;
end;

function descomprimeArchivoZIP(const ArchivoZip: string;
  const Destino: string): string;
var
        ZipFile: TZipFile;
        tmpstr: string;
        listadoFicheros: TStringList;
begin
        result := '';
        listadoFicheros := TStringList.Create;
        ZipFile := TZipFile.Create;
        try
                ZipFile.Open(ArchivoZip, zmRead);
                ZipFile.ExtractAll(Destino);
                ArchivosDirectorio(Destino, '*.enc', listadoFicheros, True);
                tmpstr := listadoFicheros[0];
                if FileExists(tmpstr) then
                        result := tmpstr;
        finally
                ZipFile.Close;
                ZipFile.Free;
        end;
end;

function desencriptafichero(nombreFichero: string): string;
var
        fSalida: string;
begin
        result := '';
        fSalida := ReplaceStr(nombreFichero, '.enc', '');
        DM_Seguridad.SalsaEnc_Fichero.DecryptFile(nombreFichero, fSalida);
        if FileExists(fSalida) then
        begin
                result := fSalida;
        end;
        DeleteFile(nombreFichero);
end;

end.
