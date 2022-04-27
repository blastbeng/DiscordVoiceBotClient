const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, StreamType  } = require('@discordjs/voice');
const { MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs');
const config = require("../config.json");
const player = createAudioPlayer();
const fetch = require('node-fetch');
const http = require("http");

const path = config.CACHE_DIR;
const api=config.API_URL;
const hostname=config.API_HOSTNAME;
const path_audio="/chatbot_music/"

module.exports = {
    data: new SlashCommandBuilder()
        .setName('youtube')
        .setDescription('Il pezzente riproduce audio da un video di youtube')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('Hai un link o vuoi cercare qualcosa?')
                .setRequired(true)
                //.addChoice('ricerca','ricerca')
                .addChoice('link','link')
                )
            //.addStringOption(option => option.setName('video').setDescription('link o ricerca').setRequired(true)
            .addStringOption(option => option.setName('video').setDescription('link').setRequired(true)),
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
                connection = joinVoiceChannel({
                    channelId: interaction.member.voice.channelId,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: false
                });
            } else if (connection_old === null 
                        || connection_old === undefined){
                    connection = joinVoiceChannel({
                        channelId: interaction.member.voice.channelId,
                        guildId: interaction.guildId,
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                        selfDeaf: false,
                        selfMute: false
                    });
            } else {
                connection = connection_old;
            }
            interaction.deferReply({ ephemeral: true});

            const input = interaction.options.getString('input');            
            const video = interaction.options.getString('video');
            
            if( input === 'link' ) {

                if ( !video.startsWith('http')) {                    
                    interaction.editReply({ content: 'Devi inserire un url di youtube se vuoi riprodurre da un link', ephemeral: true });   
                } else {

                    var params = api+path_audio+'youtube/get?url='+encodeURIComponent(video);

                    fetch(
                        params,
                        {
                            method: 'GET',
                            headers: { 'Accept': '*/*' }
                        }
                    ).then(res => {
                        new Promise((resolve, reject) => {
                            var file = Math.random().toString(36).slice(2)+".mp3";
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
                                const row = new MessageActionRow()
                                .addComponents(
                                    new MessageButton()
                                        .setCustomId('stop')
                                        .setLabel('Stop')
                                        .setStyle('PRIMARY'),
                                );
                                interaction.editReply({ content: 'Il pezzente sta riproducendo', ephemeral: true, components: [row] });           
                            });
                        })
                    }).catch(function(error) {
                        console.log(error);
                    }); 
                }
            } else if( input === 'ricerca' ) {

                if ( video.startsWith('http')) {                    
                    interaction.editReply({ content: 'Devi selezionare "link" se vuoi riprodurre un url di youtube', ephemeral: true });   
                } else {

                    const options = {
                        "method": "GET",
                        "hostname": hostname,
                        "port": 5080,
                        "path": path_audio+'youtube/search?text='+encodeURIComponent(video)
                    }
                    const req = http.request(options, function(res) {

                        var chunks = [];
                    
                        res.on("data", function (chunk) {
                            chunks.push(chunk);
                        });
                    
                        res.on("end", function() {
                            var body = Buffer.concat(chunks);
                            console.log(body.toString());
                            interaction.editReply({ content: 'test test', ephemeral: true });     
                        });
                    
                    });
                    
                    req.end()
                }
            }
        }

    }
}; 