# AGENTS.md

## Stack
- Node.js (ES Modules)
- Express
- TypeScript
- pnpm

## Rules
- Use ESM imports (with .js extension)
- Keep flat folder structure
- Avoid unnecessary abstraction
- Use only `_id: ObjectId` for all models - do NOT add separate `id: string` field

## API Format
{
  success: boolean,
  data: any,
  message?: string
}

## Naming
- files: lowercase
- no suffix like .controller.ts

## Notes
- Follow existing patterns
- Do not introduce new architecture layers