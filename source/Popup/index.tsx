import React from 'react';
import ReactDOM from 'react-dom';
import {browser} from 'webextension-polyfill-ts';

import Popup from './Popup';

let tabLotties: string[] = [];

browser.storage.local.get(async (data: any) => {
  const tab = await browser.tabs.query({active: true, currentWindow: true});

  tabLotties = Object.keys(data)
    .filter((key) => data[key].documentUrl === tab[0].url)
    .map((key) => {
      return data[key];
    });

  console.log(tabLotties);

  ReactDOM.render(
    <Popup foundLotties={tabLotties} />,
    document.getElementById('popup-root')
  );
});
