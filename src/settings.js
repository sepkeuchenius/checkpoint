export const UNSET = "UNSET"
export class Settings{
    constructor(){
        this.google = UNSET
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
            google: this.google
        }
    }
    wantsGoogle() {
        return this.google && this.google != UNSET
    }
}

export async function userSettings(){
    return await new Settings().load()
}