const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, StreamType  } = require('@discordjs/voice');
const { MessageActionRow, MessageButton, MessageSelectMenu, MessageEmbed } = require('discord.js');
const fs = require('fs');
const config = require("../config.json");
const player = createAudioPlayer();
const fetch = require('node-fetch');
const http = require("http");

const path = config.CACHE_DIR;
const api=config.API_URL;
const hostname=config.API_HOSTNAME;
const path_music="/chatbot_music/"

module.exports = {
    data: new SlashCommandBuilder()
        .setName('youtube')
        .setDescription('Il pezzente riproduce audio da un video di youtube')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('Hai un link o vuoi cercare qualcosa?')
                .setRequired(true)
                .addChoice('ricerca','ricerca')
                .addChoice('link','link')
                )
            .addStringOption(option => option.setName('video').setDescription('link o ricerca').setRequired(true)),
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

            const input = interaction.options.getString('input');            
            const video = interaction.options.getString('video');
            
            if( input === 'link' ) {

                if ( !video.startsWith('http')) {                    
                    interaction.reply({ content: 'Devi inserire un url di youtube se vuoi riprodurre da un link', ephemeral: true });   
                } else {
                    interaction.deferReply({ ephemeral: false });
                    var params = api+path_music+'youtube/get?url='+encodeURIComponent(video);
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
                                const options = {
                                    "method": "GET",
                                    "hostname": hostname,
                                    "port": 5080,
                                    "path": path_music+'youtube/info?url='+encodeURIComponent(video)
                                }
                                const req = http.request(options, function(res) {
            
                                    var chunks = [];
                                
                                    res.on("data", function (chunk) {
                                        chunks.push(chunk);
                                    });
                                
                                    res.on("end", function() {
                                        var body = Buffer.concat(chunks);
                                        var object = JSON.parse(body.toString())
                                        
                                        const rowStop = new MessageActionRow()
                                        .addComponents(
                                            new MessageButton()
                                                .setCustomId('stop')
                                                .setLabel('Stop')
                                                .setStyle('PRIMARY'),
                                        );
                                        if (object.length === 0) {                                
                                            interaction.editReply({ content: 'Il pezzente sta riproducendo', ephemeral: false, components: [rowStop] });  
                                        } else {
                                           var video = object[0];
                                           const embed = new MessageEmbed()
                                                .setColor('#0099ff')
                                                .setTitle(video.title)
                                                .setURL(video.link)
                                                .setDescription(video.link);
                                           
                                           interaction.editReply({ content: 'Il pezzente sta riproducendo', ephemeral: false, embeds: [embed], components: [rowStop] });  
                                        }
                                    });
                                
                                });         
                                
                                req.end()
                            });
                        })
                    }).catch(function(error) {
                        console.log(error);
                    }); 
                }
            } else if( input === 'ricerca' ) {

                if ( video.startsWith('http')) {                    
                    interaction.reply({ content: 'Devi selezionare "link" se vuoi riprodurre un url di youtube', ephemeral: true });   
                } else {
                    interaction.deferReply({ ephemeral: false });
                    const options = {
                        "method": "GET",
                        "hostname": hostname,
                        "port": 5080,
                        "path": path_music+'youtube/search?text='+encodeURIComponent(video)
                    }
                    const req = http.request(options, function(res) {

                        var chunks = [];
                    
                        res.on("data", function (chunk) {
                            chunks.push(chunk);
                        });
                    
                        res.on("end", function() {
                            var body = Buffer.concat(chunks);
                            var object = JSON.parse(body.toString())
                            if (object.length === 0) {                                
                                interaction.editReply({ content: 'Non ho trovato risultati per "'+video+'"', ephemeral: false});  
                            } else {
                                var options = [];
                                for (var i = 0; i < object.length && i < 25; i++) {
                                    var videores = object[i];
                                    var option = {};
                                    option.label = videores.title;
                                    option.description = videores.link;
                                    option.value = videores.link
                                    options.push(option);
                                }
                                
                                const row = new MessageActionRow()
                                .addComponents(
                                    new MessageSelectMenu()
                                        .setCustomId('videoselect')
                                        .setPlaceholder('Seleziona un video da riprodurre')
                                        .addOptions(options),
                                )
                                interaction.editReply({ content: 'Qualcuno ha cercato "' + video + '" Seleziona un link da riprodurre',  ephemeral: false, components: [row] });     
                            }
                        });
                    
                    });
                    
                    req.end();
                }
            }
        }

    }
}; 