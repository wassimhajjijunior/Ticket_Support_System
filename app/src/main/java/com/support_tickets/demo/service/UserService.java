package com.support_tickets.demo.service;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.support_tickets.demo.dto.CreateUserDto;
import com.support_tickets.demo.dto.UserDto;
import com.support_tickets.demo.dto.UserUpdateDto;
import com.support_tickets.demo.entity.Role;
import com.support_tickets.demo.entity.User;
import com.support_tickets.demo.exception.DuplicateResourceException;
import com.support_tickets.demo.exception.EntityNotFoundException;
import com.support_tickets.demo.mapper.UserMapper;
import com.support_tickets.demo.repository.UserRepository;
import com.support_tickets.demo.security.SecurityUtil;

@Service
public class UserService implements UserServiceInt {

	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;
	private final SecurityUtil securityUtil;

	public UserService(UserRepository userRepository,
			UserMapper userMapper,
			PasswordEncoder passwordEncoder,
			SecurityUtil securityUtil) {
		this.userRepository = userRepository;
		this.userMapper = userMapper;
		this.passwordEncoder = passwordEncoder;
		this.securityUtil = securityUtil;
	}

	@Override
	@Transactional(readOnly = true)
	public List<UserDto> getAllUsers() {
		return userRepository.findAll().stream()
				.map(userMapper::toDto)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public UserDto getUserByName(String name) {
		User user = userRepository.findByUsername(name);
		if (user == null) {
			throw new EntityNotFoundException("User " + name + " not found");
		}
		return userMapper.toDto(user);
	}

	@Override
	@Transactional
	public UserDto updateUser(Long id, UserUpdateDto userDto) {
		User caller = securityUtil.getCurrentUser();
		boolean admin = caller.getRole() == Role.ADMIN;

		if (!admin && !caller.getId().equals(id)) {
			throw new AccessDeniedException("You may only update your own profile");
		}

		User existing = userRepository.findById(id)
				.orElseThrow(() -> new EntityNotFoundException("User " + id + " not found"));

		User sameUsername = userRepository.findByUsername(userDto.getUsername());
		if (sameUsername != null && !sameUsername.getId().equals(id)) {
			throw new DuplicateResourceException("Username '" + userDto.getUsername() + "' is already taken");
		}

		existing.setUsername(userDto.getUsername());
		existing.setEmail(userDto.getEmail());
		existing.setPhone(userDto.getPhone());

		if (admin && userDto.getRole() != null) {
			existing.setRole(userDto.getRole());
		}

		return userMapper.toDto(userRepository.save(existing));
	}

	@Override
	@Transactional
	public void deleteUser(Long id) {
		userRepository.deleteById(id);
	}

	@Override
	@Transactional
	public UserDto createUserByAdmin(CreateUserDto dto) {
		if (userRepository.existsByUsername(dto.getUsername())) {
			throw new DuplicateResourceException("Username '" + dto.getUsername() + "' is already taken");
		}
		if (userRepository.existsByEmail(dto.getEmail())) {
			throw new DuplicateResourceException("Email '" + dto.getEmail() + "' is already registered");
		}

		User user = new User();
		user.setUsername(dto.getUsername());
		user.setEmail(dto.getEmail());
		user.setPassword(passwordEncoder.encode(dto.getPassword()));
		user.setRole(dto.getRole());
		user.setPhone(dto.getPhone());
		user.setProfileImagePath(dto.getProfileImagePath());

		return userMapper.toDto(userRepository.save(user));
	}

	@Transactional(readOnly = true)
	public UserDto getCurrentUser() {
		return userMapper.toDto(securityUtil.getCurrentUser());
	}

	@Transactional(readOnly = true)
	public List<UserDto> getAgents() {
		return userRepository.findByRole(Role.AGENT).stream()
				.map(userMapper::toDto)
				.toList();
	}
}
