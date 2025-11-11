/**
 * name: greet
 * aliases: ["hi"]
 * description: Reacción anime: greet/hi
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'greet') }
