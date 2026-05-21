unit uMainUIHelpers;

interface

uses
  System.SysUtils,
  System.Classes,
  FMX.Types,
  FMX.Controls,
  FMX.ListView,
  FMX.Grid;

type
  { TMainUIHelpers
    Pequeñas utilidades reutilizables para la capa de UI del
    formulario principal (uMain): selección en listas, colores,
    estados visuales, etc. Conforme se vaya limpiando uMain,
    estas utilidades se pueden mover aquí o a más módulos
    especializados. }
  TMainUIHelpers = class
  public
    { Añade aquí helpers específicos de UI si se desea agrupar
      el comportamiento visual y facilitar su prueba y mantenimiento. }
  end;

implementation

end.
