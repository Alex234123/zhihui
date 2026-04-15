import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'src/tests'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
})
