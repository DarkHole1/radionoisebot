import { readFileSync } from "fs";
import { RawUserData } from "./models/user-data";
import { writeFile } from "fs/promises";

let userData = RawUserData.parse(JSON.parse(readFileSync('data/user-data.json', { encoding: 'utf-8' })))

export function getUserData({ userId }: { userId: number }): RawUserData[0] {
    return userData[userId] ?? {
        searchType: 'shikimori'
    }
}

export async function setUserData({ userId, data }: { userId: number, data: RawUserData[0] }) {
    userData[userId] = data
    await writeFile('data/user-data.json', JSON.stringify(userData))
}
