import { Context } from "grammy";
import { type Execute } from "../../interfaces/Command";
import { GetSellerKey, Request } from "../../utilities/session";
import { stateManager } from "../../utilities/state";

let sellerKey: string = "";

export const name: string = "getinfo";
export const description: string = "Get information about a license.";
export const execute: Execute = async (ctx, bot) => {
  const userId = ctx.from?.id;
  const sellerKeyGet = await GetSellerKey(ctx, bot);
  if (!sellerKeyGet || !userId) return;

  sellerKey = sellerKeyGet;

  await ctx.reply("What license would you like to get the info of?");

  stateManager.setWaitingForResponse(userId, "getinfo", handleLicense);
};

async function handleLicense(ctx: Context): Promise<void> {
  const license = ctx.message?.text;
  const userId = ctx.from?.id;

  if (!license || !userId) {
    await ctx.reply("Please provide a valid license key.");
    return;
  }

  const response = await Request("/key-info", {
    key_value: license,
  }, sellerKey);

  if (response.status !== "success") {
    await ctx.reply(`Error: ${response.detail || response.message}`);
    return;
  }

  await ctx.reply(
    `License Info:\n` +
    `Key: ${license}\n` +
    `Status: ${response.is_paused ? "Paused" : "Active"}\n` +
    `Duration: ${response.duration_days || 0} days\n` +
    `Created By: ${response.createdby || "system"}\n` +
    `Created Date: ${response.creationdate || "N/A"}\n` +
    `Used By: ${response.usedby || "None"}\n` +
    `Note: ${response.note || "None"}`
  );
}
