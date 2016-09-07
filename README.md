# pexportal
Self service web portal for Pexip VMRs and Devices created by AD Sync
Requires Pexip version 13 or later

## Installation on Pexip RP server

Install git:
`sudo apt-get install git`

Clone the repository:
`git clone https://github.com/lorist/pexportal.git portal`

Install required python dependencies (required for version 3 RP):
`sudo apt-get install python-pip python-dev`

Install Python Virtual Environment:
`sudo pip install virtualenv`

Create the Portal's virtual environment:
`cd /home/pexip/portal/ && virtualenv portalvenv`

Avtivate the virtual environment:
`source /home/pexip/portal/portalvenv/bin/activate`

Install required modules within the virtual environment:
`pip install -r /home/pexip/portal/requirements.txt`

Copy the uWsgi configuration file to correct location:
`sudo cp /home/pexip/portal/portal.conf /etc/init/`

Service commands:
* sudo start portal
* sudo restart portal
* sudo stop portal

