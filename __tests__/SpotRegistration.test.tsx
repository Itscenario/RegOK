import React from 'react';
import { Text, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SpotRegistrationScreen, {
  validateSpotRegistration,
} from '../src/screens/SpotRegistration/SpotRegistrationScreen';

const valid = {
  memberType: 'Faculty',
  name: 'Dr. Asha Mehta',
  msno: 'MS-001',
  mobile: '9876543210',
  email: 'asha@example.com',
  amount: '1500.00',
  paymentStatus: 'Cash',
  state: 'Delhi',
  notes: 'On-site attendee',
};

test('validates every field including MSNO, state and notes', () => {
  expect(validateSpotRegistration(valid)).toEqual({});
  expect(
    validateSpotRegistration({
      ...valid,
      msno: '',
      state: '',
      notes: '',
      amount: '',
    }),
  ).toEqual(
    expect.objectContaining({
      msno: expect.any(String),
      state: expect.any(String),
      notes: expect.any(String),
      amount: expect.any(String),
    }),
  );
  expect(
    validateSpotRegistration({
      ...valid,
      memberType: '',
      name: '',
      mobile: '123',
      email: 'wrong',
      amount: '-5',
    }),
  ).toEqual(
    expect.objectContaining({
      memberType: expect.any(String),
      name: expect.any(String),
      mobile: expect.any(String),
      email: expect.any(String),
      amount: expect.any(String),
    }),
  );
});

async function fillForm(app: ReactTestRenderer.ReactTestRenderer) {
  const control = (label: string) =>
    app.root
      .findAll(item => typeof item.props.onPress === 'function')
      .find(item => item.props.accessibilityLabel === label)!;
  await ReactTestRenderer.act(async () =>
    control('Select member type').props.onPress(),
  );
  await ReactTestRenderer.act(async () => control('Faculty').props.onPress());
  await ReactTestRenderer.act(async () => {
    for (const [label, value] of [
      ['Name', valid.name],
      ['MSNO', valid.msno],
      ['Mobile', valid.mobile],
      ['Email', valid.email],
      ['Amount', valid.amount],
      ['State', valid.state],
      ['Notes', valid.notes],
    ]) {
      app.root
        .findAllByType(TextInput)
        .find(input => input.props.accessibilityLabel === label)!
        .props.onChangeText(value);
    }
  });
  return control;
}

test('default submit shows honest preview with all values and lets user return to editing', async () => {
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <SpotRegistrationScreen />
      </SafeAreaProvider>,
    );
  });
  const control = await fillForm(app);
  await ReactTestRenderer.act(async () =>
    control('Submit spot registration').props.onPress(),
  );
  const text = app.root.findAllByType(Text).map(item => item.props.children);
  expect(text).toContain('Registration preview');
  expect(text).toContain(
    'Your form is ready. API is not connected; nothing has been saved or charged.',
  );
  expect(text).toContain(valid.msno);
  await ReactTestRenderer.act(async () =>
    control('Close registration summary').props.onPress(),
  );
  expect(
    app.root
      .findAllByType(TextInput)
      .find(input => input.props.accessibilityLabel === 'Name')!.props.value,
  ).toBe(valid.name);
  await ReactTestRenderer.act(async () => app.unmount());
});

test('submits entered values via API callback and preserves form on a failure', async () => {
  const submit = jest
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(undefined);
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <SpotRegistrationScreen onSubmit={submit} />
      </SafeAreaProvider>,
    );
  });
  const control = await fillForm(app);
  await ReactTestRenderer.act(async () =>
    control('Submit spot registration').props.onPress(),
  );
  expect(
    app.root.findAllByType(Text).map(item => item.props.children),
  ).toContain(
    'Could not submit this registration. Your entries are still here. Please try again.',
  );
  await ReactTestRenderer.act(async () =>
    control('Submit spot registration').props.onPress(),
  );
  expect(submit).toHaveBeenLastCalledWith(valid);
  expect(
    app.root.findAllByType(Text).map(item => item.props.children),
  ).toContain('Registration submitted');
  await ReactTestRenderer.act(async () => app.unmount());
});

test('requires all nine fields and rejects invalid formats and length limits', () => {
  const empty = Object.fromEntries(
    Object.keys(valid).map(key => [key, '']),
  ) as typeof valid;
  expect(Object.keys(validateSpotRegistration(empty)).sort()).toEqual(
    Object.keys(valid).sort(),
  );
  expect(
    validateSpotRegistration({
      ...valid,
      name: '123',
      msno: '@@',
      state: '..',
      amount: '12.345',
      notes: 'x'.repeat(1001),
    }),
  ).toEqual(
    expect.objectContaining({
      name: expect.any(String),
      msno: expect.any(String),
      state: expect.any(String),
      amount: expect.any(String),
      notes: expect.any(String),
    }),
  );
  expect(
    validateSpotRegistration({
      ...valid,
      amount: '0',
      name: 'आशा मेहता',
      state: 'उत्तर प्रदेश',
    }),
  ).toEqual({});
});
