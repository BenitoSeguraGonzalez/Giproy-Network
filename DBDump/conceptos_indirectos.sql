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

 Date: 09/03/2026 09:55:19
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for conceptosindirectos
-- ----------------------------
DROP TABLE IF EXISTS `conceptosindirectos`;
CREATE TABLE `conceptosindirectos`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `codPadre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `CodigoCuenta` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fijo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `usuario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 95 AVG_ROW_LENGTH = 180 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of conceptosindirectos
-- ----------------------------
INSERT INTO `conceptosindirectos` VALUES (1, '1.1', 'Bonificaciones Especiales', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (2, '1.1', 'Almuerzo', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (3, '1.1', 'Uniformes', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (4, '1.1', 'Subsidio Familiar', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (5, '1.1', 'Otros', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (6, '1.2', 'Gastos tÃ©cnicos generales', '1', '0');
INSERT INTO `conceptosindirectos` VALUES (7, '1.2', 'Jefe de obra', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (8, '1.2', 'Ingeniero residentes y ayudantes', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (9, '1.2', 'Ingenieros de campo y ayudantes', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (10, '1.2', 'Ingeniero de oficina y ayudantes', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (11, '1.3', 'Ensayo de materiales', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (12, '1.3', 'Equipos y utiles de ingenieria', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (13, '1.3', 'Equipo de topografia', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (14, '1.3', 'Ingenieros consultores y servicios', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (15, '1.3', 'Fotos', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (16, '1.4', 'Gastos Administrativos Generales', '1', '0');
INSERT INTO `conceptosindirectos` VALUES (17, '1.4', 'Empleados de oficina (Rol mensual)', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (18, '1.4', 'Equipos y muebles de oficina', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (19, '1.4', 'Utiles de oficina', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (20, '1.4', 'Refresco, cafe y otros', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (21, '1.4', 'Ploteos de planos', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (22, '2.1', 'Guardiania', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (23, '2.1', 'Bodega', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (24, '2.1', 'Conserjes de oficina', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (25, '2.1', 'Limpieza y mantenimiento', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (26, '2.1', 'Botiquin', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (27, '2.2', 'Choferes', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (28, '2.2', 'Matriculas, multas, permisos, etc', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (29, '2.2', 'Alquiler de transporte', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (30, '2.2', 'Combustible', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (31, '2.2', 'Peajes', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (32, '2.2', 'Aceite y otros', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (33, '2.3', 'Uso y mantenimiento de aparatos de comunicación', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (34, '2.3', 'Celulares y planes ', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (35, '2.3', 'Movilización de equipos', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (36, '2.3', 'Flete por tierra', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (37, '2.3', 'Flete por avión', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (38, '2.3', 'Flete Maritimo', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (39, '2.3', 'Servicio de courier', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (40, '3.1', 'Materiales y gastos de construcción', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (41, '3.1', 'Mano de obra', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (42, '3.2', 'Construcciones y mantenimiento', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (43, '3.2', 'Mantenimiento de vias de acceso', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (44, '3.3', 'Instalaciones electricas y de internet', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (45, '3.3', 'Instalaciones sanitarias', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (46, '3.3', 'Tasas y permisos', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (47, '3.3', 'Consumo electrico', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (49, '3.3', 'Materiales y accesorios sanitarios', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (50, '3.3', 'Consumo de agua', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (51, '3.4', 'Excavación, relleno, compactación y pavimento', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (52, '3.4', 'Instalación de talleres', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (53, '3.5', 'Gastos por renta de terrenos', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (54, '3.5', 'Arriendo de bodega', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (55, '3.5', 'Arriendo de oficinas', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (56, '4.1', 'Gastos de entretenimiento', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (57, '4.2', 'Servicios medicos externos', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (58, '4.2', 'Servicios legales y de auditoria', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (59, '4.2', 'Cargas notariales', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (60, '4.3', 'Garantia de fiel cumplimiento', '1', '0');
INSERT INTO `conceptosindirectos` VALUES (61, '4.3', 'Garantia de anticipo', '1', '0');
INSERT INTO `conceptosindirectos` VALUES (62, '4.3', 'Garantia de buen uso de materiales', '1', '0');
INSERT INTO `conceptosindirectos` VALUES (63, '4.3', 'Seguros de equipos y vehiculos', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (64, '4.3', 'Seguros de muebles y otros bienes', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (65, '4.3', 'Seguros todo riesgo', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (66, '4.3', 'Impuestos varios', '1', '0');
INSERT INTO `conceptosindirectos` VALUES (67, '4.4', 'Cargos financieros y bancarios', '1', '0');
INSERT INTO `conceptosindirectos` VALUES (68, '4.4', 'Contribuciones o bonoficaciones especiales', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (69, '4.4', 'Viajes y viaticos', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (70, '4.4', 'Relaciones laborales', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (71, '4.4', 'Gastos de concursos o licitaciones', '1', '0');
INSERT INTO `conceptosindirectos` VALUES (72, '4.4', 'Relaciones publicas', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (73, '4.4', 'Suscripciones o registros', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (74, '4.4', 'Limpieza final', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (75, '4.4', 'Seguridad Industrial', '1', '0');
INSERT INTO `conceptosindirectos` VALUES (76, '5.1', 'Cabo, cables, cadenas, etc.', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (77, '5.1', 'Clavos, pernos, tornillos, etc.', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (78, '5.1', 'Otros materiales no asignados en costo directos', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (79, '5.2', 'Mecanicos y oficiales', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (80, '5.2', 'Repuestos', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (81, '5.2', 'Reparaciones externas', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (82, '5.2', 'Combustible, aceites y grasa', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (83, '5.3', 'Herramientas manuales', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (84, '5.3', 'Herramientas mayores', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (85, '4.4', 'Gastos Varios', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (86, '6.1', 'Utilidad', '1', '0');
INSERT INTO `conceptosindirectos` VALUES (87, '6.2', 'Imprevistos', '1', '0');
INSERT INTO `conceptosindirectos` VALUES (88, '1.2', 'Topografos, cadeneros y jornaleros', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (89, '1.4', 'Fotocopias de documentos', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (90, '3.3', 'Consumo de internet', '0', '0');
INSERT INTO `conceptosindirectos` VALUES (93, '7.1', 'Preliminares', '0', '1');
INSERT INTO `conceptosindirectos` VALUES (94, '7.1', 'Preliminares 2', '0', '1');

SET FOREIGN_KEY_CHECKS = 1;
