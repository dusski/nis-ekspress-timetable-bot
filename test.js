"use strict";

const axios = require("axios"),
	cheerio = require("cheerio");

(async function() {
	let response = await axios.get(
		"http://195.178.51.120/WebReservations/Home/SearchForJourneys",
		{
			params: {
				inNext: 1,
				timeFlagNow: true,
				// tb_calendar: moment().format("DD.MM.YYYY"),
				// tb_FromTime: moment().format("HH:mm"),
				// FromPointName: fromPointName.toUpperCase(),
				// ToPointName: toPointName.toUpperCase(),
				FromPointNameId: 3088,
				ToPointNameId: 2710,
				// filterPassengerId: 1,
				// RoundtripProcessing: false,
				// ValidityUnlimited: true,
				Timetable: true
			}
		}
	);

	let $ = cheerio.load(response.data);

	let output = $(".listing-border > tbody")
		.children()
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

			return `LINE: ${bus_line}
DATE: ${departure_date_time.split(" ")[0]}
🚌 ${departure_date_time.split(" ")[0]}
${arrival_time}

`;
		})
		.get();

	console.log(output);
	// let bus_line = $(".columnRouteName").text();
	// let departure_time = $(".columnDepartureTime").text();
	// let arrival_time = $(".columnPassengerArrivalTime").text();

	// .map((i, el) => (i < busNumber ? el : null))
	// .map((index, element) => {});
	// .text();

	// console.log(busList);
})();
