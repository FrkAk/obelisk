I'm building a Flutter app for the Obelisk project — a contextual discovery platform for Munich. The Next.js backend already exists and stays as an API server. The Flutter app replaces the React frontend.

Read these files first (in this order):
1. `CLAUDE.md` — global coding rules
2. `design.md` — visual design tokens (colors, typography, spacing, shadows, glass materials)
3. `flutter.md` — Flutter project plan, conventions, task breakdown
4. `ui-ux.md` — detailed UI/UX specs for every component

Then implement **V0.4** from flutter.md

after implementation verify: `flutter analyze` passes with zero issues, `dart format .` clean

Follow the conventions in `flutter.md` strictly — Dart native `///` doc comments, no dynamic types, const constructors, snake_case files, PascalCase widgets. Every public class/method gets a docstring.

After completing all tasks, update each task status in `flutter.md` from `[TODO]` to `[DONE]`.
ma