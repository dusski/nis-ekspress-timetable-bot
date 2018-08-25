"use strict";

require("dotenv").load();

const axios = require("axios"),
    moment = require("moment"),
    cheerio = require("cheerio"),
    fs = require("fs");
const jgpData = JSON.parse(fs.readFileSync("./jgp-data.json", "utf8"));

module.exports = async function jgpLines(userInput) {

    if (!userInput) return "Wrong input, try again!";

    let me = {
        buslineCode: {},
        dayToday: moment().day() == 0 ? 2 : (moment().day() == 6 ? 1 : 0),
        busTimetable: "",
        numberOfHoursToShow: 5,
        currentTime: moment().hours(),
        result: [],
        counter: 0
    }

    $ = cheerio.load(await axios.get(process.env.BASE_CB_URL));

    $(".row.borderispod > div").map((index, item) => {
        if (index <= 1) return "";
        let busline = "", code = "";
        if ($(item).hasClass("linija-box")) {
            busline = $(item).first().text().replace(/\t/g, "").replace(/\n/g, "");
            code = $(item).first().next().find("button").attr("data-target");
        }
        if (busline && code)
            me.buslineCode[busline] = code;
    });

    me.busTimetable = $($(me.buslineCode[jgpData[userInput]])
        .find(".nav-tabs > li")[dayToday])
        .find("a").attr("href");

    $(`${me.busTimetable} > table > tbody > tr`).map((index, item) => {
        if (index < 1) return "";

        let hour = $(item).children().first().text();
        let minutes = $($(item).children()[1]).text();

        if (me.currentTime < 4) {
            if (index < 5) {
                me.result.push(`${hour} | ${minutes}`);
            }
            if (index > 19) {
                me.result.splice(me.counter, 0, `${hour} | ${minutes}`);
                me.counter++;
            }
        } else {
            if ((index + 3) >= currentTime && (index + 3) < (currentTime + numberOfHoursToShow)) {
                me.result.push(`${hour} | ${minutes}`);
            }
        }

    });

    return me.result.join("\n");

}

// (async function (userInput = "ЛИНИЈА 1") {

//     const response = await axios.get(process.env.BASE_CB_URL);

//     const $ = cheerio.load(response.data);

//     const buslineCode = {}

//     $(".row.borderispod > div").map((index, item) => {
//         if (index <= 1) return "";
//         let busline = "", code = "";
//         if ($(item).hasClass("linija-box")) {
//             busline = $(item).first().text().replace(/\t/g, "").replace(/\n/g, "");
//             code = $(item).first().next().find("button").attr("data-target");
//         }
//         if (busline && code)
//             buslineCode[busline] = code;
//     });

//     let dayToday = moment().day() == 0 ? 2 : (moment().day() == 6 ? 1 : 0);

//     const busTimetable = $($(buslineCode[jgpData[userInput]])
//         .find(".nav-tabs > li")[dayToday])
//         .find("a").attr("href");

//     const numberOfHoursToShow = 5;

//     const currentTime = moment().hours();

//     let result = [], counter = 0;

//     $(`${busTimetable} > table > tbody > tr`).map((index, item) => {
//         if (index < 1) return "";

//         let hour = $(item).children().first().text();
//         let minutes = $($(item).children()[1]).text();

//         if (currentTime < 4) {
//             if (index < 5) {
//                 result.push(`${hour} | ${minutes}`);
//             }
//             if (index > 19) {
//                 result.splice(counter, 0, `${hour} | ${minutes}`);
//                 counter++;
//             }
//         } else {
//             if ((index + 3) >= currentTime && (index + 3) < (currentTime + numberOfHoursToShow)) {
//                 result.push(`${hour} | ${minutes}`);
//             }
//         }

//     });

//     console.log(result.join("\n"));
// })();