import { WiserHomeHomebridgePlatform } from '../platform';
import { PlatformAccessory, Service } from 'homebridge';
import WiserHeatingClient from '../dataSource/wiserHeatingClient';
import { IShutter, ShutterFactory } from '../dataSource/interface';
import { Device, Shutter } from '../models';
import { filter, switchMap } from 'rxjs';

class ShutterAccessory {
  private service: Service;
  private _apiClient: WiserHeatingClient;
  private _selfDevice: Shutter;

  static productsTypes = ['Shutter'];

  constructor(
    private readonly platform: WiserHomeHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this._apiClient = WiserHeatingClient.getInstance();

    this.service = accessory.getService(platform.Service.WindowCovering) ||
      accessory.addService(platform.Service.WindowCovering);

    const device = accessory.context.device as Device;
    const shutter = accessory.context.wiserDevice as IShutter;
    this._selfDevice = new Shutter(shutter);

    accessory.getService(platform.Service.AccessoryInformation)
      ?.setCharacteristic(platform.Characteristic.Name, shutter.Name)
      .setCharacteristic(platform.Characteristic.Manufacturer, 'Schneider - Wiser')
      .setCharacteristic(platform.Characteristic.Model, device.productType)
      .setCharacteristic(platform.Characteristic.Model, device.productIdentifier)
      .setCharacteristic(platform.Characteristic.SerialNumber, device.serialNumber ?? '')
      .setCharacteristic(platform.Characteristic.Version, device.activeFirmwareVersion);

    this._apiClient.cache$?.pipe(
      switchMap((wiserHub) => wiserHub.shutters),
      filter<IShutter>((shutter) => shutter.id === this._selfDevice.id),
    ).subscribe(next => this._selfDevice.update(next));

    this._selfDevice.currentLift.subscribe((value) => {
      this.service.getCharacteristic(platform.Characteristic.CurrentPosition)
        .updateValue(value);
    });
    this.service.getCharacteristic(platform.Characteristic.CurrentPosition)
      .onGet(this.handleCurrentPositionGet.bind(this));

    this._selfDevice.liftMovement.subscribe((value) => {
      const positionState = this.convertLiftMovementToPositionState(value);
      this.service.getCharacteristic(platform.Characteristic.PositionState)
        .updateValue(positionState);
    });
    this.service.getCharacteristic(platform.Characteristic.PositionState)
      .onGet(this.handlePositionStateGet.bind(this));

    this._selfDevice.targetLift.subscribe((value) => {
      this.service.getCharacteristic(platform.Characteristic.TargetPosition)
        .updateValue(value);
    });
    this.service.getCharacteristic(platform.Characteristic.TargetPosition)
      .onGet(this.handleTargetPositionGet.bind(this))
      .onSet(this.handleTargetPositionSet.bind(this));
  }

  /**
   * Handle requests to get the current value of the "Current Position" characteristic
   */
  async handleCurrentPositionGet() {
    this.platform.log.debug(`[Shutter ${this.accessory.context.device.id}] Triggered GET CurrentPosition`);
    return this._selfDevice.currentLift.value;
  }


  /**
   * Handle requests to get the current value of the "Position State" characteristic
   */
  async handlePositionStateGet() {
    this.platform.log.debug(`[Shutter ${this.accessory.context.device.id}] Triggered GET PositionState`);
    return this.convertLiftMovementToPositionState(this._selfDevice.liftMovement.value);
  }


  /**
   * Handle requests to get the current value of the "Target Position" characteristic
   */
  async handleTargetPositionGet() {
    this.platform.log.debug(`[Shutter ${this.accessory.context.device.id}] Triggered GET TargetPosition`);
    return this._selfDevice.targetLift.value;
  }

  /**
   * Handle requests to set the "Target Position" characteristic
   */
  handleTargetPositionSet(value) {
    this.platform.log.debug(`[Shutter ${this.accessory.context.device.id}] Triggered SET TargetPosition: ${value}`);
    const body = {
      Action: 'LiftTo',
      Percentage: value,
    };
    void this._apiClient.requestAction(ShutterFactory, this.accessory.context.device.id, JSON.stringify(body));
  }

  convertLiftMovementToPositionState(value: string): number {
    switch (value) {
      case 'Opening':
        return this.platform.Characteristic.PositionState.INCREASING;
      case 'Closing':
        return this.platform.Characteristic.PositionState.DECREASING;
      default:
        return this.platform.Characteristic.PositionState.STOPPED;
    }
  }
}

export default ShutterAccessory;
