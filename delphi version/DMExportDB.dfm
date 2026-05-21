object DM_exportDB: TDM_exportDB
  Height = 900
  Width = 1200
  PixelsPerInch = 144
  object FTP_1: TIdFTP
    IOHandler = idslhndlrscktpnsl1
    Host = '62.171.171.124'
    Passive = True
    ConnectTimeout = 0
    Password = 'hpoihadsjfnadsfguad234124103298'
    TransferType = ftBinary
    Username = 'genericFtpUser'
    NATKeepAlive.UseKeepAlive = False
    NATKeepAlive.IdleTimeMS = 0
    NATKeepAlive.IntervalMS = 0
    ProxySettings.ProxyType = fpcmNone
    ProxySettings.Port = 0
    ServerHOST = '62.171.171.124'
    UseTLS = utUseRequireTLS
    Left = 163
    Top = 134
  end
  object idslhndlrscktpnsl1: TIdSSLIOHandlerSocketOpenSSL
    Destination = '62.171.171.124:21'
    Host = '62.171.171.124'
    MaxLineAction = maException
    Port = 21
    DefaultPort = 0
    ReadTimeout = 60000
    SSLOptions.Mode = sslmUnassigned
    SSLOptions.VerifyMode = []
    SSLOptions.VerifyDepth = 0
    Left = 163
    Top = 221
  end
  object QProyectosDisponibles: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  codbase,'
      '  codpresupuesto,'
      '  revision,'
      
        '  CONCAT(descripcion, '#39' - rev: '#39', revision) AS descripcion_revis' +
        'ion '
      'FROM'
      '  presupuestos_datosgenerales')
    Left = 403
    Top = 221
    object QProyectosDisponiblescodbase: TStringField
      FieldName = 'codbase'
      Size = 255
    end
    object QProyectosDisponiblescodpresupuesto: TStringField
      FieldName = 'codpresupuesto'
      Size = 255
    end
    object QProyectosDisponiblesrevision: TStringField
      FieldName = 'revision'
      Size = 255
    end
    object QProyectosDisponiblesdescripcion_revision: TStringField
      FieldName = 'descripcion_revision'
      ReadOnly = True
      Size = 518
    end
  end
  object QBasesDisponibles: TUniQuery
    Connection = DModule_1.con2
    SQL.Strings = (
      'SELECT'
      '  codBase,'
      '  nombre,'
      '  descripcion'
      'FROM'
      '  bases'
      'ORDER BY'
      '  nombre')
    Left = 394
    Top = 134
    object QBasesDisponiblescodBase: TStringField
      FieldName = 'codBase'
      Size = 255
    end
    object QBasesDisponiblesnombre: TStringField
      FieldName = 'nombre'
      Size = 255
    end
    object QBasesDisponiblesdescripcion: TStringField
      FieldName = 'descripcion'
      Size = 255
    end
  end
end
