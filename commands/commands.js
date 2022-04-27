const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    MessageActionRow, 
    MessageButton
} = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('commands')
        .setDescription('Mostra i comandi del pezzente'),
    async execute(interaction) {
        try {                            
            const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('stop')
                    .setLabel('Stop')
                    .setStyle('PRIMARY'),
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('leave')
                    .setLabel('Leave')
                    .setStyle('PRIMARY'),
            )
            .addComponents(
                new MessageButton()
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