package org.sitmun.app.territorial;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.sitmun.plugin.demo.domain.Greetings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.embedded.LocalServerPort;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.test.context.junit4.SpringRunner;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class DemoPluginIntegrationTest {
    @LocalServerPort
    private int port;
    
    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    public void testDemoAPI() {
        Greetings greetings = restTemplate.getForObject("http://localhost:" + port + "/api/demo/hello?name=John", Greetings.class);
        assertThat(greetings.getMessage()).isEqualToIgnoringCase("Hello John!");
    }
    
}