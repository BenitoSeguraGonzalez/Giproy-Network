unit DM_Presupuestos;

interface

uses
  System.SysUtils, System.Classes, Data.DB, DBAccess, Uni, MemDS,
  System.StrUtils, System.Types,
  System.UITypes, System.Variants, System.Rtti, FMX.Clipboard, FMX.Platform,
  Winapi.Messages,
  Winapi.Windows, FMX.Types, FMX.Controls, FMX.Graphics, FMX.Dialogs,
  FMX.Controls.Presentation,
  FMX.StdCtrls, UniProvider, MySQLUniProvider, FMX.TMSFNCTypes, FMX.TMSFNCUtils,
  FMX.TMSFNCGraphics,
  FMX.TMSFNCGraphicsTypes, FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions,
  FMX.TMSFNCCustomComponent,
  FMX.TMSFNCCustomGrid, FMX.TMSFNCGridDatabaseAdapter, FMX.TMSFNCCustomControl,
  System.Zip,
  FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData, FMX.TMSFNCGrid,
  System.IOUtils, system.Math,
  FMX.TMSFNCTreeViewBase, FMX.TMSFNCTreeViewData, FMX.TMSFNCCustomTreeView;

const
  puntero = '<c:f>';
  punteroFin = '</c:f>';

type
  TDMPresupuesto = class(TDataModule)
    QEDT_Valorada: TUniQuery;
    unqry_ActualizarIVA: TUniQuery;
    StoreProc_ParetoGeneral: TUniStoredProc;
    dsPareto: TUniDataSource;
    qryPareto: TUniQuery;
    StoreProc_ParetoCapitulos: TUniStoredProc;
    dsPCapitulo: TUniDataSource;
    qryPCapitulo: TUniQuery;
    dsTpresupuestosItems: TUniDataSource;
    StoreProc_EstaAPUenCapitulo: TUniStoredProc;
    StoreProc_Presupuesto_actualizaLinea: TUniStoredProc;
    unqryAbrePosGrid: TUniQuery;
    unqryUpdataCantidades: TUniQuery;
    StoreProc_CopyMoveAPU: TUniStoredProc;
    qryParetoid: TIntegerField;
    qryParetocodBase: TStringField;
    qryParetocodPresupuesto: TStringField;
    qryParetorevision: TStringField;
    qryParetocodEDT: TStringField;
    qryParetocodItems: TStringField;
    qryParetocodUnicoItems: TStringField;
    qryParetocodAPUGenerico: TStringField;
    qryParetocodAPU: TStringField;
    qryParetodescripcion: TStringField;
    qryParetounidad: TStringField;
    qryParetoCantidad: TFloatField;
    qryParetoPUnitario: TFloatField;
    qryParetoPtotal: TFloatField;
    qryParetonotas: TBooleanField;
    qryPCapitulonotas: TBooleanField;
    qryParetorendimientoHUnidad: TStringField;
    qryParetonhCuadrillas: TStringField;
    qryParetoanidado: TStringField;
    qryParetoposgrid: TIntegerField;
    qryPCapituloid: TIntegerField;
    qryPCapitulocodBase: TStringField;
    qryPCapitulocodPresupuesto: TStringField;
    qryPCapitulorevision: TStringField;
    qryPCapitulocodEDT: TStringField;
    qryPCapitulocodItems: TStringField;
    qryPCapitulocodUnicoItems: TStringField;
    qryPCapitulocodAPUGenerico: TStringField;
    qryPCapitulocodAPU: TStringField;
    qryPCapitulodescripcion: TStringField;
    qryPCapitulounidad: TStringField;
    qryPCapituloCantidad: TFloatField;
    qryPCapituloPUnitario: TFloatField;
    qryPCapituloPtotal: TFloatField;

    qryPCapitulorendimientoHUnidad: TStringField;
    qryPCapitulonhCuadrillas: TStringField;
    qryPCapituloanidado: TStringField;
    qryPCapituloposgrid: TIntegerField;
    unqryNotas: TUniQuery;
    mfldNotasnotas: TMemoField;
    dtmfldNotasfechahora: TDateTimeField;
    StoreProc_NotaenAPUS: TUniStoredProc;
    QAPUS: TUniQuery;
    dsSubCategorias: TUniDataSource;
    dsPresupuestosAPUs: TUniDataSource;
    QSubCategorias: TUniQuery;
    QTPresupuestosItems: TUniQuery;
    QSubCategoriasciu: TIntegerField;
    QSubCategoriasdescripcion: TStringField;
    QTanteoRecursoAPUS: TUniQuery;
    QTanteoRecursoAPUSCodCategoria: TStringField;
    QTanteoRecursoAPUScodbase: TStringField;
    QTanteoRecursoAPUScodapu: TStringField;
    QTanteoRecursoAPUSdescripcion: TStringField;
    QTanteoRecursoAPUSidunicorecurso: TStringField;
    QTanteoRecursoAPUSPrecio: TFloatField;
    QTanteoRecursoAPUSCantidadUnidad: TFloatField;
    QTanteoRecursoAPUSRendimiento: TFloatField;
    QTanteoRecursoAPUSTotal: TFloatField;
    QTanteoAPUS: TUniQuery;
    QLeerLineaTanteo: TUniQuery;
    StoreProc_TanteoGuardaItems: TUniStoredProc;
    QCopiarEDTInicio: TUniSQL;
    QTanteoRecursoAPUSunidad: TStringField;
    QTanteoRecursoAPUScodRecursoCompleto: TStringField;
    QLV_ApusCategoria: TUniQuery;
    QTanteoAPUSdescripcion: TStringField;
    QTanteoAPUSunidad: TStringField;
    QTanteoAPUScostodirectototal: TFloatField;
    QTanteoAPUSCostoIndirectoTotal: TFloatField;
    QTanteoAPUSPrecioUnitarioTotal: TFloatField;
    QDirectorioAsignados: TUniQuery;
    QBuscarStake: TUniQuery;
    QBuscarStakeid: TIntegerField;
    QBuscarStakerolProyecto: TStringField;
    QBuscarStakeidFiscal: TStringField;
    QBuscarStakeNombre: TStringField;
    QBuscarStakeApellidos: TStringField;
    QBuscarStakedireccion: TStringField;
    QBuscarStakelocalidad: TStringField;
    QBuscarStakeprovincia: TStringField;
    QBuscarStakepais: TStringField;
    QBuscarStaketelefono: TStringField;
    QBuscarStakeemail: TStringField;
    QBuscarStakeTitulacion: TStringField;
    QBuscarStakeInstitucion: TStringField;
    QEDOProyecto: TUniQuery;
    QEDOProyectorolproyecto: TStringField;
    QEDOProyectoresponsable: TStringField;
    QEDOProyectoidstake: TStringField;
    QEDOProyectoactividadclave: TMemoField;
    QDatosCronogramasValorados: TUniQuery;
    QDatosCronogramasValoradosdescripcion: TStringField;
    QDatosCronogramasValoradosNombreApellido: TStringField;
    QDatosCronogramasValoradosUbicacion: TStringField;
    QDatosCronogramasValoradosfechainicio: TDateTimeField;
    QDatosCronogramasValoradosfechafinalizacion: TDateTimeField;
    QDatosCronogramasValoradosplazoejecucion: TStringField;
    QDatosCronogramasValoradoscodreferencial: TStringField;
    QDatosCronogramasValoradosciudad: TStringField;
    QDirectorioAsignadosid: TIntegerField;
    QDirectorioAsignadosidGrid: TStringField;
    QDirectorioAsignadoscodBase: TStringField;
    QDirectorioAsignadoscodPresupuesto: TStringField;
    QDirectorioAsignadosrevision: TStringField;
    QDirectorioAsignadosrolPresupuesto: TStringField;
    QDirectorioAsignadosidFiscal: TStringField;
    QDirectorioAsignadosnombre: TStringField;
    QDirectorioAsignadosapellidos: TStringField;
    QDirectorioAsignadosemail: TStringField;
    QDirectorioAsignadostitulacion: TStringField;
    QDirectorioAsignadosidUnico: TStringField;
    QDirectorioAsignadosid_1: TIntegerField;
    QDirectorioAsignadosrolProyecto: TStringField;
    QDirectorioAsignadosidFiscal_1: TStringField;
    QDirectorioAsignadosNombre_1: TStringField;
    QDirectorioAsignadosApellidos_1: TStringField;
    QDirectorioAsignadosdireccion: TStringField;
    QDirectorioAsignadoslocalidad: TStringField;
    QDirectorioAsignadosprovincia: TStringField;
    QDirectorioAsignadospais: TStringField;
    QDirectorioAsignadostelefono: TStringField;
    QDirectorioAsignadosemail_1: TStringField;
    QDirectorioAsignadosTitulacion_1: TStringField;
    QDirectorioAsignadosInstitucion: TStringField;
    QEDT_Diccionario: TUniQuery;
    QEDT_DiccionariocodEdt: TStringField;
    QEDT_Diccionariodescripcion: TStringField;
    QEDT_DiccionarioResponsable: TStringField;
    QEDT_DiccionarioDefinicion: TMemoField;
    QEDT_ValoradacodEdt: TStringField;
    QEDT_Valoradadescripcion: TStringField;
    QEDT_ValoradaResponsable: TStringField;
    QEDT_ValoradaDefinicion: TMemoField;
    QEDT_ValoradaPTotal: TFloatField;
    QNumeroDeItemsPresupuesto: TUniQuery;
    QNumeroDeItemsPresupuestoNItemsPresupuesto: TLargeintField;
    QAPUSid: TIntegerField;
    QAPUScodrecursoapu: TIntegerField;
    QAPUScodcategoriaapu: TStringField;
    QAPUScodapu: TStringField;
    QAPUSCodGenerico: TStringField;
    QAPUSdescripcion: TStringField;
    QAPUSunidad: TStringField;
    QAPUSCostoAPU: TFloatField;
    QAPUSanidado: TStringField;
    StoreProc_TanteoAprobar: TUniStoredProc;
    StoreProc_TanteoRechazar: TUniStoredProc;
    procedure DataModuleCreate(Sender: TObject);
    procedure DataModuleDestroy(Sender: TObject);
    procedure QTPresupuestosItemsAfterOpen(DataSet: TDataSet);
  private
    { Private declarations }
    FCalculoSuspendido: Integer;
    QTotalPresupuesto: TUniQuery;

    procedure AplicarFormatoMoneda;
    procedure ZipDirectory2Excel(const SourceDir, ZipFileName: string);
    function daRangoCharts(datos: string): string;
    function CreaNuevoRango(datos: string; nPeriodos: Integer): string;
    function getRelativePath(SourceDir, Filename: string): string;
  public
    { Public declarations }
    FLineasNecesitanRecalculo: Boolean;

    procedure refrescar_Presupuesto();
    procedure activar_presupuesto();
    procedure calculaTotal;
    procedure addAPUdb();
    procedure activaDataSet(indice: Integer);
    procedure EncabezadoGrid();
    procedure ajustaColor();
    procedure copiarCantidadesPresupuesto(listadoCantidades: TStringList;
      PosIniGrid: Integer);
    procedure copiarAPUS();
    procedure cortarAPUS();
    procedure pegarAPUS;
    procedure activaSubcategoriayApusPresupuesto;
    procedure filtrarNombreSubCategoria(Arow: Integer; cadenaFiltrado: string);
    procedure filtrarAPUS_Categoria(cadenaBusqueda: string; codSubCategoria:
      Integer);
    procedure mostarAPU_SubCategoria(codSubCategoria: Integer);
    procedure guardaNodosEDT();
    procedure AjustaSeries(Filename: string; nPeriodos: Integer);
    procedure sincronizaEdt2Presupuesto();
    function daNewCodITem(codItem: string): string;
    function compruebaSiEsAPU(posicionGrid: Integer): Integer;
    function Validado(codAPUT: string): boolean;

    procedure BeginBatch;
    procedure EndBatch;
    procedure TanteoAprobar(const codAPU: string);
    procedure TanteoRechazar(const codAPU: string);
    procedure ActualizarFormatoMoneda;
    procedure TanteoAsegurarInicio(const codAPU: string);

  end;

