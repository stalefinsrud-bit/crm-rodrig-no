Review the entire codebase thoroughly and produce a structured report covering:

1. **Architecture & Patterns** — Are the established patterns (hooks for data, React Query, Supabase, role-based routing) used consistently? Any deviations?

2. **Code Quality** — Identify duplication, overly complex components, dead code, or files that should be split/merged.

3. **Type Safety** — Missing or weak types, improper use of `any`, places where types from `src/integrations/supabase/types.ts` should be used but aren't.

4. **Security** — Auth checks, RLS reliance, anything exposed that shouldn't be, secrets handling.

5. **Performance** — Unnecessary re-renders, missing React Query optimizations, large bundle concerns, N+1 query patterns.

6. **UX & Accessibility** — Missing loading/error states, broken flows, accessibility gaps.

7. **Bugs & Risks** — Anything that looks broken or fragile.

8. **Recommendations** — Prioritized list of what to fix or improve (High / Medium / Low).

Read all files in `src/pages/`, `src/hooks/`, `src/components/` (excluding `src/components/ui/`), `api/`, and `src/integrations/`. Be specific — reference file paths and line numbers where relevant.
