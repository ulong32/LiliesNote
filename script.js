const version = "v5.0.0 Matsuri";

const icsHeader = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LuciaDB/ulong32//NONSGML LiliesNote ${version}//JA
CALSCALE:GREGORIAN`;

let isFirstOpenGardenFilter = true;

let numGardens = {};

let lang = "ja";

const license = {
    "ja": "このデータはLuciaDBから取得しています。ライセンスはCC BY-NC-SA 4.0です。",
    "en": "This data is sourced from LuciaDB, licensed under CC BY-NC-SA 4.0.",
};

const messageQueryLoaded = {
    "ja": "データロード完了。",
    "en": "Data loaded."
};

const messageQueryEmpty = {
    "ja": "エラー:応答が空です。",
    "en": "Error: Result is empty."
};

const messageQueryError = {
    "ja": "問い合わせ失敗。(エラー:",
    "en": "Query failed. (Error:"
};

function formatDate(...args) {
    let str = "";
    for (let i = 0; i < args.length; i++) {
        str += args[i].toString().padStart(2, "0");
    };
    return str;
}

function convert2Ordinal(number) {
    if (number / 10 === 1) return number.toString() + "th";
    switch (number % 10) {
        case 1:
            return number.toString() + "st";
        case 2:
            return number.toString() + "nd";
        case 3:
            return number.toString() + "rd";
        default:
            return number.toString() + "th";
    }
}

function applyTranslates(lang) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "./language.json");
    xhr.onload = function () {
        if (xhr.status == 200) {
            const json = JSON.parse(xhr.responseText);
            const keys = Object.keys(json);
            keys.forEach(key => {
                document.getElementById(key).innerHTML = json[key][lang];
            });
            xhr.abort();
        }
    };
    xhr.send();
}

let isFirstGetLilyData = true;

let lilyData;

function getLilyData() {

    if(isFirstGetLilyData === false) return lilyData;
    const xhr = new XMLHttpRequest();
    let resultArea = document.getElementById("result");
    let startTime;
    const query = `PREFIX schema: <http://schema.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX lily: <https://luciadb.assaultlily.com/rdf/IRIs/lily_schema.ttl#>
