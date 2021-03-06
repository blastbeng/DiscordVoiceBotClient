const {
    Client,
    Intents,
    Collection,
    MessageActionRow, 
    MessageButton,
    MessageEmbed
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
const http = require("http");
const wait = require('node:timers/promises').setTimeout;

const client = new Client({ intents: new Intents(32767) });
addSpeechEvent(client, { lang: "it-IT", profanityFilter: false });

const TOKEN = config.BOT_TOKEN;
const path = config.CACHE_DIR;


const player = createAudioPlayer();
const fetch = require('node-fetch');

const api=config.API_URL;
const port=config.API_PORT;
const hostname=config.API_HOSTNAME;
const path_audio=config.API_PATH_AUDIO
const path_music=config.API_PATH_MUSIC
const path_text=config.API_PATH_TEXT

setInterval(findRemoveSync.bind(this, path, { extensions: ['.wav', '.mp3'] }), 21600000)

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));


const commands = [];

client.commands = new Collection();

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

client.on('ready', () => {
    const rest = new REST({ version: '9' }).setToken(config.BOT_TOKEN);

    (async () => {
        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationGuildCommands(config.BOT_ID, config.GUILD_ID),
                { body: commands },
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
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

function postDeleteReply(interaction, msg) {
	return new Promise(resolve => {
        interaction.reply({ content: msg, ephemeral: false });  
		setTimeout(() => interaction.deleteReply(), 10000);
	});
}



client.on('interactionCreate', async interaction => {
    try{
        if (!interaction.isSelectMenu() && !interaction.isCommand() && !interaction.isButton()) return;
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
            if(interaction.customId === 'tournament_regen'){
                var tournamentData = { 
                    'author' : interaction.message.embeds[0].author.name, 
                    'name' : interaction.message.embeds[0].title, 
                    'description' : interaction.message.embeds[0].description
                };
                var bodyData = JSON.stringify(tournamentData)
                const options = {
                    "method": "POST",
                    "hostname": hostname,
                    "port": port,
                    "path": path_text+'tournament/regen',
                    "headers": {
                        'Content-Type': 'application/json',
                        "Content-Length": Buffer.byteLength(bodyData)
                    }
                }
                const req = http.request(options, function(res) {
                    
                    var chunks = [];
                    res.setEncoding('utf8');
                    req.on('error', function (error) {
                        console.log(error);
                        interaction.reply({ content: 'Si ?? verificato un errore', ephemeral: true }); 
                    });

                    res.on("data", function (chunk) {
                        chunks.push(chunk);
                    });
                
                    res.on("end", function() {
                        try {
                            var object = JSON.parse(chunks); 
                            var embed = new MessageEmbed()
                            .setColor('#0099ff')
                            .setTitle(object.name)
                            .setAuthor({ name: object.author, iconURL: object.author_image, url: '' })
                            .setDescription(object.description)
                            .setThumbnail(object.image)


                            if(object.teamsize == 1){
                                embed.addField('PARTECIPANTI:', '\u200b', false);
                
                                //var fieldsUsers = [];              
                                //var fieldsTeams = [];           
                                //var fieldsRounds = []; 

                                var i = 0;
                                for (i = 0; i < object.users.length; i++) {
                                    var user = object.users[i];
                                    //var fieldsUser = { name: user.username, value: user.title, inline: true }
                                    //fieldsUsers.push(fieldsUser);     
                                    embed.addField(user.username, user.title, true)
                                }
                                
                                if (i%3 !== 0){
                                    while(i%3 !== 0) {
                                        //var fieldsUser = { name: '\u200b', value: '\u200b', inline: true }
                                        //fieldsUsers.push(fieldsUser);     
                                        embed.addField('\u200b', '\u200b', true)
                                        i = i + 1;
                                    }
                                }
                            }
                            if(object.teamsize > 1){
                                embed.addField('\u200b', 'SQUADRE', false)
                            }
                            var k = 0;
                            if (object.teamsize > 1) {
                                for (k = 0; k < object.teams.length; k++) {
                                    var team = object.teams[k];
                                    var users_add = "";
                                    for (var j = 0; j < team.users.length; j++) {
                                        var user = team.users[j];
                                        users_add = user.username + " " + users_add;                    
                                    }                  
                                    var teamName = "";   
                                    if ( team.name === 0) {
                                        teamName = team.users[0].title;
                                    } else {
                                        teamName = team.name;
                                    }
                                    //var fieldsTeam = { name: teamName, value: users_add, inline: true }
                                    //fieldsTeams.push(fieldsTeam);
                                    if(object.teamsize > 1){
                                        embed.addField(teamName, users_add, true)
                                    }
                                }                    
                                if (k%3 !== 0 && object.teamsize > 1){
                                    while(k%3 !== 0) {
                                        //var fieldsTeam = { name: '\u200b', value: '\u200b', inline: true }
                                        //fieldsTeams.push(fieldsTeam);    
                                        embed.addField('\u200b', '\u200b', true) 
                                        k = k + 1;
                                    }
                                }                            
                            }
                            embed.addField('\u200b', 'MATCH GENERATI', false)
                            var h = 0;
                            for (h = 0; h < object.rounds.length; h++) {
                                var round = object.rounds[h];
                                var teams = "";
                                teams = round.teams[0].name + "     VS     " + round.teams[1].name;

                                var user0 = "";
                                for (var j = 0; j < round.teams[0].users.length; j++) {
                                    var user = round.teams[0].users[j];
                                    user0 = user.username + " " + user0;                    
                                }  
                                var user1 = "";
                                for (var j = 0; j < round.teams[1].users.length; j++) {
                                    var user = round.teams[1].users[j];
                                    user1 = user.username + " " + user1;                    
                                }  

                                var users = user0 + "     VS     " + user1;
                                if (round.teams[0].name === 0 && round.teams[1].name === 0){
                                    //var fieldRound = { name: users, value: '\u200b', inline: false };
                                    //fieldsRounds.push(fieldRound);
                                    embed.addField(users, '\u200b', false) 
                                } else {                            
                                    //var fieldRound = { name: teams, value: users, inline: false };
                                    //fieldsRounds.push(fieldRound);
                                    embed.addField(teams, users, false) 
                                }
                            }
                            embed.setImage(object.image)
                                .setTimestamp()
                                .setFooter({ text: 'Creato da quel pezzente di '  + object.author, iconURL: object.guild_image });
                            const rowInfo1 = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId('tournament_review1')
                                    .setLabel("QUESTA E' UN ANTEPRIMA, SOLO TU PUOI VEDERLO!")
                                    .setStyle('DANGER')
                                    .setDisabled(true),
                            );
                            const rowInfo2 = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId('tournament_review2')
                                    .setLabel("PREMI 'PUBBLICA' PER PUBBLICARE IL TORNEO")
                                    .setStyle('DANGER')
                                    .setDisabled(true),
                            );
                            const rowInfo3 = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId('tournament_review3')
                                    .setLabel("OPPURE 'RIGENERA' PER RIGENERARE LE SQUADRE")
                                    .setStyle('DANGER')
                                    .setDisabled(true),
                            );
                            const row = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId('tournament_regen')
                                    .setLabel('Rigenera')
                                    .setStyle('PRIMARY'),
                            )
                            .addComponents(
                                new MessageButton()
                                    .setCustomId('tournament_publish')
                                    .setLabel('Pubblica')
                                    .setStyle('PRIMARY'),
                            )
                            interaction.reply({ ephemeral: true, embeds: [ embed ], components: [rowInfo1,rowInfo2,rowInfo3,row] });   
                        } catch (error) {
                            interaction.reply({ content: 'Si ?? verificato un errore', ephemeral: true });
                            console.error(error);
                        }
                    });
                
                });
                
                req.write(bodyData);
                req.end();
            } else if(interaction.customId === 'tournament_publish'){
                await interaction.reply({ embeds: [ interaction.message.embeds[0] ], ephemeral: false });
            } else if(interaction.customId === 'stop'){
                const connection = getVoiceConnection(interaction.member.voice.guild.id);
                if (connection !== null
                    && connection !== undefined){
                        connection.subscribe(player);
                        player.stop();
                        await interaction.reply({ content: 'Il pezzente ha smesso di riprodurre', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'Il pezzente non sta riproducendo nulla', ephemeral: true });
                    }
            } else if(interaction.customId === 'leave'){
                const connection = getVoiceConnection(interaction.member.voice.guild.id);
                if (connection !== null
                    && connection !== undefined){
                        connection.destroy();
                        await interaction.reply({ content: 'Il pezzente ?? uscito dal canale', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'Il pezzente non si trova in nessun canale', ephemeral: true });
                    }
            }else if(interaction.customId === 'insult'){
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
    
    
                    var params = api+path_audio+"insult?text=none";
    
    
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
                                interaction.reply({ content: 'Il pezzente sta insultando', ephemeral: true });          
                            });
                        })
                    }).catch(function(error) {
                        console.log(error);
                        interaction.reply({ content: 'Si ?? verificato un errore', ephemeral: true });   
                    }); 
                }
            }
        } else if (interaction.isSelectMenu()) {
            if(interaction.customId === 'videoselect'){
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
                    if (connection !== null
                        && connection !== undefined){
                        var video = interaction.values[0];
                        var params = api+path_music+'youtube/get?url='+encodeURIComponent(video);
                        await interaction.deferUpdate();
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
                                    const options = {
                                        "method": "GET",
                                        "hostname": hostname,
                                        "port": port,
                                        "path": path_music+'youtube/info?url='+encodeURIComponent(video)
                                    }
                                    const req = http.request(options, function(res) {
                
                                        var chunks = [];
                                    
                                        req.on('error', function (error) {
                                            console.log(error);
                                            interaction.reply({ content: 'Si ?? verificato un errore', ephemeral: true }); 
                                        });
                                        res.on("data", function (chunk) {
                                            chunks.push(chunk);
                                        });
                                    
                                        res.on("end", function() {
                                            try {
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
                                                var videores = object[0];
                                                const embed = new MessageEmbed()
                                                        .setColor('#0099ff')
                                                        .setTitle(videores.title)
                                                        .setURL(videores.link)
                                                        .setDescription(videores.link);
                                                
                                                interaction.editReply({ content: 'Il pezzente sta riproducendo', ephemeral: false, embeds: [embed], components: [rowStop] });  
                                                }
                                            
                                            } catch (error) {
                                                interaction.editReply({ content: 'Si ?? verificato un errore', ephemeral: true });
                                                console.error(error);
                                            }
                                        });
                                    
                                    });        
                                    
                                    req.end()  
                                });
                            })
                        }).catch(function(error) {
                            console.log(error);
                            interaction.editReply({ content: 'Si ?? verificato un errore', ephemeral: true });
                        });
                    } else {                
                        await interaction.reply({ content: 'Si ?? verificato un errore', ephemeral: true });
                    }
                }
            }
        }
    } catch (error) {
        await interaction.reply({ content: 'Si ?? verificato un errore', ephemeral: true });
        console.error(error);
    }
});

