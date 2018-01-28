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
const D_to_N =
		"http://195.178.51.120/WebReservations/Home/SearchForJourneys?inNext=1&timeFlagNow=true&tb_calendar=28.01.2018&tb_FromTime=00%3A00&FromPointName=DOLJEVAC&ToPointName=NI%C5%A0&FromPointNameId=3088&ToPointNameId=2710&filterPassengerId=1&RoundtripProcessing=false&ValidityUnlimited=True&Timetable=True",
	N_to_D =
		"http://195.178.51.120/WebReservations/Home/SearchForJourneys?inNext=1&timeFlagNow=true&tb_calendar=28.01.2018&tb_FromTime=00%3A00&FromPointName=NI%C5%A0&ToPointName=DOLJEVAC&FromPointNameId=2710&ToPointNameId=3088&filterPassengerId=1&RoundtripProcessing=false&ValidityUnlimited=True&Timetable=True",
	K_to_N =
		"http://195.178.51.120/WebReservations/Home/SearchForJourneys?inNext=1&timeFlagNow=true&tb_calendar=28.01.2018&tb_FromTime=00%3A00&FromPointName=KO%C4%8CANE+R.&ToPointName=NI%C5%A0&FromPointNameId=5443&ToPointNameId=2710&filterPassengerId=1&RoundtripProcessing=false&ValidityUnlimited=True&Timetable=True",
	N_to_K =
		"http://195.178.51.120/WebReservations/Home/SearchForJourneys?inNext=1&timeFlagNow=true&tb_calendar=28.01.2018&tb_FromTime=00%3A00&FromPointName=NI%C5%A0&ToPointName=KO%C4%8CANE+R.&FromPointNameId=2710&ToPointNameId=5443&filterPassengerId=1&RoundtripProcessing=false&ValidityUnlimited=True&Timetable=True";

let getBusses = url => {
	request(url, async (err, res, html) => {
		if (err) throw err;

		let $ = cheerio.load(html);

		return await $(".listing-border > tbody")
			.children()
			.text()
			.trim();
	});
};

// response part
bot.on("message", (payload, chat) => {
	chat.say(`Echo: ${text}`);
});

bot.setPersistentMenu([
	"Doljevac > Niš",
	"Niš > Doljevac",
	"Kočane R. > Niš",
	"Niš > Kočane R."
]);
