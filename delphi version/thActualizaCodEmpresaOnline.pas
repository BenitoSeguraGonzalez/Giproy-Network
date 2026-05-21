unit thActualizaCodEmpresaOnline;

interface

uses
        System.Classes, Uni, UniProvider, MySQLUniProvider, DBAccess,
        System.StrUtils,
        System.SysUtils;

type
        thActualizaCodEmpresaActiva = class(TThread)
        private
                { Private declarations }
                condb: TUniConnection;
                qry: TUniQuery;
                emailUsuario: string;
                codEmpresaActivaGuardar: string;
        protected
                procedure Execute; override;
        public
                constructor Create(CreateSuspended: Boolean;
                  TemailUsuario, TcodEmpresaActivaGuardar: string);
        end;

implementation

uses uMain, DM1;

{ thActualizaCodEmpresaActiva }

constructor thActualizaCodEmpresaActiva.Create(CreateSuspended: Boolean;
  TemailUsuario, TcodEmpresaActivaGuardar: string);
begin
        inherited Create(CreateSuspended);
        self.FreeOnTerminate := true;
        emailUsuario := TemailUsuario;
        codEmpresaActivaGuardar := TcodEmpresaActivaGuardar;
end;

procedure thActualizaCodEmpresaActiva.Execute;
begin

end;

end.
