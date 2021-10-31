// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});


chrome.storage.sync.get("checkpoints", function(result){
    checkpoints = result.checkpoints;
    var now = new Date().getTime();
    for(point of checkpoints){
        console.log(point)
        //create checkpoint element
        var el = document.createElement('div');
        el.className = "checkpoint";
        el.id = point.url;

        var textEl = document.createElement('p');
        textEl.innerText = point.selection;
        textEl.className = 'selection';
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
    }
})

window.onload = function(){
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
function checkpointClick(e){
  if(e.target.className == 'selection' || e.target.className == 'small-button' || e.target.className == 'time'){
    window.open(e.target.parentElement.id)
  }
  // window.open(e.target.id)
}