const axios = require('axios');
const fs = require('fs');
const Telegraf = require('telegraf');
const Markup = require('telegraf/markup')
const TelegrafWit = require('telegraf-wit');
require('dotenv').config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const WIT_TOKEN = process.env.WIT_TOKEN;
const Bot = new Telegraf(BOT_TOKEN);
const wit = new TelegrafWit(WIT_TOKEN);
const CONFIDENCE_THRESHOLD = 0.9;
const TOTAL_POKEMONS = 721;

Bot.start((ctx) => {
  ctx.reply(`Welcome ${ctx.from.first_name}! type /joke for a good joke! 😁 or /pokemon to test your poke skills! 😎`);
});

Bot.command('joke', ctx => {
  axios.get('https://official-joke-api.appspot.com/jokes/programming/random')
    .then(async response => {
      setup = response.data[0].setup;
      punchline = response.data[0].punchline;
      await Bot.telegram.sendMessage(ctx.message.chat.id, setup);
      await Bot.telegram.sendMessage(ctx.message.chat.id, `${punchline} 🤣🤣🤣`);
    }).catch(async (e) => {
      await Bot.telegram.sendMessage(ctx.message.chat.id, 'Something went wrong! 😰');
    });
});

const random_shuffle = (array) => {
  var temp_array = [].concat(array);
  var currentIndex = temp_array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = temp_array[currentIndex];
    temp_array[currentIndex] = temp_array[randomIndex];
    temp_array[randomIndex] = temporaryValue;
  }
  return temp_array;
}

Bot.command('pokemon', async ctx => {
  try {
    await Bot.telegram.sendMessage(ctx.message.chat.id, 'Who is this Pokemon!? 😱');
    const pokemon_id_1 = Math.floor(Math.random() * TOTAL_POKEMONS);
    const pokemon_id_2 = Math.floor(Math.random() * TOTAL_POKEMONS);
    const pokemon_id_3 = Math.floor(Math.random() * TOTAL_POKEMONS);
    const pokemon_id_4 = Math.floor(Math.random() * TOTAL_POKEMONS);
    var [pokemon_1, pokemon_2, pokemon_3, pokemon_4] = await Promise.all([
      axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemon_id_1}/`),
      axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemon_id_2}/`),
      axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemon_id_3}/`),
      axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemon_id_4}/`),
    ]).catch(async (e) => {
      await Bot.telegram.sendMessage(ctx.message.chat.id, 'Something went wrong! 😰');
    });
    const pokemon_names = [pokemon_1.data.name, pokemon_2.data.name, pokemon_3.data.name, pokemon_4.data.name];
    const shuffled_names = random_shuffle(pokemon_names);
    const index = shuffled_names.findIndex(pokemon => {
      return pokemon === pokemon_names[0];
    });
    ctx.replyWithPhoto(`https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${pokemon_id_1}.png`,
      Markup.inlineKeyboard([
        [Markup.callbackButton(shuffled_names[0], index === 0 ? 'correct' : 'incorrect'),
        Markup.callbackButton(shuffled_names[1], index === 1 ? 'correct' : 'incorrect')],
        [Markup.callbackButton(shuffled_names[2], index === 2 ? 'correct' : 'incorrect'),
        Markup.callbackButton(shuffled_names[3], index === 3 ? 'correct' : 'incorrect')]
      ]).extra()
    )
  }
  catch (e) {
    await Bot.telegram.sendMessage(ctx.message.chat.id, 'Something went wrong! 😰');
  }
});

Bot.action('correct', (ctx) => {
  ctx.reply('You are a Pokemon Master! 👏')
})

Bot.action('incorrect', (ctx) => {
  ctx.reply('Keep Trying! 🤗')
})

Bot.on('text', async ctx => {
  let message = 'No entendi 🤔';
  const meaning = await wit.meaning(ctx.message.text);
  const intents = meaning.intents;
  if (intents.length === 0) return ctx.reply(message);
  const { name, confidence } = intents[0];
  if (confidence < CONFIDENCE_THRESHOLD) return ctx.reply(message);
  fs.readFile(`./Respuestas/${name}`, (_err, data) => {
    let phrases = data.toString().split('\n');
    message = phrases[Math.floor(Math.random() * phrases.length)];
    return ctx.reply(message);
  });
});
Bot.launch();
