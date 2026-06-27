const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require('../../utils/database')
const config = require('../../utils/config')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("edit-username")
        .setDescription("Change users username.")
        .addStringOption((option) =>
            option
                .setName("currentusername")
                .setDescription("The username of the user you'd like to change.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("newusername")
                .setDescription("Default 'newusername'")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("sessionid")
                .setDescription("Default 'sessionid'")
                .setRequired(true)
        ),
    async execute(interaction) {
        let idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
        let ephemeral = !interaction.guild ? false : true;

        let sellerkey = await db.get(`token_${idfrom}`)
        if (sellerkey === null) return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Your \`SellerKey\` **has not been set!**\n In order to use this bot, you must run the \`/add-application\` Command First.`).setColor(Colors.Red).setTimestamp()], ephemeral: ephemeral })

        let currentusername = interaction.options.getString("currentusername")
        let newusername = interaction.options.getString("newusername") || "newusername"
        let sessionid = interaction.options.getString("sessionid") || "sessionid"

        let json = await config.api("/edit-username", { currentUsername: currentusername, newUsername: newusername, sessionID: sessionid }, sellerkey)
        if (json.status === "success") {
            interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.message).setColor(Colors.Blue).setTimestamp()], ephemeral: ephemeral })
        } else {
            interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.detail || json.message).addFields([{ name: 'Note:', value: `Your seller key is most likely invalid. Change your seller key with \`/add-application\` command.` }]).setColor(Colors.Red).setFooter({ text: "AuthSys Discord Bot" }).setTimestamp()], ephemeral: ephemeral })
        }

    },
};