var
  DMPresupuesto: TDMPresupuesto;

implementation

{%CLASSGROUP 'FMX.Controls.TControl'}
{$R *.dfm}

uses
  DM1, uMain, uNotasAPUEDT, uGridFNC;

{ TDMPresupuesto }

procedure TDMPresupuesto.TanteoAsegurarInicio(const codAPU: string);
var
  qry: TUniQuery;
begin
  if codAPU = '' then
    Exit;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.Close;
    qry.SQL.Text :=
      'CALL Tanteo_AsegurarInicio(:iCodBase,:iCodPresupuesto,:iRevision,:iCodAPU)';
    qry.ParamByName('iCodBase').AsString := base_activa.codBase;
    qry.ParamByName('iCodPresupuesto').AsString := codProyecto;
    qry.ParamByName('iRevision').AsString := revision;
    qry.ParamByName('iCodAPU').AsString := codAPU;
    qry.ExecSQL;
  finally
    qry.Free;
  end;
end;

procedure TDMPresupuesto.TanteoAprobar(const codAPU: string);
var
  QActualizarBase: TUniQuery;
  QRecalcular: TUniQuery;
begin
  if codAPU = '' then
    Exit;

  QActualizarBase := TUniQuery.Create(nil);
  QRecalcular := TUniQuery.Create(nil);

  DModule_1.con2.StartTransaction;
  try
    { 1️⃣ Aprobar tanteo }
    with StoreProc_TanteoAprobar do
    begin
      Close;
      ParamByName('iCodBase').AsString := base_activa.codBase;
      ParamByName('iCodPresupuesto').AsString := codProyecto;
      ParamByName('iRevision').AsString := revision;
      ParamByName('iCodAPU').AsString := codAPU;
      Execute;
    end;

    { 2️⃣ Actualizar CostoBase desde tanteo aprobado }
    QActualizarBase.Connection := DModule_1.con2;
    QActualizarBase.SQL.Text :=
      'UPDATE presupuestos_items_trabajo pit ' +
      'JOIN presupuestos_tanteo_apus pta ' +
      '  ON pta.codBase = pit.codBase ' +
      ' AND pta.codPresupuesto = pit.codPresupuesto ' +
      ' AND pta.revision = pit.revision ' +
      ' AND pta.CodAPU = pit.codAPU ' +
      'SET pit.CostoBase = pta.CostoDirectoTotal ' +
      'WHERE pta.estado = 2 ' +
      '  AND pit.codBase = :b ' +
      '  AND pit.codPresupuesto = :p ' +
      '  AND pit.revision = :r ' +
      '  AND pit.codAPU = :apu';

    QActualizarBase.ParamByName('b').AsString := base_activa.codBase;
    QActualizarBase.ParamByName('p').AsString := codProyecto;
    QActualizarBase.ParamByName('r').AsString := revision;
    QActualizarBase.ParamByName('apu').AsString := codAPU;
    QActualizarBase.ExecSQL;

    { 3️⃣ Recalcular líneas financieras }
    QRecalcular.Connection := DModule_1.con2;
    QRecalcular.SQL.Text :=
      'CALL Presupuesto_RecalcularLineas(:b,:p,:r)';
    QRecalcular.ParamByName('b').AsString := base_activa.codBase;
    QRecalcular.ParamByName('p').AsString := codProyecto;
    QRecalcular.ParamByName('r').AsString := revision;
    QRecalcular.ExecSQL;

    DModule_1.con2.Commit;

  except
    DModule_1.con2.Rollback;
    raise;
  end;

  QActualizarBase.Free;
  QRecalcular.Free;

  { 4️⃣ Refrescar UI }
  refrescar_Presupuesto;
