# q1-stock-checker
Keychron Q1 live stock checker Discord bot. Notifies you when keyboards are in stock. The bot caches the last data pull in `cache.csv` and will only post in the channel if the server data doesn't match the cached data.

## Libraries used
- discord.js
- got
- jssoup
- node-cron
- csv-parse
- csv-stringify

## Usage
```sh
export DISCORD=token
node index.js
```