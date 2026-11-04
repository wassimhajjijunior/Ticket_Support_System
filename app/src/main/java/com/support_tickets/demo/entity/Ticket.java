package com.support_tickets.demo.entity;

import lombok.*;

import java.util.List;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String title;

	@Lob
	@Column(columnDefinition = "TEXT")
	private String description;


	@Builder.Default
	@Enumerated(EnumType.STRING)
	private Status status = Status.OPEN;

	private String priority;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User createdBy;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assigned_to_id")
	private User assignedTo;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assigned_by_id")
	private User assignedBy;

	@BatchSize(size = 50)
	@OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	private List<Comment> comments;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "project_id", nullable = false)
	private Project project;

	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	@PrePersist
    public void prePersist() {
        if (status == null) {
            status = Status.OPEN;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

}
