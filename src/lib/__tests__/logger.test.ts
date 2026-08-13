import { describe, it, expect, vi } from 'vitest';
import { logger, sanitizeData, sanitizeString } from '../logger';

describe('Sanitizable Logger Engine', () => {
  it('redacts email addresses in strings and objects', () => {
    const rawEmail = 'ingeniero.campo@semaxpino.com';
    const text = `Error procesando usuario con correo ${rawEmail}`;
    const sanitized = sanitizeString(text);

    expect(sanitized).not.toContain(rawEmail);
    expect(sanitized).toContain('[REDACTED_EMAIL]');

    const obj = {
      email: rawEmail,
      nested: { userEmail: 'cliente@pdvsa.com' }
    };
    const sanitizedObj = sanitizeData(obj);

    expect(sanitizedObj.email).toBe('[REDACTED_EMAIL]');
    expect(sanitizedObj.nested.userEmail).toBe('[REDACTED_EMAIL]');
  });

  it('redacts JWTs, Bearer tokens, and secrets in strings and objects', () => {
    const bearerToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const text = `Autorización fallida con header: ${bearerToken}`;
    const sanitized = sanitizeString(text);

    expect(sanitized).not.toContain('eyJhbGciOiJIUzI1Ni');
    expect(sanitized).toContain('[REDACTED_TOKEN]');

    const secrets = {
      idToken: 'secret_id_token_xyz_123',
      rawToken: 'raw_token_value_abc',
      apiKey: 'TEST_FAKE_API_KEY_NOT_REAL'
    };
    const sanitizedSecrets = sanitizeData(secrets);

    expect(sanitizedSecrets.idToken).toBe('[REDACTED_TOKEN]');
    expect(sanitizedSecrets.rawToken).toBe('[REDACTED_TOKEN]');
    expect(sanitizedSecrets.apiKey).toBe('[REDACTED_TOKEN]');
  });

  it('redacts Firebase UIDs and sensitive UID key fields', () => {
    const userPayload = {
      uid: 'aB1cD2eF3gH4iJ5kL6mN7oP8qR9s',
      callerUid: 'caller_uid_456',
      targetUid: 'target_uid_789',
      action: 'UPDATE_ROLE'
    };

    const sanitized = sanitizeData(userPayload);

    expect(sanitized.uid).toBe('[REDACTED_UID]');
    expect(sanitized.callerUid).toBe('[REDACTED_UID]');
    expect(sanitized.targetUid).toBe('[REDACTED_UID]');
    expect(sanitized.action).toBe('UPDATE_ROLE');
  });

  it('redacts/rounds precise GPS coordinates to preserve location privacy', () => {
    const preciseString = 'Ubicación inspección Macolla: 10.1234567, -64.9876543';
    const sanitizedString = sanitizeString(preciseString);

    expect(sanitizedString).not.toContain('10.1234567');
    expect(sanitizedString).toContain('10.12, -64.99 [REDACTED_GPS_PRECISION]');

    const gpsObj = {
      lat: 10.12345678,
      lng: -64.98765432,
      site: 'Macolla San Tomé'
    };
    const sanitizedGps = sanitizeData(gpsObj);

    expect(sanitizedGps.lat).toBe(10.12);
    expect(sanitizedGps.lng).toBe(-64.99);
    expect(sanitizedGps.site).toBe('Macolla San Tomé');
  });

  it('sanitizes Error objects containing emails or tokens', () => {
    const rawError = new Error('Fallo de conexión para juan.perez@semax.com con token secret_123');
    const sanitizedError = sanitizeData(rawError);

    expect(sanitizedError.message).not.toContain('juan.perez@semax.com');
    expect(sanitizedError.message).toContain('[REDACTED_EMAIL]');
  });

  it('executes logger wrapper methods safely without leaking PII to console', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('Fallo crítico autenticación', {
      email: 'admin@company.com',
      token: 'jwt_token_val',
      uid: 'user_uid_123'
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    const lastCallArg = consoleErrorSpy.mock.calls[0][1];

    expect(lastCallArg.email).toBe('[REDACTED_EMAIL]');
    expect(lastCallArg.token).toBe('[REDACTED_TOKEN]');
    expect(lastCallArg.uid).toBe('[REDACTED_UID]');

    consoleErrorSpy.mockRestore();
  });
});
