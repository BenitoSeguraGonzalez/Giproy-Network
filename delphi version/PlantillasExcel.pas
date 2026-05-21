unit PlantillasExcel;

interface

uses
  SysUtils, System.StrUtils, System.Math, FlexCel.Core,
  FlexCel.FMXSupport,
  FlexCel.XlsAdapter,
  System.Variants, IOUtils, DM1, Uni, System.Classes;

type
  dat_localRespApus = record
    codigoApus: string;
    descripcion: string;
    unidad: string;
    costoDirectoTotal: string;
    porcentajeIndirecto: string;
    costoIndirecto: string;
    Total: string;
    moneda: string;
  end;

type
  dat_celda = record
    R: Integer;
    C: Integer;
  end;

procedure copiaXLSRow(xls: TExcelFile; ARowInicio, AColInicio, ARowFin, AColFin,
  ARowDestino, AColDestino: Integer);

procedure creaEncabezadoPresupuesto(xls: TExcelFile; tipo: Integer;
  Titulo, Oferente, Ubicacion, Fecha, codReferencial: string);

procedure creaLineaPresupuesto(xls: TExcelFile; ARowInsercion: Integer;
  codEDT, NItem, codItem, descripcion, unidad, cantidad, PUnitario,
  Ptotal: string);

procedure creaLineaSubTotalAPU(xls: TExcelFile;
  tipo, subtotal, Porcentaje: string);

procedure borraLineaPlantilla(xls: TExcelFile; triggerStr: string);

procedure borraLineaPlantillaAPU(xls: TExcelFile);

procedure creaResumenPresupuesto(xls: TExcelFile; tipo: Integer;
  subtotal, porcentajeIVA, IVA, Total, moneda: string);

procedure CrearEncabezadoAPUS(xls: TExcelFile;
  Codigo, descripcion, unidad: string);

procedure creaLineaAPUS(xls: TExcelFile; tipo, codRecurso, descripcion, unidad,
  cantidad, precio, Rendimiento, Total, Porcentaje: string);

procedure CrearResumenAPUS(xls: TExcelFile;
  costoDirectoTotal, porcentajeIndirecto, costoIndirecto, Total,
  moneda: string);

procedure CrearEncabezadoAPUS_SERCOP(xls: TExcelFile;
  Codigo, descripcion, unidad: string);

procedure crearCuerpoAPUS(xls: TExcelFile; codigoApus: string; modelo: Integer;
  SSO: Boolean; totalPresupuesto: string);

procedure sustituye_en_Excel(xls: TExcelFile; parametroBusqueda: string;
  ParametroSustitucion: Variant);

function CantidadALetra(curCantidad: Currency; MonedaNacional: string): string;

function BuscaValor(xls: TExcelFile; Arow: Integer): Integer;

function buscaPosicionCaracter(xls: TExcelFile; Arow: Integer;
  cadenaBuscar: string): Integer;

function localizaArow(xls: TExcelFile; CadenaBusqueda: string): Integer;

function Consolidate(const fileNames: TArray<string>; const OnlyData: Boolean)
  : TExcelFile;

function daDatos1Apus(const Codigo: string): dat_localRespApus;

function generaApusProyecto(): TStringList;

function BuscaCadenaExcel(xls: TExcelFile; Pagina: Integer;
  CadenaBusqueda: string): dat_celda;

function BuscaValordeEntrada(xls: TExcelFile; Pagina: Integer;
  pExcel: dat_celda): string;

function EncuentraSheetxNombre(xls: TExcelFile; nombreSheet: string): Integer;

implementation

var
  i: Integer;
  cantidad, Centavos: Currency;
  BloqueCero, NumeroBloques, Digito: Byte;
  PrimerDigito, SegundoDigito, TercerDigito: Byte;
  Resultado, Temp, Bloque: string;
  Unidades: array[0..28] of string;
  Decenas: array[0..8] of string;
  Centenas: array[0..8] of string;
  ultimaLetra: string;
  ARowInsercion: Integer;

function EncuentraSheetxNombre(xls: TExcelFile; nombreSheet: string): Integer;
var
  x: Integer;
  salir: Boolean;
  tmpstr: string;
begin
  x := 1;
  Result := -1;
  salir := false;
  while (not salir) and (x <= xls.SheetCount) do
  begin
    tmpstr := xls.GetSheetName(x);
    if tmpstr = nombreSheet then
    begin
      salir := True;
      Result := x;
    end;
    Inc(x);
  end;
end;

procedure CrearEncabezadoAPUS_SERCOP(xls: TExcelFile;
  Codigo, descripcion, unidad: string);
var
  salir: Boolean;
  R, C: Integer;
  v: TCellValue;
  tmpstr: string;
