import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import puppeteer from "puppeteer-core";

function getChromeExecutablePath() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

export async function generatePdfFromHtml(html, outputPath) {
  const dir = path.dirname(outputPath);
  await fsp.mkdir(dir, { recursive: true });

  const executablePath = getChromeExecutablePath();

  if (!executablePath) {
    throw new Error("Chrome executable not found. Install Google Chrome or set a custom executable path.");
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });
  } finally {
    await browser.close();
  }
}