end;

procedure TDMPresupuesto.TanteoRechazar(const codAPU: string);
var
  QRestaurarBase: TUniQuery;
  QRecalcular: TUniQuery;
begin
  if codAPU = '' then
    Exit;

  QRestaurarBase := TUniQuery.Create(nil);
  QRecalcular := TUniQuery.Create(nil);

  try
    DModule_1.con2.StartTransaction;
    try
      StoreProc_TanteoRechazar.Close;
      StoreProc_TanteoRechazar.ParamByName('iCodBase').AsString :=
        base_activa.codBase;
      StoreProc_TanteoRechazar.ParamByName('iCodPresupuesto').AsString :=
        codProyecto;
      StoreProc_TanteoRechazar.ParamByName('iRevision').AsString := revision;
      StoreProc_TanteoRechazar.ParamByName('iCodAPU').AsString := codAPU;
      StoreProc_TanteoRechazar.Execute;

      QRestaurarBase.Connection := DModule_1.con2;
      QRestaurarBase.SQL.Text :=
        'UPDATE presupuestos_items_trabajo pit ' +
        'JOIN apus a ' +
        '  ON a.codBase = pit.codBase ' +
        ' AND a.CodAPU = pit.codAPU ' +
        'SET pit.CostoBase = a.CostoAPU ' +
        'WHERE pit.codBase = :b ' +
        '  AND pit.codPresupuesto = :p ' +
        '  AND pit.revision = :r ' +
        '  AND pit.codAPU = :apu';

      QRestaurarBase.ParamByName('b').AsString := base_activa.codBase;
      QRestaurarBase.ParamByName('p').AsString := codProyecto;
      QRestaurarBase.ParamByName('r').AsString := revision;
      QRestaurarBase.ParamByName('apu').AsString := codAPU;
      QRestaurarBase.ExecSQL;

      QRecalcular.Connection := DModule_1.con2;
      QRecalcular.SQL.Text :=
        'CALL Presupuesto_RecalcularLineas(:b,:p,:r)';

      QRecalcular.ParamByName('b').AsString := base_activa.codBase;
      QRecalcular.ParamByName('p').AsString := codProyecto;
      QRecalcular.ParamByName('r').AsString := revision;
      QRecalcular.ExecSQL;

      DModule_1.con2.Commit;

    except
      DModule_1.con2.Rollback;
      raise;
    end;

  finally
    QRestaurarBase.Free;
    QRecalcular.Free;
  end;

  refrescar_Presupuesto;
end;

function TDMPresupuesto.Validado(codAPUT: string): boolean;
var
  qry: TUniQuery;
  valor: integer;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Text:=
        'SELECT ' +
        '    IF( ' +
        '        EXISTS( ' +
        '            SELECT 1 ' +
        '            FROM apus a ' +
        '            WHERE a.CodAPU = :codAPU ' +
        '              AND a.pendienteRevision = 1 ' +
        '              AND a.codBase = :codBase ' +
        '        ), ' +
        '        1, ' +
        '        0 ' +
        '    ) AS resultado';
      {*)}
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codAPU').AsString := codAPUT;
      Open;
      valor := FieldByName('resultado').AsInteger;
      Result := True;
      if valor > 0 then
        Result := False;
    end;
  finally
    qry.free;
  end;
end;

function TDMPresupuesto.getRelativePath(SourceDir, Filename: string): string;
var
  x: Integer;
begin
  Filename := ExtractFilePath(Filename);
  x := AnsiPos(SourceDir, Filename);
  if x > 0 then
  begin
    result := Copy(Filename, x + Length(SourceDir), Length(Filename));
  end
  else
    result := '';
end;

procedure TDMPresupuesto.mostarAPU_SubCategoria(codSubCategoria: Integer);
begin
  with QAPUS do
  begin
    DisableControls;
    try
      Active := True;
      Filtered := False;
      FilterSQL := ' codcategoriaapu=' + IntToStr(codSubCategoria);
      Filtered := True;
    finally
      EnableControls;
    end;
  end;

  // Ajuste visual del grid
  if Assigned(frmMain) and Assigned(frmMain.grid_PresupuestosAPUS) then
  begin
    frmMain.AjustarGridPresupuestosAPUS;
  end;
end;

procedure TDMPresupuesto.filtrarAPUS_Categoria(cadenaBusqueda: string;
  codSubCategoria: Integer);
begin
  if QAPUS.Active then
  begin
    with QAPUS do
    begin
      Filtered := False;
      if cadenaBusqueda <> '' then
      begin
        if codSubCategoria < 0 then
        begin
          FilterSQL := ' lower(descripcion) like ' + QuotedStr('%' +
            LowerCase(cadenaBusqueda) + '%');
        end
        else
        begin
          FilterSQL := ' codcategoriaapu=' + IntToStr(codSubCategoria) +
            ' and  lower(descripcion) like ' + QuotedStr('%' +
            LowerCase(cadenaBusqueda) + '%');
        end;
        Filtered := True;
      end
      else
      begin
        if codSubCategoria > 0 then
        begin
          FilterSQL := ' codcategoriaapu=' + IntToStr(codSubCategoria);
          Filtered := True;
        end
        else
        begin
          FilterSQL := '';
          Filtered := False;
        end;
      end;
    end;
  end;
end;

procedure TDMPresupuesto.filtrarNombreSubCategoria(Arow: Integer;
  cadenaFiltrado: string);
begin
  if QSubCategorias.Active then
  begin
    with QSubCategorias do
    begin
      ParamByName('codBase').AsString := base_activa.codBase;
      if cadenaFiltrado <> '' then
      begin
        Filtered := False;
        FilterSQL := ' lower(descripcion) like ' + QuotedStr('%' +
          LowerCase(cadenaFiltrado) + '%');
        Filtered := True;
      end
      else
      begin
        FilterSQL := '';
        Filtered := False;
      end;
      ExecSQL;
    end;
    with QAPUS do
    begin
      Active := False;
      if cadenaFiltrado = '' then
      begin
        Active := True;
        filtrarAPUS_Categoria('', -1);
      end;
    end;
  end;
