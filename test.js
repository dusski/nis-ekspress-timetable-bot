"use strict";

const axios = require("axios"),
	cheerio = require("cheerio"),
	fs = require("fs");

const buses = JSON.parse(fs.readFileSync("./data.json", "utf8"));

let latinize = string => {
	const latinizer = {
		š: "sh",
		đ: "dj",
		č: "ch",
		ć: "tj",
		ž: "zh",
		а: "a",
		б: "b",
		в: "v",
		г: "g",
		д: "d",
		ђ: "dj",
		е: "e",
		ж: "zh",
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
		ћ: "tj",
		у: "u",
		ф: "f",
		х: "h",
		ц: "c",
		ч: "ch",
		џ: "dz",
		ш: "sh"
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

(async function() {
	let station_names = Object.keys(buses);

	let latinized_station_names = station_names.map(station_name => {
		return latinize(station_name);
	});

	// console.log(latinized_station_names);

	let station_ids = Object.values(buses);

	let data = {};

	for (let i = 0; i < latinized_station_names.length; i += 1) {
		data[latinized_station_names[i]] = station_ids[i];
	}

	fs.writeFile("data2.json", JSON.stringify(data), "utf8", err => {
		if (err) throw err;
		console.log("success");
	});
	// console.log(data);

	// 	let response = await axios.get("http://195.178.51.120/WebReservations/Home/SearchForJourneys", {
	// 		params: {
	// 			inNext: 1,
	// 			timeFlagNow: true,
	// 			// tb_calendar: moment().format("DD.MM.YYYY"),
	// 			// tb_FromTime: moment().format("HH:mm"),
	// 			// FromPointName: fromPointName.toUpperCase(),
	// 			// ToPointName: toPointName.toUpperCase(),
	// 			FromPointNameId: 3088,
	// 			ToPointNameId: 2710,
	// 			// filterPassengerId: 1,
	// 			// RoundtripProcessing: false,
	// 			// ValidityUnlimited: true,
	// 			Timetable: true
	// 		}
	// 	});

	// 	let $ = cheerio.load(response.data);

	// 	let output = $(".listing-border > tbody")
	// 		.children()
	// 		.map((i, el) => {
	// 			let bus_line = cheerio
	// 				.load(el)(".columnRouteName")
	// 				.text();
	// 			let departure_date_time = cheerio
	// 				.load(el)(".columnDepartureTime")
	// 				.text();
	// 			let arrival_time = cheerio
	// 				.load(el)(".columnPassengerArrivalTime")
	// 				.text();

	// 			return `LINE: ${bus_line}
	// DATE: ${departure_date_time.split(" ")[0]}
	// 🚌 ${departure_date_time.split(" ")[0]}
	// ${arrival_time}

	// `;
	// 		})
	// 		.get();

	// 	console.log(output);
	// let bus_line = $(".columnRouteName").text();
	// let departure_time = $(".columnDepartureTime").text();
	// let arrival_time = $(".columnPassengerArrivalTime").text();

	// .map((i, el) => (i < busNumber ? el : null))
	// .map((index, element) => {});
	// .text();

	// console.log(busList);
})();
