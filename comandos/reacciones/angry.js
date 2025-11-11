/**
 * name: angry
 * aliases: ["enojado"]
 * description: Reacción anime: angry
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'angry') }
