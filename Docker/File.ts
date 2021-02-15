import { Image, Healthcheck as HealthChecker } from "../Service.ts";

export enum Protocols {
	TCP = "tcp",
	UDP = "udp"
}

export class Instruction {

	constructor (
		public Name: string,
		public Arguments: string[],
		public BuildOnly = false
	) { }

	toString () {
		const cmd = [ this.Name, ...this.Arguments ];
		if (this.BuildOnly)
			cmd.unshift("ONBUILD");
		return cmd.join(" ");
	}

	toJSON () {
		return this.toString();
	}

}

export function BuildOnly (...Instructions: Instruction[]) {
	return Instructions.map(x => { x.BuildOnly = true; return x; });
}

export class From extends Instruction {
	constructor (public Image: Image) {
		super("FROM", [ Image.Service().toJSON() ]);
	}
}

export class Entrypoint extends Instruction {
	constructor (...Commands: string[]) {
		super("ENTRYPOINT", [ JSON.stringify(Commands) ]);
	}
}

export class StopSignal extends Instruction {
	constructor (Signal: string) {
		super("STOPSIGNAL", [ Signal ]);
	}
}

export class Run extends Instruction {
	constructor (...Commands: string[]) {
		super("RUN", [ JSON.stringify(Commands) ]);
	}
}

export class Shell extends Instruction {
	constructor (...Commands: string[]) {
		super("SHELL", [ JSON.stringify(Commands) ]);
	}
}

export class CMD extends Instruction {
	constructor (...Commands: string[]) {
		super("CMD", [ JSON.stringify(Commands) ]);
	}
}

export class Env extends Instruction {
	constructor (public Key: string, public Value: string) {
		super("ENV", [ [ Key, Value ].join("=") ]);
	}
}

export class Label extends Instruction {
	constructor (public Key: string, public Value: string) {
		super("LABEL", [ [ Key, Value ].join("=") ]);
	}
}

export class Expose extends Instruction {
	constructor (Port: number, Protocol = Protocols.TCP) {
		super("EXPOSE", [ [ Port, Protocol ].join("/") ]);
	}
}

export class Workdir extends Instruction {
	constructor (public Dir: string) {
		super("WORKDIR", [ JSON.stringify(Dir) ]);
	}
}

export class Volume extends Instruction {
	constructor (public Dir: string) {
		super("VOLUME", [ JSON.stringify(Dir) ]);
	}
}

export class User extends Instruction {
	constructor (public Username: string | number, public Group?: string | number) {
		super("USER", [ [ Username, Group ].join(":") ]);
	}
}

export class Add extends Instruction {
	constructor (public Src: string, public Dst: string) {
		super("ADD", [ JSON.stringify(Src), JSON.stringify(Dst) ]);
	}
}

export class Copy extends Instruction {
	constructor (public Src: string, public Dst: string) {
		super("COPY", [ JSON.stringify(Src), JSON.stringify(Dst) ]);
	}

}

export class Arg extends Instruction {
	constructor (public Key: string, public Value?: string) {
		super("ARG", [ [ Key, Value ].join("=") ]);
	}
}

export class Healthcheck extends Instruction {
	constructor (public Checker: HealthChecker) {
		super("HEALTHCHECK", [
			`--timeout=${Checker.Timeout}`,
			`--interval=${Checker.Interval}`,
			`--retries=${Checker.Retries}`,
			`--start-period=${Checker.StartPeriod}`,
			Checker.Test.join(" ")
		]);
	}
}

export class Stage {

	constructor (
		public Name: string,
		public From: From,
		public Instructions: Instruction[],
	) { }

	toJSON () {
		return [
			`${this.From} as ${this.Name}`,
			...this.Instructions.map(x => x.toJSON())
		];
	}
}

export class Dockerfile {

	public Stages: Stage[] = [];

	constructor () { }

	toJSON () {
		return this.Stages.flatMap(x => x.toJSON());
	}

	toString () {
		return this.toJSON().join("\n");
	}

}