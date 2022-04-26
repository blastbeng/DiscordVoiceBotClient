const { SlashCommandBuilder } = require('@discordjs/builders');

const fs = require('fs');
const config = require("../config.json");
const fetch = require('node-fetch');

const path = config.CACHE_DIR;
const api=config.API_URL;
const text="&text=";
const path_text="/chatbot_text/"

module.exports = {
    data: new SlashCommandBuilder()
        .setName('learn')
        .setDescription('Insegna qualcosa al pezzente')
        .addStringOption(option => option.setName('input').setDescription('Che cosa vuoi insegnare?').setRequired(true))
        .addStringOption(option => option.setName('definition').setDescription('Definizione').setRequired(true)),
    async execute(interaction) {
        const words = interaction.options.getString('input');

        if(!(new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?").test(words))){

            const definition = interaction.options.getString('definition');

            var params = api+path_text+"learn/"+words+"/"+definition;

            fetch(
                params,
                {
                    method: 'GET',
                    headers: { 'Accept': '*/*' }
                }
            ).then(res => {
                interaction.reply({ content: 'Il pezzente ha imparato: '+words+" => "+definition, ephemeral: true });
            }); 
        } else {
            interaction.reply({ content: 'Ma che c**** scrivi?!', ephemeral: true });
        }
    }
}; 
