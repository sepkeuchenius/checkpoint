var UPDATE_MESSAGE = "Right click paste & Quickly adding text notes!" //a small message shown to the user on update. 

chrome.commands.onCommand.addListener((command) => {
    console.log(`Command: ${command}`);
       if(command == 'save_checkpoint' || command == 'save_checkpoint_alt'){
       saveTab()
    }
    // else if(command == "clear_checkpoints"){
    //     chrome.storage.sync.remove("checkpoints")
    // } 
});
chrome.runtime.onUpdateAvailable.addListener(() => {
    buildNotification("Update!", "There is an update available for Chekpoint. Restarting now.")
    chrome.runtime.reload()
})
chrome.runtime.onInstalled.addListener((details) => {
    if(details.reason == "install"){
        buildNotification("Welcome to Checkpoint!", "To save a webpage, press CTRL + SHIFT + Y, or ALT + SHIFT + Y. You can also use the right click menu.")
        startExtension()
    }
    else if(details.reason == 'update'){
        buildNotification("Checkpoint has been updated!", UPDATE_MESSAGE)
        startExtension()
    }
})
chrome.contextMenus.onClicked.addListener(async (onClickData, tab) => {
    if(onClickData["menuItemId"] == "add_to_checkpoint"){
        saveTab(tab)
    } 
    else if(onClickData["menuItemId"] == "add_selection_to_checkpoint"){
        saveTab(tab)
    }
    else if(onClickData["menuItemId"].includes("paste_selection_")){ 
        console.log("pasting selection")
        await pasteSelection(onClickData["menuItemId"].replace("paste_selection_", ""), tab)
    }
    else if(onClickData["menuItemId"] == "paste_all_selections"){
        console.log("pasting all selections")
        allSelections = ""
        chrome.storage.sync.get("checkpoints", function(result){
            if(result.checkpoints && result.checkpoints.length > 0){  
                allSelections = result.checkpoints.map((checkpoint) => {return checkpoint.selection}).join("\n")
            }
            pasteSelection(allSelections, tab)
        }
        );
    }
})

async function pasteSelection(text, tab){
    var current =  await getCurrentTab();
    if(current.url.includes("chrome://")){
        buildNotification("Oops", "Chrome does not allow you to paste on this page.")
        return
    }
    console.log(text)
    chrome.scripting.executeScript({
        target: {tabId:tab.id},
        func: insertSelection,
        args: [text],
    }).then(injectionResults => {
        console.log(injectionResults)
        for (const {frameId, result} of injectionResults) {
          if (result != text){
            buildNotification("Oops", "Could not paste the content.")
          }
        }
    }).catch((err)=>{
        console.log(err)
    });
}


function insertSelection(text){
    console.log(text)
    document.activeElement.value += text;
    return text
}

function getSelectedElement(isStart = true) {
    var range, sel, container;
    if (document.selection) {
        range = document.selection.createRange();
        range.collapse(isStart);
        console.log(range)
        console.log(range.extractContents())
        return range.parentElement();
    } else {
        sel = window.getSelection();
        if (sel.getRangeAt) {
            if (sel.rangeCount > 0) {
                range = sel.getRangeAt(0);
                console.log(range)
                ancestor = range.commonAncestorContainer;
                while(!ancestor.id && ancestor.parentNode){
                    ancestor = ancestor.parentNode
                }
                return ancestor.id
    }
        } else {
            // Old WebKit
            range = document.createRange();
            range.setStart(sel.anchorNode, sel.anchorOffset);
            range.setEnd(sel.focusNode, sel.focusOffset);
            console.log(range)
            // Handle the case when the selection was selected backwards (from the end to the start in the document)
            if (range.collapsed !== sel.isCollapsed) {
                range.setStart(sel.focusNode, sel.focusOffset);
                range.setEnd(sel.anchorNode, sel.anchorOffset);
            }
       }

        if (range) {
           container = range[isStart ? "startContainer" : "endContainer"];

           // Check if the container is a text node and return its parent if so
           return container.nodeType === 3 ? container.parentNode : container;
        }   
    }
}
function getSelection(){
    return window.getSelection().toString();
}
function getScroll(){
    return window.pageYOffset;
}

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }


async function getTabSelection(tab) {
    let [result] = await chrome.scripting.executeScript(
        {
          target: {tabId: tab.id, allFrames: true},
          func: getSelection,
        });
    return result.result;
}

async function getTabScroll(tab) {
    let [result] = await chrome.scripting.executeScript(
        {
          target: {tabId: tab.id, allFrames: true},
          func: getScroll,
        });
    return result.result;
}

