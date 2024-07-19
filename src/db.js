import { Checkpoint } from "./checkpoint";
import { getDatabase, ref, get, set, child, push } from "firebase/database";
import { app, getUserInfo } from "./login"
import { userSettings } from "./settings";
import { buildNotification } from "./notifications";
const db = getDatabase(app)

export function removeCheckpointById(id) {
    return useFirebase().then((useFirebase) => {
        if (useFirebase) {
            removeCheckpointFromFirebase(id)
        }
        else {
            removeCheckpointFromChrome(id)
        }
    });
}
function removeCheckpointFromFirebase(id) {
    const userId = getUserInfo().currentUser.uid
    get(ref(db, `users/${userId}/checkpoints`)).then((snapshot) => {
        var checkpoints = snapshot.val();
        checkpoints = checkpoints.filter(function (c) { return c.id != id });
        set(ref(db, `users/${userId}/checkpoints`), checkpoints).then((res) => {
            useSyncLocal().then((syncLocal) => {
                if (syncLocal) {
                    syncCheckpointsToChrome()
                }
            })
        });
    })
}
function removeCheckpointFromChrome(id) {
    chrome.storage.sync.get("checkpoints", function (result) {
        var checkpoints = result.checkpoints;
        checkpoints = checkpoints.filter(function (c) { return c.id != id });
        chrome.storage.sync.set({ "checkpoints": checkpoints })
    });
}

async function syncCheckpointsToFirebase() {
    const userId = getUserInfo().currentUser.uid
    set(ref(db, `users/${userId}`), {
        checkpoints: await getCheckPointsFromChrome()
    })
}

export function syncCheckpointsToChrome() {
    return getCheckPointsFromFirebase().then((checkpoints) => {
        return chrome.storage.sync.set({ "checkpoints": checkpoints }).catch((error) => {
            console.error("Failed to set checkpoints to Chrome storage:", error);
            buildNotification("Your checkpoints are safe in the cloud", "However, they could not be synced locally. You may have too many checkpoints. Not to worry, your checkpoints are still safe in the cloud.")
            return false
        }).then((res) => {
            return res
        });
    })
}

function getCheckPointsFromFirebase() {
    if (getUserInfo().currentUser) {
        const userId = getUserInfo().currentUser.uid
        return get(ref(db, `users/${userId}`)).then((snapshot) => {
            console.log(snapshot.val())
            if (!snapshot.val()) {
                syncCheckpointsToFirebase()
            }
            else {
                return Object.values(snapshot.val().checkpoints)
            }

        })
    }
    else {
        return []
    }
}

export function useFirebase() {
    return userSettings().then((settings) => {
        return settings.wantsGoogle() && getUserInfo().currentUser
    })
}
export function useSyncLocal() {
    return userSettings().then((settings) => {
        return settings.wantsToSyncLocal()
    })
}

export function getCheckpoints() {
    return useFirebase().then((useFirebase) => {
        if (useFirebase) {
            return getCheckPointsFromFirebase()
        }
        else {
            return getCheckPointsFromChrome()
        }
    });
}

function getCheckPointsFromChrome() {
    return chrome.storage.sync.get("checkpoints").then((results) => { return results.checkpoints })
}

function saveNewCheckpointToFirebase(checkpoint) {
    const userId = getUserInfo().currentUser.uid
    return push(ref(db, `users/${userId}/checkpoints`), checkpoint).then((res) => {
        useSyncLocal().then((syncLocal) => {
            if (syncLocal) {
                syncCheckpointsToChrome()
            }
        })
        return res
    })
}

export function saveNewCheckpoint(checkpoint) {
    return useFirebase().then((useFirebase) => {
        if (useFirebase) {
            return saveNewCheckpointToFirebase(checkpoint)
        }
        else {
            return saveNewCheckpointToChrome(checkpoint)
        }
    });
}

function saveNewCheckpointToChrome(checkpoint) {
    return getCheckpoints().then((checkpoints) => {
        checkpoints.push(checkpoint);
        return chrome.storage.sync.set({ "checkpoints": checkpoints }).then((res) => {
            return res
        })
    })
}

export function updateCheckpoint(checkpoint) {
    return getCheckpoints().then((checkpoints) => {
        for (var c in checkpoints) {
            if (checkpoints[c].id == checkpoint.id) {
                checkpoints[c] = checkpoint //replace with new 
            }
        }
        return useFirebase().then((useFirebase) => {
            if (useFirebase) {
                const userId = getUserInfo().currentUser.uid
                return set(ref(db, `users/${userId}/checkpoints`), checkpoints).then((res) => {
                    useSyncLocal().then((syncLocal) => {
                        if (syncLocal) {
                            syncCheckpointsToChrome()
                        }
                    })
                    return res
                })

            }
            else {
                chrome.storage.sync.set({ "checkpoints": checkpoints }).then((res) => {
                    return res
                })
            }
        });
    })
}

export function getCheckpointById(id) {
    console.log(id)
    return getCheckpoints().then((checkpoints) => {
        for (var checkpoint in checkpoints) {
            console.log(checkpoint)
            if (checkpoints[checkpoint].id == id) {
                return checkpoints[checkpoint]
            }
        }
    })
}

export function setInitialCheckpointList() {
    chrome.storage.sync.set({ "checkpoints": [] })
}