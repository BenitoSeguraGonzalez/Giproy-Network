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

 Date: 07/03/2026 17:37:13
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for unidades
-- ----------------------------
DROP TABLE IF EXISTS `unidades`;
CREATE TABLE `unidades`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `descripcion_completa` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `Subcategoria` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fechaHora` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_unidades_desc_subcat`(`descripcion` ASC, `Subcategoria` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 70 AVG_ROW_LENGTH = 862 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of unidades
-- ----------------------------
INSERT INTO `unidades` VALUES (1, 'Km', 'Kilómetro', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (2, 'Km', 'Kilómetro', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (3, 'm', 'Metro', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (4, 'm', 'Metro', '5', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (5, 'm', 'Metro', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (6, 'cm', 'Centimetro', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (7, 'mm', 'Milimetro', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (8, 'mi', 'Milla', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (9, 'in', 'Pulgada', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (10, 'ft', 'Pie', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (11, 'yd', 'Yarda', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (12, 'sem', 'Semana', '1', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (13, 'sem', 'Semana', '4', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (14, 'sem', 'Semana', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (15, 'd', 'Día', '1', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (16, 'd', 'Día', '4', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (17, 'd', 'Día', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (18, 'h', 'Hora', '1', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (19, 'h', 'Hora', '4', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (20, 'h', 'Hora', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (21, 'min', 'Minuto', '1', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (22, 'min', 'Minuto', '4', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (23, 's', 'Segundo', '1', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (24, 's', 'Segundo', '4', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (25, 'm2', 'Metro Cuadrado', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (26, 'm2', 'Metro Cuadrado', '5', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (27, 'm2', 'Metro Cuadrado', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (28, 'cm2', 'Centimetro Cuadrado', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (29, 'pie2', 'Pie Cuadrado', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (30, 't', 'Tonelada', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (31, 't', 'Tonelada', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (32, 'Kg', 'Kilogramo', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (33, 'Kg', 'Kilogramo', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (34, 'g', 'Gramo', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (35, 'lb', 'Libra', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (36, 'oz', 'Onza', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (37, 'm3', 'Metro Cúbico', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (38, 'm3', 'Metro Cúbico', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (39, 'l', 'Litro', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (40, 'ml', 'Mililitro', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (41, 'gal', 'Galón', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (42, 'u', 'Unidad', '1', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (43, 'u', 'Unidad', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (44, 'u', 'Unidad', '5', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (45, 'u', 'Unidad', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (46, 'global', 'Global', '1', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (47, 'global', 'Global', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (48, 'global', 'Global', '5', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (49, 'global', 'Global', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (50, 'md', 'Módulo', '1', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (51, 'md/d', 'Módulo por día', '1', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (52, 'h-H', 'Hora - Hombre', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (53, 'h-M', 'Hora - Máquina', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (54, 'saco', 'Saco', '2', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (55, 'viaje', 'Viaje', '3', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (56, 'viaje', 'Viaje', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (57, 'flete', 'Flete', '3', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (58, 'flete', 'Flete', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (59, 'm3-Km', 'Metro Cúbico - Kilómetro', '3', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (60, 'm3-Km', 'Metro Cúbico - Kilómetro', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (61, 'Kg/m3', 'Kilogramo - Metro Cúbico', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (62, 'm3/Kg', 'Metro Cúbico - Kilogramo', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (63, 'Pa', 'Pascal', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (64, 'W', 'Vatio', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (65, 'V', 'Voltio', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (66, 'A', 'Amperio', '6', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (67, 'u', 'Unidad', '3', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (68, 'u', 'Unidad', '4', '2025-12-23 15:17:16');
INSERT INTO `unidades` VALUES (69, 'ha', 'Hectárea', '6', '2026-01-21 10:15:36');

SET FOREIGN_KEY_CHECKS = 1;
