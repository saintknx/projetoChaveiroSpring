package com.example.projetoChaveiro.controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.projetoChaveiro.models.Pessoa;
import com.example.projetoChaveiro.repository.PessoaRepository;


@RestController
@RequestMapping("/api/pessoas")
public class PessoaController {
	@Autowired
	private PessoaRepository pessoaRepository;
	@PostMapping
	public Pessoa salvar(@RequestBody Pessoa pessoa) {
		return pessoaRepository.save(pessoa);
}
	// Listar todas
	@GetMapping
	public Iterable<Pessoa> listar() {
		return pessoaRepository.findAll();
	}
	// Consultar por CPF
	@GetMapping("/{cpf}")
	public Pessoa buscarPorCpf(@PathVariable String cpf) {
	    return pessoaRepository.findByCpf(cpf);
	}
	// Alterar
	@PutMapping("/{cpf}")
	public Pessoa atualizar(@PathVariable String cpf, @RequestBody Pessoa pessoa) {
	pessoa.setCpf(cpf);
		return pessoaRepository.save(pessoa);
	}
	// Excluir
	@DeleteMapping("/{cpf}")
	public void deletar(@PathVariable String cpf) {
		Pessoa pessoa = pessoaRepository.findByCpf(cpf);
		if (pessoa != null) pessoaRepository.deleteById(pessoa.getId());
	}
	}