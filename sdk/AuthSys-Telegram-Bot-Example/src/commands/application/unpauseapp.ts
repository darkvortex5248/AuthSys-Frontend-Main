import { type Execute } from "../../interfaces/Command";
import { GetSellerKey } from "../../utilities/session";
import { Request } from "../../utilities/session";

export const name: string = "unpauseapp";
export const description: string = "Allow users to access an application again.";
export const execute: Execute = async (ctx, bot) => {
  const userId = ctx.from?.id;
  const sellerKeyGet = await GetSellerKey(ctx, bot);
  if (!sellerKeyGet || !userId) return;

  const response = await Request("/unpause-app", {}, sellerKeyGet);

  if (response.status !== "success") {
    await ctx.reply(`❌ Error: ${response.detail || response.message}`);
    return;
  } else {
    await ctx.reply(`✅ Successfully unpaused the application.`);
  }
};
