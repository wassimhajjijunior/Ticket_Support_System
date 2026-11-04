package com.support_tickets.demo.mapper;

import com.support_tickets.demo.entity.Priority;
import com.support_tickets.demo.entity.User;
import com.support_tickets.demo.exception.EntityNotFoundException;
import com.support_tickets.demo.repository.ProjectRepository;

import org.springframework.stereotype.Component;
import com.support_tickets.demo.dto.FormTicketDto;
import com.support_tickets.demo.entity.Project;
import com.support_tickets.demo.entity.Ticket;

@Component
public class TicketFormMapper {

	private final ProjectRepository projectRepository;

	public TicketFormMapper(ProjectRepository projectRepository) {
		this.projectRepository = projectRepository;
	}

	public Ticket toEntity(FormTicketDto dto, User user) {
		Project projectTicket = projectRepository.findById(dto.getProjectId())
				.orElseThrow(() -> new EntityNotFoundException("Project " + dto.getProjectId() + " not found"));

		return Ticket.builder()
				.title(dto.getTitle())
				.description(dto.getDescription())
				.priority(Priority.from(dto.getPriority()).name())
				.project(projectTicket)
				.createdBy(user)
				.build();
	}
}
