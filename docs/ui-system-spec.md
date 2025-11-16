# Base UI System Configuration Specification

## Overview
This specification defines the base UI system configuration for the Solana Explorer built on **shadcn/ui**, a collection of re-usable components built with Radix UI and Tailwind CSS. The system emphasizes accessible, customizable components that can be copied and adapted directly into the application.

## Design System Foundation

### Color System
Based on shadcn/ui with custom Tailwind configuration:

```typescript
// Semantic Color Variables (CSS Custom Properties)
--background: hsl(var(--background))
--foreground: hsl(var(--foreground))
--card: hsl(var(--card))
--card-foreground: hsl(var(--card-foreground))
--primary: hsl(var(--primary))
--primary-foreground: hsl(var(--primary-foreground))
--secondary: hsl(var(--secondary))
--secondary-foreground: hsl(var(--secondary-foreground))
--muted: hsl(var(--muted))
--muted-foreground: hsl(var(--muted-foreground))
--accent: hsl(var(--accent))
--accent-foreground: hsl(var(--accent-foreground))
--destructive: hsl(var(--destructive))
--destructive-foreground: hsl(var(--destructive-foreground))
--border: hsl(var(--border))
--input: hsl(var(--input))
--ring: hsl(var(--ring))
```

### Status Colors
```css
/* Success States */
.status-success: bg-green-50, text-green-700/800
.badge-success: bg-green-100, text-green-800

/* Error/Failed States */
.status-error: bg-red-50, text-red-700/800
.badge-error: bg-red-100, text-red-800

/* Warning States */
.status-warning: bg-yellow-100, text-yellow-800
.badge-warning: bg-yellow-100, text-yellow-800

/* Info/Confirmed States */
.status-info: bg-blue-100, text-blue-800
.badge-info: bg-blue-100, text-blue-800

/* Live/Active States */
.status-live: bg-green-100, text-green-800 (with animated spinner)
```

### Typography System

#### Font Stack
```typescript
Primary Font: Rubik
  - Weights: 300 (Light), 400 (Regular), 700 (Bold)
  - Variable: --explorer-default-font
  - Subsets: latin
  - Display: swap
```

#### Text Sizes
```typescript
// Heading Hierarchy
h1: text-3xl, font-bold
h2: text-2xl, font-semibold
h3: text-xl, font-semibold
h4: text-lg, font-semibold
h5: text-base, font-semibold

// Body Text
body-lg: text-base
body: text-sm
body-sm: text-xs

// Muted Text
muted: text-muted-foreground
```

### Spacing System

#### Custom Breakpoints
```typescript
xxs: 320px
xs: 375px
sm: 576px
md: 768px
lg: 992px
xl: 1200px
xxl: 1400px

// Usage
mobile: sm (576px)
tablet: md (768px)
laptop: lg (992px)
desktop: xl (1200px)
```

#### Container
```typescript
.container: {
  center: true,
  padding: 2rem (8px),
  max-width: {
    '2xl': 1400px
  }
}
```

## Component Architecture

### shadcn/ui Components

All UI components are based on shadcn/ui and located in `app/components/shared/ui/`. These components are:
- Built on Radix UI primitives for accessibility
- Styled with Tailwind CSS utility classes
- Fully customizable and owned by the project
- Type-safe with TypeScript

### Available shadcn/ui Components
All components are located in `app/components/shared/ui/`:

```bash
# Currently installed components:
- accordion       # Collapsible content sections
- alert          # System messages and notifications
- badge          # Status indicators and labels
- button         # Interactive buttons with variants
- card           # Content containers
- dialog         # Modal dialogs
- dropdown-menu  # Dropdown menus
- input          # Form inputs
- label          # Form labels
- popover        # Floating content
- progress       # Progress indicators
- scroll-area    # Custom scrollable areas
- select         # Select dropdowns
- separator      # Visual dividers
- skeleton       # Loading placeholders
- switch         # Toggle switches
- table          # Data tables
- tabs           # Tab navigation
- textarea       # Multi-line text input
- tooltip        # Contextual hints

# Add new components with:
bun run gen
# or
bunx shadcn@latest add [component-name]
```

### Card Component Pattern (shadcn/ui)

#### Using Card Components
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@components/shared/ui/card';

