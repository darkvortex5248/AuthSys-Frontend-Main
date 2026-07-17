const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require('../../utils/database')
const config = require('../../utils/config')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("subscription")
        .setDescription("Redeem a subscription activation code")
        .addStringOption((option) =>
            option
                .setName("code")
                .setDescription("The activation code (e.g. DEV-A1B2C3D4)")
                .setRequired(true)
        ),
    async execute(interaction) {
        let idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
        let ephemeral = !interaction.guild ? false : true;

        let sellerkey = await db.get(`token_${idfrom}`)
        if (sellerkey === null) return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Your \`SellerKey\` **has not been set!**\n In order to use this bot, you must run the \`/add-application\` Command First.`).setColor(Colors.Red).setTimestamp()], ephemeral: ephemeral })

        let code = interaction.options.getString("code")

        let json = await config.api("/subscription-redeem", { code: code }, sellerkey)
        if (json.status === "success") {
            interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.detail || json.message).setDescription(`Upgraded to **${json.plan}** plan!`).setColor(Colors.Green).setTimestamp().setFooter({ text: "AuthSys Discord Bot" })], ephemeral: ephemeral })
        } else {
            interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.detail || json.message).addFields([{ name: 'Note:', value: `Your seller key is most likely invalid. Change your seller key with \`/add-application\` command.` }]).setColor(Colors.Red).setTimestamp().setFooter({ text: "AuthSys Discord Bot" })], ephemeral: ephemeral })
        }
    },
};
