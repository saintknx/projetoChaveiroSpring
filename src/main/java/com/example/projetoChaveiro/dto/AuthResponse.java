package com.example.projetoChaveiro.dto;

public record AuthResponse(
    Long id,
    String nome,
    String telefone,
    String email,
    String tipoUsuario,
    String cnpj
) {
}
