package com.support_tickets.demo.repository;

import com.support_tickets.demo.entity.Role;
import com.support_tickets.demo.entity.User;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

	User findByUsername(String name);

	boolean existsByUsername(String username);

	boolean existsByEmail(String email);

	List<User> findByRole(Role role);

	long countByRole(Role role);
}
