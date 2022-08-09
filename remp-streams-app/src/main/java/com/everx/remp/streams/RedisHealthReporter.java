package com.everx.remp.streams;

import java.time.Duration;

import io.lettuce.core.*;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

public class RedisHealthReporter implements Runnable {
    private RedisClient redisClient;
    private StatefulRedisConnection<String, String> connection;
    private RedisCommands<String, String> redisCommand;
    private String connectionString;

    private int millis;
    private String channel;
    private final String ok = "OK";

    public RedisHealthReporter(String connectionString, int millis, String channel) {
        this.connectionString = connectionString;
        this.channel = channel;
        this.millis = millis;
        this.redisClient = RedisClient.create(this.connectionString);
        this.redisClient.setDefaultTimeout(Duration.ofSeconds(20));
        this.connection = this.redisClient.connect();
        this.redisCommand = this.connection.sync();
    }

    public void run() {
        for (;;) {
            try {
                redisCommand.publish(this.channel, this.ok);
                System.out.println("Published  OK to " + this.channel);
                Thread.sleep(this.millis);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
            } catch (Error err) {
                System.out.println(err);
            }
        }
    }
}
