unit uImportadorPresupuestos;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  System.DateUtils, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.TMSFNCTypes, System.Math,
  FMX.TMSFNCUtils, System.StrUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, FMX.TMSFNCSplitter,
  FMX.Layouts, FMX.ListBox, FMX.Objects, FMX.TMSFNCCustomControl, FMX.TMSFNCTreeViewBase,
  FMX.TMSFNCTreeViewData, FMX.TMSFNCCustomTreeView, FMX.TMSFNCTreeView, FMX.Effects, FMX.StdCtrls,
  FMX.DateTimeCtrls, FMX.Edit, FMX.Controls.Presentation, FMX.TreeView, System.IOUtils, System.Rtti,
  FMX.Grid.Style, FMX.ScrollBox, FMX.Grid, uDM, FlexCel.FMXSupport, FlexCel.Core, FlexCel.XlsAdapter,
  FlexCel.Render, FMX.FlexCel.Preview, FMX.TabControl, FMX.Menus, FMX.TMSBaseControl,
  FMX.TMSTreeViewBase, FMX.TMSTreeViewData, FMX.TMSCustomTreeView, FMX.TMSTreeView,
  FMX.TMSDirectoryTreeView, FMX.TMSFNCCustomPicker, FMX.TMSFNCComboBox, FMX.TMSFNCPanel,
  FMX.TMSFNCButton, FMX.TMSCustomEdit, FMX.TMSEdit, FMX.TMSCalendar, Uni, Data.DB, MemDS,
  VirtualTable;

const
        // INTERPRO & OTROS
  c_EquiposHerramietas = 'Equipo y herramienta';
  c_FEquiposHerramietas = 'Subtotal de Equipo:';
  c_Materiales = 'Materiales';
  c_FMateriales = 'Subtotal de Materiales:';
  c_Transporte = 'Transporte';
  c_FTransporte = 'Subtotal de Transporte:';
  c_ManoObra = 'Mano de Obra';
  c_FManoObra = 'Subtotal de Mano de Obra:';

        // SERCOP
  c_EquiposHerramietasSERCOP = 'EQUIPOS';
  c_FEquiposHerramietasSERCOP = 'SUBTOTAL M';
  c_MaterialesSERCOP = 'MATERIALES';
  c_FMaterialesSERCOP = 'SUBTOTAL O';
  c_TransporteSERCOP = 'TRANSPORTE';
  c_FTransporteSERCOP = 'SUBTOTAL P';
  c_ManoObraSERCOP = 'MANO DE OBRA';
  c_FManoObraSERCOP = 'SUBTOTAL N';

type
  dat_resultadoApusItems = record
    rendimientoHUnidad1: Currency;
    rendimientoHUnidad2: Currency;
    nHCuadrillas: integer;
  end;

type
  dat_resultadoRecursos = record
    codRecurso: integer;
    antiguaCategoria: integer;
  end;

