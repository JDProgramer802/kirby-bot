/**
 * name: lewd
 * aliases: []
 * description: Reacción anime: lewd (SFW preferido, usa gif/video)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'lewd') }
