const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require('../../utils/database')
const config = require('../../utils/config')

module.exports = {
	data: new SlashCommandBuilder()
		.setName("delete-used-licenses")
		.setDescription("Delete Used Licenses")
		.setDescriptionLocalizations({
			"en-US": "Delete Used Licenses",
			"fi": "Poista käytetyt lisenssit",
			"fr": "Supprimer les licences utilisées",
			"de": "Verwendete Lizenzen löschen",
			"it": "Elimina licenze utilizzate",
			"nl": "Verwijder gebruikte licenties",
			"ru": "Удалить использованные лицензии",
			"pl": "Usuń używane licencje",
			"tr": "Kullanılan Lisansları Sil",
			"cs": "Odstranit použité licence",
			"ja": "使用済みのライセンスを削除する",
			"ko": "사용된 라이센스 삭제",
		}),
	async execute(interaction) {
		let idfrom = null;
		let ephemeral = true;

		if (interaction.guild == null) {
			idfrom = interaction.user.id;
			ephemeral = false;
		}
		else {
			idfrom = interaction.guild.id;
		}

		let sellerkey = await db.get(`token_${idfrom}`)
		if (sellerkey === null) return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Your \`SellerKey\` **has not been set!**\n In order to use this bot, you must run the \`/add-application\` Command First.`).setColor(Colors.Red).setTimestamp()], ephemeral: ephemeral })

		let json = await config.api("/delete-used-keys", {}, sellerkey)
		if (json.status === "success") {
			interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.message).setColor(Colors.Green).setTimestamp()], ephemeral: ephemeral })
		} else {
			interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.detail || json.message).addFields([{ name: 'Note:', value: `Your seller key is most likely invalid. Change your seller key with \`/add-application\` command.` }]).setColor(Colors.Red).setTimestamp()], ephemeral: ephemeral })
		}
	},
};
