/**
 * name: kiss
 * aliases: ["muak"]
 * description: Reacción anime: kiss
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'kiss') }
