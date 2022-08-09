FROM gradle:7.4.2-jdk11 as build
WORKDIR /home/app
COPY src /home/app/src
COPY build.gradle /home/app/build.gradle
RUN gradle wrapper
RUN ./gradlew build 
RUN ./gradlew shadowJar

FROM openjdk:11
COPY --from=build /home/app/build/libs/remp-streams-app-*.jar /home/app/remp-streams-app.jar
COPY configuration/dev.properties /home/app/configuration/dev.properties
WORKDIR /home/app
ENTRYPOINT ["java", "-jar", "remp-streams-app.jar", "configuration/dev.properties"]
