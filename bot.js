var TelegramBot = require('node-telegram-bot-api');
var token = require('./config').token;

var maleQ = [];
var femaleQ = [];
var connections = {};
var genders = {};

var bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, function(msg, match) {
	if(genders[msg.chat.id] != undefined) {
		findPartner(msg.chat.id);
		return;
	}

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
		var isMale = (callbackQuery.data == '_male') ? true : false;
		genders[callbackQuery.message.chat.id] = isMale;
	findPartner(callbackQuery.message.chat.id);
})

bot.on('message', function(msg, match) {
	if((msg.text).indexOf('/log') == 0){
	console.log('msg.chat.id is ' + msg.chat.id);
	console.log('femaleQ is ' + femaleQ);
	console.log('makeQ is ' + maleQ);
	console.log('connections is ' + JSON.stringify(connections));
	console.log('genders is ' + JSON.stringify(genders));
		return;
	}

	var currentChatId = msg.chat.id;
	if(connections[currentChatId] != undefined){
		bot.sendMessage(connections[currentChatId], msg.text);
	};
});	


bot.onText(/\/changePartner/, function(msg, match) {
	var currentChatId = msg.chat.id;
	var partnerChatId = connections[currentChatId];

	connections[currentChatId] = undefined;
	connections[partnerChatId] = undefined;

	bot.sendMessage(currentChatId, "We've blocked your partner.");
	bot.sendMessage(partnerChatId, "Your partner blocked you.");

	var _message = 'Type /start to find a partner.';

	bot.sendMessage(currentChatId, _message);
	bot.sendMessage(partnerChatId, _message);
})

function isInQueue(chatID, queue){
	return !(queue.indexOf(chatID) == -1);
}

function findPartner(chatID){
	isMale = genders[chatID];

		var oppositeQ = isMale ? femaleQ : maleQ;
		var currentQ	= isMale ? maleQ : femaleQ;

		var _waitMessage = "Now there are no people we can connect you to. We'll inform you ASAP.";

	if(oppositeQ.length == 0){
		currentQ.push(chatID);
		bot.sendMessage(chatID,_waitMessage);
		return;
	}

	var currentChatId = chatID;
	var partnerChatId = oppositeQ.shift();

	if(currentChatId == partnerChatId){
		bot.sendMessage(chatID,_waitMessage);
		return;
	}

	connections[currentChatId] = partnerChatId;		
	connections[partnerChatId] = currentChatId;		
	
	var _message = "We've found someone for you. Say hi to your parnter.";

	bot.sendMessage(currentChatId, _message);
	bot.sendMessage(partnerChatId, _message);

	var option = {
				"parse_mode": "Markdown",
				"reply_markup": {
						"one_time_keyboard": true,
						"keyboard": [[{
								text: "/changePartner"
						}]]
				}
		};

		_message = "You can always change your partner by typing /changePartner";

	bot.sendMessage(currentChatId, _message, option);
	bot.sendMessage(partnerChatId, _message, option);
}

bot.on('polling_error', function(error){
	console.log(error);
});