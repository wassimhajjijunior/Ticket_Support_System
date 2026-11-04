package com.support_tickets.demo.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.support_tickets.demo.dto.DailyCountDto;
import com.support_tickets.demo.dto.FormTicketDto;
import com.support_tickets.demo.dto.StatsDto;
import com.support_tickets.demo.dto.TicketDetailDto;
import com.support_tickets.demo.entity.Priority;
import com.support_tickets.demo.entity.Project;
import com.support_tickets.demo.entity.Role;
import com.support_tickets.demo.entity.Status;
import com.support_tickets.demo.entity.Ticket;
import com.support_tickets.demo.entity.User;
import com.support_tickets.demo.exception.BadRequestException;
import com.support_tickets.demo.exception.EntityNotFoundException;
import com.support_tickets.demo.mapper.TicketFormMapper;
import com.support_tickets.demo.mapper.TicketMapper;
import com.support_tickets.demo.repository.ProjectRepository;
import com.support_tickets.demo.repository.TicketRepository;
import com.support_tickets.demo.repository.UserRepository;
import com.support_tickets.demo.security.SecurityUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TicketService implements TicketServiceInt {

	private static final List<Status> STATUS_ORDER = List.of(
			Status.PENDING, Status.OPEN, Status.EXECUTED, Status.FINISHED);

	private final TicketRepository ticketRepository;
	private final TicketFormMapper ticketFormMapper;
	private final SecurityUtil securityUtil;
	private final TicketMapper ticketMapper;
	private final UserRepository userRepository;
	private final ProjectRepository projectRepository;

	@Override
	@Transactional
	public TicketDetailDto createTicket(FormTicketDto formdto) {
		User currentUser = securityUtil.getCurrentUser();

		Ticket ticket = ticketFormMapper.toEntity(formdto, currentUser);
		ticket.setAssignedTo(selectLeastBusyAgent());

		Ticket savedTicket = ticketRepository.saveAndFlush(ticket);
		return ticketMapper.toDto(savedTicket);
	}

	@Override
	@Transactional(readOnly = true)
	public List<TicketDetailDto> getAllTickets() {
		return ticketMapper.toDtoList(ticketRepository.findAll());
	}

	@Override
	@Transactional(readOnly = true)
	public List<TicketDetailDto> getMyTickets() {
		User currentUser = securityUtil.getCurrentUser();
		return ticketMapper.toDtoList(
				ticketRepository.findAllByCreatedByOrAssignedTo(currentUser, currentUser));
	}

	@Override
	@Transactional(readOnly = true)
	public TicketDetailDto getTicketById(Long id) {
		return ticketMapper.toDto(findTicket(id));
	}

	@Override
	@Transactional
	public TicketDetailDto updateTicket(Long id, FormTicketDto dto) {
		Ticket ticket = findTicket(id);

		Project project = dto.getProjectId() != null
				? projectRepository.findById(dto.getProjectId())
						.orElseThrow(() -> new EntityNotFoundException("Project " + dto.getProjectId() + " not found"))
				: ticket.getProject();

		ticket.setTitle(dto.getTitle());
		ticket.setDescription(dto.getDescription());
		ticket.setPriority(Priority.from(dto.getPriority()).name());
		ticket.setProject(project);

		Ticket savedTicket = ticketRepository.saveAndFlush(ticket);
		return ticketMapper.toDto(savedTicket);
	}

	@Transactional
	public TicketDetailDto updateStatus(Long id, String rawStatus) {
		Ticket ticket = findTicket(id);
		ticket.setStatus(parseStatus(rawStatus));

		Ticket savedTicket = ticketRepository.saveAndFlush(ticket);
		return ticketMapper.toDto(savedTicket);
	}

	@Transactional
	public TicketDetailDto assign(Long id, Long assigneeId) {
		Ticket ticket = findTicket(id);
		User caller = securityUtil.getCurrentUser();

		if (assigneeId == null) {
			ticket.setAssignedTo(null);
			ticket.setAssignedBy(null);
		} else {
			User assignee = userRepository.findById(assigneeId)
					.orElseThrow(() -> new EntityNotFoundException("User " + assigneeId + " not found"));
			if (assignee.getRole() != Role.AGENT) {
				throw new BadRequestException("User " + assigneeId + " is not an AGENT");
			}
			ticket.setAssignedTo(assignee);
			ticket.setAssignedBy(caller);
		}

		Ticket savedTicket = ticketRepository.saveAndFlush(ticket);
		return ticketMapper.toDto(savedTicket);
	}

	@Override
	@Transactional
	public void deleteTicket(Long id) {
		if (!ticketRepository.existsById(id)) {
			throw new EntityNotFoundException("Ticket " + id + " not found");
		}
		ticketRepository.deleteById(id);
	}

	@Override
	@Transactional
	public void assignTo(Ticket newTicket) {
		newTicket.setAssignedTo(selectLeastBusyAgent());
	}

	@Transactional(readOnly = true)
	public StatsDto getStats() {
		User currentUser = securityUtil.getCurrentUser();

		Map<String, Long> byStatus = new LinkedHashMap<>();
		for (Status status : STATUS_ORDER) {
			byStatus.put(status.name(), 0L);
		}
		for (Object[] row : ticketRepository.countGroupByStatus()) {
			byStatus.put(((Status) row[0]).name(), ((Number) row[1]).longValue());
		}

		Map<String, Long> byPriority = new LinkedHashMap<>();
		for (Priority priority : Priority.values()) {
			byPriority.put(priority.name(), 0L);
		}
		Set<String> knownPriorities = byPriority.keySet();
		for (Object[] row : ticketRepository.countGroupByPriority()) {
			String key = row[0] != null ? row[0].toString().toUpperCase(java.util.Locale.ROOT) : null;
			if (key != null && knownPriorities.contains(key)) {
				byPriority.put(key, ((Number) row[1]).longValue());
			}
		}

		LocalDate today = LocalDate.now();
		List<DailyCountDto> last7Days = new java.util.ArrayList<>(7);
		for (int i = 6; i >= 0; i--) {
			LocalDate day = today.minusDays(i);
			LocalDateTime start = day.atStartOfDay();
			LocalDateTime end = start.plusDays(1);
			long created = ticketRepository.countCreatedBetween(start, end);
			long closed = ticketRepository.countClosedBetween(start, end);
			last7Days.add(new DailyCountDto(day, created, closed));
		}

		return new StatsDto(
				ticketRepository.count(),
				ticketRepository.countUnassigned(),
				byStatus,
				byPriority,
				ticketRepository.countOpenForUser(currentUser),
				last7Days);
	}

	private Ticket findTicket(Long id) {
		return ticketRepository.findById(id)
				.orElseThrow(() -> new EntityNotFoundException("Ticket " + id + " not found"));
	}

	private Status parseStatus(String rawStatus) {
		if (rawStatus == null || rawStatus.isBlank()) {
			throw new BadRequestException("status must not be blank");
		}
		try {
			return Status.valueOf(rawStatus.trim().toUpperCase(java.util.Locale.ROOT));
		} catch (IllegalArgumentException ex) {
			throw new BadRequestException(
					"Invalid status '" + rawStatus + "'. Allowed: PENDING, OPEN, EXECUTED, FINISHED");
		}
	}

	private User selectLeastBusyAgent() {
		User leastBusy = null;
		long lowestLoad = Long.MAX_VALUE;
		for (User agent : userRepository.findByRole(Role.AGENT)) {
			long load = ticketRepository.countByAssignedTo(agent);
			if (load < lowestLoad) {
				lowestLoad = load;
				leastBusy = agent;
			}
		}
		return leastBusy;
	}
}