end;

procedure TDMPresupuesto.activaSubcategoriayApusPresupuesto;
begin
  frmMain.edt_FiltroSubCategorias.Text := '';
  frmMain.edt_FiltroAPUS.Text := '';

  // ======================
  // Subcategorías
  // ======================
  with QSubCategorias do
  begin
    Filtered := False;
    ParamByName('codBase').AsString := base_activa.codBase;
    ExecSQL;
  end;

  // ======================
  // APUS (AQUÍ van los parámetros)
  // ======================
  try
    try
      with QAPUS do
      begin
        DisableControls;
        Close;
        Filtered := False;

        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;

        // IMPORTANTE: porcentaje
        ParamByName('porcentaje').AsFloat := IndirectosPresupuesto;
        // Si ya viene en % (ej: 12), dejar así
        // Si viene como 0.12, entonces usar *100

        Open;
      end;
    except
      on E: Exception do
        raise Exception.Create('Error al cargar APUS: ' + E.Message);
    end;
  finally
    QApus.EnableControls;
    frmMain.AjustarGridPresupuestosAPUS;
  end;
end;

procedure TDMPresupuesto.ActualizarFormatoMoneda;
  procedure SetFormatoCampo(D: TDataSet; const Campo, Mascara: string);
  var
    F: TField;
  begin
    F := D.FindField(Campo);
    if (F <> nil) and (F is TNumericField) then
      TNumericField(F).DisplayFormat := Mascara;
  end;
var
  Mascara: string;
begin
  if not QTPresupuestosItems.Active then
    Exit;

  Mascara := '0.' + StringOfChar('0', nDecimalesMoneda);

  QTPresupuestosItems.DisableControls;
  try
    SetFormatoCampo(QTPresupuestosItems, 'PUnitario', Mascara);
    SetFormatoCampo(QTPresupuestosItems, 'Ptotal', Mascara);
    SetFormatoCampo(QTPresupuestosItems, 'Cantidad', Mascara);
  finally
    QTPresupuestosItems.EnableControls;
  end;

  if Assigned(frmMain) and Assigned(frmMain.grid_presupuestos) then
    frmMain.grid_presupuestos.Repaint;
end;

procedure TDMPresupuesto.copiarCantidadesPresupuesto(
  listadoCantidades: TStringList; PosIniGrid: Integer);
var
  i: Integer;
  cantidad: Double;
  id: Integer;
  precio, total: Double;
begin
  PosIniGrid := PosIniGrid - 1;

  with dsTpresupuestosItems.DataSet do
  begin
    DisableControls;
    BeginBatch;
    try
      FLineasNecesitanRecalculo := True;

      for i := 0 to listadoCantidades.Count - 1 do
      begin
        First;
        MoveBy(PosIniGrid + i);
        id := FieldByName('id').AsInteger;

        if (listadoCantidades[i] <> '') and
          (FieldByName('codAPU').AsString <> '') then
        begin
          cantidad := StrToFloatDef(listadoCantidades[i], 0);
          if cantidad = 0 then
            cantidad := 1;

          precio := FieldByName('PUnitario').AsFloat;
          total := precio * cantidad;

          unqryUpdataCantidades.Close;
          unqryUpdataCantidades.ParamByName('codbase').AsString :=
            base_activa.codBase;
          unqryUpdataCantidades.ParamByName('codPresupuesto').AsString :=
            codProyecto;
          unqryUpdataCantidades.ParamByName('revision').AsString := revision;
          unqryUpdataCantidades.ParamByName('cantidad').AsFloat := cantidad;
          unqryUpdataCantidades.ParamByName('PTotal').AsFloat := total;
          unqryUpdataCantidades.ParamByName('id').AsInteger := id;
          unqryUpdataCantidades.Execute;
        end;
      end;

    finally
      EndBatch;
      EnableControls;
    end;
  end;
end;

procedure TDMPresupuesto.pegarAPUS;
var
  Arow: Integer;
  i, j: Integer;
  estaEnCapitulo: string;
  itemDuplicado: Boolean;
  huboInserciones: Boolean;
  listadoAPUS: TStringList;
  StartedHere: Boolean;
begin
  listadoAPUS := TStringList.Create;
  StartedHere := not DModule_1.con2.InTransaction;

  if StartedHere then
    DModule_1.con2.StartTransaction;

  BeginBatch;
  try
    FLineasNecesitanRecalculo := True;
    itemDuplicado := False;
    huboInserciones := False;

    Arow := frmMain.grid_presupuestos.Selection.StartRow;
    if Arow < 1 then
      Arow := 1;

    for i := 0 to movimientoAPU.Count - 1 do
    begin
      j := DMPresupuesto.compruebaSiEsAPU(StrToInt(movimientoAPU[i]));
      if j > -1 then
        listadoAPUS.Add(IntToStr(j));
    end;

    movimientoAPU.Clear;
    movimientoAPU.Text := listadoAPUS.Text;

    if tmovimientoAPU > 0 then
    begin
      for i := 0 to movimientoAPU.Count - 1 do
      begin
        StoreProc_EstaAPUenCapitulo.Close;
        StoreProc_EstaAPUenCapitulo.ParamByName('icodbase').AsString :=
          base_activa.codBase;
        StoreProc_EstaAPUenCapitulo.ParamByName('icodPresupuesto').AsString :=
          codProyecto;
        StoreProc_EstaAPUenCapitulo.ParamByName('iRevision').AsString :=
          revision;
        StoreProc_EstaAPUenCapitulo.ParamByName('iPosItemInicio').AsInteger :=
          StrToInt(movimientoAPU[i]);
        StoreProc_EstaAPUenCapitulo.ParamByName('iPosItemFin').AsInteger :=
          Arow;
        StoreProc_EstaAPUenCapitulo.Execute;

        estaEnCapitulo :=
          StoreProc_EstaAPUenCapitulo.FieldByName('@estado').AsString;

        StoreProc_EstaAPUenCapitulo.Close;

        if estaEnCapitulo = '' then
        begin
          StoreProc_CopyMoveAPU.Close;
          StoreProc_CopyMoveAPU.ParamByName('icodbase').AsString :=
            base_activa.codBase;
          StoreProc_CopyMoveAPU.ParamByName('icodPresupuesto').AsString :=
            codProyecto;
          StoreProc_CopyMoveAPU.ParamByName('iRevision').AsString :=
            revision;
          StoreProc_CopyMoveAPU.ParamByName('IPosInicio').AsInteger :=
            StrToInt(movimientoAPU[i]);
          StoreProc_CopyMoveAPU.ParamByName('iPosFin').AsInteger := Arow;
          StoreProc_CopyMoveAPU.ParamByName('iTipoMovimiento').AsInteger :=
            tmovimientoAPU;
          StoreProc_CopyMoveAPU.ParamByName('idUsuario').AsString :=
            ID_usuario;
          StoreProc_CopyMoveAPU.Execute;

          Inc(Arow);
          huboInserciones := True;
        end
        else
          itemDuplicado := True;
      end;
    end;

    tmovimientoAPU := -1;

    if StartedHere then
      DModule_1.con2.Commit;

  except
    if StartedHere and DModule_1.con2.InTransaction then
      DModule_1.con2.Rollback;
    raise;
  end;

  try
    if huboInserciones then
    begin
      with QTPresupuestosItems do
      begin
        DisableControls;
        try
          Close;

          if Params.FindParam('ndec') <> nil then
            ParamByName('ndec').AsInteger := nDecimalesMoneda;

          if Params.FindParam('icodBase') <> nil then
            ParamByName('icodBase').AsString := base_activa.codBase;

          if Params.FindParam('icodPresupuesto') <> nil then
            ParamByName('icodPresupuesto').AsString := codProyecto;

          if Params.FindParam('irevision') <> nil then
            ParamByName('irevision').AsString := revision;

          Open;
        finally
          EnableControls;
        end;
      end;
    end;

    if itemDuplicado then
      frmMain.TWToast_infoPresupuesto.MakeText(
        'Item(s) duplicados encontrados en la Cuenta');
  finally
    EndBatch;
    listadoAPUS.Free;
  end;
