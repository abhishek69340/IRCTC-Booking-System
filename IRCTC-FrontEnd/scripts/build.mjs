import { spawnSync } from 'node:child_process'

async function dependenciesAreInstalled() {
  try {
    await Promise.all([import('vite'), import('@vitejs/plugin-react')])
    return true
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      return false
    }

    throw error
  }
}

if (!(await dependenciesAreInstalled())) {
  const install = spawnSync(
    'npm',
    ['ci', '--include=dev', '--ignore-scripts'],
    { stdio: 'inherit' }
  )

  if (install.error) {
    throw install.error
  }

  if (install.status !== 0) {
    process.exit(install.status ?? 1)
  }
}

const { build } = await import('vite')

await build()
