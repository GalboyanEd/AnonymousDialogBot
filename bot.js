var TelegramBot = require('node-telegram-bot-api');
var token = require('./config').token;
var includes = require('./includes.js');
var _msg = require('./messages.js')

var maleQ = [];
var femaleQ = [];
var connections = {};
var genders = {};

var bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, function(msg, match) {
	if(includes.inAnObject(msg.chat.id, genders) == true) {
		findPartner(msg.chat.id);
		return;
	}

	if(includes.inAnObject(msg.chat.id, connections) == true) {
		bot.sendMessage(msg.chat.id, _msg._already_in_chat);
		return;
	}

	var keyboardStr = JSON.stringify({
			inline_keyboard: [
				[
					{text:'Male',callback_data:'_male'},
					{text:'Female',callback_data:'_female'}
				]
			]
	});

	var keyboard = {reply_markup: JSON.parse(keyboardStr)};
	bot.sendMessage(msg.chat.id, _msg._gender_question, keyboard);
});

bot.on("callback_query", function(callbackQuery) {
    var isMale = (callbackQuery.data == '_male');
    genders[callbackQuery.message.chat.id] = isMale;

    if(includes.inAnArray(callbackQuery.message.chat.id, femaleQ) ||
        includes.inAnArray(callbackQuery.message.chat.id, maleQ)){
        bot.sendMessage(callbackQuery.message.chat.id, _msg._please_wait_in_queue);
    }

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

    if((msg.text).indexOf('/') == 0){
        return;
    }

	var currentChatId = msg.chat.id;
	if(connections[currentChatId] != undefined){
		bot.sendMessage(connections[currentChatId], msg.text);
	};
});	


bot.onText(/\/endChat/, function(msg, match) {
    var currentChatId = msg.chat.id;
    var partnerChatId = connections[currentChatId];

	if(includes.inAnObject(msg.chat.id, connections)){
		connections[currentChatId] = undefined;
		connections[partnerChatId] = undefined;

		bot.sendMessage(currentChatId, _msg._end_message);
		bot.sendMessage(partnerChatId, _msg._end_message);
	} else {
		bot.sendMessage(currentChatId, _msg._no_current_chat + '\n' + _msg._start_message);
		return;
	}

	bot.sendMessage(currentChatId, _msg._start_message);
	bot.sendMessage(partnerChatId, _msg._start_message);
})

function findPartner(chatID){
	isMale = genders[chatID];

	var oppositeQ = isMale ? femaleQ : maleQ;
	var currentQ	= isMale ? maleQ : femaleQ;

	if(oppositeQ.length == 0){
		currentQ.push(chatID);
		bot.sendMessage(chatID, _msg._please_wait_in_queue);
		return;
	}

	var currentChatId = chatID;
	var partnerChatId = oppositeQ.shift();

	if(currentChatId == partnerChatId){
		bot.sendMessage(chatID,_msg._please_wait_in_queue);
		return;
	}

	connections[currentChatId] = partnerChatId;		
	connections[partnerChatId] = currentChatId;		
	
	var _message = _msg._found_someone + " Say hi to " + ((genders[partnerChatId]) ? 'him.' : 'her.');

	bot.sendMessage(currentChatId, _message);
	bot.sendMessage(partnerChatId, _message);

	var option = {
				"parse_mode": "Markdown",
				"reply_markup": {
						"one_time_keyboard": true,
						"keyboard": [[{
								text: "/endChat"
						}]]
				}
		};

	bot.sendMessage(currentChatId, _msg._end_chat, option);
	bot.sendMessage(partnerChatId, _msg._end_chat, option);
}

bot.on('polling_error', function(error){
	console.log(error);
});