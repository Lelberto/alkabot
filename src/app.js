// Dépendances
const fs = require('fs');
const yaml = require('js-yaml');
const _ = require('lodash');
const Logger = require('@downstacks/downlogger');
const Discord = require('discord.js');



// Variables globales
const logger = new Logger('./logs/bot.log');
const bot = new Discord.Client();
var config;



/**
 * Charge la configuration.
 *
 * @param {Function} callback Fonction de callback (paramètres : erreur, configuration)
 */
function loadConfig(callback) {
	try {
		callback && callback(null, yaml.safeLoad(fs.readFileSync('./config/bot.yml', 'utf-8')));
	} catch (err) {
		callback && callback(err);
	}
}

/**
 * Traite un message.
 *
 * @param {Message} msg Message à traiter
 */
function processMessage(msg) {
	let channel = msg.channel;
	let author = msg.author;
	let content = msg.content;

	if (content.startsWith('!alkabot')) { // Si c'est une commande
		processCommand(content.substring(9, content.length).split(' '), (err, msg) => {
			if (err) {
				logger.error(err);
				return;
			}
			channel.send(msg);
		});
	} else if (author !== bot.user) { // Si c'est un message
		processReply((err, msg) => {
			if (err) {
				logger.error(err);
				return;
			}
			if (msg) {
				channel.send(msg);
			}
		});

		processReact(content, (err, emoji) => {
			if (err) {
				logger.error(err);
				return;
			}
			msg.react(emoji);
		});
	}
}

/**
 * Traite une commande.
 *
 * @param {Array} cmd Éléments de la commande
 * @param callback {Function} Fonction de callback (paramètres : erreur, message)
 */
function processCommand(cmd, callback) {
	switch (cmd[0]) {
		default:
		case 'help':
			fs.readFile('./config/help-message.txt', 'utf-8', (err, data) => {
				if (err) {
					callback && callback(err);
					return;
				}
				callback && callback(null, data);
			});
			break;
		case 'reload':
			loadConfig((err, result) => {
				if (err) {
					callback && callback(err);
					return;
				}
				config = result;
				callback && callback(null, 'TU ME LA RECHARGE CETTE CONFIG OUI OU NOOOOON ?!');
			});
			break;
		case 'random':
			callback && callback(null, randomMessage());
			break;
	}
}

/**
 * Traite une réponse.
 *
 * @param callback {Function} Fonction de callback (paramètres : erreur, réponse)
 */
function processReply(callback) {
	if (_.random(0, 100) < config.reply_chance) {
		callback && callback(null, randomMessage());
	} else {
		callback && callback(null, false);
	}
}

/**
 * Traite une réaction.
 *
 * @param callback {Function} Fonction de callback (paramètres : erreur, émoji)
 */
function processReact(msg, callback) {
	config.keywords_reactions.forEach((keyword) => {
		if (msg.toLowerCase().includes(keyword.toLowerCase())) {
			callback && callback(null, bot.emojis.find((emoji) => emoji.name === 'alkaraz'));
			return;
		}
	});
}

/**
 * Retourne un message aléatoire.
 *
 * @return Message aléatoire
 */
function randomMessage() {
	return config.replies[_.random(0, config.replies.length - 1)];
}



// Chargement de la configuration
loadConfig((err, result) => {
	if (err) {
		logger.error(err);
		return;
	}
	config = result;
});

// bot.on('debug', (debug) => {
// 	logger.debug(debug);
// });
bot.on('warn', (warn) => {
	logger.warn(warn);
});
bot.on('error', (err) => {
	logger.error(err);
});
bot.on('ready', () => {
	bot.user.setActivity('!alkabot');
	logger.info('BOT is connected');
});
bot.on('message', processMessage);
bot.login(config.token);
