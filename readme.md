# Project One - Smart zonnescherm

## about this project

My Project is a smart sunscreen. It is meaned for people who like to hang out outside but dont want to bother with constantly having to manually open en close a sunscreen.

The sunscreen has a some sensors to detect what the weather is outside. if the measured values go outside of certain chosen parameters, the sunscreen will automatically  close and will reopen if values go back inside those parameters.
- Anemometer to detect when the windspeed gets to high
- Temperaturesensor to measure the temperature
- lightsensor to measure brightness

The sunscreen also has an LCD display which show the different measured values from the sensors,shows the IP adress and gives a notification if the screen opens or closes

via the website you can change what the parameters are for the windspeed, temperature and brightness, you can also manually open and close the sunscreen.
and finally theres a viewable history of the different weather measurements and timestamps of when sunscreen opened and closed

## Installation

first of all make sure to download the project before following these steps

## database:
download the database from the repository
Run the SQL files in the database-export folder. do this is MySQL workbench or PhpMyadmin.

## backend:
to make sure the project runs on boot follow these commands:

Make a file named myproject.service
write following into file:

    [Unit]

    Description=ProjectOne Project

    After=network.target

    [Service]

    ExecStart=/usr/bin/python3 -u /home/student/<name_of_repo>/backend/app.py

    WorkingDirectory=/home/student/<name_of_repo>/backend

    StandardOutput=inherit

    StandardError=inherit

    Restart=always

    User=student

    [Install]

    WantedBy=multi-user.target

execute following commands:

    sudo cp myproject.service /etc/systemd/system/myproject.service
    sudosystemctl enable myproject.service

## Frontend:

Make sure you have copied the contents of the Frontend directory from Github

follow these commands:

    sudo nano /etc/apach2/sites-available/000-default.conf

replace DocumentRoot /var/www/html

with

DocumentRoot/home/student/<name_repository>/front-end

edit the rights of the root folder:

    nano /etc/apache2/apache2

change

    <Directory />

    Options FollowSymLinks

    AllowOverride All

    Require all denied

    </Directory>

to

    <Directory />

    Options Indexes FollowSymLinks Includes ExecCGI

    AllowOverride All

    Require all granted

    </Directory>

restart apache2:

    service apache2 restart


That's all you need to do for the frontend to work. you can access the website at its IP-address in a browser.

## Instructables
here's a link to my instructables 
It also explains how to setup the code and how to build the housing
link:
https://www.instructables.com/Smart-Zonnescherm/
