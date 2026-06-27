import { Context } from "grammy";
import { stateManager } from "../../utilities/state";
import { type Execute } from "../../interfaces/Button";
import { Request } from "../../utilities/session";
import TelegramBot from "../../utilities/bot";

let botInstance: TelegramBot | null = null;
let responses: Record<number, { sellerKey: string; appName: string; appId: string }> = {};

export const name: string = "create_application";
export const cooldown: number = 30;
export const execute: Execute = async (ctx: Context, bot) => {
  await ctx.answerCallbackQuery();
  
  botInstance = bot;
  
  await ctx.reply("Please enter your AuthSys Seller API Key (starts with sk_...):");

  if (ctx.from && ctx.from.id) {
    responses[ctx.from.id] = {
      sellerKey: "",
      appName: "",
      appId: ""
    };
    
    stateManager.setWaitingForResponse(
      ctx.from.id,
      "create_application",
      handleSellerKeyResponse
    );
  } else {
    await ctx.reply("Sorry, I couldn't identify you. Please try again later.");
  }
};

async function handleSellerKeyResponse(ctx: Context): Promise<void> {
  const sellerKey = ctx.message?.text?.trim();
  const userId = ctx.from?.id;

  if (!sellerKey || !userId || !responses[userId] || !botInstance) {
    await ctx.reply("Please provide a valid seller key.");
    return;
  }

  if (!sellerKey.startsWith("sk_")) {
    await ctx.reply("Invalid seller key format. AuthSys seller keys start with 'sk_'. Please try again.");
    return;
  }

  const applications = await botInstance.database.get(`applications.${userId}`) || [];
  const existingApp = applications.find((app: { sellerkey: string }) => app.sellerkey === sellerKey);
  
  if (existingApp) {
    await ctx.reply(
      `⚠️ You already have an application with this seller key named "${existingApp.name}". Please use a different seller key or select the existing application with /setseller.`
    );
    
    delete responses[userId];
    stateManager.clearState(userId);
    return;
  }

  responses[userId].sellerKey = sellerKey;
  await ctx.reply("Seller key saved! Now, what is the Application ID you want to manage?");
  stateManager.setWaitingForResponse(userId, "create_application", handleAppIdResponse);
}

async function handleAppIdResponse(ctx: Context): Promise<void> {
  const appId = ctx.message?.text?.trim();
  const userId = ctx.from?.id;

  if (!appId || !userId || !responses[userId]) {
    await ctx.reply("Please provide a valid Application ID.");
    return;
  }

  const appIdNum = parseInt(appId, 10);
  if (isNaN(appIdNum)) {
    await ctx.reply("Please enter a numeric Application ID.");
    return;
  }

  responses[userId].appId = appId;
  await ctx.reply("Application ID saved! Now, please tell me what you would like to name this application:");
  stateManager.setWaitingForResponse(userId, "create_application", handleAppNameResponse);
}

async function handleAppNameResponse(ctx: Context): Promise<void> {
  const appName = ctx.message?.text?.trim();
  const userId = ctx.from?.id;

  if (!appName || !userId || !responses[userId]) {
    await ctx.reply("I was expecting a text message. Let's try again later.");
    return;
  }

  responses[userId].appName = appName;
  
  if (botInstance) {
    try {
      const loadingMessage = await ctx.reply("⏳ Validating seller key with AuthSys API...");
      
      const response = await Request("/app-stats", { app_id: responses[userId].appId }, responses[userId].sellerKey);

      if (!response || response.status !== "success") {
        await ctx.api.editMessageText(
          loadingMessage.chat.id,
          loadingMessage.message_id,
          `❌ Error: Could not validate seller key or app. ${response?.detail || response?.message || "Invalid credentials"}`
        );
        delete responses[userId];
        return;
      }
      
      const applications = await botInstance.database.get(`applications.${userId}`) || [];
      
      applications.push({
        name: responses[userId].appName,
        sellerkey: responses[userId].sellerKey,
        app_id: responses[userId].appId
      });
      
      await ctx.api.editMessageText(
        loadingMessage.chat.id,
        loadingMessage.message_id,
        "⏳ Saving to database..."
      );
      
      await botInstance.database.set(`applications.${userId}`, applications);
      await botInstance.database.set(`selectedapp.${userId}`, responses[userId].sellerKey);
      
      await ctx.api.editMessageText(
        loadingMessage.chat.id,
        loadingMessage.message_id,
        `✅ Application "${responses[userId].appName}" (ID: ${responses[userId].appId}) saved successfully!`
      );
      
      delete responses[userId];
    } catch (error) {
      await ctx.reply("There was an error saving your application. Please try again.");
      console.error("Database error:", error);
    }
  } else {
    await ctx.reply("There was an internal error. Please try again later.");
  }
}
