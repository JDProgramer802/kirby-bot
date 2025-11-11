/**
 * name: pat
 * aliases: []
 * description: Reacción anime: pat (acariciar)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'pat') }
