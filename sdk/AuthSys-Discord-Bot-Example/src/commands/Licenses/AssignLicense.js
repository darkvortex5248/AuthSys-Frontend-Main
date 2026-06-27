const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require("../../utils/database");
const config = require("../../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("assign-license")
    .setDescription("Assign a license to a user")
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The username of the user to assign the license to")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("key")
        .setDescription("The license key to assign to the user")
        .setRequired(true)
    ),
  async execute(interaction) {
    let idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
    let ephemeral = !interaction.guild ? false : true;

    let sellerkey = await db.get(`token_${idfrom}`);
    if (sellerkey === null)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `Your \`SellerKey\` **has not been set!**\n In order to use this bot, you must run the \`/add-application\`, then \`/set-application\` Commands First.`,
            )
            .setColor(Colors.Red)
            .setTimestamp(),
        ],
        ephemeral: ephemeral,
      });

    let username = interaction.options.getString("user");
    let license = interaction.options.getString("key");

    try {
      let json = await config.api("/assign-key", { username: username, key_value: license }, sellerkey)
      if (json.status === "success") {
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("License Assigned Successfully")
              .setDescription(`License key assigned to user: ${username}`)
              .setColor(Colors.Green)
              .setTimestamp(),
          ],
          ephemeral: ephemeral,
        });
      } else {
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription(json.detail || json.message || "Unknown error occurred")
              .addFields([
                {
                  name: "Note:",
                  value: `Your seller key may be invalid. Change your seller key with \`/add-application\` command.`,
                },
              ])
              .setColor(Colors.Red)
              .setTimestamp()
              .setFooter({ text: "AuthSys Discord Bot" }),
          ],
          ephemeral: ephemeral,
        });
      }
    } catch (error) {
      interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`Failed to connect to the AuthSys API.`)
            .addFields([
              { name: "Error Details:", value: `\`\`\`${error}\`\`\``, },
            ])
            .setColor(Colors.Red)
            .setTimestamp()
            .setFooter({ text: "AuthSys Discord Bot" }),
        ],
        ephemeral: ephemeral,
      });
    }
  },
};
