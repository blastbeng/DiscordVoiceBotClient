const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioPlayer } = require('@discordjs/voice');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');

const player = createAudioPlayer();
const fetch = require('node-fetch');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('tournament')
        .setDescription('Genera un torneo selezionando i partecipanti')        
        .addStringOption(option => option.setName('name').setDescription('Nome del torneo').setRequired(true)),
    async execute(interaction) {
        interaction.reply({ content: 'Il generatore di tornei ancora non funziona, quello stronzo di blast deve implementarmi', ephemeral: false });
        //const name = interaction.options.getString('name');
        //var options = []
        //await interaction.guild.members.fetch().then(members_coll => {
        //    var members = Array.prototype.slice.call( members_coll, 0 );
        //    var options = [];
        //    for (var i = 0; i < members.length && i < 25; i++) {
        //        var member = members[i];
        //        if(member.user.bot !== true && member.nickname !== undefined && member.nickname !== null) {
        //            var option = {};
        //            option.label = member.nickname;
        //            option.description = member.nickname;
        //            option.value = member.nickname;
        //            options.push(option);
        //        }
        //    }
        //    const row = new MessageActionRow()
        //    .addComponents(
        //        new MessageSelectMenu()
        //            .setCustomId('users_tournament')
        //            .setPlaceholder('Seleziona i partecipanti')
        //            .setMinValues(3)
        //            .setMaxValues(20)
        //            .addOptions(options),
        //    )
        //    interaction.reply({ content: 'Qualcuno ha creato il torneo "' + name + '". Seleziona i partecipanti',  ephemeral: false, components: [row] });
        //});
   
                            
    }
};