import process from 'node:process';

export class DurationTime {
  public start: [number, number];

  public constructor() {
    this.start = process.hrtime();
  }

  public milliseconds() {
    const finish = process.hrtime(this.start);
    return finish[0] * 1e3 + finish[1] * 1e-6;
  }

  public format(digits = 3) {
    return `${this.milliseconds().toFixed(digits)}ms`;
  }
}

export interface DurationTimeInterface {
  milliseconds(): number;
  format(): string;
}
