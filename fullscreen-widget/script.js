var playerElements = {
  song: document.getElementById("player-song"),
  artist: document.getElementById("player-artist"),
  status: document.getElementById("player-status"),
  albumArt: document.getElementById("player-album-art"),
  progress: document.getElementById("player-progress"),
  background: document.getElementById("player-background"),
  songLink: document.getElementById("player-song-link"),
  artistLink: document.getElementById("player-artist-link"),
  albumLink: document.getElementById("player-album-link"),
  time: document.getElementById("player-time")
};

var songData, progressSeconds, totalSeconds, progressInterval;

function updatePlayer() { // Replace the URL below with the one to your worker
  fetch(`https://oss.ikuda.net/nowplaying/example-api-response.json`)
    .then((response) => response.json())
    .then((data) => {
      if (data.hasOwnProperty("NOTICE")) { // You can replace "User" with your name / username
        playerElements.song.innerHTML = `User isn't playing anything.`;
        playerElements.artist.innerHTML = "";
        return;
      }
      songData = data;
      playerElements.song.innerHTML = data.item.name;
      playerElements.artist.innerHTML = data.item.artists[0].name;
      playerElements.status.innerHTML = data.is_playing ? `▶️ Playing` : `⏸ Paused`;
      playerElements.albumArt.setAttribute("src", data.item.album.images[0].url);
      playerElements.background.style.backgroundImage = `url(${data.item.album.images[0].url})`;

      playerElements.songLink.setAttribute("href", data.item.external_urls.spotify);
      playerElements.artistLink.setAttribute("href", data.item.artists[0].external_urls.spotify);
      playerElements.albumLink.setAttribute("href", data.item.album.external_urls.spotify);

      progressSeconds = Math.ceil(data.progress_ms / 1000);
      totalSeconds = Math.ceil(data.item.duration_ms / 1000);
      clearInterval(progressInterval);
      if (data.is_playing) {
        progressInterval = setInterval(setProgress, 1000);
      } else {
        setProgress();
      }
    });
}

function setProgress() {
  if (progressSeconds > totalSeconds) {
    clearInterval(progressInterval);
    updatePlayer();
    return;
  }
  ++progressSeconds;
  var totalLabel = pad(parseInt(totalSeconds / 60)) + ":" + pad(totalSeconds % 60);
  var progressLabel = pad(parseInt(progressSeconds / 60)) + ":" + pad(progressSeconds % 60);
  playerElements.time.innerHTML = progressLabel + " / " + totalLabel;
  playerElements.progress.style.width = `${(progressSeconds * 100) / totalSeconds}%`;
}

function pad(val) {
  return val.toString().padStart(2, '0');
}

updatePlayer();
setInterval(updatePlayer, 30000); // Refreshes the player (a.k.a checks API) every 30 seconds, lower or higher the rate as you see fit