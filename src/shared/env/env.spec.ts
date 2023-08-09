import { beforeEach, describe, expect, it } from 'vitest';

import { NodeEnv } from '../enums';
import { Env } from './env';

describe('Env', () => {
  beforeEach(() => {
    process.env.TEST = 'TEST';
    process.env.NODE_ENV = NodeEnv.TEST;
  });

  it('should retrieve a correct env', () => {
    expect(Env.get('TEST')).toEqual('TEST');
  });

  it('should retrieve an env with default value', () => {
    const defaultValue = 'default value';
    expect(Env.get('NO_EXIST0', defaultValue)).toEqual(defaultValue);
  });

  it('should check if an env exists and return true', () => {
    expect(Env.has('TEST')).toBeTruthy();
  });

  it('should check if an env does not exist and return false', () => {
    expect(Env.has('NO_EXIST')).toBeFalsy();
  });

  it('should set an env inside process.env and retrieve its value', () => {
    Env.set('NEW_ENV', 'true');
    expect(Env.get('NEW_ENV')).toBeTruthy();
  });

  it('when setting a new env it cannot replace the existing one', () => {
    Env.set('TEST', 'NEW_VALUE', false);
    expect(Env.get('TEST')).toEqual('TEST');
  });

  it('should check if an env is required and return the correct value', () => {
    expect(Env.required('TEST')).toEqual('TEST');
  });

  it('should should try to retrieve a required env and return an error', () => {
    expect(() => Env.required('NO_EXIST')).toThrow(
      'Missing environment variable: NO_EXIST',
    );
  });

  it('should check the NODE_ENV if it is local', () => {
    process.env.NODE_ENV = NodeEnv.LOCAL;
    expect(Env.isLocal()).toBeTruthy();
  });

  it('should return true with env IS_LOCAL configured', () => {
    process.env.IS_LOCAL = 'true';
    expect(Env.isLocal()).toBeTruthy();
  });

  it('should check the NODE_ENV if it is test', () => {
    expect(Env.isTesting()).toBeTruthy();
  });

  it('should check the NODE_ENV if it is staging', () => {
    process.env.NODE_ENV = NodeEnv.STAGING;
    expect(Env.isStaging()).toBeTruthy();
  });

  it('should check the NODE_ENV if it is production', () => {
    process.env.NODE_ENV = NodeEnv.PRODUCTION;
    expect(Env.isProduction()).toBeTruthy();
  });
});
