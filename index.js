"use strict";

require("dotenv").load();

const BootBot = require("bootbot"),
	axios = require("axios"),
	moment = require("moment"),
	cheerio = require("cheerio"),
	fs = require("fs");

const base_url = "http://195.178.51.120/WebReservations/Home/SearchForJourneys";
const buses = JSON.parse(fs.readFileSync("./data.json", "utf8"));

async function getBuses(url, fromPointName, toPointName, numberOfBuses) {
	if (!buses[fromPointName.toLowerCase()]) return "No such departure station!";
	if (!buses[toPointName.toLowerCase()]) return "No such arival station!";

	const busNumber = numberOfBuses ? (numberOfBuses > 9 ? 10 : numberOfBuses) : 3;

	console.log(
		`New request: ${fromPointName} => ${toPointName} - ${numberOfBuses} (time: ${moment().format("HH:mm")})`
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
		.map((i, el) => (i < busNumber ? el : null))
		.map((i, el) => {
			let bus_line = cheerio
				.load(el)(".columnRouteName")
				.text();
			let departure_date_time = cheerio
				.load(el)(".columnDepartureTime")
				.text();
			let arrival_time = cheerio
				.load(el)(".columnPassengerArrivalTime")
				.text();

			return {
				title: bus_line,
				subtitle: `Date: ${departure_date_time.split(" ")[0]}

Departure: ${fromPointName.toUpperCase()} 🚌 ${departure_date_time.split(" ")[1]}
Arival: ${arrival_time} 🚌 ${toPointName.toUpperCase()}

`
			};
		})
		.get();

	return { cards: output };
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
		//		chat.say(`Echo: ${payload.message.text}`);
	}
});

bot.hear("/help", (payload, chat) => {
	chat.say(
		`For getting a bus, just type in the command "!bus" and answer the questions.
You can only type one station name at a time.
You should also use full station names with extended Latin characters (š, ć, đ...).`
	);
});

// TODO: Implement error handling

bot.hear(/\!bus/gi, (payload, chat) => {
	const sendBusList = async convo => {
		convo.say(
			await getBuses(
				base_url,
				convo.get("departure_station"),
				convo.get("arrival_station"),
				convo.get("number_of_buses")
			)
		);
		convo.end();
	};

	const getNumberOfBuses = convo => {
		convo.ask(
			{
				text: "How many departures from now would you like to see?",
				quickReplies: ["1", "5", "10", "Skip"]
			},
			(payload, convo) => {
				const reply = payload.message.text;
				const number_of_buses = reply !== "Skip" ? parseInt(reply) : false;
				convo.set("number_of_buses", number_of_buses);
				convo.say("Getting your buses!", { typing: true }).then(() => {
					sendBusList(convo);
				});
			}
		);
	};

	const getToStation = convo => {
		convo.ask("And where are you traveling to?", async (payload, convo) => {
			const reply = payload.message.text;
			if (!buses[reply.toLowerCase()]) {
				await convo.say("No such arival station! Please try again.");
				getToStation(convo);
			} else {
				convo.set("arrival_station", reply);
				convo.say(`Arrival station set to: ${reply}`).then(() => {
					getNumberOfBuses(convo);
				});
			}
		});
	};

	const getFromStation = convo => {
		convo.ask("Where are you traveling from?", async (payload, convo) => {
			const reply = payload.message.text;
			if (!buses[reply.toLowerCase()]) {
				await convo.say("No such departure station! Please try again.");
				getFromStation(convo);
			} else {
				convo.set("departure_station", reply);
				convo.say(`Departure station set to: ${reply}`).then(() => {
					getToStation(convo);
				});
			}
		});
	};

	chat.conversation(convo => {
		getFromStation(convo);
	});
});

// bot.hear("*!test!*", (payload, chat) => {
// 	chat.sendTemplate({

// 	}, );
// })
