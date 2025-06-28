import * as path from 'path';
import { glob } from 'glob';

export async function run(): Promise<void> {
	// Create the mocha test
	const { default: Mocha } = await import('mocha');
	const mocha = new Mocha({
		ui: 'tdd',
		color: true,
		timeout: 10000
	});

	const testsRoot = path.resolve(__dirname, '..');

	try {
		// Find test files
		const files = await glob('**/**.test.js', { cwd: testsRoot });
		
		// Add files to the test suite
		files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

		// Run the mocha test
		return new Promise((resolve, reject) => {
			mocha.run((failures: number) => {
				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`));
				} else {
					resolve();
				}
			});
		});
	} catch (err) {
		console.error(err);
		throw err;
	}
} 