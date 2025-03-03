import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';

const EnablePageHighlighter = async () => {
  console.log('EnablePageHighligher-Popup');
  await chrome.runtime.sendMessage({ type: 'enableDivHighlighting' });
};

const DisablePageHighlighter = async () => {
  console.log('DisablePageHighligher-Popup');
  await chrome.runtime.sendMessage({ type: 'disableDivHighlighting' });
};

const Popup = () => {
  return (
    <div className="App bg-slate-50">
      <header className="App-header text-gray-900">
        <button onClick={() => EnablePageHighlighter()}>Enable</button>

        <button onClick={() => DisablePageHighlighter()}>Disable</button>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
