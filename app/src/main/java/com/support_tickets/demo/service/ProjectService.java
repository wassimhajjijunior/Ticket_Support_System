package com.support_tickets.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.support_tickets.demo.dto.ProjectDto;
import com.support_tickets.demo.entity.Project;
import com.support_tickets.demo.exception.DuplicateResourceException;
import com.support_tickets.demo.repository.ProjectRepository;

@Service
public class ProjectService {

	private final ProjectRepository projectRepository;

	public ProjectService(ProjectRepository projectRepository) {
		this.projectRepository = projectRepository;
	}

	@Transactional(readOnly = true)
	public List<ProjectDto> getAllProjects() {
		return projectRepository.findAll()
				.stream()
				.map(project -> new ProjectDto(project.getId(), project.getName()))
				.toList();
	}

	@Transactional
	public ProjectDto createProject(ProjectDto dto) {
		String name = dto.getName().trim();
		if (projectRepository.existsByNameIgnoreCase(name)) {
			throw new DuplicateResourceException("Project '" + name + "' already exists");
		}
		Project saved = projectRepository.save(Project.builder().name(name).build());
		return new ProjectDto(saved.getId(), saved.getName());
	}
}
