require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Your existing cache and fetchStations function remains the same
let stationsCache = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchStations() {
    const now = Date.now();
    if (stationsCache && (now - lastFetch) < CACHE_DURATION) {
        return stationsCache;
    }

    try {
        const response = await axios.get('https://web-api.dash-api.com/v1/stations');
        stationsCache = response.data.data.stations;
        lastFetch = now;
        return stationsCache;
    } catch (error) {
        console.error('Error fetching stations:', error);
        return stationsCache || [];
    }
}

app.get('/', async (req, res) => {
    try {
      const stations = await fetchStations();
      
      // Get unique genres and sort them
      const genres = [...new Set(stations.map(s => s.genre))].sort();
      
      // Group stations by genre
      const stationsByGenre = genres.map(genre => ({
        genre,
        stations: stations.filter(s => s.enabled && s.genre === genre)
      }));
  
      // Prepare the base URL for stream links
      const baseUrl = `${req.protocol}://${req.get('host')}`;
  
      res.render('stations', {
        stationsByGenre,
        genres,  // Pass the genres array for the dropdown
        baseUrl
      });
    } catch (error) {
      console.error('Error rendering stations view:', error);
      res.status(500).send('Error rendering stations view');
    }
  });

// Serve an M3U playlist
app.get('/playlist.m3u', async (req, res) => {
    try {
        const stations = await fetchStations();

        res.setHeader('Content-Type', 'audio/x-mpegurl');
        res.setHeader('Content-Disposition', 'attachment; filename="dash_radio.m3u"');

        // Filter enabled stations first and add numbers
        const enabledStations = stations.filter(station => station.enabled);

        // Set the logo URL
        const logoUrl = 'https://littlive.com/static/media/Dash_logo_white.f0ee1bb4a45a3f5682cf.png';

        // Generate playlist with numbered prefixes and logo
        let playlist = '#EXTM3U\n';

        enabledStations.forEach((station, index) => {
            const number = String(index + 1).padStart(2, '0');
            // Add logo metadata
            playlist += `#EXTINF:-1 tvg-logo="${logoUrl}",DASH ${number}: ${station.name}\n`;
            playlist += `${req.protocol}://${req.get('host')}/stream/${station.id}\n`;
        });

        res.send(playlist);
    } catch (error) {
        console.error('Error generating playlist:', error);
        res.status(500).send('Error generating playlist');
    }
});

// API for stream redirection
app.get('/stream/:stationId', async (req, res) => {
    try {
        const stations = await fetchStations();
        const station = stations.find(s => s.id === parseInt(req.params.stationId));

        console.log('Stream request for station:', req.params.stationId);

        if (!station) {
            console.log('Station not found');
            return res.status(404).send('Station not found');
        }

        if (!station.enabled) {
            console.log('Station is disabled');
            return res.status(403).send('Station is not enabled');
        }

        console.log('Fetching stream from:', station.stream_url);

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Check if it's an M3U URL
        if (station.stream_url.toLowerCase().endsWith('.m3u')) {
            try {
                // Fetch the M3U content
                const playlistResponse = await axios.get(station.stream_url, {
                    responseType: 'text',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                // Parse the M3U to get the actual stream URL
                const lines = playlistResponse.data.split('\n');
                const streamUrl = lines.find(line =>
                    line.trim() &&
                    !line.startsWith('#') &&
                    (line.includes('http://') || line.includes('https://'))
                );

                if (!streamUrl) {
                    console.error('No valid stream URL found in playlist');
                    return res.status(404).send('Stream not found');
                }

                console.log('Redirecting to stream URL:', streamUrl.trim());
                return res.redirect(streamUrl.trim());
            } catch (playlistError) {
                console.error('Error fetching playlist:', playlistError);
                // If we can't fetch the playlist, try direct stream
                console.log('Attempting direct stream access');
            }
        }

        // Direct stream handling
        const streamResponse = await axios.get(station.stream_url, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Forward content type if available
        if (streamResponse.headers['content-type']) {
            res.setHeader('Content-Type', streamResponse.headers['content-type']);
        }

        // Pipe the stream
        streamResponse.data.pipe(res);

        // Handle stream errors
        streamResponse.data.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).send('Stream error');
            }
        });

    } catch (error) {
        console.error('Error handling stream:', error);
        if (!res.headersSent) {
            res.status(500).send('Error handling stream');
        }
    }
});

// Error handlers
app.use((err, req, res, next) => {
    console.error('Application error:', err);
    res.status(500).send('Internal Server Error');
});

app.use((req, res) => {
    res.status(404).send('Not Found');
});

app.listen(port, () => {
    const host = process.env.HOST || 'localhost';
    console.log(`Server running at http://${host}:${port}`);
});