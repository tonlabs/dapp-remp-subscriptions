import { TonClient } from "@tonclient/core"
import { libNode } from "@tonclient/lib-node"

import { sdkUrl, dryRun } from "./config"
import { KafkaProducer } from "./kafkaProducer"
import { createReceipt } from "./createReceipt"
import { TPattern } from "./types"

TonClient.useBinaryLibrary(libNode)
const client = new TonClient()
/*
 * Each task combines receipt sender and subcriber
 */
export class Task {
    readonly pattern: TPattern
    readonly kafkaProducer: KafkaProducer
    readonly etalonKinds

    constructor(pattern: TPattern, kafkaProducer: KafkaProducer) {
        this.pattern = pattern
        this.kafkaProducer = kafkaProducer
        this.etalonKinds = new Set(pattern.events.map(event => event.kind))
    }

    async run(): Promise<number> {
        const messageId = (await client.crypto.generate_random_sign_keys())
            .public

        return new Promise((resolve, reject) => {
            /*
             * Scheduling messages to Kafka.
             */
            this.pattern.events.forEach(event => {
                setTimeout(() => {
                    const receipt = createReceipt(messageId, event.kind)
                    this.kafkaProducer
                        .sendMessage({
                            key: receipt.messageId,
                            value: JSON.stringify(receipt),
                        })
                        .catch(reject)
                }, event.timestamp)
            })

            if (dryRun) {
                /*
                 * I need next lines for testing test logic :-)
                 * It resolves just by a timer, not by subscriptiption callback
                 */
                const last = this.pattern.events[this.pattern.events.length - 1]
                setTimeout(
                    () => resolve(this.pattern.events.length),
                    last.timestamp,
                )
            }

            // Scheduling subscription with jitter
            const subscriptionStart =
                this.pattern.events[0].timestamp + rndFromInterval(0, 100)
            setTimeout(() => {
                // New client for each subscription
                const client = new TonClient({
                    network: {
                        server_address: sdkUrl,
                    },
                })

                const subscription = `subscription { 
                    rempReceipts(messageId: "${messageId}") { kind }
                }`

                client.net
                    .subscribe({ subscription }, x => {
                        if (x?.result?.rempReceipts?.kind) {
                            const kind = x.result.rempReceipts.kind
                            if (this.etalonKinds.has(kind)) {
                                this.etalonKinds.delete(kind)
                                if (this.etalonKinds.size === 0) {
                                    client.close()
                                    // Return amount of received receipts
                                    resolve(this.pattern.events.length)
                                }
                            } else {
                                reject(
                                    Error(
                                        `Pattern do not has such kind  ${kind}`,
                                    ),
                                )
                            }
                        } else {
                            console.log(x)
                            reject(Error(x.message || "Internal error"))
                        }
                    })
                    .catch(reject)
            }, subscriptionStart)
        })
    }
}

// Helper
function rndFromInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min)
}
