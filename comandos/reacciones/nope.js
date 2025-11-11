/**
 * name: nope
 * aliases: []
 * description: Reacción anime: nope (negarse)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'nope') }
