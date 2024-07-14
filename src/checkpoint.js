import $ from "jquery"
export class Checkpoint{
    constructor(obj){
        this.id = obj.id || (Math.random() * 10000).toFixed(0);
        this.url = obj.url || "";
        this.selection = obj.selection;
        this.scroll = obj.scroll;
        this.element = obj.element;
        this.title = obj.title || "";
        this.faviconUrl = obj.faviconUrl || "";
        this.currentButtonPosition = 4 //start 4 pixels from the side
        if(!("tags" in obj)) this.tags = []
        else this.tags = obj.tags
        if(!("starred" in obj)) this.starred = false
        else this.starred = true
        this.created = obj.created || new Date().getTime()
    }
    createElement(){
        var el = document.createElement('div');
        el.className = "checkpoint";
        el.id = this.id;
        this.el = el;
    }
    createSelectionText(){
        var textEl = document.createElement('p');
        textEl.innerText = this.selection;
        textEl.className = 'selection';
        this.selectionElement = textEl;
        this.el.appendChild(textEl)
    }
    createUrlText(){
        if(this.url.length > 0 && this.title.length > 0){
            var textEl = document.createElement('p');
            textEl.innerText = getURLBase(this.url) + " | " + this.title;
            textEl.className = 'url';
            this.urlElement = textEl;
            this.el.appendChild(textEl)    
        }
        
    }
    createIcon(){
        var iconEl = document.createElement('img');
        iconEl.src = this.faviconUrl;
        iconEl.className = 'checkpoint-icon';
        this.iconElement = iconEl;
        this.el.appendChild(iconEl)
    }
    calcTimeAgo(){
        var now = new Date().getTime();
        var ago = ""
        var seconds_ago = (now - this.created) / 1000
        var minutes_ago = seconds_ago / 60;
        var hours_ago = minutes_ago / 60;
        var days_ago = hours_ago / 24;
        ago = Math.round(days_ago) + ' days ago';
        if(hours_ago < 24){
            ago = Math.round(hours_ago) + ' hours ago';
        }
        if(minutes_ago < 60){
            ago = Math.round(minutes_ago) + ' minutes ago';
        }
        if(seconds_ago < 60){
            ago = Math.round(seconds_ago) + ' seconds ago';
        }
        this.ago = ago;
        return ago;
    }

    createTimeText(){
        var time = document.createElement('p');
        var ago = this.calcTimeAgo()        
        time.className = "time"
        time.innerText = ago;
        this.timeElement = time;
        this.el.appendChild(time)
    }
    addButtonToCheckpoint(name, onclickFunction, width){
        var button = document.createElement('button');
        button.innerText = name;
        button.className = "small-button"
        button.onclick = onclickFunction.bind(this);
        button.style.right = this.currentButtonPosition.toString() + "px";
        this.currentButtonPosition += width
        this.el.appendChild(button)
        return button
    }
    addButtons(){
        this.buttons = [
            // this.addButtonToCheckpoint("Star", this.starMe, 30), 
            this.addButtonToCheckpoint("Tag", this.tagMe, 30), 
            this.addButtonToCheckpoint("Delete", this.deleteMe, 45),            
            this.addButtonToCheckpoint("Copy", this.copyMe, 35)          
        ]
        console.log(this.buttons)
    }
    addTags(){
        this.tagElements = []
        for(var tag of this.tags){
            this.addTag(tag)
        }
    }
    addTag(tag){
        var el = document.createElement("p")
        el.className = 'tag'
        this.tagElements.push(el)
        el.innerText = tag
        this.el.appendChild(el)
        el.onclick = function(){
            document.getElementById('search').value = tag
            document.getElementById('search').focus()
        }
    }
    
