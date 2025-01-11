import requests
import os

# TODO set up account and set up access tokens
# TODO modularize so that we can have multiple queues and then handle posting of different topics differently
    # function to make queue given keywords and queue file
    # whitelisted accts same for all queues??
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
USER_ID = os.getenv("USER_ID")
whitelisted = [x for x in open("whitelist.txt", "r")]
queue = "queue.txt"
keywords = ["HB", "SB", "legislation"]

# listen for new posts from whitelisted accounts
# Download recent content
def get_recent_posts(user):
    # TODO how many recent posts does this get
    url = f"https://graph.instagram.com/{user}/media"
    params = {
        "fields": "id,caption,timestamp",
        "access_token": ACCESS_TOKEN,
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json().get("data", [])
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return []
# filter new post caption
def filter(post):
    filtered = []
    for keyword in keywords:
        if keyword in post.caption:
            filtered.append(post)
    return filtered

# if repostable 

def manage_queue(filtered):
    with open(queue, "w"):
        for post in filtered:
            queue.append(post.url)
        
        

# Chron job triggered at 7am and 3pm to post something from queue