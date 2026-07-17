import { type Execute } from "../../interfaces/Command";
import { GetSellerKey, Request } from "../../utilities/session";

export const name: string = "plan";
export const description: string = "View your current subscription plan and limits";
export const execute: Execute = async (ctx, bot) => {
  const sellerKey = await GetSellerKey(ctx, bot);
  if (!sellerKey) return;

  const response = await Request("/subscription-plan", {}, sellerKey);

  if (response.status !== "success") {
    await ctx.reply(`❌ Error: ${response.detail || response.message}`);
    return;
  }

  const plan = response.plan;
  const lines = [
    `📋 *Plan:* ${plan.name || "N/A"}`,
    `🏷️ *Tier:* ${response.tier || "N/A"}`,
    ``,
    `📊 **Limits**`,
    `• Max Apps: ${plan.max_apps ?? "∞"}`,
    `• Max Licenses: ${plan.max_licenses ?? "∞"}`,
    `• Max Users/App: ${plan.max_users_per_app ?? "∞"}`,
    `• Max Devices: ${plan.max_devices ?? "∞"}`,
    `• Max Staff: ${plan.max_staff ?? "∞"}`,
    `• Max Chatrooms: ${plan.max_chatrooms ?? "∞"}`,
    `• Max Variables: ${plan.max_variables ?? "∞"}`,
    ``,
    `✨ **Features**`,
    `• AI Agent: ${plan.ai_agent_access ? "✅" : "❌"}`,
    `• Webhooks: ${plan.has_webhooks ? "✅" : "❌"}`,
    `• White Label: ${plan.has_white_label ? "✅" : "❌"}`,
    `• Custom Domain: ${plan.has_custom_domain ? "✅" : "❌"}`,
  ];

  await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
};
