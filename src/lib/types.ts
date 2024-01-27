interface RDFObject {
    type: "literal" | "uri";
    "xml:lang"?: "ja" | "en";
    value: string
}
interface RDFStringObject extends RDFObject {
    type: "literal";
    "xml:lang": "ja" | "en";
}

interface RDFgMonthDayObject extends RDFObject {
    type: "literal";
    datatype: "https://www.w3.org/2001/XMLSchema#gMonthDay";
    value: `--${number}${number}-${number}${number}`;
}

interface RDFURIObject extends RDFObject {
    type: "uri";
}

export interface lilyBirthdayObject {
    name: RDFStringObject;
    birthdate: RDFgMonthDayObject;
    lgname?: RDFStringObject;
    lily: RDFURIObject;
    type: RDFURIObject;
    garden?: RDFObject;
}

