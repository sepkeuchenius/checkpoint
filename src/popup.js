import {login} from "./login.js"
import $ from "jquery"
import { Checkpoint } from "./checkpoint.js";
//constants
const MAX_CHECKPOINT_HEIGHT = 200;

var allCheckpoints = []

function reloadCheckpoints(){
  document.getElementById("checkpoints").innerHTML = "";
  loadCheckpoints()
}
function loadCheckpoints(){
  chrome.storage.sync.get("checkpoints", function(result){
    if(result.checkpoints && result.checkpoints.length > 0){
      document.getElementById("checkpoints").innerHTML = ""
      var checkpoints = result.checkpoints;
      var container = document.getElementById('checkpoints');
      for(var point of checkpoints){
          console.log(point)
          //create checkpoint element
          var checkpoint = new Checkpoint(point);
          checkpoint.draw(container);
          allCheckpoints.push(checkpoint)
      }
    }
    else {
      chrome.storage.sync.set({"checkpoints": []})
    }
  })
}


window.onload = function(){
  login()
  loadCheckpoints();
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
  for(var page in pages){
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
    var checkpoint = new Checkpoint({"selection": event.srcElement.value})
    checkpoint.saveMeAsNew()
    var container = document.getElementById('checkpoints');
    checkpoint.draw(container)
    // window.setTimeout(reloadCheckpoints, 200)
    //remove content from input bar
    event.srcElement.value = ""
  }
}
