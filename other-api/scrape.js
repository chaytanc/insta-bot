const puppeteer = require('puppeteer');

const INSTAGRAM_USERNAME = 'jakesuxx45@gmail.com';  // Replace with your Instagram username
const INSTAGRAM_PASSWORD = "UK)@3v=Q!NJZM5n';1";  // Replace with your Instagram password

//TODO use new api
// https://rapidapi.com/social-api1-instagram/api/instagram-scraper-api2/playground/apiendpoint_3fa9532e-124e-479a-bf8d-85ab4a6ed956
async function scrapeLatestPost(targetUser) {
  // Launch Puppeteer browser
  const browser = await puppeteer.launch({ headless: false,
     args: ['--no-sandbox', '--disable-setuid-sandbox'],});
    //  args: ['--no-sandbox', '--disable-setuid-sandbox', '--proxy-server=PROXY_IP:PORT'],});
  const page = await browser.newPage();

  // Navigate to Instagram
  await page.deleteCookie();
  await page.goto('https://www.instagram.com/accounts/login/');

  // Wait for the login form to be loaded
  await page.waitForSelector('input[name="username"]');
  await page.waitForSelector('input[name="password"]');

  // Log in to Instagram
  await page.type('input[name="username"]', INSTAGRAM_USERNAME, { delay: 101 });
  await page.type('input[name="password"]', INSTAGRAM_PASSWORD, { delay: 101 });
  console.log("about to log in")
  await page.click('button[type="submit"]');
  console.log("Logged in!")
  
  console.log("about to wait for home")
  // Wait for the home page to load after login
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Now, go to the target user's profile page
  await page.goto(`https://www.instagram.com/${targetUser}/`);

  console.log("about to wait")
  // Wait for the profile page to load
  await page.waitForSelector('article');

  // Scrape the latest post's media URL and caption
  const post = await page.evaluate(() => {
    const postElement = document.querySelector('article div img');  // Target the first post
    if (!postElement) return null;  // If no post found, return null

    const imageUrl = postElement.src;  // Get the image URL
    const captionElement = postElement.closest('article').querySelector('div:nth-child(2) span');
    const caption = captionElement ? captionElement.innerText : 'No caption';
    // Get the timestamp (datetime attribute of the <time> element)
    const timeElement = postElement.closest('article').querySelector('time');
    const timestamp = timeElement ? timeElement.getAttribute('datetime') : 'No timestamp available';

    return { imageUrl, caption, timestamp };
  });

  if (post) {
    console.log('Latest post:');
    console.log(`Image URL: ${post.imageUrl}`);
    console.log(`Caption: ${post.caption}`);
    console.log(`Timestamp: ${post.timestamp}`);
  } else {
    console.log('No posts found.');
  }

  // Close the browser
  await browser.close();
}

scrapeLatestPost('treeactionseattle').catch(console.error);
