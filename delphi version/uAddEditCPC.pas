unit uAddEditCPC;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
        FMX.TMSFNCTypes,
        FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes,
        FMX.Effects,
        FMX.TMSFNCCustomControl, FMX.TMSFNCCustomPicker, FMX.TMSFNCComboBox,
        System.StrUtils, FMX.Layouts, FMX.Objects, FMX.Controls.Presentation,
        FMX.StdCtrls, FMX.Edit;

type
        Tfrm_AddEditCPC = class(TForm)
                lyt_Body: TLayout;
                rct__2: TRectangle;
                lyt_3: TLayout;
                rct__3: TRectangle;
                lyt_6: TLayout;
                rct__4: TRectangle;
                lyt_DatosGenerales: TLayout;
                lyt_9: TLayout;
                lbl_3: TLabel;
                ln_ln1: TLine;
                grdpnlyt1: TGridPanelLayout;
                lyt_10: TLayout;
                lbl_6: TLabel;
                lyt_11: TLayout;
                lyt_12: TLayout;
                lbl_4: TLabel;
                lyt_13: TLayout;
                lyt1: TLayout;
                lbl_5: TLabel;
                lyt2: TLayout;
                lyt_7: TLayout;
                lbl_2: TLabel;
                lyt_footer: TLayout;
                rct_Cancelar: TRectangle;
                iGlow_Cancelar: TInnerGlowEffect;
                rct_Aceptar: TRectangle;
                iGlow_Aceptar: TInnerGlowEffect;
                lbl_modo: TLabel;
                lyt_header: TLayout;
                rct__1: TRectangle;
                lbl_1: TLabel;
                rct_3: TRectangle;
                edt_codCPC: TEdit;
                rct_11: TRectangle;
                edt_DescripcionCPC: TEdit;
                lyt11: TLayout;
                lbl_11: TLabel;
                lyt3: TLayout;
                cbb_tipo: TTMSFNCComboBox;
                lbl_porcentaje: TLabel;
                procedure cbb_tipoItemSelected(Sender: TObject; AText: string;
                  AItemIndex: Integer);
                procedure rct_CancelarClick(Sender: TObject);
                procedure rct_AceptarClick(Sender: TObject);
                procedure edt_codCPCExit(Sender: TObject);
        private
                { Private declarations }
        public
                { Public declarations }
        end;

var
        frm_AddEditCPC: Tfrm_AddEditCPC;

implementation

{$R *.fmx}

uses
        DM1;

procedure Tfrm_AddEditCPC.cbb_tipoItemSelected(Sender: TObject; AText: string;
  AItemIndex: Integer);
begin
        case AItemIndex of
                0:
                        begin
                                lbl_porcentaje.Text := '0 %';
                        end;
                1:
                        begin
                                lbl_porcentaje.Text := '100 %';
                        end;
                2:
                        begin
                                lbl_porcentaje.Text := '40 %';
                        end;
        end;
end;

procedure Tfrm_AddEditCPC.edt_codCPCExit(Sender: TObject);
var
        codCPC: string;
begin
        codCPC := edt_codCPC.Text;
        DModule_1.untbl1.DisableControls;
        DModule_1.untbl1.First;
        if DModule_1.untbl1.Locate('codCPC', codCPC, []) then
        begin
                ShowMessage('Codigo CPC ya creado.');
                edt_codCPC.SetFocus;
        end;
        DModule_1.untbl1.EnableControls;
end;

procedure Tfrm_AddEditCPC.rct_AceptarClick(Sender: TObject);
var
        tmpstr: string;
        codCPC: string;
begin
        if lbl_modo.Text = '1' then
        begin
                // Nuevo CPC
                DModule_1.untbl1.DisableControls;
                codCPC := edt_codCPC.Text;
                DModule_1.untbl1.First;
                if not DModule_1.untbl1.Locate('codCPC', codCPC, []) then
                begin
                        DModule_1.untbl1.Append;
                        DModule_1.untbl1.FieldByName('codCPC').AsString
                          := codCPC;
                        DModule_1.untbl1.FieldByName('descripcion').AsString :=
                          edt_DescripcionCPC.Text;
                        DModule_1.untbl1.FieldByName('tipo').AsString :=
                          cbb_tipo.Text;
                        tmpstr := lbl_porcentaje.Text;
                        tmpstr := ReplaceStr(tmpstr, '%', '');
                        tmpstr := Trim(tmpstr);
                        DModule_1.untbl1.FieldByName('porcentaje').AsString
                          := tmpstr;
                        DModule_1.untbl1.Post;
                        DModule_1.untbl1.EnableControls;
                end;
                if DModule_1.untbl1.Locate('codCPC', codCPC, []) then
                begin

                end;
        end;
        if lbl_modo.Text = '2' then
        begin
                // Editar CPC
                if DModule_1.untbl1.Locate('codCPC', edt_codCPC.Text, []) then
                begin
                        DModule_1.untbl1.Edit;
                        DModule_1.untbl1.FieldByName('descripcion').AsString :=
                          UpperCase(edt_DescripcionCPC.Text);
                        DModule_1.untbl1.FieldByName('tipo').AsString :=
                          cbb_tipo.Text;
                        tmpstr := lbl_porcentaje.Text;
                        tmpstr := ReplaceStr(tmpstr, '%', '');
                        tmpstr := Trim(tmpstr);
                        DModule_1.untbl1.FieldByName('porcentaje').AsString
                          := tmpstr;
                        DModule_1.untbl1.Post;
                end;
        end;
        ModalResult := mrOk;
end;

procedure Tfrm_AddEditCPC.rct_CancelarClick(Sender: TObject);
begin
        ModalResult := mrCancel;
end;

end.
