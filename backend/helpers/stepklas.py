from RPi import GPIO
import time

stap = [
[False,False,False,True],
[False,False,True,True],
[False,False,True,False],
[False,True,True,False],
[False,True,False,False],
[True,True,False,False],
[True,False,False,False],
[True,False,False,True]]

class stepClass:
    def __init__(self, argpins=[6,13,19,26]):
        self.pins = argpins
        for pin in self.pins:
            GPIO.setup(pin,GPIO.OUT)

    def dostep(self,n):
        for i in range(4):
            GPIO.output(self.pins[i],stap[n][i])

    def rechts(self):
        thestep = 0
        for i in range(0,1024):
            self.dostep(thestep)
            thestep += 1
            if thestep > 7:
                thestep = 0
            time.sleep(0.0009)


    def links(self):
        thestep = 0
        for i in range(0,1024):
            self.dostep(thestep)
            thestep -= 1
            if thestep < 0:
                thestep = 7
            time.sleep(0.0009)
