var TelegramBot = require('node-telegram-bot-api');
var token = require('./config').token;

var bot = new TelegramBot(token, {polling: true});

bot.onText(function(){
    var fromId = msg.from.id;
    var resp = match[1];
    bot.sendMessage(fromId, "The bot is under construction.");
});

bot.on('message', function (msg) {
    var chatId = msg.chat.id;
    var photo = 'cats.png';
    bot.sendPhoto(chatId, photo, {caption: 'Милые котята'});
});