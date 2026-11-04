# Relay UI kit

The visual layer for the Relay ticket desk. Everything in this folder is
presentational: it takes props, renders markup, and never fetches data.

```tsx
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PriorityPill,
  SearchInput,
  SectionHeader,
  Segmented,
  Skeleton,
  StatCard,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/kit";
```

Tailwind v4 CSS-first tokens live in `app/globals.css`. Do not add a
`tailwind.config` file and do not hardcode hex values in new components — use
the tokens below.

## Tokens

| Token | Utility examples | Value |
| --- | --- | --- |
| `canvas` | `bg-canvas` | `#F6F7FA` page background |
| `surface` | `bg-surface` | `#FFFFFF` cards, sidebar, topbar |
| `sunken` | `bg-sunken` | `#F1F3F7` inset / segmented track |
| `line` | `border-line` | `#E4E7EE` |
| `line-strong` | `border-line-strong` | `#D3D8E3` |
| `ink` | `text-ink` | `#0E2540` headings |
| `ink-2` | `text-ink-2` | `#3C4A5E` sub-headings |
| `body` | `text-body` | `#585F6E` body copy |
| `faint` | `text-faint` | `#8792A4` labels, meta |
| `brand` | `bg-brand`, `text-brand` | `#1B6BE0` |
| `brand-hover` | `hover:bg-brand-hover` | `#1457BE` |
| `brand-soft` | `bg-brand-soft` | `#E8F0FD` |
| `teal` | `bg-teal` | `#22C7BC` |
| `teal-soft` | `bg-teal-soft` | `#E3FAF8` |
| `success` | `text-success` | `#12B76A` |
| `warning` | `text-warning` | `#F79009` |
| `danger` | `text-danger` | `#F04438` |

Radii: `rounded-field` (8), `rounded-seg` (12), `rounded-inner` (16),
`rounded-card` (20), `rounded-panel` (24), `rounded-pill` (999).

Shadows: `shadow-soft`, `shadow-lift`, `shadow-float`.

Type: `font-display` (Plus Jakarta Sans) for headings, `font-sans` (Inter) for
body. Display utilities: `text-hero` (40), `text-title` (32), `text-heading`
(24), `text-subheading` (20). Body scale stays on Tailwind defaults
(`text-base`, `text-sm`, `text-xs`).

Utilities: `brand-gradient`, `text-gradient`, `noise`, `animate-rise`,
`animate-fade`, `.shimmer`, `.skip-link`.

## Components

### Button

Variants `primary | secondary | ghost | danger`, sizes `sm | md`, plus
`icon` / `icon-sm`. Use `asChild` to render a `Link`.

```tsx
<Button>New ticket</Button>
<Button variant="secondary" size="sm">Filter</Button>
<Button asChild variant="ghost">
  <Link href="/AllTickets">View all</Link>
</Button>
```

### Card

```tsx
<Card className="p-5 sm:p-6">…</Card>
```

### StatCard

```tsx
<StatCard
  label="Open"
  value="12"
  icon={CircleDot}
  tone="brand" // brand | teal | success | warning | danger | ink
  hint="48% of all tickets"
/>
```

`value` accepts a string or node. Numbers are tabular by default.

### SectionHeader

```tsx
<SectionHeader
  title="Recent tickets"
  description="The newest work across your queue."
  action={<Button size="sm">View all</Button>}
/>
```

### StatusPill / PriorityPill

Pass the raw API value; casing is normalised. Colour always ships with a dot
and a text label, never colour alone.

```tsx
<StatusPill status="OPEN" />
<PriorityPill priority="URGENT" />
```

Status map: `OPEN` brand, `PENDING` warning, `EXECUTED` teal, `FINISHED`
success.
Priority map: `LOW` muted, `MEDIUM` brand, `HIGH` warning, `URGENT` danger.

### Segmented

A segmented control with roving focus (arrow keys, Home, End).

```tsx
const [view, setView] = useState<"status" | "priority">("status");

<Segmented
  ariaLabel="Breakdown dimension"
  value={view}
  onChange={setView}
  options={[
    { value: "status", label: "Status", count: 24 },
    { value: "priority", label: "Priority" },
  ]}
/>
```

### Avatar

Initials fallback, deterministic tint by name, optional image.

```tsx
<Avatar name={ticket.assignedToName ?? "Unassigned"} size="sm" />
```

Sizes: `sm` (28), `md` (36), `lg` (44).

### EmptyState

```tsx
<EmptyState
  icon={Ticket}
  title="No tickets yet"
  description="When someone raises a ticket it will land here."
  action={<Button size="sm">Open the queue</Button>}
/>
```

### Skeleton

Shimmer block. Mark containers with `role="status"` + an `aria-label` and use
`skeleton` blocks for structure.

```tsx
<Skeleton className="h-8 w-48" />
```

### Table

Composable table primitives. `TableHead` renders a `<th>` (with
`scope="col"`); `TableHeader` renders the `<thead>`. `Table` already wraps the
table in an overflow container.

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Ticket</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Login fails</TableCell>
      <TableCell><StatusPill status="OPEN" /></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

For a comfortable 390px layout, prefer hiding low-priority columns (like the
dashboard does) or rendering a stacked list below `md`.

### Modal

Radix dialog wrapper with title, optional description and footer. The title is
always announced; a visually hidden description is added when none is given.

```tsx
<Modal
  title="Create ticket"
  description="Assign it to an agent or leave it in the queue."
  trigger={<Button>New ticket</Button>}
  footer={
    <>
      <Button variant="secondary">Cancel</Button>
      <Button>Create</Button>
    </>
  }
>
  …form…
</Modal>
```

`Dialog` is exported as an alias of `Modal`.

### Field / Input

`Field` wires `label[for]`, `aria-invalid` and `aria-describedby` onto its
single child automatically. Errors render with `role="alert"`.

```tsx
<Field label="Username" required error={errors.username}>
  <Input
    autoComplete="username"
    value={username}
    onChange={(event) => setUsername(event.target.value)}
  />
</Field>
```

`Input` is the styled text input (44px tall, 8px radius). `Field` also accepts
`hint` for persistent helper text.

### SearchInput

Pill search field with an icon and an optional shortcut hint.

```tsx
<SearchInput placeholder="Search tickets…" shortcut="⌘K" />
```

## Composition rules

- One gradient anchor per screen. On the dashboard it is the queue hero; on
  auth it is the left panel. Do not add a second `brand-gradient` block.
- Cards use `rounded-card` + `border-line` + `shadow-soft`. Panels use
  `rounded-panel`. Nested cards use `rounded-inner`.
- Page chrome: `AppShell` provides the 264px inset sidebar, floating topbar and
  mobile bottom nav. New pages render inside it — do not add another header.
- Every interactive element needs a visible focus ring (tokens already include
  a global `:focus-visible` outline) and an `aria-label` when the visible text
  is absent.
- Respect `prefers-reduced-motion`; all kit motion is CSS-based and the global
  reduce block neutralises it.
- The existing shadcn primitives in `components/ui/*.tsx` still exist. Do not
  rename or move them; this kit is the layer to build new UI on.
