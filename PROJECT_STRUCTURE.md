# Azur Metal CRM - Proje Dosya Yapısı

## 📦 Ana Dizinler

```
azur-metal/
├── .env                          # Environment variables
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── next.config.mjs               # Next.js configuration
├── package.json                  # Dependencies and scripts
├── postcss.config.mjs            # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # Ana dokümantasyon
├── SETUP.md                      # Kurulum rehberi
│
├── prisma/
│   ├── schema.prisma             # Database schema (tüm modeller)
│   └── seed.ts                   # Seed data (admin + demo)
│
└── src/
    ├── app/
    │   ├── globals.css           # Global styles
    │   ├── layout.tsx            # Root layout
    │   ├── page.tsx              # Home redirect
    │   │
    │   ├── login/
    │   │   └── page.tsx          # Login sayfası
    │   │
    │   ├── admin/
    │   │   ├── layout.tsx        # Admin layout wrapper
    │   │   ├── page.tsx          # Dashboard (server)
    │   │   ├── DashboardClient.tsx  # Dashboard (client)
    │   │   │
    │   │   ├── is-emirleri/
    │   │   │   ├── page.tsx      # İş emirleri liste (server)
    │   │   │   ├── JobsListClient.tsx  # Liste (client)
    │   │   │   ├── yeni/
    │   │   │   │   └── page.tsx  # Yeni iş emri
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx  # Detay (server)
    │   │   │       ├── JobDetailClient.tsx  # Detay (client)
    │   │   │       ├── duzenle/
    │   │   │       │   └── page.tsx  # Düzenleme
    │   │   │       └── tabs/
    │   │   │           ├── GeneralTab.tsx     # Genel bilgiler
    │   │   │           ├── OffersTab.tsx      # Teklifler
    │   │   │           ├── ContractsTab.tsx   # Sözleşmeler
    │   │   │           ├── PaymentsTab.tsx    # Ödemeler
    │   │   │           ├── OrdersTab.tsx      # Siparişler
    │   │   │           ├── WorkLogsTab.tsx    # İşçilik
    │   │   │           └── LedgerTab.tsx      # Ekstre
    │   │   │
    │   │   └── ustalar/
    │   │       ├── page.tsx      # Usta listesi (server)
    │   │       └── MastersListClient.tsx  # Liste (client)
    │   │
    │   ├── actions/
    │   │   └── business-jobs.ts  # Server actions (CRUD)
    │   │
    │   └── api/
    │       └── auth/
    │           └── [...nextauth]/
    │               └── route.ts  # NextAuth handler
    │
    ├── components/
    │   ├── ui/
    │   │   ├── Badge.tsx         # Badge component
    │   │   ├── Button.tsx        # Button component
    │   │   ├── Card.tsx          # Card components
    │   │   ├── Input.tsx         # Form inputs
    │   │   ├── Loading.tsx       # Loading states
    │   │   ├── Modal.tsx         # Modal component
    │   │   └── Tabs.tsx          # Tabs component
    │   │
    │   ├── forms/
    │   │   └── BusinessJobForm.tsx  # İş emri form
    │   │
    │   └── layout/
    │       └── AdminLayout.tsx   # Admin layout (sidebar)
    │
    ├── lib/
    │   ├── auth.ts               # NextAuth configuration
    │   ├── prisma.ts             # Prisma client
    │   ├── validations.ts        # Zod schemas
    │   ├── constants.ts          # Labels, colors, enums
    │   └── utils.ts              # Helper functions
    │
    ├── middleware.ts             # Auth middleware
    │
    └── types/
        └── next-auth.d.ts        # NextAuth type definitions
```

## 📊 Database Models (Prisma)

### Core Models
- **AdminUser** - Sistem yöneticileri
- **BusinessJob** - İş emirleri / İşletmeler
- **AuditLog** - Aktivite logları

### Financial Models
- **Offer** - Teklifler
- **OfferItem** - Teklif kalemleri
- **Contract** - Sözleşmeler
- **Payment** - Ödemeler (tahsilat/gider)
- **PaymentPlan** - Ödeme planları

### Operational Models
- **Order** - Siparişler
- **OrderItem** - Sipariş kalemleri
- **Master** - Ustalar
- **WorkLog** - İşçilik kayıtları
- **FileAsset** - Dosya yönetimi

## 🎨 UI Components

### Base Components
- **Button** - 4 variant, 3 size
- **Input, TextArea, Select** - Form elements
- **Card** - Header, Body, Footer
- **Badge** - Status indicators
- **Modal** - 4 size options
- **Tabs** - Tab navigation
- **Loading** - Spinner & page loader

### Layout Components
- **AdminLayout** - Sidebar + navigation
- **SessionProvider** - Auth wrapper

### Form Components
- **BusinessJobForm** - İş emri CRUD
- (Diğer form componentleri eklenebilir)

## 🔐 Authentication Flow

1. User → `/login` page
2. Submit credentials
3. NextAuth validates via Prisma
4. Session created (JWT)
5. Middleware protects `/admin/*` routes
6. Session accessible via `useSession()`

## 📱 Route Structure

```
/ (redirect to /admin)
/login
/admin (dashboard)
/admin/is-emirleri (list)
/admin/is-emirleri/yeni (create)
/admin/is-emirleri/[id] (detail)
/admin/is-emirleri/[id]/duzenle (edit)
/admin/ustalar (masters list)
```

## 🔄 Data Flow

### Server → Client
1. Server Component fetches data (Prisma)
2. Passes to Client Component as props
3. Client Component handles interactivity

### Client → Server
1. Client Component triggers action
2. Server Action validates (Zod)
3. Prisma performs DB operation
4. Revalidate path
5. Return result to client
6. Show toast notification

## 🎯 Key Features

### Implemented ✅
- Login & Authentication
- Dashboard with KPIs
- Job CRUD (list, create, edit, delete)
- Job detail with 7 tabs
- Financial summary calculations
- Status management
- Filtering & search
- Card/Table views
- Responsive design
- Toast notifications
- Audit logging
- Master management

### To Be Implemented 📝
- Offer CRUD
- Contract CRUD
- Payment CRUD
- Order CRUD
- WorkLog CRUD
- File upload
- PDF export
- CSV export
- Advanced reporting
- Email notifications

## 🧩 Reusable Patterns

### Server Components
```typescript
async function getData() {
  const data = await prisma.model.findMany();
  return data;
}

export default async function Page() {
  const data = await getData();
  return <ClientComponent data={data} />;
}
```

### Server Actions
```typescript
'use server';
export async function actionName(data: any) {
  try {
    // validate
    // prisma operation
    revalidatePath('/path');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Client Components
```typescript
'use client';
export default function Component({ data }: Props) {
  // state, handlers
  // UI rendering
}
```

## 📈 Scalability Considerations

- Prisma relations optimized with `include`
- Server-side filtering reduces data transfer
- Client components memoized where needed
- Lazy loading for large lists (can be added)
- Database indexes on frequently queried fields

## 🔧 Development Scripts

```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"db:migrate": "prisma migrate dev",
"db:seed": "tsx prisma/seed.ts",
"db:studio": "prisma studio"
```

---

Bu yapı, modern Next.js App Router best practices'ini takip eder ve kolayca genişletilebilir.
