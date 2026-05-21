program GiProyV2;

uses
  {$IFDEF EurekaLog}
  EMemLeaks,
  EResLeaks,
  EResourceStrings,
  EDebugJCL,
  EDebugExports,
  EFixSafeCallException,
  EMapWin32,
  EAppFMX,
  EDialogWinAPIMSClassic,
  EDialogWinAPIEurekaLogDetailed,
  EDialogWinAPIStepsToReproduce,
  ESendAPIGitHub,
  EBase,
  ExceptionLog7,
  {$ENDIF EurekaLog}
  System.StartUpCopy,
  FMX.Forms,
  Winapi.Windows,
  FMX.Types,
  uMain in 'uMain.pas' {frmMain},
  DM1 in 'DM1.pas' {DModule_1: TDataModule},
  uNuevaCategoria in 'uNuevaCategoria.pas' {frmNuevaCategoria},
  uAddAPU in 'uAddAPU.pas' {frmAddAPU},
  uBuscar2 in 'uBuscar2.pas' {frmBuscar2},
  uDuplicarBase in 'uDuplicarBase.pas' {frmDuplicarBase},
  uNuevaBase in 'uNuevaBase.pas' {frmNuevaBase},
  uNuevoRecurso in 'uNuevoRecurso.pas' {frmNuevoRecurso},
  uPregunta in 'uPregunta.pas' {frmPregunta},
  uReemplazar in 'uReemplazar.pas' {frmReemplazar},
  uBuscar in 'uBuscar.pas' {frmBuscar},
  uStakes in 'uStakes.pas' {frmStakes},
  ulistStakes in 'ulistStakes.pas' {frmListStakes},
  uPertenencia in 'uPertenencia.pas' {frmPertenencia},
  uRolProyecto in 'uRolProyecto.pas' {frmRolProyecto},
  uOpcionesEDT in 'uOpcionesEDT.pas' {frmOpcionesEDT},
  uCronoDerivaciones in 'uCronoDerivaciones.pas' {frm_CronoDerivaciones},
  uEditApuPresupuesto in 'uEditApuPresupuesto.pas' {frmEditAPUPresupuesto},
  uPorcentajesIndirectos in 'uPorcentajesIndirectos.pas' {frmPorcentajesIndirectos},
  uIndirectosUsuarios in 'uIndirectosUsuarios.pas' {frmIndirectosUsuarios},
  uBuscar3 in 'uBuscar3.pas' {frmBuscar3},
  uAbrirPresupuesto in 'uAbrirPresupuesto.pas' {frmAbrirPresupuesto},
  fNotaRevision in 'fNotaRevision.pas' {frame_NotasRevision: TFrame},
  uNotaPresupuesto in 'uNotaPresupuesto.pas' {frmNotaPresupuesto},
  uVisorNotas in 'uVisorNotas.pas' {frmVisorNotas},
  uNotasRevisionExt in 'uNotasRevisionExt.pas' {frmNotasRevisionExt: TFrame},
  fConversacionNota in 'fConversacionNota.pas' {frame_ConversacionNota: TFrame},
  fConversacionNota2 in 'fConversacionNota2.pas' {frame_ConversacionNota2: TFrame},
  uInputMemo in 'uInputMemo.pas' {frmImputMemo},
  uVisorEDT in 'uVisorEDT.pas' {frmVisorEDT},
  DM2 in 'DM2.pas' {DMProject: TDataModule},
  DMSeguridad in 'DMSeguridad.pas' {DM_Seguridad: TDataModule},
  DMOnline in 'DMOnline.pas' {DM_OnLine: TDataModule},
  uPDFViewer in 'uPDFViewer.pas' {frmPDFViewer},
  uAddEDO in 'uAddEDO.pas' {frmAddEDO},
  uAddEditCPC in 'uAddEditCPC.pas' {frm_AddEditCPC},
  uCPCSeleccion in 'uCPCSeleccion.pas' {frm_CPCSeleccion},
  uIndicesFPolinomica in 'uIndicesFPolinomica.pas' {frmIndicesFPolinomica},
  uImportarSubCategorias in 'uImportarSubCategorias.pas' {frmImportarSubCategorias},
  uImportarRecursos2 in 'uImportarRecursos2.pas' {frmImportarRecursos2},
  uImportarApus in 'uImportarApus.pas' {frmImportarApus},
  PlantillasExcel in 'PlantillasExcel.pas',
  UPasswordDialog in 'UPasswordDialog.pas' {PasswordDialog},
  uMetodosGuardar in 'uMetodosGuardar.pas' {frmMetodosGuardado},
  uAbrirBase3 in 'uAbrirBase3.pas' {frmAbrirBase3},
  thActualizaCodEmpresaOnline in 'thActualizaCodEmpresaOnline.pas',
  thDafechaInternet in 'thDafechaInternet.pas',
  DM_Presupuestos in 'DM_Presupuestos.pas' {DMPresupuesto: TDataModule},
  uNotasAPUEDT in 'uNotasAPUEDT.pas' {frmNotasAPUEDT},
  DM_EDO in 'DM_EDO.pas' {dmEDO: TDataModule},
  uImportadorPresupuestos in 'uImportadorPresupuestos.pas' {fImportadorPresupuestos},
  uDM in 'uDM.pas' {DM: TDataModule},
  DM_Importacion in 'DM_Importacion.pas' {DMImportacion: TDataModule},
  uVisorReportesExt in 'uVisorReportesExt.pas' {fVisorReportesExt},
  uVisoreReportes in 'uVisoreReportes.pas' {frmVisorReportes},
  thRecibeComunicacion in 'thRecibeComunicacion.pas',
  thEnviarMensaje in 'thEnviarMensaje.pas',
  uDisplayChat in 'uDisplayChat.pas' {fChat},
  DMExportDB in 'DMExportDB.pas' {DM_exportDB: TDataModule},
  uEnviosBasesProyectos in 'uEnviosBasesProyectos.pas' {frm_enviosDatosUsuarios},
  uPreguntaSiNo in 'uPreguntaSiNo.pas' {frmPreguntaSiNo},
  Unit_UsersIni in 'Unit_UsersIni.pas',
  uFormImportando in 'uFormImportando.pas' {FormImportando},
  UAuth in 'UAuth.pas',
  uApiGiProy in 'uApiGiProy.pas',
  uMensajes in 'uMensajes.pas' {fMensajes},
  uBitmapUtils in 'uBitmapUtils.pas',
  fProductoTienda in 'fProductoTienda.pas' {frmProductoTienda: TFrame},
  fProductoTienda2 in 'fProductoTienda2.pas' {frmProductoTienda2: TFrame},
  uFiscalDigits in 'uFiscalDigits.pas',
  uPdfTool in 'uPdfTool.pas',
  uRuntimeDeps in 'uRuntimeDeps.pas',
  uLicenciasPermisos in 'uLicenciasPermisos.pas',
  UPdfExporting in 'UPdfExporting.pas',
  UPrinting in 'UPrinting.pas',
  UPdfToImageConverter in 'UPdfToImageConverter.pas',
  UProgressThread in 'UProgressThread.pas',
  BrowserUtils in 'BrowserUtils.pas',
  FormUtils in 'FormUtils.pas',
  uEditorUnidades in 'uEditorUnidades.pas' {frm_editorUnidades},
  EditNumericHelper in 'EditNumericHelper.pas',
  uRectFillBitmapColoriz in 'uRectFillBitmapColoriz.pas',
  uDB_BorrarAPU in 'uDB_BorrarAPU.pas',
  uTrazabilidadRecursos in 'uTrazabilidadRecursos.pas' {frmTrazabilidadRecursos},
  uTrazabilidadAPU in 'uTrazabilidadAPU.pas' {frmTrazabilidadAPU},
  uTMSGridAutoSize in 'uTMSGridAutoSize.pas',
  uAPUModel in 'uAPUModel.pas',
  uFMXTooltip in 'uFMXTooltip.pas',
  uConfiguracion in 'uConfiguracion.pas' {frmConfiguracion},
  uGridFNC in 'uGridFNC.pas',
  uGiProyDBActivator_v1_0 in 'uGiProyDBActivator_v1_0.pas',
  uGiProyCryptoEngine_v1_5 in 'uGiProyCryptoEngine_v1_5.pas',
  uGiProySecureConfig_v1_0_3 in 'uGiProySecureConfig_v1_0_3.pas',
  uGiProyMigration_v1_0_2 in 'uGiProyMigration_v1_0_2.pas',
  uGiProyUserManager_v1_0_2 in 'uGiProyUserManager_v1_0_2.pas';

{$R *.res}

begin
  Application.Initialize;
  Application.CreateForm(TfrmMain, frmMain);
  Application.CreateForm(TDModule_1, DModule_1);
  Application.CreateForm(TDMProject, DMProject);
  Application.CreateForm(TDM_Seguridad, DM_Seguridad);
  Application.CreateForm(TDM_OnLine, DM_OnLine);
  Application.CreateForm(TDMPresupuesto, DMPresupuesto);
  Application.CreateForm(TdmEDO, dmEDO);
  Application.CreateForm(TDM, DM);
  Application.CreateForm(TDMImportacion, DMImportacion);
  Application.CreateForm(TDM_exportDB, DM_exportDB);
  Application.CreateForm(TFormImportando, FormImportando);
  Application.Run;

end.












