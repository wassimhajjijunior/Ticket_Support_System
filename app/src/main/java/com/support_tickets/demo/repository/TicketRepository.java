package com.support_tickets.demo.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.support_tickets.demo.entity.Ticket;
import com.support_tickets.demo.entity.User;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

	@Override
	@EntityGraph(attributePaths = { "project", "createdBy", "assignedTo" })
	List<Ticket> findAll();

	@Override
	@EntityGraph(attributePaths = { "project", "createdBy", "assignedTo" })
	Optional<Ticket> findById(Long id);

	@EntityGraph(attributePaths = { "project", "createdBy", "assignedTo" })
	List<Ticket> findAllByCreatedBy(User createdBy);

	@EntityGraph(attributePaths = { "project", "createdBy", "assignedTo" })
	List<Ticket> findAllByCreatedByOrAssignedTo(User createdBy, User assignedTo);

	long countByAssignedTo(User assignedTo);

	@Query("select count(t) from Ticket t where t.assignedTo is null")
	long countUnassigned();

	@Query("select t.status, count(t) from Ticket t group by t.status")
	List<Object[]> countGroupByStatus();

	@Query("select t.priority, count(t) from Ticket t group by t.priority")
	List<Object[]> countGroupByPriority();

	@Query("select count(t) from Ticket t where t.assignedTo = :user "
			+ "and t.status <> com.support_tickets.demo.entity.Status.FINISHED")
	long countOpenForUser(@Param("user") User user);

	@Query("select count(t) from Ticket t where t.createdAt >= :start and t.createdAt < :end")
	long countCreatedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

	@Query("select count(t) from Ticket t where t.status = com.support_tickets.demo.entity.Status.FINISHED "
			+ "and t.updatedAt >= :start and t.updatedAt < :end")
	long countClosedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
