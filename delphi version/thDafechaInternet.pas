unit thDafechaInternet;

interface

uses
        System.Classes, DM1, System.JSON, System.Net.HTTPClientComponent,
        IdSNTP,
        System.SysUtils,
        System.Net.HttpClient, System.DateUtils;

type
        thFechaInternet = class(TThread)
        private
                { Private declarations }
        protected
                procedure Execute; override;
        public
                constructor Create(CreateSuspended: Boolean);
        end;

implementation

{ thFechaInternet }

constructor thFechaInternet.Create(CreateSuspended: Boolean);
begin
        inherited Create(CreateSuspended);
        self.FreeOnTerminate := true;
end;

procedure thFechaInternet.Execute;
var
        SNTPClient: TIdSNTP;
begin
        SNTPClient := TIdSNTP.Create(nil);
        try
                SNTPClient.Host := 'pool.ntp.org';
                SNTPClient.SyncTime;
                FechaHoraInternet := SNTPClient.DateTime;
        finally
                SNTPClient.Free;
        end;
end;

end.
