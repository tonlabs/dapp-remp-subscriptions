import { Task } from "./Task"
import { TPattern } from "./types"

import patterns from "./testdata/patterns.json"
import { KafkaProducer } from "./kafkaProducer"

const statistics: Record<string, number> = {}

async function main() {
    /* Calculate test duration  */
    const testDuration = patterns.reduce(
        (acc, ptn) =>
            Math.max(
                acc,
                ptn.events[ptn.events.length - 1].timestamp * ptn.ncycles,
            ),
        0,
    )
    console.log("Optimistic duration", Math.floor(testDuration / 1000), "sec.")

    /* One connection for all tasks */
    const kafkaProducer = new KafkaProducer()
    await kafkaProducer.connect()
    const startedAt = Date.now()

    async function runPattern(pattern: TPattern) {
        while (pattern.ncycles > 0) {
            const runningTasks = []
            for (let i = 0; i < pattern.parallel; i++) {
                /*
                 * Each task combines receipt sender and subcriber
                 */
                const task = new Task(pattern, kafkaProducer).run()
                runningTasks.push(task)
            }
            const results: number[] = await Promise.all(runningTasks)
            statistics[pattern.name] =
                (statistics[pattern.name] || 0) +
                results.reduce((sum, x) => sum + x)

            const now = Math.floor((Date.now() - startedAt) / 1000)
            console.log(now, "sec.", statistics)

            pattern.ncycles--
        }
    }
    await Promise.all(patterns.map(runPattern))
}

main()
    .then(() => {
        console.log("Success!")
        process.exit(0)
    })
    .catch(err => {
        console.log(err)
        process.exit(1)
    })
