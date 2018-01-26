var TelegramBot = require('node-telegram-bot-api');
var Queue = require('./queue');
var token = require('./config').token;

var maleQ = new Queue();
var femaleQ = new Queue();
var connections = [];

var bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, function(msg, match) {
  var text = "What's your gender?";

  var keyboardStr = JSON.stringify({
      inline_keyboard: [
        [
          {text:'Male',callback_data:'_male'},
          {text:'Female',callback_data:'_female'}
        ]
      ]
  });

  var keyboard = {reply_markup: JSON.parse(keyboardStr)};
  bot.sendMessage(msg.chat.id, text, keyboard);
});

bot.on("callback_query", function(callbackQuery) {
    //bot.sendMessage(callbackQuery.message.chat.id, callbackQuery.data);
    var isMale = (callbackQuery.data == '_male') ? true : false;

    var oppositeQ = isMale ? femaleQ : maleQ;
    var currentQ  = isMale ? maleQ : femaleQ;

    var _waitMessage = "Now there are no people we can connect you to. We'll inform you ASAP.";

	if(oppositeQ.size() == 0){
		currentQ.push(callbackQuery.message.chat.id);
		bot.sendMessage(callbackQuery.message.chat.id,_waitMessage);
		return;
	}

	var currentChatId = (callbackQuery.message.chat.id).toString();
	var partnerChatId = (oppositeQ.pop()).toString();

	if(currentChatId == partnerChatId){
		bot.sendMessage(callbackQuery.message.chat.id,_waitMessage);
		return;
	}

	connections[currentChatId] = partnerChatId;		
	connections[partnerChatId] = currentChatId;		
	
	var _message = "We've found a partner for you. Say hi to your parnter.";

	bot.sendMessage(currentChatId, _message);
	bot.sendMessage(partnerChatId, _message);
});

bot.on('message', function(msg, match) {
	var currentChatId = (msg.chat.id).toString();
	if(connections[currentChatId] != undefined){
		bot.sendMessage(connections[currentChatId], msg.text);
	};
});	