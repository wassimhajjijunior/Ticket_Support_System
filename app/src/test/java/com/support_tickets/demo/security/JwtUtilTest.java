package com.support_tickets.demo.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import io.jsonwebtoken.ExpiredJwtException;

class JwtUtilTest {

	private static final String SECRET = "0123456789abcdef0123456789abcdef";
	private static final long EXPIRATION_MS = 3_600_000L;

	private final JwtUtil jwtUtil = new JwtUtil(SECRET, EXPIRATION_MS);

	@Test
	void generateThenParseReturnsSubject() {
		UserDetails user = User.withUsername("alice")
				.password("irrelevant")
				.authorities("ROLE_USER")
				.build();

		String token = jwtUtil.generateToken(user);

		assertNotNull(token);
		assertFalse(token.isBlank());
		assertEquals("alice", jwtUtil.getUsernameFromToken(token));
		assertTrue(jwtUtil.validateToken(token));
	}

	@Test
	void expiredTokenThrows() {
		JwtUtil expiredJwtUtil = new JwtUtil(SECRET, -1_000L);
		UserDetails user = User.withUsername("alice")
				.password("irrelevant")
				.authorities("ROLE_USER")
				.build();

		String expiredToken = expiredJwtUtil.generateToken(user);

		assertThrows(ExpiredJwtException.class, () -> jwtUtil.getUsernameFromToken(expiredToken));
		assertFalse(jwtUtil.validateToken(expiredToken));
	}

	@Test
	void rejectsSecretShorterThan32Bytes() {
		assertThrows(IllegalStateException.class, () -> new JwtUtil("too-short", EXPIRATION_MS));
	}
}