begin
  salir := false;
  xls.SheetName := Codigo;
  R := 1;
  while (not salir) and (R < xls.RowCount) do
  begin
    C := BuscaValor(xls, R);
    if C > -1 then
    begin
      v := xls.GetCellValue(R, C);
      tmpstr := v.ToString;
      if tmpstr = '#CODIGO_APU' then
      begin
        xls.SetCellValue(R, C, Codigo, -1);
      end;
      if tmpstr = '#DESCRIPCION' then
      begin
        xls.SetCellValue(R, C, descripcion, -1);
        C := buscaPosicionCaracter(xls, R, '#UNIDAD');
        if C > -1 then
        begin
          xls.SetCellValue(R, C, unidad, -1);
        end;
      end;
    end;
    Inc(R);
  end;
end;

procedure sustituye_en_Excel(xls: TExcelFile; parametroBusqueda: string;
  ParametroSustitucion: Variant);
var
  salir: Boolean;
  R, C: Integer;
  v: TCellValue;
  CadenaBusqueda: string;
begin
  salir := false;
  R := 1;
  while (not salir) and (R < xls.RowCount + 1) do
  begin
    C := 1;
    while (C < xls.ColCount + 1) and (not salir) do
    begin
      v := xls.GetCellValue(R, C);
      CadenaBusqueda := v.ToString;
      if CadenaBusqueda = parametroBusqueda then
      begin
        xls.SetCellValue(R, C,
          ParametroSustitucion, -1);
        salir := True;
      end;
      Inc(C);
    end;
    Inc(R);
  end;
end;

procedure creaLineaSubTotalAPU(xls: TExcelFile;
  tipo, subtotal, Porcentaje: string);
var
  Psubtotal, Pporcentaje: string;
  ARowInsercion: Integer;
  C: Integer;
begin
  Psubtotal := '#TOTAL' + tipo;
  Pporcentaje := '#TOTPORCENT' + tipo;
  ARowInsercion := localizaArow(xls, Psubtotal);
  C := buscaPosicionCaracter(xls, ARowInsercion, Psubtotal);
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, subtotal);
    C := buscaPosicionCaracter(xls, ARowInsercion, Pporcentaje);
    if C > -1 then
    begin
      xls.SetCellValue(ARowInsercion, C, Porcentaje, -1);
    end;
  end;
end;

procedure borraLineaPlantillaAPU(xls: TExcelFile);
var
  x: Integer;
  trigger: string;
begin
  for x := 1 to 5 do
  begin
    trigger := '#DESCRIPCION' + IntToStr(x);
    borraLineaPlantilla(xls, trigger);
  end;
end;

procedure creaLineaAPUS(xls: TExcelFile; tipo, codRecurso, descripcion, unidad,
  cantidad, precio, Rendimiento, Total, Porcentaje: string);
var
  Pcodcat, Pdescripcion, Punidad, Pcantidad, Pprecio, Prendimiento,
    Ptotal, Pporcentaje: string;
  C: Integer;
begin
  Pcodcat := '#CODCAT' + tipo;
  Pdescripcion := '#DESCRIPCION' + tipo;
  Punidad := '#UNIDAD' + tipo;
  Pcantidad := '#CANTIDAD' + tipo;
  Pprecio := '#PRECIO' + tipo;
  Prendimiento := '#RENDIMIENTO' + tipo;
  Ptotal := '#SUBTOTAL' + tipo;
  Pporcentaje := '#PORCENT' + tipo;
  ARowInsercion := localizaArow(xls, Pdescripcion);
  copiaXLSRow(xls, ARowInsercion, 1, ARowInsercion, xls.RowCount,
    ARowInsercion, 1);
  C := buscaPosicionCaracter(xls, ARowInsercion, Pcodcat);
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, codRecurso);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, Pdescripcion);
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, descripcion);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, Punidad);
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, unidad);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, Pcantidad);
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, cantidad);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, Pprecio);
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, precio);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, Prendimiento);
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, Rendimiento);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, Ptotal);
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, Total);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, Pporcentaje);
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, Porcentaje);
  end;
end;

function Consolidate(const fileNames: TArray<string>; const OnlyData: Boolean)
  : TExcelFile;
var
  XlsIn: TExcelFile;
  XlsOut: TExcelFile;
  i: Int32;
  s: string;
