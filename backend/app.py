import time
from math import log
from RPi import GPIO
from helpers.klasseknop import Button
from helpers.spiclass import SpiClass
import threading
from flask_cors import CORS
from flask_socketio import SocketIO, emit, send
from flask import Flask, jsonify, request
from repositories.DataRepository import DataRepository

from selenium import webdriver

# from selenium import webdriver
# from selenium.webdriver.chrome.options import Options

#Custum endpoint
endpoint = '/api/v1'

#hardware setup
ledPin = 21
btnPin = Button(17)
schermStatus = 0
spiClassObj = SpiClass(0, 0)

# Code voor Hardware
def setup_gpio():
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(ledPin, GPIO.OUT)
    GPIO.output(ledPin, GPIO.LOW)
    btnPin.on_press(lees_knop)

def omzettemp(value):
    rntc = 10000/((1023/value)-1)
    kelvin = 1/(1/298.15 + 1/4000 * log(rntc/10000))
    return (kelvin - 273.15)

def omzetlux(value):
    ldrv = (value/1023) * 3.3
    ldrlux = (500/ldrv)
    return ldrlux


def lees_sensors():
    temp = round(omzettemp(spiClassObj.read_channel(1)),2)
    licht = round(omzetlux(spiClassObj.read_channel(2)))
    wind = 10.4
    return [temp,licht,wind]
    
def lees_knop(pin):
    if btnPin.pressed:
        print("**** button pressed ****")
        # if GPIO.input(ledPin) == 1:
        #     switch_light({'lamp_id': '3', 'new_status': 0})
        # else:
        #     switch_light({'lamp_id': '3', 'new_status': 1})




# Code voor Flask

app = Flask(__name__)
app.config['SECRET_KEY'] = 'geheim!'
socketio = SocketIO(app, cors_allowed_origins="*", logger=False,
                    engineio_logger=False, ping_timeout=1)

CORS(app)


@socketio.on_error()        # Handles the default namespace
def error_handler(e):
    print(e)



# API ENDPOINTS


@app.route('/')
def hallo():
    return "Server is running, er zijn momenteel geen API endpoints beschikbaar."

@app.route(endpoint + '/historiek/', methods=['GET'])
def get_historiek():
    if request.method == 'GET':
        return jsonify(historiek=DataRepository.read_historiek()), 200

@app.route(endpoint + '/historiek/<date>/', methods=['GET'])
def get_historiek_by_date(date):
    if request.method == 'GET':
        return jsonify(historiek_date=DataRepository.read_historiek_by_date(date)), 200

@app.route(endpoint + '/historiek/device/<device_id>/', methods=['GET'])
def get_historiek_by_device(device_id):
    if request.method == 'GET':
        return jsonify(historiek_device=DataRepository.read_historiek_by_device(device_id)), 200

@app.route(endpoint + '/historiek/device/<device_id>/<date>/', methods=['GET'])
def get_historiek_by_date_device(device_id,date):
    if request.method == 'GET':
        return jsonify(historiek_device_by_date=DataRepository.read_historiek_by_date_en_device(device_id,date)), 200

# @socketio.on('connect')
# def initial_connection():
    # print("client connects")

@socketio.on('F2B_switch_scherm')
def switch_scherm():
    schermStatus != schermStatus
    print("scherm opent/sluit")

# @socketio.on('F2B_switch_light')
# def switch_light(data):
#     Ophalen van de data
#     lamp_id = data['lamp_id']
#     new_status = data['new_status']
#     print(f"Lamp {lamp_id} wordt geswitcht naar {new_status}")

    # Stel de status in op de DB
    # res = DataRepository.update_status_lamp(lamp_id, new_status)

    # Vraag de (nieuwe) status op van de lamp en stuur deze naar de frontend.
    # data = DataRepository.read_status_lamp_by_id(lamp_id)
    # socketio.emit('B2F_verandering_lamp', {'lamp': data}, broadcast=True)

    # Indien het om de lamp van de TV kamer gaat, dan moeten we ook de hardware aansturen.
    # if lamp_id == '3':
        # print(f"TV kamer moet switchen naar {new_status} !")
        # GPIO.output(ledPin, new_status)



# START een thread op. Belangrijk!!! Debugging moet UIT staan op start van de server, anders start de thread dubbel op
# werk enkel met de packages gevent en gevent-websocket.
def meting_historiek():
    while True:
        print('*** We zetten op historiek **')
        sens = lees_sensors()
        DataRepository.insert_into_historiek(sens[0],None,3,None)
        DataRepository.insert_into_historiek(sens[1],None,2,None)
        DataRepository.insert_into_historiek(sens[2],None,1,None)
        time.sleep(120)

def start_historiek_thread():
    print("**** Starting historiek THREAD ****")
    thread = threading.Thread(target=meting_historiek, args=(), daemon=True)
    thread.start()

def realtime_sensoren():
    while True:
        sens = lees_sensors()
        socketio.emit('B2F_status_sensoren', {'sensoren': {'temp':sens[0],'licht':sens[1],'wind':sens[2]}}, broadcast=True)
        time.sleep(0.1)

def start_realtime_sensoren():
    thread = threading.Thread(target=realtime_sensoren, args=(), daemon=True)
    thread.start()

def start_chrome_kiosk():
    import os

    os.environ['DISPLAY'] = ':0.0'
    options = webdriver.ChromeOptions()
    # options.headless = True
    # options.add_argument("--window-size=1920,1080")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36")
    options.add_argument('--ignore-certificate-errors')
    options.add_argument('--allow-running-insecure-content')
    options.add_argument("--disable-extensions")
    # options.add_argument("--proxy-server='direct://'")
    options.add_argument("--proxy-bypass-list=*")
    options.add_argument("--start-maximized")
    options.add_argument('--disable-gpu')
    # options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--no-sandbox')
    options.add_argument('--kiosk')
    # chrome_options.add_argument('--no-sandbox')         
    # options.add_argument("disable-infobars")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)

    driver = webdriver.Chrome(options=options)
    driver.get("http://localhost")
    while True:
        pass


def start_chrome_thread():
    print("**** Starting CHROME ****")
    chromeThread = threading.Thread(target=start_chrome_kiosk, args=(), daemon=True)
    chromeThread.start()



# ANDERE FUNCTIES


if __name__ == '__main__':
    try:
        setup_gpio()
        # start_historiek_thread()
        start_chrome_thread()
        start_realtime_sensoren()
        print("**** Starting APP ****")
        socketio.run(app, debug=False, host='0.0.0.0')
    except KeyboardInterrupt:
        print ('KeyboardInterrupt exception is caught')
    finally:
        GPIO.cleanup()


