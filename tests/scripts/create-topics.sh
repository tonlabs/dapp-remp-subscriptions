echo "Waiting for Kafka to come online..."

cub kafka-ready -b kafka:9092 1 20
#
# Create topic with incoming receipts
#
kafka-topics \
  --bootstrap-server kafka:9092 \
  --topic remp-receipts-0 \
  --replication-factor 1 \
  --partitions 6 \
  --config retention.ms=3600000 \
  --create
