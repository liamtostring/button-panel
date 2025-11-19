import { AppData, Button, User } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

// Hardcoded users - change USER_PASSWORD to set the regular user's password
const USER_PASSWORD = 'user123'; // Change this to set the regular user's password

const HARDCODED_USERS: User[] = [
  {
    username: 'admin',
    password: 'admin123',
    isAdmin: true,
  },
  {
    username: 'user',
    password: USER_PASSWORD,
    isAdmin: false,
  }
];

// Track if we're in a read-only environment
let isReadOnly = false;

async function loadFromFile(): Promise<AppData> {
  try {
    console.log('[Storage] Reading from file:', DATA_FILE);
    const fileData = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(fileData);

    // Always use hardcoded users, ignore users from file
    data.users = HARDCODED_USERS;

    console.log('[Storage] Loaded data:', { buttons: data.buttons.length, users: data.users.length });
    return data;
  } catch (error) {
    console.log('[Storage] File not found, using defaults');
    // File doesn't exist, return default data
    return {
      buttons: [],
      users: HARDCODED_USERS,
    };
  }
}

async function saveData(data: AppData): Promise<void> {
  console.log('[Storage] Saving data:', { buttons: data.buttons.length, users: data.users.length });

  // Skip file write if in read-only mode
  if (isReadOnly) {
    console.warn('[Storage] Skipping file write in read-only mode');
    return;
  }

  // Try to persist to file - only save buttons, not users (users are hardcoded)
  try {
    // Only persist buttons to file
    const fileData = { buttons: data.buttons, users: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(fileData, null, 2), 'utf-8');
    console.log('[Storage] ✓ Data saved successfully to', DATA_FILE);
  } catch (error) {
    console.error('[Storage] ✗ File write failed:', error);
    isReadOnly = true;
    throw error; // Propagate error so caller knows save failed
  }
}

export async function getData(): Promise<AppData> {
  // Always read from file - no caching
  // This ensures we always get the latest data
  const data = await loadFromFile();

  // If file doesn't exist yet, create it
  try {
    await fs.access(DATA_FILE);
  } catch (e) {
    // File doesn't exist, create it
    console.log('[Storage] Creating initial data file');
    await saveData(data);
  }

  return data;
}

export async function getButtons(): Promise<Button[]> {
  const data = await getData();
  return data.buttons.sort((a, b) => a.order - b.order);
}

export async function getButton(id: string): Promise<Button | undefined> {
  const data = await getData();
  return data.buttons.find(b => b.id === id);
}

export async function createButton(button: Omit<Button, 'id'>): Promise<Button> {
  const data = await getData();
  const newButton: Button = {
    ...button,
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
  };
  data.buttons.push(newButton);
  await saveData(data);
  return newButton;
}

export async function updateButton(id: string, updates: Partial<Button>): Promise<Button | null> {
  const data = await getData();
  const index = data.buttons.findIndex(b => b.id === id);

  if (index === -1) return null;

  data.buttons[index] = { ...data.buttons[index], ...updates };
  await saveData(data);
  return data.buttons[index];
}

export async function deleteButton(id: string): Promise<boolean> {
  const data = await getData();
  const initialLength = data.buttons.length;
  data.buttons = data.buttons.filter(b => b.id !== id);

  if (data.buttons.length < initialLength) {
    await saveData(data);
    return true;
  }
  return false;
}

export async function getUsers(): Promise<User[]> {
  const data = await getData();
  return data.users;
}

export async function getUser(username: string): Promise<User | undefined> {
  const data = await getData();
  return data.users.find(u => u.username === username);
}

export async function createUser(user: User): Promise<User> {
  // Users are hardcoded - cannot create new users
  throw new Error('User management is disabled. Users are hardcoded.');
}

export async function deleteUser(username: string): Promise<boolean> {
  // Users are hardcoded - cannot delete users
  return false;
}
