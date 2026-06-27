const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require('../../utils/database')
const config = require('../../utils/config')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("set-license-note")
        .setDescription("Set a note for a key")
        .addStringOption((option) =>
            option
                .setName("note")
                .setDescription("Note to set")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("license")
                .setDescription("License to set note of")
                .setRequired(true)
        ),
    async execute(interaction) {
        let idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
        let ephemeral = !interaction.guild ? false : true;

        let sellerkey = await db.get(`token_${idfrom}`)
        if (sellerkey === null) return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Your \`SellerKey\` **has not been set!**\n In order to use this bot, you must run the \`/add-application\` Command First.`).setColor(Colors.Red).setTimestamp()], ephemeral: ephemeral })

        let note = interaction.options.getString("note")
        let license = interaction.options.getString("license")

        let json = await config.api("/set-key-note", { key_value: license, note: note }, sellerkey)
        if (json.status === "success") {
            interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.message).setColor(Colors.Green).setTimestamp().setFooter({ text: "AuthSys Discord Bot" })], ephemeral: ephemeral })
        } else {
            interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.detail || json.message).addFields([{ name: 'Note:', value: `Your seller key is most likely invalid. Change your seller key with \`/add-application\` command.` }]).setColor(Colors.Red).setFooter({ text: "AuthSys Discord Bot" }).setTimestamp()], ephemeral: ephemeral })
        }
    },
};
