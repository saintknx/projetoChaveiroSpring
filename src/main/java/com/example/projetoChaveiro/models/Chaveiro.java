package com.example.projetoChaveiro.models;

import jakarta.persistence.Column;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chaveiros")
public class Chaveiro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String documento;

    @Column(nullable = false)
    private String nome;

    @Column(name = "empresa_usuario_id")
    private Long empresaUsuarioId;

    private String telefone;
    private String cidade;
    private String chavePix;
    private String status;
    private String observacao;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "chaveiro_tipos_trabalho", joinColumns = @JoinColumn(name = "chaveiro_id"))
    @Column(name = "tipo_trabalho", nullable = false)
    private List<String> tiposTrabalho = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDocumento() {
        return documento;
    }

    public void setDocumento(String documento) {
        this.documento = documento;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Long getEmpresaUsuarioId() {
        return empresaUsuarioId;
    }

    public void setEmpresaUsuarioId(Long empresaUsuarioId) {
        this.empresaUsuarioId = empresaUsuarioId;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getChavePix() {
        return chavePix;
    }

    public void setChavePix(String chavePix) {
        this.chavePix = chavePix;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public List<String> getTiposTrabalho() {
        return tiposTrabalho;
    }

    public void setTiposTrabalho(List<String> tiposTrabalho) {
        this.tiposTrabalho = tiposTrabalho;
    }
}
