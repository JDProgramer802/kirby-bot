/**
 * name: hug
 * aliases: []
 * description: Reacción anime: hug
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'hug') }