async function getTabSelectedElement(tab) {
    let [result] = await chrome.scripting.executeScript(
        {
          target: {tabId: tab.id, allFrames: true},
          func: getSelectedElement,
        });
    return result.result;
}


async function saveTab(tab){
    if(!tab){
        var current =  await getCurrentTab();
    }
    else{
        var current = tab;
    }
    if(current.url.includes("chrome://")){
        buildNotification("Oops", "Chrome does not allow you to make a checkpoint of this page.")
        return
    }
    try {
        var selection = await getTabSelection(current);
        var url = current.url;
        var title = current.title;
        var scroll = await getTabScroll(current);
        var element = await getTabSelectedElement(current);
        var faviconUrl = current.favIconUrl;
        chrome.storage.sync.get({"checkpoints": []}, function(result){
            current_checkpoints = result.checkpoints;
            var checkpoint = {
                'created': new Date().getTime(),
                'selection': selection,
                'url': url,
                'scroll':  scroll,
                "id": (Math.random() * 10000).toFixed(0),
                "element":element,
                "title":title,
                "faviconUrl": faviconUrl,
                "tags": [],
                "starred": false
            }
            current_checkpoints.push(checkpoint);
            chrome.storage.sync.set({"checkpoints": current_checkpoints}, function(res){
                buildNotification("Done!", "Checkpoint created.")
            })
        });
    }
    catch(err){
        console.log(err)
        buildNotification("Oops.","Can't make a Checkpoint from here. Sorry.")
    }
    setTimeout(reloadContextMenu, 400)
}
var functionMapping = 
{
    'scroll': scrollDown
};


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log('called')
      if (request.type === "function"){
        if(request.function == 'openCheckpoint'){
            //open checkpoint request from extension script
            openCheckpoint(request.checkpoint);
        }
        if(request.function == 'reloadContextMenu'){
            //open checkpoint request from extension script
            reloadContextMenu();
        }
    }
        sendResponse({success: true});
    }
  );

async function openCheckpoint(checkpoint){
    //open window and scroll down
    //listen for the tab to be created
    console.log(checkpoint)
    chrome.tabs.onUpdated.addListener(async function(tabId){
        await scrollDown(checkpoint.scroll,checkpoint.element, tabId);
        await selectRange(checkpoint.element, tabId);
        
        //remove the listener
        chrome.tabs.onUpdated.removeListener(arguments.callee)
    })
    await openWindow(checkpoint.url, checkpoint.scroll);
}

async function openWindow(url,to){
    await chrome.tabs.create({
        url: url
    })
}

async function scrollDown(to,element, tabId){
    await chrome.scripting.executeScript({
        target :{tabId : tabId, allFrames : true,
        },
        args:[to, element],
        func: function(to, element){
            //scroll down
            window.onload = window.scrollTo(0, to);  
        }
    });   
}

async function selectRange(element, tabId){
    if(!element){console.log('no element')}
    await chrome.scripting.executeScript({
        target :{tabId : tabId, allFrames : true,
        },
        args:[element],
        func: function(element){
            //scroll down
            var element = document.querySelector("#"+element)
            window.onload = function(){
                element.style.border = "3px solid blue";   
                element.scrollIntoView({block:"center"})
            }
        }
    });  
}

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function buildNotification(title, content){
    chrome.notifications.create({
        "title" : title,
        "message" : content,
        "iconUrl": "checkpoint_128.png",
        "type": "basic",
    })
}
  
function startExtension(){
    reloadContextMenu()
}
function reloadContextMenu(){
    //create the context menu
    chrome.contextMenus.removeAll()
    chrome.contextMenus.create({
        "title":"Add to Checkpoint",
        "id": "add_to_checkpoint",
    }),
    chrome.contextMenus.create({
        "title": "Add to Checkpoint",
        "id": "add_selection_to_checkpoint",
        "contexts": ["selection"]
    })
    chrome.storage.sync.get("checkpoints", function(result){
        if(result.checkpoints && result.checkpoints.length > 0){      
            //create parent paste menu
            chrome.contextMenus.create({
                "id": "paste_checkpoints",
                "title": "Paste Checkpoint",
                "contexts": ["editable"]
            })  
            var checkpoints = result.checkpoints;
            checkpoints.reverse();

            for(point of checkpoints){
                if(point["selection"] && point["selection"].length > 0){
                    chrome.contextMenus.create({
                        "title": point['selection'],
                        "parentId": "paste_checkpoints",
                        "id": "paste_selection_" + point['selection'],
                        "contexts": ["editable"]
                    })
                }
            }
            chrome.contextMenus.create({
                "title": "Paste all",
                "parentId": "paste_checkpoints",
                "id": "paste_all_selections",
                "contexts": ["editable"]
            })
        }
        //

    })
}