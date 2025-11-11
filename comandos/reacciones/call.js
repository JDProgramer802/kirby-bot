/**
 * name: call
 * aliases: []
 * description: Reacción anime: call
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'call') }
