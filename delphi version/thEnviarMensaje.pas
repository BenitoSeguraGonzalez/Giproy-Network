unit thEnviarMensaje;

interface

uses
        System.Classes, Uni, UniProvider, MySQLUniProvider, DBAccess,
        System.StrUtils,
        System.JSON, System.SysUtils;

type
        thEnviarMensajeComicacion = class(TThread)
        private
                { Private declarations }
                vIdEmisor: integer;
                vIdReceptor: integer;
                vidTipoMensaje: integer;
                vMensaje: string;
                vEmail_receptor: string;
                vReceptor: string;

        protected
                { Protected declarations }
                procedure Execute; override;

        public
                { Public declarations }
                constructor Create(CreateSuspended: Boolean;
                  TidEmisor, TidReceptor, TidTipoMensaje: integer;
                  TMensaje, Temail_receptor, Treceptor: string);

        end;

implementation

{ thEnviarMensajeComicacion }

uses
        DM1, uApiGiProy;

constructor thEnviarMensajeComicacion.Create(CreateSuspended: Boolean;
  TidEmisor, TidReceptor, TidTipoMensaje: integer;
  TMensaje, Temail_receptor, Treceptor: string);
begin
        inherited Create(CreateSuspended);
        self.FreeOnTerminate := true;
        vIdEmisor := TidEmisor;
        vIdReceptor := TidReceptor;
        vidTipoMensaje := TidTipoMensaje;
        vMensaje := TMensaje;
        vEmail_receptor := Temail_receptor;
        vReceptor := Treceptor;
end;

procedure thEnviarMensajeComicacion.Execute;
var
        Ok: Boolean;
        fechaEnvio: TDateTime;
begin
        try
                // 1) Enviar al servidor vía HTTP (el id del emisor va en el JWT)
                Ok := EnviarMensajeSimple(UrlEnviarMensaje, GlobalAuthToken,
                  { idReceptor= } vIdReceptor,
                  { idTipoMensaje= } vidTipoMensaje,
                  { mensaje= } vMensaje);

                // 2) Si el envío fue OK, guardamos en la base local
                if Ok then
                begin
                        fechaEnvio := Now;

                        DModule_1.SQLInsertaComunicacion.ParamByName
                          ('idUsuarioEmisor').AsInteger := vIdEmisor;
                        DModule_1.SQLInsertaComunicacion.ParamByName
                          ('idUsuarioReceptor').AsInteger := vIdReceptor;
                        DModule_1.SQLInsertaComunicacion.ParamByName
                          ('emailReceptor').AsString := vEmail_receptor;
                        DModule_1.SQLInsertaComunicacion.ParamByName('Receptor')
                          .AsString := vReceptor;
                        DModule_1.SQLInsertaComunicacion.ParamByName
                          ('idTipoComunicacion').AsInteger := vidTipoMensaje;
                        DModule_1.SQLInsertaComunicacion.ParamByName
                          ('DatosComunicacion').AsString := vMensaje;
                        DModule_1.SQLInsertaComunicacion.ParamByName
                          ('fechahoraEmision').AsDateTime := fechaEnvio;
                        DModule_1.SQLInsertaComunicacion.Execute;
                end;

        except
                // Silencio como en tu versión original. Si quieres loguear:
                // on E: EApiException do Log(E.Message);
                // on E: Exception do Log(E.Message);
        end;
end;

end.
