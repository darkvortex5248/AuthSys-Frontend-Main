import { Context } from "grammy";
import { type Execute } from "../../interfaces/Command";
import { GetSellerKey } from "../../utilities/session";
import { Request } from "../../utilities/session";
import { stateManager } from "../../utilities/state";

let sellerKey: string = "";

export const name: string = "delalluservar";
export const description: string = "Delete all user variables by using just the user variable name";
export const execute: Execute = async (ctx, bot) => {
  const userId = ctx.from?.id;
  const sellerKeyGet = await GetSellerKey(ctx, bot);
  if (!sellerKeyGet || !userId) return;

  sellerKey = sellerKeyGet;

  await ctx.reply(
    "What is the variable you want to delete for all users? Please provide the variable name."
  );
  stateManager.setWaitingForResponse(userId, "delalluservar_variable", handleVariable);
};

async function handleVariable(ctx: Context): Promise<void> {
  const variable = ctx.message?.text;
  const userId = ctx.from?.id;

  if (!variable || !userId) {
    await ctx.reply("Please provide a valid variable name.");
    return;
  }

  const response = await Request("/delete-user-variable-all", {
    var_name: variable,
  }, sellerKey);

  if (response.status !== "success") {
    await ctx.reply(`❌ Error: ${response.detail || response.message}`);
    return;
  }

  await ctx.reply(`✅ All variables named ${variable} have been successfully deleted for all users.`);
}