// Basic Card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
  <CardFooter>
    {/* Optional footer */}
  </CardFooter>
</Card>

// Inline Card (no shadcn component, custom pattern)
<div className="bg-card rounded-lg border shadow-sm">
  <div className="border-b px-6 py-4">
    <h4 className="text-lg font-semibold">Card Title</h4>
  </div>
  <div className="p-6">
    {/* Content */}
  </div>
</div>
```

### Button Component Pattern (shadcn/ui)

#### Using Button Component
```tsx
import { Button } from '@components/shared/ui/button';

// Primary Button
<Button>Default</Button>

// Button Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Button Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>

// Button States
<Button disabled>Disabled</Button>
<Button>
  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  Loading
</Button>

// Custom styling with cn()
import { cn } from '@components/shared/utils';
<Button className={cn("w-full", className)}>Full Width</Button>
```

### Input Component Pattern (shadcn/ui)

#### Using Input Component
```tsx
import { Input } from '@components/shared/ui/input';
import { Label } from '@components/shared/ui/label';

// Basic Input
<Input type="text" placeholder="Enter text..." />

// Input with Label
<div className="grid w-full max-w-sm items-center gap-1.5">
  <Label htmlFor="email">Email</Label>
  <Input type="email" id="email" placeholder="Email" />
</div>

// Input with Error
<div>
  <Input type="email" className="border-destructive" />
  <p className="text-sm text-destructive">Error message</p>
</div>

// Disabled Input
<Input disabled placeholder="Disabled" />
```

### Textarea Component Pattern (shadcn/ui)

```tsx
import { Textarea } from '@components/shared/ui/textarea';
import { Label } from '@components/shared/ui/label';

<div className="grid w-full gap-1.5">
  <Label htmlFor="message">Your message</Label>
  <Textarea id="message" placeholder="Type your message here." />
</div>
```

### Select Component Pattern (shadcn/ui)

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/shared/ui/select';

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

### Dialog Component Pattern (shadcn/ui)

```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@components/shared/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text
      </DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

### Dropdown Menu Component Pattern (shadcn/ui)

```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@components/shared/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Tabs Component Pattern (shadcn/ui)

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/shared/ui/tabs';

<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    Account content
  </TabsContent>
  <TabsContent value="password">
    Password content
  </TabsContent>
</Tabs>
```

### Tooltip Component Pattern (shadcn/ui)

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/shared/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline">Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Tooltip content</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Progress Component Pattern (shadcn/ui)

```tsx
import { Progress } from '@components/shared/ui/progress';

<Progress value={33} className="w-full" />
```

### Separator Component Pattern (shadcn/ui)

```tsx
import { Separator } from '@components/shared/ui/separator';

<div>
  <div>Content above</div>
  <Separator className="my-4" />
  <div>Content below</div>
</div>

// Vertical separator
<Separator orientation="vertical" />
```

### Accordion Component Pattern (shadcn/ui)

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@components/shared/ui/accordion';

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>
      Content for section 1
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Section 2</AccordionTrigger>
    <AccordionContent>
      Content for section 2
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Scroll Area Component Pattern (shadcn/ui)

```tsx
import { ScrollArea } from '@components/shared/ui/scroll-area';

<ScrollArea className="h-[200px] w-[350px] rounded-md border">
  <div className="p-4">
    {/* Scrollable content */}
  </div>
</ScrollArea>
```

### Switch Component Pattern (shadcn/ui)

```tsx
import { Switch } from '@components/shared/ui/switch';
import { Label } from '@components/shared/ui/label';

<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>
```

### Skeleton Component Pattern (shadcn/ui)

```tsx
import { Skeleton } from '@components/shared/ui/skeleton';

// Loading Card Skeleton
<div className="flex flex-col space-y-3">
  <Skeleton className="h-[125px] w-[250px] rounded-xl" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>
```

### Popover Component Pattern (shadcn/ui)

```tsx
import { Popover, PopoverContent, PopoverTrigger } from '@components/shared/ui/popover';

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open popover</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="grid gap-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none">Dimensions</h4>
        <p className="text-sm text-muted-foreground">
          Set the dimensions for the layer.
        </p>
      </div>
    </div>
  </PopoverContent>
</Popover>
```

