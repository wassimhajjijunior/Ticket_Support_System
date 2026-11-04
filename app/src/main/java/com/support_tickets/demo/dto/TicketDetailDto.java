package com.support_tickets.demo.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TicketDetailDto {
	private Long id;
	private String title;
	private String description;
	private String status;
	private String priority;
	private Long projectId;
	private String projectName;
	private Long createdById;
	private String createdByName;
	private Long assignedToId;
	private String assignedToName;
	private long commentCount;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}
