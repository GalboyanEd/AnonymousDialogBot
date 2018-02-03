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
	if(includes.inAnObject(msg.chat.id, connections) == true) {
		bot.sendMessage(msg.chat.id, _msg._already_in_chat);
		return;
	}

    if(includes.inAnObject(msg.chat.id, genders) == true) {
        findPartner(msg.chat.id);
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
	bot.deleteMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id);

    var isMale = (callbackQuery.data == '_male');
    genders[callbackQuery.message.chat.id] = isMale;

    if(includes.inAnArray(callbackQuery.message.chat.id, femaleQ) ||
        includes.inAnArray(callbackQuery.message.chat.id, maleQ)){
        bot.sendMessage(callbackQuery.message.chat.id, _msg._please_wait_in_queue);
    	return;
    }

	findPartner(callbackQuery.message.chat.id);
})

bot.on('message', function(msg, match) {
	var currentChatId = msg.chat.id;
    var partnerChatId = connections[currentChatId];

    if(msg.text != undefined){
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

        if(partnerChatId === undefined)
        	if(includes.inAnObject(msg.chat.id, genders)){
        		bot.sendMessage(currentChatId, _msg._please_wait_in_queue);
        		return;
        	} else {
        		bot.sendMessage(currentChatId, _msg._start_message);
        		return;
        	}
        bot.sendMessage(partnerChatId, msg.text);
    }
});

bot.on('sticker', function(msg) {
    sendX('sticker', msg);
});

bot.on('audio', function(msg) {
	sendX('audio', msg);
});

bot.on('document', function(msg) {
    sendX('document', msg);
});

bot.on('photo', function(msg) {
	sendX('photo', msg);
});

bot.on('video', function(msg) {
    sendX('video', msg);
});

bot.on('voice', function(msg) {
	sendX('voice', msg);
});

bot.on('contact', function(msg) {
    sendX('contact', msg);
});

bot.on('location', function(msg) {
	sendX('location', msg);
});

bot.onText(/\/endchat/, function(msg, match) {
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
		if(includes.inAnArray(chatID, currentQ) == false) 
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
	
	var _message = _msg._found_someone + " Say hi to ";

	bot.sendMessage(currentChatId, _message + ((genders[partnerChatId]) ? 'him.' : 'her.'));
	bot.sendMessage(partnerChatId, _message + ((genders[currentChatId]) ? 'him.' : 'her.'));

	bot.sendMessage(currentChatId, _msg._end_chat);
	bot.sendMessage(partnerChatId, _msg._end_chat);
}

bot.on('polling_error', function(error){
	console.log(error);
});

function sendX(string, msg){
    var currentChatId = msg.chat.id;
    var partnerChatId = connections[currentChatId]; 

 	if(partnerChatId == undefined)
    	if(includes.inAnObject(msg.chat.id, genders)){
    		bot.sendMessage(currentChatId, _msg._please_wait_in_queue);
    		return;
    	} else {
    		bot.sendMessage(currentChatId, _msg._start_message);
    		return;
    	}

    switch(string){
    	case 'text':
			bot.sendMessage(partnerChatId, msg.text);
			break;
		case 'sticker':
			bot.sendSticker(partnerChatId, msg.sticker.file_id);
			break;
		case 'audio':
			bot.sendAudio(partnerChatId, msg.audio.file_id);
			break;
		case 'document':
			bot.sendDocument(partnerChatId, msg.document.file_id);
			break;
		case 'photo':
			bot.sendPhoto(partnerChatId, msg.photo[msg.photo.length - 1].file_id);
			break;
		case 'video':
			bot.sendVideo(partnerChatId, msg.video.file_id);
			break;
		case 'voice':
			bot.sendVoice(partnerChatId, msg.voice.file_id);
			break;
		case 'contact':
			bot.sendContact(partnerChatId, msg.contact.phone_number, msg.contact.first_name);
			break;
		case 'location':
			bot.sendLocation(partnerChatId, msg.location.latitude, msg.location.longitude);
			break;
    }

}