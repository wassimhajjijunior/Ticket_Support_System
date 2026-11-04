package com.support_tickets.demo.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.support_tickets.demo.dto.CreateUserDto;
import com.support_tickets.demo.dto.UserDto;
import com.support_tickets.demo.dto.UserUpdateDto;
import com.support_tickets.demo.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/user")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping("/all")
	public ResponseEntity<List<UserDto>> getAllUsers() {
		return ResponseEntity.ok(userService.getAllUsers());
	}

	@GetMapping("/me")
	public ResponseEntity<UserDto> getCurrentUser() {
		return ResponseEntity.ok(userService.getCurrentUser());
	}

	@GetMapping("/agents")
	public ResponseEntity<List<UserDto>> getAgents() {
		return ResponseEntity.ok(userService.getAgents());
	}

	@GetMapping("/{name}")
	public ResponseEntity<UserDto> getUserByName(@PathVariable String name) {
		return ResponseEntity.ok(userService.getUserByName(name));
	}

	@PutMapping("/{id}")
	public ResponseEntity<UserDto> updateUser(@PathVariable Long id,
			@Valid @RequestBody UserUpdateDto userDto) {
		return ResponseEntity.ok(userService.updateUser(id, userDto));
	}

	@PostMapping("/admin/createUser")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<UserDto> createAgent(@Valid @RequestBody CreateUserDto dto) {
		return ResponseEntity.ok(userService.createUserByAdmin(dto));
	}
}
