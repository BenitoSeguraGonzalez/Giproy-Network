unit uBitmapUtils;

interface

uses
        System.SysUtils, System.Classes, System.NetEncoding, System.Types,
        System.UITypes, System.Math, FMX.Types, FMX.Graphics, FMX.Surfaces,
        System.Net.HttpClient, System.Net.URLClient,
        System.Net.HttpClientComponent;

type
        /// Modo de escalado proporcional
        TBitmapScaleMode = (bsmFit, bsmCover);

        { =========================
          Funciones libres (procedurales)
          ========================= }

        /// Convierte un string Base64 (acepta también data URI) a TBitmap (PNG con alpha).
        /// Devuelve nil si falla; AError con el motivo.
function BitmapFromBase64(const ABase64: string; out AError: string): TBitmap;

/// Convierte un TBitmap a Base64.
/// AFormat: 'image/png' (default) o 'image/jpeg'.
/// Si AAsDataURI = True, devuelve "data:<mime>;base64,<...>"
function BitmapToBase64(const ABmp: TBitmap;
  const AFormat: string = 'image/png';
  const AAsDataURI: Boolean = False): string;

/// Redimensiona proporcionalmente un bitmap a (TargetW x TargetH).
/// bsmFit  = encajar (pueden quedar bandas).
/// bsmCover= cubrir (recorta centrado).
/// ABackground = color de fondo; TAlphaColors.Null => transparente.
function ResizeBitmapProportional(const Src: TBitmap;
  const TargetW, TargetH: Integer; const Mode: TBitmapScaleMode;
  const ABackground: TAlphaColor = TAlphaColors.Null): TBitmap;

/// Descarga una imagen desde una URL (PNG o JPG), valida su formato
/// y opcionalmente la redimensiona (Fit o Cover).
/// - Si TargetW o TargetH <= 0 => devuelve tamaño original.
/// - ABackground = TAlphaColors.Null preserva transparencia.
/// Devuelve nil si hay error, y en AError la razón.
function DownloadBitmapFromUrl(const AUrl: string; out AError: string;
  const TargetW: Integer = 0; const TargetH: Integer = 0;
  const Mode: TBitmapScaleMode = bsmFit;
  const ABackground: TAlphaColor = TAlphaColors.Null;
  const ConnTimeoutMS: Integer = 10000;
  const RespTimeoutMS: Integer = 15000): TBitmap;

{ =========================
  Interfaz orientada a objetos (helpers estáticos)
  ========================= }
type
        TBitmapUtils = class sealed
        public
                class function FromBase64(const ABase64: string;
                  out AError: string): TBitmap; static;
                class function ToBase64(const ABmp: TBitmap;
                  const AFormat: string = 'image/png';
                  const AAsDataURI: Boolean = False): string; static;
                class function Resize(const Src: TBitmap;
                  const TargetW, TargetH: Integer; const Mode: TBitmapScaleMode;
                  const ABackground: TAlphaColor = TAlphaColors.Null)
                  : TBitmap; static;
                class function Download(const AUrl: string; out AError: string;
                  const TargetW: Integer = 0; const TargetH: Integer = 0;
                  const Mode: TBitmapScaleMode = bsmFit;
                  const ABackground: TAlphaColor = TAlphaColors.Null;
                  const ConnTimeoutMS: Integer = 10000;
                  const RespTimeoutMS: Integer = 15000): TBitmap; static;
        end;

implementation

{ ---------------- Base64 -> TBitmap ---------------- }

function BitmapFromBase64(const ABase64: string; out AError: string): TBitmap;
var
        S: string;
        CommaPos: Integer;
        Bytes: TBytes;
        BS: TBytesStream;
