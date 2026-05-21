unit uPdfTool;

interface

uses
  System.SysUtils, System.Classes, System.JSON, System.StrUtils, System.IOUtils, System.DateUtils,
  Winapi.Windows, System.Math, Winsoft.FireMonkey.PDFium, uRuntimeDeps;

type
  EPdfToolError = class(Exception);

{----------------------------------------------------------------------------
  Función PRINCIPAL
  Intenta extraer texto. Si el PDF es solo imagen (sin texto seleccionable),
  usa OCR automáticamente.
----------------------------------------------------------------------------}
function Pdf2Json(const APdfPath: string; out AJsonRespuesta, AError: string): Boolean;

implementation

{==============================================================================}
{                              Helpers de Texto                                }
{==============================================================================}

function CleanStr(const S: string): string;
begin
  Result := Trim(S);
  Result := StringReplace(Result, #0, '', [rfReplaceAll]);
end;

function OnlyDigits(const S: string): string;
var
  i: Integer;
begin
  Result := '';
  for i := 1 to Length(S) do
    if S[i] in ['0'..'9'] then
      Result := Result + S[i];
end;

function TextToLines(const AText: string): TStringList;
begin
  Result := TStringList.Create;
  Result.Text := AText;
end;

function ExtractBetween(const Line, StartTag, EndTag: string): string;
var
  P1, P2: Integer;
  Temp: string;
begin
  Result := '';
  P1 := Pos(UpperCase(StartTag), UpperCase(Line));
  if P1 > 0 then
  begin
    Temp := Copy(Line, P1 + Length(StartTag), MaxInt);
    if EndTag <> '' then
    begin
      P2 := Pos(UpperCase(EndTag), UpperCase(Temp));
      if P2 > 0 then
        Temp := Copy(Temp, 1, P2 - 1);
    end;
    Result := Trim(Temp);
  end;
end;

function PrettyPrintJson(const AJson: string): string;
var
  JO: TJSONObject;
begin
  try
    JO := TJSONObject.ParseJSONValue(AJson) as TJSONObject;
    if Assigned(JO) then
    try
      Result := JO.Format(2);
    finally
      JO.Free;
    end
    else
      Result := AJson;
  except
    Result := AJson;
  end;
end;

{==============================================================================}
{                    Parser MEJORADO para PDFs con TEXTO DIGITAL             }
{==============================================================================}

function ExtractRUC_Digital(const SL: TStringList): string;
var
  i: Integer;
begin
  Result := '';

  // Buscar "Número RUC" en cualquier posición de la línea
  for i := 0 to SL.Count - 1 do
  begin
    var Line := SL[i];
    if Pos('Número RUC', Line) > 0 then
    begin
      // Buscar en la misma línea después de "Número RUC"
      var RucPos := Pos('Número RUC', Line);
      var NextLine := SL[i + 1];
      Result := OnlyDigits(NextLine);
      if Length(Result) = 13 then
        Exit;

      // Si no está en la misma línea, buscar en línea siguiente
      if (i < SL.Count - 1) then
      begin
        Result := OnlyDigits(Trim(SL[i + 1]));
        if Length(Result) = 13 then
          Exit;
      end;
    end;
  end;

  // Fallback: buscar 13 dígitos
  for i := 0 to SL.Count - 1 do
  begin
    var Digits := OnlyDigits(SL[i]);
    if (Length(Digits) = 13) and (Digits[1] in ['0'..'2']) then
      Exit(Digits);
  end;
end;

function ExtractNombre_Digital(const SL: TStringList): string;
var
  i: Integer;
begin
  Result := '';

  // Buscar "Apellidos y nombres" en cualquier posición
  for i := 0 to SL.Count - 1 do
  begin
    var Line := SL[i];
    if Pos('Apellidos y nombres', Line) > 0 then
    begin
      var AntLine := SL[i - 1];
      Result := AntLine.Trim;
      exit;
    end;
  end;

  // Si no encontramos con el método anterior, buscar línea con patrón de nombre
  for i := 0 to SL.Count - 1 do
  begin
    var Line := Trim(SL[i]);
    // Un nombre típico tiene al menos 2 palabras y más de 8 caracteres
    if (Length(Line) > 8) and (Pos(' ', Line) > 0) then
    begin
      var WordCount := 0;
      var Words := TStringList.Create;
      try
        Words.Delimiter := ' ';
        Words.DelimitedText := Line;

        for var j := 0 to Words.Count - 1 do
        begin
          var Word := Trim(Words[j]);
          // Palabra válida: al menos 2 letras y empieza con letra
          if (Length(Word) >= 2) and (Word[1] in ['A'..'Z', 'a'..'z']) then
            Inc(WordCount);
        end;

        // Si tiene al menos 2 palabras válidas y no es un RUC
        if (WordCount >= 2) and (OnlyDigits(Line) = '') then
        begin
          Result := Line;
          Exit;
        end;
      finally
        Words.Free;
      end;
    end;
  end;
end;

function ExtractEstado_Digital(const SL: TStringList): string;
var
  i: Integer;
begin
  Result := '';

  for i := 0 to SL.Count - 1 do
  begin
    var Line := SL[i];
    if Pos('Estado', Line) > 0 then
    begin
      // Buscar en la misma línea después de "Estado"
      var EstadoPos := Pos('Estado', Line);
      var AfterEstado := Trim(Copy(Line, EstadoPos + 6, MaxInt));
      if AfterEstado <> '' then
      begin
        Result := AfterEstado;
        Exit;
      end;

      // Si no está en la misma línea, buscar en línea siguiente
      if (i < SL.Count - 1) then
      begin
        Result := Trim(SL[i + 1]);
        Exit;
      end;
    end;
  end;
end;

function ExtractRegimen_Digital(const SL: TStringList): string;
var
  i: Integer;
begin
  Result := '';

  for i := 0 to SL.Count - 1 do
  begin
    var Line := SL[i];
    if Pos('Régimen', Line) > 0 then
    begin
      // Buscar en la misma línea después de "Régimen"
      var RegimenPos := Pos('Régimen', Line);
      var AfterRegimen := Trim(Copy(Line, RegimenPos + 7, MaxInt));
      if AfterRegimen <> '' then
      begin
        Result := AfterRegimen;
        Exit;
      end;

      // Si no está en la misma línea, buscar en línea siguiente
      if (i < SL.Count - 1) then
      begin
        Result := Trim(SL[i + 1]);
        Exit;
      end;
    end;
  end;
end;

function ExtractDireccionCompleta_Digital(const SL: TStringList): string;
var
  i: Integer;
begin
  Result := '';

  // Buscar línea que contiene "Calle:"
  for i := 0 to SL.Count - 1 do
  begin
    var Line := SL[i];
    if Pos('Calle:', Line) > 0 then
    begin
      // Extraer calle
      var Calle := '';
      var CallePos := Pos('Calle:', Line);
      if CallePos > 0 then
      begin
        var AfterCalle := Trim(Copy(Line, CallePos + 6, MaxInt));

        // Buscar "Número:" después de la calle
        var NumeroPos := Pos('Número:', AfterCalle);
        if NumeroPos > 0 then
        begin
          Calle := Trim(Copy(AfterCalle, 1, NumeroPos - 1));
          var AfterNumero := Trim(Copy(AfterCalle, NumeroPos + 7, MaxInt));

          // Buscar siguiente separador o fin de línea
          var InterseccionPos := Pos('Intersección:', AfterNumero);
          var ReferenciaPos := Pos('Referencia:', AfterNumero);
          var OficinaPos := Pos('Número de oficina:', AfterNumero);

          var EndPos := MaxInt;
          if InterseccionPos > 0 then
            EndPos := Min(EndPos, InterseccionPos);
          if ReferenciaPos > 0 then
            EndPos := Min(EndPos, ReferenciaPos);
          if OficinaPos > 0 then
            EndPos := Min(EndPos, OficinaPos);

          var Numero := '';
          if EndPos < MaxInt then
            Numero := Trim(Copy(AfterNumero, 1, EndPos - 1))
          else
            Numero := AfterNumero;

          // Formatear resultado
          if Trim(Numero) = 'S/N' then
            Result := Trim(Calle)
          else
            Result := Trim(Calle) + ' ' + Trim(Numero);
        end
        else
        begin
          // Solo calle sin número
          Result := AfterCalle;
        end;
      end;
      Exit;
    end;
  end;
end;

function ExtractUbicacion_Digital(const SL: TStringList; const Tipo: string): string;
var
  i: Integer;
begin
  Result := '';

  for i := 0 to SL.Count - 1 do
  begin
    var Line := SL[i];
    if Pos('Provincia:', Line) > 0 then
    begin
      if Tipo = 'PROVINCIA' then
      begin
        var ProvinciaPos := Pos('Provincia:', Line);
        var AfterProvincia := Trim(Copy(Line, ProvinciaPos + 10, MaxInt));

        var CantonPos := Pos('Cantón:', AfterProvincia);
        if CantonPos > 0 then
          Result := Trim(Copy(AfterProvincia, 1, CantonPos - 1))
        else
          Result := AfterProvincia;
      end
      else if Tipo = 'CANTON' then
      begin
        var CantonPos := Pos('Cantón:', Line);
        if CantonPos > 0 then
        begin
          var AfterCanton := Trim(Copy(Line, CantonPos + 7, MaxInt));
          var ParroquiaPos := Pos('Parroquia:', AfterCanton);
          if ParroquiaPos > 0 then
            Result := Trim(Copy(AfterCanton, 1, ParroquiaPos - 1))
          else
            Result := AfterCanton;
        end;
      end;
      Exit;
    end;
  end;
end;

procedure ExtractContactos_Digital(const SL: TStringList; out Email, Tel, Cel: string);
var
  i: Integer;
begin
  Email := '';
  Tel := '';
  Cel := '';

  // Buscar línea que contiene información de contacto
  for i := 0 to SL.Count - 1 do
  begin
    var Line := SL[i];

    // Email
    if (Email = '') and (Pos('Email:', Line) > 0) then
    begin
      var EmailPos := Pos('Email:', Line);
      var AfterEmail := Trim(Copy(Line, EmailPos + 6, MaxInt));

      // Buscar fin del email (próxima etiqueta o espacio)
      var TelPos := Pos('Teléfono domicilio:', AfterEmail);
      var CelPos := Pos('Celular:', AfterEmail);

      var EndPos := MaxInt;
      if TelPos > 0 then
        EndPos := Min(EndPos, TelPos);
      if CelPos > 0 then
        EndPos := Min(EndPos, CelPos);

      if EndPos < MaxInt then
        Email := Trim(Copy(AfterEmail, 1, EndPos - 1))
      else
        Email := AfterEmail;

      // Limpiar espacios del email
      Email := StringReplace(Email, ' ', '', [rfReplaceAll]);
    end;

    // Celular (prioridad)
    if (Cel = '') and (Pos('Celular:', Line) > 0) then
    begin
      var CelPos := Pos('Celular:', Line);
      var AfterCel := Trim(Copy(Line, CelPos + 8, MaxInt));

      // Buscar fin del celular (próxima etiqueta)
      var EmailPos := Pos('Email:', AfterCel);
      var TelPos := Pos('Teléfono domicilio:', AfterCel);

      var EndPos := MaxInt;
      if EmailPos > 0 then
        EndPos := Min(EndPos, EmailPos);
      if TelPos > 0 then
        EndPos := Min(EndPos, TelPos);

      if EndPos < MaxInt then
        Cel := OnlyDigits(Trim(Copy(AfterCel, 1, EndPos - 1)))
      else
        Cel := OnlyDigits(AfterCel);
    end;

    // Teléfono domicilio
    if (Tel = '') and (Pos('Teléfono domicilio:', Line) > 0) then
    begin
      var TelPos := Pos('Teléfono domicilio:', Line);
      var AfterTel := Trim(Copy(Line, TelPos + 18, MaxInt));

      // Buscar fin del teléfono (próxima etiqueta)
      var EmailPos := Pos('Email:', AfterTel);
      var CelPos := Pos('Celular:', AfterTel);

      var EndPos := MaxInt;
      if EmailPos > 0 then
        EndPos := Min(EndPos, EmailPos);
      if CelPos > 0 then
        EndPos := Min(EndPos, CelPos);

      if EndPos < MaxInt then
        Tel := OnlyDigits(Trim(Copy(AfterTel, 1, EndPos - 1)))
      else
        Tel := OnlyDigits(AfterTel);
    end;
  end;
end;

function NormalizeTipo_Digital(const SL: TStringList): string;
var
  i: Integer;
begin
  Result := 'PERSONA NATURAL';

  for i := 0 to SL.Count - 1 do
  begin
    if Pos('PERSONAS NATURALES', UpperCase(SL[i])) > 0 then
      Exit('PERSONA NATURAL')
    else if Pos('SOCIEDAD', UpperCase(SL[i])) > 0 then
      Exit('SOCIEDAD');
  end;
end;

{==============================================================================}
{                    Parser MEJORADO para PDFs con IMÁGENES (OCR)            }
{==============================================================================}

function ExtractRUC_OCR(const SL: TStringList): string;
var
  i: Integer;
begin
  Result := '';

  // Estrategia OCR: buscar línea con 13 dígitos después de patrones conocidos
  for i := 0 to SL.Count - 1 do
  begin
    var Line := Trim(SL[i]);

    // Buscar "Número RUC" o "RUC" en el texto
    if (Pos('NÚMERO RUC', UpperCase(Line)) > 0) or (Pos('RUC', UpperCase(Line)) > 0) then
    begin
      // Buscar en las siguientes líneas
      for var j := i + 1 to Min(i + 3, SL.Count - 1) do
      begin
        var NextLine := Trim(SL[j]);
        var Digits := OnlyDigits(NextLine);
        if (Length(Digits) = 13) and (Digits[1] in ['0'..'2']) then
          Exit(Digits);
      end;
    end;

    // Buscar 13 dígitos directamente
    var Digits := OnlyDigits(Line);
    if (Length(Digits) = 13) and (Digits[1] in ['0'..'2']) then
      Exit(Digits);
  end;
end;

function ExtractNombre_OCR(const SL: TStringList; const ARuc: string): string;
var
  i: Integer;
begin
  Result := '';

  // Estrategia 1: Buscar después de "Apellidos y nombres" o variantes
  for i := 0 to SL.Count - 2 do
  begin
    var Line := UpperCase(Trim(SL[i]));
    if (Pos('APELLIDOS', Line) > 0) and (Pos('NOMBRES', Line) > 0) then
    begin
      // Tomar la siguiente línea que tenga contenido
      for var j := i + 1 to Min(i + 3, SL.Count - 1) do
      begin
        var NextLine := Trim(SL[j]);
        if (NextLine <> '') and (NextLine.Contains(ARuc)) and (length(NextLine.Trim) > 13) then
        begin
          NextLine := AnsiReplaceStr(NextLine, ARuc, '').Trim;
          Result := NextLine;
          Exit;
        end;
        {
        if (NextLine <> '') and (Length(OnlyDigits(NextLine)) <> 13) and (Pos('RUC', UpperCase(NextLine))
          = 0) and (Length(NextLine) > 5) then
        begin
          Result := NextLine;
          Exit;
        end;
        }
      end;
    end;
  end;

  // Estrategia 2: Buscar línea con patrón de nombre (múltiples palabras)
  for i := 0 to SL.Count - 1 do
  begin
    var Line := Trim(SL[i]);
    if (Length(Line) > 10) and (Pos(' ', Line) > 0) then
    begin
      var Words := TStringList.Create;
      try
        Words.Delimiter := ' ';
        Words.DelimitedText := Line;

        var ValidWordCount := 0;
        var TotalLetters := 0;

        for var j := 0 to Words.Count - 1 do
        begin
          var Word := Trim(Words[j]);
          if (Length(Word) >= 2) then
          begin
            var HasLetters := False;
            for var k := 1 to Length(Word) do
            begin
              if Word[k] in ['A'..'Z', 'a'..'z', 'Á', 'É', 'Í', 'Ó', 'Ú', 'á', 'é', 'í', 'ó', 'ú',
                'Ñ', 'ñ'] then
              begin
                HasLetters := True;
                Inc(TotalLetters);
              end;
            end;

            if HasLetters then
              Inc(ValidWordCount);
          end;
        end;

        // Si tiene al menos 3 palabras válidas y más del 60% son letras
        if (ValidWordCount >= 3) and ((TotalLetters / Length(Line)) > 0.6) then
        begin
          Result := Line;
          Exit;
        end;
      finally
        Words.Free;
      end;
    end;
  end;

  // Estrategia 3: Buscar la línea más larga que no sea RUC
  var MaxLength := 0;
  for i := 0 to SL.Count - 1 do
  begin
    var Line := Trim(SL[i]);
    if (Length(Line) > MaxLength) and (OnlyDigits(Line) <> ARuc) and (Length(Line) > 8) then
    begin
      var HasLetters := False;
      for var j := 1 to Length(Line) do
      begin
        if Line[j] in ['A'..'Z', 'a'..'z'] then
        begin
          HasLetters := True;
          Break;
        end;
      end;

      if HasLetters then
      begin
        MaxLength := Length(Line);
        Result := Line;
      end;
    end;
  end;
end;

function ExtractEstado_OCR(const SL: TStringList): string;
var
  i: Integer;
  Line: string;
begin
  Result := 'ACTIVO'; // Asumir activo por defecto en OCR

  for i := 0 to SL.Count - 1 do
  begin
    Line := UpperCase(Trim(SL[i]));

    if Pos('ACTIVO', Line) > 0 then
      Exit('ACTIVO')
    else if Pos('INACTIVO', Line) > 0 then
      Exit('INACTIVO')
    else if Pos('SUSPENSO', Line) > 0 then
      Exit('SUSPENSO')
    else if Pos('CANCELADO', Line) > 0 then
      Exit('CANCELADO');
  end;
end;

function ExtractRegimen_OCR(const SL: TStringList): string;
var
  i: Integer;
  Line: string;
  NextLine: string;
  ValorRespuesta: string;
begin
  Result := 'GENERAL'; // Asumir RIMPE por defecto

  for i := 0 to SL.Count - 1 do
  begin
    Line := UpperCase(Trim(SL[i]));
    if Pos('régimen', LowerCase(Line)) > 0 then
    begin
      NextLine := UpperCase(Trim(SL[i + 2]));
      // 'ACTIVO GENERAL NO REGISTRA'
      ValorRespuesta := copy(NextLine, pos(' ', NextLine), length(NextLine)).Trim;
      ValorRespuesta := Copy(ValorRespuesta, 1, Pos(' ', ValorRespuesta)).Trim;
      Result := ValorRespuesta;
      Exit;
    end;










    {
    if Pos('RIMPE', Line) > 0 then
      Exit('RIMPE')
    else if (Pos('CONTRIBUYENTE', Line) > 0) and (Pos('ESPECIAL', Line) > 0) then
      Exit('CONTRIBUYENTE ESPECIAL')
    else if Pos('CONTRIBUYENTE', Line) > 0 then
      Exit('CONTRIBUYENTE ESPECIAL')
    else if (Pos('NEGOCIO', Line) > 0) and (Pos('POPULAR', Line) > 0) then
      Exit('NEGOCIO POPULAR')
    else if Pos('RISE', Line) > 0 then
      Exit('RISE')
    else if Pos('GENERAL', Line) > 0 then
      Exit('GENERAL');  }
  end;
end;

function ExtractDireccionCompleta_OCR(const SL: TStringList): string;
var
  i: Integer;
begin
  Result := '';

  // Buscar línea con "Calle:"
  for i := 0 to SL.Count - 1 do
  begin
    var Line := SL[i];
    var UpperLine := UpperCase(Line);

    if Pos('CALLE:', UpperLine) > 0 then
    begin
      var CallePos := Pos('CALLE:', UpperLine);
      var AfterCalle := Trim(Copy(Line, CallePos + 6, MaxInt));

      // Buscar "NÚMERO:" o "NUMERO:"
      var NumeroPos := Pos('número:', LowerCase(AfterCalle));
      if NumeroPos = 0 then
        NumeroPos := Pos('numero:', LowerCase(AfterCalle));

      if NumeroPos > 0 then
      begin
        var Calle := Trim(Copy(AfterCalle, 1, NumeroPos - 1));
        var AfterNumero := Trim(Copy(AfterCalle, NumeroPos + 7, MaxInt));

        // Buscar siguiente separador
        var InterseccionPos := Pos('intersección:', LowerCase(AfterNumero));

        AfterNumero := copy(AfterNumero, 1, InterseccionPos - 1).Trim;
        Calle := Calle + ' ' + AfterNumero;
        Result := Trim(Calle);
        exit;
      end
      else
      begin
        // Solo calle
        Result := AfterCalle;
      end;
      Exit;
    end;
  end;
end;

function ExtractEmail_OCR(const SL: TStringList): string;
var
  i: Integer;
begin
  Result := '';

  for i := 0 to SL.Count - 1 do
  begin
    var Line := SL[i];
    var UpperLine := UpperCase(Line);

    // Buscar "EMAIL:"
    // 'TELéFONO DOMICILIO: 072841437 EMAIL: SANTIBQ81(94MSN.COM CELULAR: 0984487622'
    if Pos('EMAIL:', UpperLine) > 0 then
    begin
      UpperLine := ReplaceStr(UpperLine, '(94', '@');
      Line := ReplaceStr(Line, '(94', '@');
      var EmailPos := Pos('EMAIL:', UpperLine);
      var AfterEmail := Trim(Copy(Line, EmailPos + 6, MaxInt));

      // Buscar @ para encontrar el email real
      var AtPos := Pos('@', AfterEmail);
      if AtPos > 0 then
      begin
        // Buscar inicio
        var StartPos := AtPos;
        while (StartPos > 1) and (AfterEmail[StartPos - 1] in ['a'..'z', 'A'..'Z', '0'..'9', '.',
          '_', '-']) do
          Dec(StartPos);

        // Buscar fin (hasta espacio o fin de línea)
        var EndPos := AtPos + 1;
        while (EndPos <= Length(AfterEmail)) and (AfterEmail[EndPos] in ['a'..'z', 'A'..'Z', '0'..
          '9', '.', '_', '-']) do
          Inc(EndPos);

        Result := Copy(AfterEmail, StartPos, EndPos - StartPos);
        Exit;
      end;
    end;

    // Buscar directamente patrones de email
    var AtPos := Pos('@', Line);
    if (AtPos > 1) and (Result = '') then
    begin
      // Buscar inicio
      var StartPos := AtPos;
      while (StartPos > 1) and (Line[StartPos - 1] in ['a'..'z', 'A'..'Z', '0'..'9', '.', '_', '-']) do
        Dec(StartPos);

      // Buscar fin
      var EndPos := AtPos + 1;
      while (EndPos <= Length(Line)) and (Line[EndPos] in ['a'..'z', 'A'..'Z', '0'..'9', '.', '_', '-']) do
        Inc(EndPos);

      var PossibleEmail := Copy(Line, StartPos, EndPos - StartPos);

      // Validar que tenga punto después del @
      if (Pos('.', PossibleEmail) > AtPos - StartPos + 1) then
      begin
        Result := PossibleEmail;
        Exit;
      end;
    end;
  end;
end;

procedure ExtractContactos_OCR(const SL: TStringList; out Email, Tel, Cel: string);
var
  i: Integer;
begin
  Email := '';
  Tel := '';
  Cel := '';

  for i := 0 to SL.Count - 1 do
  begin
    var Line := SL[i];

    // Email (ya extraído por función separada)
    if Email = '' then
      Email := ExtractEmail_OCR(SL);

    // Celular (prioridad)
    if (Cel = '') and (Pos('Celular:', Line) > 0) then
    begin
      var CelPos := Pos('Celular:', Line);
      var AfterCel := Trim(Copy(Line, CelPos + 8, MaxInt));
      Cel := OnlyDigits(AfterCel);
      if (Length(Cel) = 9) or (Length(Cel) = 10) then
        Continue;
    end;

    // Teléfono domicilio
    if (Tel = '') and (Pos('Teléfono domicilio:', Line) > 0) then
    begin
      var TelPos := Pos('Teléfono domicilio:', Line);
      var AfterTel := Trim(Copy(Line, TelPos + 18, MaxInt));
      Tel := OnlyDigits(AfterTel);
    end;
  end;
end;

function ExtractUbicacion_OCR(const SL: TStringList; const Tipo: string): string;
var
  i: Integer;
  Line: string;
begin
  Result := '';

  for i := 0 to SL.Count - 1 do
  begin
    Line := UpperCase(Trim(SL[i]));

    if Tipo = 'PROVINCIA' then
    begin
      // Buscar provincias comunes de Ecuador
      if Pos('AZUAY', Line) > 0 then
        Exit('AZUAY')
      else if Pos('BOLIVAR', Line) > 0 then
        Exit('BOLIVAR')
      else if Pos('CAÑAR', Line) > 0 then
        Exit('CAÑAR')
      else if Pos('CARCHI', Line) > 0 then
        Exit('CARCHI')
      else if Pos('COTOPAXI', Line) > 0 then
        Exit('COTOPAXI')
      else if Pos('CHIMBORAZO', Line) > 0 then
        Exit('CHIMBORAZO')
      else if Pos('EL ORO', Line) > 0 then
        Exit('EL ORO')
      else if Pos('ESMERALDAS', Line) > 0 then
        Exit('ESMERALDAS')
      else if Pos('GUAYAS', Line) > 0 then
        Exit('GUAYAS')
      else if Pos('IMBABURA', Line) > 0 then
        Exit('IMBABURA')
      else if Pos('LOJA', Line) > 0 then
        Exit('LOJA')
      else if Pos('LOS RIOS', Line) > 0 then
        Exit('LOS RIOS')
      else if Pos('MANABI', Line) > 0 then
        Exit('MANABI')
      else if Pos('MORONA', Line) > 0 then
        Exit('MORONA SANTIAGO')
      else if Pos('NAPO', Line) > 0 then
        Exit('NAPO')
      else if Pos('PASTAZA', Line) > 0 then
        Exit('PASTAZA')
      else if Pos('PICHINCHA', Line) > 0 then
        Exit('PICHINCHA')
      else if Pos('TUNGURAHUA', Line) > 0 then
        Exit('TUNGURAHUA')
      else if Pos('ZAMORA', Line) > 0 then
        Exit('ZAMORA CHINCHIPE')
      else if Pos('GALAPAGOS', Line) > 0 then
        Exit('GALAPAGOS')
      else if Pos('SUCUMBIOS', Line) > 0 then
        Exit('SUCUMBIOS')
      else if Pos('ORELLANA', Line) > 0 then
        Exit('ORELLANA')
      else if Pos('SANTO DOMINGO', Line) > 0 then
        Exit('SANTO DOMINGO')
      else if Pos('SANTA ELENA', Line) > 0 then
        Exit('SANTA ELENA');
    end
    else if Tipo = 'CANTON' then
    begin
      // Buscar cantones comunes
      if Pos('CUENCA', Line) > 0 then
        Exit('CUENCA')
      else if Pos('QUITO', Line) > 0 then
        Exit('QUITO')
      else if Pos('GUAYAQUIL', Line) > 0 then
        Exit('GUAYAQUIL')
      else if Pos('AMBATO', Line) > 0 then
        Exit('AMBATO')
      else if Pos('MACHALA', Line) > 0 then
        Exit('MACHALA')
      else if Pos('MANTA', Line) > 0 then
        Exit('MANTA')
      else if Pos('IBARRA', Line) > 0 then
        Exit('IBARRA')
      else if Pos('LOJA', Line) > 0 then
        Exit('LOJA')
      else if Pos('RIOBAMBA', Line) > 0 then
        Exit('RIOBAMBA')
      else if Pos('LATACUNGA', Line) > 0 then
        Exit('LATACUNGA')
      else if Pos('BABAHOYO', Line) > 0 then
        Exit('BABAHOYO')
      else if Pos('PORTOVIEJO', Line) > 0 then
        Exit('PORTOVIEJO')
      else if Pos('MILAGRO', Line) > 0 then
        Exit('MILAGRO')
      else if Pos('QUEVEDO', Line) > 0 then
        Exit('QUEVEDO')
      else if Pos('SALINAS', Line) > 0 then
        Exit('SALINAS');
    end;
  end;
end;

function NormalizeTipo_OCR(const SL: TStringList): string;
var
  i: Integer;
  Line: string;
begin
  Result := 'PERSONA NATURAL';

  for i := 0 to SL.Count - 1 do
  begin
    Line := UpperCase(SL[i]);

    if Pos('PERSONA NATURAL', Line) > 0 then
      Exit('PERSONA NATURAL')
    else if Pos('PERSONAS NATURALES', Line) > 0 then
      Exit('PERSONA NATURAL')
    else if Pos('SOCIEDAD', Line) > 0 then
      Exit('SOCIEDAD')
    else if Pos('COMPAÑIA', Line) > 0 then
      Exit('SOCIEDAD')
    else if Pos('COMPANIA', Line) > 0 then
      Exit('SOCIEDAD')
    else if Pos('EMPRESA', Line) > 0 then
      Exit('SOCIEDAD');
  end;
end;

{==============================================================================}
{                    Conversión PDF → Imágenes con Poppler                    }
{==============================================================================}

function ConvertPdfToImages(const APdfFile, AOutputDir: string; DPI: Integer; out AImageFiles:
  TStringList): Boolean;
var
  PopplerDir, PdftoppmExe, OutputPrefix, CommandLine: string;
  StartupInfo: TStartupInfo;
  ProcessInfo: TProcessInformation;
  ExitCode: Cardinal;
  PNGFiles: TArray<string>;
  i: Integer;
begin
  Result := False;
  AImageFiles := TStringList.Create;

  try
    // Asegurar que Poppler está disponible
    TRuntimeDeps.EnsurePopplerWin32;

    PopplerDir := TRuntimeDeps.GetPopplerDir;
    PdftoppmExe := TPath.Combine(PopplerDir, 'pdftoppm.exe');

    if not TFile.Exists(PdftoppmExe) then
      raise EPdfToolError.Create('pdftoppm.exe no encontrado en: ' + PopplerDir);

    if not TFile.Exists(APdfFile) then
      raise EPdfToolError.Create('PDF no existe: ' + APdfFile);

    // Crear directorio de salida
    if not TDirectory.Exists(AOutputDir) then
      TDirectory.CreateDirectory(AOutputDir);

    // Prefijo para archivos de salida
    OutputPrefix := TPath.Combine(AOutputDir, 'page');

    // Comando: pdftoppm -png -r 200 input.pdf output_prefix
    CommandLine := Format('"%s" -png -r %d "%s" "%s"', [PdftoppmExe, DPI, APdfFile, OutputPrefix]);

    // Configurar proceso
    FillChar(StartupInfo, SizeOf(TStartupInfo), 0);
    StartupInfo.cb := SizeOf(TStartupInfo);
    StartupInfo.dwFlags := STARTF_USESHOWWINDOW;
    StartupInfo.wShowWindow := SW_HIDE;

    // Ejecutar pdftoppm
    if CreateProcess(nil, PChar(CommandLine), nil, nil, False, CREATE_NO_WINDOW, nil, PChar(AOutputDir),
      StartupInfo, ProcessInfo) then
    begin
      try
        // Esperar máximo 30 segundos
        if WaitForSingleObject(ProcessInfo.hProcess, 30000) = WAIT_OBJECT_0 then
        begin
          GetExitCodeProcess(ProcessInfo.hProcess, ExitCode);
          Result := (ExitCode = 0);
        end
        else
        begin
          TerminateProcess(ProcessInfo.hProcess, 1);
          raise EPdfToolError.Create('Timeout en conversión PDF→imágenes');
        end;
      finally
        CloseHandle(ProcessInfo.hProcess);
        CloseHandle(ProcessInfo.hThread);
      end;
    end
    else
      raise EPdfToolError.Create('No se pudo ejecutar pdftoppm');

    // Buscar archivos PNG generados
    PNGFiles := TDirectory.GetFiles(AOutputDir, '*.png');
    for i := 0 to High(PNGFiles) do
      AImageFiles.Add(PNGFiles[i]);

    // Ordenar por nombre (para mantener orden de páginas)
    AImageFiles.Sort;

    Result := AImageFiles.Count > 0;

  except
    on E: Exception do
    begin
      AImageFiles.Free;
      raise;
    end;
  end;
end;

{==============================================================================}
{                         OCR con Tesseract                                   }
{==============================================================================}

function RunTesseractOnImage(const AImagePath: string; out AText, AError: string): Boolean;
var
  TesseractExe, OutputFile, TxtOutputFile: string;
  StartupInfo: TStartupInfo;
  ProcessInfo: TProcessInformation;
  CommandLine: string;
  ExitCode: Cardinal;
begin
  Result := False;
  AText := '';
  AError := '';

  try
    TesseractExe := TPath.Combine(TRuntimeDeps.GetTesseractDir, 'tesseract.exe');

    if not TFile.Exists(TesseractExe) then
    begin
      AError := 'No se pudo encontrar tesseract.exe';
      Exit;
    end;

    if not TFile.Exists(AImagePath) then
    begin
      AError := 'La imagen no existe: ' + AImagePath;
      Exit;
    end;

    // Archivos de salida
    OutputFile := TPath.Combine(TPath.GetDirectoryName(AImagePath), 'ocr_' + TPath.GetFileNameWithoutExtension
      (AImagePath));
    TxtOutputFile := OutputFile + '.txt';

    // Eliminar archivo de salida anterior si existe
    if TFile.Exists(TxtOutputFile) then
      TFile.Delete(TxtOutputFile);

    // Comando: tesseract imagen.png output -l spa
    CommandLine := Format('"%s" "%s" "%s" -l spa', [TesseractExe, AImagePath, OutputFile]);

    // Configurar proceso
    FillChar(StartupInfo, SizeOf(TStartupInfo), 0);
    StartupInfo.cb := SizeOf(TStartupInfo);
    StartupInfo.dwFlags := STARTF_USESHOWWINDOW;
    StartupInfo.wShowWindow := SW_HIDE;

    // Ejecutar Tesseract
    if CreateProcess(nil, PChar(CommandLine), nil, nil, False, CREATE_NO_WINDOW, nil, nil,
      StartupInfo, ProcessInfo) then
    begin
      try
        // Esperar máximo 30 segundos
        if WaitForSingleObject(ProcessInfo.hProcess, 30000) = WAIT_OBJECT_0 then
        begin
          GetExitCodeProcess(ProcessInfo.hProcess, ExitCode);

          if (ExitCode = 0) and TFile.Exists(TxtOutputFile) then
          begin
            // Leer resultado
            AText := TFile.ReadAllText(TxtOutputFile, TEncoding.UTF8);
            Result := Trim(AText) <> '';

            // Limpiar archivo temporal
            TFile.Delete(TxtOutputFile);
          end
          else
          begin
            AError := Format('Tesseract falló con código: %d', [ExitCode]);
          end;
        end
        else
        begin
          AError := 'Timeout Tesseract (30 segundos)';
          TerminateProcess(ProcessInfo.hProcess, 1);
        end;
      finally
        CloseHandle(ProcessInfo.hProcess);
        CloseHandle(ProcessInfo.hThread);
      end;
    end
    else
    begin
      AError := 'No se pudo ejecutar Tesseract';
    end;

  except
    on E: Exception do
    begin
      AError := 'Error ejecutando Tesseract: ' + E.Message;
    end;
  end;
end;

{==============================================================================}
{                    Extracción OCR Completa con Estrategia                   }
{==============================================================================}

function ExtractTextWithOCR(const APdfFile: string; out AText, AError: string): Boolean;
var
  TempImageDir: string;
  ImageFiles: TStringList;
  i, j, Attempt, DPI: Integer;
  PageText, CurrentError: string;
  UniqueID: Cardinal;
  FoundValidData: Boolean;
  Files: TArray<string>;
  FilePath: string;
begin
  Result := False;
  AText := '';
  AError := '';
  FoundValidData := False;

  try
    // Asegurar que las dependencias están disponibles
    TRuntimeDeps.EnsurePopplerWin32;
    TRuntimeDeps.EnsureTesseractWin32;

    // Crear directorio temporal
    UniqueID := GetTickCount;
    TempImageDir := TPath.Combine(TPath.GetTempPath, 'pdf_ocr_' + IntToStr(UniqueID));
    TDirectory.CreateDirectory(TempImageDir);

    try
      // ESTRATEGIA: Probar primero con 200 DPI, luego con 300 DPI si es necesario
      DPI := 200;
      while DPI <= 300 do
      begin
        try
          // Convertir PDF a imágenes
          if ConvertPdfToImages(APdfFile, TempImageDir, DPI, ImageFiles) then
          begin
            try
              // Procesar páginas secuencialmente hasta encontrar datos válidos
              for i := 0 to ImageFiles.Count - 1 do
              begin
                // Reintentos por página (3 intentos)
                for Attempt := 1 to 3 do
                begin
                  try
                    if RunTesseractOnImage(ImageFiles[i], PageText, CurrentError) then
                    begin
                      // Probar si esta página contiene datos válidos
                      AText := PageText;

                      // Crear StringList temporal para verificar RUC
                      var TempSL := TStringList.Create;
                      try
                        TempSL.Text := AText;
                        // Verificar si tenemos datos válidos (RUC encontrado)
                        if ExtractRUC_OCR(TempSL) <> '' then
                        begin
                          FoundValidData := True;
                          AError := Format('OCR exitoso (Página %d, %d DPI)', [i + 1, DPI]);
                          Break; // Salir del bucle de reintentos
                        end
                        else if i = 0 then
                        begin
                          // Para la primera página, acumulamos aunque no tenga RUC
                          FoundValidData := True;
                          AError := Format('Texto extraído pero RUC no identificado (Página %d, %d DPI)',
                            [i + 1, DPI]);
                          Break;
                        end;
                      finally
                        TempSL.Free;
                      end;
                    end;

                    // Pequeña pausa entre reintentos
                    if Attempt < 3 then
                      Sleep(1000);

                  except
                    on E: Exception do
                      CurrentError := E.Message;
                  end;
                end;

                // Si encontramos datos válidos, salir del bucle de páginas
                if FoundValidData then
                  Break;

                // Si no encontramos datos en esta página, continuar con la siguiente
                if i > 0 then // Si no es la primera página, acumular texto
                  AText := AText + sLineBreak + '--- Página ' + IntToStr(i + 1) + ' ---' +
                    sLineBreak + PageText;
              end;

              // Si encontramos datos válidos, salir del bucle DPI
              if FoundValidData then
              begin
                Result := True;
                Break;
              end;

            finally
              ImageFiles.Free;
            end;
          end;

        except
          on E: Exception do
          begin
            // Continuar con siguiente DPI si falla
            if DPI = 300 then // Si ya probamos 300 DPI, lanzar error
              raise;
          end;
        end;

        // Limpiar directorio para siguiente iteración DPI
        if TDirectory.Exists(TempImageDir) then
        begin
          Files := TDirectory.GetFiles(TempImageDir);
          for FilePath in Files do
            TFile.Delete(FilePath);
        end;

        // Incrementar DPI para siguiente iteración
        if DPI = 200 then
          DPI := 300
        else
          Break;
      end;

      // Si no encontramos datos después de procesar todas las páginas y DPI
      if not FoundValidData then
      begin
        AError := 'No se pudieron extraer datos válidos del PDF después de procesar todas las páginas';
        Result := False;
      end;

    finally
      // Limpiar directorio temporal
      if TDirectory.Exists(TempImageDir) then
      begin
        try
          TDirectory.Delete(TempImageDir, True);
        except
          // Ignorar errores de limpieza
        end;
      end;
    end;

  except
    on E: Exception do
    begin
      AError := 'Error en OCR: ' + E.Message;
      Result := False;
    end;
  end;
end;

{==============================================================================}
{                 Extracción Real usando Winsoft TFPdf                         }
{==============================================================================}

function PdfFileToText(const APdfFile: string; out AText, AError: string): Boolean;
var
  FPdf: TFPdf;
  i: Integer;
  PageTxt: string;
  OCRText: string;
  OCRError: string;
begin
  Result := False;
  AText := '';
  AError := '';

  if not FileExists(APdfFile) then
  begin
    AError := 'El archivo PDF no existe: ' + APdfFile;
    Exit;
  end;

  FPdf := TFPdf.Create(nil);
  try
    try
      FPdf.FileName := APdfFile;
      FPdf.Active := True;

      for i := 1 to FPdf.PageCount do
      begin
        FPdf.PageNumber := i;
        PageTxt := FPdf.Text;

        // Acumulamos el texto
        if Trim(PageTxt) <> '' then
          AText := AText + PageTxt + sLineBreak;
      end;

      FPdf.Active := False;

      // --- VALIDACIÓN CRÍTICA PARA IMÁGENES ---
      // Si después de recorrer el PDF el texto es muy corto (ej. menos de 50 caracteres),
      // intentamos usar OCR automáticamente
      if Length(Trim(AText)) < 50 then
      begin
        AError := 'El PDF parece ser una imagen escaneada (sin capa de texto). ' + 'Intentando usar OCR...';

        // Intentar OCR automáticamente
        if ExtractTextWithOCR(APdfFile, OCRText, OCRError) then
        begin
          AText := OCRText;
          Result := True;
          AError := 'PDF procesado con OCR: ' + OCRError;
        end
        else
        begin
          AError := 'El PDF es una imagen y el OCR falló: ' + OCRError;
          Result := False;
        end;
        Exit;
      end;

      Result := True;
    except
      on E: Exception do
      begin
        AError := 'Error Winsoft PDFium: ' + E.Message;

        // Si PDFium falla, intentar con OCR como respaldo
        if ExtractTextWithOCR(APdfFile, OCRText, OCRError) then
        begin
          AText := OCRText;
          Result := True;
          AError := 'PDF procesado con OCR después de fallo PDFium: ' + OCRError;
        end
        else
        begin
          AError := AError + ' | También falló OCR: ' + OCRError;
          Result := False;
        end;
      end;
    end;
  finally
    FPdf.Free;
  end;
end;

{==============================================================================}
{                    Parser Unificado MEJORADO                               }
{==============================================================================}

function PdfTextToJson(const APdfText: string): string;
var
  SL: TStringList;
  Ruc, Nombre, Estado, Regimen, Direccion, Email, Tel, Cel, TelefonoFinal: string;
  Provincia, Canton, Tipo: string;
  Root: TJSONObject;
  IsOCRText: Boolean;
begin
  SL := TextToLines(APdfText);
  try
    // Detectar si es texto de OCR
   //    IsOCRText := (Pos('--- Página', APdfText) > 0) or (ExtractRUC_Digital(SL) = '') or (Length(APdfText) > 1000);
    IsOCRText := (Pos('Obligaciones tributarias', APdfText) > 0) and (ExtractRUC_Digital(SL) <> '');
    IsOCRText := not IsOCRText;

      // Obligaciones tributarias

    if IsOCRText then
    begin
      // Usar parser OCR mejorado
      Ruc := ExtractRUC_OCR(SL);
      Nombre := ExtractNombre_OCR(SL, Ruc);
      Estado := ExtractEstado_OCR(SL);
      Regimen := ExtractRegimen_OCR(SL);
      Direccion := ExtractDireccionCompleta_OCR(SL);
      ExtractContactos_OCR(SL, Email, Tel, Cel);
      Email := ExtractEmail_OCR(SL);
      Provincia := ExtractUbicacion_OCR(SL, 'PROVINCIA');
      Canton := ExtractUbicacion_OCR(SL, 'CANTON');
      Tipo := NormalizeTipo_OCR(SL);
    end
    else
    begin
      // Usar parser digital mejorado
      Ruc := ExtractRUC_Digital(SL);
      Nombre := ExtractNombre_Digital(SL);  //???
      Estado := ExtractEstado_Digital(SL);
      Regimen := ExtractRegimen_Digital(SL);
      Direccion := ExtractDireccionCompleta_Digital(SL);
      ExtractContactos_Digital(SL, Email, Tel, Cel);
      Provincia := ExtractUbicacion_Digital(SL, 'PROVINCIA');
      Canton := ExtractUbicacion_Digital(SL, 'CANTON');
      Tipo := NormalizeTipo_Digital(SL);
    end;

    // Lógica de teléfono (celular primero, luego teléfono domicilio)
    if Cel <> '' then
      TelefonoFinal := Cel
    else
      TelefonoFinal := Tel;

    // Limpieza final del nombre (remover RUC si está incluido)
    if (Ruc <> '') and (Pos(Ruc, Nombre) > 0) then
      Nombre := Trim(StringReplace(Nombre, Ruc, '', [rfReplaceAll]));

    Root := TJSONObject.Create;
    try
      Root.AddPair('ruc', Ruc);
      Root.AddPair('apellidos_nombres', Nombre);
      Root.AddPair('estado', Estado);
      Root.AddPair('regimen', Regimen);
      Root.AddPair('direccion', Direccion);
      Root.AddPair('email', Email);
      Root.AddPair('telefono', TelefonoFinal);
      Root.AddPair('provincia', Provincia);
      Root.AddPair('canton', Canton);
      Root.AddPair('tipo', Tipo);

      Result := PrettyPrintJson(Root.ToJSON);
    finally
      Root.Free;
    end;
  finally
    SL.Free;
  end;
end;

{==============================================================================}
{                    Función Pública (Entry Point)                             }
{==============================================================================}

function Pdf2Json(const APdfPath: string; out AJsonRespuesta, AError: string): Boolean;
var
  Text: string;
begin
  AJsonRespuesta := '';
  AError := '';
  Result := False;

  // 1. Extracción con validación de imagen y OCR automático
  if not PdfFileToText(APdfPath, Text, AError) then
    Exit;

  // 2. Parseo
  try
    AJsonRespuesta := PdfTextToJson(Text);

    if Pos('"ruc": ""', AJsonRespuesta) > 0 then
      AError := 'Advertencia: Se leyó texto del PDF, pero no se identificó el RUC.'
    else
      AError := '';

    Result := True;
  except
    on E: Exception do
    begin
      AError := 'Excepción al procesar datos: ' + E.Message;
      Result := False;
    end;
  end;
end;

end.

