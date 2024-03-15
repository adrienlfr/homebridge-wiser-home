import WiserDevice from './WiserDevice';

export interface IWiserDeviceBuilder<T extends WiserDevice> {
    identifier: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fromJson(json: any): T;
  }

class WiserDeviceBuilder<T extends WiserDevice> {
  private classToCreate: IWiserDeviceBuilder<T>;

  constructor(classToCreate: IWiserDeviceBuilder<T>) {
    this.classToCreate = classToCreate;
  }

  getIdentifier(): string {
    return this.classToCreate.identifier;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build(json: any): T {
    WiserDevice.validateJson(json);
    return this.classToCreate.fromJson(json);
  }
}

export default WiserDeviceBuilder;