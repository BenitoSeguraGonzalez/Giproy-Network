unit DMExportDB;

interface

uses
  System.SysUtils, System.Classes, Winapi.Windows, UniProvider, MySQLUniProvider, Data.DB, DBAccess,
  Uni, UniDump, DADump, CryptBase, FMX.TMSFNCTypes, FMX.TMSFNCUtils, System.IoUtils, SalsaObj,
  RSAObj, HashObj, X509Obj, IdFTPCommon, System.StrUtils, XAdESObj, AdESObj, CAdESObj, PAdESObj,
  X509Values, AESObj, SPECKObj, MiscObj, IdBaseComponent, IdComponent, IdTCPConnection, IdTCPClient,
  IdExplicitTLSClientServerBase, IdFTP, IdIOHandler, IdIOHandlerSocket, IdIOHandlerStack, IdSSL,
  IdSSLOpenSSL, MemDS, System.Net.HttpClient, System.NetEncoding, System.Net.URLClient, System.JSON,
  System.Net.HttpClientComponent, System.Math, System.Rtti, System.Types, FMX.Types, FMX.Controls,
  FMX.Layouts, FMX.Media;

  const
  {/*}
    TXTSql_apus =
      'SELECT ' +
      '  codBase, codCategoriaAPU, codRecursoAPU, CategoriaAPU, ' +
      '  CodAPU, codAPUAlternativo, Descripcion, Unidad, Rendimiento, ' +
      '  RendimientoTodoAnalisis, RendimientoTodoEscenario, CostoDirectoTotal, ' +
      '  CostoIndirectoTotal, PorcentajeCostoIndirecto, PrecioUnitarioTotal, moneda, ' +
      '  codCPC, FechaHoraCreacion, ultimaModificacion, pendienteRevision, ' +
      '  rendimientoHUnidad, nhCuadrillas, anidado ' +
      'FROM apus';

    TXTSql_apus_items =
      'SELECT ' +
      '  codBase, CodAPU, codAPUAlternativo, CodCategoria, codSubCategoria, ' +
      '  idUnicoRecurso, codRecurso, codRecursoCompleto, Descripcion, Unidad, ' +
      '  Precio, moneda, CantidadUnidad, Rendimiento, Total, porcentaje, ' +
      '  codCPC, TipoCPC, porcentajeCPC, termino ' +
      'FROM apus_items';

    TXTSql_bases =
      'SELECT ' +
      '  codBase, nombre, descripcion, indirectos, TRendimiento, UTiempo, ' +
      '  SeguridadIndustrial, Observaciones, FechaHoraCreacion, FechaHoraModificacion, ' +
      '  pais, cambioAplicado, sincronizada, moneda, simboloMoneda, basesPadres, ' +
      '  presupuestoAsignado ' +
      'FROM bases';

    TXTSql_categoriaapus =
      'SELECT ' +
      '  codBase, Categoria_base, Ciu, NombreBase, Descripcion, CodExterno, ' +
      '  Comentarios, Usado, sincronizada, origen, fechaCreacion ' +
      'FROM categoriaapus';

    TXTSql_catIndirectos =
      'SELECT codigo, Descripcion ' +
      'FROM catindirectos';

    TXTSql_codcpc =
      'SELECT codCPC, Descripcion, Tipo, Porcentaje ' +
      'FROM codcpc';

    TXTSql_conceptosindirectos =
      'SELECT codPadre, CodigoCuenta, fijo, usuario ' +
      'FROM conceptosindirectos';

    TXTSql_configuracion =
      'SELECT ' +
      '  Nombre, Apellidos, usuario, password, id_usuario, fechaAlta, estado, tipo, ' +
      '  fechaInicioInscripcion, fechaFinInscripcion, direccion, ciudad, provincia, Pais, ' +
      '  Email, Tfno, PresupuestoValor1, PresupuestoValor2, PresupuestoValor3, ' +
      '  codUltPresupuesto ' +
      'FROM configuracion';

    TXTSql_currency =
      'SELECT CurrencyISO, Language, CurrencyName, Money, Symbol ' +
      'FROM currency';

    TXTSql_empresas =
      'SELECT ' +
      '  codUnico, idFiscal, Nombre, direccion, localidad, provincia, email, tfno, ' +
      '  fechaCreacion, fechaModificacion ' +
      'FROM empresas';

    TXTSql_empresas_config =
      'SELECT ' +
      '  CodUnico, idFiscal, nDecimales, nDecimalesMoneda, autoguardado, tAutoguardado, ' +
      '  RConstitucionProyecto, RAnalisisPrecios, RCronogramaTrabajo, RCronogramaValorado, ' +
      '  RDesagregacionTecnologica, RDesagregacionTecnologicaAPUS, REDTDiccionario, ' +
      '  REDTListado, REDTValorada, REquipoProyecto, RDescomposicionOrganizacion, ' +
      '  RFormulaPolinomicas, RGestionTiempos, RPorcentajeIndirectos, RPresupuestos, ' +
      '  RCurvaS, LogoEmpresa ' +
      'FROM empresas_config';

    TXTSql_graficos =
      'SELECT id_grafico, descripcion, imagen ' +
      'FROM graficos';

    TXTSql_indicesprecios =
      'SELECT CodIndice, Descripcion, categoria ' +
      'FROM indicesprecios';

    TXTSql_indicesvalor =
      'SELECT codIndice, mesAnio, Valor ' +
      'FROM indicesvalor';

    TXTSql_monedaspaises =
      'SELECT CodMoneda, Moneda, Pais, Simbolo ' +
      'FROM monedaspaises';

    TXTSql_paises =
      'SELECT ' +
      '  Code, Name, Continent, Region, SurfaceArea, IndepYear, Population, ' +
      '  LifeExpectancy, GNP, GNPOld, LocalName, GovernmentForm, HeadOfState, ' +
      '  Capital, Code2, prefijo, Nombre_Pais, codMoneda, Moneda ' +
      'FROM paises';

    TXTSql_parametros =
      'SELECT idParametros, Descripcion, Valor ' +
      'FROM parametros';

    TXTSql_plantillas =
      'SELECT categoria, modelo, plantilla, descripcion, SSO ' +
      'FROM plantillas';

    TXTSql_presupuestos_anotaciones =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, idItem, fecha, codEDT, paquete, descripcion, ' +
      '  nota, autor, notaReferencia, tipoNota ' +
      'FROM presupuestos_anotaciones';

    TXTSql_presupuestos_anotacionesp2 =
      'SELECT codBase, codPresupuesto, revision, DatosAnotaciones ' +
      'FROM presupuestos_anotacionesp2';

    TXTSql_asignacionterminios =
      'SELECT codBase, revision, codPresupuesto, asignacion, descripcion ' +
      'FROM presupuestos_asignacionterminos';

    TXTSql_configreportes =
      'SELECT ' +
      '  CodPresupuesto, revision, RConstitucionProyecto, RAnalisisPrecios, ' +
      '  RCronogramaTrabajo, RCronogramaValorado, RDesagregacionTecnologica, ' +
      '  RDesagregacionTecnologicaAPUS, REDTDiccionario, REDTListado, REDTValorada, ' +
      '  REquipoProyecto, RDescomposicionOrganizacion, RFormulaPolinomicas, RGestionTiempos, ' +
      '  RPorcentajeIndirectos, RPresupuestos, RCurvaS ' +
      'FROM presupuestos_configreportes';

    TXTSql_cronogramas =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, codUnicoItems, tipoPeriodo, Periodos, ' +
      '  tipoDerivacion, Derivacion ' +
      'FROM presupuestos_cronogramas';

    TXTSql_datosgenerales =
      'SELECT ' +
      '  codBase, codPresupuesto, codReferencial, revision, descripcion, subtotal, iva, ' +
      '  indirectos, total, fechaCreacion, fechaModificacion, ndecimales, ndecimalesMoneda, ' +
      '  porcentajeIVA, activo ' +
      'FROM presupuestos_datosgenerales';

    TXTSql_datosproyecto =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, codReferencial, Descripcion, TipoProyecto, ' +
      '  Categoria, TipoConstruccion, AmbitoContratacion, TipoContrato, fechaInicio, ' +
      '  PlazoEjecucion, fechaFinalizacion, Direccion, Ciudad, provincia, pais, ' +
      '  ObjetoContrato, validezPropuesta, Foto1, Foto2, fechaHoraCreacion, UltModificacion, ' +
      '  latitud, longitud, ATerreno, AConstruccion ' +
      'FROM presupuestos_datosproyecto';

    TXTSql_desagregacion =
      'SELECT codBase, revision, codPresupuesto, datosEDO, tipo ' +
      'FROM presupuestos_desagregacion';

    TXTSql_edo =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, idGRid, RolProyecto, idStake, Responsable, ' +
      '  idUnico, nodeLevel, ActividadClave ' +
      'FROM presupuestos_edo';

    TXTSql_edo_datos =
      'SELECT ' +
      '  codbase, codPresupuesto, revision, codHito, rolProyecto, idStake, responsable, ' +
      '  idUnico, actividadClave ' +
      'FROM presupuestos_edo_datos';

    TXTSql_edo_hitos =
      'SELECT ' +
      '  codbase, codPresupuesto, revision, codhito, descripcion, codHitoBase, nodolevel ' +
      'FROM presupuestos_edo_hitos';

    TXTSql_presupuestos_edt =
      'SELECT ' +
      '  codBase, codPresupuesto, Revision, CodEDT, Descripcion, Responsable, Definicion, ' +
      '  puntero, codUnicoItemPresupuesto ' +
      'FROM presupuestos_edt';

    TXTSql_presupuestos_fpolcuadrillas =
      'SELECT ' +
      '  codBase, codPresupuesto, Revision, codIndice, Indice, Descripcion, SalarioMinimo, ' +
      '  SHR, Trabajo, Coeficiente, CostoDirecto ' +
      'FROM presupuestos_fpolcuadrillas';

    TXTSql_presupuestos_fpolinomica =
      'SELECT codBase, codPresupuesto, revision, datosEDO, tipo ' +
      'FROM presupuestos_fpolinomica';

    TXTSql_presupuestos_indicesseleccionados =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, codIndice, descripcion, termino ' +
      'FROM presupuestos_indicesseleccionados';

    TXTSql_presupuestos_indirectos =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, cuenta, codCuenta, observaciones, valor ' +
      'FROM presupuestos_indirectos';

    TXTSql_presupuestos_items =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, codEdt, codItems, codUnicoItems, codAPUGenerico, ' +
      '  codAPU, descripcion, unidad, cantidad, PUnitario, Ptotal, notas, rendimientoHUnidad, ' +
      '  nhCuadrillas, anidado, posgrid ' +
      'FROM presupuestos_items';

    TXTSql_presupuestos_items_trabajo =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, codEdt, codItems, codUnicoItems, codAPUGenerico, ' +
      '  codAPU, descripcion, unidad, cantidad, PUnitario, Ptotal, notas, rendimientoHUnidad, ' +
      '  nhCuadrillas, anidado, posgrid ' +
      'FROM presupuestos_items_trabajo';

    TXTSql_presupuestos_items_trabajo_edt =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, codEdt, codItems, codUnicoItems, codAPUGenerico, ' +
      '  codAPU, descripcion, unidad, cantidad, PUnitario, Ptotal, notas, rendimientoHUnidad, ' +
      '  nhCuadrillas, anidado, posgrid ' +
      'FROM presupuestos_items_trabajo_edt';

    TXTSql_presupuestos_movimientoshistorico =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, TipoMovimiento, codAPU, posInicio, cantidad, posFin, ' +
      '  Fmovimiento, idUsuario, activo ' +
      'FROM presupuestos_movimientoshistorico';

    TXTSql_presupuestos_notas =
      'SELECT codBase, codPresupuesto, Revision, codAPU, codUnicoItems, fechahora, notas ' +
      'FROM presupuestos_notas';

    TXTSql_presupuestos_notasrevision =
      'SELECT codBase, codPresupuesto, revision, Seccion, Nota, FechaHora ' +
      'FROM presupuestos_notasrevision';

    TXTSql_presupuestos_recursos =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, CodAPU, CodCategoria, codSubCategoria, idUnicoRecurso, ' +
      '  codRecurso, codRecursoCompleto, Descripcion, Unidad, Precio, moneda, CantidadUnidad, ' +
      '  Rendimiento, Total, porcentaje, codCPC, TipoCPC, porcentajeCPC, termino ' +
      'FROM presupuestos_recursos';

    TXTSql_presupuestos_stakeholders =
      'SELECT ' +
      '  idGrid, codBase, codPresupuesto, revision, rolPresupuesto, idFiscal, nombre, apellidos, ' +
      '  email, titulacion, idUnico ' +
      'FROM presupuestos_stakeholders';

    TXTSql_presupuestos_tanteo_apus =
      'SELECT codUnicoTanteo, codBase, codPresupuesto, revision, CodAPU, CostoDirectoTotal, ultimaModificacion ' +
      'FROM presupuestos_tanteo_apus';

    TXTSql_presupuestos_tanteo_apus_bkp =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, CodAPU, CostoDirectoTotal, ultimaModificacion, codUnicoTanteo ' +
      'FROM presupuestos_tanteo_apus_bkp';

    TXTSql_presupuestos_tanteo_recursos =
      'SELECT ' +
      '  codUnicoTanteo, codBase, codPresupuesto, revision, CodAPU, descripcion, idUnicoRecurso, ' +
      '  Precio, CantidadUnidad, Rendimiento, Total ' +
      'FROM presupuestos_tanteo_recursos';

    TXTSql_presupuestos_tanteo_recursos_bkp =
      'SELECT ' +
      '  codUnicoTanteo, codBase, codPresupuesto, revision, CodAPU, descripcion, idUnicoRecurso, ' +
      '  Precio, CantidadUnidad, Rendimiento, Total ' +
      'FROM presupuestos_tanteo_recursos_bkp';

    TXTSql_recursos =
      'SELECT ' +
      '  idUnico, codBase, codRecurso, codRecursoCompleto, codCategoriaBase, codSubCategoria, ' +
      '  Descripcion, unidad, precio, preciolocal, precioBase, moneda, termino, codAlternativo, ' +
      '  CodCPC, tipoCPC, porcentajeCPC, Especificaciones, Especificaciones2, fechahoraCreacion, ' +
      '  ultimaModificacion, codDistribuidor, Distribuidor ' +
      'FROM recursos';

    TXTSql_rolesstakes =
      'SELECT descripcion ' +
      'FROM rolesstakes';

    TXTSql_tanotaciones =
      'SELECT idItem, fecha, codEdt, paquete, descripcion, nota, autor, notaReferencia, tiponota ' +
      'FROM tanotaciones';

    TXTSql_tgrid2items =
      'SELECT codTempProyecto, codEDT, codUnicoItem, Valor ' +
      'FROM tgrid2items';

    TXTSql_tgridItems =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, codEdt, codItems, codUnicoItems, codAPUGenerico, codAPU, ' +
      '  descripcion, unidad, cantidad, PUnitario, Ptotal, notas, rendimientoHUnidad, nhCuadrillas, ' +
      '  anidado, posgrid ' +
      'FROM tgriditems';

    TXTSql_tgriditems_edt =
      'SELECT ' +
      '  codBase, codPresupuesto, revision, codEdt, codItems, codUnicoItems, codAPUGenerico, codAPU, ' +
      '  descripcion, unidad, cantidad, PUnitario, Ptotal, notas, rendimientoHUnidad, nhCuadrillas, ' +
      '  anidado, posgrid ' +
      'FROM tgriditems_edt';

    TXTSql_tpresupuesto =
      'SELECT `01`, `02`, `03`, `04`, `05`, `06`, `07`, `08`, `09`, `10`, `11` ' +
      'FROM tpresupuesto';

    TXTSql_tproyectos =
      'SELECT codigo, descripcion ' +
      'FROM tproyectos';

    TXTSql_tproyectositems =
      'SELECT codCategoriaBase, codigoItem, descripcion ' +
      'FROM tproyectositems';

    TXTSql_tvaloresedt =
      'SELECT EDT, Valor, codBase, codPresupuesto, revision ' +
      'FROM tvaloresedt';

    TXTSql_unidades =
      'SELECT descripcion, Subcategoria, fechaHora ' +
      'FROM unidades';

    TXTSql_usuario_comunicacion =
      'SELECT ' +
      '  idUsuarioEmisor, idUsuarioReceptor, emailReceptor, Receptor, idTipoComunicacion, ' +
      '  DatosComunicacion, fechahoraEmision, fechahoraRecepcion, idExterno ' +
      'FROM usuario_comunicacion';

    TXTSql_usuario_tipocomunicacion =
      'SELECT descripcion ' +
      'FROM usuario_tipocomunicacion';

    TXTSql_usuarios =
      'SELECT ' +
      '  Nombre, Apellidos, usuario, password, id_usuario, fechaAlta, estado, tipo, ' +
      '  fechaInicioInscripcion, fechaFinInscripcion, UltConexion, direccion, Ciudad, Provincia, ' +
      '  Pais, email, Tfno, configBase ' +
      'FROM usuarios';

    TXTSql_Colaboradores =
      'SELECT idUsuario, nombreColaborador, emailColaborador, estado, fechaHoraAlta ' +
      'FROM colaboradores';

    TXTSql_v_nuevabase =
      'SELECT ' +
      '  codBase, codCategoriaAPU, codRecursoAPU, CategoriaAPU, CodAPU, Descripcion, Unidad, ' +
      '  Rendimiento, RendimientoTodoAnalisis, RendimientoTodoEscenario, CostoDirectoTotal, ' +
      '  CostoIndirectoTotal, PorcentajeCostoIndirecto, PrecioUnitarioTotal, moneda, codCPC, ' +
      '  FechaHoraCreacion, ultimaModificacion, pendienteRevision, rendimientoHUnidad, nhCuadrillas, ' +
      '  anidado ' +
      'FROM v_nuevabase';

    TXTSql_StakeHolders =
      'SELECT ' +
      '  rolProyecto, idFiscal, Nombre, Apellidos, direccion, localidad, provincia, pais, telefono, ' +
      '  email, Titulacion, Institucion ' +
      'FROM stakeholders';
  {*)}

type
  TDM_exportDB = class(TDataModule)
    FTP_1: TIdFTP;
    idslhndlrscktpnsl1: TIdSSLIOHandlerSocketOpenSSL;
    QProyectosDisponibles: TUniQuery;
    QProyectosDisponiblescodbase: TStringField;
    QProyectosDisponiblescodpresupuesto: TStringField;
    QProyectosDisponiblesrevision: TStringField;
    QProyectosDisponiblesdescripcion_revision: TStringField;
    QBasesDisponibles: TUniQuery;
    QBasesDisponiblescodBase: TStringField;
    QBasesDisponiblesnombre: TStringField;
    QBasesDisponiblesdescripcion: TStringField;
  private
                { Private declarations }
  public
                { Public declarations }
  end;

var
  DM_exportDB: TDM_exportDB;

procedure BorrarLineasArchivo(const NombreArchivo, CadenaInicio: string);

procedure EnviaExportacionDB(usuarioEmisor, usuarioReceptor: Integer; comunicado: string;
  tipoComunicacion: Integer; adicional: string);

procedure CompactInsertSQLFile(FileName: string; BatchSize: Integer);

function Encripta_Envia(nombreDump: string; keysalsa: string): string;

function exportarBase(codBaseExportar: string): string;

function transfiereFTP(NombreArchivo: string): string;

function exportarProyecto(codbaseSel, codproyectoSel, revisionSel: string; anotaciones, notas,
  stakes: Boolean): string;

function preparaParaJoin(datos: string; tipo: Integer): string;

function MigrarGiProy(): string;

function TryGetVideoSizeFromPointer(const APtr: Pointer; out AWidth, AHeight: Integer): Boolean;

function TryGetVideoSizeFromMediaPlayer(const AMediaPlayer: TMediaPlayer; out AWidth, AHeight:
  Integer): Boolean;

function daExtensionURL(datos: string): string;

function JsonToCompactString(const AJson: TJSONObject): string;

implementation

{%CLASSGROUP 'FMX.Controls.TControl'}
{$R *.dfm}

uses
  DM1, uApiGiProy;

procedure CompactInsertSQLFile(FileName: string; BatchSize: Integer);
var
  OriginalFile, NewFile: TStringList;
  i, j: Integer;
  BaseSQL, CurrentTable: string;
  ValueBuffer: TStringList;
begin
  OriginalFile := TStringList.Create;
  NewFile := TStringList.Create;
  ValueBuffer := TStringList.Create;
  try
    OriginalFile.LoadFromFile(FileName);

    i := 0;
    while i < OriginalFile.Count do
    begin
                        // Buscar una línea INSERT
      if Pos('INSERT INTO', OriginalFile[i]) > 0 then
      begin
                                // Extraer la parte base "INSERT INTO tabla VALUES"
        BaseSQL := Copy(OriginalFile[i], 1, Pos('VALUES', OriginalFile[i]) + 5);
        CurrentTable := Copy(OriginalFile[i], Pos('INTO', OriginalFile[i]) + 5, Pos(' VALUES',
          OriginalFile[i]) - (Pos('INTO', OriginalFile[i]) + 5));

        ValueBuffer.Clear;
        j := 0;

                                // Agrupar las siguientes líneas de la misma tabla
        while (i < OriginalFile.Count) and (j < BatchSize) and (Pos('INSERT INTO ' + CurrentTable,
          OriginalFile[i]) > 0) do
        begin
                                        // Extraer solo los valores: (1, 'A')
          ValueBuffer.Add(Trim(Copy(OriginalFile[i], Pos('VALUES', OriginalFile[i]) + 6, MaxInt)).TrimRight
            ([';']));
          ValueBuffer[j] := ValueBuffer[j] + ',';
          Inc(i);
          Inc(j);
        end;
        ValueBuffer.Text := Copy(Trim(ValueBuffer.Text), 1, length(Trim(ValueBuffer.Text)) - 1);

                                // Escribir el nuevo INSERT multilínea
        NewFile.Add(BaseSQL);
                                // Unir todos los valores
        NewFile.Add('  ' + string.Join(',' + sLineBreak + '  ', [ValueBuffer.Text]).TrimRight);
        NewFile[NewFile.Count - 1] := NewFile[NewFile.Count - 1] + ';';
        NewFile.Add('');
      end
      else
      begin
                                // Copiar cualquier otra línea (CREATE TABLE, etc.)
        NewFile.Add(OriginalFile[i]);
        Inc(i);
      end;
    end;
                // Guardar el nuevo archivo optimizado, reemplazando el original
    NewFile.SaveToFile(FileName);
  finally
    OriginalFile.Free;
    NewFile.Free;
    ValueBuffer.Free;
  end;
end;

function daExtensionURL(datos: string): string;
var
  x: Integer;
begin
  datos := ReverseString(datos);
  x := AnsiPos('.', datos);
  datos := Copy(datos, 1, x - 1);
  datos := LowerCase(ReverseString(datos));
  result := datos;
end;

function TryGetVideoSizeFromMediaPlayer(const AMediaPlayer: TMediaPlayer; out AWidth, AHeight:
  Integer): Boolean;
var
  ctx: TRttiContext;
  rType: TRttiType;
  prop: TRttiProperty;
  val: TValue;
  pt: TPointF;
  sz: TSizeF;
  p: Pointer;
  nu: NativeUInt;
begin
  result := False;
  ctx := TRttiContext.Create;
  rType := ctx.GetType(AMediaPlayer.ClassType);
  if rType = nil then
    Exit;

  prop := rType.GetProperty('VideoSize');
  if prop = nil then
    Exit;

  val := prop.GetValue(AMediaPlayer);

        // Caso record TPointF
  if val.TryAsType<TPointF>(pt) then
  begin
    AWidth := Round(pt.x);
    AHeight := Round(pt.Y);
    Exit(True);
  end;

        // Caso record TSizeF (o similar)
  if val.TryAsType<TSizeF>(sz) then
  begin
    AWidth := Round(sz.Width);
    AHeight := Round(sz.Height);
    Exit(True);
  end;

        // Si es un valor ordinal que contiene la dirección
  if val.IsOrdinal then
  begin
    nu := val.AsOrdinal;
    if nu <> 0 then
    begin
      p := Pointer(nu);
      Exit(TryGetVideoSizeFromPointer(p, AWidth, AHeight));
    end
    else
      Exit(False);
  end;

        // Si se puede extraer directamente como Pointer
  if val.TryAsType<Pointer>(p) then
    Exit(TryGetVideoSizeFromPointer(p, AWidth, AHeight));

        // no reconocido
  result := False;
end;

function TryGetVideoSizeFromPointer(const APtr: Pointer; out AWidth, AHeight: Integer): Boolean;
var
  i1, i2: Integer;
  f1, f2: Single;
  p: Pointer;
begin
  result := False;
  p := APtr;
  if p = nil then
    Exit;

        // Intento 1: dos Integer consecutivos
  try
    i1 := PInteger(p)^;
    i2 := PInteger(PByte(p) + SizeOf(Integer))^;
    if (i1 > 0) and (i1 <= 10000) and (i2 > 0) and (i2 <= 10000) then
    begin
      AWidth := i1;
      AHeight := i2;
      Exit(True);
    end;
  except
  end;

        // Intento 2: dos Single consecutivos
  try
    f1 := PSingle(p)^;
    f2 := PSingle(PByte(p) + SizeOf(Single))^;
    if (f1 > 0) and (f1 <= 10000) and (f2 > 0) and (f2 <= 10000) then
    begin
      AWidth := Round(f1);
      AHeight := Round(f2);
      Exit(True);
    end;
  except
  end;
end;

// helper: si ya tienes un TJSONObject y quieres pasarlo a la proc original
function JsonToCompactString(const AJson: TJSONObject): string;
begin
  if AJson = nil then
    Exit('');
        // ToJSON ya devuelve sin espacios extra; si quieres aún más compacto:
  result := AJson.ToJSON;
        // Delphi 12.3 (alias de ToString en JSON moderno)
end;

procedure EnviaExportacionDB(usuarioEmisor, usuarioReceptor: Integer; comunicado: string;
  tipoComunicacion: Integer; adicional: string);
var
  LJsonResp: TJSONObject;
  Ok: Boolean;
begin
  LJsonResp := nil;
  try
    Ok := EnviarComunicacionAhora(UrlEnviaComunicacion, GlobalAuthToken, usuarioEmisor,
      usuarioReceptor, tipoComunicacion, comunicado, adicional, LJsonResp);

    if not Ok then
      raise EApiException.Create('ok=false al enviar comunicación', 500);

                // (opcional) leer datos de la respuesta:
    var idNuevo := LJsonResp.GetValue<Integer>('idInsertado', 0);

  finally
    LJsonResp.Free;
  end;
end;

function preparaParaJoin(datos: string; tipo: Integer): string;
var
  listadoIN, listadoOUT: TStringList;
  x, Y: Integer;
  entrarAlias: Boolean;
  tmpstr: string;
begin
  listadoIN := TStringList.Create;
  listadoOUT := TStringList.Create;
  try
    if tipo = 2 then
      datos := ReplaceStr(datos, 'SELECT', 'SELECT DISTINCT' + chr(13));
    datos := ReplaceStr(datos, 'FROM', chr(13) + ' FROM');
    datos := ReplaceStr(datos, ',', ',' + chr(13));
    listadoIN.Text := datos;
    entrarAlias := False;
    x := 0;
    while x < listadoIN.Count do
    begin
      tmpstr := listadoIN[x];
      if entrarAlias then
      begin
        Y := AnsiPos('FROM', tmpstr);
        if Y > 0 then
        begin
          tmpstr := tmpstr + ' tbl';
          entrarAlias := False;
        end
        else
          tmpstr := ' tbl.' + tmpstr.Trim;
      end
      else
      begin
        Y := AnsiPos('SELECT ', tmpstr);
        if Y > 0 then
          entrarAlias := True;
      end;
      listadoOUT.Add(tmpstr);
      Inc(x);
    end;
  finally
    result := ReplaceStr(listadoOUT.Text, chr(13) + chr(10), '');
    listadoOUT.Free;
    listadoIN.Free;
  end;
end;

procedure BorrarLineasArchivo(const NombreArchivo, CadenaInicio: string);
var
  sl: TStringList;
  i: Integer;
begin
  sl := TStringList.Create;
  try
    sl.LoadFromFile(NombreArchivo, TEncoding.ANSI);
    for i := sl.Count - 1 downto 0 do
      if sl[i].StartsWith(CadenaInicio) then
        sl.Delete(i);
    sl.SaveToFile(NombreArchivo, TEncoding.ANSI);
  finally
    sl.Free;
  end;
end;

function MigrarGiProy(): string;
var
  dump: TUniDump;
  nombreDump: string;
  fs: TFileStream;
begin
  dump := TUniDump.Create(nil);
  try
    try
      nombreDump := 'Dump_' + IntToStr(codigo_usuario) + '_' + FormatDateTime('yyyymmddhhnnss', now);
      nombreDump := rutaApp + nombreDump + '.sql';
      fs := TFileStream.Create(nombreDump, fmCreate);
      fs.Free;
      dump.Connection := DModule_1.con2;
      dump.SpecificOptions.Values['UseExtSyntax'] := 'False';
                        // Abrimos el archivo en modo append
      fs := TFileStream.Create(nombreDump, fmOpenReadWrite or fmShareDenyNone);
      fs.Seek(0, soEnd);

                        // Exportar Toda la DB
      dump.BackupToStream(fs, TXTSql_apus);
      dump.BackupToStream(fs, TXTSql_apus_items);
      dump.BackupToStream(fs, TXTSql_bases);
      dump.BackupToStream(fs, TXTSql_categoriaapus);
      dump.BackupToStream(fs, TXTSql_catIndirectos);
      dump.BackupToStream(fs, TXTSql_codcpc);
      dump.BackupToStream(fs, TXTSql_conceptosindirectos);
      dump.BackupToStream(fs, TXTSql_configuracion);
      dump.BackupToStream(fs, TXTSql_currency);
      dump.BackupToStream(fs, TXTSql_empresas);
      dump.BackupToStream(fs, TXTSql_empresas_config);
      dump.BackupToStream(fs, TXTSql_graficos);
      dump.BackupToStream(fs, TXTSql_indicesprecios);
      dump.BackupToStream(fs, TXTSql_indicesvalor);
      dump.BackupToStream(fs, TXTSql_monedaspaises);
      dump.BackupToStream(fs, TXTSql_paises);
      dump.BackupToStream(fs, TXTSql_parametros);
      dump.BackupToStream(fs, TXTSql_plantillas);
      dump.BackupToStream(fs, TXTSql_presupuestos_anotaciones);
      dump.BackupToStream(fs, TXTSql_presupuestos_anotacionesp2);
      dump.BackupToStream(fs, TXTSql_asignacionterminios);
      dump.BackupToStream(fs, TXTSql_configreportes);
      dump.BackupToStream(fs, TXTSql_cronogramas);
      dump.BackupToStream(fs, TXTSql_datosproyecto);
      dump.BackupToStream(fs, TXTSql_datosgenerales);
      dump.BackupToStream(fs, TXTSql_desagregacion);
      dump.BackupToStream(fs, TXTSql_edo);
      dump.BackupToStream(fs, TXTSql_edo_datos);
      dump.BackupToStream(fs, TXTSql_edo_hitos);
      dump.BackupToStream(fs, TXTSql_presupuestos_edt);
      dump.BackupToStream(fs, TXTSql_presupuestos_fpolcuadrillas);
      dump.BackupToStream(fs, TXTSql_presupuestos_fpolinomica);
      dump.BackupToStream(fs, TXTSql_presupuestos_indicesseleccionados);
      dump.BackupToStream(fs, TXTSql_presupuestos_indirectos);
      dump.BackupToStream(fs, TXTSql_presupuestos_items);
      dump.BackupToStream(fs, TXTSql_presupuestos_items_trabajo);
      dump.BackupToStream(fs, TXTSql_presupuestos_items_trabajo_edt);
      dump.BackupToStream(fs, TXTSql_presupuestos_movimientoshistorico);
      dump.BackupToStream(fs, TXTSql_presupuestos_notas);
      dump.BackupToStream(fs, TXTSql_presupuestos_notasrevision);
      dump.BackupToStream(fs, TXTSql_presupuestos_recursos);
      dump.BackupToStream(fs, TXTSql_presupuestos_stakeholders);
      dump.BackupToStream(fs, TXTSql_presupuestos_tanteo_apus);
      dump.BackupToStream(fs, TXTSql_presupuestos_tanteo_apus_bkp);
      dump.BackupToStream(fs, TXTSql_presupuestos_tanteo_recursos);
      dump.BackupToStream(fs, TXTSql_presupuestos_tanteo_recursos_bkp);
      dump.BackupToStream(fs, TXTSql_recursos);
      dump.BackupToStream(fs, TXTSql_rolesstakes);
      dump.BackupToStream(fs, TXTSql_StakeHolders);
      dump.BackupToStream(fs, TXTSql_tanotaciones);
      dump.BackupToStream(fs, TXTSql_tgrid2items);
      dump.BackupToStream(fs, TXTSql_tgridItems);
      dump.BackupToStream(fs, TXTSql_tgriditems_edt);
      dump.BackupToStream(fs, TXTSql_tpresupuesto);
      dump.BackupToStream(fs, TXTSql_tproyectos);
      dump.BackupToStream(fs, TXTSql_tproyectositems);
      dump.BackupToStream(fs, TXTSql_tvaloresedt);
      dump.BackupToStream(fs, TXTSql_unidades);
      dump.BackupToStream(fs, TXTSql_usuario_comunicacion);
      dump.BackupToStream(fs, TXTSql_usuario_tipocomunicacion);
      dump.BackupToStream(fs, TXTSql_usuarios);
      dump.BackupToStream(fs, TXTSql_Colaboradores);
    finally
      dump.Free;
      fs.Free;
      result := nombreDump;
    end;
  except
    result := 'error';
  end;
end;

function exportarBase(codBaseExportar: string): string;
var
  dump: TUniDump;
  nombreDump: string;
  fs: TFileStream;
  strBusqueda: string;
begin
  if codBaseExportar <> '' then
  begin
    dump := TUniDump.Create(nil);
    try
      nombreDump := 'Dump_' + IntToStr(codigo_usuario) + '_' + FormatDateTime('yyyymmddhhnnss', now);
      nombreDump := rutaApp + nombreDump + '.sql';
      fs := TFileStream.Create(nombreDump, fmCreate);
      fs.Free;
      dump.Connection := DModule_1.con2;
      dump.SpecificOptions.Values['UseExtSyntax'] := 'False';
                        // Abrimos el archivo en modo append
      fs := TFileStream.Create(nombreDump, fmOpenReadWrite or fmShareDenyNone);
      fs.Seek(0, soEnd);
      strBusqueda := ' where codbase = ' + QuotedStr(codBaseExportar);

                        // Exportar DBs
      dump.BackupToStream(fs, TXTSql_apus + strBusqueda);
      dump.BackupToStream(fs, TXTSql_apus_items + strBusqueda);
      dump.BackupToStream(fs, TXTSql_bases + strBusqueda);
      dump.BackupToStream(fs, TXTSql_categoriaapus + strBusqueda);
      dump.BackupToStream(fs, TXTSql_recursos + strBusqueda);
    finally
      dump.Free;
      fs.Free;
    end;
    BorrarLineasArchivo(nombreDump, 'TRUNCATE TABLE');
    BorrarLineasArchivo(nombreDump, '--');
    BorrarLineasArchivo(nombreDump, '/*');
    result := nombreDump;
  end;
end;

function exportarProyecto(codbaseSel, codproyectoSel, revisionSel: string; anotaciones, notas,
  stakes: Boolean): string;
var
  dump: TUniDump;
  nombreDump: string;
  fs: TFileStream;
  strBusqueda1: string;
  strBusqueda2: string;
  strBusqueda3: string;
  strJOIN1: string;
  strJOIN2: string;
  strJOIN3: string;
  strJOIN4: string;
  tmpstr: string;
begin
  if (codbaseSel <> '') and (codproyectoSel <> '') and (revisionSel <> '') then
  begin
    dump := TUniDump.Create(nil);
    try
      nombreDump := 'Dump_' + IntToStr(codigo_usuario) + '_' + FormatDateTime('yyyymmddhhnnss', now);
      nombreDump := rutaApp + nombreDump + '.sql';
      fs := TFileStream.Create(nombreDump, fmCreate);
      fs.Free;
      dump.Connection := DModule_1.con2;
      dump.SpecificOptions.Values['UseExtSyntax'] := 'False';
                        // Abrimos el archivo en modo append
      fs := TFileStream.Create(nombreDump, fmOpenReadWrite or fmShareDenyNone);
      fs.Seek(0, soEnd);
      strBusqueda1 := ' where tbl.codbase = ' + QuotedStr(codbaseSel);
      strBusqueda2 := ' where tbl.codbase = ' + QuotedStr(codbaseSel) + ' and tbl.codPresupuesto = '
        + QuotedStr(codproyectoSel) + ' and tbl.revision = ' + QuotedStr(revisionSel);

      strBusqueda3 := ' where tbl.codPresupuesto = ' + QuotedStr(codproyectoSel) +
        ' and tbl.revision = ' + QuotedStr(revisionSel);

                        { (* }
      strJOIN1 := ' INNER JOIN giproylocal.presupuestos_items pi ' + 'ON tbl.CodAPU = pi.codAPU ' +
        'AND tbl.codBase = pi.codBase ' + 'AND pi.codPresupuesto=' + QuotedStr(codproyectoSel) +
        ' and pi.revision=' + QuotedStr(revisionSel);

      strJOIN2 := ' INNER JOIN giproylocal.presupuestos_items pi ON pi.codBase = ' + QuotedStr(codbaseSel)
        + ' AND pi.codPresupuesto = ' + QuotedStr(codproyectoSel) + ' and pi.revision = ' +
        QuotedStr(revisionSel) + ' AND pi.codAPU = tbl.CodAPU';

      strJOIN3 := ' INNER JOIN apus_items ai ' + 'ON ai.idUnicoRecurso = tbl.idUnico ' +
        'AND ai.codbase = ' + QuotedStr(codbaseSel) +
        ' INNER JOIN giproylocal.presupuestos_items pi ' + 'ON pi.codAPU = ai.CodAPU ' +
        'AND pi.codBase = ' + QuotedStr(codbaseSel) + ' AND pi.codPresupuesto = ' + QuotedStr(codproyectoSel)
        + ' AND pi.revision = ' + QuotedStr(revisionSel);

      strJOIN4 := ' INNER JOIN presupuestos_edo_datos ped ON ped.idStake = tbl.idFiscal ' +
        'AND ped.codbase = ' + QuotedStr(codbaseSel) + ' AND ped.codPresupuesto = ' + QuotedStr(codproyectoSel)
        + ' AND revision = ' + QuotedStr(revisionSel);
                        { */ }

                        // Exportar DBs
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_bases, 1) + strBusqueda1);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_apus, 2) + strJOIN1 + strBusqueda1);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_apus_items, 2) + strJOIN2 + strBusqueda1);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_categoriaapus, 2) + strBusqueda1);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_recursos, 1) + strJOIN3 + strBusqueda1);
      if anotaciones then
      begin
        dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_anotaciones, 1) + strBusqueda2);
        dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_anotacionesp2, 1) + strBusqueda2);
      end;
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_configreportes, 1) + strBusqueda3);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_cronogramas, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_datosgenerales, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_datosproyecto, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_desagregacion, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_edo, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_edo_hitos, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_edo_datos, 1) + strBusqueda2);
      if stakes then
      begin
        dump.BackupToStream(fs, preparaParaJoin(TXTSql_StakeHolders, 2) + strJOIN4);
        dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_stakeholders, 1) + strBusqueda2);
      end;
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_stakeholders, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_edt, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_fpolcuadrillas, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_fpolinomica, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_indicesseleccionados, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_indirectos, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_items, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_items_trabajo, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_items_trabajo_edt, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_movimientoshistorico, 1) + strBusqueda2);
      if notas then
      begin
        dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_notas, 1) + strBusqueda2);
        dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_notasrevision, 1) + strBusqueda2);
      end;
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_recursos, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_tanteo_apus, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_tanteo_apus_bkp, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_tanteo_recursos, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_presupuestos_tanteo_recursos_bkp, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_tgridItems, 1) + strBusqueda2);
      dump.BackupToStream(fs, preparaParaJoin(TXTSql_tgriditems_edt, 1) + strBusqueda2);
    finally
      dump.Free;
      fs.Free;
    end;
    BorrarLineasArchivo(nombreDump, 'TRUNCATE TABLE');
    BorrarLineasArchivo(nombreDump, '--');
    BorrarLineasArchivo(nombreDump, '/*');
    result := nombreDump;
  end
  else
    result := 'error';
