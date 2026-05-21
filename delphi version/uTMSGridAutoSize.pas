{
    AutoSizeGridPorContenido( grid_APUsRelacionados,
                              5, // número de columnas a formatear
                              [400, 120, 100, 90, 110], // ancho mínimo por columna
                              500, // ancho máximo
                              16   // padding
                            );
}
unit uTMSGridAutoSize;

interface

uses
  System.SysUtils, System.Types, FMX.Graphics, FMX.Types, FMX.TMSFNCCustomGrid,
  FMX.TMSFNCGrid, FMX.TMSFNCTypes, FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes,
  System.Rtti, FMX.TMSFNCDataGridCell, FMX.TMSFNCDataGridData, FMX.TMSFNCCustomComponent,
  FMX.TMSFNCCustomControl, FMX.TMSFNCDataGrid, FMX.TMSFNCDataGridBase, FMX.TMSFNCDataGridCore,
  FMX.TMSFNCDataGridRenderer;

type
  TMinWidths = array of Single;

procedure AutoSizeGridPorContenido(
  const AGrid: TTMSFNCDataGrid;
  const AColCount: Integer;
  const AMinWidths: TMinWidths;
  const AMaxWidth: Single = 400;
  const APadding: Single = 14
  );

implementation

procedure AutoSizeGridPorContenido(const AGrid: TTMSFNCDataGrid; const AColCount: Integer; const AMinWidths:
  TMinWidths; const AMaxWidth: Single; const APadding: Single);
var
  Col, Row: Integer;
  W, MaxW: Single;
  Txt: string;
  Cnv: TCanvas;
  MinW: Single;
begin
  if not Assigned(AGrid) then
    Exit;

  if AGrid.ColumnCount = 0 then
    Exit;

  if Length(AMinWidths) < AColCount then
    raise Exception.Create('AMinWidths debe tener al menos AColCount elementos');

  Cnv := AGrid.Canvas;

  AGrid.BeginUpdate;
  try
    for Col := 0 to AColCount - 1 do
    begin
      MinW := AMinWidths[Col];

      // 🔴 NUEVA REGLA: ancho mínimo = 0 → columna invisible
      if MinW <= 0 then
      begin
        AGrid.Columns[Col].Visible := False;
        Continue;
      end
      else
        AGrid.Columns[Col].Visible := True;

      MaxW := MinW;

      // 1) Cabecera
      Txt := AGrid.Columns[Col].Header;
      if Txt <> '' then
      begin
        W := Cnv.TextWidth(Txt) + APadding;
        if W > MaxW then
          MaxW := W;
      end;

      // 2) Celdas
      for Row := 0 to AGrid.RowCount - 1 do
      begin
        Txt := AGrid.Cells[Col, Row].ToString;
        if Txt <> '' then
        begin
          W := Cnv.TextWidth(Txt) + APadding;
          if W > MaxW then
            MaxW := W;
        end;
      end;

      // 3) Límite máximo
      if MaxW > AMaxWidth then
        MaxW := AMaxWidth;

      // 4) Aplicar
      AGrid.Columns[Col].Width := MaxW;
    end;
  finally
    AGrid.EndUpdate;
  end;
end;

end.

