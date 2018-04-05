package org.sitmun.app.territorial.app;

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
    public void testDemoAPI() throws Exception {
        assertThat(this.restTemplate.getForObject("http://localhost:" + port + "/demo/hello?name=John", Greetings.class).getMessage().equalsIgnoreCase("Hello John!"))
                ;
    }
    
}