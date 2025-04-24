import { createRoot } from 'react-dom/client';
import Modal from './modal';
import injectedStyle from '@src/modal.css?inline';
import { GhosteryMatch, TrackingReponse } from './ghostery-tracking-response';
import { mangoFusionPalette, PieChart } from '@mui/x-charts';

let ghosteryData: TrackingReponse;

const runOnStart = async () => {
  await chrome.runtime.sendMessage({ type: 'initiatePageScanner' });
};

runOnStart();

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
    e.target.classList.remove('pp-target-hover');
    disableDivHighlighting();
    showModal();
  }
};

const trackingClickListener = async (e: MouseEvent) => {
  if (e.target instanceof HTMLElement) {
    await chrome.runtime.sendMessage({ type: 'queryGemini', data: e.target.innerText, func: 'tracking' });
    e.target.classList.remove('pp-target-hover');
    disableDivHighlighting();
    showModal();
  }
};

const mouseOverListener = async (e: MouseEvent) => {
  if (e.target instanceof HTMLElement) {
    e.target.classList.add('pp-target-hover');
  }
};

const mouseOutListener = async (e: MouseEvent) => {
  if (e.target instanceof HTMLElement) {
    e.target.classList.remove('pp-target-hover');
  }
};

const enableDivHighlighting = async (func: string) => {
  const highlight = document.createElement('style');
  highlight.id = 'highlight-style-element';

  switch (func) {
    case 'summarise':
      highlight.innerHTML =
        '.pp-target-hover{background-color:rgba(81,17,176,0.2) !important;outline:2px solid #5111b0 !important;}';
      break;

    case 'tracking':
      highlight.innerHTML =
        '.pp-target-hover{background-color:rgba(15,18,242,0.2) !important;outline:2px solid #0f12f2 !important;}';
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
      var loader = document.getElementById('summary-loader');
      loader?.remove();

      switch (message.func) {
        case 'summarise':
          modalTitle!.textContent = 'Terms & Conditions AI Summary';
          if (message.data != '') {
            Object.entries(message.data).forEach(([key, value]) => {
              if ((value as string).length > 10) {
                formatSectionTextAndContent(toTitleCase(key), value as string);
              }
            });
          } else {
            formatSectionTextAndContent(
              '',
              'Unable to find any content related to terms and conditions in the selected text',
            );
          }
          break;

        case 'tracking':
          modalTitle!.textContent = 'Tracking & Data Collection References';
          if (message.data != '' && typeof message.data !== 'undefined') {
            for (let item of message.data) {
              formatSectionTextAndContent(toTitleCase(item.section), item.summary);
            }
          } else {
            formatSectionTextAndContent(
              '',
              'Unable to find any content related to tracking or data collection in the selected text',
            );
          }
          break;
      }
      break;

    case 'ghosteryData':
      console.log('ghosteryDataReceived');
      ghosteryData = JSON.parse(message.data);
      console.log(ghosteryData);
      break;

    case 'scanRequestsReturned':
      var modalTitle = document.getElementById('ai-modal-title');
      var loader = document.getElementById('summary-loader');
      loader?.remove();
      modalTitle!.textContent = 'Site Requests Analytics';
      let responses: TrackingReponse = JSON.parse(message.data);
      let categories: { [category: string]: Array<GhosteryMatch> } = {};
      console.log(responses);
      responses.forEach(element => {
        if (element.length > 0) {
          element.forEach(match => {
            if (categories[match.category.key] === undefined) {
              categories[match.category.key] = [];
            }
            categories[match.category.key].push(match);
          });
        }
      });

      for (let key in categories) {
        formatSectionTextAndContent(toTitleCase(key), categories[key].length.toString());
      }
      break;

    case 'displayScanResults':
      waitForGhosteryData();
      break;

    case 'testingPieChart':
      testingPieChart();
      break;
  }
});

const sleep = async (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const waitForGhosteryData = async () => {
  showModal();
  let count = 0;
  while (ghosteryData === undefined && count < 11) {
    console.log(`count: ${count}\tdata: ${ghosteryData}`);
    await sleep(1000);
    count++;
  }

  if (ghosteryData !== undefined) {
    var modalContent = document.getElementById('ai-modal-content');
    var loader = document.getElementById('summary-loader');
    loader?.remove();
    var pieChart = document.createElement('div');
    modalContent!.appendChild(pieChart);
    createRoot(pieChart).render(
      <PieChart
        colors={mangoFusionPalette}
        series={[
          {
            data: [
              { id: 0, value: 1, label: 'series A' },
              { id: 1, value: 2, label: 'series B' },
              { id: 2, value: 3, label: 'series C' },
              { id: 3, value: 4, label: 'series C' },
              { id: 4, value: 5, label: 'series C' },
              { id: 5, value: 6, label: 'series C' },
              { id: 6, value: 7, label: 'series C' },
              { id: 7, value: 8, label: 'series C' },
              { id: 8, value: 9, label: 'series C' },
              { id: 9, value: 10, label: 'series C' },
            ],

            highlightScope: { fade: 'global', highlight: 'item' },
          },
        ]}
        width={200}
        height={200}
      />,
    );
  } else {
    //Error
  }
};

const testingPieChart = () => {
  var modalContent = document.getElementById('ai-modal-content');
  var loader = document.getElementById('summary-loader');
  loader?.remove();
  var pieChart = document.createElement('div');
  modalContent!.appendChild(pieChart);
  createRoot(pieChart).render(
    <PieChart
      colors={mangoFusionPalette}
      series={[
        {
          data: [
            { id: 0, value: 1, label: 'series A' },
            { id: 1, value: 2, label: 'series B' },
            { id: 2, value: 3, label: 'series C' },
            { id: 3, value: 4, label: 'series C' },
            { id: 4, value: 5, label: 'series C' },
            { id: 5, value: 6, label: 'series C' },
            { id: 6, value: 7, label: 'series C' },
            { id: 7, value: 8, label: 'series C' },
            { id: 8, value: 9, label: 'series C' },
            { id: 9, value: 10, label: 'series C' },
          ],

          highlightScope: { fade: 'global', highlight: 'item' },
        },
      ]}
      width={200}
      height={200}
    />,
  );
};

const formatSectionTextAndContent = (title: string, text: string) => {
  var sectionTitle = document.createElement('div');
  sectionTitle.setAttribute('class', 'pp-section-title');
  sectionTitle.textContent = title;
  var sectionText = document.createElement('div');
  sectionText.setAttribute('class', 'pp-section-text');
  sectionText.textContent = text;

  var modalContent = document.getElementById('ai-modal-content');
  modalContent!.appendChild(sectionTitle);
  modalContent!.appendChild(sectionText);
};

const showModal = () => {
  // Only show if modal doesn't already exist
  if (document.getElementById('ai-summary-modal') === null) {
    const root = document.createElement('div');
    root.setAttribute('id', 'ai-summary-modal');
    document.body.appendChild(root);

    const styleElement = document.createElement('style');
    styleElement.setAttribute('id', 'ai-summary-style');
    styleElement.textContent = injectedStyle;
    document.body.appendChild(styleElement);

    createRoot(root).render(<Modal text={''} />);
  }
};

// https://medium.com/@sankarums/convert-a-string-to-title-case-in-typescript-742bfd869cb9
// also removes underscores
// e.g. 'privacy_implications' -> 'Privacy Implications'
const toTitleCase = (title: string) => {
  return title
    .replace('_', ' ')
    .toLowerCase()
    .split(' ')
    .map((word: any) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};
