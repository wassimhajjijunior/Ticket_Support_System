package com.support_tickets.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.support_tickets.demo.dto.AssignTicketDto;
import com.support_tickets.demo.dto.CommentCreateDto;
import com.support_tickets.demo.dto.CommentDto;
import com.support_tickets.demo.dto.FormTicketDto;
import com.support_tickets.demo.dto.StatsDto;
import com.support_tickets.demo.dto.StatusUpdateDto;
import com.support_tickets.demo.dto.TicketDetailDto;
import com.support_tickets.demo.service.CommentService;
import com.support_tickets.demo.service.TicketService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/ticket")
public class TicketController {

	private final TicketService ticketService;
	private final CommentService commentService;

	public TicketController(TicketService ticketService, CommentService commentService) {
		this.ticketService = ticketService;
		this.commentService = commentService;
	}

	@PostMapping("/create")
	public ResponseEntity<TicketDetailDto> createTicket(@Valid @RequestBody FormTicketDto formTicket) {
		TicketDetailDto newTicket = ticketService.createTicket(formTicket);
		return ResponseEntity.status(HttpStatus.CREATED).body(newTicket);
	}

	@GetMapping("/allTickets")
	public ResponseEntity<List<TicketDetailDto>> getAllTickets() {
		return ResponseEntity.ok(ticketService.getAllTickets());
	}

	@GetMapping("/myTickets")
	public ResponseEntity<List<TicketDetailDto>> getMyTickets() {
		return ResponseEntity.ok(ticketService.getMyTickets());
	}

	@GetMapping("/stats")
	public ResponseEntity<StatsDto> getStats() {
		return ResponseEntity.ok(ticketService.getStats());
	}

	@GetMapping("TicketDetails/{id}")
	public ResponseEntity<TicketDetailDto> getTicketById(@PathVariable Long id) {
		return ResponseEntity.ok(ticketService.getTicketById(id));
	}

	@PutMapping("TicketUpdate/{id}")
	public ResponseEntity<TicketDetailDto> updateTicket(@PathVariable Long id,
			@Valid @RequestBody FormTicketDto formTicketUpdate) {
		return ResponseEntity.ok(ticketService.updateTicket(id, formTicketUpdate));
	}

	@PatchMapping("/{id}/status")
	public ResponseEntity<TicketDetailDto> updateStatus(@PathVariable Long id,
			@Valid @RequestBody StatusUpdateDto statusUpdate) {
		return ResponseEntity.ok(ticketService.updateStatus(id, statusUpdate.getStatus()));
	}

	@PatchMapping("/{id}/assign")
	public ResponseEntity<TicketDetailDto> assignTicket(@PathVariable Long id,
			@RequestBody AssignTicketDto assignTicket) {
		return ResponseEntity.ok(ticketService.assign(id, assignTicket.getAssigneeId()));
	}

	@GetMapping("/{id}/comments")
	public ResponseEntity<List<CommentDto>> getComments(@PathVariable Long id) {
		return ResponseEntity.ok(commentService.listForTicket(id));
	}

	@PostMapping("/{id}/comments")
	public ResponseEntity<CommentDto> addComment(@PathVariable Long id,
			@Valid @RequestBody CommentCreateDto commentCreate) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(commentService.addComment(id, commentCreate));
	}

	@DeleteMapping("DeleteTicket/{id}")
	public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
		ticketService.deleteTicket(id);
		return ResponseEntity.noContent().build();
	}
}
