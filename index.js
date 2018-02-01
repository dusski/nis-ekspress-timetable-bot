"use strict";

require("dotenv").load();

const BootBot = require("bootbot"),
	request = require("request"),
	axios = require("axios"),
	moment = require("moment"),
	cheerio = require("cheerio");

const base_url = "http://195.178.51.120/WebReservations/Home/SearchForJourneys";

function getBuses(url, fromPointName, toPointName, numberOfBuses) {
	axios
		.get(url, {
			params: {
				inNext: 1,
				timeFlagNow: true,
				tb_calendar: moment().format("DD.MM.YYYY"),
				tb_FromTime: moment().format("HH:mm"),
				FromPointName: fromPointName.toUpperCase(),
				ToPointName: toPointName.toUpperCase(),
				FromPointNameId: 3088,
				ToPointNameId: 2710,
				filterPassengerId: 1,
				RoundtripProcessing: false,
				ValidityUnlimited: true,
				Timetable: true
			}
		})
		.then(response => {
			let $ = cheerio.load(response.data);

			return $(".listing-border > tbody")
				.children()
				.map(
					(i, el) =>
						i < (numberOfBuses ? numberOfBuses : 3) ? el : null
				)
				.text();
		})
		.catch(error => {
			if (error) console.error("Error with the response", error);
		});
}

const bot = new BootBot({
	accessToken: process.env.FB_ACCESS_TOKEN,
	verifyToken: process.env.FB_VERIFY_TOKEN,
	appSecret: process.env.FB_APP_SECRET
});

bot.start(process.env.PORT);
bot.deleteGetStartedButton();

bot.on("message", (payload, chat, data) => {
	// if ((payload.message.text = "/bus")) {
	// 	chat.say("Getting your buses!");
	// } else
	if (!data.captured) {
		chat.say(`Echo: ${payload.message.text}`);
	}
});

// data: https://repl.it/repls/RoundThoughtfulAfricanelephant

bot.hear("/help", (payload, chat) => {
	chat.say(`You can type in any dual combination of the letters K, N and D to get the first 3 buses for that line. If your command is followed by a number, it will display that number of buses. (max number is 10)
	For example:
	Dn 5 - gets 5 buses from Doljevac to Niš
	nK 10 - gets 10 buses from Kočane to Niš
	ND - gets default number of buses (3) from Niš to Doljevac`);
});

bot.hear("/bus", (payload, chat) => {
	// setting up /bus command
});

bot.hear(/([Dd]\s*>*\s*[Nn]\s*\d*)(?![A-Za-z])/g, async (payload, chat) => {
	let numberOfBuses = parseInt(payload.message.text.slice(-2));

	chat.say(await getBuses(base_url, "Doljevac", "Niš", numberOfBuses));
});

bot.hear(/([Nn]\s*>*\s*[Dd]\s*\d*)(?![A-Za-z])/g, async (payload, chat) => {
	const url =
		"http://195.178.51.120/WebReservations/Home/SearchForJourneys?inNext=1&timeFlagNow=true&tb_calendar=28.01.2018&tb_FromTime=00%3A00&FromPointName=NI%C5%A0&ToPointName=DOLJEVAC&FromPointNameId=2710&ToPointNameId=3088&filterPassengerId=1&RoundtripProcessing=false&ValidityUnlimited=True&Timetable=True";

	let numberOfBuses = parseInt(payload.message.text.slice(-2));

	request(url, (err, res, html) => {
		if (err) throw err;

		let $ = cheerio.load(html);

		const output = $(".listing-border > tbody")
			.children()
			.map(
				(i, el) => (i < (numberOfBuses ? numberOfBuses : 3) ? el : null)
			)
			.text();

		chat.say(output);
	});
});

bot.hear(/([Kk]\s*>*\s*[Nn]\s*\d*)(?![A-Za-z])/g, async (payload, chat) => {
	const url =
		"http://195.178.51.120/WebReservations/Home/SearchForJourneys?inNext=1&timeFlagNow=true&tb_calendar=28.01.2018&tb_FromTime=00%3A00&FromPointName=KO%C4%8CANE+R.&ToPointName=NI%C5%A0&FromPointNameId=5443&ToPointNameId=2710&filterPassengerId=1&RoundtripProcessing=false&ValidityUnlimited=True&Timetable=True";

	let numberOfBuses = parseInt(payload.message.text.slice(-2));

	request(url, (err, res, html) => {
		if (err) throw err;

		let $ = cheerio.load(html);

		const output = $(".listing-border > tbody")
			.children()
			.map(
				(i, el) => (i < (numberOfBuses ? numberOfBuses : 3) ? el : null)
			)
			.text();

		chat.say(output);
	});
});

bot.hear(/([Nn]\s*>*\s*[Kk]\s*\d*)(?![A-Za-z])/g, async (payload, chat) => {
	const url =
		"http://195.178.51.120/WebReservations/Home/SearchForJourneys?inNext=1&timeFlagNow=true&tb_calendar=28.01.2018&tb_FromTime=00%3A00&FromPointName=NI%C5%A0&ToPointName=KO%C4%8CANE+R.&FromPointNameId=2710&ToPointNameId=5443&filterPassengerId=1&RoundtripProcessing=false&ValidityUnlimited=True&Timetable=True";

	let numberOfBuses = parseInt(payload.message.text.slice(-2));

	request(url, (err, res, html) => {
		if (err) throw err;

		let $ = cheerio.load(html);

		const output = $(".listing-border > tbody")
			.children()
			.map(
				(i, el) => (i < (numberOfBuses ? numberOfBuses : 3) ? el : null)
			)
			.text();

		chat.say(output);
	});
});
