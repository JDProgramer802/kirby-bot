/**
 * name: eat
 * aliases: ["comer"]
 * description: Reacción anime: eat
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'eat') }
