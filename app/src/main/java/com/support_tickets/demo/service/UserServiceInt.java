package com.support_tickets.demo.service;

import java.util.List;

import com.support_tickets.demo.dto.CreateUserDto;
import com.support_tickets.demo.dto.UserDto;
import com.support_tickets.demo.dto.UserUpdateDto;

public interface UserServiceInt {
	List<UserDto> getAllUsers();
	UserDto getUserByName(String name);
	UserDto updateUser(Long id, UserUpdateDto userDto);
	void deleteUser(Long id);
	UserDto createUserByAdmin(CreateUserDto dto);
	UserDto getCurrentUser();
	List<UserDto> getAgents();

}
