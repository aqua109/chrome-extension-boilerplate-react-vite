import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';

const EnablePageHighligher = async () => {
  console.log('EnablePageHighligher-Popup');
  await chrome.runtime.sendMessage({ type: 'enableDivHighlighting' });
};

const Popup = () => {
  return (
    <div className="App bg-slate-50">
      <header className="App-header text-gray-900">
        <button onClick={() => EnablePageHighligher()}>Summarise T&Cs</button>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
