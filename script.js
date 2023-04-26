const queryHeader = `PREFIX schema: <http://schema.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX lily: <https://luciadb.assaultlily.com/rdf/IRIs/lily_schema.ttl#>
PREFIX lilyrdf: <https://luciadb.assaultlily.com/rdf/RDFs/detail/>`;

const icsHeader = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ulong32//ulong32//LiliesNote//JP
CALSCALE:GREGORIAN`;

function padding(number){
    return number.toString().padStart(2,"0");
}

function download(lang) {
    let server = "https://luciadb.assaultlily.com/sparql/query"
    const xhr = new XMLHttpRequest();
    xhr.open("POST",server,false);

    let query = `
SELECT ?name ?birthdate ?lgname ?lily
WHERE {
{?lily a lily:Lily;}
UNION
{?lily a lily:Character.}
UNION
{?lily a lily:Madec.}
schema:name ?name.
FILTER(lang(?name)="${lang}")
?lily schema:birthDate ?birthdate.
OPTIONAL{?lily lily:legion ?legion.
?legion schema:name ?lgname.
FILTER(lang(?lgname)="${lang}")}
}
ORDER BY ?name`;

    xhr.open("POST",server,false);
    xhr.setRequestHeader("Content-Type", "application/sparql-query");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send(queryHeader + query);

    let response = JSON.parse(xhr.responseText);
    let resdata = response["results"]["bindings"];
    let birthdata = [];
    let icsdata = icsHeader;
    let summary = "";
    let description = "";
    let legion = "";

    let date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    let year = date.getFullYear();
    let hour = date.getHours() + 1;
    let minute = date.getMinutes();
    
    let LemonadeURL = "";

    let nextdate = [0,0,0];
    //月末データ、視認性向上のため先頭は意味ないデータ
    let monthend = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    let i=0;
    
    for(i=0;i<resdata.length;i++){

        //めんどくさがって直接代入してるのでここでリセット
        year = date.getFullYear();
        // 名前、誕生月、誕生日
        birthdata = [resdata[i]["name"]["value"], Number(resdata[i]["birthdate"]["value"].substring(2,4)), Number(resdata[i]["birthdate"]["value"].substring(5))];
        //所属レギオン
        if(typeof resdata[i]["lgname"] !== "undefined"){
            legion = resdata[i]["lgname"]["value"];
        } else {
            legion = "無";
        }
        
        //もう誕生日を過ぎてる場合は来年から
        if(birthdata[1] < month || (birthdata[1] == month && birthdata[2] <= day)) {
            year += 1;
        }

        //翌日の日付が月をまたぐ場合
        if(birthdata[2] == monthend[birthdata[1]]){
            //年越し
            if(birthdata[1] == 12){
                nextdate = [year + 1,1,1];
            } else {
                nextdate[0] = year;
                nextdate[1] = birthdata[1] + 1;
                nextdate[2] = 1;
            }
        } else {
            nextdate[0] = year;
            nextdate[1] = birthdata[1];
            nextdate[2] = birthdata[2] + 1;
        }
        if(lang == "ja") {
            summary = birthdata[0] + "の誕生日";
            description = `LG${legion}所属、${birthdata[0]}の誕生日です。`;
        } else {
            summary = birthdata[0] + "'s birthday";
            description = `It is the birthday of ${birthdata[0]}, who belongs to ${legion}.`;
        }
        LemonadeURL = resdata[i]["lily"]["value"].replace("https://luciadb.assaultlily.com/rdf/RDFs/detail/","https://lemonade.assaultlily.com/lily/");
        icsdata += `
BEGIN:VEVENT
DTSTART;VALUE=DATE:${year.toString()}${padding(birthdata[1])}${padding(birthdata[2])}
DTEND;VALUE=DATE:${nextdate[0].toString()}${padding(nextdate[1])}${padding(nextdate[2])}
DTSTAMP:${year}${padding(month)}${padding(day)}T${padding(hour)}${padding(minute)}00
RRULE:FREQ=YEARLY
SUMMARY:${summary}
DESCRIPTION:${description}
URL;VALUE=URI:${LemonadeURL}
END:VEVENT`;
    }
    document.getElementById("result").innerText = `${i}人のリリィの誕生日をエクスポートしました。`
    
    icsdata += "\nEND:VCALENDAR";
    let outArea = document.getElementById("a");
    outArea.value = icsdata;

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