### Badge Component Pattern (shadcn/ui)

```tsx
import { Badge } from '@components/shared/ui/badge';

// Default Badge
<Badge>Default</Badge>

// Badge Variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>

// Custom Status Badges
<Badge className="bg-green-50 text-green-700 hover:bg-green-100">
  Success
</Badge>
<Badge className="bg-red-50 text-red-700 hover:bg-red-100">
  Failed
</Badge>
<Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
  Pending
</Badge>
```

### Table Component Pattern (shadcn/ui)

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/shared/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@components/shared/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Data Table</CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Column 1</TableHead>
          <TableHead>Column 2</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Data 1</TableCell>
          <TableCell>Data 2</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</Card>

// Custom table pattern (for specific layouts)
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr>
        <th className="text-muted-foreground">Header</th>
      </tr>
    </thead>
    <tbody className="list">
      <tr>
        <td>{content}</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Alert/Notice Component Pattern

#### Info Alert
```tsx
<div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
  <strong>Info:</strong> Message
</div>
```

#### Success Alert
```tsx
<div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
  <strong>Success:</strong> Message
</div>
```

#### Warning Alert
```tsx
<div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
  <strong>Warning:</strong> Message
</div>
```

#### Error Alert
```tsx
<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">
  <strong>Error:</strong> Message
</div>
```

## Layout Patterns

### Page Container
```tsx
<div className="container mt-4">
  {/* Page content */}
</div>
```

### Responsive Grid
```tsx
// Two-column responsive
<div className="grid grid-cols-1 gap-3 md:grid-cols-2">

// Auto-fit columns
<div className="grid grid-cols-1 gap-3 md:grid-cols-12">
  <div className="md:col-span-9">{/* Content */}</div>
  <div className="md:col-span-3">{/* Sidebar */}</div>
</div>
```

### Flex Layouts
```tsx
// Header with actions
<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
  <div className="flex-1">{/* Title */}</div>
  <div className="flex items-center gap-3">{/* Actions */}</div>
</div>

// Centered content
<div className="flex items-center justify-center">
```

## Animation System

### Transitions
```css
/* Default transition */
transition-all duration-200

/* Shadow transition */
transition-shadow duration-200

/* Specific properties */
transition-colors duration-200
transition-transform duration-200
```

### Keyframe Animations
```typescript
// Spinner/Loading
"animate-spin"

// Pulse (skeleton loaders)
"animate-pulse"

// Custom: Accordion
"animate-accordion-down"
"animate-accordion-up"

// Custom: Badge animations
"animate-spinner-border"
"animate-spinner-grow"
```

## Accessibility Guidelines

### Focus States
```typescript
// Standard focus ring
"focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"

// Focus visible
"focus-visible:ring-2 focus-visible:ring-ring"
```

### ARIA Patterns
```tsx
// Loading state
<span role="status" className="animate-spin..." />

// Buttons
<button type="button" aria-label="Description">

// Interactive elements
<button disabled={loading} aria-disabled={loading}>
```

### Semantic HTML
- Use proper heading hierarchy (h1 → h2 → h3)
- Use `<table>` for tabular data
- Use `<button>` for actions, `<a>` for navigation
- Use `<nav>` for navigation sections

## Dark Mode Support

### Implementation
```typescript
// Theme provider wraps entire app
<ThemeProvider>
  {children}
</ThemeProvider>

// Dark mode class strategy
darkMode: 'class'

// Toggle implementation
localStorage.getItem('theme')
document.documentElement.classList.add('dark')
```

### Color Variables
All colors use CSS custom properties that automatically adjust in dark mode:
```css
/* Light mode */
--background: 0 0% 100%
--foreground: 222.2 84% 4.9%

/* Dark mode */
.dark {
  --background: 222.2 84% 4.9%
  --foreground: 210 40% 98%
}
```

## Utility Functions

### `cn()` - Class Name Utility

The `cn()` function from `@components/shared/utils` is used for merging Tailwind classes efficiently with clsx and tailwind-merge.

#### Usage
```tsx
import { cn } from '@components/shared/utils';

// Merge classes
<Button className={cn('w-full', className)} />

// Conditional classes
<div className={cn(
  'rounded-lg p-4',
  isActive && 'bg-primary',
  isDisabled && 'opacity-50'
)} />

// Override default classes
<Card className={cn('border-2', customClassName)} />
```

