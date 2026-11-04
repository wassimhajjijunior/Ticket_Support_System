package com.support_tickets.demo.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.support_tickets.demo.dto.CommentDto;
import com.support_tickets.demo.entity.Comment;

@Component
public class CommentMapper {

	public CommentDto toDto(Comment comment) {
		if (comment == null) {
			return null;
		}
		return new CommentDto(
				comment.getId(),
				comment.getTicket() != null ? comment.getTicket().getId() : null,
				comment.getContent(),
				comment.getAuthor() != null ? comment.getAuthor().getId() : null,
				comment.getAuthor() != null ? comment.getAuthor().getUsername() : null,
				comment.getCreatedAt());
	}

	public List<CommentDto> toCommentDtoList(List<Comment> comments) {
		if (comments == null) {
			return List.of();
		}
		return comments.stream().map(this::toDto).toList();
	}
}
