import '@src/Options.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';

const Options = async () => {
  const icon = 'popup/icon.svg';
  const info = await chrome.runtime.getPlatformInfo();

  return (
    <div className="App bg-gray-100">
      <header className="App-header text-gray-500 mb-3">
        <div className="flex items-center space-x-2">
          <img src={chrome.runtime.getURL(icon)} className="mb-11.5 h-20" alt="icon" />
          <h1 className="font-sans font-medium text-gray-700 text-5xl mb-2.5"> PrivacyPal </h1>
        </div>
        <button
          className="mt-4 py-1 px-4 rounded shadow hover:scale-105 bg-gray-700 text-white"
          onClick={() => console.log(info)}>
          log
        </button>
        <h2>Headers</h2>
        <p>User Agent: {navigator.userAgent}</p>
        <h2>Hardware Specs</h2>
        <p>Max Touch Points: {navigator.maxTouchPoints}</p>
        <p>Do not tracking: {navigator.doNotTrack}</p>
        <p>Cookies enabled: {navigator.cookieEnabled}</p>
        <p>Device memory: {navigator.deviceMemory}</p>
        <p>Cores: {navigator.hardwareConcurrency}</p>
        {/* <p>gpu: {navigator.gpu}</p> */}
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <div> Loading ... </div>), <div> Error Occur </div>);
