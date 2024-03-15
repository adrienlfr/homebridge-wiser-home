import {WiserHomeHomebridgePlatform} from '../platform';
import {PlatformAccessory, Service} from 'homebridge';
import WiserHeatingClient from '../dataSource/wiserHeatingClient';
import { ILight, LightFactory } from '../dataSource/interface';
import { Light } from '../models';

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

    this.service.getCharacteristic(platform.Characteristic.On)
      .onGet(this.handleOnGet.bind(this))
      .onSet(this.handleOnSet.bind(this));

    if (accessory.context.device.isDimmable) {
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
    this.updateDevice();
    return this._selfDevice.currentState.value === 'On';
  }


  /**
   * Handle requests to get the current value of the "On" characteristic
   */
  async handleOnSet(value) {
    const targetState = value ? 'On': 'Off';
    this.platform.log.debug(`[Light ${this.accessory.context.device.id}] Triggered SET On: ${targetState}`);
    try {
      const body = {
        State: targetState,
      };
      void this._apiClient.requestOverride(LightFactory, this.accessory.context.device.id, JSON.stringify(body));
    } catch (e) {
      // this.platform.log.error(e.toString());
    }
  }

  /**
   * Handle requests to get the current value of the "Brightness" characteristic
   */
  async handleBrightnessGet() {
    this.platform.log.debug(`[Light ${this.accessory.context.device.id}] Triggered GET Brightness`);
    this.updateDevice();
    return this._selfDevice.currentPercentage.value ?? 0;
  }


  /**
   * Handle requests to get the current value of the "Brightness" characteristic
   */
  async handleBrightnessSet(value) {
    this.platform.log.debug(`[Light ${this.accessory.context.device.id}] Triggered SET Brightness: ${value}`);
    try {
      const body = {
        State: 'On',
        Percentage: value,
      };
      void this._apiClient.requestOverride(LightFactory, this.accessory.context.device.id, JSON.stringify(body));
    } catch (e) {
      // this.platform.log.error(e.toString());
    }
  }

  updateDevice(): void {
    this._apiClient
      .getWiserDevice(LightFactory, this.accessory.context.device.id)
      .then((value) => this._selfDevice.update(value))
      .catch((error) => this.platform.log.error(error));
  }
}

export default LightAccessory;
