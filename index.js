const {Client, Intents, MessageEmbed} = require('discord.js');

const cron = require('node-cron');
const got = require('got');
const JSSoup = require('jssoup').default;

// config
const spam = 'in-stock'; // spam channel for stock updates, dont use a channel you care about
const pingRole = 'everyone';

const cache = require("./cache")

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
    const keebs = json.filter(k => watchlist.includes(k.sku));
    let filteredKeebs = keebs

    try {
        const existingCacheData = await cache.readCache()
        filteredKeebs = filteredKeebs.filter(serverK => {
            for (var cachedKeyboard of existingCacheData) {
                const cachedId = parseInt(cachedKeyboard.id)
                if (cachedId == serverK.id) {
                    const cachedKeyboardAvailable = parseInt(cachedKeyboard.available) == 0 ? false : true
                    if (cachedKeyboard.available != serverK.available) {
                        return true
                    }
                    if (cachedKeyboard.name != serverK.name) {
                        return true
                    }
                    if (cachedKeyboard.sku != serverK.sku) {
                        return true
                    }
                    return false
                }
            }
            return true
        })
    } catch (err) {
        console.log(err)
        console.log("[warning] failed to read cache")
    }

    filteredKeebs.map(keeb => {
        const embed = new MessageEmbed()
            .setTitle(keeb.available ? 'A keeb is available!' : 'A keep went out of stock...')
            .setColor(0x1d1854)
            .setDescription(keeb.available ? `@${pingRole} A new keeb is available, grab it before its lost 🤑` : `Sorry... :pensive:`)
            .addField('Model', `${keeb.name}`, false)
            .addField('SKU', `${keeb.sku}`, false)
            .setFooter('I will check again in 25 minutes from now to avoid annoying Keychron 😇');
        
        chan.send({ embeds: [embed] });
    });

    const cacheData = keebs.map(k => { return {
        available: k.available ? 1 : 0,
        id: k.id,
        name: k.name,
        sku: k.sku,
        date: Math.round((new Date()).getTime() / 1000)
    }})

    try {
        await cache.writeCache(cacheData)
    } catch (err) {
        console.log("[warning] failed to write cache, dumping error")
        console.log(err)
    }
    
}

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
if (!process.env.DISCORD || process.env.DISCORD.length <= 0) {
    console.log("[error] you forgot the discord token env var (DISCORD)")
    process.exit(1)
}
client.login(process.env.DISCORD);

// check every 25 mins */25 * * * *

client.on('ready', () => {
    console.log(`[log] discord bot started`)
    console.log(`[log] logged in as ${client.user.username}#${client.user.discriminator}`)
    console.log(`[log] in ${Array(client.guilds.cache).length} guilds`)
    const chan = client.channels.cache.find(channel => channel.name === spam);
    cron.schedule('*/25 * * * *', async () => {
        await checkStock(chan);
    });
    checkStock(chan)
});

