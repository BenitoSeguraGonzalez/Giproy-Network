unit uDisplayChat;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
        FMX.Effects,
        FMX.Objects, FMX.Controls.Presentation, FMX.StdCtrls, FMX.Layouts, Uni,
        FMX.TMSFNCTypes, FMX.TMSFNCUtils, FMX.TMSFNCGraphics,
        FMX.TMSFNCGraphicsTypes,
        FMX.TMSFNCCustomControl, FMX.TMSFNCTableView, FMX.TMSFNCChat, Data.DB,
        MemDS,
        DBAccess;

type
        TfChat = class(TForm)
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
                lyt2: TLayout;
                chat_ususarios: TTMSFNCChat;
                QChat: TUniQuery;
                QChatid: TLargeintField;
                QChatidUsuarioEmisor: TLargeintField;
                QChatidUsuarioReceptor: TLargeintField;
                QChatemailReceptor: TStringField;
                QChatReceptor: TStringField;
                QChatidTipoComunicacion: TLargeintField;
                QChatDatosComunicacion: TMemoField;
                QChatfechahoraEmision: TDateTimeField;
                QChatfechahoraRecepcion: TDateTimeField;
                QChatidExterno: TLargeintField;
                QChatgrafico: TBlobField;
                tmrNuevosMensajes: TTimer;
                QChatUpdate: TUniQuery;
                QChatUpdateid: TLargeintField;
                QChatUpdateidUsuarioEmisor: TLargeintField;
                QChatUpdateidUsuarioReceptor: TLargeintField;
                QChatUpdateemailReceptor: TStringField;
                QChatUpdateReceptor: TStringField;
                QChatUpdateidTipoComunicacion: TLargeintField;
                QChatUpdateDatosComunicacion: TMemoField;
                QChatUpdatefechahoraEmision: TDateTimeField;
                QChatUpdatefechahoraRecepcion: TDateTimeField;
                QChatUpdateidExterno: TLargeintField;
                QChatUpdategrafico: TBlobField;
                procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton;
                  Shift: TShiftState; X, Y: Single);
                procedure rect_11Click(Sender: TObject);
                procedure chat_ususariosBeforeSendMessage(Sender: TObject;
                  var AText: string; var AAllow: Boolean);
                procedure tmrNuevosMensajesTimer(Sender: TObject);
                procedure FormClose(Sender: TObject; var Action: TCloseAction);
                procedure FormShow(Sender: TObject);
        private
                { Private declarations }
                idUltimoMensaje: integer;

                function enviarMensaje(mensajeEnviar: string): integer;

        public
                { Public declarations }
                idUsuarioReceptor: integer;
                procedure CargarChat();
                procedure ActualizaChat();
        end;

var
        fChat: TfChat;

implementation

{$R *.fmx}
{ TForm1 }

uses
        DM1, uMain, uApiGiProy;

procedure TfChat.ActualizaChat;
var
        tmpstr: string;
        fechahoraP: string;
        diadeHoy: Tdate;
begin
        QChatUpdate.close;
        QChatUpdate.ParamByName('p_idUsuario').AsInteger := codigo_usuario;
        QChatUpdate.ParamByName('p_idUsuarioReceptor').AsInteger :=
          idUsuarioReceptor;
        QChatUpdate.ParamByName('p_id').AsInteger := idUltimoMensaje;
        QChatUpdate.Open;
        QChatUpdate.First;
        while not QChatUpdate.Eof do
        begin
                diadeHoy := QChatUpdatefechahoraEmision.AsDateTime;
                if diadeHoy = Now then
                        fechahoraP := FormatDateTime('hh:nn:ss',
                          QChatUpdatefechahoraEmision.AsDateTime)
                else
                        fechahoraP := FormatDateTime('dd/mm/yyyy hh:nn:ss',
                          QChatUpdatefechahoraEmision.AsDateTime);
                if QChatUpdateidUsuarioReceptor.AsInteger = codigo_usuario then
                begin
                        chat_ususarios.AddMessage
                          (QChatUpdateDatosComunicacion.AsString,
                          '(' + fechahoraP + '): ' +
                          QChatUpdateReceptor.AsString, cmlLeft, False);
                end
                else
                begin
                        tmpstr := '(' + fechahoraP + '): ' + Nombre_usuario +
                          ' ' + Apellidos_usuario;
                        chat_ususarios.AddMessage
                          (QChatUpdateDatosComunicacion.AsString, tmpstr,
                          cmlRight, False);
                end;
                idUltimoMensaje := QChatUpdateid.AsInteger;
                QChat.Next;
        end;
