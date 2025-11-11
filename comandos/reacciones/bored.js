/**
 * name: bored
 * aliases: ["aburrido"]
 * description: Reacción anime: bored
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'bored') }