begin
        Result := nil;
        AError := '';

        S := Trim(ABase64);
        if S = '' then
        begin
                AError := 'Cadena base64 vacía.';
                Exit(nil);
        end;

        // Si viene como data URI: data:image/png;base64,XXXX
        if S.StartsWith('data:', True) then
        begin
                CommaPos := S.IndexOf(',');
                if CommaPos > 0 then
                        S := S.Substring(CommaPos + 1); // solo la parte base64
        end;

        try
                Bytes := TNetEncoding.Base64.DecodeStringToBytes(S);
        except
                on E: Exception do
                begin
                        AError := 'Base64 inválido: ' + E.Message;
                        Exit(nil);
                end;
        end;

        BS := TBytesStream.Create(Bytes);
        try
                BS.Position := 0;
                Result := TBitmap.Create;
                try
                        Result.LoadFromStream(BS);
                        // FMX soporta PNG/JPG. PNG mantiene alpha.
                        if (Result.Width = 0) or (Result.Height = 0) then
                        begin
                                FreeAndNil(Result);
                                AError := 'Imagen sin dimensiones válidas.';
                        end;
                except
                        on E: Exception do
                        begin
                                FreeAndNil(Result);
                                AError := 'No se pudo decodificar la imagen: ' +
                                  E.Message;
                        end;
                end;
        finally
                BS.Free;
        end;
end;

{ ---------------- TBitmap -> Base64 ---------------- }

function BitmapToBase64(const ABmp: TBitmap; const AFormat: string;
  const AAsDataURI: Boolean): string;
var
        Ext: string;
        MS: TMemoryStream;
        Bytes: TBytes;
        Mime: string;
        Surf: TBitmapSurface;
begin
        Result := '';
        if (ABmp = nil) or ABmp.IsEmpty then
                Exit;

        Mime := LowerCase(Trim(AFormat));
        if Mime = '' then
                Mime := 'image/png';

        if Mime.Contains('png') then
                Ext := '.png'
        else if Mime.Contains('jpg') or Mime.Contains('jpeg') then
                Ext := '.jpg'
        else
        begin
                // fallback
                Mime := 'image/png';
                Ext := '.png';
        end;

        MS := TMemoryStream.Create;
        Surf := TBitmapSurface.Create;
        try
                Surf.Assign(ABmp); // convierte el bitmap a superficie genérica

                if not TBitmapCodecManager.SaveToStream(MS, Surf, Ext) then
                        raise Exception.CreateFmt
                          ('No se pudo codificar bitmap como %s', [Ext]);

                SetLength(Bytes, MS.Size);
                MS.Position := 0;
                MS.ReadBuffer(Bytes[0], MS.Size);

                Result := TNetEncoding.Base64.EncodeBytesToString(Bytes);

                if AAsDataURI then
                        Result := Format('data:%s;base64,%s', [Mime, Result]);
        finally
                Surf.Free;
                MS.Free;
        end;
end;

{ ---------------- Redimensionado proporcional ---------------- }

function ResizeBitmapProportional(const Src: TBitmap;
  const TargetW, TargetH: Integer; const Mode: TBitmapScaleMode;
  const ABackground: TAlphaColor): TBitmap;
var
        SrcRect, DstRect: TRectF;
        SrcW, SrcH, TW, TH: Single;
        SrcAspect, TargetAspect: Single;
        Scale, NewW, NewH: Single;
        OffsetX, OffsetY: Single;
