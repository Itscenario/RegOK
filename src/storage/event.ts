import AsyncStorage from '@react-native-async-storage/async-storage';

export type EventOption = {
  id: string;
  name: string;
  venue?: string;
  dateLabel?: string;
};

const EVENT_KEY = '@RegOK/selectedEvent';

export async function getSelectedEvent(): Promise<EventOption | null> {
  const value = await AsyncStorage.getItem(EVENT_KEY);
  if (!value) {
    return null;
  }
  try {
    const event: unknown = JSON.parse(value);
    if (
      event &&
      typeof event === 'object' &&
      'id' in event &&
      typeof event.id === 'string' &&
      event.id.trim() &&
      'name' in event &&
      typeof event.name === 'string' &&
      event.name.trim()
    ) {
      return event as EventOption;
    }
  } catch {
    /* Invalid stored selection should be selected again. */
  }
  return null;
}

export async function selectEvent(event: EventOption): Promise<void> {
  await AsyncStorage.setItem(EVENT_KEY, JSON.stringify(event));
}

export async function eventStorageKey(key: string): Promise<string> {
  const event = await getSelectedEvent();
  return event ? `${key}/event/${encodeURIComponent(event.id)}` : key;
}
