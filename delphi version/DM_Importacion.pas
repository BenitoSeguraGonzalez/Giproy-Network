unit DM_Importacion;

interface

uses
        System.SysUtils, System.Classes, Uni, Data.DB, MemDS, DBAccess,
        System.StrUtils, VirtualTable;

type
        dat_Bases = record
                codBase: string;
                nombre: string;
                descripcion: string;
                indirectos: Currency;
                TRendimiento: string;
                uTiempo: string;
                SeguridadIndustrial: Integer;
                Observaciones: string;
                FechaHoraCreacion: TDateTime;
                FechaHoraModificacion: TDateTime;
                Pais: string;
                cambioAplicado: string;
                sincronizada: Integer;
                Moneda: string;
                SimboloMoneda: string;
                BasePadre: string;
                PresupuestoAsignado: string;
        end;

type
        dat_edtI = record
                codBase: string;
                codPresupuesto: string;
                Revision: Integer;
                codEDT: string;
                descripcion: string;
                puntero: Integer;
        end;

type
        TDMImportacion = class(TDataModule)
                QCompruebaNombreDB: TUniQuery;
                QCompruebaNombreDBid: TIntegerField;
                QDatosPais: TUniQuery;
                QDatosPaiscodmoneda: TStringField;
                QDatosPaisSimbolo: TStringField;
                QSiguienteCodProyecto: TUniQuery;
                QCompruebaNombreProyecto: TUniQuery;
                QCompruebaNombreProyectoid: TIntegerField;
                QSiguienteCodProyectoPresupuestoValor1: TStringField;
                QSiguienteCodProyectoPresupuestoValor2: TStringField;
                QSiguienteCodProyectoPresupuestoValor3: TIntegerField;
                QPresupuestoDatosGenerales: TUniSQL;
                QPresupuestoDatosProyecto: TUniSQL;
                QPresupuestoImportarAPUS: TUniSQL;
                QPresupuestoCategoriaAPUS: TUniSQL;
                QPresupuestoActualizaAPUS: TUniSQL;
                QPresupuestoImportarAPUSItems: TUniSQL;
                QCodEdtImportados: TUniQuery;
                QCodEdtImportadosCodEDT: TStringField;
                QCodEdtImportadosDescripcion: TStringField;
                QPresupuestoInsertaLineaItems: TUniQuery;
                QCodEdtImportadoscodUnicoItemPresupuesto: TStringField;
                QInsertaRecursosI: TUniSQL;
                QApusItems_a_Recursos: TUniQuery;
                QApusItems_a_RecursosidUnico: TStringField;
                QApusItems_a_RecursoscodCategoriaBase: TStringField;
                QApusItems_a_RecursosDescripcion: TStringField;
                QApusItems_a_Recursosunidad: TStringField;
                QApusItems_a_RecursosPrecio: TFloatField;
                QApusItems_a_Recursospreciolocal: TFloatField;
                QApusItems_a_RecursosprecioBase: TFloatField;
                QApusItems_a_Recursosmoneda: TStringField;
                QProyectoEsNuevo: TUniQuery;
                QProyectoEsNuevoNApus: TLargeintField;
                QExisteCodApuAlternativo: TUniQuery;
                QExisteCodApuAlternativoresultado: TLargeintField;
                QPresupuestoBuscaCodAPU: TUniQuery;
                QPresupuestoBuscaCodAPUCodAPU: TStringField;
                QPresupuestoBuscaCodAPUrendimientoHUnidad: TStringField;
                QPresupuestoBuscaCodAPUnhCuadrillas: TStringField;
                QPresupuestoBuscaCodAPUcodAPUGenerico: TStringField;
                QActivaAPUSAnidado: TUniSQL;
                QDaUltCodRecursoApu: TUniQuery;
                QDaUltCodRecursoApuUltCodRecursoAPU: TLargeintField;
                QDaCodAlternativoAPU: TUniQuery;
                QDaCodAlternativoAPUcodAPUAlternativo: TStringField;
                QEsApuAnidado: TUniQuery;
                QEsApuAnidadonApus: TLargeintField;
                QDaApusItemXAPUS: TUniQuery;
                QDaApusItemXAPUSidUnicoRecurso: TStringField;
                QDaApusItemXAPUScodCategoria: TStringField;
                QAjustaCodUnicoRecursoAnidado: TUniSQL;
                QExisteRecursoI: TUniQuery;
                QExisteRecursoIResultado: TLargeintField;
                QExisteRecursoxCodAlternativo: TUniQuery;
                QExisteRecursoxCodAlternativoid: TIntegerField;
                QDaApusItemXAPUSv2: TUniQuery;
                QDaApusItemXAPUSv2idUnicoRecurso: TStringField;
                QDaUltimoCodRecurso: TUniQuery;
                QDaUltimoCodRecursoUltCodRecurso: TIntegerField;
                QCodEdtImportadospuntero: TIntegerField;
                QExisteRecursoxCodAlternativoSERCOP: TUniQuery;
                QExisteRecursoxCodAlternativoSERCOPid: TIntegerField;
                QExisteRecursoxCodAlternativoSERCOPcodAlternativo: TStringField;
        private
                { Private declarations }
        public
                { Public declarations }
                datosDB: dat_Bases;
                datosEDT: array of dat_edtI;
                procedure GuardaDB();
                procedure insertaLineaItems(iCodBase, iCodPresupuesto,
                  iRevision, iCodEDT, iCodItems, idescripcion, iunidad: string;
                  iCantidad, iPUnitario, iPTotal: Currency; posGrid: Integer;
                  Transaccion: TUniTransaction);
                function GeneraDB(descripcion: string; costoIndirecto: Currency;
                  Pais: string; codProyectoI: string): string;
                function existeRecursoCodAlternativoSERCOP(codBaseI,
                  descripcion, unidad: string): Boolean;
                function ExisteNombreDB(codDB: string): Boolean;
                function ExisteNombreProyecto(codProyectoI: string): Boolean;
                function generaCodSigProyecto(): string;
                function esProyectoNuevo(descripcion: string; total: Currency;
                  nApus: Integer): Boolean;
                function ExisteApuAlternativo(codBaseI: string;
                  codApuAlternativo: string): Boolean;
                function existeRecurso(codBaseI: string; descripcion: string;
                  unidad: string): Boolean;
                function existeRecursoCodAlternativo(codBaseI: string;
                  codAlternativo: string): Boolean;
                function daUltCodRecurso(codBaseI: string;
                  codCategoriaBase: Integer): Integer;
        end;

