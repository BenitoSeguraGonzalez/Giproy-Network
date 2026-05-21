unit uEnviosBasesProyectos;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FMX.Effects,
  FMX.Objects, FMX.Controls.Presentation, FMX.StdCtrls, FMX.Layouts,
  FMX.TMSFNCTypes, FMX.TMSFNCUtils, FMX.TMSFNCGraphics,
  FMX.TMSFNCGraphicsTypes,
  FMX.TMSFNCCustomControl, FMX.TMSFNCWebBrowser,
  FMX.TMSFNCCustomWEBControl,
  FMX.TMSFNCMemo, Data.DB, DBAccess, Uni, Data.Bind.EngExt,
  FMX.Bind.DBEngExt,
  System.Rtti, System.Bindings.Outputs, FMX.Bind.Editors,
  Data.Bind.Components,
  Data.Bind.DBScope, FMX.ListBox, FMX.TMSFNCHTMLImageContainer,
  FMX.TMSFNCCheckBox, UniProvider, Windows, MySQLUniProvider, UniDump,
  DADump,
  CryptBase, System.IoUtils, SalsaObj, RSAObj, HashObj, X509Obj,
  System.StrUtils,
  XAdESObj, AdESObj, CAdESObj, PAdESObj, X509Values, AESObj, SPECKObj,
  MiscObj,
  MemDS, FMX.Media, System.Math;

type
  Tfrm_enviosDatosUsuarios = class(TForm)
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
    lyt_7: TLayout;
    lbl_descripcion: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    lbl_adicional: TLabel;
    lbl_paquete: TLabel;
    rect_11: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    grp1: TGroupBox;
    grp2: TGroupBox;
    pnl_backBases: TPanel;
    pnl_backProyectos: TPanel;
    lst1: TListBox;
    BindSourceDB1: TBindSourceDB;
    BindingsList1: TBindingsList;
    lnkflcntrltfld1: TLinkFillControlToField;
    lst2: TListBox;
    LinkFillControlToField1: TLinkFillControlToField;
    BindSourceDB2: TBindSourceDB;
    Rectangle1: TRectangle;
    InnerGlowEffect1: TInnerGlowEffect;
    chkAnotaciones: TTMSFNCCheckBox;
    chkNotasProyecto: TTMSFNCCheckBox;
    chkStakes: TTMSFNCCheckBox;
    procedure FormShow(Sender: TObject);
    procedure lst1Click(Sender: TObject);
    procedure lst2Click(Sender: TObject);
    procedure rect_11Click(Sender: TObject);
    procedure Rectangle1Click(Sender: TObject);
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
  private
    { Private declarations }
    opcionSeleccionado: Integer;
  public
    { Public declarations }
    idUsusarioReceptor: Integer;
    NombreUsuarioReceptor: string;
    codBaseElegida: string;
  end;

var
  frm_enviosDatosUsuarios: Tfrm_enviosDatosUsuarios;

implementation

{$R *.fmx}

uses
  DMExportDB, DM1, uMain;

procedure Tfrm_enviosDatosUsuarios.FormShow(Sender: TObject);
begin
  opcionSeleccionado := 1;
  DM_exportDB.QProyectosDisponibles.Active := True;
  DM_exportDB.QBasesDisponibles.Active := True;
end;

procedure Tfrm_enviosDatosUsuarios.lst1Click(Sender: TObject);
begin
  lst2.ClearSelection;
  opcionSeleccionado := 1;
end;

procedure Tfrm_enviosDatosUsuarios.lst2Click(Sender: TObject);
begin
  lst1.ClearSelection;
  opcionSeleccionado := 2;
end;

