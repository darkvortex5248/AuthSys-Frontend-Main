const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require('../../utils/database')
const config = require('../../utils/config')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("plan")
        .setDescription("View your current subscription plan and limits"),
    async execute(interaction) {
        let idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
        let ephemeral = !interaction.guild ? false : true;

        let sellerkey = await db.get(`token_${idfrom}`)
        if (sellerkey === null) return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Your \`SellerKey\` **has not been set!**\n In order to use this bot, you must run the \`/add-application\` Command First.`).setColor(Colors.Red).setTimestamp()], ephemeral: ephemeral })

        let json = await config.api("/subscription-plan", {}, sellerkey)
        if (json.status === "success") {
            const plan = json.plan;
            const embed = new EmbedBuilder()
                .setTitle(`Plan: ${plan.name || "N/A"}`)
                .setColor(Colors.Blue)
                .addFields(
                    { name: "Tier", value: json.tier || "N/A", inline: true },
                    { name: "Max Apps", value: `${plan.max_apps ?? "∞"}`, inline: true },
                    { name: "Max Licenses", value: `${plan.max_licenses ?? "∞"}`, inline: true },
                    { name: "Max Users/App", value: `${plan.max_users_per_app ?? "∞"}`, inline: true },
                    { name: "Max Devices", value: `${plan.max_devices ?? "∞"}`, inline: true },
                    { name: "Max Staff", value: `${plan.max_staff ?? "∞"}`, inline: true },
                    { name: "Max Chatrooms", value: `${plan.max_chatrooms ?? "∞"}`, inline: true },
                    { name: "Max Variables", value: `${plan.max_variables ?? "∞"}`, inline: true },
                    { name: "AI Agent", value: plan.ai_agent_access ? "Yes" : "No", inline: true },
                    { name: "Webhooks", value: plan.has_webhooks ? "Yes" : "No", inline: true },
                    { name: "White Label", value: plan.has_white_label ? "Yes" : "No", inline: true },
                    { name: "Custom Domain", value: plan.has_custom_domain ? "Yes" : "No", inline: true },
                )
                .setTimestamp()
                .setFooter({ text: "AuthSys Discord Bot" })
            interaction.editReply({ embeds: [embed], ephemeral: ephemeral })
        } else {
            interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.detail || json.message).addFields([{ name: 'Note:', value: `Your seller key is most likely invalid. Change your seller key with \`/add-application\` command.` }]).setColor(Colors.Red).setTimestamp().setFooter({ text: "AuthSys Discord Bot" })], ephemeral: ephemeral })
        }
    },
};
