import { createRoot } from 'react-dom/client';
import Modal from './modal';
import injectedStyle from '@src/modal.css?inline';

const enableClickToAISummary = async (func: string) => {
  switch (func) {
    case 'summarise':
      document.addEventListener('click', summariseClickListener);
      break;

    case 'tracking':
      document.addEventListener('click', trackingClickListener);
      break;
  }
};

const summariseClickListener = async (e: MouseEvent) => {
  if (e.target instanceof HTMLElement) {
    await chrome.runtime.sendMessage({ type: 'queryGemini', data: e.target.innerText, func: 'summarise' });
    e.target.classList.remove('target-hover');
    disableDivHighlighting();
    showModal();
  }
};

const trackingClickListener = async (e: MouseEvent) => {
  if (e.target instanceof HTMLElement) {
    await chrome.runtime.sendMessage({ type: 'queryGemini', data: e.target.innerText, func: 'tracking' });
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

const enableDivHighlighting = async (func: string) => {
  const highlight = document.createElement('style');
  highlight.id = 'highlight-style-element';

  switch (func) {
    case 'summarise':
      highlight.innerHTML =
        '.target-hover{background-color:rgba(81,17,176,0.2) !important;outline:2px solid #5111b0 !important;}';
      break;

    case 'tracking':
      highlight.innerHTML =
        '.target-hover{background-color:rgba(15,18,242,0.2) !important;outline:2px solid #0f12f2 !important;}';
      break;
  }

  document.body.appendChild(highlight);
  document.addEventListener('mouseover', mouseOverListener);
  document.addEventListener('mouseout', mouseOutListener);

  enableClickToAISummary(func);
};

const disableDivHighlighting = async () => {
  document.getElementById('highlight-style-element')?.remove();
  document.removeEventListener('click', summariseClickListener);
  document.removeEventListener('click', trackingClickListener);
  document.removeEventListener('mouseover', mouseOverListener);
  document.removeEventListener('mouseout', mouseOutListener);
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'enableDivHighlighting':
      enableDivHighlighting(message.func);
      break;

    case 'disableDivHighlighting':
      disableDivHighlighting();
      break;

    case 'aiSummaryReturned':
      var modalTitle = document.getElementById('ai-modal-title');
      var summaryText = document.getElementById('ai-summary-text');
      var loader = document.getElementById('summary-loader');
      loader?.remove();

      switch (message.func) {
        case 'summarise':
          modalTitle!.textContent = 'Terms & Conditions AI Summary';
          if (message.data != '') {
            summaryText!.textContent = message.data;
          } else {
            summaryText!.textContent =
              'Unable to find any content related to terms and conditions in the selected text';
          }
          break;

        case 'tracking':
          modalTitle!.textContent = 'Tracking & Data Collection References';
          if (message.data != '') {
            for (let item of message.data) {
              console.log(`section: ${item.section}, summary: ${item.summary}`);
            }
          } else {
            summaryText!.textContent =
              'Unable to find any content related to tracking or data collection in the selected text';
          }
          break;
      }
      break;
  }
});

const showModal = () => {
  const root = document.createElement('div');
  root.setAttribute('id', 'ai-summary-modal');
  document.body.appendChild(root);

  const styleElement = document.createElement('style');
  styleElement.setAttribute('id', 'ai-summary-style');
  styleElement.textContent = injectedStyle;
  document.body.appendChild(styleElement);

  createRoot(root).render(<Modal text={''} />);
};
