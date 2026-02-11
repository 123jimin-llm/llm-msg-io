let CURR_UID = 0;

export function getNextUID(): number {
    return ++CURR_UID;
}
