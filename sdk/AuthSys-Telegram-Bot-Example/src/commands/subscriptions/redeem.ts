import { type Execute } from "../../interfaces/Command";
import { GetSellerKey, Request } from "../../utilities/session";

export const name: string = "subscription";
export const description: string = "Redeem a subscription activation code";
export const execute: Execute = async (ctx, bot) => {
  const sellerKey = await GetSellerKey(ctx, bot);
  if (!sellerKey) return;

  const code = ctx.message?.text?.split(" ").slice(1).join(" ").trim();
  if (!code) {
    await ctx.reply("Please provide an activation code.\nUsage: /subscription <CODE>");
    return;
  }

  const response = await Request("/subscription-redeem", { code }, sellerKey);

  if (response.status !== "success") {
    await ctx.reply(`❌ Error: ${response.detail || response.message}`);
    return;
  }

  await ctx.reply(`✅ ${response.message || "Upgraded successfully!"}\n\nPlan: **${response.plan}**\nTier: **${response.tier}**`);
};
