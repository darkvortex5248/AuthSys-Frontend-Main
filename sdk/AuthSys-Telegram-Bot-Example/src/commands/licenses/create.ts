import { Context } from "grammy";
import { type Execute } from "../../interfaces/Command";
import { RequestAs } from "../../utilities/session";

export const name: string = "create";
export const description: string = "Create a new license.";
export const execute: Execute = async (ctx, bot) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  await ctx.reply("Please provide the expiration (in days) for the new license:");

  const response = await RequestAs(ctx, bot, "/generate-key", {
    duration: 30,
  });

  if (!response || response.status !== "success") {
    await ctx.reply(`Error: ${response?.detail || response?.message || "Unknown error"}`);
    return;
  }

  await ctx.reply(`License created successfully!\n\n\`${response.key}\``, { parse_mode: "MarkdownV2" });
};