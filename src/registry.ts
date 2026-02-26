import * as fs from 'fs'
import * as path from 'path'
import log from '@mwni/log'
import * as toml from 'toml'
import { AppContext, Caip2Chain, Caip19Asset } from './types.js'

type PresetConfig = {
	chain?: Array<Caip2Chain>,
	asset?: Array<Caip19Asset>
}

export async function initRegistry(ctx: AppContext){
	let presetsDir = path.join(ctx.srcDir, '..', 'presets')
	let presetFiles = fs.readdirSync(presetsDir)

	for(let file of presetFiles){
		log.info(`loading preset list ${file}`)

		try{
			const configText: string = fs.readFileSync(path.join(presetsDir, file), 'utf-8')
			const { chain, asset }: PresetConfig = toml.parse(configText)

			if(chain?.length)
				ctx.chains.push(...chain)

			if(asset?.length)
				ctx.assets.push(...asset)

		}catch (error){
			log.warn(`corrupt preset file ${file}`)
			log.warn(error)
		}
	}

	for(let asset of ctx.assets.slice()){
		const [chainId, _] = asset.id.split('/')
		const chain = ctx.chains.find(chain => chain.id === chainId)

		if(!chain){
			log.warn(`missing chain definition for asset ${asset.id}`)
			ctx.assets.splice(ctx.assets.indexOf(asset, 1))
			continue
		}

		asset.chain = chain
	}
	
	log.info(`loaded ${ctx.chains.length} chains and ${ctx.assets.length} assets in total`)
}

export function mapAliasToAsset(
	ctx: AppContext, 
	alias: { symbol: string, network?: string, platform?: string }
): Caip19Asset | null {
	const searchSymbol = alias.symbol.toLowerCase()
	const searchNetwork = alias.network?.toLowerCase()
	const searchPlatform = alias.platform?.toLowerCase()

	const calculateScore = (asset: Caip19Asset): number => {
		const assetSymbol = asset.symbol.toLowerCase()
		const assetName = asset.name.toLowerCase()
		const assetAliases = [
			{ symbol: assetSymbol },
			{ network: assetSymbol },
			{ network: assetName },
			...asset.aliases
		]

		let score = 0

		for(let assetAlias of assetAliases){
			const aliasSymbol = assetAlias.symbol?.toLowerCase()
			const aliasNetwork = assetAlias.network?.toLowerCase()

			if(searchSymbol === aliasSymbol && searchNetwork === aliasNetwork){
				score += 1
				break
			}

			/*if(searchPlatform && assetAlias.usedBy){
				const aliasUsedBy = assetAlias.usedBy?.map(platform => platform.toLowerCase())
			}*/

			if(aliasSymbol && searchSymbol === aliasSymbol)
				score += 0.25

			if(searchNetwork){
				if(aliasNetwork && searchNetwork === aliasNetwork)
					score += 0.25
			}else{
				if(
					aliasSymbol && aliasNetwork && (
						searchSymbol === `${aliasSymbol}${aliasNetwork}` ||
						searchSymbol === `${aliasSymbol}_${aliasNetwork}` ||
						searchSymbol === `${aliasSymbol}:${aliasNetwork}`
					)
				){
					score += 0.5
				}
			}
		}

		return score
	}

	return ctx.assets
		.map(asset => ({ asset, score: calculateScore(asset) }) as { asset: Caip19Asset, score: number })
		.sort((a, b) => b.score - a.score)
		.filter(({ score }) => score > 0.25)
		.at(0)
		?.asset
}