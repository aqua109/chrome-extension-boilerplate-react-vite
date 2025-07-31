import { GoogleGenerativeAI } from '@google/generative-ai';
import loadTrackerDB from '@ghostery/trackerdb';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'queryGemini':
      switch (request.func) {
        case 'summarise':
          termsAndConditionsGeminiQuery(request.data);
          break;

        case 'tracking':
          trackingGeminiQuery(request.data);
          break;
      }
      break;

    case 'enableDivHighlighting':
      enableDivHighlighting(request.func);
      break;

    case 'disableDivHighlighting':
      disableDivHighlighting();
      break;

    case 'initiatePageScanner':
      initialisePageRequestLogging();
      break;

    case 'readBrowserExtensions':
      readBrowserExtensions();
      break;

    case 'displayPageScanResults':
      chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
        if (tab[0] != null) {
          chrome.tabs.sendMessage(tab[0].id!, {
            type: 'displayScanResults',
          });
        }
      });
      break;
  }
});

// For ease of testing added keyboard shortcuts
chrome.commands.onCommand.addListener(function (command) {
  switch (command) {
    // Default Ctrl+Shift+1
    case 'summarise':
      enableDivHighlighting('summarise');
      break;

    // Default Ctrl+Shift+2
    case 'tracking':
      enableDivHighlighting('tracking');
      break;

    // Default Ctrl+Shift+3
    case 'scan':
      chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
        if (tab[0] != null) {
          chrome.tabs.sendMessage(tab[0].id!, {
            type: 'displayScanResults',
          });
        }
      });
      break;
  }
});

const termsAndConditionsGeminiQuery = async (text: string) => {
  interface geminiTermsAndConditionsResponse {
    summary: Array<geminiSummaryObject>;
  }

  interface geminiSummaryObject {
    agreement: string;
    content: string;
    usage: string;
    intellectual_property: string;
    user_content: string;
    privacy: string;
    liability: string;
    governing_law: string;
    privacy_implications: string;
  }

  let summaryJson: geminiTermsAndConditionsResponse;

  try {
    const genAI = new GoogleGenerativeAI(process.env.CEB_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const queryPrompt = `For the given text, return a JSON object with the field 'containsTermsAndConditions' that is true if the text contains information relating to terms and conditions otherwise false. Text: "${text}"`;
    const queryResult = await model.generateContent(queryPrompt);
    const queryResponse = queryResult.response.text();

    type jsonKey = 'containstermsandconditions' | 'summary';
    type jsonType = { [key in jsonKey]: string };

    // reformats gemini response from:
    //
    // ```json
    // {
    //   "containsTermsAndConditions": true
    // }
    // ```
    //
    // into:
    //
    // {
    //   "containstermsandconditions": true
    // }
    const queryJsonResponse: jsonType = JSON.parse(queryResponse.toLowerCase().replaceAll(/(`{3}json|`{3})/g, ''));
    const queryKey: jsonKey = 'containstermsandconditions';

    if (queryJsonResponse[queryKey]) {
      const summaryPrompt = `Summarise the given text concisely (less than 100 words), in a structured way and provide 1-2 sentences on what this info means regarding the user's privacy. If a section is not specified or applicable remove it from the json. Replace " with '. Use the following json schema as an example. Schema: {"summary":{"agreement":"text","content":"text","usage":"text","intellectual_property":"text","user_content":"text","privacy":"text","liability":"text","governing_law":"text","privacy_implications":"text"}}. Text: "${text}"`;
      const summaryResult = await model.generateContent(summaryPrompt);
      const summaryResponse = summaryResult.response.text();

      summaryJson = JSON.parse(summaryResponse.replaceAll(/(`{3}json|`{3})/g, ''));
    } else {
      console.log('Failed to find T&Cs');
    }

    console.log(summaryJson!);

    chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
      if (tab[0] != null) {
        chrome.tabs.sendMessage(tab[0].id!, {
          type: 'aiSummaryReturned',
          data: typeof summaryJson?.summary !== 'undefined' ? summaryJson.summary : '',
          func: 'summarise',
        });
      }
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.log('AI response in unknown format');
    }
  }
};

