import dotenv from "dotenv"
dotenv.config()

const brokerList = process.env.KAFKA_BROKER_LIST || "kafka:29092"

export const sdkUrl = process.env.SDK_URL || "http://q-server:4000" // sdk2.dev.tonlabs.io:4011

export const kafkaConfig = {
    clientId: "client-2",
    groupId: "group-2",
    brokers: brokerList
        .split(/[, ]/)
        .map(x => x.trim())
        .filter(x => x),
}

// Topic in Kafka for incoming receipts
export const receiptTopic = "remp-receipts-0"

export const dryRun = process.env.DRY_RUN
