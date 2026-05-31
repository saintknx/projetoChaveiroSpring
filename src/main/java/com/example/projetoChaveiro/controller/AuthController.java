package com.example.projetoChaveiro.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.projetoChaveiro.dto.AuthRequest;
import com.example.projetoChaveiro.dto.AuthResponse;
import com.example.projetoChaveiro.dto.RegisterRequest;
import com.example.projetoChaveiro.service.AuthService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse cadastrar(@RequestBody RegisterRequest request, HttpSession session) {
        return authService.cadastrar(request, session);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request, HttpSession session) {
        return authService.login(request, session);
    }

    @GetMapping("/me")
    public AuthResponse me(HttpSession session) {
        return authService.obterSessao(session);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        authService.logout(session);
        return ResponseEntity.noContent().build();
    }
}
