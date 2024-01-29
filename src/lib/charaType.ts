export function getCharaTypeName(value: string): string {
    switch (value.replace("https://luciadb.assaultlily.com/rdf/IRIs/lily_schema.ttl#", "")) {
        case "Lily":
            return "リリィ";
        case "Teacher":
            return "教導官";
        case "Madec":
            return "マディック";
        case "Character":
            return "その他";
        default:
            return "キャラタイプ捕捉エラー";
    }
}