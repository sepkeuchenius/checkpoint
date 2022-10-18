//constants
const MAX_CHECKPOINT_HEIGHT = 200;
const DEFAULT_SETTINGS = [
  {
    "name": "Color-theme",
    "values": [
      "Light",
      "Dark"
    ],
    "current": "Light"
  },
  {
    "name": "Checkpoint order",
    "values": [
      "Newest first",
      "Oldest first"
    ],
    "current": "Newest first"
  }
]
allCheckpoints = []

function reloadCheckpoints(){
  document.getElementById("checkpoints").innerHTML = "";
  loadCheckpoints()
}
function loadCheckpoints(){
  chrome.storage.sync.get("checkpoints", function(result){
    if(!result.checkpoints || result.checkpoints.length == 0){
      document.getElementById("checkpoints").innerHTML = "<center>Press CTRL + SHIFT + Y or Alt + Shift + Y to add checkpoints from a website.</center>"
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


function loadSettings(){
  chrome.storage.sync.get("settings", function(result){
    if(!result.settings){
      chrome.storage.sync.set({"settings":DEFAULT_SETTINGS}, loadSettings)
    }
    else{
      for(setting of result.settings){
        console.log(setting)
        new Setting(setting);
      }
    }
  })
}



window.onload = function(){
  loadCheckpoints();
  loadSettings()
  addSearchListener();
  addNoteListener();
  addMenuButtonListener();
  $('item')[0].click()
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
function addNoteListener(){
  document.querySelector('#add_note').addEventListener('keypress', addNote)
}

function addMenuButtonListener(){
  document.querySelector('#menu').addEventListener('click', toggleSidebar)
  $("item").on("click", openPage)
}
function toggleSidebar(){
  $("sidebar").toggle("slide")
}
function hideSidebar(){
  $("sidebar").hide("slide")
}
function openPage(event){
  var clickedPage = event.currentTarget.innerText; 
  var pages = {
    "Home": "#checkpoints_container",
    "Settings": "#settings",
    "Feedback": "#feedback",
    "Help": "#howto",
  }
  for(page in pages){
    $(pages[page]).hide();
  }
  $(pages[clickedPage]).show()
  $('sidebar').hide()
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
function addNote(event){
  if(event.key == "Enter"){
    checkpoint = new Checkpoint({"selection": event.srcElement.value})
    checkpoint.saveMeAsNew()
    window.setTimeout(reloadCheckpoints, 200)
  }
}
