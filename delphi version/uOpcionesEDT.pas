unit uOpcionesEDT;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
        FMX.Objects,
        FMX.Controls.Presentation, FMX.StdCtrls, FMX.Effects, FMX.Edit,
        FMX.Layouts,
        FMX.TMSFNCTreeView, FMX.TMSGridCell, FMX.TMSGridOptions,
        FMX.TMSGridData,
        FMX.TMSCustomGrid, FMX.TMSGrid, FMX.TMSFNCTreeViewBase,
        FMX.TMSFNCTreeViewData,
        FMX.TMSFNCCustomTreeView, FMX.TMSFNCBitmapContainer,
        FMX.TMSFNCCustomComponent,
        FMX.ListBox, FMX.Memo.Types, FMX.ScrollBox, FMX.Memo;

type
        TfrmOpcionesEDT = class(TForm)
                lyt_background: TLayout;
                lyt_Body: TLayout;
                rect_2: TRectangle;
                lyt_3: TLayout;
                rect_3: TRectangle;
                lyt_6: TLayout;
                rect_4: TRectangle;
                lyt_7: TLayout;
                lbl_codCuenta: TLabel;
                lyt_footer: TLayout;
                rect_Cancelar: TRectangle;
                iGlow_Cancelar: TInnerGlowEffect;
                rect_Aceptar: TRectangle;
                iGlow_Aceptar: TInnerGlowEffect;
                lbl_modo: TLabel;
                lyt_header: TLayout;
                rect_1: TRectangle;
                lbl_1: TLabel;
                lyt_1: TLayout;
                lyt_11: TLayout;
                lbl_11: TLabel;
                ln_1: TLine;
                lyt_4: TLayout;
                lyt_Apellidos: TLayout;
                lbl_14: TLabel;
                lyt_14: TLayout;
                lyt_15: TLayout;
                lbl_15: TLabel;
                edt_EDTDescripcion: TEdit;
                lyt_12: TLayout;
                lbl_12: TLabel;
                cbb_EDTResponsable: TComboBox;
                mmo_EDTObservaciones: TMemo;
                procedure rect_CancelarMouseUp(Sender: TObject;
                  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
                procedure rect_AceptarMouseEnter(Sender: TObject);
                procedure rect_AceptarMouseLeave(Sender: TObject);
                procedure rect_CancelarMouseEnter(Sender: TObject);
                procedure rect_CancelarMouseLeave(Sender: TObject);
                procedure edt_EDTDescripcionKeyUp(Sender: TObject;
                  var Key: Word; var KeyChar: Char; Shift: TShiftState);
                procedure FormShow(Sender: TObject);
                procedure cbb_EDTResponsableKeyUp(Sender: TObject;
                  var Key: Word; var KeyChar: Char; Shift: TShiftState);
                procedure mmo_EDTObservacionesKeyUp(Sender: TObject;
                  var Key: Word; var KeyChar: Char; Shift: TShiftState);
                procedure FormClose(Sender: TObject; var Action: TCloseAction);
                procedure rect_AceptarClick(Sender: TObject);
                procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton;
                  Shift: TShiftState; X, Y: Single);
        private
                { Private declarations }
        public
                { Public declarations }
                nodoSeleccionado: TTMSFNCTreeViewNode;
                procedure SeleccionarResponsable(responsalbe: string);
        end;

var
        frmOpcionesEDT: TfrmOpcionesEDT;

implementation

{$R *.fmx}

uses
        uMain, DM1;

procedure TfrmOpcionesEDT.cbb_EDTResponsableKeyUp(Sender: TObject;
  var Key: Word; var KeyChar: Char; Shift: TShiftState);
begin
        if Key = vkEscape then
        begin
                iGlow_Cancelar.Enabled := False;
                frmMain.Trvw_EDO.RemoveNode(nodoSeleccionado);
                ModalResult := mrOk;
        end;
end;

procedure TfrmOpcionesEDT.edt_EDTDescripcionKeyUp(Sender: TObject;
  var Key: Word; var KeyChar: Char; Shift: TShiftState);
var
        i: integer;
        codCuenta: string;
