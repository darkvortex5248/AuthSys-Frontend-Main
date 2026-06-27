const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require('../../utils/database')
const config = require('../../utils/config')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban-user")
        .setDescription("Ban user")
        .setDescriptionLocalizations({
            "en-US": "Ban user",
            "fi": "Estä käyttäjä",
            "fr": "Bannir l'utilisateur",
            "de": "Benutzer sperren",
            "it": "Banna l'utente",
            "nl": "Blokkeer gebruiker",
            "ru": "Забанить пользователя",
            "pl": "Zbanuj użytkownika",
            "tr": "Kullanıcıyı yasakla",
            "cs": "Zakázat uživatele",
            "ja": "ユーザーを禁止する",
            "ko": "사용자를 금지하다",
        })
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("Enter the username of the user you'd like to ban.")
                .setDescriptionLocalizations({
                    "en-US": "Enter the username of the user you'd like to ban.",
                    "fi": "Käyttäjä, jonka haluat estää",
                    "fr": "Utilisateur que vous souhaitez bannir",
                    "de": "Benutzer, den Sie sperren möchten",
                    "it": "Utente che desideri bannare",
                    "nl": "Gebruiker die u wilt blokkeren",
                    "ru": "Пользователь, которого вы хотите забанить",
                    "pl": "Użytkownik, którego chcesz zbanować",
                    "tr": "Yasaklamak istediğiniz kullanıcı",
                    "cs": "Uživatel, kterého chcete zakázat",
                    "ja": "禁止したいユーザー",
                    "ko": "금지하려는 사용자",
                })
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("Enter the reason for the ban.")
                .setDescriptionLocalizations({
                    "en-US": "Enter the reason for the ban.",
                    "fi": "Syy bannille",
                    "fr": "Raison du bannissement",
                    "de": "Grund für die Sperrung",
                    "it": "Motivo del ban",
                    "nl": "Reden voor de ban",
                    "ru": "Причина бана",
                    "pl": "Powód banowania",
                    "tr": "Yasaklama nedeni",
                    "cs": "Důvod pro zakázání",
                    "ja": "禁止の理由",
                    "ko": "금지의 이유",
                })
                .setRequired(true)
        ),
    async execute(interaction) {
        let idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
        let ephemeral = !interaction.guild ? false : true;

        let sellerkey = await db.get(`token_${idfrom}`)
        if (sellerkey === null) return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Your \`SellerKey\` **has not been set!**\n In order to use this bot, you must run the \`/add-application\` Command First.`).setColor(Colors.Red).setTimestamp()], ephemeral: ephemeral })

        let user = interaction.options.getString("user")
        let reason = interaction.options.getString("reason")

        let json = await config.api("/ban-user", { username: user, reason: reason }, sellerkey)
        if (json.status === "success") {
            interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.message).setColor(Colors.Green).setTimestamp().setFooter({ text: "AuthSys Discord Bot" })], ephemeral: ephemeral })
        } else {
            interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.detail || json.message).addFields([{ name: 'Note:', value: `Your seller key is most likely invalid. Change your seller key with \`/add-application\` command.` }]).setColor(Colors.Red).setTimestamp().setFooter({ text: "AuthSys Discord Bot" })], ephemeral: ephemeral })
        }
    },
};
