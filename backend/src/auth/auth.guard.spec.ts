import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthGuard } from './auth.guard';
import { FakeFirebaseTokenValidator } from './__fakes__/fake-firebase-token-validator';
import { REQUIRE_EMAIL_VERIFIED_KEY } from './decorators/require-email-verified.decorator';

interface FakeRequest {
  headers: Record<string, string | undefined>;
  firebaseUser?: unknown;
}

function buildContext(headers: Record<string, string | undefined>): {
  context: ExecutionContext;
  request: FakeRequest;
} {
  const request: FakeRequest = { headers };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('AuthGuard', () => {
  let validator: FakeFirebaseTokenValidator;
  let reflector: Reflector;
  let guard: AuthGuard;

  beforeEach(() => {
    validator = new FakeFirebaseTokenValidator();
    reflector = new Reflector();
    guard = new AuthGuard(validator, reflector);
  });

  it('rejects requests without an Authorization header', async () => {
    const { context } = buildContext({});
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects malformed Authorization headers', async () => {
    const { context } = buildContext({ authorization: 'Basic abc' });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects unknown tokens', async () => {
    const { context } = buildContext({ authorization: 'Bearer ghost-token' });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the firebase user to the request when the token is valid', async () => {
    validator.register('owner-token', {
      uid: 'owner-uid',
      email: 'owner@example.com',
      emailVerified: true,
    });
    const { context, request } = buildContext({ authorization: 'Bearer owner-token' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.firebaseUser).toEqual({
      uid: 'owner-uid',
      email: 'owner@example.com',
      emailVerified: true,
    });
  });

  it('rejects unverified emails on routes that require verification', async () => {
    validator.register('unverified-token', {
      uid: 'unverified-uid',
      email: 'pending@example.com',
      emailVerified: false,
    });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) => (key === REQUIRE_EMAIL_VERIFIED_KEY ? true : undefined));

    const { context } = buildContext({ authorization: 'Bearer unverified-token' });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows unverified emails on routes that do not require verification', async () => {
    validator.register('unverified-token', {
      uid: 'unverified-uid',
      email: 'pending@example.com',
      emailVerified: false,
    });
    const { context } = buildContext({ authorization: 'Bearer unverified-token' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
