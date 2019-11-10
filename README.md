# Are You Monetized? (aym)

A CLI tool for YouTubers to check if a video they've made will be monetized. Inspired by [this video](https://youtu.be/cE-UfHO6Huw)

## How does it work?

It's simple, it uses Google's own Vision API to scan frames from a video to check if they contain anything unmonetizable

## How to install it

To run it you have to have installed [node.js](https://nodejs.org/)

1. Clone repo and install dependencies
   ```sh
   git clone https://github.com/krawieck/aym
   cd aym
   npm install
   ```
2. Go to https://console.developers.google.com/
3. Create new project
4. From **dashboard** go to **API & Services** ➜ **Credentials** ➜ press **Create credentials** button ➜ pick **Service account key**
5. Select **new service account** and create new service, name doesn't matter. What matters is that you choose moderately high role, I recommend choosing **owner**, because you'll be sure that you have enough permissions for program to work. Key type **has to be JSON**
7. When you click create you'll be prompted to download a JSON file, save it in this program's directory and rename it to "credentials.json"
8. Now go back to dashboard and search using search bar on top "cloud vision api" and go to the only result
9. Click **ENABLE** button and you should be now able to run this program

## How to use it

Open terminal in a directory where this program is

```
$ npm start -- <videoFile> <fps>

videoFile  - file that you want to be checked for monetization
fps        - how many frames per second of video should it check,        [default: 1]
             it doesn't have to be an integer it can be sth like 0.5. 


```
