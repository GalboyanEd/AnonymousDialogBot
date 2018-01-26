var TelegramBot = require('node-telegram-bot-api');
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

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

myEmitter.on("my_callback_query", function(callbackQuery) {
	bot.emit('callback_query', callbackQuery)
});

bot.on("callback_query", function(callbackQuery) {
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

	connections[currentChatId] = {"partner": partnerChatId, "isMale": !isMale};		
	connections[partnerChatId] = {"partner": currentChatId, "isMale": isMale};		
	
	var _message = "We've found a partner for you. Say hi to your parnter.";
	var option = {
        "parse_mode": "Markdown",
        "reply_markup": {
            "one_time_keyboard": true,
            "keyboard": [[{
                text: "/changePartner"
            }]]
        }
    };

	bot.sendMessage(currentChatId, _message,option);
	bot.sendMessage(partnerChatId, _message,option);
});

bot.on('message', function(msg, match) {
	if((msg.text).indexOf('/') == 0){
		return;
	}

	var currentChatId = (msg.chat.id).toString();
	if(connections[currentChatId] != undefined){
		bot.sendMessage(connections[currentChatId].partner, msg.text);
	};
});	


bot.onText(/\/changePartner/, function(msg, match) {
	var currentChatId = (msg.chat.id).toString();

	var partnerChat = connections[currentChatId];
	var currentChat = connections[partnerChat.partner];

	var partnerChatId = partnerChat.partner;

	connections[currentChatId] = undefined;
	connections[partnerChatId] = undefined;

	if(currentChat.isMale == true)	{
		maleQ.push(currentChatId);
		femaleQ.push(partnerChatId);
	} else {
		maleQ.push(partnerChatId);
		femaleQ.push(currentChatId);
	}

	bot.sendMessage(currentChatId, "We've blocked your partner.");
	bot.sendMessage(partnerChatId, "Your partner blocked you.");

	var partnerCall = {};
	if(partnerChat.isMale){
		partnerCall.data = '_male';
	} else {
		partnerCall.data = '_female'
	}

	var currentCall = {};
	if(currentChat.isMale){
		currentCall.data = '_male';
	} else {
		currentCall.data = '_female'
	}

	currentCall.message = {"chat" : {"id" : currentChatId}};
	partnerCall.message = {"chat" : {"id" : partnerChatId}};

	setTimeout(myEmitter.emit, 1000, 'my_callback_query', currentCall);
	setTimeout(myEmitter.emit, 2000, 'my_callback_query', partnerCall);
})