type
  TfImportadorPresupuestos = class(TForm)
    lyt_background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_DatosGenerales: TLayout;
    lyt_11: TLayout;
    lbl_11: TLabel;
    ln_1: TLine;
    lyt_7: TLayout;
    lbl_2: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_modo: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_1: TLabel;
    lytOpciones: TLayout;
    lytBodyContainer: TLayout;
    lytFileExplorer: TLayout;
    lytExcelViewer: TLayout;
    rect_5: TRectangle;
    spl1: TSplitter;
    lytFicheros: TLayout;
    Shadow_2: TShadowEffect;
    MainBkg: TRectangle;
    MainPreview: TFlexCelPreviewer;
    tbc_XLSSheet: TTabControl;
    tab_1: TTabItem;
    pm1: TPopupMenu;
    MenuItem1: TMenuItem;
    MenuItem2: TMenuItem;
    MenuItem3: TMenuItem;
    lytCarpetas: TLayout;
    TVDirectory_Folders: TTMSFMXDirectoryTreeView;
    Shadow_1: TShadowEffect;
    TVDirectory_Files: TTMSFMXDirectoryTreeView;
    tmsfncpnl1: TTMSFNCPanel;
    cbbModeloExcel: TTMSFNCComboBox;
    tmsfncpnl11: TTMSFNCPanel;
    tmsfncpnl12: TTMSFNCPanel;
    lyt1: TLayout;
    lyt2: TLayout;
    btnImportar: TTMSFNCButton;
    lbl1: TLabel;
    edtNProyecto: TEdit;
    grdpnlyt1: TGridPanelLayout;
    lyt3: TLayout;
    lyt4: TLayout;
    lyt5: TLayout;
    lbl2: TLabel;
    lbl3: TLabel;
    lbl4: TLabel;
    edtOferente: TEdit;
    edtUbicacion: TEdit;
    edtDate_1: TTMSFMXCalendarPicker;
    lyt6: TLayout;
    lbl5: TLabel;
    lbl_NApus: TLabel;
    lyt61: TLayout;
    lbl51: TLabel;
    lbl_Subtotal: TLabel;
    lyt62: TLayout;
    lbl52: TLabel;
    lbl_IVA: TLabel;
    lyt63: TLayout;
    lbl53: TLabel;
    lbl_Total: TLabel;
    VTable_SERCOP: TVirtualTable;
    procedure rect_AceptarClick(Sender: TObject);
    procedure rect_12Click(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure tbc_XLSSheetChange(Sender: TObject);
    procedure MenuItem3Click(Sender: TObject);
    procedure MenuItem1Click(Sender: TObject);
    procedure MenuItem2Click(Sender: TObject);
    procedure MainPreviewMouseWheel(Sender: TObject; Shift: TShiftState; WheelDelta: integer; var
      Handled: Boolean);
    procedure MainPreviewMouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure MainPreviewMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure MainPreviewMouseLeave(Sender: TObject);
    procedure TVDirectory_FoldersNodeClick(Sender: TObject; ANode: TTMSFMXTreeViewVirtualNode);
    procedure TVDirectory_FilesNodeClick(Sender: TObject; ANode: TTMSFMXTreeViewVirtualNode);
    procedure btnImportarClick(Sender: TObject);

  private
                { Private declarations }
    Xls: TExcelFile;
    archivoExcel: string;
    ImgExport: TFlexCelImgExport;
    codDBI: string;
    CostoIndirectosGeneral: Currency;
    codProyectoI: string;
    IvaProyecto: string;
    porcentajeIVAProyecto: string;

    procedure cargarExcel(filename: string);
    procedure CambiaEstadoDatos(estado: Boolean);

    function AnalizaModelo1(): Boolean;
    function AnalizaModeloSercop(): Boolean;
    function contarAPUS(): integer;
    function GuardarApusItemsExcel(nSheet: integer; codAPU: string): dat_resultadoApusItems;
    function guardaRecurosos(idUnico: string; codCategoriaBase: integer; antiguaCategoria: integer;
      codRecurso: integer): dat_resultadoRecursos;
    function buscaCodApuAlternativo(descripcion, UMedida: string): string;
    function GuardarApusItemsExcelSERCOP(nSheet: integer; codAPU: string): dat_resultadoApusItems;
    function VTDaCodAlternativo(descripcion, unidad: string): string;
    function VTDaCodAlternativoHMO(descripcion: string): string;
    function VTBuscaxCodAlternativo(codAlternativo: string): string;
    function DatotalAPUSSinIndirectos(nSheet: integer): Currency;
    function DatotalAPUSSinIndirectosSERCOP(nSheet: integer): Currency;
    function DaValorCostoItems(R: integer; modo: integer): Currency;
    procedure GuardarApusExcelSERCOP(nSheet: integer; codAPU: string; codrecursoAPU: integer);
    procedure ImportaModelo1();
    procedure ImportaModelo1SERCOP();
    procedure importarDatosGenerales();
    procedure importarDatosProyecto();
    procedure importarEDTModelo();
    procedure ImportarApusProyecto();
    procedure ImportarAPUSAnidados();
    procedure importarLineasProyecto();
    procedure importarLineasProyectoSERCOP;
    procedure creacionRecursosProyecto();
    procedure GuardarApusExcel(nSheet: integer; codAPU: string; codrecursoAPU: integer);
    procedure GuardarRecursosExcelxCodAlternativo(nSheet: integer);
    procedure GuardarRecursosExcelxCodAlternativoSERCOP(nSheet: integer);
    procedure guardaRecurososAnidados(idUnico: string; codCategoriaBase: integer; descripcion,
      unidad: string; precio: Currency);
    procedure XLSSerco2VTable();

  public
                { Public declarations }
    Transaccion_importacion: TUniTransaction;
    procedure limpiaDatos();
  end;

var
  fImportadorPresupuestos: TfImportadorPresupuestos;

implementation

{$R *.fmx}

uses
  dm1, FMX.DialogService, PlantillasExcel, Winapi.ShellAPI, Winapi.Windows, DM_Importacion;

procedure TfImportadorPresupuestos.FormShow(Sender: TObject);
begin
  Xls := TXlsFile.Create(1, false);
  limpiaDatos;
  ImgExport := TFlexCelImgExport.Create(Xls, false);
  ImgExport.AllVisibleSheets := false;
  MainPreview.Document := ImgExport;
  TVDirectory_Files.Interaction.ColumnSizing := True;
  TVDirectory_Files.AddColumn(tvckCreationDate).Visible := false;
  TVDirectory_Files.AddColumn(tvckModificationDate).Visible := True;
  TVDirectory_Files.AddColumn(tvckFreeSpaceAndTotalSize);
  TVDirectory_Files.Columns[0].Text := 'Archivos de Importación';
  TVDirectory_Files.Columns[0].Width := 250;
  TVDirectory_Files.Columns[2].Text := 'Fecha/Hora';
  TVDirectory_Files.Columns[2].Width := 150;
  TVDirectory_Files.Columns[2].HorizontalTextAlign := tvtaCenter;
  TVDirectory_Files.Columns[3].Text := 'Tamaño';
  TVDirectory_Files.Columns[3].Width := 100;
  TVDirectory_Files.Columns[3].HorizontalTextAlign := tvtaCenter;
  TVDirectory_Folders.LoadDrives;
end;

procedure TfImportadorPresupuestos.ImportaModelo1;
var
  respuesta: Boolean;
begin
  if (codDBI <> '') and (codProyectoI <> '') and (CostoIndirectosGeneral > -1) then
  begin
    respuesta := DMImportacion.esProyectoNuevo(Trim(edtNProyecto.Text), StrToCurr(lbl_Total.Text),
      StrToInt(lbl_NApus.Text));
    if respuesta = True then
    begin
      DMImportacion.GuardaDB();
      importarDatosGenerales;
      importarDatosProyecto;
      ImportarApusProyecto;
      importarEDTModelo;
      importarLineasProyecto;
      creacionRecursosProyecto;
      ImportarAPUSAnidados;
      codDBI := '';
      codProyectoI := '';
      CostoIndirectosGeneral := -1;
    end
    else
      ShowMessage('Proyecto anteriormente importado.');
  end;
end;

procedure TfImportadorPresupuestos.ImportaModelo1SERCOP;
var
  respuesta: Boolean;
  tmpstr: string;
begin
  if (codDBI <> '') and (codProyectoI <> '') and (CostoIndirectosGeneral > -1) then
  begin
    respuesta := DMImportacion.esProyectoNuevo(Trim(edtNProyecto.Text), StrToCurr(lbl_Total.Text),
      StrToInt(lbl_NApus.Text));
    if respuesta = True then
    begin
      XLSSerco2VTable;
      DMImportacion.GuardaDB();
      importarDatosGenerales;
      importarDatosProyecto;
      ImportarApusProyecto;
      importarEDTModelo;
      importarLineasProyectoSERCOP;
      creacionRecursosProyecto;
      ImportarAPUSAnidados;
      codDBI := '';
      codProyectoI := '';
      CostoIndirectosGeneral := -1;
    end
    else
      ShowMessage('Proyecto anteriormente importado.');
  end;
end;

function TfImportadorPresupuestos.VTBuscaxCodAlternativo(codAlternativo: string): string;
var
  tmpstr: string;
begin
  result := '';
  VTable_SERCOP.Filtered := false;
  VTable_SERCOP.Filter := 'codAlternativo = ' + QuotedStr(codAlternativo);
  VTable_SERCOP.Filtered := True;
  VTable_SERCOP.First;
  tmpstr := VTable_SERCOP.FieldByName('codAlternativo').AsString;
  result := tmpstr;
end;

procedure TfImportadorPresupuestos.ImportarAPUSAnidados;
var
  posSheetActivo: integer;
  NombreSheet: string;
  TratarSheet: Boolean;
  codAPU: string;
  codUnicoRecurso: string;
  idUnico: string;
  UltcodrecursoAPU: integer;
  datosItems: dat_resultadoApusItems;
  ApuParaAnidar: Boolean;
  codAPUAlternativo: string;
  codCategoria: integer;
  codRecurso: integer;
  antiguaCategoria: integer;
  respuesta: dat_resultadoRecursos;
  TienecodApuAlternativo: Boolean;
begin
  for posSheetActivo := 2 to Xls.SheetCount do
  begin
    NombreSheet := Xls.GetSheetName(posSheetActivo);

    if (not DMImportacion.ExisteApuAlternativo(codDBI, NombreSheet)) and (not AnsiContainsStr(NombreSheet,
      '(')) and (not AnsiContainsStr(NombreSheet, ')')) then
    begin
      Xls.ActiveSheet := posSheetActivo;

                        // 1 Crear APU
      DMImportacion.QDaUltCodRecursoApu.close;
      DMImportacion.QDaUltCodRecursoApu.ParamByName('codBase').AsString := codDBI;
      DMImportacion.QDaUltCodRecursoApu.Open;
      UltcodrecursoAPU := DMImportacion.QDaUltCodRecursoApuUltCodRecursoAPU.AsInteger;
      codAPU := ReplaceStr(GeneraCodUnicoAPU, 'APUsr', 'APUIm');
      case cbbModeloExcel.ItemIndex of
        0:
          GuardarApusExcel(posSheetActivo, codAPU, UltcodrecursoAPU);
        1:
          GuardarApusExcelSERCOP(posSheetActivo, codAPU, UltcodrecursoAPU);
      end;

                        // 2 Consigue el CodAPUAlternativo
      DMImportacion.QDaCodAlternativoAPU.close;
      DMImportacion.QDaCodAlternativoAPU.ParamByName('codAPU').AsString := codAPU;
      DMImportacion.QDaCodAlternativoAPU.ParamByName('codBase').AsString := codDBI;
      DMImportacion.QDaCodAlternativoAPU.Open;
      codAPUAlternativo := DMImportacion.QDaCodAlternativoAPUcodAPUAlternativo.AsString;
      case cbbModeloExcel.ItemIndex of
        0:
          datosItems := GuardarApusItemsExcel(posSheetActivo, codAPU);
        1:
          datosItems := GuardarApusItemsExcelSERCOP(posSheetActivo, codAPU);
      end;

                        // 3 Ajustar APUS
      with DMImportacion.QPresupuestoActualizaAPUS do
      begin
        Transaction := Transaccion_importacion;
        if datosItems.rendimientoHUnidad1 >= datosItems.rendimientoHUnidad2 then
          ParamByName('rendimientoHUnidad').AsCurrency := datosItems.rendimientoHUnidad1
        else
          ParamByName('rendimientoHUnidad').AsCurrency := datosItems.rendimientoHUnidad2;
        ParamByName('nhCuadrillas').AsCurrency := datosItems.nHCuadrillas;
        ParamByName('codBase').AsString := codDBI;
        ParamByName('codAPU').AsString := codAPU;
        Execute;
      end;

                        // 4 Crear Recurso
      case cbbModeloExcel.ItemIndex of
        0:
          GuardarRecursosExcelxCodAlternativo(posSheetActivo);
        1:
          GuardarRecursosExcelxCodAlternativoSERCOP(posSheetActivo);
      end;

                        // 5 Comprobar Anidado
      DMImportacion.QEsApuAnidado.close;
      DMImportacion.QEsApuAnidado.ParamByName('codBase').AsString := codDBI;
      DMImportacion.QEsApuAnidado.ParamByName('codAPUAlternativo').AsString := codAPUAlternativo;
      DMImportacion.QEsApuAnidado.Open;
      if DMImportacion.QEsApuAnidadonApus.AsInteger > 0 then
      begin
        DMImportacion.QActivaAPUSAnidado.Transaction := Transaccion_importacion;
        DMImportacion.QActivaAPUSAnidado.ParamByName('codbase').AsString := codDBI;
        DMImportacion.QActivaAPUSAnidado.ParamByName('codAPUAlternativo').AsString := NombreSheet;
        DMImportacion.QActivaAPUSAnidado.Execute;
        DMImportacion.QAjustaCodUnicoRecursoAnidado.Transaction := Transaccion_importacion;
        DMImportacion.QAjustaCodUnicoRecursoAnidado.ParamByName('codbase').AsString := codDBI;
        DMImportacion.QAjustaCodUnicoRecursoAnidado.ParamByName('codAPUAlternativo').AsString := NombreSheet;
        DMImportacion.QAjustaCodUnicoRecursoAnidado.Execute;
      end;
    end;
  end;
end;

procedure TfImportadorPresupuestos.guardaRecurososAnidados(idUnico: string; codCategoriaBase:
  integer; descripcion, unidad: string; precio: Currency);
var
  codSubCategoria: integer;
  codRecursoCompleto: string;
  preciolocal: Currency;
  precioBase: Currency;
  moneda: string;
  codRecurso: integer;
begin
  codSubCategoria := 1;
  codRecurso := DMImportacion.daUltCodRecurso(codDBI, codCategoriaBase);
  codRecursoCompleto := generaCodigoRecurso(IntToStr(codCategoriaBase), IntToStr(codSubCategoria),
    IntToStr(codRecurso));
  preciolocal := precio;
  precioBase := precio;
  moneda := DMImportacion.datosDB.moneda;
  with DMImportacion.QInsertaRecursosI do
  begin
    Transaction := Transaccion_importacion;
    ParamByName('idUnico').AsString := idUnico;
    ParamByName('codBase').AsString := codDBI;
    ParamByName('codRecurso').AsInteger := codRecurso;
    ParamByName('codRecursoCompleto').AsString := codRecursoCompleto;
    ParamByName('codCategoriaBase').AsInteger := codCategoriaBase;
    ParamByName('codSubCategoria').AsInteger := codSubCategoria;
    ParamByName('descripcion').AsString := descripcion;
    ParamByName('Unidad').AsString := unidad;
    ParamByName('precio').AsCurrency := precio;
    ParamByName('precioLocal').AsCurrency := preciolocal;
    ParamByName('PrecioBase').AsCurrency := precioBase;
    ParamByName('moneda').AsString := moneda;
    ParamByName('fechahoraCreacion').AsDateTime := now;
    ParamByName('ultimaModificacion').AsDateTime := now;
    Prepare;
    Execute;
  end;
end;

procedure TfImportadorPresupuestos.GuardarRecursosExcelxCodAlternativoSERCOP(nSheet: integer);
var
  codSubCategoria: integer;
  posExcel: dat_celda;
  rInicio, rFin: integer;
  codCategoria: integer;
  R1: integer;
  valorCelda: string;
  codCategoriaBase: integer;
  idUnicoRecurso: string;
  codApuItem: string;
  descripcion: string;
  unidad: string;
  precio: Currency;
  codAlternativo: string;
begin
  codSubCategoria := 1;

        // Tratar Equipos y Herramientas
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_EquiposHerramietasSERCOP);
  rInicio := posExcel.R + 2;
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_FEquiposHerramietasSERCOP);
  rFin := posExcel.R - 1;
  codCategoria := 1;
  for R1 := rInicio to rFin do
  begin
    descripcion := VarToStr(Xls.GetCellValue(R1, 1).AsVariant).Trim;
    unidad := 'Hora';
    valorCelda := VTDaCodAlternativoHMO(descripcion);
    if (descripcion <> '') and (unidad <> '') and (valorCelda <> '') then
                // if (descripcion <> '') and (unidad <> '') and (not DMImportacion.existeRecursoCodAlternativoSERCOP(codDBI, descripcion, unidad)) then
    begin
      DMImportacion.QDaApusItemXAPUSv2.close;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codBase').AsString := codDBI;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codAPUAlternativo').AsString := valorCelda;
      DMImportacion.QDaApusItemXAPUSv2.Open;
      idUnicoRecurso := DMImportacion.QDaApusItemXAPUSv2idUnicoRecurso.AsString;
      codCategoriaBase := 1;
      precio := Xls.GetCellValue(R1, 4).AsNumber;
      guardaRecurososAnidados(idUnicoRecurso, codCategoriaBase, descripcion, unidad, precio);
    end;
  end;

        // Tratar Materiales
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_MaterialesSERCOP);
  rInicio := posExcel.R + 2;
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_FMaterialesSERCOP);
  rFin := posExcel.R - 1;
  codCategoria := 2;
  for R1 := rInicio to rFin do
  begin
    descripcion := VarToStr(Xls.GetCellValue(R1, 1).AsVariant).Trim;
    unidad := VarToStr(Xls.GetCellValue(R1, 2).AsVariant).Trim;
    valorCelda := VTDaCodAlternativo(descripcion, unidad);
    if (descripcion <> '') and (unidad <> '') and (valorCelda <> '') then
    begin
      DMImportacion.QDaApusItemXAPUSv2.close;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codBase').AsString := codDBI;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codAPUAlternativo').AsString := valorCelda;
      DMImportacion.QDaApusItemXAPUSv2.Open;
      idUnicoRecurso := DMImportacion.QDaApusItemXAPUSv2idUnicoRecurso.AsString;
      codCategoriaBase := 2;
      precio := Xls.GetCellValue(R1, 4).AsNumber;
      guardaRecurososAnidados(idUnicoRecurso, codCategoriaBase, descripcion, unidad, precio);
    end;
  end;

        // Tratar Transporte
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_TransporteSERCOP);
  rInicio := posExcel.R + 2;
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_FTransporteSERCOP);
  rFin := posExcel.R - 1;
  codCategoria := 3;
  for R1 := rInicio to rFin do
  begin
    descripcion := VarToStr(Xls.GetCellValue(R1, 1).AsVariant).Trim;
    unidad := VarToStr(Xls.GetCellValue(R1, 2).AsVariant).Trim;
    valorCelda := VTDaCodAlternativo(descripcion, unidad);
    if (descripcion <> '') and (unidad <> '') and (valorCelda <> '') then
    begin
      DMImportacion.QDaApusItemXAPUSv2.close;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codBase').AsString := codDBI;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codAPUAlternativo').AsString := valorCelda;
      DMImportacion.QDaApusItemXAPUSv2.Open;
      idUnicoRecurso := DMImportacion.QDaApusItemXAPUSv2idUnicoRecurso.AsString;
      codCategoriaBase := 3;
      precio := Xls.GetCellValue(R1, 4).AsNumber;
      guardaRecurososAnidados(idUnicoRecurso, codCategoriaBase, descripcion, unidad, precio);
    end;
  end;

        // Mano de Obra
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_ManoObraSERCOP);
  rInicio := posExcel.R + 2;
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_FManoObraSERCOP);
  rFin := posExcel.R - 1;
  codCategoria := 4;
  for R1 := rInicio to rFin do
  begin
    descripcion := VarToStr(Xls.GetCellValue(R1, 1).AsVariant).Trim;
    unidad := 'Hora';
    valorCelda := VTDaCodAlternativoHMO(descripcion);
    if (descripcion <> '') and (unidad <> '') and (valorCelda <> '') then
    begin
      DMImportacion.QDaApusItemXAPUSv2.close;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codBase').AsString := codDBI;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codAPUAlternativo').AsString := valorCelda;
      DMImportacion.QDaApusItemXAPUSv2.Open;
      idUnicoRecurso := DMImportacion.QDaApusItemXAPUSv2idUnicoRecurso.AsString;
      codCategoriaBase := 4;
      precio := Xls.GetCellValue(R1, 4).AsNumber;
      guardaRecurososAnidados(idUnicoRecurso, codCategoriaBase, descripcion, unidad, precio);
    end;
  end;
end;

procedure TfImportadorPresupuestos.GuardarRecursosExcelxCodAlternativo(nSheet: integer);
var
  codSubCategoria: integer;
  posExcel: dat_celda;
  rInicio, rFin: integer;
  codCategoria: integer;
  R1: integer;
  valorCelda: string;
  codCategoriaBase: integer;
  idUnicoRecurso: string;
  codApuItem: string;
  descripcion: string;
  unidad: string;
  precio: Currency;
