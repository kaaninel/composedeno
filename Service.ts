import { LabelGenerator, Network, PortMap } from "./Network.ts";
import { Mountable } from "./Volume.ts";
import { DockerImage, DockerServiceDeploy, DockerService, DockerServiceHealthcheck, DockerServiceBuild } from "./Docker/Docker.ts";
import { TempFile, toObject } from "./Util.ts";
import { Dockerfile } from "./Docker/File.ts";

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

export class Build {

	constructor (
		public File: Dockerfile,
		public Context?: string,
		public Target?: string,
		public Network?: Network,
		public ArgumentGenerator: LabelGenerator[] = [],
		public LabelGenerator: LabelGenerator[] = [],
		public CacheFrom: string[] = [],
		public SHMSize?: string,
	) {

	}

	Service (target: Service) {
		return new DockerServiceBuild({
			dockerfile: new TempFile(() => this.File.toString()).Path(),
			context: this.Context || Deno.cwd(),
			args: Array.from(this.ArgumentGenerator).flatMap(x => x.Generate(target)),
			cache_from: this.CacheFrom,
			labels: Array.from(this.LabelGenerator).flatMap(x => x.Generate(target)),
			network: this.Network?.name,
			shm_size: this.SHMSize,
			target: this.Target
		});
	}

}

export class Healthcheck {

	constructor (
		public Test: string[],
		public Retries = 3,
		public Timeout = "20s",
		public Interval = "30s",
		public StartPeriod = "30s",
	) { }

	Service () {
		return new DockerServiceHealthcheck({
			interval: this.Interval,
			retries: this.Retries,
			test: this.Test,
			timeout: this.Timeout,
			start_period: this.StartPeriod
		});
	}
}

export class Service {
	networks: Set<Network> = new Set();
	volumes: Set<Mountable> = new Set();
	ports: Set<PortMap> = new Set();
	environment: Record<string, string> = {};
	Dependecies: Set<Service> = new Set();
	deploy?: Deploy;
	healthcheck?: Healthcheck;

	constructor (
		public name: string,
		public Base: Image | Build,
		public Command?: string
	) { }

	AddNetwork (...instances: Network[]) {
		instances.forEach(x => this.networks.add(x));
	}
	AddVolume (...instances: Mountable[]) {
		instances.forEach(x => this.volumes.add(x));
	}
	AddDependency (...instances: Service[]) {
		instances.forEach(x => this.Dependecies.add(x));
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
		const compose = new DockerService({
			environment: this.environment,
			networks: toObject(this.networks, (key, value) => [ key, value.Service(this) ]),
			volumes: Array.from(this.volumes).map(x => x.Service(this)),
			command: this.Command,
			ports: Array.from(this.ports).map(x => x.Service(this)),
			deploy: this.deploy?.Service(this),
			healthcheck: this.healthcheck?.Service(),
			depends_on: Array.from(this.Dependecies).map(x => x.name)
		});
		if (this.Base instanceof Image)
			compose.image = this.Base.Service();
		else
			compose.build = this.Base.Service(this);
		return compose;
	}
}
