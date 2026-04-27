import {
  parse,
  validate,
  type InitData,
} from '@telegram-apps/init-data-node';

const TWENTY_FOUR_HOURS_SECONDS = 24 * 60 * 60;

export class InitDataValidationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'InitDataValidationError';
  }
}

/**
 * Verifies the HMAC-SHA256 signature of `initData` against the bot token and
 * checks that `auth_date` is within the last 24 hours. On success, returns
 * the parsed init data. Throws {@link InitDataValidationError} otherwise.
 */
export function validateInitData(raw: string, botToken: string): InitData {
  if (!raw) {
    throw new InitDataValidationError('initData is empty');
  }
  try {
    validate(raw, botToken, { expiresIn: TWENTY_FOUR_HOURS_SECONDS });
  } catch (cause) {
    throw new InitDataValidationError('initData validation failed', cause);
  }
  return parse(raw);
}
