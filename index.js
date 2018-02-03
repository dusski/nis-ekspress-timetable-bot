"use strict";

require("dotenv").load();

const BootBot = require("bootbot"),
	request = require("request"),
	axios = require("axios"),
	moment = require("moment"),
	cheerio = require("cheerio"),
	fs = require("fs");

const base_url = "http://195.178.51.120/WebReservations/Home/SearchForJourneys";
const buses = JSON.parse(fs.readFileSync("./data.json", "utf8"));

async function getBuses(url, fromPointName, toPointName, numberOfBuses) {
	if (!buses[fromPointName.toLowerCase()])
		return "No such departure station!";
	if (!buses[toPointName.toLowerCase()]) return "No such arival station!";

	console.log(
		`New request: ${fromPointName} => ${toPointName} - ${numberOfBuses} (time: ${moment().format(
			"HH:mm"
		)})`
	);
	let response = await axios.get(url, {
		params: {
			inNext: 1,
			timeFlagNow: true,
			// tb_calendar: moment().format("DD.MM.YYYY"),
			// tb_FromTime: moment().format("HH:mm"),
			// FromPointName: fromPointName.toUpperCase(),
			// ToPointName: toPointName.toUpperCase(),
			FromPointNameId: buses[fromPointName.toLowerCase()],
			ToPointNameId: buses[toPointName.toLowerCase()],
			// filterPassengerId: 1,
			// RoundtripProcessing: false,
			// ValidityUnlimited: true,
			Timetable: true
		}
	});

	let $ = cheerio.load(response.data);

	let output = $(".listing-border > tbody")
		.children()
		.map((i, el) => (i < (numberOfBuses ? numberOfBuses : 3) ? el : null))
		.text();

	return output;
}

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
// hadling buses: https://www.npmjs.com/package/unicode-escape

bot.hear("/help", (payload, chat) => {
	chat.say(`To get a list of buses, you can type the command "!bus" followed by any two station names in the following format:

	!bus departure_station arrival_station number_of_buses
	
	You must type in the correct and exact station name (currently only one word station name will work)
	You don't need to provide the number of buses, the default number to be displayed is 3.`);
});

bot.hear("!bus", async (payload, chat) => {
	// setting up /bus command
	const busRequest = payload.message.text.split(" ").slice(1);
	const numberOfBuses =
		busRequest.length > 2 ? parseInt(busRequest[2]) : false;

	chat.say(
		await getBuses(base_url, busRequest[0], busRequest[1], numberOfBuses)
	);
});

// bot.hear(/([Dd]\s*>*\s*[Nn]\s*\d*)(?![A-Za-z])/g, async (payload, chat) => {
// 	let numberOfBuses = parseInt(payload.message.text.slice(-2));

// 	chat.say(await getBuses(base_url, "Doljevac", "Niš", numberOfBuses));
// });

// bot.hear(/([Nn]\s*>*\s*[Dd]\s*\d*)(?![A-Za-z])/g, async (payload, chat) => {
// 	let numberOfBuses = parseInt(payload.message.text.slice(-2));

// 	chat.say(await getBuses(base_url, "Niš", "Doljevac", numberOfBuses));
// });

// bot.hear(/([Kk]\s*>*\s*[Nn]\s*\d*)(?![A-Za-z])/g, async (payload, chat) => {
// 	let numberOfBuses = parseInt(payload.message.text.slice(-2));

// 	chat.say(await getBuses(base_url, "Kočane", "Niš", numberOfBuses));
// });

// bot.hear(/([Nn]\s*>*\s*[Kk]\s*\d*)(?![A-Za-z])/g, async (payload, chat) => {
// 	let numberOfBuses = parseInt(payload.message.text.slice(-2));

// 	chat.say(await getBuses(base_url, "Niš", "Kočane", numberOfBuses));
// });
