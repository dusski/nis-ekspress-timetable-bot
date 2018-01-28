"use strict";

require("dotenv").load();

const BootBot = require("bootbot");

const bot = new BootBot({
	accessToken: process.env.FB_ACCESS_TOKEN,
	verifyToken: process.env.FB_VERIFY_TOKEN,
	appSecret: process.env.FB_APP_SECRET
});

bot.start(process.env.PORT);

bot.on("message", (payload, chat) => {
	const text = payload.message.text;
	chat.say(`Echo: ${text}`);
});
