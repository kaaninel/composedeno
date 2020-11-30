import { Service } from "./Service.ts";
import { DockerNetworkDrivers, DockerServiceNetwork, DockerNetwork, DockerServicePort } from "./Docker/Docker.ts";

export class Network {
	constructor (
		public name: string,
		private alias: (name: Service) => string,
		private attachable = true,
		private external = true,
		private driver = DockerNetworkDrivers.Overlay
	) { }

	Service (target: Service) {
		return new DockerServiceNetwork({
			aliases: [ this.alias(target) ]
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
		public destination: number
	) { }

	Service (_target: Service) {
		return new DockerServicePort({
			source: this.source,
			destination: this.destination
		});
	}
}

export abstract class LabelGenerator {
	constructor () { }
	abstract Generate (Service: Service): string[];
}
