import {WiserHomeHomebridgePlatform} from '../platform';
import {PlatformAccessory, Service} from 'homebridge';
import WiserHeatingClient from '../dataSource/wiserHeatingClient';
import { ILight, LightFactory } from '../dataSource/interface';
import { Light } from '../models';
import { filter, switchMap } from 'rxjs';

class LightAccessory {
  private service: Service;
  private _apiClient: WiserHeatingClient;
  private _selfDevice: Light;

  static productsTypes = ['DimmableLight', 'OnOffLight'];

  constructor(
    private readonly platform: WiserHomeHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this._apiClient = WiserHeatingClient.getInstance();

    this.service = accessory.getService(platform.Service.Lightbulb) ||
      accessory.addService(platform.Service.Lightbulb);

    const light = accessory.context.device as ILight;
    this._selfDevice = new Light(light);

    this.service.setCharacteristic(platform.Characteristic.Name, light.Name);

    this._apiClient.cache$?.pipe(
      switchMap((wiserHub) => wiserHub.lights),
      filter<ILight>((light) => light.id === this._selfDevice.id),
    ).subscribe(next => this._selfDevice.update(next));

    this._selfDevice.currentState.subscribe((value) => {
      this.service.getCharacteristic(platform.Characteristic.On)
        .updateValue(value === 'On');
    });
    this.service.getCharacteristic(platform.Characteristic.On)
      .onGet(this.handleOnGet.bind(this))
      .onSet(this.handleOnSet.bind(this));

    if (accessory.context.device.isDimmable) {
      this._selfDevice.currentPercentage.subscribe((value) => {
        this.service.getCharacteristic(platform.Characteristic.Brightness)
          .updateValue(value ?? 0);
      });
      this.service.getCharacteristic(platform.Characteristic.Brightness)
        .onGet(this.handleBrightnessGet.bind(this))
        .onSet(this.handleBrightnessSet.bind(this));
    }
  }

  /**
   * Handle requests to get the current value of the "On" characteristic
   */
  async handleOnGet() {
    this.platform.log.debug(`[Light ${this.accessory.context.device.id}] Triggered GET On`);
    return this._selfDevice.currentState.value === 'On';
  }

  /**
   * Handle requests to get the current value of the "On" characteristic
   */
  async handleOnSet(value) {
    const targetState = value ? 'On': 'Off';
    this.platform.log.debug(`[Light ${this.accessory.context.device.id}] Triggered SET On: ${targetState}`);
    const body = {
      State: targetState,
    };
    void this._apiClient.requestOverride(LightFactory, this.accessory.context.device.id, JSON.stringify(body));
  }

  /**
   * Handle requests to get the current value of the "Brightness" characteristic
   */
  async handleBrightnessGet() {
    this.platform.log.debug(`[Light ${this.accessory.context.device.id}] Triggered GET Brightness`);
    return this._selfDevice.currentPercentage.value ?? 0;
  }

  /**
   * Handle requests to get the current value of the "Brightness" characteristic
   */
  async handleBrightnessSet(value) {
    this.platform.log.debug(`[Light ${this.accessory.context.device.id}] Triggered SET Brightness: ${value}`);
    const body = {
      State: 'On',
      Percentage: value,
    };
    void this._apiClient.requestOverride(LightFactory, this.accessory.context.device.id, JSON.stringify(body));
  }
}

export default LightAccessory;
