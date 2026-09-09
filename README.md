# BearCash App

App Expo (React Native) do BearCash.

## Stack

- Expo SDK 57 + React Native
- Expo Router (file-based routing)
- TypeScript
- Clean Architecture (`presentation`, `domain`, `infra`, `application`, `shared`)

## Desenvolvimento

```bash
npm install
npx expo start
```

## Arquitetura

Camadas em `src/`: `presentation`, `domain`, `infra`, `application`, `shared`.

Rotas finas ficam em `src/app/` (Expo Router). Detalhes em [ARCHITECTURE.md](./ARCHITECTURE.md).

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm start` | Expo dev server |
| `npm run android` | Build/run Android |
| `npm run ios` | Build/run iOS |
| `npm run web` | Expo web |
| `npm run lint` | ESLint |
