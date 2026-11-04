package com.support_tickets.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.support_tickets.demo.dto.CommentCreateDto;
import com.support_tickets.demo.dto.CommentDto;
import com.support_tickets.demo.entity.Comment;
import com.support_tickets.demo.entity.Ticket;
import com.support_tickets.demo.entity.User;
import com.support_tickets.demo.exception.EntityNotFoundException;
import com.support_tickets.demo.mapper.CommentMapper;
import com.support_tickets.demo.repository.CommentRepository;
import com.support_tickets.demo.repository.TicketRepository;
import com.support_tickets.demo.security.SecurityUtil;

@Service
public class CommentService {

	private final CommentRepository commentRepository;
	private final TicketRepository ticketRepository;
	private final CommentMapper commentMapper;
	private final SecurityUtil securityUtil;

	public CommentService(CommentRepository commentRepository,
			TicketRepository ticketRepository,
			CommentMapper commentMapper,
			SecurityUtil securityUtil) {
		this.commentRepository = commentRepository;
		this.ticketRepository = ticketRepository;
		this.commentMapper = commentMapper;
		this.securityUtil = securityUtil;
	}

	@Transactional(readOnly = true)
	public List<CommentDto> listForTicket(Long ticketId) {
		if (!ticketRepository.existsById(ticketId)) {
			throw new EntityNotFoundException("Ticket " + ticketId + " not found");
		}
		return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
				.stream()
				.map(commentMapper::toDto)
				.toList();
	}

	@Transactional
	public CommentDto addComment(Long ticketId, CommentCreateDto dto) {
		Ticket ticket = ticketRepository.findById(ticketId)
				.orElseThrow(() -> new EntityNotFoundException("Ticket " + ticketId + " not found"));
		User author = securityUtil.getCurrentUser();

		String content = dto.getContent() != null ? dto.getContent().trim() : "";
		if (content.isEmpty()) {
			throw new com.support_tickets.demo.exception.BadRequestException("content must not be blank");
		}

		Comment comment = Comment.builder()
				.content(content)
				.ticket(ticket)
				.author(author)
				.build();

		return commentMapper.toDto(commentRepository.saveAndFlush(comment));
	}
}
