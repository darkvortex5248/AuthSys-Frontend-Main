import { InputFile } from "grammy";
import { type Execute } from "../../interfaces/Command";
import { RequestAs } from "../../utilities/session";

export const name: string = "getkeys";
export const description: string = "Get all of your license keys.";
export const execute: Execute = async (ctx, bot) => {
  const message = await ctx.reply("Getting license keys...");

  const response = await RequestAs(ctx, bot, "/list-keys", { limit: 100 });

  if (!response || response.status !== "success") {
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      `Error: ${response?.detail || response?.message || "Unknown error"}`
    );
    return;
  }

  if (!response.keys || response.keys.length === 0) {
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      "No license keys found."
    );
    return;
  }

  const jsonData = JSON.stringify(response.keys, null, 2);
  const fileName = `license_keys_${Date.now()}.json`;

  try {
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      `Found ${response.keys.length} license keys. Sending as JSON file...`
    );

    await ctx.replyWithDocument(
      new InputFile(Buffer.from(jsonData, 'utf-8'), fileName),
      { caption: `License Keys JSON - ${response.keys.length} keys total` }
    );
  } catch (error) {
    console.error(error);
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      "Failed to send JSON file. Please try again."
    );
  }
};
