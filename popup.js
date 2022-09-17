//constants
const MAX_CHECKPOINT_HEIGHT = 200;

allCheckpoints = []
function loadCheckpoints(){
  chrome.storage.sync.get("checkpoints", function(result){
    if(!result.checkpoints || result.checkpoints.length == 0){
      document.getElementById("checkpoints").innerHTML = "<center>Press CTRL + SHIFT + Y or CTRL + Y to add checkpoints from a website.</center>"
      return;
    }
      var checkpoints = result.checkpoints;
      checkpoints.reverse();
      var container = document.getElementById('checkpoints');
      for(point of checkpoints){
          console.log(point)
          //create checkpoint element
          checkpoint = new Checkpoint(point);
          checkpoint.draw(container);
          allCheckpoints.push(checkpoint)
      }
  })
}

window.onload = function(){
  loadCheckpoints();
  addSearchListener();
}


async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
function addSearchListener(){
  document.querySelector('#search').addEventListener('input', search)
  document.querySelector('#search').addEventListener('focus', search)
}
function search(event){
  value = event.srcElement.value;
  for(checkpoint of allCheckpoints){
    if(checkpoint.search(value)){
      checkpoint.show();
    }
    else{
      checkpoint.hide();
    }

  }

}