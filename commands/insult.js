const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, StreamType  } = require('@discordjs/voice');


const fs = require('fs');
const config = require("../config.json");
const player = createAudioPlayer();
const fetch = require('node-fetch');
const http = require("http");


const path = config.CACHE_DIR;
const hostname=config.API_HOSTNAME;
const api=config.API_URL;
const port=config.API_PORT;
const path_audio=config.API_PATH_AUDIO
const path_text=config.API_PATH_TEXT


module.exports = {
    data: new SlashCommandBuilder()
        .setName('insult')
        .setDescription('Il pezzente insulta qualcuno')        
        .addUserOption(option => option.setName('user')
        	.setDescription('Chi vuoi insultare? (Puoi lasciare vuoto)')
		.setRequired(true)),
    async execute(interaction) {

        
        const user = interaction.options.getUser('user');
        var words = null;
        if (user !== null && user !== undefined){
            words = interaction.options.getUser('user').username;
        }

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
                interaction.deferReply({ ephemeral: true});


                var params = "";
                if (words === null || words === undefined){
                    params = api+path_audio+"insult?text=none";
                } else {
                    params = api+path_audio+"insult?text="+encodeURIComponent(words);
                }




                fetch(
                    params,
                    {
                        method: 'GET',
                        headers: { 'Accept': '*/*' }
                    }
                ).then(res => {
                    new Promise((resolve, reject) => {
                        var file = Math.random().toString(36).slice(2)+".wav";
                        //var file = "temp.wav";
                        var outFile = path+"/"+file;
                        const dest = fs.createWriteStream(outFile);
                        res.body.pipe(dest);
                        res.body.on('end', () => resolve());
                        dest.on('error', reject);


                        dest.on('finish', function(){      
                            connection.subscribe(player);                      
                            const resource = createAudioResource(outFile, {
                                inputType: StreamType.Arbitrary,
                            });
                            player.play(resource);      
                            interaction.editReply({ content: 'Il pezzente sta insultando', ephemeral: true });          
                        });
                    })
                }).catch(function(error) {
                    console.log(error);
                    interaction.editReply({ content: 'Si è verificato un errore', ephemeral: true });   
                }); 
            }

    }
}; 
