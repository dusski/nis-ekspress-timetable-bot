"use strict";

require("dotenv").load();

const BootBot = require("bootbot"),
	axios = require("axios"),
	moment = require("moment"),
	cheerio = require("cheerio"),
	fs = require("fs");

// TODO: Implement latinize to find similar buses from the list and then display them for the user
// https://stackoverflow.com/questions/5440275/search-an-array-return-partial-matches

const base_url = "http://195.178.51.120/WebReservations/Home/SearchForJourneys";
const buses = JSON.parse(fs.readFileSync("./data.json", "utf8"));

let latinize = string => {
	const latinizer = {
		š: "s",
		đ: "d",
		č: "c",
		ć: "t",
		ž: "z"
	};

	return string
		.toLowerCase()
		.split("")
		.map(letter => {
			if (latinizer[letter]) {
				return latinizer[letter];
			} else {
				return letter;
			}
		})
		.join("");
};

function getStations(string) {
	// working with an array of station names that have latinized form [ [ "nis", "niš", 3667 ] ]
	string = string.toLowerCase();
	const string_latinized = latinize(string.toLowerCase());
	let matches = buses.filter(station => {
		return station[0].substring(0, string_latinized.length) === string_latinized;
	});

	if (!matches[0]) {
		matches = buses.filter(station => {
			return station[1].substring(0, string.length) === string;
		});
	}

	return matches;
}

async function getBuses(
	url,
	departure_station_name,
	departure_station_id,
	arrival_station_name,
	arrival_station_id,
	numberOfBuses
) {
	console.log(
		`New request: ${departure_station_name} => ${arrival_station_name} - ${numberOfBuses} (time: ${moment().format(
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
			FromPointNameId: departure_station_id,
			ToPointNameId: arrival_station_id,
			// filterPassengerId: 1,
			// RoundtripProcessing: false,
			// ValidityUnlimited: true,
			Timetable: true
		}
	});

	let $ = cheerio.load(response.data);

	let output = $(".listing-border > tbody")
		.children()
		.map((i, el) => (i < numberOfBuses ? el : null))
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
Departure: ${departure_station_name.toUpperCase()} 🚌 ${departure_date_time.split(" ")[1]}
Arival: ${arrival_time} 🚌 ${arrival_station_name.toUpperCase()}

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
You can only type one station name at a time.	`
	);
});

// TODO: Implement error handling

bot.hear(/\!bus/gi, (payload, chat) => {
	const sendBusList = async convo => {
		convo.say(
			await getBuses(
				base_url,
				convo.get("departure_station_name"),
				convo.get("departure_station_id"),
				convo.get("arrival_station_name"),
				convo.get("arrival_station_id"),
				convo.get("number_of_buses")
			),
			{ typing: true }
		);
		convo.end();
	};

	const getNumberOfBuses = convo => {
		convo.ask(
			{
				text: "How many departures from now would you like to see?",
				quickReplies: ["1", "3", "5", "10"],
				typing: true
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
		convo.ask(
			"And where are you traveling to?",
			async (payload, convo) => {
				const userInput = payload.message.text;

				let stationList = getStations(userInput);

				if (!stationList[0]) {
					await convo.say("No such arival station! Please try again.");
					getToStation(convo);
				} else {
					convo.set("arrival_station_name", stationList[0][1]);
					convo.set("arrival_station_id", stationList[0][2]);
					convo.say(`Arrival station set to: ${stationList[0][1].toUpperCase()}`).then(() => {
						getNumberOfBuses(convo);
					});
				}
			},
			{ typing: true }
		);
	};

	const getFromStation = convo => {
		convo.ask(
			"Where are you traveling from?",
			async (payload, convo) => {
				const userInput = payload.message.text;

				let stationList = getStations(userInput);

				if (!stationList[0]) {
					await convo.say("No such departure station! Please try again.");
					getFromStation(convo);
				} else if (stationList > 1) {
					convo.say({
						text: `Which station did you mean?
Available stations:
${stationList.map(station => "-" + station[1] + "\n")}
Please try again.`
					});
					getFromStation(convo);
				} else {
					convo.set("departure_station_name", stationList[0][1]);
					convo.set("departure_station_id", stationList[0][2]);
					convo.say(`Departure station set to: ${stationList[0][1].toUpperCase()}`).then(() => {
						getToStation(convo);
					});
				}
			},
			{ typing: true }
		);
	};

	chat.conversation(convo => {
		getFromStation(convo);
	});
});

// bot.hear("*!test!*", (payload, chat) => {
// 	chat.sendTemplate({

// 	}, );
// })
