package com.example.projetoChaveiro.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationRunner implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (tabelaExiste("chaveiros")) {
            if (indiceExiste("chaveiros", "uk_chaveiros_documento")) {
                jdbcTemplate.execute("ALTER TABLE chaveiros DROP INDEX uk_chaveiros_documento");
            }

            if (!colunaExiste("chaveiros", "empresa_usuario_id")) {
                jdbcTemplate.execute("ALTER TABLE chaveiros ADD COLUMN empresa_usuario_id BIGINT NULL");
            }

            if (!indiceExiste("chaveiros", "idx_chaveiros_documento")) {
                jdbcTemplate.execute("ALTER TABLE chaveiros ADD INDEX idx_chaveiros_documento (documento)");
            }

            if (!indiceExiste("chaveiros", "idx_chaveiros_empresa_usuario_id")) {
                jdbcTemplate.execute("ALTER TABLE chaveiros ADD INDEX idx_chaveiros_empresa_usuario_id (empresa_usuario_id)");
            }

            if (!foreignKeyExiste("chaveiros", "fk_chaveiros_empresa_usuario")) {
                jdbcTemplate.execute(
                    "ALTER TABLE chaveiros ADD CONSTRAINT fk_chaveiros_empresa_usuario " +
                    "FOREIGN KEY (empresa_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE"
                );
            }
        }
    }

    private boolean tabelaExiste(String nomeTabela) {
        Integer total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
            Integer.class,
            nomeTabela
        );
        return total != null && total > 0;
    }

    private boolean colunaExiste(String nomeTabela, String nomeColuna) {
        Integer total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
            Integer.class,
            nomeTabela,
            nomeColuna
        );
        return total != null && total > 0;
    }

    private boolean indiceExiste(String nomeTabela, String nomeIndice) {
        Integer total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?",
            Integer.class,
            nomeTabela,
            nomeIndice
        );
        return total != null && total > 0;
    }

    private boolean foreignKeyExiste(String nomeTabela, String nomeConstraint) {
        Integer total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.table_constraints " +
            "WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ? AND constraint_type = 'FOREIGN KEY'",
            Integer.class,
            nomeTabela,
            nomeConstraint
        );
        return total != null && total > 0;
    }
}
