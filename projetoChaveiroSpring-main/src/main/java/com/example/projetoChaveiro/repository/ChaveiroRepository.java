package com.example.projetoChaveiro.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.projetoChaveiro.models.Chaveiro;

public interface ChaveiroRepository extends JpaRepository<Chaveiro, Long> {
    Chaveiro findByDocumento(String documento);
}
