object DMPresupuesto: TDMPresupuesto
  OnCreate = DataModuleCreate
  OnDestroy = DataModuleDestroy
  Height = 1397
  Width = 2309
  PixelsPerInch = 144
  object QEDT_Valorada: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  pit.codEdt,'
      '  pit.descripcion,'
      '  edt.Responsable,'
      '  edt.Definicion,'
      '  pit.Ptotal + Porcentaje (pit.Ptotal, dg.indirectos) as PTotal'
      'FROM'
      '  presupuestos_items_trabajo pit'
      
        '  INNER JOIN presupuestos_edt edt ON BINARY edt.codBase = BINARY' +
        ' pit.codbase '
      '  AND BINARY edt.codPresupuesto = BINARY pit.codPresupuesto '
      '  AND BINARY edt.Revision = BINARY pit.revision '
      
        '  AND BINARY edt.codUnicoItemPresupuesto = BINARY pit.codUnicoIt' +
        'ems'
      
        '  INNER JOIN presupuestos_datosgenerales dg ON dg.codBase = pit.' +
        'codBase '
      '  AND dg.codPresupuesto = pit.codPresupuesto '
      '  AND dg.revision = pit.revision '
      'WHERE'
      '  (pit.codItems = '#39#39' OR pit.codItems IS NULL) '
      '  AND pit.codBase = :codBase '
      '  AND pit.codPresupuesto = :codPresupuesto '
      '  AND pit.revision = :Revision '
      'ORDER BY'
      '  pit.codEdt')
    Left = 1468
    Top = 160
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
        Name = 'Revision'
        Value = nil
      end>
    object QEDT_ValoradacodEdt: TStringField
      FieldName = 'codEdt'
      Size = 255
    end
    object QEDT_Valoradadescripcion: TStringField
      FieldName = 'descripcion'
      Size = 255
    end
    object QEDT_ValoradaResponsable: TStringField
      FieldName = 'Responsable'
      ReadOnly = True
      Size = 255
    end
    object QEDT_ValoradaDefinicion: TMemoField
      FieldName = 'Definicion'
      ReadOnly = True
      BlobType = ftMemo
    end
    object QEDT_ValoradaPTotal: TFloatField
      FieldName = 'PTotal'
      ReadOnly = True
    end
  end
  object unqry_ActualizarIVA: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      
        'update presupuestos_datosgenerales set porcentajeIVA=:porcentaje' +
        'IVA where codBase=:iCodBase and codPresupuesto=:iCodPresupuesto ' +
        'and revision=:iRevision')
    Left = 1616
    Top = 36
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'porcentajeIVA'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'iCodBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'iCodPresupuesto'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'iRevision'
        Value = nil
      end>
  end
  object StoreProc_ParetoGeneral: TUniStoredProc
    StoredProcName = 'Presupuestos_Pareto_General'
    SQL.Strings = (
      
        'CALL Presupuestos_Pareto_General(:icodBase, :icodPresupuesto, :i' +
        'Revision)')
    Connection = DModule_1.con2
    Left = 155
    Top = 900
    ParamData = <
      item
        DataType = ftString
        Name = 'icodBase'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftVarBytes
        Name = 'icodPresupuesto'
        ParamType = ptInput
        Value = nil
      end
      item
        DataType = ftVarBytes
        Name = 'iRevision'
        ParamType = ptInput
        Value = nil
      end>
    CommandStoredProcName = 'Presupuestos_Pareto_General'
  end
  object dsPareto: TUniDataSource
    DataSet = qryPareto
    Left = 548
    Top = 116
  end
  object qryPareto: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  p.id,'
      '  p.codBase,'
      '  p.codPresupuesto,'
      '  p.revision,'
      ''
      
        '  IF((p.codAPU IS NULL OR p.codAPU = '#39#39'), p.codEdt, '#39#39') AS codED' +
        'T,'
      ''
      '  p.codItems,'
      '  p.codUnicoItems,'
      '  p.codAPUGenerico,'
      '  p.codAPU,'
      '  p.descripcion,'
      '  p.unidad,'
      '  p.notas,'
      '  p.rendimientoHUnidad,'
      '  p.nhCuadrillas,'
      '  p.anidado,'
      '  p.posgrid,'
      ''
      '  CAST(IFNULL(t.estado,0) AS SIGNED) AS estado_tanteo,'
      ''
      '  CASE'
      '    WHEN TRIM(IFNULL(p.codEdt,'#39#39')) <> '#39#39' THEN NULL'
      '    ELSE Redondea(p.cantidad,2)'
      '  END AS cantidad,'
      ''
      '  CASE'
      '    WHEN TRIM(IFNULL(p.codEdt,'#39#39')) <> '#39#39' THEN NULL'
      '    ELSE Redondea(p.PUnitario,:ndec)'
      '  END AS PUnitario,'
      ''
      '  p.Ptotal'
      ''
      'FROM tgriditems p'
      ''
      'LEFT JOIN presupuestos_tanteo_apus t'
      '  ON t.codBase = p.codBase'
      '  AND t.codPresupuesto = p.codPresupuesto'
      '  AND t.revision = p.revision'
      '  AND t.CodAPU = p.codAPU'
      ''
      'WHERE'
      '  p.codBase = :codBase'
      '  AND p.codPresupuesto = :codPresupuesto'
      '  AND p.revision = :revision'
      ''
      'ORDER BY p.posgrid;')
    Left = 708
    Top = 28
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'ndec'
        Value = nil
      end
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
      end>
    object qryParetoid: TIntegerField
      AutoGenerateValue = arAutoInc
      FieldName = 'id'
      Visible = False
    end
    object qryParetocodBase: TStringField
      FieldName = 'codBase'
      Visible = False
      Size = 255
    end
    object qryParetocodPresupuesto: TStringField
      FieldName = 'codPresupuesto'
      Visible = False
      Size = 255
    end
    object qryParetorevision: TStringField
      FieldName = 'revision'
      Visible = False
      Size = 255
    end
    object qryParetocodEDT: TStringField
      FieldName = 'codEDT'
      ReadOnly = True
      Size = 255
    end
    object qryParetocodItems: TStringField
      FieldName = 'codItems'
      Size = 255
    end
    object qryParetocodUnicoItems: TStringField
      FieldName = 'codUnicoItems'
      Visible = False
      Size = 255
    end
    object qryParetocodAPUGenerico: TStringField
      FieldName = 'codAPUGenerico'
      Size = 255
    end
    object qryParetocodAPU: TStringField
      FieldName = 'codAPU'
      Visible = False
      Size = 255
    end
    object qryParetodescripcion: TStringField
      FieldName = 'descripcion'
      Size = 255
    end
    object qryParetounidad: TStringField
      FieldName = 'unidad'
      Size = 255
    end
    object qryParetoCantidad: TFloatField
      FieldName = 'Cantidad'
    end
    object qryParetoPUnitario: TFloatField
      FieldName = 'PUnitario'
    end
    object qryParetoPtotal: TFloatField
      FieldName = 'Ptotal'
    end
    object qryParetonotas: TBooleanField
      FieldName = 'notas'
    end
    object qryParetorendimientoHUnidad: TStringField
      FieldName = 'rendimientoHUnidad'
      Visible = False
      Size = 255
    end
    object qryParetonhCuadrillas: TStringField
      FieldName = 'nhCuadrillas'
      Visible = False
      Size = 255
    end
    object qryParetoanidado: TStringField
      FieldName = 'anidado'
      Visible = False
      Size = 1
    end
    object qryParetoposgrid: TIntegerField
      FieldName = 'posgrid'
      Visible = False
    end
  end
  object StoreProc_ParetoCapitulos: TUniStoredProc
    StoredProcName = 'Presupuestos_Pareto_Capitulos'
    SQL.Strings = (
      
        'CALL Presupuestos_Pareto_Capitulos(:icodBase, :icodPresupuesto, ' +
        ':iRevision)')
    Connection = DModule_1.con2
    Left = 171
    Top = 1124
    ParamData = <
      item
        DataType = ftString
        Name = 'icodBase'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftVarBytes
        Name = 'icodPresupuesto'
        ParamType = ptInput
        Value = nil
      end
      item
        DataType = ftVarBytes
        Name = 'iRevision'
        ParamType = ptInput
        Value = nil
      end>
    CommandStoredProcName = 'Presupuestos_Pareto_Capitulos'
  end
  object dsPCapitulo: TUniDataSource
    DataSet = qryPCapitulo
    Left = 544
    Top = 20
  end
  object qryPCapitulo: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  p.id,'
      '  p.codBase,'
      '  p.codPresupuesto,'
      '  p.revision,'
      ''
      
        '  IF((p.codAPU IS NULL OR p.codAPU = '#39#39'), p.codEdt, '#39#39') AS codED' +
        'T,'
      ''
      '  p.codItems,'
      '  p.codUnicoItems,'
      '  p.codAPUGenerico,'
      '  p.codAPU,'
      '  p.descripcion,'
      '  p.unidad,'
      '  p.notas,'
      '  p.rendimientoHUnidad,'
      '  p.nhCuadrillas,'
      '  p.anidado,'
      '  p.posgrid,'
      ''
      '  CAST(IFNULL(t.estado,0) AS SIGNED) AS estado_tanteo,'
      ''
      '  CASE'
      '    WHEN TRIM(IFNULL(p.codEdt,'#39#39')) <> '#39#39' THEN NULL'
      '    ELSE Redondea(p.cantidad,2)'
      '  END AS cantidad,'
      ''
      '  CASE'
      '    WHEN TRIM(IFNULL(p.codEdt,'#39#39')) <> '#39#39' THEN NULL'
      '    ELSE Redondea(p.PUnitario,:ndec)'
      '  END AS PUnitario,'
      ''
      '  p.Ptotal'
      ''
      'FROM tgriditems p'
      ''
      'LEFT JOIN presupuestos_tanteo_apus t'
      '  ON t.codBase = p.codBase'
      '  AND t.codPresupuesto = p.codPresupuesto'
      '  AND t.revision = p.revision'
      '  AND t.CodAPU = p.codAPU'
      ''
      'WHERE'
      '  p.codBase = :codBase'
      '  AND p.codPresupuesto = :codPresupuesto'
      '  AND p.revision = :revision'
      ''
      'ORDER BY p.posgrid;')
    Left = 704
    Top = 112
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'ndec'
        Value = nil
      end
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
      end>
    object qryPCapituloid: TIntegerField
      FieldName = 'id'
      Visible = False
    end
    object qryPCapitulocodBase: TStringField
      FieldName = 'codBase'
      Visible = False
      Size = 255
    end
    object qryPCapitulocodPresupuesto: TStringField
      FieldName = 'codPresupuesto'
      Visible = False
      Size = 255
    end
    object qryPCapitulorevision: TStringField
      FieldName = 'revision'
      Visible = False
      Size = 255
    end
    object qryPCapitulocodEDT: TStringField
      FieldName = 'codEDT'
      ReadOnly = True
      Size = 255
    end
    object qryPCapitulocodItems: TStringField
      FieldName = 'codItems'
      Size = 255
    end
    object qryPCapitulocodUnicoItems: TStringField
      FieldName = 'codUnicoItems'
      Visible = False
      Size = 255
    end
    object qryPCapitulocodAPUGenerico: TStringField
      FieldName = 'codAPUGenerico'
      Size = 255
    end
    object qryPCapitulocodAPU: TStringField
      FieldName = 'codAPU'
      Visible = False
      Size = 255
    end
    object qryPCapitulodescripcion: TStringField
      FieldName = 'descripcion'
      Size = 255
    end
    object qryPCapitulounidad: TStringField
      FieldName = 'unidad'
      Size = 255
    end
    object qryPCapituloCantidad: TFloatField
      FieldName = 'Cantidad'
    end
    object qryPCapituloPUnitario: TFloatField
      FieldName = 'PUnitario'
    end
    object qryPCapituloPtotal: TFloatField
      FieldName = 'Ptotal'
    end
    object qryPCapitulonotas: TBooleanField
      FieldName = 'notas'
    end
    object qryPCapitulorendimientoHUnidad: TStringField
      FieldName = 'rendimientoHUnidad'
      Visible = False
      Size = 255
    end
    object qryPCapitulonhCuadrillas: TStringField
      FieldName = 'nhCuadrillas'
      Visible = False
      Size = 255
    end
    object qryPCapituloanidado: TStringField
      FieldName = 'anidado'
      Visible = False
      Size = 1
    end
    object qryPCapituloposgrid: TIntegerField
      FieldName = 'posgrid'
      Visible = False
    end
  end
  object dsTpresupuestosItems: TUniDataSource
    DataSet = QTPresupuestosItems
    Left = 552
    Top = 604
  end
  object StoreProc_EstaAPUenCapitulo: TUniStoredProc
    StoredProcName = 'Presupuestos_EstaAPUenCapitulo'
    SQL.Strings = (
      
        'CALL Presupuestos_EstaAPUenCapitulo(:iCodBase, :iCodPresupuesto,' +
        ' :iRevision, :iPosItemInicio, :iPosItemFin, @estado); SELECT @es' +
        'tado AS '#39'@estado'#39)
    Connection = DModule_1.con2
    Left = 115
    Top = 300
    ParamData = <
      item
        DataType = ftString
        Name = 'iCodBase'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iCodPresupuesto'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iRevision'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftInteger
        Name = 'iPosItemInicio'
        ParamType = ptInput
        Value = nil
      end
      item
        DataType = ftInteger
        Name = 'iPosItemFin'
        ParamType = ptInput
        Value = nil
      end
      item
        DataType = ftString
        Name = 'estado'
        ParamType = ptOutput
        Size = 50
        Value = nil
      end>
    CommandStoredProcName = 'Presupuestos_EstaAPUenCapitulo'
  end
  object StoreProc_Presupuesto_actualizaLinea: TUniStoredProc
    StoredProcName = 'Presupuestos_ActualizaValorLinea'
    SQL.Strings = (
      
        'CALL Presupuestos_ActualizaValorLinea(:icodBase, :icodPresupuest' +
        'o, :iRevision, :idPresupuestoItems, :newCantidad)')
    Connection = DModule_1.con2
    Left = 139
    Top = 548
    ParamData = <
      item
        DataType = ftString
        Name = 'icodBase'
        ParamType = ptInput
        Size = 50
        Value = nil
      end
      item
        DataType = ftString
        Name = 'icodPresupuesto'
        ParamType = ptInput
        Size = 50
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iRevision'
        ParamType = ptInput
        Size = 50
        Value = nil
      end
      item
        DataType = ftInteger
        Name = 'idPresupuestoItems'
        ParamType = ptInput
        Value = nil
      end
      item
        DataType = ftFloat
        Name = 'newCantidad'
        ParamType = ptInput
        Value = nil
      end>
    CommandStoredProcName = 'Presupuestos_ActualizaValorLinea'
  end
  object unqryAbrePosGrid: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      
        'UPDATE presupuestos_items_trabajo SET posgrid=posgrid+1 WHERE po' +
        'sgrid>:posgrid AND codBase=:codBase AND codPresupuesto=:codPresu' +
        'puesto AND revision=:revision')
    Left = 1076
    Top = 356
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'posgrid'
        Value = nil
      end
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
      end>
  end
  object unqryUpdataCantidades: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      
        'UPDATE presupuestos_items_trabajo SET cantidad=:cantidad, Ptotal' +
        '=:pTotal where id=:id and codBase=:codBase and codPresupuesto=:c' +
        'odPresupuesto and revision=:revision')
    Left = 1288
    Top = 356
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'cantidad'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'pTotal'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'id'
        Value = nil
      end
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
      end>
  end
  object StoreProc_CopyMoveAPU: TUniStoredProc
    StoredProcName = 'Presupuestos_CopiarMoverApu'
    SQL.Strings = (
      
        'CALL Presupuestos_CopiarMoverApu(:icodBase, :icodPresupuesto, :i' +
        'Revision, :iPosInicio, :iPosFin, :iTipoMovimiento, :idUsuario)')
    Connection = DModule_1.con2
    Left = 115
    Top = 156
    ParamData = <
      item
        DataType = ftString
        Name = 'icodBase'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'icodPresupuesto'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iRevision'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftInteger
        Name = 'iPosInicio'
        ParamType = ptInput
        Value = nil
      end
      item
        DataType = ftInteger
        Name = 'iPosFin'
        ParamType = ptInput
        Value = nil
      end
      item
        DataType = ftInteger
        Name = 'iTipoMovimiento'
        ParamType = ptInput
        Value = nil
      end
      item
        DataType = ftInteger
        Name = 'idUsuario'
        ParamType = ptInput
        Value = nil
      end>
    CommandStoredProcName = 'Presupuestos_CopiarMoverApu'
  end
  object unqryNotas: TUniQuery
    SQLDelete.Strings = (
      'DELETE FROM presupuestos_notas'
      'WHERE'
      
        '  codBase = :Old_codBase AND codPresupuesto = :Old_codPresupuest' +
        'o AND Revision = :Old_Revision AND codAPU = :Old_codAPU AND codU' +
        'nicoItems = :Old_codUnicoItems')
    SQLUpdate.Strings = (
      '')
    SQLRefresh.Strings = (
      
        'SELECT id, codBase, codPresupuesto, Revision, codAPU, codUnicoIt' +
        'ems, fechahora, notas FROM presupuestos_notas'
      'WHERE'
      '  id = :id')
    Connection = DModule_1.con2
    SQL.Strings = (
      
        'select notas, fechahora from presupuestos_notas where codBase=:c' +
        'odBase and codPresupuesto=:codPresupuesto and revision=:revision' +
        ' and codUnicoItems=:codUnicoItems and codAPU=:codAPU')
    Left = 536
    Top = 1096
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
        Name = 'codUnicoItems'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codAPU'
        Value = nil
      end>
    object mfldNotasnotas: TMemoField
      FieldName = 'notas'
      BlobType = ftMemo
    end
    object dtmfldNotasfechahora: TDateTimeField
      FieldName = 'fechahora'
    end
  end
  object StoreProc_NotaenAPUS: TUniStoredProc
    StoredProcName = 'Presupuestos_NotasCopiarEnAPUS'
    SQL.Strings = (
      
        'CALL Presupuestos_NotasCopiarEnAPUS(:iCodBase, :iCodPresupuesto,' +
        ' :iRevision, :iNota)')
    Connection = DModule_1.con2
    Left = 112
    Top = 700
    ParamData = <
      item
        DataType = ftString
        Name = 'iCodBase'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iCodPresupuesto'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iRevision'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftMemo
        Name = 'iNota'
        ParamType = ptInput
        Value = Null
      end>
    CommandStoredProcName = 'Presupuestos_NotasCopiarEnAPUS'
  end
  object QAPUS: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '    q.id,'
      '    q.codrecursoapu,'
      '    q.codcategoriaapu,'
      '    q.codapu,'
      '    q.CodGenerico,'
      '    q.descripcion,'
      '    q.unidad,'
      ''
      '    Redondea('
      '        Redondea(q.CostoBase, q.ndec)'
      '        +'
      '        Redondea('
      '            Redondea(q.CostoBase, q.ndec) * :porcentaje / 100,'
      '            q.ndec'
      '        ),'
      '        q.ndec'
      '    ) AS CostoAPU,'
      ''
      '    q.anidado'
      ''
      'FROM'
      '('
      '    SELECT'
      '        a.id,'
      '        a.codrecursoapu,'
      '        a.codcategoriaapu,'
      '        a.codapu,'
      '        Dacodapugenerico(a.codbase, a.codapu) AS CodGenerico,'
      
        '        CAST(a.descripcion AS CHAR CHARACTER SET utf8mb4) AS des' +
        'cripcion,'
      '        a.unidad,'
      '        a.anidado,'
      ''
      '        COALESCE(pdg.ndecimalesMoneda,2) AS ndec,'
      ''
      '        CASE'
      '            WHEN IFNULL(pta.estado,0) = 2'
      '            THEN IFNULL(pta.CostoDirectoTotal,0)'
      ''
      '            ELSE DavalorAPUconTanteoSinIndirectos('
      '                    a.codbase,'
      '                    :codPresupuesto,'
      '                    :revision,'
      '                    a.codapu'
      '                 )'
      '        END AS CostoBase'
      ''
      '    FROM apus a'
      ''
      '    LEFT JOIN presupuestos_tanteo_apus pta'
      '        ON pta.codBase = a.codBase'
      '       AND pta.codPresupuesto = :codPresupuesto'
      '       AND pta.revision = :revision'
      '       AND pta.CodAPU = a.CodAPU'
      ''
      '    LEFT JOIN presupuestos_datosgenerales pdg'
      '        ON pdg.codBase = a.codBase'
      '       AND pdg.codPresupuesto = :codPresupuesto'
      '       AND pdg.revision = :revision'
      '       AND pdg.activo = 1'
      ''
      '    WHERE a.codbase = :codBase'
      ') q'
      ''
      'ORDER BY q.descripcion;')
    Options.FullRefresh = True
    Options.AutoPrepare = True
    Options.UpdateAllFields = True
    Left = 972
    Top = 532
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'porcentaje'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codPresupuesto'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'Revision'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end>
    object QAPUSid: TIntegerField
      AutoGenerateValue = arAutoInc
      FieldName = 'id'
    end
    object QAPUScodrecursoapu: TIntegerField
      FieldName = 'codrecursoapu'
    end
    object QAPUScodcategoriaapu: TStringField
      FieldName = 'codcategoriaapu'
      Size = 255
    end
    object QAPUScodapu: TStringField
      FieldName = 'codapu'
      Size = 255
    end
    object QAPUSCodGenerico: TStringField
      FieldName = 'CodGenerico'
      ReadOnly = True
      FixedChar = True
      Size = 15
    end
    object QAPUSdescripcion: TStringField
      FieldName = 'descripcion'
      Size = 255
    end
    object QAPUSunidad: TStringField
      FieldName = 'unidad'
      Size = 255
    end
    object QAPUSCostoAPU: TFloatField
      FieldName = 'CostoAPU'
      ReadOnly = True
    end
    object QAPUSanidado: TStringField
      FieldName = 'anidado'
      Size = 255
    end
  end
  object dsSubCategorias: TUniDataSource
    DataSet = QSubCategorias
    Left = 552
    Top = 300
  end
  object dsPresupuestosAPUs: TUniDataSource
    DataSet = QAPUS
    Left = 972
    Top = 612
  end
  object QSubCategorias: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT ciu,'
      '       descripcion'
      'FROM   categoriaapus'
      'WHERE  codbase = :codBase'
      '       AND categoria_base = 6'
      'ORDER  BY descripcion ASC')
    Left = 1320
    Top = 708
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codBase'
        Value = nil
      end>
    object QSubCategoriasciu: TIntegerField
      FieldName = 'ciu'
      Visible = False
    end
    object QSubCategoriasdescripcion: TStringField
      DisplayLabel = 'Descripci'#243'n'
      FieldName = 'descripcion'
      ReadOnly = True
      Size = 255
    end
  end
  object QTPresupuestosItems: TUniQuery
    SQLRefresh.Strings = (
      '')
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  pit.id,'
      '  pit.codBase,'
      '  pit.codPresupuesto,'
      '  pit.revision,'
      '  pit.codEdt AS codEDT,'
      '  pit.codItems,'
      '  pit.codUnicoItems,'
      '  pit.codAPUGenerico,'
      '  pit.codAPU,'
      '  pit.descripcion,'
      '  pit.unidad,'
      '  CAST(pit.cantidad AS DECIMAL(18,6)) AS Cantidad,'
      '  CAST(pit.PUnitario AS DECIMAL(18,6)) AS PUnitario,'
      '  CAST(pit.Ptotal AS DECIMAL(18,6)) AS Ptotal,'
      '  pit.notas,'
      '  pit.rendimientoHUnidad,'
      '  pit.nhCuadrillas,'
      '  pit.anidado,'
      '  pit.posgrid,'
      '  COALESCE(pta.estado,0) AS estado_tanteo'
      'FROM presupuestos_items_trabajo pit'
      'LEFT JOIN presupuestos_tanteo_apus pta'
      '  ON pta.codBase = pit.codBase'
      ' AND pta.codPresupuesto = pit.codPresupuesto'
      ' AND pta.revision = pit.revision'
      ' AND pta.CodAPU = pit.codAPU'
      'WHERE'
      '  pit.codBase = :icodBase'
      '  AND pit.codPresupuesto = :icodPresupuesto'
      '  AND pit.revision = :irevision'
      'ORDER BY pit.posgrid;')
    AfterOpen = QTPresupuestosItemsAfterOpen
    Left = 552
    Top = 688
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'icodBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'icodPresupuesto'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'irevision'
        Value = nil
      end>
  end
  object QTanteoRecursoAPUS: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  IF(a.codcategoria = 6, 2, a.codcategoria) AS CodCategoria,'
      '  a.codbase,'
      '  a.codapu,'
      '  a.codRecursoCompleto,'
      '  a.descripcion,'
      '  a.unidad,'
      '  a.idunicorecurso,'
      '  IF('
      '    t.idUnicoRecurso IS NULL,'
      '    redondea (a.precio, dg.ndecimalesmoneda),'
      '    redondea (t.precio, dg.ndecimalesmoneda)'
      '  ) AS Precio,'
      '  IF('
      '    t.idUnicoRecurso IS NULL,'
      '    redondea (a.cantidadunidad, dg.ndecimalesmoneda),'
      '    redondea (t.cantidadunidad, dg.ndecimalesmoneda)'
      '  ) AS CantidadUnidad,'
      '  IF('
      '    t.idUnicoRecurso IS NULL,'
      '    Redondea (a.rendimiento, dg.ndecimalesmoneda),'
      '    redondea (t.rendimiento, dg.ndecimalesmoneda)'
      '  ) AS Rendimiento,'
      '  IF('
      '    t.idUnicoRecurso IS NULL,'
      '    redondea ('
      
        '      redondea (a.precio, dg.ndecimalesmoneda) * redondea (a.can' +
        'tidadunidad, dg.ndecimalesmoneda) * Redondea (a.rendimiento, dg.' +
        'ndecimalesmoneda),'
      '      dg.ndecimalesmoneda'
      '    ),'
      '    redondea ('
      
        '      redondea (t.precio, dg.ndecimalesmoneda) * redondea (t.can' +
        'tidadunidad, dg.ndecimalesmoneda) * redondea (t.rendimiento, dg.' +
        'ndecimalesmoneda),'
      '      dg.ndecimalesmoneda'
      '    )'
      '  ) AS Total'
      'FROM'
      '  apus_items a'
      '  LEFT JOIN presupuestos_tanteo_recursos t ON ('
      '    t.codbase = a.codbase'
      '    AND t.codapu = a.codapu'
      '    AND t.codpresupuesto = :codPresupuesto'
      '    AND t.revision = :revision'
      '    AND t.idUnicoRecurso = a.idUnicoRecurso'
      '  )'
      
        '  INNER JOIN presupuestos_datosgenerales dg ON (dg.codBase = a.c' +
        'odbase AND dg.codPresupuesto = :codPresupuesto AND dg.revision =' +
        ' :revision)'
      'WHERE'
      '  a.codbase = :codBase'
      '  AND a.codapu = :codApu'
      'ORDER BY'
      '  codcategoria,'
      '  descripcion')
    Left = 1080
    Top = 148
    ParamData = <
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
        Name = 'codBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'codApu'
        Value = nil
      end>
    object QTanteoRecursoAPUSCodCategoria: TStringField
      FieldName = 'CodCategoria'
      ReadOnly = True
      Visible = False
      Size = 255
    end
    object QTanteoRecursoAPUScodbase: TStringField
      FieldName = 'codbase'
      ReadOnly = True
      Visible = False
      Size = 255
    end
    object QTanteoRecursoAPUScodapu: TStringField
      FieldName = 'codapu'
      ReadOnly = True
      Visible = False
      Size = 255
    end
    object QTanteoRecursoAPUSidunicorecurso: TStringField
      FieldName = 'idunicorecurso'
      ReadOnly = True
      Visible = False
      Size = 255
    end
    object QTanteoRecursoAPUScodRecursoCompleto: TStringField
      FieldName = 'codRecursoCompleto'
      ReadOnly = True
      Size = 255
    end
    object QTanteoRecursoAPUSdescripcion: TStringField
      FieldName = 'descripcion'
      ReadOnly = True
      Size = 255
    end
    object QTanteoRecursoAPUSunidad: TStringField
      FieldName = 'unidad'
      ReadOnly = True
      Size = 255
    end
    object QTanteoRecursoAPUSCantidadUnidad: TFloatField
      FieldName = 'CantidadUnidad'
    end
    object QTanteoRecursoAPUSPrecio: TFloatField
      FieldName = 'Precio'
      ReadOnly = True
    end
    object QTanteoRecursoAPUSRendimiento: TFloatField
      FieldName = 'Rendimiento'
    end
    object QTanteoRecursoAPUSTotal: TFloatField
      FieldName = 'Total'
      ReadOnly = True
    end
  end
  object QTanteoAPUS: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  ap.descripcion,'
      '  ap.unidad,'
      '  ta.costodirectototal,'
      
        '  Porcentaje (ta.CostoDirectoTotal, dt.indirectos) AS CostoIndir' +
        'ectoTotal,'
      
        '  ta.CostoDirectoTotal + Porcentaje (ta.CostoDirectoTotal, dt.in' +
        'directos) AS PrecioUnitarioTotal'
      'FROM'
      '  presupuestos_tanteo_apus ta'
      
        '  INNER JOIN apus ap ON (ap.codbase = ta.codbase AND ap.codapu =' +
        ' ta.codapu)'
      
        '  INNER JOIN presupuestos_datosgenerales dt ON dt.codBase = ta.c' +
        'odBase'
      '  AND dt.codPresupuesto = ta.codPresupuesto'
      '  AND dt.revision = ta.revision'
      'WHERE  ta.codbase = :codbase'
      '       AND ta.codpresupuesto = :codPresupuesto'
      '       AND ta.revision = :revision'
      '       AND ta.codapu = :codAPU; ')
    Left = 1284
    Top = 36
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codbase'
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
        Name = 'codAPU'
        Value = nil
      end>
    object QTanteoAPUSdescripcion: TStringField
      FieldName = 'descripcion'
      Size = 255
    end
    object QTanteoAPUSunidad: TStringField
      FieldName = 'unidad'
      Size = 255
    end
    object QTanteoAPUScostodirectototal: TFloatField
      FieldName = 'costodirectototal'
      ReadOnly = True
    end
    object QTanteoAPUSCostoIndirectoTotal: TFloatField
      FieldName = 'CostoIndirectoTotal'
      ReadOnly = True
    end
    object QTanteoAPUSPrecioUnitarioTotal: TFloatField
      FieldName = 'PrecioUnitarioTotal'
      ReadOnly = True
    end
  end
  object QLeerLineaTanteo: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      
        'select Total from presupuestos_tanteo_recursos where codBase=:co' +
        'dbase and codPresupuesto=:codPresupuesto and revision=:revision ' +
        'and CodAPU=:codAPU and idUnicoRecurso=:idUnicoRecurso')
    Left = 1080
    Top = 32
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codbase'
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
        Name = 'codAPU'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'idUnicoRecurso'
        Value = nil
      end>
  end
  object StoreProc_TanteoGuardaItems: TUniStoredProc
    StoredProcName = 'tanteo_guardarItems'
    SQL.Strings = (
      
        'CALL tanteo_guardarItems(:iCodBase, :iCodPresupuesto, :iRevision' +
        ', :iCodAPU, :newCantidad, :newRendimiento, :iIDUnicoItem)')
    Connection = DModule_1.con2
    Left = 968
    Top = 980
    ParamData = <
      item
        DataType = ftString
        Name = 'iCodBase'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iCodPresupuesto'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iRevision'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iCodAPU'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftFloat
        Name = 'newCantidad'
        ParamType = ptInput
        Value = nil
      end
      item
        DataType = ftFloat
        Name = 'newRendimiento'
        ParamType = ptInput
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iIDUnicoItem'
        ParamType = ptInput
        Size = 255
        Value = nil
      end>
    CommandStoredProcName = 'tanteo_guardarItems'
  end
  object QCopiarEDTInicio: TUniSQL
    Connection = DModule_1.con2
    SQL.Strings = (
      
        'insert presupuestos_items SELECT * from presupuestos_items_traba' +
        'jo where codBase=:codBase and codPresupuesto=:codPresupuesto and' +
        ' revision=:revision')
    Left = 372
    Top = 24
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
      end>
  end
  object QLV_ApusCategoria: TUniQuery
    Connection = DModule_1.con2
    Left = 908
    Top = 244
  end
  object QDirectorioAsignados: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  * '
      'FROM'
      '  presupuestos_stakeholders ps'
      '  left JOIN stakeholders stk on (stk.idFiscal=ps.idFiscal)'
      'WHERE'
      '  codBase = :icodBase '
      '  AND codPresupuesto = :icodPresupuesto'
      '  AND revision = :irevision'
      'ORDER BY'
      '  idgrid;')
    Left = 1624
    Top = 152
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'icodBase'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'icodPresupuesto'
        Value = nil
      end
      item
        DataType = ftUnknown
        Name = 'irevision'
        Value = nil
      end>
    object QDirectorioAsignadosid: TIntegerField
      FieldName = 'id'
    end
    object QDirectorioAsignadosidGrid: TStringField
      FieldName = 'idGrid'
      Size = 255
    end
    object QDirectorioAsignadoscodBase: TStringField
      FieldName = 'codBase'
      Size = 255
    end
    object QDirectorioAsignadoscodPresupuesto: TStringField
      FieldName = 'codPresupuesto'
      Size = 255
    end
    object QDirectorioAsignadosrevision: TStringField
      FieldName = 'revision'
      Size = 255
    end
    object QDirectorioAsignadosrolPresupuesto: TStringField
      FieldName = 'rolPresupuesto'
      Size = 255
    end
    object QDirectorioAsignadosidFiscal: TStringField
      FieldName = 'idFiscal'
      Size = 255
    end
    object QDirectorioAsignadosnombre: TStringField
      FieldName = 'nombre'
      Size = 255
    end
    object QDirectorioAsignadosapellidos: TStringField
      FieldName = 'apellidos'
      Size = 255
    end
    object QDirectorioAsignadosemail: TStringField
      FieldName = 'email'
      Size = 255
    end
    object QDirectorioAsignadostitulacion: TStringField
      FieldName = 'titulacion'
      Size = 255
    end
    object QDirectorioAsignadosidUnico: TStringField
      FieldName = 'idUnico'
      Size = 255
    end
    object QDirectorioAsignadosid_1: TIntegerField
      FieldName = 'id_1'
      ReadOnly = True
    end
    object QDirectorioAsignadosrolProyecto: TStringField
      FieldName = 'rolProyecto'
      ReadOnly = True
      Size = 255
    end
    object QDirectorioAsignadosidFiscal_1: TStringField
      FieldName = 'idFiscal_1'
      ReadOnly = True
      Size = 255
    end
    object QDirectorioAsignadosNombre_1: TStringField
      FieldName = 'Nombre_1'
      ReadOnly = True
      Size = 255
    end
    object QDirectorioAsignadosApellidos_1: TStringField
      FieldName = 'Apellidos_1'
      ReadOnly = True
      Size = 255
    end
    object QDirectorioAsignadosdireccion: TStringField
      FieldName = 'direccion'
      ReadOnly = True
      Size = 255
    end
    object QDirectorioAsignadoslocalidad: TStringField
      FieldName = 'localidad'
      ReadOnly = True
      Size = 255
    end
    object QDirectorioAsignadosprovincia: TStringField
      FieldName = 'provincia'
      ReadOnly = True
      Size = 255
    end
    object QDirectorioAsignadospais: TStringField
      FieldName = 'pais'
      ReadOnly = True
      Size = 255
    end
    object QDirectorioAsignadostelefono: TStringField
      FieldName = 'telefono'
      ReadOnly = True
      Size = 255
    end
    object QDirectorioAsignadosemail_1: TStringField
      FieldName = 'email_1'
      ReadOnly = True
      Size = 255
    end
    object QDirectorioAsignadosTitulacion_1: TStringField
      FieldName = 'Titulacion_1'
      ReadOnly = True
      Size = 255
    end
    object QDirectorioAsignadosInstitucion: TStringField
      FieldName = 'Institucion'
      ReadOnly = True
      Size = 255
    end
  end
  object QBuscarStake: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT * FROM `stakeholders` where idFiscal=:codSTK')
    Left = 1632
    Top = 272
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'codSTK'
        Value = nil
      end>
    object QBuscarStakeid: TIntegerField
      FieldName = 'id'
    end
    object QBuscarStakerolProyecto: TStringField
      FieldName = 'rolProyecto'
      Size = 255
    end
    object QBuscarStakeidFiscal: TStringField
      FieldName = 'idFiscal'
      Size = 255
    end
    object QBuscarStakeNombre: TStringField
      FieldName = 'Nombre'
      Size = 255
    end
    object QBuscarStakeApellidos: TStringField
      FieldName = 'Apellidos'
      Size = 255
    end
    object QBuscarStakedireccion: TStringField
      FieldName = 'direccion'
      Size = 255
    end
    object QBuscarStakelocalidad: TStringField
      FieldName = 'localidad'
      Size = 255
    end
    object QBuscarStakeprovincia: TStringField
      FieldName = 'provincia'
      Size = 255
    end
    object QBuscarStakepais: TStringField
      FieldName = 'pais'
      Size = 255
    end
    object QBuscarStaketelefono: TStringField
      FieldName = 'telefono'
      Size = 255
    end
    object QBuscarStakeemail: TStringField
      FieldName = 'email'
      Size = 255
    end
    object QBuscarStakeTitulacion: TStringField
      FieldName = 'Titulacion'
      Size = 255
    end
    object QBuscarStakeInstitucion: TStringField
      FieldName = 'Institucion'
      Size = 255
    end
  end
  object QEDOProyecto: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT rolproyecto,'
      '       responsable,'
      '       idstake,'
      '       actividadclave'
      'FROM   `presupuestos_edo_datos`'
      'WHERE  codbase = :codBase'
      '       AND codpresupuesto = :codPresupuesto'
      '       AND revision = :revision')
    Left = 1620
    Top = 384
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
      end>
    object QEDOProyectorolproyecto: TStringField
      FieldName = 'rolproyecto'
      Size = 255
    end
    object QEDOProyectoresponsable: TStringField
      FieldName = 'responsable'
      Size = 255
    end
    object QEDOProyectoidstake: TStringField
      FieldName = 'idstake'
      Size = 255
    end
    object QEDOProyectoactividadclave: TMemoField
      FieldName = 'actividadclave'
      BlobType = ftMemo
    end
  end
  object QDatosCronogramasValorados: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT d.descripcion,'
      
        '       Concat(Concat(s.nombre, Char(32)), s.apellidos) AS Nombre' +
        'Apellido,'
      
        '       Concat(Concat(d.ciudad, Char(32)), d.provincia) AS Ubicac' +
        'ion,'
      '       d.fechainicio,'
      '       d.fechafinalizacion,'
      '       d.plazoejecucion,'
      '       d.codreferencial,'
      '       d.ciudad'
      'FROM   presupuestos_datosproyecto d'
      '       LEFT JOIN presupuestos_edo_datos edo'
      '              ON edo.codbase = d.codbase'
      '                 AND edo.codpresupuesto = d.codpresupuesto'
      '                 AND edo.revision = d.revision'
      '                 AND Lower(edo.rolproyecto) = '#39'oferente'#39
      '       LEFT JOIN presupuestos_stakeholders s'
      '              ON s.codbase = d.codbase'
      '                 AND s.codpresupuesto = d.codpresupuesto'
      '                 AND s.revision = d.revision'
      '                 AND s.idfiscal = edo.idstake'
      'WHERE  d.codbase = :codBase'
      '       AND d.codpresupuesto = :codPresupuesto'
      '       AND d.revision = :revision')
    Left = 1804
    Top = 40
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
      end>
    object QDatosCronogramasValoradosdescripcion: TStringField
      FieldName = 'descripcion'
      Size = 255
    end
    object QDatosCronogramasValoradosNombreApellido: TStringField
      FieldName = 'NombreApellido'
      ReadOnly = True
      Size = 514
    end
    object QDatosCronogramasValoradosUbicacion: TStringField
      FieldName = 'Ubicacion'
      ReadOnly = True
      Size = 514
    end
    object QDatosCronogramasValoradosfechainicio: TDateTimeField
      FieldName = 'fechainicio'
    end
    object QDatosCronogramasValoradosfechafinalizacion: TDateTimeField
      FieldName = 'fechafinalizacion'
    end
    object QDatosCronogramasValoradosplazoejecucion: TStringField
      FieldName = 'plazoejecucion'
      Size = 255
    end
    object QDatosCronogramasValoradoscodreferencial: TStringField
      FieldName = 'codreferencial'
      Size = 255
    end
    object QDatosCronogramasValoradosciudad: TStringField
      FieldName = 'ciudad'
      Size = 255
    end
  end
  object QEDT_Diccionario: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  pit.codEdt,'
      '  pit.descripcion,'
      '  pit.Responsable,'
      '  pit.Definicion'
      ' '
      'FROM'
      '  presupuestos_edt pit'
      'WHERE'
      '      pit.codBase = :codBase '
      '  AND pit.codPresupuesto = :codPresupuesto'
      '  AND pit.revision = :revision'
      'ORDER BY'
      '  pit.codEdt;')
    Left = 1468
    Top = 256
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
      end>
    object QEDT_DiccionariocodEdt: TStringField
      FieldName = 'codEdt'
      Required = True
      Size = 255
    end
    object QEDT_Diccionariodescripcion: TStringField
      FieldName = 'descripcion'
      Required = True
      Size = 255
    end
    object QEDT_DiccionarioResponsable: TStringField
      FieldName = 'Responsable'
      Size = 255
    end
    object QEDT_DiccionarioDefinicion: TMemoField
      FieldName = 'Definicion'
      BlobType = ftMemo
    end
  end
  object QNumeroDeItemsPresupuesto: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      
        'select count(*) as NItemsPresupuesto from presupuestos_items_tra' +
        'bajo p WHERE'
      '  p.codBase = :codBase'
      '  AND p.codPresupuesto = :codPresupuesto'
      '  AND p.Revision = :Revision')
    Left = 1076
    Top = 252
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
      end>
    object QNumeroDeItemsPresupuestoNItemsPresupuesto: TLargeintField
      FieldName = 'NItemsPresupuesto'
      ReadOnly = True
      Required = True
    end
  end
  object StoreProc_TanteoAprobar: TUniStoredProc
    StoredProcName = 'Tanteo_Aprobar'
    SQL.Strings = (
      
        'CALL Tanteo_Aprobar(:iCodBase, :iCodPresupuesto, :iRevision, :iC' +
        'odAPU)')
    Connection = DModule_1.con2
    Left = 1520
    Top = 960
    ParamData = <
      item
        DataType = ftString
        Name = 'iCodBase'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iCodPresupuesto'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iRevision'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iCodAPU'
        ParamType = ptInput
        Size = 255
        Value = nil
      end>
    CommandStoredProcName = 'Tanteo_Aprobar'
  end
  object StoreProc_TanteoRechazar: TUniStoredProc
    StoredProcName = 'Tanteo_Rechazar'
    SQL.Strings = (
      
        'CALL Tanteo_Rechazar(:iCodBase, :iCodPresupuesto, :iRevision, :i' +
        'CodAPU)')
    Connection = DModule_1.con2
    Left = 1528
    Top = 1096
    ParamData = <
      item
        DataType = ftString
        Name = 'iCodBase'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iCodPresupuesto'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iRevision'
        ParamType = ptInput
        Size = 255
        Value = nil
      end
      item
        DataType = ftString
        Name = 'iCodAPU'
        ParamType = ptInput
        Size = 255
        Value = nil
      end>
    CommandStoredProcName = 'Tanteo_Rechazar'
  end
end
