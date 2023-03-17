# Gesture-controlled Pac-Man

A gesture recognition CNN for controlling Pac-Man.

Watch a demo: https://www.youtube.com/watch?v=Qi7aKc1FjsI

## Introduction

This is a gesture-recognition CNN model applied to control Pac-Man. The model can recognise 4 different gestures which are used as an input to control the direction in which Pac-Man moves. 

Note that the game and accompanying website are not a focus of the project so the movement of the ghosts is random and the website is not optimised for mobile devices.

## Technologies

ML model:
* TensorFlow
* MediaPipe
* CV2

Accompanying website:
* Flask version 2.2.2
* MediaPipe version 0.9.1.0
* NumPy version 1.23.5
* CV2 version 4.7.0.68
* TensorFlow version 2.10.0
* Flask-WTF version 1.1.1
* python-dotenv version 1.0.0 
* HTML/CSS/JavaScript


## Setup
To run this project, navigate to the /gesture_pacman_web, install dependencies from requirements.txt, create a secret key in a .env file and run the index.py file.

```
$ cd ../gesture_pacman_web
$ pip install -r requirements.txt
$ for /f %i in ('python -c "import secrets; print(secrets.token_hex(32))"') do set SECRET_KEY=%i && echo SECRET_KEY=%SECRET_KEY% > .env
$ python index.py
```
