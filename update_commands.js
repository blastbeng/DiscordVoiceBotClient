const {
    REST
} = require('@discordjs/rest');
const {
    Routes
} = require('discord-api-types/v9');

const config = require("./config.json");
const fs = require('fs');

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const BOT_ID = config.BOT_ID;
const GUILD_ID = config.GUILD_ID;
const TOKEN = config.BOT_TOKEN;
const rest = new REST({
    version: '9'
}).setToken(TOKEN);
try {
    rest.get(Routes.applicationGuildCommands(BOT_ID, GUILD_ID))
        .then(data => {
            const promises = [];
            for (const command of data) {
                const deleteUrl = `${Routes.applicationGuildCommands(BOT_ID, GUILD_ID)}/${command.id}`;
                promises.push(rest.delete(deleteUrl));
            }
            return Promise.all(promises);
    });
    rest.put(Routes.applicationGuildCommands(BOT_ID, GUILD_ID), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
} catch (error) {
    if (error) console.error(error);
}