import { type Execute } from "../../interfaces/Command";
import { RequestAs } from "../../utilities/session";

export const name: string = "appdetails";
export const description: string = "Get information about your application.";
export const execute: Execute = async (ctx, bot) => {
  const response = await RequestAs(ctx, bot, "/app-details");

  if (!response || response.status !== "success") {
    await ctx.reply(`Error: ${response?.detail || response?.message || "Unknown error"}`);
    return;
  }

  const d = response.appdetails;
  await ctx.reply(
    `Application Details:\n` +
    `Name: ${d.name}\n` +
    `App ID: ${d.app_id}\n` +
    `Owner ID: ${d.ownerid}\n` +
    `Secret: ${d.secret}\n` +
    `Version: ${d.version}`
  );
};