begin
  codSubCategoria := 1;
        // Tratar Equipos y Herramientas
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_EquiposHerramietas);
  rInicio := posExcel.R + 2;
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_FEquiposHerramietas);
  rFin := posExcel.R - 1;
  codCategoria := 1;
  for R1 := rInicio to rFin do
  begin
    valorCelda := Xls.GetCellValue(R1, 1).ToString.Trim;
                // CodApuAlternativo
    if (valorCelda <> '') and (not DMImportacion.existeRecursoCodAlternativo(codDBI, valorCelda)) then
    begin
      DMImportacion.QDaApusItemXAPUSv2.close;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codBase').AsString := codDBI;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codAPUAlternativo').AsString := valorCelda;
      DMImportacion.QDaApusItemXAPUSv2.Open;
      idUnicoRecurso := DMImportacion.QDaApusItemXAPUSv2idUnicoRecurso.AsString;
      codCategoriaBase := 1;
      descripcion := Xls.GetCellValue(R1, 2).ToString.Trim;
      unidad := Xls.GetCellValue(R1, 3).ToString.Trim;
      precio := Xls.GetCellValue(R1, 5).AsNumber;
      guardaRecurososAnidados(idUnicoRecurso, codCategoriaBase, descripcion, unidad, precio);
    end;
  end;

        // Tratar Materiales
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_Materiales);
  rInicio := posExcel.R + 2;
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_FMateriales);
  rFin := posExcel.R - 1;
  codCategoria := 2;
  for R1 := rInicio to rFin do
  begin
    valorCelda := Xls.GetCellValue(R1, 1).ToString.Trim;
                // CodApuAlternativo
    if (valorCelda <> '') and (not DMImportacion.existeRecursoCodAlternativo(codDBI, valorCelda)) then
    begin
      DMImportacion.QDaApusItemXAPUSv2.close;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codBase').AsString := codDBI;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codAPUAlternativo').AsString := valorCelda;
      DMImportacion.QDaApusItemXAPUSv2.Open;
      idUnicoRecurso := DMImportacion.QDaApusItemXAPUSv2idUnicoRecurso.AsString;
      codCategoriaBase := 2;
      descripcion := Xls.GetCellValue(R1, 2).ToString.Trim;
      unidad := Xls.GetCellValue(R1, 3).ToString.Trim;
      precio := Xls.GetCellValue(R1, 5).AsNumber;
      guardaRecurososAnidados(idUnicoRecurso, codCategoriaBase, descripcion, unidad, precio);
    end;
  end;

        // Tratar Transporte
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_Transporte);
  rInicio := posExcel.R + 2;
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_FTransporte);
  rFin := posExcel.R - 1;
  codCategoria := 3;
  for R1 := rInicio to rFin do
  begin
    valorCelda := Xls.GetCellValue(R1, 1).ToString.Trim;
                // CodApuAlternativo
    if (valorCelda <> '') and (not DMImportacion.existeRecursoCodAlternativo(codDBI, valorCelda)) then
    begin
      DMImportacion.QDaApusItemXAPUSv2.close;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codBase').AsString := codDBI;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codAPUAlternativo').AsString := valorCelda;
      DMImportacion.QDaApusItemXAPUSv2.Open;
      idUnicoRecurso := DMImportacion.QDaApusItemXAPUSv2idUnicoRecurso.AsString;
      codCategoriaBase := 3;
      descripcion := Xls.GetCellValue(R1, 2).ToString.Trim;
      unidad := Xls.GetCellValue(R1, 3).ToString.Trim;
      precio := Xls.GetCellValue(R1, 5).AsNumber;
      guardaRecurososAnidados(idUnicoRecurso, codCategoriaBase, descripcion, unidad, precio);
    end;
  end;

        // Mano de Obra
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_ManoObra);
  rInicio := posExcel.R + 2;
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_FManoObra);
  rFin := posExcel.R - 1;
  codCategoria := 4;
  for R1 := rInicio to rFin do
  begin
    valorCelda := Xls.GetCellValue(R1, 1).ToString.Trim;
                // CodApuAlternativo
    if (valorCelda <> '') and (not DMImportacion.existeRecursoCodAlternativo(codDBI, valorCelda)) then
    begin
      DMImportacion.QDaApusItemXAPUSv2.close;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codBase').AsString := codDBI;
      DMImportacion.QDaApusItemXAPUSv2.ParamByName('codAPUAlternativo').AsString := valorCelda;
      DMImportacion.QDaApusItemXAPUSv2.Open;
      idUnicoRecurso := DMImportacion.QDaApusItemXAPUSv2idUnicoRecurso.AsString;
      codCategoriaBase := 4;
      descripcion := Xls.GetCellValue(R1, 2).ToString.Trim;
      unidad := Xls.GetCellValue(R1, 3).ToString.Trim;
      precio := Xls.GetCellValue(R1, 5).AsNumber;
      guardaRecurososAnidados(idUnicoRecurso, codCategoriaBase, descripcion, unidad, precio);
    end;
  end;
end;

procedure TfImportadorPresupuestos.GuardarApusExcelSERCOP(nSheet: integer; codAPU: string;
  codrecursoAPU: integer);
var
  codAPUAlternativo: string;
  valorCelda: string;
  posExcel: dat_celda;
begin
  Xls.ActiveSheet := nSheet;
  codAPUAlternativo := Xls.SheetName.Trim;
  with DMImportacion.QPresupuestoImportarAPUS do
  begin
    Transaction := Transaccion_importacion;
    ParamByName('codBase').AsString := codDBI;
    ParamByName('codCategoriaAPU').AsInteger := 1;
    ParamByName('codRecursoAPU').AsInteger := codrecursoAPU;
    ParamByName('CategoriaAPU').AsString := 'General';
    ParamByName('CodAPU').AsString := codAPU;
    ParamByName('CodAPUAlternativo').AsString := codAPUAlternativo;
    posExcel := BuscaCadenaExcel(Xls, nSheet, 'Rubro:');
    posExcel.R := posExcel.R + 1;
    posExcel.C := posExcel.C - 1;
    valorCelda := BuscaValordeEntrada(Xls, nSheet, posExcel);
    ParamByName('Descripcion').AsString := valorCelda;
    posExcel := BuscaCadenaExcel(Xls, nSheet, 'Unidad:');
    valorCelda := BuscaValordeEntrada(Xls, nSheet, posExcel);
    ParamByName('Unidad').AsString := valorCelda;
    ParamByName('Rendimiento').AsString := 'Horas/Unidad';
    ParamByName('RendimientoTodoAnalisis').AsInteger := 1;
    ParamByName('RendimientoTodoEscenario').AsInteger := 1;
    posExcel := BuscaCadenaExcel(Xls, nSheet, 'TOTAL COSTO DIRECTO (M+N+O+P)');
    valorCelda := BuscaValordeEntrada(Xls, nSheet, posExcel);
    ParamByName('CostoDirectoTotal').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
    posExcel := BuscaCadenaExcel(Xls, nSheet, 'INDIRECTOS');
    valorCelda := BuscaValordeEntrada(Xls, nSheet, posExcel);
    valorCelda := ReplaceStr(valorCelda, '%', '').Trim;
    ParamByName('PorcentajeCostoIndirecto').AsCurrency := StrToCurr(valorCelda);
    posExcel.C := posExcel.C + 2;
    valorCelda := BuscaValordeEntrada(Xls, nSheet, posExcel);
    ParamByName('CostoIndirectoTotal').AsCurrency := StrToCurr(valorCelda);
    ParamByName('PrecioUnitarioTotal').AsCurrency := DatotalAPUSSinIndirectosSERCOP(nSheet);
    ParamByName('moneda').AsString := DMImportacion.datosDB.SimboloMoneda;
    ParamByName('codCPC').AsString := '';
    ParamByName('FechaHoraCreacion').AsDateTime := now;
    ParamByName('UltimaModificacion').AsDateTime := now;
    ParamByName('pendienteRevision').AsInteger := 0;
    ParamByName('anidado').AsInteger := 0;
    Execute;
  end;
end;

procedure TfImportadorPresupuestos.GuardarApusExcel(nSheet: integer; codAPU: string; codrecursoAPU: integer);
var
  codAPUAlternativo: string;
  valorCelda: string;
  posExcel: dat_celda;
  tRendimiento, tCostodirecto: Currency;
begin
  Xls.ActiveSheet := nSheet;
  codAPUAlternativo := Xls.SheetName.Trim;
  with DMImportacion.QPresupuestoImportarAPUS do
  begin
    Transaction := Transaccion_importacion;
    ParamByName('codBase').AsString := codDBI;
    ParamByName('codCategoriaAPU').AsInteger := 1;
    ParamByName('codRecursoAPU').AsInteger := codrecursoAPU;
    ParamByName('CategoriaAPU').AsString := 'General';
    ParamByName('CodAPU').AsString := codAPU;
    ParamByName('CodAPUAlternativo').AsString := codAPUAlternativo;
    posExcel := BuscaCadenaExcel(Xls, nSheet, 'Descrip.:');
    valorCelda := BuscaValordeEntrada(Xls, nSheet, posExcel);
    ParamByName('Descripcion').AsString := valorCelda;
    posExcel := BuscaCadenaExcel(Xls, nSheet, 'Unidad:');
    valorCelda := BuscaValordeEntrada(Xls, nSheet, posExcel);
    ParamByName('Unidad').AsString := valorCelda;
    ParamByName('Rendimiento').AsString := 'Horas/Unidad';
    ParamByName('RendimientoTodoAnalisis').AsInteger := 1;
    ParamByName('RendimientoTodoEscenario').AsInteger := 1;
    posExcel := BuscaCadenaExcel(Xls, nSheet, 'Costo Directo Total:');
    valorCelda := BuscaValordeEntrada(Xls, nSheet, posExcel);
    ParamByName('CostoDirectoTotal').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
    posExcel := BuscaCadenaExcel(Xls, nSheet, 'COSTOS INDIRECTOS');
    valorCelda := Xls.GetCellValue(posExcel.R + 1, 1).ToString.Trim;
    valorCelda := ReplaceStr(valorCelda, '%', '');
    ParamByName('PorcentajeCostoIndirecto').AsCurrency := StrToCurr(valorCelda);
    valorCelda := Xls.GetCellValue(posExcel.R + 1, 8).ToString.Trim;
    ParamByName('CostoIndirectoTotal').AsCurrency := StrToCurr(valorCelda);
    posExcel := BuscaCadenaExcel(Xls, nSheet, 'Costo Directo Total:');
    valorCelda := BuscaValordeEntrada(Xls, nSheet, posExcel);
    ParamByName('PrecioUnitarioTotal').AsCurrency := DatotalAPUSSinIndirectos(nSheet);
    ParamByName('moneda').AsString := DMImportacion.datosDB.SimboloMoneda;
    ParamByName('codCPC').AsString := '';
    ParamByName('FechaHoraCreacion').AsDateTime := now;
    ParamByName('UltimaModificacion').AsDateTime := now;
    ParamByName('pendienteRevision').AsInteger := 0;
    ParamByName('anidado').AsInteger := 0;
    Execute;
  end;
end;

function TfImportadorPresupuestos.DatotalAPUSSinIndirectos(nSheet: integer): Currency;
var
  tCostodirecto: Currency;
  R: integer;
  rInicio, RFinal: integer;
  posExcel: dat_celda;
  control: string;
  tmpstr: string;
begin
  Xls.ActiveSheet := nSheet;
  posExcel := BuscaCadenaExcel(Xls, nSheet, 'Equipo y herramienta');
  rInicio := posExcel.R + 1;
  posExcel := BuscaCadenaExcel(Xls, nSheet, 'Costo Directo Total:');
  RFinal := posExcel.R - 2;
  tCostodirecto := 0;
  for R := rInicio to RFinal do
  begin
    control := VarToStr(Xls.GetCellValue(R, 1).AsVariant).Trim;
    if (control <> '') and (control <> 'Código') then
    begin
      tCostodirecto := tCostodirecto + DaValorCostoItems(R, 0);
    end;
  end;
  result := tCostodirecto;
end;

function TfImportadorPresupuestos.DatotalAPUSSinIndirectosSERCOP(nSheet: integer): Currency;
var
  tCostodirecto: Currency;
  R: integer;
  rInicio, RFinal: integer;
  posExcel: dat_celda;
  control: string;
  tmpstr: string;
