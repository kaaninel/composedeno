import { stringify } from 'https://deno.land/std@0.79.0/encoding/yaml.ts';
import { DockerCompose } from "./Docker.ts";
import { Network } from "./Network.ts";
import { Service } from "./Service.ts";
import { toObject } from "./Util.ts";
import { Volume } from "./Volume.ts";
export * from "./Volume.ts";
export * from "./Network.ts";
export * from "./Service.ts";

export class Compose {
	volumes: Set<Volume> = new Set();
	services: Set<Service> = new Set;
	networks: Set<Network> = new Set();

	AddNetwork (...instances: Network[]) {
		instances.forEach(x => this.networks.add(x));
	}

	AddVolume (...instances: Volume[]) {
		instances.forEach(x => this.volumes.add(x));
	}

	AddService (...instances: Service[]) {
		instances.forEach(x => {
			this.services.add(x);
			x.volumes.forEach(x => {
				if (x instanceof Volume)
					this.AddVolume(x);
			});
			x.networks.forEach(x => {
				this.AddNetwork(x);
			});
		});
	}

	Compose (version = "3.8") {
		return new DockerCompose({
			version,
			networks: toObject(this.networks, (key, value) => [ key, value.Compose() ]),
			services: toObject(this.services, (key, value) => [ key, value.Compose() ]),
			volumes: toObject(this.volumes, (key, value) => [ key, value.Compose() ])
		});
	}

	Print () {
		console.log(stringify(JSON.parse(JSON.stringify(this.Compose()))));
	}
}