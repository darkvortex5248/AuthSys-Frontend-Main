const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require('../../utils/database')

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove-application")
    .setDescription("Removes an application or seller key from the bot.")
    .addStringOption((option) =>
      option
        .setName("application")
        .setDescription("Enter the name of the application you'd like to delete.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const idFromGuild = interaction.guild ? interaction.guild.id : interaction.user.id;
    const ephemeral = !!interaction.guild;
    const application = interaction.options.getString("application");

    let applications = await db.get(`applications_${idFromGuild}`);
    if (applications === null) {
      applications = [];
    }

    if (applications.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("No applications have been added yet.")
            .setColor(Colors.Red)
            .setTimestamp()
        ],
        ephemeral: ephemeral
      });
    }

    if (!application) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("Enter the name of the application you'd like to delete.")
            .setColor(Colors.Red)
            .setTimestamp()
        ],
        ephemeral: ephemeral
      });
    }

    const deletedApplications = applications.filter(app => app.application === application);

    if (deletedApplications.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`The application \`${application}\` does not exist.`)
            .setColor(Colors.Red)
            .setTimestamp()
        ],
        ephemeral: ephemeral
      });
    }

    applications = applications.filter(app => app.application !== application);
    await db.set(`applications_${idFromGuild}`, applications);

    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`The application(s) with the name ${application} have been deleted!`)
          .setColor(Colors.Green)
          .setTimestamp()
      ],
      ephemeral: ephemeral
    });
  },
};
