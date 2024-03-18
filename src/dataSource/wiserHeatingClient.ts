import { WiserHub } from '../models';
import { IWiserDevice,
  WiserDeviceBuilder,
  IWiserDeviceBuilder,
  ShutterFactory,
  LightFactory,
} from './interface';
import { TextDecoderStream } from 'stream/web';
import { Observable, firstValueFrom, from, retry, shareReplay, switchMap, timer } from 'rxjs';

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

  constructor({endpoint, secretProvider, refreshInterval}: WiserHeatingClientProps) {
    this._endpoint = endpoint;
    this._secretProvider = secretProvider;
    this._refreshInterval = refreshInterval;
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
  private _refreshInterval: number;

  cache$?: Observable<WiserHub>;

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

    if (!this.cache$) {
      const timer$ = timer(0, this._refreshInterval);


      this.cache$ = timer$.pipe(
        switchMap(async () => {
          const headers = await this._getRequestHeaders();
          return requestWiserHubData(this._endpoint, headers);
        }),
        shareReplay(CACHE_SIZE),
      );
    }

    return await firstValueFrom(this.cache$);
  }

  async getWiserDevice<T extends IWiserDevice>(
    builder: IWiserDeviceBuilder<T>,
    id: string,
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

  async requestAction<T extends IWiserDevice>(builder: IWiserDeviceBuilder<T>, id: number, body: string): Promise<void> {
    const deviceBuilder = new WiserDeviceBuilder(builder);
    const identifier = deviceBuilder.getIdentifier();

    return this.patchWiserdevice(identifier, RequestType.Action, id, body);
  }

  async requestOverride<T extends IWiserDevice>(builder: IWiserDeviceBuilder<T>, id: number, body: string): Promise<void> {
    const deviceBuilder = new WiserDeviceBuilder(builder);
    const identifier = deviceBuilder.getIdentifier();

    return this.patchWiserdevice(identifier, RequestType.Override, id, body);
  }

  async patchWiserdevice(identifier: string, requestType: RequestType, id: number, body: string): Promise<void> {
    const headers = await this._getRequestHeaders();
    from(fetch(`http://${this._endpoint}/data/v2/domain/${identifier}/${id}/${requestType}`, {
      method: 'PATCH',
      headers: headers,
      body: body,
    })).pipe(
      retry({ delay: 2000 }),
    );
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
}

interface WiserHeatingClientProps {
  endpoint: string;
  secretProvider: SecretProvider;
  refreshInterval: number;
}

export default WiserHeatingClient;
