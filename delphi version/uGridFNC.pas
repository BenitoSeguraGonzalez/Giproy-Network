{
Ejemplos de uso:

1) Columna que rellena el grid
  FillCol(grid, 6);

2) Varias columnas que se reparten el espacio libre (equitativo)
  FillCols(grid, [3,4,5]);

3) Autoajuste varias columnas (contenido + header)
  FitCols(grid, [1,2,3,6]);

4) Autoajuste con margen adicional
  FitCols(grid, [1,2,3,6], 5);

5) Ocultar columnas
  HideCol(grid, 0);
  HideCols(grid, [4,5,7]);
}

unit uGridFNC;

interface

uses
  System.SysUtils,
  System.Math,
  FMX.Types,
  FMX.Graphics,
  FMX.TMSFNCCustomGrid,
  FMX.TMSFNCGrid;

type
  TCols = array of Integer;

procedure FillCol(G: TTMSFNCGrid; Col: Integer);
procedure FillCols(G: TTMSFNCGrid; const Cols: TCols);
procedure FitCols(G: TTMSFNCGrid; const Cols: TCols; Extra: Single = 0);
procedure HideCol(G: TTMSFNCGrid; Col: Integer);
procedure HideCols(G: TTMSFNCGrid; const Cols: TCols);

implementation

function TextW(G: TTMSFNCGrid; const S: string): Single;
begin
  Result := G.Canvas.TextWidth(S) + 16; // margen base
end;

function HeaderText(G: TTMSFNCGrid; Col: Integer): string;
begin
  if (G.FixedRows > 0) and (Col >= 0) and (Col < G.ColumnCount) then
    Result := G.Cells[Col, G.FixedRows - 1]
  else
    Result := '';
end;

function InCols(Value: Integer; const Cols: TCols): Boolean;
var
  i: Integer;
begin
  Result := False;
  for i := 0 to High(Cols) do
    if Cols[i] = Value then
      Exit(True);
end;

function MinColWidth(G: TTMSFNCGrid; Col: Integer): Single;
var
  r: Integer;
  W, MaxW: Single;
  S: string;
begin
  MaxW := TextW(G, HeaderText(G, Col));

  for r := G.FixedRows to G.RowCount - 1 do
  begin
    S := G.Cells[Col, r];
    W := TextW(G, S);
    if W > MaxW then
      MaxW := W;
  end;

  Result := MaxW;
end;

procedure FillCol(G: TTMSFNCGrid; Col: Integer);
var
  i: Integer;
  Total, Libre, MinW: Single;
begin
  if (G = nil) or (Col < 0) or (Col >= G.ColumnCount) then
    Exit;

  G.BeginUpdate;
  try
    Total := 0;

    for i := 0 to G.ColumnCount - 1 do
      if (i <> Col) and (G.ColumnWidths[i] > 0) then
        Total := Total + G.ColumnWidths[i];

    Libre := G.Width - Total - 4;

    MinW := MinColWidth(G, Col);
    if Libre < MinW then
      Libre := MinW;

    G.ColumnWidths[Col] := Libre;
  finally
    G.EndUpdate;
  end;
end;

procedure FillCols(G: TTMSFNCGrid; const Cols: TCols);
var
  i, c: Integer;
  Valid: TCols;
  Total, Libre, AnchoUnit, MinW, SumaMin: Single;
  N: Integer;
begin
  if (G = nil) or (Length(Cols) = 0) then
    Exit;

  SetLength(Valid, 0);
  for c in Cols do
  begin
    if (c < 0) or (c >= G.ColumnCount) then
      Continue;
    if InCols(c, Valid) then
      Continue;
    SetLength(Valid, Length(Valid) + 1);
    Valid[High(Valid)] := c;
  end;

  N := Length(Valid);
  if N = 0 then
    Exit;

  G.BeginUpdate;
  try
    Total := 0;
    for i := 0 to G.ColumnCount - 1 do
    begin
      if G.ColumnWidths[i] <= 0 then
        Continue;

      if not InCols(i, Valid) then
        Total := Total + G.ColumnWidths[i];
    end;

    Libre := G.Width - Total - 4;

    SumaMin := 0;
    for c in Valid do
      SumaMin := SumaMin + MinColWidth(G, c);

    if Libre <= SumaMin then
    begin
      for c in Valid do
        G.ColumnWidths[c] := MinColWidth(G, c);
      Exit;
    end;

    AnchoUnit := Libre / N;

    for c in Valid do
    begin
      MinW := MinColWidth(G, c);
      if AnchoUnit < MinW then
        G.ColumnWidths[c] := MinW
      else
        G.ColumnWidths[c] := AnchoUnit;
    end;
  finally
    G.EndUpdate;
  end;
end;

procedure FitCols(G: TTMSFNCGrid; const Cols: TCols; Extra: Single = 0);
var
  c: Integer;
  MaxW: Single;
begin
  if (G = nil) or (Length(Cols) = 0) then
    Exit;

  G.BeginUpdate;
  try
    for c in Cols do
    begin
      if (c < 0) or (c >= G.ColumnCount) then
        Continue;

      MaxW := MinColWidth(G, c) + Extra;
      G.ColumnWidths[c] := MaxW;
    end;
  finally
    G.EndUpdate;
  end;
end;

procedure HideCol(G: TTMSFNCGrid; Col: Integer);
begin
  if (G <> nil) and (Col >= 0) and (Col < G.ColumnCount) then
    G.ColumnWidths[Col] := 0;
end;

procedure HideCols(G: TTMSFNCGrid; const Cols: TCols);
var
  c: Integer;
begin
  if (G = nil) then
    Exit;

  for c in Cols do
    if (c >= 0) and (c < G.ColumnCount) then
      G.ColumnWidths[c] := 0;
end;

end.