begin
  XlsIn := TXlsFile.Create;
  try
    XlsOut := TXlsFile.Create(True);
    try
      XlsOut.NewFile(1, TExcelFileFormat.v2019);
      if (Length(fileNames) > 1) and OnlyData then
        XlsOut.InsertAndCopySheets(1, 2,
          Length(fileNames) - 1);

      for i := 0 to Length(fileNames) - 1 do
      begin
        XlsIn.Open(fileNames[i]);

        XlsIn.ConvertFormulasToValues(True);
        XlsOut.ActiveSheet := i + 1;
        if OnlyData then
          XlsOut.InsertAndCopyRange
            (TXlsCellRange.FullRange, 1, 1, 1,
            TFlxInsertMode.ShiftRangeDown,
            TRangeCopyMode.All, XlsIn, 1)
        else
        begin
          XlsOut.InsertAndCopySheets(1,
            XlsOut.ActiveSheet, 1, XlsIn);
          XlsOut.SheetName :=
            XlsIn.GetSheetName(1);
        end;
      end;

      if not OnlyData then
      begin
        XlsOut.ActiveSheet := XlsOut.SheetCount;
        XlsOut.DeleteSheet(1);
      end;

      XlsOut.ActiveSheet := 1;
    except
      XlsOut.Free;
      raise;
    end;
  finally
    XlsIn.Free;
  end;
  Result := XlsOut;
end;

procedure CrearEncabezadoAPUS(xls: TExcelFile;
  Codigo, descripcion, unidad: string);
var
  salir: Boolean;
  R, C: Integer;
  v: TCellValue;
  tmpstr: string;
begin
  salir := false;
  xls.SheetName := Codigo;
  R := 1;
  while (not salir) and (R < xls.RowCount) do
  begin
    C := BuscaValor(xls, R);
    if C > -1 then
    begin
      v := xls.GetCellValue(R, C);
      tmpstr := v.ToString;
      if tmpstr = '#CODIGO_APU' then
      begin
        xls.SetCellValue(R, C, Codigo, -1);
      end;
      if tmpstr = '#DESCRIPCION' then
      begin
        xls.SetCellValue(R, C, descripcion, -1);
      end;
      if tmpstr = '#UNIDAD' then
      begin
        salir := True;
        xls.SetCellValue(R, C, unidad, -1);
      end;
    end;
    Inc(R);
  end;
end;

procedure CrearResumenAPUS(xls: TExcelFile;
  costoDirectoTotal, porcentajeIndirecto, costoIndirecto, Total,
  moneda: string);
var
  salir: Boolean;
  R, C: Integer;
  v: TCellValue;
  tmpstr: string;
begin
  salir := false;
  R := xls.RowCount;
  while (R > 1) and (not salir) do
  begin
    C := BuscaValor(xls, R);
    if C > -1 then
    begin
      v := xls.GetCellValue(R, C);
      tmpstr := v.ToString;
      if tmpstr = '#COSTODIRECTO' then
      begin
        xls.SetCellValue(R, C, costoDirectoTotal, -1);
        salir := True;
      end;
      if tmpstr = '#%INDIRECTO' then
      begin
        xls.SetCellValue(R, C,
          porcentajeIndirecto + '%', -1);
        C := buscaPosicionCaracter(xls, R,
          '#COSTOINDIRECTO');
        if C > -1 then
        begin
          xls.SetCellValue(R, C,
            costoIndirecto, -1);
        end;
      end;

      if tmpstr = '#TTOTAL' then
      begin
        xls.SetCellValue(R, C, Total, -1);
      end;
      if tmpstr = '#TEXTOTOTAL' then
      begin
        tmpstr := CantidadALetra(StrToFloat(Total),
          moneda).Trim;
        xls.SetCellValue(R, C, tmpstr, -1);
      end;
    end;
    Dec(R);
  end;
end;

function localizaArow(xls: TExcelFile; CadenaBusqueda: string): Integer;
var
  C, R: Integer;
  salir: Boolean;
  tmpstr: string;
  v: TCellValue;
begin
  Result := -1;
  R := xls.RowCount;
  salir := false;
  while (R > 1) and (not salir) do
  begin
    C := buscaPosicionCaracter(xls, R, CadenaBusqueda);
    if C > -1 then
    begin
      Result := R;
      salir := True;
    end;
    Dec(R);
  end;
end;

function buscaPosicionCaracter(xls: TExcelFile; Arow: Integer;
  cadenaBuscar: string): Integer;
var
  x: Integer;
  v: TCellValue;
  salir: Boolean;
  tmpstr: string;
begin
  Result := -1;
  salir := false;
  x := 1;
  while (x < xls.ColCount + 1) and (not salir) do
  begin
    v := xls.GetCellValue(Arow, x);
    tmpstr := v.ToString;
    if tmpstr = cadenaBuscar then
    begin
      Result := x;
      salir := True;
    end;
    Inc(x);
  end;
end;

function BuscaValor(xls: TExcelFile; Arow: Integer): Integer;
var
  x: Integer;
  v: TCellValue;
  salir: Boolean;
  tmpstr: string;
begin
  Result := -1;
  x := 1;
  salir := false;
  while (x < xls.ColCount + 1) and (not salir) do
  begin
    v := xls.GetCellValue(Arow, x);
    tmpstr := v.ToString;
    if LeftStr(tmpstr, 1) = '#' then
    begin
      Result := x;
      salir := True;
    end;
    Inc(x);
  end;
