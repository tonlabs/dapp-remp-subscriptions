package com.everx.remp.streams;

import com.timgroup.statsd.StatsDClient;
import com.timgroup.statsd.NonBlockingStatsDClient;
import com.timgroup.statsd.StatsDClientException;

public class StatsdMetricReporter implements Runnable {
    private StatsDClient statsd;
    private String metric;
    private int millis;

    public StatsdMetricReporter(String statsdConnString, String metric, int millis) {
        try {
            String host = statsdConnString.split(":")[0];
            int port = Integer.parseInt(statsdConnString.split(":")[1]);

            System.out.println(">>>>> " + host + " " + port);
            this.statsd = new NonBlockingStatsDClient("", host, port);
            System.out.println(">>>unreachable>> ");

            this.metric = metric;
            this.millis = millis;
        } catch (StatsDClientException ex) {
            // Do nothing.
            // Do not paninc if statsd server is configured incorrectly.
            System.out.println(">>>In ERROR HANDLER");
            System.out.println(ex);
        }
    }

    public void run() {
        for (;;) {
            try {
                this.statsd.incrementCounter(this.metric);
                Thread.sleep(millis);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
