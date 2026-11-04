package com.support_tickets.demo.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import com.support_tickets.demo.entity.User;
import com.support_tickets.demo.repository.UserRepository;

@Component
@RequiredArgsConstructor
public class SecurityUtil {

	private final UserRepository userRepository;

	public User getCurrentUser() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
			throw new AuthenticationCredentialsNotFoundException("Authentication required");
		}

		User user = userRepository.findByUsername(auth.getName());
		if (user == null) {
			throw new AuthenticationCredentialsNotFoundException("Authentication required");
		}
		return user;
	}
}
