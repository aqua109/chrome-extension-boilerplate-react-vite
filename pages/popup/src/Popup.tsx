import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';

const Popup = () => {
  const icon = 'popup/icon.svg';
  const EnablePageHighlighter = async (func: string) => {
    await chrome.runtime.sendMessage({ type: 'enableDivHighlighting', func: func });
  };

  const ShowPageScannerResults = async () => {
    await chrome.runtime.sendMessage({ type: 'displayPageScanResults' });
  };

  return (
    <div className="App bg-gray-100">
      <header className="App-header text-gray-500 mb-3">
        <div className="flex items-center space-x-2">
          <img src={chrome.runtime.getURL(icon)} className="mb-11.5 h-12" alt="icon" />
          <h1 className="font-sans font-medium text-gray-700 text-2xl mb-2.5"> PrivacyPal </h1>
        </div>
        <p> Summarise Terms and Conditions with Gemini AI</p>
        <button
          className="mt-4 py-1 px-4 rounded shadow hover:scale-105 bg-gray-700 text-white"
          onClick={() => EnablePageHighlighter('summarise')}>
          Summarise
        </button>
        <button
          className="mt-4 py-1 px-4 rounded shadow hover:scale-105 bg-gray-700 text-white"
          onClick={() => EnablePageHighlighter('tracking')}>
          Locate Tracking Data
        </button>
        <button
          className="mt-4 py-1 px-4 rounded shadow hover:scale-105 bg-gray-700 text-white"
          onClick={() => ShowPageScannerResults()}>
          Scan for Trackers
        </button>
        <button
          className="mt-4 py-1 px-4 rounded shadow hover:scale-105 bg-gray-700 text-white"
          onClick={() => chrome.runtime.openOptionsPage()}>
          About your browser
        </button>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
