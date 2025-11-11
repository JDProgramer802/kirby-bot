/**
 * name: sad
 * aliases: ["triste"]
 * description: Reacción anime: sad/triste
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'sad') }