end;

procedure TDMPresupuesto.QTPresupuestosItemsAfterOpen(DataSet: TDataSet);
begin
  { if DataSet.FindField('notas') <> nil then
     DataSet.FieldByName('notas').DisplayLabel := 'Notas';

   ActualizarFormatoMoneda;   }
end;

procedure TDMPresupuesto.BeginBatch;
begin
  Inc(FCalculoSuspendido);
end;

procedure TDMPresupuesto.EndBatch;
begin
  if FCalculoSuspendido > 0 then
    Dec(FCalculoSuspendido);

  if (FCalculoSuspendido = 0) and FLineasNecesitanRecalculo then
  begin
    FLineasNecesitanRecalculo := False;
    calculaTotal;
  end;
end;

procedure TDMPresupuesto.cortarAPUS();
var
  Arow: Integer;
  i: Integer;
begin
  movimientoAPU := TStringList.Create;
  Arow := frmMain.grid_presupuestos.Selection.StartRow;
  for Arow := frmMain.grid_presupuestos.Selection.StartRow to
    frmMain.grid_presupuestos.Selection.EndRow do
  begin
    if frmMain.grid_presupuestos.RowSelect[Arow] then
    begin
      movimientoAPU.Add(IntToStr(Arow));
    end;
  end;
  if movimientoAPU.Count > 0 then
  begin
    tmovimientoAPU := 5;
  end
  else
    tmovimientoAPU := -1;
  frmMain.TWToast_infoPresupuesto.MakeText('APUs Cortados');
end;

procedure TDMPresupuesto.copiarAPUS();
var
  Arow: Integer;
  i: Integer;
begin
  movimientoAPU := TStringList.Create;
  i := 0;
  Arow := frmMain.grid_presupuestos.Selection.StartRow;
  for Arow := frmMain.grid_presupuestos.Selection.StartRow to
    frmMain.grid_presupuestos.Selection.EndRow do
  begin
    if frmMain.grid_presupuestos.RowSelect[Arow] then
    begin
      movimientoAPU.Add(IntToStr(Arow));
    end;
  end;

  if movimientoAPU.Count > 0 then
  begin
    tmovimientoAPU := 4;
  end
  else
    tmovimientoAPU := -1;
  frmMain.TWToast_infoPresupuesto.MakeText('APUs Copiados');
end;

function TDMPresupuesto.compruebaSiEsAPU(posicionGrid: Integer): Integer;
begin
  result := -1;
  with dsTpresupuestosItems.DataSet do
  begin
    DisableControls;
    First;
    MoveBy(posicionGrid - 1);
    if FieldByName('codAPU').AsString <> '' then
      result := FieldByName('posgrid').AsInteger
    else
      result := -1;
    EnableControls;
  end;
end;

procedure TDMPresupuesto.ajustaColor;
var
  G: TTMSFNCGrid;
  ColCount: Integer;
  OldRow: Integer;

  procedure ApplyAlign(const ACol, ARow: Integer);
  begin
    case ACol of
      0..2: G.HorzAlignments[ACol, ARow] := gtaCenter;
      3: G.HorzAlignments[ACol, ARow] := gtaLeading;
      4..5: G.HorzAlignments[ACol, ARow] := gtaCenter;
      6..7: G.HorzAlignments[ACol, ARow] := gtaTrailing;
      8: G.HorzAlignments[ACol, ARow] := gtaCenter;
    else
      G.HorzAlignments[ACol, ARow] := gtaCenter;
    end;
  end;

  procedure ApplyToDataSet(ADs: TDataSet; const ADoReactivate: Boolean);
  var
    Arow: Integer;
    x: Integer;
    CodAPUValue: string;
    IsEDT: Boolean;
    EstadoTanteo: Integer;
    EdtRowColor: TAlphaColor;
  begin
    if ADs = nil then
      Exit;

    if ADoReactivate then
    begin
      ADs.Active := False;
      ADs.Active := True;
    end;

    if not ADs.Active then
      Exit;

    // Gris claro para líneas EDT (toda la fila)
    EdtRowColor := $FFEDEDED;

    ADs.DisableControls;
    try
      ADs.First;
      Arow := 1;

      while not ADs.Eof do
      begin
        CodAPUValue := ADs.FieldByName('codAPU').AsString;
        IsEDT := (CodAPUValue = '');

        EstadoTanteo := 0;
        if (not IsEDT) and (ADs.FindField('estado_tanteo') <> nil) then
          EstadoTanteo := ADs.FieldByName('estado_tanteo').AsInteger;

        if IsEDT then
        begin
          for x := 0 to ColCount - 1 do
          begin
            G.Colors[x, Arow] := EdtRowColor; // <-- toda la fila en gris claro
            ApplyAlign(x, Arow);

            if (x = 0) or (x = 3) then
              G.FontStyles[x, Arow] := [TFontStyle.fsBold];
          end;
        end
        else
        begin
          for x := 0 to ColCount - 1 do
          begin
            G.Colors[x, Arow] := TAlphaColors.White;
            G.FontStyles[x, Arow] := []; // limpiar estilos previos
            ApplyAlign(x, Arow);

            // === Estado del tanteo ===
            // 0 = sin tanteo
            // 1 = editando
            // 2 = aprobado
            if EstadoTanteo = 2 then
            begin
              // Aprobado -> verde suave
              G.Colors[x, Arow] := $FFEAF7EA;
              if (x = 6) or (x = 7) then
                G.FontStyles[x, Arow] := [TFontStyle.fsBold];
            end
            else if EstadoTanteo = 1 then
            begin
              // En edición -> amarillo suave
              G.Colors[x, Arow] := $FFFFF6E5;
              if (x = 5) or (x = 6) then
                G.FontStyles[x, Arow] := [TFontStyle.fsBold];
            end;
          end;
        end;

        Inc(Arow);
        ADs.Next;
      end;

      // Restaurar posición solo para dataset principal
      if (ADs = dsTpresupuestosItems.DataSet) and (OldRow > 0) then
      begin
        ADs.First;
        ADs.MoveBy(OldRow - 1);
      end;

    finally
      ADs.EnableControls;
    end;
  end;

