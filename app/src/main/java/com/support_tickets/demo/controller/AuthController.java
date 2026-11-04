package com.support_tickets.demo.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.support_tickets.demo.dto.JwtResponse;
import com.support_tickets.demo.dto.LoginRequest;
import com.support_tickets.demo.dto.UserRegisterDto;
import com.support_tickets.demo.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	public String register(@Valid @RequestBody UserRegisterDto userDto) {
		return authService.register(userDto);
	}

	@PostMapping("/login")
	public JwtResponse login(@Valid @RequestBody LoginRequest loginRequest) {
		return authService.login(loginRequest);
	}
}
