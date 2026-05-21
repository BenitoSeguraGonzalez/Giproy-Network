unit DMOnline;

interface

uses
        System.SysUtils, System.Classes, Uni, IdComponent, IdBaseComponent,
        IdCoder,
        System.NetEncoding, IdCoder3to4, IdCoderMIME, IdGlobal, System.StrUtils,
        MiscObj, RSAObj, HashObj, X509Obj, XAdESObj, AdESObj, CAdESObj,
        PAdESObj,
        X509Values, AESObj, SPECKObj, IdTCPConnection, IdTCPClient,
        FMX.Graphics,
        IdExplicitTLSClientServerBase, IdMessageClient, IdSMTPBase, IdSMTP,
        IdMessage,
        CryptBase, SalsaObj, ECCObj, Messages, IdHTTP, IdIOHandler,
        IdIOHandlerSocket,
        IdIOHandlerStack, IdSSL, IdSSLOpenSSL, IdText, IdAttachmentFile;

const
        clvEnc = '4939E4C2BDA69966215CE287392D4C27';
        email = '67shmut1HZk=hxxGZsdZ_sWjwuF5gPOVHatFZeA=';
        passEmail = 'Vl7tN0uJWBc=0ldB5PUt3UjF2w==';
        hostEmail = 'bfTq5k_jaGY=Csz3zt4EL-iyc3_ZGDIAww==';
        puertoEmail = 'uMUSDkrVWwQ=-w1_';
        textoFrom = 'oLCPFZCp_B8=TmY3wfTyhev6NzzOsnUQZP4DxIQ=';
        SSLImplicita = 'W0JnnnLcx7o=3KI=';

type
        server_email = record
                host_server: string;
                puerto_server: string;
                usuario_server: string;
                password_server: string;
                texto_from: string;
                ssl_implicita: string;
        end;

type
        TDM_OnLine = class(TDataModule)
                SMTP_1: TIdSMTP;
                MailMessage_1: TIdMessage;
                SalsaEnc_1: TSalsaEncryption;
        private
                { Private declarations }
        public
                { Public declarations }
        end;

var
        DM_OnLine: TDM_OnLine;
        servidor_emails: server_email;

function envia_email(email_cliente, nombre_fichero: string;
  mensaje: tstringlist): Boolean;

function encripta(texto: string): string;

function desencripta(texto: string): string;
function StringToBitmap(imgStr: string): TBitmap;
function BitmapToString(img: TBitmap): string;

implementation

{%CLASSGROUP 'FMX.Controls.TControl'}
{$R *.dfm}

uses
        DM1, uMain;

function BitmapToString(img: TBitmap): string;
var
        tms: TMemoryStream;
        tss: TStringStream;
        ts: string;
begin
        tms := TMemoryStream.Create;
        img.SaveToStream(tms);
        tss := TStringStream.Create('');
        tms.Position := 0;
        Encoder.EncodeStream(tms, tss);
        ts := tss.DataString;
        tms.Free;
        tss.Free;
        result := ts;
end;

function StringToBitmap(imgStr: string): TBitmap;
var
        tms: TMemoryStream;
        bitmap: TBitmap;
begin
        tms := TMemoryStream.Create;
        Decoder.DecodeStream(imgStr, tms);
        tms.Position := 0;
        bitmap := TBitmap.Create;
        bitmap.LoadFromStream(tms);
        tms.Free;
        result := bitmap;
end;

function encripta(texto: string): string;
begin
        result := '';
        DM_OnLine.SalsaEnc_1.keyLength := skl256;
        DM_OnLine.SalsaEnc_1.outputFormat := Base64URL;
        DM_OnLine.SalsaEnc_1.key := ReverseString(clvEnc);
        result := DM_OnLine.SalsaEnc_1.Encrypt(texto);
end;

function desencripta(texto: string): string;
begin
        result := '';
        DM_OnLine.SalsaEnc_1.keyLength := skl256;
        DM_OnLine.SalsaEnc_1.outputFormat := Base64URL;
        DM_OnLine.SalsaEnc_1.key := ReverseString(clvEnc);
        result := DM_OnLine.SalsaEnc_1.Decrypt(texto);
end;

