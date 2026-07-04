const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require('../../utils/database')
const config = require('../../utils/config')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("retrieve-user-data")
        .setDescription("Retrieve information about a user.")
        .setDescriptionLocalizations({
            "en-US": "Retrieve information about a user.",
            "fi": "Hae tietoja käyttäjältä",
            "fr": "Récupérer des informations sur un utilisateur",
            "de": "Informationen von einem Benutzer abrufen",
            "it": "Recupera informazioni da un utente",
            "nl": "Informatie ophalen van een gebruiker",
            "ru": "Получить информацию о пользователе",
            "pl": "Pobierz informacje o użytkowniku",
            "tr": "Bir kullanıcıdan bilgi al",
            "cs": "Získejte informace o uživateli",
            "ja": "ユーザーから情報を取得する",
            "ko": "사용자에서 정보 검색",
        })
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("Specify the user to lookup")
                .setDescriptionLocalizations({
                    "en-US": "Specify the user to lookup",
                    "fi": "Määritä käyttäjä, jota etsitään",
                    "fr": "Spécifiez l'utilisateur à rechercher",
                    "de": "Geben Sie den Benutzer an, nach dem gesucht werden soll",
                    "it": "Specifica l'utente da cercare",
                    "nl": "Geef de gebruiker op die u wilt opzoeken",
                    "ru": "Укажите пользователя для поиска",
                    "pl": "Określ użytkownika do wyszukania",
                    "tr": "Aranacak kullanıcıyı belirtin",
                    "cs": "Zadejte uživatele, kterého chcete vyhledat",
                    "ja": "検索するユーザーを指定してください",
                    "ko": "찾을 사용자 지정",
                })
                .setRequired(true)
        ),
    async execute(interaction) {
        let idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
        let ephemeral = !interaction.guild ? false : true;

        let sellerkey = await db.get(`token_${idfrom}`)
        if (sellerkey === null) return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Your \`SellerKey\` **has not been set!**\n In order to use this bot, you must run the \`/add-application\` Command First.`).setColor(Colors.Red).setTimestamp()], ephemeral: ephemeral })

        let user = interaction.options.getString("user")

        let json = await config.api("/user-info", { username: user }, sellerkey)
        if (json.status !== "success") return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.detail || json.message).addFields([{ name: 'Note:', value: `Your seller key is most likely invalid. Change your seller key with \`/add-application\` command.` }]).setColor(Colors.Red).setFooter({ text: "AuthSys Discord Bot" }).setTimestamp()], ephemeral: ephemeral })

        const data = json.userdata || json;
        let hwid = data.hwid || "N/A";
        let ip = data.ip || "N/A";
        let lastlogin = data.last_login ? `<t:${Math.floor(new Date(data.last_login).getTime() / 1000)}:f>` : "N/A";
        let expiry = data.subscription_expires ? `<t:${Math.floor(new Date(data.subscription_expires).getTime() / 1000)}:f>` : "N/A";
        let createdOn = data.created_at ? `<t:${Math.floor(new Date(data.created_at).getTime() / 1000)}:f>` : "N/A";

        const embed = new EmbedBuilder()
            .setTitle(`User data for ${user}`)
            .addFields([
                { name: 'Expiry:', value: `${expiry}` },
                { name: 'Subscription:', value: `N/A` },
                { name: 'Last Login:', value: `${lastlogin}` },
                { name: 'HWID:', value: `${hwid}` },
                { name: 'Created On:', value: createdOn },
                { name: 'IP Address:', value: `${ip}` },
            ])
            .setColor(Colors.Blue)
            .setTimestamp()

        interaction.editReply({ embeds: [embed], ephemeral: ephemeral })
    },
};
