# Arquitetura do BearCash App

Clean Architecture pragmática para o app Expo (React Native), inspirada no frontend OmegaPay (`presentation`, `domain`, `infra`, `application`, `shared`).

## Visão geral

```text
src/
├── app/                 # Expo Router — rotas finas (entry de navegação)
├── application/         # Serviços de aplicação não-HTTP (equiv. app/ do OmegaPay)
├── domain/              # Núcleo de negócio puro (sem React/Expo)
├── infra/               # Borda externa: HTTP, auth, integrações
├── presentation/        # UI, hooks, stores, pages, constants de UI
├── shared/              # Utils agnósticos de domínio
└── global.css           # Tokens CSS (web)
```

> **Nota Expo:** em OmegaPay a pasta `app/` guarda serviços de aplicação. Aqui `app/` é reservada ao **Expo Router**. Serviços de aplicação ficam em `application/`.

## Fluxo de dependências

```text
app (rotas)
  → presentation (pages, components, hooks, stores)
      → application (serviços de app, se houver)
      → infra (ApiService, auth, HTTP)
      → domain (entities, enums, errors, types)
      → shared (utils)

infra → domain     ✅
domain → nada externo ✅
infra ↛ presentation  ❌ (proibido)
domain ↛ presentation ❌ (proibido)
domain ↛ infra        ❌ (proibido)
```

Dependências apontam **para dentro**. A UI nunca vaza para `infra`/`domain`.

## Camadas

### `app/` — Rotas (Expo Router)

Arquivos de rota **finos**: só compõem providers/layout e reexportam páginas de `presentation/pages`.

| Responsabilidade | Exemplo |
|------------------|---------|
| Layout raiz, tabs, providers | `_layout.tsx` |
| Rota → página | `index.tsx` → `HomePage` |

**Não** colocar lógica de negócio, fetch ou stores aqui.

### `domain/` — Domínio

Regras e tipos de negócio **puros**. Sem React, Expo, Axios ou fetch.

| Pasta | Conteúdo |
|-------|----------|
| `entities/` | Entidades com comportamento (`*.entity.ts`) |
| `enums/` | Enums de domínio (`*.enum.ts`) |
| `errors/` | Erros de domínio (`AppError`) |
| `types/` | Types de negócio (`*.type.ts`) |

### `infra/` — Infraestrutura

Integrações com o mundo externo.

```text
infra/
├── auth/                         # Cliente de autenticação
└── http/
    ├── http-client.ts            # IHttpClient + implementação
    └── services/
        └── api/
            ├── api.service.ts    # Facade + singleton
            └── modules/          # Um module por recurso da API
                ├── *.module.ts
                └── types/        # DTOs + mappers
```

- **Module** = gateway de endpoints (papel de “repositório”).
- **ApiService** = facade que instancia e expõe os modules.
- **Mapper** em `infra`: DTO bruto → DTO tipado / entity de domínio.

### `application/` — Aplicação

Serviços de orquestração **não-HTTP** (ex.: IP do cliente, feature flags locais). Raro no início; criar sob demanda.

### `presentation/` — Apresentação

Tudo que é UI e estado de tela.

| Pasta | Conteúdo |
|-------|----------|
| `pages/` | Telas (pastas ricas ou arquivos simples) |
| `components/` | Componentes compartilhados + `ui/` |
| `layouts/` | Layouts de navegação/shell |
| `hooks/` | Hooks compartilhados (`use-*-query`, `use-theme`, `use-api-service`) |
| `stores/` | Stores globais de UI (preferir colocalizar na page) |
| `constants/` | Tema, spacing, tokens de UI |
| `utils/` | View-mappers, helpers de UI |
| `validation/` | Schemas Zod (quando houver formulários) |

#### Páginas ricas

```text
presentation/pages/FeaturePage/
├── index.tsx
├── components/
├── hooks/
├── stores/          # Zustand — estado de tela, não cache de servidor
├── types/
├── utils/
└── constants/
```

Telas simples podem ser um único arquivo em `pages/`.

### `shared/` — Compartilhado

Utils sem regra de negócio nem dependência de UI (`is-nil`, formatadores genéricos).

## Padrões

### 1. API Module + interface

```ts
export interface IOrdersModule {
  list(): Promise<Order[]>;
}

export class OrdersModule extends BaseApiModule implements IOrdersModule {
  private readonly baseUrl = '/api/v1/orders';

  async list() {
    const dto = await this.http.get<OrderDto[]>(this.baseUrl);
    return dto.map(OrderMapper.toDomain);
  }
}
```

Registrar o module em `ApiService`.

### 2. Hook de leitura = “use case” de query

```ts
// presentation/hooks/use-orders-query.ts
export function useOrdersQuery() {
  const api = useApiService();
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => api.modules.orders.list(),
  });
}
```

### 3. Store Zustand = estado de UI

Colocalizado na page/feature. **Não** usar para cache de servidor (isso é React Query / equivalente).

### 4. Entity + Mapper

- Entity em `domain/entities` com `restore()` e métodos de negócio.
- Mapper em `infra/.../types` convertendo DTO → entity.

### 5. DI manual

Sem container pesado. Construção em `api.service.ts` + hook:

```ts
export function useApiService() {
  return useMemo(() => apiService, []);
}
```

## Convenções de nome

| Sufixo | Uso |
|--------|-----|
| `*.entity.ts` | Entity de domínio |
| `*.enum.ts` | Enum |
| `*.type.ts` / `*.types.ts` | Types / DTOs |
| `*.error.ts` | Erro de domínio |
| `*.module.ts` | Cliente de endpoint HTTP |
| `*.service.ts` | Facade / serviço |
| `*.mapper.ts` | DTO ↔ domain / view |
| `*.store.ts` | Zustand |
| `use-*-query.ts` | Hook de leitura (server state) |
| `*.util.ts` / `*.helper.ts` | Helpers |
| `*.schema.ts` | Zod |
| `I*` / `T*` | Interface / Type alias |

## Checklist para feature nova

1. Tipos/enums/entities em `domain/` (se forem regra de negócio).
2. Module + DTOs + mapper em `infra/http/services/api/modules/`.
3. Registrar no `ApiService`.
4. Hook `use-*-query` (ou mutação) em `presentation/hooks/` ou na page.
5. Page em `presentation/pages/` + rota fina em `app/`.
6. Store Zustand só se houver estado de tela complexo.

## O que evitar

- Importar `presentation` a partir de `infra` ou `domain`.
- Colocar fetch/Axios diretamente em componentes de page.
- Stores globais para dados de API.
- Lógica de negócio espalhada em componentes visuais.
- Inchar `app/` com UI além de composição de rotas.

## Alias

`@/*` → `./src/*`  
`@/assets/*` → `./assets/*`

Exemplos:

- `@/domain/errors/app.error`
- `@/infra/http/services/api/api.service`
- `@/presentation/pages/HomePage`
- `@/shared/utils/is-nil`
