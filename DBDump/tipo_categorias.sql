/*
 Navicat Premium Dump SQL

 Source Server         : Servidor TalkCrypt Local
 Source Server Type    : MySQL
 Source Server Version : 90600 (9.6.0)
 Source Host           : 127.0.0.1:3306
 Source Schema         : giproylocal_2

 Target Server Type    : MySQL
 Target Server Version : 90600 (9.6.0)
 File Encoding         : 65001

 Date: 09/03/2026 09:53:23
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for tproyectositems
-- ----------------------------
DROP TABLE IF EXISTS `tproyectositems`;
CREATE TABLE `tproyectositems`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `codCategoriaBase` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `codigoItem` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 81 AVG_ROW_LENGTH = 204 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of tproyectositems
-- ----------------------------
INSERT INTO `tproyectositems` VALUES (1, '01', '01', 'Aparcamiento / Garaje');
INSERT INTO `tproyectositems` VALUES (2, '01', '02', 'Oficinas');
INSERT INTO `tproyectositems` VALUES (3, '01', '03', 'Locales Comerciales');
INSERT INTO `tproyectositems` VALUES (4, '01', '04', 'Hotel / Motel / Hostal / Hostería');
INSERT INTO `tproyectositems` VALUES (5, '01', '05', 'Comercio');
INSERT INTO `tproyectositems` VALUES (6, '01', '06', 'Música y Entretenimiento');
INSERT INTO `tproyectositems` VALUES (7, '01', '07', 'Teatro');
INSERT INTO `tproyectositems` VALUES (8, '01', '08', 'Restaurante');
INSERT INTO `tproyectositems` VALUES (9, '01', '09', 'Estudio');
INSERT INTO `tproyectositems` VALUES (10, '01', '10', 'Parque Temático');
INSERT INTO `tproyectositems` VALUES (11, '01', '11', 'Bodega / AlmacÃ©n (no fabricante)');
INSERT INTO `tproyectositems` VALUES (12, '01', '12', 'Centros comerciales / Mall');
INSERT INTO `tproyectositems` VALUES (13, '01', '13', 'Supermercado');
INSERT INTO `tproyectositems` VALUES (14, '01', '14', 'Mercado público');
INSERT INTO `tproyectositems` VALUES (15, '01', '15', 'Centro de convenciones');
INSERT INTO `tproyectositems` VALUES (16, '01', '16', 'Centro de datos');
INSERT INTO `tproyectositems` VALUES (17, '02', '01', 'Vivienda asistida / Residencia geriátrica');
INSERT INTO `tproyectositems` VALUES (18, '02', '02', 'Laboratorio mÃ©dico');
INSERT INTO `tproyectositems` VALUES (19, '02', '03', 'Consultorio mÃ©dico');
INSERT INTO `tproyectositems` VALUES (20, '02', '04', 'Centro de cirugía ambulatoria');
INSERT INTO `tproyectositems` VALUES (21, '02', '05', 'Centro mÃ©dico en general');
INSERT INTO `tproyectositems` VALUES (22, '02', '06', 'Hospital');
INSERT INTO `tproyectositems` VALUES (23, '02', '07', 'Clinica / Centro mÃ©dico especializado');
INSERT INTO `tproyectositems` VALUES (24, '03', '01', 'Instituciones educativas');
INSERT INTO `tproyectositems` VALUES (25, '03', '02', 'Centro de enseñanza');
INSERT INTO `tproyectositems` VALUES (26, '03', '03', 'Edificio Gubernamental');
INSERT INTO `tproyectositems` VALUES (27, '03', '04', 'Bibloteca');
INSERT INTO `tproyectositems` VALUES (28, '03', '05', 'Instalación militar');
INSERT INTO `tproyectositems` VALUES (29, '03', '06', 'Museo');
INSERT INTO `tproyectositems` VALUES (30, '03', '07', 'Centro Penitenciario / correcional');
INSERT INTO `tproyectositems` VALUES (31, '03', '08', 'Centro de ocio y diversión');
INSERT INTO `tproyectositems` VALUES (32, '03', '09', 'Edificio religioso');
INSERT INTO `tproyectositems` VALUES (33, '03', '10', 'Laboratorio  / Centro de investigación');
INSERT INTO `tproyectositems` VALUES (34, '04', '01', 'Vivieda unifamiliar');
INSERT INTO `tproyectositems` VALUES (35, '04', '02', 'Vivienda plurifamiliar');
INSERT INTO `tproyectositems` VALUES (36, '04', '03', 'Edificio de departamentos');
INSERT INTO `tproyectositems` VALUES (37, '04', '04', 'Urbanización');
INSERT INTO `tproyectositems` VALUES (38, '04', '05', 'Casa de campo/ Quinta / Hacienda');
INSERT INTO `tproyectositems` VALUES (39, '04', '06', 'Condominio');
INSERT INTO `tproyectositems` VALUES (40, '05', '01', 'Aeropuerto');
INSERT INTO `tproyectositems` VALUES (41, '05', '02', 'Puentes');
INSERT INTO `tproyectositems` VALUES (42, '05', '03', 'Canal / Vía Fluvial');
INSERT INTO `tproyectositems` VALUES (43, '05', '04', 'Presas / Control de crecidas / Embalses');
INSERT INTO `tproyectositems` VALUES (44, '05', '05', 'Desarrollo de puertos');
INSERT INTO `tproyectositems` VALUES (45, '05', '06', 'Encauce de ríos');
INSERT INTO `tproyectositems` VALUES (46, '05', '07', 'Estabilización de suelo');
INSERT INTO `tproyectositems` VALUES (47, '05', '08', 'Ferrocarril / Tren urbano / Tranvia');
INSERT INTO `tproyectositems` VALUES (48, '05', '09', 'Puerto marítimo');
INSERT INTO `tproyectositems` VALUES (49, '05', '10', 'Calle / Carretera / Autopista');
INSERT INTO `tproyectositems` VALUES (50, '05', '11', 'Edificio de transporte');
INSERT INTO `tproyectositems` VALUES (51, '05', '12', 'Túnel');
INSERT INTO `tproyectositems` VALUES (52, '05', '13', 'Paso vial deprimido');
INSERT INTO `tproyectositems` VALUES (53, '05', '14', 'Alcantarillado / Aguas residuales');
INSERT INTO `tproyectositems` VALUES (54, '05', '15', 'Suministro de agua');
INSERT INTO `tproyectositems` VALUES (55, '06', '01', 'Parque / Plaza / Plazoleta');
INSERT INTO `tproyectositems` VALUES (56, '06', '02', 'Caminera / Ciclovía');
INSERT INTO `tproyectositems` VALUES (57, '06', '03', 'Aerovía');
INSERT INTO `tproyectositems` VALUES (58, '06', '04', 'Estación de transporte');
INSERT INTO `tproyectositems` VALUES (59, '06', '05', 'Jardín / Vegetación en general');
INSERT INTO `tproyectositems` VALUES (60, '07', '01', 'Manufactura / Fábrica');
INSERT INTO `tproyectositems` VALUES (61, '07', '02', 'Instalación minera');
INSERT INTO `tproyectositems` VALUES (62, '07', '03', 'Petróleo y gas');
INSERT INTO `tproyectositems` VALUES (63, '07', '04', 'Planta industrial');
INSERT INTO `tproyectositems` VALUES (64, '07', '05', 'Central elÃ©ctrica');
INSERT INTO `tproyectositems` VALUES (65, '07', '06', 'Parque solar');
INSERT INTO `tproyectositems` VALUES (66, '07', '07', 'Servicios');
INSERT INTO `tproyectositems` VALUES (67, '07', '08', 'Parque eólico');
INSERT INTO `tproyectositems` VALUES (68, '08', '01', 'Proyecto de demostración');
INSERT INTO `tproyectositems` VALUES (69, '08', '02', 'Plantilla de proyecto');
INSERT INTO `tproyectositems` VALUES (70, '08', '03', 'Proyecto de formación');
INSERT INTO `tproyectositems` VALUES (71, '09', '01', 'No categorizado');
INSERT INTO `tproyectositems` VALUES (72, '05', '16', 'Calles / Vias urbanas');
INSERT INTO `tproyectositems` VALUES (73, '05', '17', 'Carreteras / Autopistas');
INSERT INTO `tproyectositems` VALUES (74, '05', '18', 'Alcantarillados / Trantamiento de aguas y residuos sólidos');
INSERT INTO `tproyectositems` VALUES (75, '05', '19', 'Agua potable y recursos');
INSERT INTO `tproyectositems` VALUES (76, '05', '20', 'Sistema de riegos');
INSERT INTO `tproyectositems` VALUES (77, '05', '21', 'Túneles');
INSERT INTO `tproyectositems` VALUES (78, '05', '22', 'ElÃ©ctrica');
INSERT INTO `tproyectositems` VALUES (79, '05', '23', 'Telecomunicaciones');
INSERT INTO `tproyectositems` VALUES (80, '05', '24', 'Generación y Transmisión de energía');

SET FOREIGN_KEY_CHECKS = 1;
