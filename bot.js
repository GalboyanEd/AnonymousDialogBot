var TelegramBot = require('node-telegram-bot-api');
var token = require('./config').token;

var bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, function(msg, match) {
  var text = "What's your gender?";
 
  var keyboardStr = JSON.stringify({
      inline_keyboard: [
        [
          {text:'Male',callback_data:'You chosen Male.'},
          {text:'Female',callback_data:'You chosen Female.'}
        ]
      ]
  });
 
  var keyboard = {reply_markup: JSON.parse(keyboardStr)};
  bot.sendMessage(msg.chat.id, text, keyboard);
});

bot.on("callback_query", function(callbackQuery) {
    bot.sendMessage(callbackQuery.message.chat.id, callbackQuery.data);
});