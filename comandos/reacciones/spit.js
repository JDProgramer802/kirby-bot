/**
 * name: spit
 * aliases: ["escupir"]
 * description: Reacción anime: spit (escupir)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'spit') }
