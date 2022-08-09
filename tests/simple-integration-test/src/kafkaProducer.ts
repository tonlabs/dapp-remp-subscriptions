import { Kafka, Producer, Message, logLevel } from "kafkajs"
import { kafkaConfig, receiptTopic } from "./config"

const { brokers, clientId } = kafkaConfig

class KafkaProducer {
    producer: Producer

    constructor() {
        const kafka = new Kafka({
            clientId,
            brokers,
            logLevel: logLevel.INFO,
        })
        this.producer = kafka.producer()
    }

    async init() {
        await this.producer.connect()
        console.log(`Connected to Kafka cluster ${brokers.join(" ,")}`)
    }

    async sendMessage(message: Message) {
        await this.producer.send({ topic: receiptTopic, messages: [message] })
    }

    async disconnect() {
        console.log(`Disconnecting...`)
        await this.producer
            .disconnect()
            .then(() => {
                console.log(`Done.`)
            })
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            .catch(() => {})
    }
}

export const kafkaProducer = new KafkaProducer()
