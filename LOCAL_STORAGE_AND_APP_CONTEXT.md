
# AppContext & Local Storage System 

This document explains how local data is stored, managed, and accessed in the CareApp mobile application.

---

## What Is `AppContext.tsx`?

**File:** `contexts/AppContext.tsx`

This file defines the **central data layer** of the app.  
It manages global application state, local persistence, authentication, and user/device data.  

All components interact with the app's data exclusively through this context, nothing else directly writes to `AsyncStorage`.

---
## What Gets Stored Locally

All local data is stored in `AsyncStorage` under the key:

`careapp_data`

When the app launches, this file:
1. Loads data from `AsyncStorage`.
2. Merges it with default values.
3. Keeps it in React state (`appData`).
4. Automatically saves updates back to `AsyncStorage` whenever state changes.

This key holds a single JSON object that follows the `AppData` structure:

### AppData structure

| Field                 | Type            | Description                                          |
| --------------------- | --------------- | ---------------------------------------------------- |
| `user`                | `UserSettings`  | User profile, preferences, and accessibility options |
| `medications`         | `Medication[]`  | List of user medications                             |
| `history`             | `DoseHistory[]` | Log of taken/skipped/postponed doses                 |
| `deviceStatus`        | `DeviceStatus`  | Connection and battery info for CareBox / CareBand   |
| `onboardingCompleted` | `boolean`       | Whether the onboarding process is done               |

### UserSettings

```ts
{
  name: string;
  email: string;
  password: string;
  language: string;          // e.g. 'en'
  highContrast: boolean;
  largeText: boolean;
  darkMode: boolean;         // NEW field for theme preference
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  emergencyContacts: EmergencyContact[];
}
```

> Password is still stored in plaintext for now (temporary). Should later be replaced by secure backend authentication.

### Medication

```ts
{
  id: string;
  name: string;
  dosage: string | number;
  times: string[];           // e.g. ["08:00", "20:00"]
  startDate: string;         // ISO date
  durationDays: number;
  createdAt: string;         // ISO timestamp
}
```

### DoseHistory

```ts
{
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;     // HH:mm
  takenTime: string | null;  // ISO timestamp or null
  taken: boolean;
  skipped: boolean;
  postponed: boolean;
  date: string;              // YYYY-MM-DD
}
```

### DeviceStatus

```ts
{
  careBoxConnected: boolean;
  careBoxConnectionType: 'none' | 'bluetooth' | 'wifi' | string;
  careBoxBattery: number;
  careBandConnected: boolean;
  careBandBattery: number;
  lastSync: string | null;
}
```


### Context State & Hooks

|State|Type|Description|
|---|---|---|
|`appData`|`AppData`|All persisted app data|
|`isLoading`|`boolean`|True while loading from AsyncStorage|
|`isAuthenticated`|`boolean`|True when user successfully logs in|
|`theme`|`LightColors` / `DarkColors`|Determined by `user.darkMode`

### Key Context Functions

#### Data Persistence

| Function         | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `loadData()`     | Loads stored data from AsyncStorage and merges defaults |
| `saveData(data)` | Saves updated `AppData` to AsyncStorage                 |
| `clearData()`    | Removes all local data and resets to defaults           |

#### User Management
|Function|Description|
|---|---|
|`completeOnboarding({ name, email, password })`|Saves user info and sets onboarding as complete|
|`updateSettings(settings)`|Updates user preferences (language, dark mode, etc.)|
|`login(email, password)`|Authenticates against locally stored credentials|
|`logout()`|Logs out (resets authentication flag)|
#### Medications & History

| Function                              | Description                                                  |
| ------------------------------------- | ------------------------------------------------------------ |
| `addMedication(med)`                  | Adds a new medication with auto-generated `id` and timestamp |
| `updateMedication(id, updates)`       | Updates existing medication fields                           |
| `deleteMedication(id)`                | Removes medication and its related history entries           |
| `markDoseTaken(medicationId, time)`   | Logs a dose as taken                                         |
| `markDoseSkipped(medicationId, time)` | Logs a dose as skipped                                       |

#### Device Status
|Function|Description|
|---|---|
|`updateDeviceStatus(status)`|Updates connection and battery data for CareBox / CareBand|

#### Scheduling Helpers
|Function|Description|
|---|---|
|`getTodaySchedule()`|Returns all doses scheduled for today (with status and times)|
|`getNextDose()`|Returns the next pending dose that hasn’t been taken yet|

---

## How It Works

### 1. **Initialization**

When the app starts:
- `AppContext.tsx` runs `loadAppData()`
- It calls `AsyncStorage.getItem('careapp_data')`
- If stored data exists, it is parsed and loaded into React state.

### 2. **Updating Data**

When data changes (e.g., new medication, dose history update, user preference change):
- The context updates the local React state
- It immediately saves the new version to AsyncStorage with:

  ```ts
  AsyncStorage.setItem('careapp_data', JSON.stringify(appData));
```
### 3. **Rehydration**

When the user reopens the app:

- `AppContext` automatically loads the last saved state.
- The user’s data, history, and settings are restored seamlessly.

---
## Example Stored JSON

Example of what the data might look like in AsyncStorage:

```json
{
  "user": {
    "name": "Alice",
    "email": "alice@example.com",
    "password": "test123",
    "language": "en",
    "highContrast": false,
    "largeText": false,
    "darkMode": true,
    "notificationsEnabled": true,
    "soundEnabled": true,
    "vibrationEnabled": true,
    "emergencyContacts": []
  },
  "medications": [],
  "history": [],
  "deviceStatus": {
    "careBoxConnected": false,
    "careBoxConnectionType": "none",
    "careBoxBattery": 0,
    "careBandConnected": false,
    "careBandBattery": 0,
    "lastSync": null
  },
  "onboardingCompleted": false
}
```

## Security Notes

- The file currently stores sensitive fields such as the user's password in plaintext (temporary for prototype/testing).
- All local data is persisted in `AsyncStorage`, which is not encrypted by default.
- For future security (For when backend is implemented):
    - Use SecureStore / Keychain for credentials.
    - Encrypt backups before syncing with any remote server.
    - Optionally include a `version` or `schemaVersion` field in `AppData`.

## Summary for the Team

> The `contexts/AppContext.tsx` file manages all app-wide data.
> It handles user info, medications, device connections, and history, all stored under `careapp_data` in `AsyncStorage`. 
> It also controls login/logout, theme (dark/light mode), and onboarding flow.
> This file is the **only place** where local data persistence occurs.

*Last updated: October 2025*