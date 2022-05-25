import spidev
import time
from RPi import GPIO
defaultspeed = 10 ** 5


class SpiClass:
    def __init__(self, bus=0, device=0):
        self.spi = spidev.SpiDev()
        self.spi.open(bus, device)
        self.spi.max_speed_hz = defaultspeed

    def read_channel(self, ch):
        bytes_in = self.spi.xfer([1, (8 | ch) << 4, 0])
        return ((bytes_in[1] & 3) << 8) | bytes_in[2]

    def closespi(self):
        self.spi.close()