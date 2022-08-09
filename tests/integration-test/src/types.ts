import patterns from "./testdata/patterns.json"

export type TPattern = typeof patterns[0]

export type RempReceipt = {
    kind: string
    messageId: string
    timestamp: number
    json: string
}
