# Button

Text buttons in four variants: primary, secondary, ghost and danger.

Provide the label as children, verb first in sentence case: "Save changes", "Join", "Create account".

- `primary` (accent fill, `on-accent` text): at most one per view, for the action the view exists for.
- `secondary` (outlined with `control`): every other action that changes something.
- `ghost`: cancel, discard, navigation-like actions.
- `danger`: destructive actions, always followed by a confirmation.
- Sizes: `sm` inside cards and lists, `md` default, `lg` for login and dialogs. Use `block` to fill a form column.
