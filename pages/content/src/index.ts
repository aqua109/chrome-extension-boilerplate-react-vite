console.log('content script loaded');

const injectContentScript = async () => {
  document.addEventListener('click', async function (e) {
    if (e.target instanceof HTMLElement) {
      await chrome.runtime.sendMessage(e.target.innerText);
    }
  });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message);
});

injectContentScript();
