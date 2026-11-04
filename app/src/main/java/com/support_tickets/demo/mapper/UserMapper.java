package com.support_tickets.demo.mapper;
import org.springframework.stereotype.Component;
import com.support_tickets.demo.dto.UserDto;
import com.support_tickets.demo.entity.User;

@Component
public class UserMapper {
	
	public UserDto toDto(User user) {
		if (user == null) {
			return null;
		}
		return new UserDto(
				user.getId(),
				user.getUsername(),
				user.getEmail(),
				user.getRole(),
				user.getPhone(),
				user.getProfileImagePath()
				);
	}

}