begin
  Xls.ActiveSheet := nSheet;
  tCostodirecto := 0;
        // Equipos y Herramientas
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_EquiposHerramietasSERCOP);
  rInicio := posExcel.R + 1;
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_FEquiposHerramietasSERCOP);
  RFinal := posExcel.R - 1;
  for R := rInicio to RFinal do
  begin
    control := VarToStr(Xls.GetCellValue(R, 1).AsVariant).Trim;
    if (control <> '') and (control <> 'Descripción') then
    begin
      tCostodirecto := tCostodirecto + DaValorCostoItems(R, 100);
    end;
  end;
        // Mano de Obra
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_ManoObraSERCOP);
  rInicio := posExcel.R + 1;
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_FManoObraSERCOP);
  RFinal := posExcel.R - 1;
  for R := rInicio to RFinal do
  begin
    control := VarToStr(Xls.GetCellValue(R, 1).AsVariant).Trim;
    if (control <> '') and (control <> 'Descripción') then
    begin
      tCostodirecto := tCostodirecto + DaValorCostoItems(R, 100);
    end;
  end;
        // Materiales
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_MaterialesSERCOP);
  rInicio := posExcel.R + 1;
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_FMaterialesSERCOP);
  RFinal := posExcel.R - 1;
  for R := rInicio to RFinal do
  begin
    control := VarToStr(Xls.GetCellValue(R, 1).AsVariant).Trim;
    if (control <> '') and (control <> 'Descripción') then
    begin
      tCostodirecto := tCostodirecto + DaValorCostoItems(R, 101);
    end;
  end;
        // Transporte
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_TransporteSERCOP);
  rInicio := posExcel.R + 1;
  posExcel := BuscaCadenaExcel(Xls, nSheet, c_FTransporteSERCOP);
  RFinal := posExcel.R - 1;
  for R := rInicio to RFinal do
  begin
    control := VarToStr(Xls.GetCellValue(R, 1).AsVariant).Trim;
    if (control <> '') and (control <> 'Descripción') then
    begin
      tCostodirecto := tCostodirecto + DaValorCostoItems(R, 101);
    end;
  end;
  result := tCostodirecto;
end;

function TfImportadorPresupuestos.DaValorCostoItems(R: integer; modo: integer): Currency;
var
  tmpstr: string;
  tCantidad: Currency;
  tPrecio: Currency;
  tRendimiento: Currency;
begin
  tCantidad := 0;
  tPrecio := 0;
  tRendimiento := 0;
  case modo of
    0:
      begin
        tmpstr := VarToStr(Xls.GetCellValue(R, 4).AsVariant).Trim;
        tCantidad := StrToCurrDef(tmpstr, 0);
        tmpstr := VarToStr(Xls.GetCellValue(R, 5).AsVariant).Trim;
        tPrecio := StrToCurrDef(tmpstr, 0);
        tmpstr := VarToStr(Xls.GetCellValue(R, 6).AsVariant).Trim;
        tRendimiento := StrToCurrDef(tmpstr, 1);
      end;
    100: // Equipos y Herramientas , Mano de Obra SERCOP
      begin
        tmpstr := VarToStr(Xls.GetCellValue(R, 2).AsVariant).Trim;
        tCantidad := StrToCurrDef(tmpstr, 0);
        tmpstr := VarToStr(Xls.GetCellValue(R, 3).AsVariant).Trim;
        tPrecio := StrToCurrDef(tmpstr, 0);
        tmpstr := VarToStr(Xls.GetCellValue(R, 5).AsVariant).Trim;
        tRendimiento := StrToCurrDef(tmpstr, 1);
      end;
    101: // Materiales y Transporte SERCOP
      begin
        tmpstr := VarToStr(Xls.GetCellValue(R, 4).AsVariant).Trim;
        tCantidad := StrToCurrDef(tmpstr, 0);
        tmpstr := VarToStr(Xls.GetCellValue(R, 5).AsVariant).Trim;
        tPrecio := StrToCurrDef(tmpstr, 0);
        tmpstr := '1';
        tRendimiento := StrToCurrDef(tmpstr, 1);
      end;
  end;
  result := tCantidad * tPrecio * tRendimiento;
end;

function TfImportadorPresupuestos.GuardarApusItemsExcelSERCOP(nSheet: integer; codAPU: string):
  dat_resultadoApusItems;
var
  codSubCategoria: integer;
  rendimientoHUnidad1, rendimientoHUnidad2: Currency;
  posExcel: dat_celda;
  rInicio, rFin: integer;
  codCategoria: integer;
  codRecurso: integer;
  R1: integer;
  valorCelda: string;
  codAlternativo: string;
  nHCuadrillas: integer;
  descripcion, unidad, codRecursoCompleto: string;
begin
  with DMImportacion.QPresupuestoImportarAPUSItems do
  begin
    Transaction := Transaccion_importacion;
    codSubCategoria := 1;
                // Tratar Equipos y Herramientas
    rendimientoHUnidad1 := 0;
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_EquiposHerramietasSERCOP);
    rInicio := posExcel.R + 2;
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_FEquiposHerramietasSERCOP);
    rFin := posExcel.R - 1;
    codCategoria := 1;
    codRecurso := 1;
    for R1 := rInicio to rFin do
    begin
      valorCelda := Xls.GetCellValue(R1, 1).ToString.Trim;
      if valorCelda <> '' then
      begin
        ParamByName('codBase').AsString := codDBI;
        ParamByName('codAPU').AsString := codAPU;
        descripcion := valorCelda;
        unidad := 'Hora';
        ParamByName('Descripcion').AsString := descripcion;
        ParamByName('CodCategoria').AsInteger := codCategoria;
        ParamByName('codSubCategoria').AsInteger := codSubCategoria;
        ParamByName('idUnicoRecurso').AsString := 'Rsr' + generaCodigoUnico;
        codAlternativo := VTDaCodAlternativo(descripcion, unidad);
        codRecursoCompleto := generaCodigoRecurso(IntToStr(codCategoria), IntToStr(codSubCategoria),
          IntToStr(codRecurso));
        if codAlternativo = '' then
          codAlternativo := codRecursoCompleto;

        ParamByName('CodAPUAlternativo').AsString := codAlternativo;
        ParamByName('codRecurso').AsInteger := codRecurso;
        ParamByName('codRecursoCompleto').AsString := codRecursoCompleto;
        ParamByName('Unidad').AsString := unidad;
        valorCelda := Xls.GetCellValue(R1, 3).ToString.Trim;
        ParamByName('Precio').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Moneda').AsString := DMImportacion.datosDB.moneda;
        valorCelda := Xls.GetCellValue(R1, 2).ToString.Trim;
        ParamByName('CantidadUnidad').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        valorCelda := Xls.GetCellValue(R1, 5).ToString.Trim;
        rendimientoHUnidad1 := rendimientoHUnidad1 + StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Rendimiento').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Total').AsCurrency := DaValorCostoItems(R1, 100);
        Execute;
        Inc(codRecurso);
      end;
    end;

                // Mano de Obra
    rendimientoHUnidad2 := 0;
    nHCuadrillas := 0;
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_ManoObraSERCOP);
    rInicio := posExcel.R + 2;
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_FManoObraSERCOP);
    rFin := posExcel.R - 1;
    codCategoria := 4;
    codRecurso := 1;
    for R1 := rInicio to rFin do
    begin
      valorCelda := Xls.GetCellValue(R1, 1).ToString.Trim;
      if valorCelda <> '' then
      begin
        ParamByName('codBase').AsString := codDBI;
        ParamByName('codAPU').AsString := codAPU;
        descripcion := valorCelda;
        unidad := 'Hora';
        ParamByName('descripcion').AsString := descripcion;
        ParamByName('CodCategoria').AsInteger := codCategoria;
        ParamByName('codSubCategoria').AsInteger := codSubCategoria;
        ParamByName('idUnicoRecurso').AsString := 'Rsr' + generaCodigoUnico;
        ParamByName('codRecurso').AsInteger := codRecurso;
        codAlternativo := VTDaCodAlternativo(descripcion, unidad);
        codRecursoCompleto := generaCodigoRecurso(IntToStr(codCategoria), IntToStr(codSubCategoria),
          IntToStr(codRecurso));
        if codAlternativo = '' then
          codAlternativo := codRecursoCompleto;
        ParamByName('CodAPUAlternativo').AsString := codAlternativo;
        ParamByName('codRecursoCompleto').AsString := codRecursoCompleto;
        ParamByName('Unidad').AsString := unidad;
        valorCelda := Xls.GetCellValue(R1, 3).ToString.Trim;
        ParamByName('Precio').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Moneda').AsString := DMImportacion.datosDB.SimboloMoneda;
        valorCelda := Xls.GetCellValue(R1, 2).ToString.Trim;
        nHCuadrillas := nHCuadrillas + StrToInt(valorCelda);
        ParamByName('CantidadUnidad').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        valorCelda := Xls.GetCellValue(R1, 5).ToString.Trim;
        rendimientoHUnidad2 := rendimientoHUnidad2 + StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Rendimiento').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Total').AsCurrency := DaValorCostoItems(R1, 100);
        Execute;
        Inc(codRecurso);
      end;
    end;

                // Tratar Materiales
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_MaterialesSERCOP);
    rInicio := posExcel.R + 2;
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_FMaterialesSERCOP);
    rFin := posExcel.R - 1;
    codCategoria := 2;
    codRecurso := 1;
    for R1 := rInicio to rFin do
    begin
      valorCelda := Xls.GetCellValue(R1, 1).ToString.Trim;
      if valorCelda <> '' then
      begin
        ParamByName('codBase').AsString := codDBI;
        ParamByName('codAPU').AsString := codAPU;
        descripcion := valorCelda;
        ParamByName('descripcion').AsString := descripcion;
        ParamByName('CodCategoria').AsInteger := codCategoria;
        ParamByName('codSubCategoria').AsInteger := codSubCategoria;
        ParamByName('idUnicoRecurso').AsString := 'Rsr' + generaCodigoUnico;
        ParamByName('codRecurso').AsInteger := codRecurso;
        codRecursoCompleto := generaCodigoRecurso(IntToStr(codCategoria), IntToStr(codSubCategoria),
          IntToStr(codRecurso));
        ParamByName('codRecursoCompleto').AsString := codRecursoCompleto;
        posExcel.R := R1;
        posExcel.C := 2;
        valorCelda := BuscaValordeEntrada(Xls, nSheet, posExcel);
        unidad := valorCelda;

        ParamByName('Unidad').AsString := unidad;
        valorCelda := Xls.GetCellValue(R1, 5).ToString.Trim;
        ParamByName('Precio').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        codAlternativo := VTDaCodAlternativo(descripcion, unidad);
        if codAlternativo = '' then
          codAlternativo := codRecursoCompleto;
        ParamByName('CodAPUAlternativo').AsString := codAlternativo;
        ParamByName('Moneda').AsString := DMImportacion.datosDB.SimboloMoneda;
        valorCelda := Xls.GetCellValue(R1, 4).ToString.Trim;
        ParamByName('CantidadUnidad').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Rendimiento').AsCurrency := 1;
        ParamByName('Total').AsCurrency := DaValorCostoItems(R1, 101);
        Execute;
        Inc(codRecurso);
      end;
    end;

                // Tratar Transporte
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_TransporteSERCOP);
    rInicio := posExcel.R + 2;
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_FTransporteSERCOP);
    rFin := posExcel.R - 1;
    codCategoria := 3;
    codRecurso := 1;
    for R1 := rInicio to rFin do
    begin
      valorCelda := Xls.GetCellValue(R1, 1).ToString.Trim;
      if valorCelda <> '' then
      begin
        ParamByName('codBase').AsString := codDBI;
        ParamByName('codAPU').AsString := codAPU;
        descripcion := valorCelda;
        ParamByName('descripcion').AsString := descripcion;
        ParamByName('CodCategoria').AsInteger := codCategoria;
        ParamByName('codSubCategoria').AsInteger := codSubCategoria;
        ParamByName('idUnicoRecurso').AsString := 'Rsr' + generaCodigoUnico;
        ParamByName('codRecurso').AsInteger := codRecurso;
        codRecursoCompleto := generaCodigoRecurso(IntToStr(codCategoria), IntToStr(codSubCategoria),
          IntToStr(codRecurso));
        ParamByName('codRecursoCompleto').AsString := codRecursoCompleto;
        posExcel.R := R1;
        posExcel.C := 2;
        valorCelda := BuscaValordeEntrada(Xls, nSheet, posExcel);
        unidad := valorCelda;
        ParamByName('Unidad').AsString := unidad;
        valorCelda := Xls.GetCellValue(R1, 5).ToString.Trim;
        ParamByName('Precio').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        codAlternativo := VTDaCodAlternativo(descripcion, unidad);
        if codAlternativo = '' then
          codAlternativo := codRecursoCompleto;
        ParamByName('CodAPUAlternativo').AsString := codAlternativo;
        ParamByName('Moneda').AsString := DMImportacion.datosDB.SimboloMoneda;
        valorCelda := Xls.GetCellValue(R1, 4).ToString.Trim;
        ParamByName('CantidadUnidad').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Rendimiento').AsCurrency := 1;
        ParamByName('Total').AsCurrency := DaValorCostoItems(R1, 101);
        Execute;
        Inc(codRecurso);
      end;
    end;

  end;
  result.rendimientoHUnidad1 := rendimientoHUnidad1;
  result.rendimientoHUnidad2 := rendimientoHUnidad2;
  result.nHCuadrillas := nHCuadrillas;
