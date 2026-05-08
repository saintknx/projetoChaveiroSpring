package com.example.projetoChaveiro.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.projetoChaveiro.models.Pessoa;

public interface PessoaRepository extends JpaRepository<Pessoa, Long> {
    Pessoa findByCpf(String cpf);
}