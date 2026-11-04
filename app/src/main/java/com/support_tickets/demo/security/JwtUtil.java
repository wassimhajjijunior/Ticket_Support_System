package com.support_tickets.demo.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

	private static final int MIN_HS256_KEY_BYTES = 32;

	private final SecretKey key;
	private final long expirationMs;

	public JwtUtil(
			@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.expiration-ms}") long expirationMs) {
		byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
		if (keyBytes.length < MIN_HS256_KEY_BYTES) {
			throw new IllegalStateException(
					"app.jwt.secret must be at least " + MIN_HS256_KEY_BYTES + " bytes for HS256");
		}
		this.key = Keys.hmacShaKeyFor(keyBytes);
		this.expirationMs = expirationMs;
	}

	public String generateToken(UserDetails userDetails) {
		Date now = new Date();
		return Jwts.builder()
				.subject(userDetails.getUsername())
				.issuedAt(now)
				.expiration(new Date(now.getTime() + expirationMs))
				.signWith(key)
				.compact();
	}

	public String getUsernameFromToken(String token) {
		return Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload()
				.getSubject();
	}

	public boolean validateToken(String token) {
		try {
			getUsernameFromToken(token);
			return true;
		} catch (JwtException | IllegalArgumentException e) {
			return false;
		}
	}
}
