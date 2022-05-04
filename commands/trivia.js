const { SlashCommandBuilder } = require('@discordjs/builders');

const config = require("../config.json");
const http = require("http");

const port=config.TRIVIA_API_PORT;
const hostname=config.API_HOSTNAME;
const path_trivia="/chatbot_trivia/"


module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Avvia un Quiz'),
    async execute(interaction) {
        const options = {
            "method": "GET",
            "hostname": hostname,
            "port": port,
            "path": path_trivia+'getquiz?author='+encodeURIComponent(interaction.member.user.username)
        }
    
        const req = http.request(options, function(res) {
            
            req.on('error', function (error) {
                console.log(error);
                interaction.reply({ content: 'Si è verificato un errore', ephemeral: true }); 
            });
            var chunks = [];     
        
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
        
            res.on("end", function() {
    
                try {
                    var object = JSON.parse(chunks);
                    
                    var quizname = "Quiz N° " + object.id;

                    interaction.reply({ content: quizname, ephemeral: true });  
                     
                } catch (error) {
                    interaction.reply({ content: 'Si è verificato un errore', ephemeral: true });
                    console.error(error);
                }
                
            });
        
        });         
        
        req.end()
                
    }
};