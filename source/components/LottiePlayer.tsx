import lottie, {AnimationConfig, AnimationItem} from 'lottie-web';
import * as React from 'react';

/**
 * Parse a resource into a JSON object or a URL string
 */
export function parseSrc(src: string | object): string | object {
  if (typeof src === 'object') {
    return src;
  }

  try {
    return JSON.parse(src);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Do nothing...
  }

  // Try construct an absolute URL from the src URL
  try {
    return new URL(src).toString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Do nothing...
  }

  return src;
}

// Define valid player states
export enum PlayerState {
  Loading = 'loading',
  Playing = 'playing',
  Paused = 'paused',
  Stopped = 'stopped',
  Frozen = 'frozen',
  Error = 'error',
}

// Define player events
export enum PlayerEvent {
  Load = 'load',
  Error = 'error',
  Ready = 'ready',
  Play = 'play',
  Pause = 'pause',
  Stop = 'stop',
  Freeze = 'freeze',
  Loop = 'loop',
  Complete = 'complete',
  Frame = 'frame',
}

export type PlayerDirection = -1 | 1;

export interface LottiePlayerProps {
  lottieRef?: (ref: AnimationItem) => void;
  onEvent?: (event: PlayerEvent) => any;
  onStateChange?: (state: PlayerState) => any;
  onBackgroundChange?: (color: string) => void;
  autoplay: boolean;
  background?: string;
  children?: React.ReactNode | React.ReactNode[];
  controls?: boolean;
  direction?: PlayerDirection;
  hover?: boolean;
  loop?: boolean | number;
  renderer?: 'svg' | 'canvas' | 'html';
  speed?: number;
  src: string;
  style?: {[key: string]: string | number};
}

interface LottiePlayerState {
  animationData: any;
  background: string;
  debug?: boolean;
  instance: AnimationItem | null;
  seeker: number;
  playerState: PlayerState;
}

// Build default config for lottie-web player
const defaultOptions: Partial<AnimationConfig> = {
  rendererSettings: {
    clearCanvas: false,
    hideOnTransparent: true,
    progressiveLoad: true,
  },
};

export class LottiePlayer extends React.Component<
  LottiePlayerProps,
  LottiePlayerState
> {
  public static getDerivedStateFromProps(
    nextProps: any,
    prevState: any
  ): null | {background: string} {
    if (nextProps.background !== prevState.background) {
      return {background: nextProps.background};
    }
    return null;
  }

  private container: Element | null = null;

  constructor(props: LottiePlayerProps) {
    super(props);

    this.state = {
      animationData: null,
      background: 'transparent',
      debug: true,
      instance: null,
      playerState: PlayerState.Loading,
      seeker: 1,
    };
  }

  public async componentDidMount(): Promise<void> {
    await this.createLottie();
  }

  public async componentDidUpdate(prevProps: any): Promise<void> {
    const {src} = this.props;
    const {instance} = this.state;

    if (src !== prevProps.src) {
      if (instance) {
        instance.destroy();
      }
      await this.createLottie();
    }
  }

  public componentWillUnmount(): void {
    const {instance} = this.state;

    if (instance) {
      instance.destroy();
    }
  }

  private setSeeker(seek: number, play = false): void {
    const {instance, playerState} = this.state;

    if (instance) {
      if (!play || playerState !== PlayerState.Playing) {
        instance.goToAndStop(seek, true);
      } else {
        instance.goToAndPlay(seek, true);
      }
    }
  }

  private async createLottie(): Promise<void> {
    const {autoplay, loop, lottieRef, renderer, src} = this.props;
    const {instance} = this.state;

    if (!src || !this.container) {
      return;
    }

    // Load the resource information
    try {
      // Parse the src to see if it is a URL or Lottie JSON data
      let animationData = parseSrc(src);

      if (typeof animationData === 'string') {
        const fetchResult = await fetch(animationData as string);
        animationData = await fetchResult.json();
      }

      // Clear previous animation, if any
      if (instance) {
        instance.destroy();
      }

      // Initialize lottie player and load animation
      const newInstance = lottie.loadAnimation({
        ...defaultOptions,
        animationData,
        autoplay: false,
        container: this.container as Element,
        loop: loop || true,
        renderer,
      });

      this.setState({animationData});

      // Handle new frame event
      newInstance.addEventListener('enterFrame', () => {
        this.triggerEvent(PlayerEvent.Frame);

        this.setState({
          seeker: Math.floor((newInstance as any).currentFrame),
        });
      });

      // Handle lottie-web ready event
      newInstance.addEventListener('DOMLoaded', () => {
        this.triggerEvent(PlayerEvent.Load);
      });

      // Handle animation data load complete
      newInstance.addEventListener('data_ready', () => {
        this.triggerEvent(PlayerEvent.Ready);
      });

      // Set error state when animation load fail event triggers
      newInstance.addEventListener('data_failed', () => {
        this.setState({playerState: PlayerState.Error});
      });

      this.setState({instance: newInstance}, () => {
        if (typeof lottieRef === 'function') {
          lottieRef(newInstance);
        }
        if (autoplay) {
          this.play();
        }
      });
    } catch (e) {
      this.setState({playerState: PlayerState.Error});
      console.log(e);
    }
  }

  private play(): void {
    const {instance} = this.state;

    if (instance) {
      this.triggerEvent(PlayerEvent.Play);

      instance.play();

      this.setState({playerState: PlayerState.Playing});
    }
  }

  private pause(): void {
    const {instance} = this.state;

    if (instance) {
      this.triggerEvent(PlayerEvent.Play);

      instance.pause();

      this.setState({playerState: PlayerState.Paused});
    }
  }

  private stop(): void {
    const {instance} = this.state;

    if (instance) {
      this.triggerEvent(PlayerEvent.Play);

      instance.stop();

      this.setState({playerState: PlayerState.Playing});
    }
  }

  private toggleDebug(): void {
    const {debug} = this.state;

    this.setState({debug: !debug});
  }

  private triggerEvent(event: PlayerEvent): void {
    const {onEvent} = this.props;

    if (onEvent) {
      onEvent(event);
    }
  }

  public render(): any {
    const {children, loop, style, onBackgroundChange} = this.props;
    const {
      animationData,
      instance,
      playerState,
      seeker,
      debug,
      background,
    } = this.state;

    return (
      <div>
        <div
          id="lottie"
          ref={(el: any): void => (this.container = el)}
          style={{
            background,
            margin: '0 auto',
            outline: 'none',
            overflow: 'hidden',
            ...style,
          }}
        />
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              animationData,
              background,
              debug,
              instance,
              loop,
              pause: () => this.pause(),
              play: () => this.play(),
              playerState,
              seeker,
              setBackground: (value: string) => {
                this.setState({background: value});

                if (typeof onBackgroundChange === 'function') {
                  onBackgroundChange(value);
                }
              },
              setSeeker: (f: number, p: boolean) => this.setSeeker(f, p),
              stop: () => this.stop(),
              toggleDebug: () => this.toggleDebug(),
            });
          }

          return null;
        })}
      </div>
    );
  }
}
