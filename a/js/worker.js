// The "API"
// CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN are environment variables defined in your Cloudflare Worker's settings.

addEventListener("fetch", (event) => {
  event.respondWith(handleNowPlaying(event.request));
});

function deepRemoveKeys(obj, keysToRemove) { // This function (and the helpful comments) were by ChatGPT, because I'm sleep-deprived and could not figure this out. I did have a badly working version at some point though :) (sorry)
  let modified = false;

  // Helper function to recursively remove keys
  function removeKeys(obj) {
    if (Array.isArray(obj)) {
      // If obj is an array, recursively call removeKeys on each element of the array
      for (let i = obj.length - 1; i >= 0; i--) {
        if (typeof obj[i] === 'object') {
          obj[i] = removeKeys(obj[i]);
        }
      }
    } else if (typeof obj === "object" && obj !== null) {
      // If obj is an object, iterate over its keys
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // Check if the key should be removed
          if (keysToRemove.includes(key)) {
            delete obj[key];
            modified = true;
          } else {
            // If the key should not be removed, check if the value is an object
            // and recursively call removeKeys on it
            if (typeof obj[key] === 'object') {
              obj[key] = removeKeys(obj[key]);
            }
          }
        }
      }
    }
    return obj;
  }

  // Call removeKeys until no more modifications are made
  do {
    modified = false;
    obj = removeKeys(obj);
  } while (modified);

  return obj;
}

async function handleNowPlaying(request) {
  var access_token = await fetch("https://accounts.spotify.com/api/token", {
    method: "post",
    headers: {
      Authorization: // The ts-ignores stop VS Code from spitting out errors stating the variables cannot be found
        // @ts-ignore
        "Basic " + btoa(CLIENT_ID + ":" + CLIENT_SECRET),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    // @ts-ignore
    body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      return data.access_token;
    });

  var songData = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: {
        Authorization: "Bearer " + access_token,
      },
    }
  )
    .then((response) => response.json()) // Could be unnecessary, I just wanted to clean up the API response, because... why not?
    .then((data) => {
      return deepRemoveKeys(data, [
        "available_markets",
        "preview_url",
        "context", // NOTE: Context reveals the URL of the playlist you're playing a song from!
        "external_ids",
        "release_date",
        "release_date_precision",
        "total_tracks",
        "popularity",
        "total_tracks",
        "explicit",
        "disc_number",
        "track_number",
        "uri",
        "album_type",
        "href",
        "currently_playing_type",
        "actions",
        "type",
        "id"
      ]);
    })
    .then((data) => JSON.stringify(data))
    .catch((error) => {
      console.error("Error fetching data from Spotify's API:", error);
      return null;
    });

  const corsHeaders = {
    "Access-Control-Allow-Origin": "set this to https://yourdomain.tld or allow all with: *", // Example: "Access-Control-Allow-Origin": "https://ikuda.eu",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Max-Age": "86400",
    "X-Robots-Tag": "noindex",
    "Cache-Control": "no-cache, no-store, must-revalidate", // Tells browsers not to cache the response.
    "Content-Security-Policy": "default-src 'none';",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (songData === null || Object.keys(songData).length === 0) {
    const noticeResponse = {
      NOTICE:
        "Couldn't retrieve data from Spotify's API. This either means that music isn't being played, or that the API is down.",
    };
    return new Response(JSON.stringify(noticeResponse), { headers: corsHeaders });
  }

  songData = JSON.parse(songData);

  return new Response(JSON.stringify(songData, null, 2), {
    headers: corsHeaders,
  });
}
