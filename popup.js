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
      var now = new Date().getTime();
      checkpoints.reverse();
      console.log(checkpoints)

      for(point of checkpoints){
          console.log(point)
          //create checkpoint element
          var el = document.createElement('div');
          el.className = "checkpoint";
          if(point["id"]){
            el.id = point.id;
          }
          var textEl = document.createElement('p');
          textEl.innerText = point.selection;
          textEl.className = 'selection';
          el.appendChild(textEl)

          
          var textEl = document.createElement('p');
          textEl.innerText = getURLBase(point.url);
          textEl.className = 'url';
          el.appendChild(textEl)
          

          //create sub elements
          var time = document.createElement('p');
          
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
          
            
          time.className = "time"
          time.innerText = ago;

          el.appendChild(time)


          //create buttons 
          var del = document.createElement('button');
          var copy = document.createElement('button');

          del.innerText = "Delete";
          copy.innerText = "Copy";

          del.className = "small-button"
          copy.className = "small-button"

          del.style.right = "4px";
          copy.style.right = "49px";


          el.appendChild(del)
          el.appendChild(copy)

          document.getElementById("checkpoints").appendChild(el);

          truncateCheckpoint(el);

          addListeners()
      }
  })
}

window.onload = function(){
  loadCheckpoints();
  addListeners();
}

function addListeners(){
  document.querySelectorAll('.checkpoint').forEach(element => {
    element.addEventListener('mouseenter', checkpointHover);
    element.addEventListener('mouseleave', checkpointHoverOut);
    element.addEventListener('click', checkpointClick);
  })


}
function checkpointHover(e){
  document.querySelectorAll('.small-button').forEach(element => {
    element.style.display = 'none';
  }); 
  e.srcElement.querySelectorAll('.small-button').forEach(element => {
    element.style.display = 'inline-block';
  });
}
function checkpointHoverOut(e){
  document.querySelectorAll('.small-button').forEach(element => {
    element.style.display = 'none';
  }); 
}
async function checkpointClick(e){
  //get the clicked checkpoint id
  var id = null
  if(e.target.className == 'selection' || e.target.className == 'small-button' || e.target.className == 'time'){
    id = e.target.parentElement.id;
  }
  else{
    id = e.target.id
  }
  //get the checkpoint
  var checkpoint = checkpoints.filter(function(c){return c.id == id});
  
  if(checkpoint.length > 0){
    checkpoint = checkpoint[0]
    //call background to run the open workflow
    chrome.runtime.sendMessage({
      type:"function",
      function:'openCheckpoint',
      checkpoint: checkpoint
    }, function(response) {
      console.log(response.success);
    });
    
  }
  
  
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




function getURLBase(url){
  if(url.includes("//")){
    url = url.split("//")[1];
  }
  return url.split("/")[0]
}
function getCheckpointBase(checkpoint){
  var el = document.createElement('p');
  el.innerText = checkpoint;
  el.style.width = "200px";
  document.body.appendChild(el)
  console.log(el.offsetHeight);

  if(checkpoint.length > 140){
    checkpoint = checkpoint.substring(0,140) + '...';
  }
  return checkpoint;
}

function truncateCheckpoint(el){
  //the element has been pushed to the extension
  //but it might be too high

  //we decrease the length of the string until we reach a desired height
  var checkText = el.querySelector(".selection");
  length = checkText.innerText.length
  while(el.offsetHeight > MAX_CHECKPOINT_HEIGHT){
    length -= 10
    //only add the dots if actually decreased in size
    checkText.innerText = checkText.innerText.substring(0,length) + "..."
  }

}