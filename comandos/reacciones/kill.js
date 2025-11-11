/**
 * name: kill
 * aliases: []
 * description: Reacción anime: kill
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'kill') }
