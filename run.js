#!/usr/bin/env node

import { pathToFileURL } from 'node:url'
import path from 'node:path'

const binDir = path.dirname(new URL(import.meta.url).pathname)
const cliPath = path.resolve(binDir, './src/cli.ts')
const childUrl = pathToFileURL(cliPath).toString()

await import('tsx/esm')
await import(childUrl)
