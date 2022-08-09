## Integration test

This test use: Kafka, Redis, Remp-subscriptions-app, Q-Server

Node.js script generates receipts and uses net.subscribe to get them.

```
    INPUT: receipts                  OUTPUT: results
src/testdata/patterns.json                 ^
        |                                  |
+--------------------------------------------------+
|      Kafka      /Test script/          SDK       |
|    producer                         Subscribers  |
+--------------------------------------------------+
        |                                  |
        |                                  |
+-------------------------+       +----------------+
|         Kafka           |       |    Q-Server    |
|  topic remp-receipts-0  |       |                |
+-------------------------+       +----------------+
        |                                 ^
 +--------------+        +---------+      |
 |   KStreams   |------> |  Redis  |------+
 |   Java App   |        |         |
 +--------------+        +---------+
```

### Run test

```
cd tests
chmod 777 integration-test
chmod 666 integration-test/package*.json 
docker-compose up --build -d
```

**Please wait up to 1 min** for all npm packages required for test to be installed

-   Run the test script, it runs for about 100 seconds.

```
docker exec -it  tests_integration-test_1 npm run start
```

### Expected results:

```
Optimistic duration 95 sec.
Connected to Kafka cluster kafka:29092
7 sec. { 'failure path': 20 }
---%<-------------------------
98 sec. { 'failure path': 100, 'black hole path': 200, 'happy path': 400 }
Success!
```
The result shows the number of receipts received.

## Load testing

Run multiple test script instances in parallel.
My laptop has 8 cores, so I run 5 copies of the test script.

```
docker exec -it  tests_integration-test_1 npm run parallel 5
```

### Expected results

```
Process 1 99 sec. { 'black hole path': 200, 'failure path': 100, 'happy path': 400 }
Process 1 Success!

Process 0 100 sec. { 'failure path': 100, 'black hole path': 200, 'happy path': 400 }
Process 0 Success!

Process 3 101 sec. { 'failure path': 100, 'black hole path': 200, 'happy path': 400 }
Process 3 Success!

Process 5 102 sec. { 'black hole path': 200, 'failure path': 100, 'happy path': 400 }
Process 5 Success!

Process 2 103 sec. { 'failure path': 100, 'black hole path': 200, 'happy path': 400 }
Process 2 Success!
```

(100 + 200 + 400) \* 5 = 3500 receipts was received in 100 seconds.

### Changing test data

To change test data, edit [integration-test/src/testdata/patterns.json](./integration-test/src/testdata/patterns.json)

Do not forget to rebuild the test:

```
docker exec -it tests_integration-test_1 npm run build
```

Then run test again.

## Troubleshooting

-   Kafka failed to start. This happens when docker was stopped, but `docker-compose down` command was not run.

Remove all local volumes not used by at least one container and start test again.

```
docker volume prune
```
