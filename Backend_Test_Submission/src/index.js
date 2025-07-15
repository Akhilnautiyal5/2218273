import express from "express";
import bodyParser from "body-parser";
import { pkg } from "../../Logging_Middleware/Log.js";
const { Log } = pkg;

const app = express();
app.use(bodyParser.json());
const localhost = "http://localhost:3000";

const shortLinks = new Map();

function generateShortCode() {
	return Math.random().toString(36).substring(2, 8);
}

function isValidUrl(url) {
	try {
		new URL(url);
		return true;
	} catch (e) {
		return false;
	}
}

app.post("/shorturls", async (req, res) => {
	const { url, validity = 30, givenShortcode } = req.body();
	if (!url || !isValidUrl(url)) {
		await Log("backend", "error", "handler", "Invalid or missing URL input");
		return res.status(400).json({ error: "Invalid or missing URL" });
	}

	const shortCode = givenShortcode || generateShortCode();
	const expirationDate = new Date(Date.now() + validity * 24 * 60 * 60 * 1000);

	try {
		if (shortLinks.has(shortCode)) {
			await Log(
				"backend",
				"error",
				"handler",
				`Shortcode ${shortCode} already exists`
			);
			return res.status(400).json({ error: "Shortcode already exists" });
		}
		shortLinks.set(shortCode, {
			url,
			expiry: expirationDate,
			createdAt: now,
			stats: [],
		});

		await Log(
			"backend",
			"info",
			"handler",
			`Shortcode created: ${shortCode} for URL: ${url}`
		);
		return res
			.status(201)
			.json({ shortlink: `${localhost}/${shortCode}`, expiry: expirationDate });
	} catch (error) {
		await Log(
			"backend",
			"error",
			"handler",
			`Error creating shortcode: ${error.message}`
		);
		return res.status(500).json({ error: "Internal Server Error" });
	}
});

app.get("/:shortCode", async (req, res) => {
	const { shortCode } = req.params;
	if (!shortCode) {
		await Log("backend", "error", "handler", "Shortcode parameter is missing");
		return res.status(400).json({ error: "Shortcode parameter is missing" });
	}
	try {
		const urlData = shortLinks.get(shortCode);
		if (!urlData) {
			await Log(
				"backend",
				"error",
				"handler",
				`Shortcode ${shortCode} not found`
			);
			return res.status(404).json({ error: "Shortcode not found" });
		}
		if (new Date() > new Date(urlData.expirationDate)) {
			await Log(
				"backend",
				"error",
				"handler",
				`Shortcode ${shortCode} has expired`
			);
			return res.status(410).json({ error: "Shortcode has expired" });
		}
		const url = urlData.url;
		if (!isValidUrl(url)) {
			await Log(
				"backend",
				"error",
				"handler",
				`Invalid URL for shortcode: ${shortCode}`
			);
			return res.status(400).json({ error: "Invalid URL" });
		}
		urlData.stats.push({
			time: now.toISOString(),
		});

		await Log(
			"backend",
			"info",
			"handler",
			`Redirecting to URL: ${url} for shortcode: ${shortCode}`
		);
		return res.redirect(url);
	} catch (error) {
		await Log(
			"backend",
			"error",
			"handler",
			`Error retrieving URL for shortcode: ${error.message}`
		);
		return res.status(500).json({ error: "Internal Server Error" });
	}
});

app.get("/shorturls/:code", async (req, res) => {
	const { code } = req.params;
	const urlData = shortLinks.get(code);
	if (!urlData) {
		await Log("backend", "error", "handler", `Shortcode ${code} not found`);
		return res.status(404).json({ error: "Shortcode not found" });
	}
	await Log(
		"backend",
		"info",
		"handler",
		`Stats fetched for shortcode: ${code}`
	);
	res.json({
		originalUrl: record.url,
		createdAt: record.createdAt,
		expiry: record.expiry,
		totalClicks: record.stats.length,
		clicks: record.stats,
	});
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