begin
        Result := nil;
        if (Src = nil) or Src.IsEmpty then
                Exit(nil);
        if (TargetW <= 0) or (TargetH <= 0) then
                Exit(nil);

        SrcW := Src.Width;
        SrcH := Src.Height;
        TW := TargetW;
        TH := TargetH;

        SrcAspect := SrcW / SrcH;
        TargetAspect := TW / TH;

        case Mode of
                bsmFit:
                        begin
                                // Encajar entero (puede dejar bandas)
                                Scale := Min(TW / SrcW, TH / SrcH);
                                NewW := SrcW * Scale;
                                NewH := SrcH * Scale;
                                OffsetX := (TW - NewW) * 0.5;
                                OffsetY := (TH - NewH) * 0.5;

                                SrcRect := RectF(0, 0, SrcW, SrcH);
                                DstRect :=
                                  RectF(OffsetX, OffsetY, OffsetX + NewW,
                                  OffsetY + NewH);
                        end;

                bsmCover:
                        begin
                                // Cubrir todo el destino: recorte centrado en la fuente
                                if SrcAspect > TargetAspect then
                                begin
                                        // sobra ancho -> recorto en X
                                        var
                                        CropH := SrcH;
                                        var
                                        CropW := TargetAspect * CropH;
                                        var
                                        CropX := (SrcW - CropW) * 0.5;
                                        SrcRect :=
                                        RectF(CropX, 0, CropX + CropW, CropH);
                                end
                                else
                                begin
                                        // sobra alto -> recorto en Y
                                        var
                                        CropW := SrcW;
                                        var
                                        CropH := CropW / TargetAspect;
                                        var
                                        CropY := (SrcH - CropH) * 0.5;
                                        SrcRect :=
                                        RectF(0, CropY, CropW, CropY + CropH);
                                end;

                                DstRect := RectF(0, 0, TW, TH);
                        end;
        else
                // fallback
                SrcRect := RectF(0, 0, SrcW, SrcH);
                DstRect := RectF(0, 0, TW, TH);
        end;

        Result := TBitmap.Create(TargetW, TargetH);
        if Result.Canvas.BeginScene then
                try
                        if ABackground = TAlphaColors.Null then
                                Result.Clear(TAlphaColors.Null)
                                // preserva canal alpha
                        else
                                Result.Clear(ABackground);

                        // Interpolación de alta calidad
                        Result.Canvas.DrawBitmap(Src, SrcRect, DstRect,
                          1.0, True);
                finally
                        Result.Canvas.EndScene;
                end;
end;

{ ---------------- Descarga URL -> TBitmap (validando PNG/JPG) ---------------- }

type
        TImageKind = (ikUnknown, ikPNG, ikJPEG);

function DetectImageKind(const Bytes: TBytes): TImageKind;
begin
        Result := ikUnknown;
        if Length(Bytes) >= 8 then
        begin
                // PNG: 89 50 4E 47 0D 0A 1A 0A
                if (Bytes[0] = $89) and (Bytes[1] = $50) and (Bytes[2] = $4E)
                  and (Bytes[3] = $47) and (Bytes[4] = $0D) and (Bytes[5] = $0A)
                  and (Bytes[6] = $1A) and (Bytes[7] = $0A) then
                        Exit(ikPNG);
        end;

        if Length(Bytes) >= 2 then
        begin
                // JPEG: FF D8 (inicio) ... FF D9 (fin) – para validar firma inicial basta
                if (Bytes[0] = $FF) and (Bytes[1] = $D8) then
                        Exit(ikJPEG);
        end;
end;

function DownloadBitmapFromUrl(const AUrl: string; out AError: string;
  const TargetW: Integer; const TargetH: Integer; const Mode: TBitmapScaleMode;
  const ABackground: TAlphaColor; const ConnTimeoutMS, RespTimeoutMS
  : Integer): TBitmap;
var
        HTTP: TNetHTTPClient;
        Resp: IHTTPResponse;
        MS: TMemoryStream;
        Bytes: TBytes;
        Original: TBitmap;
        NeedResize: Boolean;
        StatusCode: Integer;
