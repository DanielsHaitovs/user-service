# MakeEasyCommerce Development Guide

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Environment setup:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   npm run start:dev
   ```

## Development Scripts

### Code Quality

- `npm run code:check` - Check formatting and linting
- `npm run code:fix` - Fix formatting and linting issues
- `npm run typecheck` - Type checking without compilation

### Building

- `npm run build` - Build for production
- `npm run clean` - Clean build directory

### Testing

- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests

### Development

- `npm run start:dev` - Start with hot reload
- `npm run start:debug` - Start in debug mode

## Project Structure

```
src/
├── common/          # Shared utilities, guards, decorators
├── modules/         # Feature modules
├── shared/          # Shared services, DTOs
├── app.module.ts    # Root module
└── main.ts          # Application entry point

test/
└── e2e/            # End-to-end tests
```

## Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Comprehensive rules for code quality
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for quality checks

## Path Aliases

Use these path aliases for cleaner imports:

- `@/*` → `src/*`
- `@/common/*` → `src/common/*`
- `@/modules/*` → `src/modules/*`
- `@/shared/*` → `src/shared/*`

## Git Workflow

1. Pre-commit hooks automatically run:
   - ESLint fixes
   - Prettier formatting
   - Type checking

2. All code must pass quality checks before commit

## Environment Variables

See `.env.example` for required environment variables.

## Docker

```bash
# Build image
docker build -t makeeasycommerce .

# Run container
docker run -p 3000:3000 makeeasycommerce
```
