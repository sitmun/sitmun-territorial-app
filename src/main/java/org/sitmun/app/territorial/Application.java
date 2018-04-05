package org.sitmun.app.territorial;

import org.sitmun.plugin.core.annotation.SitmunApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.context.annotation.ComponentScan;

@SitmunApplication
@ComponentScan("org.sitmun.plugin.demo")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
