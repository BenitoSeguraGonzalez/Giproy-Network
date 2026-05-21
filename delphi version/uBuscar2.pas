unit uBuscar2;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Effects, Uni, FMX.Edit, FMX.Objects,
  FMX.Controls.Presentation, FMX.StdCtrls, FMX.Layouts, FMX.ListBox, FMX.TMSFNCTypes,
  FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, FMX.TMSFNCGridCell,
  FMX.TMSFNCGridOptions, FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData,
  FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid;

type
  TfrmBuscar2 = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_DatosGenerales: TLayout;
    lyt_11: TLayout;
    rect_5: TRectangle;
    Shadow_filtro: TShadowEffect;
    edt_Filtro: TEdit;
    rect_6: TRectangle;
    lyt_9: TLayout;
    lbl_3: TLabel;
    ln_ln1: TLine;
    lyt_1: TLayout;
    grid_Resultados: TTMSFNCGrid;
    lyt_12: TLayout;
    lbl_1: TLabel;
    ln_ln11: TLine;
    lyt_footer: TLayout;
    lbl_Categoria: TLabel;
    lbl_funcion: TLabel;
    lbl_Codigo: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    lbl_banner2: TLabel;
    procedure edt_FiltroEnter(Sender: TObject);
    procedure edt_FiltroExit(Sender: TObject);
    procedure edt_FiltroKeyDown(Sender: TObject; var Key: Word; var KeyChar: Char; Shift: TShiftState);
    procedure rect_6MouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_CloseMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_CancelarMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_AceptarMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure grid_ResultadosDblClick(Sender: TObject);
  private
                { Private declarations }
  public
                { Public declarations }
    procedure limpiaGridResultados();
    procedure RealizarBusquedas();
  end;

var
  frmBuscar2: TfrmBuscar2;

implementation

{$R *.fmx}

uses
  DM1, uNuevoRecurso, uPorcentajesIndirectos;

procedure TfrmBuscar2.edt_FiltroEnter(Sender: TObject);
begin
  Shadow_filtro.Enabled := True;
end;

procedure TfrmBuscar2.edt_FiltroExit(Sender: TObject);
begin
  Shadow_filtro.Enabled := False;
end;

procedure TfrmBuscar2.edt_FiltroKeyDown(Sender: TObject; var Key: Word; var KeyChar: Char; Shift:
  TShiftState);
begin
  if Key = vkReturn then
  begin
    if edt_Filtro.text <> '' then
      RealizarBusquedas;
  end;
end;

procedure TfrmBuscar2.grid_ResultadosDblClick(Sender: TObject);
var
  posItem: Integer;
  tmpstr: string;
  X: Integer;
  adicionar: Boolean;
  concepto: string;
begin
  posItem := grid_Resultados.Selection.StartRow;

  if lbl_funcion.text = '2' then
  begin
    adicionar := True;
    concepto := grid_Resultados.Cells[1, posItem];
    X := 1;
    while (X < frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.RowCount) and (adicionar) do
    begin
      tmpstr := frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[1, X];
      if concepto = tmpstr then
      begin
        adicionar := False;
      end;
      Inc(X);
    end;
    if adicionar then
    begin
      X := frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.RowCount;
      frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.RowCount := X + 1;
      frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[0, X] := inttostr(X);
      frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[1, X] := concepto;
      frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[3, X] := '0%';
      ModalResult := mrOk;
    end;
  end;
end;

procedure TfrmBuscar2.limpiaGridResultados;
begin
  grid_Resultados.ClearNormalCells;
  grid_Resultados.RowCount := 1;
end;

procedure TfrmBuscar2.RealizarBusquedas;
var
  qry: TUniQuery;
  tipo: Integer;
  tmpstr: string;
  X: Integer;
begin
  qry := TUniQuery.Create(nil);
  tipo := StrToInt(lbl_funcion.text);
  limpiaGridResultados;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      case tipo of
        1:
          begin
                                        // Buscar CPC para nuevoRecurso
            sql.Add('select * from codCPC where (codCPC like ' + QuotedStr('%' + edt_Filtro.text +
              '%') + ') or (descripcion like ' + QuotedStr('%' + edt_Filtro.text + '%') + ')');
            Prepare;
            ExecSQL;
            X := 0;
            while not Eof do
            begin
              grid_Resultados.RowCount := X + 1;
              grid_Resultados.Cells[0, X] := FieldByName('codCPC').AsString;
              grid_Resultados.Cells[1, X] := FieldByName('descripcion').AsString;
              X := X + 1;
              Next;
            end;
            grid_Resultados.AutoSizeColumn(0);
            grid_Resultados.AutoSizeColumn(1);
          end;
        2:
          begin
            sql.Add('select * from conceptosIndirectos where codigoCuenta like ' + QuotedStr('%' +
              edt_Filtro.text + '%'));
            Prepare;
            ExecSQL;
            X := 0;
            while not Eof do
            begin
              grid_Resultados.RowCount := X + 1;
              grid_Resultados.Cells[0, X] := inttostr(X + 1);
              grid_Resultados.Cells[1, X] := FieldByName('codigoCuenta').AsString;
              Inc(X);
              Next;
            end;
          end;
      end;

    end;
  finally
    qry.Free;
  end;
end;

procedure TfrmBuscar2.rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X,
  Y: Single);
begin
  frmBuscar2.StartWindowDrag;
end;

procedure TfrmBuscar2.rect_6MouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  if edt_Filtro.text <> '' then
    RealizarBusquedas;
end;

procedure TfrmBuscar2.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmBuscar2.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
end;

procedure TfrmBuscar2.rect_AceptarMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState;
  X, Y: Single);
var
  resultado: string;
  i: Integer;
  posItem: Integer;
  adicionar: Boolean;
  tmpstr: string;
  concepto: string;
begin
  if lbl_funcion.text = '1' then
  begin
    resultado := grid_Resultados.Cells[0, grid_Resultados.Selection.StartRow];
    frmNuevoRecurso.edt_codCPC.text := resultado;
  end;
  if lbl_funcion.text = '2' then
  begin
    posItem := frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Selection.StartRow;
    adicionar := True;
    concepto := grid_Resultados.Cells[1, posItem];
    i := 1;
    while (i < frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.RowCount) and (adicionar) do
    begin
      tmpstr := frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[1, i];
      if concepto = tmpstr then
      begin
        adicionar := False;
      end;
      Inc(i);
    end;
    if adicionar then
    begin
      i := frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.RowCount;
      frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.RowCount := i + 1;
      frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[0, i] := inttostr(i);
      frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[1, i] := concepto;
      frmPorcentajesIndirectos.grid_CostosIndirectosPresupuesto.Cells[3, i] := '0%';
    end;
  end;

  ModalResult := mrOk;
end;

procedure TfrmBuscar2.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure TfrmBuscar2.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := False;
end;

procedure TfrmBuscar2.rect_CancelarMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState;
  X, Y: Single);
begin
  iGlow_Cancelar.Enabled := False;
  ModalResult := mrOk;
end;

procedure TfrmBuscar2.rect_CloseMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X,
  Y: Single);
begin
  ModalResult := mrOk;
end;

end.

