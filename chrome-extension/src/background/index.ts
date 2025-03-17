import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { aiSummaryStatus } from '@extension/storage';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'queryGemini':
      switch (request.func) {
        case 'summarise':
          queryGemini(request.data);
          break;

        case 'tracking':
          testingGeminiQueries(request.data);
          break;
      }
      break;

    case 'enableDivHighlighting':
      enableDivHighlighting(request.func);
      break;

    case 'disableDivHighlighting':
      disableDivHighlighting();
      break;
  }
});

const queryGemini = async (text: string) => {
  const aiStatus = await aiSummaryStatus.get();
  var summary: string = '';

  if (aiStatus === 'on') {
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

      console.log(queryKey);

      if (queryJsonResponse[queryKey]) {
        const summaryPrompt = `Summerise the given text, returning the summary as a JSON object with the field 'summary'. Text:"${text}"`;
        const summaryResult = await model.generateContent(summaryPrompt);
        const summaryResponse = summaryResult.response.text();

        const summaryJsonResponse: jsonType = JSON.parse(summaryResponse.replaceAll(/(`{3}json|`{3})/g, ''));
        const summaryKey: jsonKey = 'summary';

        summary = summaryJsonResponse[summaryKey];
      } else {
        console.log('Failed to find T&Cs');
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.log('AI response in unknown format');
      }
    }
  } else {
    summary = text.split('').reverse().join('');
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
    chrome.tabs.sendMessage(tab[0].id!, { type: 'aiSummaryReturned', data: summary, func: 'summarise' });
  });
};

const testingGeminiQueries = async (text: string) => {
  try {
    var trackingJson: any;

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
      const trackingPrompt = `For the given text, return a JSON object that denotes which sections contain references to tracking or data collection and the relevant text from these sections. Summarise the relevant text using this format: [ { "section": string, "summary": string } ] Text: "${text}"`;
      const trackingResult = await model.generateContent(trackingPrompt);
      const trackingResponse = trackingResult.response.text();

      trackingJson = JSON.parse(trackingResponse.replaceAll(/(`{3}json|`{3})/g, ''));

      for (let item of trackingJson) {
        console.log(`section: ${item.section}, summary: ${item.summary}`);
      }
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
      chrome.tabs.sendMessage(tab[0].id!, { type: 'aiSummaryReturned', data: trackingJson, func: 'tracking' });
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.log('AI response in unknown format');
    }
  }
};

const enableDivHighlighting = async (func: string) => {
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tab) {
    await chrome.tabs.sendMessage(tab[0].id!, { type: 'enableDivHighlighting', func: func });
  });
};

const disableDivHighlighting = async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tab) {
    await chrome.tabs.sendMessage(tab[0].id!, { type: 'disableDivHighlighting' });
  });
};
