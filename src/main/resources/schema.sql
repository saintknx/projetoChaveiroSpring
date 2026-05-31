DROP TABLE IF EXISTS `chaveiro_tipos_trabalho`;
DROP TABLE IF EXISTS `chaveiros`;
DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `nome` varchar(255) NOT NULL,
    `telefone` varchar(45) NOT NULL,
    `email` varchar(255) NOT NULL,
    `senha_hash` varchar(255) NOT NULL,
    `tipo_usuario` varchar(20) NOT NULL,
    `cnpj` varchar(20) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_usuarios_email` (`email`),
    UNIQUE KEY `uk_usuarios_cnpj` (`cnpj`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `chaveiros` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `documento` varchar(45) NOT NULL,
    `nome` varchar(255) NOT NULL,
    `empresa_usuario_id` bigint DEFAULT NULL,
    `telefone` varchar(45) DEFAULT NULL,
    `cidade` varchar(100) DEFAULT NULL,
    `chave_pix` varchar(255) DEFAULT NULL,
    `status` varchar(45) DEFAULT NULL,
    `observacao` varchar(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_chaveiros_documento` (`documento`),
    KEY `idx_chaveiros_empresa_usuario_id` (`empresa_usuario_id`),
    CONSTRAINT `fk_chaveiros_empresa_usuario`
        FOREIGN KEY (`empresa_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `chaveiro_tipos_trabalho` (
    `chaveiro_id` bigint NOT NULL,
    `tipo_trabalho` varchar(80) NOT NULL,
    KEY `idx_chaveiro_tipos_trabalho_chaveiro` (`chaveiro_id`),
    CONSTRAINT `fk_chaveiro_tipos_trabalho_chaveiro`
        FOREIGN KEY (`chaveiro_id`) REFERENCES `chaveiros` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
