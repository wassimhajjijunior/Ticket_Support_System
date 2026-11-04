package com.support_tickets.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class CommentApiIT extends ApiTestSupport {

	@Test
	void addAndListComments() throws Exception {
		String username = registerThroughApi();
		String token = login(username);
		Project project = createProjectEntity();
		long ticketId = createTicketId(token, "Commentable", project.getId());

		MvcResult created = mockMvc.perform(post("/ticket/" + ticketId + "/comments")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content("{\"content\":\"First comment\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.ticketId").value(ticketId))
				.andExpect(jsonPath("$.content").value("First comment"))
				.andExpect(jsonPath("$.authorName").value(username))
				.andExpect(jsonPath("$.createdAt").exists())
				.andReturn();
		assertThat(json(created).path("authorId").isNull()).isFalse();

		mockMvc.perform(post("/ticket/" + ticketId + "/comments")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content("{\"content\":\"Second comment\"}"))
				.andExpect(status().isCreated());

		MvcResult list = mockMvc.perform(get("/ticket/" + ticketId + "/comments")
						.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(2))
				.andReturn();

		JsonNode comments = json(list);
		assertThat(comments.get(0).path("content").asText()).isEqualTo("First comment");
		assertThat(comments.get(1).path("content").asText()).isEqualTo("Second comment");

		mockMvc.perform(get("/ticket/TicketDetails/" + ticketId)
						.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.commentCount").value(2));
	}

	@Test
	void blankContentReturns400() throws Exception {
		String token = registerAndLogin();
		Project project = createProjectEntity();
		long ticketId = createTicketId(token, "Blank comment", project.getId());

		mockMvc.perform(post("/ticket/" + ticketId + "/comments")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content("{\"content\":\"   \"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400));
	}

	@Test
	void missingContentReturns400() throws Exception {
		String token = registerAndLogin();
		Project project = createProjectEntity();
		long ticketId = createTicketId(token, "No content", project.getId());

		mockMvc.perform(post("/ticket/" + ticketId + "/comments")
						.header(HttpHeaders.AUTHORIZATION, bearer(token))
						.contentType(JSON)
						.content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400));
	}

	@Test
	void commentsForMissingTicketReturns404() throws Exception {
		String token = registerAndLogin();

		mockMvc.perform(get("/ticket/9999999/comments")
						.header(HttpHeaders.AUTHORIZATION, bearer(token)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.status").value(404));
	}
}
