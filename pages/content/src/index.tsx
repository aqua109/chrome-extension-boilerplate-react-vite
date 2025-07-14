import { createRoot } from 'react-dom/client';
import Modal from './modal';
import injectedStyle from '@src/modal.css?inline';
import listStyle from '@src/ghostery-list-item.css?inline';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { GhosteryMatch, TrackingReponse } from './ghostery-tracking-response';
import { mangoFusionPalette, PieChart, PieItemIdentifier, PieValueType } from '@mui/x-charts';
import GhosteryListItem from './ghostery-list-item';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { Fab, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState } from 'react';

let ghosteryData: TrackingReponse;
let pageScanTimeRemaining: number = 10;
let previousPieChartIndex: number = -1;

const runOnStart = async () => {
  await chrome.runtime.sendMessage({ type: 'initiatePageScanner' });
  while (pageScanTimeRemaining <= 100) {
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

  document.addEventListener('contextmenu', cancelRightClickListener);
};

const summariseClickListener = async (e: MouseEvent) => {
  e.preventDefault();
  if (e.target instanceof HTMLElement) {
    await chrome.runtime.sendMessage({ type: 'queryGemini', data: e.target.innerText, func: 'summarise' });
    e.target.classList.remove('pp-target-hover');
    disableDivHighlighting();
    showModal('Indeterminate');
  }
};

const trackingClickListener = async (e: MouseEvent) => {
  e.preventDefault();
  if (e.target instanceof HTMLElement) {
    await chrome.runtime.sendMessage({ type: 'queryGemini', data: e.target.innerText, func: 'tracking' });
    e.target.classList.remove('pp-target-hover');
    disableDivHighlighting();
    showModal('Indeterminate');
  }
};

const cancelRightClickListener = async (e: MouseEvent) => {
  e.preventDefault();
  if (e.target instanceof HTMLElement) {
    if (e.target.id != 'privacy-pal-fab') {
      cancelDivHighlighting(e.target);
    }
  }
};

const cancelDivHighlighting = (target: HTMLElement) => {
  target.classList.remove('pp-target-hover');

  cancelHighlighting();
};

const cancelHighlighting = () => {
  disableDivHighlighting();

  const cancelFab = document.getElementById('privacy-pal-fab');

  if (cancelFab != null) {
    cancelFab.remove();
  }
};

const selectAllTextForSummary = async (func: string) => {
  cancelHighlighting();
  await chrome.runtime.sendMessage({ type: 'queryGemini', data: document.body.innerText, func: func });
  showModal('Indeterminate');
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
  hideModal();
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

  const cancelFab = document.getElementById('privacy-pal-fab');

  if (cancelFab == null) {
    const root = document.createElement('div');
    root.id = 'privacy-pal-fab';
    document.body.appendChild(root);
    const shadowRoot = root.attachShadow({ mode: 'open' });

    const cache = createCache({
      key: 'css',
      prepend: true,
      container: shadowRoot,
    });

    createRoot(shadowRoot).render(
      <CacheProvider value={cache}>
        <Stack
          spacing={2}
          sx={{
            zIndex: 'tooltip',
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}>
          <Fab color="primary" aria-label="select all" variant="extended" onClick={() => selectAllTextForSummary(func)}>
            Select All
          </Fab>
          <Fab color="error" aria-label="cancel" variant="extended" onClick={cancelHighlighting}>
            Cancel
          </Fab>
        </Stack>
      </CacheProvider>,
    );
  }

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
      var modalTitle = getElementInModal('#ai-modal-title');
      var loader = getElementInModal('#summary-loader');
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
          if (message.data != '') {
            Object.entries(message.data).forEach(([key, value]) => {
              if ((value as string).length > 10) {
                formatSectionTextAndContent(toTitleCase(key), value as string);
              }
            });
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

    case 'displayScanResults':
      waitForGhosteryData('category');
      break;
  }
});

const sleep = async (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const PieChartToggleViewButton = (props: { initialType: string }) => {
  const [type, setType] = useState(props.initialType);

  const handleChange = (event: React.MouseEvent<HTMLElement>, newType: string) => {
    if (newType !== null) {
      setupPieChart(newType);
      setType(newType);
    }
  };

  return (
    <ToggleButtonGroup
      color="primary"
      value={type}
      exclusive
      onChange={handleChange}
      size="small"
      aria-label="Pie Chart Type"
      sx={{ marginBottom: 2 }}>
      <ToggleButton value="category" sx={{ width: 200 }} disableRipple>
        Category
      </ToggleButton>
      <ToggleButton value="organisation" sx={{ width: 200 }} disableRipple>
        Organisation
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

const PiechartDrilldownList = (props: { category: string; pieType: string }) => {
  let stack = [];
  let sortedMatches;
  switch (props.pieType) {
    case 'category':
      // Filter Ghostery Data on category
      let matchedCategories = ghosteryData.filter(match => match[0].category?.key == props.category);
      // Combine matches that have the same ghostery id
      let combinedCategoryMatches: { [id: string]: Array<GhosteryMatch> } = {};

      matchedCategories.forEach(element => {
        if (element.length > 0) {
          element.forEach(match => {
            if (combinedCategoryMatches[`m-${match.pattern.ghostery_id}`] === undefined) {
              combinedCategoryMatches[`m-${match.pattern.ghostery_id}`] = [];
            }
            combinedCategoryMatches[`m-${match.pattern.ghostery_id}`].push(match);
          });
        }
      });

      sortedMatches = Object.fromEntries(
        Object.entries(combinedCategoryMatches).sort((a, b) => b[1].length - a[1].length),
      );

      for (let key in sortedMatches) {
        stack.push(
          <GhosteryListItem
            match={sortedMatches[key][0]}
            count={sortedMatches[key].length}
            colour={sortedMatches[key][0].category.color}
            key={key}></GhosteryListItem>,
        );
      }
      break;

    case 'organisation':
      // Filter Ghostery Data on organisation
      let matched = ghosteryData.filter(match => match[0].organization?.key == props.category);
      // Combine matches that have the same ghostery id
      let combinedMatches: { [id: string]: Array<GhosteryMatch> } = {};

      matched.forEach(element => {
        if (element.length > 0) {
          element.forEach(match => {
            if (combinedMatches[`m-${match.pattern.ghostery_id}`] === undefined) {
              combinedMatches[`m-${match.pattern.ghostery_id}`] = [];
            }
            combinedMatches[`m-${match.pattern.ghostery_id}`].push(match);
          });
        }
      });

      sortedMatches = Object.fromEntries(Object.entries(combinedMatches).sort((a, b) => b[1].length - a[1].length));

      for (let key in sortedMatches) {
        let id = sortedMatches[key][0].organization.ghostery_id ?? 1;

        stack.push(
          <GhosteryListItem
            match={sortedMatches[key][0]}
            count={sortedMatches[key].length}
            colour={hslFromID(id)}
            key={key}></GhosteryListItem>,
        );
      }
      break;
  }

  return (
    <>
      <Stack spacing={{ xs: 1, sm: 2 }} direction="row" useFlexGap sx={{ flexWrap: 'wrap' }}>
        {stack}
      </Stack>
    </>
  );
};

const drilldownOnPieSlice = (slice: PieItemIdentifier, data: Array<PieValueType>, pieType: string) => {
  let previousStack = getElementInModal('#piechart-drilldown-stack');

  if (previousStack != null) {
    previousStack.remove();
  }

  if (slice.dataIndex != previousPieChartIndex) {
    let modalContent = getElementInModal('#ai-modal-content');
    let stack = document.createElement('div');
    stack.setAttribute('id', 'piechart-drilldown-stack');
    let styleElement = document.createElement('style');
    styleElement.setAttribute('id', 'piechart-stack-style');
    styleElement.textContent = listStyle;
    modalContent!.appendChild(stack);

    let shadowRoot = getModal()?.shadowRoot;
    const cache = createCache({
      key: 'css',
      prepend: true,
      container: shadowRoot!,
    });

    shadowRoot!.appendChild(styleElement);

    createRoot(stack).render(
      <CacheProvider value={cache}>
        <Box>
          <PiechartDrilldownList category={data[slice.dataIndex].id!.toString()} pieType={pieType} />
        </Box>
      </CacheProvider>,
    );

    previousPieChartIndex = slice.dataIndex;
  } else {
    previousPieChartIndex = -1;
  }
};

// https://medium.com/@ryan_forrester_/javascript-wait-for-element-to-exist-simple-explanation-1cd8c569e354
const waitForElement = (selector: string) => {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      const element = getElementInModal(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      }
    }, 100);
  });
};

