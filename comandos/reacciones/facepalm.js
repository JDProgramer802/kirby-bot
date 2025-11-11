/**
 * name: facepalm
 * aliases: []
 * description: Reacción anime: facepalm
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'facepalm') }
