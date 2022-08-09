import dotenv from "dotenv"
import { logLevel } from "kafkajs"

dotenv.config()

const brokerList = process.env.KAFKA_BROKER_LIST || "kafka:29092"

export const kafka = {
    clientId: "remp-metric-2-app",
    logLevel: logLevel.INFO,
    brokers: brokerList
        .split(/[, ]/)
        .map(x => x.trim())
        .filter(x => x),
}
export const groupId = "remp-metric-2-group"
export const requestTopic = "requests"
export const receiptTopic = "remp-receipts"

export const statsd = {
    host: process.env.STATSD_HOST || "statsd",
    port: parseInt(process.env.STATSD_PORT || "9125"),
    cacheDns: true,
}
export const metrics = {
    messagesStatus: "test2_remp_messages_final_status",
}

export const timeWindows = [3, 6, 9, 15, 30, 60, 90, 180, 600].map(
    x => x * 1000,
)
export const enabledKinds = [
    "SentToValidators",
    "RejectedByFullnode",
    "IncludedIntoBlock",
    "IncludedIntoAcceptedBlock",
    "Finalized",
]
