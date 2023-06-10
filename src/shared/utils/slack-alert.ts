import os from 'node:os';
import util from 'node:util';

import { Utils } from '@/shared';
import { HttpMethod } from '@/shared/enums';
import { Env } from '@/shared/env/env';
import { InternalServerError } from '@/shared/errors';
import { httpRequest } from '@/shared/utils/http-request';

type Input = {
  color?: 'error' | 'warning' | 'info' | 'success' | string;
  checkerUsers?: string[];
  sections: {
    message: string;
    description?: string;
    [key: string]: any;
  };
  fields?: Record<string, any>;
  options?: {
    token?: string;
    username?: string;
    memberIds?: string;
    channel?: string;
  };
};

export class SlackAlert {
  public static async send(input: Input): Promise<void> {
    const {
      fields = {},
      sections,
      color = 'info',
      checkerUsers = [],
      options = {
        token: Env.get('SLACK_TOKEN'),
        channel: Env.get('SLACK_CHANNEL'),
        memberIds: Env.get('SLACK_MEMBERS_ID'),
        username: Env.get('SLACK_USERNAME'),
      },
    } = input;

    if (!options.token?.trim() || !options.channel?.trim()) return;
    if (options.memberIds?.length) {
      checkerUsers.push(...options.memberIds.split(','));
    }

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
                  Utils.removeUndefined({
                    'Date': new Date().toISOString(),
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
                  text: util.format('*%s*\n%s', Utils.ucFirst(title), value),
                })),
              },
              ...Object.entries(Utils.removeUndefined(sections)).map(
                ([title, value]) => ({
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*${Utils.ucFirst(title)}*\n${value}`,
                  },
                }),
              ),
            ],
          },
        ],
      }),
    });

    if (!response.body?.ok) {
      throw new InternalServerError({
        code: 'SLACK_ALERT:RETURNS_ERROR',
        message: 'Error sending logs to slack',
        metadata: response.body,
        sendToSlack: false,
      });
    }
  }

  public static getColor(color: Input['color']): string {
    if (color === 'error') return '#D32F2F';
    if (color === 'warning') return '#F57C00';
    if (color === 'success') return '#388E3C';
    if (color === 'info') return '#0288D1';
    return <string>color;
  }
}
