const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed  } = require('discord.js');

const config = require("../config.json");
const http = require("http");

const port=config.API_PORT;
const hostname=config.API_HOSTNAME;
const path_text="/chatbot_text/"

function getSlashCommand() {
    var command = new SlashCommandBuilder()
    .setName('tournament')
    .setDescription('Genera un torneo (Min 3 - Max 16 Partecipanti)')        
    .addStringOption(option => option.setName('name').setDescription('Nome del torneo').setRequired(true))
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
            } else {
                i = 17;
            }
        }

        var tournamentData = { 
            'author' : interaction.member.user.username, 
            'author_image' : interaction.member.user.displayAvatarURL(), 
            'guild_image' : interaction.member.guild.iconURL(), 
            'name' : name, 
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
                var object = JSON.parse(chunks)                
                var fieldsRounds = [];             
                var fieldsTeams = [];        
                var fieldsUsers = [];
                object.rounds.forEach(function(round) {
                    var teams = "";
                    teams = round.teams[0].name + " vs " + round.teams[1].name;
                    var fieldRound = { name: round.name, value: teams, inline: true };
                    fieldsRounds.push(fieldRound);

                    
                    roundinto.teams.forEach(function(team) {
                        var users_add = "";
                        team.users.forEach(function(user) {   
                            users_add = user.username + " / " + users_add;                              
                            var fieldsUser = { name: user.username, value: user.title, inline: true }
                            fieldsUsers.push(fieldsUser);                   
                        });
                        
                        var fieldsTeam = { name: team.name, value: users_add, inline: true }
                        fieldsTeams.push(fieldsTeam);
                    });
                });
                const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Torneo: ' + name)
                .setAuthor({ name: object.author, iconURL: object.author_image, url: '' })
                .setDescription(object.description)
                .addField('Work in progress', 'Quel pezzente di blast deve finire di implementarmi lato server!', false)
                .addField('Turni', 'Lista turni generati', false)
                .addFields(fieldsRounds)
                .addField('Squadre', 'Lista squadre generate', false)
                .addFields(fieldsTeams)
                .addField('Partecipanti', 'Lista dei partecipanti', false)
                .addFields(fieldsUsers)
                .setImage(object.image)
                .setTimestamp()
                .setFooter({ text: 'Creato da quel pezzente di '  + object.author, iconURL: object.guild_image });

                interaction.reply({ ephemeral: false, embeds: [ embed ] });   
            });
        
        });
        
        req.write(bodyData);
        req.end();
                
                            
    }
};