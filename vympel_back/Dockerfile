# The Spring Boot JAR is architecture-neutral, so compile it on the native
# builder platform. The runtime stage still resolves for the requested target
# platform (amd64 or arm64).
FROM --platform=$BUILDPLATFORM eclipse-temurin:17.0.19_10-jdk-jammy@sha256:9283f99ad21802850dd7420a865c495642a804c5a201f73377aef232ef12bccb AS build
WORKDIR /workspace
COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew --no-daemon --console=plain dependencies
COPY src ./src
RUN ./gradlew --no-daemon --console=plain bootJar

FROM eclipse-temurin:17.0.19_10-jre-jammy@sha256:1e38389ecd9e5c444e40d4385be4a4a5f56a836a38a6e41c099810c32ec1c595 AS runtime
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