end;

function TfImportadorPresupuestos.GuardarApusItemsExcel(nSheet: integer; codAPU: string):
  dat_resultadoApusItems;
var
  codSubCategoria: integer;
  rendimientoHUnidad1, rendimientoHUnidad2: Currency;
  posExcel: dat_celda;
  rInicio, rFin: integer;
  codCategoria: integer;
  codRecurso: integer;
  R1: integer;
  valorCelda: string;
  nHCuadrillas: integer;
begin
  with DMImportacion.QPresupuestoImportarAPUSItems do
  begin
    Transaction := Transaccion_importacion;
    codSubCategoria := 1;
                // Tratar Equipos y Herramientas
    rendimientoHUnidad1 := 0;
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_EquiposHerramietas);
    rInicio := posExcel.R + 2;
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_FEquiposHerramietas);
    rFin := posExcel.R - 1;
    codCategoria := 1;
    codRecurso := 1;
    for R1 := rInicio to rFin do
    begin
      valorCelda := Xls.GetCellValue(R1, 2).ToString.Trim;
      if valorCelda <> '' then
      begin
        ParamByName('codBase').AsString := codDBI;
        ParamByName('codAPU').AsString := codAPU;
        ParamByName('codApuAlternativo').AsString := Xls.GetCellValue(R1, 1).ToString.Trim;
        ParamByName('Descripcion').AsString := valorCelda;
        ParamByName('CodCategoria').AsInteger := codCategoria;
        ParamByName('codSubCategoria').AsInteger := codSubCategoria;
        ParamByName('idUnicoRecurso').AsString := 'Rsr' + generaCodigoUnico;
        ParamByName('codRecurso').AsInteger := codRecurso;
        ParamByName('codRecursoCompleto').AsString := generaCodigoRecurso(IntToStr(codCategoria),
          IntToStr(codSubCategoria), IntToStr(codRecurso));
        valorCelda := Xls.GetCellValue(R1, 3).ToString.Trim;
        ParamByName('Unidad').AsString := valorCelda;
        valorCelda := Xls.GetCellValue(R1, 5).ToString.Trim;
        ParamByName('Precio').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Moneda').AsString := DMImportacion.datosDB.moneda;
        valorCelda := Xls.GetCellValue(R1, 4).ToString.Trim;
        ParamByName('CantidadUnidad').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        valorCelda := Xls.GetCellValue(R1, 6).ToString.Trim;
        rendimientoHUnidad1 := rendimientoHUnidad1 + StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Rendimiento').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        valorCelda := Xls.GetCellValue(R1, 7).ToString.Trim;
        ParamByName('Total').AsCurrency := DaValorCostoItems(R1, 0);
                                // StrToCurr(decimal_correcto(valorCelda));
        valorCelda := Xls.GetCellValue(R1, 7).ToString.Trim;
        valorCelda := ReplaceStr(valorCelda, '%', '');
        ParamByName('porcentaje').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        Execute;
        Inc(codRecurso);
      end;
    end;

                // Tratar Materiales
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_Materiales);
    rInicio := posExcel.R + 2;
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_FMateriales);
    rFin := posExcel.R - 1;
    codCategoria := 2;
    codRecurso := 1;
    for R1 := rInicio to rFin do
    begin
      valorCelda := Xls.GetCellValue(R1, 2).ToString.Trim;
      if valorCelda <> '' then
      begin
        ParamByName('codBase').AsString := codDBI;
        ParamByName('codAPU').AsString := codAPU;
        ParamByName('codApuAlternativo').AsString := Xls.GetCellValue(R1, 1).ToString.Trim;
        ParamByName('descripcion').AsString := valorCelda;
        ParamByName('CodCategoria').AsInteger := codCategoria;
        ParamByName('codSubCategoria').AsInteger := codSubCategoria;
        ParamByName('idUnicoRecurso').AsString := 'Rsr' + generaCodigoUnico;
        ParamByName('codRecurso').AsInteger := codRecurso;
        ParamByName('codRecursoCompleto').AsString := generaCodigoRecurso(IntToStr(codCategoria),
          IntToStr(codSubCategoria), IntToStr(codRecurso));
        valorCelda := Xls.GetCellValue(R1, 3).ToString.Trim;
        ParamByName('Unidad').AsString := valorCelda;
        valorCelda := Xls.GetCellValue(R1, 5).ToString.Trim;
        ParamByName('Precio').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Moneda').AsString := DMImportacion.datosDB.SimboloMoneda;
        valorCelda := Xls.GetCellValue(R1, 4).ToString.Trim;
        ParamByName('CantidadUnidad').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Rendimiento').AsCurrency := 1;
        valorCelda := Xls.GetCellValue(R1, 7).ToString.Trim;
        ParamByName('Total').AsCurrency := DaValorCostoItems(R1, 0);
        valorCelda := Xls.GetCellValue(R1, 7).ToString.Trim;
        valorCelda := ReplaceStr(valorCelda, '%', '');
        ParamByName('porcentaje').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        Execute;
        Inc(codRecurso);
      end;
    end;

                // Tratar Transporte
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_Transporte);
    rInicio := posExcel.R + 2;
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_FTransporte);
    rFin := posExcel.R - 1;
    codCategoria := 3;
    codRecurso := 1;
    for R1 := rInicio to rFin do
    begin
      valorCelda := Xls.GetCellValue(R1, 2).ToString.Trim;
      if valorCelda <> '' then
      begin
        ParamByName('codBase').AsString := codDBI;
        ParamByName('codAPU').AsString := codAPU;
        ParamByName('codApuAlternativo').AsString := Xls.GetCellValue(R1, 1).ToString.Trim;
        ParamByName('descripcion').AsString := valorCelda;
        ParamByName('CodCategoria').AsInteger := codCategoria;
        ParamByName('codSubCategoria').AsInteger := codSubCategoria;
        ParamByName('idUnicoRecurso').AsString := 'Rsr' + generaCodigoUnico;
        ParamByName('codRecurso').AsInteger := codRecurso;
        ParamByName('codRecursoCompleto').AsString := generaCodigoRecurso(IntToStr(codCategoria),
          IntToStr(codSubCategoria), IntToStr(codRecurso));
        valorCelda := Xls.GetCellValue(R1, 3).ToString.Trim;
        ParamByName('Unidad').AsString := valorCelda;
        valorCelda := Xls.GetCellValue(R1, 5).ToString.Trim;
        ParamByName('Precio').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Moneda').AsString := DMImportacion.datosDB.SimboloMoneda;
        valorCelda := Xls.GetCellValue(R1, 4).ToString.Trim;
        ParamByName('CantidadUnidad').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        valorCelda := Xls.GetCellValue(R1, 6).ToString.Trim;
        rendimientoHUnidad1 := rendimientoHUnidad1 + StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Rendimiento').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        valorCelda := Xls.GetCellValue(R1, 7).ToString.Trim;
        ParamByName('Total').AsCurrency := DaValorCostoItems(R1, 0);
        valorCelda := Xls.GetCellValue(R1, 7).ToString.Trim;
        valorCelda := ReplaceStr(valorCelda, '%', '');
        ParamByName('porcentaje').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        Execute;
        Inc(codRecurso);
      end;
    end;

                // Mano de Obra
    rendimientoHUnidad2 := 0;
    nHCuadrillas := 0;

    posExcel := BuscaCadenaExcel(Xls, nSheet, c_ManoObra);
    rInicio := posExcel.R + 2;
    posExcel := BuscaCadenaExcel(Xls, nSheet, c_FManoObra);
    rFin := posExcel.R - 1;

    codCategoria := 4;
    codRecurso := 1;
    for R1 := rInicio to rFin do
    begin
      valorCelda := Xls.GetCellValue(R1, 2).ToString.Trim;
      if valorCelda <> '' then
      begin
        ParamByName('codBase').AsString := codDBI;
        ParamByName('codAPU').AsString := codAPU;
        ParamByName('codApuAlternativo').AsString := Xls.GetCellValue(R1, 1).ToString.Trim;
        ParamByName('descripcion').AsString := valorCelda;
        ParamByName('CodCategoria').AsInteger := codCategoria;
        ParamByName('codSubCategoria').AsInteger := codSubCategoria;
        ParamByName('idUnicoRecurso').AsString := 'Rsr' + generaCodigoUnico;
        ParamByName('codRecurso').AsInteger := codRecurso;
        ParamByName('codRecursoCompleto').AsString := generaCodigoRecurso(IntToStr(codCategoria),
          IntToStr(codSubCategoria), IntToStr(codRecurso));
        valorCelda := Xls.GetCellValue(R1, 3).ToString.Trim;
        ParamByName('Unidad').AsString := valorCelda;
        valorCelda := Xls.GetCellValue(R1, 5).ToString.Trim;
        ParamByName('Precio').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Moneda').AsString := DMImportacion.datosDB.SimboloMoneda;
        valorCelda := Xls.GetCellValue(R1, 4).ToString.Trim;
        nHCuadrillas := nHCuadrillas + StrToInt(valorCelda);
        ParamByName('CantidadUnidad').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        valorCelda := Xls.GetCellValue(R1, 6).ToString.Trim;
        rendimientoHUnidad2 := rendimientoHUnidad2 + StrToCurr(decimal_correcto(valorCelda));
        ParamByName('Rendimiento').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        valorCelda := Xls.GetCellValue(R1, 7).ToString.Trim;
        ParamByName('Total').AsCurrency := DaValorCostoItems(R1, 0);
        valorCelda := Xls.GetCellValue(R1, 7).ToString.Trim;
        valorCelda := ReplaceStr(valorCelda, '%', '');
        ParamByName('porcentaje').AsCurrency := StrToCurr(decimal_correcto(valorCelda));
        Execute;
        Inc(codRecurso);
      end;
    end;
  end;
  result.rendimientoHUnidad1 := rendimientoHUnidad1;
  result.rendimientoHUnidad2 := rendimientoHUnidad2;
  result.nHCuadrillas := nHCuadrillas;
end;

procedure TfImportadorPresupuestos.ImportarApusProyecto;
var
  R, Ri, Rf, R1: integer;
  posExcel: dat_celda;
  codAPUAlternativo: string;
  posSheetActivo: integer;
  codAPU: string;
  codrecursoAPU: integer;
  datosItems: dat_resultadoApusItems;
