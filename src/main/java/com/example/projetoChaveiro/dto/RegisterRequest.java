package com.example.projetoChaveiro.dto;

public record RegisterRequest(
    String nome,
    String telefone,
    String email,
    String senha,
    String tipoUsuario,
    String cnpj
) {
}
