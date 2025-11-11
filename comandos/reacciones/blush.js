/**
 * name: blush
 * aliases: []
 * description: Reacción anime: blush
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'blush') }
