package com.support_tickets.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FormTicketDto {

	@NotBlank(message = "title must not be blank")
	@Size(max = 255, message = "title must be at most 255 characters")
	private String title;

	@NotBlank(message = "description must not be blank")
	@Size(max = 10000, message = "description must be at most 10000 characters")
	private String description;

	@NotBlank(message = "priority must not be blank")
	private String priority;

	@NotNull(message = "projectId is required")
	private Long projectId;
}
