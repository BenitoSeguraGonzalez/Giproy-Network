unit uTrazabilidadRecursos;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FMX.ListView.Types, FMX.ListView.Appearances, FMX.ListView.Adapters.Base,
  FMX.ListView, FMX.Controls.Presentation, FMX.StdCtrls, FMX.Objects,
  FMX.Layouts, Data.DB, MemDS, DBAccess, Uni, FMX.TMSFNCTypes, FMX.TMSFNCUtils,
  FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, System.Rtti,
  FMX.TMSFNCDataGridCell, FMX.TMSFNCDataGridData, FMX.TMSFNCDataGridBase,
  FMX.TMSFNCDataGridCore, FMX.TMSFNCDataGridRenderer, FMX.TMSFNCCustomComponent,
  FMX.TMSFNCDataGridDatabaseAdapter, FMX.TMSFNCCustomControl, FMX.TMSFNCDataGrid,
  FMX.TMSFNCCustomGrid, FMX.TMSFNCGridDatabaseAdapter, TMS.TMSFNCDataSet;

type
  TfrmTrazabilidadRecursos = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    Rectangle1: TRectangle;
    Layout1: TLayout;
    Layout2: TLayout;
    Layout3: TLayout;
    lbl_Recurso: TLabel;
    Grid_APUsRelacionados: TTMSFNCDataGrid;
    DBAdapter_1: TTMSFNCDataGridDatabaseAdapter;
    QAPUsRelacionados: TUniQuery;
    DS_QAPUsRelacionados: TUniDataSource;
    QAPUsRelacionadoscodAPU: TStringField;
    QAPUsRelacionadosDescripcion: TStringField;
    QAPUsRelacionadosUnidad: TStringField;
    QAPUsRelacionadosCostoDirectoTotal: TFloatField;
    QAPUsRelacionadosCostoIndirectoTotal: TFloatField;
    QAPUsRelacionadosPrecioUnitarioTotal: TFloatField;
    QAPUsRelacionadoscodCPC: TStringField;
    lyt2: TLayout;
    rect_Aceptar: TRectangle;
    lbl1: TLabel;
    Line1: TLine;
    Line2: TLine;
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure Button1Click(Sender: TObject);
    procedure rect_AceptarClick(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure Grid_APUsRelacionadosCellDblClick(Sender: TObject; AColumn,
      ARow: Integer);
  private
    { Private declarations }
    procedure AutoSizeGridPorContenidoReal;
  public
    { Public declarations }
    TcodAPU: string;
  end;

var
  frmTrazabilidadRecursos: TfrmTrazabilidadRecursos;

implementation

{$R *.fmx}
uses DM1, uTMSGridAutoSize;

procedure TfrmTrazabilidadRecursos.AutoSizeGridPorContenidoReal;
var
  Col, Row: Integer;
  W, MaxW: Single;
  Txt: string;
  Cnv: TCanvas;
const
  MIN_W = 90;
  MAX_W = 400;
  PAD = 14; // margen visual
begin
  if grid_APUsRelacionados.ColumnCount = 0 then
    Exit;

  Cnv := grid_APUsRelacionados.Canvas;

  grid_APUsRelacionados.BeginUpdate;
  try
    for Col := 0 to grid_APUsRelacionados.ColumnCount - 1 do
    begin
      MaxW := MIN_W;

      // 1️⃣ medir cabecera
      Txt := grid_APUsRelacionados.Columns[Col].Header;
      if Txt <> '' then
      begin
        W := Cnv.TextWidth(Txt) + PAD;
        if W > MaxW then
          MaxW := W;
      end;

      // 2️⃣ medir contenido visible
      for Row := 0 to grid_APUsRelacionados.RowCount - 1 do
      begin
        Txt := grid_APUsRelacionados.Cells[Col, Row].ToString;
        if Txt <> '' then
        begin
          W := Cnv.TextWidth(Txt) + PAD;
          if W > MaxW then
            MaxW := W;
        end;
      end;

      // 3️⃣ límites
      if MaxW < MIN_W then
        MaxW := MIN_W
      else if MaxW > MAX_W then
        MaxW := MAX_W;

      // 4️⃣ aplicar
      grid_APUsRelacionados.Columns[Col].Width := MaxW;
    end;
  finally
    grid_APUsRelacionados.Columns[0].Width := 400;
    grid_APUsRelacionados.EndUpdate;
  end;
end;

procedure TfrmTrazabilidadRecursos.Button1Click(Sender: TObject);
begin
  modalresult := mrOK;
end;

procedure TfrmTrazabilidadRecursos.FormShow(Sender: TObject);
begin
  TThread.Queue(nil,
    procedure
    begin
      AutoSizeGridPorContenidoReal;
    end
    );
end;

procedure TfrmTrazabilidadRecursos.Grid_APUsRelacionadosCellDblClick(
  Sender: TObject; AColumn, ARow: Integer);
var
  descripcionAPU: string;
begin
  TcodAPU := grid_APUsRelacionados.cells[0, Arow].ToString;
  descripcionAPU := grid_APUsRelacionados.cells[1, Arow].ToString;
  if realizarPreguntaSiNo('¿Abrir el APU: ' + descripcionAPU + '?') <> mrOK then
    exit;
  ModalResult := mrOK;
end;

procedure TfrmTrazabilidadRecursos.rect_1MouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmTrazabilidadRecursos.rect_AceptarClick(Sender: TObject);
begin
  modalresult := mrclose;
end;

end.

