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

setInterval(findRemoveSync.bind(this, path, { extensions: ['.wav', '.mp3'] }), 21600000)

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));


const commands = [];

client.commands = new Collection();

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

client.on('ready', () => {const BOT_ID = config.BOT_ID;
	const GUILD_ID = config.GUILD_ID;
	const rest = new REST({
		version: '9'
	}).setToken(TOKEN);
    (async () => {
		try {
			//rest.get(Routes.applicationGuildCommands(BOT_ID, GUILD_ID))
			//	.then(data => {
			//		const promises = [];
			//		for (const command of data) {
			//			const deleteUrl = `${Routes.applicationGuildCommands(BOT_ID, GUILD_ID)}/${command.id}`;
			//			promises.push(rest.delete(deleteUrl));
			//		}
			//		return Promise.all(promises);
			//});
			rest.put(Routes.applicationGuildCommands(BOT_ID, GUILD_ID), { body: commands })
				.then(() => console.log('Successfully registered application commands.'))
				.catch(console.error);
		} catch (error) {
			if (error) console.error(error);
		}
    })();
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
  try{            
      if (newMember?.channelId) {
        client.channels.fetch(newMember?.channelId)
                .then(channel => {
          const connection_old = getVoiceConnection(newMember?.guild.id);
          if (connection_old !== null 
              && connection_old !== undefined
              && connection_old.joinConfig.channelId !== newMember?.channelId){
                  connection_old.destroy();
                  joinVoiceChannel({
                      channelId: newMember?.channelId,
                      guildId: newMember?.guild.id,
                      adapterCreator: channel.guild.voiceAdapterCreator,
                      selfDeaf: false,
                      selfMute: false
                  });
          } else if (connection_old === null 
              || connection_old === undefined){
                  joinVoiceChannel({
                      channelId: newMember?.channelId,
                      guildId: newMember?.guild.id,
                      adapterCreator: channel.guild.voiceAdapterCreator,
                      selfDeaf: false,
                      selfMute: false
                  });
          }
        }).catch(function(error) {
            console.log(error);
        });
      }
  } catch (error) {
      console.error(error);
  }
});



client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() && !interaction.isButton()) return;
    if (interaction.isCommand()){        
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            if (error) console.error(error);
            await interaction.reply({ content: 'Errore!', ephemeral: true });
        }
    } else if (interaction.isButton()){
        if(interaction.customId === 'stop'){
            const connection = getVoiceConnection(interaction.member.voice.guild.id);
            if (connection !== null
                && connection !== undefined){
                    connection.subscribe(player);
                    player.stop();
                    await interaction.reply({ content: 'Il pezzente ha smesso di riprodurre', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Il pezzente non sta riproducendo nulla', ephemeral: true });
                }
        }
    }
});

client.on("messageCreate", (msg) => {
        try{            
            if (msg.member?.voice !== null
                && msg.member?.voice != undefined
                && msg.member?.voice.channel != null
                && msg.member?.voice.channel != undefined) {
                const connection_old = getVoiceConnection(msg.member?.voice.guild.id);
                if (connection_old !== null 
                    && connection_old !== undefined
                    && connection_old.joinConfig.channelId !== msg.member?.voice.channelId){
                        connection_old.destroy();
                        joinVoiceChannel({
                            channelId: msg.member?.voice.channel.id,
                            guildId: msg.member?.voice.channel.guild.id,
                            adapterCreator: msg.member?.voice.channel.guild.voiceAdapterCreator,
                            selfDeaf: false,
                            selfMute: false
                        });
                } else if (connection_old === null 
                    || connection_old === undefined){
                        joinVoiceChannel({
                            channelId: msg.member?.voice.channel.id,
                            guildId: msg.member?.voice.channel.guild.id,
                            adapterCreator: msg.member?.voice.channel.guild.voiceAdapterCreator,
                            selfDeaf: false,
                            selfMute: false
                        });
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
                    words = 'ciao';
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
                var words = msg.content.toLowerCase().replace('cerca','').replace('pezzente','').replace('scemo','').replace('bot','').trim();
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
            //} else if ((msg.content.toLowerCase().includes('pezzente') || msg.content.toLowerCase().includes('scemo') || msg.content.toLowerCase().includes('bot'))
            //&& (msg.content.toLowerCase().includes('riproduci') || msg.content.toLowerCase().includes('play'))) {
            //    var words = msg.content.toLowerCase().replace('riproduci','').replace('play','').replace('pezzente','').replace('scemo','').replace('bot','').trim();
            //    if (words !== ''){
            //        var params = api+path_audio+'youtube/search?text='+encodeURIComponent(words);
            //        fetch(
            //            params,
            //            {
            //                method: 'GET',
            //                headers: { 'Accept': '*/*' }
            //            }
            //        ).then(res => {
            //                new Promise((resolve, reject) => {
            //                    var file = Math.random().toString(36).slice(2)+".wav";
            //                    //var file = "temp.wav";
            //                    var outFile = path+"/"+file;
            //                    const dest = fs.createWriteStream(outFile);
            //                    res.body.pipe(dest);
            //                    res.body.on('end', () => resolve());
            //                    dest.on('error', reject);
            //        
            //                    dest.on('finish', function(){       
            //                        connection.subscribe(player);                         
            //                        const resource = createAudioResource(outFile, {
            //                            inputType: StreamType.Arbitrary,
            //                        });
            //                        player.play(resource);         
            //                    });
            //                })
            //            }).catch(function(error) {
            //                console.log(error);
            //            }); 
            //        }
            } else if (msg.content.toLowerCase().includes('stop') || msg.content.toLowerCase().includes('ferma')) {
                    player.stop();
            } 
        }
      } catch (error) {
        console.error(error);
      }
    });

client.login(TOKEN);
