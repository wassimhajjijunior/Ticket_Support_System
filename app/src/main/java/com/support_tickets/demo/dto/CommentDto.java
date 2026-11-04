package com.support_tickets.demo.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CommentDto {
	private Long id;
	private Long ticketId;
	private String content;
	private Long authorId;
	private String authorName;
	private LocalDateTime createdAt;
}
