import os from 'node:os';
import util from 'node:util';

import { Common } from '@/shared/common';
import { HttpMethod } from '@/shared/enums';
import { Env } from '@/shared/env';
import { InternalServerError } from '@/shared/errors';
import { httpRequest } from '@/shared/http-request';

type Input = {
  color: 'error' | 'warning' | 'info' | 'success' | string;
  memberIds?: string[];
  sections: Record<string, any>;
  fields?: Record<string, any>;
  options?: {
    token: string;
    username: string;
    enabled: boolean;
    memberIds: string[];
    channel: string;
  };
};

export class SlackAlert {
  public static async send(input: Input): Promise<void> {
    const {
      fields = {},
      sections,
      color = 'info',
      memberIds = [],
      options = {
        token: Env.get('SLACK_TOKEN', ''),
        enabled: Env.get('SLACK_ENABLED', false),
        username: Env.get('SLACK_USERNAME', ''),
        channel: Env.get('SLACK_CHANNEL', ''),
      },
    } = input;

    if (!options.enabled) return;

    const membersIdFromEnv = Env.get('SLACK_MEMBERS_ID', '').splice(',');
    const membersIdUnique = Array.from(
      new Set<string>([...memberIds, ...membersIdFromEnv]),
    );

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
              membersIdUnique.map((user) => `<@${user}>`).join(', '),
              os.hostname(),
            ),
            fields: [
              ...Object.entries(Common.removeUndefined(fields)).map(
                ([title, value]) => ({
                  title: Common.ucFirst(title),
                  short: true,
                  value,
                }),
              ),
              ...Object.entries(Common.removeUndefined(sections)).map(
                ([title, value]) => ({
                  title: Common.ucFirst(title),
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
