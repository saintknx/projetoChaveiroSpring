DROP TABLE IF EXISTS `chaveiros`;

CREATE TABLE `chaveiros` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `documento` varchar(45) NOT NULL,
    `nome` varchar(255) NOT NULL,
    `telefone` varchar(45) DEFAULT NULL,
    `cidade` varchar(100) DEFAULT NULL,
    `chave_pix` varchar(255) DEFAULT NULL,
    `status` varchar(45) DEFAULT NULL,
    `observacao` varchar(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_chaveiros_documento` (`documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