end;

function Encripta_Envia(nombreDump: string; keysalsa: string): string;
var
  nombreEncriptado: string;
  SalsaEnc: TSalsaEncryption;
begin
  nombreEncriptado := nombreDump + '.enc';
  SalsaEnc := TSalsaEncryption.Create(nil);
        // Rutina de encriptacion y borrado
  try
    try
      SalsaEnc.keyLength := skl256;
      SalsaEnc.outputFormat := base64url;
      SalsaEnc.Unicode := yesUni;
      SalsaEnc.key := keysalsa;
      SalsaEnc.EncryptFile(nombreDump, nombreEncriptado);
      WipeFile(nombreDump);
      result := transfiereFTP(nombreEncriptado);
    finally
      SalsaEnc.Free;
    end;
  except
    result := 'error';
  end;
end;

function transfiereFTP(NombreArchivo: string): string;
var
  IdFTP: TIdFTP;
  SSLIOHandler: TIdSSLIOHandlerSocketOpenSSL;
  remoteFile: string;
begin
  IdFTP := TIdFTP.Create(nil);
  SSLIOHandler := TIdSSLIOHandlerSocketOpenSSL.Create(nil);
  try
                // Configure SSLIOHandler
    SSLIOHandler.SSLOptions.Method := sslvTLSv1_2;
    IdFTP.IOHandler := SSLIOHandler;

                // Configure FTP component
    IdFTP.Host := '62.171.171.124';
    IdFTP.Port := 21;
    IdFTP.Username := 'usuario_transferencia';
    IdFTP.Password := 'AC16AC662asdC_7A';
    IdFTP.UseTLS := utUseExplicitTLS;
    IdFTP.DataPortProtection := ftpdpsPrivate;
    IdFTP.Passive := True;

                // Connect
    IdFTP.Connect;
    if IdFTP.Connected then
    begin
      remoteFile := ExtractFileName(NombreArchivo);
      IdFTP.Put(NombreArchivo, remoteFile);
      result := NombreArchivo;
    end;

    IdFTP.Disconnect;
  except
    on E: Exception do
      result := 'Error connecting to FTPS: ' + E.Message;
  end;
  SSLIOHandler.Free;
  IdFTP.Free;
        // Borrarftp(nombreArchivo);
end;

end.

