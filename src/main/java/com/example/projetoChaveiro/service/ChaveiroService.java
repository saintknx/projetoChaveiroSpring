package com.example.projetoChaveiro.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.projetoChaveiro.dto.TipoTrabalhoOptionResponse;
import com.example.projetoChaveiro.models.Chaveiro;
import com.example.projetoChaveiro.models.TipoTrabalho;
import com.example.projetoChaveiro.models.Usuario;
import com.example.projetoChaveiro.repository.ChaveiroRepository;

@Service
public class ChaveiroService {
    private static final Set<String> STATUS_VALIDOS = Set.of("NAO_VERIFICADO", "VERIFICADO", "SUSPEITO");
    private static final int LIMITE_CADASTROS_POR_EMPRESA = 3;

    private final ChaveiroRepository chaveiroRepository;

    public ChaveiroService(ChaveiroRepository chaveiroRepository) {
        this.chaveiroRepository = chaveiroRepository;
    }

    public Chaveiro criar(Chaveiro chaveiro, Usuario usuarioEmpresa) {
        if (chaveiroRepository.countByEmpresaUsuarioId(usuarioEmpresa.getId()) >= LIMITE_CADASTROS_POR_EMPRESA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voce ja fez 3 cadastros.");
        }

        chaveiro.setEmpresaUsuarioId(usuarioEmpresa.getId());
        normalizarEValidar(chaveiro);
        return chaveiroRepository.save(chaveiro);
    }

    public List<Chaveiro> listar() {
        return chaveiroRepository.findAllByOrderByNomeAsc();
    }

    public List<Chaveiro> listarPorEmpresa(Long empresaUsuarioId) {
        return chaveiroRepository.findAllByEmpresaUsuarioIdOrderByIdDesc(empresaUsuarioId);
    }

    public Chaveiro buscarPorDocumento(String documento) {
        Chaveiro chaveiro = chaveiroRepository.findFirstByDocumentoOrderByIdDesc(apenasNumeros(documento));
        if (chaveiro == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chaveiro nao encontrado.");
        }
        return chaveiro;
    }

    public Chaveiro buscarParaConsulta(String documento, String chavePix) {
        String documentoNormalizado = apenasNumeros(documento);
        String chavePixNormalizada = normalizarTexto(chavePix);

        if (!documentoNormalizado.isEmpty()) {
            Chaveiro chaveiro = chaveiroRepository.findFirstByDocumentoOrderByIdDesc(documentoNormalizado);
            if (chaveiro != null) {
                return chaveiro;
            }
        }

        if (!chavePixNormalizada.isEmpty()) {
            Chaveiro chaveiro = chaveiroRepository.findFirstByChavePixIgnoreCase(chavePixNormalizada);
            if (chaveiro != null) {
                return chaveiro;
            }
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum chaveiro encontrado com os dados informados.");
    }

    public Chaveiro atualizar(Long id, Chaveiro chaveiro, Usuario usuarioEmpresa) {
        Chaveiro existente = buscarCadastroDaEmpresa(id, usuarioEmpresa.getId());
        chaveiro.setId(existente.getId());
        chaveiro.setEmpresaUsuarioId(usuarioEmpresa.getId());
        normalizarEValidar(chaveiro);
        return chaveiroRepository.save(chaveiro);
    }

    public void deletar(Long id, Usuario usuarioEmpresa) {
        Chaveiro chaveiro = buscarCadastroDaEmpresa(id, usuarioEmpresa.getId());
        chaveiroRepository.deleteById(chaveiro.getId());
    }

    public Chaveiro buscarCadastroDaEmpresa(Long id, Long empresaUsuarioId) {
        Chaveiro existente = chaveiroRepository.findById(id).orElse(null);
        if (existente == null || !empresaUsuarioId.equals(existente.getEmpresaUsuarioId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cadastro nao encontrado para esta empresa.");
        }
        return existente;
    }

    public List<TipoTrabalhoOptionResponse> listarTiposTrabalho() {
        return TipoTrabalho.listar().stream()
            .map(tipo -> new TipoTrabalhoOptionResponse(tipo.getCodigo(), tipo.getDescricao()))
            .toList();
    }

    private void normalizarEValidar(Chaveiro chaveiro) {
        String documento = apenasNumeros(chaveiro.getDocumento());
        if (documento.length() != 11 && documento.length() != 14) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Documento invalido. Informe um CPF com 11 numeros ou CNPJ com 14 numeros.");
        }

        String nome = normalizarTexto(chaveiro.getNome());
        if (nome.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o nome do chaveiro.");
        }

        String telefone = apenasNumeros(chaveiro.getTelefone());
        if (!telefone.isEmpty() && telefone.length() != 10 && telefone.length() != 11) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone invalido. Informe DDD + numero.");
        }

        String status = normalizarTexto(chaveiro.getStatus());
        if (status.isEmpty()) {
            status = "NAO_VERIFICADO";
        }
        if (!STATUS_VALIDOS.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status invalido.");
        }

        List<String> tiposTrabalho = normalizarTiposTrabalho(chaveiro.getTiposTrabalho());

        chaveiro.setDocumento(documento);
        chaveiro.setNome(nome);
        chaveiro.setTelefone(telefone);
        chaveiro.setCidade(normalizarTexto(chaveiro.getCidade()));
        chaveiro.setChavePix(normalizarTexto(chaveiro.getChavePix()));
        chaveiro.setStatus(status);
        chaveiro.setObservacao(normalizarTexto(chaveiro.getObservacao()));
        chaveiro.setTiposTrabalho(tiposTrabalho);
    }

    private List<String> normalizarTiposTrabalho(List<String> tiposTrabalho) {
        if (tiposTrabalho == null || tiposTrabalho.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione ao menos um tipo de trabalho.");
        }

        Set<String> tiposUnicos = new LinkedHashSet<>();
        for (String tipo : tiposTrabalho) {
            String codigo = normalizarTexto(tipo).toUpperCase();
            if (!TipoTrabalho.codigoValido(codigo)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de trabalho invalido.");
            }
            tiposUnicos.add(codigo);
        }

        if (tiposUnicos.size() != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione somente 1 tipo de trabalho.");
        }

        return new ArrayList<>(tiposUnicos);
    }

    private String normalizarTexto(String valor) {
        return valor == null ? "" : valor.trim();
    }

    private String apenasNumeros(String valor) {
        return valor == null ? "" : valor.replaceAll("\\D", "");
    }
}