begin
  with DMImportacion.QPresupuestoCategoriaAPUS do
  begin
    Transaction := Transaccion_importacion;
    ParamByName('codBase').AsString := codDBI;
    ParamByName('Categoria_base').AsInteger := 1;
    ParamByName('Ciu').AsInteger := 1;
    ParamByName('NombreBase').AsString := DMImportacion.datosDB.nombre;
    ParamByName('Descripcion').AsString := 'General';
    ParamByName('codExterno').AsString := '';
    ParamByName('Comentarios').AsString := 'Datos de Importación';
    ParamByName('Usado').AsInteger := 0;
    ParamByName('sincronizada').AsInteger := 0;
    ParamByName('origen').AsString := 'Modulo Importación';
    ParamByName('fechaCreacion').AsDateTime := now;
    Prepare;
    Execute;
  end;
  case cbbModeloExcel.ItemIndex of
    0:
      begin
        posExcel := BuscaCadenaExcel(Xls, 1, 'Ítem');
        Ri := posExcel.R + 1;
        posExcel := BuscaCadenaExcel(Xls, 1, 'SUBTOTAL');
        Rf := posExcel.R - 1; //
      end;
    1:
      begin
        posExcel := BuscaCadenaExcel(Xls, 1, 'Rubro/Descripción');
        Ri := posExcel.R + 1;
        posExcel := BuscaCadenaExcel(Xls, 1, 'TOTAL');
        Rf := posExcel.R - 1;
      end;
  end;
  codrecursoAPU := 1;

  for R := Ri to Rf do
  begin
    Xls.ActiveSheet := 1;
    case cbbModeloExcel.ItemIndex of
      0:
        codAPUAlternativo := VarToStr(Xls.GetCellValue(R, 2).AsVariant);
      1:
        begin
          codAPUAlternativo := buscaCodApuAlternativo(VarToStr(Xls.GetCellValue(R, 2).AsVariant).Trim,
            VarToStr(Xls.GetCellValue(R, 3).AsVariant).Trim);
        end;
    end;
    if codAPUAlternativo <> '' then
    begin
      posSheetActivo := EncuentraSheetxNombre(Xls, codAPUAlternativo);
      if not DMImportacion.ExisteApuAlternativo(codDBI, codAPUAlternativo) then
      begin
        if posSheetActivo > 0 then
        begin

          Xls.ActiveSheet := posSheetActivo;
          codAPU := ReplaceStr(GeneraCodUnicoAPU, 'APUsr', 'APUIm');
          case cbbModeloExcel.ItemIndex of
            0:
              begin
                                        // ----------
                                        // APUS
                                        // ----------
                GuardarApusExcel(posSheetActivo, codAPU, codrecursoAPU);
                Inc(codrecursoAPU);

                                        // ----------------
                                        // APUS ITEMS
                                        // ----------------
                datosItems := GuardarApusItemsExcel(posSheetActivo, codAPU);
              end;
            1:
              begin
                                        // ----------
                                        // APUS
                                        // ----------
                GuardarApusExcelSERCOP(posSheetActivo, codAPU, codrecursoAPU);
                Inc(codrecursoAPU);

                                        // ----------------
                                        // APUS ITEMS
                                        // ----------------
                datosItems := GuardarApusItemsExcelSERCOP(posSheetActivo, codAPU);
              end;
          end;
                                        // -----------------------------
                                        // AJUSTES FINALES DE APUS
                                        // -----------------------------
          with DMImportacion.QPresupuestoActualizaAPUS do
          begin
            Transaction := Transaccion_importacion;
            if datosItems.rendimientoHUnidad1 >= datosItems.rendimientoHUnidad2 then
              ParamByName('rendimientoHUnidad').AsCurrency := datosItems.rendimientoHUnidad1
            else
              ParamByName('rendimientoHUnidad').AsCurrency := datosItems.rendimientoHUnidad2;
            ParamByName('nhCuadrillas').AsCurrency := datosItems.nHCuadrillas;
            ParamByName('codBase').AsString := codDBI;
            ParamByName('codAPU').AsString := codAPU;
            Execute;
          end;
        end;
      end;
    end;
  end;
end;

procedure TfImportadorPresupuestos.importarDatosGenerales;
begin
  with DMImportacion.QPresupuestoDatosGenerales do
  begin
    Transaction := Transaccion_importacion;
    ParamByName('codBase').AsString := codDBI;
    ParamByName('codPresupuesto').AsString := codProyectoI;
    ParamByName('codReferencial').AsString := '';
    ParamByName('revision').AsInteger := 0;
    ParamByName('descripcion').AsString := edtNProyecto.Text;
    ParamByName('subtotal').AsCurrency := StrToCurr(decimal_correcto(lbl_Subtotal.Text));
    ParamByName('iva').AsCurrency := StrToCurr(decimal_correcto(lbl_IVA.Text));
    ParamByName('total').AsCurrency := StrToCurr(decimal_correcto(lbl_Total.Text));
    ParamByName('indirectos').AsCurrency := CostoIndirectosGeneral;
    ParamByName('fechaCreacion').AsDateTime := now;
    ParamByName('fechaModificacion').AsDateTime := now;
    ParamByName('nDecimales').AsInteger := 2;
    ParamByName('ndecimalesMoneda').AsInteger := 2;
    ParamByName('porcentajeIVA').AsInteger := StrToInt(porcentajeIVAProyecto);
    ParamByName('activo').AsInteger := 1;
    Prepare;
    Execute;
  end;
end;

procedure TfImportadorPresupuestos.importarDatosProyecto;
begin
  with DMImportacion.QPresupuestoDatosProyecto do
  begin
    Transaction := Transaccion_importacion;
    ParamByName('codBase').AsString := codDBI;
    ParamByName('codPresupuesto').AsString := codProyectoI;
    ParamByName('codReferencial').AsString := '';
    ParamByName('revision').AsInteger := 0;
    ParamByName('descripcion').AsString := edtNProyecto.Text;
    ParamByName('TipoProyecto').AsString := 'Comercial';
    ParamByName('Categoria').AsString := '01 - Aparcamiento / Garaje';
    ParamByName('TipoConstruccion').AsString := 'Nueva Construcción';
    ParamByName('AmbitoContratacion').AsString := 'Privado';
    ParamByName('TipoContrato').AsString := 'Diseño';
    ParamByName('FechaInicio').AsDateTime := IncDay(now, 7);
    ParamByName('PlazoEjecucion').AsInteger := 180;
    ParamByName('FechaFinalizacion').AsDateTime := IncDay(now, 187);
    ParamByName('ValidezPropuesta').AsInteger := 30;
    ParamByName('FechaHoraCreacion').AsDateTime := now;
    ParamByName('UltModificacion').AsDateTime := now;
    Prepare;
    Execute;
  end;
end;

procedure TfImportadorPresupuestos.importarEDTModelo;
var
  posExcel: dat_celda;
  posExcelFinal: dat_celda;
  RowCnt: integer;
  X: integer;
  CodEDTI: string;
  codEDTS: integer;
  descripcionEDTI: string;
  controlEDTI: string;
  qry: TUniQuery;
begin
  Xls.ActiveSheet := 1;
  case cbbModeloExcel.ItemIndex of
    0:
      begin
        posExcel := BuscaCadenaExcel(Xls, 1, 'Código');
        posExcelFinal := BuscaCadenaExcel(Xls, 1, 'SUBTOTAL');
        X := 0;
        for RowCnt := posExcel.R + 1 to posExcelFinal.R - 1 do
        begin
          controlEDTI := Xls.GetCellValue(RowCnt, 2).ToString;
          if controlEDTI = '' then
          begin
            CodEDTI := Xls.GetCellValue(RowCnt, 1).ToString;
            if Length(CodEDTI) > 1 then
            begin
              descripcionEDTI := Xls.GetCellValue(RowCnt, 3).ToString;
              SetLength(DMImportacion.datosEDT, X + 1);
              DMImportacion.datosEDT[X].codBase := codDBI;
              DMImportacion.datosEDT[X].codPresupuesto := codProyectoI;
              DMImportacion.datosEDT[X].Revision := 0;
              DMImportacion.datosEDT[X].codEDT := RightStr(CodEDTI, Length(CodEDTI) - 2);
              DMImportacion.datosEDT[X].descripcion := Xls.GetCellValue(RowCnt, 3).ToString;
              Inc(X);
            end;
          end;
        end;
      end;
    1:
      begin
        posExcel := BuscaCadenaExcel(Xls, 1, 'Nro.');
        posExcelFinal := BuscaCadenaExcel(Xls, 1, 'TOTAL');
        X := 0;
        codEDTS := 1;
        for RowCnt := posExcel.R + 2 to posExcelFinal.R - 1 do
        begin
          controlEDTI := Xls.GetCellValue(RowCnt, 3).ToString;
          if controlEDTI = '' then
          begin
            descripcionEDTI := Xls.GetCellValue(RowCnt, 2).ToString;
            SetLength(DMImportacion.datosEDT, X + 1);
            DMImportacion.datosEDT[X].codBase := codDBI;
            DMImportacion.datosEDT[X].codPresupuesto := codProyectoI;
            DMImportacion.datosEDT[X].Revision := 0;
            DMImportacion.datosEDT[X].codEDT := IntToStr(codEDTS);
            DMImportacion.datosEDT[X].descripcion := descripcionEDTI;
            DMImportacion.datosEDT[X].puntero := RowCnt;
            Inc(X);
            Inc(codEDTS);
          end;
        end;
      end;
  end;

  if Length(DMImportacion.datosEDT) > 0 then
  begin
    qry := TUniQuery.Create(nil);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Transaction := Transaccion_importacion;
        close;
        SQL.Clear;
        SQL.Add('INSERT INTO presupuestos_edt (codBase, codPresupuesto, Revision, CodEDT, Descripcion, codUnicoItemPresupuesto, puntero)');
        SQL.Add('VALUES (:codBase, :codPresupuesto, :Revision, :CodEDT, :Descripcion, :codUnicoItemPresupuesto, :puntero)');
        for X := 0 to Length(DMImportacion.datosEDT) - 1 do
        begin
          ParamByName('codBase').AsString := DMImportacion.datosEDT[X].codBase;
          ParamByName('codPresupuesto').AsString := DMImportacion.datosEDT[X].codPresupuesto;
          ParamByName('revision').AsInteger := DMImportacion.datosEDT[X].Revision;
          ParamByName('codEdt').AsString := DMImportacion.datosEDT[X].codEDT;
          ParamByName('descripcion').AsString := DMImportacion.datosEDT[X].descripcion;
          ParamByName('codUnicoItemPresupuesto').AsString := generaCodigoUnico;
          case cbbModeloExcel.ItemIndex of
            0:
              ParamByName('puntero').Value := null;
            1:
              ParamByName('puntero').AsInteger := DMImportacion.datosEDT[X].puntero;
          end;
          Prepare;
          ExecSQL;
        end;
      end;
    finally
      qry.free;
    end;
  end;
end;

procedure TfImportadorPresupuestos.importarLineasProyectoSERCOP;
var
  R: integer;
  codEdtTratar: string;
  posgrid: integer;
  icodItems: string;
  idescripcion: string;
  iUnidad: string;
  iCantidad: Currency;
  iPUnitario: Currency;
  iPTotal: Currency;
  tmpstr: string;
  finCapEDT: Boolean;
  punteroEDT: integer;
  picoditems: integer;
  posExcel: dat_celda;
  multiplicadorIndirecto: Currency;
begin
  Xls.ActiveSheet := 1;
  posgrid := 1;
  multiplicadorIndirecto := 1 + (CostoIndirectosGeneral / 100);
  DMImportacion.QCodEdtImportados.close;
  DMImportacion.QCodEdtImportados.ParamByName('codBase').AsString := codDBI;
  DMImportacion.QCodEdtImportados.ParamByName('codProyecto').AsString := codProyectoI;
  DMImportacion.QCodEdtImportados.ParamByName('revision').AsInteger := 0;
  DMImportacion.QCodEdtImportados.Open;
  DMImportacion.QCodEdtImportados.First;
  posExcel := BuscaCadenaExcel(Xls, 1, 'TOTAL');
  while not DMImportacion.QCodEdtImportados.Eof do
  begin
    codEdtTratar := DMImportacion.QCodEdtImportadosCodEDT.AsString;
    DMImportacion.insertaLineaItems(codDBI, codProyectoI, '0', codEdtTratar, '', DMImportacion.QCodEdtImportadosDescripcion.AsString,
      '', 0, 0, 0, posgrid, Transaccion_importacion);
    Inc(posgrid);
    punteroEDT := DMImportacion.QCodEdtImportadospuntero.AsInteger;
    finCapEDT := false;
    picoditems := 1;
    while (not finCapEDT) and (punteroEDT < posExcel.R - 1) do
    begin
      Inc(punteroEDT);
      if VarToStr(Xls.GetCellValue(punteroEDT, 1).AsVariant) = '' then
        finCapEDT := True;
      if not finCapEDT then
      begin
                                // Guardo las lineas items de presupuesto
        R := punteroEDT;
        icodItems := DMImportacion.QCodEdtImportadosCodEDT.AsString + '.' + IntToStr(picoditems);
        idescripcion := VarToStr(Xls.GetCellValue(R, 2).AsVariant).Trim;
        iUnidad := VarToStr(Xls.GetCellValue(R, 3).AsVariant).Trim;
        tmpstr := VarToStr(Xls.GetCellValue(R, 4).AsVariant);
        if tmpstr = '' then
          tmpstr := '0';
        iCantidad := StrToCurr(decimal_correcto(tmpstr));
        tmpstr := VarToStr(Xls.GetCellValue(R, 5).AsVariant);
        if tmpstr = '' then
          tmpstr := '0';
        iPUnitario := StrToCurr(decimal_correcto(tmpstr));
        iPUnitario := iPUnitario / multiplicadorIndirecto;
        iPTotal := iCantidad * iPUnitario;
        DMImportacion.insertaLineaItems(codDBI, codProyectoI, '0', '', icodItems, idescripcion,
          iUnidad, iCantidad, iPUnitario, iPTotal, posgrid, Transaccion_importacion);
        Inc(posgrid);
        Inc(picoditems);
      end;
    end;
    DMImportacion.QCodEdtImportados.next;
  end;
