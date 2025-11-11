/**
 * name: draw
 * aliases: []
 * description: Reacción anime: draw
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'draw') }
