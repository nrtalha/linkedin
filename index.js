import puppeteer from 'puppeteer-core';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import fs from 'fs';
import readline from 'readline';

const creds = JSON.parse(fs.readFileSync('./credentials.json', 'utf8'));
const SHEET_ID = '1Zxql0DCjUrZUSJlPBTdF6egzzhXSOS_R8sL-yJj9I_Y';
const BROWSERLESS_WS = process.env.BROWSERLESS_WS;
const LINKEDIN_COOKIE = process.env.LI_AT; // 🔐 Set in Replit secrets

async function scrapeLinkedIn(postUrl) {
  try {
    const browser = await puppeteer.connect({ browserWSEndpoint: BROWSERLESS_WS });
    const page = await browser.newPage();

    // ✅ Set LinkedIn session cookie
    await page.setCookie({
      name: 'li_at',
      value: LINKEDIN_COOKIE,
      domain: '.linkedin.com',
      path: '/',
      httpOnly: true,
      secure: true
    });

    console.log("Navigating to post...");
    await page.goto(postUrl, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(5000);

    const people = await page.$$eval('a.app-aware-link', anchors =>
      anchors
        .filter(a => a.href.includes('/in/'))
        .map(a => ({
          name: a.innerText.trim(),
          profile: a.href
        }))
    );

    console.log(`Found ${people.length} people`);

    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    console.log("✅ Connected to Google Sheet:", doc.title);

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Leads'];

    for (const person of people) {
      await sheet.addRow({
        Name: person.name,
        "LinkedIn Profile URL": person.profile,
        Type: "Commented/Reacted",
        "Source Post": postUrl
      });
      console.log(`✅ Added: ${person.name}`);
    }

    await browser.close();
    console.log("✅ Scraping completed!");

  } catch (error) {
    console.error("❌ Error occurred:", error);
    console.log("Make sure:");
    console.log("- Your Browserless WebSocket is correct");
    console.log("- Your LinkedIn `li_at` cookie is fresh and added in Secrets");
    console.log("- The post is visible to your LinkedIn session");
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Paste LinkedIn Post URL: ", (postUrl) => {
  scrapeLinkedIn(postUrl).then(() => rl.close());
});
