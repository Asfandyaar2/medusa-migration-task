import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Neon (and most hosted Postgres providers) terminate TLS with a cert
    // chain Node doesn't always fully trust; rejectUnauthorized: false is
    // the standard workaround in Medusa's own hosted-Postgres deploy guides.
    // Scoped to production so local Postgres (no TLS) is unaffected.
    ...(process.env.NODE_ENV === "production"
      ? {
          databaseDriverOptions: {
            connection: {
              ssl: { rejectUnauthorized: false },
            },
          },
        }
      : {}),
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: "./src/modules/blog",
    },
  ],
})
