import { sign } from '@telegram-apps/init-data-node';
import { InitDataValidationError, validateInitData } from './init-data.util';

const BOT_TOKEN = 'test:bot-token';

const userPayload = {
  id: 1,
  first_name: 'Alice',
  last_name: 'Anderson',
  username: 'alice',
  language_code: 'en',
  is_premium: false,
  allows_write_to_pm: true,
};

describe('validateInitData', () => {
  it('returns parsed init data when freshly signed with the same token', () => {
    const initData = sign({ user: userPayload }, BOT_TOKEN, new Date());
    const parsed = validateInitData(initData, BOT_TOKEN);
    expect(parsed.user?.id).toBe(1);
    expect(parsed.user?.first_name).toBe('Alice');
    expect(parsed.user?.username).toBe('alice');
  });

  it('rejects init data signed with a different token', () => {
    const initData = sign({ user: userPayload }, 'attacker:token', new Date());
    expect(() => validateInitData(initData, BOT_TOKEN)).toThrow(
      InitDataValidationError,
    );
  });

  it('rejects init data older than 24 hours', () => {
    const past = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const initData = sign({ user: userPayload }, BOT_TOKEN, past);
    expect(() => validateInitData(initData, BOT_TOKEN)).toThrow(
      InitDataValidationError,
    );
  });

  it('rejects an empty string', () => {
    expect(() => validateInitData('', BOT_TOKEN)).toThrow(
      InitDataValidationError,
    );
  });

  it('rejects a tampered payload', () => {
    const initData = sign({ user: userPayload }, BOT_TOKEN, new Date());
    // Modify the user.id field while keeping the original hash.
    const tampered = initData.replace(
      encodeURIComponent('"id":1'),
      encodeURIComponent('"id":999'),
    );
    expect(() => validateInitData(tampered, BOT_TOKEN)).toThrow(
      InitDataValidationError,
    );
  });
});
