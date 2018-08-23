"use strict";

require("dotenv").load();

const axios = require("axios"),
    moment = require("moment"),
    cheerio = require("cheerio");

(async function () {

    

    const response = await axios.get(process.env.BASE_CB_URL);

    const $ = cheerio.load(response.data);

    const buslineCode = {}

    $(".row.borderispod > div").map((index, item) => {
        if (index <= 1) return "";
        let busline = "", code = "";
        if ($(item).hasClass("linija-box")) {
            busline = $(item).first().text().replace(/\t/g, "").replace(/\n/g, "");
            code = $(item).first().next().find("button").attr("data-target");
        }
        if (busline && code)
            buslineCode[busline] = code;
    });

    let dayToday = moment().day() < 5 ? 0 : (moment().day() == 5 ? 1 : 2);
    
    console.log("MOMENT DAY: " + moment().day() + "| DAY TODAY: " + dayToday);

    const busTimetable = $($(buslineCode["НИШКА БАЊА - МИНОВО НАСЕЉЕ"]).find(".nav-tabs > li")[dayToday]).find("a").attr("href");

    const numberOfHoursToShow = 5;

    const currentTime = moment().hours();
    console.log("currentTime", currentTime);


    console.log("LENGTH OF TABLE: ", $(`${busTimetable} > table > tbody > tr`).length - 1);

    let result = [], counter = 0;

    const time = $(`${busTimetable} > table > tbody > tr`).map((index, item) => {
        if (index < 1) return "";

        let line = $(item).text().replace(/\t/g, "").replace(/\n/g, "");

        if (currentTime > 23) {

            if (index < 5) {
                result.push((line.slice(0, 2) + " | " + line.slice(2, line.length)));
            }

            if (index > 20) {
                result.splice(counter, 0, (line.slice(0, 2) + " | " + line.slice(2, line.length)));
                counter++;
            }
        } else {
            if ((index + 3) >= currentTime && (index + 3) < (currentTime + numberOfHoursToShow)) {
                result.push((line.slice(0, 2) + " | " + line.slice(2, line.length)));
            }
        }

    });

    console.log(result.join("\n"));
})();