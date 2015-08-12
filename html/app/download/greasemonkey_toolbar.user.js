// ==UserScript==
// @name           PAW - Toolbar
// @namespace      http://www.fun2code.de
// @include        http://*
// ==/UserScript==

/*
	0.3:    "Set as Phone Bookmark" button added
	0.2.5:  Add toolbar to the beginning of page only if it is the top frame
	0.2:    Added Google Maps support
	0.1:    Initial version
*/

function settings() {
  var value;
  if(typeof(GM_getValue("paw_settings")) == "undefined") {
   	value = "http://<ip>:<port>";
  }
  else {
	value = GM_getValue("paw_settings");

  }

  value = prompt("PAW IP Address and Port:", value);

  if(value != null) {
  	GM_setValue("paw_settings", value);
  }
}

GM_registerMenuCommand("PAW Toolbar Settings", settings);

pawOpenUriHref = GM_getValue("paw_settings") + "/app/execute_script.xhtml?script=openUri(\"@\")";
pawSaveBookmarkHref = GM_getValue("paw_settings") + "/app/execute_script.xhtml?script=saveBookmark(\"@1\", \"@2\")";


// Hidden iframe
pawIframe = document.createElement("iframe");
pawIframe.setAttribute("id", "pawIframe");
pawIframe.setAttribute("style", "width:0; height: 0; visibility:hidden;");
pawIframe.setAttribute('src', '');
document.body.appendChild(pawIframe);

// Add top div
pawHtmlDiv = document.createElement("div");
pawHtmlDiv.setAttribute("style", "text-align: right; border: 1px solid black; width: 100%; background: lightgray;");
pawHtmlDiv.innerHTML = "" +
// Save bookmark
"<a id='pawSaveBookmarkHref' href='" + pawSaveBookmarkHref +  "' target='pawIframe' style='visible: false;'></a><button title='Set as Phone Bookmark' onClick=\"pawSaveBookmarkHref = document.getElementById('pawSaveBookmarkHref').getAttribute('href'); pawSaveBookmarkHref = pawSaveBookmarkHref.replace(/@1/, escape(document.title)).replace(/@2/, escape(document.location.href)); document.getElementById('pawIframe').setAttribute('src', pawSaveBookmarkHref);\"><img src='" + GM_getValue("paw_settings") + "/app/images/star32.png' style='width: 20px; height: 20px;'></button>" +
// Send to phone button
"<a id='pawOpenUriHref' href='" + pawOpenUriHref +  "' target='pawIframe' style='visible: false;'></a><button title='Send to Phone' onClick=\"pawOpenUriHref = document.getElementById('pawOpenUriHref').getAttribute('href'); pawOpenUriHref = (document.location.href.match(/^http:\\/\\/maps\\.google\\./) && document.getElementById('link') != null) ? pawOpenUriHref.replace(/@/, escape(document.getElementById('link').getAttribute('href'))) : pawOpenUriHref.replace(/@/, escape(document.location.href)); document.getElementById('pawIframe').setAttribute('src', pawOpenUriHref);\"><img src='" + GM_getValue("paw_settings") + "/app/images/phone.png' style='width: 20px; height: 20px;'></button>" +
// Clear iframe
 "<script language='javascript'>document.getElementById('pawIframe').setAttribute('src', '');</script>";

// Add toolbar to the beginning of page only if it is the top frame
if(top.location == document.location) {
	document.body.insertBefore(pawHtmlDiv,document.body.childNodes[0]);
}
