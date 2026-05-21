object DMImportacion: TDMImportacion
  Height = 1092
  Width = 2202
  PixelsPerInch = 144
  object QCompruebaNombreDB: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'select id from bases where codbase=:codBaseI')
    Left = 132
    Top = 48
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBaseI'
        Value = nil
      end>
    object QCompruebaNombreDBid: TIntegerField
      FieldName = 'id'
    end
  end
  object QDatosPais: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  mp.codmoneda,'
      '  mp.Simbolo'
      'FROM'
      '  paises p'
      
        '  LEFT JOIN monedaspaises mp ON lower(mp.Pais) = lower(p.Nombre_' +
        'Pais)'
      'WHERE'
      '  lower(p.Nombre_Pais) LIKE LOWER(CONCAT('#39'%'#39', :pais, '#39'%'#39'))')
    Left = 132
    Top = 132
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'pais'
        Value = nil
      end>
    object QDatosPaiscodmoneda: TStringField
      FieldName = 'codmoneda'
      Size = 255
    end
    object QDatosPaisSimbolo: TStringField
      FieldName = 'Simbolo'
      Size = 255
    end
  end
  object QSiguienteCodProyecto: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT PresupuestoValor1, '
      '       PresupuestoValor2, '
      '       PresupuestoValor3 '
      '  FROM configuracion')
    Left = 132
    Top = 228
    object QSiguienteCodProyectoPresupuestoValor1: TStringField
      FieldName = 'PresupuestoValor1'
      Size = 255
    end
    object QSiguienteCodProyectoPresupuestoValor2: TStringField
      FieldName = 'PresupuestoValor2'
      Size = 255
    end
    object QSiguienteCodProyectoPresupuestoValor3: TIntegerField
      FieldName = 'PresupuestoValor3'
    end
  end
  object QCompruebaNombreProyecto: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'select id '
      '   from presupuestos_datosgenerales '
      '  where codPresupuesto=:codProyecto')
    Left = 120
    Top = 612
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codProyecto'
        Value = nil
      end>
    object QCompruebaNombreProyectoid: TIntegerField
      FieldName = 'id'
    end
  end
  object QPresupuestoDatosGenerales: TUniSQL
    Connection = DModule_1.con2
    SQL.Strings = (
      'INSERT INTO presupuestos_datosgenerales'
      '('
      '  codBase'
      ' ,codPresupuesto'
      ' ,codReferencial'
      ' ,revision'
      ' ,descripcion'
      ' ,subtotal'
      ' ,iva'
      ' ,indirectos'
      ' ,total'
      ' ,fechaCreacion'
      ' ,fechaModificacion'
      ' ,ndecimales'
      ' ,ndecimalesMoneda'
      ' ,porcentajeIVA'
      ' ,activo'
      ')'
      'VALUES'
      '('
      '  :codBase'
      ' ,:codPresupuesto'
      ' ,:codReferencial'
      ' ,:revision'
      ' ,:descripcion'
      ' ,:subtotal'
      ' ,:iva'
      ' ,:indirectos'
      ' ,:total'
      ' ,:fechaCreacion'
      ' ,:fechaModificacion'
      ' ,:ndecimales'
      ' ,:ndecimalesMoneda'
      ' ,:porcentajeIVA'
      ' ,:activo'
      ');')
    Left = 336
    Top = 132
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codPresupuesto'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codReferencial'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'revision'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'descripcion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'subtotal'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'iva'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'indirectos'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'total'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'fechaCreacion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'fechaModificacion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'ndecimales'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'ndecimalesMoneda'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'porcentajeIVA'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'activo'
        Value = nil
      end>
  end
  object QPresupuestoDatosProyecto: TUniSQL
    Connection = DModule_1.con2
    SQL.Strings = (
      'INSERT INTO presupuestos_datosproyecto'
      '('
      '  codBase'
      ' ,codPresupuesto'
      ' ,revision'
      ' ,codReferencial'
      ' ,Descripcion'
      ' ,TipoProyecto'
      ' ,Categoria'
      ' ,TipoConstruccion'
      ' ,AmbitoContratacion'
      ' ,TipoContrato'
      ' ,fechaInicio'
      ' ,PlazoEjecucion'
      ' ,fechaFinalizacion'
      ' ,validezPropuesta'
      ' ,fechaHoraCreacion'
      ' ,UltModificacion'
      ')'
      'VALUES'
      '('
      '  :codBase'
      ' ,:codPresupuesto'
      ' ,:revision'
      ' ,:codReferencial'
      ' ,:Descripcion'
      ' ,:TipoProyecto'
      ' ,:Categoria'
      ' ,:TipoConstruccion'
      ' ,:AmbitoContratacion'
      ' ,:TipoContrato'
      ' ,:fechaInicio'
      ' ,:PlazoEjecucion'
      ' ,:fechaFinalizacion'
      ' ,:validezPropuesta'
      ' ,:fechaHoraCreacion'
      ' ,:UltModificacion'
      ')')
    Left = 360
    Top = 240
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codPresupuesto'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'revision'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codReferencial'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'descripcion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'TipoProyecto'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Categoria'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'TipoConstruccion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'AmbitoContratacion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'TipoContrato'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'fechaInicio'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'PlazoEjecucion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'fechaFinalizacion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'validezPropuesta'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'fechaHoraCreacion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'UltModificacion'
        Value = nil
      end>
  end
  object QPresupuestoImportarAPUS: TUniSQL
    Connection = DModule_1.con2
    SQL.Strings = (
      'INSERT INTO apus'
      '('
      '  codBase'
      ' ,codCategoriaAPU'
      ' ,codRecursoAPU'
      ' ,CategoriaAPU'
      ' ,CodAPU'
      ' ,codApuAlternativo'
      ' ,Descripcion'
      ' ,Unidad'
      ' ,Rendimiento'
      ' ,RendimientoTodoAnalisis'
      ' ,RendimientoTodoEscenario'
      ' ,CostoDirectoTotal'
      ' ,CostoIndirectoTotal'
      ' ,PorcentajeCostoIndirecto'
      ' ,PrecioUnitarioTotal'
      ' ,moneda'
      ' ,codCPC'
      ' ,FechaHoraCreacion'
      ' ,ultimaModificacion'
      ' ,pendienteRevision'
      ' ,rendimientoHUnidad'
      ' ,nhCuadrillas'
      ' ,anidado'
      ')'
      'VALUES'
      '('
      '  :codBase'
      ' ,:codCategoriaAPU'
      ' ,:codRecursoAPU'
      ' ,:CategoriaAPU'
      ' ,:CodAPU'
      ' ,:codApuAlternativo'
      ' ,:Descripcion'
      ' ,:Unidad'
      ' ,:Rendimiento'
      ' ,:RendimientoTodoAnalisis'
      ' ,:RendimientoTodoEscenario'
      ' ,:CostoDirectoTotal'
      ' ,:CostoIndirectoTotal'
      ' ,:PorcentajeCostoIndirecto'
      ' ,:PrecioUnitarioTotal'
      ' ,:moneda'
      ' ,:codCPC'
      ' ,:FechaHoraCreacion'
      ' ,:ultimaModificacion'
      ' ,:pendienteRevision'
      ' ,:rendimientoHUnidad'
      ' ,:nhCuadrillas'
      ' ,:anidado'
      ')')
    Left = 744
    Top = 240
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codCategoriaAPU'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codRecursoAPU'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'CategoriaAPU'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'CodAPU'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codApuAlternativo'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Descripcion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Unidad'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Rendimiento'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'RendimientoTodoAnalisis'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'RendimientoTodoEscenario'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'CostoDirectoTotal'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'CostoIndirectoTotal'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'PorcentajeCostoIndirecto'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'PrecioUnitarioTotal'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'moneda'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codCPC'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'FechaHoraCreacion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'ultimaModificacion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'pendienteRevision'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'rendimientoHUnidad'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'nhCuadrillas'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'anidado'
        Value = nil
      end>
  end
  object QPresupuestoCategoriaAPUS: TUniSQL
    Connection = DModule_1.con2
    SQL.Strings = (
      'INSERT INTO categoriaapus'
      '('
      '  codBase'
      ' ,Categoria_base'
      ' ,Ciu'
      ' ,NombreBase'
      ' ,Descripcion'
      ' ,CodExterno'
      ' ,Comentarios'
      ' ,Usado'
      ' ,sincronizada'
      ' ,origen'
      ' ,fechaCreacion'
      ')'
      'VALUES'
      '('
      '  :codBase'
      ' ,:Categoria_base'
      ' ,:Ciu'
      ' ,:NombreBase'
      ' ,:Descripcion'
      ' ,:CodExterno'
      ' ,:Comentarios'
      ' ,:Usado'
      ' ,:sincronizada'
      ' ,:origen'
      ' ,:fechaCreacion'
      ')')
    Left = 756
    Top = 120
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Categoria_base'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Ciu'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'NombreBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Descripcion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'CodExterno'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Comentarios'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Usado'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'sincronizada'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'origen'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'fechaCreacion'
        Value = nil
      end>
  end
  object QPresupuestoActualizaAPUS: TUniSQL
    Connection = DModule_1.con2
    SQL.Strings = (
      'update apus '
      '   set rendimientoHUnidad = :rendimientoHUnidad,'
      '       nhCuadrillas = :nhCuadrillas'
      'where '
      '       codBase = :codBase '
      '   and codAPU = :codAPU')
    Left = 756
    Top = 324
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'rendimientoHUnidad'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'nhCuadrillas'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codAPU'
        Value = nil
      end>
  end
  object QPresupuestoImportarAPUSItems: TUniSQL
    Connection = DModule_1.con2
    SQL.Strings = (
      'USE giproylocal;'
      ''
      'INSERT INTO apus_items'
      '('
      '  codBase'
      ' ,CodAPU'
      ' ,CodAPUAlternativo'
      ' ,CodCategoria'
      ' ,codSubCategoria'
      ' ,idUnicoRecurso'
      ' ,codRecurso'
      ' ,codRecursoCompleto'
      ' ,Descripcion'
      ' ,Unidad'
      ' ,Precio'
      ' ,moneda'
      ' ,CantidadUnidad'
      ' ,Rendimiento'
      ' ,Total'
      ' ,porcentaje'
      ')'
      'VALUES'
      '('
      '  :codBase'
      ' ,:CodAPU'
      ' ,:CodAPUAlternativo'
      ' ,:CodCategoria'
      ' ,:codSubCategoria'
      ' ,:idUnicoRecurso'
      ' ,:codRecurso'
      ' ,:codRecursoCompleto'
      ' ,:Descripcion'
      ' ,:Unidad'
      ' ,:Precio'
      ' ,:moneda'
      ' ,:CantidadUnidad'
      ' ,:Rendimiento'
      ' ,:Total'
      ' ,:porcentaje'
      ');')
    Left = 1020
    Top = 240
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'CodAPU'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'CodAPUAlternativo'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'CodCategoria'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codSubCategoria'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'idUnicoRecurso'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codRecurso'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codRecursoCompleto'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Descripcion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Unidad'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Precio'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'moneda'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'CantidadUnidad'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Rendimiento'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Total'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'porcentaje'
        Value = nil
      end>
  end
  object QCodEdtImportados: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  CodEDT,'
      '  Descripcion,'
      '  codUnicoItemPresupuesto,'
      '  puntero'
      'FROM'
      '  presupuestos_edt'
      'WHERE'
      '  presupuestos_edt.codBase =:codBase'
      '  AND codPresupuesto = :codProyecto'
      '  AND Revision = :Revision')
    Left = 132
    Top = 408
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codProyecto'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Revision'
        Value = nil
      end>
    object QCodEdtImportadosCodEDT: TStringField
      FieldName = 'CodEDT'
      Required = True
      Size = 255
    end
    object QCodEdtImportadosDescripcion: TStringField
      FieldName = 'Descripcion'
      Required = True
      Size = 255
    end
    object QCodEdtImportadoscodUnicoItemPresupuesto: TStringField
      FieldName = 'codUnicoItemPresupuesto'
      Size = 255
    end
    object QCodEdtImportadospuntero: TIntegerField
      FieldName = 'puntero'
    end
  end
  object QPresupuestoInsertaLineaItems: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'INSERT INTO presupuestos_items'
      '('
      '  codBase'
      ' ,codPresupuesto'
      ' ,revision'
      ' ,codEdt'
      ' ,codItems'
      ' ,codUnicoItems'
      ' ,codAPUGenerico'
      ' ,codAPU'
      ' ,descripcion'
      ' ,unidad'
      ' ,cantidad'
      ' ,PUnitario'
      ' ,Ptotal'
      ' ,rendimientoHUnidad'
      ' ,nhCuadrillas'
      ' ,anidado'
      ' ,posgrid'
      ')'
      'VALUES'
      '('
      '  :codBase'
      ' ,:codPresupuesto'
      ' ,:revision'
      ' ,:codEdt'
      ' ,:codItems'
      ' ,:codUnicoItems'
      ' ,:codAPUGenerico'
      ' ,:codAPU'
      ' ,:descripcion'
      ' ,:unidad'
      ' ,:cantidad'
      ' ,:PUnitario'
      ' ,:Ptotal'
      ' ,:rendimientoHUnidad'
      ' ,:nhCuadrillas'
      ' ,:anidado'
      ' ,:posgrid'
      ')')
    Left = 132
    Top = 528
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codPresupuesto'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'revision'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codEdt'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codItems'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codUnicoItems'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codAPUGenerico'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codAPU'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'descripcion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'unidad'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'cantidad'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'PUnitario'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Ptotal'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'rendimientoHUnidad'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'nhCuadrillas'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'anidado'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'posgrid'
        Value = nil
      end>
  end
  object QInsertaRecursosI: TUniSQL
    Connection = DModule_1.con2
    SQL.Strings = (
      'INSERT INTO recursos'
      '('
      '  idUnico'
      ' ,codBase'
      ' ,codRecurso'
      ' ,codRecursoCompleto'
      ' ,codCategoriaBase'
      ' ,codSubCategoria'
      ' ,Descripcion'
      ' ,unidad'
      ' ,precio'
      ' ,preciolocal'
      ' ,precioBase'
      ' ,moneda'
      ' ,fechahoraCreacion'
      ' ,ultimaModificacion'
      ')'
      'VALUES'
      '('
      '  :idUnico'
      ' ,:codBase'
      ' ,:codRecurso'
      ' ,:codRecursoCompleto'
      ' ,:codCategoriaBase'
      ' ,:codSubCategoria'
      ' ,:Descripcion'
      ' ,:unidad'
      ' ,:precio'
      ' ,:preciolocal'
      ' ,:precioBase'
      ' ,:moneda'
      ' ,:fechahoraCreacion'
      ' ,:ultimaModificacion '
      ')')
    Left = 744
    Top = 432
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'idUnico'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codRecurso'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codRecursoCompleto'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codCategoriaBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codSubCategoria'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Descripcion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'unidad'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'precio'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'preciolocal'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'precioBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'moneda'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'fechahoraCreacion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'ultimaModificacion'
        Value = nil
      end>
  end
  object QApusItems_a_Recursos: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  Max(idUnicoRecurso) AS idUnico,'
      '  Min(CodCategoria) AS codCategoriaBase,'
      '  Descripcion,'
      '  unidad,'
      '  Max(precio) Precio,'
      '  Max(precio) preciolocal,'
      '  Max(precio) precioBase,'
      '  max(moneda) moneda'
      'FROM'
      '  apus_items ai'
      'WHERE'
      '  ai.codBase = :codBase'
      'GROUP BY'
      '  ai.Descripcion,'
      '  ai.Unidad'
      'ORDER BY CodCategoriaBase')
    Left = 144
    Top = 744
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end>
    object QApusItems_a_RecursosidUnico: TStringField
      FieldName = 'idUnico'
      ReadOnly = True
      Size = 255
    end
    object QApusItems_a_RecursoscodCategoriaBase: TStringField
      FieldName = 'codCategoriaBase'
      ReadOnly = True
      Size = 255
    end
    object QApusItems_a_RecursosDescripcion: TStringField
      FieldName = 'Descripcion'
      Size = 255
    end
    object QApusItems_a_Recursosunidad: TStringField
      FieldName = 'unidad'
      Size = 255
    end
    object QApusItems_a_RecursosPrecio: TFloatField
      FieldName = 'Precio'
      ReadOnly = True
    end
    object QApusItems_a_Recursospreciolocal: TFloatField
      FieldName = 'preciolocal'
      ReadOnly = True
    end
    object QApusItems_a_RecursosprecioBase: TFloatField
      FieldName = 'precioBase'
      ReadOnly = True
    end
    object QApusItems_a_Recursosmoneda: TStringField
      FieldName = 'moneda'
      ReadOnly = True
      Size = 255
    end
  end
  object QProyectoEsNuevo: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT COUNT(*) as NApus'
      'FROM ('
      '  SELECT'
      '    p.Descripcion'
      '  FROM'
      '    presupuestos_datosgenerales p'
      
        '    INNER JOIN presupuestos_items a ON a.codBase = p.codBase and' +
        ' a.revision=0 and a.codEDT is NULL'
      '  WHERE'
      '    lower(p.descripcion) = lower(trim(:descripcion))'
      '    AND p.total = :Total'
      '  GROUP BY p.descripcion, p.total, a.id'
      ') AS subquery'
      '/*'
      'SELECT 1 as Existe'
      '  FROM presupuestos_datosgenerales p'
      ' WHERE lower(p.descripcion) = lower(trim(:descripcion))'
      '   AND p.total = :Total*/')
    Left = 144
    Top = 840
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'descripcion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Total'
        Value = nil
      end>
    object QProyectoEsNuevoNApus: TLargeintField
      FieldName = 'NApus'
      ReadOnly = True
      Required = True
    end
  end
  object QExisteCodApuAlternativo: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      ' SELECT'
      '  COALESCE(('
      '    select 1 from apus WHERE codBase =:codBase'
      '      AND codAPUAlternativo = :codAPUAlternativo'
      '    LIMIT 1'
      '  ), 0) AS resultado;')
    Left = 144
    Top = 936
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codAPUAlternativo'
        Value = nil
      end>
    object QExisteCodApuAlternativoresultado: TLargeintField
      FieldName = 'resultado'
      ReadOnly = True
      Required = True
    end
  end
  object QPresupuestoBuscaCodAPU: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT  '
      '  CodAPU,'
      '  rendimientoHUnidad,'
      '  nhCuadrillas,'
      '  DaCodAPUGenerico(apus.codBase, apus.CodAPU) as codAPUGenerico'
      'FROM'
      '  apus'
      'WHERE'
      '  LOWER(descripcion) =  LOWER(:Descripcion)'
      '  AND lower(Unidad) =  LOWER(:Unidad)'
      '  AND codBase = :codBase'
      ''
      '')
    Left = 588
    Top = 744
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'Descripcion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Unidad'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end>
    object QPresupuestoBuscaCodAPUCodAPU: TStringField
      FieldName = 'CodAPU'
      Size = 255
    end
    object QPresupuestoBuscaCodAPUrendimientoHUnidad: TStringField
      FieldName = 'rendimientoHUnidad'
      Size = 255
    end
    object QPresupuestoBuscaCodAPUnhCuadrillas: TStringField
      FieldName = 'nhCuadrillas'
      Size = 255
    end
    object QPresupuestoBuscaCodAPUcodAPUGenerico: TStringField
      FieldName = 'codAPUGenerico'
      ReadOnly = True
      FixedChar = True
      Size = 15
    end
  end
  object QActivaAPUSAnidado: TUniSQL
    Connection = DModule_1.con2
    SQL.Strings = (
      'UPDATE apus a '
      ' INNER JOIN apus_items ai '
      '         ON ai.codBase = a.codBase '
      '   AND ai.CodAPU = a.CodAPU '
      '   SET a.anidado = 1 '
      ' WHERE ai.codAPUAlternativo = :codAPUAlternativo '
      '   AND a.codBase=:codBase')
    Left = 1020
    Top = 768
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codAPUAlternativo'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end>
  end
  object QDaUltCodRecursoApu: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  IFNULL(max(a.codRecursoAPU + 1), 1) AS UltCodRecursoAPU'
      'FROM'
      '  apus a'
      'WHERE'
      '  a.codBase = :codBase'
      'ORDER BY'
      '  a.id DESC'
      '  LIMIT 1')
    Left = 588
    Top = 816
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end>
    object QDaUltCodRecursoApuUltCodRecursoAPU: TLargeintField
      FieldName = 'UltCodRecursoAPU'
      ReadOnly = True
      Required = True
    end
  end
  object QDaCodAlternativoAPU: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      ''
      'SELECT'
      '  a.codAPUAlternativo'
      'FROM'
      '  apus a'
      'WHERE'
      '  a.codApu = :codAPU'
      '  AND a.codBase = :codBase')
    Left = 588
    Top = 912
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codAPU'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end>
    object QDaCodAlternativoAPUcodAPUAlternativo: TStringField
      FieldName = 'codAPUAlternativo'
      Size = 255
    end
  end
  object QEsApuAnidado: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  count(a.id) nApus'
      'FROM'
      '  apus_items a'
      'WHERE'
      '  a.codBase = :codBase'
      '  AND a.codAPUAlternativo = :codAPUAlternativo')
    Left = 1008
    Top = 684
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codAPUAlternativo'
        Value = nil
      end>
    object QEsApuAnidadonApus: TLargeintField
      FieldName = 'nApus'
      ReadOnly = True
      Required = True
    end
  end
  object QDaApusItemXAPUS: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  a.idUnicoRecurso,'
      '  a.codCategoria,'
      '  a.Descripcion,'
      '  a.Unidad'
      'FROM'
      '  apus_items a'
      '  LEFT JOIN recursos r ON r.codBase = a.codBase'
      '  AND r.Descripcion = a.Descripcion'
      '  AND r.unidad = a.Unidad'
      'WHERE'
      '  a.codBase = :codBase'
      '  AND a.CodAPU = :codAPU'
      '  AND r.id IS NULL;'
      '')
    Left = 594
    Top = 648
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codAPU'
        Value = nil
      end>
    object QDaApusItemXAPUSidUnicoRecurso: TStringField
      FieldName = 'idUnicoRecurso'
      Size = 255
    end
    object QDaApusItemXAPUScodCategoria: TStringField
      FieldName = 'codCategoria'
      Size = 255
    end
  end
  object QAjustaCodUnicoRecursoAnidado: TUniSQL
    Connection = DModule_1.con2
    SQL.Strings = (
      'UPDATE apus_items '
      '   SET idUnicoRecurso = CONCAT('#39'APU: '#39', (SELECT CodAPU '
      '                                           FROM apus '
      
        '                                          WHERE codAPUAlternativ' +
        'o = :codAPUAlternativo'
      
        '                                            AND codbase = :CodBa' +
        'se))'
      ''
      ' WHERE'
      ' codAPUAlternativo = :codAPUAlternativo  '
      '   AND codBase = :CodBase;')
    Left = 1032
    Top = 876
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codAPUAlternativo'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'CodBase'
        Value = nil
      end>
  end
  object QExisteRecursoI: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  1 as Resultado'
      'FROM'
      '  recursos'
      'WHERE'
      '  codbase = :codBase'
      '  AND Descripcion = :descripcion'
      '  AND unidad = :unidad')
    Left = 360
    Top = 396
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'descripcion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'unidad'
        Value = nil
      end>
    object QExisteRecursoIResultado: TLargeintField
      FieldName = 'Resultado'
      ReadOnly = True
      Required = True
    end
  end
  object QExisteRecursoxCodAlternativo: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'select r.id from apus_items ai'
      'inner join recursos r on r.idUnico = ai.idUnicoRecurso'
      'where  ai.codBase = :CodBase'
      'and ai.codAPUAlternativo=:codApuAlternativo')
    Left = 1458
    Top = 684
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codApuAlternativo'
        Value = nil
      end>
    object QExisteRecursoxCodAlternativoid: TIntegerField
      FieldName = 'id'
    end
  end
  object QDaApusItemXAPUSv2: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  a.idUnicoRecurso,'
      '  a.codCategoria,'
      '  a.Descripcion,'
      '  a.Unidad'
      'FROM'
      '  apus_items a'
      'WHERE'
      '  a.codBase = :codBase'
      '  AND a.CodAPUAlternativo = :codAPUAlternativo'
      '')
    Left = 594
    Top = 564
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codAPUAlternativo'
        Value = nil
      end>
    object QDaApusItemXAPUSv2idUnicoRecurso: TStringField
      FieldName = 'idUnicoRecurso'
      Size = 255
    end
  end
  object QDaUltimoCodRecurso: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  Max(codRecurso) AS UltCodRecurso'
      'FROM'
      '  recursos'
      'WHERE'
      '  codBase = :codBase'
      '  AND codCategoriaBase = :codCategoriaBase')
    Left = 1008
    Top = 600
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codCategoriaBase'
        Value = nil
      end>
    object QDaUltimoCodRecursoUltCodRecurso: TIntegerField
      FieldName = 'UltCodRecurso'
      ReadOnly = True
    end
  end
  object QExisteRecursoxCodAlternativoSERCOP: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  r.id,'
      '  r.codAlternativo'
      'FROM'
      '  apus_items ai'
      '  INNER JOIN recursos r ON r.idUnico = ai.idUnicoRecurso'
      'WHERE'
      '  ai.codBase = :codBase'
      '  AND ai.Descripcion = :descripcion'
      '  AND ai.Unidad = :unidad'
      '  LIMIT 1')
    Left = 1422
    Top = 840
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'descripcion'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'unidad'
        Value = nil
      end>
    object QExisteRecursoxCodAlternativoSERCOPid: TIntegerField
      FieldName = 'id'
    end
    object QExisteRecursoxCodAlternativoSERCOPcodAlternativo: TStringField
      FieldName = 'codAlternativo'
      Size = 255
    end
  end
end
