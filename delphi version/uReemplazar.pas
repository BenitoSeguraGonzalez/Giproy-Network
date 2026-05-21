unit uReemplazar;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FMX.Effects,
  Uni, FMX.Edit, FMX.Objects, FMX.Controls.Presentation, FMX.StdCtrls,
  FMX.Layouts, FMX.ListBox, FMX.TMSFNCTypes, FMX.TMSFNCUtils,
  FMX.TMSFNCGraphics,
  FMX.TMSFNCGraphicsTypes, FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions,
  FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl,
  FMX.TMSFNCGridData,
  FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid;

type
  TfrmReemplazar = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_DatosGenerales: TLayout;
    lyt_9: TLayout;
    lbl_3: TLabel;
    ln_ln1: TLine;
    lyt_11: TLayout;
    rect_5: TRectangle;
    Shadow_filtro: TShadowEffect;
    edt_Filtro: TEdit;
    lyt_1: TLayout;
    grid_reemplazo: TTMSFNCGrid;
    lyt_7: TLayout;
    lbl_banner2: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_Categoria: TLabel;
    lbl_funcion: TLabel;
    lbl_Codigo: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    procedure rect_CloseMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_CancelarMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_AceptarMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure FormShow(Sender: TObject);
    procedure edt_FiltroEnter(Sender: TObject);
    procedure edt_FiltroExit(Sender: TObject);
    procedure edt_FiltroChangeTracking(Sender: TObject);
    procedure grid_reemplazoDblClick(Sender: TObject);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure rect_CancelarMouseLeave(Sender: TObject);
  private
    { Private declarations }
    codCategoriaTrabajo: string;
    procedure muestraDisponibleCategorias();
    procedure limpiaListaDisponibles();
    procedure realizarCambioRecursos(codRecurso, idUnicoRecurso,
      descripcion, unidad, precio,
      idUnicoRecursoCambiocodRecursocambio: string);
  public
    { Public declarations }
  end;

var
  frmReemplazar: TfrmReemplazar;

implementation

{$R *.fmx}

uses
  DM1;

procedure TfrmReemplazar.edt_FiltroChangeTracking(Sender: TObject);
var
  fltr: TTMSFNCGridFilterData;
begin
  grid_reemplazo.UnHideRowsAll;
  grid_reemplazo.Filter.Clear;
  if edt_Filtro.Text <> '' then
  begin
    fltr := grid_reemplazo.Filter.Add;
    fltr.Column := 1;
    fltr.CaseSensitive := false;
    fltr.Condition := '*' + edt_Filtro.Text + '*';
    grid_reemplazo.ApplyFilter;
  end;
end;

procedure TfrmReemplazar.edt_FiltroEnter(Sender: TObject);
begin
  Shadow_filtro.Enabled := True;
end;

procedure TfrmReemplazar.edt_FiltroExit(Sender: TObject);
begin
  Shadow_filtro.Enabled := false;
end;

procedure TfrmReemplazar.FormShow(Sender: TObject);
begin
  codCategoriaTrabajo := daDatoCodigo(lbl_Categoria.Text, 1);
  muestraDisponibleCategorias;
end;

procedure TfrmReemplazar.grid_reemplazoDblClick(Sender: TObject);
var
  posicion: integer;
  tmpstr: string;
  codRecurso: string;
  codRecursocambio: string;
  descripcion: string;
  unidad: string;
  codCompletoRecurso: string;
  precio: string;
  i: integer;
begin
  posicion := grid_reemplazo.Selection.StartRow;
  if posicion > 0 then
  begin
    tmpstr := lbl_banner2.Text;
    tmpstr := StringReplace(tmpstr,
      'Recurso para Reemplazar:', '', []);
    tmpstr := Trim(tmpstr);
    if realizarPreguntaSiNo('¿Cambiar el Recurso: ' + tmpstr + ' -> ' +
      grid_reemplazo.Cells[1, posicion] + '?') <> mrOK then
      Exit;

    posicion := grid_reemplazo.Selection.StartRow;
    codRecurso := lbl_Codigo.Text;
    codRecursocambio := grid_reemplazo.Cells[3, posicion];
    codCompletoRecurso := grid_reemplazo.Cells[4, posicion];
    descripcion := grid_reemplazo.Cells[1, posicion];
    unidad := grid_reemplazo.Cells[2, posicion];
    precio := grid_reemplazo.Cells[5, posicion];
    if (codRecursocambio <> '') and (codRecurso <> codRecursocambio) then
    begin
      realizarCambioRecursos(codCompletoRecurso, codRecursocambio, descripcion, unidad, precio, codRecurso);
      ShowMessage('Recurso Reemplazado.');
      frmReemplazar.Close;
    end;
  end;
end;

