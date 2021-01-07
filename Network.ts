import { Service } from "./Service.ts";
import { DockerNetworkDrivers, DockerServiceNetwork, DockerNetwork, DockerServicePort } from "./Docker/Docker.ts";

export class Network {
	constructor (
		public name: string,
		private alias: (name: Service) => string,
		private attachable = true,
		private external = false,
		private driver = DockerNetworkDrivers.Overlay
	) { }

	Service (target: Service) {
		return new DockerServiceNetwork({
			aliases: [ this.alias(target), ...target.Aliases ]
		});
	}

	Compose () {
		return new DockerNetwork({
			attachable: this.attachable,
			driver: this.driver,
			external: this.external
		});
	}
}

export class PortMap {
	constructor (
		public source: number,
		public destination: number,
		public protocol?: string
	) { }

	Service (_target: Service) {
		return new DockerServicePort({
			source: this.source,
			protocol: this.protocol,
			destination: this.destination
		});
	}
}

export abstract class LabelGenerator {
	constructor () { }
	abstract Generate (Service: Service): string[];
}
