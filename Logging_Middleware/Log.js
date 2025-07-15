// log.js

const LOG_ENDPOINT = "http://20.244.56.144/evaluation-service/logs";

async function Log(stack, level, pkg, message) {
	const payload = {
		stack: stack.toLowerCase(),
		level: level.toLowerCase(),
		package: pkg.toLowerCase(),
		message,
	};

	try {
		const response = await fetch(LOG_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();

		if (!response.ok) {
			console.error(`Logging failed: ${response.status} - ${data?.message}`);
		}
	} catch (error) {
		console.error("Failed to send log:", error);
	}
}

export { Log };
