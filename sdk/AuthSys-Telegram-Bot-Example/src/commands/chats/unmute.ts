import { Context } from "grammy";
import { type Execute } from "../../interfaces/Command";
import { GetSellerKey, Request } from "../../utilities/session";
import { stateManager } from "../../utilities/state";

let sellerKey: string = "";

export const name: string = "unmute";
export const description: string = "Unmute a user and allow them to chat again in the chat channel.";
export const execute: Execute = async (ctx, bot) => {
  const userId = ctx.from?.id;
  const sellerKeyGet = await GetSellerKey(ctx, bot);
  if (!sellerKeyGet || !userId) return;

  sellerKey = sellerKeyGet;

  await ctx.reply("Who would you like to unmute?")
  stateManager.setWaitingForResponse(userId, "mute", handleMuteUser);
}

async function handleMuteUser(ctx: Context): Promise<void> {
  const inputUser = ctx.message?.text;
  const userId = ctx.from?.id;

  if (inputUser && userId) {
    const response = await Request("/unmute-user", {
      user: inputUser
    }, sellerKey);

    if (response.status !== "success") {
      await ctx.reply(`❌ Error: ${response.detail || response.message}`);
      return;
    } else {
      await ctx.reply(`✅ User ${inputUser} has been unmuted.`);
    }
  } else {
    await ctx.reply("Please provide a valid user to mute.");
  }
}
