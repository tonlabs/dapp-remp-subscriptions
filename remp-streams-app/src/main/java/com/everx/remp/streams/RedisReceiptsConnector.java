package com.everx.remp.streams;

import java.time.Duration;

import org.apache.kafka.streams.processor.api.Processor;
import org.apache.kafka.streams.processor.api.ProcessorContext;
import org.apache.kafka.streams.processor.api.Record;

import io.lettuce.core.*;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

public class RedisReceiptsConnector implements Processor<String, String, Void, Void> {
    private RedisClient redisClient;
    private StatefulRedisConnection<String, String> connection;
    private RedisCommands<String, String> redisCommand;
    private String connectionString;
    private Duration clientTimeout;
    private String pushPattern;
    private int ttl;
    // private SetArgs setArgs;

    public RedisReceiptsConnector(
            String connectionString, Duration clientTimeout, String pushPattern, int ttl) {
        this.connectionString = connectionString;
        this.clientTimeout = clientTimeout;
        this.pushPattern = pushPattern;
        this.ttl = ttl;
    }

    @Override
    public void init(ProcessorContext<Void, Void> _context) {
        this.redisClient = RedisClient.create(this.connectionString);
        this.redisClient.setDefaultTimeout(clientTimeout);
        this.connection = this.redisClient.connect();
        this.redisCommand = this.connection.sync();
        // this.setArgs = SetArgs.Builder.nx().ex(5);
    }

    @Override
    public void process(Record<String, String> record) {
        String key = this.pushPattern + record.key();
        String value = record.value();
        // Fail fast, do not catch RedisCommandExecutionException,
        // because we can not handle it anyway
        redisCommand.lpush(key, value);
        redisCommand.expire(key, ttl);
        // System.out.println("Pushed to " + key /* + "value" + value */);
    }

    @Override
    public void close() {
        this.connection.close();
        this.redisClient.shutdown();
    }

}
