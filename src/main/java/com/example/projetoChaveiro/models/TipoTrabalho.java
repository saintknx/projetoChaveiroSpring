package com.example.projetoChaveiro.models;

import java.util.Arrays;
import java.util.List;

public enum TipoTrabalho {
    CHAVEIRO("Chaveiro"),
    ENCANADOR("Encanador"),
    ELETRICISTA("Eletricista"),
    MARCENEIRO("Marceneiro"),
    PINTOR("Pintor"),
    PEDREIRO("Pedreiro"),
    SERRALHEIRO("Serralheiro"),
    VIDRACEIRO("Vidraceiro"),
    TECNICO_ELETRODOMESTICOS("Tecnico em eletrodomesticos"),
    INSTALADOR_AR_CONDICIONADO("Instalador de ar-condicionado");

    private final String descricao;

    TipoTrabalho(String descricao) {
        this.descricao = descricao;
    }

    public String getCodigo() {
        return name();
    }

    public String getDescricao() {
        return descricao;
    }

    public static boolean codigoValido(String codigo) {
        return Arrays.stream(values()).anyMatch(tipo -> tipo.name().equals(codigo));
    }

    public static List<TipoTrabalho> listar() {
        return Arrays.asList(values());
    }
}
