import os from 'node:os';
import util from 'node:util';

import {
  Env,
  HttpMethod,
  httpRequest,
  InternalServerError,
  Utils,
} from '@/shared';

type Input = {
  color?: 'error' | 'warning' | 'info' | 'success' | string;
  checkerUsers?: string[];
  sections: Record<string, any>;
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
        username: Env.get('SLACK_USERNAME', Env.get('APPLICATION_NAME')),
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
                  text: util
                    .format(
                      '%s log from `%s` in `%s`.',
                      checkerUsers.map((user) => `<@${user}>`).join(', '),
                      options.username,
                      Env.get('NODE_ENV'),
                    )
                    .trim(),
                },
                fields: Object.entries(
                  Utils.removeUndefined({
                    'Date': new Date().toISOString(),
                    'Hostname / PID': util.format(
                      '%s / %s',
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
