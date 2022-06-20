from RPi import GPIO
import time
import threading
import multiprocessing

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
        thread = multiprocessing.Process(target=self.scherm_rechts, args=(), daemon=True)
        thread.start()
        thread.join()
    
    def scherm_rechts(self):
        thestep = 0
        for i in range(0,12189):
            self.dostep(thestep)
            thestep += 1
            if thestep > 7:
                thestep = 0
            time.sleep(0.0009)
        for pin in self.pins:
            GPIO.output(pin,GPIO.LOW)


    def links(self):
        thread = multiprocessing.Process(target=self.scherm_links, args=(), daemon=True)
        thread.start()
        thread.join()
        

    def scherm_links(self):
        thestep = 0
        for i in range(0,12189):
            self.dostep(thestep)
            thestep -= 1
            if thestep < 0:
                thestep = 7
            time.sleep(0.0009)
        for pin in self.pins:
            GPIO.output(pin,GPIO.LOW)