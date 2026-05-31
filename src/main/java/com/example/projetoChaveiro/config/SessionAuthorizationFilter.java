package com.example.projetoChaveiro.config;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.projetoChaveiro.models.TipoUsuario;
import com.example.projetoChaveiro.models.Usuario;
import com.example.projetoChaveiro.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Component
public class SessionAuthorizationFilter extends OncePerRequestFilter {
    private final AuthService authService;
    private final ObjectMapper objectMapper;

    public SessionAuthorizationFilter(AuthService authService, ObjectMapper objectMapper) {
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/")
            || path.equals("/index.html")
            || path.equals("/styles.css")
            || path.equals("/script.js")
            || path.equals("/favicon.ico")
            || path.startsWith("/api/auth")
            || path.startsWith("/error");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        HttpSession session = request.getSession(false);

        if (session == null) {
            tratarNaoAutenticado(path, response);
            return;
        }

        Usuario usuario;
        try {
            usuario = authService.obterUsuarioAutenticado(session);
        } catch (Exception ex) {
            tratarNaoAutenticado(path, response);
            return;
        }

        if ("/admin.html".equals(path) && usuario.getTipoUsuario() != TipoUsuario.EMPRESA) {
            response.sendRedirect("/consulta.html");
            return;
        }

        if (path.startsWith("/api/chaveiros") && !HttpMethod.GET.matches(request.getMethod())
            && usuario.getTipoUsuario() != TipoUsuario.EMPRESA) {
            escreverJson(response, HttpServletResponse.SC_FORBIDDEN, "Apenas usuarios empresa podem acessar esta funcionalidade.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void tratarNaoAutenticado(String path, HttpServletResponse response) throws IOException {
        if (path.startsWith("/api/")) {
            escreverJson(response, HttpServletResponse.SC_UNAUTHORIZED, "Sessao expirada. Faca login novamente.");
            return;
        }
        response.sendRedirect("/index.html");
    }

    private void escreverJson(HttpServletResponse response, int status, String mensagem) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), Map.of("message", mensagem));
    }
}
