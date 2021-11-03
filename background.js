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
    // else if(command == "clear_checkpoints"){
    //     chrome.storage.sync.remove("checkpoints")
    // }
    
});


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

async function saveTab(){
    var current =  await getCurrentTab();
    var selection = await getTabSelection(current);
    var url = current.url;
    var scroll = await getTabScroll(current);
    //save the selection in chrome sync storage
    chrome.storage.sync.get({"checkpoints": []}, function(result){
        current_checkpoints = result.checkpoints;
        console.log(current_checkpoints);

        var checkpoint = {
            'created': new Date().getTime(),
            'selection': selection,
            'url': url,
            'scroll':  scroll,
            "id": (Math.random() * 10000).toFixed(0)
        }

        current_checkpoints.push(checkpoint);
        chrome.storage.sync.set({"checkpoints": current_checkpoints}, function(res){
            chrome.notifications.create({
                "title" : "Checkpoint saved",
                "message" : "Your checkpoint was saved succesfully",
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
    await scrollDown(checkpoint.scroll);
}

async function openWindow(url,to){
    await chrome.tabs.create({
        url: url
    })
}

async function scrollDown(to){
    //listen for the tab to be created
    chrome.tabs.onUpdated.addListener(function(tabId){
        chrome.scripting.executeScript({
            target :{tabId : tabId, allFrames : true,
            },
            args:[to],
            func: function(to){
                //scroll down
                window.onload = window.scrollTo(0, to)
            }
        });
        chrome.tabs.onUpdated.removeListener(arguments.callee)

    })
    
}


async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}
  
  