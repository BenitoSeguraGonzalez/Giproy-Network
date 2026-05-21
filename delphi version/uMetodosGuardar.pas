unit uMetodosGuardar;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
        FMX.Controls.Presentation, FMX.StdCtrls, FMX.Effects, FMX.Objects,
        FMX.Layouts;

type
        TfrmMetodosGuardado = class(TForm)
                lyt_Background: TLayout;
                lyt_Body: TLayout;
                rect_2: TRectangle;
                lyt_3: TLayout;
                rect_3: TRectangle;
                lyt_6: TLayout;
                rect_4: TRectangle;
                lyt_footer: TLayout;
                rect_Cancelar: TRectangle;
                iGlow_Cancelar: TInnerGlowEffect;
                lbl_Categoria: TLabel;
                lbl_funcion: TLabel;
                lbl_Codigo: TLabel;
                lyt_header: TLayout;
                rect_1: TRectangle;
                lbl_banner1: TLabel;
                grdpnlyt1: TGridPanelLayout;
                lyt_1: TLayout;
                lyt_2: TLayout;
                rect_5: TRectangle;
                ln_1: TLine;
                rect_6: TRectangle;
                lbl_1: TLabel;
                lbl_2: TLabel;
                procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton;
                  Shift: TShiftState; X, Y: Single);
                procedure lyt_1Click(Sender: TObject);
                procedure rect_CancelarClick(Sender: TObject);
                procedure lyt_2Click(Sender: TObject);
        private
                { Private declarations }
        public
                { Public declarations }
        end;

var
        frmMetodosGuardado: TfrmMetodosGuardado;

implementation

{$R *.fmx}

uses
        DM1, uMain;

procedure TfrmMetodosGuardado.lyt_1Click(Sender: TObject);
begin
        if ProyectocumpleRequisitosMinimos then
        begin
                GuardarProyecto();
        end;
        ModalResult := mrOk;
end;

procedure TfrmMetodosGuardado.lyt_2Click(Sender: TObject);
var
        codBase, revisionOrigen: string;

begin
        if (ProyectocumpleRequisitosMinimos) and (existeRevisionCero) then
        begin
                // Guardar como revision
                codBase := base_activa.codBase;
                revisionOrigen := frmmain.lbl_RevisionPresupuesto.Text;
                revision := guardarcomoRevision(codBase, revisionOrigen);
                proyectoNuevo := False;
                CargaProyecto(codBase);
        end;
        ModalResult := mrOk;
end;

procedure TfrmMetodosGuardado.rect_1MouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
        self.StartWindowDrag;
end;

procedure TfrmMetodosGuardado.rect_CancelarClick(Sender: TObject);
begin
        ModalResult := mrCancel;
end;

end.
