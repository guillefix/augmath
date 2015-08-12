// Reload webcam image
var working = null;
var current = null;
var imgUrl = null;
var waitTimeSec = 0;


function waitUntilNextLoad() {
	setTimeout("switchImage();", waitTimeSec * 1000);
}

function switchImage() {
	var tmp = current;
	current = working;
	working = tmp;
	current.onload = null;
	//current.style.zIndex = 1;
	current.style.display = 'block';
	loadNextImage();
}

function initWebcamImages(img1, img2, url)
{
	imgUrl = url;
	working = document.getElementById(img1);
	current = document.getElementById(img2);
	loadNextImage();
    switchImage();
}

function setWaitTime(timeSec) {
	waitTimeSec = timeSec;
}

function loadNextImage() {
	//working.style.zIndex = -1;
	working.style.display = 'none';
	working.onload = waitUntilNextLoad;
	working.src = imgUrl + (imgUrl.indexOf("?") != -1 ? "&" : "?") + "rnd="+Math.floor(Math.random()*1000000);
	//working.src = imgUrl + "&rnd="+Math.floor(Math.random()*1000000);
}

function onImageLoadError(img) {
  	setTimeout("loadNextImage();", 1000);
}
