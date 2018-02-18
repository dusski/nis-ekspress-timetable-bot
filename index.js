"use strict";

require("dotenv").load();

const BootBot = require("bootbot"),
	axios = require("axios"),
	moment = require("moment"),
	cheerio = require("cheerio"),
	latinize = require("latinize"),
	fs = require("fs");

const base_url = "http://195.178.51.120/WebReservations/Home/SearchForJourneys";
const buses = JSON.parse(fs.readFileSync("./data.json", "utf8"));

const getStations = string => {
	const input = string.toLowerCase();
	const input_latinized = latinize(input);
	let matches = buses.filter(station => {
		return station[0].substring(0, input_latinized.length) === input_latinized;
	});

	if (!matches[0]) {
		matches = buses.filter(station => {
			return station[1].substring(0, input.length) === input;
		});
	}

	return matches;
};

const getDepartures = async (
	url,
	departure_station_name,
	departure_station_id,
	arrival_station_name,
	arrival_station_id,
	numberOfBuses
) => {
	console.log(
		`New request: ${departure_station_name} => ${arrival_station_name} - ${numberOfBuses} (time: ${moment().format(
			"HH:mm"
		)})`
	);

	const response = await axios.get(url, {
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

	const $ = cheerio.load(response.data);

	const departures = $(".listing-border > tbody")
		.children()
		.map((i, el) => (i < numberOfBuses ? el : null))
		.map((i, el) => {
			const bus_line = cheerio
				.load(el)(".columnRouteName")
				.text();
			const departure_date_time = cheerio
				.load(el)(".columnDepartureTime")
				.text();
			const arrival_time = cheerio
				.load(el)(".columnPassengerArrivalTime")
				.text();

			return `${bus_line}\nDate: ${
				departure_date_time.split(" ")[0]
			}\nDeparture: ${departure_station_name.toUpperCase()} 🚌 ${
				departure_date_time.split(" ")[1]
			}\nArrival: ${arrival_station_name.toUpperCase()} 🚌 ${arrival_time}\n\n`;
		})
		.get()
		.join("");

	return departures;
};

const bot = new BootBot({
	accessToken: process.env.FB_ACCESS_TOKEN,
	verifyToken: process.env.FB_VERIFY_TOKEN,
	appSecret: process.env.FB_APP_SECRET
});

bot.start(process.env.PORT);

// bot.on("message", (payload, chat, data) => {
// 	if (!data.captured) {
// 		chat.say(`Echo: ${payload.message.text}`);
// 	}
// });

bot.hear("/help", (payload, chat) => {
	chat.say(
		`For getting a bus, just type in the command "!bus" and answer the questions. \nYou can only type one station name at a time.	`
	);
});

bot.hear(/\!bus/gi, (payload, chat) => {
	const sendBusList = async convo => {
		let busList = await getDepartures(
			base_url,
			convo.get("departure_station_name"),
			convo.get("departure_station_id"),
			convo.get("arrival_station_name"),
			convo.get("arrival_station_id"),
			convo.get("number_of_buses")
		);

		convo.say(busList.length ? busList : "No departures for the chosen stations!", { typing: true });
		convo.end();
	};

	const inputNumberOfBuses = convo => {
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
				convo.say("Getting your buses! Please wait...", { typing: true }).then(() => {
					sendBusList(convo);
				});
			}
		);
	};

	const inputToStation = convo => {
		convo.ask(
			"Where are you traveling to?",
			async (payload, convo) => {
				const userInput = payload.message.text.toLowerCase();

				const stationList = getStations(userInput);

				if (!stationList[0]) {
					await convo.say("No such arival station! Please try again.");
					inputToStation(convo);
				} else if (stationList[0][1] === userInput || stationList[0][0] === userInput) {
					convo.set("arrival_station_name", stationList[0][1]);
					convo.set("arrival_station_id", stationList[0][2]);
					convo.say(`Arrival station set to: ${stationList[0][1].toUpperCase()}`).then(() => {
						inputNumberOfBuses(convo);
					});
				} else if (stationList.length > 1) {
					await convo.say(
						`Available stations: \n${stationList
							.map(station => "- " + station[1].toUpperCase() + "\n")
							.join("")} \nPlease type the exact name of the station.`
					);
					inputToStation(convo);
				} else {
					convo.say("Something went wrong. Please try again.");
					inputToStation(convo);
				}
			},
			{ typing: true }
		);
	};

	const inputFromStation = convo => {
		convo.ask(
			"Where are you traveling from?",
			async (payload, convo) => {
				const userInput = payload.message.text.toLowerCase();

				const stationList = getStations(userInput);

				if (!stationList[0]) {
					await convo.say("No such departure station! Please try again.");
					inputFromStation(convo);
				} else if (stationList[0][1] === userInput || stationList[0][0] === userInput) {
					convo.set("departure_station_name", stationList[0][1]);
					convo.set("departure_station_id", stationList[0][2]);
					convo.say(`Departure station set to: ${stationList[0][1].toUpperCase()}`).then(() => {
						inputToStation(convo);
					});
				} else if (stationList.length > 1) {
					convo.say(
						`Available stations: \n${stationList
							.map(station => "- " + station[1].toUpperCase() + "\n")
							.join("")} \nPlease type the exact name of the station.`
					);
					inputFromStation(convo);
				} else {
					convo.say("Something went wrong. Please try again.");
					inputFromStation(convo);
				}
			},
			{ typing: true }
		);
	};

	chat.conversation(convo => {
		inputFromStation(convo);
	});
});
