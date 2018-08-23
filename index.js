"use strict";

// herkou: https://nis-ekspres-polasci.herokuapp.com/webhook

require("dotenv").load();

const BootBot = require("bootbot"),
	axios = require("axios"),
	moment = require("moment"),
	cheerio = require("cheerio"),
	latinize = require("latinize"),
	fs = require("fs");

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

	const response = await axios.get(process.env.BASE_URL, {
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

			return {
				busLine: bus_line,
				departure: {
					stationName: departure_station_name,
					date: departure_date_time.split(" ")[0],
					time: departure_date_time.split(" ")[1]
				},
				arrival: {
					stationName: arrival_station_name,
					time: arrival_time
				}
			};

			// `${bus_line}\nDate: ${
			// 	departure_date_time.split(" ")[0]
			// }\nDeparture: ${departure_station_name.toUpperCase()} 🚌 ${
			// 	departure_date_time.split(" ")[1]
			// }\nArrival: ${arrival_station_name.toUpperCase()} 🚌 ${arrival_time}\n\n`;
		})
		.get();

	console.log(departures);

	return departures;
};

const bot = new BootBot({
	accessToken: process.env.FB_ACCESS_TOKEN,
	verifyToken: process.env.FB_VERIFY_TOKEN,
	appSecret: process.env.FB_APP_SECRET
});

bot.start(process.env.PORT);

bot.on("message", (payload, chat, data) => {
	if (!data.captured) {
		console.log(payload.message.text);
		chat.say(`Echo: ${payload.message.text}`);
	}
});

bot.hear("/help", (payload, chat) => {
	chat.say(
		`For getting a bus, just type in the command "!bus" and answer the questions. \nYou can only type one station name at a time.	`
	);
});

