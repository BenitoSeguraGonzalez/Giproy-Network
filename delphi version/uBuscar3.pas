unit uBuscar3;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
        FMX.TMSFNCTypes,
        FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, Uni,
        FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions, FMX.Effects, FMX.Edit,
        FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl,
        FMX.TMSFNCGridData,
        FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid, FMX.Objects,
        FMX.Controls.Presentation,
        FMX.StdCtrls, FMX.Layouts;

type
        TfrmBuscar3 = class(TForm)
                lyt_background: TLayout;
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
                lyt_194: TLayout;
                grid_CostosIndirectos: TTMSFNCGrid;
                lyt_1: TLayout;
                lbl_4: TLabel;
                rect_12: TRectangle;
                bevel_12: TBevelEffect;
                edt_Filtro: TEdit;
                lbl_5: TLabel;
                lyt_7: TLayout;
                lbl_2: TLabel;
                lyt_footer: TLayout;
                rect_Cancelar: TRectangle;
                iGlow_Cancelar: TInnerGlowEffect;
                rect_Aceptar: TRectangle;
                iGlow_Aceptar: TInnerGlowEffect;
                lbl_modo: TLabel;
                lyt_header: TLayout;
                rect_1: TRectangle;
                lbl_1: TLabel;
                lbl1: TLabel;
                iGlow_Aceptar2: TInnerGlowEffect;
                procedure edt_FiltroChangeTracking(Sender: TObject);
                procedure grid_CostosIndirectosDblClick(Sender: TObject);
                procedure rect_AceptarMouseEnter(Sender: TObject);
                procedure rect_AceptarMouseLeave(Sender: TObject);
                procedure rect_AceptarMouseUp(Sender: TObject;
                  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
                procedure lbl_1MouseDown(Sender: TObject; Button: TMouseButton;
                  Shift: TShiftState; X, Y: Single);
                procedure lbl1MouseUp(Sender: TObject; Button: TMouseButton;
                  Shift: TShiftState; X, Y: Single);
                procedure lbl1MouseLeave(Sender: TObject);
                procedure lbl1MouseDown(Sender: TObject; Button: TMouseButton;
                  Shift: TShiftState; X, Y: Single);
        private
                { Private declarations }
        public
                { Public declarations }
                procedure populaIndirectos();
        end;

var
        frmBuscar3: TfrmBuscar3;

implementation

{$R *.fmx}

uses
        DM1, uPorcentajesIndirectos;
{ TfrmBuscar3 }

procedure TfrmBuscar3.edt_FiltroChangeTracking(Sender: TObject);
var
        fltr: TTMSFNCGridFilterData;
begin
        grid_CostosIndirectos.UnHideRowsAll;
        grid_CostosIndirectos.RemoveFilters;
        fltr := grid_CostosIndirectos.Filter.Add;
        fltr.Column := 1;
        fltr.CaseSensitive := false;
        fltr.Condition := '*' + edt_Filtro.Text + '*';
        grid_CostosIndirectos.ApplyFilter;

end;

procedure TfrmBuscar3.grid_CostosIndirectosDblClick(Sender: TObject);
var
        posItem: integer;
        cuentaAdicionar: string;
begin
        posItem := grid_CostosIndirectos.Selection.StartRow;
        if posItem > 0 then
        begin
                cuentaAdicionar := grid_CostosIndirectos.Cells[1, posItem];
                frmPorcentajesIndirectos.AdicionaCuentaIndirectos
                  (cuentaAdicionar);
        end;
end;

procedure TfrmBuscar3.lbl1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
        iGlow_Aceptar.Enabled := True;
        iGlow_Aceptar2.Enabled := True;
end;

procedure TfrmBuscar3.lbl1MouseLeave(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := false;
        iGlow_Aceptar2.Enabled := false;
end;

procedure TfrmBuscar3.lbl1MouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
        iGlow_Aceptar.Enabled := false;
        iGlow_Aceptar2.Enabled := false;
        ModalResult := mrOk;
end;

procedure TfrmBuscar3.lbl_1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
        self.StartWindowDrag;
end;

procedure TfrmBuscar3.populaIndirectos;
var
        qry: Tuniquery;
        tmpstr: string;
        X: integer;
begin
        qry := Tuniquery.Create(nil);
        try
                with qry do
                begin
                        grid_CostosIndirectos.ClearNormalCells;
                        grid_CostosIndirectos.Cells[0, 0] := '#';
                        grid_CostosIndirectos.Cells[1, 0] :=
                          'Cuentas Indirectos';
                        Connection := DModule_1.con2;
                        close;
                        sql.Clear;
                        sql.Add('select * from conceptosIndirectos order by codigoCuenta asc');
                        prepare;
                        ExecSQL;
                        X := 1;
                        while not Eof do
                        begin
                                grid_CostosIndirectos.RowCount := X + 1;
                                grid_CostosIndirectos.Cells[0, X] :=
                                  IntToStr(X);
                                grid_CostosIndirectos.Cells[1, X] :=
                                  FieldByName('codigoCuenta').AsString;
                                grid_CostosIndirectos.Cells[2, X] :=
                                  FieldByName('id').AsString;
                                inc(X);
                                Next;
                        end;
                end;
        finally
                qry.Free;
        end;
end;

procedure TfrmBuscar3.rect_AceptarMouseEnter(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := True;
        iGlow_Aceptar2.Enabled := True;
end;

procedure TfrmBuscar3.rect_AceptarMouseLeave(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := false;
        iGlow_Aceptar2.Enabled := false;
end;

procedure TfrmBuscar3.rect_AceptarMouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
        iGlow_Aceptar.Enabled := false;
        iGlow_Aceptar2.Enabled := false;
        ModalResult := mrOk;
end;

end.
