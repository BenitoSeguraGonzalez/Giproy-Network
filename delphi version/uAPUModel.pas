unit uAPUModel;

interface

uses
  System.SysUtils,
  System.Generics.Collections,
  System.StrUtils, FMX.TMSTreeViewBase, FMX.TMSTreeViewData,
  FMX.TMSCustomTreeView, FMX.TMSTreeView;

type
  TAPUItem = record
    IdUnicoRecurso: string;
    CodCategoria: string;
    CodSubCategoria: string;
    CodRecurso: string;
    CodRecursoCompleto: string;
    Descripcion: string;
    Unidad: string;
    Precio: Double;
    Cantidad: Double;
    Rendimiento: Double;
    Total: Double;
    Porcentaje: Double;
  end;

  TAPUModel = class
  private
    FCodAPU: string;
    FCodRecursoAPU: Integer;
    FItems: TList<TAPUItem>;
  public
    constructor Create;
    destructor Destroy; override;

    property CodAPU: string read FCodAPU write FCodAPU;
    property CodRecursoAPU: Integer read FCodRecursoAPU;
    property Items: TList<TAPUItem>read FItems;

    procedure Clear;
    procedure RebuildFromTree(ATree: TTMSFMXTreeView);
  end;

implementation

uses
  Math, DM1;

{ TAPUModel }

constructor TAPUModel.Create;
begin
  inherited Create;
  FItems := TList<TAPUItem>.Create;
end;

destructor TAPUModel.Destroy;
begin
  FItems.Free;
  inherited;
end;

procedure TAPUModel.Clear;
begin
  FItems.Clear;
  FCodRecursoAPU := 0;
end;

procedure TAPUModel.RebuildFromTree(ATree: TTMSFMXTreeView);
var
  nodo, subNodo: TTMSFMXTreeViewNode;
  Item: TAPUItem;
  Cod: string;
begin
  Clear;

  if (ATree = nil) or (ATree.Nodes.Count = 0) then
    raise Exception.Create('APU sin nodos en TreeView');

  // Nodo raíz
  nodo := ATree.Nodes[0];

  Cod := daDatoCodigo(nodo.Text[0], 3);
  if (Cod = '') or (not TryStrToInt(Cod, FCodRecursoAPU)) then
    raise Exception.Create('codRecursoAPU inválido en nodo raíz');

  subNodo := nodo.GetFirstChild;
  while Assigned(subNodo) do
  begin
    if Trim(subNodo.Text[0]) <> '' then
    begin
      Item.IdUnicoRecurso := subNodo.Text[9];
      Item.CodCategoria := daDatoCodigo(subNodo.Text[0], 1);
      Item.CodSubCategoria := daDatoCodigo(subNodo.Text[0], 2);
      Item.CodRecurso := daDatoCodigo(subNodo.Text[0], 3);
      Item.CodRecursoCompleto :=
        generaCodigoRecurso(Item.CodCategoria, Item.CodSubCategoria, Item.CodRecurso);

      Item.Descripcion := subNodo.Text[1];
      Item.Unidad := subNodo.Text[2];
      Item.Cantidad := StrToFloatDef(subNodo.Text[3], 0);
      Item.Precio := StrToFloatDef(subNodo.Text[4], 0);
      Item.Rendimiento := IfThen(subNodo.Text[5] = '', 1, StrToFloatDef(subNodo.Text[5], 1));
      Item.Total := StrToFloatDef(subNodo.Text[6], 0);
      Item.Porcentaje := StrToFloatDef(StringReplace(subNodo.Text[7], '%', '', []), 0);

      FItems.Add(Item);
    end;

    subNodo := subNodo.GetNextSibling;
  end;
end;

end.

