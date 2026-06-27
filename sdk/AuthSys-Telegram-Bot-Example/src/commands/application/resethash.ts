import { type Execute } from "../../interfaces/Command";
import { GetSellerKey } from "../../utilities/session";
import { Request } from "../../utilities/session";

export const name: string = "resethash";
export const description: string = "Reset an applications hash.";
export const execute: Execute = async (ctx, bot) => {
  const userId = ctx.from?.id;
  const sellerKeyGet = await GetSellerKey(ctx, bot);
  if (!sellerKeyGet || !userId) return;

  const response = await Request("/reset-hash", {}, sellerKeyGet);

  if (response.status !== "success") {
    await ctx.reply(`❌ Error: ${response.detail || response.message}`);
    return;
  } else {
    await ctx.reply(`✅ Successfully reset the hash for the application.`);
  }
};
