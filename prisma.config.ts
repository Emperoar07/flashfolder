import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrate: {
    async seed(tx) {
      const { execSync } = await import('child_process')
      execSync('tsx prisma/seed.ts', { stdio: 'inherit' })
    },
  },
})