function envia_email(email_cliente, nombre_fichero: string;
  mensaje: tstringlist): Boolean;
var
        respuesta: Boolean;
        IdSSLIOHandlerSocket: TIdSSLIOHandlerSocketOpenSSL;
        IdSMTP: TIdSMTP;
        IdMessage: TIdMessage;
        IdText: TIdText;
        sAnexo: string;
        tmpstr: string;
        x: integer;
begin
        respuesta := False;
        // Cargar datos servidor emails
        servidor_emails.host_server := desencripta(hostEmail);
        servidor_emails.puerto_server := desencripta(puertoEmail);
        servidor_emails.usuario_server := desencripta(email);
        servidor_emails.password_server := desencripta(passEmail);
        servidor_emails.texto_from := desencripta(textoFrom);
        servidor_emails.ssl_implicita := desencripta(SSLImplicita);
        try
                IdSSLIOHandlerSocket := TIdSSLIOHandlerSocketOpenSSL.Create();
                IdSMTP := TIdSMTP.Create();
                IdMessage := TIdMessage.Create();
                // Configuracion protocolo SSL (TIdSSLIOHandlerSocketOpenSSL)
                IdSSLIOHandlerSocket.SSLOptions.Method := sslvSSLv23;
                IdSSLIOHandlerSocket.SSLOptions.Mode := sslmClient;
                // Configuracion  del servidor SMTP (TIdSMTP)
                IdSMTP.IOHandler := IdSSLIOHandlerSocket;
                if servidor_emails.ssl_implicita = 'NO' then
                begin
                        IdSMTP.UseTLS := utUseExplicitTLS;
                end
                else
                begin
                        IdSMTP.UseTLS := utUseImplicitTLS;
                end;
                IdSMTP.AuthType := satDefault;
                IdSMTP.Port := StrToInt(servidor_emails.puerto_server);
                IdSMTP.Host := servidor_emails.host_server;
                IdSMTP.UserName := servidor_emails.usuario_server;
                IdSMTP.password := servidor_emails.password_server;
                // Configuracion  datos envio
                IdMessage.From.Address := servidor_emails.usuario_server;
                // cambiar a la cuenta de ventas
                IdMessage.From.Name := servidor_emails.texto_from;
                // 'Documentación Electronica';
                IdMessage.ReplyTo.EmailAddresses := IdMessage.From.Address;
                IdMessage.Recipients.Add.Text := email_cliente;
                IdMessage.Recipients.Add.Text := servidor_emails.usuario_server;
                IdMessage.Subject := 'GiProy Email de Confirmación';
                IdMessage.Encoding := meMIME;

                // Configuraçăo do corpo do email (TIdText)
                IdText := TIdText.Create(IdMessage.MessageParts);
                IdText.ContentType := 'text/html';

                for x := 0 to mensaje.Count - 1 do
                begin
                        IdText.Body.Add(mensaje[x]);
                end;
                // IdText.Body.LoadFromFile(tmpstr);
                // IdText.ContentType := 'text/plain; charset=iso-8859-1';
                // Opcional - Anexo da mensagem (TIdAttachmentFile)
                if nombre_fichero <> '' then
                begin
                        sAnexo := nombre_fichero;
                        if FileExists(sAnexo) then
                        begin
                                TIdAttachmentFile.Create
                                  (IdMessage.MessageParts, sAnexo);
                        end;
                end;
                // Conexion y autentificacion
                try
                        IdSMTP.Connect;
                        IdSMTP.Authenticate;
                except
                        on E: Exception do
                        begin
                                result := False;
                                Exit;
                        end;
                end;

                // Envio da mensagem
                try
                        IdSMTP.Send(IdMessage);
                        respuesta := True;
                except
                        on E: Exception do
                        begin
                                result := False;
                                Exit;
                        end;
                end;
        finally
                // desconeccion del servidor
                IdSMTP.Disconnect;
                // liberacion  del DLL
                UnLoadOpenSSLLibrary;
                // liberacion de objetos de memória
                FreeAndNil(IdMessage);
                FreeAndNil(IdSSLIOHandlerSocket);
                FreeAndNil(IdSMTP);
        end;
        result := respuesta;
end;

end.
