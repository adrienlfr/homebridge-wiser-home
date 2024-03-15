abstract class Base {
    abstract name: string;
}

  interface BaseBuilder<T extends Base> {
    new (): T;
    identifier: string;
  }

class Device implements Base {
  constructor() {
    this.name = 'Device name';
  }

  name: string;

  static identifier = 'Device';
}

class Device2 implements Base {
  constructor() {
    this.name = 'Device2 name';
  }

  name: string;

  static identifier = 'Device2';
}

class BaseService<T extends Base> {
  private classToCreate: BaseBuilder<T>;

  constructor(classToCreate: BaseBuilder<T>) {
    this.classToCreate = classToCreate;
  }

  getIdentifier(): string {
    return this.classToCreate.identifier;
  }

  build(): T {
    return new this.classToCreate();
  }
}

function create<Type>(c: { new (): Type }): Type {
  return new c();
}

function identifierFn<T extends Base>(builder: BaseBuilder<T>) {
  const service = new BaseService(builder);
  const device = service.build();
  console.log(service.getIdentifier());
  console.log(device.name);
}

identifierFn(Device);
