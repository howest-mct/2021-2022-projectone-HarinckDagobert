import time
from math import log
from RPi import GPIO
from helpers.klasseknop import Button
from helpers.spiclass import SpiClass
from helpers.lcdklassei2c import lcd
from helpers.stepklas import stepClass
import threading
from flask_cors import CORS
from flask_socketio import SocketIO, emit, send
from flask import Flask, jsonify, request
from repositories.DataRepository import DataRepository
from subprocess import check_output

from selenium import webdriver

# from selenium import webdriver
# from selenium.webdriver.chrome.options import Options

#Custum endpoint
endpoint = '/api/v1'

#hardware setup
btnPin = Button(17)
schermStatus = False
schermOverride = False
spiClassObj = SpiClass(0, 0)
steppobj = stepClass([6,13,19,26])
E = 23
RS = 24
lcdobj = lcd(E, RS, False)

# Code voor Hardware
def setup_gpio():
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    btnPin.on_press(lees_knop)
    # GPIO.setup(E, GPIO.OUT)
    # GPIO.setup(RS, GPIO.OUT)
    lcdobj.initGPIO()
    lcdobj.init_LCD()


def omzettemp(value):
    try:
        untc = (value/1023) * 3.3
        temp = untc*(-33.333) + 113.33
        return (temp)
    except:
        return "error"

def omzetlux(value):
    try:
        ldrv = (value/1023) * 3.3
        ldrlux = (500/ldrv)
        return ldrlux
    except:
        return "error"

def omzetwind(value):
    try:
        w = ((value-124)/496) * 32.4
        return w
    except:
        return "error"

def lees_sensors():
    temp = round(omzettemp(spiClassObj.read_channel(1)),2)
    licht = round(omzetlux(spiClassObj.read_channel(2)))
    wind = round(omzetwind(spiClassObj.read_channel(0)),2)
    return [temp,licht,wind]
    
def lees_knop(pin):
    global steppobj
    if btnPin.pressed:
        global schermStatus
        global schermOverride
        print("**** button pressed ****")
        schermOverride = True
        time.sleep(0.1)
        schermStatus = not schermStatus
        print(schermStatus)

def verander_scherm(new_status):
    if new_status == True:
        print("zonnescherm opent")
        steppobj.rechts()
    elif new_status == False:
        print("zonnescherm sluit")
        steppobj.links()
    

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
        data = DataRepository.read_historiek()
        if data is not None:
            return jsonify(historiek=data), 200
        else:
            return jsonify(message="error"), 404

@app.route(endpoint + '/historiek/<date>/', methods=['GET'])
def get_historiek_by_date(date):
    if request.method == 'GET':
        data=DataRepository.read_historiek_by_date(date)
        if data is not None:
            return jsonify(historiek_date=data), 200
        else:
            return jsonify(message="error"), 404

@app.route(endpoint + '/historiek/device/<device_id>/', methods=['GET'])
def get_historiek_by_device(device_id):
    if request.method == 'GET':
        data=DataRepository.read_historiek_by_device(device_id)
        if data is not None:
            return jsonify(historiek_device=data), 200
        else:
            return jsonify(message="error"), 404
        

@app.route(endpoint + '/historiek/device/<device_id>/<date>/', methods=['GET'])
def get_historiek_by_date_device(device_id,date):
    if request.method == 'GET':
        data=DataRepository.read_historiek_by_date_en_device(device_id,date)
        if data is not None:
            return jsonify(historiek_device_by_date=data), 200
        else:
            return jsonify(message="error"), 404

@app.route(endpoint + '/device/', methods=['GET','PUT'])
def maxmin_device():
    if request.method == 'GET':
        data=DataRepository.read_maxmin_device()
        if data is not None:
            return jsonify(maxminWaarde=data), 200
        else:
            return jsonify(message="error"), 404
    elif request.method == 'PUT':
            gegevens = DataRepository.json_or_formdata(request)
            print(gegevens)
            data = DataRepository.update_device(
                gegevens["waardewind"], gegevens["waardelicht"], gegevens["waardetemp"],gegevens["dagen"])
            if data is not None:
                socketio.emit('B2F_new_parameters',broadcast=True)
                return jsonify(rijen=data), 200
            else:
                return jsonify(message="error"), 404


@socketio.on('connect')
def initial_connection():
    print("client connects")

@socketio.on('F2B_switch_scherm')
def receive_switch_scherm():
    global schermStatus
    global schermOverride
    schermOverride = True
    time.sleep(0.1)
    schermStatus = not schermStatus
    print(schermStatus)




# START een thread op. Belangrijk!!! Debugging moet UIT staan op start van de server, anders start de thread dubbel op
# werk enkel met de packages gevent en gevent-websocket.
def meting_historiek():
    while True:
        print('*** We zetten op historiek **')
        sens = lees_sensors()
        DataRepository.insert_into_historiek(sens[0],None,3,None)
        DataRepository.insert_into_historiek(sens[1],None,2,None)
        DataRepository.insert_into_historiek(sens[2],None,1,None)
        socketio.emit('B2F_new_historiek',broadcast=True)
        time.sleep(120)

def start_historiek_thread():
    print("**** Starting historiek THREAD ****")
    thread = threading.Thread(target=meting_historiek, args=(), daemon=True)
    thread.start()

def realtime_sensoren():
    while True:
        global schermStatus
        sens = lees_sensors()
        senswind = sens[2]
        senslicht = sens[1]
        senstemp = sens[0]        
        socketio.emit('B2F_status_sensoren', {'sensoren': {'temp':senstemp,'licht':senslicht,'wind':senswind, 'scherm':schermStatus}}, broadcast=True)
        time.sleep(2.1)

def start_realtime_sensoren():
    thread = threading.Thread(target=realtime_sensoren, args=(), daemon=True)
    thread.start()

def check_params():
    while True:
        global schermStatus
        global schermOverride
        global par
        if schermOverride == False:
            parwind = int(par[0]["waarde"])
            parlicht = int(par[1]["waarde"])
            partemp = int(par[2]["waarde"])
            pardagen = par[3]["waarde"]
            sens = lees_sensors()
            senswind = sens[2]
            senslicht = sens[1]
            senstemp = sens[0]
            dag = check_output(['date', '+"%w"']).decode('utf-8').replace('"','').strip()
            if senswind < parwind and senslicht > parlicht and senstemp > partemp and dag in pardagen:
                schermStatus = True
            else:
                schermStatus = False
        else:
            schermOverride = False
            time.sleep(120)

def start_check_params():
    thread = threading.Thread(target=check_params, args=(), daemon=True)
    thread.start()

def check_status_scherm():
    vorigeStatus = False
    while True:
        global schermStatus
        if vorigeStatus != schermStatus:
            verander_scherm(schermStatus)
            vorigeStatus = schermStatus

def start_check_status_scherm():
    thread = threading.Thread(target=check_status_scherm, args=(), daemon=True)
    thread.start()

def lcd_display():
    while True:
        msg = check_output(
            ['hostname', '--all-ip-addresses']).decode('utf-8')[0:15]
        lcdobj.LCD_move_cursor(0x40)
        lcdobj.send_message(msg)
        
def start_lcd_display():
    thread = threading.Thread(target=lcd_display, args=(), daemon=True)
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
        start_lcd_display()
        start_check_status_scherm()
        par = DataRepository.read_maxmin_device()
        start_check_params()
        print("**** Starting APP ****")
        socketio.run(app, debug=False, host='0.0.0.0')
    except KeyboardInterrupt:
        print ('KeyboardInterrupt exception is caught')
    finally:
        GPIO.cleanup()


