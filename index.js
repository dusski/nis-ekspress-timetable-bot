"use strict";

require("dotenv").load();

const BootBot = require("bootbot"),
	request = require("request"),
	cheerio = require("cheerio");

const bot = new BootBot({
	accessToken: process.env.FB_ACCESS_TOKEN,
	verifyToken: process.env.FB_VERIFY_TOKEN,
	appSecret: process.env.FB_APP_SECRET
});

bot.start(process.env.PORT);
let output;

// web scraping part
const url = "http://195.178.51.120/WebReservations/Home/timetable";
request(url, (err, res, html) => {
	if (err) throw err;

	let $ = cheerio.load(html);

	output = JSON.stringify($);
});

// response part
bot.on("message", (payload, chat) => {
	const text = payload.message.text;
	if (text === "/get-movie") {
		chat.say(JSON.stringify(output));
	} else {
		chat.say(`Echo: ${text}`);
	}
});
