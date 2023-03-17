from flask import Flask, render_template, Response, jsonify, request, session
from dotenv import load_dotenv
from flask_wtf.csrf import CSRFProtect
import os
import logging
import cv2
import tensorflow as tf
import mediapipe as mp
import numpy as np

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ['SECRET_KEY']

prediction = 'none'

model = tf.keras.models.load_model('actions_model-single_hand.h5')

# holistic model
mp_holistic = mp.solutions.holistic

# drawing utilities
mp_drawing = mp.solutions.drawing_utils

def mp_detection(img, model):
    # cv2 captures video in BGR - have to convert to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # stop writing to the image
    img.flags.writeable = False
    
    # make a prediction
    results = model.process(img)
    
    # start writing to the image again
    img.flags.writeable = True
    
    # convert the image back to BGR
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    
    return img, results

def draw_landmarks(img, results):
    # draw left and right hand connections
    mp_drawing.draw_landmarks(img, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS,
                             mp_drawing.DrawingSpec(color=(0, 128, 0), thickness=2, circle_radius=2),
                             mp_drawing.DrawingSpec(color=(0, 128, 0), thickness=2, circle_radius=2)
                             )
    mp_drawing.draw_landmarks(img, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS,
                             mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2, circle_radius=2),
                             mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2, circle_radius=2)
                             )

def get_keypoints(results):
    '''
    # create an array with coordinates for landmarks for left hand if it is in frame, else
    # create an array of the same shape (21 keypoints * 3 dimensions) filled with 0s
    lh_keypoints = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)

    # do the same for right hand
    rh_keypoints = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)

    return np.concatenate([lh_keypoints, rh_keypoints])
    '''
    if results.left_hand_landmarks == None and results.right_hand_landmarks != None:
        keypoints = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark])
    elif results.right_hand_landmarks == None and results.left_hand_landmarks != None:
        keypoints = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark])
    elif (results.right_hand_landmarks != None and results.left_hand_landmarks != None) and (len(results.right_hand_landmarks.landmark) > len(results.left_hand_landmarks.landmark)):
        keypoints = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark])
    elif (results.right_hand_landmarks != None and results.left_hand_landmarks != None) and len(results.left_hand_landmarks.landmark) > len(results.right_hand_landmarks.landmark):
        keypoints = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark])
    else:
        keypoints = np.zeros(21*3)
    
    return keypoints

colors = [(0,127,255), (0,255,0), (255,255,0), (255,0,127), (127,0,255)]
def prob_viz(res, actions, input_frame, colors):
    '''
    output_frame = input_frame.copy()
    for num, prob in enumerate(res):
        cv2.rectangle(output_frame, (0,80+num*40), (int(prob*100), 115+num*40), colors[num], -1)
        cv2.putText(output_frame, actions[num], (5, 105+num*40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
        
    return output_frame
    '''
def prob_viz(res, actions, input_frame, colors):
    output_frame = input_frame.copy()
    
    for i in range(len(res[0])):
        cv2.rectangle(output_frame, (0,60+i*40), (int(res[0][i]*100), 90+i*40), colors[i], -1)
        cv2.putText(output_frame, actions[i], (0, 85+i*40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
        
    return output_frame

def detect_cameras(max_cameras=10):
    cameras = []
    for camera_id in range(max_cameras):
        cap = cv2.VideoCapture(camera_id)
        if cap is None or not cap.isOpened():
            cap.release()
        else:
            cameras.append(camera_id)
            cap.release()
    return cameras

history = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_cameras', methods=['GET'])
def get_cameras():
    available_cameras = detect_cameras()
    return jsonify(available_cameras)

@app.route('/video_off')
def video_off():
    return render_template('video_off.html')

@app.route('/get_prediction', methods=['GET'])
def get_prediction():
    global prediction
    return jsonify(prediction=prediction)

@app.route('/set_camera', methods=['POST'])
def set_camera():
    camera_id = int(request.form.get('camera_id'))
    session["camera_id"] = camera_id
    return "Camera ID set successfully", 200

@app.route('/video_feed')
def video_feed():
    camera_id = session.get("camera_id", None)
    if camera_id is not None:
        capture = cv2.VideoCapture(camera_id)
    else:
        capture = cv2.VideoCapture(0)

    def get_video_feed():
        # make detection variables
        #predictions = []
        history = []
        threshold = 0.6
        actions = np.array(['right', 'left', 'up', 'down'])

        with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
            while capture.isOpened():

                # read the video
                ret, frame = capture.read()

                # make detections with the holistic model
                image, results = mp_detection(frame, holistic)
                
                # draw landmarks on the live feed
                draw_landmarks(image, results)

                # implement prediction logic
                keypoints = get_keypoints(results)
        
                res = model.predict(keypoints.reshape(-1, 21, 3, 1), verbose=0)
                #predictions.append(np.argmax(res))
                
                if res[0][np.argmax(res)] > threshold:
                    if len(history) > 0:
                        if actions[np.argmax(res)] != history[-1]:
                            history.append(actions[np.argmax(res)])
                    else:
                        history.append(actions[np.argmax(res)])

                    if len(history) > 5:
                        history = history[-5:]
                    
                    global prediction 
                    prediction = history[-1]
                        
                # visualise probabilities
                image = prob_viz(res, actions, image, colors)
                    
                cv2.rectangle(image, (0, 0), (725, 40), (26,25,24), -1)
                cv2.putText(image, ' '.join(history), (25, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,255), 2, cv2.LINE_AA)

                # show the video in frame
                image = cv2.resize(image, (300, 533))
                ret, jpeg = cv2.imencode('.jpg', image)

                yield (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')

            capture.release()
        
    return Response(get_video_feed(), mimetype='multipart/x-mixed-replace; boundary=frame')
    # return jsonify(get_video_feed=get_video_feed(), prediction=prediction)



if (__name__ == '__main__'):
    app.run()