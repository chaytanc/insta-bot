const { IgApiClient } = require('instagram-private-api');
const rp = require('request-promise');
const schedule = require('node-schedule');
const fs = require('fs');
const request = require('request');
const moment = require('moment-timezone');
const http = require('http');

// Accounts to get memes from
const accounts = [
  'critical_mass_seattle',
  'treeactionseattle',
];

// Start every day time EST
const startHour = 9;
const startMin = 1;

// Hours of posting
const postingMinuteDelay = 6;

// Instagram client setup
const ig = new IgApiClient();
const username = 'seattle.climate';
const password = 'UK)@3v=Q!NJZM5n';

// Function to choose a random caption
const captions = [
    'your captions',
    'another caption',
];

const getRandomCaption = () => captions[Math.floor(Math.random() * captions.length)];

let allPosts = []; // Array to hold video data from all accounts
let accountsProcessed = 0; // Counter to track the number of accounts processed

// Function to fetch videos from a specific Instagram account
function fetchPosts(accountName) {
    const options = {
        method: 'GET',
        url: `https://instagram-fast.p.rapidapi.com/feed/${accountName}`,
        headers: {
            'X-RapidAPI-Key': '0891427cf2mshec5e215c41ecd62p1e1db1jsncd2a5aa1bcf3',
            'X-RapidAPI-Host': 'instagram-fast.p.rapidapi.com'
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        const jsonResponse = JSON.parse(body);
        console.log("json");
        console.log(jsonResponse);
        
        const nowInSeconds = Math.floor(Date.now() / 1000); // Current time in seconds since the Unix epoch

        const timeLimit = 23 * 3600 + 45 * 60; // 23 hours and 30 minutes in seconds

        // Filter for video posts within the last 23 hours and 30 minutes
        const photoPostsInfo = jsonResponse.data.user.edge_owner_to_timeline_media.edges
            .filter(edge => !(edge.node.is_unified_video) && (nowInSeconds - edge.node.taken_at) <= timeLimit)
            .map(edge => {
                const randomFutureTimeInSeconds = Math.floor(Math.random() * (postingMinuteDelay * 60)); // Up to 10 hours in seconds and then in seconds 3600 in an hour
                const postTimeUnix = nowInSeconds + randomFutureTimeInSeconds; // Future Unix timestamp for post_time
                const dateEST = new Date((postTimeUnix * 1000) + (-5 * 3600 * 1000)); // Adjust for EST (UTC-5)
                const realTimeISO_EST = dateEST.toISOString(); // Convert to ISO string in EST

                // TODO find actual way to store and access URLs
                return {
                    taken_at_timestamp: edge.node.taken_at,
                    url: edge.node.url,
                    owner: edge.node.owner,
                    post_time: postTimeUnix, // Future Unix timestamp
                    real_time: realTimeISO_EST // ISO time in EST
                };
            });

        allPosts = allPosts.concat(photoPostsInfo);
        
        accountsProcessed++;

        if (accountsProcessed === accounts.length) {
            saveAndScheduleAllPosts();
        }
    });
}

// Function to write all posts' data to a single JSON file and then schedule posts
function saveAndScheduleAllPosts() {
    fs.writeFile('posts.json', JSON.stringify(allPosts, null, 2), (err) => {
        if (err) throw err;
        console.log('Filtered posts with post times and real times (EST) have been saved to one file!');
        schedulePosts(); // Call the function to schedule posts after saving
    });
}

// Function to download content
const downloadContent = async (url) => {
    const options = {
        uri: url,
        encoding: null,
    };
    return rp(options);
};

// Function to post a photo to Instagram
async function postToInsta(postURL) {
    ig.state.generateDevice(username);
    await ig.account.login(username, password);

    const post = await Promise.all([
        downloadContent(postURL),
    ]);

    const caption = getRandomCaption();
    // TODO caption??
    const { mediaId } = await ig.publish.story({ file: post });
    console.log('Post posted successfully');
}

// Function to schedule posts
const schedulePosts = () => {
    const posts = JSON.parse(fs.readFileSync('posts.json', 'utf8'));

    posts.forEach(post => {
        // Convert UNIX timestamp to JavaScript Date object
        // UNIX timestamp is in seconds, JavaScript Date needs milliseconds
        const postTime = new Date(post.post_time * 1000); 
        const currentTime = new Date();

        if (postTime > currentTime) {
            schedule.scheduleJob(postTime, function() {
                console.log(`Posting post scheduled for ${postTime}`);
                postToInsta(post.url).catch(console.error);
            });
        } else {
            console.log(`Skipping post scheduled for ${postTime} as it is in the past.`);
        }
    });
};

// Schedule daily operations at 18:40 EST
schedule.scheduleJob({hour: startHour, minute: startMin, tz: 'America/New_York'}, () => {
    console.log('Starting Instagram post fetching and posting routine.');
    accounts.forEach(account => {
        fetchPosts(account);
    });
});

accounts.forEach(account => {
    console.log("HERE");
    fetchPosts(account);
});

// // Optional: Simple server setup if you need a running process for monitoring or other purposes
// const server = http.createServer((req, res) => {
//   res.writeHead(200, {'Content-Type': 'text/plain'});
//   res.end('Instagram automation server is running.\n');
// });

// server.listen(4000, () => {
//   console.log('Server running at http://127.0.0.1:4000/');
// });


