import { type lilyBirthdayObject } from "./types"

export function filterByGarden(lilyBirthdayObjects: lilyBirthdayObject[], Gardens: string[]): lilyBirthdayObject[] {
    if (Gardens.length === 0) return lilyBirthdayObjects;
    return lilyBirthdayObjects.filter((obj => {
        if ("garden" in obj) {
            return Gardens.includes(obj.garden!.value);
        } else {
            return Gardens.includes("所属ガーデンなし");
        }
    }))
}