// Empty side-effect stub. Next.js aliases the bare "server-only" specifier
// to its own internal compiled package at build time (no install needed),
// which throws if the importing module ends up in a client bundle. That
// aliasing only exists inside Next's bundler, so a standalone `node`
// process (e.g. prisma/seed.ts or a one-off comparison script) has nothing
// to resolve "server-only" to. This stub lets `import "server-only"` — a
// side-effect-only import with no exports — resolve to a no-op outside of
// Next, without installing the package.
