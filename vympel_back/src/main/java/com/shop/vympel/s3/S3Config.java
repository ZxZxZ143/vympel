package com.shop.vympel.s3;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;
import java.time.Duration;

@Configuration
public class S3Config {

    @Bean
    public S3Client s3Client(
            StorageProps props,
            @Value("${storage.s3.api-call-timeout:10s}") Duration apiCallTimeout,
            @Value("${storage.s3.api-attempt-timeout:5s}") Duration apiAttemptTimeout
    ) {
        var creds = StaticCredentialsProvider.create(
                AwsBasicCredentials.create(props.accessKey(), props.secretKey())
        );

        return S3Client.builder()
                .endpointOverride(URI.create(props.endpoint()))
                .region(Region.of(region(props)))
                .credentialsProvider(creds)
                .overrideConfiguration(
                        ClientOverrideConfiguration.builder()
                                .apiCallTimeout(apiCallTimeout)
                                .apiCallAttemptTimeout(apiAttemptTimeout)
                                .build()
                )
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(props.pathStyle())
                                .build()
                )
                .build();
    }

    private String region(StorageProps props) {
        return props.region() == null || props.region().isBlank()
                ? "us-east-1"
                : props.region();
    }
}
