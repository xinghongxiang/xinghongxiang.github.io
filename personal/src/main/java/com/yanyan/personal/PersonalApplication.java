package com.yanyan.personal;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@MapperScan("com.yanyan.personal.dao")
@ComponentScan(basePackages = {"com.yanyan.personal.*"})
public class PersonalApplication {

    public static void main(String[] args) {
        SpringApplication.run(PersonalApplication.class, args);
    }

}
