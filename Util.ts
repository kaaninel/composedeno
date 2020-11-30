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

	Path () {
		return this.filename;
	}
}

export function toObject<T extends { name: string; }, V> (
	items: Set<T>,
	fn: (key: string, value: T) => [ string, V ] = (x, y) => [ x, y as any ]
) {
	return Object.fromEntries(Array.from(items).map(x => fn(x.name, x)));
}