const waitForGhosteryData = async (type: string) => {
  hideModal();
  showModal('Determinate', pageScanTimeRemaining);
  let count = 0;

  while (ghosteryData === undefined && count < 11) {
    await sleep(1000);
    count++;
  }

  if (ghosteryData !== undefined) {
    setupPieChartContainer();
  } else {
    //Error
  }
};

const setupPieChartContainer = () => {
  waitForElement('#ai-modal-content').then(modalContent => {
    let loader = getElementInModal('#summary-loader');
    loader?.remove();

    let previousChart = getElementInModal('#tracking-summary-piechart-container');

    if (previousChart != null) {
      previousChart.remove();
    }

    let modalTitle = getElementInModal('#ai-modal-title');
    modalTitle!.textContent = 'Webpage Trackers Summary';

    let pieChartContainer = document.createElement('div');
    pieChartContainer.setAttribute('id', 'tracking-summary-piechart-root');
    (modalContent as HTMLElement).appendChild(pieChartContainer);

    let shadowRoot = getModal()?.shadowRoot;

    const cache = createCache({
      key: 'css',
      prepend: true,
      container: shadowRoot!,
    });

    createRoot(pieChartContainer).render(
      <CacheProvider value={cache}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
          <div id="tracking-summary-piechart-container"></div>
          <PieChartToggleViewButton initialType={'category'} />
        </Box>
      </CacheProvider>,
    );
  });

  setupPieChart('category');
};

