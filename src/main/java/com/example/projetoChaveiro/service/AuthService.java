package com.example.projetoChaveiro.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;
import java.util.Base64;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.projetoChaveiro.dto.AuthRequest;
import com.example.projetoChaveiro.dto.AuthResponse;
import com.example.projetoChaveiro.dto.RegisterRequest;
import com.example.projetoChaveiro.models.TipoUsuario;
import com.example.projetoChaveiro.models.Usuario;
import com.example.projetoChaveiro.repository.UsuarioRepository;

import jakarta.servlet.http.HttpSession;

@Service
public class AuthService {
    public static final String SESSION_USER_ID = "usuarioId";

    private final UsuarioRepository usuarioRepository;

    public AuthService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public AuthResponse cadastrar(RegisterRequest request, HttpSession session) {
        String nome = validarTexto(request.nome(), "Informe o nome.");
        String telefone = validarTelefone(request.telefone());
        String email = normalizarEmail(request.email());
        String senha = validarSenha(request.senha());
        TipoUsuario tipoUsuario = validarTipoUsuario(request.tipoUsuario());
        String cnpj = normalizarCnpj(request.cnpj(), tipoUsuario);

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe um usuario cadastrado com este email.");
        }

        if (tipoUsuario == TipoUsuario.EMPRESA && usuarioRepository.existsByCnpj(cnpj)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe uma empresa cadastrada com este CNPJ.");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(nome);
        usuario.setTelefone(telefone);
        usuario.setEmail(email);
        usuario.setSenhaHash(gerarHash(senha));
        usuario.setTipoUsuario(tipoUsuario);
        usuario.setCnpj(cnpj);

        Usuario salvo = usuarioRepository.save(usuario);
        registrarSessao(session, salvo);
        return toResponse(salvo);
    }

    public AuthResponse login(AuthRequest request, HttpSession session) {
        String email = normalizarEmail(request.email());
        String senha = validarTexto(request.senha(), "Informe a senha.");

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou senha invalidos."));

        if (!gerarHash(senha).equals(usuario.getSenhaHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou senha invalidos.");
        }

        registrarSessao(session, usuario);
        return toResponse(usuario);
    }

    public AuthResponse obterSessao(HttpSession session) {
        Usuario usuario = obterUsuarioAutenticado(session);
        return toResponse(usuario);
    }

    public void logout(HttpSession session) {
        session.invalidate();
    }

    public Usuario obterUsuarioAutenticado(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (!(userId instanceof Long id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessao expirada. Faca login novamente.");
        }

        Optional<Usuario> usuario = usuarioRepository.findById(id);
        if (usuario.isEmpty()) {
            session.invalidate();
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessao expirada. Faca login novamente.");
        }
        return usuario.get();
    }

    public void exigirEmpresa(HttpSession session) {
        Usuario usuario = obterUsuarioAutenticado(session);
        if (usuario.getTipoUsuario() != TipoUsuario.EMPRESA) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas usuarios empresa podem acessar esta funcionalidade.");
        }
    }

    private void registrarSessao(HttpSession session, Usuario usuario) {
        session.setAttribute(SESSION_USER_ID, usuario.getId());
    }

    private AuthResponse toResponse(Usuario usuario) {
        return new AuthResponse(
            usuario.getId(),
            usuario.getNome(),
            usuario.getTelefone(),
            usuario.getEmail(),
            usuario.getTipoUsuario().name(),
            usuario.getCnpj()
        );
    }

    private String validarTexto(String valor, String mensagem) {
        String texto = valor == null ? "" : valor.trim();
        if (texto.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensagem);
        }
        return texto;
    }

    private String validarTelefone(String telefone) {
        String numeros = apenasNumeros(validarTexto(telefone, "Informe o telefone."));
        if (numeros.length() != 10 && numeros.length() != 11) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone invalido. Informe DDD + numero.");
        }
        return numeros;
    }

    private String normalizarEmail(String email) {
        String valor = validarTexto(email, "Informe o email.").toLowerCase();
        if (!valor.contains("@") || valor.startsWith("@") || valor.endsWith("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um email valido.");
        }
        return valor;
    }

    private String validarSenha(String senha) {
        String valor = validarTexto(senha, "Informe a senha.");
        if (valor.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A senha deve ter pelo menos 6 caracteres.");
        }
        return valor;
    }

    private TipoUsuario validarTipoUsuario(String tipoUsuario) {
        try {
            return TipoUsuario.valueOf(validarTexto(tipoUsuario, "Selecione o tipo de usuario."));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de usuario invalido.");
        }
    }

    private String normalizarCnpj(String cnpj, TipoUsuario tipoUsuario) {
        if (tipoUsuario == TipoUsuario.COMUM) {
            return null;
        }

        String numeros = apenasNumeros(validarTexto(cnpj, "Informe o CNPJ da empresa."));
        if (numeros.length() != 14) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CNPJ invalido. Informe 14 numeros.");
        }
        return numeros;
    }

    private String apenasNumeros(String valor) {
        return valor == null ? "" : valor.replaceAll("\\D", "");
    }

    private String gerarHash(String senha) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(senha.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Algoritmo de hash indisponivel.", ex);
        }
    }
}
