from RPi import GPIO
import time
from smbus import SMBus


class lcd:
    def __init__(self, parE, parRS, parisVierBits=False):
        self.__i2c = SMBus()
        self.__teller = 0
        self.__E = parE
        self.__RS = parRS
        self.__isvierbits = parisVierBits

    def initGPIO(self):
        GPIO.setmode(GPIO.BCM)
        self.__i2c.open(1)
        GPIO.setup(self.__E, GPIO.OUT)
        GPIO.setup(self.__RS, GPIO.OUT)
        GPIO.output(self.__E, GPIO.HIGH)

    def send_instructions(self, value):
        GPIO.output(self.__RS, GPIO.LOW)
        self.__i2c.write_byte(0x20, value)
        GPIO.output(self.__E, GPIO.LOW)
        GPIO.output(self.__E, GPIO.HIGH)

    def reset_LCD(self):
        self.send_instructions(0b00111000)
        self.send_instructions(0b00001100)
        self.clear_LCD()
        self.__teller = 0

    def init_LCD(self):
        if self.__isvierbits == False:
            mask = 0b00010000
        elif self.__isvierbits == True:
            mask = 0b00000000
        fcnt = 0b00101000 | mask
        self.send_instructions(fcnt)
        self.displayOn()
        self.clear_LCD()

    def clear_LCD(self):
        self.__teller = 0
        self.send_instructions(0b00000001)
        self.LCD_move_cursor(0x00)

    def LCD_move_cursor(self, adres):
        self.send_instructions(0x80 | adres)

    def send_character(self, value):
        GPIO.output(self.__E, GPIO.HIGH)
        GPIO.output(self.__RS, GPIO.HIGH)
        self.__i2c.write_byte(0x20, value)
        GPIO.output(self.__E, GPIO.LOW)
        GPIO.output(self.__E, GPIO.HIGH)
        # value = byte, loop through bits (mask) and set data pins

    # def second_row(self):
    #     self.send_instructions(0xC0)
    #     self.__teller = 18

    def displayOn(self):
        self.send_instructions(0b00001100)

    def send_message(self, msg):
        for i in msg:
        #     self.__teller += 1
        #     if self.__teller == 17:
        #         self.second_row()
            self.send_character(ord(i))