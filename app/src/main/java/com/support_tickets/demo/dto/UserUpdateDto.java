package com.support_tickets.demo.dto;

import com.support_tickets.demo.entity.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserUpdateDto {

	@NotBlank(message = "username must not be blank")
	@Size(max = 255, message = "username must be at most 255 characters")
	private String username;

	@NotBlank(message = "email must not be blank")
	@Email(message = "email must be valid")
	@Size(max = 255, message = "email must be at most 255 characters")
	private String email;

	@Size(max = 30, message = "phone must be at most 30 characters")
	private String phone;

	private Role role;
}
