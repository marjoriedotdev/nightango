# Moon

The moon at its real phase for a given moment, computed on the device.

`date` defaults to now. The phase is the same everywhere on Earth; a `moon-south` class on the root mirrors every moon for the southern hemisphere. `Torch.moonPhase(date)` returns `{ phase, lit, name }` for text: phase from 0 (new) to 1, lit from 0 to 1, name such as Waxing gibbous.

- Decorative by default. Pass `label: true` to name the phase and its lit part (Waxing gibbous, 82% lit), or a text of your own.
- The lit side uses `moon-ink`, the dark side `moon-shade`: it reads on every surface in both themes.
- 30 for the Nightango mark, 12 in day dividers.
