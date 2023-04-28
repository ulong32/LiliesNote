const queryHeader = `PREFIX schema: <http://schema.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX lily: <https://luciadb.assaultlily.com/rdf/IRIs/lily_schema.ttl#>
PREFIX lilyrdf: <https://luciadb.assaultlily.com/rdf/RDFs/detail/>`;

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
    let resultarea = document.getElementById("result");
    let starttime;
    const query = `
SELECT ?name ?birthdate ?lgname ?lily
WHERE {
    VALUES ?class { lily:Lily lily:Teacher lily:Madec lily:Character }
    ?lily a ?class;
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
    starttime = Date.now();
    xhr.send(queryHeader + query);
    xhr.onreadystatechange = function() {
        switch(xhr.readyState){
            case 1:
                resultarea.innerText = "クエリ送信中...";
                break;
            case 2:
                resultarea.innerText = "サーバ応答待機中...";
                break;
            case 3:
                resultarea.innerText = "データダウンロード中...";
                break;
            case 4:
                if(xhr.status == 200){
                    let endtime = Date.now();
                    resultarea.innerText = `問い合わせ完了。(${endtime - starttime}ms)`;
                    console.log(`Download: ${endtime - starttime}ms`)
                    build(JSON.parse(xhr.responseText)["results"]["bindings"],lang,starttime);
                } else {
                    resultarea.innerText = `問い合わせ失敗。(エラー:${xhr.statusText})`;
                }
                break;
        }
    }
}


function build(resdata,lang,starttime){
    let buildstart = Date.now();
    let birthname = "";
    let birthyear = 0;
    let birthmonth = 0;
    let birthday = 0;
    let icsdata = icsHeader + `\nX-LICENSE-COMMENT:${license[lang]}`;
    let summary = "";
    let description = "";
    let legion = "";

    let date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    let hour = date.getHours();
    let minute = date.getMinutes();
    
    let LemonadeURL = "";

    let nextdate = [0,0,0];
    //月末データ、視認性向上のため先頭は意味ないデータ
    let monthend = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    let i=0;
    
    for(i=0;i<resdata.length;i++){

        birthyear = year;
        // 名前、誕生月、誕生日
        birthname = resdata[i]["name"]["value"];
        birthmonth = Number(resdata[i]["birthdate"]["value"].substring(2,4));
        birthday = Number(resdata[i]["birthdate"]["value"].substring(5))
        //所属レギオン
        if("lgname" in resdata[i]){
            legion = resdata[i]["lgname"]["value"];
        } else {
            legion = "";
        }
        
        //もう誕生日を過ぎてる場合は来年から
        if(birthmonth < month || (birthmonth == month && birthday <= day)) {
            birthyear += 1;
        }

        //翌日の日付が月をまたぐ場合
        if(birthday == monthend[birthmonth]){
            //年越し
            if(birthmonth == 12){
                nextdate = [birthyear + 1,1,1];
            } else {
                nextdate[0] = birthyear;
                nextdate[1] = birthmonth + 1;
                nextdate[2] = 1;
            }
        } else {
            nextdate[0] = birthyear;
            nextdate[1] = birthmonth;
            nextdate[2] = birthday + 1;
        }
        if(lang == "ja") {
            summary = birthname + "の誕生日";
            if(legion !== "") {
                description = `LG${legion}所属、${birthname}の誕生日です。`;
            } else {
                description = `${birthname}の誕生日です。`;
            }
            // iCalendar規約を遵守する場合
            // if(description.length > 20) description = description.match(/.{1,20}/g).join("\n ");

        } else {
            summary = birthname + "'s birthday";
            if(legion !== "") {
                description = `It is the birthday of ${birthname}, who belongs to LG ${legion}.`;
            } else {
                description = `It is the birthday of ${birthname}.`;
            }
            // iCalendar規約を遵守する場合
            // if(description.length > 60) description = description.match(/.{1,60}/g).join("\n ");
        }
        LemonadeURL = resdata[i]["lily"]["value"].replace("https://luciadb.assaultlily.com/rdf/RDFs/detail/","https://lemonade.assaultlily.com/lily/");
        icsdata += `
BEGIN:VEVENT
DTSTART;VALUE=DATE:${birthyear.toString()}${formatDate(birthmonth,birthday)}
DTEND;VALUE=DATE:${nextdate[0].toString()}${formatDate(nextdate[1],nextdate[2])}
DTSTAMP:${birthyear.toString()}${formatDate(month,day)}T${formatDate(hour,minute)}00
RRULE:FREQ=YEARLY
TRANSP:TRANSPARENT
SUMMARY:${summary}
DESCRIPTION:${description}
URL;VALUE=URI:${LemonadeURL}
END:VEVENT`;
    }
    
    icsdata += "\nEND:VCALENDAR";
    console.log(`Build iCal Data: ${Date.now() - buildstart}ms`);
    let outArea = document.getElementById("output");
    outArea.value = icsdata;
    document.getElementById("result").innerText = `${i}人のリリィの誕生日をエクスポートしました。(${Date.now()-starttime}ms)`;
    //ダウンロード処理
    const blob = new Blob([icsdata], {"type" : "text/calendar"});
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.setAttribute("href",url);
    anchor.setAttribute("download",'liliesbirthday.ics')
    const mouseEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window
    });
    anchor.dispatchEvent(mouseEvent);
}
