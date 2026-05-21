unit DM2;

interface

uses
  System.SysUtils, System.Classes, System.JSON, Windows, Messages, Variants,
    Uni, xmldom, XMLIntf,
  msxmldom, XMLDoc, System.DateUtils, StrUtils, ShellAPI, System.Math,
    FMX.TMSFNCTreeViewBase,
  FMX.TMSFNCTreeViewData, FMX.TMSFNCCustomTreeView, FMX.TMSFNCTreeView;

type
  dat_PRJEDT = record
    codEDT: string;
    descripcion: string;
    GUID: string;
  end;

type
  dat_PRJAPU = record
    codItem: string;
    codAPU: string;
    descripcion: string;
    costo: string;
    cantidad: string;
    UMedida: string;
    GUID: string;
    codEDT: string;
    codUnicoRecursos: string;
  end;

type
  dat_tasks = record
    GUID: string;
    tipo: string;
    codEDT: string;
    codItem: string;
    descripcion: string;
    unidad: string;
    cantidad: string;
    PrecioU: string;
    PrecioT: string;
  end;

type
  dat_PRJRecursos = record
    UID: string;
    codUnicoRecurso: string;
    idRecurso: string;
    descripcion: string;
    tipoRecurso: string;
    tipoRecursoPrj: string;
    PrecioCosto: string;
    categoriaBase: string;
    subCategoria: string;
    Grupo: string;
    GUID: string;
    UMedida: string;
    calendarioAsignado: string;
    ResorceID: string;
    cantidad: string;
    rendimiento: string;
    PrecioTotal: string;
    codTask: string;
    codAPU: string;
    horasTrabajo: string;
    cantidadPresupuesto: string;
  end;

type
  arrayRecursos = array of dat_PRJRecursos;

type
  TDMProject = class(TDataModule)
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  DMProject: TDMProject;
  listado_PRJEDT: array of dat_PRJEDT;
  listado_PRJAPU: array of dat_PRJAPU;
  listado_PRJRecurso: array of dat_PRJRecursos;
  listado_PRJRecursoLimpios: array of dat_PRJRecursos;
  listado_PRJTasks: array of dat_tasks;
  codAsignamiento: Integer;

function creaCuerpoBasePRJ(archivo, Titulo, moneda: string; FInicio, FFin:
  TDateTime): TStringList;

function generaGUID(): string;

function generaPID(base, desarrollo: Integer): string;

function daSimboloMoneda(Datos: string): string;

function cierraCuerpoBasePRJ(cuerpoBase: TStringList): TStringList;

function crearViewsPRJ(cuerpoBase: TStringList): TStringList;

function crearFiltroPRJ(cuerpoBase: TStringList): TStringList;

function crearGrupoPRJ(cuerpoBase: TStringList): TStringList;

function crearTablesPRJ(cuerpoBase: TStringList): TStringList;

function crearAdicionales1PRJ(cuerpoBase: TStringList): TStringList;

function crearExtendedAttributtes(cuerpoBase: TStringList): TStringList;

function crearCalendarios(cuerpoBase: TStringList; FInicio, FFin: TDate):
  TStringList;

function pMes(mes: Integer): string;

function addCalendarioPrincipal(): string;

function addCalendarSabadoDomingos(FInicio, FFin: TDate): string;

function addCalendarRecursos(calendarioEnvio: string): string;

function addPRJTaskCero(descripcion, GUID: string): string;

function dialaborables(inicio, fin: TDateTime; horasJornada: Integer): string;

function addPRJResources(cuerpoBase: TStringList): TStringList;

function horarios(): TStringList;

function generaCalendarioPRJ(cuerpoBase: TStringList): TStringList;

function convertirTextoUTF8conBOM(texto: string): string;

function truqueaCalendario(cuerpoBase: TStringList): TStringList;

function addTaks1PRJ(cuerpoBase: TStringList): TStringList;

function addtaksEDT(Posgrid: Integer; Id: Integer): string;

function addtaksItem(Posgrid: Integer; Id: Integer): string;

function numeroPuntos(Datos: string): Integer;

function daAsignamientoAPU(listadoRecursos: arrayRecursos): string;

function addResourceIndirectos(): string;

function daResourceID(codRecurso: string): string;

function addAsignamentTrabajo(UIDAsignamiento, TaskAsignamiento, ResourceID,
  TiempoAsignamiento,
  unidades: string): string;

function addAsignamentMateriales(UIDAsignamiento, TaskAsignamiento, ResourceID,
  UnidadesEnTiempo,
  unidades: string): string;

function addAsignamientoCostos(UIDAsignamiento, TaskAsignamiento, ResourceID,
  valorCosto: string;
  horasTrabajo: Double): string;

function convierteHMS(horasTrabajo: Double): string;

function convierteNumero60(cantidad: Double): string;

function daUnidadesRecurso(codAPU, idUnicoRecurso: string): Double;

function encuentraRecursoenMatriz(listadoRecursos: array of dat_PRJRecursos;
  codUnicoRecurso,
  codAPURecurso: string): Integer;

function creaItemsAsignamientoProject(cuerpoBase: TStringList): TStringList;

function explosionarRecursoProject(codIdUnicoRecurso, cantidadRubroAnidado:
  string; listadoRecursos:
  arrayRecursos; UIDAsignamiento: Integer; codTask, codAPU, horasTrabajo,
    cantidadPresupuesto:
  string): arrayRecursos;

function compruebaEnListadoRecursosAnidados(codAPU, idRecursoUnico: string):
  Integer;

function dasumaCantidadItemAnidados(listado: arrayRecursos; codItemSuma,
  cantidadBase: string): string;

function dasumaTotalesItemAnidados(listado: arrayRecursos; codItemSuma,
  cantidadBase: string): string;

function daDuracionActividadAnidados(listado: arrayRecursos): Double;

procedure crearPRJEDT();

procedure crearPRJAPUS();

procedure crearPRJRecursos();

procedure crearPRJRecursosLimpios();

procedure daCodUnicoRecursoAPU();

procedure adicionaGRUPO();

procedure findMSProject();

procedure FindFiles(StartDir, FileMask: string; recursively: boolean; var
  FilesList: TStringList);

procedure ExecNewProcess(const ProgramName: string; pWait: boolean);

procedure exportaProject();

procedure entradaRecursivaRecursos(idUnicoRecurso: string);

procedure recalculaTiemposAnidados(listado: arrayRecursos; DuracionActividad:
  Double; Posgrid: Integer);

function daRendimientoEquipoMatriz(listado: arrayRecursos): Double;

function daTrabajoEquipoMatriz(listado: arrayRecursos): Double;

function daRendimientoManoObraMatriz(listado: arrayRecursos): Double;

function daTrabajoManoObraMatriz(listado: arrayRecursos): Double;

function daPorcentajeTiempoMatriz(listado: arrayRecursos; DuracionActividad:
  Double; Posgrid:
  Integer): Double;

function daHombresCuadrillaMatriz(listado: arrayRecursos): Double;

function valorStandartProject(Valor: string): string;

function daCodApuPadreAnidado(Datos: string): string;

implementation

{%CLASSGROUP 'FMX.Controls.TControl'}
{$R *.dfm}

uses
  DM1, uMain, DM_Presupuestos;

procedure exportaProject();
var
  archivoXML: TStringList;
  FInicio, FFin: TDate;
  Datos: string;
  NombreProyectoXML: string;
  tndecimalesMoneda: Integer;
begin
  tndecimalesMoneda := ndecimalesMoneda;
  ndecimalesMoneda := 2;
  // Recopilacion de datos
  FInicio := frmMain.dedt_PresentacionPresupuesto.Date;
  FFin := StrToDate(frmMain.lbl_PresupuestoFinalizacion.Text);
  crearPRJEDT();
  crearPRJAPUS();
  crearPRJRecursos();
  crearPRJRecursosLimpios();
  // creacion XML
  NombreProyectoXML := frmMain.edt_descripcionPresupuesto.Text;
  NombreProyectoXML := NombreProyectoXML + '.xml';
  archivoXML := creaCuerpoBasePRJ(NombreProyectoXML,
    frmMain.edt_descripcionPresupuesto.Text,
    base_activa.moneda, FInicio, FFin);
  archivoXML := crearViewsPRJ(archivoXML);
  archivoXML := crearFiltroPRJ(archivoXML);
  archivoXML := crearGrupoPRJ(archivoXML);
  archivoXML := crearTablesPRJ(archivoXML);
  archivoXML := crearExtendedAttributtes(archivoXML);
  archivoXML := crearAdicionales1PRJ(archivoXML);
  archivoXML := truqueaCalendario(archivoXML);
  archivoXML := addPRJResources(archivoXML);
  archivoXML := addTaks1PRJ(archivoXML);
  archivoXML := creaItemsAsignamientoProject(archivoXML);
  archivoXML := cierraCuerpoBasePRJ(archivoXML);
  Datos := rutaApp + NombreProyectoXML;
  if FileExists(Datos) then
    DeleteFile(PWideChar(Datos));
  archivoXML.Text := convertirTextoUTF8conBOM(archivoXML.Text);
  archivoXML.SaveToFile(Datos);
  frmMain.abreMSProject(Datos);
  ndecimalesMoneda := tndecimalesMoneda;
end;

procedure recalculaTiemposAnidados(listado: arrayRecursos; DuracionActividad:
  Double; Posgrid: Integer);
var
  RendimientoUnitatioTotalEquipo: Double;
  tmpstr: string;
  cantidadPresupuesto: Double;
  trabajoEquipo: Double;
  RendimientoUnitarioTotalManoObra: Double;
  TrabajoManoObra: Double;
  TrabajoTotal: Double;
  UnidadesRecurso: Double;
  duracionHoras: Double;
  hombresCuadrilla: Double;
  horasLaborales: Double;
  DiasUtiles: Double;
  DiasCalendarios: Double;
  tmptime: TTime;
begin
  RendimientoUnitatioTotalEquipo := daRendimientoEquipoMatriz(listado);
  tmpstr := frmMain.grid_crono01.Cells[6, Posgrid];
  tmpstr := quitaSignoMiles(tmpstr);
  tmpstr := decimal_correcto(tmpstr);
  cantidadPresupuesto := StrToFloat(tmpstr);
  trabajoEquipo := daTrabajoEquipoMatriz(listado);
  trabajoEquipo := trabajoEquipo * cantidadPresupuesto;
  RendimientoUnitarioTotalManoObra := daRendimientoManoObraMatriz(listado);
  TrabajoManoObra := daTrabajoManoObraMatriz(listado);
  TrabajoManoObra := TrabajoManoObra * cantidadPresupuesto;
  TrabajoTotal := trabajoEquipo + TrabajoManoObra;

  UnidadesRecurso := daPorcentajeTiempoMatriz(listado, DuracionActividad,
    Posgrid);
  duracionHoras := TrabajoTotal / UnidadesRecurso;
  hombresCuadrilla := daHombresCuadrillaMatriz(listado);
  tmpstr := frmMain.edt_HorasJornada.Text;
  horasLaborales := StrToFloatDef(tmpstr, 8);
  DiasUtiles := duracionHoras / horasLaborales;
  DiasCalendarios := DiasUtiles * factorconversiondias;
  frmMain.grid_calcTiempos.Cells[0, Posgrid - 1] := FloatToStr(TrabajoTotal);
  frmMain.grid_calcTiempos.Cells[1, Posgrid - 1] := FloatToStr(UnidadesRecurso);
  frmMain.grid_calcTiempos.Cells[2, Posgrid - 1] := FloatToStr(duracionHoras);
  frmMain.grid_calcTiempos.Cells[3, Posgrid - 1] :=
    FloatToStr(hombresCuadrilla);
  frmMain.grid_calcTiempos.Cells[4, Posgrid - 1] := FloatToStr(DiasUtiles);
  frmMain.grid_calcTiempos.Cells[5, Posgrid - 1] :=
    FloatToStr(factorconversiondias);
  frmMain.grid_calcTiempos.Cells[6, Posgrid - 1] := FloatToStr(DiasCalendarios);
end;

function daHombresCuadrillaMatriz(listado: arrayRecursos): Double;
var
  x: Integer;
  tmpstr: string;
begin
  result := 0;
  for x := 0 to length(listado) - 1 do
  begin
    if listado[x].tipoRecurso = '4' then
    begin
      tmpstr := listado[x].cantidad;
      tmpstr := decimal_correcto(tmpstr);
      result := result + StrToFloat(tmpstr);
    end;
  end;
end;

function daPorcentajeTiempoMatriz(listado: arrayRecursos; DuracionActividad:
  Double; Posgrid:
  Integer): Double;
var
  qry: TUniQuery;
  tmpstr: string;
  x, y: Integer;
  porcentajeTiempo: Double;
  cantidadRecurso: Double;
  UnidadesRecurso: Double;
  sumatoriaAsumidos: Double;
  codAPU: string;
  idRecursoUnico: string;
begin
  codAPU := frmMain.grid_crono01.Cells[3, Posgrid];
  sumatoriaAsumidos := 0;
  for y := 0 to length(listado) - 1 do
  begin
    idRecursoUnico := listado[y].codUnicoRecurso;
    x := compruebaEnListadoRecursosAnidados(codAPU, idRecursoUnico);
    if x = -1 then
    begin
      x := length(listadoRecursosAsumidos);
      SetLength(listadoRecursosAsumidos, x + 1);
    end;
    listadoRecursosAsumidos[x].codAPU := codAPU;
    listadoRecursosAsumidos[x].idUnicoRecurso := idRecursoUnico;
    tmpstr := listado[y].rendimiento;
    tmpstr := decimal_correcto(tmpstr);
    porcentajeTiempo := StrToFloat(tmpstr);
    porcentajeTiempo := porcentajeTiempo / DuracionActividad;
    tmpstr := listado[y].cantidad;
    tmpstr := decimal_correcto(tmpstr);
    cantidadRecurso := StrToFloat(tmpstr);
    UnidadesRecurso := cantidadRecurso * porcentajeTiempo;
    listadoRecursosAsumidos[x].unidadesRecursos := UnidadesRecurso;
    sumatoriaAsumidos := sumatoriaAsumidos + UnidadesRecurso;
  end;
  result := sumatoriaAsumidos;
end;

function compruebaEnListadoRecursosAnidados(codAPU, idRecursoUnico: string):
  Integer;
var
  x: Integer;
  salir: boolean;
  comprobacion1, comprobacion2: string;
begin
  result := -1;
  x := 0;
  salir := false;
  while (x < length(listadoRecursosAsumidos)) and (not salir) do
  begin
    comprobacion1 := listadoRecursosAsumidos[x].codAPU;
    comprobacion2 := listadoRecursosAsumidos[x].idUnicoRecurso;
    if (comprobacion1 = codAPU) and (comprobacion2 = idRecursoUnico) then
    begin
      salir := true;
      result := x;
    end;
    inc(x);
  end;
end;

function daRendimientoEquipoMatriz(listado: arrayRecursos): Double;
var
  x: Integer;
  valTmp: Double;
  tmpstr: string;
begin
  valTmp := 0;
  for x := 0 to length(listado) - 1 do
  begin
    if listado[x].tipoRecurso = '1' then
    begin
      tmpstr := listado[x].rendimiento;
      tmpstr := decimal_correcto(tmpstr);
      valTmp := valTmp + StrToFloat(tmpstr);
    end;
  end;
  result := valTmp;
end;

function daRendimientoManoObraMatriz(listado: arrayRecursos): Double;
var
  x: Integer;
  valTmp: Double;
  tmpstr: string;
begin
  valTmp := 0;
  for x := 0 to length(listado) - 1 do
  begin
    if listado[x].tipoRecurso = '4' then
    begin
      tmpstr := listado[x].rendimiento;
      tmpstr := decimal_correcto(tmpstr);
      valTmp := valTmp + StrToFloat(tmpstr);
    end;
  end;
  result := valTmp;
end;

function daTrabajoEquipoMatriz(listado: arrayRecursos): Double;
var
  x: Integer;
  tmpstr: string;
  cantidad: Double;
  rendimiento: Double;
  valTmp: Double;
begin
  result := 0;
  for x := 0 to length(listado) - 1 do
  begin
    if listado[x].tipoRecurso = '1' then
    begin
      tmpstr := listado[x].cantidad;
      tmpstr := decimal_correcto(tmpstr);
      cantidad := StrToFloat(tmpstr);
      tmpstr := listado[x].rendimiento;
      tmpstr := decimal_correcto(tmpstr);
      rendimiento := StrToFloat(tmpstr);
      valTmp := cantidad * rendimiento;
      result := result + valTmp;
    end;
  end;
end;

function daTrabajoManoObraMatriz(listado: arrayRecursos): Double;
var
  x: Integer;
  tmpstr: string;
  cantidad: Double;
  rendimiento: Double;
  valTmp: Double;
begin
  result := 0;
  for x := 0 to length(listado) - 1 do
  begin
    if listado[x].tipoRecurso = '4' then
    begin
      tmpstr := listado[x].cantidad;
      tmpstr := decimal_correcto(tmpstr);
      cantidad := StrToFloat(tmpstr);
      tmpstr := listado[x].rendimiento;
      tmpstr := decimal_correcto(tmpstr);
      rendimiento := StrToFloat(tmpstr);
      valTmp := cantidad * rendimiento;
      result := result + valTmp;
    end;
  end;
end;

function daDuracionActividadAnidados(listado: arrayRecursos): Double;
var
  DuracionRecurso1: Double;
  DuracionRecurso4: Double;
  x: Integer;
  tmpstr: string;
  valTmp: Double;
begin
  result := 0;
  DuracionRecurso1 := 0;
  DuracionRecurso4 := 0;
  for x := 0 to length(listado) - 1 do
  begin
    tmpstr := listado[x].rendimiento;
    tmpstr := decimal_correcto(tmpstr);
    valTmp := StrToFloat(tmpstr);
    if listado[x].tipoRecurso = '1' then
    begin
      DuracionRecurso1 := DuracionRecurso1 + valTmp;
    end;
    if listado[x].tipoRecurso = '4' then
    begin
      DuracionRecurso4 := DuracionRecurso4 + valTmp;
    end;
  end;
  if DuracionRecurso1 > DuracionRecurso4 then
    result := DuracionRecurso1
  else
    result := DuracionRecurso4;
end;

