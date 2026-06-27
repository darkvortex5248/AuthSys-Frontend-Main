const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require('../../utils/database')
const config = require('../../utils/config')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("license-info")
        .setDescription("Info On key")
        .setDescriptionLocalizations({
            "en-US": "Info On key",
            "fi": "Tietoja avaimesta",
            "fr": "Info sur la clé",
            "de": "Info zur Taste",
            "it": "Info sulla chiave",
            "nl": "Info over sleutel",
            "ru": "Информация о ключе",
            "pl": "Informacje o kluczu",
            "tr": "Anahtar hakkında bilgi",
            "cs": "Informace o klíči",
            "ja": "キーに関する情報",
            "ko": "키 정보",
        })
        .addStringOption((option) =>
            option
                .setName("license")
                .setDescription("Specify key")
                .setDescriptionLocalizations({
                    "en-US": "Specify key",
                    "fi": "Määritä avain",
                    "fr": "Spécifier la clé",
                    "de": "Schlüssel angeben",
                    "it": "Specifica la chiave",
                    "nl": "Geef sleutel op",
                    "ru": "Укажите ключ",
                    "pl": "Określ klucz",
                    "tr": "Anahtarı belirtin",
                    "cs": "Zadejte klíč",
                    "ja": "キーを指定する",
                    "ko": "키 지정",
                })
                .setRequired(true)
        ),
    async execute(interaction) {
        let idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
        let ephemeral = !interaction.guild ? false : true;

        let sellerkey = await db.get(`token_${idfrom}`)
        if (sellerkey === null) return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Your \`SellerKey\` **has not been set!**\n In order to use this bot, you must run the \`/add-application\` Command First.`).setColor(Colors.Red).setTimestamp()], ephemeral: ephemeral })

        let key = interaction.options.getString("license")

        let json = await config.api("/key-info", { key_value: key }, sellerkey)
        if (json.status !== "success") return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.detail || json.message).addFields([{ name: 'Note:', value: `Your seller key is most likely invalid. Change your seller key with \`/add-application\` command.` }]).setColor(Colors.Red).setFooter({ text: "AuthSys Discord Bot" }).setTimestamp()], ephemeral: ephemeral })

        const embed = new EmbedBuilder()
            .setTitle(`Key Information for ${key}`)
            .addFields([
                { name: 'Status:', value: `${json.status || json.data?.status || 'N/A'}` },
                { name: 'Level:', value: `${json.data?.level || 'N/A'}` },
                { name: 'Created By:', value: `${json.data?.created_by || 'N/A'}` },
                { name: 'Created On:', value: `${json.data?.created_on || 'N/A'}` },
            ])
            .setColor(Colors.Blue)
            .setTimestamp()

        interaction.editReply({ embeds: [embed], ephemeral: ephemeral })
    },
};
