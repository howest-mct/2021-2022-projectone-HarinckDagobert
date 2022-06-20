import time
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
LCDscherm = 0
schermStatus = False
vorigeStatus = False
schermOverride = False
schermOverride_Wind = False
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
        temp = untc*(-32.333) + 75.33
        return (temp)
    except:
        return 0
def omzetlux(value):
    try:
        ldrv = (value/1023) * 3.3
        ldrlux = (960/ldrv)
        return ldrlux
    except:
        return 0

def omzetwind(value):
    try:
        w = ((value-124)/496) * 32.4
        if w < 2.4:
            w = 0
        return w
    except:
        return 0

def new_par():
    global par
    par = DataRepository.read_maxmin_device()


def lees_sensors():
    temp = round(omzettemp(spiClassObj.read_channel(1)),2)
    licht = round(omzetlux(spiClassObj.read_channel(2)))
    wind = round(omzetwind(spiClassObj.read_channel(7)),2)
    return [temp,licht,wind]
    
def lees_knop(pin):
    global steppobj
    global schermOverride_Wind
    if btnPin.pressed and schermOverride_Wind == False:
        global schermStatus
        global schermOverride
        print("**** button pressed ****")
        schermOverride = True
        time.sleep(0.1)
        schermStatus = not schermStatus
        print(schermStatus)

def send_realtime():
    global schermStatus
    global sens
    senswind = sens[2]
    senslicht = sens[1]
    senstemp = sens[0] 
    socketio.emit('B2F_status_sensoren', {'sensoren': {'temp':senstemp,'licht':senslicht,'wind':senswind, 'scherm':schermStatus}}, broadcast=True)

def verander_scherm(new_status):
    if new_status == True:
        print("zonnescherm opent")
        send_realtime()
        steppobj.links()
    elif new_status == False:
        print("zonnescherm sluit")
        send_realtime()
        steppobj.rechts()
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

@app.route(endpoint + '/historiek/device/<device_id>/', methods=['GET'])
def get_historiek_by_device(device_id):
    if request.method == 'GET':
        data=DataRepository.read_historiek_by_device(device_id)
        if data is not None:
            return jsonify(historiek_device=data), 200
        else:
            return jsonify(message="error"), 404

@app.route(endpoint + '/historiek/today/device/<device_id>/', methods=['GET'])
def get_historiek_by_day_and_device(device_id):
    if request.method == 'GET':
        data=DataRepository.read_historiek_today_by_device(device_id)
        if data is not None:
            return jsonify(historiek_device=data), 200
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
            new_par()
            if data is not None:
                socketio.emit('B2F_new_parameters',broadcast=True)
                return jsonify(rijen=data), 200
            else:
                return jsonify(message="error"), 404


@socketio.on('connect')
def initial_connection():
    send_realtime()

@socketio.on('F2B_switch_scherm')
def receive_switch_scherm():
    global schermOverride_Wind
    global schermStatus
    global schermOverride
    if schermOverride_Wind == False:
        schermOverride = True
        time.sleep(0.1)
        schermStatus = not schermStatus
        print("verandered door socket")




# START een thread op. Belangrijk!!! Debugging moet UIT staan op start van de server, anders start de thread dubbel op
# werk enkel met de packages gevent en gevent-websocket.
def meting_historiek():
    while True:
        print('*** We zetten op historiek **')
        global sens
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
        global sens
        senswind = sens[2]
        senslicht = sens[1]
        senstemp = sens[0]        
        time.sleep(1)
        sens2 = lees_sensors()
        senswind_sec = sens[2]
        senslicht_sec = sens2[1]
        senstemp_sec = sens2[0]
        if senswind != senswind_sec or senslicht != senswind_sec or senstemp != senstemp_sec:
            send_realtime()
        

def start_realtime_sensoren():
    thread = threading.Thread(target=realtime_sensoren, args=(), daemon=True)
    thread.start()

