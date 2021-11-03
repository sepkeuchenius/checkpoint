function getURLBase(url){
    if(url.includes("//")){
      url = url.split("//")[1];
    }
    return url.split("/")[0]
}