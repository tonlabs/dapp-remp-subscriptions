package com.everx.remp.streams;

import java.util.regex.Pattern;
import java.time.Duration;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.common.serialization.Serde;
import org.apache.kafka.streams.kstream.Consumed;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.Topology;

public class StreamTopology {
        private final Serde<String> stringSerde = Serdes.String();
        final StreamsBuilder builder = new StreamsBuilder();

        public StreamTopology(
                        String inputTopicPattern,
                        String redisConnString,
                        Duration clientTimeout,
                        String redisLPushPattern,
                        int ttl) {

                KStream<String, String> kstream = builder.stream(
                                Pattern.compile(inputTopicPattern),
                                Consumed.with(stringSerde, stringSerde));

                kstream.process(() -> new RedisReceiptsConnector(
                                redisConnString, clientTimeout, redisLPushPattern, ttl));
        }

        public Topology build() {
                return this.builder.build();
        }
}