var
        DMImportacion: TDMImportacion;

implementation

{%CLASSGROUP 'FMX.Controls.TControl'}

uses
        DM1, DM2;
{$R *.dfm}
{ TDMImportacion }

function TDMImportacion.daUltCodRecurso(codBaseI: string;
  codCategoriaBase: Integer): Integer;
begin
        QDaUltimoCodRecurso.Close;
        QDaUltimoCodRecurso.ParamByName('codBase').AsString := codBaseI;
        QDaUltimoCodRecurso.ParamByName('codCategoriaBase').AsInteger :=
          codCategoriaBase;
        QDaUltimoCodRecurso.Open;
        if QDaUltimoCodRecursoUltCodRecurso.AsInteger > 1 then
                result := QDaUltimoCodRecursoUltCodRecurso.AsInteger + 1
        else
                result := 1;
end;

function TDMImportacion.esProyectoNuevo(descripcion: string; total: Currency;
  nApus: Integer): Boolean;
begin
        with QProyectoEsNuevo do
        begin
                Close;
                ParamByName('descripcion').AsString := descripcion;
                ParamByName('total').AsCurrency := total;
                Open;
                if QProyectoEsNuevoNApus.AsInteger <> nApus then
                        result := True
                else
                        result := False;
        end;
end;

function TDMImportacion.ExisteApuAlternativo(codBaseI, codApuAlternativo
  : string): Boolean;
begin
        with QExisteCodApuAlternativo do
        begin
                Close;
                ParamByName('codBase').AsString := codBaseI;
                ParamByName('codAPUAlternativo').AsString := codApuAlternativo;
                Open;
                if QExisteCodApuAlternativoresultado.AsInteger > 0 then
                        result := True
                else
                        result := False;
        end;

