FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -B -ntp package -DskipTests
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build --chown=1001:1001 /build/target/quarkus-app/ ./
USER 1001
EXPOSE 8082
ENTRYPOINT ["java", "-Dquarkus.http.host=0.0.0.0", "-jar", "quarkus-run.jar"]

