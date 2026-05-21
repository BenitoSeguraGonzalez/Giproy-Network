unit uFiscalDigits;

interface

uses
  System.SysUtils, System.Character, System.Generics.Collections, System.StrUtils, System.JSON,
  System.Net.URLClient, System.Net.HttpClient, System.Net.HttpClientComponent, System.Types,
  FMX.Types, System.UITypes, System.NetEncoding, System.DateUtils;

const
  URL_WebServiceRucEC = 'https://webservices.ec/api/ruc/';



type
  dat_RUC = record
    nRuc: string;
    Nombre: string;
    Apellidos: string;
    RazonSocial: string;
    Estado: string;
    direccion: string;
    Ciudad: string;
    Provincia: string;
  end;

type
  TFiscalDigitRule = record
    MinDigits: Integer;
    MaxDigits: Integer;
    HasAlphaCheck: Boolean; // p.ej. verificador 'K' en CL
    Comment: string; // nota opcional
  end;
        { ------------------------------------------------------------------------------------
          Modo de empleo:


          var
          R: TFiscalDigitRule;
          Ok: Boolean;
          begin
          Ok := GetFiscalDigitsRule('Chile', R);
          // R.MinDigits=7; R.MaxDigits=9; R.HasAlphaCheck=True; R.Comment='CL: RUT...'

          if FiscalIdMatchesDigitsForCountry('España', '12345678Z', R) then
          ShowMessage('Dígitos OK para ES (' + R.Comment + ')')
          else
          ShowMessage('Número de dígitos no válido para ES (' + R.Comment + ')');
          end;

          ------------------------------------------------------------------------------------ }
        /// Normaliza nombre de país a ISO-2 (como en tu PHP) y devuelve True si reconocido.
        /// Acepta variantes tipo "España", "SPAIN", "United States", etc.

function NormalizeCountryToISO2(const Country: string; out ISO2: string): Boolean;

/// Dado un país (nombre libre o ISO-2), devuelve la regla de dígitos esperada.
/// Si no hay una regla específica, devuelve la genérica (8..20).
function GetFiscalDigitsRule(const Country: string; out Rule: TFiscalDigitRule): Boolean;

/// Cuenta solo dígitos (0-9) en una cadena.
function CountDigitsOnly(const S: string): Integer;

/// Comprueba si un identificador cumple la regla de dígitos del país.
/// Devuelve False si el país no es reconocido (pero aún así aplica la regla genérica).
function FiscalIdMatchesDigitsForCountry(const Country, Ident: string; out Rule: TFiscalDigitRule): Boolean;


implementation

function StripDiacritics(const S: string): string;
type
  TCharMap = record
    Key: Char;
    Value: Char;
  end;
const
        // Mapeo mínimo para mayúsculas/acentos frecuentes en ES/PT/FR
  REPL: array[0..6] of TCharMap = ((
    Key: 'Á';
    Value: 'A'
  ), (
    Key: 'É';
    Value: 'E'
  ), (
    Key: 'Í';
    Value: 'I'
  ), (
    Key: 'Ó';
    Value: 'O'
  ), (
    Key: 'Ú';
    Value: 'U'
  ), (
    Key: 'Ñ';
    Value: 'N'
  ), (
    Key: 'Ç';
    Value: 'C'
  ));
var
  C: Char;
  I: Integer;
begin
  Result := S.ToUpper.Trim;
  for I := Low(REPL) to High(REPL) do
    Result := Result.Replace(string(REPL[I].Key), string(REPL[I].Value), [rfReplaceAll]);
end;

function NormalizeCountryToISO2(const Country: string; out ISO2: string): Boolean;
var
  P: string;
  Map: TDictionary<string, string>;

  procedure Add(const Key, Val: string);
  begin
    Map.AddOrSetValue(Key, Val);
  end;

