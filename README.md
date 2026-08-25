# Asia Global Chat

A single-room realtime chat for people across Asia.

## Stack
- GitHub Pages: static hosting
- Firebase Realtime Database: realtime messages + presence
- Vanilla HTML/CSS/JavaScript

## Setup

### 1. Create Firebase project
Open Firebase Console:
https://console.firebase.google.com/

Create a project, then add a **Web App**.

### 2. Create Realtime Database
Firebase Console → Build → Realtime Database → Create Database.

Choose a nearby region. The app uses the `asia-global` room path.

### 3. Put Firebase config into `app.js`
Copy the Web App config and replace `FIREBASE_CONFIG`.

Do NOT put Firebase Admin SDK/private keys here.

### 4. Realtime Database Rules
For a simple public demo, use rules similar to the following. These are intentionally open enough for anonymous public chat, so do not treat them as production-grade moderation/security.

```json
{
  "rules": {
    "rooms": {
      "asia-global": {
        "messages": {
          ".read": true,
          ".write": true,
          "$messageId": {
            ".validate": "newData.hasChildren(['uid','name','text','createdAt']) && newData.child('name').isString() && newData.child('name').val().length <= 24 && newData.child('text').isString() && newData.child('text').val().length <= 500"
          }
        },
        "presence": {
          ".read": true,
          "$uid": {
            ".write": true
          }
        }
      }
    }
  }
}
```

For a real public deployment, add Firebase Authentication, stricter rules, rate limiting/anti-spam, and moderation.

### 5. GitHub Pages
Upload `index.html`, `style.css`, `app.js` and this README to a repository.

GitHub → Settings → Pages → Deploy from branch → `main` / root.

Your site will be available at:
`https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`

## Important
The Firebase config used by a web app is not a secret credential by itself. Never publish service-account JSON, Admin SDK private keys, or other private credentials.
