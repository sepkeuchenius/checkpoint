import { getUserInfo, login, signOutUser } from "./login.js"
import $ from "jquery"
import { Checkpoint } from "./checkpoint.js";
import { getCheckpoints, setInitialCheckpointList, syncCheckpointsToChrome } from "./db.js";
import { Settings, UNSET } from "./settings.js";
//constants

var allCheckpoints = []

function reloadCheckpoints() {
  document.getElementById("checkpoints").innerHTML = "";
  loadCheckpoints()
}
function loadCheckpoints() {
  getCheckpoints().then((checkpoints) => {
    if (checkpoints && checkpoints.length > 0) {
      document.getElementById("checkpoints").innerHTML = ""
      var container = document.getElementById('checkpoints');
      for (var point of checkpoints) {
        console.log(point)
        //create checkpoint element
        var checkpoint = new Checkpoint(point);
        checkpoint.draw(container);
        allCheckpoints.push(checkpoint)
      }
    }
    else {
      setInitialCheckpointList()
    }
  })
}


window.onload = async function () {
  loadSettings()
  loadCheckpoints();
  addSearchListener();
  addNoteListener();
  addMenuButtonListener();
  addSettingsListeners();
  $('item')[0].click()
}


async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
function addSearchListener() {
  document.querySelector('#search').addEventListener('input', search)
  document.querySelector('#search').addEventListener('focus', search)
}
function addNoteListener() {
  document.querySelector('#add_note').addEventListener('keypress', addNote)
}

function addMenuButtonListener() {
  document.querySelector('#menu').addEventListener('click', toggleSidebar)
  $("item").on("click", openPage)
}
function toggleSidebar() {
  $("sidebar").toggle("slide")
}
function hideSidebar() {
  $("sidebar").hide("slide")
}
function openPage(event) {
  var clickedPage = event.currentTarget.innerText;
  var pages = {
    "Home": "#checkpoints_container",
    "Settings": "#settings",
    "Feedback": "#feedback",
    "Help": "#howto",
  }
  for (var page in pages) {
    $(pages[page]).hide();
  }
  $(pages[clickedPage]).show()
  $('sidebar').hide()
}

function search(event) {
  const value = event.srcElement.value;
  for (var checkpoint of allCheckpoints) {
    if (checkpoint.search(value)) {
      checkpoint.show();
    }
    else {
      checkpoint.hide();
    }

  }
}
function addNote(event) {
  if (event.key == "Enter") {
    var checkpoint = new Checkpoint({ "selection": event.srcElement.value })
    checkpoint.saveAsNew()
    var container = document.getElementById('checkpoints');
    checkpoint.draw(container)
    // window.setTimeout(reloadCheckpoints, 200)
    //remove content from input bar
    event.srcElement.value = ""
  }
}

async function loadSettingsPage() {
  const user_settings = new Settings()
  await user_settings.load()
  console.log(user_settings)
  $("#google").prop("checked", user_settings.google && user_settings.google != UNSET)
  $("#sync_local").prop("checked", user_settings.sync_local && user_settings.sync_local != UNSET)
  if (user_settings.google) {
    $("#sync_local").show();
    $("#sync_local_label").show();
    const user_info = await getUserInfo();
    if (user_info.currentUser) {
      $("#loggedin").show()
      $("#google_user").text(user_info.currentUser.email)
    }
  }
  else {
    $("#loggedin").hide()
    $("#sync_local").hide()
    $("#sync_local_label").hide()
  }
}

async function loadFirebase() {
  const user_settings = new Settings()
  await user_settings.load()
  if (user_settings.google && user_settings.google != UNSET) {
    await login();
    updateFooter();
    loadCheckpoints();
  }
  else if (user_settings.google != UNSET) {
    // user does not want google.
    $("footer").remove()
  }
}

function updateFooter() {

  const auth = getUserInfo()
  console.log(auth)
  if (auth.currentUser) {
    console.log('yeaaah')
    $("footer").text(`Logged in as ${auth.currentUser.email}`)
    $("footer").fadeOut(1000)
  }
}


function addSettingsListeners() {
  $("#google").on('change', changeGoogleSetting)
  $("#loginlink").on('click', login)
  $("#nogoogle").on('click', changeGoogleSetting)
  $("#sync_local").on('change', changeLocalSyncSetting)
}
async function changeLocalSyncSetting() {
  const user_settings = new Settings()
  await user_settings.load()
  user_settings.sync_local = $("#sync_local").is(":checked")
  console.log(user_settings)
  await user_settings.save()
  loadSettingsPage();
  if (user_settings.sync_local) {
    await syncCheckpointsToChrome()
  }
}
async function changeGoogleSetting() {
  const user_settings = new Settings()
  await user_settings.load()
  user_settings.google = $("#google").is(":checked")
  await user_settings.save()
  if (user_settings.google) {
    await login();
  }
  else {
    syncCheckpointsToChrome().then((res) => {
      if (res) {
        hideSidebar()
        reloadCheckpoints()
      }
      else {
        alert("Remove some Checkpoints to turn off Google Sync.")
        user_settings.google = true
        user_settings.save().then(() => {
          loadSettingsPage();
        });
      }
    });
  }
  loadSettingsPage();
  loadFirebase();
}

async function loadSettings() {
  await loadFirebase();
  loadSettingsPage();
}


async function getCurrentTabHistory() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  let tabHistory = await chrome.history.search({ text: '', maxResults: 10, startTime: 0, endTime: Date.now(), 'tabId': tab.id });
  return tabHistory;
}

// Example usage:
// getCurrentTabHistory().then(history => {
//   console.log(history);
// });