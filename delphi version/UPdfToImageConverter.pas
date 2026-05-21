unit UPdfToImageConverter;

interface

uses
  System.SysUtils,
  System.Classes,
  System.Math,
  System.Math.Vectors,
  System.Types,
  System.UITypes,
  FMX.Types,
  FMX.Graphics,
  Winsoft.FireMonkey.PDFium;

type
  TWatermarkPosition  = (wpDiagonal, wpCorners);
  TWatermarkPositions = set of TWatermarkPosition;

  TPdfToImageConverter = class
  private
    FWatermarkText: string;
    FUserInfo: string;
    FWatermarkPositions: TWatermarkPositions;
    FPixelsPerInch: Integer;
    function PointsToPixels(const APoints: Single): Integer;
    procedure ApplyWatermarkToBitmap(const ABitmap: TBitmap);
  public
    constructor Create;

    procedure SetWatermarkText(const AText: string);
    procedure SetUserInfo(const AUserInfo: string);
    procedure SetWatermarkPositions(const APositions: TWatermarkPositions);

    /// <summary>
    /// Convierte AInputPdf a un nuevo PDF AOutputPdf formado sólo por imágenes
    /// con marca de agua quemada en el bitmap.
    /// </summary>
    function ConvertPdfToProtectedPdf(const AInputPdf, AOutputPdf: string): Boolean;
  end;

implementation

{ TPdfToImageConverter }

constructor TPdfToImageConverter.Create;
begin
  inherited Create;
  // Marca de agua en diagonal + esquinas por defecto
  FWatermarkPositions := [wpDiagonal, wpCorners];
  // Resolución razonable para no generar PDFs gigantes
  FPixelsPerInch := 144; // ~2x 72 dpi
end;

procedure TPdfToImageConverter.SetWatermarkText(const AText: string);
begin
  FWatermarkText := AText;
end;

procedure TPdfToImageConverter.SetUserInfo(const AUserInfo: string);
begin
  FUserInfo := AUserInfo;
end;

procedure TPdfToImageConverter.SetWatermarkPositions(
  const APositions: TWatermarkPositions);
begin
  FWatermarkPositions := APositions;
end;

function TPdfToImageConverter.PointsToPixels(const APoints: Single): Integer;
begin
  // 1 punto = 1/72 de pulgada
  Result := Round(APoints * FPixelsPerInch / 72.0);
end;

procedure TPdfToImageConverter.ApplyWatermarkToBitmap(const ABitmap: TBitmap);
var
  Canvas: TCanvas;
  R: TRectF;
  FontSize: Single;
  DiagText: string;
  M: System.Math.Vectors.TMatrix;
  State: TCanvasSaveState;
const
  ALPHA_WATERMARK: TAlphaColor = $40FFFFFF;
