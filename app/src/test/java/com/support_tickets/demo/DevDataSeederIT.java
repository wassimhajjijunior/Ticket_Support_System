package com.support_tickets.demo;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import com.support_tickets.demo.Config.DevDataSeeder;
import com.support_tickets.demo.entity.Role;
import com.support_tickets.demo.entity.User;
import com.support_tickets.demo.repository.ProjectRepository;
import com.support_tickets.demo.repository.UserRepository;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:seederdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH",
		"spring.jpa.show-sql=false",
		"logging.level.org.hibernate.SQL=WARN"
})
@ActiveProfiles({ "dev", "test" })
class DevDataSeederIT {

	@Autowired
	private DevDataSeeder seeder;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private ProjectRepository projectRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Test
	void seederCreatesBaselineData() {
		assertThat(userRepository.findByUsername("admin")).isNotNull();
		assertThat(userRepository.findByUsername("admin").getRole()).isEqualTo(Role.ADMIN);
		assertThat(userRepository.findByRole(Role.AGENT)).hasSize(2);
		assertThat(projectRepository.findAll()).hasSize(1);
		assertThat(projectRepository.findAll().get(0).getName()).isEqualTo("Platform");
	}

	@Test
	void seederIsIdempotent() throws Exception {
		long usersBefore = userRepository.count();
		long projectsBefore = projectRepository.count();

		seeder.run(null);
		seeder.run(null);

		assertThat(userRepository.count()).isEqualTo(usersBefore);
		assertThat(projectRepository.count()).isEqualTo(projectsBefore);
		assertThat(userRepository.findByRole(Role.ADMIN)).hasSize(1);
		assertThat(userRepository.findByRole(Role.AGENT)).hasSize(2);
		assertThat(projectRepository.findAll()).hasSize(1);
		assertThat(projectRepository.findAll().get(0).getName()).isEqualTo("Platform");
	}

	@Test
	void seededPasswordsAreHashed() {
		User admin = userRepository.findByUsername("admin");
		assertThat(admin.getPassword()).isNotEqualTo("admin123");
		assertThat(passwordEncoder.matches("admin123", admin.getPassword())).isTrue();

		User agent = userRepository.findByUsername("agent1");
		assertThat(passwordEncoder.matches("agent123", agent.getPassword())).isTrue();
	}
}
