import { Source } from '../types'


export default class CoinMarketCap implements Source{
	async getAllAssets(): Promise<Array<object>> {
		return [{}]
	}
}