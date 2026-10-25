# Moon

The moon at its real phase for a given moment, computed on the device.

`date` defaults to now. The phase is the same everywhere on Earth; a `moon-south` class on the root turns every moon half a turn, as seen from the southern hemisphere. `Torch.moonPhase(date)` returns `{ phase, lit, name }` for text: phase from 0 (new) to 1, lit from 0 to 1, name such as Waxing gibbous.

- Decorative by default. Pass `label: true` to name the phase and its lit part (Waxing gibbous, 82% lit), or a text of your own.
- The lit side runs from `moon-lit-top` to `moon-lit-bottom` (flat moonlight at night, sunrise gold to coral at dawn), the dark side is `moon-shade`.
- At night the lit side shows the seas of the near side (`moon-maria`), Tycho and Copernicus (`moon-crater`) and a darker edge (`moon-limb`). These tokens are transparent at dawn.
- 30 for the Nightango mark, 12 in day dividers.