#### Why use cn()?
- Prevents Tailwind class conflicts (e.g., `p-4 p-6` → `p-6`)
- Handles conditional classes cleanly
- Type-safe with TypeScript
- Optimized for shadcn/ui component composition

### Component Composition with cn()

```tsx
import { Button } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';

function CustomButton({ className, variant = "default", ...props }) {
  return (
    <Button
      variant={variant}
      className={cn(
        "transition-all duration-200",
        variant === "default" && "hover:scale-105",
        className
      )}
      {...props}
    />
  );
}
```

## Adding New shadcn/ui Components

### Installation Command
```bash
# Interactive component selector
bun run gen

# Or use shadcn CLI directly
bunx shadcn@latest add button
bunx shadcn@latest add card
bunx shadcn@latest add dialog

# Add multiple components at once
bunx shadcn@latest add button card input label
```

### Configuration
The project's shadcn/ui configuration is in `components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/app/components/shared",
    "utils": "@/app/components/shared/utils"
  }
}
```

### Component Location
All shadcn/ui components are installed to:
```
app/components/shared/ui/
├── accordion.tsx
├── button.tsx
├── card.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── input.tsx
└── ... (other components)
```

### Customization Pattern
shadcn/ui components are fully customizable because they're copied into your project:

```tsx
// Modify app/components/shared/ui/button.tsx directly
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground...",
        // Add custom variant
        custom: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      },
    },
  }
);
```

## Component Development Workflow

### 1. Choose shadcn/ui Component First
Before building custom components, check if shadcn/ui has a suitable primitive:
```bash
# View available components
bunx shadcn@latest add
```

### 2. Install and Import
```bash
bun run gen
# Select component from list
```

```tsx
import { Button } from '@components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/shared/ui/card';
```

### 3. Compose Custom Components
Build domain-specific components using shadcn/ui primitives:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@components/shared/ui/card';
import { Button } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';

interface TransactionCardProps {
  signature: string;
  status: 'success' | 'error';
  className?: string;
}

export function TransactionCard({ signature, status, className }: TransactionCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transaction</span>
          <Button variant="ghost" size="sm">View</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="font-mono text-sm truncate">{signature}</div>
          <div className={cn(
            "text-sm",
            status === 'success' ? "text-green-600" : "text-red-600"
          )}>
            {status === 'success' ? '✓ Success' : '✗ Failed'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4. Use Composition Over Modification
Prefer wrapping shadcn/ui components rather than modifying their source:

```tsx
// ✅ Good - Wrapper component
function PrimaryButton(props: ButtonProps) {
  return <Button variant="default" size="lg" {...props} />;
}

// ❌ Avoid - Modifying shadcn/ui button.tsx directly
// (unless creating new variants for entire app)
```

## Status Badges & Alerts

### Status Badges (Custom Pattern)
For transaction/account status indicators:

```tsx
// Success Badge
<span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
  Success
</span>

// Error Badge
<span className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
  Failed
</span>

// Info Badge
<span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
  Confirmed
</span>

// Warning Badge
<span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
  Pending
</span>
```

### Alert Component (shadcn/ui)
For system messages and notifications:

```tsx
import { Alert, AlertDescription, AlertTitle } from '@components/shared/ui/alert';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

// Info Alert
<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>Information</AlertTitle>
  <AlertDescription>
    This is an informational message.
  </AlertDescription>
</Alert>

// Success Alert
<Alert variant="success">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>
    Operation completed successfully.
  </AlertDescription>
</Alert>

// Error Alert
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    An error occurred during the operation.
  </AlertDescription>
</Alert>
```

Note: If Alert component is not yet installed:
```bash
bunx shadcn@latest add alert
```

### Loading States with Skeleton (shadcn/ui)

```tsx
import { Skeleton } from '@components/shared/ui/skeleton';
import { Card, CardContent, CardHeader } from '@components/shared/ui/card';

// Loading Card
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-[250px]" />
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[80%]" />
    </div>
  </CardContent>
</Card>

// Spinner Pattern (custom)
<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
```

## Common Tailwind Utility Patterns

### Responsive Patterns
```typescript
// Hide on mobile/desktop
"hidden lg:block" or "block lg:hidden"

