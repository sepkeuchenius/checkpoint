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
        chrome.storage.sync.get({"checkpoints": []}, function(result){
            current_checkpoints = result.checkpoints;
            console.log(current_checkpoints);
            current_checkpoints.push(new Date().getTime());
            chrome.storage.sync.set({"checkpoints": current_checkpoints})
        })
    }
    else if(command == "clear_checkpoints"){
        chrome.storage.sync.remove("checkpoints")
    }
    
});