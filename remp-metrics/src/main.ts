import assert from "assert"
import StatsD from "hot-shots"

import { RempReceipt } from "./types"
import { Kafka } from "kafkajs"
import * as cfg from "./config"

const NO_REMP_YET = "NoRempYet"

const cache: Map<string, string> = new Map()
const statsd = new StatsD(cfg.statsd)
const kafka = new Kafka(cfg.kafka)

async function main() {
    const consumer = kafka.consumer({ groupId: cfg.groupId })
    await consumer.connect()
    await consumer.subscribe({
        topic: cfg.requestTopic,
        fromBeginning: false,
    })
    await consumer.subscribe({
        topic: cfg.receiptTopic,
        fromBeginning: false,
    })
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            if (topic === cfg.requestTopic) {
                // Registering new message
                const id = message.key.slice(0, 32).toString("hex")
                assert(cache.has(id) === false, "Request with the same key?")
                cache.set(id, NO_REMP_YET)
                setTimeout(sendMetric, cfg.timeWindows[0], id, 0)
            } else {
                /* topic === cfg.receiptTopic */
                let rcpt: RempReceipt
                try {
                    rcpt = JSON.parse(message.value.toString())
                } catch (e) {
                    console.log("Skip JSON.parse error:\n", e)
                    return
                }
                const id = rcpt.message_id
                const kind = getNormalizedKind(rcpt.kind)
                if (cache.has(id)) {
                    if (kind !== "") {
                        // No updates allowed if it's "Finalized" already
                        if (cache.get(id) !== "Finalized") {
                            cache.set(id, kind)
                            console.log("Set", id, kind)
                        } else {
                            console.log("Do not change Finalized to", kind)
                        }
                    }
                } else {
                    console.log(
                        `Too late. Got REMP receipt after 10 min, id ${id}`,
                    )
                }
            }
        },
    })
}

main().catch(err => {
    console.log(err)
    process.exit(1)
})

/* Params:
 * id: string (messageId)
 * step: number (0...timeWindow.length)
 */
const sendMetric = (id: string, step: number) => {
    const kind = cache.get(id)
    assert(!!kind)

    statsd.increment(cfg.metrics.messagesStatus, {
        kind,
        window: cfg.timeWindows[step].toString(),
    })

    const millis = cfg.timeWindows[step]

    if (millis >= 60000 && kind !== "Finalized") {
        console.log("Msg", id, "has kind", kind, "after", millis, " s.")
    }

    if (step === cfg.timeWindows.length - 1) {
        // It was the last measurment, delete id from cache
        console.log("Clear key:", id)
        cache.delete(id)
    } else {
        // Lets schedule another sendMetric run
        setTimeout(sendMetric, cfg.timeWindows[step + 1] - millis, id, step + 1)
    }
}

// Helper. Filters only enabled kinds
function getNormalizedKind(kind: string): string {
    if (!kind) {
        return ""
    }
    const index = cfg.enabledKinds.findIndex(
        el => el.toUpperCase() === kind.toUpperCase(),
    )
    return index !== -1 ? cfg.enabledKinds[index] : ""
}
