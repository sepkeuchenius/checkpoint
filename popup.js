// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});

const MAX_CHECKPOINT_HEIGHT = 100;

checkpoints = []
function loadCheckpoints(){
  chrome.storage.sync.get("checkpoints", function(result){
      checkpoints = result.checkpoints;
      checkpoints.reverse();
      console.log(checkpoints)
      var container = document.getElementById('checkpoints');
      for(point of checkpoints){
          console.log(point)
          //create checkpoint element
          checkpoint = new Checkpoint(point);
          checkpoint.draw(container);

          // addListeners()
      }
  })
}

window.onload = function(){
  loadCheckpoints();
  // addListeners();
}



async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.type == 'function'){
      if(request.function == 'openWindow'){
        window.open(request.url);
        window.setTimeout(function(){
          sendResponse({success:true})
        },500)
      }
    }
  });


