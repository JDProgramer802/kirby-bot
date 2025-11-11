/**
 * name: sing
 * aliases: []
 * description: Reacción anime: sing (cantar)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'sing') }