function dasumaCantidadItemAnidados(listado: arrayRecursos; codItemSuma,
  cantidadBase: string): string;
var
  totalsuma: Double;
  itm: string;
  tmpstr: string;
  x: Integer;
begin
  tmpstr := decimal_correcto(cantidadBase);

  totalsuma := StrToFloat(tmpstr);
  for x := 0 to length(listado) - 1 do
  begin
    itm := listado[x].codUnicoRecurso;
    if itm = codItemSuma then
    begin
      tmpstr := listado[x].cantidad;
      tmpstr := decimal_correcto(tmpstr);
      totalsuma := totalsuma + StrToFloat(tmpstr);
    end;
  end;
  result := FloatToStr(totalsuma);
end;

function dasumaTotalesItemAnidados(listado: arrayRecursos; codItemSuma,
  cantidadBase: string): string;
var
  totalsuma: Double;
  itm: string;
  tmpstr: string;
  x: Integer;
begin
  tmpstr := decimal_correcto(cantidadBase);
  totalsuma := StrToFloat(tmpstr);
  for x := 0 to length(listado) - 1 do
  begin
    itm := listado[x].codUnicoRecurso;
    if itm = codItemSuma then
    begin
      tmpstr := listado[x].PrecioTotal;
      tmpstr := decimal_correcto(tmpstr);
      totalsuma := totalsuma + StrToFloat(tmpstr);
    end;
  end;
  result := FloatToStr(totalsuma);
end;

function daResourceID(codRecurso: string): string;
var
  salir: boolean;
  x: Integer;
begin
  x := 0;
  salir := false;
  while (not salir) and (x < length(listado_PRJRecursoLimpios)) do
  begin
    if codRecurso = listado_PRJRecursoLimpios[x].codUnicoRecurso then
    begin
      result := listado_PRJRecursoLimpios[x].ResorceID;
      salir := true;
    end;
    inc(x);
  end;
end;

function convertirTextoUTF8conBOM(texto: string): string;
const
  cUTF8 = $BFBBEF;
var
  textoUTF8: UTF8String;
  valorBOM: Integer;
  textoTmp: TStringStream;
begin
  if (Trim(texto) <> '') then
  begin
    textoUTF8 := UTF8Encode(texto);
    valorBOM := cUTF8;
    textoTmp := TStringStream.Create('');
    // incluimos BOM
    textoTmp.WriteBuffer(valorBOM, sizeof(valorBOM) - 1);
    // añadimos resto del texto
    textoTmp.WriteBuffer(textoUTF8[1], length(textoUTF8) *
      sizeof(textoUTF8[1]));
    result := textoTmp.DataString;
  end
  else
    result := '';
end;

function daUnidadesRecurso(codAPU, idUnicoRecurso: string): Double;
var
  salir: boolean;
  x: Integer;
begin
  salir := false;
  result := 0;
  x := 0;
  while (x < length(listadoRecursosAsumidos)) and (not salir) do
  begin
    if (codAPU = listadoRecursosAsumidos[x].codAPU) and (idUnicoRecurso =
      listadoRecursosAsumidos[x].idUnicoRecurso) then
    begin
      salir := true;
      result := listadoRecursosAsumidos[x].unidadesRecursos;
    end;
    inc(x);
  end;
end;

procedure ExecNewProcess(const ProgramName: string; pWait: boolean);
var
  lOK: boolean;
  lStartInfo: TStartupInfo;
  lProcInfo: TProcessInformation;
