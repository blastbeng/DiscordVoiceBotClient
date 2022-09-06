const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, getVoiceConnection  } = require('@discordjs/voice');

const config = require("../config.json");
require('events').EventEmitter.prototype._maxListeners = config.MAX_LISTENERS;

const path = config.CACHE_DIR;
const api=config.API_URL;
const path_image=config.API_PATH_IMAGE

module.exports = {
    data: new SlashCommandBuilder()
        .setName('image')
        .setDescription("Il pezzente cerca un'immagine")
        .addStringOption(option => option.setName('input').setDescription("L'immagine da cercare").setRequired(true)),
    async execute(interaction) {
        if (interaction.member.voice === null 
            || interaction.member.voice === undefined 
            || interaction.member.voice.channelId === null 
            || interaction.member.voice.channelId === undefined ){
                interaction.reply({ content: 'Devi prima entrare in un canale vocale', ephemeral: true });
        } else {
            var connection = null;
            const connection_old = getVoiceConnection(interaction.member.voice.guild.id);
            if (connection_old !== null 
                && connection_old !== undefined
                && connection_old.joinConfig.channelId !== interaction.member.voice.channelId){
                connection_old.destroy();
            } else {
                connection = connection_old;
            }
            
            connection = joinVoiceChannel({
                channelId: interaction.member.voice.channelId,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });
            //interaction.deferReply({ ephemeral: true});
            const words = interaction.options.getString('input');    


            var params = api+path_image+"search/"+words;
            interaction.reply({ content: 'Il pezzente sta cercando: "' + words + '"', ephemeral: true }).then(data => { 
                try {
                    interaction.followUp({
                        content: interaction.user.username + ' ha cercato: "' + words + '"',
                        files: [{
                            attachment: params,
                            name: words+'.jpg'
                        }]
                    }).catch(function(error) {
                        console.log(error);
                        interaction.followUp({ content: 'Nessun immagine trovata', ephemeral: true });   
                    });
                } catch (error) {
                    console.log(error);
                    interaction.followUp({ content: 'Nessun immagine trovata', ephemeral: true });   
                } 

            }).catch(function(error) {
                console.log(error);
                interaction.reply({ content: 'Nessun immagine trovata', ephemeral: true });   
            });  
        }

    }
}; 