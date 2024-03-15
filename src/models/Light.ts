import { BehaviorSubject } from 'rxjs';
import { ILight } from '../dataSource/interface';
import WiserDevice from './WiserDevice';

class Light extends WiserDevice {
  constructor(light: ILight) {
    super({id: light.id, deviceId: light.DeviceId, endpoint: light.Endpoint, name: light.Name});

    this.isDimmable = light.IsDimmable;
    this.currentState.next(light.CurrentState);
    this.currentPercentage.next(light.CurrentPercentage);
    this.currentLevel.next(light.CurrentLevel);
    this.targetState.next(light.TargetState);
    this.targetPercentage.next(light.TargetPercentage);
  }

  static identifier = 'Light';

  readonly isDimmable: boolean;
  readonly currentState = new BehaviorSubject<string | undefined>(undefined);
  readonly currentPercentage = new BehaviorSubject<number | undefined>(undefined);
  readonly currentLevel = new BehaviorSubject<number | undefined>(undefined);
  readonly targetState = new BehaviorSubject<string>('Off');
  readonly targetPercentage = new BehaviorSubject<number>(0);

  update(light: ILight): void {
    if (this.deviceId === light.DeviceId) {
      this.currentState.next(light.CurrentState);
      this.currentPercentage.next(light.CurrentPercentage);
      this.currentLevel.next(light.CurrentLevel);
      this.targetState.next(light.TargetState);
      this.targetPercentage.next(light.TargetPercentage);
    }
  }
}

export default Light;
