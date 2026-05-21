unit uAbrirBase2;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants, Uni,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Layouts,
  FMX.Objects,
  FMX.Controls.Presentation, FMX.StdCtrls, FMX.TMSFNCTypes, FMX.TMSFNCUtils,
  FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, FMX.TMSFNCGridCell,
  FMX.TMSFNCGridOptions,
  FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData,
  FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid, FMX.Effects, FMX.TMSBaseControl,
  FMX.TMSGridCell,
  FMX.TMSGridOptions, FMX.TMSGridData, FMX.TMSCustomGrid, FMX.TMSGrid,
  FMX.ListBox;

type
  TfrmAbrirBase2 = class(TForm)
    lytHeader: TLayout;
    lytBody: TLayout;
    rct_1: TRectangle;
    rct_Background: TRectangle;
    lyt1: TLayout;
    lyt2: TLayout;
    lbl1: TLabel;
    lyt3: TLayout;
    lbl2: TLabel;
    lyt4: TLayout;
    rct_fondoGrid: TRectangle;
    lyt5: TLayout;
    lbl3: TLabel;
    ln1: TLine;
    lbl_modo: TLabel;
    rct_Cancelar: TRectangle;
    rct_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    iGlow_Cancelar: TInnerGlowEffect;
    grid_Bases: TTMSFMXGrid;
    lyt6: TLayout;
    chkPadres: TCheckBox;
    chkPresupuestos: TCheckBox;
    rct_3: TRectangle;
    pnlRevisiones: TPanel;
    lbl_1: TLabel;
    lstRevisiones: TListBox;
    procedure grid_BasesDblClick(Sender: TObject);
    procedure rct_AceptarMouseEnter(Sender: TObject);
    procedure rct_AceptarMouseLeave(Sender: TObject);
    procedure rct_AceptarMouseUp(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure rct_CancelarMouseEnter(Sender: TObject);
    procedure rct_CancelarMouseLeave(Sender: TObject);
    procedure rct_CancelarMouseUp(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure FormShow(Sender: TObject);
    procedure grid_BasesCellDblClick(Sender: TObject; ACol, ARow: Integer);
    procedure chkPadresChange(Sender: TObject);
    procedure chkPresupuestosChange(Sender: TObject);
    procedure rct_1MouseDown(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure lstRevisionesDblClick(Sender: TObject);
  private
    { Private declarations }
    procedure limpiaGrid();

  public
    { Public declarations }
    procedure PopulaGridBase;
    procedure abrirBase(modo: Integer);
  end;

var
  frmAbrirBase2: TfrmAbrirBase2;

implementation

{$R *.fmx}

uses
  DM1, uMain, uPorcentajesIndirectos;

{ TfrmAbrirBase2 }

procedure TfrmAbrirBase2.abrirBase(modo: Integer);
var
  selectCells: Integer;
  descripcion: string;
  cod_base: string;
  baseDeProyectos: Boolean;
  x: Integer;
  listaRevisionesProyecto: TStringList;
begin
  contieneTanteo := False;
  selectCells := grid_Bases.Selection.StartRow;
  baseDeProyectos := chkPresupuestos.IsChecked;
  if not baseDeProyectos then
  begin
    case modo of
      1:
        begin
          // Abrir Base de Datos
          selectCells := grid_Bases.Selection.StartRow;
          cod_base := grid_Bases.Cells[0, selectCells];
          activaBaseDatos(cod_base);
          if base_activa.nombre <> '' then
            muestraOPC(True);
          ModalResult := mrOk;
        end;
      2:
        begin
          // Seleccionar Base de Datos Presupuestos
          cod_base := grid_Bases.Cells[0, selectCells];
          cod_base := creaDataBaseDesdePadre(cod_base);
          activaBaseDatos(cod_base);
          frmMain.iGlow_Presupuestos_SeleccionarIndirectos.Enabled := True;
          descripcion := base_activa.nombre;
          if descripcion <> '' then
          begin
            frmPorcentajesIndirectos.lbl_modo.Text := '0';
            cargaCategoriasIndirectosPresupuestos(Self);
            cargaConceptosIndirectosFijos(Self);
            Visible := False;
            if asignarDBProyecto(codProyecto, cod_base) then
            begin
              frmPorcentajesIndirectos.ShowModal;
              ModalResult := mrOk;
            end;
          end;
        end;
    end;
  end
  else
  begin
    listaRevisionesProyecto := TStringList.Create;
    cod_base := grid_Bases.Cells[0, selectCells];
    descripcion := grid_Bases.Cells[1, selectCells];
    codProyecto := daCodProyectoDescripcionDB(descripcion);
    listaRevisionesProyecto := listaRevisionesBase(cod_base, codProyecto);
    pnlRevisiones.Visible := True;
    for x := 0 to listaRevisionesProyecto.Count - 1 do
      lstRevisiones.Items.Add(listaRevisionesProyecto[x]);
  end;
end;

procedure TfrmAbrirBase2.lstRevisionesDblClick(Sender: TObject);
var
  selectCells: Integer;
  cod_base: string;
begin
  selectCells := grid_Bases.Selection.StartRow;
  revision := lstRevisiones.Items[lstRevisiones.ItemIndex];
  cod_base := grid_Bases.Cells[0, selectCells];
  activaBaseDatos(cod_base);
  contieneTanteos();
  muestraOPC(True);
  ModalResult := mrOk;
end;

procedure TfrmAbrirBase2.chkPadresChange(Sender: TObject);
begin
  PopulaGridBase;
end;

procedure TfrmAbrirBase2.chkPresupuestosChange(Sender: TObject);
begin
  PopulaGridBase;
end;

procedure TfrmAbrirBase2.FormShow(Sender: TObject);
begin
  Visible := True;
  pnlRevisiones.Visible := False;
  lstRevisiones.Items.Clear;
  if lbl_modo.Text = '1' then
  begin
    chkPadres.IsChecked := True;
    chkPresupuestos.IsChecked := False;
  end;
  PopulaGridBase;
end;

procedure TfrmAbrirBase2.grid_BasesCellDblClick(Sender: TObject; ACol, ARow:
  Integer);
begin
  abrirBase(StrToInt(lbl_modo.Text));
end;

procedure TfrmAbrirBase2.grid_BasesDblClick(Sender: TObject);
begin
  abrirBase(StrToInt(lbl_modo.Text));
end;

procedure TfrmAbrirBase2.limpiaGrid;
var
  X, Y: Integer;
begin
  grid_Bases.RowCount := 1;
  for X := 0 to 1 do

  begin
    for Y := 0 to grid_Bases.Columns.Count - 1 do
    begin
      grid_Bases.Cells[Y, X] := '';
    end;
  end;
  grid_Bases.Cells[0, 0] := 'Cod Base';
  grid_Bases.Cells[1, 0] := 'Nombre';
  grid_Bases.Cells[2, 0] := 'Actualizacion';
end;

procedure TfrmAbrirBase2.PopulaGridBase;
var
  qry: TUniQuery;
  X: Integer;
  tmpstr: string;
  fecha: TdateTime;
  parte1, parte2: string;
  base1, base2: string;
  total: string;
begin
  limpiaGrid;
  base1 := 'select * from bases ';
  base2 := 'order by fechaHoraModificacion asc';
  parte1 := ' (presupuestoAsignado is not null) ';
  parte2 := ' (presupuestoAsignado is null) ';
  total := '';
  if (chkPadres.IsChecked) or (chkPresupuestos.IsChecked) then
  begin
    total := base1 + 'where ';
    if (chkPadres.IsChecked) and (not chkPresupuestos.IsChecked) then
      total := total + parte2 + base2;
    if (not chkPadres.IsChecked) and (chkPresupuestos.IsChecked) then
      total := total + parte1 + base2;
    if (chkPadres.IsChecked) and (chkPresupuestos.IsChecked) then
      total := base1 + base2;
  end;
  if total <> '' then
  begin
    X := 1;
    qry := TUniQuery.Create(nil);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        sql.Clear;
        sql.Add(total);
        prepare;
        ExecSQL;
        while not Eof do
        begin
          grid_Bases.RowCount := X + 1;
          grid_Bases.Cells[0, X] := FieldByName('CodBase').AsString;
          grid_Bases.Cells[1, X] := FieldByName('Nombre').AsString;
          fecha := FieldByName('fechaHoraModificacion').AsDateTime;
          tmpstr := FormatDateTime('DD/MM/YYYY HH:NN', fecha);
          grid_Bases.Cells[2, X] := tmpstr;
          Inc(X);
          Next;
        end;
      end;
    finally
      qry.Free;
    end;
  end;
end;

procedure TfrmAbrirBase2.rct_1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift:
  TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmAbrirBase2.rct_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmAbrirBase2.rct_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
end;

procedure TfrmAbrirBase2.rct_AceptarMouseUp(Sender: TObject; Button:
  TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  abrirBase(StrToInt(lbl_modo.Text));
end;

procedure TfrmAbrirBase2.rct_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure TfrmAbrirBase2.rct_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := False;
end;

procedure TfrmAbrirBase2.rct_CancelarMouseUp(Sender: TObject; Button:
  TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  ModalResult := mrOk;
end;

end.

