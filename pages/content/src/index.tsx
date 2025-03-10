import { createRoot } from 'react-dom/client';
import Modal from './modal';
import injectedStyle from '@src/modal.css?inline';

const enableClickToAISummary = async () => {
  console.log('enableClickToAISummary-content-script');
  document.addEventListener('click', clickListener);
};

const clickListener = async (e: MouseEvent) => {
  if (e.target instanceof HTMLElement) {
    await chrome.runtime.sendMessage({ type: 'queryGemini', data: e.target.innerText });
    e.target.classList.remove('target-hover');
    disableDivHighlighting();
    showModal();
  }
};

const mouseOverListener = async (e: MouseEvent) => {
  if (e.target instanceof HTMLElement) {
    e.target.classList.add('target-hover');
  }
};

const mouseOutListener = async (e: MouseEvent) => {
  if (e.target instanceof HTMLElement) {
    e.target.classList.remove('target-hover');
  }
};

const enableDivHighlighting = async () => {
  console.log('enableDivHighlighting-content-script');

  const highlight = document.createElement('style');
  highlight.id = 'highlight-style-element';
  highlight.innerHTML =
    '.target-hover{background-color:rgba(81,17,176,0.2) !important;outline:2px solid #5111b0 !important;}';

  document.body.appendChild(highlight);
  document.addEventListener('mouseover', mouseOverListener);
  document.addEventListener('mouseout', mouseOutListener);

  enableClickToAISummary();
};

const disableDivHighlighting = async () => {
  document.getElementById('highlight-style-element')?.remove();
  document.removeEventListener('click', clickListener);
  document.removeEventListener('mouseover', mouseOverListener);
  document.removeEventListener('mouseout', mouseOutListener);
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'enableDivHighlighting':
      enableDivHighlighting();
      break;

    case 'disableDivHighlighting':
      disableDivHighlighting();
      break;

    case 'enableAISummary':
      enableClickToAISummary();
      break;

    case 'aiSummaryReturned':
      var summaryText = document.getElementById('ai-summary-text');
      var loader = document.getElementById('summary-loader');
      loader?.remove();

      if (message.data != '') {
        console.log(message.data);

        if (summaryText) {
          summaryText.textContent = message.data;
        }
      } else {
        if (summaryText) {
          summaryText.textContent = 'Unable to find any content related to terms and conditions in the selected text';
        }
      }
      break;
  }
});

const showModal = () => {
  console.log('ShowModal');
  const root = document.createElement('div');
  root.setAttribute('id', 'ai-summary-modal');
  document.body.appendChild(root);

  const styleElement = document.createElement('style');
  styleElement.setAttribute('id', 'ai-summary-style');
  styleElement.textContent = injectedStyle;
  document.body.appendChild(styleElement);

  createRoot(root).render(<Modal text={''} />);
};
