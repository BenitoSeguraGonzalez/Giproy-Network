unit DM_EDO;

interface

uses
  System.SysUtils, System.Classes, FMX.TMSFNCGraphics,
  FMX.TMSFNCGraphicsTypes,
  System.StrUtils,
  FMX.TMSFNCCustomControl, FMX.TMSFNCTreeViewBase, FMX.TMSFNCTreeViewData,
  FMX.TMSFNCCustomTreeView,
  FMX.TMSFNCTreeView, UniProvider, MySQLUniProvider, Data.DB, DBAccess,
  Uni,
  System.ImageList,
  FMX.ImgList;

type
  PEDONodeData = ^TEDONodeData;
  TEDONodeData = record
    Codigo: string;
  end;

type
  TdmEDO = class(TDataModule)
    il_PopupEDO: TImageList;
  private
    { Private declarations }
  public
    { Public declarations }

  end;

var
  dmEDO: TdmEDO;
  nodoCopy: TTMSFNCTreeViewNode;

function daCodNodoHitoPadre(nodo: TTMSFNCTreeViewNode): string;

function davalorSiguienteHitoRama(codNodoBase: string): string;

function posicionaNodoHito(codHitoPadre: string): TTMSFNCTreeViewNode;

function daUltimaPosStakeRama(nodoPadre: TTMSFNCTreeViewNode): integer;

function cambiaCodHitoNodo(nodo: TTMSFNCTreeViewNode;
  nuevoValor: integer): string;

function encuentraNodoEDO(trvw_1: TTMSFNCTreeView; nodo: TTMSFNCTreeViewNode;
  es_Hito: boolean): TTMSFNCTreeViewNode;

function QuitaPrefijoCodigo(const S: string): string;

function ObtenerDescripcionHito(const S: string): string;

procedure adicionaHito(nodo: TTMSFNCTreeViewNode;
  codHitoPadre, codHito, descripcion: string);

procedure guardarHito(codHitoPadre, codHito, descripcion: string;
  nodolevel: integer);

procedure guardarEDOCompleta(trvw_1: TTMSFNCTreeView);

procedure cargarHitoTreeView();

procedure cargarEDOCompleta();

procedure adicionaHitoTreeView(codHitoPadre, codHito, descripcion: string);

procedure renumera(trvw_1: TTMSFNCTreeView);

procedure renumeraHitos(nodoBase: TTMSFNCTreeViewNode);

procedure guardarHitoCompleto(trvw_1: TTMSFNCTreeView);

procedure borrarHitos();

procedure ActualizaHitosyEdos(trvw_1: TTMSFNCTreeView);

procedure RenombrarHito(trvw_1: TTMSFNCTreeView; Avalue: string);

procedure RenumerarEstructuraCompleta(ATree: TTMSFNCTreeView);

procedure RenumerarNivel(NodoPadre: TTMSFNCTreeViewNode; const CodigoPadre: string);

implementation

{%CLASSGROUP 'FMX.Controls.TControl'}
{$R *.dfm}

uses
  uMain, DM1;

function ObtenerDescripcionHito(const S: string): string;
var
  p: Integer;
begin
  p := Pos(' - ', S);
  if p > 0 then
    Result := Trim(Copy(S, p + 3, MaxInt))
  else
    Result := Trim(S);
end;

procedure RenumerarEstructuraCompleta(ATree: TTMSFNCTreeView);
begin
  if (ATree = nil) or (ATree.Nodes.Count = 0) then
    Exit;

  ATree.BeginUpdate;
  try
    RenumerarNivel(ATree.Nodes[0], '');
  finally
    ATree.EndUpdate;
  end;
end;

procedure RenumerarNivel(NodoPadre: TTMSFNCTreeViewNode; const CodigoPadre: string);
var
  i: Integer;
  Hijo: TTMSFNCTreeViewNode;
  NuevoCodigo, Descripcion: string;
begin
  if NodoPadre = nil then
    Exit;

  for i := 0 to NodoPadre.Nodes.Count - 1 do
  begin
    Hijo := NodoPadre.Nodes[i];

    if CodigoPadre = '' then
      NuevoCodigo := IntToStr(i + 1)
    else
      NuevoCodigo := CodigoPadre + '.' + IntToStr(i + 1);

    if Hijo.Extended then
    begin
      // HITO
      Descripcion := ObtenerDescripcionHito(Hijo.Text[0]);
      Hijo.Text[0] := NuevoCodigo + ' - ' + Descripcion;
      RenumerarNivel(Hijo, NuevoCodigo);
    end
    else
    begin
      // STAKE
      Hijo.Text[0] := NuevoCodigo;
    end;
  end;
