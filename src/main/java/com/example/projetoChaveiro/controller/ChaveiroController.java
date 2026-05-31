package com.example.projetoChaveiro.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.projetoChaveiro.dto.TipoTrabalhoOptionResponse;
import com.example.projetoChaveiro.models.Chaveiro;
import com.example.projetoChaveiro.models.Usuario;
import com.example.projetoChaveiro.service.AuthService;
import com.example.projetoChaveiro.service.ChaveiroService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/chaveiros")
public class ChaveiroController {
    private final ChaveiroService chaveiroService;
    private final AuthService authService;

    public ChaveiroController(ChaveiroService chaveiroService, AuthService authService) {
        this.chaveiroService = chaveiroService;
        this.authService = authService;
    }

    @PostMapping
    public Chaveiro salvar(@RequestBody Chaveiro chaveiro, HttpSession session) {
        authService.exigirEmpresa(session);
        Usuario usuario = authService.obterUsuarioAutenticado(session);
        preencherDadosEmpresa(chaveiro, usuario);
        return chaveiroService.criar(chaveiro, usuario);
    }

    @GetMapping
    public List<Chaveiro> listar(HttpSession session) {
        authService.obterUsuarioAutenticado(session);
        return chaveiroService.listar();
    }

    @GetMapping("/meus")
    public List<Chaveiro> listarMeusCadastros(HttpSession session) {
        Usuario usuario = authService.obterUsuarioAutenticado(session);
        authService.exigirEmpresa(session);
        return chaveiroService.listarPorEmpresa(usuario.getId());
    }

    @GetMapping("/tipos-trabalho")
    public List<TipoTrabalhoOptionResponse> listarTiposTrabalho(HttpSession session) {
        authService.obterUsuarioAutenticado(session);
        return chaveiroService.listarTiposTrabalho();
    }

    @GetMapping("/busca")
    public Chaveiro buscarParaConsulta(
        @RequestParam(required = false) String documento,
        @RequestParam(required = false) String chavePix,
        HttpSession session
    ) {
        authService.obterUsuarioAutenticado(session);
        return chaveiroService.buscarParaConsulta(documento, chavePix);
    }

    @GetMapping("/{documento}")
    public ResponseEntity<Chaveiro> buscarPorDocumento(@PathVariable String documento, HttpSession session) {
        authService.obterUsuarioAutenticado(session);
        return ResponseEntity.ok(chaveiroService.buscarPorDocumento(documento));
    }

    @PutMapping("/id/{id}")
    public Chaveiro atualizar(@PathVariable Long id, @RequestBody Chaveiro chaveiro, HttpSession session) {
        authService.exigirEmpresa(session);
        Usuario usuario = authService.obterUsuarioAutenticado(session);
        preencherDadosEmpresa(chaveiro, usuario);
        return chaveiroService.atualizar(id, chaveiro, usuario);
    }

    @DeleteMapping("/id/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id, HttpSession session) {
        authService.exigirEmpresa(session);
        chaveiroService.deletar(id, authService.obterUsuarioAutenticado(session));
        return ResponseEntity.noContent().build();
    }

    private void preencherDadosEmpresa(Chaveiro chaveiro, Usuario usuario) {
        chaveiro.setDocumento(usuario.getCnpj());
        chaveiro.setNome(usuario.getNome());
    }
}
