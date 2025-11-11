/**
 * name: happy
 * aliases: ["feliz"]
 * description: Reacción anime: happy/feliz
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'happy') }
