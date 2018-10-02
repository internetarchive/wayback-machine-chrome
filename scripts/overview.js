//Used to extact the current URL
function getUrlByParameter(name){
    var url=window.location.href;
    var indexOfEnd=url.length;
    var index=url.indexOf(name);
    var length=name.length;
    return url.slice(index+length+1,indexOfEnd);
}

var url=getUrlByParameter('url');
var xhr0=new XMLHttpRequest();
var new_url="https://archive.org/services/context/metadata?url="+url;
xhr0.open("GET",new_url,true);
xhr0.onload=function(){
    var type=JSON.parse(xhr0.response).type;
    document.getElementById("details").innerHTML=type;
    var captures=JSON.parse(xhr0.response).captures;
    var total="";
    for (var key in captures) {
        if (captures.hasOwnProperty(key)) {
            data=captures[key];
            total=parseInt(total+(data['text/html']));
        }
    }
    total=total.toLocaleString();
    document.getElementById("total_archives").innerHTML=total;
    document.getElementById("save_now").href="https://web.archive.org/save/"+url;
}
xhr0.send(null);

var xhr1=new XMLHttpRequest();
var new_url="http://web.archive.org/cdx/search?url="+url+"&limit=1&output=json";
xhr1.open("GET",new_url,true);
xhr1.send(null);
xhr1.onload=function(){
    var data=JSON.parse(xhr1.response);
    if(data.length==0){
        document.getElementById("first_archive_date").innerHTML="( Data is not available -Not archived before )";
        document.getElementById("first_archive_date_2").innerHTML="( Data is not available -Not archived before )";
        document.getElementById("first_archive_time").innerHTML="( Data is not available-Not archived before )";
        document.getElementById("link_first").href="https://web.archive.org/web/0/"+url;
    }else {
        var timestamp=data[1][1];
        var date=timestamp.substring(4,6)+'/'+timestamp.substring(6,8)+'/'+timestamp.substring(0,4);
        var time=timestamp.substring(8,10)+'.'+timestamp.substring(10,12)+'.'+timestamp.substring(12,14)
        document.getElementById("first_archive_date").innerHTML="( "+date+" )";
        document.getElementById("first_archive_date_2").innerHTML="( "+date+" )";
        document.getElementById("first_archive_time").innerHTML="( "+time+" ) according to Universal Time Coordinated (UTC)";
        document.getElementById("link_first").href="https://web.archive.org/web/0/"+url;
    }
}

var xhr2=new XMLHttpRequest();
var new_url="http://web.archive.org/cdx/search?url="+url+"&limit=-1&output=json";
xhr2.open("GET",new_url,true);
xhr2.send(null);
xhr2.onload=function(){
    var data=JSON.parse(xhr2.response);
    if(data.length==0){
        document.getElementById("recent_archive_date").innerHTML="( Data is not available -Not archived before )";
        document.getElementById("recent_archive_time").innerHTML="( Data is not available-Not archived before )";
        document.getElementById("link_recent").href="https://web.archive.org/web/2/"+url;
    }else {
        var timestamp=data[1][1];
        var date=timestamp.substring(4,6)+'/'+timestamp.substring(6,8)+'/'+timestamp.substring(0,4);
        var time=timestamp.substring(8,10)+'.'+timestamp.substring(10,12)+'.'+timestamp.substring(12,14)
        document.getElementById("recent_archive_date").innerHTML="( "+date+" )";
        document.getElementById("recent_archive_time").innerHTML="( "+time+") according to Universal Time Coordinated (UTC)";
        document.getElementById("link_recent").href="https://web.archive.org/web/2/"+url;
    }
}

url = url.replace(/^https?:\/\//,'');
var index=url.indexOf('/');
url=url.substring(0,index);
var xhr3=new XMLHttpRequest();
var new_url="https://web.archive.org/thumb/"+url;
xhr3.open("GET",new_url,true);
xhr3.onload=function(){
    if(this.response.size!=233){
        var img = document.createElement('img');
        var url = window.URL || window.webkitURL;
        img.src = url.createObjectURL(this.response);
        var show_thumbnail=document.getElementById("show_thumbnail");
        show_thumbnail.appendChild(img);
    }
    else{
        document.getElementById("show_thumbnail").innerHTML="Thumbnail not found";
    }
}
xhr3.onerror=function(){
    document.getElementById("show_thumbnail").innerHTML="Thumbnail not found";
};
xhr3.ontimeout = function() {
    document.getElementById("show_thumbnail").innerHTML="Please refresh the page...Time out!!";
}
xhr3.responseType = 'blob';
xhr3.send(null);