procedure TfrmReemplazar.limpiaListaDisponibles;
begin
  grid_reemplazo.ClearNormalCells;
  grid_reemplazo.RowCount := 1;
  grid_reemplazo.Cells[0, 0] := '#';
  grid_reemplazo.Cells[1, 0] := 'Descripción';
  grid_reemplazo.Cells[2, 0] := 'Unidad';
end;

procedure TfrmReemplazar.muestraDisponibleCategorias;
var
  qry: TUniQuery;
  tmpstr: string;
  X: integer;
begin
  limpiaListaDisponibles;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from recursos where codBase=' +
        QuotedStr(base_activa.codBase) +
        ' and codCategoriaBase=' +
        QuotedStr(codCategoriaTrabajo) +
        ' order by descripcion asc');
      prepare;
      ExecSQL;
      X := 1;
      while not Eof do
      begin
        grid_reemplazo.Cells[0, X] :=
          NcaracteresDelante(inttostr(X), 3);
        grid_reemplazo.Cells[1, X] :=
          FieldByName('descripcion').AsString;
        grid_reemplazo.Cells[2, X] :=
          FieldByName('unidad').AsString;
        grid_reemplazo.Cells[3, X] :=
          FieldByName('idUnico').AsString;
        tmpstr := generaCodigoRecurso
          (FieldByName('codCategoriaBase').AsString,
          FieldByName('codSubCategoria').AsString,
          FieldByName('codRecurso').AsString);
        grid_reemplazo.Cells[4, X] := tmpstr;
        tmpstr := FieldByName('precio').AsString;
        grid_reemplazo.Cells[5, X] := tmpstr;
        inc(X);
        Next;
      end;
      grid_reemplazo.RowCount := X;
      grid_reemplazo.AutoSizeColumn(0, True, 20);
      grid_reemplazo.AutoSizeColumn(1, True, 15);
      grid_reemplazo.AutoSizeColumn(2, True, 15);
      grid_reemplazo.ColumnWidths[3] := 0;
      grid_reemplazo.ColumnWidths[4] := 0;
      grid_reemplazo.ColumnWidths[5] := 0;
    end;
  finally
    qry.Free;
  end;
end;

procedure TfrmReemplazar.realizarCambioRecursos(codRecurso, idUnicoRecurso,
  descripcion, unidad, precio, idUnicoRecursoCambiocodRecursocambio: string);
type
  recursoAPU = record
    codApu: string;
    Cantidad: string;
    rendimiento: string;
    TotalCalculado: string;
    PorcentajeCostoIndirecto: string;
  end;
