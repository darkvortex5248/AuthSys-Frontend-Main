import { type Execute } from "../../interfaces/Command";
import { RequestAs } from "../../utilities/session";

export const name: string = "stats";
export const description: string = "Retrieve stats from an application.";
export const execute: Execute = async (ctx, bot) => {
  const response = await RequestAs(ctx, bot, "/app-stats");

  if (!response || response.status !== "success") {
    await ctx.reply(`Error: ${response?.detail || response?.message || "Unknown error"}`);
    return;
  }

  await ctx.reply(
    `Application Statistics:\n\n` +
    `Total Keys: ${response.totalkeys || 0}\n` +
    `Unused Keys: ${response.unused || 0}\n` +
    `Used Keys: ${response.used || 0}\n` +
    `Paused Keys: ${response.paused || 0}\n\n` +
    `Total Users: ${response.totalaccs || 0}\n` +
    `Active Users: ${response.active_users || 0}\n` +
    `Banned Users: ${response.banned_users || 0}\n\n` +
    `Webhooks: ${response.webhooks || 0}\n` +
    `Variables: ${response.vars || 0}`
  );
};
