class Setting {
    constructor(obj){
        this.name = obj.name
        this.values = obj.values
        this.current = obj.current
        this.display()
    }
    display(){
        this.displaySetting()
        this.displayName()
        this.displayOptions()
        this.setValue()
        this.addChangeListener()
    }
    displaySetting(){
        this.el = $("<div>")
        this.el.attr("class", "setting")
        $("#settings").append(this.el)
    }
    displayName(){
        this.nameElement = $("<span>")
        this.nameElement.text(this.name)
        this.nameElement.attr("class", "title")
        this.el.append(this.nameElement)
    }
    displayOptions(){
        this.selectElement = $("<select>")
        this.selectElement.attr("id", this.name)
        this.selectElement.attr("class", "options")
        for(var value of this.values){
            var option = $("<option>")
            option.text(value)
            option.attr("value", value)
            option.attr("id", value)
            this.selectElement.append(option)
        }
        this.el.append(this.selectElement)
    }
    setValue(){
        this.selectElement.val(this.current)
    }
    saveMe(){
        this.current = this.selectElement.val();
        var name = this.name
        var current = this.current
        chrome.storage.sync.get("settings", function(result){
            for(var setting of result.settings){
                console.log(setting)
                if(setting.name == name){
                    setting.current = current
                }
            }
            chrome.storage.sync.set({"settings": result.settings})
        })
        
    }
    addChangeListener(){
        this.selectElement.on("change", this.saveMe.bind(this));
    }
    




}