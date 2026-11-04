package com.support_tickets.demo.dto;

import com.support_tickets.demo.entity.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateUserDto {

	@NotBlank(message = "username must not be blank")
	@Size(max = 255, message = "username must be at most 255 characters")
	private String username;

	@NotBlank(message = "email must not be blank")
	@Email(message = "email must be valid")
	@Size(max = 255, message = "email must be at most 255 characters")
	private String email;

	@NotBlank(message = "password must not be blank")
	@Size(min = 6, max = 255, message = "password must be between 6 and 255 characters")
	private String password;

	@NotNull(message = "role is required")
	private Role role;

	@Size(max = 30, message = "phone must be at most 30 characters")
	private String phone;

	private String profileImagePath;

}
