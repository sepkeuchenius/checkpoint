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
       saveSelection()
    }
    else if(command == "clear_checkpoints"){
        chrome.storage.sync.remove("checkpoints")
    }
    
});

function getSelection(){
    return window.getSelection().toString();
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
                    chrome.storage.sync.set({"checkpoints": current_checkpoints})
                })
            }
        });
      });
}
