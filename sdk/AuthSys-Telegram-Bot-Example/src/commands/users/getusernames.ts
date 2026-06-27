import { InputFile } from "grammy";
import { type Execute } from "../../interfaces/Command";
import { GetSellerKey, Request } from "../../utilities/session";

export const name: string = "getusernames";
export const description: string = "Retrieve all usernames.";
export const execute: Execute = async (ctx, bot) => {
  const userId = ctx.from?.id;
  const sellerKeyGet = await GetSellerKey(ctx, bot);
  if (!sellerKeyGet || !userId) return;

  const message = await ctx.reply("⏳ Getting usernames...");

  const response = await Request("/list-usernames", {}, sellerKeyGet);

  if (response.status !== "success") {
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      `❌ Error: ${response.detail || response.message}`
    );
    return;
  }

  if (!response.usernames || response.usernames.length === 0) {
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      "❌ No usernames found."
    );
    return;
  }

  const jsonData = JSON.stringify(response.usernames, null, 2);
  const fileName = `usernames_${Date.now()}.json`;

  try {
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      `✅ Found ${response.usernames.length} usernames. Sending as JSON file...`
    );

    await ctx.replyWithDocument(
      new InputFile(Buffer.from(jsonData, 'utf-8'), fileName),
      {
        caption: `📄 Usernames JSON - ${response.usernames.length} users total`
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
