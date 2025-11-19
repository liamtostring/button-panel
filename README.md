# Button Panel

A modern web application for managing webhook buttons with an admin panel. Perfect for Vercel free tier deployment.

## Features

- **Button Panel**: Display customizable buttons that trigger webhook POST requests
- **Admin Panel**: Full CRUD interface for managing buttons and users
- **User Management**: Create and manage regular users with custom credentials
- **8 Default Colors**: Choose from 8 pre-defined colors for buttons
- **Secure Authentication**: Session-based authentication with admin and user roles
- **Responsive Design**: Works great on desktop and mobile devices

## Default Credentials

- **Username**: admin
- **Password**: admin123

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deploy to Vercel

1. Push this repository to GitHub

2. Go to [Vercel](https://vercel.com) and sign in

3. Click "Add New Project"

4. Import your GitHub repository

5. Click "Deploy"

That's it! Your app will be live in minutes.

## Usage

### Admin Panel

1. Login with admin credentials
2. Navigate to the **Buttons** tab to:
   - Add new buttons with custom labels
   - Set webhook URLs for each button
   - Choose from 8 different colors
   - Edit or delete existing buttons
3. Navigate to the **Users** tab to:
   - Create new users with custom usernames and passwords
   - Delete users (admin cannot be deleted)
   - View all existing users

### User Panel

1. Login with user credentials
2. Click any button to trigger its configured webhook
3. The webhook receives a POST request with:
   - `buttonId`: The button's unique ID
   - `buttonLabel`: The button's label
   - `triggeredBy`: The username who clicked
   - `timestamp`: ISO timestamp of the click

## Webhook Payload Example

```json
{
  "buttonId": "1234567890abc",
  "buttonLabel": "Deploy Production",
  "triggeredBy": "john",
  "timestamp": "2024-11-19T12:00:00.000Z"
}
```

## Architecture

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Inline CSS (no dependencies)
- **Data Storage**: In-memory store (persists to JSON file in development)
- **Authentication**: Cookie-based sessions

## Data Persistence on Vercel

**Important**: On Vercel's free tier, the filesystem is read-only in production. This means:

- Data is stored in memory and will reset on each deployment
- For persistent storage, you can add Vercel KV (Redis) or Vercel Postgres
- Both have free tiers available

To add persistent storage:

1. Go to your Vercel project dashboard
2. Navigate to Storage → Create Database
3. Choose Vercel KV (Redis) or Postgres
4. Update the code to use the storage SDK

For most use cases, the in-memory storage works fine as configuration changes are infrequent.

## Security Notes

- Change the default admin password immediately in production
- Use HTTPS (Vercel provides this automatically)
- Store sensitive webhooks in environment variables if needed
- Consider adding rate limiting for production use

## Customization

### Adding More Colors

Edit `/types/index.ts` and add colors to the `COLORS` array:

```typescript
export const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  // Add more colors here
];
```

### Changing Default Admin Credentials

Edit `/lib/storage.ts` and modify the `DEFAULT_ADMIN` object:

```typescript
const DEFAULT_ADMIN: User = {
  username: 'admin',
  password: 'your-secure-password',
  isAdmin: true,
};
```

## Tech Stack

- Next.js 14
- TypeScript
- React 18
- Node.js

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
