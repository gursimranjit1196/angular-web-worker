// chrome.browserAction.onClicked.addListener(function(tab) {
// 	if(!tab.incognito){
//   		chrome.tabs.create({url: 'index.html'}) ;
// 	}
// });
chrome.browserAction.onClicked.addListener(function(tab) {
	if(!tab.incognito){
      chrome.windows.create({
        // Just use the full URL if you need to open an external page
        url: chrome.runtime.getURL("index.html"),
        // type: 'panel',
        focused: true
      }, function(win) {
        // win represents the Window object from windows API
        // Do something after opening
      });
	}
});