end;

function BuscaCadenaExcel(xls: TExcelFile; Pagina: Integer;
  CadenaBusqueda: string): dat_celda;
var
  R, C: Integer;
  salir: Boolean;
  CadenaCelda: string;
begin
  xls.ActiveSheet := Pagina;
  CadenaBusqueda := Trim(CadenaBusqueda);
  R := 1;
  Result.C := -1;
  Result.R := -1;
  salir := false;
  while (not salir) and (R <= xls.RowCount) do
  begin
    C := 1;
    while (not salir) and (C <= xls.ColCountInRow(R)) do
    begin
      if xls.GetCellValue(R, C).HasValue then
      begin
        CadenaCelda := xls.GetCellValue(R, C)
          .ToString.Trim;
        if lowerCase(CadenaCelda)
          = lowerCase(CadenaBusqueda) then
        begin
          Result.R := R;
          Result.C := C;
          salir := True;
        end;
      end;
      Inc(C);
    end;
    Inc(R);
  end;
end;

function BuscaValordeEntrada(xls: TExcelFile; Pagina: Integer;
  pExcel: dat_celda): string;
var
  iCol: Integer;
  valor: string;
  salir: Boolean;
begin
  xls.ActiveSheet := Pagina;
  salir := false;
  iCol := pExcel.C + 1;
  Result := '';
  while (not salir) and (iCol <= xls.ColCountInRow(pExcel.R)) do
  begin
    if xls.GetCellValue(pExcel.R, iCol).HasValue then
    begin
      valor := VarToStr(xls.GetCellValue(pExcel.R, iCol)
        .AsVariant).Trim;
      if valor <> '' then
      begin
        Result := valor;
        salir := True;
      end;
    end;
    Inc(iCol);
  end;
end;

procedure creaResumenPresupuesto(xls: TExcelFile; tipo: Integer;
  subtotal: string; porcentajeIVA: string; IVA: string; Total, moneda: string);
var
  R, C: Integer;
  x: Integer;
  salir: Boolean;
  v: TCellValue;
  tmpstr: string;
  valorEnLetras: string;
begin
  xls.ActiveSheet := 1;
  case tipo of
    1:
      begin
        { Plantilla Presupuesto General }
        salir := false;
        R := xls.RowCount - 1;
        while (R > 1) and (not salir) do
        begin
          tmpstr := '';
          C := BuscaValor(xls, R);
          if C > -1 then
          begin
            v := xls.GetCellValue(R, C);
            tmpstr := v.ToString;
          end;
          if tmpstr = '#SUBTOTALSINIVA' then
          begin
            xls.SetCellValue(R, C, subtotal, -1);
            salir := True;
          end;
          if tmpstr = '#%IVA' then
          begin
            xls.SetCellValue(R, C, porcentajeIVA);
            C := buscaPosicionCaracter(xls,
              R, '#IVA');
            if C > -1 then
            begin
              xls.SetCellValue(R, C, IVA, -1);
            end;
          end;
          if tmpstr = '#TTOTAL' then
          begin
            xls.SetCellValue(R, C, Total, -1);
          end;
          if tmpstr = '#TEXTOTOTAL' then
          begin
            valorEnLetras :=
              CantidadALetra(StrToFloat(Total),
              moneda).Trim;
            xls.SetCellValue(R, C, valorEnLetras);
          end;
          Dec(R);
        end;
      end;
    2:
      begin
        { Plantilla Presupuesto SERCOP }
        salir := false;
        R := xls.RowCount;
        while (R > 1) and (not salir) do
        begin
          tmpstr := '';
          C := BuscaValor(xls, R);
          if C > -1 then
          begin
            v := xls.GetCellValue(R, C);
            tmpstr := v.ToString;
          end;
          if tmpstr = '#TTOTAL' then
          begin
            xls.SetCellValue(R, C, subtotal, -1);
            salir := True;
          end;
          if tmpstr = '#TOTAL1' then
          begin
            xls.SetCellValue(R, C, subtotal, -1);
          end;
          Dec(R);
        end;
      end;
  end;
end;

procedure creaEncabezadoPresupuesto(xls: TExcelFile; tipo: Integer;
  Titulo, Oferente, Ubicacion, Fecha, codReferencial: string);
var
  R, C: Integer;
  x: Integer;
  tmpstr: string;
  salir: Boolean;
  v: TCellValue;
  analizar: Boolean;
