// ==UserScript==
// @name           PAW - Android Market
// @namespace      http://www.fun2code.de
// @include        http://*
// ==/UserScript==

/*
  Changes Android Market links (market://...) links to point to the PAW server.
  This allows to directly open mark links on the Android device.

  Version: 0.1 
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

GM_registerMenuCommand("PAW Market Settings", settings)



var allLinks, thisLink;
allLinks = document.evaluate(
    '//a[@href]',
    document,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null);

// Hidden iframe
pawIframe = document.createElement("iframe");
pawIframe.setAttribute("name", "pawIframe");
pawIframe.setAttribute("style", "width:0; height: 0; visibility:hidden;");
pawIframe.setAttribute('src', '');

document.body.appendChild(pawIframe);

for (var i = 0; i < allLinks.snapshotLength; i++) {
    thisLink = allLinks.snapshotItem(i);

    if(thisLink.getAttribute("href").match(/^market:\/\//)) {
	 thisLink.setAttribute("href", GM_getValue("paw_settings") + "/app/execute_script.xhtml?script=openUri(\"" + escape(thisLink.getAttribute("href")) + "\")");
	 thisLink.setAttribute("target", "pawIframe");
    }
}
