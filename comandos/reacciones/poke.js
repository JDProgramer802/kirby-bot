/**
 * name: poke
 * aliases: []
 * description: Reacción anime: poke (picar)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'poke') }
