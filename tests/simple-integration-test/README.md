This test:

-   Publishes 'receipt' messages see [src/testdata/receipts.json](./src/testdata/receipts.json)
-   Subscribes on Redis to receive these receipts
-   Subscribes on Redis to receive health checks

This test takes 40 seconds, to ensure that at least one health check message is received.

This test doesn't use q-server and subscribes directly on Redis

## Run test

-   Run Kafka, Redis and Remp-subscriptions-app

```
docker-compose up --build -d
```

**Please wait up to 1 min** for all npm packages required for test to be installed

-   Run test script

```

docker exec -it dapp-remp-subscriptions_simple-integration-test_1 npm start
```

Wait 40 seconds for the test to complete.

### Expected results:

```
Statistics: [
  {
    "__keyspace@0__:remp-receipts:id1": "9"
  },
  {
    "__keyspace@0__:remp-receipts:id2": "5"
  },
  {
    "__keyspace@0__:remp-receipts:id3": "4"
  },
  {
    "remp-receipts:id1": "P,N,L,K,H,G,E,D,A"
  },
  {
    "remp-receipts:id2": "Q,J,L,F,B"
  },
  {
    "remp-receipts:id3": "O,M,I,C"
  },
  {
    "remp-subscriptions-healthcheck": "1"
  }
]
Success
```