end;

procedure TfImportadorPresupuestos.importarLineasProyecto;
var
  posExcel: dat_celda;
  R: integer;
  valorCelda: string;
  codEdtTratar: string;
  codEdtBuscar: string;
  salir: Boolean;
  posgrid: integer;
  icodItems: string;
  idescripcion: string;
  iUnidad: string;
  iCantidad: Currency;
  iPUnitario: Currency;
  iPTotal: Currency;
  tmpstr: string;
  codAlternativo: string;
  multiplicadorIndirecto: Currency;
begin
  Xls.ActiveSheet := 1;
  posgrid := 1;
  multiplicadorIndirecto := 1 + (CostoIndirectosGeneral / 100);
  DMImportacion.QCodEdtImportados.close;
  DMImportacion.QCodEdtImportados.ParamByName('codBase').AsString := codDBI;
  DMImportacion.QCodEdtImportados.ParamByName('codProyecto').AsString := codProyectoI;
  DMImportacion.QCodEdtImportados.ParamByName('revision').AsInteger := 0;
  DMImportacion.QCodEdtImportados.Open;
  DMImportacion.QCodEdtImportados.First;
  while not DMImportacion.QCodEdtImportados.Eof do
  begin
    codEdtTratar := DMImportacion.QCodEdtImportadosCodEDT.AsString;
                // 6

    DMImportacion.insertaLineaItems(codDBI, codProyectoI, '0', codEdtTratar, '', DMImportacion.QCodEdtImportadosDescripcion.AsString,
      '', 0, 0, 0, posgrid, Transaccion_importacion);
    Inc(posgrid);

    codEdtBuscar := '1.' + codEdtTratar;
    posExcel := BuscaCadenaExcel(Xls, 1, codEdtBuscar + '.1');
    R := posExcel.R;

    if (R > 1) and (VarToStr(Xls.GetCellValue(R, 2).AsVariant).Trim <> '') then
      salir := false
    else
      salir := True;
    icodItems := Xls.GetCellValue(R, 1).ToString.Trim;
    while (not salir) do
    begin
      icodItems := RightStr(icodItems, Length(icodItems) - (Length(codEdtBuscar) + 1));
      idescripcion := VarToStr(Xls.GetCellValue(R, 3).AsVariant).Trim;
      iUnidad := VarToStr(Xls.GetCellValue(R, 4).AsVariant).Trim;
      tmpstr := VarToStr(Xls.GetCellValue(R, 5).AsVariant);
      if tmpstr = '' then
        tmpstr := '0';
      iCantidad := StrToCurr(decimal_correcto(tmpstr));
      tmpstr := VarToStr(Xls.GetCellValue(R, 6).AsVariant);
      if tmpstr = '' then
        tmpstr := '0';
      iPUnitario := StrToCurr(decimal_correcto(tmpstr));
      iPUnitario := iPUnitario / multiplicadorIndirecto;
      iPTotal := iCantidad * iPUnitario;

      DMImportacion.insertaLineaItems(codDBI, codProyectoI, '0', '', icodItems, idescripcion,
        iUnidad, iCantidad, iPUnitario, iPTotal, posgrid, Transaccion_importacion);

      Inc(posgrid);
      Inc(R);
      icodItems := Xls.GetCellValue(R, 1).ToString.Trim;
      if LeftStr(icodItems, Length(codEdtBuscar)) <> codEdtBuscar then
        salir := True;
    end;
    DMImportacion.QCodEdtImportados.next;
  end;
end;

function TfImportadorPresupuestos.AnalizaModeloSercop: Boolean;
var
  tNombreProyecto: string;
  tUbicacion: string;
  tOferente: string;
  dFecha: TDate;
  nApus: integer;
  posExcel: dat_celda;
  subtotalProyecto: string;
  TotalProyecto: string;
  tCostoIndirectoGeneral: string;
  fsubtotal, pIVa, fIVA, ftotal: Currency;
begin
        { ***** Importación formato InterPro ***** }
  result := True;
  posExcel := BuscaCadenaExcel(Xls, 1, 'Rubro/Descripción');
  tNombreProyecto := Xls.GetCellValue(posExcel.R + 1, 2).ToString;
  tNombreProyecto := LowerCase(tNombreProyecto);
  tNombreProyecto := Capitalize(tNombreProyecto);
  edtNProyecto.Text := tNombreProyecto;
  tUbicacion := '';
  edtUbicacion.Text := '';
  tOferente := Xls.GetCellValue(2, 2).ToString.Trim;
  edtOferente.Text := tOferente;
  dFecha := now;
  edtDate_1.Date := dFecha;
 // CambiaEstadoBase(True, Self);
  nApus := contarAPUS;
  if nApus < 0 then
    nApus := 0;
  lbl_NApus.Text := IntToStr(nApus);
  posExcel := BuscaCadenaExcel(Xls, 1, 'TOTAL');
  subtotalProyecto := BuscaValordeEntrada(Xls, 1, posExcel);

  if subtotalProyecto = '' then
  begin
    result := false;
    exit
  end;
  lbl_Subtotal.Text := subtotalProyecto;
  fsubtotal := StrToCurr(subtotalProyecto);
  porcentajeIVAProyecto := daValorParametro(VALOR_DEFECTO_IVA);
  pIVa := StrToCurr(porcentajeIVAProyecto);
  ftotal := fsubtotal * (((pIVa) / 100) + 1);
  TotalProyecto := CurrToStr(ftotal);
  IvaProyecto := CurrToStr(ftotal - fsubtotal);
  lbl_IVA.Text := IvaProyecto;
  lbl_Total.Text := TotalProyecto;
  posExcel := BuscaCadenaExcel(Xls, 2, 'INDIRECTOS');
  tCostoIndirectoGeneral := BuscaValordeEntrada(Xls, 2, posExcel);
  if tCostoIndirectoGeneral = '' then
  begin
    result := false;
    exit
  end
  else
  begin
    tCostoIndirectoGeneral := ReplaceStr(tCostoIndirectoGeneral, '%', '').Trim;
    try
      CostoIndirectosGeneral := StrToCurr(tCostoIndirectoGeneral);
    except
      result := false;
      exit
    end;
  end;
  codProyectoI := DMImportacion.generaCodSigProyecto;
  codDBI := DMImportacion.GeneraDB(edtNProyecto.Text, CostoIndirectosGeneral, 'Ecuador', codProyectoI);
end;

function TfImportadorPresupuestos.AnalizaModelo1: Boolean;
var
  tNombreProyecto: string;
  tUbicacion: string;
  tOferente: string;
  tFecha: string;
  dFecha: TDate;
  nApus: integer;
  posExcel: dat_celda;
  subtotalProyecto: string;
  TotalProyecto: string;
  tCostoIndirectoGeneral: string;
begin
        { ***** Importación formato InterPro ***** }

  result := True;
  tNombreProyecto := Xls.GetCellValue(1, 1).ToString;
  if tNombreProyecto <> '' then
  begin
    tNombreProyecto := LowerCase(tNombreProyecto);
    tNombreProyecto := Capitalize(tNombreProyecto);
    edtNProyecto.Text := tNombreProyecto;
  end;
  tUbicacion := Xls.GetCellValue(4, 3).ToString;
  if tUbicacion <> '' then
    edtUbicacion.Text := tUbicacion;
  tOferente := Xls.GetCellValue(3, 3).ToString;
  if tOferente <> '' then
    edtOferente.Text := tOferente;
  tFecha := Xls.GetCellValue(5, 3).ToString;
  if tFecha <> '' then
  begin
    try
      dFecha := StrToDate(tFecha);
    except
      dFecha := now;
    end;
  end
  else
  begin
    dFecha := now;
  end;
  edtDate_1.Date := dFecha;
 // CambiaEstadoBase(True);
  nApus := contarAPUS;
  if nApus < 0 then
    nApus := 0;
  lbl_NApus.Text := IntToStr(nApus);
  posExcel := BuscaCadenaExcel(Xls, 1, 'SUBTOTAL');
  subtotalProyecto := Xls.GetCellValue(posExcel.R, posExcel.C + 6).ToString;
  if subtotalProyecto = '' then
  begin
    result := false;
    exit
  end;
  lbl_Subtotal.Text := subtotalProyecto;
  posExcel := BuscaCadenaExcel(Xls, 1, 'IVA');
  IvaProyecto := Xls.GetCellValue(posExcel.R, posExcel.C + 6).ToString;
  porcentajeIVAProyecto := Xls.GetCellValue(posExcel.R, posExcel.C + 5).ToString;
  porcentajeIVAProyecto := ReplaceStr(porcentajeIVAProyecto, '%', '').Trim;
  if IvaProyecto = '' then
  begin
    result := false;
    exit
  end;
  lbl_IVA.Text := IvaProyecto;
  posExcel := BuscaCadenaExcel(Xls, 1, 'TOTAL');
  TotalProyecto := Xls.GetCellValue(posExcel.R, posExcel.C + 6).ToString;
  if TotalProyecto = '' then
  begin
    result := false;
    exit
  end;
  lbl_Total.Text := TotalProyecto;
  posExcel := BuscaCadenaExcel(Xls, 2, 'COSTOS INDIRECTOS');
  Xls.ActiveSheet := 2;
  tCostoIndirectoGeneral := Xls.GetCellValue(posExcel.R + 1, 1).ToString;
  if tCostoIndirectoGeneral = '' then
  begin
    result := false;
    exit
  end
  else
  begin
    tCostoIndirectoGeneral := ReplaceStr(tCostoIndirectoGeneral, '%', '').Trim;
    try
      CostoIndirectosGeneral := StrToCurr(tCostoIndirectoGeneral);
    except
      result := false;
      exit
    end;
  end;
  codProyectoI := DMImportacion.generaCodSigProyecto;
  codDBI := DMImportacion.GeneraDB(edtNProyecto.Text, CostoIndirectosGeneral, 'Ecuador', codProyectoI);
end;

procedure TfImportadorPresupuestos.limpiaDatos;
begin
  edtDate_1.Date := now;
  edtUbicacion.Text := '';
  edtNProyecto.Text := '';
  edtOferente.Text := '';
  lbl_NApus.Text := '0';
  lbl_Subtotal.Text := '0';
  lbl_IVA.Text := '0';
  lbl_Total.Text := '0';
  CostoIndirectosGeneral := -1;
 // CambiaEstadoBase(false);
end;

procedure TfImportadorPresupuestos.btnImportarClick(Sender: TObject);
begin
  Transaccion_importacion := TUniTransaction.Create(nil);
  if not DModule_1.con2.InTransaction then
  begin
    Transaccion_importacion.AddConnection(DModule_1.con2);
    Transaccion_importacion.StartTransaction;
  end;
        // if Assigned(Xls) then  // Quitar en version final
  begin
    case cbbModeloExcel.ItemIndex of
      0:
        begin
          cargarExcel('E:\Repositorios\GiProy_eXcel\Modelo 1.xlsx');
          if AnalizaModelo1 then
          begin
            ImportaModelo1;
                                        // Quitar en version final, asignar a boton
            ShowMessage('Importación Completada.');
          end
          else
          begin
            limpiaDatos;
            ShowMessage('Formato de importación no valido.');
          end;
        end;
      1:
        begin

          cargarExcel('E:\Repositorios\GiProy_eXcel\Modelo 1 SERCOP.xlsx');
          if AnalizaModeloSercop then
          begin
            try
              ImportaModelo1SERCOP;
                                        // Quitar en version final, asignar a boton
              Transaccion_importacion.Commit;
              ShowMessage('Importación Completada.');
            except
              Transaccion_importacion.Rollback;
              ShowMessage('Se ha producido un error al importar. Compruebe el formato');
            end;
          end
          else
          begin
            limpiaDatos;
            ShowMessage('Formato de importación no valido.');
          end;

        end;
    end;
  end;
end;

function TfImportadorPresupuestos.buscaCodApuAlternativo(descripcion, UMedida: string): string;
var
  nSheet: integer;
  salir: Boolean;
  cDescripcion, cUMedida: string;
  cCodAlternativo: string;
  R: integer;
  posExcel: dat_celda;
