unit uPertenencia;

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
        FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid, FMX.Objects,
        FMX.Controls.Presentation,
        FMX.StdCtrls, FMX.Layouts;

type
        TfrmPertenencia = class(TForm)
                lyt_background: TLayout;
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
                grid_Pertenencia: TTMSFNCGrid;
                lyt_7: TLayout;
                lbl_2: TLabel;
                lyt_footer: TLayout;
                rect_Aceptar: TRectangle;
                iGlow_Aceptar: TInnerGlowEffect;
                lbl_modo: TLabel;
                lyt_header: TLayout;
                rct__1: TRectangle;
                lbl_1: TLabel;
                rect_Cancelar: TRectangle;
                iGlow_Cancelar: TInnerGlowEffect;
                procedure rect_AceptarClick(Sender: TObject);
                procedure grid_PertenenciaColumnSized(Sender: TObject;
                  ACol: Integer; NewWidth: Single);
                procedure rect_CancelarClick(Sender: TObject);
                procedure rect_AceptarMouseEnter(Sender: TObject);
                procedure rect_AceptarMouseLeave(Sender: TObject);
                procedure rect_AceptarMouseUp(Sender: TObject;
                  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
                procedure rect_CancelarMouseUp(Sender: TObject;
                  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
                procedure rect_CancelarMouseLeave(Sender: TObject);
                procedure rect_CancelarMouseEnter(Sender: TObject);
        private
                { Private declarations }
        public
                { Public declarations }
        end;

var
        frmPertenencia: TfrmPertenencia;

implementation

{$R *.fmx}

procedure TfrmPertenencia.grid_PertenenciaColumnSized(Sender: TObject;
  ACol: Integer; NewWidth: Single);
begin
        if NewWidth < 50 then
                grid_Pertenencia.Columns[ACol].Width := 50;

end;

procedure TfrmPertenencia.rect_AceptarClick(Sender: TObject);
begin
        ModalResult := mrOk;
end;

procedure TfrmPertenencia.rect_AceptarMouseEnter(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := True;
end;

procedure TfrmPertenencia.rect_AceptarMouseLeave(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := False;
end;

procedure TfrmPertenencia.rect_AceptarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
        iGlow_Aceptar.Enabled := True;
        ModalResult := mrOk;
end;

procedure TfrmPertenencia.rect_CancelarClick(Sender: TObject);
begin
        ModalResult := mrOk;
end;

procedure TfrmPertenencia.rect_CancelarMouseEnter(Sender: TObject);
begin
        iGlow_Cancelar.Enabled := True;
end;

procedure TfrmPertenencia.rect_CancelarMouseLeave(Sender: TObject);
begin
        iGlow_Cancelar.Enabled := False;
end;

procedure TfrmPertenencia.rect_CancelarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
        iGlow_Cancelar.Enabled := False;
        ModalResult := mrOk;
end;

end.
