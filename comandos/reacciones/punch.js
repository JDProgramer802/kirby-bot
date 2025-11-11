/**
 * name: punch
 * aliases: []
 * description: Reacción anime: punch (puñetazo)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'punch') }
