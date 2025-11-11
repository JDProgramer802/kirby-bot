/**
 * name: clap
 * aliases: ["aplaudir"]
 * description: Reacción anime: clap
 * category: Reacciones
 */
import { sendReaction } from './_common.js'
export async function run(ctx){ await sendReaction(ctx,'clap') }