const trackingGeminiQuery = async (text: string) => {
  try {
    interface geminiTrackingResponse {
      summary: Array<geminiTrackingObject>;
    }

    interface geminiTrackingObject {
      data_collection: string;
      tracking: string;
      privacy: string;
      data_retention: string;
      data_selling: string;
    }

    // interface geminiTrackingResponse {
    //   section: string;
    //   summary: string;
    // }

    let trackingJson: geminiTrackingResponse;

    const genAI = new GoogleGenerativeAI(process.env.CEB_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const queryPrompt = `For the given text, return a JSON object with the field 'containsTracking' that is true if the text contains information relating to tracking or data collection otherwise false. Text: "${text}"`;
    const queryResult = await model.generateContent(queryPrompt);
    const queryResponse = queryResult.response.text();

    type jsonKey = 'containstracking' | 'section' | 'summary';
    type jsonType = { [key in jsonKey]: string };

    // gemini response in format:
    //
    // {
    //   "containsTracking":bool
    // }

    const queryJsonResponse: jsonType = JSON.parse(queryResponse.toLowerCase().replaceAll(/(`{3}json|`{3})/g, ''));
    const queryKey: jsonKey = 'containstracking';

    if (queryJsonResponse[queryKey]) {
      const trackingPrompt = `Summarise the given text concisely (less than 100 words), in a structured way and provide 1-2 sentences on what this info means regarding user data collection and tracking. If a section is not specified or applicable remove it from the json. Replace " with '. Use the following json schema as an example. Schema: {"summary":{"data collection":"text","tracking":"text","privacy":"text","data retention":"text","data selling":"text"}. Text: "${text}"`;
      // const trackingPrompt = `For the given text, return a JSON object that denotes which sections contain references to tracking or data collection and the relevant text from these sections. Summarise the relevant text using this format: [ { "section": string, "summary": string } ] Text: "${text}"`;
      const trackingResult = await model.generateContent(trackingPrompt);
      const trackingResponse = trackingResult.response.text();

      trackingJson = JSON.parse(trackingResponse.replaceAll(/(`{3}json|`{3})/g, ''));

      console.log(trackingJson);
    } else {
      console.log('Failed to find any details relating to tracking or data collection');
    }

    // gemini response in format:
    //
    // {
    //   "section":string,
    //   "summary":string
    // }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
      if (tab[0] != null) {
        chrome.tabs.sendMessage(tab[0].id!, {
          type: 'aiSummaryReturned',
          data: typeof trackingJson?.summary !== 'undefined' ? trackingJson.summary : '',
          func: 'tracking',
        });
      }
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.log('AI response in unknown format');
    }
  }
};

const enableDivHighlighting = async (func: string) => {
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tab) {
    if (tab[0] != null) {
      await chrome.tabs.sendMessage(tab[0].id!, { type: 'enableDivHighlighting', func: func });
    }
  });
};

const disableDivHighlighting = async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tab) {
    if (tab[0] != null) {
      await chrome.tabs.sendMessage(tab[0].id!, { type: 'disableDivHighlighting' });
    }
  });
};

const pageRequestsListener = (
  details: chrome.webRequest.WebRequestBodyDetails,
  pageRequests: { [url: string]: number },
) => {
  if (pageRequests[details.url] !== undefined) {
    pageRequests[details.url]++;
  } else {
    pageRequests[details.url] = 1;
  }
};

const sleep = async (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Log all web requests for 10sec on page load
const initialisePageRequestLogging = async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tab) {
    if (tab[0] != null) {
      let pageRequests: { [url: string]: number } = {};
      let listener = (e: chrome.webRequest.WebRequestBodyDetails) => pageRequestsListener(e, pageRequests);
      chrome.webRequest.onBeforeRequest.addListener(listener, { urls: [] }, []);
      await sleep(10000);
      chrome.webRequest.onBeforeRequest.removeListener(listener);

      if (Object.keys(pageRequests).length > 0) {
        crossReferenceTrackersWithDB(pageRequests);
      } else {
        // Failed to find any trackers
      }
    }
  });
};

const crossReferenceTrackersWithDB = async (pageRequests: { [url: string]: number }) => {
  let matches: object[] = [];
  const path = chrome.runtime.getURL('/trackerdb.engine');

  fetch(path)
    .then(response => response.blob())
    .then(blob => {
      let reader = new FileReader();
      reader.onload = async function (e) {
        let bytes = new Uint8Array(reader.result as ArrayBuffer);
        let trackerDB = await loadTrackerDB(bytes);

        for (let key in pageRequests) {
          const urlMatches = trackerDB.matchUrl(
            {
              url: key,
              type: 'xhr',
            },
            {
              getDomainMetadata: true,
            },
          );

          // Add method to catch unknown matches
          if (Object.keys(urlMatches).length > 0) {
            matches.push(urlMatches);
          }
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
          if (tab[0] != null) {
            chrome.tabs.sendMessage(tab[0].id!, {
              type: 'ghosteryData',
              data: JSON.stringify(matches),
            });
          }
        });
      };
      reader.readAsArrayBuffer(blob);
    });
};

const readBrowserExtensions = () => {
  chrome.management.getAll(extensions => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
      if (tab[0] != null) {
        chrome.tabs.sendMessage(tab[0].id!, {
          type: 'extensionData',
          data: extensions,
        });
      }
    });
  });
};
