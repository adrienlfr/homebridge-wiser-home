import { BehaviorSubject } from 'rxjs';
import WiserDevice from './WiserDevice';
import { IShutter } from '../dataSource/interface';

class Shutter extends WiserDevice {
  constructor(shutter: IShutter) {
    super({id: shutter.id, deviceId: shutter.DeviceId, endpoint: shutter.Endpoint, name: shutter.Name});
    this.currentLift.next(shutter.CurrentLift);
    this.targetLift.next(shutter.TargetLift);
    this.liftMovement.next(shutter.LiftMovement);
  }

  static identifier = 'Shutter';

  readonly currentLift = new BehaviorSubject<number>(100);
  readonly targetLift = new BehaviorSubject<number>(100);
  readonly liftMovement = new BehaviorSubject<string>('Stopped');

  update(shutter: IShutter): void {
    if (this.deviceId === shutter.DeviceId) {
      this.currentLift.next(shutter.CurrentLift);
      this.targetLift.next(shutter.TargetLift);
      this.liftMovement.next(shutter.LiftMovement);
    }
  }
}

export default Shutter;
