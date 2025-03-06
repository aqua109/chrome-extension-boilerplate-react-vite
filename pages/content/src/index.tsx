import { createRoot } from 'react-dom/client';
import Modal from './modal';
import injectedStyle from '@src/modal.css?inline';

const enableClickToAISummary = async () => {
  console.log('enableClickToAISummary-content-script');
  document.addEventListener('click', clickListener);
};

const clickListener = async (e: MouseEvent) => {
  if (e.target instanceof HTMLElement) {
    // await chrome.runtime.sendMessage({ type: 'queryGemini', data: e.target.innerText });
    disableDivHighlighting();
    showModal();
  }
};

const enableDivHighlighting = async () => {
  console.log('enableDivHighlighting-content-script');
  const highlight = document.createElement('style');
  highlight.id = 'highlight-style-element';
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

  enableClickToAISummary();
};

const disableDivHighlighting = async () => {
  document.getElementById('highlight-style-element')?.remove();
  document.removeEventListener('click', clickListener);
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
      if (message.data != '') {
        console.log(message.data);
      }
      break;
  }
});

const showModal = () => {
  console.log('ShowModal');
  const root = document.createElement('div');

  document.body.append(root);

  // const rootIntoShadow = document.createElement('div');
  // rootIntoShadow.id = 'shadow-root';

  // const shadowRoot = root.attachShadow({ mode: 'open' });

  const styleElement = document.createElement('style');
  console.log(injectedStyle);
  styleElement.innerHTML = injectedStyle;
  document.body.appendChild(styleElement);
  // root.appendChild(styleElement);

  // shadowRoot.appendChild(rootIntoShadow);
  createRoot(root).render(<Modal text={'aaaaaaaaa'} />);
};
