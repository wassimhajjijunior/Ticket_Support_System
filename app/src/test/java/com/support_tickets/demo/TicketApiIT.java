package com.support_tickets.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import com.support_tickets.demo.entity.Project;
import com.support_tickets.demo.entity.Role;
import com.support_tickets.demo.entity.User;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TicketApiIT extends ApiTestSupport {

	@Test
	void createReturnsEnrichedTicketDto() throws Exception {
		String username = registerThroughApi();
		String token = login(username);
		Project project = createProjectEntity();

		MvcResult result = createTicket(token, "Printer on fire", project.getId());

		JsonNode body = json(result);
		assertThat(body.path("id").isNull()).isFalse();
		assertThat(body.path("title").asText()).isEqualTo("Printer on fire");
		assertThat(body.path("description").asText()).isEqualTo("integration test ticket");
		assertThat(body.path("status").asText()).isEqualTo("OPEN");
		assertThat(body.path("priority").asText()).isEqualTo("HIGH");
		assertThat(body.path("projectId").asLong()).isEqualTo(project.getId());
		assertThat(body.path("projectName").asText()).isEqualTo(project.getName());
		assertThat(body.path("createdById").isNull()).isFalse();
		assertThat(body.path("createdByName").asText()).isEqualTo(username);
		assertThat(body.path("commentCount").asLong()).isZero();
		assertThat(body.path("createdAt").isNull()).isFalse();
	}

	@Test
	void createWithInvalidPriorityReturns400() throws Exception {
		String token = registerAndLogin();
		Project project = createProjectEntity();

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("title", "bad priority");
		body.put("description", "desc");
		body.put("priority", "SUPER_URGENT");
		body.put("projectId", project.getId());

		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
						.post("/ticket/create")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400));
	}

	@Test
	void statusTransitionReturnsUpdatedTicket() throws Exception {
		String token = registerAndLogin();
		Project project = createProjectEntity();
		long id = createTicketId(token, "Needs status", project.getId());

		mockMvc.perform(patch("/ticket/" + id + "/status")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content("{\"status\":\"EXECUTED\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(id))
				.andExpect(jsonPath("$.status").value("EXECUTED"));
	}

	@Test
	void invalidStatusTransitionReturns400() throws Exception {
		String token = registerAndLogin();
		Project project = createProjectEntity();
		long id = createTicketId(token, "Bad status", project.getId());

		mockMvc.perform(patch("/ticket/" + id + "/status")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content("{\"status\":\"DONE\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.message").exists());
	}

	@Test
	void assignAndUnassign() throws Exception {
		String token = registerAndLogin();
		Project project = createProjectEntity();
		long id = createTicketId(token, "Assign me", project.getId());
		User agent = createUserEntity(unique("agent"), Role.AGENT);

		mockMvc.perform(patch("/ticket/" + id + "/assign")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content("{\"assigneeId\":" + agent.getId() + "}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.assignedToId").value(agent.getId()))
				.andExpect(jsonPath("$.assignedToName").value(agent.getUsername()));

		mockMvc.perform(patch("/ticket/" + id + "/assign")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content("{\"assigneeId\":null}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.assignedToId").doesNotExist())
				.andExpect(jsonPath("$.assignedToName").doesNotExist());
	}

	@Test
	void assignToNonAgentReturns400() throws Exception {
		String token = registerAndLogin();
		Project project = createProjectEntity();
		long id = createTicketId(token, "Assign to user", project.getId());
		User plainUser = createUserEntity(unique("plain"), Role.USER);

		mockMvc.perform(patch("/ticket/" + id + "/assign")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content("{\"assigneeId\":" + plainUser.getId() + "}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400));
	}

	@Test
	void assignToMissingUserReturns404() throws Exception {
		String token = registerAndLogin();
		Project project = createProjectEntity();
		long id = createTicketId(token, "Assign to ghost", project.getId());

		mockMvc.perform(patch("/ticket/" + id + "/assign")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content("{\"assigneeId\":9999999}"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.status").value(404));
	}

	@Test
	void deleteReturns204ThenDetailsReturns404() throws Exception {
		String token = registerAndLogin();
		Project project = createProjectEntity();
		long id = createTicketId(token, "Delete me", project.getId());

		mockMvc.perform(delete("/ticket/DeleteTicket/" + id)
						.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/ticket/TicketDetails/" + id)
						.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.status").value(404))
				.andExpect(jsonPath("$.error").value("Not Found"))
				.andExpect(jsonPath("$.message").value("Ticket " + id + " not found"))
				.andExpect(jsonPath("$.path").value("/ticket/TicketDetails/" + id))
				.andExpect(jsonPath("$.timestamp").exists());
	}

	@Test
	void myTicketsIncludesTicketsAssignedToMe() throws Exception {
		String creatorUsername = registerThroughApi();
		String creatorToken = login(creatorUsername);
		Project project = createProjectEntity();
		long id = createTicketId(creatorToken, "Assigned to me", project.getId());

		User agent = createUserEntity(unique("agent"), Role.AGENT);
		String agentToken = login(agent.getUsername());

		mockMvc.perform(patch("/ticket/" + id + "/assign")
						.header(HttpHeaders.AUTHORIZATION, bearer(creatorToken))
						.contentType(JSON)
						.content("{\"assigneeId\":" + agent.getId() + "}"))
				.andExpect(status().isOk());

		mockMvc.perform(get("/ticket/myTickets")
						.header(HttpHeaders.AUTHORIZATION, bearer(agentToken)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[?(@.id == " + id + ")]").exists());
	}

	@Test
	void allTicketsReturnsEnrichedList() throws Exception {
		String token = registerAndLogin();
		Project project = createProjectEntity();
		long id = createTicketId(token, "Listed ticket", project.getId());

		mockMvc.perform(get("/ticket/allTickets")
						.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isArray())
				.andExpect(jsonPath("$[?(@.id == " + id + ")].projectName").exists())
				.andExpect(jsonPath("$[?(@.id == " + id + ")].createdByName").exists());
	}
}
