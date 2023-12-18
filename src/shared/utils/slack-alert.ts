import util from 'node:util';

import { HOSTNAME } from '@/config/constants';
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

    const now = new Date();
    const nodeEnv = Env.get('NODE_ENV');

    const response = await httpRequest({
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json; charset=utf8',
        'Authorization': `Bearer ${options.token}`,
      },
      url: 'https://slack.com/api/chat.postMessage',
      body: JSON.stringify({
        channel: options.channel,
        username: options.username,
        attachments: [
          {
            ts: now.getTime() / 1000,
            color: this.getColor(color),
            footer: `[${nodeEnv}] ${options.username}`,
            mrkdwn_in: ['text', 'fields'],
            text: util.format(
              '%s, new alert in `%s`.',
              checkerUsers.map((user) => `<@${user}>`).join(', '),
              HOSTNAME,
            ),
            fields: [
              ...Object.entries(Utils.removeUndefined(fields)).map(
                ([title, value]) => ({
                  title: Utils.ucFirst(title),
                  short: true,
                  value,
                }),
              ),
              ...Object.entries(Utils.removeUndefined(sections)).map(
                ([title, value]) => ({
                  title: Utils.ucFirst(title),
                  short: false,
                  value,
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