end;

function TDMImportacion.ExisteNombreDB(codDB: string): Boolean;
begin
        QCompruebaNombreDB.Close;
        QCompruebaNombreDB.ParamByName('codBaseI').AsString := codDB;
        QCompruebaNombreDB.Open;
        if QCompruebaNombreDBid.AsString <> '' then
                result := True
        else
                result := False;

end;

function TDMImportacion.ExisteNombreProyecto(codProyectoI: string): Boolean;
begin
        QCompruebaNombreProyecto.Close;
        QCompruebaNombreProyecto.ParamByName('codProyecto').AsString :=
          codProyectoI;
        QCompruebaNombreProyecto.Open;
        result := False;
        if QCompruebaNombreProyectoid.AsString <> '' then
                result := True;
end;

function TDMImportacion.existeRecurso(codBaseI, descripcion,
  unidad: string): Boolean;
begin
        QExisteRecursoI.Close;
        QExisteRecursoI.ParamByName('codBase').AsString := codBaseI;
        QExisteRecursoI.ParamByName('descripcion').AsString := descripcion.Trim;
        QExisteRecursoI.ParamByName('unidad').AsString := unidad.Trim;
        QExisteRecursoI.Open;
        if QExisteRecursoIResultado.AsInteger > 0 then
                result := True
        else
                result := False;
end;

function TDMImportacion.existeRecursoCodAlternativo(codBaseI,
  codAlternativo: string): Boolean;
begin
        QExisteRecursoxCodAlternativo.Close;
        QExisteRecursoxCodAlternativo.ParamByName('codBase').AsString
          := codBaseI;
        QExisteRecursoxCodAlternativo.ParamByName('codAPUAlternativo').AsString
          := codAlternativo;
        QExisteRecursoxCodAlternativo.Open;
        if QExisteRecursoxCodAlternativoid.AsInteger > 0 then
                result := True
        else
                result := False;
end;

function TDMImportacion.existeRecursoCodAlternativoSERCOP(codBaseI, descripcion,
  unidad: string): Boolean;
begin
        QExisteRecursoxCodAlternativoSERCOP.Close;
        QExisteRecursoxCodAlternativoSERCOP.ParamByName('codBase').AsString
          := codBaseI;
        QExisteRecursoxCodAlternativoSERCOP.ParamByName('descripcion').AsString
          := descripcion;
        QExisteRecursoxCodAlternativoSERCOP.ParamByName('unidad').AsString
          := unidad;
        QExisteRecursoxCodAlternativoSERCOP.Open;
        if QExisteRecursoxCodAlternativoSERCOPid.AsInteger > 0 then
                result := True
        else
                result := False;
end;

function TDMImportacion.generaCodSigProyecto: string;
var
        salir: Boolean;
        x: Integer;
        UltValor: Integer;
        tValor3: string;
begin
        salir := False;
        QSiguienteCodProyecto.Close;
        QSiguienteCodProyecto.Open;
        UltValor := QSiguienteCodProyectoPresupuestoValor3.AsInteger;
        while not salir do
        begin
                tValor3 := IntToStr(UltValor);
                for x := 0 to 4 - length(tValor3) do
                begin
                        tValor3 := '0' + tValor3;
                end;
                result := QSiguienteCodProyectoPresupuestoValor1.AsString + '-'
                  + QSiguienteCodProyectoPresupuestoValor2.AsString + '-'
                  + tValor3;
                if ExisteNombreProyecto(result) then
                begin
                        inc(UltValor);
                end
                else
                begin
                        salir := True;
                end;
        end;
end;

function TDMImportacion.GeneraDB(descripcion: string; costoIndirecto: Currency;
  Pais: string; codProyectoI: string): string;
