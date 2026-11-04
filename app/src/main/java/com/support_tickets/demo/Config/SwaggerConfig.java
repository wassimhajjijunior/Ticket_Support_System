package com.support_tickets.demo.Config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    OpenAPI apiInfo() {
        return new OpenAPI()
                .info(new Info()
                        .title("Bloster API")
                        .description("API documentation for Bloster backend")
                        .version("v1.0"));
    }
}