begin
  if (ABitmap = nil) or ABitmap.IsEmpty then
    Exit;

  if FWatermarkText = '' then
    Exit;

  Canvas := ABitmap.Canvas;
  Canvas.BeginScene;
  try
    FontSize := Max(ABitmap.Width, ABitmap.Height) / 18;

    Canvas.Fill.Kind  := TBrushKind.Solid;
    Canvas.Fill.Color := ALPHA_WATERMARK;
    Canvas.Font.Size  := FontSize;
    Canvas.Font.Style := [TFontStyle.fsBold];

    // --- Texto en diagonal (centro) ---
    if wpDiagonal in FWatermarkPositions then
    begin
      DiagText := FWatermarkText;

      // --- 2. CAPTURAR EL ESTADO ---
      State := Canvas.SaveState;
      try
        M := System.Math.Vectors.TMatrix.Identity;
        M.m31 := ABitmap.Width / 2;
        M.m32 := ABitmap.Height / 2;
        M := M * System.Math.Vectors.TMatrix.CreateRotation(DegToRad(-45));
        Canvas.SetMatrix(M);

        R := RectF(-ABitmap.Width, -FontSize * 1.5, ABitmap.Width, FontSize * 1.5);

        Canvas.FillText(R, DiagText, False, 1,
                        [], TTextAlign.Center, TTextAlign.Center);
      finally
        // --- 3. RESTAURAR EL ESTADO ESPECÍFICO ---
        Canvas.RestoreState(State);
      end;
    end;

    // --- Textos en esquinas (Resto del código igual, sin TTextTrimming) ---
    if wpCorners in FWatermarkPositions then
    begin
      FontSize := FontSize * 0.5;
      Canvas.Font.Size := FontSize;

      // Superior izquierda
      R := RectF(ABitmap.Width * 0.02, ABitmap.Height * 0.02,
                 ABitmap.Width * 0.48, ABitmap.Height * 0.18);
      Canvas.FillText(R, FWatermarkText, False, 1, [], TTextAlign.Leading, TTextAlign.Leading);

      // Superior derecha
      R := RectF(ABitmap.Width * 0.52, ABitmap.Height * 0.02,
                 ABitmap.Width * 0.98, ABitmap.Height * 0.18);
      Canvas.FillText(R, FUserInfo, False, 1, [], TTextAlign.Trailing, TTextAlign.Leading);

      // Inferior izquierda
      R := RectF(ABitmap.Width * 0.02, ABitmap.Height * 0.82,
                 ABitmap.Width * 0.48, ABitmap.Height * 0.98);
      Canvas.FillText(R, FUserInfo, False, 1, [], TTextAlign.Leading, TTextAlign.Trailing);

      // Inferior derecha
      R := RectF(ABitmap.Width * 0.52, ABitmap.Height * 0.82,
                 ABitmap.Width * 0.98, ABitmap.Height * 0.98);
      Canvas.FillText(R, FWatermarkText, False, 1, [], TTextAlign.Trailing, TTextAlign.Trailing);
    end;
  finally
    Canvas.EndScene;
  end;
end;

function TPdfToImageConverter.ConvertPdfToProtectedPdf(
  const AInputPdf, AOutputPdf: string): Boolean;
var
  PdfSrc, PdfDst: TFPdf;
  PageIndex: Integer;
  Bitmap: TBitmap;
  PageWidthPt, PageHeightPt: Single;
  TargetWidthPx, TargetHeightPx: Integer;
begin
  Result := False;

  if not FileExists(AInputPdf) then
    Exit;

  PdfSrc := TFPdf.Create(nil);
  PdfDst := TFPdf.Create(nil);
  try
    // --- Cargar documento origen ---
    PdfSrc.FileName   := AInputPdf;
    PdfSrc.PageNumber := 0;
    PdfSrc.Active     := True;

    // --- Crear documento destino vacío ---
    PdfDst.Active := True;

    for PageIndex := 0 to PdfSrc.PageCount - 1 do
    begin
      PdfSrc.PageNumber := PageIndex + 1;

      PageWidthPt  := PdfSrc.PageWidth;   // en puntos
      PageHeightPt := PdfSrc.PageHeight;

      TargetWidthPx  := PointsToPixels(PageWidthPt);
      TargetHeightPx := PointsToPixels(PageHeightPt);

      // Render de la página a bitmap
      Bitmap := PdfSrc.RenderPage(0, 0, TargetWidthPx, TargetHeightPx);
      try
        // Marca de agua sobre la imagen
        ApplyWatermarkToBitmap(Bitmap);

        // Nueva página en el PDF destino con el mismo tamaño
        PdfDst.AddPage(PdfDst.PageCount + 1, PageWidthPt, PageHeightPt);
        PdfDst.PageNumber := PdfDst.PageCount;

        // Imagen ocupa toda la página
        PdfDst.AddPicture(Bitmap, 0, 0, PageWidthPt, PageHeightPt);
      finally
        Bitmap.Free;
      end;
    end;

    PdfDst.SaveAs(AOutputPdf);
    Result := True;
  finally
    PdfSrc.Free;
    PdfDst.Free;
  end;
end;

end.

