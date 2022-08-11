# Life Long Learning

<p align="center">

This project made for life-long-learning program in NIC.

</p>

This application allows you to connect to your Redis cluster and visualize the job queue and job workers.

## How it's work
![idea drawio](https://user-images.githubusercontent.com/50952092/184124469-2579b188-e8ed-48c6-9b87-7b2dfbd3924c.png)

## Team members
- Nawaf KL
- Aljawharah Aldukhayni
- Ahmed Alamoudi
- Abdullah Alnawfal

## Requirements
- Radis should be installed and running
- Docker to run radis

## Install
- Clone the repo
- ```docker run -p -d 6379:6379 redis```
- ```npm install```
- ```npm start```
- Visit http://localhost:8080 to view the app

## Used Packages
- radis
- socket.io
- bull
- express
- body_parser

## Packages Documentations
- [#Queue.add documentation](https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueadd)
- [Teams API documentation](https://docs.microsoft.com/en-us/graph/api/chatmessage-post?view=graph-rest-1.0&tabs=java)
