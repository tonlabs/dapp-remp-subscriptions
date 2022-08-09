import dotenv from "dotenv"
dotenv.config()

const brokerList = process.env.KAFKA_BROKER_LIST || "kafka:29092"
const connectionString = process.env.REDIS_CONNECTION || "redis://redis:6379/0"

export const kafkaConfig = {
    clientId: "client-1",
    groupId: "group-1",
    brokers: brokerList
        .split(/[, ]/)
        .map(x => x.trim())
        .filter(x => x),
}

export const redisConfig = {
    connectionString,
}

// Topic in Kafka for incoming receipts
export const receiptTopic = "remp-receipts-0"

// To this channel Redis publishes events when new data comes
export const eventsChannel = "__keyspace@0__:*"

// To this channel Streams App published "OK" messages every 30 seconds
export const healthChannel = "remp-subscriptions-healthcheck"

export const receiptsKeyPrefix = `remp-receipts:`
