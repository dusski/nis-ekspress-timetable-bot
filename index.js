"use strict";

require("dotenv").load();

const BootBot = require("bootbot"),
	request = require("request"), // axios (instead of this)
	cheerio = require("cheerio");

const bot = new BootBot({
	accessToken: process.env.FB_ACCESS_TOKEN,
	verifyToken: process.env.FB_VERIFY_TOKEN,
	appSecret: process.env.FB_APP_SECRET
});

bot.start(process.env.PORT);
bot.deleteGetStartedButton();

bot.on("message", (payload, chat, data) => {
	if (!data.captured) {
		chat.say(`Echo: ${payload.message.text}`);
	}
});

// data: https://repl.it/repls/RoundThoughtfulAfricanelephant

bot.hear("/help", (payload, chat) => {
	chat.say(`You can chose one of the following options:
    - D > N (Doljevac > Niš)
    - N > D (Niš > Doljevac)
    - K > N (Kočane R. > Niš)
    - N > K (Niš > Kočane R.)`);
});

bot.hear(["D > N", "D>N", "d > n", "d>n", "dn", "DN"], (payload, chat) => {
	const url =
		"http://195.178.51.120/WebReservations/Home/SearchForJourneys?inNext=1&timeFlagNow=true&tb_calendar=28.01.2018&tb_FromTime=00%3A00&FromPointName=DOLJEVAC&ToPointName=NI%C5%A0&FromPointNameId=3088&ToPointNameId=2710&filterPassengerId=1&RoundtripProcessing=false&ValidityUnlimited=True&Timetable=True";

	request(url, (err, res, html) => {
		if (err) throw err;

		let $ = cheerio.load(html);

		const output = $(".listing-border > tbody")
			.children()
			.map((i, el) => (i < 3 ? el : null))
			.text();

		chat.say(output);
	});
});

bot.hear(
	["N > D", "N>D", "n > d", "n>d", "nd", "ND"],
	async (payload, chat) => {
		const url =
			"http://195.178.51.120/WebReservations/Home/SearchForJourneys?inNext=1&timeFlagNow=true&tb_calendar=28.01.2018&tb_FromTime=00%3A00&FromPointName=NI%C5%A0&ToPointName=DOLJEVAC&FromPointNameId=2710&ToPointNameId=3088&filterPassengerId=1&RoundtripProcessing=false&ValidityUnlimited=True&Timetable=True";

		request(url, (err, res, html) => {
			if (err) throw err;

			let $ = cheerio.load(html);

			const output = $(".listing-border > tbody")
				.children()
				.map((i, el) => (i < 3 ? el : null))
				.text();

			chat.say(output);
		});
	}
);

bot.hear(
	["K > N", "K>N", "k > n", "k>n", "kn", "KN"],
	async (payload, chat) => {
		const url =
			"http://195.178.51.120/WebReservations/Home/SearchForJourneys?inNext=1&timeFlagNow=true&tb_calendar=28.01.2018&tb_FromTime=00%3A00&FromPointName=KO%C4%8CANE+R.&ToPointName=NI%C5%A0&FromPointNameId=5443&ToPointNameId=2710&filterPassengerId=1&RoundtripProcessing=false&ValidityUnlimited=True&Timetable=True";

		request(url, (err, res, html) => {
			if (err) throw err;

			let $ = cheerio.load(html);

			const output = $(".listing-border > tbody")
				.children()
				.map((i, el) => (i < 3 ? el : null))
				.text();

			chat.say(output);
		});
	}
);

bot.hear(
	["N > K", "N>K", "n > k", "n>k", "nk", "NK"],
	async (payload, chat) => {
		const url =
			"http://195.178.51.120/WebReservations/Home/SearchForJourneys?inNext=1&timeFlagNow=true&tb_calendar=28.01.2018&tb_FromTime=00%3A00&FromPointName=NI%C5%A0&ToPointName=KO%C4%8CANE+R.&FromPointNameId=2710&ToPointNameId=5443&filterPassengerId=1&RoundtripProcessing=false&ValidityUnlimited=True&Timetable=True";

		request(url, (err, res, html) => {
			if (err) throw err;

			let $ = cheerio.load(html);

			const output = $(".listing-border > tbody")
				.children()
				.map((i, el) => (i < 3 ? el : null))
				.text();

			chat.say(output);
		});
	}
);
