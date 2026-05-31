package com.example.projetoChaveiro.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.projetoChaveiro.models.Chaveiro;

public interface ChaveiroRepository extends JpaRepository<Chaveiro, Long> {
    Chaveiro findFirstByDocumentoOrderByIdDesc(String documento);
    Chaveiro findFirstByChavePixIgnoreCase(String chavePix);
    List<Chaveiro> findAllByOrderByNomeAsc();
    List<Chaveiro> findAllByEmpresaUsuarioIdOrderByIdDesc(Long empresaUsuarioId);
    long countByEmpresaUsuarioId(Long empresaUsuarioId);
}
