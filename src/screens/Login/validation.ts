export type LoginValues = { username: string; password: string };
export type LoginErrors = Partial<Record<keyof LoginValues, string>>;

export function validateLogin({
  username,
  password,
}: LoginValues): LoginErrors {
  const errors: LoginErrors = {};
  if (!username.trim()) {
    errors.username = 'Please enter your username.';
  }
  if (!password) {
    errors.password = 'Please enter your password.';
  } else if (!password.trim()) {
    errors.password = 'Password cannot contain only spaces.';
  }
  return errors;
}
