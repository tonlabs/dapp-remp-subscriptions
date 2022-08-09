import { RempReceipt } from "./types"

export function createReceipt(messageId: string, kind: string) {
    const timestamp = Math.floor(Date.now() / 1000)
    const receipt: RempReceipt = {
        kind,
        messageId,
        timestamp,
        json: JSON.stringify({ kind, timestamp, message_id: messageId }),
    }

    return receipt
}
