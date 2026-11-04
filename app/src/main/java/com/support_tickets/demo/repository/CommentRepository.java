package com.support_tickets.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.support_tickets.demo.entity.Comment;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

	List<Comment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

	long countByTicketId(Long ticketId);

	@Query("select c.ticket.id, count(c) from Comment c where c.ticket.id in :ticketIds group by c.ticket.id")
	List<Object[]> countByTicketIds(@Param("ticketIds") List<Long> ticketIds);
}
