import { validateLogin } from '../src/screens/Login/validation';

test('requires username and password', () => {
  expect(validateLogin({ username: '', password: '' })).toEqual({
    username: 'Please enter your username.',
    password: 'Please enter your password.',
  });
});

test.each(['', '   '])('rejects empty or whitespace password', password => {
  expect(validateLogin({ username: 'kit', password }).password).toBeDefined();
});

test('accepts API test password 123 and leaves credentials for the server to validate', () => {
  expect(validateLogin({ username: 'kit', password: '123' })).toEqual({});
});
