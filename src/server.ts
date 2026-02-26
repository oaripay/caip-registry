import log from '@mwni/log'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import type { AppContext } from './types.js'
import { mapAliasToAsset } from './registry.js'

export default function startServer(ctx: AppContext): { close: () => void } {
	const app = new Hono()

	app.get('/', async c => {
		return c.json({
			assets: ctx.assetList
		})
	})

	app.post('/map', async c => {
		const payload = await c.req.json() as Array<{
			symbol: string
			network?: string
			source?: string
		}>

		if(!Array.isArray(payload)){
			return c.json({ error: 'Body must be an array' }, 400)
		}

		const mapped = payload.map(alias => mapAliasToAsset(ctx, alias))

		return c.json(mapped)
	})

	const server = serve({
		fetch: app.fetch,
		port: ctx.config.server.port,
		hostname: ctx.config.server.address
	})

	log.info(`listening on ${ctx.config.server.address}:${ctx.config.server.port}`)

	return server
}