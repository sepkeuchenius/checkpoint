// background.js

let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %cgreen', `color: ${color}`);
    // chrome.storage.sync.set({"checkpoints": []})
});

chrome.commands.onCommand.addListener((command) => {
    console.log(`Command: ${command}`);
       if(command == 'save_checkpoint'){
       saveTab()
    }
    else if(command == "clear_checkpoints"){
        chrome.storage.sync.remove("checkpoints")
    }
    
});
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
function saveSelection(){
   return chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        if(tabs.length == 0){
            return false;
        }
        chrome.scripting.executeScript(
            {
              target: {tabId: tabs[0].id, allFrames: true},
              func: getSelection,
            },
            (injectionResults) => {
              for (const frameResult of injectionResults){
                console.log('Selection: ' + frameResult.result);
                
                //save the selection in chrome sync storage
                chrome.storage.sync.get({"checkpoints": []}, function(result){
                    current_checkpoints = result.checkpoints;
                    console.log(current_checkpoints);

                    var checkpoint = {
                        'created': new Date().getTime(),
                        'selection': frameResult.result,
                        'url': tabs[0].url
                    }

                    current_checkpoints.push(checkpoint);
                    chrome.storage.sync.set({"checkpoints": current_checkpoints}, function(res){
                        chrome.notifications.create({
                            "title" : "Checkpoint saved",
                            "message" : "Your checkpoint was saved succesfully",
                            "iconUrl": "icon_128_mc_2.png",
                            "type": "basic"
                        })
                    })
                })
            }
        });
      });
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


async function saveTab(){
    var current =  await getCurrentTab();
    var selection = await getTabSelection(current);
    var url = current.url;
    var title = current.title;
    var scroll = await getTabScroll(current);
    var element = await getTabSelectedElement(current);
    // var selectedElement = getSelectedElement(true);
    //save the selection in chrome sync storage
    chrome.storage.sync.get({"checkpoints": []}, function(result){
        current_checkpoints = result.checkpoints;
        console.log(current_checkpoints);

        var checkpoint = {
            'created': new Date().getTime(),
            'selection': selection,
            'url': url,
            'scroll':  scroll,
            "id": (Math.random() * 10000).toFixed(0),
            "element":element,
            "title":title
        }

        current_checkpoints.push(checkpoint);
        chrome.storage.sync.set({"checkpoints": current_checkpoints}, function(res){
            chrome.notifications.create({
                "title" : "Checkpoint saved",
                "message" : "Your checkpoint was saved succesfully" + res,
                "iconUrl": "icon_128_mc_2.png",
                "type": "basic",
            })
        })
    });
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
    }
        sendResponse({success: true});
    }
  );

async function openCheckpoint(checkpoint){
    //open window and scroll down
    await openWindow(checkpoint.url, checkpoint.scroll);
    //listen for the tab to be created
    console.log(checkpoint)
    chrome.tabs.onUpdated.addListener(async function(tabId){
        await scrollDown(checkpoint.scroll,checkpoint.element, tabId);
        await selectRange(checkpoint.element, tabId);
        
        //remove the listener
        chrome.tabs.onUpdated.removeListener(arguments.callee)
    })

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
            // window.onload = window.scrollTo(0, to);  
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
            element.style.border = "3px solid blue";   
            element.scrollIntoView({block:"center"})
        }
    });  
}

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}
  
  