package com.everx.remp.streams;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StreamsConfig;
import org.apache.kafka.streams.Topology;
import org.apache.kafka.streams.errors.StreamsUncaughtExceptionHandler.StreamThreadExceptionResponse;
import org.apache.kafka.common.serialization.Serde;

public class App {
    Serde<String> stringSerde = Serdes.String();

    public Properties loadEnvProperties(String fileName) throws IOException {
        Properties envProps = new Properties();
        FileInputStream input = new FileInputStream(fileName);
        envProps.load(input);
        input.close();
        return envProps;
    }

    public Properties buildStreamsProperties(Properties envProps) {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, envProps.getProperty("application.id"));
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, envProps.getProperty("bootstrap.servers"));
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, stringSerde.getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, stringSerde.getClass());
        return props;
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException(
                    "This program takes one argument: the path to an environment configuration file.");
        }

        App app = new App();
        Properties topologyProps = app.loadEnvProperties(args[0]);
        Topology topology = new StreamTopology(
                topologyProps.getProperty("input.topic.pattern"),
                topologyProps.getProperty("redis.connection.url"),
                Duration.ofSeconds(Integer.parseInt(topologyProps.getProperty("redis.client.timeout"))),
                topologyProps.getProperty("redis.lpush.pattern"),
                Integer.parseInt(topologyProps.getProperty("redis.lpush.ttl")))
                .build();

        Properties streamProps = app.buildStreamsProperties(topologyProps);
        final KafkaStreams streams = new KafkaStreams(topology, streamProps);

        /*
         * `addShutdownHook` are copy-paste from Confluent Kafka Streams tutorial
         */
        final CountDownLatch latch = new CountDownLatch(1);
        Runtime.getRuntime().addShutdownHook(new Thread("streams-shutdown-hook") {
            @Override
            public void run() {
                streams.close();
                latch.countDown();
            }
        });

        try {
            streams.setUncaughtExceptionHandler(
                    (exception) -> {
                        latch.countDown();
                        return StreamThreadExceptionResponse.SHUTDOWN_APPLICATION;
                    });
            streams.start();

            String statsdConnUrl = topologyProps.getProperty("statsd.connection.url", "");

            if (!statsdConnUrl.trim().isEmpty()) {
                new Thread(new StatsdMetricReporter(
                        statsdConnUrl,
                        topologyProps.getProperty("statsd.metric.name"),
                        Integer.parseInt(topologyProps.getProperty("statsd.metric.millis"))))
                        .start();
            }

            new Thread(new RedisHealthReporter(
                    topologyProps.getProperty("redis.connection.url"),
                    Integer.parseInt(topologyProps.getProperty("healthcheck.millis")),
                    topologyProps.getProperty("redis.healthcheck.channel")))
                    .start();

            latch.await();

        } catch (Throwable e) {
            System.exit(1);
        }
        System.exit(0);
    }
}