end;

function QuitaPrefijoCodigo(const S: string): string;
var
  p: Integer;
begin
  // Si viene "0.1 - Hito 001" -> devuelve "Hito 001"
  p := Pos(' - ', S);
  if p > 0 then
    Result := Trim(Copy(S, p + 3, MaxInt))
  else
    Result := Trim(S);
end;

procedure RenombrarHito(trvw_1: TTMSFNCTreeView; Avalue: string);
var
  nodoSeleccionado: TTMSFNCTreeViewNode;
  ValorSeleccionado: string;
  x: integer;
  descripcion: string;
  descripcionOld: string;
  tmpstr: string;
  valorCodHito: string;
  qry: Tuniquery;
begin
  nodoSeleccionado := trvw_1.SelectedNode;
  descripcionOld := nodoSeleccionado.Text[0];
  descripcion := Avalue;
  valorCodHito := ReplaceStr(descripcionOld,
    ' - ' + ValorSeleccionado, '');
  descripcionOld := ReplaceStr(descripcionOld, valorCodHito + ' - ', '');
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('update presupuestos_edo_hitos set descripcion=:NewDescripcion where codBase=:codBase and codPresupuesto=:codPresupuesto and Revision=:Revision and codHito=:codHito and Descripcion=:descripcion');
      ParamByName('codBase').AsString := base_activa.codbase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codHito').AsString := valorCodHito;
      ParamByName('descripcion').AsString := descripcionOld;
      ParamByName('newDescripcion').AsString := descripcion;
      Prepare;
      ExecSQL;

      close;
      sql.Clear;
      sql.Add('update presupuestos_edo_datos set codHito=:newCodHito where codBase=:codBase and codPresupuesto=:codPresupuesto and Revision=:Revision and codHito=:codHito ');
      ParamByName('codBase').AsString := base_activa.codbase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codHito').AsString := valorCodHito + ' - '
        + descripcionOld;
      ParamByName('newcodHito').AsString := valorCodHito +
        ' - ' + descripcion;
      Prepare;
      ExecSQL;
      nodoSeleccionado.Text[0] := valorCodHito + ' - ' +
        descripcion;
    end;
  except
    qry.free;
  end;

end;

procedure ActualizaHitosyEdos(trvw_1: TTMSFNCTreeView);
begin
  if (trvw_1 = nil) or (trvw_1.Nodes.Count = 0) then
    Exit;

  trvw_1.BeginUpdate;
  try
    // Nodes[0] es contenedor, no se numera
    RenumerarNivel(trvw_1.Nodes[0], '');
  finally
    trvw_1.EndUpdate;
  end;

  // Persistencia
  guardarHitoCompleto(trvw_1);
  guardarEDOCompleta(trvw_1);
end;

procedure borrarHitos();
var
  qry: Tuniquery;
begin
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('delete from presupuestos_edo_hitos where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision ');
      ParamByName('codBase').AsString := base_activa.codbase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
    end;
  finally
    qry.free;
  end;
end;

procedure guardarHitoCompleto(trvw_1: TTMSFNCTreeView);
var
  Nodo: TTMSFNCTreeViewNode;
  Descripcion: string;
  CodHito: string;
  CodHitoPadre: string;
  PosSep: Integer;
  qry: TUniQuery;