begin
  R := 1;
  case tipo of
    1:
      begin
        xls.ActiveSheet := 1;
        xls.SheetName := 'Presupuesto';
        R := 1;
        salir := false;
        while (R < xls.RowCount - 1) and (not salir) do
        begin
          tmpstr := '';
          C := BuscaValor(xls, R);
          if C > -1 then
          begin
            analizar := True;
            v := xls.GetCellValue(R, C);
            tmpstr := v.ToString;
          end
          else
          begin
            analizar := false;
          end;
          if (tmpstr = '#PRO_TITULO') and
            (analizar) then
          begin
            xls.SetCellValue(R, C, Titulo);
            analizar := false;
          end;
          if (tmpstr = '#CODIGOPROYECTO') and
            (analizar) then
          begin
            xls.SetCellValue(R, C, codproyecto);
            while analizar do
            begin
              C := BuscaValor(xls, R);
              if C > -1 then
              begin
                v := xls.GetCellValue(R, C);
                tmpstr := v.ToString;
              end;
              if (tmpstr = '#CODIGOREFERENCIAL') and
                (analizar) then
              begin
                xls.SetCellValue(R, C, codReferencial);
                analizar := false;
              end;
            end;
          end;
          if (tmpstr = '#REVISION') and (analizar) then
          begin
            xls.SetCellValue(R, C, revision);
            analizar := false;
          end;
          if (tmpstr = '#PRO_OFERENTE') and
            (analizar) then
          begin
            xls.SetCellValue(R, C, Oferente);
            analizar := false;
          end;
          if (tmpstr = '#PRO_UBICACION') and
            (analizar) then
          begin
            xls.SetCellValue(R, C, Ubicacion);
            analizar := false;
          end;
          if (tmpstr = '#PRO_FECHA') and (analizar) then
          begin
            xls.SetCellValue(R, C, Fecha);
            salir := True;
          end;
          Inc(R);
        end;
      end;
    2:
      begin
        xls.SheetName := 'Presupuesto SERCOP';
        xls.ActiveSheet := 1;
        R := 1;
        salir := false;
        while (R < xls.RowCount - 1) and (not salir) do
        begin
          tmpstr := '';
          C := BuscaValor(xls, R);
          if C > -1 then
          begin
            analizar := True;
            v := xls.GetCellValue(R, C);
            tmpstr := v.ToString;
          end
          else
          begin
            analizar := false;
          end;
          if (tmpstr = '#PRO_OFERENTE') and
            (analizar) then
          begin
            xls.SetCellValue(R, C, Oferente);
            analizar := false;
            salir := True;
          end;

          Inc(R);
        end;
      end;
  end;
end;

procedure borraLineaPlantilla(xls: TExcelFile; triggerStr: string);
var
  lineaBorrar: Integer;
  cellRange: TXlsCellRange;
begin
  lineaBorrar := localizaArow(xls, triggerStr);
  if lineaBorrar > 0 then
  begin
    cellRange := TXlsCellRange.Create(lineaBorrar, 1, lineaBorrar,
      xls.ColCount);
    xls.DeleteRange(cellRange, TFlxInsertMode.ShiftRowDown);
  end;
end;

procedure creaLineaPresupuesto(xls: TExcelFile; ARowInsercion: Integer;
  codEDT, NItem, codItem, descripcion, unidad, cantidad, PUnitario,
  Ptotal: string);
var
  C: Integer;
begin
  copiaXLSRow(xls, ARowInsercion, 1, ARowInsercion, xls.RowCount,
    ARowInsercion, 1);
  C := buscaPosicionCaracter(xls, ARowInsercion, '#ITEM');
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, NItem);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, '#CODEDT');
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, codEDT);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, '#CODIGO_APU');
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, codItem);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, '#DESCRIPCION');
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, descripcion);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, '#UNIDAD');
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, unidad);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, '#CANTIDAD');
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, cantidad);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, '#PUNITARIO');
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, PUnitario);
  end;
  C := buscaPosicionCaracter(xls, ARowInsercion, '#SUBTOTAL');
  if C > -1 then
  begin
    xls.SetCellValue(ARowInsercion, C, Ptotal);
  end;
end;

procedure copiaXLSRow(xls: TExcelFile; ARowInicio, AColInicio, ARowFin, AColFin,
  ARowDestino, AColDestino: Integer);
var
  cellRange: TXlsCellRange;
begin
  cellRange := TXlsCellRange.Create(ARowInicio, AColInicio,
    ARowFin, AColFin);

  xls.InsertAndCopyRange(cellRange, ARowDestino, AColDestino, 1,
    TFlxInsertMode.ShiftRangeDown, TRangeCopyMode.All, xls, 1);
end;