bot.hear("!bus", (payload, chat) => {
	const sendBusList = async convo => {
		let busList = await getDepartures(
			convo.get("departure_station_name"),
			convo.get("departure_station_id"),
			convo.get("arrival_station_name"),
			convo.get("arrival_station_id"),
			convo.get("number_of_buses")
		);

		if (busList.length == 0) convo.say("No departures for the chosen stations!");

		for (let bus = 0; bus < busList.length; bus += 1) {
			// {
			// 	busLine: bus_line,
			// 	departure: {
			// 		stationName: departure_station_name,
			// 		date: departure_date_time.split(" ")[0],
			// 		time: departure_date_time.split(" ")[1]
			// 	},
			// 	arrival: {
			// 		stationName: arrival_station_name,
			// 		time: arrival_time
			// 	}
			// }

			convo.say(
				`${busList[bus].busLine}\nDate: ${busList[bus].departure.date}\nDeparture: ${busList[
					bus
				].departure.stationName.toUpperCase()} 🚌 ${busList[bus].departure.time}\nArrival: ${busList[
					bus
				].arrival.stationName.toUpperCase()} 🚌 ${busList[bus].arrival.time}\n\n`,
				{
					typing: true
				}
			);
			setTimeout(() => { }, 100);
		}

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

let generateTemplates = () => {

	let templates = [];
  
	const lineNames = {
	  "ЛИНИЈА 1": "НИШКА БАЊА - МИНОВО НАСЕЉЕ",
	  "ЛИНИЈА 1 (p)": "МИНОВО НАСЕЉЕ - НИШКА БАЊА",
	  "ЛИНИЈА 2": "БУБАЊ - ДОЊА ВРЕЖИНА",
	  "ЛИНИЈА 2 (p)": "ДОЊА ВРЕЖИНА - БУБАЊ",
	  "ЛИНИЈА 3": "БРЗИ БРОД - НАС. Р. ЈОВИЋ",
	  "ЛИНИЈА 3 (p)": "НАС. Р. ЈОВИЋ - БРЗИ БРОД",
	  "ЛИНИЈА 4": "ЧАЛИЈЕ - БУБАЊ",
	  "ЛИНИЈА 4 (p)": "БУБАЊ - ЧАЛИЈЕ",
	  "ЛИНИЈА 5": "ЖЕЛ. СТАНИЦА - СОМБОРСКА",
	  "ЛИНИЈА 5 (p)": "СОМБОРСКА - ЖЕЛ. СТАНИЦА",
	  "ЛИНИЈА 6": "ЖЕЛ. СТАНИЦА - ДУВАНИШТЕ – СКОПСКА",
	  "ЛИНИЈА 6 (p)": "ДУВАНИШТЕ – СКОПСКА - ЖЕЛ. СТАНИЦА",
	  "ЛИНИЈА 7": "САРАЈЕВСКА - КАЛАЧ Б.",
	  "ЛИНИЈА 7 (p)": "КАЛАЧ Б. - САРАЈЕВСКА",
	  "ЛИНИЈА 8": "ГАБ. РЕКА (ПАСИ ПОЉАНА) - Н.ГРОБЉЕ",
	  "ЛИНИЈА 8 (p)": "Н.ГРОБЉЕ - ГАБ. РЕКА (ПАСИ ПОЉАНА)",
	  "ЛИНИЈА 9": "МОКРАЊЧЕВА - Б. БЈЕГОВИЋ",
	  "ЛИНИЈА 9 (p)": "Б. БЈЕГОВИЋ - МОКРАЊЧЕВА",
	  "ЛИНИЈА 10": "НАСЕЉЕ „9. мај“ - ЋЕЛЕ КУЛА",
	  "ЛИНИЈА 10 (p)": "ЋЕЛЕ КУЛА - НАСЕЉЕ „9. мај“",
	  "ЛИНИЈА 12": "ДОЊИ КОМРЕН - ЊЕГОШЕВА",
	  "ЛИНИЈА 12 (p)": "ЊЕГОШЕВА - ДОЊИ КОМРЕН",
	  "ЛИНИЈА 13": "ТРГ К. АЛЕКСАНДРА - БУЛ. НЕМАЊИЋА – ДЕЛИЈСКИ ВИС",
	  "ЛИНИЈА 13 (p)": "ДЕЛИЈСКИ ВИС - БУЛ. НЕМАЊИЋА – ТРГ К. АЛЕКСАНДРА",
	  "ЛИНИЈА 34 (КРУЖНА)": "AЕРОДРОМ - А. СТАНИЦА – Ж.СТАНИЦА – AЕРОДРОМ",
	  "ЛИНИЈА 34 (p) (КРУЖНА)": "AЕРОДРОМ - Ж. СТАНИЦА – А.СТАНИЦА – AЕРОДРОМ",
	  "ЛИНИЈА 36": "ТРГ К. АЛЕКСАНДРА - МРАМОР",
	  "ЛИНИЈА 36 (p)": "МРАМОР - ТРГ К. АЛЕКСАНДРА"
	};
  
	let lineNamesArray = Object.keys(lineNames);
  
	for (let index = 0; index < lineNamesArray.length + 1; index += 3) {
	  let line = lineNamesArray[index];
  
	  let template = {
		title: "Linije",
		buttons: []
	  };
  
	  let buttonOne, buttonTwo, buttonThree;
  
	  if (lineNamesArray[index] && lineNames[lineNamesArray[index]]) {
		buttonOne = {
		  type: "postback",
		  title: lineNamesArray[index],
		  payload: lineNames[lineNamesArray[index]]
		};
  
		template.buttons.push(buttonOne);
	  }
  
	  if (lineNamesArray[index + 1] && lineNames[lineNamesArray[index + 1]]) {
		buttonTwo = {
		  type: "postback",
		  title: lineNamesArray[index + 1],
		  payload: lineNames[lineNamesArray[index + 1]]
		};
  
		template.buttons.push(buttonTwo);
	  }
  
	  if (lineNamesArray[index + 2] && lineNames[lineNamesArray[index + 2]]) {
		buttonThree = {
		  type: "postback",
		  title: lineNamesArray[index + 2],
		  payload: lineNames[lineNamesArray[index + 2]]
		};
  
		template.buttons.push(buttonThree);
	  }
  
	  templates.push(template);
	}
  
	return templates;
  
  }

bot.hear("!jgp", (payload, chat) => {

	// TODO: generate templates from lineNames

	chat.sendGenericTemplate(generateTemplates(), { typing: true });
});