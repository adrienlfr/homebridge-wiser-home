class Device {
  constructor({id, nodeId, productType, productIdentifier, serialNumber, activeFirmwareVersion, modelIdentifier}: DeviceProps) {
    this.id = id;
    this.nodeId = nodeId;
    this.productType = productType;
    this.productIdentifier = productIdentifier;
    this.serialNumber = serialNumber;
    this.activeFirmwareVersion = activeFirmwareVersion;
    this.modelIdentifier = modelIdentifier;
  }

  readonly id: number;
  readonly nodeId: number;
  readonly productType: string;
  readonly productIdentifier: string;
  readonly serialNumber?: string;
  readonly activeFirmwareVersion: string;
  readonly modelIdentifier: string;

  static fromJson(json: object): Device {
    function validate(condition: boolean, message: string) {
      if (condition) {
        return;
      }
      throw Error(`Failed to load Device: ${message}.\n\n${json}`);
    }

    ['id', 'NodeId']
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

    ['ProductType', 'ProductIdentifier', 'ActiveFirmwareVersion', 'ModelIdentifier']
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

    validate(
      json['SerialNumber'] === undefined || typeof json['SerialNumber'] === 'string',
      `field "SerialNumber" was not a string, was ${json['SerialNumber']}`,
    );

    return new Device({
      id: json['id'] as number,
      nodeId: json['NodeId'] as number,
      productType: json['ProductType'] as string,
      productIdentifier: json['ProductIdentifier'] as string,
      serialNumber: json['SerialNumber'] as string | undefined,
      activeFirmwareVersion: json['ActiveFirmwareVersion'] as string,
      modelIdentifier: json['ModelIdentifier'] as string,
    });
  }
}

type DeviceProps = {
  id: number;
  nodeId: number;
  productType: string;
  productIdentifier: string;
  serialNumber?: string;
  activeFirmwareVersion: string;
  modelIdentifier: string;
};

export default Device;