begin
  Map := TDictionary<string, string>.Create;
  try
                // América
    Add('ECUADOR', 'EC');
    Add('ESTADOS UNIDOS', 'US');
    Add('UNITED STATES', 'US');
    Add('MEXICO', 'MX');
    Add('BRASIL', 'BR');
    Add('BRASIL/BRASIL', 'BR');
    Add('ARGENTINA', 'AR');
    Add('BOLIVIA', 'BO');
    Add('CHILE', 'CL');
    Add('COLOMBIA', 'CO');
    Add('COSTA RICA', 'CR');
    Add('CUBA', 'CU');
    Add('REPUBLICA DOMINICANA', 'DO');
    Add('DOMINICAN REPUBLIC', 'DO');
    Add('EL SALVADOR', 'SV');
    Add('GUATEMALA', 'GT');
    Add('HONDURAS', 'HN');
    Add('NICARAGUA', 'NI');
    Add('PANAMA', 'PA');
    Add('PARAGUAY', 'PY');
    Add('PERU', 'PE');
    Add('PUERTO RICO', 'PR');
    Add('URUGUAY', 'UY');
    Add('VENEZUELA', 'VE');
    Add('CANADA', 'CA');

                // Europa
    Add('ESPANA', 'ES');
    Add('SPAIN', 'ES');
    Add('REINO UNIDO', 'UK');
    Add('UNITED KINGDOM', 'UK');
    Add('ALEMANIA', 'DE');
    Add('GERMANY', 'DE');
    Add('PORTUGAL', 'PT');
    Add('ITALIA', 'IT');
    Add('ITALY', 'IT');
    Add('FRANCIA', 'FR');
    Add('FRANCE', 'FR');
    Add('PAISES BAJOS', 'NL');
    Add('HOLANDA', 'NL');
    Add('NETHERLANDS', 'NL');
    Add('SUECIA', 'SE');
    Add('SWEDEN', 'SE');
    Add('DINAMARCA', 'DK');
    Add('DENMARK', 'DK');
    Add('FINLANDIA', 'FI');
    Add('FINLAND', 'FI');
    Add('POLONIA', 'PL');
    Add('POLAND', 'PL');
    Add('IRLANDA', 'IE');
    Add('IRELAND', 'IE');
    Add('RUMANIA', 'RO');
    Add('ROMANIA', 'RO');
    Add('BELGICA', 'BE');
    Add('BELGIUM', 'BE');
    Add('SUIZA', 'CH');
    Add('SWITZERLAND', 'CH');
    Add('AUSTRIA', 'AT');
    Add('CHEQUIA', 'CZ');
    Add('REPUBLICA CHECA', 'CZ');
    Add('CZECHIA', 'CZ');
    Add('ESLOVAQUIA', 'SK');
    Add('SLOVAKIA', 'SK');
    Add('ESLOVENIA', 'SI');
    Add('SLOVENIA', 'SI');
    Add('HUNGRIA', 'HU');
    Add('HUNGARY', 'HU');
    Add('GRECIA', 'GR');
    Add('GREECE', 'GR');
    Add('LETONIA', 'LV');
    Add('LATVIA', 'LV');
    Add('LITUANIA', 'LT');
    Add('LITHUANIA', 'LT');
    Add('LUXEMBURGO', 'LU');
    Add('LUXEMBOURG', 'LU');
    Add('MALTA', 'MT');
    Add('NORUEGA', 'NO');
    Add('NORWAY', 'NO');

    P := StripDiacritics(Country);
                // Si ya viene como ISO-2 probable:
    if (Length(P) = 2) and (P.ToUpper = P) then
    begin
      ISO2 := P;
      Exit(True);
    end;

    Result := Map.TryGetValue(P, ISO2);
  finally
    Map.Free;
  end;
end;

function GetFiscalDigitsRule(const Country: string; out Rule: TFiscalDigitRule): Boolean;
var
  ISO: string;
