import React from 'react';
import { browser, Tabs } from 'webextension-polyfill-ts';

import './styles.scss';
import { DotLottiePlayer } from '@dotlottie/react-player';

interface PopupProps {
  foundLotties: { [lottieUrl: string]: any };
}

function openWebPage(url: string): Promise<Tabs.Tab> {
  return browser.tabs.create({ url });
}

function copyClipboard(url: string): void {
  navigator.clipboard.writeText(url);
}

const Popup: React.FC<PopupProps> = ({ foundLotties }) => {
  return (
    <section id="popup">
      <h2>Discovered Lotties</h2>
      <ul>
        {foundLotties.map((data: any) => (
          <li>
            <div className="preview">
              {
                <DotLottiePlayer
                  src={data.lottieUrl}
                  background="transparant"
                  className='player'
                  loop
                  autoplay
                >
                </DotLottiePlayer>
              }
            </div>
            <div className="details">
              <div className="detail">
                <span className="detail-key">Version</span>
                <span className="detail-value">{data.bmVersion}</span>
              </div>

              <div className="detail">
                <span className="detail-key">Height</span>
                <span className="detail-value">{data.height}</span>
              </div>

              <div className="detail">
                <span className="detail-key">Width</span>
                <span className="detail-value">{data.width}</span>
              </div>

              <div className="detail">
                <span className="detail-key">Frame Rate</span>
                <span className="detail-value">
                  {Number(data.frameRate).toFixed(2)}
                </span>
              </div>

              <div className="detail">
                <span className="detail-key">Num. Frames</span>
                <span className="detail-value">
                  {Math.ceil(data.numFrames)}
                </span>
              </div>

              <div className="detail">
                <span className="detail-key">Num. Layers</span>
                <span className="detail-value">
                  {Math.ceil(data.numLayers)}
                </span>
              </div>

              <div className="detail">
                <span className="detail-key">Is .lottie</span>
                <span className="detail-value">
                  {data.wasDotLottie ? 'Yes' : 'No'}
                </span>
              </div>

              {data.meta && (
                <>
                  <div className="detail">
                    <span className="detail-key">Generator</span>
                    <span className="detail-value">{data.meta.g}</span>
                  </div>

                  {data.meta.d && <div className="detail">
                    <span className="detail-key">Description</span>
                    <span className="detail-value">{data.meta.d}</span>
                  </div>}

                  {data.meta.a && <div className="detail">
                    <span className="detail-key">Author</span>
                    <span className="detail-value">{data.meta.a}</span>
                  </div>}

                  {data.meta.k && <div className="detail">
                    <span className="detail-key">Keywords</span>
                    <span className="detail-value">{data.meta.k}</span>
                  </div>}
                </>
              )}
            </div>
            <div className="actions">
              <a
                className="btn"
                onKeyDown={(): Promise<Tabs.Tab> => {
                  return openWebPage(data.lottieUrl);
                }}
                onClick={(): Promise<Tabs.Tab> => {
                  return openWebPage(data.lottieUrl);
                }}
              >
                Open URL
              </a>
              <span
                className="btn"
                onKeyDown={(): void => {
                  return copyClipboard(data.lottieUrl);
                }}
                onClick={(): void => {
                  return copyClipboard(data.lottieUrl);
                }}
              >
                Copy URL
              </span>
              <a
                className="btn"
                onKeyDown={(): Promise<Tabs.Tab> => {
                  return openWebPage(`https://editor.lottiefiles.com/?src=${encodeURI(data.lottieUrl)}`);
                }}
                onClick={(): Promise<Tabs.Tab> => {
                  return openWebPage(`https://editor.lottiefiles.com/?src=${encodeURI(data.lottieUrl)}`);
                }}
              >
                Edit Lottie
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Popup;
