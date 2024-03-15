import { ILight, IShutter, IWiserDevice, LightFactory, ShutterFactory } from '../dataSource/interface';
import { Device } from './index';

class WiserHub {
  constructor({
    devices = [],
    lights = [],
    shutters = [],
  }: WiserHubProps) {
    this.devices = devices;
    this.lights = lights;
    this.shutters = shutters;
  }

  devices: Device[];
  shutters: IShutter[];
  lights: ILight[];

  static fromJson(json: object): WiserHub {
    function validate(condition: boolean, message: string) {
      if (condition) {
        return;
      }
      throw Error(`Failed to load WiserHub: ${message}.\n\n${json}`);
    }

    ['Device', 'Light', 'Shutter']
      .forEach((objectField) => {
        const value = json[objectField];
        validate(
          value !== undefined,
          `did not contain required field "${objectField}"`,
        );
      });

    const devices = json['Device'].map(Device.fromJson);
    const lights = json['Light'].map(LightFactory.fromJson);
    const shutters = json['Shutter'].map(ShutterFactory.fromJson);

    return new WiserHub({
      devices: devices,
      lights: lights,
      shutters: shutters,
    });
  }

  getWiserDevice(device: Device): IWiserDevice | undefined {
    const shutter = this.shutters.find((shutter) => shutter.DeviceId === device.id);
    if (shutter) {
      return shutter;
    }
    const ligth = this.lights.find((ligth) => ligth.DeviceId === device.id);
    if (ligth) {
      return ligth;
    }

    return undefined;
  }
}

type WiserHubProps = {
  devices: Device[];
  lights: ILight[];
  shutters: IShutter[];
};

export default WiserHub;
