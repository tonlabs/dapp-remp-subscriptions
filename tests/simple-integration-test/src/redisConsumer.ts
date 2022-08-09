import { RedisClientType } from "@node-redis/client"
import { createClient } from "@node-redis/client"
import { redisConfig } from "./config"
import { eventsChannel, healthChannel } from "./config"

const { connectionString } = redisConfig

class RedisConsumer {
    subscriber: RedisClientType
    commander: RedisClientType

    async init() {
        // we need to create two clients, one for subscriptions and one for commands
        this.subscriber = createClient({ url: connectionString })
        this.subscriber.on("error", e => console.log("Subcriber error", e))
        await this.subscriber.connect()

        this.commander = this.subscriber.duplicate()
        this.commander.on("error", e => console.log("Command error", e))
        await this.commander.connect()

        console.log(`Connected to: ${connectionString}`)
    }

    async subscribeOnEvents(stat: Record<string, string>) {
        return this.subscriber.pSubscribe(
            eventsChannel,
            async (event, channel) => {
                try {
                    console.log("Got event", event, " from channel", channel)
                    if (event === "lpush") {
                        inc(stat, channel)
                        const key = channel.split(":").slice(1).join(":") // "aa:bb:cc".->  "bb:cc".
                        // Get last receipt for this key!
                        const [receipt] = await this.commander.lRange(key, 0, 0)
                        stat[key] = receipt + (stat[key] ? "," + stat[key] : "")
                    }
                } catch (e) {
                    console.log(e)
                    process.exit(1)
                }
            },
        )
    }
    async subscribeOnHealthChecks(stat: Record<string, string>) {
        await this.subscriber.subscribe(healthChannel, (message, channel) => {
            inc(stat, channel)
        })
    }
}

function inc(stat: Record<string, string>, channel: string): void {
    stat[channel] = (stat[channel] ? parseInt(stat[channel]) + 1 : 1).toString()
}

export const redisConsumer = new RedisConsumer()