def check_params():
    while True:
        global par
        global sens
        parlicht = int(par[1]["waarde"])
        partemp = int(par[2]["waarde"])
        pardagen = par[3]["waarde"]
        senslicht_first = sens[1]
        senstemp_first = sens[0]
        time.sleep(10)
        sens2 = lees_sensors()
        senslicht_sec = sens2[1]
        senstemp_sec = sens2[0]
        av_licht = (senslicht_first + senslicht_sec) / 2
        av_temp =(senstemp_first + senstemp_sec) / 2
        dag = check_output(['date', '+"%w"']).decode('utf-8').replace('"','').strip()
        global schermStatus
        global schermOverride
        global schermOverride_Wind
        if schermOverride == False and schermOverride_Wind == False:
            if av_licht > parlicht and av_temp > partemp and dag in pardagen:
                print("scherm opened door sensors")
                schermStatus = True
            else:
                print("scherm sluit door sensors")
                schermStatus = False 
        else:
            print("scherm moet dicht")
            schermOverride = False
            time.sleep(60)
        
        

def start_check_params():
    thread = threading.Thread(target=check_params, args=(), daemon=True)
    thread.start()

def check_par_wind():
    check_vorige_scherm()
    while True:
        global schermStatus
        global vorigeStatus
        global schermOverride_Wind
        global LCDscherm
        global par
        global sens
        parwind = float(par[0]["waarde"])
        sens = lees_sensors()
        senswind = sens[2]
        if senswind > parwind:
            print(f"{senswind} > {parwind}")
            schermOverride_Wind = True
            print("scherm verandered door wind")
            schermStatus = False
        else:
            schermOverride_Wind = False
        if vorigeStatus != schermStatus:
            print("scherm verandered")
            print(f"{vorigeStatus}, {schermStatus}")
            vorigeStatus = schermStatus
            if schermStatus == True:
                LCDscherm = 1
                actieid = 1
                print("scherm open")
            elif schermStatus == False:
                LCDscherm = 2
                actieid = 2
                print("scherm dicht")
            verander_scherm(schermStatus)
            DataRepository.insert_into_historiek(schermStatus,None,4,actieid)
            

def start_check_par_wind_and_status_scherm():
    thread = threading.Thread(target=check_par_wind, args=(), daemon=True)
    thread.start()

def check_vorige_scherm():
    global schermStatus
    global vorigeStatus
    vorigestatus = DataRepository.read_last_scherm_state()['waarde']
    if vorigestatus == 1:
        print("vorigestatus was open")
        vorigeStatus = True
        schermStatus = True
    elif vorigestatus == 0:
        print("vorigestatus was dicht")
        vorigeStatus = False
        schermStatus = False
        
def lcd_scherm_not(lcdscherm):
    lcdobj.clear_LCD()
    if lcdscherm == 1:
        msg = "opent"
    elif lcdscherm == 2:
        msg = "sluit"
    lcdobj.send_message(f"scherm {msg}")
    time.sleep(5)
    lcdobj.clear_LCD()
    

def lcd_display():
    while True:
        for i in range(10):
            global LCDscherm
            if LCDscherm != 0:
                lcd_scherm_not(LCDscherm)
                LCDscherm = 0
            lcdobj.LCD_move_cursor(0x00)
            lcdobj.send_message("ip-address:")
            lcdobj.LCD_move_cursor(0x40)
            msg = check_output(
                ['hostname', '--all-ip-addresses']).decode('utf-8').split(' ')
            lcdobj.send_message(msg[0])
            time.sleep(1)
            lcdobj.clear_LCD()
        for i in range(10):
            global sens
            if LCDscherm != 0:
                lcd_scherm_not(LCDscherm)
                LCDscherm = 0
            senswind = sens[2]
            senslicht = sens[1]
            senstemp = sens[0]
            lcdobj.LCD_move_cursor(0x00)
            lcdobj.send_message(f"W:{senswind}ms")
            lcdobj.LCD_move_cursor(0x40)
            lcdobj.send_message(f"L:{senslicht}L")
            lcdobj.LCD_move_cursor(0x48)
            lcdobj.send_message(f"T:{senstemp}C")
            time.sleep(1)
            lcdobj.clear_LCD()


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
        global sens
        setup_gpio()
        new_par()
        start_chrome_thread()
        sens = lees_sensors()
        start_check_par_wind_and_status_scherm()
        start_check_params()
        start_lcd_display()
        start_realtime_sensoren()
        start_historiek_thread()
        print("**** Starting APP ****")
        socketio.run(app, debug=False, host='0.0.0.0')
    except KeyboardInterrupt:
        print ('KeyboardInterrupt exception is caught')
    finally:
        GPIO.cleanup()


