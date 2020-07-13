import React from 'react';
import ReactDOM from 'react-dom';
import {browser} from 'webextension-polyfill-ts';

import Popup from './Popup';

let tabLotties: string[] = [];

browser.storage.local.get().then(async (data: any) => {
  try {
    const tab = await browser.tabs.query({ active: true, currentWindow: true });

    tabLotties = Object.keys(data)
      .filter((key) => (tab ? data[key].tabId === tab[0].id : true))
      .map((key) => {
        return data[key];
      });
  } catch (err) {
    // Do nothing
  }

  ReactDOM.render(
    <Popup foundLotties={tabLotties} />,
    document.getElementById('popup-root')
  );
});
