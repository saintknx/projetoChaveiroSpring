package com.example.projetoChaveiro.models;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;


@Entity
public class Pessoa {
					@Id
					@GeneratedValue(strategy = GenerationType.IDENTITY)
					private Long id;
					@Column(unique = true)
					private String cpf;
					private String nome;

// getters e setters
public Long getId() { return id; }
public void setId(Long id) { this.id = id; }
public String getCpf() { return cpf; }
public void setCpf(String cpf) { this.cpf = cpf; }
public String getNome() { return nome; }
public void setNome(String nome) { this.nome = nome; }
}