SELECT ?name ?birthdate ?lgname ?lily ?type ?garden
WHERE {
    VALUES ?class { lily:Lily lily:Teacher lily:Madec lily:Character }
    ?lily a ?class;
          rdf:type ?type;
          schema:name ?name;
          schema:birthDate ?birthdate.
    FILTER(lang(?name)="${lang}")
    OPTIONAL{
        ?lily lily:legion/schema:name ?lgname.
        FILTER(lang(?lgname)="${lang}")
    }
    OPTIONAL{?lily lily:garden ?garden.}
}
ORDER BY ?birthdate`;
    xhr.open("POST", "https://luciadb.assaultlily.com/sparql/query");
    xhr.setRequestHeader("Content-Type", "application/sparql-query;charset=UTF-8");
    xhr.setRequestHeader("Accept", "application/json");
    startTime = performance.now();

    xhr.onload = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                resultArea.innerText = `${messageQueryLoaded[lang]}(${performance.now() - startTime}ms)`;
                console.log(`Download: ${performance.now() - startTime}ms`);
                if (!JSON.parse(xhr.responseText)) {
                    resultArea.innerText = messageQueryEmpty[lang];
                }
                lilyData = JSON.parse(xhr.responseText)["results"]["bindings"];
                isFirstGetLilyData = false;
                buildGardenFilter();
                xhr.abort();
                document.getElementById("loadBar").animate({
                    width: ["90%", "100%"]
                }, {
                    duration: 200,
                    fill: "both"
                });
                document.getElementById("loading").classList.add("loaded");
                return lilyData;
            } else {
                resultArea.innerText = `${messageQueryError[lang]}${xhr.statusText})`;
                xhr.abort();
            }
        }
    }
    xhr.send(query);
}

function buildGardenFilter() {
    //ガーデンフィルタの生成
    let gardenList = [];
    let option, label;
    let chkNoGarden, labelNoGarden;
    const divGardenFilter = document.getElementById("divGardenFilter");
    while (divGardenFilter.firstChild) {
        divGardenFilter.removeChild(divGardenFilter.firstChild);
    }
    gardenList = getLilyData();
    let garden;
    numGardens = [];
    for (let i = 0; i < gardenList.length; i++) {
        garden = gardenList[i];
        if ("garden" in garden) {
            if (garden["garden"]["value"] in numGardens === false) {
                option = document.createElement("input");

                option.setAttribute("type", "checkbox");
                option.setAttribute("name", garden["garden"]["value"]);
                option.setAttribute("class", "chkGarden");
                option.setAttribute("id", garden["garden"]["value"] + "_checkbox");

                label = document.createElement("label");
                label.setAttribute("for", garden["garden"]["value"] + "_checkbox");
                label.setAttribute("id", garden["garden"]["value"]);

                divGardenFilter.appendChild(option);
                divGardenFilter.appendChild(label);
                divGardenFilter.appendChild(document.createElement("br"));

                numGardens[garden["garden"]["value"]] = 1;
            } else if ("garden" in garden) {
                numGardens[garden["garden"]["value"]] += 1;
            }
        }
        let keysExistingGardens = Object.keys(numGardens);
        keysExistingGardens.forEach(garden => {
            document.getElementById(garden).innerText = garden + "(" + numGardens[garden].toString() + ")";
        });
    }
    chkNoGarden = document.createElement("input");

    chkNoGarden.setAttribute("type", "checkbox");
    chkNoGarden.setAttribute("name", "noGarden");
    chkNoGarden.setAttribute("id", "noGarden");
    chkNoGarden.setAttribute("class", "noGarden");

    labelNoGarden = document.createElement("label");
    labelNoGarden.setAttribute("for", "noGarden");
    labelNoGarden.innerText = "所属ガーデンなし";

    divGardenFilter.appendChild(chkNoGarden);
    divGardenFilter.appendChild(labelNoGarden);
    divGardenFilter.appendChild(document.createElement("br"));
}




window.addEventListener("DOMContentLoaded", () => {
    const divLoadingBar = document.getElementById("loadBar");
    divLoadingBar.animate({
        width: ["10%", "90%"]
    }, {
        duration: 200,
        fill: "both"
    });
    getLilyData();
    //多言語対応
    applyTranslates(lang);
    document.getElementById("version").innerText = `LiliesNote ${version}`;
    //言語設定を取得
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("lang")) {
        lang = searchParams.get("lang");
    }
    const chkGardenFilter = document.getElementById("chkGardenFilter");
    const divGardenFilter = document.getElementById("divGardenFilter");
    if (chkGardenFilter.checked) {
        divGardenFilter.style.display = "block";
    } else {
        divGardenFilter.style.display = "none";
    }
    chkGardenFilter.addEventListener("change", function () {
        if (this.checked) {
            divGardenFilter.style.display = "block";
        } else {
            divGardenFilter.style.display = "none";
        }
    })

    
})


document.getElementById("btnExport").addEventListener("click", function () {
    this.disabled = true;
    build();
    this.disabled = false;
})

document.getElementById("btnCopy").addEventListener("click", function () {
    //Webkit対応のため仕方なくこうする
    setTimeout(async () =>
        await navigator.clipboard.writeText(document.getElementById("textOutput").innerText)
    );
    spanDone = document.getElementById("spanDone");
    spanDone.animate({
        "opacity": [0, 1],
        "rotate": ["-90deg", "0deg"]
    }, {
        duration: 50,
        fill: "both"
    });
    setTimeout(() => {
        spanDone.animate({
            "opacity": [1, 0]
        }, {
            duration: 200,
            fill: "forwards"
        });
    }, 1500);
})

function filter(lilyListData) {
    //ガーデンフィルタを適用
    let resData = [];
    if (document.getElementById("chkGardenFilter").checked) {
        let includeGardens = [];
        const includeNoGarden = document.getElementById("noGarden").checked;
        const gardenFilter = Array.from(document.getElementsByClassName("chkGarden"));
        gardenFilter.forEach(garden => {
            if (garden.checked) {
                includeGardens.push(garden.name);
            }
        });
        for (let j = 0; j < lilyListData.length; j++) {
            if ("garden" in lilyListData[j]) {
                if (includeGardens.includes(lilyListData[j]["garden"]["value"]) === true) {
                    resData.push(lilyListData[j]);
                }
            } else if (includeNoGarden) {
                resData.push(lilyListData[j]);
            }
        }
    } else {
        resData = lilyListData;
    }
    return resData;
}


function build() {
    let buildStart = performance.now();
    let birthName = "";
    let birthYear = 0;
    let birthMonth = 0;
    let birthDay = 0;
    let icsData = icsHeader + `\nX-LICENSE-COMMENT:${license[lang]}`;
    let summary = "";
    let description = "";
    let legion = "";
    let charaType = "";
    let wordLimit = 0;

    let date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let nextDate = [0, 0, 0];
    let monthEnd = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let i = 0;
    let tableCell;
    const dateToday = `--${formatDate(month)}-${formatDate(day)}`;
    //プレビューの中身をリセット
    for (let i = 1; i < 13; i++) {
        let elem = document.getElementById(`tb${i.toString().padStart(2, "0")}`);
        elem.parentNode.replaceChild(elem.cloneNode(), elem);
    }

    let resData = filter(getLilyData());

    let dataRow;
    for (i = 0; i < resData.length; i++) {
        dataRow = resData[i];
        birthYear = year;
        // 名前、誕生月、誕生日
        birthName = dataRow["name"]["value"];
        birthMonth = Number(dataRow["birthdate"]["value"].substring(2, 4));
        birthDay = Number(dataRow["birthdate"]["value"].substring(5));
        charaType = dataRow["type"]["value"].replace("https://luciadb.assaultlily.com/rdf/IRIs/lily_schema.ttl#", "");
        //ガーデン名
        if ("garden" in dataRow) {
            garden = dataRow["garden"]["value"];
        } else {
            garden = "";
        }
        //所属レギオン
        if ("lgname" in dataRow) {
            legion = dataRow["lgname"]["value"];
        } else {
            legion = "";
        }

        //プレビューの中身を入れる
        let tableRow = document.getElementById("tb" + dataRow["birthdate"]["value"].substring(2, 4));
        tableCell = document.createElement("tr");
        let tdDay = document.createElement("td");
        if (lang === "ja") {
            tdDay.innerText = `${Number(dataRow["birthdate"]["value"].substring(5, 7)).toString()}日`;
        } else if (lang === "en") {
            tdDay.innerText = `${convert2Ordinal(Number(dataRow["birthdate"]["value"].substring(5, 7)))}`;
        }
        if(resData[i]["birthdate"]["value"] === dateToday) {
            tableCell.classList.add("bdtoday");
        }
        let tdName = document.createElement("td");
        tdName.innerText = dataRow["name"]["value"];
        tableCell.appendChild(tdDay);
        tableCell.appendChild(tdName);
        tableRow.appendChild(tableCell);

        //もう誕生日を過ぎてる場合は来年から
        if (birthMonth < month || (birthMonth == month && birthDay <= day)) {
            birthYear += 1;
        }
        //翌日の日付が月をまたぐ場合
        if (birthDay == monthEnd[birthMonth]) {
            //年越し
            if (birthMonth == 12) {
                nextDate = [birthYear + 1, 1, 1];
            } else {
                nextDate[0] = birthYear;
                nextDate[1] = birthMonth + 1;
                nextDate[2] = 1;
            }
        } else {
            nextDate[0] = birthYear;
            nextDate[1] = birthMonth;
            nextDate[2] = birthDay + 1;
        }
        if (lang == "ja") {
            summary = birthName + "の誕生日";
            if (charaType == "Teacher" && garden) {
                description = `${garden}の教導官、${birthName}の誕生日です。`;
            } else if (legion !== "") {
                description = `LG${legion}所属、${birthName}の誕生日です。`;
            } else {
                description = `${birthName}の誕生日です。`;
            }
        } else {
            summary = birthName + "'s birthday";
            if (charaType == "Teacher" && garden) {
                description = `It is the birthday of ${birthName}, a teacher at ${garden}.`;
            } else if (legion !== "") {
                description = `It is the birthday of ${birthName}, who belongs LG ${legion}.`;
            } else {
                description = `It is the birthday of ${birthName}.`;
            }
        }

        icsData += `
