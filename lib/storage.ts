import { AppData, Button, User } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

// Default admin user
const DEFAULT_ADMIN: User = {
  username: 'admin',
  password: 'admin123',
  isAdmin: true,
};

// In-memory store (source of truth during runtime)
let memoryStore: AppData = {
  buttons: [],
  users: [DEFAULT_ADMIN],
};

// Track initialization state
let isInitialized = false;
let isReadOnly = false;

async function loadFromFile(): Promise<AppData | null> {
  try {
    const fileData = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(fileData);

    // Ensure admin user exists
    const adminExists = data.users.some((u: User) => u.username === 'admin');
    if (!adminExists) {
      data.users.push(DEFAULT_ADMIN);
    }

    return data;
  } catch (error) {
    return null;
  }
}

async function saveData(data: AppData): Promise<void> {
  // Data is already modified in memoryStore (since getData returns reference)
  // Just need to persist to file

  // Skip file write if in read-only mode
  if (isReadOnly) {
    return;
  }

  // Try to persist to file
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn('File write failed, running in memory-only mode');
    isReadOnly = true;
  }
}

export async function getData(): Promise<AppData> {
  // Initialize from file only once on first call
  if (!isInitialized) {
    const fileData = await loadFromFile();

    if (fileData) {
      // File exists, load it into memory
      memoryStore = fileData;
    } else {
      // No file, try to create it with default data
      try {
        await saveData(memoryStore);
      } catch (e) {
        // Ignore errors
      }
    }

    isInitialized = true;
  }

  // Always return the in-memory store (source of truth)
  return memoryStore;
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
  const data = await getData();

  // Check if user already exists
  const exists = data.users.some(u => u.username === user.username);
  if (exists) {
    throw new Error('User already exists');
  }

  data.users.push(user);
  await saveData(data);
  return user;
}

export async function deleteUser(username: string): Promise<boolean> {
  const data = await getData();

  // Prevent deleting admin
  if (username === 'admin') {
    return false;
  }

  const initialLength = data.users.length;
  data.users = data.users.filter(u => u.username !== username);

  if (data.users.length < initialLength) {
    await saveData(data);
    return true;
  }
  return false;
}
