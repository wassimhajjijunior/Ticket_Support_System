package com.support_tickets.demo;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowIT {

	private static final String PASSWORD = "Password123!";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	private String username;
	private String token;

	@BeforeEach
	void setUp() throws Exception {
		username = "it_user_" + UUID.randomUUID();
		register(username);

		String loginBody = objectMapper.writeValueAsString(Map.of(
				"username", username,
				"password", PASSWORD));

		MvcResult loginResult = mockMvc.perform(post("/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(loginBody))
				.andExpect(status().isOk())
				.andReturn();

		JsonNode body = objectMapper.readTree(loginResult.getResponse().getContentAsString());
		token = body.path("token").asText(null);
	}

	@Test
	void registerCreatesUser() throws Exception {
		String freshUsername = "it_user_" + UUID.randomUUID();
		register(freshUsername);
	}

	@Test
	void loginReturnsNonEmptyToken() {
		assertNotNull(token);
		assertFalse(token.isBlank());
	}

	@Test
	void myTicketsWithoutTokenReturns401() throws Exception {
		mockMvc.perform(get("/ticket/myTickets"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void myTicketsWithTokenReturns200() throws Exception {
		mockMvc.perform(get("/ticket/myTickets")
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isArray());
	}

	private void register(String name) throws Exception {
		Map<String, String> payload = new HashMap<>();
		payload.put("username", name);
		payload.put("email", name + "@example.com");
		payload.put("password", PASSWORD);
		payload.put("phone", "00000000");

		mockMvc.perform(post("/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(payload)))
				.andExpect(status().isOk());
	}
}
