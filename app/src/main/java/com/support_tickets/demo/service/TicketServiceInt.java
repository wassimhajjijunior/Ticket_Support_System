package com.support_tickets.demo.service;

import com.support_tickets.demo.dto.FormTicketDto;
import com.support_tickets.demo.dto.TicketDetailDto;
import com.support_tickets.demo.entity.Ticket;

import java.util.List;

public interface TicketServiceInt {
    TicketDetailDto createTicket(FormTicketDto ticket);
    TicketDetailDto getTicketById(Long id);
    List<TicketDetailDto> getAllTickets();
    TicketDetailDto updateTicket(Long id ,FormTicketDto updatedTicket);
	void deleteTicket(Long id);
	List<TicketDetailDto> getMyTickets();
	void assignTo(Ticket newticket);
}