// Responsive text size
"text-sm md:text-base lg:text-lg"

// Responsive grid columns
"grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Responsive spacing
"px-4 md:px-6 lg:px-8"
```

### Text Utilities
```typescript
// Truncate text
"truncate" or "line-clamp-2"

// Text color with semantic variables
"text-foreground"          // Primary text
"text-muted-foreground"    // Secondary text
"text-destructive"         // Error text

// Font styles
"font-mono"               // Monospace (addresses, hashes)
"font-semibold"          // Headings
"text-sm" "text-base"    // Size variants
```

### Spacing Patterns
```typescript
// Consistent spacing
"mt-4 mb-4" or "my-4"
"px-6 py-4" or "p-6"

// Gap utilities (flexbox/grid)
"gap-2" "gap-4" "gap-6"
"space-y-2" "space-x-4"
```

### Border & Radius
```typescript
// Border consistency
"border"           // Default border
"border-b"         // Bottom only
"border-t"         // Top only

// Border radius
"rounded-lg"       // Default for cards
"rounded-md"       // Medium for inputs
"rounded-full"     // Pills/badges
"rounded-xl"       // Large components
```

### Shadow & Elevation
```typescript
// Card shadows
"shadow-sm"        // Subtle
"shadow-md"        // Medium
"shadow-lg"        // Prominent

// Hover states
"hover:shadow-md"
"hover:shadow-lg"
```

### Loading State Pattern
```tsx
const [loading, setLoading] = React.useState(true);
const [error, setError] = React.useState<string | null>(null);

if (loading) return <LoadingCard />;
if (error) return <ErrorCard text={error} retry={fetch} />;
```

### Pagination Pattern
```tsx
const [currentPage, setCurrentPage] = React.useState(1);
const itemsPerPage = 50;
```

### Filter/Search Pattern
```tsx
const [filter, setFilter] = React.useState('');
const [selectedOption, setSelectedOption] = React.useState<string>('');
```

## Performance Considerations

### Optimization Patterns
```typescript
// Memoization
const value = React.useMemo(() => compute(), [deps]);
const callback = React.useCallback(() => action(), [deps]);

// Lazy loading
const Component = React.lazy(() => import('./Component'));

// Suspense boundaries
<Suspense fallback={<LoadingCard />}>
  <Component />
</Suspense>
```

### Image Optimization
```tsx
// Use Next.js Image component
import Image from 'next/image';
<Image src="..." alt="..." width={x} height={y} />
```

## Testing Patterns

### Component Testing
```typescript
// Test structure
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });
});
```

### Accessibility Testing
- Test keyboard navigation
- Test screen reader compatibility
- Test focus management
- Verify ARIA attributes

## Documentation Standards

### Component Documentation
```typescript
/**
 * ComponentName - Brief description
 * 
 * @param {Type} prop - Description
 * @returns {JSX.Element}
 * 
 * @example
 * <ComponentName prop={value} />
 */
```

### Code Comments
- Document complex logic
- Explain non-obvious decisions
- Reference related components/patterns
- Note browser-specific workarounds

## Migration Notes

### From Bootstrap to shadcn/ui
When migrating from Bootstrap patterns:

#### Component Mapping
```typescript
// Bootstrap → shadcn/ui
.card         → <Card> component
.btn          → <Button> component
.badge        → Custom badge pattern or <Badge> component
.alert        → <Alert> component
.form-control → <Input>, <Textarea>, <Select> components
.dropdown     → <DropdownMenu> component
.modal        → <Dialog> component
.nav-tabs     → <Tabs> component
```

#### Class Migration
```typescript
// Bootstrap                    → Tailwind/shadcn/ui
.d-flex                        → flex
.justify-content-between       → justify-between
.align-items-center           → items-center
.mt-3, .mb-3                  → my-3 or mt-3 mb-3
.text-muted                   → text-muted-foreground
.bg-primary                   → bg-primary
.border-0                     → border-0
```

### shadcn/ui Best Practices

#### Component Structure
```tsx
// ✅ Proper shadcn/ui usage
import { Card, CardContent, CardHeader, CardTitle } from '@components/shared/ui/card';
import { Button } from '@components/shared/ui/button';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Action</Button>
      </CardContent>
    </Card>
  );
}

