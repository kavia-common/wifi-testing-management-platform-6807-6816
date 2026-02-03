# Shared UI components (Ocean Professional)

This folder contains reusable, theme-aligned UI components intended to be composed inside pages.

## Importing

Prefer importing from the barrel:

```js
import { Button, TextInput, Table, Badge, Modal, EmptyState, Loader } from "../components/ui";
```

## Components

- **Button**: variants `primary|secondary|success|error|ghost`, sizes `sm|md|lg`, supports `loading`
- **TextInput**: label, helper/error text, optional icons, accessible `aria-describedby`
- **Table**: simple column config + responsive scroll, render functions
- **Modal**: ESC-to-close, backdrop click, basic focus trap, restores focus on close
- **Badge**: pill statuses
- **EmptyState**: title/description/action slots
- **Loader**: inline/block loading indicator

## Notes

- All colors/shadows/radii use `src/styles/theme.css` variables.
- Icon props accept any ReactNode; use `ariaLabel` for icon-only buttons/inputs.