begin
  G := frmMain.grid_presupuestos;

  OldRow := frmMain.grid_presupuestos.Selection.StartRow;

  ColCount := G.Columns.Count;
  if ColCount <= 0 then
    Exit;

  if dsTpresupuestosItems.DataSet <> nil then
    ApplyToDataSet(dsTpresupuestosItems.DataSet, False);

  if dsPareto.DataSet <> nil then
    ApplyToDataSet(dsPareto.DataSet, True);

  if dsPCapitulo.DataSet <> nil then
    ApplyToDataSet(dsPCapitulo.DataSet, True);
end;

function TDMPresupuesto.daRangoCharts(datos: string): string;
var
  x, y: Integer;
  tmpstr: string;
begin
  x := AnsiPos(puntero, datos);
  y := AnsiPos(punteroFin, datos);
  tmpstr := Copy(datos, x + 5, y - x - 5);
  result := tmpstr;
end;

procedure TDMPresupuesto.DataModuleCreate(Sender: TObject);
begin
  FLineasNecesitanRecalculo := True;
  QTotalPresupuesto := TUniQuery.Create(Self);
  QTotalPresupuesto.Connection := DModule_1.con2;
end;

procedure TDMPresupuesto.DataModuleDestroy(Sender: TObject);
begin
  FreeAndNil(QTotalPresupuesto);
end;

function TDMPresupuesto.CreaNuevoRango(datos: string; nPeriodos: Integer):
  string;
var
  x: Integer;
  y: Integer;
  hojaRango: string;
  primeraCelda: string;
  rowInicio, rowFinal: Integer;
  ultimaCelda: string;
  tmpstr: string;
  p1: string;
begin
  y := cuentaCaracteres(datos, '$');
  if y = 4 then
  begin
    x := AnsiPos('!', datos);
    hojaRango := Copy(datos, 0, x);
    datos := Copy(datos, x + 1, Length(datos));
    x := AnsiPos(':', datos);

    primeraCelda := Copy(datos, 0, x - 1);
    datos := Copy(datos, x + 1, Length(datos));
    tmpstr := ReverseString(primeraCelda);
    x := AnsiPos('$', tmpstr);
    tmpstr := Copy(tmpstr, 0, x - 1);
    tmpstr := ReverseString(tmpstr);
    rowInicio := StrToInt(tmpstr);
    rowFinal := rowInicio + nPeriodos;

    x := AnsiPos('<', datos);
    ultimaCelda := Copy(datos, 0, x - 1);
    tmpstr := ReverseString(ultimaCelda);
    x := AnsiPos('$', tmpstr);
    p1 := Copy(tmpstr, x, Length(tmpstr));
    p1 := ReverseString(p1);
    ultimaCelda := p1 + IntToStr(rowFinal);

    result := hojaRango + primeraCelda + ':' + ultimaCelda + punteroFin;
  end;
end;

procedure TDMPresupuesto.AjustaSeries(Filename: string; nPeriodos: Integer);
var
  zipExcel: string;
  DirectorioTrabajo: string;
  ZipFile: TZipFile;
  ficheroCharts: TStringList;
  rangosChart: array of string;
  tmpstr: string;
  x, y: Integer;
  salir: Boolean;
  textoEnviar: string;
begin
  try
    zipExcel := ChangeFileExt(Filename, '.zip');
    zipExcel := ExtractFileName(zipExcel);
    DirectorioTrabajo := rutaApp + 'tmpexcel\';
    if DirectoryExists(DirectorioTrabajo) then
    begin
      TDirectory.Delete(DirectorioTrabajo, True)
    end;
    CreateDir(DirectorioTrabajo);
    System.IOUtils.TFile.Copy(Filename, DirectorioTrabajo + zipExcel);
    if FileExists(DirectorioTrabajo + zipExcel) then
    begin
      ZipFile := TZipFile.Create;
      try
        ZipFile.Open(DirectorioTrabajo + zipExcel, zmRead);
        ZipFile.ExtractAll(DirectorioTrabajo);
      finally
        ZipFile.free;
      end;
      DeleteFile(PWideChar(DirectorioTrabajo + zipExcel));
      ficheroCharts := TStringList.Create;
      if FileExists(DirectorioTrabajo + '\xl\charts\chart1.xml') then
      begin
        ficheroCharts.LoadFromFile(DirectorioTrabajo + '\xl\charts\chart1.xml');
        salir := False;
        x := 0;
        y := 0;
        textoEnviar := ficheroCharts.text;
        while not salir do
        begin
          textoEnviar := Copy(textoEnviar, x, Length(textoEnviar));
          tmpstr := daRangoCharts(textoEnviar);
          if tmpstr = '' then
            salir := True
          else
          begin
            SetLength(rangosChart, y + 1);
            rangosChart[y] := puntero + tmpstr + punteroFin;
            x := AnsiPos(rangosChart[y], textoEnviar);
            x := x + Length(rangosChart[y]);
            Inc(y);
          end;
        end;
        for x := 0 to Length(rangosChart) - 1 do
        begin
          tmpstr := rangosChart[x];
          tmpstr := CreaNuevoRango(tmpstr, nPeriodos);
          ficheroCharts.text := ReplaceStr(ficheroCharts.text, rangosChart[x],
            tmpstr);
        end;
        ficheroCharts.SaveToFile(DirectorioTrabajo + '\xl\charts\chart1.xml');
      end;
      ZipDirectory2Excel(DirectorioTrabajo, Filename);
    end;
  finally
    TDirectory.Delete(DirectorioTrabajo, True);
  end;
end;

procedure TDMPresupuesto.AplicarFormatoMoneda;
var
  Decs: Integer;
  Mascara: string;
begin
  if not QTPresupuestosItems.Active then
    Exit;

  // Leer decimales de moneda (si viene en el select)
  if QTPresupuestosItems.FindField('ndecimalesMoneda') <> nil then
    Decs := QTPresupuestosItems.FieldByName('ndecimalesMoneda').AsInteger
  else
    Decs := 2;

  Mascara := '0.' + StringOfChar('0', Decs);
end;

procedure TDMPresupuesto.ZipDirectory2Excel(const SourceDir, ZipFileName:
  string);
var
  Zip: TZipFile;
  Files: TStringDynArray;
  Filename: string;
  RelativePath: string;
  FileaZip: string;
begin
  Zip := TZipFile.Create;
  try
    Zip.Open(ZipFileName, zmWrite);
    Files := TDirectory.GetFiles(SourceDir, '*.*',
      TSearchOption.soAllDirectories);
    for Filename in Files do
    begin
      RelativePath := getRelativePath(SourceDir, Filename);
      FileaZip := ExtractFileName(Filename);
      FileaZip := RelativePath + FileaZip;

      Zip.Add(Filename, FileaZip);
    end;
  finally
    Zip.free;
  end;
end;