begin
        // Regla genérica por defecto
  Rule.MinDigits := 8;
  Rule.MaxDigits := 20;
  Rule.HasAlphaCheck := False;
  Rule.Comment := 'Regla genérica';

  Result := NormalizeCountryToISO2(Country, ISO);

  if not Result then
    Exit(False); // país no reconocido, se mantiene genérica

        // Mapeo según tu PHP (longitudes de dígitos, ignorando separadores)
  if ISO = 'AR' then
  begin
    Rule.MinDigits := 11;
    Rule.MaxDigits := 11;
    Rule.Comment := 'AR: CUIT/CUIL 11 dígitos';
    Exit(True);
  end;
  if ISO = 'BO' then
  begin
    Rule.MinDigits := 5;
    Rule.MaxDigits := 12;
    Rule.Comment := 'BO: NIT 5–12';
    Exit(True);
  end;
  if ISO = 'BR' then
  begin
    Rule.MinDigits := 11;
    Rule.MaxDigits := 14;
    Rule.Comment := 'BR: CPF 11 o CNPJ 14';
    Exit(True);
  end;
  if ISO = 'CA' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 9;
    Rule.Comment := 'CA: SIN 9';
    Exit(True);
  end;
  if ISO = 'CL' then
  begin
    Rule.MinDigits := 7;
    Rule.MaxDigits := 9;
    Rule.HasAlphaCheck := True;
    Rule.Comment := 'CL: RUT 7–8 + verificador (puede ser K)';
    Exit(True);
  end;
  if ISO = 'CO' then
  begin
    Rule.MinDigits := 7;
    Rule.MaxDigits := 12;
    Rule.Comment := 'CO: NIT 7–12';
    Exit(True);
  end;
  if ISO = 'CR' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 12;
    Rule.Comment := 'CR: 9–12';
    Exit(True);
  end;
  if ISO = 'CU' then
  begin
    Rule.MinDigits := 11;
    Rule.MaxDigits := 11;
    Rule.Comment := 'CU: 11';
    Exit(True);
  end;
  if ISO = 'DO' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 11;
    Rule.Comment := 'DO: cédula 11 o RNC 9';
    Exit(True);
  end;
  if ISO = 'EC' then
  begin
    Rule.MinDigits := 10;
    Rule.MaxDigits := 13;
    Rule.Comment := 'EC: cédula 10 o RUC 13';
    Exit(True);
  end;
  if ISO = 'SV' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 14;
    Rule.Comment := 'SV: DUI 9 (8+1) o NIT 14';
    Exit(True);
  end;
  if ISO = 'GT' then
  begin
    Rule.MinDigits := 6;
    Rule.MaxDigits := 10;
    Rule.Comment := 'GT: NIT 6–10 (verificador opcional)';
    Exit(True);
  end;
  if ISO = 'HN' then
  begin
    Rule.MinDigits := 14;
    Rule.MaxDigits := 14;
    Rule.Comment := 'HN: RTN 14';
    Exit(True);
  end;
  if ISO = 'MX' then
  begin
    Rule.MinDigits := 12;
    Rule.MaxDigits := 18;
    Rule.HasAlphaCheck := True;
    Rule.Comment := 'MX: RFC 12/13 o CURP 18 (alfa-num)';
    Exit(True);
  end;
  if ISO = 'NI' then
  begin
    Rule.MinDigits := 14;
    Rule.MaxDigits := 14;
    Rule.HasAlphaCheck := True;
    Rule.Comment := 'NI: cédula 14 (puede llevar sufijo alfanumérico)';
    Exit(True);
  end;
  if ISO = 'PA' then
  begin
    Rule.MinDigits := 8;
    Rule.MaxDigits := 20;
    Rule.Comment := 'PA: 8–20';
    Exit(True);
  end;
  if ISO = 'PY' then
  begin
    Rule.MinDigits := 7;
    Rule.MaxDigits := 10;
    Rule.Comment := 'PY: RUC 6–9 + dígito (≈7–10 dígitos)';
    Exit(True);
  end;
  if ISO = 'PE' then
  begin
    Rule.MinDigits := 11;
    Rule.MaxDigits := 11;
    Rule.Comment := 'PE: RUC 11';
    Exit(True);
  end;
  if ISO = 'PR' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 9;
    Rule.Comment := 'PR: 9';
    Exit(True);
  end;
  if ISO = 'UY' then
  begin
    Rule.MinDigits := 12;
    Rule.MaxDigits := 12;
    Rule.Comment := 'UY: RUT 12';
    Exit(True);
  end;
  if ISO = 'VE' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 10;
    Rule.HasAlphaCheck := True;
    Rule.Comment := 'VE: prefijo letra + 8 + dígito (≈9–10 con separadores)';
    Exit(True);
  end;
  if ISO = 'US' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 9;
    Rule.Comment := 'US: SSN 9';
    Exit(True);
  end;

        // Europa
  if ISO = 'AT' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 9;
    Rule.Comment := 'AT: 9 o VAT ATU######## (9 dígitos)';
    Exit(True);
  end;
  if ISO = 'BE' then
  begin
    Rule.MinDigits := 10;
    Rule.MaxDigits := 11;
    Rule.Comment := 'BE: 10–11';
    Exit(True);
  end;
  if ISO = 'CH' then
  begin
    Rule.MinDigits := 11;
    Rule.MaxDigits := 13;
    Rule.Comment := 'CH: 11–13 o CHE#########X';
    Exit(True);
  end;
  if ISO = 'CZ' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 10;
    Rule.Comment := 'CZ: 6 + 3/4 => 9–10';
    Exit(True);
  end;
  if ISO = 'DE' then
  begin
    Rule.MinDigits := 11;
    Rule.MaxDigits := 11;
    Rule.Comment := 'DE: 11';
    Exit(True);
  end;
  if ISO = 'DK' then
  begin
    Rule.MinDigits := 10;
    Rule.MaxDigits := 10;
    Rule.Comment := 'DK: 6+4 => 10';
    Exit(True);
  end;
  if ISO = 'EE' then
  begin
    Rule.MinDigits := 11;
    Rule.MaxDigits := 11;
    Rule.Comment := 'EE: 11';
    Exit(True);
  end;
  if ISO = 'ES' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 9;
    Rule.HasAlphaCheck := True;
    Rule.Comment := 'ES: DNI/NIE/CIF 9 (letra)';
    Exit(True);
  end;
  if ISO = 'FI' then
  begin
    Rule.MinDigits := 10;
    Rule.MaxDigits := 10;
    Rule.HasAlphaCheck := True;
    Rule.Comment := 'FI: HETU 6+1+3+1 => 11 con separador; 10 dígitos';
    Exit(True);
  end;
  if ISO = 'FR' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 15;
    Rule.Comment := 'FR: SIREN 9, SIRET 14, NIR 15';
    Exit(True);
  end;
  if ISO = 'GR' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 9;
    Rule.Comment := 'GR: AFM 9';
    Exit(True);
  end;
  if ISO = 'IE' then
  begin
    Rule.MinDigits := 7;
    Rule.MaxDigits := 9;
    Rule.HasAlphaCheck := True;
    Rule.Comment := 'IE: 7 dígitos + 1–2 letras';
    Exit(True);
  end;
  if ISO = 'IT' then
  begin
    Rule.MinDigits := 11;
    Rule.MaxDigits := 16;
    Rule.HasAlphaCheck := True;
    Rule.Comment := 'IT: P.IVA 11 o CF 16 alfanum.';
    Exit(True);
  end;
  if ISO = 'LT' then
  begin
    Rule.MinDigits := 11;
    Rule.MaxDigits := 11;
    Rule.Comment := 'LT: 11';
    Exit(True);
  end;
  if ISO = 'LU' then
  begin
    Rule.MinDigits := 11;
    Rule.MaxDigits := 13;
    Rule.Comment := 'LU: 11–13';
    Exit(True);
  end;
  if ISO = 'LV' then
  begin
    Rule.MinDigits := 11;
    Rule.MaxDigits := 11;
    Rule.Comment := 'LV: 11';
    Exit(True);
  end;
  if ISO = 'MT' then
  begin
    Rule.MinDigits := 8;
    Rule.MaxDigits := 8;
    Rule.HasAlphaCheck := True;
    Rule.Comment := 'MT: 8 alfanum.';
    Exit(True);
  end;
  if ISO = 'NL' then
  begin
    Rule.MinDigits := 8;
    Rule.MaxDigits := 9;
    Rule.Comment := 'NL: BSN 8–9 (VAT: NL#########B##)';
    Exit(True);
  end;
  if ISO = 'NO' then
  begin
    Rule.MinDigits := 11;
    Rule.MaxDigits := 11;
    Rule.Comment := 'NO: 11';
    Exit(True);
  end;
  if ISO = 'PL' then
  begin
    Rule.MinDigits := 10;
    Rule.MaxDigits := 11;
    Rule.Comment := 'PL: NIP 10 / PESEL 11';
    Exit(True);
  end;
  if ISO = 'PT' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 9;
    Rule.Comment := 'PT: NIF 9';
    Exit(True);
  end;
  if ISO = 'RO' then
  begin
    Rule.MinDigits := 13;
    Rule.MaxDigits := 13;
    Rule.Comment := 'RO: CNP 13';
    Exit(True);
  end;
  if ISO = 'SE' then
  begin
    Rule.MinDigits := 10;
    Rule.MaxDigits := 12;
    Rule.Comment := 'SE: 12 o 6+4 => 10–12';
    Exit(True);
  end;
  if ISO = 'SI' then
  begin
    Rule.MinDigits := 8;
    Rule.MaxDigits := 13;
    Rule.Comment := 'SI: 8 o 13';
    Exit(True);
  end;
  if ISO = 'SK' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 10;
    Rule.Comment := 'SK: 6 + 3/4 => 9–10';
    Exit(True);
  end;
  if ISO = 'UK' then
  begin
    Rule.MinDigits := 9;
    Rule.MaxDigits := 10;
    Rule.HasAlphaCheck := True;
    Rule.Comment := 'UK: NINO 2 letras + 6 dígitos + 1 letra / UTR 10';
    Exit(True);
  end;

        // Si llegó aquí, conserva genérica
end;

function CountDigitsOnly(const S: string): Integer;
var
  C: Char;
begin
  Result := 0;
  for C in S do
    if C.IsDigit then
      Inc(Result);
end;

function FiscalIdMatchesDigitsForCountry(const Country, Ident: string; out Rule: TFiscalDigitRule): Boolean;
var
  Digits: Integer;
  Known: Boolean;
  x: Integer;
  tmpstr: string;
begin
  Known := GetFiscalDigitsRule(Country, Rule);
  Digits := CountDigitsOnly(Ident);
  Result := (Digits >= Rule.MinDigits) and (Digits <= Rule.MaxDigits);
        // Casos especiales por pais
  if (Result) and (Country = 'EC') then
  begin
    tmpstr := ReverseString(Ident);
    tmpstr := Copy(tmpstr, 1, 3);
    if tmpstr <> '100' then
      Result := False
    else
      Result := True;
  end;

        // Nota: Result solo mira dígitos, no formato (guiones/letras). Para validación completa,
        // habría que aplicar regex por país como en tu PHP.
end;


end.

