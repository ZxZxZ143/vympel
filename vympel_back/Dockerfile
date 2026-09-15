# The Spring Boot JAR is architecture-neutral, so compile it on the native
# builder platform. The runtime stage still resolves for the requested target
# platform (amd64 or arm64).
FROM --platform=$BUILDPLATFORM eclipse-temurin:22.0.2_9-jdk-jammy@sha256:d8e6ba486df17bf758888d2b1b608133d1eedca8daf69d3fc6bf78d8be81e07e AS build
WORKDIR /workspace
COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew --no-daemon --console=plain dependencies
COPY src ./src
RUN ./gradlew --no-daemon --console=plain bootJar

FROM eclipse-temurin:22.0.2_9-jre-jammy@sha256:dbcae8b5dd4d63f81739a538ec2c09797735f04a21d814f9071b62f018326043 AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 vympel \
    && useradd --system --uid 10001 --gid 10001 --no-create-home vympel \
    && mkdir -p /app/logs \
    && chown -R 10001:10001 /app
WORKDIR /app
ENV APP_LOG_DIR=/app/logs
ENV JAVA_TOOL_OPTIONS="-XX:InitialRAMPercentage=25.0 -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
COPY --from=build --chown=10001:10001 /workspace/build/libs/vympel.jar /app/vympel.jar
USER vympel
EXPOSE 8080
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8080/actuator/health/readiness || exit 1
ENTRYPOINT ["java", "-jar", "/app/vympel.jar"]
