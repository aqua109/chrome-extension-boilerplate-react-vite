import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ToggleButton } from '@extension/ui';

const Popup = () => {
  return (
    <div className="App bg-slate-50">
      <header className="App-header text-gray-900">
        <ToggleButton>Toggle AI Summary</ToggleButton>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
