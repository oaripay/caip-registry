import * as fs from 'fs'
import * as path from 'path'
import log from '@mwni/log'
import * as toml from 'toml'
import { AppContext, Caip19Alias, Caip19Asset } from './types.js'

type PresetConfig = {
	asset?: Array<Caip19Asset>
}

export async function loadAssetLists(ctx: AppContext){
	let presetsDir = path.join(ctx.srcDir, '..', 'presets')
	let presetFiles = fs.readdirSync(presetsDir)

	for(let file of presetFiles){
		log.info(`loading asset list ${file}`)

		try{
			const configText: string = fs.readFileSync(path.join(presetsDir, file), 'utf-8')
			const { asset }: PresetConfig = toml.parse(configText)

			if(asset?.length)
				ctx.assetList.push(...asset)
		}catch (error){
			log.warn(`corrupt preset file ${file}`)
			log.warn(error)
		}
	}

	updateAliasMap(ctx)
	
	log.info(`loaded ${ctx.assetList.length} assets in total`)
}

export function mapAliasToAsset(
	ctx: AppContext, 
	alias: { symbol: string, network?: string, source?: string }
): Caip19Asset | null {
	const aliasSource = alias.source ? alias.source.toLowerCase() : null
	const aliasSymbol = alias.symbol.toLowerCase()

	const calculateScore = (a: Caip19Alias): number => {
		let score = 0
		

		if(a.symbol.toLowerCase() === aliasSymbol)
			score += 100

		if(a.network && !alias.network){
			const concatSymbol = a.symbol.toLowerCase() + a.network.toLowerCase()

			if(concatSymbol === aliasSymbol)
				score += 50

			if('W' + concatSymbol === aliasSymbol)
				score += 25
		}

		if(alias.network && a.network && a.network.toLowerCase() === alias.network.toLowerCase())
			score += 10

		if(aliasSource && Array.isArray(a.usedBy) && a.usedBy.some((source: string) => source.toLowerCase() === aliasSource))
			score += 5

		return score
	}

	const ranking = Array.from(ctx.aliasMap.keys())
		.map(a => ({ alias: a, score: calculateScore(a) }) as { alias: Caip19Alias, score: number })
		.sort((a, b) => b.score - a.score)

	const bestMatch = ranking.find(entry => entry.score > 5)
	return bestMatch ? (ctx.aliasMap.get(bestMatch.alias) ?? null) : null
}

function updateAliasMap(ctx: AppContext){
	ctx.aliasMap = new Map()

	for(const asset of ctx.assetList){
		ctx.aliasMap.set({ symbol: asset.symbol, network: asset.network }, asset)

		if(!Array.isArray(asset.aliases))
			continue

		for(const alias of asset.aliases){
			ctx.aliasMap.set(alias, asset)
		}
	}
}