package org.sitmun.app.territorial;

import org.sitmun.plugin.core.annotation.SitmunApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.support.SpringBootServletInitializer;

@SitmunApplication
public class Application extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(Application.class);
  }
  
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