// ❌ Avoid mixing patterns
function BadComponent() {
  return (
    <div className="bg-card rounded-lg"> {/* Don't mix custom card with shadcn Card */}
      <Button>Action</Button>
    </div>
  );
}
```

#### Customization Strategy
```tsx
// ✅ Extend shadcn/ui components
import { Button, ButtonProps } from '@components/shared/ui/button';

function IconButton({ children, icon, ...props }: ButtonProps & { icon?: React.ReactNode }) {
  return (
    <Button {...props}>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </Button>
  );
}

// ✅ Add new variants (when needed globally)
// Edit app/components/shared/ui/button.tsx
const buttonVariants = cva(
  // ... base styles
  {
    variants: {
      variant: {
        // ... existing variants
        solana: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      },
    },
  }
);
```

### Design Token Migration

Use semantic color tokens instead of hardcoded colors:
```tsx
// ❌ Before
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">

// ✅ After (semantic tokens)
<div className="bg-background text-foreground">

// ❌ Before
<div className="bg-gray-100 dark:bg-gray-800">

// ✅ After
<div className="bg-muted">

// ❌ Before
<button className="bg-blue-500 hover:bg-blue-600">

// ✅ After
<Button variant="default"> {/* Uses bg-primary */}
```

### Component Installation
Components in `app/components/shared/ui/` are owned by the project:
- Add via: `bun run gen` or `bunx shadcn@latest add [component]`
- Customize directly in source files
- Configuration in `components.json`
- Follow shadcn/ui patterns for consistency

## Data Visualization with Nivo

### Overview
For charts and data visualizations, use **[Nivo](https://nivo.rocks/)** - a rich set of React components for data visualization built on top of D3.

### Installation
```bash
# Install Nivo packages as needed
bun add @nivo/core @nivo/line @nivo/bar @nivo/pie
```

### Available Chart Types

#### Line Chart
For time series data, transaction history, and trends:
```tsx
import { ResponsiveLine } from '@nivo/line';
import { Card, CardContent, CardHeader, CardTitle } from '@components/shared/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Transaction Volume</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="h-[300px]">
      <ResponsiveLine
        data={[
          {
            id: "transactions",
            data: [
              { x: "2024-01", y: 100 },
              { x: "2024-02", y: 150 },
              { x: "2024-03", y: 200 },
            ]
          }
        ]}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        curve="monotoneX"
        axisBottom={{
          tickRotation: -45,
        }}
        theme={{
          text: {
            fill: 'hsl(var(--foreground))',
          },
          grid: {
            line: {
              stroke: 'hsl(var(--border))',
            }
          }
        }}
        colors={{ scheme: 'category10' }}
        enablePoints={true}
        enableGridX={false}
        enableGridY={true}
        useMesh={true}
      />
    </div>
  </CardContent>
</Card>
```

#### Bar Chart
For comparing values, account balances, and distribution:
```tsx
import { ResponsiveBar } from '@nivo/bar';

<div className="h-[400px]">
  <ResponsiveBar
    data={[
      { category: "SPL Token", value: 150 },
      { category: "NFT", value: 85 },
      { category: "Program", value: 200 },
    ]}
    keys={['value']}
    indexBy="category"
    margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
    padding={0.3}
    valueScale={{ type: 'linear' }}
    colors={{ scheme: 'nivo' }}
    theme={{
      text: {
        fill: 'hsl(var(--foreground))',
      },
      grid: {
        line: {
          stroke: 'hsl(var(--border))',
        }
      }
    }}
    axisBottom={{
      tickRotation: -45,
    }}
    enableLabel={true}
    labelSkipWidth={12}
    labelSkipHeight={12}
  />
</div>
```

#### Pie Chart
For market share, token distribution, and proportions:
```tsx
import { ResponsivePie } from '@nivo/pie';

