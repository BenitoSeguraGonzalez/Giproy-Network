unit uMainRecursos;

interface

uses
  System.SysUtils,
  System.Classes,
  DM1;

type
  { TRecursosModule
    Módulo para encapsular la lógica relacionada con Recursos
    (búsquedas, filtros, sincronización con tienda online, etc.). }
  TRecursosModule = class
  public
    { Punto centralizado para añadir operaciones de recursos.
      La lógica que ahora está repartida en eventos de uMain
      debería ir concentrándose aquí. }
  end;

implementation

end.
