package com.support_tickets.demo;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.support_tickets.demo.entity.Project;
import com.support_tickets.demo.entity.Role;
import com.support_tickets.demo.entity.User;
import com.support_tickets.demo.repository.ProjectRepository;
import com.support_tickets.demo.repository.UserRepository;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

abstract class ApiTestSupport {

	protected static final String PASSWORD = "Password123!";
	protected static final MediaType JSON = MediaType.APPLICATION_JSON;

	@Autowired
	protected MockMvc mockMvc;

	@Autowired
	protected ObjectMapper objectMapper;

	@Autowired
	protected UserRepository userRepository;

	@Autowired
	protected ProjectRepository projectRepository;

	@Autowired
	protected PasswordEncoder passwordEncoder;

	protected String unique(String prefix) {
		return prefix + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
	}

	protected User createUserEntity(String username, Role role) {
		return userRepository.save(User.builder()
				.username(username)
				.email(username + "@example.com")
				.password(passwordEncoder.encode(PASSWORD))
				.role(role)
				.phone("00000000")
				.build());
	}

	protected String registerThroughApi() throws Exception {
		String username = unique("user");
		Map<String, String> payload = new LinkedHashMap<>();
		payload.put("username", username);
		payload.put("email", username + "@example.com");
		payload.put("password", PASSWORD);
		payload.put("phone", "00000000");

		mockMvc.perform(post("/auth/register")
						.contentType(JSON)
						.content(objectMapper.writeValueAsString(payload)))
				.andExpect(status().isOk());
		return username;
	}

	protected String login(String username) throws Exception {
		MvcResult result = mockMvc.perform(post("/auth/login")
						.contentType(JSON)
						.content(objectMapper.writeValueAsString(Map.of(
								"username", username,
								"password", PASSWORD))))
				.andExpect(status().isOk())
				.andReturn();
		return json(result).path("token").asText();
	}

	protected String registerAndLogin() throws Exception {
		return login(registerThroughApi());
	}

	protected Project createProjectEntity() {
		return projectRepository.save(Project.builder().name(unique("project")).build());
	}

	protected MvcResult createTicket(String token, String title, Long projectId) throws Exception {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("title", title);
		body.put("description", "integration test ticket");
		body.put("priority", "high");
		body.put("projectId", projectId);

		return mockMvc.perform(post("/ticket/create")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isCreated())
				.andReturn();
	}

	protected long createTicketId(String token, String title, Long projectId) throws Exception {
		return json(createTicket(token, title, projectId)).path("id").asLong();
	}

	protected JsonNode json(MvcResult result) throws Exception {
		return objectMapper.readTree(result.getResponse().getContentAsString());
	}

	protected String bearer(String token) {
		return "Bearer " + token;
	}
}
