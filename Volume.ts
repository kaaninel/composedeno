import { Service } from "./Service.ts";
import { DockerServiceVolume, DockerVolume } from "./Docker/Docker.ts";

export class Mountable {
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

	Compose () {
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
