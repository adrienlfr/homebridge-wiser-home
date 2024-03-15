import { IWiserDevice } from '../dataSource/interface';

abstract class WiserDevice {
  constructor({
    id,
    deviceId,
    endpoint,
    name,
  }: WiserDeviceProps) {
    this.id = id;
    this.deviceId = deviceId;
    this.endpoint = endpoint;
    this.name = name;
  }

  readonly id: number;
  readonly deviceId: number;
  readonly endpoint: number;
  readonly name: string;

  abstract update(device: IWiserDevice): void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static validateJson(json: any): void {
    function validate(condition: boolean, message: string) {
      if (condition) {
        return;
      }
      throw Error(`Failed to load Light: ${message}.\n\n${json}`);
    }

    ['id', 'DeviceId', 'Endpoint']
      .forEach((numberField) => {
        const value = json[numberField];
        validate(
          value !== undefined,
          `did not contain required field "${numberField}"`,
        );
        validate(
          typeof value === 'number',
          `field "${numberField}" was not a number, was "${value}"`,
        );
      });

    ['Name']
      .forEach((stringField) => {
        const value = json[stringField];
        validate(
          value !== undefined,
          `did not contain required field "${stringField}"`,
        );
        validate(
          typeof value === 'string',
          `field "${stringField}" was not a string, was "${value}"`,
        );
      });
  }
}

export interface WiserDeviceProps {
    id: number;
    deviceId: number;
    endpoint: number;
    name: string;
}

export default WiserDevice;