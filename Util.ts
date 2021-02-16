import { Bind } from "./index.ts";
import { createHash } from "https://deno.land/std@0.82.0/hash/mod.ts";
import { join } from "https://deno.land/std@0.82.0/path/mod.ts";


export class TempFile {
	static Tmp = Deno.makeTempDirSync();

	private filename: string;

	constructor (
		public generator: () => string,
		extension = ""
	) {
		const content = generator();
		const hash = createHash("md5");
		hash.update(content);
		const filename = hash.toString();
		this.filename = join(TempFile.Tmp, `dockrr_${filename}${extension}`);
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
	fn: (key: string, value: T) => [ string, V ]
) {
	return Object.fromEntries(Array.from(items).map(x => fn(x.name, x)));
}