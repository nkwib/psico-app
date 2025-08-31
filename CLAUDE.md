# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev
npm run dev -- --open  # Opens in browser

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check
npm run check:watch  # Watch mode

# Run tests
npm run test         # Run all tests once
npm run test:unit    # Run tests in watch mode
```

## Architecture Overview

This is a SvelteKit application with Svelte 5 and TypeScript, using shadcn-svelte UI components.

### Tech Stack
- **Framework**: SvelteKit with Svelte 5
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS v4 with Tailwind Vite plugin
- **UI Components**: shadcn-svelte components in `src/lib/components/ui/`
- **Testing**: Vitest with separate browser (Playwright) and Node environments

### Project Structure
- `src/routes/`: SvelteKit pages and layouts
- `src/lib/components/ui/`: shadcn-svelte UI components (button, card, dialog, input, etc.)
- `src/lib/utils.ts`: Utility functions including `cn()` for className merging
- `$lib` alias maps to `src/lib/`

### Configuration
- **Vite Config**: Uses Tailwind CSS Vite plugin and SvelteKit plugin
- **TypeScript**: Strict mode with module resolution set to "bundler"
- **Testing**: Configured for both client-side (Svelte components) and server-side tests
  - Client tests: `*.svelte.{test,spec}.{js,ts}` run in browser environment
  - Server tests: Other test files run in Node environment

### shadcn-svelte Integration
The project uses shadcn-svelte components configured via `components.json`:
- Base color: slate
- Component aliases: `$lib/components/ui`
- Utility functions in `$lib/utils`