<div className="h-[350px]">
  <ResponsivePie
    data={[
      { id: "Staked", value: 500, color: "hsl(var(--primary))" },
      { id: "Liquid", value: 300, color: "hsl(var(--secondary))" },
      { id: "Locked", value: 200, color: "hsl(var(--muted))" },
    ]}
    margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
    innerRadius={0.5}
    padAngle={0.7}
    cornerRadius={3}
    activeOuterRadiusOffset={8}
    colors={{ datum: 'data.color' }}
    borderWidth={1}
    borderColor={{
      from: 'color',
      modifiers: [['darker', 0.2]]
    }}
    arcLinkLabelsSkipAngle={10}
    arcLinkLabelsTextColor="hsl(var(--foreground))"
    arcLinkLabelsThickness={2}
    arcLinkLabelsColor={{ from: 'color' }}
    arcLabelsSkipAngle={10}
    theme={{
      text: {
        fill: 'hsl(var(--foreground))',
      }
    }}
  />
</div>
```

#### Area Chart
For cumulative data and stacked time series:
```tsx
import { ResponsiveAreaBump } from '@nivo/bump';

<div className="h-[400px]">
  <ResponsiveAreaBump
    data={data}
    margin={{ top: 40, right: 100, bottom: 40, left: 100 }}
    spacing={8}
    colors={{ scheme: 'nivo' }}
    blendMode="multiply"
    fillOpacity={0.85}
    theme={{
      text: {
        fill: 'hsl(var(--foreground))',
      }
    }}
  />
</div>
```

### Dark Mode Integration

Nivo charts should respect the application's theme. Use a shared theme configuration:

```tsx
import { useTheme } from 'next-themes';

function useNivoTheme() {
  const { theme } = useTheme();
  
  return {
    text: {
      fill: 'hsl(var(--foreground))',
      fontSize: 11,
    },
    grid: {
      line: {
        stroke: 'hsl(var(--border))',
        strokeWidth: 1,
      }
    },
    axis: {
      domain: {
        line: {
          stroke: 'hsl(var(--border))',
          strokeWidth: 1,
        }
      },
      ticks: {
        line: {
          stroke: 'hsl(var(--border))',
          strokeWidth: 1,
        },
        text: {
          fill: 'hsl(var(--muted-foreground))',
        }
      },
      legend: {
        text: {
          fill: 'hsl(var(--foreground))',
          fontSize: 12,
        }
      }
    },
    tooltip: {
      container: {
        background: 'hsl(var(--popover))',
        color: 'hsl(var(--popover-foreground))',
        fontSize: 12,
        borderRadius: '6px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
        padding: '5px 9px',
      }
    }
  };
}

// Usage
function ChartComponent() {
  const nivoTheme = useNivoTheme();
  
  return (
    <ResponsiveLine
      // ... other props
      theme={nivoTheme}
    />
  );
}
```

### Chart Wrapper Component Pattern

Create reusable chart wrappers with consistent styling:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@components/shared/ui/card';
import { cn } from '@components/shared/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  height?: string;
  className?: string;
}

export function ChartCard({ 
  title, 
  description, 
  children, 
  height = 'h-[300px]',
  className 
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn(height, "w-full")}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

// Usage
<ChartCard title="Transaction Volume" height="h-[400px]">
  <ResponsiveLine {...props} />
</ChartCard>
```

### Performance Considerations

- Use `ResponsiveXxx` components for automatic sizing
- Set appropriate `margin` props for axis labels
- Use `useMemo` for data transformations
- Consider virtualization for large datasets

```tsx
const chartData = React.useMemo(() => 
  transformData(rawData), 
  [rawData]
);
```

### Common Nivo Packages

```bash
# Core (required)
@nivo/core

# Chart types
@nivo/line          # Line charts
@nivo/bar           # Bar charts
@nivo/pie           # Pie/Donut charts
@nivo/area          # Area charts
@nivo/scatterplot   # Scatter plots
@nivo/heatmap       # Heat maps
@nivo/stream        # Stream charts
@nivo/bump          # Bump/ranking charts
@nivo/calendar      # Calendar charts
@nivo/funnel        # Funnel charts
@nivo/network       # Network graphs
@nivo/sankey        # Sankey diagrams
@nivo/sunburst      # Sunburst charts
@nivo/treemap       # Tree maps
```

### Resources

- **Documentation**: https://nivo.rocks/
- **Storybook**: https://nivo.rocks/storybook/
- **Examples**: Explore interactive examples on the Nivo website
- **GitHub**: https://github.com/plouc/nivo
