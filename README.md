# A Simpler DashRadio

A Node.js web application that generates M3U playlists for Dash Radio [(LITT Live Music)](https://littlive.com) stations as well as providing a web interface for streaming and managing radio stations in a simple dark user friendly UX.

![DashRadio Interface](screenshots/screenshot.png)

## Features

- 🎵 Browse and search Dash Radio stations
- 📋 Generate M3U playlists for use in media players
- 🎚️ Live preview with volume control
- 🔍 Real-time search functionality
- 📑 Filter stations by genre
- 🌙 Dark mode interface
- 📱 Responsive design for all devices


## You will need a working Kubernetes cluster for this:

```
kind create cluster
```



## Build and Tag your Docker image to match the format of your private registry URL. Replace <registry-url> with the address of your private registry:

```
docker build -t radio .
docker tag radio <registry-url>/radio:latest
```

## Log in to the Private Registry:

```
docker login <registry-url>
```

## Push the Image to your private Registry:

```
docker push <registry-url>/radio:latest
```


## In order to use the deployment.yaml you need to create an <imagePullSecret> and change the value inside the deployment.yaml as well as changing your <image>
 
```
      imagePullSecrets:
      - name: regcred      #change this value to <your-secret-name>
```
```
       image: kyesikov/radio:latest
```



## Create a Kubernetes secret:

```
kubectl create secret docker-registry <your-secret-name> --docker-server=<your-registry-server> --docker-username=<your-name> --docker-password=<your-pword> --docker-email=<your-email>
```
where:

<your-registry-server> is your Private Docker Registry FQDN. Use https://index.docker.io/v1/ for DockerHub.
<your-name> is your Docker username.
<your-pword> is your Docker password.
<your-email> is your Docker email.



## Deploy to Kubernetes
Apply the YAML file to your Kubernetes cluster.

```
kubectl apply -f deployment.yaml
```



## Port-forward and enjoy the radio at http://localhost:3000/

```
kubectl port-forward -n default svc/radio-service 80

```



## Usage

### Web Interface

1. Visit the main page at `http://localhost:3000`
2. Use the search bar to find specific stations
3. Filter stations by genre using the dropdown
4. Click the play button to preview a station
5. Use the volume slider to adjust preview volume
6. Click "Open Stream" to open the station in a new tab

### M3U Playlist

1. Click the "Download M3U" button to download a playlist file
2. Import the M3U file into your favorite media player
3. All stations will be available in your media player's playlist

## API Endpoints

- `GET /`: Home page
- `GET /view`: Station browser interface
- `GET /playlist.m3u`: Download M3U playlist
- `GET /stream/:stationId`: Stream redirect for specific station

## Development

### Project Structure

```
dashRadio/
├── app.js           # Main application file
├── package.json     # Project dependencies
└── views/          
    ├── home.ejs    # Home page template
    ├── stations.ejs # Station browser template
    └── partials/   # EJS partial templates

```

### Technologies Used

- Express.js - Web framework
- EJS - Templating engine
- Axios - HTTP client
- Tailwind CSS - Styling
- Node.js Audio - Stream handlin