function CantidadALetra(curCantidad: Currency; MonedaNacional: string): string;
begin
  Unidades[0] := 'UN';
  Unidades[1] := 'DOS';
  Unidades[2] := 'TRES';
  Unidades[3] := 'CUATRO';
  Unidades[4] := 'CINCO';
  Unidades[5] := 'SEIS';
  Unidades[6] := 'SIETE';
  Unidades[7] := 'OCHO';
  Unidades[8] := 'NUEVE';
  Unidades[9] := 'DIEZ';
  Unidades[10] := 'ONCE';
  Unidades[11] := 'DOCE';
  Unidades[12] := 'TRECE';
  Unidades[13] := 'CATORCE';
  Unidades[14] := 'QUINCE';
  Unidades[15] := 'DIESISEIS';
  Unidades[16] := 'DIESISIETE';
  Unidades[17] := 'DIESIOCHO';
  Unidades[18] := 'DIESINUEVE';
  Unidades[19] := 'VEINTE';
  Unidades[20] := 'VEINTIUNO';
  Unidades[21] := 'VEINTIDOS';
  Unidades[22] := 'VEINTITRES';
  Unidades[23] := 'VEINTICUATRO';
  Unidades[24] := 'VEINTICINCO';
  Unidades[25] := 'VEINTISEIS';
  Unidades[26] := 'VEINTISIETE';
  Unidades[27] := 'VEINTIOCHO';
  Unidades[28] := 'VEINTINUEVE';

  Decenas[0] := 'DIEZ';
  Decenas[1] := 'VEINTE';
  Decenas[2] := 'TREINTA';
  Decenas[3] := 'CUARENTA';
  Decenas[4] := 'CINCUENTA';
  Decenas[5] := 'SESENTA';
  Decenas[6] := 'SETENTA';
  Decenas[7] := 'OCHENTA';
  Decenas[8] := 'NOVENTA';

  Centenas[0] := 'CIENTO';
  Centenas[1] := 'DOSCIENTOS';
  Centenas[2] := 'TRESCIENTOS';
  Centenas[3] := 'CUATROCIENTOS';
  Centenas[4] := 'QUINIENTOS';
  Centenas[5] := 'SEISCIENTOS';
  Centenas[6] := 'SETECIENTOS';
  Centenas[7] := 'OCHOCIENTOS';
  Centenas[8] := 'NOVECIENTOS';
  curCantidad := RoundTo(curCantidad, -2);
  curCantidad := (curCantidad);
  cantidad := Int(curCantidad);
  Centavos := (curCantidad - cantidad) * 100;
  NumeroBloques := 1;
  repeat
    PrimerDigito := 0;
    SegundoDigito := 0;
    TercerDigito := 0;
    Bloque := '';
    BloqueCero := 0;
    for i := 1 to 3 do
    begin
      Digito := Round(cantidad) mod 10;
      if Digito <> 0 then
      begin
        case i of
          1:
            begin
              Bloque := ' ' + Unidades[Digito - 1];
              PrimerDigito := Digito;
            end; // case 1
          2:
            begin
              if Digito <= 2 then
              begin
                Bloque := ' ' +
                  Unidades[(Digito * 10 +
                  PrimerDigito - 1)];
              end
              else
              begin
                if PrimerDigito <> 0 then
                  Temp := ' Y'
                else
                  Temp := '';
                Bloque := ' ' + Decenas[Digito - 1] +
                  Temp + Bloque;
              end; // if
              SegundoDigito := Digito;
            end; // case 2
          3:
            begin
              if (Digito = 1) and (PrimerDigito = 0)
                and (SegundoDigito = 0) then
                Temp := 'CIEN'
              else
                Temp := Centenas[Digito - 1];
              Bloque := ' ' + Temp + Bloque;
              TercerDigito := Digito;
            end; // case 3
        end; // case
      end
      else
      begin
        BloqueCero := BloqueCero + 1;
      end; // If Digito <>0
      cantidad := Int(cantidad / 10);
      if cantidad = 0 then
      begin
        Break;
      end; // If Cantidad=0
    end; // for
    case NumeroBloques of
      1:
        Resultado := Bloque;
      2:
        begin
          if BloqueCero = 3 then
            Temp := ''
          else
            Temp := ' MIL';
          Resultado := Bloque + Temp + Resultado;
        end; // case 2
      3:
        begin
          if (PrimerDigito = 1) and
            (SegundoDigito = 0) and
            (TercerDigito = 0) then
            Temp := ' MILLON'
          else
            Temp := ' MILLONES';
          Resultado := Bloque + Temp + Resultado;
        end; // case 3
    end; // case
    NumeroBloques := NumeroBloques + 1;
  until cantidad = 0; // repeat
  if MonedaNacional = 'USD' then
    MonedaNacional := 'Dolar';

  MonedaNacional := UpperCase(MonedaNacional);
  ultimaLetra := rightstr(MonedaNacional, 1);
  if (ultimaLetra = 'A') or (ultimaLetra = 'E') or (ultimaLetra = 'I') or
    (ultimaLetra = 'O') or (ultimaLetra = 'U') then
  begin
    MonedaNacional := MonedaNacional + 'S';
  end
  else
  begin
    MonedaNacional := MonedaNacional + 'ES';
  end;

  CantidadALetra := Resultado + ' CON ' + FormatFloat('00', Centavos) +
    '/100' + ' ' + MonedaNacional;
