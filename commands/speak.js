const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, StreamType  } = require('@discordjs/voice');

const fs = require('fs');
const config = require("../config.json");
require('events').EventEmitter.prototype._maxListeners = config.MAX_LISTENERS;
const player = createAudioPlayer();
const fetch = require('node-fetch');
const syncfetch = require('sync-fetch')
const GUILD_ID = config.GUILD_ID;

const path = config.CACHE_DIR;
const api=config.API_URL;
const text="&text=";
const path_audio=config.API_PATH_AUDIO
const path_utils=config.API_PATH_UTILS


function getSlashCommand() {

    var command = new SlashCommandBuilder()
        .setName('speak')
        .setDescription('Il pezzente parla ripetendo il testo scritto (Usa /listvoices per una lista delle voci disponibili)')
        .addStringOption(option => option.setName('input').setDescription('Il testo da ripetere').setRequired(true))
        .addStringOption(option => option.setName('voice').setDescription('La voce da usare').setRequired(false));
    return command;
}

module.exports = {
    data: getSlashCommand(),
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

            var voice = interaction.options.getString('voice');

            var voicetoken="";
            var voicename=""

            if (voice === undefined || voice === null){
                voicetoken = "google";
                voicename = "google";
            } else {
                voicename = voice.trim();
            }

            if (words.length <= 500) {

                interaction.reply({ content: 'Il pezzente sta parlando. \nTesto: ' + words + '.  \nVoce: ' + voicename +'.', ephemeral: true }).then(data => {    

                    if (voicetoken !== "google" && voicename !== "google"){

                        const url = api+path_utils+"fakeyou/get_voices_by_cat/Italiano";

                        const data = syncfetch(url).json();

                        for(var attributename in data){
                            //option.addChoices(attributename,data[attributename]);
                            if(attributename.toLowerCase().includes(voice.toLowerCase())){
                                voicetoken = data[attributename];
                                voicename = attributename;
                                break;
                            }
                        }

                    }

                    if(voicetoken === "") {
                        
                        interaction.editReply({ content: 'Si è verificato un errore. \nTesto: ' + words + '.  \nVoce: ' + voicename +'. \nUsa /listvoices per una lista delle voci disponibili.', ephemeral: true });     
                        //interaction.editReply({ content: 'Possibile errore dalle API FakeYou :(.\n Usa /listvoices per una lista delle voci disponibili.\n Purtroppo discord fa cagare e le select box sono limitate a 25 elementi.', ephemeral: true });   

                    } else {

                        var guildid=""
                        if(interaction.member.voice.guild.id === GUILD_ID){
                            guildid="000000"
                        }
                        else{
                            guildid = interaction.member.voice.guild.id
                        }

                        

                        var params = api+path_audio+"repeat/learn/user/"+encodeURIComponent(interaction.member.user.username)+"/"+encodeURIComponent(words)+"/"+encodeURIComponent(guildid)+"/"+encodeURIComponent(voicetoken);

                        fetch(
                            params,
                            {
                                method: 'GET',
                                headers: { 'Accept': '*/*' }
                            }
                        ).then(res => {
                            new Promise((resolve, reject) => {
                                //var file = Math.random().toString(36).slice(2)+".wav";
                                var file = "temp.wav";
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
                                    
                                    player.on('error', error => {
                                        console.log(error);
                                        interaction.editReply({ content: 'Si è verificato un errore. \nTesto: ' + words + '.  \nVoce: ' + voicename +'.', ephemeral: true });     
                                    });
                                    player.play(resource);       
                                });
                            }).catch(function(error) {
                                console.log(error);
                                interaction.editReply({ content: 'Si è verificato un errore. \nTesto: ' + words + '.  \nVoce: ' + voicename +'.', ephemeral: true });   
                            }); 
                        }).catch(function(error) {
                            console.log(error);
                            interaction.editReply({ content: 'Si è verificato un errore. \nTesto: ' + words + '.  \nVoce: ' + voicename +'.', ephemeral: true });   
                        }); 

                        
                    }
                });
            } else {
                interaction.reply({ content: 'Errore! Caratteri massimi consentiti: 500', ephemeral: true });    
            }
        }

    }
}; 