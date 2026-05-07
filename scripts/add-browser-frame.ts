import fs from "fs";
import path from "path";
import sharp from "sharp";

const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");

const FRAME = {
	titleBar: { height: 52 },
	buttons: { size: 12, spacing: 8, leftPadding: 20 },
	urlBar: { height: 28, borderRadius: 6, marginX: 100 },
	cornerRadius: 12,
	padding: 40,
	shadow: { blur: 30, alpha: 0.15 },
};

function createTitleBarSvg(width: number, height: number, url: string, dark: boolean) {
	const { buttons, urlBar } = FRAME;
	const buttonY = (height - buttons.size) / 2 + buttons.size / 2;

	const bgGradient = dark
		? `<stop offset="0%" style="stop-color:#2d2d2f;stop-opacity:1" /><stop offset="100%" style="stop-color:#1e1e20;stop-opacity:1" />`
		: `<stop offset="0%" style="stop-color:#fafafa;stop-opacity:1" /><stop offset="100%" style="stop-color:#e8e8e8;stop-opacity:1" />`;
	const borderColor = dark ? "#3a3a3c" : "#d1d1d1";
	const urlBarFill = dark ? "#1a1a1c" : "#ffffff";
	const urlBarStroke = dark ? "#3a3a3c" : "#e0e0e0";
	const textFill = dark ? "#999999" : "#666666";

	return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
		<defs><linearGradient id="tg" x1="0%" y1="0%" x2="0%" y2="100%">${bgGradient}</linearGradient></defs>
		<rect width="${width}" height="${height}" fill="url(#tg)" />
		<line x1="0" y1="${height - 0.5}" x2="${width}" y2="${height - 0.5}" stroke="${borderColor}" stroke-width="1" />
		<circle cx="${buttons.leftPadding}" cy="${buttonY}" r="${buttons.size / 2}" fill="rgb(255,95,87)" />
		<circle cx="${buttons.leftPadding + buttons.size + buttons.spacing}" cy="${buttonY}" r="${buttons.size / 2}" fill="rgb(255,189,46)" />
		<circle cx="${buttons.leftPadding + (buttons.size + buttons.spacing) * 2}" cy="${buttonY}" r="${buttons.size / 2}" fill="rgb(39,201,63)" />
		<rect x="${urlBar.marginX}" y="${(height - urlBar.height) / 2}" width="${width - urlBar.marginX * 2}" height="${urlBar.height}" rx="${urlBar.borderRadius}" fill="${urlBarFill}" stroke="${urlBarStroke}" stroke-width="1" />
		<text x="${width / 2}" y="${height / 2 + 5}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="${textFill}" text-anchor="middle">${url}</text>
	</svg>`;
}

async function addBrowserFrame(inputPath: string, outputPath: string, url: string, dark: boolean) {
	const { titleBar, cornerRadius, padding, shadow } = FRAME;

	const metadata = await sharp(inputPath).metadata();
	const imgWidth = metadata.width!;
	const imgHeight = metadata.height!;

	const frameWidth = imgWidth;
	const frameHeight = imgHeight + titleBar.height;
	const totalWidth = frameWidth + padding * 2;
	const totalHeight = frameHeight + padding * 2;

	// Title bar
	const titleBarSvg = createTitleBarSvg(frameWidth, titleBar.height, url, dark);
	const titleBarImage = await sharp(Buffer.from(titleBarSvg))
		.resize(frameWidth, titleBar.height)
		.png()
		.toBuffer();

	// Rounded top corners for title bar
	const titleBarWithCorners = await sharp(titleBarImage)
		.composite([
			{
				input: Buffer.from(`<svg width="${frameWidth}" height="${titleBar.height}">
			<rect x="0" y="${cornerRadius}" width="${frameWidth}" height="${titleBar.height - cornerRadius}" fill="white" />
			<rect x="${cornerRadius}" y="0" width="${frameWidth - cornerRadius * 2}" height="${titleBar.height}" fill="white" />
			<circle cx="${cornerRadius}" cy="${cornerRadius}" r="${cornerRadius}" fill="white" />
			<circle cx="${frameWidth - cornerRadius}" cy="${cornerRadius}" r="${cornerRadius}" fill="white" />
		</svg>`),
				blend: "dest-in",
			},
		])
		.png()
		.toBuffer();

	// Rounded bottom corners for screenshot
	const roundedScreenshot = await sharp(inputPath)
		.composite([
			{
				input: await sharp(
					Buffer.from(`<svg width="${imgWidth}" height="${imgHeight}">
			<rect x="0" y="0" width="${imgWidth}" height="${imgHeight - cornerRadius}" fill="white" />
			<rect x="${cornerRadius}" y="${imgHeight - cornerRadius}" width="${imgWidth - cornerRadius * 2}" height="${cornerRadius}" fill="white" />
			<circle cx="${cornerRadius}" cy="${imgHeight - cornerRadius}" r="${cornerRadius}" fill="white" />
			<circle cx="${imgWidth - cornerRadius}" cy="${imgHeight - cornerRadius}" r="${cornerRadius}" fill="white" />
		</svg>`)
				)
					.resize(imgWidth, imgHeight)
					.png()
					.toBuffer(),
				blend: "dest-in",
			},
		])
		.png()
		.toBuffer();

	// Background with shadow
	const bgColor = dark ? "#121214" : "#f0f0f2";
	const shadowFill = dark ? "white" : "white";
	const backgroundSvg = Buffer.from(
		`<svg width="${totalWidth}" height="${totalHeight}">
		<rect width="${totalWidth}" height="${totalHeight}" fill="${bgColor}" />
		<defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
			<feDropShadow dx="0" dy="4" stdDeviation="${shadow.blur / 2}" flood-color="rgba(0,0,0,${shadow.alpha})" />
		</filter></defs>
		<rect x="${padding}" y="${padding}" width="${frameWidth}" height="${frameHeight}" rx="${cornerRadius}" fill="${shadowFill}" filter="url(#shadow)" />
	</svg>`
	);

	// Composite everything
	await sharp(backgroundSvg)
		.resize(totalWidth, totalHeight)
		.composite([
			{ input: titleBarWithCorners, top: padding, left: padding },
			{
				input: roundedScreenshot,
				top: padding + titleBar.height,
				left: padding,
			},
		])
		.png()
		.toFile(outputPath);

	const outputSize = fs.statSync(outputPath).size;
	console.log(`  ${path.basename(outputPath)} (${(outputSize / 1024 / 1024).toFixed(1)}MB)`);
}

async function main() {
	console.log("Adding browser frames to screenshots...\n");

	const screenshots = [
		{
			input: "login.png",
			url: "localhost:5173/login",
			dark: false,
		},
		{
			input: "dashboard-light.png",
			url: "localhost:5173",
			dark: false,
		},
		{
			input: "dashboard-dark.png",
			url: "localhost:5173",
			dark: true,
		},
		{
			input: "command-palette.png",
			url: "localhost:5173",
			dark: true,
		},
		{
			input: "users-light.png",
			url: "localhost:5173/users",
			dark: false,
		},
		{
			input: "analytics-light.png",
			url: "localhost:5173/analytics",
			dark: false,
		},
	];

	for (const ss of screenshots) {
		const inputPath = path.join(SCREENSHOTS_DIR, ss.input);
		const outputPath = path.join(SCREENSHOTS_DIR, ss.input.replace(".png", "-framed.png"));

		if (!fs.existsSync(inputPath)) {
			console.log(`  SKIP: ${ss.input} not found`);
			continue;
		}

		await addBrowserFrame(inputPath, outputPath, ss.url, ss.dark);
	}

	console.log("\nDone!");
}

main().catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
