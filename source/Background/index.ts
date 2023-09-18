import { browser, WebRequest, WebNavigation } from "webextension-polyfill-ts";
import { debounce } from "ts-debounce";
import { validateDotLottie, getAnimations, getManifest } from '@dotlottie/dotlottie-js';


// Track all discovered JSONs
const inspectedJsons = new Map();

// Track all discovered .lotties
const inspectedDotLotties = new Map();

// Create a fast hash of a URL
const hashUrl = (url: string): number => {
  let hash = 0;
  let char: number;

  const len = url.length;

  if (len === 0) {
    return hash;
  }

  for (let i = 0; i < len; i++) {
    char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
};

// Check if given POJO resembles a Lottie
const isLottieLike = (json: object): boolean => {
  return ["v", "ip", "op", "layers", "w", "h", "fr"].every((key) => key in json);
};

// Update the extension badge with the number of discovered lotties.
const updateBadge = debounce(async (tabId: number): Promise<void> => {
  const data = await browser.storage.local.get();

  const tabLotties = Object.keys(data).filter((key) => data[key].tabId === tabId);

  await browser.browserAction.setBadgeText({
    tabId,
    text: tabLotties.length.toString(),
  });
}, 500);

const getHeader = (headers: WebRequest.HttpHeaders = [], name: string): string => {
  const lcName = name.toLowerCase();

  for (let i = 0; i < headers.length; i += 1) {
    if (headers[i].name.toLowerCase() === lcName) {
      return headers[i].value || '';
    }
  }

  return '';
};

const onRequestCompletedListener = async (details: WebRequest.OnCompletedDetailsType): Promise<void> => {
  // Skip non 200 HTTP responses and non GET requests
  if (details.statusCode !== 200 || details.method !== 'GET') {
    return;
  }

  const header = getHeader(details?.responseHeaders, "content-type");
  const headerJsonMatch = header.match(/^(application\/json|text\/plain)/);
  const headerDotLottieMatch = header.match(/^(application\/zip)/);

  // Skip non JSON and .zip (.lottie) mime-types
  if (!headerJsonMatch && !headerDotLottieMatch) {
    return;
  }

  // Create hash of the URL
  const hashKey = details.tabId + '-' + hashUrl(details.url);

  // Skip if URL has already been inspected
  if (inspectedJsons.has(hashKey)) {
    return;
  }

  // Skip if URL has already been inspected
  if (inspectedDotLotties.has(hashKey)) {
    return;
  }

  if (headerJsonMatch) {
  // Add to list of inspected JSONs
    inspectedJsons.set(hashKey, true);
  } else {
    // Add to list of inspected JSONs
    inspectedDotLotties.set(hashKey, true);
  }

  if (details.url.includes('.json')) {
    try {
      // Get contents of the request.
      // NOTE: Replace this with StreamFilter approach when Chrome and others start supporting it!
      const response = await fetch(details.url, { method: details.method });
  
      // Parse contents as JSON
      const json = await response.json();
  
      // Ensure JSON is a Lottie
      if (typeof json === "object" && isLottieLike(json)) {
        const tab = await browser.tabs.get(details.tabId);
  
        browser.storage.local.set({
          [hashKey]: {
            bmVersion: json.v,
            numLayers: json?.layers.length,
            width: json.w,
            height: json.h,
            frameRate: json.fr,
            numFrames: json.op - json.ip,
            meta: "meta" in json ? json.meta : null,
            lottieUrl: details.url,
            tabId: details.tabId,
            tabUrl: tab.url,
            wasDotLottie: false
          },
        });
  
        updateBadge(details.tabId);
      }
  
      inspectedJsons.delete(hashKey);
    } catch (err) {
      // Do nothing...
    }   
  } else if (details.url.includes('.lottie')) {
    try { 
      const response = await fetch(details.url, { method: details.method })
    
        // Parse contents as JSON
        const zip = await response.arrayBuffer();
  
        const validDotLottie = await validateDotLottie(new Uint8Array(zip));
  
        if (validDotLottie.success) {
          const animations = await getAnimations(new Uint8Array(zip), { inlineAssets: true});

          const manifest = await getManifest(new Uint8Array(zip))

          let animationValue;

          // Grab first animation
          if (manifest && manifest.animations) {
              if (manifest.activeAnimationId) {
                animationValue = animations[manifest.activeAnimationId];
              } else {
                animationValue = animations[manifest?.animations[0].id];
              }
            } else { 
              animationValue = animations[Object.keys(animations)[0]]
            } 

            // Ensure JSON is a Lottie
            if (typeof animationValue === "object" && isLottieLike(animationValue)) {
              const tab = await browser.tabs.get(details.tabId);
  
              browser.storage.local.set({
                [hashKey]: {
                  bmVersion: animationValue.v,
                  numLayers: animationValue?.layers.length,
                  width: animationValue.w,
                  height: animationValue.h,
                  frameRate: animationValue.fr,
                  numFrames: animationValue.op - animationValue.ip,
                  meta: "meta" in animationValue ? animationValue.meta : null,
                  lottieUrl: details.url,
                  tabId: details.tabId,
                  tabUrl: tab.url,
                  wasDotLottie: true
                },
              });
  
                updateBadge(details.tabId);
              }
              inspectedDotLotties.delete(hashKey);
              
        } 
    } catch (err) {
        // Do nothing...
    }
  }
};

const onNavigationBeforeNavigateListener = async (details: WebNavigation.OnBeforeNavigateDetailsType): Promise<void> => {
  if (details.frameId === 0) {
    const data = await browser.storage.local.get();

    // Clear out saved discovered Lotties for the tab
    Object.keys(data).forEach((key) => {
      if (data[key].tabId === details.tabId) {
        browser.storage.local.remove(key);
      }
    });
  }
}

// Set the badge background
browser.browserAction.setBadgeBackgroundColor({
  color: "rgb(15, 204, 206)",
});

// Attach the low level request listener
browser.webRequest.onCompleted.addListener(
  onRequestCompletedListener,
  {
    urls: ["<all_urls>"],
    types: ["xmlhttprequest"],
  },
  ["responseHeaders"]
);

browser.webNavigation.onBeforeNavigate.addListener(onNavigationBeforeNavigateListener);

console.log('Lottie Grabber is ready!');
