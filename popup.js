// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});


chrome.storage.sync.get("checkpoints", function(result){
    checkpoints = result.checkpoints;
    for(point of checkpoints){
        console.log(point)
        var el = document.createElement('div');
        el.innerText = point.selection;
        document.getElementById("checkpoints").appendChild(el);
    }
})