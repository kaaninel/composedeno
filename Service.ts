import { LabelGenerator, Network, PortMap } from "./Network.ts";
import { Mountable } from "./Volume.ts";
import { DockerImage, DockerServiceDeploy, DockerService } from "./Docker.ts";
import { toObject } from "./Util.ts";

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

export class Deploy {

	labelGenerators: Set<LabelGenerator> = new Set();
	constraintsGenerators: Set<LabelGenerator> = new Set();

	constructor (
		public replicas = 1,
	) { }


	AddLabelGenerator (...instances: LabelGenerator[]) {
		instances.forEach(x => this.labelGenerators.add(x));
	}
	AddConstraintsGenerator (...instances: LabelGenerator[]) {
		instances.forEach(x => this.constraintsGenerators.add(x));
	}

	Service (target: Service) {
		return new DockerServiceDeploy({
			labels: Array.from(this.labelGenerators).flatMap(x => x.Generate(target)),
			replicas: this.replicas,
			placement: {
				constraints: Array.from(this.constraintsGenerators).flatMap(x => x.Generate(target))
			}
		});
	}

}

export class Service {
	networks: Set<Network> = new Set();
	volumes: Set<Mountable> = new Set();
	ports: Set<PortMap> = new Set();
	environment: Record<string, string> = {};
	deploy = new Deploy();

	constructor (
		public name: string,
		public image: Image,
		public command?: string
	) { }

	AddNetwork (...instances: Network[]) {
		instances.forEach(x => this.networks.add(x));
	}
	AddVolume (...instances: Mountable[]) {
		instances.forEach(x => this.volumes.add(x));
	}
	AddPort (...instances: Array<PortMap | [ number, number ]>) {
		instances.forEach(x => {
			if (x instanceof PortMap)
				this.ports.add(x);
			else
				this.ports.add(new PortMap(x[ 0 ], x[ 1 ]));
		});
	}
	AddEnvironment (key: string, value: string) {
		this.environment[ key ] = value.toString();
	}

	Compose () {
		return new DockerService({
			image: this.image.Service(),
			environment: this.environment,
			network: toObject(this.networks, (key, value) => [ key, value.Service(this) ]),
			volumes: Array.from(this.volumes).map(x => x.Service(this)),
			command: this.command,
			deploy: this.deploy.Service(this)
		});
	}
}
