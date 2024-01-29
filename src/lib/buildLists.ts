import { getCharaTypeName } from "./charaType";
import type { lilyBirthdayObject } from "./types";

export function getGardenList(lilyBirthdayObjects: lilyBirthdayObject[]) {
    const gardenList = new Set(
        lilyBirthdayObjects.map((obj) => {
            if ("garden" in obj) {
                return obj.garden!.value;
            } else {
                return "所属ガーデンなし";
            }
        })
    );
    return Array.from(gardenList);
}

export function getCharaTypeList(lilyBirthdayObjects: lilyBirthdayObject[]): string[] {
    const charaList = new Set(
        lilyBirthdayObjects.map((obj) => getCharaTypeName(obj.type.value))
    );
    return Array.from(charaList);
}