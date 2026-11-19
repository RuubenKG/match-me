package com.matchme;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MatchmeApplication {

	public static void main(String[] args) {
		boolean devMode = false;
		for (String arg : args) {
			if ("-d".equals(arg)) {
				devMode = true;
				break;
			}
		}

		if (devMode) {
			System.setProperty("spring.graphql.graphiql.enabled", "true");
			System.out.println("DEVELOPER MODE ENABLED at /graphiql");
		} else {
			System.setProperty("spring.graphql.graphiql.enabled", "false");
			System.out.println("STANDARD MODE");
		}

		SpringApplication.run(MatchmeApplication.class, args);
	}

}
