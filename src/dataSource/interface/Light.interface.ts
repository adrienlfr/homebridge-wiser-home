import IWiserDevice from './WiserDevice.interface';

interface ILight extends IWiserDevice {
  IsDimmable: boolean;
  CurrentState?: string;
  CurrentPercentage?: number;
  CurrentLevel?: number;
  TargetState: string;
  TargetPercentage: number;
}

export abstract class LightFactory {
  static identifier = 'Light';

  static fromJson(json: object): ILight {
    function validate(condition: boolean, message: string) {
      if (condition) {
        return;
      }
      throw Error(`Failed to load Light: ${message}.\n\n${json}`);
    }

    ['TargetPercentage']
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

    ['CurrentPercentage', 'CurrentLevel']
      .forEach((numberField) => {
        const value = json[numberField];
        validate(
          value === undefined || typeof value === 'number',
          `field "${numberField}" was not a number, was "${value}"`,
        );
      });

    ['TargetState']
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

    ['CurrentState']
      .forEach((stringField) => {
        const value = json[stringField];
        validate(
          value === undefined || typeof value === 'string',
          `field "${stringField}" was not a string, was "${value}"`,
        );
      });

    ['IsDimmable']
      .forEach((booleanField) => {
        const value = json[booleanField];
        validate(
          value !== undefined,
          `did not contain required field "${booleanField}"`,
        );
        validate(
          typeof value === 'boolean',
          `field "${booleanField}" was not a boolean, was "${value}"`,
        );
      });

    return json as ILight;
  }
}

export default ILight;