    deleteTag(tag){
        tagIndex = this.tags.indexOf(tag)
        this.el.removeChild(this.tagElements[tagIndex])
        this.tagElements.splice(tagIndex, 1)
        this.tags.splice(tagIndex, 1)
    }
    draw(container){
        this.createElement();
        this.hide()
        this.createSelectionText();
        this.createUrlText();
        this.createTimeText();
        this.addButtons()
        if(this.faviconUrl){
            this.createIcon();
        }
        this.addTags()
        this.container = container;
        $(container).prepend(this.el); //TODO: prepend or append based on settings
        this.truncate();
        this.addListeners();
        this.show()
    }
    truncate(){
        //the element has been pushed to the extension
        //but it might be too high

        //we decrease the length of the string until we reach a desired height
        if(this.urlElement){
            var checkText = this.selectionElement;
            var titleText = this.urlElement;
            var checkLength = checkText.innerText.length
            var urlLength = titleText.innerText.length
            while(this.el.offsetHeight > MAX_CHECKPOINT_HEIGHT){
                if(checkLength > urlLength){
                    checkLength -= 10
                    checkText.innerText = checkText.innerText.substring(0,checkLength) + "..."
                }
                else{
                    urlLength -= 10
                    titleText.innerText = titleText.innerText.substring(0,urlLength) + "..."
                }
                //only add the dots if actually decreased in size
            }
        }
      
    }
    addListeners(){
        this.el.addEventListener('click', this.clicked.bind(this))
        this.el.addEventListener('mouseenter', this.hover.bind(this));
        this.el.addEventListener('mouseleave', this.unHover.bind(this));
    }
    getJSON(){
        return {
            'url': this.url,
            'selection':this.selection,
            'created':this.created,
            'scroll':this.scroll,
            'element':this.element,
            'id':this.id,
            'starred': this.starred,
            'tags': this.tags,
            'faviconUrl': this.faviconUrl,
            'title': this.title
        }
    }
    clicked(event){
        //call background to run the open workflow
        if(this.buttons.includes(event.srcElement) || this.tagElements.includes(event.srcElement)){
            return;
        }
        if(this.url.length < 1){
            return;
        }
        chrome.runtime.sendMessage({
            type:"function",
            function:'openCheckpoint',
            checkpoint: this.getJSON()
        });
    }
    hover(){
        this.hideAllSmallButtons(); 
        this.showMySmallButtons();
    }
    unHover(){
        this.hideAllSmallButtons();    
    }
    hideAllSmallButtons(){
        document.querySelectorAll('.small-button').forEach(element => {
            element.style.display = 'none';
        });
    }
    showMySmallButtons(){
        for(var button of this.buttons){
            button.style.display = "inline-block"
        }
    }
    deleteMe(){
        if(confirm("Are you sure?")){
            this.el.remove();
            var id = this.id

            //remove from chrome storage
            chrome.storage.sync.get("checkpoints", function(result){
                var checkpoints = result.checkpoints;
                checkpoints = checkpoints.filter(function(c){return c.id != id});
                chrome.storage.sync.set({"checkpoints":checkpoints})
            });
        }
    }
    copyMe(){
        navigator.clipboard.writeText(this.selection);
    }
    starMe(){
        this.starred = true
    }
    tagMe(){
        var tag = prompt("Write your tag")
        if(tag.length > 0){
            this.tags.push(tag)
            this.addTag(tag)
            this.saveMe()
        }
        
    }
    hide(){
        this.el.style.display = "none";
    }
    show(){
        $(this.el).fadeIn()
        // this.el.style.display = "block";
    }
    search(keyword){
        var selectionContains = this.selection.includes(keyword);
        var urlContains = this.url.includes(keyword);
        var titleContains = this.title.includes(keyword);
        var tagsContain = this.tags.includes(keyword);
        return selectionContains || urlContains || titleContains || tagsContain
    }
    saveMe(){
        var json = this.getJSON();
        var id = this.id
        chrome.storage.sync.get("checkpoints", function(result){
            var current_checkpoints = result.checkpoints;
            for(var c in current_checkpoints){
                if(current_checkpoints[c].id == id){
                    current_checkpoints[c] = json //replace with new 
                }
            }
            chrome.storage.sync.set({"checkpoints": current_checkpoints}, function(res){
                console.log("Checkpoint " + id + " saved")
            })
        });
    }
    saveMeAsNew(){
        var json = this.getJSON()
        var id = this.id;
        chrome.storage.sync.get("checkpoints", function(result){
            var current_checkpoints = result.checkpoints;
            current_checkpoints.push(json)
            chrome.storage.sync.set({"checkpoints": current_checkpoints}, function(res){
                console.log("Checkpoint " + id + " saved")
            })
        });
        window.setTimeout(function(){
            chrome.runtime.sendMessage({
                type:"function",
                function:'reloadContextMenu',
            });
        },200)
        
    }

}