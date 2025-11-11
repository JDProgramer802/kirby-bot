/**
 * name: shy
 * aliases: ["timido"]
 * description: Reacción anime: shy/timido (timidez)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'shy') }
