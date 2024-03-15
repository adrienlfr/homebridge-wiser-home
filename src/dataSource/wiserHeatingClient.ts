import { WiserHub } from '../models';
import { IWiserDevice,
  WiserDeviceBuilder,
  IWiserDeviceBuilder,
  ShutterFactory,
  LightFactory,
} from './interface';
import { ReadableStream, TextDecoderStream } from 'stream/web';
import { Observable, firstValueFrom, shareReplay, switchMap, timer } from 'rxjs';


const REFRESH_INTERVAL = 5000;
const CACHE_SIZE = 1;

/**
 * Signature for the authentication secret provider.
 */
type SecretProvider = () => Promise<string | null>;

enum RequestType {
  Action = 'RequestAction',
  Override = 'RequestOverride',
}

class WiserHeatingClient {
  private static instance: WiserHeatingClient;

  constructor({endpoint, secretProvider}: WiserHeatingClientProps) {
    this._endpoint = endpoint;
    this._secretProvider = secretProvider;
  }

  public static getInstance(
    options: WiserHeatingClientProps | undefined = undefined,
  ): WiserHeatingClient {
    if (!WiserHeatingClient.instance) {
      if (options === undefined) {
        throw Error('The first call of getInstance require a WiserHeatingClientProps');
      }
      WiserHeatingClient.instance = new WiserHeatingClient(options);
    }

    return WiserHeatingClient.instance;
  }

  private _endpoint: string;
  private _secretProvider: SecretProvider;

  private _cache$?: Observable<WiserHub>;
  private _lastUpdateAt?: number;

  async getWiserHubData(): Promise<WiserHub> {
    async function requestWiserHubData(endpoint: string, headers: Headers): Promise<WiserHub> {
      const response = await fetch(`http://${endpoint}/data/v2/domain/`, {
        headers: headers,
      });

      let responseText = '';
      const stringStream = response.body!.pipeThrough(new TextDecoderStream());
      for await (const chunk of stringStream) {
        responseText += chunk;
      }

      const json = JSON.parse(responseText);
      return WiserHub.fromJson(json);
    }

    if (!this._cache$) {
      const timer$ = timer(0, REFRESH_INTERVAL);


      this._cache$ = timer$.pipe(
        switchMap(async () => {
          const headers = await this._getRequestHeaders();
          return requestWiserHubData(this._endpoint, headers);
        }),
        shareReplay(CACHE_SIZE),
      );
    }

    return await firstValueFrom(this._cache$);
  }

  async getWiserDevice<T extends IWiserDevice>(
    builder: IWiserDeviceBuilder<T>,
    id: string
  ): Promise<T> {
    const deviceBuilder = new WiserDeviceBuilder(builder);
    const identifier = deviceBuilder.getIdentifier();

    const wiserHub = await this.getWiserHubData();
    let device: IWiserDevice | undefined;

    switch(identifier) {
      case ShutterFactory.identifier:
        device = wiserHub.shutters.find((shutter) => shutter.id === Number(id));
        break;
      case LightFactory.identifier:
        device = wiserHub.lights.find((light) => light.id === Number(id));
        break;

    }


    if (device) {
      return deviceBuilder.build(device);
    } else {
      throw Error(`Cannot find device (${identifier}) ${id}`);
    }
  }

  async requestAction<T extends IWiserDevice>(builder: IWiserDeviceBuilder<T>, id: string, body: string): Promise<void> {
    const deviceBuilder = new WiserDeviceBuilder(builder);
    const identifier = deviceBuilder.getIdentifier();

    return this.patchWiserdevice(identifier, RequestType.Action, id, body);
  }

  async requestOverride<T extends IWiserDevice>(builder: IWiserDeviceBuilder<T>, id: string, body: string): Promise<void> {
    const deviceBuilder = new WiserDeviceBuilder(builder);
    const identifier = deviceBuilder.getIdentifier();

    return this.patchWiserdevice(identifier, RequestType.Override, id, body);
  }

  async patchWiserdevice(identifier: string, requestType: RequestType, id: string, body: string): Promise<void> {
    const headers = await this._getRequestHeaders();
    await fetch(`http://${this._endpoint}/data/v2/domain/${identifier}/${id}/${requestType}`, {
      method: 'PATCH',
      headers: headers,
      body: body,
    });
  }

  async _getRequestHeaders(): Promise<Headers> {
    const secret = await this._secretProvider();
    const meta: string[][] = [
      ['Content-Type', 'application/json'],
      ['accept', '*/*'],
    ];
    if (secret) {
      meta.push(['secret', secret]);
    }

    return new Headers(meta);
  }

  _checkCacheDate() {
    if (this._lastUpdateAt && (Date.now() - this._lastUpdateAt) > REFRESH_INTERVAL) {
      this._cache$ = undefined;
    }
  }

  async _streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
    let result = '';
    const stringStream = stream.pipeThrough(new TextDecoderStream());
    for await (const chunk of stringStream) {
      result += chunk;
    }
    return result;
  }
}

interface WiserHeatingClientProps {
  endpoint: string;
  secretProvider: SecretProvider;
}

export default WiserHeatingClient;
