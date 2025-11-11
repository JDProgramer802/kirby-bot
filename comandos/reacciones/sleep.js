/**
 * name: sleep
 * aliases: []
 * description: Reacción anime: sleep (dormir)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'sleep') }
