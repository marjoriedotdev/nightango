# Spinner

A turning ring for a short wait triggered by the reader.

Use it inline where an action is in progress: loading earlier messages, signing in. Prefer a Skeleton when the shape of the coming content is known. It takes `currentColor`; `size` defaults to 16.

- Pass `label` when no visible text says what is loading; leave it out next to a text such as "Signing in".
- It stops turning when the reader asks for reduced motion.
