/**
 * name: tickle
 * aliases: []
 * description: Reacción anime: tickle (cosquillas)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'tickle') }
