const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioPlayer } = require('@discordjs/voice');

const player = createAudioPlayer();
const fetch = require('node-fetch');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Avvia un Quiz'),
    async execute(interaction) {
                    interaction.reply({ content: 'work in progress', ephemeral: true });
                
    }
};