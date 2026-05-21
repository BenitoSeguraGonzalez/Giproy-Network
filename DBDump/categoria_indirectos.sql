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

 Date: 09/03/2026 09:55:03
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for catindirectos
-- ----------------------------
DROP TABLE IF EXISTS `catindirectos`;
CREATE TABLE `catindirectos`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `Descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 24 AVG_ROW_LENGTH = 744 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of catindirectos
-- ----------------------------
INSERT INTO `catindirectos` VALUES (1, '1.1', 'Beneficios');
INSERT INTO `catindirectos` VALUES (2, '1.2', 'Personal Tecnico');
INSERT INTO `catindirectos` VALUES (3, '1.3', 'Materiales de Ingenieria');
INSERT INTO `catindirectos` VALUES (4, '1.4', 'Oficina de la Obra');
INSERT INTO `catindirectos` VALUES (5, '2.1', 'Personal de Servicio');
INSERT INTO `catindirectos` VALUES (6, '2.2', 'Transporte');
INSERT INTO `catindirectos` VALUES (7, '2.3', 'Comunicaciones y Fletes');
INSERT INTO `catindirectos` VALUES (8, '3.1', 'Edificios del campamento');
INSERT INTO `catindirectos` VALUES (9, '3.2', 'Caminos, puentes y cerramientos');
INSERT INTO `catindirectos` VALUES (10, '3.3', 'Servicios Basicos');
INSERT INTO `catindirectos` VALUES (11, '3.4', 'Talleres de la Obra');
INSERT INTO `catindirectos` VALUES (12, '3.5', 'Arriendos');
INSERT INTO `catindirectos` VALUES (13, '4.1', 'Entretenimiento');
INSERT INTO `catindirectos` VALUES (14, '4.2', 'Costos medicos, legales y otros');
INSERT INTO `catindirectos` VALUES (15, '4.3', 'Seguros, garantias e impuestos');
INSERT INTO `catindirectos` VALUES (16, '4.4', 'Gastos Varios');
INSERT INTO `catindirectos` VALUES (17, '5.1', 'Material de consumo');
INSERT INTO `catindirectos` VALUES (18, '5.2', 'Reparación y mantenimiento de equipos');
INSERT INTO `catindirectos` VALUES (19, '5.3', 'Herramientas');
INSERT INTO `catindirectos` VALUES (21, '6.1', 'Utilidad');
INSERT INTO `catindirectos` VALUES (22, '6.2', 'Imprevistos');
INSERT INTO `catindirectos` VALUES (23, '7.1', 'Personalizados');

SET FOREIGN_KEY_CHECKS = 1;
