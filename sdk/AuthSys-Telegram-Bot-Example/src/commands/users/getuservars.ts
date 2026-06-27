import { InputFile } from "grammy";
import { type Execute } from "../../interfaces/Command";
import { GetSellerKey, Request } from "../../utilities/session";

export const name: string = "getuservars";
export const description: string = "Retrieve all of the user variables.";
export const execute: Execute = async (ctx, bot) => {
  const userId = ctx.from?.id;
  const sellerKeyGet = await GetSellerKey(ctx, bot);
  if (!sellerKeyGet || !userId) return;

  const message = await ctx.reply("⏳ Getting user variables...");

  const response = await Request("/list-user-variables", {}, sellerKeyGet);

  if (response.status !== "success") {
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      `❌ Error: ${response.detail || response.message}`
    );
    return;
  }

  if (!response.vars || response.vars.length === 0) {
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      "❌ No user vars found."
    );
    return;
  }

  const jsonData = JSON.stringify(response.vars, null, 2);
  const fileName = `user_vars_${Date.now()}.json`;

  try {
    await ctx.api.editMessageText(
      message.chat.id,
      message.message_id,
      `✅ Found ${response.vars.length} user vars. Sending as JSON file...`
    );

    await ctx.replyWithDocument(
      new InputFile(Buffer.from(jsonData, 'utf-8'), fileName),
      {
        caption: `📄 User Variables JSON - ${response.vars.length} users total`
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
