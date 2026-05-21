unit uTrazabilidadAPU;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FMX.TMSFNCTypes, FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes,
  System.Rtti, FMX.TMSFNCDataGridCell, FMX.TMSFNCDataGridData,
  FMX.TMSFNCDataGridBase, FMX.TMSFNCDataGridCore, FMX.TMSFNCDataGridRenderer,
  FMX.TMSFNCSplitter, Data.DB, MemDS, DBAccess, Uni, FMX.TMSFNCCustomComponent,
  FMX.TMSFNCDataGridDatabaseAdapter, FMX.TMSFNCCustomControl,
  FMX.TMSFNCDataGrid, FMX.Objects, FMX.Controls.Presentation, FMX.StdCtrls,
  FMX.Layouts;

type
  TfrmTrazabilidadAPU = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    lyt_footer: TLayout;
    Rectangle1: TRectangle;
    lyt2: TLayout;
    rect_Aceptar: TRectangle;
    lbl1: TLabel;
    Layout1: TLayout;
    Layout2: TLayout;
    lbl_apu: TLabel;
    Layout3: TLayout;
    TMSFNCSplitter1: TTMSFNCSplitter;
    Layout4: TLayout;
    Label2: TLabel;
    Label3: TLabel;
    Grid_APUsAnidados: TTMSFNCDataGrid;
    DBAdapter_APUsAnidados: TTMSFNCDataGridDatabaseAdapter;
    Grid_ProyectosAsociados: TTMSFNCDataGrid;
    DBAdapter_ProyectosAsociados: TTMSFNCDataGridDatabaseAdapter;
    QApusAnidados: TUniQuery;
    QProyectosAsociados: TUniQuery;
    DS_APUsAnidados: TUniDataSource;
    DS_ProyectosAnidados: TUniDataSource;
    QProyectosAsociadoscodPresupuesto: TStringField;
    QProyectosAsociadosrevision: TStringField;
    QProyectosAsociadosDescripcion: TStringField;
    QApusAnidadosCodAPU_Anidado: TStringField;
    QApusAnidadosDescripcion: TStringField;
    procedure rect_AceptarClick(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure Grid_APUsAnidadosCellDblClick(Sender: TObject; AColumn,
      ARow: Integer);
    procedure Grid_ProyectosAsociadosCellDblClick(Sender: TObject; AColumn,
      ARow: Integer);
  private
    { Private declarations }
  public
    { Public declarations }
    TipoSalida: integer;
    TCodProyecto: string;
    TRevision: string;
    TApusAnidado: string;
  end;

var
  frmTrazabilidadAPU: TfrmTrazabilidadAPU;

implementation

{$R *.fmx}
uses DM1;

procedure TfrmTrazabilidadAPU.FormCreate(Sender: TObject);
begin
  TipoSalida := 0;
  TcodProyecto := '';
  TRevision := '';
  TApusAnidado := '';
end;

procedure TfrmTrazabilidadAPU.Grid_APUsAnidadosCellDblClick(Sender: TObject;
  AColumn, ARow: Integer);
var
  descripcionAPU: string;
begin
  TipoSalida := 1;
  descripcionAPU := grid_ApusAnidados.cells[1, Arow].ToString.Trim;
  if realizarPreguntaSiNo('¿Abrir el APU: ' + descripcionAPU + '?') <> mrOK then
    exit;
  TApusAnidado := grid_apusAnidados.cells[0, ARow].ToString.Trim;
  ModalResult := mrOK;
end;

procedure TfrmTrazabilidadAPU.Grid_ProyectosAsociadosCellDblClick(
  Sender: TObject; AColumn, ARow: Integer);
var
  DescripcionProyecto: string;
begin
  TipoSalida := 2;
  TCodProyecto := grid_ProyectosAsociados.cells[0, Arow].ToString.Trim;
  TRevision := grid_ProyectosAsociados.cells[1, Arow].ToString.Trim;
  if realizarPreguntaSiNo('¿Abrir el Proyecto: ' + DescripcionProyecto + ' Rev. ' + TRevision + ' ?') <> mrOK
    then
    exit;
  ModalResult := mrOK;
end;

procedure TfrmTrazabilidadAPU.rect_AceptarClick(Sender: TObject);
begin
  modalResult := mrCancel;
end;

end.

