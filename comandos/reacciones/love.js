/**
 * name: love
 * aliases: ["amor"]
 * description: Reacción anime: love/amor
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'love') }
