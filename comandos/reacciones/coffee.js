/**
 * name: coffee
 * aliases: ["cafe"]
 * description: Reacción anime: coffee
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'coffee') }
