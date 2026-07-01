import { validatePassword } from '@/lib/passwordPolicy';

describe('validatePassword', () => {
  it('rejects password shorter than 8 characters', () => {
    const result = validatePassword('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('8');
  });

  it('rejects password without uppercase letter', () => {
    const result = validatePassword('abcdef1!@');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('majuscule');
  });

  it('rejects password without lowercase letter', () => {
    const result = validatePassword('ABCDEF1!@');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('minuscule');
  });

  it('rejects password without digit', () => {
    const result = validatePassword('Abcdefgh!@');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('chiffre');
  });

  it('rejects password without special character', () => {
    const result = validatePassword('Abcdefgh1');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('spécial');
  });

  it('accepts a valid password', () => {
    const result = validatePassword('Abcd1234!');
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });
});
