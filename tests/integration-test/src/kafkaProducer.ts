import { Kafka, Producer, Message, logLevel } from "kafkajs"
import { kafkaConfig, receiptTopic } from "./config"

const { brokers, clientId } = kafkaConfig

export class KafkaProducer {
    producer: Producer

    constructor() {
        const kafka = new Kafka({
            clientId,
            brokers,
            logLevel: logLevel.INFO,
        })
        this.producer = kafka.producer()
    }

    async connect() {
        await this.producer.connect()
        console.log(`Connected to Kafka cluster ${brokers.join(" ,")}`)
    }

    async sendMessage(message: Message) {
        return this.producer.send({ topic: receiptTopic, messages: [message] })
    }
}