procedure TDMPresupuesto.EncabezadoGrid;
begin
  frmMain.grid_presupuestos.cells[0, 0] := 'Cod. EDT';
  frmMain.grid_presupuestos.cells[1, 0] := 'Cod. Items';
  frmMain.grid_presupuestos.cells[2, 0] := 'Cod. APU';
  frmMain.grid_presupuestos.cells[3, 0] := 'Descripción';
  frmMain.grid_presupuestos.cells[4, 0] := 'Unidad';
  frmMain.grid_presupuestos.cells[5, 0] := 'Cantidad';
  frmMain.grid_presupuestos.cells[6, 0] := 'P. Unitario';
  frmMain.grid_presupuestos.cells[7, 0] := 'P. Total';
  frmMain.grid_presupuestos.cells[8, 0] := 'Notas';
  frmMain.grid_presupuestos.Columns[0].Width := 60;
  frmMain.grid_presupuestos.Columns[1].Width := 70;
  frmMain.grid_presupuestos.Columns[2].Width := 100;
  frmMain.grid_presupuestos.Columns[3].Width := 300;
  frmMain.grid_presupuestos.Columns[4].Width := 60;
  frmMain.grid_presupuestos.Columns[5].Width := 60;
  frmMain.grid_presupuestos.Columns[6].Width := 100;
  frmMain.grid_presupuestos.Columns[7].Width := 100;
  frmMain.grid_presupuestos.Columns[8].Width := 60;
end;

procedure TDMPresupuesto.activaDataSet(indice: Integer);
begin
  dsTpresupuestosItems.DataSet.Active := False;
  dsPareto.DataSet.Active := False;
  dsPCapitulo.DataSet.Active := False;
  case indice of
    1:
      dsTpresupuestosItems.DataSet.Active := True;
    2:
      dsPareto.DataSet.Active := True;
    3:
      dsPCapitulo.DataSet.Active := True;
  end;
end;

procedure TDMPresupuesto.addAPUdb;
var
  Arow: Integer;
  existeAPU: Integer;
  posgrid: Integer;
  idActual: Integer;
  codEdt, codItem: string;
  newCodItem: string;
  QcompruebaItemEnEDT: TUniQuery;
  QaddLineaPresupuesto: TUniQuery;
  QReordenaCodItems: TUniQuery;
  QRecalcular: TUniQuery;
  StartedHere: Boolean;
begin
  Arow := frmMain.grid_presupuestos.Selection.StartRow;
  if Arow < 1 then
    Arow := 1;

  QcompruebaItemEnEDT := TUniQuery.Create(nil);
  QaddLineaPresupuesto := TUniQuery.Create(nil);
  QReordenaCodItems := TUniQuery.Create(nil);
  QRecalcular := TUniQuery.Create(nil);

  StartedHere := not DModule_1.con2.InTransaction;

  if StartedHere then
    DModule_1.con2.StartTransaction;

  BeginBatch;

  try
    FLineasNecesitanRecalculo := True;

    with dsTpresupuestosItems.DataSet do
    begin
      DisableControls;
      try

        if State in dsEditModes then
          Post;

        First;
        MoveBy(Arow - 1);

        posgrid := FieldByName('posgrid').AsInteger;
        idActual := FieldByName('id').AsInteger;
        codEdt := FieldByName('codEdt').AsString;
        codItem := FieldByName('codItems').AsString;

        if codEdt <> '' then
          newCodItem := codEdt + '.1'
        else
          newCodItem := daNewCodITem(codItem);

        { comprobar duplicado }

        QcompruebaItemEnEDT.Connection := DModule_1.con2;
        QcompruebaItemEnEDT.SQL.Text :=
          'CALL Presupuestos_apusRepetido(:iCodAPU,:iCodBase,:iCodPresupuesto,:iRevision,:cPosGrid)';

        QcompruebaItemEnEDT.ParamByName('iCodAPU').AsString :=
          QAPUScodapu.AsString;
        QcompruebaItemEnEDT.ParamByName('iCodBase').AsString :=
          base_activa.codBase;
        QcompruebaItemEnEDT.ParamByName('iCodPresupuesto').AsString :=
          codProyecto;
        QcompruebaItemEnEDT.ParamByName('iRevision').AsString := revision;
        QcompruebaItemEnEDT.ParamByName('cPosGrid').AsInteger := posgrid;

        QcompruebaItemEnEDT.Open;

        existeAPU := QcompruebaItemEnEDT.FieldByName('result').AsInteger;

        if existeAPU = 0 then
        begin

          QaddLineaPresupuesto.Connection := DModule_1.con2;
          QaddLineaPresupuesto.SQL.Text :=
            'CALL Presupuestos_addItem(:iCodBase,:iCodPresupuesto,:iRevision,' +
            ':iCodAPU,:iCodAPUGenerico,:cantidad,:idAnterior,:newCodItems,:cPosgrid)';

          QaddLineaPresupuesto.ParamByName('iCodBase').AsString :=
            base_activa.codBase;
          QaddLineaPresupuesto.ParamByName('iCodPresupuesto').AsString :=
            codProyecto;
          QaddLineaPresupuesto.ParamByName('iRevision').AsString := revision;
          QaddLineaPresupuesto.ParamByName('iCodAPU').AsString :=
            QAPUScodapu.AsString;
          QaddLineaPresupuesto.ParamByName('iCodAPUGenerico').AsString :=
            QAPUSCodGenerico.AsString;
          QaddLineaPresupuesto.ParamByName('cantidad').AsFloat := 1;
          QaddLineaPresupuesto.ParamByName('idAnterior').AsInteger := idActual;
          QaddLineaPresupuesto.ParamByName('newCodItems').AsString :=
            newCodItem;
          QaddLineaPresupuesto.ParamByName('cPosgrid').AsInteger := posgrid + 1;

          QaddLineaPresupuesto.ExecSQL;

          { reordenar }

          QReordenaCodItems.Connection := DModule_1.con2;
          QReordenaCodItems.SQL.Text :=
            'CALL Presupuestos_ReajustaCodItems2(:iCodBase,:icodPresupuesto,:iRevision)';

          QReordenaCodItems.ParamByName('iCodBase').AsString :=
            base_activa.codBase;
          QReordenaCodItems.ParamByName('icodPresupuesto').AsString :=
            codProyecto;
          QReordenaCodItems.ParamByName('iRevision').AsString := revision;

          QReordenaCodItems.ExecSQL;

          { recalculo }

          QRecalcular.Connection := DModule_1.con2;
          QRecalcular.SQL.Text :=
            'CALL Presupuesto_RecalcularLineas(:b,:p,:r)';

          QRecalcular.ParamByName('b').AsString := base_activa.codBase;
          QRecalcular.ParamByName('p').AsString := codProyecto;
          QRecalcular.ParamByName('r').AsString := revision;

          QRecalcular.ExecSQL;

        end;

      finally
        EnableControls;
      end;
    end;

    if StartedHere then
      DModule_1.con2.Commit;

  except
    if StartedHere and DModule_1.con2.InTransaction then
      DModule_1.con2.Rollback;
    raise;
  end;

  EndBatch;

  QcompruebaItemEnEDT.Free;
  QaddLineaPresupuesto.Free;
  QReordenaCodItems.Free;
  QRecalcular.Free;

end;

function TDMPresupuesto.daNewCodITem(codItem: string): string;
var
  i, j: Integer;
  parte1: string;
begin
  parte1 := AnsiReverseString(codItem);
  i := AnsiPos('.', parte1);
  j := StrToInt(Copy(parte1, 1, i - 1));
  parte1 := Copy(parte1, i, Length(parte1));
  Inc(j);
  parte1 := IntToStr(j) + parte1;
  result := AnsiReverseString(parte1);
end;

