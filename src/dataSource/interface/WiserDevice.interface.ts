export interface IWiserDevice {
  id: number;
  DeviceId: number;
  Endpoint: number;
  Name: string;
}

export abstract class WiserDeviceValidator {
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

export default IWiserDevice;