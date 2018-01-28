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
let json = { title: "", release: "", rating: "" };

// web scraping part
const url = "http://www.imdb.com/title/tt1229340/";
request(url, (err, res, html) => {
	if (err) throw err;

	let $ = cheerio.load(html);

	$(".header").filter(function() {
		let data = $(this);
		json.title = data
			.children()
			.first()
			.text();

		json.release = data
			.children()
			.last()
			.children()
			.text();
	});

	$(".star-box-giga-star").filter(function() {
		var data = $(this);
		json.rating = data.text();
	});
});

// response part
bot.on("message", (payload, chat) => {
	const text = payload.message.text;
	if (text === "/get-movie") {
		chat.say(JSON.stringify(json));
	} else {
		chat.say(`Echo: ${text}`);
	}
});
