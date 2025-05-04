import { createRoot } from 'react-dom/client';
import Modal from './modal';
import LoadingStyle from './modal';
import injectedStyle from '@src/modal.css?inline';
import listStyle from '@src/ghostery-list-item.css?inline';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { GhosteryMatch, TrackingReponse } from './ghostery-tracking-response';
import { mangoFusionPalette, PieChart, PieItemIdentifier, PieValueType } from '@mui/x-charts';
import GhosteryListItem from './ghostery-list-item';
import { JSX } from 'react';

let ghosteryData: TrackingReponse;
let pageScanTimeRemaining: number = 10;
let previousPieChartIndex: number = -1;

const runOnStart = async () => {
  await chrome.runtime.sendMessage({ type: 'initiatePageScanner' });
  while (pageScanTimeRemaining > 0) {
    await sleep(1000);
    pageScanTimeRemaining += 10;
  }
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
    showModal('Indeterminate');
  }
};

const trackingClickListener = async (e: MouseEvent) => {
  if (e.target instanceof HTMLElement) {
    await chrome.runtime.sendMessage({ type: 'queryGemini', data: e.target.innerText, func: 'tracking' });
    e.target.classList.remove('pp-target-hover');
    disableDivHighlighting();
    showModal('Indeterminate');
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
      ghosteryData = JSON.parse(message.data);
      break;

    // case 'scanRequestsReturned':
    //   var modalTitle = document.getElementById('ai-modal-title');
    //   var loader = document.getElementById('summary-loader');
    //   loader?.remove();
    //   modalTitle!.textContent = 'Site Requests Analytics';
    //   let responses: TrackingReponse = JSON.parse(message.data);
    //   let categories: { [category: string]: Array<GhosteryMatch> } = {};
    //   console.log(responses);
    //   responses.forEach(element => {
    //     if (element.length > 0) {
    //       element.forEach(match => {
    //         if (categories[match.category.key] === undefined) {
    //           categories[match.category.key] = [];
    //         }
    //         categories[match.category.key].push(match);
    //       });
    //     }
    //   });

    //   for (let key in categories) {
    //     formatSectionTextAndContent(toTitleCase(key), categories[key].length.toString());
    //   }
    //   break;

    case 'displayScanResults':
      waitForGhosteryData();
      break;
  }
});

const sleep = async (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const PiechartDrilldownList = (props: { category: string }) => {
  // Filter Ghostery Data on category
  let matched = ghosteryData.filter(match => match[0].category.key == props.category);
  // Combine matches that have the same ghostery id
  let combinedMatches: { [category: string]: Array<GhosteryMatch> } = {};

  matched.forEach(element => {
    if (element.length > 0) {
      element.forEach(match => {
        if (combinedMatches[match.pattern.ghostery_id] === undefined) {
          combinedMatches[match.pattern.ghostery_id] = [];
        }
        combinedMatches[match.pattern.ghostery_id].push(match);
      });
    }
  });

  let stack = [];
  for (let key in combinedMatches) {
    stack.push(
      <GhosteryListItem match={combinedMatches[key][0]} count={combinedMatches[key].length}></GhosteryListItem>,
    );
  }

  return (
    <Stack spacing={{ xs: 1, sm: 2 }} direction="row" useFlexGap sx={{ flexWrap: 'wrap' }}>
      {stack}
    </Stack>
  );
};

const logPieChart = (slice: PieItemIdentifier, data: Array<PieValueType>) => {
  console.log(data[slice.dataIndex]);

  let previousStack = document.getElementById('piechart-drilldown-stack');

  if (previousStack != null) {
    previousStack?.remove();
  }

  if (slice.dataIndex != previousPieChartIndex) {
    let modalContent = document.getElementById('ai-modal-content');
    let stack = document.createElement('div');
    stack.setAttribute('id', 'piechart-drilldown-stack');
    let styleElement = document.createElement('style');
    styleElement.setAttribute('id', 'piechart-stack-style');
    styleElement.textContent = listStyle;
    document.body.appendChild(styleElement);
    modalContent!.appendChild(stack);

    createRoot(stack).render(
      <Box>
        <PiechartDrilldownList category={data[slice.dataIndex].id!.toString()}></PiechartDrilldownList>
      </Box>,
    );

    previousPieChartIndex = slice.dataIndex;
  } else {
    previousPieChartIndex = -1;
  }
};

const waitForGhosteryData = async () => {
  showModal('Determinate', pageScanTimeRemaining);
  let count = 0;

  while (ghosteryData === undefined && count < 11) {
    await sleep(1000);
    count++;
  }

  if (ghosteryData !== undefined) {
    var modalContent = document.getElementById('ai-modal-content');
    var loader = document.getElementById('summary-loader');
    loader?.remove();
    var pieChart = document.createElement('div');
    modalContent!.appendChild(pieChart);

    let data: Array<PieValueType> = new Array();

    let categories: { [category: string]: Array<GhosteryMatch> } = {};
    console.log(ghosteryData);
    ghosteryData.forEach(element => {
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
      let datagram: PieValueType = {
        id: key,
        value: categories[key].length,
        label: `${toTitleCase(key)} (${categories[key].length})`,
      };

      data.push(datagram);
    }

    createRoot(pieChart).render(
      <PieChart
        colors={mangoFusionPalette}
        series={[
          {
            data: data,

            highlightScope: { fade: 'global', highlight: 'item' },
          },
        ]}
        width={200}
        height={200}
        onItemClick={(event, slice) => logPieChart(slice, data)}
      />,
    );
  } else {
    //Error
  }
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

const showModal = (loadingStyle: string, timeRemaining?: number) => {
  // Only show if modal doesn't already exist
  if (document.getElementById('ai-summary-modal') === null) {
    const root = document.createElement('div');
    root.setAttribute('id', 'ai-summary-modal');
    document.body.appendChild(root);

    const styleElement = document.createElement('style');
    styleElement.setAttribute('id', 'ai-summary-style');
    styleElement.textContent = injectedStyle;
    document.body.appendChild(styleElement);

    createRoot(root).render(<Modal loadingStyle={loadingStyle} timeRemaining={timeRemaining} />);
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
function ghosteryListItem(): import('react').ReactNode {
  throw new Error('Function not implemented.');
}