end;

function daDatos1Apus(const Codigo: string): dat_localRespApus;
var
  qry: TUniQuery;
  cantidad: Double;
  costoDirectoUnit: Double;
  costoDirectoTotal: Double;
  porcentajeInd: Double;
  costoIndirecto: Double;
  total: Double;
begin
  // Inicializar record
  FillChar(Result, SizeOf(Result), 0);

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.SQL.Clear;
    {(*}
    if codproyecto <> '' then
    begin
      qry.SQL.Text :=
        'SELECT ' +
        '  apu.codCategoriaAPU, ' +
        '  apu.codRecursoAPU, ' +
        '  items.descripcion, ' +
        '  items.unidad, ' +
        '  items.cantidad, ' +
        '  COALESCE(datosPresupuestos.indirectos, base.indirectos, 0) AS indirectos, ' +
        '  COALESCE(tanteo.CostoDirectoTotal, apu.CostoDirectoTotal, 0) AS PUnitario, ' +
        '  CASE ' +
        '    WHEN tanteo.CostoDirectoTotal IS NOT NULL THEN tanteo.CostoDirectoTotal ' +
        '    WHEN datosPresupuestos.indirectos IS NOT NULL THEN items.Ptotal ' +
        '    ELSE apu.PrecioUnitarioTotal ' +
        '  END AS Ptotal ' +
        'FROM presupuestos_items items ' +
        'INNER JOIN apus apu ON apu.CodAPU = items.codAPU AND apu.codBase = items.codBase ' +
        'INNER JOIN bases base ON base.codBase = items.codBase ' +
        'INNER JOIN presupuestos_datosgenerales datosPresupuestos ' +
        '  ON datosPresupuestos.codBase = items.codBase ' +
        ' AND datosPresupuestos.codPresupuesto = :codPresupuesto ' +
        ' AND datosPresupuestos.Revision = :revision ' +
        'LEFT JOIN presupuestos_tanteo_apus tanteo ' +
        '  ON tanteo.codBase = items.codBase ' +
        ' AND tanteo.CodAPU = items.codAPU ' +
        ' AND tanteo.codPresupuesto = :codPresupuesto ' +
        ' AND tanteo.revision = :revision ' +
        'WHERE items.codAPU = :codAPU ' +
        '  AND items.codBase = :codBase';
    end
    else
    begin
      qry.SQL.Text :=
        'SELECT ' +
        '  a.codCategoriaAPU, ' +
        '  a.codRecursoAPU, ' +
        '  a.Descripcion, ' +
        '  a.Unidad, ' +
        '  1 AS cantidad, ' +
        '  COALESCE(b.indirectos, 0) AS indirectos, ' +
        '  a.CostoDirectoTotal AS PUnitario, ' +
        '  a.CostoDirectoTotal + ' +
        '    Porcentaje(a.CostoDirectoTotal, COALESCE(b.indirectos, 0)) AS Ptotal ' +
        'FROM apus a ' +
        'INNER JOIN bases b ON b.codBase = a.codBase ' +
        'WHERE a.CodAPU = :codAPU ' +
        '  AND a.codBase = :codBase';
    end;
    {*)}
    qry.ParamByName('codAPU').AsString := Codigo;
    qry.ParamByName('codBase').AsString := base_activa.codBase;

    if codproyecto <> '' then
    begin
      qry.ParamByName('codPresupuesto').AsString := codproyecto;
      qry.ParamByName('revision').AsString := revision;
    end;

    qry.Open;

    if qry.EOF then
      Exit;

    // --- Datos básicos ---
    Result.codigoApus :=
      generaCodigoRecurso(
        '6',
        qry.FieldByName('codCategoriaAPU').AsString.Trim,
        qry.FieldByName('codRecursoAPU').AsString.Trim
      );

    Result.descripcion := qry.FieldByName('descripcion').AsString;
    Result.unidad := qry.FieldByName('unidad').AsString;
    Result.moneda := base_activa.moneda;

    // --- Cálculos ---
    cantidad := qry.FieldByName('cantidad').AsFloat;
    costoDirectoUnit := qry.FieldByName('PUnitario').AsFloat;
    porcentajeInd := qry.FieldByName('indirectos').AsFloat;

    costoDirectoTotal := cantidad * costoDirectoUnit;
    costoIndirecto := (costoDirectoTotal * porcentajeInd) / 100;
    total := costoDirectoTotal + costoIndirecto;

    // --- Salida formateada ---
    Result.costoDirectoTotal := FloatToStrF(costoDirectoTotal, ffFixed, 18, 2);
    Result.porcentajeIndirecto := FloatToStrF(porcentajeInd, ffFixed, 18, 2);
    Result.costoIndirecto := FloatToStrF(costoIndirecto, ffFixed, 18, 2);
    Result.Total := FloatToStrF(total, ffFixed, 18, 2);

  finally
    qry.Free;
  end;
