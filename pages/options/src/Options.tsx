import '@src/Options.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';

let extensionsString: string = '';

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

const runOnStart = async () => {
  await chrome.runtime.sendMessage({ type: 'readBrowserExtensions' });
};

runOnStart();

const waitForExtensionsString = async (timeout: number) => {
  let start = Date.now();
  return new Promise((resolve, reject) => {
    if (extensionsString !== '') {
      resolve(extensionsString);
    } else if (timeout && Date.now() - start >= timeout) {
      resolve('Failed to load browser extensions');
    } else {
      setTimeout(resolve, timeout, [timeout]);
    }
  });
};

const getWebGLStrings = () => {
  const canvas = document.createElement('canvas');
  const webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const webglVendor = webgl.getExtension('WEBGL_debug_renderer_info');
  let webglVendorString = webgl.getParameter(webglVendor.UNMASKED_VENDOR_WEBGL);
  let webglRendererString = webgl.getParameter(webglVendor.UNMASKED_RENDERER_WEBGL);
  return [webglVendorString, webglRendererString];
};

const getSystemFonts = async () => {
  let listOfSystemFonts: string = '';
  const availableFonts = await chrome.fontSettings.getFontList();
  availableFonts.forEach(font => (listOfSystemFonts += `${font.displayName}, `));
  listOfSystemFonts = listOfSystemFonts.replace(/,\s*$/, '');
  return listOfSystemFonts;
};

const Options = async () => {
  await waitForExtensionsString(250);
  const icon = 'popup/icon.svg';
  const timeZoneoffset = new Date().getTimezoneOffset();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const webGLStrings = getWebGLStrings();

  return (
    <div className="bg-gray-100 px-20 py-10 text-center">
      <div className="flex items-center justify-center space-x-2">
        <img src={chrome.runtime.getURL(icon)} className="mb-11.5 h-20" alt="icon" />
        <h1 className="font-sans font-medium text-gray-700 text-5xl my-2.5"> PrivacyPal </h1>
      </div>
      <h2 className="font-sans font-medium text-gray-700 text-2xl my-3">Headers</h2>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>User Agent:</b> {navigator.userAgent}
      </p>

      <h2 className="font-sans font-medium text-gray-700 text-2xl my-3">Browser Characteristics</h2>
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

      <h2 className="font-sans font-medium text-gray-700 text-2xl my-3">Fingerprint Metrics</h2>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>System Fonts:</b> {getSystemFonts()}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Cookies enabled:</b> {navigator.cookieEnabled == true ? 'True' : 'False'}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>WebGL Vendor:</b> {webGLStrings[0]}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>WebGL Renderer:</b> {webGLStrings[1]}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Do not track header set:</b> {navigator.doNotTrack != null ? 'True' : 'False'}
      </p>
      <p className="font-sans font-normal text-gray-500 text-base mb-1">
        <b>Language:</b> {navigator.language}
      </p>

      <h2 className="font-sans font-medium text-gray-700 text-2xl my-3">Hardware Specs</h2>
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
        <b>Device memory:</b> at least {navigator.deviceMemory}GB
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
