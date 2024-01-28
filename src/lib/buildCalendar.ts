import type { lilyBirthdayObject } from "./types";

function pad(number: number) {
    return String(number).padStart(2, "0");
}

function getNextDate(year: number, month: number, day: number) {
    const monthEnd = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 12 && day === 31) {
        return `${year + 1}0101`;
    } else if (day + 1 > monthEnd[month]) {
        return `${year}${pad(month + 1)}01`;
    } else {
        return `${year}${pad(month)}${pad(day + 1)}`;
    }
}

function getDescription(lilyBirthdayObject: lilyBirthdayObject) {
    if ("lgname" in lilyBirthdayObject) {
        return `LG${lilyBirthdayObject.lgname!.value}所属、${lilyBirthdayObject.name.value}の誕生日です。`;
    } else if ("garden" in lilyBirthdayObject && lilyBirthdayObject.type.value === "https://luciadb.assaultlily.com/rdf/IRIs/lily_schema.ttl#") {
        return `${lilyBirthdayObject.garden!.value}の教導官、${lilyBirthdayObject.name.value}の誕生日です。`;
    } else {
        return `${lilyBirthdayObject.name.value}の誕生日です。`
    }
}

export function buildCalendar(lilyBirthdayObjects: lilyBirthdayObject[]) {
    console.log(`Num: ${lilyBirthdayObjects.length}`)
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();

    let icsString: string = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LuciaDB/ulong32/NONSGML LiliesNote ${APP_VERSION}//JA
CALSCALE:GREGORIAN
X-LICENSE-COMMENT:このデータはLuciaDBから取得しています。ライセンスはCC BY-NC-SA 4.0です。`;
    lilyBirthdayObjects.forEach((entry) => {
        icsString += `
BEGIN:VEVENT
DTSTART;VALUE=DATE:${currentYear}${entry.birthdate.value.replaceAll("-", "")}
DTEND;VALUE=DATE:${getNextDate(currentYear, parseInt(entry.birthdate.value.slice(2, 4)), parseInt(entry.birthdate.value.slice(5)))}
DTSTAMP:${currentYear}${pad(currentMonth)}${pad(currentDay)}T${pad(currentHour)}${pad(currentMinute)}00
RRULE:FREQ=YEARLY
TRANSP:TRANSPARENT
SUMMARY:${entry.name.value}の誕生日
DESCRIPTION:${getDescription(entry)}
URL;VALUE=URI:https://lemonade.assaultlily.com/lily/${entry.lily.value.replace("https://luciadb.assaultlily.com/rdf/RDFs/detail/", "")}
END:VEVENT`;
    })
    icsString += "\nEND:VCALENDAR";
    const blob = new Blob([icsString], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.setAttribute("href", url);
    anchor.setAttribute("download", "LilyBirthdays.ics");
    const mouseEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window
    });
    anchor.dispatchEvent(mouseEvent);
    return undefined;
}