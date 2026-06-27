import { InputFile } from "grammy";
import { type Execute } from "../../interfaces/Command";
import { GetSellerKey, Request } from "../../utilities/session";

export const name: string = "getusers";
export const description: string = "Get all of your users.";
export const execute: Execute = async (ctx, bot) => {
  const userId = ctx.from?.id;
  const sellerKeyGet = await GetSellerKey(ctx, bot);
  if (!sellerKeyGet || !userId) return;

  const message = await ctx.reply("⏳ Getting users...");

  const response = await Request("/list-users", {}, sellerKeyGet);

  if (response.status !== "success") {
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      `❌ Error: ${response.detail || response.message}`
    );
    return;
  }

  if (!response.users || response.users.length === 0) {
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      "❌ No users found."
    );
    return;
  }

  const jsonData = JSON.stringify(response.users, null, 2);
  const fileName = `users_${Date.now()}.json`;

  try {
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      `✅ Found ${response.users.length} users. Sending as JSON file...`
    );

    await ctx.replyWithDocument(
      new InputFile(Buffer.from(jsonData, 'utf-8'), fileName),
      {
        caption: `📄 Users JSON - ${response.users.length} users total`
      }
    );

  } catch (error) {
    console.error(error);
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      "❌ Failed to send JSON file. Please try again."
    );
  }
};