begin
        datosDB.codBase := 'DBI' + FormatDateTime('yyyymmddhhnnss', Now);
        result := '';
        if not ExisteNombreDB(datosDB.codBase) then
                result := datosDB.codBase
        else
        begin
                Exit
        end;
        datosDB.nombre := descripcion;
        datosDB.descripcion := 'Importación desde excel';
        datosDB.indirectos := costoIndirecto;
        datosDB.TRendimiento := 'Rendimiento Unitario (Tiempo/Unidad)';
        datosDB.uTiempo := 'Horas';
        datosDB.SeguridadIndustrial := 0;
        datosDB.FechaHoraCreacion := Now;
        datosDB.FechaHoraModificacion := Now;
        datosDB.Pais := Pais;
        QDatosPais.Close;
        QDatosPais.ParamByName('pais').AsString := Pais;
        QDatosPais.Open;
        if QDatosPaisSimbolo.AsString = '' then
        begin
                datosDB.Moneda := 'USD';
                datosDB.SimboloMoneda := '$';
        end
        else
        begin
                datosDB.Moneda := QDatosPaiscodmoneda.AsString;
                datosDB.SimboloMoneda := QDatosPaisSimbolo.AsString;
        end;
        datosDB.sincronizada := 0;
        datosDB.PresupuestoAsignado := codProyectoI;
end;

procedure TDMImportacion.GuardaDB();
var
        qry: TUniQuery;
        tmpstr: string;
        x: Integer;
begin
        qry := TUniQuery.Create(nil);
        try
                with qry do
                begin
                        Connection := DModule_1.con2;
                        Close;
                        sql.Clear;
                        sql.Add('INSERT INTO bases (codBase ,nombre ,descripcion ,indirectos ,TRendimiento ,UTiempo ,SeguridadIndustrial ,Observaciones ,FechaHoraCreacion ,FechaHoraModificacion ,pais ,cambioAplicado'
                          + ',sincronizada  ,moneda ,simboloMoneda ,basesPadres ,presupuestoAsignado)'
                          + 'VALUES (:codBase ,:nombre ,:descripcion ,:indirectos ,:TRendimiento ,:UTiempo ,:SeguridadIndustrial ,:Observaciones ,:FechaHoraCreacion ,:FechaHoraModificacion ,:pais ,:cambioAplicado'
                          + '  ,:sincronizada  ,:moneda ,:simboloMoneda ,:basesPadres ,:presupuestoAsignado) ');

                        ParamByName('codBase').AsString := datosDB.codBase;
                        ParamByName('nombre').AsString := datosDB.nombre;
                        ParamByName('descripcion').AsString :=
                          datosDB.descripcion;
                        ParamByName('indirectos').AsCurrency :=
                          datosDB.indirectos;
                        ParamByName('TRendimiento').AsString :=
                          datosDB.TRendimiento;
                        ParamByName('Utiempo').AsString := datosDB.uTiempo;
                        ParamByName('SeguridadIndustrial').AsInteger :=
                          datosDB.SeguridadIndustrial;
                        ParamByName('Observaciones').AsString :=
                          datosDB.Observaciones;
                        ParamByName('FechaHoraCreacion').AsDateTime :=
                          datosDB.FechaHoraCreacion;
                        ParamByName('FechaHoraModificacion').AsDateTime :=
                          datosDB.FechaHoraModificacion;
                        ParamByName('pais').AsString := datosDB.Pais;
                        ParamByName('sincronizada').AsInteger :=
                          datosDB.sincronizada;
                        ParamByName('moneda').AsString := datosDB.Moneda;
                        ParamByName('simboloMoneda').AsString :=
                          datosDB.SimboloMoneda;
                        ParamByName('basesPadres').AsString :=
                          datosDB.BasePadre;
                        ParamByName('presupuestoAsignado').AsString :=
                          datosDB.PresupuestoAsignado;
                        ParamByName('cambioAplicado').AsString :=
                          '1,00 USD (US Dollar) =  USD';
                        Prepare;
                        ExecSQL;
                        Close;
                        sql.Clear;
                        sql.Add('update configuracion set PresupuestoValor3=:PresupuestoValor3 where id=1');
                        tmpstr := datosDB.PresupuestoAsignado;
                        tmpstr := RightStr(tmpstr, 6);
                        x := StrToInt(tmpstr) + 1;
                        ParamByName('PresupuestoValor3').AsInteger := x;
                        Prepare;
                        ExecSQL;
                end;
        finally
                qry.free;
        end;
