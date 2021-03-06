class Checkpoint{
    constructor(obj){
        this.id = obj.id;
        this.url = obj.url;
        this.selection = obj.selection;
        this.scroll = obj.scroll;
        this.element = obj.element;
        this.title = obj.title;
        this.faviconUrl = obj.faviconUrl;
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
        var textEl = document.createElement('p');
        textEl.innerText = getURLBase(this.url) + " | " + this.title;
        textEl.className = 'url';
        this.urlElement = textEl;
        this.el.appendChild(textEl)
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
        var seconds_ago = (now - point.created) / 1000
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
    addButtons(){
        var del = document.createElement('button');
        var copy = document.createElement('button');

        del.innerText = "Delete";
        copy.innerText = "Copy";

        del.className = "small-button"
        copy.className = "small-button"

        del.onclick = this.deleteMe.bind(this);
        copy.onclick = this.copyMe.bind(this);

        del.style.right = "4px";
        copy.style.right = "49px";

        this.deleteButton  = del
        this.copyButton = copy

        this.el.appendChild(del)
        this.el.appendChild(copy)
    }
    draw(container){
        this.createElement();
        this.createSelectionText();
        this.createUrlText();
        this.createTimeText();
        this.addButtons()
        if(this.faviconUrl){
            this.createIcon();
        }
        this.container = container;
        container.appendChild(this.el);
        this.truncate();
        this.addListeners();
    }
    truncate(){
        //the element has been pushed to the extension
        //but it might be too high

        //we decrease the length of the string until we reach a desired height
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
        }
    }
    clicked(event){
        //call background to run the open workflow
        if(event.srcElement == this.deleteButton || event.srcElement == this.copyButton){
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
        this.deleteButton.style.display = 'inline-block';
        this.copyButton.style.display = 'inline-block';
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
    hide(){
        this.el.style.display = "none";
    }
    show(){
        this.el.style.display = "block";
    }
    search(keyword){
        var selectionContains = this.selection.includes(keyword);
        var urlContains = this.url.includes(keyword);
        var titleContains = this.title.includes(keyword);
        return selectionContains || urlContains || titleContains
    }

}