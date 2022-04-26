const {
    Client,
    Intents,
    Collection
} = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType  } = require('@discordjs/voice');
const { addSpeechEvent } = require("discord-speech-recognition");
const {
    REST
} = require('@discordjs/rest');
const {
    Routes
} = require('discord-api-types/v9');
const fs = require('fs');
const findRemoveSync = require('find-remove');
const config = require("./config.json");

const client = new Client({ intents: new Intents(32767) });
addSpeechEvent(client, { lang: "it-IT", profanityFilter: false });

const TOKEN = config.BOT_TOKEN;
const path = config.CACHE_DIR;


const player = createAudioPlayer();
const fetch = require('node-fetch');

const api=config.API_URL;
const path_audio="/chatbot_audio/"
const path_text="/chatbot_text/"

setInterval(findRemoveSync.bind(this, path, { extensions: ['.wav'] }), 360000)

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const commands = [];

client.commands = new Collection();

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

client.on('ready', () => {
    const BOT_ID = config.BOT_ID;
    const GUILD_ID = config.GUILD_ID;
    const rest = new REST({
        version: '9'
    }).setToken(TOKEN);
    (async () => {
        try {
            rest.put(Routes.applicationGuildCommands(BOT_ID, GUILD_ID), { body: commands })
                .then(() => console.log('Successfully registered application commands.'))
                .catch(console.error);
        } catch (error) {
            if (error) console.error(error);
        }
    })();
});



client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        if (error) console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on("messageCreate", (msg) => {
        try{            
            if (msg.member?.voice) {
                var connection = null;
                const connection_old = getVoiceConnection(msg.member?.voice.guild.id);
                if (connection_old !== null 
                    && connection_old !== undefined
                    && connection_old.joinConfig.channelId !== msg.member?.voice.channelId){
                        connection_old.destroy();
                        connection = joinVoiceChannel({
                            channelId: msg.member?.voice.channel.id,
                            guildId: msg.member?.voice.channel.guild.id,
                            adapterCreator: msg.member?.voice.channel.guild.voiceAdapterCreator,
                            selfDeaf: false,
                            selfMute: false
                        });
                } else if (connection_old === null 
                    || connection_old === undefined){
                        connection = joinVoiceChannel({
                            channelId: msg.member?.voice.channel.id,
                            guildId: msg.member?.voice.channel.guild.id,
                            adapterCreator: msg.member?.voice.channel.guild.voiceAdapterCreator,
                            selfDeaf: false,
                            selfMute: false
                        });
                } else{
                    connection = connection_old;
                }
            }
        } catch (error) {
            console.error(error);
        }
    });

  
client.on("speech", (msg) => {

    try{    
        const connection = getVoiceConnection(msg.member?.voice.guild.id);
        if(connection
            && msg.content !== null 
            && msg.content !== ''
            && msg.content !== undefined 
            && msg.content !== 'undefined') {
        
            if ((msg.content.toLowerCase().includes('pezzente') || msg.content.toLowerCase().includes('scemo') || msg.content.toLowerCase().includes('bot'))
                && !msg.content.toLowerCase().includes('cerca')) {
                var words = msg.content.toLowerCase().replace('pezzente','').replace('scemo','').replace('bot','').trim();
                if (words === ''){
                    words = 'ciao'
                }
                var params = api+path_audio+"ask/"+words;
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
                        });
                    })
                }).catch(function(error) {
                    console.log(error);
                }); 
            } else if ((msg.content.toLowerCase().includes('pezzente') || msg.content.toLowerCase().includes('scemo') || msg.content.toLowerCase().includes('bot'))
                    && msg.content.toLowerCase().includes('cerca')) {
                var words = msg.content.toLowerCase().replace('cerca','').replace('pezzente','').replace('scemo','').trim();
                if (words === ''){
                    words = 'ciao'
                }
                if (words !== ''){
                    var params = api+path_audio+"search/"+words;
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
                                });
                            })
                        }).catch(function(error) {
                            console.log(error);
                        }); 
                    }
            } else if (msg.content.toLowerCase().includes('stop') || msg.content.toLowerCase().includes('ferma')) {
                    player.stop();
            } 
        }
      } catch (error) {
        console.error(error);
      }
    });

client.login(TOKEN);