begin
  borrarHitos;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    qry.SQL.Text :=
      'INSERT INTO presupuestos_edo_hitos ' +
      '(codBase, codPresupuesto, revision, codHito, descripcion, codHitoBase, nodoLevel) ' +
      'VALUES (:codBase, :codPresupuesto, :revision, :codHito, :descripcion, :codHitoBase, :nodoLevel)';

    Nodo := trvw_1.Nodes[0].GetNext;

    while Assigned(Nodo) do
    begin
      if Nodo.Extended then
      begin
        PosSep := Pos(' - ', Nodo.Text[0]);

        if PosSep > 0 then
        begin
          CodHito := Copy(Nodo.Text[0], 1, PosSep - 1).Trim;
          Descripcion := Copy(Nodo.Text[0], PosSep + 3, MaxInt).Trim;
        end
        else
        begin
          CodHito := Nodo.Text[0];
          Descripcion := '';
        end;

        if (Nodo.getParent <> nil) and (Nodo.getParent <> trvw_1.Nodes[0]) then
        begin
          PosSep := Pos(' - ', Nodo.getParent.Text[0]);
          if PosSep > 0 then
            CodHitoPadre := Copy(Nodo.getParent.Text[0], 1, PosSep - 1).Trim
          else
            CodHitoPadre := Nodo.getParent.Text[0];
        end
        else
          CodHitoPadre := '';

        qry.ParamByName('codBase').AsString := base_activa.codbase;
        qry.ParamByName('codPresupuesto').AsString := codProyecto;
        qry.ParamByName('revision').AsString := revision;
        qry.ParamByName('codHito').AsString := CodHito;
        qry.ParamByName('descripcion').AsString := Descripcion;
        qry.ParamByName('codHitoBase').AsString := CodHitoPadre;
        qry.ParamByName('nodoLevel').AsInteger := Nodo.VirtualNode.Level;

        qry.ExecSQL;
      end;

      Nodo := Nodo.GetNext;
    end;
  finally
    qry.Free;
  end;
end;

procedure renumeraHitos(nodoBase: TTMSFNCTreeViewNode);
var
  nodo: TTMSFNCTreeViewNode;
  x: integer;
  tmpstr, tmpstr2: string;
begin
  x := 1;
  nodo := nodoBase.GetFirstChild;
  tmpstr2 := nodo.GetParent.Text[0];
  while (nodo <> nil) do
  begin
    if nodo.Extended then
    begin
      tmpstr := nodo.Text[0];
      nodo.Text[0] := cambiaCodHitoNodo(nodo, x);
      if nodo.Nodes.Count > 0 then
        renumeraHitos(nodo);
      Inc(x);
    end;
    nodo := nodo.GetNextSibling;
  end;
end;

function encuentraNodoEDO(trvw_1: TTMSFNCTreeView; nodo: TTMSFNCTreeViewNode;
  es_Hito: boolean): TTMSFNCTreeViewNode;
var
  nodoBusqueda: TTMSFNCTreeViewNode;
  salir: boolean;
begin
  result := nil;
  nodoBusqueda := trvw_1.Nodes[0];
  salir := false;
  while (nodo <> nil) and (nodoBusqueda <> nil) and (not salir) do
  begin
    if nodoBusqueda.Extended = es_Hito then
    begin
      if (nodo.Text[0] = nodoBusqueda.Text[0]) and
        (nodo.Text[1] = nodoBusqueda.Text[1]) and
        (nodo.Text[2] = nodoBusqueda.Text[2]) and
        (nodo.Text[3] = nodoBusqueda.Text[3]) and
        (nodo.Text[4] = nodoBusqueda.Text[4]) then
      begin
        result := nodoBusqueda;
        salir := true;
      end;
    end;
    nodoBusqueda := nodoBusqueda.GetNext;
  end;
end;

function cambiaCodHitoNodo(nodo: TTMSFNCTreeViewNode;
  nuevoValor: integer): string;
var
  tmpstr, tmpstr2: string;
  parte2: string;
  x, y: integer;
  parte1: string;
begin
  tmpstr := nodo.Text[0];
  x := ansipos(' - ', tmpstr);
  y := ansipos(' - ', nodo.GetParent.Text[0]);
  parte2 := Copy(tmpstr, x, length(tmpstr));
  if (x > 0) and (y > 0) then
  begin
    tmpstr2 := nodo.GetParent.Text[0];
    parte1 := Copy(tmpstr2, 1, y - 1) + '.' + IntToStr(nuevoValor);
  end
  else
  begin
    parte1 := Copy(tmpstr, 1, x - 1);
    parte1 := AnsiReverseString(parte1);
    x := ansipos('.', parte1);
    parte1 := Copy(parte1, x, length(parte1));
    parte1 := AnsiReverseString(parte1) + IntToStr(nuevoValor);
  end;
  result := parte1 + parte2;
end;

function daCodNodoHitoPadre(nodo: TTMSFNCTreeViewNode): string;
var
  tmpstr: string;
  x: integer;
begin
  result := '0';
  tmpstr := nodo.Text[0];
  x := ansipos(' - ', tmpstr);
  if x > 0 then
  begin
    tmpstr := Copy(tmpstr, 1, x - 1).Trim;
    result := tmpstr;
  end;
