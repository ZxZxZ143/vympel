package com.shop.vympel;

import com.shop.vympel.s3.StorageProps;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(StorageProps.class)
public class VympelApplication {

    public static void main(String[] args) {
        SpringApplication.run(VympelApplication.class, args);
    }

}
