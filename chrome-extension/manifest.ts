import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

/**
 * @prop default_locale
 * if you want to support multiple languages, you can use the following reference
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
 *
 * @prop browser_specific_settings
 * Must be unique to your extension to upload to addons.mozilla.org
 * (you can delete if you only want a chrome extension)
 *
 * @prop permissions
 * Firefox doesn't support sidePanel (It will be deleted in manifest parser)
 *
 * @prop content_scripts
 * css: ['content.css'], // public folder
 */
const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_extensionName__',
  browser_specific_settings: {
    gecko: {
      id: 'example@example.com',
      strict_min_version: '109.0',
    },
  },
  version: packageJson.version,
  description: '__MSG_extensionDescription__',
  host_permissions: ['<all_urls>'],
  permissions: ['storage', 'scripting', 'tabs', 'notifications', 'sidePanel', 'webRequest', 'management'],
  options_page: 'options/index.html',
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  action: {
    default_popup: 'popup/index.html',
    default_icon: 'icon-32.png',
  },
  icons: {
    128: 'icon-128.png',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      js: ['content/index.iife.js'],
    },
    // {
    //   matches: ['http://*/*', 'https://*/*', '<all_urls>'],
    //   js: ['content-ui/index.iife.js'],
    // },
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      css: ['content.css'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', '*.svg', 'icon-128.png', 'icon-32.png', 'trackerdb.engine'],
      matches: ['*://*/*'],
    },
  ],
  commands: {
    summarise: {
      suggested_key: {
        default: 'Ctrl+Shift+1',
      },
      description: 'Launches summarise function',
    },
    tracking: {
      suggested_key: {
        default: 'Ctrl+Shift+2',
      },
      description: 'Launches tracking locator function',
    },
    scan: {
      suggested_key: {
        default: 'Ctrl+Shift+3',
      },
      description: 'Initiate scan for website trackers',
    },
  },
} satisfies chrome.runtime.ManifestV3;

export default manifest;
