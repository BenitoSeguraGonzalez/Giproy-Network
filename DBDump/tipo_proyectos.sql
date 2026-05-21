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

 Date: 09/03/2026 09:52:46
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for tproyectos
-- ----------------------------
DROP TABLE IF EXISTS `tproyectos`;
CREATE TABLE `tproyectos`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 AVG_ROW_LENGTH = 1820 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of tproyectos
-- ----------------------------
INSERT INTO `tproyectos` VALUES (1, '01', 'Comercial');
INSERT INTO `tproyectos` VALUES (2, '02', 'Centro Comercial');
INSERT INTO `tproyectos` VALUES (3, '03', 'Institucional');
INSERT INTO `tproyectos` VALUES (4, '04', 'Residencial');
INSERT INTO `tproyectos` VALUES (5, '05', 'Infraestructura');
INSERT INTO `tproyectos` VALUES (6, '06', 'Paisaje, Urbanismo y Transporte');
INSERT INTO `tproyectos` VALUES (7, '07', 'Industria y Energía');
INSERT INTO `tproyectos` VALUES (8, '08', 'Proyecto de Ejemplo');
INSERT INTO `tproyectos` VALUES (9, '09', 'Proyecto sin Clasificación');

SET FOREIGN_KEY_CHECKS = 1;
