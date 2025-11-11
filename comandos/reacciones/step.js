/**
 * name: step
 * aliases: ["pisar"]
 * description: Reacción anime: step (pisar)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'step') }