begin
  result := '';
  nSheet := 2;
  cCodAlternativo := '';
  salir := false;
  if not ((descripcion = '') or (UMedida = '')) then
  begin
    while (not salir) and (nSheet <= Xls.SheetCount) do
    begin
      Xls.ActiveSheet := nSheet;
      posExcel := BuscaCadenaExcel(Xls, nSheet, 'Rubro:');
      cDescripcion := VarToStr(Xls.GetCellValue(posExcel.R + 1, 1).AsVariant);
      posExcel := BuscaCadenaExcel(Xls, nSheet, 'Unidad:');
      cUMedida := BuscaValordeEntrada(Xls, nSheet, posExcel);
      if (cUMedida <> '') and (cDescripcion <> '') then
      begin
        if (LowerCase(cDescripcion) = LowerCase(descripcion)) and (LowerCase(UMedida) = LowerCase(cUMedida))
          then
        begin
          salir := True;
          cCodAlternativo := Xls.SheetName;
        end;
      end;
      Inc(nSheet);
    end;
  end;
  Xls.ActiveSheet := 1;
  result := cCodAlternativo;
end;

procedure TfImportadorPresupuestos.CambiaEstadoDatos(estado: Boolean);
begin
  edtDate_1.Enabled := estado;
  edtUbicacion.Enabled := estado;
  edtNProyecto.Enabled := estado;
  edtOferente.Enabled := estado;
end;

procedure TfImportadorPresupuestos.MainPreviewMouseDown(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  MainPreview.Cursor := crCross;
end;

procedure TfImportadorPresupuestos.MainPreviewMouseLeave(Sender: TObject);
begin
  MainPreview.Cursor := crDefault;
end;

procedure TfImportadorPresupuestos.MainPreviewMouseUp(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  MainPreview.Cursor := crDefault;
end;

procedure TfImportadorPresupuestos.MainPreviewMouseWheel(Sender: TObject; Shift: TShiftState;
  WheelDelta: integer; var Handled: Boolean);
var
  X: integer;
  valor: Real;
begin
  X := WheelDelta;
  valor := MainPreview.Zoom;
  if X > 0 then
    valor := valor + 0.025
  else
    valor := valor - 0.025;
  MainPreview.Zoom := valor;
end;

procedure TfImportadorPresupuestos.MenuItem1Click(Sender: TObject);
var
  valor: Real;
begin
  valor := MainPreview.Zoom;
  valor := valor + 0.025;
  MainPreview.Zoom := valor;
end;

procedure TfImportadorPresupuestos.MenuItem2Click(Sender: TObject);
var
  valor: Real;
begin
  valor := MainPreview.Zoom;
  valor := valor - 0.025;
  MainPreview.Zoom := valor;
end;

procedure TfImportadorPresupuestos.MenuItem3Click(Sender: TObject);
begin
  MainPreview.AutofitPreview := TAutofitPreview.Width;
end;

procedure TfImportadorPresupuestos.rect_12Click(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

procedure TfImportadorPresupuestos.rect_AceptarClick(Sender: TObject);
begin
  ModalResult := mrOk;
end;

procedure TfImportadorPresupuestos.tbc_XLSSheetChange(Sender: TObject);
var
  tmpstr: string;
  X: integer;
begin
  if Assigned(Xls) and (Xls.SheetCount - 1 > 0) then
  begin
    tmpstr := tbc_XLSSheet.ActiveTab.Name;
    X := AnsiPos('_', tmpstr);
    tmpstr := Copy(tmpstr, X + 1, Length(tmpstr));
    try
      Xls.ActiveSheet := StrToInt(tmpstr);
    except
      Xls.ActiveSheet := 1;
    end;
    MainPreview.InvalidatePreview;
  end;
end;

procedure TfImportadorPresupuestos.TVDirectory_FilesNodeClick(Sender: TObject; ANode:
  TTMSFMXTreeViewVirtualNode);
begin
  archivoExcel := TTMSFMXDirectoryTreeViewNode(ANode.Node).filename;
  if FileExists(archivoExcel) then
  begin
    try
      cargarExcel(archivoExcel);
      try
        case cbbModeloExcel.ItemIndex of
          0:
            AnalizaModelo1;
          1:
            AnalizaModeloSercop;

        end;
      except

      end;
    except
      ShowMessage('Error de Archivo.' + #13 + 'Por favor compruebe si es correcto.');
    end;
  end;
end;

procedure TfImportadorPresupuestos.TVDirectory_FoldersNodeClick(Sender: TObject; ANode:
  TTMSFMXTreeViewVirtualNode);
var
  directorio: string;
begin
  directorio := TTMSFMXDirectoryTreeViewNode(ANode.Node).filename;
  TVDirectory_Files.Filter := '*.xlsx; *.xls';
  TVDirectory_Files.LoadDirectory(directorio);
end;

function TfImportadorPresupuestos.VTDaCodAlternativoHMO(descripcion: string): string;
var
  tmpstr: string;
begin
  result := '';
  VTable_SERCOP.Filtered := false;
  VTable_SERCOP.Filter := 'descripcion = ' + QuotedStr(descripcion);
  VTable_SERCOP.Filtered := True;
  VTable_SERCOP.First;
  tmpstr := VTable_SERCOP.FieldByName('codAlternativo').AsString;
  result := tmpstr;
end;

function TfImportadorPresupuestos.VTDaCodAlternativo(descripcion, unidad: string): string;
var
  tmpstr: string;
begin
  result := '';
  VTable_SERCOP.Filtered := false;
  VTable_SERCOP.Filter := 'descripcion = ' + QuotedStr(descripcion) + ' and unidad = ' + QuotedStr(unidad);
  VTable_SERCOP.Filtered := True;
  VTable_SERCOP.First;
  tmpstr := VTable_SERCOP.FieldByName('codAlternativo').AsString;
  result := tmpstr;
end;

procedure TfImportadorPresupuestos.XLSSerco2VTable;
var
  X: integer;
  descripcion: string;
  unidad: string;
  codAlternativo: string;
begin
  VTable_SERCOP.Clear;
  VTable_SERCOP.Open;
  for X := 2 to Xls.SheetCount do
  begin
    Xls.ActiveSheet := X;
    codAlternativo := Xls.SheetName;
    descripcion := VarToStr(Xls.GetCellValue(4, 1).AsVariant);
    unidad := VarToStr(Xls.GetCellValue(4, 6).AsVariant);
    VTable_SERCOP.AppendRecord([X, descripcion, unidad, codAlternativo]);
  end;
  VTable_SERCOP.Active := True;
  Xls.ActiveSheet := 1;
end;

procedure TfImportadorPresupuestos.cargarExcel(filename: string);
var
  X: integer;
  tbitem: TTabItem;
begin
  Xls := TXlsFile.Create(1, false);
  ImgExport := TFlexCelImgExport.Create(Xls, false);
  ImgExport.AllVisibleSheets := false;
  MainPreview.Document := ImgExport;
  if FileExists(filename) then
  begin
    Xls.Open(filename);
    Xls.ActiveSheet := 1;
    MainPreview.InvalidatePreview;
    tbc_XLSSheet.BeginUpdate;
    for X := 0 to tbc_XLSSheet.TabCount - 1 do
      tbc_XLSSheet.Delete(0);
    for X := 1 to Xls.SheetCount do
    begin
      tbitem := TTabItem(tbc_XLSSheet.Add(TTabItem));
      tbitem.Text := Xls.GetSheetName(X);
      tbitem.Name := 'tab_' + IntToStr(X);
    end;
    tbc_XLSSheet.EndUpdate;
  end;
end;

function TfImportadorPresupuestos.contarAPUS: integer;
var
  posExcel: dat_celda;
  Ri: integer;
  Rf: integer;
  R: integer;
  valorCelda: string;
  nApus: integer;
  puntero: string;
begin
  nApus := 0;
  case cbbModeloExcel.ItemIndex of
    0:
      begin
        posExcel := BuscaCadenaExcel(Xls, 1, 'Ítem');
        Ri := posExcel.R + 1;
        posExcel := BuscaCadenaExcel(Xls, 1, 'SUBTOTAL');
        Rf := posExcel.R - 1;
        for R := Ri to Rf do
        begin
          valorCelda := VarToStr(Xls.GetCellValue(R, 2).AsVariant);
          if valorCelda <> '' then
            Inc(nApus);
        end;
      end;
    1:
      begin
        posExcel := BuscaCadenaExcel(Xls, 1, 'Rubro/Descripción');
        Ri := posExcel.R + 1;
        posExcel := BuscaCadenaExcel(Xls, 1, 'TOTAL');
        Rf := posExcel.R - 1;
        for R := Ri to Rf do
        begin
          valorCelda := VarToStr(Xls.GetCellValue(R, 2).AsVariant).Trim;
          puntero := VarToStr(Xls.GetCellValue(R, 3).AsVariant).Trim;
          if (valorCelda <> '') and (puntero <> '') then
            Inc(nApus);
        end;
      end;
  end;

  result := nApus;
end;

procedure TfImportadorPresupuestos.creacionRecursosProyecto;
var
  idUnico: string;
  codRecurso: integer;
  codCategoriaBase: integer;
  antiguaCategoria: integer;
  respuesta: dat_resultadoRecursos;
  X: integer;
begin
  DMImportacion.QApusItems_a_Recursos.close;
  DMImportacion.QApusItems_a_Recursos.ParamByName('codBase').AsString := codDBI;
  DMImportacion.QApusItems_a_Recursos.Open;
  DMImportacion.QApusItems_a_Recursos.First;
  antiguaCategoria := 0;
  codRecurso := 1;
  while not DMImportacion.QApusItems_a_Recursos.Eof do
  begin
    if not DMImportacion.existeRecurso(codDBI, DMImportacion.QApusItems_a_RecursosDescripcion.AsString,
      DMImportacion.QApusItems_a_Recursosunidad.AsString) then
    begin
      idUnico := DMImportacion.QApusItems_a_RecursosidUnico.AsString;
      codCategoriaBase := DMImportacion.QApusItems_a_RecursoscodCategoriaBase.AsInteger;
      respuesta := guardaRecurosos(idUnico, codCategoriaBase, antiguaCategoria, codRecurso);
      codRecurso := respuesta.codRecurso;
      antiguaCategoria := respuesta.antiguaCategoria;
    end;
    DMImportacion.QApusItems_a_Recursos.next;
  end;
end;

function TfImportadorPresupuestos.guardaRecurosos(idUnico: string; codCategoriaBase: integer;
  antiguaCategoria: integer; codRecurso: integer): dat_resultadoRecursos;
var
  codSubCategoria: integer;
  codRecursoCompleto: string;
  descripcion: string;
  precio: Currency;
  unidad: string;
  preciolocal: Currency;
  precioBase: Currency;
  moneda: string;
begin
  codSubCategoria := 1;
  if codCategoriaBase <> antiguaCategoria then
  begin
    antiguaCategoria := codCategoriaBase;
    codRecurso := 1;
  end
  else
  begin
    Inc(codRecurso);
  end;
  codRecursoCompleto := generaCodigoRecurso(IntToStr(codCategoriaBase), IntToStr(codSubCategoria),
    IntToStr(codRecurso));
  descripcion := DMImportacion.QApusItems_a_RecursosDescripcion.AsString;
  unidad := DMImportacion.QApusItems_a_Recursosunidad.AsString;
  precio := DMImportacion.QApusItems_a_RecursosPrecio.AsCurrency;
  preciolocal := DMImportacion.QApusItems_a_Recursospreciolocal.AsCurrency;
  precioBase := DMImportacion.QApusItems_a_RecursosprecioBase.AsCurrency;
  moneda := DMImportacion.QApusItems_a_Recursosmoneda.AsString;

  with DMImportacion.QInsertaRecursosI do
  begin
    Transaction := Transaccion_importacion;
    ParamByName('idUnico').AsString := idUnico;
    ParamByName('codBase').AsString := codDBI;
    ParamByName('codRecurso').AsInteger := codRecurso;
    ParamByName('codRecursoCompleto').AsString := codRecursoCompleto;
    ParamByName('codCategoriaBase').AsInteger := codCategoriaBase;
    ParamByName('codSubCategoria').AsInteger := codSubCategoria;
    ParamByName('descripcion').AsString := descripcion;
    ParamByName('Unidad').AsString := unidad;
    ParamByName('precio').AsCurrency := precio;
    ParamByName('precioLocal').AsCurrency := preciolocal;
    ParamByName('PrecioBase').AsCurrency := precioBase;
    ParamByName('moneda').AsString := moneda;
    ParamByName('fechahoraCreacion').AsDateTime := now;
    ParamByName('ultimaModificacion').AsDateTime := now;
    Prepare;
    Execute;
  end;
  result.codRecurso := codRecurso;
  result.antiguaCategoria := antiguaCategoria;
end;

end.

