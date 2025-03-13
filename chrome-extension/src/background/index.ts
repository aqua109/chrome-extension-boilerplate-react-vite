import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { aiSummaryStatus } from '@extension/storage';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'queryGemini':
      // queryGemini(request.data);
      testingGeminiQueries(request.data);
      break;

    case 'enableDivHighlighting':
      enableDivHighlighting();
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
    chrome.tabs.sendMessage(tab[0].id!, { type: 'aiSummaryReturned', data: summary });
  });
};

const testingGeminiQueries = async (text: string) => {
  try {
    // const schema: any = {
    //   description: "",
    //   type: SchemaType.ARRAY,
    //   items: {
    //     type: SchemaType.OBJECT,
    //     properties: {
    //       sectionName: {
    //         type: SchemaType.STRING,
    //         description: 'Title of the section',
    //       },
    //       sentences: {
    //         type: SchemaType.ARRAY,
    //         description: 'Sentences which contain references to tracking or data collection',
    //         items: {
    //           type: SchemaType.STRING
    //         }
    //       },
    //     },
    //   },
    // };

    const genAI = new GoogleGenerativeAI(process.env.CEB_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const queryPrompt = `For the given text, return a JSON object that denotes which sections contain references to tracking or data collection and the relevant text from these sections. Text: "${text}"`;
    const queryResult = await model.generateContent(queryPrompt);
    const queryResponse = queryResult.response.text();

    chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
      chrome.tabs.sendMessage(tab[0].id!, { type: 'aiSummaryReturned', data: queryResponse });
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.log('AI response in unknown format');
    }
  }
};

const enableDivHighlighting = async () => {
  console.log('enableDivHighlighting-Background');
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tab) {
    await chrome.tabs.sendMessage(tab[0].id!, { type: 'enableDivHighlighting' });
  });
};

const disableDivHighlighting = async () => {
  console.log('disableDivHighlighting-Background');
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tab) {
    await chrome.tabs.sendMessage(tab[0].id!, { type: 'disableDivHighlighting' });
  });
};