begin
        if Key = vkReturn then
        begin
                iGlow_Aceptar.Enabled := False;
                if Assigned(nodoSeleccionado) and (edt_EDTDescripcion.Text <> '')
                then
                begin
                        i := AnsiPos(':', lbl_codCuenta.Text);
                        codCuenta := Copy(lbl_codCuenta.Text, i + 1,
                          Length(lbl_codCuenta.Text));
                        codCuenta := Trim(codCuenta);
                        codCuenta := codCuenta + ' ';
                        nodoSeleccionado.Text[0] := codCuenta;
                        nodoSeleccionado.Text[1] := edt_EDTDescripcion.Text;
                        if cbb_EDTResponsable.ItemIndex > -1 then
                                nodoSeleccionado.Text[2] :=
                                  cbb_EDTResponsable.Items
                                  [cbb_EDTResponsable.ItemIndex];
                        nodoSeleccionado.Text[3] := mmo_EDTObservaciones.Text;
                        if nodoSeleccionado.Text[4] = '' then
                                nodoSeleccionado.Text[4] :=
                                  codigoUnicoItemPresupuesto;
                        ModalResult := mrOk;
                end;
        end;
        if Key = vkEscape then
        begin
                iGlow_Cancelar.Enabled := False;
                frmMain.Trvw_EDO.RemoveNode(nodoSeleccionado);
                ModalResult := mrOk;
        end;
end;

procedure TfrmOpcionesEDT.FormClose(Sender: TObject; var Action: TCloseAction);
begin
        if lbl_modo.Text = '1' then
                frmMain.Trvw_EDT.ExpandAll;
end;

procedure TfrmOpcionesEDT.FormShow(Sender: TObject);
begin
        edt_EDTDescripcion.SetFocus;
end;

procedure TfrmOpcionesEDT.mmo_EDTObservacionesKeyUp(Sender: TObject;
  var Key: Word; var KeyChar: Char; Shift: TShiftState);
begin
        if Key = vkEscape then
        begin
                iGlow_Cancelar.Enabled := False;
                frmMain.Trvw_EDO.RemoveNode(nodoSeleccionado);
                ModalResult := mrOk;
        end;
end;

procedure TfrmOpcionesEDT.rect_1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
        Self.StartWindowDrag;
end;

procedure TfrmOpcionesEDT.rect_AceptarClick(Sender: TObject);
var
        i: integer;
        codCuenta: string;
begin
        iGlow_Aceptar.Enabled := False;
        if Assigned(nodoSeleccionado) and (edt_EDTDescripcion.Text <> '') then
        begin
                i := AnsiPos(':', lbl_codCuenta.Text);
                codCuenta := Copy(lbl_codCuenta.Text, i + 1,
                  Length(lbl_codCuenta.Text));
                codCuenta := Trim(codCuenta);
                codCuenta := codCuenta + ' ';
                nodoSeleccionado.Text[0] := codCuenta;
                nodoSeleccionado.Text[1] := edt_EDTDescripcion.Text;
                if cbb_EDTResponsable.ItemIndex > -1 then
                        nodoSeleccionado.Text[2] := cbb_EDTResponsable.Items
                          [cbb_EDTResponsable.ItemIndex];
                nodoSeleccionado.Text[3] := mmo_EDTObservaciones.Text;
                if nodoSeleccionado.Text[4] = '' then
                        nodoSeleccionado.Text[4] := codigoUnicoItemPresupuesto;
                ModalResult := mrOk;
        end;
end;

procedure TfrmOpcionesEDT.rect_AceptarMouseEnter(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := True;
end;

procedure TfrmOpcionesEDT.rect_AceptarMouseLeave(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := False;
end;

procedure TfrmOpcionesEDT.rect_CancelarMouseEnter(Sender: TObject);
begin
        iGlow_Cancelar.Enabled := True;
end;

procedure TfrmOpcionesEDT.rect_CancelarMouseLeave(Sender: TObject);
begin
        iGlow_Cancelar.Enabled := False;
end;

procedure TfrmOpcionesEDT.rect_CancelarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
        iGlow_Cancelar.Enabled := False;
        if lbl_modo.Text = '1' then
                frmMain.Trvw_EDO.RemoveNode(nodoSeleccionado);
        ModalResult := mrOk;
end;

procedure TfrmOpcionesEDT.SeleccionarResponsable(responsalbe: string);
var
        salir: Boolean;
        X: integer;
begin
        X := 0;
        salir := False;
        while (not salir) and (X < cbb_EDTResponsable.Items.Count - 1) do
        begin
                if responsalbe = cbb_EDTResponsable.Items[X] then
                begin
                        salir := True;
                        cbb_EDTResponsable.ItemIndex := X;
                end;
                Inc(X);
        end;
end;

end.
