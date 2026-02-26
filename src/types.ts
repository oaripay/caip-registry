export type AppConfig = {
	server: {
		address: string
		port: number
	},
	log: {
		level: string
	}
}

export type AppContext = {
	srcDir: string
	version: string
	config: AppConfig
	assetList: Array<Caip19Asset>,
	aliasMap: Map<Caip19Alias, Caip19Asset>
	server?: { close: () => void },
}

export type Caip19Asset = {
	id: string,
	name: string,
	symbol: string,
	network: string,
	aliases: Array<Caip19Alias>
}

export type Caip19Alias = {
	symbol: string,
	network?: string,
	usedBy?: Array<string>
}