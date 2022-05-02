const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');

const config = require("../config.json");
const http = require("http");

const port=config.API_PORT;
const hostname=config.API_HOSTNAME;
const path_text="/chatbot_text/"

function getSlashCommand() {
    var command = new SlashCommandBuilder()
    .setName('tournament')
    .setDescription('Genera un torneo (Min 3 - Max 16 Utenti)')
    .addStringOption(option => option.setName('name').setDescription('Nome del torneo').setRequired(true))
    .addIntegerOption(option => option.setName('size').setDescription('Dimensione dei Team').setRequired(true))
    .addStringOption(option => option.setName('description').setDescription('Descrizione del torneo').setRequired(true))
    .addStringOption(option => option.setName('image').setDescription("Link Immagine del torneo").setRequired(true));
    for(var i = 1; i < 17; i++){
        if ( i <= 3 ) {
            command.addUserOption(option => option.setName('user'+i).setDescription('Partecipante '+i).setRequired(true));
        } else {            
            command.addUserOption(option => option.setName('user'+i).setDescription('Partecipante '+i).setRequired(false));
        }
    }
    return command;
}

module.exports = {
    data: getSlashCommand(),
    async execute(interaction) {
        var errorMsg = "";
        

        var teamsize = interaction.options.getInteger('size');
        if (teamsize === 0 || teamsize > 17) {                  
            var errorMsg = "Errore! La grandezza del team non può essere inferiore o uguale a 0 o maggiore di 16!";
            interaction.reply({ content: errorMsg, ephemeral: true });  
            return
        }
        

        const name = interaction.options.getString('name');  
        var description = interaction.options.getString('description');    
        var image = interaction.options.getString('image');

        if (!image.startsWith('http')){            
            var errorMsg = "Errore! Il link dell'immagine non è corretto.";
            interaction.reply({ content: errorMsg, ephemeral: true });  
            return
        }
        
        var arrayUsers = [];
        for(var i = 1; i < 17; i++){
            var user = interaction.options.getUser('user'+i);   
            if (user !== null && user !== undefined) {
                if (user.bot) {        
                    var errorMsg = "Errore! Hai inserito un bot come partecipante del torneo.";
                    interaction.reply({ content: errorMsg, ephemeral: true });  
                    return
                }
                for(var j = 0; j< arrayUsers.length; j++){
                    var partecipante = arrayUsers[j];
                    if (partecipante.id === user.id){
                        var errorMsg = "Errore! Hai inserito due volte lo stesso partecipante.";
                        interaction.reply({ content: errorMsg, ephemeral: true });  
                        return;
                    }
                }
                var user_add = {
                    'id': user.id,
                    'username': user.username,
                    'image': user.displayAvatarURL()
                }
                arrayUsers.push(user_add);
            }
        }

        var tournamentData = { 
            'author' : interaction.member.user.username, 
            'author_image' : interaction.member.user.displayAvatarURL(), 
            'guild_image' : interaction.member.guild.iconURL(), 
            'teamsize' : teamsize,
            'name' : 'TORNEO: ' + name, 
            'description' : description, 
            'image' : image, 
            'users' : arrayUsers
        };

        var bodyData = JSON.stringify(tournamentData)

        const options = {
            "method": "POST",
            "hostname": hostname,
            "port": port,
            "path": path_text+'tournament',
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
                interaction.reply({ content: 'Si è verificato un errore', ephemeral: true }); 
            });

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
        
            res.on("end", function() {
                try {
                    var object = JSON.parse(chunks)           
                    var fieldsUsers = [];              
                    var fieldsTeams = [];           
                    var fieldsRounds = []; 

                    var i = 0;
                    for (i = 0; i < object.users.length; i++) {
                        var user = object.users[i];
                        var fieldsUser = { name: user.username, value: user.title, inline: true }
                        fieldsUsers.push(fieldsUser);     
                    }
                    
                    if (i%3 !== 0){
                        while(i%3 !== 0) {
                            var fieldsUser = { name: '\u200b', value: '\u200b', inline: true }
                            fieldsUsers.push(fieldsUser);     
                            i = i + 1;
                        }
                    }
                    
                    if (object.teamsize > 1) {
                        for (i = 0; i < object.teams.length; i++) {
                            var team = object.teams[i];
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
                            var fieldsTeam = { name: teamName, value: users_add, inline: true }
                            fieldsTeams.push(fieldsTeam);
                        }                    
                        if (i%3 !== 0){
                            while(i%3 !== 0) {
                                var fieldsTeam = { name: '\u200b', value: '\u200b', inline: true }
                                fieldsTeams.push(fieldsUser);     
                                i = i + 1;
                            }
                        }                            
                    }

                    for (i = 0; i < object.rounds.length; i++) {
                        var round = object.rounds[i];
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
                            var fieldRound = { name: users, value: '\u200b', inline: false };
                            fieldsRounds.push(fieldRound);
                        } else {                            
                            var fieldRound = { name: teams, value: users, inline: false };
                            fieldsRounds.push(fieldRound);
                        }
                    }
                    var embed;
                    if (object.teamsize > 1) {
                        embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle(name)
                        .setAuthor({ name: object.author, iconURL: object.author_image, url: '' })
                        .setDescription(object.description)
                        .setThumbnail(object.image)
                        .addField('\u200b', '\u200b')
                        .addField('PARTECIPANTI:', '\u200b', false)
                        .addFields(fieldsUsers)
                        .addField('\u200b', '\u200b')
                        .addField('SQUADRE', '\u200b', false)
                        .addFields(fieldsTeams)
                        .addField('\u200b', '\u200b')
                        .addField('MATCH GENERATI', '\u200b', false)
                        .addFields(fieldsRounds)
                        .setImage(object.image)
                        .setTimestamp()
                        .setFooter({ text: 'Creato da quel pezzente di '  + object.author, iconURL: object.guild_image });
                    } else {
                        embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle(name)
                        .setAuthor({ name: object.author, iconURL: object.author_image, url: '' })
                        .setDescription(object.description)
                        .setThumbnail(object.image)
                        .addField('\u200b', '\u200b')
                        .addField('PARTECIPANTI:', '\u200b', false)
                        .addFields(fieldsUsers)
                        .addField('\u200b', '\u200b')
                        .addField('MATCH GENERATI', '\u200b', false)
                        .addFields(fieldsRounds)
                        .setImage(object.image)
                        .setTimestamp()
                        .setFooter({ text: 'Creato da quel pezzente di '  + object.author, iconURL: object.guild_image });

                    }
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
                    interaction.reply({ content: 'Si è verificato un errore', ephemeral: true });
                    console.error(error);
                }
            });
        
        });
        
        req.write(bodyData);
        req.end();
                
                            
    }
};