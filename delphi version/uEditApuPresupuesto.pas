unit uEditApuPresupuesto;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
        FMX.TMSFNCTypes,
        FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes,
        FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions, FMX.Effects,
        FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl,
        FMX.TMSFNCGridData,
        FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid, FMX.StdCtrls, FMX.Layouts,
        FMX.Objects,
        FMX.Controls.Presentation, FMX.Edit, FMX.TMSBaseControl,
        FMX.TMSTreeViewBase,
        FMX.TMSTreeViewData, FMX.TMSCustomTreeView, FMX.TMSTreeView;

type
        TfrmEditAPUPresupuesto = class(TForm)
                lyt_background: TLayout;
                lyt_Body: TLayout;
                rect_2: TRectangle;
                lyt_3: TLayout;
                rect_3: TRectangle;
                lyt_6: TLayout;
                rect_4: TRectangle;
                lyt_1: TLayout;
                lyt_11: TLayout;
                lbl_11: TLabel;
                ln_1: TLine;
                lyt_14: TLayout;
                lyt_15: TLayout;
                lyt_12: TLayout;
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
                lyt_52: TLayout;
                rect_20: TRectangle;
                rect_23: TRectangle;
                lyt_86: TLayout;
                lyt_87: TLayout;
                lbl_35: TLabel;
                lbl_36: TLabel;
                lbl_37: TLabel;
                lyt_88: TLayout;
                lbl_APUMCostoDirectoTotal: TLabel;
                lbl_APUMCostoIndirectoTotal: TLabel;
                lbl_APUMPrecioUnitarioTotal: TLabel;
                tv__APUSVisor: TTMSFMXTreeView;
                lyt_130: TLayout;
                lbl_145: TLabel;
                ln_ln11: TLine;
                lyt_53: TLayout;
                lyt_54: TLayout;
                lbl_6: TLabel;
                edt_APUSDescripcion: TEdit;
                lbl_7: TLabel;
                edt_APUSUnidad: TEdit;
                lyt_132: TLayout;
                lyt_35: TLayout;
                lbl_8: TLabel;
                lbl_APUSRendimiento: TLabel;
                procedure rect_AceptarMouseEnter(Sender: TObject);
                procedure rect_AceptarMouseLeave(Sender: TObject);
                procedure rect_AceptarMouseUp(Sender: TObject;
                  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
                procedure rect_CancelarMouseUp(Sender: TObject;
                  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
                procedure rect_CancelarMouseEnter(Sender: TObject);
                procedure rect_CancelarMouseLeave(Sender: TObject);
        private
                { Private declarations }
        public
                { Public declarations }
        end;

var
        frmEditAPUPresupuesto: TfrmEditAPUPresupuesto;

implementation

{$R *.fmx}

uses
        uMain, DM1;

procedure TfrmEditAPUPresupuesto.rect_AceptarMouseEnter(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := True;
end;

procedure TfrmEditAPUPresupuesto.rect_AceptarMouseLeave(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := False;
end;

procedure TfrmEditAPUPresupuesto.rect_AceptarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
        iGlow_Aceptar.Enabled := False;
        ModalResult := mrOk;
end;

procedure TfrmEditAPUPresupuesto.rect_CancelarMouseEnter(Sender: TObject);
begin
        iGlow_Cancelar.Enabled := True;
end;

procedure TfrmEditAPUPresupuesto.rect_CancelarMouseLeave(Sender: TObject);
begin
        iGlow_Cancelar.Enabled := False;
end;

procedure TfrmEditAPUPresupuesto.rect_CancelarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
        iGlow_Cancelar.Enabled := False;
        ModalResult := mrOk;
end;

end.
