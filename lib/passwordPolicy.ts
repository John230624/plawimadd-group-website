export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordValidation {
  valid: boolean;
  message: string;
}

export function validatePassword(password: string): PasswordValidation {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une lettre majuscule.',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une lettre minuscule.',
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins un chiffre.',
    };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins un caractère spécial.',
    };
  }

  return { valid: true, message: '' };
}
