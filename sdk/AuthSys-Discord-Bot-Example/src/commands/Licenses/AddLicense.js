const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require('../../utils/database')
const config = require('../../utils/config')

module.exports = {
	data: new SlashCommandBuilder()
		.setName("add-license")
		.setDescription("Add key. You must specify the optional parameters the first time. After that they're saved.")
		.setDescriptionLocalizations({
			"en-US": "Add key. You must specify the optional parameters the first time. After they're saved.",
			"fi": "Lisää avain. Sinun on määritettävä valinnaiset parametrit ensimmäistä kertaa.",
			"fr": "Ajouter une clé. Vous devez spécifier les paramètres facultatifs la première fois.",
			"de": "Schlüssel hinzufügen. Sie müssen die optionalen Parameter beim ersten Mal angeben.",
			"it": "Aggiungi chiave. È necessario specificare i parametri facoltativi la prima volta.",
			"nl": "Sleutel toevoegen. U moet de eerste keer de optionele parameters opgeven.",
			"ru": "Добавить ключ. Вы должны указать необязательные параметры в первый раз. После этого они сохраняются.",
			"pl": "Dodaj klucz. Musisz określić opcjonalne parametry po raz pierwszy. Po tym są zapisywane.",
			"tr": "Anahtar ekleyin. İlk kez isteğe bağlı parametreleri belirtmeniz gerekir. Sonra kaydedilirler.",
			"cs": "Přidejte klíč. Musíte zadat volitelné parametry poprvé. Poté jsou uloženy.",
			"ja": "キーを追加します。最初にオプションのパラメータを指定する必要があります。その後、保存されます。",
			"ko": "키를 추가하십시오. 최초에 선택적 매개 변수를 지정해야합니다. 그 후 저장됩니다."
		})
		.addStringOption((option) =>
			option
				.setName("expiry")
				.setDescription("How many days?")
				.setDescriptionLocalizations({
					"en-US": "How many days?",
					"fi": "Kuinka monta päivää?",
					"fr": "Combien de jours?",
					"de": "Wie viele Tage?",
					"it": "Quanti giorni?",
					"nl": "Hoeveel dagen?",
					"ru": "Сколько дней?",
					"pl": "Ile dni?",
					"tr": "Kaç gün?",
					"cs": "Kolik dní?",
					"ja": "何日？",
					"ko": "몇 일?"
				})
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("level")
				.setDescription("What level?")
				.setDescriptionLocalizations({
					"en-US": "What level?",
					"fi": "Mikä taso?",
					"fr": "Quel niveau?",
					"de": "Welche Ebene?",
					"it": "Qual è il livello?",
					"nl": "Welk niveau?",
					"ru": "Какой уровень?",
					"pl": "Jaki poziom?",
					"tr": "Ne seviye?",
					"cs": "Jaká úroveň?",
					"ja": "どのレベル？",
					"ko": "어떤 레벨?"
				})
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("amount")
				.setDescription("What amount?")
				.setDescriptionLocalizations({
					"en-US": "What amount?",
					"fi": "Mikä määrä?",
					"fr": "Quel montant?",
					"de": "Wie viel?",
					"it": "Quanto?",
					"nl": "Hoeveel?",
					"ru": "Какая сумма?",
					"pl": "Jaka kwota?",
					"tr": "Ne kadar?",
					"cs": "Jaká částka?",
					"ja": "何量？",
					"ko": "얼마?"
				})
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("character")
				.setDescription("1 = Random, 2 = Uppercase, 3 = Lowercase")
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("note")
				.setDescription('Note, Default is "Added by AuthSys Discord Bot"')
				.setRequired(false)
		),
	async execute(interaction) {
        let idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
        let ephemeral = !interaction.guild ? false : true;

		let sellerkey = await db.get(`token_${idfrom}`)
		if (sellerkey === null) return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Your \`SellerKey\` **has not been set!**\n In order to use this bot, you must run the \`/add-application\` Command First.`).setColor(Colors.Red).setTimestamp()], ephemeral: ephemeral })

		let license_mask = await db.get(`licensemask_${idfrom}`)
		if (license_mask === null) license_mask = "******-******-******-******-******-******";

		let days = interaction.options.getString("expiry")
		let level = interaction.options.getString("level")
		let amount = interaction.options.getString("amount")
		let character = interaction.options.getString("character") || 1;
		let note = interaction.options.getString("note") || "Added by AuthSys Discord Bot";

		if (amount > 20) return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('Failure').addFields([{ name: 'Reason:', value: `You cannot add more than twenty keys at a time.` }]).setColor(Colors.Red).setFooter({ text: "AuthSys Discord Bot" }).setTimestamp()], ephemeral: ephemeral })

		if (days) {
			let json = await config.api("/generate-key", { duration: parseInt(days), level: level, amount: amount ? parseInt(amount) : 1, mask: license_mask, character: character, note: note }, sellerkey)
			if (json.status === "success") {
				interaction.followUp({ content: `${json.message}`, ephemeral: ephemeral });
				db.set(`licenseAdd_${idfrom}`, `{ "days": ${days}, "level": "${level}", "amount": "${amount}", "character": "${character}", "note": "${note}" }`)
			} else {
				interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.detail || json.message).addFields([{ name: 'Note:', value: `Your seller key is most likely invalid. Change your seller key with \`/add-application\` command.` }]).setColor(Colors.Red).setFooter({ text: "AuthSys Discord Bot" }).setTimestamp()], ephemeral: ephemeral })
			}
		} else {
			let licenseAdd = await db.get(`licenseAdd_${idfrom}`)
			if (licenseAdd === null) return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`No config saved for adding licenses yet. Please do a command with paramaters included then this will work.`).setColor(Colors.Red).setTimestamp()], ephemeral: ephemeral })
			licenseAdd = JSON.parse(licenseAdd);

			let json = await config.api("/generate-key", { duration: parseInt(licenseAdd.days), level: licenseAdd.level, amount: licenseAdd.amount ? parseInt(licenseAdd.amount) : 1, mask: license_mask, character: licenseAdd.character, note: licenseAdd.note }, sellerkey)
			if (json.status === "success") {
				interaction.followUp({ content: `${json.message}`, ephemeral: ephemeral });
			} else {
				interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.detail || json.message).addFields([{ name: 'Note:', value: `Your seller key is most likely invalid. Change your seller key with \`/add-application\` command.` }]).setColor(Colors.Red).setFooter({ text: "AuthSys Discord Bot" }).setTimestamp()], ephemeral: ephemeral })
			}
		}
	},
};
