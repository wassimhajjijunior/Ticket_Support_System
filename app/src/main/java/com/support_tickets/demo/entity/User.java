package com.support_tickets.demo.entity;

import lombok.*;
import java.util.List;
import jakarta.persistence.*;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@Column(unique = true)
	private String username;
	
	private String email;
	private String password;
	private String phone;
	
	@Enumerated(EnumType.STRING)
	private Role role;
	
	
	@OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	private List<Ticket> createdTickets;
	
	@OneToMany(mappedBy = "assignedTo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	private List<Ticket> assignedTickets;
	
	
	private String profileImagePath;
	
	
}