begin
        Result := nil;
        AError := '';

        if AUrl.Trim.IsEmpty then
        begin
                AError := 'La URL está vacía.';
                Exit(nil);
        end;

        HTTP := TNetHTTPClient.Create(nil);
        try
                HTTP.Accept :=
                  'image/png,image/jpeg;q=0.9,image/*;q=0.8,*/*;q=0.5';
                HTTP.ContentType := 'application/octet-stream';
                HTTP.ConnectionTimeout := ConnTimeoutMS;
                HTTP.ResponseTimeout := RespTimeoutMS;
                HTTP.UserAgent := 'uBitmapUtils/1.0 (+FMX)';

                MS := TMemoryStream.Create;
                try
                        try
                                Resp := HTTP.Get(AUrl, MS);
                        except
                                on E: Exception do
                                begin
                                        AError := 'Error de conexión: ' +
                                        E.Message;
                                        Exit(nil);
                                end;
                        end;

                        StatusCode := -1;
                        if Assigned(Resp) then
                                StatusCode := Resp.StatusCode;

                        if (Resp = nil) or (StatusCode < 200) or
                          (StatusCode >= 300) then
                        begin
                                AError := Format
                                  ('HTTP %d al descargar la imagen.',
                                  [StatusCode]);
                                Exit(nil);
                        end;

                        // Validar firma PNG/JPEG
                        SetLength(Bytes, MS.Size);
                        MS.Position := 0;
                        if MS.Size > 0 then
                                MS.ReadBuffer(Bytes[0], MS.Size);

                        case DetectImageKind(Bytes) of
                                ikPNG, ikJPEG:
                                        ; // ok
                        else
                                AError := 'Formato no válido. Se esperaba PNG o JPG.';
                                Exit(nil);
                        end;

                        // Decodificar a bitmap
                        MS.Position := 0;
                        Original := TBitmap.Create;
                        try
                                try
                                        Original.LoadFromStream(MS);
                                        // mantiene alpha en PNG
                                except
                                        on E: Exception do
                                        begin
                                        FreeAndNil(Original);
                                        AError := 'No se pudo decodificar la imagen: '
                                        + E.Message;
                                        Exit(nil);
                                        end;
                                end;

                                if (Original.Width <= 0) or
                                  (Original.Height <= 0) then
                                begin
                                        FreeAndNil(Original);
                                        AError := 'La imagen descargada no tiene dimensiones válidas.';
                                        Exit(nil);
                                end;

                                // ¿Redimensionar?
                                NeedResize := (TargetW > 0) and (TargetH > 0);
                                if not NeedResize then
                                begin
                                        // devolver tal cual (tamaño original)
                                        Result := TBitmap.Create;
                                        Result.Assign(Original);
                                end
                                else
                                begin
                                        Result := ResizeBitmapProportional
                                        (Original, TargetW, TargetH, Mode,
                                        ABackground);
                                        if Result = nil then
                                        AError := 'No se pudo redimensionar la imagen.';
                                end;

                        finally
                                Original.Free;
                        end;
                finally
                        MS.Free;
                end;

        finally
                HTTP.Free;
        end;
end;

{ ---------------- OO wrappers ---------------- }

class function TBitmapUtils.FromBase64(const ABase64: string;
  out AError: string): TBitmap;
begin
        Result := BitmapFromBase64(ABase64, AError);
end;

class function TBitmapUtils.Resize(const Src: TBitmap;
  const TargetW, TargetH: Integer; const Mode: TBitmapScaleMode;
  const ABackground: TAlphaColor): TBitmap;
begin
        Result := ResizeBitmapProportional(Src, TargetW, TargetH, Mode,
          ABackground);
end;

class function TBitmapUtils.ToBase64(const ABmp: TBitmap; const AFormat: string;
  const AAsDataURI: Boolean): string;
begin
        Result := BitmapToBase64(ABmp, AFormat, AAsDataURI);
end;

class function TBitmapUtils.Download(const AUrl: string; out AError: string;
  const TargetW, TargetH: Integer; const Mode: TBitmapScaleMode;
  const ABackground: TAlphaColor; const ConnTimeoutMS, RespTimeoutMS
  : Integer): TBitmap;
begin
        Result := DownloadBitmapFromUrl(AUrl, AError, TargetW, TargetH, Mode,
          ABackground, ConnTimeoutMS, RespTimeoutMS);
end;

end.
