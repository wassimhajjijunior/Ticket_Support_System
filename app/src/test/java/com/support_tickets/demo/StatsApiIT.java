package com.support_tickets.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.support_tickets.demo.entity.Project;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StatsApiIT extends ApiTestSupport {

	@Test
	void statsHasContractShape() throws Exception {
		String token = registerAndLogin();

		MvcResult result = mockMvc.perform(get("/ticket/stats")
						.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").isNumber())
				.andExpect(jsonPath("$.unassigned").isNumber())
				.andExpect(jsonPath("$.myOpen").isNumber())
				.andExpect(jsonPath("$.byStatus.PENDING").isNumber())
				.andExpect(jsonPath("$.byStatus.OPEN").isNumber())
				.andExpect(jsonPath("$.byStatus.EXECUTED").isNumber())
				.andExpect(jsonPath("$.byStatus.FINISHED").isNumber())
				.andExpect(jsonPath("$.byPriority.LOW").isNumber())
				.andExpect(jsonPath("$.byPriority.MEDIUM").isNumber())
				.andExpect(jsonPath("$.byPriority.HIGH").isNumber())
				.andExpect(jsonPath("$.byPriority.URGENT").isNumber())
				.andExpect(jsonPath("$.last7Days.length()").value(7))
				.andReturn();

		JsonNode body = json(result);
		assertThat(body.path("byStatus").size()).isEqualTo(4);
		assertThat(body.path("byPriority").size()).isEqualTo(4);
		assertThat(body.path("last7Days").get(0).path("date").isNull()).isFalse();
		assertThat(body.path("last7Days").get(0).path("created").isNumber()).isTrue();
		assertThat(body.path("last7Days").get(0).path("closed").isNumber()).isTrue();
	}

	@Test
	void countsMoveAfterCreatingTicket() throws Exception {
		String token = registerAndLogin();

		JsonNode before = json(mockMvc.perform(get("/ticket/stats")
						.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isOk())
				.andReturn());

		Project project = createProjectEntity();
		createTicketId(token, "Stats delta ticket", project.getId());

		JsonNode after = json(mockMvc.perform(get("/ticket/stats")
						.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isOk())
				.andReturn());

		assertThat(after.path("total").asLong()).isEqualTo(before.path("total").asLong() + 1);
		assertThat(after.path("byStatus").path("OPEN").asLong())
				.isEqualTo(before.path("byStatus").path("OPEN").asLong() + 1);
		assertThat(after.path("byPriority").path("HIGH").asLong())
				.isEqualTo(before.path("byPriority").path("HIGH").asLong() + 1);
		assertThat(after.path("last7Days").get(6).path("created").asLong())
				.isEqualTo(before.path("last7Days").get(6).path("created").asLong() + 1);
	}
}
