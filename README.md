# CareApp-teste
Testing build for CareApp

---

# What technologies are used/will be used for this project? 

This project is built with the most popular native mobile cross-platform technical stack: 

- **React Native** - Cross-platform native mobile development framework created by Meta and used for Instagram, Airbnb, and lots of top apps in the App Store;
- **Expo** - Extension of React Native + platform used by Discord, Shopify, Coinbase, Telsa, Starlink, Eightsleep, and more; 
- **Expo Router** - File-based routing system for React Native with support for web, server functions and SSR;
- **TypeScript** - Type-safe Javascript; 
- **React Query** - Server state management;
- **Lucide React Native** - Beautiful icons

---

# Project Structure

```
├── app/                    # App screens (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── _layout.tsx    # Tab layout configuration
│   │   └── index.tsx      # Home tab screen
│   ├── _layout.tsx        # Root layout
│   ├── modal.tsx          # Modal screen example
│   └── +not-found.tsx     # 404 screen
├── assets/                # Static assets
│   └── images/           # App icons and images
├── constants/            # App constants and configuration
├── app.json             # Expo configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

---

# How to test the app

Before running CareApp locally, ensure your system meets the following requirements:

## 1. Node.js
- **Required:** v18 or higher

## 2. Bun (recommended package manager)
- **Required:** v1.0 or higher

```
curl -fsSL https://bun.sh/install | bash 
```
or visit [Bun's installation guide](https://bun.sh/docs/installation)
*(You can also use `npm` or `yarn` instead of Bun if you prefer)*

## 3. Git / Github Desktop
- To clone the repository and manage version control:
[Install Git](https://git-scm.com/downloads)
[Instal Github Desktop](https://desktop.github.com/download/)

## 4. Platform-specific tools (optional)
- **iOS Simulator** - Requires **macOS** and **Xcode**
- **Android Emulator** - Requires **Android Studio**
- **Web Preview** - Works in any modern web browser (Chrome, Safari, Edge, etc.)

---

# Getting started
Follow these steps to set up and run the project locally:

## 1. Clone the repository
```
git clone https://github.com/LoreWasTaken/CareApp-teste
cd CareApp-teste
```

## 2. Install dependecies 
Using **Bun** (recommended):
```
bun i
```

Or with npm/yarn:
```
npm install
# or
yarn install
```

## 3. Start the Expo development server
```
bunx expo start
# or
npx expo start 
# or
yarn expo start
```

---

# Running the App

## On a real device:
1. Install the **Expo Go** app *([iOS App store](https://apps.apple.com/app/expo-go/id982107779) / [Google play](https://play.google.com/store/apps/details?id=host.exp.exponent))*.
2. Run the development server.
3. Scan the QR code shown in the terminal or browser.
## On an emulator/simulator:
- Press `i` to open iOS simulator *(requires Xcode)*.
- Press `a` to open Android Emulator *(requires Android Studio)*.
## On the web:
```
bunx expo start --web
```
This opens the app at http://localhost:8081

---

# Troubleshooting
**App not loading?**

1. Ensure your phone and computer are on the same Wi-Fi network
2. Try using tunnel mode:
```
bunx expo start --tunnel
```
3. Check if your firewall is blocking the connection

**Build issues? 
- Clear cache if needed: 
```
bunx expo start --clear
```
- Delete `node_modules` and reinstall:
```
rm -rf node_modules && bun i
```
- Check Expo's [troubleshooting guide](https://docs.expo.dev/troubleshooting/build-errors/)

---
# Learn more

For details on how local data and AppContext work, see
[LOCAL_STORAGE_AND_APP_CONTEXT.md](./LOCAL_STORAGE_AND_APP_CONTEXT.md)

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript in React Native](https://reactnative.dev/docs/typescript)
- [React Query Documentation](https://tanstack.com/query/latest)