end;

function davalorSiguienteHitoRama(codNodoBase: string): string;
var
  qry: Tuniquery;
  newcodHito: string;
  x: integer;
begin
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select codHito from presupuestos_edo_hitos where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision and codHitoBase=:codHitoBase order by codHito desc limit 1');
      ParamByName('codBase').AsString := base_activa.codbase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codHitoBase').AsString := codNodoBase;
      Prepare;
      ExecSQL;
      newcodHito := FieldByName('codHito').AsString;
      newcodHito := ansiReplaceStr(newcodHito,
        codNodoBase + '.', '');
      x := strtointdef(newcodHito, 0);
      Inc(x);
      result := IntToStr(x);
    end;
  finally
    qry.free;
  end;
end;

function posicionaNodoHito(codHitoPadre: string): TTMSFNCTreeViewNode;
var
  salir: boolean;
  nodo: TTMSFNCTreeViewNode;
  x: integer;
  tmpstr: string;
begin
  result := nil;
  salir := false;
  nodo := frmMain.Trvw_EDO.Nodes[0];
  while (not salir) and (nodo <> nil) do
  begin
    tmpstr := nodo.Text[0];
    x := ansipos(' - ', tmpstr);
    if x > 0 then
      tmpstr := Copy(tmpstr, 1, x - 1).Trim;
    if tmpstr = codHitoPadre then
    begin
      result := nodo;
      salir := true;
    end;
    nodo := nodo.GetNext;
  end;
  if result = nil then
    result := frmMain.Trvw_EDO.Nodes[0];
end;

function daUltimaPosStakeRama(nodoPadre: TTMSFNCTreeViewNode): integer;
var
  x: integer;
  nodoPos: TTMSFNCTreeViewNode;
begin
  result := 0;
  for x := 0 to nodoPadre.Nodes.Count - 1 do
  begin
    nodoPos := nodoPadre.Nodes[x];
    if not nodoPos.Extended then
      result := x + 1;
  end;
end;

procedure adicionaHito(nodo: TTMSFNCTreeViewNode;
  codHitoPadre, codHito, descripcion: string);
var
  newNode: TTMSFNCTreeViewNode;
begin
  newNode := frmMain.Trvw_EDO.AddNode(nodo);
  if codHitoPadre <> '0' then
    newNode.Text[0] := codHitoPadre + '.' + codHito + ' - ' +
      descripcion
  else
    newNode.Text[0] := codHito + ' - ' + descripcion;
  newNode.Extended := true;
end;

procedure guardarHito(codHitoPadre, codHito, descripcion: string;
  nodolevel: integer);
var
  qry: Tuniquery;
begin
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('insert into presupuestos_edo_hitos (codBase, codPresupuesto, revision, codHitoBase, codHito, descripcion, nodolevel) ');
      sql.Add('Values  (:codBase, :codPresupuesto, :revision, :codHitoBase, :codHito, :descripcion, :nodolevel)');
      ParamByName('codBase').AsString := base_activa.codbase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codHitoBase').AsString := codHitoPadre;
      ParamByName('codHito').AsString := codHito;
      ParamByName('descripcion').AsString := descripcion;
      ParamByName('nodolevel').AsInteger := nodolevel;
      Prepare;
      ExecSQL;
    end;
  finally
    qry.free;
  end;
end;

procedure guardarEDOCompleta(trvw_1: TTMSFNCTreeView);
var
  qry: TUniQuery;
  Nodo: TTMSFNCTreeViewNode;
  CodHito: string;
  PosSep: Integer;
