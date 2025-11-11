/**
 * name: scream
 * aliases: []
 * description: Reacción anime: scream (gritar)
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'scream') }
