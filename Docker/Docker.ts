import { Dockerfile } from "./File.ts";

export class DockerBase<T> {
	constructor (Data: Partial<T>) {
		Object.assign(this, Data);
	}
}

export enum DockerNetworkDrivers {
	Bridge = "bridge",
	Host = "host",
	Overlay = "overlay",
	MacVLan = "macvlan",
	None = "none"
}

export class DockerCompose {
	version = "3.8";
	networks: Record<string, DockerNetwork> = {};
	services: Record<string, DockerService> = {};
	volumes: Record<string, DockerVolume> = {};

	constructor (Data: Partial<DockerCompose>) {
		Object.assign(this, Data);;
	}
}

export class DockerNetwork {
	attachable = true;
	external = true;
	driver = DockerNetworkDrivers.Overlay;

	constructor (Data: Partial<DockerNetwork>) {
		Object.assign(this, Data);;
	}
}

export class DockerVolume {
	external = false;

	constructor (Data: Partial<DockerVolume>) {
		Object.assign(this, Data);;
	}
}

export class DockerImage {
	domain?: string;
	name!: string;
	tag: string = "latest";

	constructor (Data: Partial<DockerImage>) {
		Object.assign(this, Data);;
	}
	toJSON () {
		const name = `${this.name}:${this.tag}`;
		if (!this.domain)
			return name;
		return `${this.domain}/${name}`;
	}

	static Repository (domain: string) {
		return function (name: string) {
			return new DockerImage({ domain, name });
		};
	}
}

export class DockerServiceNetwork {
	aliases: string[] = [];

	constructor (Data: Partial<DockerServiceNetwork>) {
		Object.assign(this, Data);;
	}
}

export class DockerServiceDeploy {
	labels: string[] = [];
	replicas?: number;
	mode?: string;

	placement: {
		constraints: string[];
	} = {
			constraints: []
		};

	constructor (Data: Partial<DockerServiceDeploy>) {
		Object.assign(this, Data);;
	}
}

export class DockerServiceHealthcheck {

	public test: string[] = [];
	public interval = "30s";
	public timeout = "20s";
	public retries = 3;
	public start_period = "40s";

	constructor (Data: Partial<DockerServiceHealthcheck>) {
		Object.assign(this, Data);
	}

}

export class DockerServiceVolume {
	source!: string;
	destination!: string;
	readonly = false;

	constructor (Data: Partial<DockerServiceVolume>) {
		Object.assign(this, Data);;
	}

	toJSON () {
		return `${this.source}:${this.destination}${this.readonly ? ":ro" : ""}`;
	}
}

export class DockerServicePort {
	source!: number;
	destination!: number;

	constructor (Data: Partial<DockerServicePort>) {
		Object.assign(this, Data);;
	}

	toJSON () {
		return `${this.source}:${this.destination}`;
	}
}


export class DockerServiceBuild {
	dockerfile!: string;
	context?: string;
	args: string[] = [];
	cache_from: string[] = [];
	labels: string[] = [];
	network?: string;
	shm_size?: string;
	target?: string;

	constructor (Data: Partial<DockerServiceBuild>) {
		Object.assign(this, Data);;
	}
}

export class DockerService {
	image?: DockerImage;

	build?: DockerServiceBuild;
	networks: Record<string, DockerServiceNetwork> = {};
	environment: Record<string, string> = {};
	command?: string;
	volumes: DockerServiceVolume[] = [];
	secrets: string[] = [];
	depends_on: string[] = [];
	deploy?: DockerServiceDeploy;
	healthcheck?: DockerServiceHealthcheck;
	ports: DockerServicePort[] = [];

	constructor (Data: Partial<DockerService>) {
		Object.assign(this, Data);;
	}
}