procedure TDMPresupuesto.activar_presupuesto;
begin
  with QTPresupuestosItems do
  begin
    Close;
    ParamByName('icodBase').AsString := base_activa.codBase;
    ParamByName('iCodPresupuesto').AsString := codProyecto;
    ParamByName('iRevision').AsString := revision;
    Open;

  end;

  FLineasNecesitanRecalculo := True;
  calculaTotal;
end;

procedure TDMPresupuesto.calculaTotal;
var
  t: Double;
  c: Integer;
  porcientoIVA: Double;
  cantidadIVA: Double;
  totalPresupuesto: Double;
  nApus: Integer;
  nItems: Integer;
  PReferencial: Double;
  DReferencial: Double;
  porcentajeReferencial: Double;
begin
  if FCalculoSuspendido > 0 then
    Exit;

  { =========================================
    1. Recalcular SOLO si es necesario
    ========================================= }
  if FLineasNecesitanRecalculo then
  begin
    with QTotalPresupuesto do
    begin
      Close;
      SQL.Text := 'CALL Presupuesto_RecalcularLineas(:b,:p,:r)';
      ParamByName('b').AsString := base_activa.codBase;
      ParamByName('p').AsString := codProyecto;
      ParamByName('r').AsString := revision;
      Execute;
    end;

    FLineasNecesitanRecalculo := False;
  end;

  { =========================================
    2. Obtener total determinista desde DB
    ========================================= }
  with QTotalPresupuesto do
  begin
    Close;
    SQL.Text :=
      'CALL Presupuestos_DaTotalPresupuesto(' +
      ' :icodBase, :icodPresupuesto, :irevision,' +
      ' @t, @r, @ni, @na)';

    ParamByName('icodBase').AsString := base_activa.codBase;
    ParamByName('icodPresupuesto').AsString := codProyecto;
    ParamByName('irevision').AsString := revision;

    Execute;

    Close;
    SQL.Text := 'SELECT @t t, @r r, @ni ni, @na na';
    Open;

    t := FieldByName('t').AsFloat;
    c := FieldByName('r').AsInteger;
    nItems := FieldByName('ni').AsInteger;
    nApus := FieldByName('na').AsInteger;
  end;

  { =========================================
    3. SOLO IVA y métricas UI
    ========================================= }

  frmMain.grid_presupuestos.RowCount := c + 2;
  frmMain.lbl_SubtotalPresupuesto.Text := FormatFloat(cadenaCurrency, t);

  porcientoIVA := StrToFloatDef(
    decimal_correcto(frmMain.edt_porcentajeIVANuevoPresupuesto.Text), 15);

  cantidadIVA := Porcentaje(t, porcientoIVA);
  t := RoundTo(t, -2); // redondear subtotal primero

  cantidadIVA := RoundTo((t * porcientoIVA) / 100, -2);

  totalPresupuesto := RoundTo(t + cantidadIVA, -2);
  frmMain.lbl_CantIVAPresupuestos.Text :=
    FormatFloat(cadenaCurrency, cantidadIVA);

  totalPresupuesto := t + cantidadIVA;
  frmMain.lbl_TotalIVAPresupuestos.Text :=
    FormatFloat(cadenaCurrency, totalPresupuesto);

  frmMain.lbl_PresupuestoNLineas.Text := IntToStr(nItems);
  frmMain.lbl_PresupuestoNItems.Text := IntToStr(nApus);

  PReferencial :=
    StrToFloatDef(frmMain.edt_NPresupuestoPrecioReferencia.Text, 0);

  DReferencial := t - PReferencial;

  frmMain.lbl_PresupuestoDiferencia.Text :=
    FormatFloat(cadenaCurrency, DReferencial);

  if PReferencial <> 0 then
    porcentajeReferencial := (DReferencial * 100) / PReferencial
  else
    porcentajeReferencial := -100;

  frmMain.lbl_PresupuestoDiferenciaPorcentaje.Text :=
    FormatFloat('0.00', porcentajeReferencial) + '%';

  refrescar_Presupuesto;
end;

procedure TDMPresupuesto.refrescar_Presupuesto;
begin
  EncabezadoGrid;
  QTpresupuestosItems.close;
  QTPresupuestosItems.Open;
  QTPresupuestosItems.Active := True;
  dsTpresupuestosItems.Enabled := True;
  frmMain.dbGridConnect_TPresupuestosItems.Active := True;
  QTPresupuestosItems.refresh;
  ajustaColor;
end;

procedure TDMPresupuesto.guardaNodosEDT();
var
  qry: TUniQuery;
  sqlText: string;
  nodo: TTMSFnctreeviewnode;
begin
  if frmMain.Trvw_EDT.Nodes.Count - 1 < 1 then
    exit;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      // Borra datos Anteriores
      close;
      sql.Clear;
      sqlText :=
        'delete from presupuestos_edt where codbase=:codBase and codPresupuesto=:codPresupuesto and Revision=:Revision';
      sql.Add(sqlText);
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      // Genera nueva EDT
      close;
      sql.Clear;
      sqlText :=
        'insert into presupuestos_edt (codBase, codPresupuesto, revision, codEDT, Descripcion, Responsable, definicion, codUnicoItemPresupuesto) ';
      sqlText := sqlText +
        ' VALUES (:codBase, :codPresupuesto, :revision, :codEDT, :Descripcion, :Responsable, :definicion, :codUnicoItemPresupuesto)';
      sql.Add(sqlText);
      nodo := frmMain.Trvw_EDT.Nodes[0];
      while Assigned(nodo) do
      begin
        if nodo.text[0] <> '' then
        begin
          ParamByName('codBase').AsString := base_activa.codBase;
          ParamByName('codPresupuesto').AsString := codProyecto;
          ParamByName('revision').AsString := revision;
          ParamByName('codEdt').AsString := nodo.text[0];
          ParamByName('descripcion').AsString := nodo.text[1];
          ParamByName('responsable').AsString := nodo.text[2];
          ParamByName('definicion').AsString := nodo.text[3];
          ParamByName('codUnicoItemPresupuesto').AsString := nodo.text[4];
          Prepare;
          ExecSQL;
        end;
        nodo := nodo.GetNext;
      end;
    end;
  finally
    qry.free;
  end;
end;

procedure TDMPresupuesto.sincronizaEdt2Presupuesto;
var
  qry: TUniQuery;
begin
  BeginBatch;
  try
    FLineasNecesitanRecalculo := True;

    qry := TUniQuery.Create(nil);
    try
      guardaNodosEDT();

      qry.Connection := DModule_1.con2;
      qry.SQL.Text :=
        'CALL EDT_SincronizaEDTPresupuesto(:iCodBase,:iCodPresupuesto,:iRevision)';

      qry.ParamByName('iCodBase').AsString := base_activa.codBase;
      qry.ParamByName('iCodPresupuesto').AsString := codProyecto;
      qry.ParamByName('iRevision').AsString := revision;
      qry.Execute;

      if proyectoNuevo then
      begin
        QCopiarEDTInicio.ParamByName('CodBase').AsString := base_activa.codBase;
        QCopiarEDTInicio.ParamByName('CodPresupuesto').AsString := codProyecto;
        QCopiarEDTInicio.ParamByName('Revision').AsString := revision;
        QCopiarEDTInicio.Execute;
      end;

    finally
      qry.Free;
    end;

  finally
    EndBatch;
  end;
end;

end.

