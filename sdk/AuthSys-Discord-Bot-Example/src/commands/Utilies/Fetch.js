const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require('../../utils/database')
const config = require('../../utils/config')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fetch")
        .setDescription("Fetch * All Things")
        .addSubcommand((subcommand) =>
            subcommand
                .setName('licenses')
                .setDescription('Fetch All Licenses')
                .addStringOption((option) =>
                    option
                        .setName("format")
                        .setDescription("Specify format of licenses")
                        .addChoices(
                            { name: "Text", value: "text" },
                            { name: "JSON", value: "json" }
                        )
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('users')
                .setDescription('Fetch All Users')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('user-vars')
                .setDescription('Fetch All User\'s Variables')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('usernames')
                .setDescription('Fetch All Usernames')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('subs')
                .setDescription('Fetch All Subs')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('chats')
                .setDescription('Fetch All Chats')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('sessions')
                .setDescription('Fetch All Sessions')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('files')
                .setDescription('Fetch All Files')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('vars')
                .setDescription('Fetch All Vars')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('blacklists')
                .setDescription('Fetch All Blacklists')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('webhooks')
                .setDescription("Fetch All Webhooks")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('buttons')
                .setDescription('Fetch All Buttons')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('mutes')
                .setDescription('Fetch All Mutes')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('channels')
                .setDescription('Fetch All Channels')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('appdetails')
                .setDescription('Fetch Application Details')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('logs')
                .setDescription('Fetch All Logs')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('team')
                .setDescription('Fetch All Resellers and Managers')
        ),
    async execute(interaction) {
        let idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
        let ephemeral = !interaction.guild ? false : true;

        let sellerkey = await db.get(`token_${idfrom}`)
        if (sellerkey === null) return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Your \`SellerKey\` **has not been set!**\n In order to use this bot, you must run the \`add-application\` Command First.`).setColor(Colors.Red).setTimestamp()], ephemeral: ephemeral })

        let subcommand = interaction.options.getSubcommand();

        if (subcommand === "licenses") {
            let format = interaction.options.getString("format") || "text";
            interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Fetching Licenses...").setColor(Colors.Green).setTimestamp()], ephemeral: ephemeral })

            interaction.editReply({
                embeds: [new EmbedBuilder().setAuthor({ name: "AuthSys Application Keys" }).setFooter({ text: "AuthSys Discord Bot" }).setColor(Colors.Green).setTimestamp()],
                files: [{
                    attachment: `${config.apiUrl}/fetch-keys?sellerkey=${sellerkey}&format=${format}`,
                    name: 'keys.' + (format === "text" ? "txt" : "json")
                }],
                ephemeral: ephemeral
            });

        } else {
            let params = {};
            let endpoint = "";
            let title = "";
            let dataKey = "";
            let formatItem = null;

            switch (subcommand) {
                case "users":
                    endpoint = "/fetch-users"; title = "AuthSys Application Users"; dataKey = "users"; formatItem = (item) => item.username + "\n"; break;
                case "user-vars":
                    endpoint = "/fetch-user-vars"; title = "AuthSys Application User Vars"; dataKey = "vars"; formatItem = () => ""; break;
                case "usernames":
                    endpoint = "/fetch-usernames"; title = "AuthSys Application Usernames"; dataKey = "usernames"; formatItem = (item) => item.username + "\n"; break;
                case "subs":
                    endpoint = "/fetch-subscriptions"; title = "AuthSys Application Subscriptions"; dataKey = "subs"; formatItem = (item) => item.username + "\n"; break;
                case "chats":
                    endpoint = "/fetch-chats"; title = "AuthSys Application Chat Channels"; dataKey = "chats"; formatItem = (item) => `Name: ${item.name} - Delay: ${item.delay}\n`; break;
                case "sessions":
                    endpoint = "/fetch-sessions"; title = "AuthSys Application Sessions"; dataKey = "sessions"; formatItem = (item) => `ID: ${item.id} - Validated: ${item.validated ? true : false}\n`; break;
                case "files":
                    endpoint = "/fetch-files"; title = "AuthSys Application Files"; dataKey = "files"; formatItem = (item) => `ID: ${item.id} - Download: [Here](${item.url})\n`; break;
                case "vars":
                    endpoint = "/fetch-variables"; title = "AuthSys Application Variables"; dataKey = "vars"; formatItem = (item) => `ID: ${item.varid} - Data: ${item.msg}\n`; break;
                case "blacklists":
                    endpoint = "/fetch-blacklists"; title = "AuthSys Application Blacklists"; dataKey = "blacklists"; formatItem = (item) => { let btemp = item.ip ? `\`\`\`${item.ip}\`\`\`` : `\`\`\`${item.hwid}\`\`\``; return `**ID: ${item.id} - Type: ${item.type}** ${btemp}\n`; }; break;
                case "webhooks":
                    endpoint = "/fetch-webhooks"; title = "AuthSys Application Webhooks"; dataKey = "webhooks"; formatItem = (item) => { let authed = (item.authed == "1") ? "True" : "False"; return `Web ID: \`${item.webid}\` - Base link: \`${item.short_baselink}\` - Useragent: \`${item.useragent}\` - Authed: \`${authed}\`\n` }; break;
                case "buttons":
                    endpoint = "/fetch-buttons"; title = "AuthSys Application Buttons"; dataKey = "buttons"; formatItem = (item) => `Text: ${item.text} - Value: ${item.value}`; break;
                case "mutes":
                    endpoint = "/fetch-mutes"; title = "AuthSys Application Mutes"; dataKey = "mutes"; formatItem = (item) => `Username: ${item.user} - Time: ${item.time}\n`; break;
                case "channels":
                    endpoint = "/fetch-chats"; title = "AuthSys Application Channels"; dataKey = "channels"; formatItem = (item) => `Name: ${item.name} - Delay: ${item.delay}\n`; break;
                case "appdetails":
                    endpoint = "/app-details"; title = "AuthSys Application Details"; dataKey = "appdetails"; formatItem = null; break;
                case "logs":
                    endpoint = "/fetch-logs"; title = "AuthSys Application Logs"; dataKey = "logs"; formatItem = null; break;
                case "team":
                    endpoint = "/fetch-team"; title = "AuthSys Application Team Members"; dataKey = null; formatItem = null; break;
            }

            interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`Fetching ${subcommand}...`).setColor(Colors.Green).setTimestamp()], ephemeral: ephemeral })

            let json = await config.api(endpoint, {}, sellerkey)

            if (json.status === "success") {
                if (subcommand === "appdetails") {
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(title)
                                .setFooter({ text: "AuthSys Discord Bot" })
                                .addFields(
                                    { name: 'Application Name', value: json.appdetails.name },
                                    { name: 'Owner ID', value: json.appdetails.ownerid },
                                    { name: 'Secret', value: json.appdetails.secret },
                                    { name: 'App Version', value: json.appdetails.version }
                                )
                                .setColor(Colors.Green).setTimestamp()],
                        ephemeral: ephemeral
                    });
                } else if (subcommand === "logs") {
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(title)
                                .setFooter({ text: "AuthSys Discord Bot" })
                                .addFields({ name: 'Logs', value: json.logs })
                                .setColor(Colors.Green).setTimestamp()],
                        ephemeral: ephemeral
                    });
                } else if (subcommand === "team") {
                    const resellerFields = (json.resellers || []).map(reseller => {
                        return { name: `Reseller: ${reseller.username}`, value: `Balance: ${reseller.balance}\nKey Levels: ${reseller.key_levels}` };
                    });
                    const managerFields = (json.managers || []).map(manager => {
                        return { name: `Manager: ${manager.username}`, value: `Permissions: ${JSON.stringify(manager.permissions)}` };
                    });
                    const allFields = [...resellerFields, ...managerFields];

                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(title)
                                .setFooter({ text: "AuthSys Discord Bot" })
                                .addFields(allFields.length > 0 ? allFields : [{ name: 'No Team Members', value: 'No resellers or managers found.' }])
                                .setColor(Colors.Green)
                                .setTimestamp()
                        ],
                        ephemeral: ephemeral
                    });
                } else {
                    let dataList = "";
                    let items = json[dataKey] || [];
                    for (var i = 0; i < items.length; i++) {
                        dataList += formatItem(items[i]);
                    }
                    interaction.editReply({
                        embeds: [new EmbedBuilder().setTitle(title).setDescription(`**${dataList}**`).setFooter({ text: "AuthSys Discord Bot" }).setColor(Colors.Green).setTimestamp()],
                        ephemeral: ephemeral
                    });
                }
            } else {
                interaction.editReply({ embeds: [new EmbedBuilder().setTitle(json.detail || json.message).addFields([{ name: 'Note:', value: `Your seller key is most likely invalid. Change your seller key with \`/add-application\` command.` }]).setColor(Colors.Red).setFooter({ text: "AuthSys Discord Bot" }).setTimestamp()], ephemeral: ephemeral })
            }
        }
    },
};
