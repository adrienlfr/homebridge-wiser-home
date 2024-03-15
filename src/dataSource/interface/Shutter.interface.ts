import IWiserDevice from './WiserDevice.interface';

interface IShutter extends IWiserDevice {
  CurrentLift: number;
  TargetLift: number;
  LiftMovement: string;
}

export abstract class ShutterFactory {
  static identifier = 'Shutter';

  static fromJson(json: object): IShutter {
    function validate(condition: boolean, message: string) {
      if (condition) {
        return;
      }
      throw Error(`Failed to load Shutter: ${message}.\n\n${json}`);
    }

    ['CurrentLift', 'TargetLift']
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

    ['LiftMovement']
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

    return json as IShutter;
  }
}

export default IShutter;
