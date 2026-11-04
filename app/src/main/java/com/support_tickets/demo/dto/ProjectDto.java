package com.support_tickets.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProjectDto {

	private Long id;

	@NotBlank(message = "name must not be blank")
	@Size(max = 255, message = "name must be at most 255 characters")
	private String name;
}
