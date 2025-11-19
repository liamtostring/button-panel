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

// In-memory cache (per module instance)
let memoryCache: AppData | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 100; // 100ms cache to avoid reading file too frequently within same request

// Track if we're in a read-only environment
let isReadOnly = false;

async function loadFromFile(): Promise<AppData> {
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
    // File doesn't exist, return default data
    return {
      buttons: [],
      users: [DEFAULT_ADMIN],
    };
  }
}

async function saveData(data: AppData): Promise<void> {
  // Skip file write if in read-only mode
  if (isReadOnly) {
    console.warn('Skipping file write in read-only mode');
    return;
  }

  // Try to persist to file
  try {
    // Write to temp file first, then rename (atomic operation)
    const tempFile = DATA_FILE + '.tmp';
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempFile, DATA_FILE);

    // Update cache
    memoryCache = data;
    cacheTimestamp = Date.now();

    console.log('Data saved successfully:', { buttons: data.buttons.length, users: data.users.length });
  } catch (error) {
    console.error('File write failed:', error);
    isReadOnly = true;
  }
}

export async function getData(): Promise<AppData> {
  // Check if cache is still valid
  const now = Date.now();
  if (memoryCache && (now - cacheTimestamp) < CACHE_TTL) {
    return memoryCache;
  }

  // Load from file
  const data = await loadFromFile();

  // Update cache
  memoryCache = data;
  cacheTimestamp = now;

  // If file doesn't exist yet, create it
  try {
    const fileExists = await fs.access(DATA_FILE).then(() => true).catch(() => false);
    if (!fileExists) {
      await saveData(data);
    }
  } catch (e) {
    // Ignore errors
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
