from stepklas import stepClass
from RPi import GPIO
import time
GPIO.setmode(GPIO.BCM)
steppobj = stepClass([6,13,19,26])


def setup():
    pass

try:
    setup()
    while True:
        steppobj.rechts()
        time.sleep(1)
        steppobj.links()
        time.sleep(1)


except KeyboardInterrupt:
    print("KB interrupt")
finally:
    GPIO.cleanup()