end;

procedure TfChat.CargarChat();
var
        usuarioChat: string;
        TextoChat: string;
        tmpstr: string;
        fechahoraP: string;
        diadeHoy: Tdate;
begin
        idUltimoMensaje := 0;
        chat_ususarios.ChatMessages.Clear;
        QChat.close;
        QChat.ParamByName('p_idUsuario').AsInteger := codigo_usuario;
        QChat.ParamByName('p_idUsuarioReceptor').AsInteger := idUsuarioReceptor;
        QChat.Open;
        QChat.First;
        while not QChat.Eof do
        begin
                diadeHoy := QChatfechahoraEmision.AsDateTime;
                if diadeHoy = Now then
                        fechahoraP := FormatDateTime('hh:nn:ss',
                          QChatfechahoraEmision.AsDateTime)
                else
                        fechahoraP := FormatDateTime('dd/mm/yyyy hh:nn:ss',
                          QChatfechahoraEmision.AsDateTime);
                if QChatidUsuarioReceptor.AsInteger = codigo_usuario then
                begin
                        chat_ususarios.AddMessage
                          (QChatDatosComunicacion.AsString,
                          '(' + fechahoraP + '): ' + QChatReceptor.AsString,
                          cmlLeft, False);
                end
                else
                begin
                        tmpstr := '(' + fechahoraP + '): ' + Nombre_usuario +
                          ' ' + Apellidos_usuario;
                        chat_ususarios.AddMessage
                          (QChatDatosComunicacion.AsString, tmpstr,
                          cmlRight, False);
                end;
                idUltimoMensaje := QChatid.AsInteger;
                QChat.Next;
        end;
end;

procedure TfChat.chat_ususariosBeforeSendMessage(Sender: TObject;
  var AText: string; var AAllow: Boolean);
var
        mensajeEnviar: string;
        idComunicacion: integer;
begin
        AAllow := False;
        mensajeEnviar := AText;
        idComunicacion := enviarMensaje(mensajeEnviar);
        if idComunicacion > 0 then
        begin
                frmMain.tmrComunicacion.Enabled := False;
                frmMain.tmrComunicacion.Interval := 1;
                frmMain.tmrComunicacion.Enabled := True;
        end;

end;

function TfChat.enviarMensaje(mensajeEnviar: string): integer;
var
        Ok: Boolean;
begin
        Result := -1;
        try
                // tipoMensaje = 1 (texto), emisor va dentro del JWT (GlobalAuthToken)
                Ok := EnviarMensajeSimple(UrlEnviarMensaje, GlobalAuthToken,
                  { idReceptor= } idUsuarioReceptor,
                  { idTipoMensaje= } 1,
                  { mensaje= } mensajeEnviar);
                if Ok then
                        Result := 1
                else
                        Result := -1;
        except
                on E: EApiException do
                begin
                        // Aquí puedes loguear E.StatusCode y E.Message si quieres
                        Result := -1;
                end;
                on E: Exception do
                        Result := -1;
        end;
end;

procedure TfChat.FormClose(Sender: TObject; var Action: TCloseAction);
begin
        tmrNuevosMensajes.Enabled := False;
end;

procedure TfChat.FormShow(Sender: TObject);
begin
        tmrNuevosMensajes.Enabled := True;
end;

procedure TfChat.rect_11Click(Sender: TObject);
begin
        ModalResult := mrOk;
end;

procedure TfChat.rect_1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
        Self.StartWindowDrag;
end;

procedure TfChat.tmrNuevosMensajesTimer(Sender: TObject);
begin
        tmrNuevosMensajes.Enabled := False;
        ActualizaChat;
        tmrNuevosMensajes.Enabled := True;
end;

end.