end;

function generaApusProyecto(): TStringList;
var
  qry: TUniQuery;
  tmpstr: string;
  tmplst: TStringList;
begin
  qry := TUniQuery.Create(nil);
  tmplst := TStringList.Create;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      { /* }
      sql.Add('SELECT ' + 'codApu ' + 'FROM ' +
        'Presupuestos_Items ' + 'WHERE ' +
        'codPresupuesto = :codPresupuesto ' +
        'AND revision = :revision ' +
        'AND codBase = :codBase');
      { */ }
      ParamByName('codPresupuesto').AsString := codproyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codBase').AsString := base_activa.codBase;
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        tmpstr := FieldByName('codApu').AsString.Trim;
        if tmpstr <> '' then
          tmplst.Add(tmpstr);
        Next;
      end;
    end;
  finally
    qry.Free;
    Result := tmplst;
  end;
end;

procedure crearCuerpoAPUS(xls: TExcelFile; codigoApus: string; modelo: Integer;
  SSO: Boolean; totalPresupuesto: string);
var
  SQLText: string;
  qry: TUniQuery;
  x: Integer;
  subtotal: double;
  porcentajeParcial: double;
  seguridadIndustrial: Integer;
  codRecurso, descripcion, unidad, cantidad, precio, Rendimiento, Total,
    Porcentaje: string;
begin
  qry := TUniQuery.Create(nil);
  seguridadIndustrial := 4;
  if SSO then
    seguridadIndustrial := 5;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      for x := 1 to seguridadIndustrial do
      begin
        subtotal := 0;
        close;
        sql.Clear;
        { /* }
        SQLText := 'SELECT ' +
          'item.codRecursoCompleto, ' +
          'item.Descripcion, ' + 'item.unidad, ' +
          'IF(tanteo.CantidadUnidad IS NULL, item.CantidadUnidad, tanteo.CantidadUnidad) AS CantidadUnidad, '
          + 'item.Precio, ' + 'item.porcentaje, ' +
          'IF(tanteo.Rendimiento IS NULL, item.Rendimiento, tanteo.Rendimiento) AS Rendimiento, '
          + 'IF(tanteo.Total IS NULL, item.Total, tanteo.Total) AS Total '
          + 'FROM ' + 'APUS_Items item ' +
          'LEFT JOIN presupuestos_tanteo_recursos tanteo ON ( '
          + 'tanteo.CodAPU = item.CodAPU ' +
          'AND tanteo.codBase = item.codBase ' +
          'AND tanteo.idUnicoRecurso = item.idUnicoRecurso '
          + 'AND tanteo.codPresupuesto = :codPresupuesto '
          + 'AND tanteo.revision = :revision ' + ') ' +
          'WHERE ' + 'item.codAPU = :CodApu ' +
          'AND item.codBase = :codBase ' +
          'AND item.codCategoria = :codCategoria';
        { */ }
        sql.Add(SQLText);
        ParamByName('codPresupuesto').AsString :=
          codproyecto;
        ParamByName('revision').AsString := revision;
        ParamByName('codAPU').AsString := codigoApus;
        ParamByName('codBase').AsString :=
          base_activa.codBase;
        ParamByName('codCategoria').AsInteger := x;
        Prepare;
        ExecSQL;
        porcentajeParcial := 0;
        while not Eof do
        begin
          codRecurso :=
            FieldByName('codRecursoCompleto')
            .AsString.Trim;
          descripcion :=
            FieldByName('descripcion')
            .AsString.Trim;
          unidad := FieldByName('unidad')
            .AsString.Trim;
          cantidad :=
            decimal_correcto
            (FieldByName('cantidadUnidad')
            .AsString.Trim);
          precio := decimal_correcto
            (FieldByName('Precio').AsString.Trim);
          Porcentaje :=
            decimal_correcto
            (FieldByName('porcentaje')
            .AsString.Trim);
          Rendimiento :=
            decimal_correcto
            (FieldByName('rendimiento')
            .AsString.Trim);
          Total := decimal_correcto
            (FieldByName('total').AsString.Trim);
          porcentajeParcial := porcentajeParcial +
            StrToFloat(Porcentaje);
          subtotal := subtotal +
            StrToFloat(Total);
          creaLineaAPUS(xls, IntToStr(x),
            codRecurso, descripcion, unidad,
            cantidad, precio, Rendimiento, Total,
            Porcentaje);
          Next;
        end;
        creaLineaSubTotalAPU(xls, IntToStr(x),
          FloatToStr(subtotal),
          FloatToStr(porcentajeParcial));
      end;
    end;
    borraLineaPlantillaAPU(xls);
  finally
    qry.Free;
  end;
end;

end.

