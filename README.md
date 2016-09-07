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

Edit the portal.py file and adjust the AD and Pexip management information at the top of the file to suit your environment


Service commands:
* sudo start portal
* sudo restart portal
* sudo stop portal

## Nginx config

Add the relevant configuration to the pexapp file:

`sudo nano /etc/nginx/sites-enabled/pexapp`

Add the following to the server `{ listen 443 ssl` part of the file:

    location /static {
        alias /home/pexip/portal/static;
    }
    location /portal { try_files $uri @yourapplication; }
    location @yourapplication {
        include uwsgi_params;
        uwsgi_pass unix:/home/pexip/portal/portal.sock;
        access_log /var/log/nginx/portal.access.log;
        error_log /var/log/nginx/portal.error.log;
    }

Edit the rewrites:
Add `portal` to the exceptions list:
`sudo nano /etc/nginx/includes/pex-rewrites.conf`

```
rewrite ^/(?!api|webrtc|webapp|static|stats|portal)([a-z-\.@]+)/?$ /webapp/#/$1 permanent;
rewrite ^/(?!api|webrtc|webapp|static|stats|portal)([a-z-\.@]+)/(.+)/?$ /webapp/#/$1/$2 permanent;
```

Restart nginx:

`sudo service nginx restart`

Now browse to https://<your-RP-FQDN>/portal
