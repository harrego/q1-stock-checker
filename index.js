const {Client, Intents, MessageEmbed} = require('discord.js');

const cron = require('node-cron');
const got = require('got');
const JSSoup = require('jssoup').default;

// config
const spam = 'in-stock'; // spam channel for stock updates, dont use a channel you care about
const pingRole = 'everyone';


// SKUs to watch
const watchlist = [
    'Q1-A1', // Barebones ANSI Carbon Black
    'Q1-C2', // Fully assembled ANSI Carbon Black (blues)
    'Q1-C3', // Fully assembled ANSI Carbon Black (browns)
];

async function checkStock(chan) {
    const {body} = await got.get('https://www.keychron.com/products/keychron-q1');

    const soup = new JSSoup(body);
    const json = JSON.parse(soup.findAll('textarea').filter(a => a.attrs.id.startsWith('VariantsJson-'))[0].text);

    // send a discord message if a keeb is in stock
    const keebs = json.filter(k => k.available == true && watchlist.includes(k.sku));

    keebs.map(keeb => {
        const embed = new MessageEmbed()
            .setTitle('A keeb is available!')
            .setColor(0x1d1854)
            .setDescription(`@${pingRole} A new keeb is available, grab it before its lost 🤑`)
            .addField('Model', `${keeb.name}`, false)
            .addField('SKU', `${keeb.sku}`, false)
            .setFooter('I will check again in 25 minutes from now to avoid annoying Keychron 😇');
        
        chan.send({ embeds: [embed] });
    });
}

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
client.login(process.env.DISCORD);

// check every 25 mins */25 * * * *

client.on('ready', () => {
    const chan = client.channels.cache.find(channel => channel.name === spam);
    cron.schedule('*/25 * * * *', async () => {
        await checkStock(chan);
    });
});

