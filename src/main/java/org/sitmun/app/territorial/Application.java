package org.sitmun.app.territorial;

import org.sitmun.plugin.core.annotation.SitmunApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.context.annotation.ComponentScan;

//import springfox.documentation.spring.data.rest.configuration.SpringDataRestConfiguration;


//@Import(SpringDataRestConfiguration.class)
@SitmunApplication
@ComponentScan("org.sitmun.plugin.demo")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
