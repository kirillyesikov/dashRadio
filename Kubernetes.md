### You will need a working Kubernetes cluster for this:

```
kind create cluster
```



### Build and Tag your Docker image to match the format of your private registry URL. Replace <registry-url> with the address of your private registry:

```
docker build -t radio .
docker tag radio <registry-url>/radio:latest
```

### Log in to the Private Registry:

```
docker login <registry-url>
```

### Push the Image to your private Registry:

```
docker push <registry-url>/radio:latest
```


### In order to use the deployment.yaml you need to create an <imagePullSecret> and change the value inside the deployment.yaml as well as changing your <image>
 
```
      imagePullSecrets:
      - name: regcred      #change this value to <your-secret-name>
```
```
       image: kyesikov/radio:latest
```



### Create a Kubernetes secret:

```
kubectl create secret docker-registry <your-secret-name> --docker-server=<your-registry-server> --docker-username=<your-name> --docker-password=<your-pword> --docker-email=<your-email>
```
where:

<your-registry-server> is your Private Docker Registry FQDN. Use https://index.docker.io/v1/ for DockerHub.
<your-name> is your Docker username.
<your-pword> is your Docker password.
<your-email> is your Docker email.



### Deploy to Kubernetes
Apply the YAML file to your Kubernetes cluster.

```
kubectl apply -f deployment.yaml
```



### Port-forward and enjoy the radio at http://localhost:3000/

```
kubectl port-forward -n default svc/radio-service 80

```

