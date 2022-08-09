import { kafkaProducer } from "./kafkaProducer"
import { redisConsumer } from "./redisConsumer"

import records from "./testdata/receipts.json"

// Set test duration = 40 seconds to catch exactly one health check message
const TEST_DURATION_SECS = 40

const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

// Object collecting statistics
const stats: Record<string, string> = {}

async function main() {
    // Print statistics and exits after TEST_DURATION_SECS
    setInterval(checkProgress(Date.now()), 1000)

    // Subscribing on Redis channels
    await redisConsumer.init()
    await redisConsumer.subscribeOnEvents(stats)
    await redisConsumer.subscribeOnHealthChecks(stats)

    // Start producing "receipts" into Kafka
    await kafkaProducer.init()
    for (const [ms, key, value] of records) {
        await sleep(ms as number)
        await kafkaProducer.sendMessage({
            key: key as string,
            value: value as string,
        })
    }
}

main().catch(err => {
    console.log(err)
    process.exit(1)
})

function checkProgress(startTime: number) {
    let prevStat: string
    return function () {
        const stat = JSON.stringify(
            Object.keys(stats)
                .sort()
                .map(k => ({ [k]: stats[k] })),
            null,
            2,
        )
        if (prevStat !== stat) {
            console.log("Statistics:", stat)
            prevStat = stat
        }
        if (Date.now() >= startTime + TEST_DURATION_SECS * 1000) {
            if (
                stats["remp-receipts:id1"] === "P,N,L,K,H,G,E,D,A" &&
                stats["remp-receipts:id2"] === "Q,J,L,F,B" &&
                stats["remp-receipts:id3"] === "O,M,I,C" &&
                parseInt(stats["remp-subscriptions-healthcheck"]) > 0
            ) {
                console.log("Success")
                process.exit(0)
            } else {
                console.log("Test failed, required conditions not")
                process.exit(1)
            }
        }
    }
}
