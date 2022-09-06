const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    ActionRowBuilder, 
    ButtonBuilder
} = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('commands')
        .setDescription('Mostra i comandi del pezzente'),
    async execute(interaction) {
        try {                            
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('stop')
                    .setLabel('Stop')
                    .setStyle('PRIMARY'),
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('leave')
                    .setLabel('Leave')
                    .setStyle('PRIMARY'),
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('insult')
                    .setLabel('Insult')
                    .setStyle('PRIMARY'),
            );    
            interaction.reply({ content: 'I comandi del pezzente', ephemeral: true, components: [row] });  
        } catch (error) {
            console.error(error);
        }
    }
};