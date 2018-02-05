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
		ž: "z",
		а: "a",
		б: "b",
		в: "v",
		г: "g",
		д: "d",
		ђ: "d",
		е: "e",
		ж: "z",
		з: "z",
		и: "i",
		ј: "j",
		к: "k",
		л: "l",
		љ: "lj",
		м: "m",
		н: "n",
		њ: "nj",
		о: "o",
		п: "p",
		р: "r",
		с: "s",
		т: "t",
		ћ: "t",
		у: "u",
		ф: "f",
		х: "h",
		ц: "c",
		ч: "c",
		џ: "dz",
		ш: "s"
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

function getStations(userInput) {
	// working with an array of station names that have latinized form [ [ "nis", "niš", 3667 ] ]
	const userInputStationLatinized = latinize(userInput);
	let matches = buses.map(station => {
		return station[0].substring(0, userInputStationLatinized.length) === userInputStationLatinized;
	});

	return matches;
}

async function getBuses(url, fromPointNameId, toPointNameId, numberOfBuses) {
	const numberOfBuses = numberOfBuses ? (numberOfBuses > 9 ? 10 : numberOfBuses) : 3;

	console.log(
		`New request: ${fromPointNameId} => ${toPointNameId} - ${numberOfBuses} (time: ${moment().format("HH:mm")})`
	);
	let response = await axios.get(url, {
		params: {
			inNext: 1,
			timeFlagNow: true,
			// tb_calendar: moment().format("DD.MM.YYYY"),
			// tb_FromTime: moment().format("HH:mm"),
			// FromPointName: fromPointName.toUpperCase(),
			// ToPointName: toPointName.toUpperCase(),
			FromPointNameId: fromPointNameId,
			ToPointNameId: toPointNameId,
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
Departure: ${fromPointNameId.toUpperCase()} 🚌 ${departure_date_time.split(" ")[1]}
Arival: ${arrival_time} 🚌 ${toPointNameId.toUpperCase()}

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

bot.on("message", (payload, chat, data) => {
	if (!data.captured) {
		//		chat.say(`Echo: ${payload.message.text}`);
	}
});

bot.hear("/help", (payload, chat) => {
	chat.say(
		`For getting a bus, just type in the command "!bus" and answer the questions.
You can only type one station name at a time.
You sould also use full station names with extended Latin characters (š, ć, đ...).`
	);
});

// TODO: Implement error handling

bot.hear(/\!bus/gi, (payload, chat) => {
	const sendBusList = async convo => {
		convo.say(
			await getBuses(
				base_url,
				convo.get("departure_station_id"),
				convo.get("arrival_station_id"),
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
			const userInput = payload.message.text;
			const stationList = getStations(userInput);
			// TODO: instead of checking busses
			// create a separate function that returns station name or an array of station names or empty array
			if (stationList.length > 1) {
				let buttonList = stationList.map(station => {
					return { type: "postback", title: station[2], postback: station[2] };
				});
				convo.ask({
					text: "Which station did you mean?",
					buttons: buttonList
				});
			} else if (stationList.length == 1) {
				convo.set("arrival_station_id", stationList[0][3]);
				convo.say(`Arrival station set to: ${stationList[0][2].toUpperCase()}`).then(() => {
					getNumberOfBuses(convo);
				});
			} else {
				await convo.say("No such arival station! Please try again.");
				getToStation(convo);
			}
		});
	};

	const getFromStation = convo => {
		convo.ask("Where are you traveling from?", async (payload, convo) => {
			const userInput = payload.message.text;
			const stationList = getStations(userInput);
			console.log(stationList);
			// TODO: instead of checking busses
			// create a separate function that returns station name or an array of station names or empty array
			if (stationList.length > 1) {
				let buttonList = stationList.map(station => {
					return { type: "postback", title: station[2], postback: station[2] };
				});
				convo.ask({
					text: "Which station did you mean?",
					buttons: buttonList
				});
			} else if (stationList.length == 1) {
				convo.set("departure_station_id", stationList[0][3]);
				convo.say(`Departure station set to: ${stationList[0][2].toUpperCase()}`).then(() => {
					getToStation(convo);
				});
			} else {
				await convo.say("No such departure station! Please try again.");
				getFromStation(convo);
			}
		});
	};

	chat.conversation(convo => {
		getFromStation(convo);
	});
});

bot.on("postback:ARRIVAL", (chat, payload) => {
	console.log("arrival data received!");
});

bot.on("postback:DEPARTURE", (chat, payload) => {
	console.log("departure data received");
});

// bot.hear("*!test!*", (payload, chat) => {
// 	chat.sendTemplate({

// 	}, );
// })