procedure Tfrm_enviosDatosUsuarios.Rectangle1Click(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

procedure Tfrm_enviosDatosUsuarios.rect_11Click(Sender: TObject);
var
  codBaseElegida: string;
  nombreFichero: string;
  codBaseSel, codProyectoSel, revisionSel: string;
  notasProyecto: boolean;
  anotaciones: boolean;
  StakeHolders: boolean;
  datosComunicacion: string;
  keySalsa: string;
  adicional: string;
begin
  case opcionSeleccionado of
    1:
      begin
        if realizarPreguntaSiNo('¿Desea enviar la base de datos al usuario '
          + NombreUsuarioReceptor + '?') <> mrOK then
          Exit;
        if lst1.ItemIndex > -1 then
        begin
          DM_exportDB.QBasesDisponibles.RecNo :=
            lst1.ItemIndex + 1;
          codBaseElegida :=
            DM_exportDB.
            QBasesDisponiblescodBase.AsString;
          if codBaseElegida <> '' then
          begin
            adicional := '';
            nombreFichero := exportarBase(codBaseElegida);
            if nombreFichero <> '' then
            begin
              keySalsa := generaKeySalsa;
              nombreFichero := Encripta_Envia(nombreFichero, keySalsa);
              if nombreFichero <> 'error' then
              begin
                datosComunicacion := encriptaEx(ExtractFileName(nombreFichero) + '&&' + keySalsa,
                  codSalsaExt);
                EnviaExportacionDB(codigo_usuario, idUsusarioReceptor, datosComunicacion, 7, adicional);
                WipeFile(nombreFichero);
                MuestraMensajeGiproy('Información', 'Base Exportada y Enviada a Servidor');
                ModalResult := mrOk;
              end
              else
                MuestraMensajeGiproy('Error', 'Se ha producido un error.');
            end
            else
            begin
              MuestraMensajeGiproy('Error', 'Se ha producido un error.');
            end;
          end;
        end
        else
          MuestraMensajeGiproy('Advertencia', 'Seleccione al menos una Base de Datos.');
      end;
    2:
      begin
        if realizarPreguntaSiNo('¿Desea enviar el proyecto al usuario ' +
          NombreUsuarioReceptor + '?') <> mrOk then
          Exit;
        if lst2.ItemIndex > -1 then
        begin
          adicional := '';
          DM_exportDB.QProyectosDisponibles.RecNo := lst2.ItemIndex + 1;
          codBaseSel := DM_exportDB.QProyectosDisponiblescodbase.AsString;
          codProyectoSel := DM_exportDB.QProyectosDisponiblescodpresupuesto.AsString;
          revisionSel := DM_exportDB.QProyectosDisponiblesrevision.AsString;
          notasProyecto := chkNotasProyecto.Checked;
          StakeHolders := chkStakes.Checked;
          anotaciones := chkAnotaciones.Checked;
          nombreFichero := exportarProyecto(codBaseSel, codProyectoSel, revisionSel, anotaciones,
            notasProyecto, StakeHolders);
          if nombreFichero <> 'error' then
          begin
            keySalsa := generaKeySalsa;
            nombreFichero :=
              Encripta_Envia(nombreFichero, keySalsa);
            if nombreFichero <> 'error' then
            begin
              datosComunicacion := encriptaEx(ExtractFileName(nombreFichero) + '&&' + keySalsa, codSalsaExt);
              EnviaExportacionDB(codigo_usuario, idUsusarioReceptor, datosComunicacion, 3, adicional);
              WipeFile(nombreFichero);
              MuestraMensajeGiproy('Información', 'Base Exportada y Enviada a Servidor');
              ModalResult := mrOk;
            end
            else
              MuestraMensajeGiproy('Error', 'Se ha producido un error.');
          end
          else
          begin
            MuestraMensajeGiproy('Error', 'Se ha producido un error.');
          end;
        end;
      end
  else
    MuestraMensajeGiproy('Advertencia', 'Seleccione al menos un Proyecto.');
  end;
end;

procedure Tfrm_enviosDatosUsuarios.rect_1MouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  self.StartWindowDrag;
end;

end.

