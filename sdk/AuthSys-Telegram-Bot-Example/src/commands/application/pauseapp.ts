import { type Execute } from "../../interfaces/Command";
import { GetSellerKey } from "../../utilities/session";
import { Request } from "../../utilities/session";

export const name: string = "pauseapp";
export const description: string = "Pause an application and prevent users from logging in until the application is unpaused.";
export const execute: Execute = async (ctx, bot) => {
  const userId = ctx.from?.id;
  const sellerKeyGet = await GetSellerKey(ctx, bot);
  if (!sellerKeyGet || !userId) return;

  const response = await Request("/pause-app", {}, sellerKeyGet);

  if (response.status !== "success") {
    await ctx.reply(`❌ Error: ${response.detail || response.message}`);
    return;
  } else {
    await ctx.reply(`✅ Successfully paused the application.`);
  }
};
