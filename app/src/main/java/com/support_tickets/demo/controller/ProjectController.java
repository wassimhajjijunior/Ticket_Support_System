package com.support_tickets.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.support_tickets.demo.dto.ProjectDto;
import com.support_tickets.demo.service.ProjectService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/project")
public class ProjectController {

	private final ProjectService projectService;

	public ProjectController(ProjectService projectService) {
		this.projectService = projectService;
	}

	@GetMapping("/allProjects")
	public ResponseEntity<List<ProjectDto>> getAllProjects() {
		return ResponseEntity.ok(projectService.getAllProjects());
	}

	@PostMapping("/create")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ProjectDto> createProject(@Valid @RequestBody ProjectDto project) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(projectService.createProject(project));
	}
}
