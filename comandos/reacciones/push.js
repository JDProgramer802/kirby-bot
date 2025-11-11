/**
 * name: push
 * aliases: []
 * description: Reacción anime: push (empujar)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'push') }
