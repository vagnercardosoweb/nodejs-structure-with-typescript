import os from 'node:os';
import util from 'node:util';

import moment from 'moment-timezone';

import { HttpMethod } from '@/enums';
import { Env } from '@/shared/env';
import { httpRequest, HttpResponse } from '@/shared/http-request';
import { Util } from '@/shared/util';

type Input = {
  color?: 'error' | 'warning' | 'info';
  checkerUsers?: string[];
  sections: {
    message: string;
    description?: string;
    [key: string]: any;
  };
  fields?: Record<string, any>;
  options?: {
    token?: string;
    channel?: string;
    username?: string;
  };
};

export class Slack {
  public static async sendMessage(input: Input): Promise<HttpResponse | null> {
    const {
      fields = {},
      sections,
      color = 'info',
      checkerUsers = [],
      options = {
        token: Env.get('SLACK_TOKEN'),
        channel: Env.get('SLACK_CHANNEL', 'logs-api'),
        username: Env.get('SLACK_USERNAME', 'api'),
      },
    } = input;

    if (!options.token?.trim()) return null;
    if (checkerUsers.length === 0) checkerUsers.push('U0174ABMTUH');

    const response = await httpRequest({
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json; charset=utf8',
        'Authorization': `Bearer ${options.token}`,
      },
      url: 'https://slack.com/api/chat.postMessage',
      body: JSON.stringify({
        channel: options.channel,
        attachments: [
          {
            color: this.getColor(color),
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: util.format(
                    'Log from context `%s`, environment `%s`.',
                    options.username,
                    Env.get('NODE_ENV'),
                  ),
                },
                fields: Object.entries(
                  Util.removeUndefined({
                    'Date': moment().format('YYYY-MM-DD LTS Z'),
                    'Checker': checkerUsers
                      .map((user) => `<@${user}>`)
                      .join(', '),
                    'Hostname/PID': util.format(
                      '%s/%s',
                      os.hostname(),
                      process.pid,
                    ),
                    ...fields,
                  }),
                ).map(([title, value]) => ({
                  type: 'mrkdwn',
                  text: util.format('*%s*\n%s', Util.ucFirst(title), value),
                })),
              },
              ...Object.entries(Util.removeUndefined(sections)).map(
                ([title, value]) => ({
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*${Util.ucFirst(title)}*\n${value}`,
                  },
                }),
              ),
            ],
          },
        ],
      }),
    });
    return response.body;
  }

  public static getColor(color: Input['color']): string {
    if (color === 'warning') return '#F57C00';
    if (color === 'error') return '#D32F2F';
    return '#388E3C';
  }
}
