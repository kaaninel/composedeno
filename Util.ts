import { Bind } from "./index.ts";
import { createHash } from "https://deno.land/std@0.82.0/hash/mod.ts";
import { join } from "https://deno.land/std@0.82.0/path/posix.ts";


export class TempFile {

	private filename: string;

	constructor (
		public generator: () => string
	) {
		const content = generator();
		const hash = createHash("md5");
		hash.update(content);
		const filename = hash.toString();
		this.filename = join(
			Deno.env.get("TMPDIR") ||
			Deno.env.get("TEMPDIR") ||
			Deno.env.get("TEMP") ||
			"/tmp/", `dockrr_${filename}`);
		Deno.writeTextFileSync(this.filename, content);
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