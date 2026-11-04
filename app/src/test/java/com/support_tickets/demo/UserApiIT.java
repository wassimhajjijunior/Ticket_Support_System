package com.support_tickets.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.support_tickets.demo.entity.Role;
import com.support_tickets.demo.entity.User;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserApiIT extends ApiTestSupport {

	@Test
	void meReturnsCurrentUser() throws Exception {
		String username = registerThroughApi();
		String token = login(username);

		mockMvc.perform(get("/user/me").header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value(username))
				.andExpect(jsonPath("$.role").value("USER"))
				.andExpect(jsonPath("$.password").doesNotExist());
	}

	@Test
	void agentsReturnsOnlyAgents() throws Exception {
		String agentName = unique("agent");
		createUserEntity(agentName, Role.AGENT);
		String token = registerAndLogin();

		mockMvc.perform(get("/user/agents").header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[?(@.username == '" + agentName + "')]").exists())
				.andExpect(jsonPath("$[?(@.role != 'AGENT')]").isEmpty());
	}

	@Test
	void userCannotUpdateAnotherUser() throws Exception {
		String token = registerAndLogin();
		User other = createUserEntity(unique("other"), Role.USER);

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("username", other.getUsername());
		body.put("email", other.getEmail());
		body.put("phone", "11111111");

		mockMvc.perform(put("/user/" + other.getId())
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.status").value(403))
				.andExpect(jsonPath("$.message").exists());
	}

	@Test
	void userCannotPromoteThemselves() throws Exception {
		String token = registerAndLogin();

		MvcResult meResult = mockMvc.perform(get("/user/me")
						.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isOk())
				.andReturn();
		JsonNode me = json(meResult);
		long id = me.path("id").asLong();

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("username", me.path("username").asText());
		body.put("email", me.path("email").asText());
		body.put("phone", "22222222");
		body.put("role", "ADMIN");

		MvcResult updated = mockMvc.perform(put("/user/" + id)
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.role").value("USER"))
				.andReturn();

		assertEquals("USER", json(updated).path("role").asText());

		mockMvc.perform(get("/user/me").header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.role").value("USER"));
	}

	@Test
	void nonAdminCannotCreateAdminUser() throws Exception {
		String token = registerAndLogin();
		String newUsername = unique("escalate");

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("username", newUsername);
		body.put("email", newUsername + "@example.com");
		body.put("password", PASSWORD);
		body.put("role", "ADMIN");

		mockMvc.perform(post("/user/admin/createUser")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.status").value(403))
				.andExpect(jsonPath("$.path").value("/user/admin/createUser"));

		assertTrue(userRepository.findByUsername(newUsername) == null);
	}

	@Test
	void authenticatedUserCanUpdateOwnProfile() throws Exception {		String token = registerAndLogin();

		MvcResult meResult = mockMvc.perform(get("/user/me")
						.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andReturn();
		JsonNode me = json(meResult);

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("username", me.path("username").asText());
		body.put("email", "updated_" + me.path("id").asLong() + "@example.com");
		body.put("phone", "33333333");

		mockMvc.perform(put("/user/" + me.path("id").asLong())
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.phone").value("33333333"));
	}

	@Test
	void unauthenticatedMeReturns401WithErrorBody() throws Exception {
		MvcResult result = mockMvc.perform(get("/user/me"))
				.andExpect(status().isUnauthorized())
				.andReturn();

		assertEquals(401, json(result).path("status").asInt());
		assertTrue(json(result).path("path").asText().endsWith("/user/me"));
	}
}
