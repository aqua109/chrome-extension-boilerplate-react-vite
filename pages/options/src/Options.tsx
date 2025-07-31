import '@src/Options.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';

let extensionsString: string = '';
let listOfSystemFonts: string = '';
let webglVendorString: string = '';
let webglRendererString: string = '';

const runOnStart = async () => {
  await chrome.runtime.sendMessage({ type: 'readBrowserExtensions' });

  const canvas = document.createElement('canvas');
  const webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const webglVendor = webgl.getExtension('WEBGL_debug_renderer_info');
  webglVendorString = webgl.getParameter(webglVendor.UNMASKED_VENDOR_WEBGL);
  webglRendererString = webgl.getParameter(webglVendor.UNMASKED_RENDERER_WEBGL);

  const availableFonts = await window.queryLocalFonts();
  for (const fontData of new Set(availableFonts.map((font: { family: any }) => font.family))) {
    listOfSystemFonts += `${fontData}, `;
  }
  listOfSystemFonts = listOfSystemFonts.replace(/,\s*$/, '');
  console.log(listOfSystemFonts);
};

runOnStart();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'extensionData':
      const extensions = message.data;
      extensions.forEach(extension => {
        extensionsString += `${extension.name} (${extension.version}), `;
      });

      extensionsString = extensionsString.replace(/,\s*$/, '');
      break;
  }
});

const Options = async () => {
  const icon = 'popup/icon.svg';
  const timeZoneoffset = new Date().getTimezoneOffset();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="App bg-gray-100 p-20">
      <div className="flex items-center space-x-2">
        <img src={chrome.runtime.getURL(icon)} className="mb-11.5 h-20" alt="icon" />
        <h1 className="font-sans font-medium text-gray-700 text-5xl mb-2.5"> PrivacyPal </h1>
      </div>
      <h2 className="font-sans font-medium text-gray-700 text-2xl mb-2.5">Headers</h2>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>User Agent:</b> {navigator.userAgent}
      </p>

      <h2 className="font-sans font-medium text-gray-700 text-2xl mb-2.5">Browser Characteristics</h2>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Browser Extensions:</b> {extensionsString}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Time Zone Offset:</b> {timeZoneoffset}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Time Zone:</b> {timeZone}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Screen Size and Colour Depth:</b> {window.screen.width}x{window.screen.height}x{window.screen.colorDepth}
      </p>

      <h2 className="font-sans font-medium text-gray-700 text-2xl mb-2.5">Fingerprint Metrics</h2>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>System Fonts:</b> {listOfSystemFonts}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Cookies enabled:</b> {navigator.cookieEnabled == true ? 'True' : 'False'}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>WebGL Vendor:</b> {webglVendorString}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>WebGL Renderer:</b> {webglRendererString}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Do not track header set:</b> {navigator.doNotTrack != null ? 'True' : 'False'}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Language:</b> {navigator.language}
      </p>

      <h2 className="font-sans font-medium text-gray-700 text-2xl mb-2.5">Hardware Specs</h2>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Platform:</b> {navigator.platform}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Max Touch Points:</b> {navigator.maxTouchPoints}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>CPU Cores:</b> {navigator.hardwareConcurrency}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Device memory:</b> {navigator.deviceMemory} GB
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mt-5">
        For more information visit{' '}
        <a
          href="https://coveryourtracks.eff.org/"
          className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
          https://coveryourtracks.eff.org/
        </a>
      </p>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <div> Loading ... </div>), <div> Error Occur </div>);
