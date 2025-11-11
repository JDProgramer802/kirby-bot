/**
 * name: dramatic
 * aliases: ["drama"]
 * description: Reacción anime: dramatic
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'dramatic') }