begin
  FillChar(lStartInfo, sizeof(TStartupInfo), #0);
  FillChar(lProcInfo, sizeof(TProcessInformation), #0);
  lStartInfo.cb := sizeof(TStartupInfo);
  lOK := CreateProcess(nil, PChar(ProgramName), nil, nil, false,
    CREATE_NEW_PROCESS_GROUP +
    NORMAL_PRIORITY_CLASS, nil, nil, lStartInfo, lProcInfo);
  if lOK then
  begin
    if pWait then
      WaitForSingleObject(lProcInfo.hProcess, INFINITE);
  end;
  CloseHandle(lProcInfo.hProcess);
  CloseHandle(lProcInfo.hThread);
end;

procedure findMSProject();
var
  pathbasePRJ: string;
  fichPRJ: string;
  tmplst: TStringList;
begin
  MSProject := '';
  tmplst := TStringList.Create;
  pathbasePRJ := 'C:\Program Files\Microsoft Office\root\';
  fichPRJ := 'WINPROJ.EXE';
  FindFiles(pathbasePRJ, fichPRJ, true, tmplst);
  if tmplst.Text <> '' then
  begin
    MSProject := tmplst.Text;
    MSProject := ReplaceStr(MSProject, Chr(10), '');
    MSProject := ReplaceStr(MSProject, Chr(13), '');
  end
  else
    MSProject := '';
end;

procedure FindFiles(StartDir, FileMask: string; recursively: boolean; var
  FilesList: TStringList);
const
  MASK_ALL_FILES = '*.*';
  CHAR_POINT = '.';
var
  SR: TSearchRec;
  DirList: TStringList;
  IsFound: boolean;
  i: Integer;
begin

  if (StartDir[length(StartDir)] <> '\') then
  begin
    StartDir := StartDir + '\';
  end;

  // Crear la lista de ficheos en el dir. StartDir (no directorios!)
  IsFound := FindFirst(StartDir + FileMask, faAnyFile - faDirectory, SR) = 0;

  // MIentras encuentre
  while IsFound do
  begin
    FilesList.Add(StartDir + SR.Name);
    IsFound := FindNext(SR) = 0;
  end;

  System.SysUtils.FindClose(SR);

  // Recursivo?
  if (recursively) then
  begin
    // Build a list of subdirectories
    DirList := TStringList.Create;
    // proteccion
    try
      IsFound := FindFirst(StartDir + MASK_ALL_FILES, faAnyFile, SR) = 0;
      while IsFound do
      begin
        if ((SR.Attr and faDirectory) <> 0) and (SR.Name[1] <> CHAR_POINT) then
        begin
          DirList.Add(StartDir + SR.Name);
          // IsFound := FindNext(SR) = 0;
        end; // if
        IsFound := FindNext(SR) = 0;
      end; // while
      System.SysUtils.FindClose(SR);
      // Scan the list of subdirectories
      for i := 0 to DirList.Count - 1 do
      begin
        FindFiles(DirList[i], FileMask, recursively, FilesList);
      end;
    finally
      DirList.Free;
    end;
  end;
end;

function addResourceIndirectos(): string;
var
  linea: string;
  tmplst: TStringList;
begin
  tmplst := TStringList.Create;
  linea := '		<Resource>';
  tmplst.Add(linea);
  linea := '			<UID>3</UID>';
  tmplst.Add(linea);
  linea := '			<GUID>CAEB02A3-9037-EE11-9EDF-847B57A09BEF</GUID>';
  tmplst.Add(linea);
  linea := '			<ID>3</ID>';
  tmplst.Add(linea);
  linea := '			<Name>Indirectos</Name>';
  tmplst.Add(linea);
  linea := '			<Type>0</Type>';
  tmplst.Add(linea);
  linea := '			<IsNull>0</IsNull>';
  tmplst.Add(linea);
  linea := '			<Initials>I</Initials>';
  tmplst.Add(linea);
  linea := '			<PeakUnits>0.00</PeakUnits>';
  tmplst.Add(linea);
  linea := '			<OverAllocated>0</OverAllocated>';
  tmplst.Add(linea);
  linea := '			<CanLevel>0</CanLevel>';
  tmplst.Add(linea);
  linea := '			<AccrueAt>3</AccrueAt>';
  tmplst.Add(linea);
  linea := '			<OvertimeWork>PT0H0M0S</OvertimeWork>';
  tmplst.Add(linea);
  linea := '			<ActualOvertimeWork>PT0H0M0S</ActualOvertimeWork>';
  tmplst.Add(linea);
  linea := '			<RemainingOvertimeWork>PT0H0M0S</RemainingOvertimeWork>';
  tmplst.Add(linea);
  linea := '			<PercentWorkComplete>0</PercentWorkComplete>';
  tmplst.Add(linea);
  linea := '			<StandardRateFormat>2</StandardRateFormat>';
  tmplst.Add(linea);
  linea := '			<OvertimeRateFormat>2</OvertimeRateFormat> ';
  tmplst.Add(linea);
  linea := '			<ActualCost>0</ActualCost>';
  tmplst.Add(linea);
  linea := '			<WorkVariance>0.00</WorkVariance> ';
  tmplst.Add(linea);
  linea := '			<SV>0.00</SV>';
  tmplst.Add(linea);
  linea := '			<CV>0.00</CV> ';
  tmplst.Add(linea);
  linea := '			<ACWP>0.00</ACWP>';
  tmplst.Add(linea);
  linea := '			<CalendarUID>5</CalendarUID>';
  tmplst.Add(linea);
  linea := '			<BCWS>0.00</BCWS>';
  tmplst.Add(linea);
  linea := '			<BCWP>0.00</BCWP> ';
  tmplst.Add(linea);
  linea := '			<IsGeneric>0</IsGeneric> ';
  tmplst.Add(linea);
  linea := '			<IsInactive>0</IsInactive>';
  tmplst.Add(linea);
  linea := '			<IsEnterprise>0</IsEnterprise>';
  tmplst.Add(linea);
  linea := '			<BookingType>0</BookingType>';
  tmplst.Add(linea);
  linea := '			<IsCostResource>1</IsCostResource>';
  tmplst.Add(linea);
  linea := '			<IsBudget>0</IsBudget>';
  tmplst.Add(linea);
  linea := '		</Resource> ';
  tmplst.Add(linea);
  result := tmplst.Text;
end;

function addPRJResources(cuerpoBase: TStringList): TStringList;
var
  tmplst: TStringList;
  x, y, z: Integer;
  linea: string;
  tmpstr: string;
  fecha, hora: string;
  fechahora: string;
  tipo: string;
  Valor: string;
begin
  linea := '	<Resources>';
  tmplst := TStringList.Create;
  tmplst.Add(linea);
  fecha := FormatDateTime('yyyy-mm-dd', Now);
  hora := FormatDateTime('hh:nn:ss', Now);
  fechahora := fecha + 'T' + hora;
  y := 4;
  linea := addResourceIndirectos();
  tmplst.Add(linea);
  for x := 0 to length(listado_PRJRecursoLimpios) - 1 do
  begin
    tipo := listado_PRJRecursoLimpios[x].tipoRecursoPrj;
    if tipo = 'Trabajo' then
    begin
      tipo := '1';
    end;
    if tipo = 'Material' then
    begin
      tipo := '0';
    end;
    if tipo = 'Costo' then
    begin
      tipo := '3';
    end;

    case StrToInt(tipo) of
      0..1:
        begin
          Valor := listado_PRJRecursoLimpios[x].PrecioCosto;
          Valor := ReplaceStr(Valor, ',', '.');
          if listado_PRJRecursoLimpios[x].descripcion <> '' then
          begin
            linea := '		<Resource>';
            tmplst.Add(linea);
            linea := '			<UID>' + inttostr(y) + '</UID>';
            tmplst.Add(linea);
            listado_PRJRecursoLimpios[x].ResorceID := inttostr(y);
            linea := '			<GUID>' + listado_PRJRecursoLimpios[x].GUID +
              '</GUID>';
            tmplst.Add(linea);
            linea := '			<ID>' + inttostr(y) + '</ID>';
            tmplst.Add(linea);
            linea := '			<Name>' + listado_PRJRecursoLimpios[x].descripcion +
              '</Name>';
            tmplst.Add(linea);
            linea := '			<Code>' + listado_PRJRecursoLimpios[x].codUnicoRecurso +
              '</Code>';
            tmplst.Add(linea);
            linea := '			<Type>' + tipo + '</Type>';
            tmplst.Add(linea);
            linea := '			<IsNull>0</IsNull>';
            tmplst.Add(linea);
            linea := '			<Initials>' +
              UpperCase(leftstr(listado_PRJRecursoLimpios[x].descripcion, 1))
              + '</Initials>';
            tmplst.Add(linea);
            if tipo = '0' then
            begin
              linea := '			<MaterialLabel>' +
                listado_PRJRecursoLimpios[x].UMedida + '</MaterialLabel>';
              tmplst.Add(linea);
            end;
            if listado_PRJRecursoLimpios[x].Grupo <> '' then
            begin
              linea := '			<Group>' + listado_PRJRecursoLimpios[x].Grupo +
                '</Group>';
              tmplst.Add(linea);
            end;
            linea := '			<StandardRate>' + Valor + '</StandardRate>';
            tmplst.Add(linea);
            linea := '			<CalendarUID>1</CalendarUID>';
            tmplst.Add(linea);
            linea := '			<StandardRateFormat>2</StandardRateFormat>';
            tmplst.Add(linea);
            linea := '			<CalendarUID>' +
              listado_PRJRecursoLimpios[x].calendarioAsignado + '</CalendarUID>';
            tmplst.Add(linea);
            linea := '			<IsCostResource>0</IsCostResource>';
            tmplst.Add(linea);
            linea := '			<IsBudget>0</IsBudget>';
            tmplst.Add(linea);
            linea := '		</Resource>';
            tmplst.Add(linea);
            inc(y);
          end;
        end;
      3:
        begin
          Valor := listado_PRJRecursoLimpios[x].PrecioCosto;
          Valor := ReplaceStr(Valor, ',', '.');
          if listado_PRJRecursoLimpios[x].descripcion <> '' then
          begin

            linea := '		<Resource>';
            tmplst.Add(linea);
            linea := '			<UID>' + inttostr(y) + '</UID>';
            tmplst.Add(linea);
            listado_PRJRecursoLimpios[x].ResorceID := inttostr(y);
            linea := '			<GUID>' + listado_PRJRecursoLimpios[x].GUID +
              '</GUID>';
            tmplst.Add(linea);
            linea := '			<ID>' + inttostr(y) + '</ID>';
            tmplst.Add(linea);
            linea := '			<Name>' + listado_PRJRecursoLimpios[x].descripcion +
              '</Name>';
            tmplst.Add(linea);
            linea := '			<Code>' + listado_PRJRecursoLimpios[x].codUnicoRecurso +
              '</Code>';
            tmplst.Add(linea);
            linea := '			<Type>0</Type>';
            tmplst.Add(linea);
            linea := '			<IsNull>0</IsNull>';
            tmplst.Add(linea);
            linea := '			<Initials>' +
              UpperCase(leftstr(listado_PRJRecursoLimpios[x].descripcion, 1))
              + '</Initials>';
            tmplst.Add(linea);
            if listado_PRJRecursoLimpios[x].Grupo <> '' then
            begin
              linea := '			<Group>' + listado_PRJRecursoLimpios[x].Grupo +
                '</Group>';
              tmplst.Add(linea);
            end;
            linea := '			<CalendarUID>1</CalendarUID>';
            tmplst.Add(linea);
            linea := '			<StandardRateFormat>2</StandardRateFormat>';
            tmplst.Add(linea);
            linea := '			<CalendarUID>' +
              listado_PRJRecursoLimpios[x].calendarioAsignado + '</CalendarUID>';
            tmplst.Add(linea);
            linea := '			<IsCostResource>1</IsCostResource>';
            tmplst.Add(linea);
            linea := '			<IsBudget>0</IsBudget>';
            tmplst.Add(linea);
            linea := '			<PeakUnits>0.00</PeakUnits>';
            tmplst.Add(linea);
            linea := '			<OverAllocated>0</OverAllocated>';
            tmplst.Add(linea);
            linea := '			<CanLevel>0</CanLevel>';
            tmplst.Add(linea);
            linea := '			<AccrueAt>3</AccrueAt>';
            tmplst.Add(linea);
            linea := '			<OvertimeWork>PT0H0M0S</OvertimeWork>';
            tmplst.Add(linea);
            linea := '			<ActualOvertimeWork>PT0H0M0S</ActualOvertimeWork>';
            tmplst.Add(linea);
            linea :=
              '			<RemainingOvertimeWork>PT0H0M0S</RemainingOvertimeWork>';
            tmplst.Add(linea);
            linea := '			<PercentWorkComplete>0</PercentWorkComplete>';
            tmplst.Add(linea);
            linea := '			<OvertimeRateFormat>2</OvertimeRateFormat>';
            tmplst.Add(linea);
            linea := '			<ActualCost>0</ActualCost>';
            tmplst.Add(linea);
            linea := '			<WorkVariance>0.00</WorkVariance>';
            tmplst.Add(linea);
            linea := '			<SV>0.00</SV>';
            tmplst.Add(linea);
            linea := '			<CV>0.00</CV>';
            tmplst.Add(linea);
            linea := '			<ACWP>0.00</ACWP>';
            tmplst.Add(linea);
            linea := '			<BCWS>0.00</BCWS>';
            tmplst.Add(linea);
            linea := '			<BCWP>0.00</BCWP>';
            tmplst.Add(linea);
            linea := '			<IsGeneric>0</IsGeneric>';
            tmplst.Add(linea);
            linea := '			<IsInactive>0</IsInactive>';
            tmplst.Add(linea);
            linea := '			<IsEnterprise>0</IsEnterprise>';
            tmplst.Add(linea);
            linea := '			<BookingType>0</BookingType>';
            tmplst.Add(linea);

            linea := '		</Resource>';
            tmplst.Add(linea);
            inc(y);
          end;
        end;
    end;
  end;
  linea := '   </Resources>';
  tmplst.Add(linea);
  tmplst.Text := ReplaceStr(tmplst.Text, Chr(9), '   ');
  cuerpoBase.Add(tmplst.Text);
  result := cuerpoBase;
end;

function dialaborables(inicio, fin: TDateTime; horasJornada: Integer): string;
var
  Valor: Double;
  finSemana: Integer;
  x: Integer;
begin
  result := '';
  Valor := DaysBetween(inicio, fin);
  finSemana := 0;
  while inicio < fin do
  begin
    x := DayOfWeek(inicio);
    if (x = 1) or (x = 7) then
      inc(finSemana);
    inicio := IncDay(inicio, 1);
  end;
  Valor := Valor - finSemana;
  Valor := Valor * horasJornada;
  result := FloatToStr(Valor);
end;

procedure crearPRJRecursosLimpios();
var
  tmplst: TStringList;
  x, y, z: Integer;
  tmpstr: string;
begin
  tmplst := TStringList.Create;
  y := 0;
  for x := 0 to length(listado_PRJRecurso) - 1 do
  begin
    tmpstr := listado_PRJRecurso[x].descripcion;
    tmplst.Sort;
    if not tmplst.Find(tmpstr, z) then
    begin
      tmplst.Add(tmpstr);
      SetLength(listado_PRJRecursoLimpios, y + 1);
      listado_PRJRecursoLimpios[y].UID := listado_PRJRecurso[x].UID;
      listado_PRJRecursoLimpios[y].GUID := listado_PRJRecurso[x].GUID;
      listado_PRJRecursoLimpios[y].descripcion :=
        listado_PRJRecurso[x].descripcion;
      listado_PRJRecursoLimpios[y].tipoRecurso :=
        listado_PRJRecurso[x].tipoRecurso;
      listado_PRJRecursoLimpios[y].tipoRecursoPrj :=
        listado_PRJRecurso[x].tipoRecursoPrj;
      listado_PRJRecursoLimpios[y].PrecioCosto :=
        listado_PRJRecurso[x].PrecioCosto;
      listado_PRJRecursoLimpios[y].UMedida := listado_PRJRecurso[x].UMedida;
      listado_PRJRecursoLimpios[y].Grupo := listado_PRJRecurso[x].Grupo;
      listado_PRJRecursoLimpios[y].codUnicoRecurso :=
        listado_PRJRecurso[x].codUnicoRecurso;
      inc(y);
    end;
  end;
end;

procedure adicionaGRUPO();
var
  qry: TUniQuery;
  x: Integer;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from categoriaApus where categoria_base=:categoria_Base and ciu=:Ciu and codbase='
        + quotedstr(base_activa.codBase));
      Prepare;
      for x := 0 to length(listado_PRJRecurso) - 1 do
      begin
        ParamByName('categoria_base').AsString :=
          listado_PRJRecurso[x].categoriaBase;
        ParamByName('ciu').AsString := listado_PRJRecurso[x].subCategoria;
        ExecSQL;
        tmpstr := FieldByName('descripcion').AsString;
        listado_PRJRecurso[x].Grupo := tmpstr;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure crearPRJRecursos();
var
  qry: TUniQuery;
  x: Integer;
  y: Integer;
  valTmp: Integer;
  tipoRecurso: Integer;
  idUnicoRecurso: string;
  SQLText: string;
  listadoTemporal: array of dat_PRJRecursos;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      SQLText := 'SELECT' + '  items.CodCategoria,' + '  items.idUnicoRecurso,'
        +
        '  items.codSubCategoria,' + '  items.Descripcion,' +
          '  items.codSubCategoria,' +
        '  items.unidad,' + 'IF' +
        '  ( tanteo.precio IS NULL, items.precio, tanteo.precio ) AS precio,' + 'IF'
          +
        '  ( tanteo.precio IS NULL, items.CantidadUnidad, tanteo.CantidadUnidad ) AS CantidadUnidad,' +
        'IF' + '  ( tanteo.Precio, items.rendimiento, tanteo.rendimiento ) AS Rendimiento,'
          + 'IF' +
        '  ( tanteo.Precio, items.Total, tanteo.Total ) AS Total ' + 'FROM' +
          '  apus_items items' +
        '  LEFT JOIN presupuestos_tanteo_recursos tanteo ON (' + '    tanteo.CodAPU = items.CodAPU '
        + '    AND tanteo.codBase = items.codBase ' +
        '    AND tanteo.idUnicoRecurso = items.idUnicoRecurso ' +
        '    AND tanteo.revision =  :revision ' + '    AND tanteo.codPresupuesto =  :codPresupuesto ) '
        + 'WHERE' + '  items.CodAPU = :codAPU ' +
          '  AND items.codBase =  :codBase ';
      sql.Add(SQLText);

      y := 0;
      for x := 0 to length(listado_PRJAPU) - 1 do
      begin
        ParamByName('codAPU').AsString := listado_PRJAPU[x].codAPU;
        ParamByName('codPresupuesto').AsString := codProyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codBase').AsString := base_activa.codBase;
        Prepare;
        ExecSQL;
        while not Eof do
        begin
          tipoRecurso := FieldByName('codCategoria').AsInteger;
          case tipoRecurso of
            1..2:
              begin
                SetLength(listado_PRJRecurso, y + 1);
                listado_PRJRecurso[y].UID := inttostr(y);
                listado_PRJRecurso[y].GUID := generaGUID;
                listado_PRJRecurso[y].descripcion :=
                  FieldByName('Descripcion').AsString;
                listado_PRJRecurso[y].PrecioCosto :=
                  FieldByName('precio').AsString;
                valTmp := FieldByName('codCategoria').AsInteger;
                listado_PRJRecurso[y].categoriaBase := inttostr(valTmp);
                listado_PRJRecurso[y].subCategoria :=
                  FieldByName('codSubCategoria').AsString;
                listado_PRJRecurso[y].tipoRecurso := tipo_de_recurso[valTmp];
                if (valTmp = 1) or (valTmp = 4) then
                  listado_PRJRecurso[y].tipoRecursoPrj := 'Trabajo';
                if (valTmp = 2) or (valTmp = 5) then
                begin
                  listado_PRJRecurso[y].tipoRecursoPrj := 'Material';
                  listado_PRJRecurso[y].UMedida :=
                    FieldByName('unidad').AsString;
                end;
                if valTmp = 3 then
                begin
                  listado_PRJRecurso[y].tipoRecursoPrj := 'Costo';
                end;

                listado_PRJRecurso[y].codUnicoRecurso :=
                  FieldByName('idUnicoRecurso').AsString;
                Next;
                inc(y);
              end;
            3:
              begin
                SetLength(listado_PRJRecurso, y + 1);
                listado_PRJRecurso[y].UID := inttostr(y);
                listado_PRJRecurso[y].GUID := generaGUID;
                listado_PRJRecurso[y].descripcion :=
                  FieldByName('Descripcion').AsString;
                listado_PRJRecurso[y].PrecioCosto :=
                  FieldByName('precio').AsString;
                listado_PRJRecurso[y].categoriaBase :=
                  FieldByName('codCategoria').AsString;
                listado_PRJRecurso[y].subCategoria :=
                  FieldByName('codSubCategoria').AsString;
                listado_PRJRecurso[y].tipoRecursoPrj := 'Costo';
                listado_PRJRecurso[y].codUnicoRecurso :=
                  FieldByName('idUnicoRecurso').AsString;
                Next;
                inc(y);
              end;
            4..5:
              begin
                SetLength(listado_PRJRecurso, y + 1);
                listado_PRJRecurso[y].UID := inttostr(y);
                listado_PRJRecurso[y].GUID := generaGUID;
                listado_PRJRecurso[y].descripcion :=
                  FieldByName('Descripcion').AsString;
                listado_PRJRecurso[y].PrecioCosto :=
                  FieldByName('precio').AsString;
                valTmp := FieldByName('codCategoria').AsInteger;
                listado_PRJRecurso[y].categoriaBase := inttostr(valTmp);
                listado_PRJRecurso[y].subCategoria :=
                  FieldByName('codSubCategoria').AsString;
                listado_PRJRecurso[y].tipoRecurso := tipo_de_recurso[valTmp];
                if (valTmp = 1) or (valTmp = 4) then
                  listado_PRJRecurso[y].tipoRecursoPrj := 'Trabajo';
                if (valTmp = 2) or (valTmp = 5) then
                begin
                  listado_PRJRecurso[y].tipoRecursoPrj := 'Material';
                  listado_PRJRecurso[y].UMedida :=
                    FieldByName('unidad').AsString;
                end;
                if valTmp = 3 then
                begin
                  listado_PRJRecurso[y].tipoRecursoPrj := 'Costo';
                end;

                listado_PRJRecurso[y].codUnicoRecurso :=
                  FieldByName('idUnicoRecurso').AsString;
                Next;
                inc(y);
              end;
            6:
              begin
                idUnicoRecurso := FieldByName('idUnicoRecurso').AsString;
                entradaRecursivaRecursos(idUnicoRecurso);
                y := length(listado_PRJRecurso);
                Next;
              end;
          end;
        end;
      end;
    end;
  finally
    qry.Free;
  end;
  adicionaGRUPO();
end;

procedure entradaRecursivaRecursos(idUnicoRecurso: string);
var
  qry: TUniQuery;
  y: Integer;
  tipoRecurso: Integer;
  valTmp: Integer;
begin
  y := length(listado_PRJRecurso);
  idUnicoRecurso := ReplaceStr(idUnicoRecurso, 'APU: ', '');
  qry := TUniQuery.Create(nil);
  qry.Connection := DModule_1.con2;
  try
    with qry do
    begin
      close;
      sql.Clear;
      sql.Add('select * from Apus_Items where codAPU=' +
        quotedstr(idUnicoRecurso) + ' and codBase='
        + quotedstr(base_activa.codBase));
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        tipoRecurso := FieldByName('codCategoria').AsInteger;
        case tipoRecurso of
          1..5:
            begin
              SetLength(listado_PRJRecurso, y + 1);
              listado_PRJRecurso[y].UID := inttostr(y);
              listado_PRJRecurso[y].GUID := generaGUID;
              listado_PRJRecurso[y].descripcion :=
                FieldByName('Descripcion').AsString;
              listado_PRJRecurso[y].PrecioCosto :=
                FieldByName('precio').AsString;
              valTmp := FieldByName('codCategoria').AsInteger;
              listado_PRJRecurso[y].categoriaBase := inttostr(valTmp);
              listado_PRJRecurso[y].subCategoria :=
                FieldByName('codSubCategoria').AsString;
              listado_PRJRecurso[y].tipoRecurso := tipo_de_recurso[valTmp];
              if (valTmp = 1) or (valTmp = 3) or (valTmp = 4) then
                listado_PRJRecurso[y].tipoRecursoPrj := 'Trabajo';
              if (valTmp = 2) or (valTmp = 5) then
              begin
                listado_PRJRecurso[y].tipoRecursoPrj := 'Material';
                listado_PRJRecurso[y].UMedida := FieldByName('unidad').AsString;
              end;
              listado_PRJRecurso[y].codUnicoRecurso :=
                FieldByName('idUnicoRecurso').AsString;
              Next;
              inc(y);
            end;
          6:
            begin
              idUnicoRecurso := FieldByName('idUnicoRecurso').AsString;
              entradaRecursivaRecursos(idUnicoRecurso);
              y := length(listado_PRJRecurso);
              Next;
            end;
        end;
      end;
    end;
  finally

  end;
end;

procedure crearPRJAPUS();
var
  x, y, z: Integer;
  tmpstr: string;
  codEDT: string;
begin
  y := 0;
  z := 0;
  SetLength(listado_PRJTasks, z + 1);
  listado_PRJTasks[z].GUID := generaGUID;
  listado_PRJTasks[z].tipo := 'edt';
  listado_PRJTasks[z].codEDT := '0';
  listado_PRJTasks[z].descripcion := frmMain.edt_descripcionPresupuesto.Text;
  inc(z);
  for x := 1 to frmMain.grid_Presupuestos.RowCount - 1 do
  begin
    with DMPresupuesto.dsTpresupuestosItems.DataSet do
    begin
      DisableControls;
      First;
      MoveBy(x - 1);
      EnableControls;
    end;
    tmpstr := DMPresupuesto.QTPresupuestosItems.FieldByName('codEDT').AsString;
    // generar listado APUS
    if tmpstr <> '' then
    begin
      codEDT := tmpstr;
    end
    else
    begin
      SetLength(listado_PRJAPU, y + 1);
      listado_PRJAPU[y].codEDT := codEDT;
      listado_PRJAPU[y].descripcion :=
        DMPresupuesto.QTPresupuestosItems.FieldByName('descripcion').AsString;
      listado_PRJAPU[y].costo :=
        DMPresupuesto.QTPresupuestosItems.FieldByName('Ptotal').AsString;
      listado_PRJAPU[y].codAPU :=
        DMPresupuesto.QTPresupuestosItems.FieldByName('codAPU').AsString;
      listado_PRJAPU[y].codItem :=
        DMPresupuesto.QTPresupuestosItems.FieldByName('codItems').AsString;
      listado_PRJAPU[y].cantidad :=
        DMPresupuesto.QTPresupuestosItems.FieldByName('Cantidad').AsString;
      listado_PRJAPU[y].UMedida :=
        DMPresupuesto.QTPresupuestosItems.FieldByName('unidad').AsString;
      listado_PRJAPU[y].GUID := generaGUID;
      inc(y);
    end;

    // generar Listado Tasks
    SetLength(listado_PRJTasks, z + 1);
    listado_PRJTasks[z].GUID := generaGUID;
    listado_PRJTasks[z].codEDT := codEDT;
    listado_PRJTasks[z].descripcion :=
      DMPresupuesto.QTPresupuestosItems.FieldByName('descripcion').AsString;
    if tmpstr = '' then
    begin
      listado_PRJTasks[z].tipo := 'item';
      listado_PRJTasks[z].codItem :=
        DMPresupuesto.QTPresupuestosItems.FieldByName('codItems').AsString;
      listado_PRJTasks[z].descripcion :=
        DMPresupuesto.QTPresupuestosItems.FieldByName('descripcion').AsString;
      listado_PRJTasks[z].cantidad :=
        DMPresupuesto.QTPresupuestosItems.FieldByName('Cantidad').AsString;
      listado_PRJTasks[z].PrecioU :=
        DMPresupuesto.QTPresupuestosItems.FieldByName('PUnitario').AsString;
      listado_PRJTasks[z].PrecioT :=
        DMPresupuesto.QTPresupuestosItems.FieldByName('Ptotal').AsString;
    end
    else
    begin
      listado_PRJTasks[z].tipo := 'edt';
    end;
    inc(z);
  end;
  daCodUnicoRecursoAPU();
end;

function addPRJTaskCero(descripcion, GUID: string): string;
var
  linea: string;
  tmplst: TStringList;
  fechaCreacion, fechaInicio, fechaFin: string;
  horaslaborables: string;
  costototal: string;
begin
  tmplst := TStringList.Create;
  fechaCreacion := FormatDateTime('yyyy-mm-dd', Now) + 'T' +
    FormatDateTime('hh:nn:ss', Now);
  fechaInicio := FormatDateTime('yyyy-mm-dd',
    frmMain.dedt_PresentacionPresupuesto.Date) + 'T07:00:00';
  fechaFin := FormatDateTime('yyyy-mm-dd',
    frmMain.dedt_PresentacionPresupuesto.Date) + 'T15:00:00';
  horaslaborables := dialaborables(frmMain.dedt_PresentacionPresupuesto.Date,
    frmMain.dedt_PresentacionPresupuesto.Date,
    8);
  horaslaborables := 'PT' + horaslaborables + 'H0M0S';
  costototal := frmMain.lbl_SubtotalPresupuesto.Text;
  costototal := ReplaceStr(costototal, ',', '');
  costototal := ReplaceStr(costototal, '.', '');
  linea := '    <Task>';
  tmplst.Add(linea);
  linea := '			<UID>0</UID>';
  tmplst.Add(linea);
  linea := '			<GUID>' + GUID + '</GUID>';
  tmplst.Add(linea);
  linea := '			<ID>0</ID>';
  tmplst.Add(linea);
  linea := '			<Name>' + descripcion + '</Name>';
  tmplst.Add(linea);
  linea := '			<Active>1</Active>';
  tmplst.Add(linea);
  linea := '			<Manual>0</Manual>';
  tmplst.Add(linea);
  linea := '			<Type>1</Type>';
  tmplst.Add(linea);
  linea := '			<IsNull>0</IsNull>';
  tmplst.Add(linea);
  linea := '			<CreateDate>' + fechaCreacion + '</CreateDate>';
  tmplst.Add(linea);
  linea := '			<WBS>0</WBS>';
  tmplst.Add(linea);
  linea := '			<OutlineNumber>0</OutlineNumber>';
  tmplst.Add(linea);
  linea := '			<OutlineLevel>0</OutlineLevel>';
  tmplst.Add(linea);
  linea := '			<Priority>500</Priority>';
  tmplst.Add(linea);
  linea := '			<Start>' + fechaInicio + '</Start>';
  tmplst.Add(linea);
  linea := '			<Finish>' + fechaFin + '</Finish>';
  tmplst.Add(linea);
  linea := '			<Duration>' + horaslaborables + '</Duration>';
  tmplst.Add(linea);
  linea := '			<ManualStart>' + fechaInicio + '</ManualStart>';
  tmplst.Add(linea);
  linea := '			<ManualFinish>' + fechaFin + '</ManualFinish>';
  tmplst.Add(linea);
  linea := '			<ManualDuration>' + horaslaborables + '</ManualDuration>';
  tmplst.Add(linea);
  linea := '			<DurationFormat>53</DurationFormat>';
  tmplst.Add(linea);
  linea := '			<FreeformDurationFormat>39</FreeformDurationFormat>';
  tmplst.Add(linea);
  linea := '			<Work>' + horaslaborables + '</Work>';
  tmplst.Add(linea);
  linea := '			<ResumeValid>0</ResumeValid>';
  tmplst.Add(linea);
  linea := '			<EffortDriven>0</EffortDriven>';
  tmplst.Add(linea);
  linea := '			<Recurring>0</Recurring>';
  tmplst.Add(linea);
  linea := '			<OverAllocated>0</OverAllocated>';
  tmplst.Add(linea);
  linea := '			<Estimated>1</Estimated>';
  tmplst.Add(linea);
  linea := '			<Milestone>0</Milestone>';
  tmplst.Add(linea);
  linea := '			<Summary>1</Summary>';
  tmplst.Add(linea);
  linea := '			<DisplayAsSummary>0</DisplayAsSummary>';
  tmplst.Add(linea);
  linea := '			<Critical>1</Critical>';
  tmplst.Add(linea);
  linea := '			<IsSubproject>0</IsSubproject>';
  tmplst.Add(linea);
  linea := '			<IsSubprojectReadOnly>0</IsSubprojectReadOnly>';
  tmplst.Add(linea);
  linea := '			<ExternalTask>0</ExternalTask>';
  tmplst.Add(linea);
  linea := '			<EarlyStart>' + fechaInicio + '</EarlyStart>';
  tmplst.Add(linea);
  linea := '			<EarlyFinish>' + fechaFin + '</EarlyFinish>';
  tmplst.Add(linea);
  linea := '			<LateStart>' + fechaInicio + '</LateStart>';
  tmplst.Add(linea);
  linea := '			<LateFinish>' + fechaFin + '</LateFinish>';
  tmplst.Add(linea);
  linea := '			<StartVariance>0</StartVariance>';
  tmplst.Add(linea);
  linea := '			<FinishVariance>0</FinishVariance>';
  tmplst.Add(linea);
  linea := '			<WorkVariance>37067000.00</WorkVariance>';
  tmplst.Add(linea);
  linea := '			<FreeSlack>0</FreeSlack>';
  tmplst.Add(linea);
  linea := '			<TotalSlack>0</TotalSlack>';
  tmplst.Add(linea);
  linea := '			<StartSlack>0</StartSlack>';
  tmplst.Add(linea);
  linea := '			<FinishSlack>0</FinishSlack>';
  tmplst.Add(linea);
  linea := '			<FixedCost>0</FixedCost>';
  tmplst.Add(linea);
  linea := '			<FixedCostAccrual>3</FixedCostAccrual>';
  tmplst.Add(linea);
  linea := '			<PercentComplete>0</PercentComplete>';
  tmplst.Add(linea);
  linea := '			<PercentWorkComplete>0</PercentWorkComplete>';
  tmplst.Add(linea);
  linea := '			<Cost>' + costototal + '</Cost>';
  tmplst.Add(linea);
  linea := '			<OvertimeCost>0</OvertimeCost>';
  tmplst.Add(linea);
  linea := '			<OvertimeWork>PT0H0M0S</OvertimeWork>';
  tmplst.Add(linea);
  linea := '			<ActualDuration>PT0H0M0S</ActualDuration>';
  tmplst.Add(linea);
  linea := '			<ActualCost>0</ActualCost>';
  tmplst.Add(linea);
  linea := '			<ActualOvertimeCost>0</ActualOvertimeCost>';
  tmplst.Add(linea);
  linea := '			<ActualWork>PT0H0M0S</ActualWork>';
  tmplst.Add(linea);
  linea := '			<ActualOvertimeWork>PT0H0M0S</ActualOvertimeWork>';
  tmplst.Add(linea);
  linea := '			<RegularWork>' + horaslaborables + '</RegularWork>';
  tmplst.Add(linea);
  linea := '			<RemainingDuration>' + horaslaborables + '</RemainingDuration>';
  tmplst.Add(linea);
  linea := '			<RemainingCost>' + costototal + '</RemainingCost>';
  tmplst.Add(linea);
  linea := '			<RemainingWork>' + horaslaborables + '</RemainingWork>';
  tmplst.Add(linea);
  linea := '			<RemainingOvertimeCost>0</RemainingOvertimeCost>';
  tmplst.Add(linea);
  linea := '			<RemainingOvertimeWork>PT0H0M0S</RemainingOvertimeWork>';
  tmplst.Add(linea);
  linea := '			<ACWP>0.00</ACWP>';
  tmplst.Add(linea);
  linea := '			<CV>0.00</CV>';
  tmplst.Add(linea);
  linea := '			<ConstraintType>0</ConstraintType>';
  tmplst.Add(linea);
  linea := '			<CalendarUID>-1</CalendarUID>';
  tmplst.Add(linea);
  linea := '			<LevelAssignments>1</LevelAssignments>';
  tmplst.Add(linea);
  linea := '			<LevelingCanSplit>1</LevelingCanSplit>';
  tmplst.Add(linea);
  linea := '			<LevelingDelay>0</LevelingDelay>';
  tmplst.Add(linea);
  linea := '			<LevelingDelayFormat>8</LevelingDelayFormat>';
  tmplst.Add(linea);
  linea := '			<IgnoreResourceCalendar>0</IgnoreResourceCalendar>';
  tmplst.Add(linea);
  linea := '			<HideBar>0</HideBar>';
  tmplst.Add(linea);
  linea := '			<Rollup>0</Rollup>';
  tmplst.Add(linea);
  linea := '			<BCWS>0.00</BCWS>';
  tmplst.Add(linea);
  linea := '			<BCWP>0.00</BCWP>';
  tmplst.Add(linea);
  linea := '			<PhysicalPercentComplete>0</PhysicalPercentComplete>';
  tmplst.Add(linea);
  linea := '			<EarnedValueMethod>0</EarnedValueMethod>';
  tmplst.Add(linea);
  linea := '			<IsPublished>0</IsPublished>';
  tmplst.Add(linea);
  linea := '			<CommitmentType>0</CommitmentType>';
  tmplst.Add(linea);
  linea := '			<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '				<FieldID>188744006</FieldID>';
  tmplst.Add(linea);
  linea := '				<Value>0</Value>';
  tmplst.Add(linea);
  linea := '			</ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '		</Task>';
  tmplst.Add(linea);
  result := tmplst.Text;
end;

procedure daCodUnicoRecursoAPU();
var
  qry: TUniQuery;
  x: Integer;
  tmpstr: string;
  valTmp: Integer;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from APUS_Items where codAPU=:codAPU and codBase=' +
        quotedstr(base_activa.codBase));
      Prepare;
      for x := 0 to length(listado_PRJAPU) - 1 do
      begin
        ParamByName('codAPU').AsString := listado_PRJAPU[x].codAPU;
        ExecSQL;
        tmpstr := FieldByName('idUnicoRecurso').AsString;
        listado_PRJAPU[x].codUnicoRecursos := tmpstr;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure crearPRJEDT();
var
  nodo: TTMSFNCTreeViewNode;
  x: Integer;
begin
  nodo := frmMain.Trvw_EDT.Nodes[0];
  x := 0;
  while nodo <> nil do
  begin
    SetLength(listado_PRJEDT, x + 1);
    if nodo.Text[0] <> '' then
    begin
      listado_PRJEDT[x].codEDT := nodo.Text[0];
      listado_PRJEDT[x].descripcion := nodo.Text[1];
      listado_PRJEDT[x].GUID := generaGUID;
      inc(x);
    end;
    nodo := frmMain.Trvw_EDT.GetNextNode(nodo);
  end;
end;

function crearCalendarios(cuerpoBase: TStringList; FInicio, FFin: TDate):
  TStringList;
var
  tmplst: TStringList;
  linea: string;
begin
  tmplst := TStringList.Create;
  linea := '	<Calendars>';
  tmplst.Add(linea);
  linea := addCalendarioPrincipal();
  tmplst.Add(linea);
  linea := '	</Calendars>';
  tmplst.Add(linea);
  tmplst.Text := ReplaceStr(tmplst.Text, Chr(9), '   ');
  cuerpoBase.Add(tmplst.Text);
  result := cuerpoBase;
end;

function numeroPuntos(Datos: string): Integer;
var
  x: Integer;
begin
  result := 0;
  for x := 0 to length(Datos) - 1 do
  begin
    if MidStr(Datos, x, 1) = '.' then
      inc(result);
  end;
end;

function addTaks1PRJ(cuerpoBase: TStringList): TStringList;
var
  tmplst: TStringList;
  linea: string;
  x, y: Integer;
  tmpstr: string;
  wbs: string;
begin
  tmplst := TStringList.Create;
  linea := '	<Tasks>';
  tmplst.Add(linea);
  y := 1;
  for x := 1 to frmMain.grid_crono01.RowCount - 1 do
  begin
    tmpstr := frmMain.grid_crono01.Cells[2, x];
    if tmpstr = '' then
    begin
      // EDT
      linea := addtaksEDT(x, y);
      tmplst.Add(linea);
    end
    else
    begin
      // Item Presupuesto
      linea := addtaksItem(x, y);
      tmplst.Add(linea);
      frmMain.grid_crono01.Cells[15, x] := inttostr(y);
    end;
    inc(y);
  end;
  linea := '	</Tasks>';
  tmplst.Add(linea);
  tmplst.Text := ReplaceStr(tmplst.Text, Chr(9), '   ');
  cuerpoBase.Add(tmplst.Text);
  result := cuerpoBase;
end;

function addtaksEDT(Posgrid: Integer; Id: Integer): string;
var
  tmplst: TStringList;
  linea: string;
  fechaInicio: string;
  fechaCreacion: string;
  fechaTerminacion: string;
  fecha1: TDate;
  hora1: TTime;
  horaInicio: string;
  duracion: string;
  x: Integer;
  codEDT: string;
  horasTarea: Double;
  minutosTarea: Double;
  segundosTarea: Double;
  tmpstr: string;
begin
  tmplst := TStringList.Create;
  tmpstr := frmMain.lbl_cronoFechaInicio1.Text;
  codEDT := frmMain.grid_crono01.Cells[0, Posgrid];
  x := 1 + numeroPuntos(codEDT);
  linea := '		  <Task>';
  tmplst.Add(linea);
  linea := '			<UID>' + inttostr(Id) + '</UID>';
  tmplst.Add(linea);
  linea := '			<GUID>' + generaGUID + '</GUID>';
  tmplst.Add(linea);
  linea := '			<ID>' + inttostr(Id) + '</ID>';
  tmplst.Add(linea);
  linea := '			<Name>' + frmMain.grid_crono01.Cells[3, Posgrid] + '</Name>';
  tmplst.Add(linea);
  linea := '			<Active>1</Active>';
  tmplst.Add(linea);
  linea := '			<Manual>0</Manual> ';
  tmplst.Add(linea);
  {
    Valores Type
    0: Unidades Fijas  Correcta Benito
    1: Duración Fija
    2:Trabajo Fijo
  }
  linea := '			<Type>1</Type>';
  tmplst.Add(linea);
  linea := '			<IsNull>0</IsNull>';
  tmplst.Add(linea);
  linea := '			<OutlineLevel>' + inttostr(x) + '</OutlineLevel>';
  tmplst.Add(linea);
  linea := '			<Priority>500</Priority>';
  tmplst.Add(linea);
  linea := '			<DurationFormat>21</DurationFormat>';
  tmplst.Add(linea);
  linea := '			<FreeformDurationFormat>21</FreeformDurationFormat>';
  tmplst.Add(linea);
  linea := '			<ResumeValid>0</ResumeValid>';
  tmplst.Add(linea);
  linea := '			<EffortDriven>0</EffortDriven>';
  tmplst.Add(linea);
  linea := '			<Recurring>0</Recurring>';
  tmplst.Add(linea);
  linea := '			<OverAllocated>0</OverAllocated>';
  tmplst.Add(linea);
  linea := '			<Estimated>0</Estimated>';
  tmplst.Add(linea);
  linea := '			<Milestone>0</Milestone>';
  tmplst.Add(linea);
  linea := '			<Summary>1</Summary>';
  tmplst.Add(linea);
  linea := '			<DisplayAsSummary>0</DisplayAsSummary>';
  tmplst.Add(linea);
  linea := '			<Critical>1</Critical>';
  tmplst.Add(linea);
  linea := '			<IsSubproject>0</IsSubproject>';
  tmplst.Add(linea);
  linea := '			<IsSubprojectReadOnly>0</IsSubprojectReadOnly>';
  tmplst.Add(linea);
  linea := '			<ExternalTask>0</ExternalTask>';
  tmplst.Add(linea);
  linea := '			<StartVariance>0</StartVariance>';
  tmplst.Add(linea);
  linea := '			<FinishVariance>0</FinishVariance>';
  tmplst.Add(linea);
  linea := '			<FreeSlack>0</FreeSlack>';
  tmplst.Add(linea);
  linea := '			<TotalSlack>0</TotalSlack>';
  tmplst.Add(linea);
  linea := '			<StartSlack>0</StartSlack>';
  tmplst.Add(linea);
  linea := '			<FinishSlack>0</FinishSlack>';
  tmplst.Add(linea);
  linea := '			<FixedCostAccrual>3</FixedCostAccrual>';
  tmplst.Add(linea);
  linea := '			<PercentComplete>0</PercentComplete>';
  tmplst.Add(linea);
  linea := '			<PercentWorkComplete>0</PercentWorkComplete>';
  tmplst.Add(linea);
  linea := '			<ACWP>0.00</ACWP>';
  tmplst.Add(linea);
  linea := '			<CV>0.00</CV>';
  tmplst.Add(linea);
  linea := '			<ConstraintType>0</ConstraintType>';
  tmplst.Add(linea);
  linea := '			<CalendarUID>-1</CalendarUID>';
  tmplst.Add(linea);
  linea := '			<LevelAssignments>1</LevelAssignments> ';
  tmplst.Add(linea);
  linea := '			<LevelingCanSplit>1</LevelingCanSplit> ';
  tmplst.Add(linea);
  linea := '			<LevelingDelay>0</LevelingDelay>';
  tmplst.Add(linea);
  linea := '			<LevelingDelayFormat>8</LevelingDelayFormat>';
  tmplst.Add(linea);
  linea := '			<IgnoreResourceCalendar>0</IgnoreResourceCalendar>';
  tmplst.Add(linea);
  linea := '			<HideBar>0</HideBar>';
  tmplst.Add(linea);
  linea := '			<Rollup>1</Rollup>';
  tmplst.Add(linea);
  linea := '			<BCWS>0.00</BCWS>';
  tmplst.Add(linea);
  linea := '			<BCWP>0.00</BCWP>';
  tmplst.Add(linea);
  linea := '			<PhysicalPercentComplete>0</PhysicalPercentComplete>';
  tmplst.Add(linea);
  linea := '			<EarnedValueMethod>0</EarnedValueMethod>';
  tmplst.Add(linea);
  linea := '			<IsPublished>0</IsPublished>';
  tmplst.Add(linea);
  linea := '			<CommitmentType>0</CommitmentType>';
  tmplst.Add(linea);
  linea := '			<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '				<FieldID>188743731</FieldID>';
  tmplst.Add(linea);
  linea := '				<Value>' + codEDT + '</Value>';
  tmplst.Add(linea);
  linea := '			</ExtendedAttribute>';
  tmplst.Add(linea);
  /// ///////////////////////////   2   Costo Presupuesto
  linea := '			<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '				<FieldID>188743786</FieldID>';
  tmplst.Add(linea);
  tmpstr := frmMain.grid_crono01.Cells[7, Posgrid];
  tmpstr := AnsiReplaceStr(tmpstr, base_activa.simboloMoneda, '').Trim;
  tmpstr := quitaSignoMiles(tmpstr);
  tmpstr := valorStandartProject(tmpstr);
  linea := '				<Value>' + tmpstr + '</Value>';
  tmplst.Add(linea);
  linea := '			</ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '		</Task>';
  tmplst.Add(linea);
  result := tmplst.Text;
end;

function addtaksItem(Posgrid: Integer; Id: Integer): string;
var
  tmplst: TStringList;
  linea: string;
  duracion: string;
  x: Integer;
  codItems: string;
  tmpstr: string;
  horasTarea: Double;
  minutosTarea: Double;
  segundosTarea: Double;
  tmpval: Double;
  HorasDias: Integer;
begin
  tmplst := TStringList.Create;
  HorasDias := StrToInt(frmMain.edt_HorasJornada.Text);
  codItems := frmMain.grid_crono01.Cells[1, Posgrid];
  tmpstr := frmMain.grid_calcTiempos.Cells[2, Posgrid - 1];
  tmpstr := decimal_correcto(tmpstr);
  horasTarea := StrToFloat(tmpstr);
  minutosTarea := Frac(horasTarea);
  horasTarea := trunc(horasTarea);
  minutosTarea := minutosTarea * 60;
  segundosTarea := Frac(minutosTarea);
  minutosTarea := trunc(minutosTarea);
  segundosTarea := segundosTarea * 60;
  segundosTarea := trunc(segundosTarea);
  x := 1 + numeroPuntos(frmMain.grid_crono01.Cells[1, Posgrid]);
  linea := '		<Task>';
  tmplst.Add(linea);
  linea := '			<UID>' + inttostr(Id) + '</UID>';
  tmplst.Add(linea);
  linea := '			<GUID>' + generaGUID + '</GUID> ';
  tmplst.Add(linea);
  linea := '			<ID>' + inttostr(Id) + '</ID>';
  tmplst.Add(linea);
  linea := '			<Name>' + frmMain.grid_crono01.Cells[3, Posgrid] + '</Name>';
  tmplst.Add(linea);
  linea := '			<Active>1</Active>';
  tmplst.Add(linea);
  linea := '			<Manual>0</Manual>';
  tmplst.Add(linea);
  {
    Valores Type
    0: Unidades Fijas
    1: Duración Fija
    2: Trabajo Fijo
  }
  linea := '			<Type>2</Type>';
  tmplst.Add(linea);
  linea := '			<IsNull>0</IsNull>';
  tmplst.Add(linea);
  linea := '			<OutlineLevel>' + inttostr(x) + '</OutlineLevel>';
  tmplst.Add(linea);
  linea := '			<Priority>500</Priority>';
  tmplst.Add(linea);
  linea := '			<Duration>PT' + FloatToStr(horasTarea) + 'H' +
    FloatToStr(minutosTarea) + 'M' +
    FloatToStr(segundosTarea) + 'S</Duration>';
  tmplst.Add(linea);
  linea := '			<ManualDuration>PT' + FloatToStr(horasTarea) + 'H' +
    FloatToStr(minutosTarea) + 'M' +
    FloatToStr(segundosTarea) + 'S</ManualDuration>';
  tmplst.Add(linea);
  if horasTarea > HorasDias then
    linea := '			<DurationFormat>7</DurationFormat>'
  else
    linea := '			<DurationFormat>21</DurationFormat>';
  tmplst.Add(linea);
  linea := '			<FreeformDurationFormat>7</FreeformDurationFormat>';
  tmplst.Add(linea);
  linea := '			<ResumeValid>0</ResumeValid>';
  tmplst.Add(linea);
  linea := '			<EffortDriven>0</EffortDriven>';
  tmplst.Add(linea);
  linea := '			<Recurring>0</Recurring>';
  tmplst.Add(linea);
  linea := '			<OverAllocated>0</OverAllocated>';
  tmplst.Add(linea);
  linea := '			<Estimated>0</Estimated>';
  tmplst.Add(linea);
  linea := '			<Milestone>0</Milestone>';
  tmplst.Add(linea);
  linea := '			<Summary>0</Summary>';
  tmplst.Add(linea);
  linea := '			<DisplayAsSummary>0</DisplayAsSummary>';
  tmplst.Add(linea);
  linea := '			<Critical>0</Critical>';
  tmplst.Add(linea);
  linea := '			<IsSubproject>0</IsSubproject>';
  tmplst.Add(linea);
  linea := '			<IsSubprojectReadOnly>0</IsSubprojectReadOnly>';
  tmplst.Add(linea);
  linea := '			<ExternalTask>0</ExternalTask>';
  tmplst.Add(linea);
  linea := '			<StartVariance>0</StartVariance>';
  tmplst.Add(linea);
  linea := '			<FinishVariance>0</FinishVariance>';
  tmplst.Add(linea);
  linea := '			<FreeSlack>0</FreeSlack>';
  tmplst.Add(linea);
  linea := '			<TotalSlack>0</TotalSlack>';
  tmplst.Add(linea);
  linea := '			<StartSlack>0</StartSlack>';
  tmplst.Add(linea);
  linea := '			<FinishSlack>0</FinishSlack>';
  tmplst.Add(linea);
  linea := '			<FixedCost>0</FixedCost>';
  tmplst.Add(linea);
  linea := '			<FixedCostAccrual>3</FixedCostAccrual>';
  tmplst.Add(linea);
  linea := '			<PercentComplete>0</PercentComplete>';
  tmplst.Add(linea);
  linea := '			<PercentWorkComplete>0</PercentWorkComplete>';
  tmplst.Add(linea);
  linea := '			<ACWP>0.00</ACWP>';
  tmplst.Add(linea);
  linea := '			<CV>0.00</CV>';
  tmplst.Add(linea);
  linea := '			<ConstraintType>0</ConstraintType> ';
  tmplst.Add(linea);
  linea := '			<CalendarUID>-1</CalendarUID>';
  tmplst.Add(linea);
  linea := '			<LevelAssignments>1</LevelAssignments>';
  tmplst.Add(linea);
  linea := '			<LevelingCanSplit>1</LevelingCanSplit>';
  tmplst.Add(linea);
  linea := '			<LevelingDelay>0</LevelingDelay>';
  tmplst.Add(linea);
  linea := '			<LevelingDelayFormat>8</LevelingDelayFormat> ';
  tmplst.Add(linea);
  linea := '			<IgnoreResourceCalendar>0</IgnoreResourceCalendar> ';
  tmplst.Add(linea);
  linea := '			<HideBar>0</HideBar> ';
  tmplst.Add(linea);
  linea := '			<Rollup>0</Rollup>';
  tmplst.Add(linea);
  linea := '			<BCWS>0.00</BCWS>';
  tmplst.Add(linea);
  linea := '			<BCWP>0.00</BCWP> ';
  tmplst.Add(linea);
  linea := '			<PhysicalPercentComplete>0</PhysicalPercentComplete>';
  tmplst.Add(linea);
  linea := '			<EarnedValueMethod>0</EarnedValueMethod>';
  tmplst.Add(linea);
  linea := '			<IsPublished>1</IsPublished>';
  tmplst.Add(linea);
  linea := '			<CommitmentType>0</CommitmentType> ';
  tmplst.Add(linea);
  linea := '			<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '				<FieldID>188743734</FieldID>';
  tmplst.Add(linea);
  linea := '				<Value>' + codItems + '</Value>';
  tmplst.Add(linea);
  linea := '			</ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '			<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '				<FieldID>188743737</FieldID> ';
  tmplst.Add(linea);
  linea := '				<Value>' + frmMain.grid_crono01.Cells[2, Posgrid] + '</Value>';
  tmplst.Add(linea);
  linea := '			</ExtendedAttribute>';
  tmplst.Add(linea);
  /// ///////////////////////       1
  linea := '			<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '				<FieldID>188743740</FieldID>';
  tmplst.Add(linea);
  linea := '				<Value>' + frmMain.grid_crono01.Cells[4, Posgrid] + '</Value>';
  tmplst.Add(linea);
  linea := '			</ExtendedAttribute>';
  tmplst.Add(linea);
  /// ///////////////////////////   2   Costo Presupuesto
  linea := '			<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '				<FieldID>188743786</FieldID>';
  tmplst.Add(linea);
  linea := '				<Value>' +
    valorStandartProject(quitaSignoMiles(frmMain.grid_crono01.Cells[7,
    Posgrid])) + '</Value>';
  tmplst.Add(linea);
  linea := '			</ExtendedAttribute>';
  tmplst.Add(linea);
  /// //////////////////////////////  3      Cantidad
  linea := '			<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '				<FieldID>188743767</FieldID>';
  tmplst.Add(linea);
  tmpstr := quitaSignoMiles(frmMain.grid_crono01.Cells[5, Posgrid]);
  tmpstr := ReplaceStr(tmpstr, ',', '.');
  linea := '				<Value>' + tmpstr + '</Value>';
  tmplst.Add(linea);
  linea := '			</ExtendedAttribute>';
  tmplst.Add(linea);
  /// ///////////////////////////////////  4    Precio Unitario
  linea := '			<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '				<FieldID>188743788</FieldID>';
  tmplst.Add(linea);
  tmpstr := frmMain.grid_crono01.Cells[6, Posgrid];
  tmpstr := AnsiReplaceStr(tmpstr, base_activa.simboloMoneda, '').Trim;
  tmpstr := quitaSignoMiles(tmpstr);
  tmpstr := valorStandartProject(tmpstr);
  linea := '				<Value>' + tmpstr + '</Value>';
  tmplst.Add(linea);
  linea := '			</ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '		</Task>';
  tmplst.Add(linea);
  result := tmplst.Text;
end;

function valorStandartProject(Valor: string): string;
begin
  Valor := ReplaceStr(Valor, '.', '');
  Valor := ReplaceStr(Valor, ',', '');
  result := Valor;
end;

function creaItemsAsignamientoProject(cuerpoBase: TStringList): TStringList;
var
  conDB: TUniConnection;
  x, y, z: Integer;
  codAPU: string;
  cantidadPresupuesto: Double;
  tmpstr: string;
  CostoDirecto: Double;
  TotalLineaPresupuesto: Double;
  Indirecto: Double;
  codTask: string;
  horasTrabajo: Double;
  qry: TUniQuery;
  codCategoria: Integer;
  listadoItemsAsignamiento: arrayRecursos;
  UIDAsignamiento: Integer;
  codIdUnicoRecurso: string;
  cantidadRubroAnidado: string;
  tmplst: TStringList;
  linea: string;
  icantidadPresupuesto: Double;
  iValorIndirecto: Double;
  SQLText: string;
begin
  tmplst := TStringList.Create;
  UIDAsignamiento := 1;
  qry := TUniQuery.Create(nil);
  conDB := TUniConnection.Create(nil);
  conDB.ConnectString := DModule_1.con2.ConnectString;
  conDB.Connect;
  qry.Connection := DModule_1.con2;
  SetLength(listadoItemsAsignamiento, 0);
  y := 0;
  try
    for x := 1 to frmMain.grid_crono01.RowCount - 1 do
    begin
      codAPU := frmMain.grid_crono01.Cells[14, x];
      // << -- Encontrado
      if codAPU <> '' then
      begin
        tmpstr := frmMain.grid_crono01.Cells[5, x];
        tmpstr := AnsiReplaceStr(tmpstr, base_activa.simboloMoneda, '').Trim;
        tmpstr := quitaSignoMiles(tmpstr);
        tmpstr := decimal_correcto(tmpstr);
        cantidadPresupuesto := StrToFloat(tmpstr);
        tmpstr := frmMain.grid_crono01.Cells[7, x];
        tmpstr := quitaSignoMiles(tmpstr);
        tmpstr := AnsiReplaceStr(tmpstr, base_activa.simboloMoneda, '').Trim;
        tmpstr := decimal_correcto(tmpstr);
        TotalLineaPresupuesto := StrToFloat(tmpstr);
        codTask := frmMain.grid_crono01.Cells[15, x];
        horasTrabajo := StrToFloat(frmMain.grid_calcTiempos.Cells[2, x - 1]);

        with qry do
        begin
          Connection := conDB;
          close;
          sql.Clear;
          SQLText := 'SELECT items.CodCategoria, ' +
            '  items.idUnicoRecurso, items.Descripcion, ' +
            '  items.codSubCategoria, items.unidad, ' +
            '  if (tanteo.Precio IS NULL, items.precio, tanteo.Precio) as Precio, ' +
            '  if (tanteo.Precio IS NULL, items.CantidadUnidad, tanteo.CantidadUnidad) as CantidadUnidad, ' +
            '  if (tanteo.Precio IS NULL, items.Rendimiento, tanteo.Rendimiento) as Rendimiento, ' +
            '  if (tanteo.Precio IS NULL, items.Total, tanteo.Total) as Total ' + 'FROM'
              +
            '  apus_items items' + '  LEFT JOIN presupuestos_tanteo_recursos tanteo ON ('
              +
            '    tanteo.codBase = items.codBase ' + '    AND tanteo.CodAPU = items.CodAPU '
              +
            '    AND tanteo.codPresupuesto = :codPresupuesto ' +
            '    AND tanteo.revision = :revision ' + '    AND tanteo.idUnicoRecurso=items.idUnicoRecurso ) '
            + 'WHERE' + '  items.CodAPU = :codAPU' +
              '  AND items.codBase = :codBase';
          sql.Add(SQLText);
          ParamByName('codPresupuesto').AsString := codProyecto;
          ParamByName('revision').AsString := revision;
          ParamByName('codBase').AsString := base_activa.codBase;
          ParamByName('codAPU').AsString := codAPU;
          Prepare;
          ExecSQL;
          while not Eof do
          begin
            codCategoria := FieldByName('codCategoria').AsInteger;
            codIdUnicoRecurso := FieldByName('idUnicoRecurso').AsString;
            tmpstr := FieldByName('total').AsString;
            tmpstr := decimal_correcto(tmpstr);

            case codCategoria of
              1..5:
                begin
                  SetLength(listadoItemsAsignamiento, y + 1);
                  listadoItemsAsignamiento[y].codTask := codTask;
                  listadoItemsAsignamiento[y].codAPU := codAPU;
                  listadoItemsAsignamiento[y].descripcion :=
                    FieldByName('descripcion').AsString;
                  listadoItemsAsignamiento[y].horasTrabajo :=
                    FloatToStr(horasTrabajo);
                  listadoItemsAsignamiento[y].cantidadPresupuesto :=
                    FloatToStr(cantidadPresupuesto);
                  listadoItemsAsignamiento[y].PrecioCosto :=
                    FieldByName('Precio').AsString;
                  listadoItemsAsignamiento[y].PrecioTotal :=
                    FieldByName('total').AsString;
                  listadoItemsAsignamiento[y].cantidad :=
                    FieldByName('CantidadUnidad').AsString;
                  listadoItemsAsignamiento[y].codUnicoRecurso :=
                    FieldByName('idUnicoRecurso').AsString;
                  tmpstr := FieldByName('Rendimiento').AsString;
                  if tmpstr = '' then
                    tmpstr := '1';
                  listadoItemsAsignamiento[y].rendimiento := tmpstr;
                  listadoItemsAsignamiento[y].subCategoria :=
                    inttostr(codCategoria);
                  listadoItemsAsignamiento[y].tipoRecurso :=
                    inttostr(codCategoria);
                  listadoItemsAsignamiento[y].ResorceID :=
                    daResourceID(listadoItemsAsignamiento[y].codUnicoRecurso);
                  listadoItemsAsignamiento[y].UID := inttostr(UIDAsignamiento);
                  inc(UIDAsignamiento);
                  inc(y);
                end;
            end;
            Next;
          end;
          // Explosionar  Recursos
          close;
          sql.Clear;
          SQLText := 'SELECT items.idUnicoRecurso, ' + '  items.Descripcion, ' +
            '  items.unidad,  '
            + '  if (tanteo.Precio IS NULL, items.CantidadUnidad, tanteo.CantidadUnidad) as CantidadUnidad, '
            + '  if (tanteo.Precio IS NULL, items.Total, tanteo.Total) as Total ' +
            'FROM apus_items items ' + '   LEFT JOIN presupuestos_tanteo_recursos tanteo ON ('
              +
            '     tanteo.codBase = items.codBase ' + '     AND tanteo.CodAPU = items.CodAPU '
              +
            '     AND tanteo.idUnicoRecurso=items.idUnicoRecurso ' +
            '     AND tanteo.codPresupuesto =:codPresupuesto ' +
            '     AND tanteo.revision = :revision ' + '     AND tanteo.idUnicoRecurso=items.idUnicoRecurso ) '
            + 'WHERE' + '   items.CodAPU = :codAPU ' +
              '   AND items.codBase = :codBase ' +
            '   AND items.CodCategoria=6 ';
          sql.Add(SQLText);
          ParamByName('codPresupuesto').AsString := codProyecto;
          ParamByName('revision').AsString := revision;
          ParamByName('codBase').AsString := base_activa.codBase;
          ParamByName('codAPU').AsString := codAPU;
          Prepare;
          ExecSQL;
          while not Eof do
          begin
            codIdUnicoRecurso := FieldByName('idUnicoRecurso').AsString;
            tmpstr := FieldByName('total').AsString;
            tmpstr := decimal_correcto(tmpstr);
            cantidadRubroAnidado := FieldByName('CantidadUnidad').AsString;

            listadoItemsAsignamiento :=
              explosionarRecursoProject(codIdUnicoRecurso,
              cantidadRubroAnidado, listadoItemsAsignamiento, UIDAsignamiento,
                codTask, codAPU,
              FloatToStr(horasTrabajo), FloatToStr(cantidadPresupuesto));
            z := length(listadoItemsAsignamiento);
            tmpstr := listadoItemsAsignamiento[z - 1].UID;
            UIDAsignamiento := StrToInt(tmpstr);
            inc(UIDAsignamiento);
            y := z;
            Next;
          end;

          // Indirectos
          SetLength(listadoItemsAsignamiento, y + 1);
          listadoItemsAsignamiento[y].tipoRecurso := '7';
          listadoItemsAsignamiento[y].codTask := codTask;
          listadoItemsAsignamiento[y].codAPU := codAPU;
          listadoItemsAsignamiento[y].horasTrabajo := FloatToStr(horasTrabajo);
          tmpstr := frmMain.grid_calcTiempos.Cells[8, x - 1];
          tmpstr := quitaSignoMiles(tmpstr);
          listadoItemsAsignamiento[y].cantidadPresupuesto :=
            FloatToStr(cantidadPresupuesto);
          listadoItemsAsignamiento[y].PrecioTotal := tmpstr;
          inc(y);
        end;
      end;
    end;
  finally
    qry.Free;
    conDB.Free;
  end;

  // Rutina de creacion de datos xml
  codAsignamiento := 3;
  linea := '  	<Assignments>';
  tmplst.Add(linea);

  linea := daAsignamientoAPU(listadoItemsAsignamiento);
  tmplst.Add(linea);

  linea := '  	</Assignments>';
  tmplst.Add(linea);
  tmplst.Text := ReplaceStr(tmplst.Text, Chr(9), '   ');
  cuerpoBase.Add(tmplst.Text);
  result := cuerpoBase;
end;

function daCodApuPadreAnidado(Datos: string): string;
var
  x: Integer;
begin
  x := ansipos('APU:', Datos);
  if x > 0 then
  begin
    Datos := copy(Datos, x + 4, length(Datos)).Trim;
    x := ansipos('APU:', Datos);
    if x > 0 then
      Datos := daCodApuPadreAnidado(Datos);
  end;
  result := Datos;
end;

function daAsignamientoAPU(listadoRecursos: arrayRecursos): string;
var
  tmplst: TStringList;
  linea: string;
  codTask: string;
  codAPU: string;
  qry: TUniQuery;
  unidades: Double;
  valorRecurso: Double;
  cantidadRecurso: Double;
  cantidadPresupuesto: Double;
  rendimientoRecurso: Double;
  horasTrabajo: Double;
  tmpstr: string;
  codCategoria: Integer;
  PrecioSinIndirecto: Double;
  codRecurso: string;
  ResourceID: string;
  UIDAsignamiento: Integer;
  cantidadFinal: Double;
  UnidadesdeAsignamiento: Double;
  Posgrid: Integer;
  x: Integer;
  precioRecurso: Double;
begin
  tmplst := TStringList.Create;
  PrecioSinIndirecto := 0;
  for x := 0 to length(listadoRecursos) - 1 do
  begin
    codAPU := listadoRecursos[x].codAPU;
    codTask := listadoRecursos[x].codTask;
    tmpstr := listadoRecursos[x].descripcion;
    horasTrabajo := StrToFloat(listadoRecursos[x].horasTrabajo);
    cantidadPresupuesto := StrToFloat(listadoRecursos[x].cantidadPresupuesto);
    UIDAsignamiento := 1;
    codCategoria := StrToInt(listadoRecursos[x].tipoRecurso);

    tmpstr := listadoRecursos[x].PrecioTotal;
    tmpstr := decimal_correcto(tmpstr);
    valorRecurso := StrToFloat(tmpstr);

    tmpstr := listadoRecursos[x].cantidad;
    if tmpstr = '' then
      tmpstr := '1';

    tmpstr := decimal_correcto(tmpstr);
    cantidadRecurso := StrToFloat(tmpstr);

    cantidadFinal := cantidadRecurso * cantidadPresupuesto;

    codRecurso := listadoRecursos[x].codUnicoRecurso;

    tmpstr := listadoRecursos[x].rendimiento;
    if tmpstr = '' then
      tmpstr := '1';
    rendimientoRecurso := StrToFloatDef(tmpstr, 1);
    ResourceID := daResourceID(codRecurso);

    case codCategoria of
      1: { Equipos y Herramientas }
        begin
          // Trabajo
          UnidadesdeAsignamiento := daUnidadesRecurso(codAPU, codRecurso);
          horasTrabajo := rendimientoRecurso * cantidadRecurso;
          horasTrabajo := cantidadPresupuesto * horasTrabajo;
          linea := addAsignamentTrabajo(inttostr(UIDAsignamiento), codTask,
            ResourceID, convierteHMS
            (horasTrabajo), FloatToStr(UnidadesdeAsignamiento));
          tmplst.Add(linea);
        end;
      2: { Materiales }
        begin
          // Materiales
          linea := addAsignamentMateriales(inttostr(UIDAsignamiento), codTask,
            ResourceID,
            convierteNumero60(cantidadFinal), FloatToStr(cantidadFinal));
          tmplst.Add(linea);
        end;
      3: { Transporte }
        begin
          // Costo
          tmpstr := listadoRecursos[x].PrecioCosto;
          tmpstr := decimal_correcto(tmpstr);
          precioRecurso := StrToFloat(tmpstr);

          precioRecurso := precioRecurso * cantidadFinal * rendimientoRecurso;
          tmpstr := FloatToStr(precioRecurso);
          linea := addAsignamientoCostos(inttostr(UIDAsignamiento), codTask,
            ResourceID, tmpstr,
            StrToFloat(listadoRecursos[x].horasTrabajo));
          tmplst.Add(linea);
        end;
      4: { Mano de Obra }
        begin
          // Trabajo
          UnidadesdeAsignamiento := daUnidadesRecurso(codAPU, codRecurso);
          horasTrabajo := rendimientoRecurso * cantidadRecurso;
          horasTrabajo := cantidadPresupuesto * horasTrabajo;

          linea := addAsignamentTrabajo(inttostr(UIDAsignamiento), codTask,
            ResourceID, convierteHMS
            (horasTrabajo), FloatToStr(UnidadesdeAsignamiento));
          tmplst.Add(linea);
        end;
      5: { Seguridad Industrial }
        begin
          // Materiales
          linea := addAsignamentMateriales(inttostr(UIDAsignamiento), codTask,
            ResourceID,
            convierteNumero60(cantidadFinal), FloatToStr(cantidadFinal));
          tmplst.Add(linea);
        end;
      7: { Indirectos }
        begin
          // Costo
          tmpstr := listadoRecursos[x].PrecioTotal;
          linea := addAsignamientoCostos(inttostr(UIDAsignamiento), codTask,
            '3', tmpstr, StrToFloat
            (listadoRecursos[x].horasTrabajo));
          tmplst.Add(linea);
        end;
    end;
    inc(UIDAsignamiento);
  end;
  result := tmplst.Text;
end;

function explosionarRecursoProject(codIdUnicoRecurso, cantidadRubroAnidado:
  string; listadoRecursos:
  arrayRecursos; UIDAsignamiento: Integer; codTask, codAPU, horasTrabajo,
    cantidadPresupuesto:
  string): arrayRecursos;
var
  qry: TUniQuery;
  itemRecurso: dat_PRJRecursos;
  codCategoria: Integer;
  tmpstr: string;
  x, y, z: Integer;
  cantidadBase: Double;
  CantidadRecursoExplosionar: Double;
  rendimientoRecursoExplosionar: Double;
  subTotalBase: Double;
  subTotalRecursoExplosionar: Double;
  precioRecursoExplosionar: Double;
  CantidadExplosionada: Double;
  subTotalExplosionado: Double;
  rendimientoRecursoExplosionarRecalculado: Double;
  FcantidadRubroAnidado: Double;
  FcantidadRubroAnidadoEnvio: Double;
  PrecioTotalExplosionado: Double;
  SQLText: string;
begin
  tmpstr := decimal_correcto(cantidadRubroAnidado);
  FcantidadRubroAnidado := StrToFloat(tmpstr);
  qry := TUniQuery.Create(nil);
  qry.Connection := DModule_1.con2;
  try
    with qry do
    begin
      close;
      sql.Clear;
      SQLText := 'SELECT' + #13#10 + '  items.idUnicoRecurso,' + #13#10 +
        '  items.CodCategoria,' +
        #13#10 + '  items.Descripcion,' + #13#10 + '  items.unidad,' + #13#10 +
          'IF' + #13#10 +
        '  ( tanteo.Precio IS NULL, items.Precio, tanteo.Precio ) AS Precio,' + #13#10
          + 'IF' +
        #13#10 + '  ( tanteo.Rendimiento IS NULL, items.Rendimiento, tanteo.Rendimiento ) AS Rendimiento,'
        + #13#10 + 'IF' + #13#10 +
        '  ( tanteo.Precio IS NULL, items.CantidadUnidad, tanteo.CantidadUnidad ) AS CantidadUnidad,' +
        #13#10 + 'IF' + #13#10 +
          '  ( tanteo.Precio IS NULL, items.Total, tanteo.Total ) AS Total '
        + #13#10 + 'FROM' + #13#10 + '  apus_items items' + #13#10 +
        '  LEFT JOIN presupuestos_tanteo_recursos tanteo ON tanteo.codBase = items.codBase ' +
        #13#10 + '  AND tanteo.CodAPU = items.CodAPU ' + #13#10 +
        '  AND tanteo.idUnicoRecurso = items.idUnicoRecurso ' + #13#10 +
        '  AND tanteo.codPresupuesto = :codPresupuesto ' + #13#10 + '  ' + #13#10
          +
        '  AND tanteo.revision = :revision ' + #13#10 + '  ' + #13#10 + 'WHERE'
          + #13#10 +
        '  items.CodAPU = :codAPU' + #13#10 + '  ' + #13#10 +
          '  AND items.codBase =:codBase';
      sql.Add(SQLText);
      tmpstr := daCodApuPadreAnidado(codIdUnicoRecurso);
      ParamByName('codAPU').AsString := tmpstr;

      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codBase').AsString := base_activa.codBase;
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        codCategoria := FieldByName('codCategoria').AsInteger;
        itemRecurso.codTask := codTask;
        itemRecurso.tipoRecurso := inttostr(codCategoria);
        itemRecurso.descripcion := FieldByName('descripcion').AsString;
        itemRecurso.PrecioCosto := FieldByName('precio').AsString;
        itemRecurso.PrecioTotal := FieldByName('total').AsString;
        itemRecurso.cantidad := FieldByName('CantidadUnidad').AsString;
        itemRecurso.codUnicoRecurso := FieldByName('idUnicoRecurso').AsString;
        tmpstr := FieldByName('Rendimiento').AsString;
        if tmpstr = '' then
          tmpstr := '1';
        itemRecurso.rendimiento := tmpstr;
        itemRecurso.subCategoria := inttostr(codCategoria);
        itemRecurso.ResorceID := daResourceID(itemRecurso.codUnicoRecurso);
        itemRecurso.codAPU := codAPU;
        case codCategoria of
          1..5:
            begin
              y := encuentraRecursoenMatriz(listadoRecursos,
                itemRecurso.codUnicoRecurso, itemRecurso.codAPU);
              if y > -1 then
              begin
                case codCategoria of
                  1:
                    begin
                      // Trabajo
                      tmpstr := listadoRecursos[y].cantidad;
                      tmpstr := decimal_correcto(tmpstr);
                      cantidadBase := StrToFloat(tmpstr);
                      tmpstr := itemRecurso.cantidad;
                      tmpstr := decimal_correcto(tmpstr);
                      CantidadRecursoExplosionar := StrToFloat(tmpstr);
                      tmpstr := itemRecurso.rendimiento;
                      tmpstr := decimal_correcto(tmpstr);
                      rendimientoRecursoExplosionar := StrToFloat(tmpstr);
                      rendimientoRecursoExplosionarRecalculado := rendimientoRecursoExplosionar
                        *
                        FcantidadRubroAnidado;
                      CantidadExplosionada := cantidadBase +
                        CantidadRecursoExplosionar;

                      tmpstr := listadoRecursos[y].PrecioTotal;
                      tmpstr := decimal_correcto(tmpstr);
                      subTotalBase := StrToFloat(tmpstr);
                      tmpstr := itemRecurso.PrecioCosto;
                      tmpstr := decimal_correcto(tmpstr);
                      precioRecursoExplosionar := StrToFloat(tmpstr);
                      subTotalRecursoExplosionar := CantidadRecursoExplosionar *
                        precioRecursoExplosionar *
                          rendimientoRecursoExplosionarRecalculado;
                      subTotalExplosionado := subTotalBase +
                        subTotalRecursoExplosionar;
                      rendimientoRecursoExplosionarRecalculado :=
                        (subTotalExplosionado /
                        CantidadExplosionada) / precioRecursoExplosionar;
                      listadoRecursos[y].cantidad :=
                        FloatToStr(CantidadExplosionada);
                      listadoRecursos[y].rendimiento :=
                        FloatToStr(rendimientoRecursoExplosionarRecalculado);
                      listadoRecursos[y].PrecioTotal :=
                        FloatToStr(subTotalExplosionado);
                    end;
                  2:
                    begin
                      // Materiales
                      tmpstr := listadoRecursos[y].cantidad;
                      tmpstr := decimal_correcto(tmpstr);
                      cantidadBase := StrToFloat(tmpstr);
                      tmpstr := itemRecurso.cantidad;
                      tmpstr := decimal_correcto(tmpstr);
                      CantidadRecursoExplosionar := StrToFloat(tmpstr);
                      cantidadBase := cantidadBase + (FcantidadRubroAnidado *
                        CantidadRecursoExplosionar);
                      listadoRecursos[y].cantidad := FloatToStr(cantidadBase);
                    end;
                  3:
                    begin
                      // Materiales
                      tmpstr := listadoRecursos[y].cantidad;
                      tmpstr := decimal_correcto(tmpstr);
                      cantidadBase := StrToFloat(tmpstr);
                      tmpstr := itemRecurso.cantidad;
                      tmpstr := decimal_correcto(tmpstr);
                      CantidadRecursoExplosionar := StrToFloat(tmpstr);
                      cantidadBase := cantidadBase + (FcantidadRubroAnidado *
                        CantidadRecursoExplosionar);
                      listadoRecursos[y].cantidad := FloatToStr(cantidadBase);
                    end;
                  4:
                    begin
                      // Trabajo
                      tmpstr := listadoRecursos[y].cantidad;
                      tmpstr := decimal_correcto(tmpstr);
                      cantidadBase := StrToFloat(tmpstr);
                      tmpstr := itemRecurso.cantidad;
                      tmpstr := decimal_correcto(tmpstr);
                      CantidadRecursoExplosionar := StrToFloat(tmpstr);

                      tmpstr := itemRecurso.rendimiento;
                      tmpstr := decimal_correcto(tmpstr);
                      rendimientoRecursoExplosionar := StrToFloat(tmpstr);
                      rendimientoRecursoExplosionarRecalculado := rendimientoRecursoExplosionar
                        *
                        FcantidadRubroAnidado;
                      CantidadExplosionada := cantidadBase +
                        CantidadRecursoExplosionar;

                      tmpstr := listadoRecursos[y].PrecioTotal;
                      tmpstr := decimal_correcto(tmpstr);
                      subTotalBase := StrToFloat(tmpstr);
                      tmpstr := itemRecurso.PrecioCosto;
                      tmpstr := decimal_correcto(tmpstr);
                      precioRecursoExplosionar := StrToFloat(tmpstr);
                      subTotalRecursoExplosionar := CantidadRecursoExplosionar *
                        precioRecursoExplosionar *
                          rendimientoRecursoExplosionarRecalculado;
                      subTotalExplosionado := subTotalBase +
                        subTotalRecursoExplosionar;
                      rendimientoRecursoExplosionarRecalculado :=
                        (subTotalExplosionado /
                        CantidadExplosionada) / precioRecursoExplosionar;
                      listadoRecursos[y].cantidad :=
                        FloatToStr(CantidadExplosionada);
                      listadoRecursos[y].rendimiento :=
                        FloatToStr(rendimientoRecursoExplosionarRecalculado);
                      listadoRecursos[y].PrecioTotal :=
                        FloatToStr(subTotalExplosionado);
                    end;
                  5:
                    begin
                      // Materiales
                      tmpstr := listadoRecursos[y].cantidad;
                      tmpstr := decimal_correcto(tmpstr);
                      cantidadBase := StrToFloat(tmpstr);
                      tmpstr := itemRecurso.cantidad;
                      tmpstr := decimal_correcto(tmpstr);
                      CantidadRecursoExplosionar := StrToFloat(tmpstr);
                      cantidadBase := cantidadBase + (FcantidadRubroAnidado *
                        CantidadRecursoExplosionar);
                      listadoRecursos[y].cantidad := FloatToStr(cantidadBase);
                    end;
                end;
              end
              else
              begin
                // Recurso nuevo
                x := length(listadoRecursos);
                SetLength(listadoRecursos, x + 1);
                listadoRecursos[x].codUnicoRecurso :=
                  itemRecurso.codUnicoRecurso;
                listadoRecursos[x].tipoRecurso := itemRecurso.tipoRecurso;
                tmpstr := itemRecurso.cantidad;
                tmpstr := decimal_correcto(tmpstr);
                CantidadExplosionada := StrToFloat(tmpstr);
                CantidadExplosionada := CantidadExplosionada *
                  subTotalRecursoExplosionar;
                listadoRecursos[x].cantidad := FloatToStr(CantidadExplosionada);
                listadoRecursos[x].descripcion := itemRecurso.descripcion;
                listadoRecursos[x].PrecioCosto := itemRecurso.PrecioCosto;
                tmpstr := itemRecurso.PrecioCosto;
                tmpstr := decimal_correcto(tmpstr);
                PrecioTotalExplosionado := StrToFloat(tmpstr);
                tmpstr := itemRecurso.cantidad;
                tmpstr := decimal_correcto(tmpstr);
                PrecioTotalExplosionado := PrecioTotalExplosionado *
                  StrToFloat(tmpstr);
                PrecioTotalExplosionado := PrecioTotalExplosionado *
                  subTotalRecursoExplosionar;
                PrecioTotalExplosionado := PrecioTotalExplosionado *
                  cantidadBase;
                listadoRecursos[x].PrecioTotal :=
                  FloatToStr(PrecioTotalExplosionado);

                listadoRecursos[x].rendimiento := itemRecurso.rendimiento;
                listadoRecursos[x].subCategoria := itemRecurso.subCategoria;
                listadoRecursos[x].ResorceID := itemRecurso.ResorceID;
                listadoRecursos[x].codTask := itemRecurso.codTask;
                listadoRecursos[x].codAPU := codAPU;
                listadoRecursos[x].horasTrabajo := horasTrabajo;
                listadoRecursos[x].cantidadPresupuesto := cantidadPresupuesto;
                inc(UIDAsignamiento);
                listadoRecursos[x].UID := inttostr(UIDAsignamiento);
              end;
            end;
          6:
            begin
              // Bucle Recursivo
              tmpstr := itemRecurso.cantidad;
              tmpstr := decimal_correcto(tmpstr);
              subTotalRecursoExplosionar := StrToFloat(tmpstr);
              FcantidadRubroAnidadoEnvio := FcantidadRubroAnidado *
                subTotalRecursoExplosionar;
              //
              listadoRecursos := explosionarRecursoProject(codIdUnicoRecurso,
                FloatToStr(FcantidadRubroAnidadoEnvio),
                listadoRecursos, UIDAsignamiento, codTask, codAPU, horasTrabajo,
                  cantidadPresupuesto);
              //
              z := length(listadoRecursos);
              tmpstr := listadoRecursos[z - 1].UID;
              UIDAsignamiento := StrToInt(tmpstr);
              inc(UIDAsignamiento);
            end;
        end;
        Next;
      end;
    end;
  finally
    qry.Free;
    result := listadoRecursos;
  end;
end;

function encuentraRecursoenMatriz(listadoRecursos: array of dat_PRJRecursos;
  codUnicoRecurso,
  codAPURecurso: string): Integer;
var
  x: Integer;
  salir: boolean;
  tmpstr: string;
  tmpstr2: string;
begin
  salir := false;
  result := -1;
  x := 0;
  while (x < length(listadoRecursos)) and (not salir) do
  begin
    tmpstr := listadoRecursos[x].codUnicoRecurso;
    tmpstr2 := listadoRecursos[x].codAPU;
    if (codUnicoRecurso = tmpstr) and (codAPURecurso = tmpstr2) then
    begin
      salir := true;
      result := x;
    end;
    inc(x);
  end;
end;

function convierteNumero60(cantidad: Double): string;
var
  valorHoras, valorMinutos, valorSegundos: Double;
begin
  valorHoras := trunc(cantidad);
  valorMinutos := Frac(cantidad) * 60;
  valorSegundos := Frac(valorMinutos) * 60;
  valorSegundos := roundto(valorSegundos, -4);
  valorMinutos := trunc(valorMinutos);
  result := 'PT' + FloatToStr(valorHoras) + 'H' + FloatToStr(valorMinutos) + 'M'
    + FloatToStr(valorSegundos)
    + 'S';
  result := 'PT' + FloatToStr(valorHoras) + 'H' + FloatToStr(valorMinutos) + 'M'
    + FloatToStr(valorSegundos)
    + 'S';
end;

function convierteHMS(horasTrabajo: Double): string;
var
  valorHoras, valorMinutos, valorSegundos: Double;
  tmpval: Double;
begin
  valorHoras := trunc(horasTrabajo);
  tmpval := Frac(horasTrabajo);
  tmpval := tmpval * 60;
  valorMinutos := trunc(tmpval);
  tmpval := Frac(tmpval);
  valorSegundos := tmpval * 60;
  valorSegundos := roundto(valorSegundos, -2);
  result := 'PT' + FloatToStr(valorHoras) + 'H' + FloatToStr(valorMinutos) + 'M'
    + ReplaceStr(FloatToStr
    (valorSegundos), ',', '.') + 'S';
end;

function addAsignamentTrabajo(UIDAsignamiento, TaskAsignamiento, ResourceID,
  TiempoAsignamiento,
  unidades: string): string;
var
  linea: string;
  tmplst: TStringList;
begin
  tmplst := TStringList.Create;
  unidades := ReplaceStr(unidades, ',', '.');
  linea := '      <Assignment>';
  tmplst.Add(linea);
  linea := '         <UID>' + UIDAsignamiento + '</UID>';
  tmplst.Add(linea);
  linea := '         <GUID>' + generaGUID + '</GUID>';
  tmplst.Add(linea);
  linea := '         <TaskUID>' + TaskAsignamiento + '</TaskUID>';
  tmplst.Add(linea);
  linea := '         <ResourceUID>' + ResourceID + '</ResourceUID>';
  tmplst.Add(linea);
  linea := '         <RemainingWork>' + TiempoAsignamiento + '</RemainingWork>';
  tmplst.Add(linea);
  linea := '			<Units>' + unidades + '</Units>';
  tmplst.Add(linea);
  linea := '      </Assignment>';
  tmplst.Add(linea);
  result := tmplst.Text;
end;

function addAsignamentMateriales(UIDAsignamiento, TaskAsignamiento, ResourceID,
  UnidadesEnTiempo,
  unidades: string): string;
var
  linea: string;
  tmplst: TStringList;
begin
  tmplst := TStringList.Create;
  UnidadesEnTiempo := ReplaceStr(UnidadesEnTiempo, ',', '.');
  unidades := ReplaceStr(unidades, ',', '.');
  linea := '      <Assignment>';
  tmplst.Add(linea);
  linea := '         <UID>' + UIDAsignamiento + '</UID>';
  tmplst.Add(linea);
  linea := '         <GUID>' + generaGUID + '</GUID>';
  tmplst.Add(linea);
  linea := '         <TaskUID>' + TaskAsignamiento + '</TaskUID>';
  tmplst.Add(linea);
  linea := '         <ResourceUID>' + ResourceID + '</ResourceUID>';
  tmplst.Add(linea);
  linea := '         <RemainingWork>' + UnidadesEnTiempo + '</RemainingWork>';
  tmplst.Add(linea);
  linea := '         <Units>' + unidades + '</Units>';
  tmplst.Add(linea);
  linea := '      </Assignment>';
  tmplst.Add(linea);
  result := tmplst.Text;
end;

function addAsignamientoCostos(UIDAsignamiento, TaskAsignamiento, ResourceID,
  valorCosto: string;
  horasTrabajo: Double): string;
var
  linea: string;
  tmplst: TStringList;
  fechaInicio, FechaFinal: string;
  Tfecha1: TDateTime;
  Tfecha2: TDateTime;
  DiaHoraInicioLabor: string;
  DiaHoraFinLabor: string;
  horasLaborablesDia: Integer;
  tmpstr: string;
  horasP1: string;
  horasP2: string;
  ValorConversion: string;
  diasLaborales: Double;
  horasLaborales: Double;
  MinutosLaborales: Double;
  segundosLaborales: Double;
  factorConversion: Double;
  tmpval: Double;
  Thoras, Tminutos, Tsegundos: Double;
begin
  tmplst := TStringList.Create;
  tmpstr := decimal_correcto(valorCosto);
  tmpval := StrToFloat(tmpstr);
  tmpval := tmpval * 0.0001; // Factor Conversion Project

  Thoras := tmpval;
  Tminutos := Frac(Thoras);
  Thoras := trunc(Thoras);
  Tminutos := Tminutos * 60;
  Tsegundos := Frac(Tminutos);
  Tminutos := trunc(Tminutos);
  Tsegundos := Tsegundos * 60;

  valorCosto := ReplaceStr(valorCosto, ',', '');
  valorCosto := ReplaceStr(valorCosto, '.', '');

  tmpstr := frmMain.lbl_cronoFechaInicio1.Text;

  horasP1 := FormatDateTime('dd/mm/yyyy', StrToDateTime(tmpstr));
  horasP2 := frmMain.edt_HoraInicioJornada.Text + ':00';
  horasP2 := FormatDateTime('hh:nn:ss', StrToTime(horasP2));
  horasP1 := horasP1 + ' ' + horasP2;
  Tfecha1 := StrToDateTime(horasP1);
  DiaHoraInicioLabor := FormatDateTime('yyyy-mm-dd', Tfecha1) + 'T' +
    FormatDateTime('hh:nn:ss', Tfecha1);

  horasLaborablesDia := StrToInt(frmMain.edt_HorasJornada.Text);
  horasLaborales := trunc(horasTrabajo);
  diasLaborales := horasLaborales / horasLaborablesDia;
  diasLaborales := trunc(diasLaborales);
  horasLaborales := horasLaborales - (diasLaborales * horasLaborablesDia);
  MinutosLaborales := Frac(horasTrabajo);
  MinutosLaborales := MinutosLaborales * 60;
  segundosLaborales := Frac(MinutosLaborales);
  MinutosLaborales := trunc(MinutosLaborales);
  segundosLaborales := segundosLaborales * 60;
  segundosLaborales := trunc(segundosLaborales);
  Tfecha2 := Tfecha1;
  Tfecha2 := IncDay(Tfecha2, trunc(diasLaborales));
  Tfecha2 := IncHour(Tfecha2, trunc(horasLaborales));
  Tfecha2 := IncMinute(Tfecha2, trunc(MinutosLaborales));
  Tfecha2 := IncSecond(Tfecha2, trunc(segundosLaborales));
  DiaHoraFinLabor := FormatDateTime('yyyy-mm-dd', Tfecha2) + 'T' +
    FormatDateTime('hh:nn:ss', Tfecha2);

  linea := '      <Assignment>';
  tmplst.Add(linea);
  linea := '         <UID>' + UIDAsignamiento + '</UID>';
  tmplst.Add(linea);
  linea := '         <GUID>' + generaGUID + '</GUID>';
  tmplst.Add(linea);
  linea := '         <TaskUID>' + TaskAsignamiento + '</TaskUID>';
  tmplst.Add(linea);

  linea := '         <ResourceUID>' + ResourceID + '</ResourceUID>';
  tmplst.Add(linea);

  linea := '         <Cost>' + valorCosto + '</Cost>';
  tmplst.Add(linea);
  linea := '         <CostVariance>' + valorCosto + '</CostVariance>';
  tmplst.Add(linea);
  linea := '         <Start>' + DiaHoraInicioLabor + '</Start>';
  tmplst.Add(linea);
  linea := '         <Finish>' + DiaHoraFinLabor + '</Finish>';
  tmplst.Add(linea);
  linea := '         <RemainingCost>' + valorCosto + '</RemainingCost>';
  tmplst.Add(linea);
  linea := '         <RemainingWork>PT' + FloatToStr(Thoras) + 'H' +
    FloatToStr(Tminutos) + 'M' +
    ReplaceStr(FloatToStr(Tsegundos), ',', '.') + 'S</RemainingWork>';
  tmplst.Add(linea);
  linea := '      </Assignment>';
  tmplst.Add(linea);
  result := tmplst.Text;
end;

function addCalendarRecursos(calendarioEnvio: string): string;
var
  tmplst: TStringList;
  linea: string;
  x, y: Integer;
begin
  tmplst := TStringList.Create;
  linea := '		<Calendar> ';
  tmplst.Add(linea);
  linea := '			<UID>5</UID>';
  tmplst.Add(linea);
  linea := '			<GUID>CAEB02A3-9037-EE11-9EDF-847B57A09BEF</GUID>';
  tmplst.Add(linea);
  linea := '			<Name>Indirectos</Name>';
  tmplst.Add(linea);
  linea := '			<IsBaseCalendar>0</IsBaseCalendar>';
  tmplst.Add(linea);
  linea := '			<IsBaselineCalendar>0</IsBaselineCalendar> ';
  tmplst.Add(linea);
  linea := '			<BaseCalendarUID>1</BaseCalendarUID>';
  tmplst.Add(linea);
  linea := '		</Calendar> ';
  tmplst.Add(linea);
  y := 10;
  for x := 0 to length(listado_PRJRecursoLimpios) - 1 do
  begin
    if listado_PRJRecursoLimpios[x].descripcion <> '' then
    begin
      linea := '		<Calendar>';
      tmplst.Add(linea);
      linea := '			<UID>' + inttostr(y) + '</UID>';
      listado_PRJRecursoLimpios[x].calendarioAsignado := inttostr(y);
      tmplst.Add(linea);
      linea := '			<GUID>' + listado_PRJRecursoLimpios[x].GUID + '</GUID>';
      tmplst.Add(linea);
      linea := '			<Name>' + listado_PRJRecursoLimpios[x].descripcion +
        '</Name>';
      tmplst.Add(linea);
      linea := '			<IsBaseCalendar>0</IsBaseCalendar>';
      tmplst.Add(linea);
      linea := '			<IsBaselineCalendar>0</IsBaselineCalendar>';
      tmplst.Add(linea);
      linea := '			<BaseCalendarUID>1</BaseCalendarUID>';
      tmplst.Add(linea);
      linea := '		</Calendar>';
      tmplst.Add(linea);
      inc(y);
    end;
  end;
  result := tmplst.Text;
end;

function addCalendarSabadoDomingos(FInicio, FFin: TDate): string;
var
  tmplst: TStringList;
  tmplst2: TStringList;
  linea: string;
  salir: boolean;
  diaSemana: TDate;
  tmpstr1, tmpstr2: string;
  x: Integer;
begin
  tmplst := TStringList.Create;
  tmplst2 := TStringList.Create;
  salir := false;
  diaSemana := FInicio;
  linea := '			<Exceptions>';
  tmplst2.Add(linea);
  while not salir do
  begin
    x := DayOfWeek(diaSemana);
    if (x = 1) or (x = 7) then
    begin
      // parte 1
      linea := '				<WeekDay>';
      tmplst.Add(linea);
      linea := '					<DayType>0</DayType>';
      tmplst.Add(linea);
      linea := '					<DayWorking>0</DayWorking>';
      tmplst.Add(linea);
      linea := '					<TimePeriod>';
      tmplst.Add(linea);
      tmpstr1 := FormatDateTime('yyyy-mm-dd', diaSemana);
      tmpstr2 := tmpstr1 + 'T00:00:00';
      linea := '						<FromDate>' + tmpstr2 + '</FromDate>';
      tmplst.Add(linea);
      tmpstr2 := tmpstr1 + 'T23:59:00';
      linea := '						<ToDate>' + tmpstr2 + '</ToDate>';
      tmplst.Add(linea);
      linea := '					</TimePeriod>';
      tmplst.Add(linea);
      linea := '				</WeekDay>';
      tmplst.Add(linea);
      // parte 2
      linea := '				<Exception>';
      tmplst2.Add(linea);
      linea := '					<EnteredByOccurrences>0</EnteredByOccurrences>';
      tmplst2.Add(linea);
      linea := '					<TimePeriod>';
      tmplst2.Add(linea);
      tmpstr2 := tmpstr1 + 'T00:00:00';
      linea := '						<FromDate>' + tmpstr2 + '</FromDate>';
      tmplst2.Add(linea);
      tmpstr2 := tmpstr1 + 'T23:59:00';
      linea := '						<ToDate>' + tmpstr2 + '</ToDate>';
      tmplst2.Add(linea);
      linea := '					</TimePeriod>';
      tmplst2.Add(linea);
      linea := '					<Occurrences>1</Occurrences>';
      tmplst2.Add(linea);
      tmpstr2 := FormatDateTime('dd of mmmm yyyy', diaSemana);
      tmpstr2 := ReplaceStr(tmpstr2, 'of', 'de');
      tmpstr1 := Dia_de_semana[DayOfWeek(diaSemana)] + ', ' + tmpstr2;
      linea := '					<Name>' + tmpstr1 + '</Name>';
      tmplst2.Add(linea);
      linea := '					<Type>1</Type>';
      tmplst2.Add(linea);
      linea := '					<DayWorking>0</DayWorking>';
      tmplst2.Add(linea);
      linea := '				</Exception>';
      tmplst2.Add(linea);
    end;
    diaSemana := IncDay(diaSemana, 1);
    if diaSemana > FFin then
      salir := true;
  end;
  linea := '			</Exceptions>';
  tmplst2.Add(linea);
  tmplst.Text := tmplst.Text + tmplst2.Text;
  result := tmplst.Text;
end;

function addCalendarioPrincipal(): string;
var
  tmplst: TStringList;
  linea: string;
  x, y: Integer;
  diasSemana: Integer;
  tmpstr: string;
  DiasTrabajables: array[1..7] of Integer;
begin
  diasSemana := StrToIntDef(frmMain.edt_DiasSemanas.Text, 5);
  for x := 1 to 7 do
  begin
    DiasTrabajables[x] := 0;
  end;
  for x := 1 to diasSemana do
  begin
    if x < 7 then
    begin
      DiasTrabajables[x + 1] := 1;
    end
    else
    begin
      DiasTrabajables[1] := 1;
    end;
  end;
  tmplst := TStringList.Create;
  linea := '			<UID>1</UID>';
  tmplst.Add(linea);
  linea := '			<GUID>' + generaGUID + '</GUID>';
  tmplst.Add(linea);
  linea := '			<Name>Estándar</Name>';
  tmplst.Add(linea);
  linea := '			<IsBaseCalendar>1</IsBaseCalendar>';
  tmplst.Add(linea);
  linea := '			<IsBaselineCalendar>0</IsBaselineCalendar>';
  tmplst.Add(linea);
  linea := '			<BaseCalendarUID>-1</BaseCalendarUID>';
  tmplst.Add(linea);
  linea := '			<WeekDays>';
  tmplst.Add(linea);
  for x := 1 to 7 do
  begin
    linea := '				<WeekDay>';
    tmplst.Add(linea);
    linea := '					<DayType>' + inttostr(x) + '</DayType>';
    tmplst.Add(linea);
    y := DiasTrabajables[x];
    if y = 1 then
    begin
      linea := '					<DayWorking>1</DayWorking>';
      tmplst.Add(linea);
      linea := '					<WorkingTimes>';
      tmplst.Add(linea);
      linea := horarios.Text;
      tmplst.Add(linea);
      linea := '					</WorkingTimes>';
    end
    else
    begin
      linea := '					<DayWorking>0</DayWorking>'
    end;
    tmplst.Add(linea);
    linea := '				</WeekDay>';
    tmplst.Add(linea);
  end;
  linea := '			</WeekDays>';
  tmplst.Add(linea);
  result := tmplst.Text;
end;

function horarios(): TStringList;
var
  tmplst: TStringList;
  horaInicio: string;
  horasTrabajo: string;
  horastrabajadas: Integer;
  tfechainicio, tfechafin: TDateTime;
  dias: Integer;
  tmpstr: string;
  linea: string;
begin
  tmplst := TStringList.Create;
  horaInicio := frmMain.edt_HoraInicioJornada.Text;
  horasTrabajo := frmMain.edt_HorasJornada.Text;
  horastrabajadas := StrToInt(horasTrabajo);
  tfechainicio := StrToTime(horaInicio + ':00');
  tfechafin := IncHour(tfechainicio, horastrabajadas);
  dias := DaysBetween(tfechafin, tfechainicio);
  case dias of
    0:
      begin
        linea := '						<WorkingTime>';
        tmplst.Add(linea);
        tmpstr := FormatDateTime('HH:nn:ss', tfechainicio);
        linea := '							<FromTime>' + tmpstr + '</FromTime>';
        tmplst.Add(linea);
        tmpstr := FormatDateTime('HH:nn:ss', tfechafin);
        linea := '							<ToTime>' + tmpstr + '</ToTime>';
        tmplst.Add(linea);
        linea := '						</WorkingTime>';
        tmplst.Add(linea);
      end;
    1:
      begin
        linea := '						<WorkingTime>';
        tmplst.Add(linea);
        tmpstr := '00:00:00';
        linea := '							<FromTime>' + tmpstr + '</FromTime>';
        tmplst.Add(linea);
        tmpstr := FormatDateTime('HH:nn:ss', tfechafin);
        linea := '							<ToTime>' + tmpstr + '</ToTime>';
        tmplst.Add(linea);
        linea := '						</WorkingTime>';
        tmplst.Add(linea);
        linea := '						<WorkingTime>';
        tmplst.Add(linea);
        tmpstr := FormatDateTime('HH:nn:ss', tfechainicio);
        linea := '							<FromTime>' + tmpstr + '</FromTime>';
        tmplst.Add(linea);
        tmpstr := '23:59:00';
        linea := '							<ToTime>' + tmpstr + '</ToTime>';
        tmplst.Add(linea);
        linea := '						</WorkingTime>';
        tmplst.Add(linea);
      end;
  end;
  result := tmplst;
end;

function pMes(mes: Integer): string;
begin
  case mes of
    1:
      result := 'Enero';
    2:
      result := 'Febrero';
    3:
      result := 'Marzo';
    4:
      result := 'Abril';
    5:
      result := 'Mayo';
    6:
      result := 'Junio';
    7:
      result := 'Julio';
    8:
      result := 'Agosto';
    9:
      result := 'Septiembre';
    10:
      result := 'Octubre';
    11:
      result := 'Noviembre';
    12:
      result := 'Diciembre';
  end;
end;

function crearExtendedAttributtes(cuerpoBase: TStringList): TStringList;
var
  tmplst: TStringList;
  linea: string;
  x: Integer;
begin
  tmplst := TStringList.Create;
  linea := '	<ExtendedAttributes>';
  tmplst.Add(linea);
  linea := '		<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '			<FieldID>188743731</FieldID>';
  tmplst.Add(linea);
  linea := '			<FieldName>Texto1</FieldName>';
  tmplst.Add(linea);
  linea := '			<Guid>000039B7-8BBE-4CEB-82C4-FA8C0B400033</Guid>';
  tmplst.Add(linea);
  linea := '			<SecondaryPID>255869028</SecondaryPID>';
  tmplst.Add(linea);
  linea :=
    '			<SecondaryGuid>000039B7-8BBE-4CEB-82C4-FA8C0F404064</SecondaryGuid>';
  tmplst.Add(linea);
  linea := '		</ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '		<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '			<FieldID>188743734</FieldID>';
  tmplst.Add(linea);
  linea := '			<FieldName>Texto2</FieldName>';
  tmplst.Add(linea);
  linea := '			<Guid>000039B7-8BBE-4CEB-82C4-FA8C0B400036</Guid>';
  tmplst.Add(linea);
  linea := '			<SecondaryPID>255869029</SecondaryPID>';
  tmplst.Add(linea);
  linea :=
    '			<SecondaryGuid>000039B7-8BBE-4CEB-82C4-FA8C0F404065</SecondaryGuid>';
  tmplst.Add(linea);
  linea := '		</ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '		<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '			<FieldID>188743737</FieldID>';
  tmplst.Add(linea);
  linea := '			<FieldName>Texto3</FieldName>';
  tmplst.Add(linea);
  linea := '			<Guid>000039B7-8BBE-4CEB-82C4-FA8C0B400039</Guid>';
  tmplst.Add(linea);
  linea := '			<SecondaryPID>255869030</SecondaryPID>';
  tmplst.Add(linea);
  linea :=
    '			<SecondaryGuid>000039B7-8BBE-4CEB-82C4-FA8C0F404066</SecondaryGuid>';
  tmplst.Add(linea);
  linea := '		</ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '		<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '			<FieldID>188743740</FieldID>';
  tmplst.Add(linea);
  linea := '			<FieldName>Texto4</FieldName>';
  tmplst.Add(linea);
  linea := '			<Guid>000039B7-8BBE-4CEB-82C4-FA8C0B40003C</Guid>';
  tmplst.Add(linea);
  linea := '			<SecondaryPID>255869031</SecondaryPID>';
  tmplst.Add(linea);
  linea :=
    '			<SecondaryGuid>000039B7-8BBE-4CEB-82C4-FA8C0F404067</SecondaryGuid>';
  tmplst.Add(linea);
  linea := '		</ExtendedAttribute>';
  tmplst.Add(linea);

  linea := '		<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '			<FieldID>188743767</FieldID>';
  tmplst.Add(linea);
  linea := '			<FieldName>Número1</FieldName>';
  tmplst.Add(linea);
  linea := '			<Guid>000039B7-8BBE-4CEB-82C4-FA8C0B400057</Guid>';
  tmplst.Add(linea);
  linea := '			<SecondaryPID>255868988</SecondaryPID>';
  tmplst.Add(linea);
  linea :=
    '			<SecondaryGuid>000039B7-8BBE-4CEB-82C4-FA8C0F40403C</SecondaryGuid>';
  tmplst.Add(linea);
  linea := '		</ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '		<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '			<FieldID>188743768</FieldID>';
  tmplst.Add(linea);
  linea := '			<FieldName>Número2</FieldName>';
  tmplst.Add(linea);
  linea := '			<Guid>000039B7-8BBE-4CEB-82C4-FA8C0B400058</Guid>';
  tmplst.Add(linea);
  linea := '			<SecondaryPID>255868989</SecondaryPID>';
  tmplst.Add(linea);
  linea :=
    '			<SecondaryGuid>000039B7-8BBE-4CEB-82C4-FA8C0F40403D</SecondaryGuid>';
  tmplst.Add(linea);
  linea := '		</ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '		<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '			<FieldID>188743786</FieldID>';
  tmplst.Add(linea);
  linea := '			<FieldName>Costo1</FieldName>';
  tmplst.Add(linea);
  linea := '			<Guid>000039B7-8BBE-4CEB-82C4-FA8C0B40006A</Guid>';
  tmplst.Add(linea);
  linea := '			<SecondaryPID>255868958</SecondaryPID>';
  tmplst.Add(linea);
  linea :=
    '			<SecondaryGuid>000039B7-8BBE-4CEB-82C4-FA8C0F40401E</SecondaryGuid>';
  tmplst.Add(linea);
  linea := '		</ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '		<ExtendedAttribute>';
  tmplst.Add(linea);
  linea := '			<FieldID>188743787</FieldID>';
  tmplst.Add(linea);
  linea := '			<FieldName>Costo2</FieldName>';
  tmplst.Add(linea);
  linea := '			<Guid>000039B7-8BBE-4CEB-82C4-FA8C0B40006B</Guid>';
  tmplst.Add(linea);
  linea := '			<SecondaryPID>255868959</SecondaryPID>';
  tmplst.Add(linea);
  linea :=
    '			<SecondaryGuid>000039B7-8BBE-4CEB-82C4-FA8C0F40401F</SecondaryGuid>';
  tmplst.Add(linea);
  linea := '			<Formula>[MSPJ188743786]-[MSPJ188743685]</Formula>';
  tmplst.Add(linea);
  linea := '		</ExtendedAttribute>';
  tmplst.Add(linea);

  linea := '	</ExtendedAttributes>';
  tmplst.Add(linea);
  tmplst.Text := ReplaceStr(tmplst.Text, Chr(9), '   ');
  cuerpoBase.Add(tmplst.Text);
  result := cuerpoBase;
end;

function truqueaCalendario(cuerpoBase: TStringList): TStringList;
var
  tmplst, calendarioEnvio: TStringList;
  linea: string;
  x, y: Integer;
  diasSemana: Integer;
  tmpstr: string;
  DiasTrabajables: array[1..7] of Integer;
begin
  tmplst := TStringList.Create;
  calendarioEnvio := TStringList.Create;
  diasSemana := StrToIntDef(frmMain.edt_DiasSemanas.Text, 5);
  for x := 1 to 7 do
  begin
    DiasTrabajables[x] := 0;
  end;
  for x := 1 to diasSemana do
  begin
    if x < 7 then
    begin
      DiasTrabajables[x + 1] := 1;
    end
    else
    begin
      DiasTrabajables[1] := 1;
    end;
  end;
  linea := '	<Calendars>';
  tmplst.Add(linea);
  linea := '		<Calendar>';
  tmplst.Add(linea);
  linea := '			<UID>1</UID>';
  tmplst.Add(linea);
  linea := '			<GUID>7436B813-071C-EE11-BDE2-847B57A09BEF</GUID>';
  tmplst.Add(linea);
  linea := '			<Name>Estándar</Name>';
  tmplst.Add(linea);
  linea := '			<IsBaseCalendar>1</IsBaseCalendar>';
  tmplst.Add(linea);
  linea := '			<IsBaselineCalendar>0</IsBaselineCalendar>';
  tmplst.Add(linea);
  linea := '			<BaseCalendarUID>-1</BaseCalendarUID>';
  tmplst.Add(linea);
  linea := '			<WeekDays>';
  tmplst.Add(linea);
  calendarioEnvio.Add(linea);
  for x := 1 to 7 do
  begin
    linea := '				<WeekDay>';
    tmplst.Add(linea);
    calendarioEnvio.Add(linea);
    linea := '					<DayType>' + inttostr(x) + '</DayType>';
    tmplst.Add(linea);
    calendarioEnvio.Add(linea);
    y := DiasTrabajables[x];
    if y = 1 then
    begin
      linea := '					<DayWorking>1</DayWorking>';
      tmplst.Add(linea);
      calendarioEnvio.Add(linea);
      linea := '					<WorkingTimes>';
      tmplst.Add(linea);
      calendarioEnvio.Add(linea);
      linea := horarios.Text;
      tmplst.Add(linea);
      calendarioEnvio.Add(linea);
      linea := '					</WorkingTimes>';
    end
    else
    begin
      linea := '					<DayWorking>0</DayWorking>'
    end;
    tmplst.Add(linea);
    calendarioEnvio.Add(linea);
    linea := '				</WeekDay>';
    tmplst.Add(linea);
    calendarioEnvio.Add(linea);
  end;
  linea := '			</WeekDays>';
  calendarioEnvio.Add(linea);
  tmplst.Add(linea);
  linea := '		</Calendar>';
  tmplst.Add(linea);
  linea := addCalendarRecursos(calendarioEnvio.Text);
  tmplst.Add(linea);
  linea := '	</Calendars>';
  tmplst.Add(linea);
  tmplst.Text := ReplaceStr(tmplst.Text, Chr(9), '   ');
  cuerpoBase.Add(tmplst.Text);
  result := cuerpoBase;
end;

function generaCalendarioPRJ(cuerpoBase: TStringList): TStringList;
var
  tmplst, calendarioEnvio: TStringList;
  linea: string;
  x, y: Integer;
  diasSemana: Integer;
  tmpstr: string;
  DiasTrabajables: array[1..7] of Integer;
begin
  tmplst := TStringList.Create;
  calendarioEnvio := TStringList.Create;
  diasSemana := StrToIntDef(frmMain.edt_DiasSemanas.Text, 5);
  for x := 1 to 7 do
  begin
    DiasTrabajables[x] := 0;
  end;
  for x := 1 to diasSemana do
  begin
    if x < 7 then
    begin
      DiasTrabajables[x + 1] := 1;
    end
    else
    begin
      DiasTrabajables[1] := 1;
    end;
  end;

  linea := '	<Calendars>';
  tmplst.Add(linea);
  linea := '		<Calendar>';
  tmplst.Add(linea);
  linea := '			<UID>1</UID>';
  tmplst.Add(linea);
  linea := '			<GUID>7436B813-071C-EE11-BDE2-847B57A09BEF</GUID>';
  tmplst.Add(linea);
  linea := '			<Name>Estándar</Name>';
  tmplst.Add(linea);
  linea := '			<IsBaseCalendar>1</IsBaseCalendar>';
  tmplst.Add(linea);
  linea := '			<IsBaselineCalendar>0</IsBaselineCalendar>';
  tmplst.Add(linea);
  linea := '			<BaseCalendarUID>-1</BaseCalendarUID>';
  tmplst.Add(linea);
  linea := '			<WeekDays>';
  tmplst.Add(linea);
  calendarioEnvio.Add(linea);
  for x := 1 to 7 do
  begin
    linea := '				<WeekDay>';
    tmplst.Add(linea);
    calendarioEnvio.Add(linea);
    linea := '					<DayType>' + inttostr(x) + '</DayType>';
    tmplst.Add(linea);
    calendarioEnvio.Add(linea);
    y := DiasTrabajables[x];
    if y = 1 then
    begin
      linea := '					<DayWorking>1</DayWorking>';
      tmplst.Add(linea);
      calendarioEnvio.Add(linea);
      linea := '					<WorkingTimes>';
      tmplst.Add(linea);
      calendarioEnvio.Add(linea);
      linea := horarios.Text;
      tmplst.Add(linea);
      calendarioEnvio.Add(linea);
      linea := '					</WorkingTimes>';
    end
    else
    begin
      linea := '					<DayWorking>0</DayWorking>'
    end;
    tmplst.Add(linea);
    calendarioEnvio.Add(linea);
    linea := '				</WeekDay>';
    tmplst.Add(linea);
    calendarioEnvio.Add(linea);
  end;
  linea := '			</WeekDays>';
  calendarioEnvio.Add(linea);
  tmplst.Add(linea);
  linea := '		</Calendar>';
  tmplst.Add(linea);
  linea := addCalendarRecursos(calendarioEnvio.Text);
  tmplst.Add(linea);
  linea := '	</Calendars>';
  tmplst.Add(linea);
  tmplst.Text := ReplaceStr(tmplst.Text, Chr(9), '   ');
  cuerpoBase.Add(tmplst.Text);
  result := cuerpoBase;
end;

function generaPID(base, desarrollo: Integer): string;
var
  x, y: Integer;
  semilla: Integer;
  salir: boolean;
  tsemilla: string;
begin
  tsemilla := ponerCerosInicio(inttostr(desarrollo), 3);
  tsemilla := inttostr(base) + tsemilla;
  result := tsemilla;
end;

function crearAdicionales1PRJ(cuerpoBase: TStringList): TStringList;
var
  tmplst: TStringList;
  linea: string;
begin
  tmplst := TStringList.Create;
  linea := '	<Maps/>';
  tmplst.Add(linea);
  linea := '	<Reports/>';
  tmplst.Add(linea);
  linea := '	<Drawings/>';
  tmplst.Add(linea);
  linea := '	<DataLinks/>';
  tmplst.Add(linea);
  linea := '	<VBAProjects/>';
  tmplst.Add(linea);
  linea := '	<OutlineCodes/>';
  tmplst.Add(linea);
  linea := '	<WBSMasks/>';
  tmplst.Add(linea);
  tmplst.Text := ReplaceStr(tmplst.Text, Chr(9), '   ');
  cuerpoBase.Add(tmplst.Text);
  result := cuerpoBase;
end;

function crearTablesPRJ(cuerpoBase: TStringList): TStringList;
var
  tmplst: TStringList;
  linea: string;
begin
  tmplst := TStringList.Create;
  linea := '	<Tables>';
  tmplst.Add(linea);
  linea := '		<Table>';
  tmplst.Add(linea);
  linea := '			<Name>&amp;Entrada</Name>';
  tmplst.Add(linea);
  linea := '			<IsCustomized>true</IsCustomized>';
  tmplst.Add(linea);
  linea := '		</Table>';
  tmplst.Add(linea);
  linea := '	</Tables>';
  tmplst.Add(linea);
  tmplst.Text := ReplaceStr(tmplst.Text, Chr(9), '   ');
  cuerpoBase.Add(tmplst.Text);
  result := cuerpoBase;
end;

function crearViewsPRJ(cuerpoBase: TStringList): TStringList;
var
  tmplst: TStringList;
  linea: string;
begin
  tmplst := TStringList.Create;
  linea := '	<Views>';
  tmplst.Add(linea);
  linea := '		<View>';
  tmplst.Add(linea);
  linea := '			<Name>Gantt &amp;con escala de tiempo</Name>';
  tmplst.Add(linea);
  linea := '		</View>';
  tmplst.Add(linea);
  linea := '		<View>';
  tmplst.Add(linea);
  linea := '			<Name>Diagrama de Gan&amp;tt</Name>';
  tmplst.Add(linea);
  linea := '			<IsCustomized>true</IsCustomized>';
  tmplst.Add(linea);
  linea := '		</View>';
  tmplst.Add(linea);
  linea := '		<View>';
  tmplst.Add(linea);
  linea := '			<Name>Esca&amp;la de tiempo</Name>';
  tmplst.Add(linea);
  linea := '			<IsCustomized>true</IsCustomized>';
  tmplst.Add(linea);
  linea := '		</View>';
  tmplst.Add(linea);
  linea := '	</Views>';
  tmplst.Add(linea);
  tmplst.Text := ReplaceStr(tmplst.Text, Chr(9), '   ');
  cuerpoBase.Add(tmplst.Text);
  result := cuerpoBase;
end;

function crearGrupoPRJ(cuerpoBase: TStringList): TStringList;
var
  tmplst: TStringList;
  linea: string;
begin
  tmplst := TStringList.Create;
  linea := '	<Groups>';
  tmplst.Add(linea);
  linea := '		<Group>';
  tmplst.Add(linea);
  linea := '			<Name>&amp;Sin agrupar</Name>';
  tmplst.Add(linea);
  linea := '		</Group>';
  tmplst.Add(linea);
  linea := '		<Group>';
  tmplst.Add(linea);
  linea := '			<Name>&amp;Sin agrupar</Name>';
  tmplst.Add(linea);
  linea := '		</Group>';
  tmplst.Add(linea);
  linea := '	</Groups>';
  tmplst.Add(linea);
  tmplst.Text := ReplaceStr(tmplst.Text, Chr(9), '   ');
  cuerpoBase.Add(tmplst.Text);
  result := cuerpoBase;
end;

function cierraCuerpoBasePRJ(cuerpoBase: TStringList): TStringList;
var
  tmpstr: string;
begin
  tmpstr := '</Project>';
  result := cuerpoBase;
  result.Add(tmpstr);
end;

function generaGUID(): string;
var
  GUID: TGUID;
begin
  CreateGUID(GUID);
  result := GUIDToString(GUID);
  result := ReplaceStr(result, '{', '');
  result := ReplaceStr(result, '}', '');
end;

function crearFiltroPRJ(cuerpoBase: TStringList): TStringList;
var
  linea: string;
  tmplst: TStringList;
begin
  tmplst := TStringList.Create;
  linea := '	<Filters>';
  tmplst.Add(linea);
  linea := '		<Filter>';
  tmplst.Add(linea);
  linea := '			<Name>&amp;Todas las tareas</Name>';
  tmplst.Add(linea);
  linea := '		</Filter>';
  tmplst.Add(linea);
  linea := '		<Filter>';
  tmplst.Add(linea);
  linea := '			<Name>&amp;Todos los recursos</Name>';
  tmplst.Add(linea);
  linea := '		</Filter>';
  tmplst.Add(linea);
  linea := '	</Filters>';
  tmplst.Add(linea);
  tmplst.Text := ReplaceStr(tmplst.Text, Chr(9), '   ');
  cuerpoBase.Add(tmplst.Text);
  result := cuerpoBase;
end;

function daSimboloMoneda(Datos: string): string;
var
  qry: TUniQuery;
  tmpstr: string;
begin
  result := '';
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from currency where CurrencyISO=' + quotedstr(Datos));
      Prepare;
      ExecSQL;
      result := FieldByName('Symbol').AsString;
    end;
  finally
    qry.Free;
  end;
end;

function creaCuerpoBasePRJ(archivo, Titulo, moneda: string; FInicio, FFin:
  TDateTime): TStringList;
var
  cuerpoBase: TStringList;
  linea: string;
  fechahora: string;
  fecha: string;
  hora: string;
  tmp1, tmp2, tmp3: string;
  simboloMoneda: string;
begin
  cuerpoBase := TStringList.Create;
  fecha := FormatDateTime('yyyy-mm-dd', Now);
  hora := FormatDateTime('hh:nn:ss', Now);
  fechahora := fecha + 'T' + hora;
  if moneda = '' then
    simboloMoneda := '$'
  else
    simboloMoneda := daSimboloMoneda(moneda);
  linea := '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  cuerpoBase.Add(linea);
  linea := '<Project xmlns="http://schemas.microsoft.com/project">';
  cuerpoBase.Add(linea);
  linea := '	<SaveVersion>14</SaveVersion>';
  cuerpoBase.Add(linea);
  linea := '	<BuildNumber>16.0.14332.20517</BuildNumber>';
  cuerpoBase.Add(linea);
  linea := '	<Name>' + archivo + '</Name>';
  cuerpoBase.Add(linea);
  linea := '	<GUID>' + generaGUID + '</GUID>';
  cuerpoBase.Add(linea);
  linea := '	<Title>' + Titulo + '</Title>';
  cuerpoBase.Add(linea);
  tmp1 := FormatDateTime('yyyy-mm-dd', FInicio);
  tmp3 := tmp1 + 'T00:00:00';
  linea := '	<StartDate>' + tmp3 + '</StartDate>';
  cuerpoBase.Add(linea);
  linea := '	<CurrencySymbol>' + simboloMoneda + '</CurrencySymbol>';
  cuerpoBase.Add(linea);
  linea := '	<CurrencyCode>' + moneda + '</CurrencyCode>';
  cuerpoBase.Add(linea);
  linea := '	<ProjectExternallyEdited>0</ProjectExternallyEdited>';
  cuerpoBase.Add(linea);
  result := cuerpoBase;
  result.Text := ReplaceStr(result.Text, Chr(9), '   ');
end;

end.

