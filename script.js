const queryHeader = `PREFIX schema: <http://schema.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX lily: <https://luciadb.assaultlily.com/rdf/IRIs/lily_schema.ttl#>`;

const icsHeader = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LuciaDB/ulong32//NONSGML LiliesNote//JA
CALSCALE:GREGORIAN`;

const license = {
    "ja": "このデータはLuciaDBから取得しています。ライセンスはCC BY-NC-SA 4.0です。",
    "en": "This data is sourced from LuciaDB, licensed under CC BY-NC-SA 4.0.",
};

function formatDate(...args){
    let str = "";
    for(let i=0;i<args.length;i++){
        str += args[i].toString().padStart(2,"0");
    }
    return str;
}


function download(lang) {
    let server = "https://luciadb.assaultlily.com/sparql/query"
    const xhr = new XMLHttpRequest();
    let resultArea = document.getElementById("result");
    let startTime;
    const query = `
SELECT ?name ?birthdate ?lgname ?lily ?type ?garden
WHERE {
    VALUES ?class { lily:Lily lily:Teacher lily:Madec lily:Character }
    ?lily a ?class;
          rdf:type ?type;
          lily:garden ?garden;
          schema:name ?name;
          schema:birthDate ?birthdate.
    FILTER(lang(?name)="${lang}")
    OPTIONAL{
        ?lily lily:legion/schema:name ?lgname.
        FILTER(lang(?lgname)="${lang}")
    }
}
ORDER BY ?name`;

    xhr.open("POST",server,true);
    xhr.setRequestHeader("Content-Type", "application/sparql-query");
    xhr.setRequestHeader("Accept", "application/json");
    startTime = Date.now();
    xhr.send(queryHeader + query);
    xhr.onreadystatechange = function() {
        switch(xhr.readyState){
            case 1:
                resultArea.innerText = "クエリ送信中...";
                break;
            case 2:
                resultArea.innerText = "サーバ応答待機中...";
                break;
            case 3:
                resultArea.innerText = "データダウンロード中...";
                break;
            case 4:
                if(xhr.status == 200){
                    let endTime = Date.now();
                    resultArea.innerText = `問い合わせ完了。(${endTime - startTime}ms)`;
                    console.log(`Download: ${endTime - startTime}ms`)
                    build(JSON.parse(xhr.responseText)["results"]["bindings"],lang,startTime);
                } else {
                    resultArea.innerText = `問い合わせ失敗。(エラー:${xhr.statusText})`;
                }
                break;
        }
    }
}


function build(resData,lang,startTime){
    let buildStart = Date.now();
    let birthName = "";
    let birthYear = 0;
    let birthMonth = 0;
    let birthDay = 0;
    let icsData = icsHeader + `\nX-LICENSE-COMMENT:${license[lang]}`;
    let summary = "";
    let description = "";
    let legion = "";
    let charaType = "";

    let date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    let hour = date.getHours();
    let minute = date.getMinutes();
    
    let LemonadeURL = "";

    let nextDate = [0,0,0];
    //月末データ、視認性向上のため先頭は意味ないデータ
    let monthEnd = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    let i=0;
    
    for(i=0;i<resData.length;i++){

        birthYear = year;
        // 名前、誕生月、誕生日
        birthName = resData[i]["name"]["value"];
        birthMonth = Number(resData[i]["birthdate"]["value"].substring(2,4));
        birthDay = Number(resData[i]["birthdate"]["value"].substring(5));
        charaType = resData[i]["type"]["value"].replace("https://luciadb.assaultlily.com/rdf/IRIs/lily_schema.ttl#","");
        garden = resData[i]["garden"]["value"];
        //所属レギオン
        if("lgname" in resData[i]){
            legion = resData[i]["lgname"]["value"];
        } else {
            legion = "";
        }
        
        //もう誕生日を過ぎてる場合は来年から
        if(birthMonth < month || (birthMonth == month && birthDay <= day)) {
            birthYear += 1;
        }

        //翌日の日付が月をまたぐ場合
        if(birthDay == monthEnd[birthMonth]){
            //年越し
            if(birthMonth == 12){
                nextDate = [birthYear + 1,1,1];
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
        if(lang == "ja") {
            summary = birthName + "の誕生日";
            if(charaType == "Teacher") {
                description = `${garden}の教導官、${birthName}の誕生日です。`;
            } else if(legion !== "") {
                description = `LG${legion}所属、${birthName}の誕生日です。`;
            } else {
                description = `${birthName}の誕生日です。`;
            }
            // iCalendar規約を遵守する場合
            // if(description.length > 20) description = description.match(/.{1,20}/g).join("\n ");

        } else {
            summary = birthName + "'s birthDay";
            if(charaType == "Teacher") {
                description = `It is the birthDay of ${birthName}, a teacher at ${garden}`;
            } else if(legion !== "") {
                description = `It is the birthDay of ${birthName}, who belongs to LG ${legion}.`;
            } else {
                description = `It is the birthDay of ${birthName}.`;
            }
            // iCalendar規約を遵守する場合
            // if(description.length > 60) description = description.match(/.{1,60}/g).join("\n ");
        }

        LemonadeURL = resData[i]["lily"]["value"].replace("https://luciadb.assaultlily.com/rdf/RDFs/detail/","https://lemonade.assaultlily.com/lily/");
        icsData += `
BEGIN:VEVENT
DTSTART;VALUE=DATE:${birthYear.toString()}${formatDate(birthMonth,birthDay)}
DTEND;VALUE=DATE:${nextDate[0].toString()}${formatDate(nextDate[1],nextDate[2])}
DTSTAMP:${birthYear.toString()}${formatDate(month,day)}T${formatDate(hour,minute)}00
RRULE:FREQ=YEARLY
TRANSP:TRANSPARENT
SUMMARY:${summary}
DESCRIPTION:${description}
URL;VALUE=URI:${LemonadeURL}
END:VEVENT`;
    }
    
    icsData += "\nEND:VCALENDAR";
    console.log(`Build iCal Data: ${Date.now() - buildStart}ms`);
    let outArea = document.getElementById("output");
    outArea.value = icsData;
    document.getElementById("result").innerText = `${i}人のリリィの誕生日をエクスポートしました。(${Date.now()-startTime}ms)`;
    //ダウンロード処理
    const blob = new Blob([icsData], {"type" : "text/calendar"});
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.setAttribute("href",url);
    anchor.setAttribute("download",'LiliesBirthday.ics')
    const mouseEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window
    });
    anchor.dispatchEvent(mouseEvent);
}
