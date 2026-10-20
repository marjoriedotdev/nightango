# Skeleton

A shimmering placeholder that holds the place of content still loading.

Pass `width` and `height` in pixels, or `circle` for an avatar. Compose them in the shape of the rows they replace (avatar plus one or two lines) so the layout does not jump when the content arrives. Use them only while data is on its way: an empty list says so in words.

- Skeletons are hidden from assistive tech: the region that loads announces it once, in text.
- The shimmer stops when the reader asks for reduced motion.
- Add `tc-fade-in` on content that replaces a skeleton or appears late, such as a loaded picture.
