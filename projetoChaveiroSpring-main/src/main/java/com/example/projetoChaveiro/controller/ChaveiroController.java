package com.example.projetoChaveiro.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.projetoChaveiro.models.Chaveiro;
import com.example.projetoChaveiro.repository.ChaveiroRepository;

@RestController
@RequestMapping("/api/chaveiros")
public class ChaveiroController {
    @Autowired
    private ChaveiroRepository chaveiroRepository;

    @PostMapping
    public Chaveiro salvar(@RequestBody Chaveiro chaveiro) {
        return chaveiroRepository.save(chaveiro);
    }

    @GetMapping
    public Iterable<Chaveiro> listar() {
        return chaveiroRepository.findAll();
    }

    @GetMapping("/{documento}")
    public ResponseEntity<Chaveiro> buscarPorDocumento(@PathVariable String documento) {
        Chaveiro chaveiro = chaveiroRepository.findByDocumento(documento);
        if (chaveiro == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(chaveiro);
    }

    @PutMapping("/{documento}")
    public Chaveiro atualizar(@PathVariable String documento, @RequestBody Chaveiro chaveiro) {
        Chaveiro existente = chaveiroRepository.findByDocumento(documento);
        if (existente != null) {
            chaveiro.setId(existente.getId());
        }
        chaveiro.setDocumento(documento);
        return chaveiroRepository.save(chaveiro);
    }

    @DeleteMapping("/{documento}")
    public ResponseEntity<Void> deletar(@PathVariable String documento) {
        Chaveiro chaveiro = chaveiroRepository.findByDocumento(documento);
        if (chaveiro != null) {
            chaveiroRepository.deleteById(chaveiro.getId());
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
