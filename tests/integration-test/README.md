This test:

-   Publishes 'receipt' messages see [src/testdata/receipts.json](./src/testdata/receipts.json)
-   Subscribes on Redis to receive these receipts
-   Subscribes on Redis to receive health checks

This test takes 40 seconds, to ensure that at least one health check message is received.

## Run test

See detailed description in the main [README.md](../../README.md)
