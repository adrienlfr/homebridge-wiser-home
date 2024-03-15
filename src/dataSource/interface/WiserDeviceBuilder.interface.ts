import IWiserDevice from './WiserDevice.interface';

export interface IWiserDeviceBuilder<T extends IWiserDevice> {
    identifier: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fromJson(json: any): T;
  }

class WiserDeviceBuilder<T extends IWiserDevice> {
  private inerfaceToCreate: IWiserDeviceBuilder<T>;

  constructor(inerfaceToCreate: IWiserDeviceBuilder<T>) {
    this.inerfaceToCreate = inerfaceToCreate;
  }

  getIdentifier(): string {
    return this.inerfaceToCreate.identifier;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build(device: IWiserDevice): T {
    return device as T;
  }
}

export default WiserDeviceBuilder;