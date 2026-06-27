import { Context } from "grammy";
import { type Execute } from "../../interfaces/Command";
import { GetSellerKey, Request } from "../../utilities/session";
import { stateManager } from "../../utilities/state";

let sellerKey: string = "";

export const name: string = "delkey";
export const description: string = "Delete an existing license.";
export const execute: Execute = async (ctx, bot) => {
  const userId = ctx.from?.id;
  const sellerKeyGet = await GetSellerKey(ctx, bot);
  if (!sellerKeyGet || !userId) return;

  sellerKey = sellerKeyGet;

  await ctx.reply("What license would you like to delete?");

  stateManager.setWaitingForResponse(userId, "delkey", handleLicense);
};

async function handleLicense(ctx: Context): Promise<void> {
  const license = ctx.message?.text;
  const userId = ctx.from?.id;

  if (!license || !userId) {
    await ctx.reply("Please provide a valid license key.");
    return;
  }

  const response = await Request("/delete-key", {
    key_value: license,
  }, sellerKey);

  if (response.status !== "success") {
    await ctx.reply(`Error: ${response.detail || response.message}`);
    return;
  }

  await ctx.reply(`License deleted successfully: ${license}`);
}
