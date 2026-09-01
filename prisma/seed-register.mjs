// Registers ./seed-loader.mjs as a Node module resolution hook (the stable
// `module.register` API) so that running `prisma/seed.ts` directly with
// `node` can resolve this project's "@/*" path alias. Loaded via `node
// --import ./prisma/seed-register.mjs prisma/seed.ts`.
import { register } from "node:module";

register("./seed-loader.mjs", import.meta.url);
