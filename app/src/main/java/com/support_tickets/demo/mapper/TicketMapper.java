package com.support_tickets.demo.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.support_tickets.demo.dto.TicketDetailDto;
import com.support_tickets.demo.entity.Project;
import com.support_tickets.demo.entity.Status;
import com.support_tickets.demo.entity.Ticket;
import com.support_tickets.demo.entity.User;

@Component
public class TicketMapper {

	public TicketDetailDto toDto(Ticket ticket) {
		if (ticket == null) {
			return null;
		}

		Project project = ticket.getProject();
		User createdBy = ticket.getCreatedBy();
		User assignedTo = ticket.getAssignedTo();

		return new TicketDetailDto(
				ticket.getId(),
				ticket.getTitle(),
				ticket.getDescription(),
				ticket.getStatus() != null ? ticket.getStatus().name() : Status.OPEN.name(),
				ticket.getPriority(),
				project != null ? project.getId() : null,
				project != null ? project.getName() : null,
				createdBy != null ? createdBy.getId() : null,
				createdBy != null ? createdBy.getUsername() : null,
				assignedTo != null ? assignedTo.getId() : null,
				assignedTo != null ? assignedTo.getUsername() : null,
				ticket.getComments() != null ? ticket.getComments().size() : 0,
				ticket.getCreatedAt(),
				ticket.getUpdatedAt());
	}

	public List<TicketDetailDto> toDtoList(List<Ticket> tickets) {
		if (tickets == null || tickets.isEmpty()) {
			return List.of();
		}
		return tickets.stream().map(this::toDto).toList();
	}
}
