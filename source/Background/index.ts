import {browser, WebRequest} from 'webextension-polyfill-ts';

const inspectedJsons: string[] = [];

const updateBadge = (tabId: number, documentUrl: string | undefined): void => {
  browser.storage.local.get((data: any) => {
    const tabLotties = Object.keys(data).filter(
      (key) => data[key].documentUrl === documentUrl
    );

    browser.browserAction.setBadgeText({
      tabId,
      text: tabLotties.length.toString(),
    });
  });
};

const getHeader = (
  headers: WebRequest.HttpHeaders,
  name: string
): string | null => {
  const lcName = name.toLowerCase();

  for (let i = 0; i < headers.length; i += 1) {
    if (headers[i].name.toLowerCase() === lcName) {
      return headers[i].value || null;
    }
  }
  return null;
};

const onCompletedListener = async (
  details: WebRequest.OnCompletedDetailsType
): Promise<void> => {
  if (details.statusCode === 200) {
    if (
      details.responseHeaders &&
      getHeader(details.responseHeaders, 'content-type') === 'application/json'
    ) {
      if (inspectedJsons.indexOf(details.url) === -1) {
        inspectedJsons.push(details.url);

        const response = await fetch(details.url, {
          method: details.method,
        });

        const json = await response.json();

        if (typeof json === 'object') {
          // Check if lottie
          const lottieLike = ['v', 'ip', 'op', 'layers', 'w', 'h', 'fr'].every(
            (key) => key in json
          );

          if (lottieLike) {
            browser.storage.local.set({
              [details.url]: {
                bmVersion: json.v,
                numLayers: json?.layers.length,
                width: json.w,
                height: json.h,
                frameRate: json.fr,
                numFrames: json.op - json.ip,
                meta: 'meta' in json ? json.meta : null,
                lottieUrl: details.url,
                documentUrl: details.documentUrl,
              },
            });

            updateBadge(details.tabId, details.documentUrl);
          }
        }
      }
    }
  }
};

browser.browserAction.setBadgeTextColor({
  color: '#444',
});
browser.browserAction.setBadgeBackgroundColor({
  color: 'rgb(15, 204, 206)',
});

browser.webRequest.onCompleted.addListener(
  onCompletedListener,
  {
    urls: ['<all_urls>'],
  },
  ['responseHeaders']
);