var
  qry: TUniQuery;
  X: integer;
  listadoApusCambiar: array of recursoAPU;
  operacionesApus: integer;
  total: string;
  tmpflt, tmpflt2, tmpflt3: Double;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      SetLength(listadoApusCambiar, 0);
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      operacionesApus := 0;
      // Adquirir en apus donde efectuar cambio
      sql.Add('select * from APUS_Items where idUnicoRecurso='
        + QuotedStr(idUnicoRecursoCambiocodRecursocambio) +
        ' and codBase=' + QuotedStr(base_activa.codBase));
      prepare;
      ExecSQL;
      while not Eof do
      begin
        SetLength(listadoApusCambiar,
          operacionesApus + 1);
        listadoApusCambiar[operacionesApus].codApu :=
          FieldByName('codAPU').AsString;
        listadoApusCambiar[operacionesApus].Cantidad :=
          FieldByName('cantidadUnidad').AsString;
        listadoApusCambiar[operacionesApus].rendimiento
          := FieldByName('rendimiento').AsString;
        Next;
        inc(operacionesApus);
      end;
      // Realizar el cambio de Items y Calculo de Subtotal
      if operacionesApus > 0 then
      begin
        Close;
        sql.Clear;
        sql.Add('update APUS_Items set codSubcategoria=:codSubcategoria, idUnicoRecurso=:idUnicoRecurso, codRecurso=:codRecurso, descripcion=:descripcion, unidad=:unidad, precio=:precio, total=:total ');
        sql.Add('where idUnicoRecurso=' +
          QuotedStr(
          idUnicoRecursoCambiocodRecursocambio) +
          ' and codBase=' +
          QuotedStr(base_activa.codBase));
        prepare;
        for X := 0 to length(listadoApusCambiar) - 1 do
        begin
          tmpflt := StrToFloat
            (listadoApusCambiar[X].Cantidad);
          tmpflt := tmpflt * StrToFloat(precio);
          tmpflt := tmpflt *
            StrToFloat
            (listadoApusCambiar[X].rendimiento);
          total := FloatToStr(tmpflt);
          ParamByName('codSubcategoria').AsString
            := daDatoCodigo(codRecurso, 2);
          ParamByName('idunicoRecurso').AsString
            := idUnicoRecurso;
          ParamByName('codRecurso').AsString :=
            daDatoCodigo(codRecurso, 3);
          ParamByName('descripcion').AsString :=
            descripcion;
          ParamByName('unidad').AsString
            := unidad;
          ParamByName('precio').AsString
            := precio;
          ParamByName('total').AsString := total;
          ExecSQL;
        end;
        // Reajustar totales en APUS
        Close;
        sql.Clear;
        for X := 0 to length(listadoApusCambiar) - 1 do
        begin
          sql.Add('select count(total) as TotalesRecalculados from APUS_Items where codApu='
            + QuotedStr(listadoApusCambiar[X]
            .codApu) + ' and codBase=' +
            QuotedStr(base_activa.codBase));
          prepare;
          ExecSQL;
          listadoApusCambiar[X].TotalCalculado :=
            FieldByName
            ('totalesRecalculados').AsString;
        end;
        // Actualizar totales en APUS
        Close;
        sql.Clear;
        for X := 0 to length(listadoApusCambiar) - 1 do
        begin
          sql.Add('select * from APUS where codAPU='
            + QuotedStr(listadoApusCambiar[X]
            .codApu) + ' and codBase=' +
            QuotedStr(base_activa.codBase));
          prepare;
          ExecSQL;
          listadoApusCambiar[X]
            .PorcentajeCostoIndirecto :=
            FieldByName
            ('porcentajeCostoIndirecto').AsString;
        end;

        Close;
        sql.Clear;
        for X := 0 to length(listadoApusCambiar) - 1 do
        begin
          sql.Add('update APUS set costoDirectoTotal=:costoDirectoTotal, CostoIndirectoTotal=:costoIndirectoTotal, PrecioUnitarioTotal=:PrecioUnitarioTotal where codAPU='
            + QuotedStr(listadoApusCambiar[X]
            .codApu) + ' and codBase=' +
            QuotedStr(base_activa.codBase));
          prepare;
          ParamByName('costoDirectoTotal')
            .AsString := listadoApusCambiar[X]
            .TotalCalculado;
          tmpflt := StrToFloat
            (listadoApusCambiar[X].TotalCalculado);
          tmpflt2 :=
            StrToFloat
            (listadoApusCambiar[X]
            .PorcentajeCostoIndirecto);
          tmpflt3 := (tmpflt * tmpflt2) / 100;
          ParamByName('CostoIndirectoTotal')
            .AsString := FloatToStr(tmpflt3);
          tmpflt3 := tmpflt3 + tmpflt;
          ParamByName('PrecioUnitarioTotal')
            .AsString := FloatToStr(tmpflt3);
          ExecSQL;
        end;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure TfrmReemplazar.rect_1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  frmReemplazar.StartWindowDrag;
end;

procedure TfrmReemplazar.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmReemplazar.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := false;
end;

procedure TfrmReemplazar.rect_AceptarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
var
  posicion: integer;
  tmpstr: string;
  codRecurso: string;
  codRecursocambio: string;
  descripcion: string;
  unidad: string;
  codCompletoRecurso: string;
  precio: string;
  i: integer;
begin
  iGlow_Aceptar.Enabled := false;
  posicion := grid_reemplazo.Selection.StartRow;
  if posicion > 0 then
  begin
    tmpstr := lbl_banner2.Text;
    tmpstr := StringReplace(tmpstr,
      'Recurso para Reemplazar:', '', []);
    tmpstr := Trim(tmpstr);

    if realizarPreguntaSiNo('¿Cambiar el Recurso: ' + tmpstr + ' -> ' + grid_reemplazo.Cells[1, posicion] +
      '?') <> mrOK then
      Exit;
    posicion := grid_reemplazo.Selection.StartRow;
    codRecurso := lbl_Codigo.Text;
    codRecursocambio := grid_reemplazo.Cells[3, posicion];
    codCompletoRecurso := grid_reemplazo.Cells[4, posicion];
    descripcion := grid_reemplazo.Cells[1, posicion];
    unidad := grid_reemplazo.Cells[2, posicion];
    precio := grid_reemplazo.Cells[5, posicion];
    if (codRecursocambio <> '') and (codRecurso <> codRecursocambio) then
    begin
      realizarCambioRecursos(codCompletoRecurso, codRecursocambio, descripcion, unidad, precio, codRecurso);
      MuestraMensajeGiProy('Información', 'Recurso Reemplazado.');
      ModalResult := mrOk;
    end;
  end;
end;

procedure TfrmReemplazar.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure TfrmReemplazar.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := false;
end;

procedure TfrmReemplazar.rect_CancelarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  iGlow_Cancelar.Enabled := false;
  ModalResult := mrOk;
end;

procedure TfrmReemplazar.rect_CloseMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  ModalResult := mrOk;
end;

end.