begin
  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    qry.SQL.Text :=
      'DELETE FROM presupuestos_edo_datos ' +
      'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND Revision=:revision';

    qry.ParamByName('codBase').AsString := base_activa.codbase;
    qry.ParamByName('codPresupuesto').AsString := codProyecto;
    qry.ParamByName('revision').AsString := revision;
    qry.ExecSQL;

    qry.SQL.Text :=
      'INSERT INTO presupuestos_edo_datos ' +
      '(codBase, codPresupuesto, Revision, codHito, RolProyecto, idStake, Responsable, idUnico, ActividadClave) ' +
      'VALUES (:codBase, :codPresupuesto, :Revision, :codHito, :RolProyecto, :idStake, :Responsable, :idUnico, :ActividadClave)';

    Nodo := trvw_1.Nodes[0].GetNext;

    while Assigned(Nodo) do
    begin
      if not Nodo.Extended then
      begin
        PosSep := Pos(' - ', Nodo.getParent.Text[0]);
        if PosSep > 0 then
          CodHito := Copy(Nodo.getParent.Text[0], 1, PosSep - 1).Trim
        else
          CodHito := Nodo.getParent.Text[0];

        qry.ParamByName('codBase').AsString := base_activa.codbase;
        qry.ParamByName('codPresupuesto').AsString := codProyecto;
        qry.ParamByName('revision').AsString := revision;
        qry.ParamByName('codHito').AsString := CodHito;
        qry.ParamByName('RolProyecto').AsString := Nodo.Text[1];
        qry.ParamByName('idStake').AsString := Nodo.Text[2];
        qry.ParamByName('Responsable').AsString := Nodo.Text[3];
        qry.ParamByName('ActividadClave').AsString := Nodo.Text[4];
        qry.ParamByName('idUnico').AsString := Nodo.Text[5];

        qry.ExecSQL;
      end;

      Nodo := Nodo.GetNext;
    end;
  finally
    qry.Free;
  end;
end;

procedure cargarHitoTreeView();
var
  qry: Tuniquery;
  codHitoPadre: string;
  codHito: string;
  descripcion: string;
begin
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from presupuestos_edo_hitos where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision order by nodolevel, codHitoBase, codhito asc');
      ParamByName('codBase').AsString := base_activa.codbase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        codHitoPadre :=
          FieldByName('codHitoBase').AsString;
        codHito := FieldByName('codHito').AsString;
        descripcion :=
          FieldByName('descripcion').AsString;
        adicionaHitoTreeView(codHitoPadre, codHito,
          descripcion);
        Next;
      end;
    end;
  finally
    qry.free;
    frmMain.Trvw_EDO.ExpandAll;
  end;
end;

procedure cargarEDOCompleta();
var
  qry: Tuniquery;
  nodo, nodoPos: TTMSFNCTreeViewNode;
  codHito: string;
  x: integer;
begin
  qry := Tuniquery.Create(nil);
  try
    with qry do
    begin
      connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from presupuestos_edo_datos  where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision order by id desc');
      ParamByName('codBase').AsString := base_activa.codbase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        codHito := FieldByName('codHito').AsString;
        x := ansipos(' - ', codHito);
        if x > 0 then
          codHito := Copy(codHito, 1, x - 1).Trim;
        nodo := posicionaNodoHito(codHito);
        if Assigned(nodo) and
          (nodo <> frmMain.Trvw_EDO.Nodes[0]) then
        begin
          nodoPos :=
            frmMain.Trvw_EDO.InsertNode(0, nodo);
          nodoPos.Text[2] :=
            FieldByName('idstake').AsString;
          nodoPos.Text[3] :=
            FieldByName('responsable').AsString;
          nodoPos.Text[1] :=
            FieldByName('RolProyecto').AsString;
          nodoPos.Text[4] :=
            FieldByName('actividadClave').AsString;
          nodoPos.Text[5] :=
            FieldByName('idUnico').AsString;
        end;

        Next;
      end;
    end;
  finally
    renumera(frmMain.Trvw_EDO);
    qry.free;
  end;
end;

procedure adicionaHitoTreeView(codHitoPadre, codHito, descripcion: string);
var
  nodo, nodoPadre: TTMSFNCTreeViewNode;
begin
  if codHitoPadre = '0' then
  begin
    nodoPadre := frmMain.Trvw_EDO.Nodes[0];
  end
  else
  begin
    nodoPadre := posicionaNodoHito(codHitoPadre);
  end;
  nodo := frmMain.Trvw_EDO.AddNode(nodoPadre);
  nodo.Extended := true;
  nodo.Text[0] := codHito + ' - ' + descripcion;
  frmMain.Trvw_EDO.ExpandAll;
end;

procedure renumera(trvw_1: TTMSFNCTreeView);
var
  valorCodEDO: integer;
  nodo: TTMSFNCTreeViewNode;
begin
  nodo := trvw_1.Nodes[0];
  valorCodEDO := 1;
  while Assigned(nodo) do
  begin
    if not nodo.Extended then
    begin
      nodo.Text[0] := IntToStr(valorCodEDO);
      Inc(valorCodEDO);
    end;
    nodo := nodo.GetNext;
  end;
end;

end.

