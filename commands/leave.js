const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');

const config = require("../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Il pezzente lascia il canale'),
    async execute(interaction) {
        if (interaction.member.voice === null 
            || interaction.member.voice === undefined 
            || interaction.member.voice.channelId === null 
            || interaction.member.voice.channelId === undefined ){
                interaction.reply({ content: 'Devi prima entrare in un canale vocale', ephemeral: true });
        } else {
            try {
                const connection_old = getVoiceConnection(interaction.member.voice.guild.id);
                if (connection_old !== null && connection_old !== undefined){
                    connection_old.destroy();
                    interaction.reply({ content: 'Il pezzente ha lasciato il canale', ephemeral: true });
                }  
            } catch (error) {
                console.error(error);
            }
        }

    }
}; 