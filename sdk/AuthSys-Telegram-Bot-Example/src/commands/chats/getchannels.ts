import { type Execute } from "../../interfaces/Command";
import { GetSellerKey, Request } from "../../utilities/session";

export const name: string = "getchannels";
export const description: string = "Retrieve all existing chat channels.";
export const execute: Execute = async (ctx, bot) => {
  const userId = ctx.from?.id;
  const sellerKeyGet = await GetSellerKey(ctx, bot);
  if (!sellerKeyGet || !userId) return;

  const response = await Request("/list-channels", {}, sellerKeyGet);

  if (response.status !== "success" || !response.chats) {
    await ctx.reply(`❌ Error: ${response.detail || response.message}`)
    return;
  }

  const esc = (text: any) => {
    if (!text) return "";
    return text.toString().replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
  };

  let details = `*${esc("Channels")}*\n\n`;

  for (const chat of response.chats) {
    details += `• ${esc(chat.name)} ${esc(`(${chat.delay} delay)`)}\\\n`
  }

  await ctx.reply(details, {
    parse_mode: "MarkdownV2",
  });
}