BEGIN:VEVENT
DTSTART;VALUE=DATE:${birthYear}${formatDate(birthMonth, birthDay)}
DTEND;VALUE=DATE:${nextDate[0]}${formatDate(nextDate[1], nextDate[2])}
DTSTAMP:${birthYear}${formatDate(month, day)}T${formatDate(hour, minute)}00
RRULE:FREQ=YEARLY
TRANSP:TRANSPARENT
SUMMARY:${summary}
DESCRIPTION:${description}
URL;VALUE=URI:${dataRow["lily"]["value"].replace("https://luciadb.assaultlily.com/rdf/RDFs/detail/", "https://lemonade.assaultlily.com/lily/")}`;

        if (document.getElementById("chkExact").checked) {
            icsData += `\nUID:${dataRow["lily"]["value"].replace("https://luciadb.assaultlily.com/rdf/RDFs/detail/", "")}@LiliesNote.ulong32.github.io`;
        }
        icsData += "\nEND:VEVENT";
    }
    icsData += "\nEND:VCALENDAR";

    //厳格モード
    if (document.getElementById("chkExact").checked) {
        icsRow = icsData.split("\n");
        switch (lang) {
            case "ja":
                wordLimit = 24;
                break;
            case "en":
                wordLimit = 74;
                break;
            default:
                wordLimit = 24;
                break;
        }
        let regEx = new RegExp(`.{1,${wordLimit}}`, "g");
        for (let j = 0; j < icsRow.length; j++) {
            // URLの規約遵守処理
            if ((icsRow[j].startsWith("URL") || icsRow[j].startsWith("UID")) && icsRow[j].length > 74) {
                icsRow[j] = icsRow[j].match(/.{1,73}/g).join("\n ");
            }
            // 概要、説明、ライセンスコメントの規約遵守処理
            if ((icsRow[j].startsWith("SUMMARY") || icsRow[j].startsWith("DESCRIPTION") || icsRow[j].startsWith("X-LICENSE-COMMENT")) && icsRow[j].length > wordLimit) {
                console.log(icsRow[j]);
                icsRow[j] = icsRow[j].match(regEx).join("\n ");
            }
        }
        icsData = icsRow.join("\n");
    }

    console.log(`Build iCal Data: ${performance.now() - buildStart}ms`);
    document.getElementById("textOutput").innerText = icsData;
    if (lang == "ja") {
        document.getElementById("result").innerHTML = `${i}人のリリィの誕生日を<wbr>エクスポートしました。`;
    } else {
        document.getElementById("result").innerHTML = `Exported ${i} Lily's Birthday.`;
    }
    //ダウンロード処理
    if (document.getElementById("chkPreview").checked === false) {
        const blob = new Blob([icsData], { "type": "text/calendar" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.setAttribute("href", url);
        anchor.setAttribute("download", 'LiliesBirthday.ics');
        const mouseEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window
        });
        anchor.dispatchEvent(mouseEvent);
    }
}
