import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiSummaryStatus } from '@extension/storage';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  queryGemini(request);
});

const queryGemini = async (text: string) => {
  let aiStatus = await aiSummaryStatus.get();
  let response: string;
  console.log(aiStatus);

  if (aiStatus === 'on') {
    const genAI = new GoogleGenerativeAI('');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Summerise ${text}`;

    const result = await model.generateContent(prompt);
    response = result.response.text();
  } else {
    response = text.split('').reverse().join('');
  }

  const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tab.id!, response);
  });
};
