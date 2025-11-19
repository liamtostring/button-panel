export interface Button {
  id: string;
  label: string;
  webhook: string;
  color: string;
  order: number;
}

export interface User {
  username: string;
  password: string;
  isAdmin: boolean;
}

export interface AppData {
  buttons: Button[];
  users: User[];
}

export const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
];
