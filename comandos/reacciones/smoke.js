/**
 * name: smoke
 * aliases: []
 * description: Reacción anime: smoke (fumar)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'smoke') }
