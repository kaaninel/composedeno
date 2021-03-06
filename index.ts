import { stringify } from 'https://deno.land/std@0.79.0/encoding/yaml.ts';
import {
	DockerNetwork,
	DockerNetworkDrivers,
	DockerServiceVolume,
	DockerVolume,
	DockerServicePort,
	DockerServiceNetwork,
	DockerService,
	DockerImage,
	DockerCompose
} from "./Docker.ts";

class Mountable {
	constructor (
		public source: string,
		public destination: string,
		public readonly = false
	) { }

	Service (_target: Service): DockerServiceVolume {
		return new DockerServiceVolume({ ...this });
	}
}

export class Volume extends Mountable {
	constructor (
		public name: string,
		destination: string,
		readonly = false,
		public external = true
	) {
		super(name, destination, readonly);
	}

	Docker () {
		return new DockerVolume({
			external: this.external
		});
	}
}

export class Bind extends Mountable {
	constructor (
		source: string,
		destination: string,
		readonly = false
	) {
		super(source, destination, readonly);
	}
}

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

	Docker () {
		return new DockerNetwork({
			attachable: this.attachable,
			driver: this.driver,
			external: this.external
		});
	}
}

export class Image {
	constructor (
		public name: string,
		public domain?: string,
		public tag: string = "latest"
	) { }

	Service () {
		return new DockerImage({
			domain: this.domain,
			name: this.name,
			tag: this.tag
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

export class Service {
	networks: Set<Network> = new Set();
	volumes: Set<Mountable> = new Set();
	ports: Set<PortMap> = new Set();
	environment: Record<string, string> = {};

	constructor (
		public name: string,
		public image: Image,
		public command?: string
	) { }

	AddNetwork (instance: Network) {
		this.networks.add(instance);
	}

	AddEnvironment (key: string, value: string) {
		this.environment[ key ] = value.toString();
	}

	AddVolume (instance: Mountable) {
		this.volumes.add(instance);
	}

	AddPort (instance: PortMap) {
		this.ports.add(instance);
	}

	Docker () {
		return new DockerService({
			image: this.image.Service(),
			environment: this.environment,
			network: toObject(this.networks, (key, value) => [ key, value.Service(this) ]),
			volumes: Array.from(this.volumes).map(x => x.Service(this)),
			command: this.command,
		});
	}
}

export class Compose {
	volumes: Set<Volume> = new Set();
	services: Set<Service> = new Set;
	networks: Set<Network> = new Set();

	AddNetwork (instance: Network) {
		this.networks.add(instance);
	}

	AddVolume (instance: Volume) {
		this.volumes.add(instance);
	}

	AddService (instance: Service) {
		this.services.add(instance);
		instance.volumes.forEach(x => {
			if (x instanceof Volume)
				this.AddVolume(x);
		});
		instance.networks.forEach(x => {
			this.AddNetwork(x);
		});
	}

	Docker (version = "3.8") {
		return new DockerCompose({
			version,
			networks: toObject(this.networks, (key, value) => [ key, value.Docker() ]),
			services: toObject(this.services, (key, value) => [ key, value.Docker() ]),
			volumes: toObject(this.volumes, (key, value) => [ key, value.Docker() ])
		});
	}

	Print () {
		console.log(stringify(JSON.parse(JSON.stringify(this.Docker()))));
	}
}

function toObject<T extends { name: string; }, V> (
	items: Set<T>,
	fn: (key: string, value: T) => [ string, V ] = (x, y) => [ x, y as any ]
) {
	return Object.fromEntries(Array.from(items).map(x => fn(x.name, x)));
}