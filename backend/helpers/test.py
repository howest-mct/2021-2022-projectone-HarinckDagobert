from lcdklassei2c import lcd
from RPi import GPIO
import time
GPIO.setmode(GPIO.BCM)
E = 24
RS = 23
lcdobj = lcd(E, RS, False)

def setup():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(E, GPIO.OUT)
    GPIO.setup(RS, GPIO.OUT)
    lcdobj.initGPIO()

try:
    setup()
    while True:
        lcdobj.send_message("test")
        time.sleep(1)


except KeyboardInterrupt:
    print("KB interrupt")
finally:
    GPIO.cleanup()