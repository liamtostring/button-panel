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

// In-memory store (fallback for serverless)
let memoryStore: AppData = {
  buttons: [],
  users: [DEFAULT_ADMIN],
};

// Track if data has been initialized in this instance
let isInitialized = false;

// Initialize data
async function initData(): Promise<AppData> {
  try {
    // Try to read from file (development)
    const fileData = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(fileData);

    // Ensure admin user exists
    const adminExists = data.users.some((u: User) => u.username === 'admin');
    if (!adminExists) {
      data.users.push(DEFAULT_ADMIN);
    }

    memoryStore = data;
    isInitialized = true;
    return data;
  } catch (error) {
    // File doesn't exist or can't be read, use default
    memoryStore = {
      buttons: [],
      users: [DEFAULT_ADMIN],
    };

    // Try to save initial data
    try {
      await saveData(memoryStore);
    } catch (e) {
      // Ignore save errors (might be on Vercel where FS is read-only)
    }

    isInitialized = true;
    return memoryStore;
  }
}

async function saveData(data: AppData): Promise<void> {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    memoryStore = data;
  } catch (error) {
    // On Vercel, file system is read-only, so just update memory
    memoryStore = data;
  }
}

export async function getData(): Promise<AppData> {
  // Always try to initialize on first call in this instance
  if (!isInitialized) {
    await initData();
  }
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