client.on("messageCreate", (msg) => {
        try{            
            if (msg.channelId === '972093345306411010' && !msg.member?.user.bot) {
                msg.delete();
            }
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
        
            if ((msg.content.toLowerCase().includes('pezzente') || msg.content.toLowerCase().includes('scemo') || msg.content.toLowerCase().includes('bot') || msg.content.toLowerCase().includes('boat'))
                && !msg.content.toLowerCase().includes('cerca') && !msg.content.toLowerCase().includes('play') && !msg.content.toLowerCase().includes('riproduci')) {
                var words = msg.content.toLowerCase().replace('pezzente','').replace('scemo','').replace('bot','').replace('boat','').trim();
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
            } else if ((msg.content.toLowerCase().includes('pezzente') || msg.content.toLowerCase().includes('scemo') || msg.content.toLowerCase().includes('bot') || msg.content.toLowerCase().includes('boat'))
                    && msg.content.toLowerCase().includes('cerca') && !msg.content.toLowerCase().includes('play') && !msg.content.toLowerCase().includes('riproduci')) {
                var words = msg.content.toLowerCase().replace('cerca','').replace('pezzente','').replace('scemo','').replace('bot','').replace('boat','').trim();
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
            } else if ((msg.content.toLowerCase().includes('pezzente') || msg.content.toLowerCase().includes('scemo') || msg.content.toLowerCase().includes('bot') || msg.content.toLowerCase().includes('boat'))
            && !msg.content.toLowerCase().includes('cerca') && (msg.content.toLowerCase().includes('riproduci') || msg.content.toLowerCase().includes('play'))) {
                var video = msg.content.toLowerCase().replace('riproduci','').replace('play','').replace('pezzente','').replace('scemo','').replace('bot','').replace('boat','').trim();
                if (video !== ''){
                    words = "Sto cercando: "+video;
                    var params = api+path_audio+"repeat/"+words;
                    
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
                                player.on(AudioPlayerStatus.Idle, () => {   
                                    const options = {
                                        "method": "GET",
                                        "hostname": hostname,
                                        "port": port,
                                        "path": path_music+'youtube/search?text='+encodeURIComponent(video)
                                    }
                                    const req = http.request(options, function(res) {
                                        
                                        req.on('error', function (error) {
                                            console.log(error);
                                            interaction.reply({ content: 'Si ?? verificato un errore', ephemeral: true }); 
                                        });
                                        var chunks = [];
                                    
                                        res.on("data", function (chunk) {
                                            chunks.push(chunk);
                                        });
                                    
                                        res.on("end", function() {
                                            try {
                                                var body = Buffer.concat(chunks);
                                                var object = JSON.parse(body.toString())
                                                if (object.length !== 0) {
                                                    var videourl = object[0].link;
                                                    var params = api+path_music+'youtube/get?url='+encodeURIComponent(videourl);
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
                                                            });
                                                        })
                                                    }).catch(function(error) {
                                                        console.log(error);
                                                    }); 
                                                }
                                            
                                            } catch (error) {
                                                console.error(error);
                                            }
                                        });
                                    
                                    });
                                    
                                    req.end();      
                                });
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
