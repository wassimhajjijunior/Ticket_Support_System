package com.support_tickets.demo.dto;

import lombok.*;
import com.support_tickets.demo.entity.Role;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
	private Long id;
	private String username;
	private String email;
	private Role role;
	private String phone;
	private String profileImagePath;
	
}
