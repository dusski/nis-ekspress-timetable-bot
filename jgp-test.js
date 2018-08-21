"use strict";

require("dotenv").load();

const axios = require("axios"),
    moment = require("moment"),
    cheerio = require("cheerio");

(async function () {
    const response = await axios.get(process.env.BASE_CB_URL);

    const $ = cheerio.load(response.data);

    const linijaKod = {}

    $(".row.borderispod > div").map((index, item) => {
        if (index <= 1) return "";
        let linija = "", kod = "";
        if ($(item).hasClass("linija-box")) {
            linija = $(item).first().text().replace(/\t/g, "").replace(/\n/g, "");
            kod = $(item).first().next().find("button").attr("data-target");
        }
        if (linija && kod)
            linijaKod[linija] = kod;
    });

    let dayToday = moment().day() < 5 ? 0 : (moment().day() == 5 ? 1 : 2);

    const tabela = $($(linijaKod["НИШКА БАЊА - МИНОВО НАСЕЉЕ"]).find(".nav-tabs > li")[dayToday]).find("a").attr("href");

    const numberOfHoursToShow = 3;

    const time = $(`${tabela} > table > tbody > tr`).map((index, item) => {
        if (index < 5) console.log($(item).text());
        // console.log($(item).first().text());
        // if($(item).first().text() == 7) {
        //     console.log($(item).text());
        // }
    })

    // console.log(departures);
})();