export const UNSET = "UNSET"
export class Settings{
    constructor(){
        this.google = UNSET
        this.sync_local = true
    }
    async load(){
        await chrome.storage.sync.get("settings").then((result)=>{
            Object.assign(this, result.settings)
        })
        return this
    }
    save(){
        return chrome.storage.sync.set({"settings": this.toJSON()}).then((result)=>{
            return result
        })
    }
    toJSON() {
        return {
            google: this.google,
            sync_local: this.sync_local
        }
    }
    wantsGoogle() {
        return this.google && this.google != UNSET
    }
    wantsToSyncLocal() {
        console.log(this.sync_local)
        return this.sync_local && this.sync_local != UNSET
    }
}

export async function userSettings(){
    return await new Settings().load()
}