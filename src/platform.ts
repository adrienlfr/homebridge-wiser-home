import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import WiserHeatingClient from './dataSource/wiserHeatingClient';
import { LightAccessory, ShutterAccessory } from './accessories';
import { Device } from './models';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class WiserHomeHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  readonly _apiClient: WiserHeatingClient;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    this._apiClient = WiserHeatingClient.getInstance({
      endpoint: this.config.ipAddress,
      secretProvider: () => Promise.resolve(this.config.secret),
      refreshInterval: this.config.refreshInterval,
    });
    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', async () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      await this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices(): Promise<void> {
    const wiserHub = await this._apiClient.getWiserHubData();

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of wiserHub.devices) {
      if ((ShutterAccessory.productsTypes.indexOf(device.productType) !== -1 ||
      LightAccessory.productsTypes.indexOf(device.productType) !== -1)) {

        // generate a unique id for the accessory this should be generated from
        // something globally unique, but constant, for example, the device serial
        // number or MAC address
        const uuid = this.api.hap.uuid.generate(device.serialNumber!);

        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

        if (existingAccessory) {
        // the accessory already exists
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          this.createAccessoryForDevice(device, existingAccessory);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        } else {
          const wiserDevice = wiserHub.getWiserDevice(device);
          this.log.debug('shutters:', JSON.stringify(wiserHub.shutters.find((shutter) => {
            this.log.debug('DeviceId:', shutter.DeviceId);
            this.log.debug('id:', device.id);
            return shutter.DeviceId === device.id;
          })));


          if (wiserDevice !== undefined) {
          // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory:', wiserDevice.Name);

            // create a new accessory
            const accessory = new this.api.platformAccessory(wiserDevice.Name, uuid);

            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = wiserDevice;

            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            this.createAccessoryForDevice(device, accessory);

            // link the accessory to your platform
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          }
        }
      }
    }
  }

  createAccessoryForDevice(device: Device, accessory: PlatformAccessory): void {
    if (ShutterAccessory.productsTypes.indexOf(device.productType) !== -1) {
      new ShutterAccessory(this, accessory);
    } else if (LightAccessory.productsTypes.indexOf(device.productType) !== -1) {
      new LightAccessory(this, accessory);
    }
  }
}
