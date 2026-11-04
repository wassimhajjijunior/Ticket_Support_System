package com.support_tickets.demo.Config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.support_tickets.demo.entity.Project;
import com.support_tickets.demo.entity.Role;
import com.support_tickets.demo.entity.User;
import com.support_tickets.demo.repository.ProjectRepository;
import com.support_tickets.demo.repository.UserRepository;

@Component
@Profile("dev")
public class DevDataSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

	private static final String ADMIN_USERNAME = "admin";
	private static final List<String> AGENT_USERNAMES = List.of("agent1", "agent2");
	private static final String PROJECT_NAME = "Platform";

	private final UserRepository userRepository;
	private final ProjectRepository projectRepository;
	private final PasswordEncoder passwordEncoder;
	private final String adminPassword;
	private final String agentPassword;

	public DevDataSeeder(UserRepository userRepository,
			ProjectRepository projectRepository,
			PasswordEncoder passwordEncoder,
			@Value("${SEED_ADMIN_PASSWORD:admin123}") String adminPassword,
			@Value("${SEED_AGENT_PASSWORD:agent123}") String agentPassword) {
		this.userRepository = userRepository;
		this.projectRepository = projectRepository;
		this.passwordEncoder = passwordEncoder;
		this.adminPassword = adminPassword;
		this.agentPassword = agentPassword;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		seedAdmin();
		seedAgents();
		seedProject();
	}

	private void seedAdmin() {
		if (userRepository.existsByUsername(ADMIN_USERNAME)) {
			return;
		}
		createUser(ADMIN_USERNAME, Role.ADMIN, adminPassword);
	}

	private void seedAgents() {
		if (userRepository.countByRole(Role.AGENT) >= AGENT_USERNAMES.size()) {
			return;
		}
		for (String username : AGENT_USERNAMES) {
			if (!userRepository.existsByUsername(username)) {
				createUser(username, Role.AGENT, agentPassword);
			}
		}
	}

	private void seedProject() {
		if (projectRepository.existsByName(PROJECT_NAME)) {
			return;
		}
		projectRepository.save(Project.builder().name(PROJECT_NAME).build());
		log.info("Seeded dev project '{}'", PROJECT_NAME);
	}

	private void createUser(String username, Role role, String rawPassword) {
		User user = User.builder()
				.username(username)
				.email(username + "@seed.local")
				.password(passwordEncoder.encode(rawPassword))
				.role(role)
				.build();
		userRepository.save(user);
		log.info("Seeded dev user '{}'", username);
	}
}
