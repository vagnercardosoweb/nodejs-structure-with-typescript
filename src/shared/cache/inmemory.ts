import { CacheDefaultValue, CacheInterface } from './cache';

export class InMemoryCache implements CacheInterface {
  private readonly cached = new Map<string, Cached>();

  public async clear(): Promise<boolean> {
    this.cached.clear();
    return true;
  }

  public withLoggerId(_id: string): CacheInterface {
    return this;
  }

  public async get<T>(
    key: string,
    defaultValue?: CacheDefaultValue<T>,
    expireInSeconds?: number,
  ): Promise<T | null> {
    const result = this.cached.get(key);

    if (
      result !== undefined &&
      (result.expires === -1 || result.expires > Date.now())
    ) {
      return result.value;
    }

    if (defaultValue !== undefined) {
      const value =
        typeof defaultValue === 'function'
          ? await defaultValue()
          : defaultValue;
      await this.set(key, value, expireInSeconds);
      return value;
    }

    if (result?.value) await this.delete(key);

    return null;
  }

  public async has(key: string): Promise<boolean> {
    const result = await this.get(key);
    return result !== null;
  }

  public async delete(key: string): Promise<boolean> {
    return this.cached.delete(key);
  }

  public async set<T>(
    key: string,
    value: T,
    expireInSeconds?: number,
  ): Promise<void> {
    let expires = -1;
    if (expireInSeconds && expireInSeconds > 0) {
      expires = Date.now() + expireInSeconds;
    }
    this.cached.set(key, { expires, value });
  }
}

type Cached = {
  value: any;
  expires: number;
};
