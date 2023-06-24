export class DurationTime {
  protected startTime: [number, number];
  protected durationInMs = 0;

  public constructor() {
    this.startTime = process.hrtime();
  }

  public toMs() {
    if (this.durationInMs > 0) return this.durationInMs;
    const endTime = process.hrtime(this.startTime);
    this.durationInMs = endTime[0] * 1e3 + endTime[1] * 1e-6;
    return this.durationInMs;
  }

  public format() {
    return `${this.toMs().toFixed(3)}ms`;
  }
}