const setupPieChart = (type: string) => {
  waitForElement('#tracking-summary-piechart-container').then(pieChartContainer => {
    previousPieChartIndex = -1;
    let previousStack = getElementInModal('#piechart-drilldown-stack');

    if (previousStack != null) {
      previousStack.remove();
    }
    let data: Array<PieValueType> = new Array();
    let ghosteryTypes: { [category: string]: Array<GhosteryMatch> } = {};

    switch (type) {
      case 'category':
        ghosteryData.forEach(element => {
          if (element.length > 0) {
            element.forEach(match => {
              if (ghosteryTypes[match.category.key] === undefined) {
                ghosteryTypes[match.category.key] = [];
              }
              ghosteryTypes[match.category.key].push(match);
            });
          }
        });

        let sortedCategories = Object.fromEntries(
          Object.entries(ghosteryTypes).sort((a, b) => b[1].length - a[1].length),
        );

        for (let key in sortedCategories) {
          let datagram: PieValueType = {
            id: key,
            value: sortedCategories[key].length,
            label: `${toTitleCase(key)}`,
            color: sortedCategories[key][0].category.color,
          };

          data.push(datagram);
        }
        break;

      case 'organisation':
        ghosteryData.forEach(element => {
          if (element.length > 0) {
            element.forEach(match => {
              if (match.organization?.key ?? false) {
                if (ghosteryTypes[match.organization?.key] === undefined) {
                  ghosteryTypes[match.organization.key] = [];
                }
                ghosteryTypes[match.organization.key].push(match);
              }
            });
          }
        });

        let sortedOrganisations = Object.fromEntries(
          Object.entries(ghosteryTypes).sort((a, b) => b[1].length - a[1].length),
        );

        for (let key in sortedOrganisations) {
          let id = sortedOrganisations[key][0].organization.ghostery_id ?? 1;

          let datagram: PieValueType = {
            id: key,
            value: sortedOrganisations[key].length,
            label: `${toTitleCase(key)}`,
            color: hslFromID(id),
          };

          data.push(datagram);
        }
        break;
    }

    let shadowRoot = getModal()?.shadowRoot;

    const cache = createCache({
      key: 'css',
      prepend: true,
      container: shadowRoot!,
    });

    createRoot(pieChartContainer as Element).render(
      <CacheProvider value={cache}>
        <PieChart
          id="tracking-summary-piechart"
          series={[
            {
              data: data,
              highlightScope: { fade: 'global', highlight: 'item' },
            },
          ]}
          width={200}
          height={200}
          onItemClick={(_event, slice) => drilldownOnPieSlice(slice, data, type)}
          slotProps={{
            tooltip: {
              disablePortal: false,
              container: pieChartContainer as Element,
            },
            legend: {
              sx: {
                overflowY: 'auto',
                flexWrap: 'nowrap',
                height: '250px',
              },
            },
          }}
          sx={{
            marginBottom: 2,
          }}
        />
      </CacheProvider>,
    );
  });
};

const formatSectionTextAndContent = (title: string, text: string) => {
  var sectionTitle = document.createElement('div');
  sectionTitle.setAttribute('class', 'pp-section-title');
  sectionTitle.textContent = title;
  var sectionText = document.createElement('div');
  sectionText.setAttribute('class', 'pp-section-text');
  sectionText.textContent = text;

  var modalContent = getElementInModal('#ai-modal-content');
  modalContent!.appendChild(sectionTitle);
  modalContent!.appendChild(sectionText);
};

const hslFromID = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  let hue = hash % 360;
  let color = `hsl(${hue}, 50%, 65%)`;

  return color;
};

const getElementInModal = (selector: string) => {
  let rootElement = document.body.querySelector('#privacy-pal-modal');

  if (rootElement === null) {
    return null;
  } else {
    let shadowRoot = rootElement.shadowRoot;
    return shadowRoot?.querySelector(selector);
  }
};

const getModal = () => {
  return document.querySelector('#privacy-pal-modal');
};

const hideModal = () => {
  let modal = getModal();

  if (modal != null) {
    modal.remove();
  }
};

const showModal = (loadingStyle: string, timeRemaining?: number) => {
  const cancelFab = document.getElementById('privacy-pal-fab');

  if (cancelFab != null) {
    cancelFab.remove();
  }

  // Only show if modal doesn't already exist
  if (getModal() === null) {
    const appContainer = document.createElement('div');
    appContainer.id = 'privacy-pal-modal';
    const root = document.createElement('div');
    root.id = 'privacy-pal-modal';

    document.body.appendChild(root);

    const shadowRoot = root.attachShadow({ mode: 'open' });

    const styleElement = document.createElement('style');
    styleElement.setAttribute('id', 'ai-summary-style');
    styleElement.textContent = injectedStyle;
    shadowRoot.appendChild(styleElement);

    const cache = createCache({
      key: 'css',
      prepend: true,
      container: shadowRoot,
    });

    createRoot(shadowRoot).render(
      <CacheProvider value={cache}>
        <Modal loadingStyle={loadingStyle} timeRemaining={timeRemaining} />
      </CacheProvider>,
    );
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
