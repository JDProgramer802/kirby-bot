/**
 * name: laugh
 * aliases: []
 * description: Reacción anime: laugh (reír)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'laugh') }
