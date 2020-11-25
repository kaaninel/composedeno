import { Bind } from "./index.ts";

export class TempFile {

	private filename: string;

	constructor (
		public generator: () => string
	) {
		this.filename = Deno.makeTempFileSync({ prefix: "dockrr_" });
		Deno.writeTextFileSync(this.filename, generator());
	}

	Volume (destination: string, readonly = true) {
		return new Bind(this.filename, destination, readonly);
	}

}