end;

procedure TDMImportacion.insertaLineaItems(iCodBase, iCodPresupuesto, iRevision,
  iCodEDT, iCodItems, idescripcion, iunidad: string;
  iCantidad, iPUnitario, iPTotal: Currency; posGrid: Integer;
  Transaccion: TUniTransaction);
var
        codUnicoItems: string;
        codAPUGenerico: string;
        CodAPU: string;
        rendimientoHUnidad, nhCuadrillas: Currency;
        x: Integer;
begin
        QPresupuestoInsertaLineaItems.Close;
        QPresupuestoInsertaLineaItems.transaction := Transaccion;
        if iCodEDT = '' then
        begin
                QPresupuestoBuscaCodAPU.Close;
                QPresupuestoBuscaCodAPU.ParamByName('codBase').AsString
                  := iCodBase;
                QPresupuestoBuscaCodAPU.ParamByName('descripcion').AsString :=
                  idescripcion;
                QPresupuestoBuscaCodAPU.ParamByName('unidad').AsString
                  := iunidad;
                QPresupuestoBuscaCodAPU.Open;
                CodAPU := QPresupuestoBuscaCodAPUCodAPU.AsString;
                codAPUGenerico :=
                  QPresupuestoBuscaCodAPUcodAPUGenerico.AsString;
                rendimientoHUnidad :=
                  StrToCurr(decimal_correcto
                  (QPresupuestoBuscaCodAPUrendimientoHUnidad.AsString));
                nhCuadrillas :=
                  StrToCurr(decimal_correcto
                  (QPresupuestoBuscaCodAPUnhCuadrillas.AsString));

                codUnicoItems := generaGUID;
        end
        else
        begin
                codUnicoItems :=
                  QCodEdtImportadoscodUnicoItemPresupuesto.AsString;
                CodAPU := '';
                codAPUGenerico := '';
                rendimientoHUnidad := 0;
                nhCuadrillas := 0;
        end;
        QPresupuestoInsertaLineaItems.ParamByName('codBase').AsString
          := iCodBase;
        QPresupuestoInsertaLineaItems.ParamByName('codPresupuesto').AsString :=
          iCodPresupuesto;
        QPresupuestoInsertaLineaItems.ParamByName('revision').AsInteger :=
          StrToInt(iRevision);
        QPresupuestoInsertaLineaItems.ParamByName('codEdt').AsString := iCodEDT;
        QPresupuestoInsertaLineaItems.ParamByName('codItems').AsString :=
          iCodItems;
        QPresupuestoInsertaLineaItems.ParamByName('codUnicoItems').AsString :=
          codUnicoItems;
        QPresupuestoInsertaLineaItems.ParamByName('CodAPUGenerico').AsString :=
          codAPUGenerico;
        QPresupuestoInsertaLineaItems.ParamByName('codAPU').AsString := CodAPU;
        QPresupuestoInsertaLineaItems.ParamByName('Descripcion').AsString :=
          idescripcion;
        QPresupuestoInsertaLineaItems.ParamByName('unidad').AsString := iunidad;
        QPresupuestoInsertaLineaItems.ParamByName('Cantidad').AsCurrency :=
          iCantidad;
        QPresupuestoInsertaLineaItems.ParamByName('pUnitario').AsCurrency :=
          iPUnitario;
        QPresupuestoInsertaLineaItems.ParamByName('pTotal').AsCurrency
          := iPTotal;
        QPresupuestoInsertaLineaItems.ParamByName('rendimientoHUnidad')
          .AsCurrency := rendimientoHUnidad;
        QPresupuestoInsertaLineaItems.ParamByName('nHCuadrillas').AsCurrency :=
          nhCuadrillas;
        QPresupuestoInsertaLineaItems.ParamByName('anidado').AsInteger := 0;
        QPresupuestoInsertaLineaItems.ParamByName('posgrid').AsInteger
          := posGrid;
        QPresupuestoInsertaLineaItems.Prepare;
        QPresupuestoInsertaLineaItems.Execute;
end;

end.
