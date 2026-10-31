# CountBadge

An accent pill with an unread or mention count.

Pass `count`; it renders nothing at zero and caps at 99+. Pass `mention` to prefix @ for mentions, which outrank plain unread counts: @99+ at most. The accessible name keeps the exact count. A plain unread state with no count uses the 6px `tc-dot` instead.
