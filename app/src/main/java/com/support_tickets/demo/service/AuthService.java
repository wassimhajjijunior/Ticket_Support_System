package com.support_tickets.demo.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.support_tickets.demo.dto.JwtResponse;
import com.support_tickets.demo.dto.LoginRequest;
import com.support_tickets.demo.dto.UserRegisterDto;
import com.support_tickets.demo.entity.Role;
import com.support_tickets.demo.entity.User;
import com.support_tickets.demo.exception.DuplicateResourceException;
import com.support_tickets.demo.repository.UserRepository;
import com.support_tickets.demo.security.JwtUtil;

@Service
public class AuthService {

	private final AuthenticationManager authenticationManager;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtUtil jwtUtil;

	public AuthService(AuthenticationManager authenticationManager,
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			JwtUtil jwtUtil) {
		this.authenticationManager = authenticationManager;
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtUtil = jwtUtil;
	}

	@Transactional
	public String register(UserRegisterDto userDto) {
		if (userRepository.existsByUsername(userDto.getUsername())) {
			throw new DuplicateResourceException(
					"Username '" + userDto.getUsername() + "' is already taken");
		}
		if (userRepository.existsByEmail(userDto.getEmail())) {
			throw new DuplicateResourceException(
					"Email '" + userDto.getEmail() + "' is already registered");
		}

		User user = new User();
		user.setUsername(userDto.getUsername());
		user.setEmail(userDto.getEmail());
		user.setPassword(passwordEncoder.encode(userDto.getPassword()));
		user.setPhone(userDto.getPhone());
		user.setProfileImagePath(userDto.getProfileImagePath());
		user.setRole(Role.USER);

		userRepository.save(user);
		return "User Registered Successfully";
	}

	public JwtResponse login(LoginRequest loginRequest) {
		Authentication authentication = authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(
						loginRequest.getUsername(),
						loginRequest.getPassword()));

		SecurityContextHolder.getContext().setAuthentication(authentication);
		UserDetails userDetails = (UserDetails) authentication.getPrincipal();
		String token = jwtUtil.generateToken(userDetails);
		return new JwtResponse(token);
	}
}
