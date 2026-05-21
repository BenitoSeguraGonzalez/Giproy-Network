unit uVisorEDT;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.TMSFNCTypes,
  FMX.TMSFNCUtils,
  FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, FMX.Effects,
  FMX.TMSFNCCustomControl,
  FMX.TMSFNCTreeViewBase, FMX.TMSFNCTreeViewData, FMX.TMSFNCCustomTreeView,
  FMX.TMSFNCTreeView,
  FMX.Edit, FMX.Objects, System.StrUtils, FMX.Controls.Presentation,
  FMX.StdCtrls, FMX.Layouts,
  FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions, FMX.TMSFNCCustomScrollControl,
  FMX.TMSFNCGridData,
  FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid;

type
  dat_edtValores = record
    edt: string;
    descripcionEDT: string;
    total: Double;
  end;

type
  TfrmVisorEDT = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_DatosGenerales: TLayout;
    lyt_9: TLayout;
    lbl_3: TLabel;
    ln_ln1: TLine;
    lyt_13: TLayout;
    lyt_1: TLayout;
    lbl_1: TLabel;
    edt_1: TEdit;
    rect_5: TRectangle;
    Trvw_VisorEDT: TTMSFNCTreeView;
    lyt_7: TLayout;
    lbl_descripcion: TLabel;
    lyt_footer: TLayout;
    rect_Aceptar: TRectangle;
    lbl_adicional: TLabel;
    lbl_paquete: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    rect_Reporte: TRectangle;
    lbl_2: TLabel;
    rect_6: TRectangle;
    lbl_4: TLabel;
    rect_7: TRectangle;
    procedure FormShow(Sender: TObject);
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure rect_AceptarClick(Sender: TObject);
    procedure rect_ReporteClick(Sender: TObject);
  private
    { Private declarations }
    procedure SincronizaEDT();
    procedure ExpandirNivel1;
  public
    { Public declarations }

  end;

var
  frmVisorEDT: TfrmVisorEDT;

implementation

{$R *.fmx}

uses
  DM1, uMain, DM_Presupuestos, uVisoreReportes;

procedure TfrmVisorEDT.FormShow(Sender: TObject);
begin
  visorEDTActivo := True;
  SincronizaEDT;
end;

procedure TfrmVisorEDT.rect_1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X,
  Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmVisorEDT.rect_AceptarClick(Sender: TObject);
begin
  modalResult := mrOK;
end;

procedure TfrmVisorEDT.rect_ReporteClick(Sender: TObject);
var
  LForm: TfrmVisorReportes;
begin
  LForm := TfrmVisorReportes.Create(Application);
  try
    LForm.modo := 8;
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmVisorEDT.SincronizaEDT;
var
  nodo, nodoAnterior: TTMSFNCTreeViewNode;
  tcodEDT: string;
  tDescripcion: string;
  tTotal: string;
  NivelActual, NivelAnterior: Integer;
begin
  if not Assigned(Trvw_VisorEDT) then
    Exit;

  // evitar recalculo visual durante reconstruccion
  Trvw_VisorEDT.Visible := False;
  Trvw_VisorEDT.BeginUpdate;

  try

    Trvw_VisorEDT.ClearNodes;

    Trvw_VisorEDT.Columns[0].Text := 'EDT';
    Trvw_VisorEDT.Columns[1].Text := 'Descripción';
    Trvw_VisorEDT.Columns[2].Text := 'P. Total';

    with DMPresupuesto.QEDT_Valorada do
    begin
      Close;
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Open;

      nodoAnterior := nil;

      while not Eof do
      begin
        tcodEDT := FieldByName('codEdt').AsString;
        tDescripcion := FieldByName('Descripcion').AsString;
        tTotal := FormatFloat(cadenaCurrency,
          FieldByName('Ptotal').AsFloat);

        NivelActual := cuentaCaracteres(tcodEDT, '.');

        if (NivelActual = 0) or (nodoAnterior = nil) then
          nodo := Trvw_VisorEDT.AddNode
        else
        begin
          NivelAnterior := cuentaCaracteres(nodoAnterior.Text[0], '.');

          while (NivelAnterior >= NivelActual) and Assigned(nodoAnterior) do
          begin
            nodoAnterior := nodoAnterior.GetParent;
            if Assigned(nodoAnterior) then
              NivelAnterior := cuentaCaracteres(nodoAnterior.Text[0], '.')
            else
              Break;
          end;

          if Assigned(nodoAnterior) then
            nodo := Trvw_VisorEDT.AddNode(nodoAnterior)
          else
            nodo := Trvw_VisorEDT.AddNode;
        end;

        nodo.Text[0] := tcodEDT;
        nodo.Text[1] := tDescripcion;
        nodo.Text[2] := tTotal;
        nodo.Expanded := False;

        nodoAnterior := nodo;

        Next;
      end;
    end;

    Trvw_VisorEDT.Columns[0].Width := 100;
    Trvw_VisorEDT.Columns[1].Width := 300;
    Trvw_VisorEDT.Columns[2].Width := 100;
    Trvw_VisorEDT.Columns[2].HorizontalTextAlign :=
      TTMSFNCGraphicsTextAlign.gtaTrailing;

  finally
    Trvw_VisorEDT.EndUpdate;
    Trvw_VisorEDT.Visible := True;
  end;

  if Trvw_VisorEDT.Nodes.Count > 0 then
    ExpandirNivel1;
end;

procedure TfrmVisorEDT.ExpandirNivel1;
var
  i: Integer;
  nodo: TTMSFNCTreeViewNode;
begin
  if not Assigned(Trvw_VisorEDT) then
    Exit;

  Trvw_VisorEDT.BeginUpdate;
  try

    for i := 0 to Trvw_VisorEDT.Nodes.Count - 1 do
    begin
      nodo := Trvw_VisorEDT.Nodes[i];

      if Assigned(nodo) then
      begin
        if nodo.GetParent = nil then
          nodo.Expanded := True;
      end;
    end;

  finally
    Trvw_VisorEDT.EndUpdate;
  end;
end;

end.

