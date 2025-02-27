const enableClickToAISummary = async () => {
  console.log('enableClickToAISummary-content-script');
  document.addEventListener('click', async function (e) {
    if (e.target instanceof HTMLElement) {
      await chrome.runtime.sendMessage({ type: 'queryGemini', data: e.target.innerText });
      disableDivHighlighting();
    }
  });
};

const enableDivHighlighting = () => {
  console.log('enableDivHighlighting-content-script');
  const highlight = document.createElement('style');
  // highlight.id = "highlight-style-element";
  highlight.innerHTML =
    '.target-hover{background-color:rgba(81,17,176,0.2) !important;outline:2px solid #5111b0 !important;}';
  document.body.appendChild(highlight);
  document.addEventListener('mouseover', function (e) {
    if (e.target instanceof HTMLElement) {
      e.target.classList.add('target-hover');
    }
  });

  document.addEventListener('mouseout', function (e) {
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('target-hover');
    }
  });
};

const disableDivHighlighting = () => {
  document.getElementById('highlight-style-element')?.remove();
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'enableDivHighlighting':
      enableDivHighlighting();

    case 'disableDivHighlighting':
      disableDivHighlighting();

    case 'enableAISummary':
      enableClickToAISummary();

    case 'aiSummaryReturned':
      console.log(message.data);
  }
});

// enableClickToAISummary();
