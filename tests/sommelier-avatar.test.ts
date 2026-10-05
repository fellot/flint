import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { ApiError } from '../lib/api-error';
import { createAccountPreferencesHandler } from '../lib/account-preferences-endpoint';
import { avatarFromMetadata, DEFAULT_SOMMELIER_AVATAR, isSommelierAvatar, SOMMELIER_AVATARS, SOMMELIER_AVATAR_KEY, sommelierAvatar } from '../lib/sommelier-avatar';

const request = (body: unknown = { sommelierAvatar: 'copper' }, origin = 'https://flint.test') => new Request('https://flint.test/api/account/preferences', {
  method: 'PUT', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('legacy, malformed and untrusted metadata use the original bundled cat', async () => {
  for (const metadata of [undefined, null, [], 'copper', {}, { [SOMMELIER_AVATAR_KEY]: null }, { [SOMMELIER_AVATAR_KEY]: 'https://remote.test/tracker.png' }, { [SOMMELIER_AVATAR_KEY]: '__proto__' }]) {
    assert.equal(avatarFromMetadata(metadata), DEFAULT_SOMMELIER_AVATAR);
  }
  for (const avatar of SOMMELIER_AVATARS) {
    assert.equal(avatarFromMetadata({ [SOMMELIER_AVATAR_KEY]: avatar.id }), avatar.id);
    assert.equal(isSommelierAvatar(avatar.id), true);
    assert.match(sommelierAvatar(avatar.id).image, /^\/images\/sommelier-[a-z]+\.png$/);
    await access(`public${avatar.image}`);
  }
  for (const value of ['cat', '', '__proto__', 'constructor', null, {}, 1]) assert.equal(isSommelierAvatar(value), false);
});

test('configuration requires a signed-in user and rejects cross-origin writes before authentication', async () => {
  let authorizations = 0;
  const handler = createAccountPreferencesHandler(async () => { authorizations++; throw new ApiError(401, 'Please sign in to continue.'); });
  assert.equal((await handler(request({}, 'https://foreign.test'))).status, 403);
  assert.equal(authorizations, 0);
  const unauthenticated = await handler(request());
  assert.equal(unauthenticated.status, 401);
  assert.equal(authorizations, 1);
});

test('only known avatar IDs are writable; arbitrary metadata and target-user fields are rejected', async () => {
  let writes = 0;
  const handler = createAccountPreferencesHandler(async () => ({ supabase: { auth: { updateUser: async () => {
    writes++; return { data: { user: null }, error: null };
  } } } }));
  for (const bad of [null, [], {}, 'copper', { sommelierAvatar: 'other' }, { sommelierAvatar: 1 },
    { sommelierAvatar: 'https://remote.test/image.png' }, { sommelierAvatar: '__proto__' },
    { sommelierAvatar: 'copper', userId: 'another-user' }, { sommelierAvatar: 'copper', data: { role: 'owner' } },
    { sommelierAvatar: 'copper', password: 'should-not-reach-auth' }]) {
    assert.equal((await handler(request(bad))).status, 400);
  }
  assert.equal((await handler(request({ sommelierAvatar: 'x'.repeat(1025) }))).status, 413);
  assert.equal((await handler(new Request('https://flint.test/api/account/preferences', { method: 'PUT', body: '{' }))).status, 400);
  assert.equal(writes, 0);
});

test('writes are scoped to the session account and send only the avatar metadata key', async () => {
  const accounts: Record<string, Record<string, unknown>> = { alice: { display_name: 'Alice', custom_setting: true }, bob: { display_name: 'Bob' } };
  const session = (userId: string) => createAccountPreferencesHandler(async () => ({ supabase: { auth: { updateUser: async attributes => {
    assert.deepEqual(Object.keys(attributes), ['data']);
    assert.deepEqual(Object.keys(attributes.data), [SOMMELIER_AVATAR_KEY]);
    accounts[userId] = { ...accounts[userId], ...attributes.data };
    return { data: { user: { user_metadata: accounts[userId] } }, error: null };
  } } } }));
  const alice = session('alice'), bob = session('bob');
  const saved = await alice(request());
  assert.equal(saved.status, 200);
  assert.deepEqual(await saved.json(), { sommelierAvatar: 'copper' });
  assert.equal(saved.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(avatarFromMetadata(accounts.alice), 'copper');
  assert.equal(avatarFromMetadata(accounts.bob), DEFAULT_SOMMELIER_AVATAR);
  assert.deepEqual(accounts.alice, { display_name: 'Alice', custom_setting: true, [SOMMELIER_AVATAR_KEY]: 'copper' });
  await bob(request());
  await alice(request({ sommelierAvatar: 'classic-cat' }));
  assert.equal(avatarFromMetadata(accounts.alice), 'classic-cat');
  assert.equal(avatarFromMetadata(accounts.bob), 'copper');
});

test('failed or unconfirmed saves never report success or expose provider details', async () => {
  for (const result of [
    { data: { user: null }, error: { message: 'private upstream details' } },
    { data: { user: null }, error: null },
    { data: { user: { user_metadata: {} } }, error: null },
    { data: { user: { user_metadata: { [SOMMELIER_AVATAR_KEY]: 'unknown' } } }, error: null },
  ]) {
    const handler = createAccountPreferencesHandler(async () => ({ supabase: { auth: { updateUser: async () => result } } }));
    for (const id of ['classic-cat', 'copper']) {
      const response = await handler(request({ sommelierAvatar: id }));
      assert.equal(response.status, 503);
      assert.doesNotMatch(await response.text(), /private upstream details/);
    }
  }
});
