# pexportal
Self service web portal for Pexip VMRs and Devices created by AD Sync
Requires Pexip version 13 or later
![alt tag](https://raw.githubusercontent.com/lorist/pexportal/master/portal-user.png)

![alt tag](https://raw.githubusercontent.com/lorist/pexportal/master/portal-edit.png)


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

`cd /home/pexip && virtualenv portalvenv`

Avtivate the virtual environment:

`source /home/pexip/portalvenv/bin/activate`

Install required modules within the virtual environment:

`pip install -r /home/pexip/portal/requirements.txt`

If the RP has no internet access:

`cd /home/pexip/portal && tar -zxvf requirements.tgz`

`pip install --no-index --find-links=file:/home/pexip/portal/requirements -r /home/pexip/portal/requirements.txt`

Copy the uWsgi configuration file to correct location:

`sudo cp /home/pexip/portal/portal.conf /etc/init/`

Edit the config.py file and adjust the AD and Pexip management information at the top of the file to suit your environment


Service commands:
* sudo start portal
* sudo restart portal
* sudo stop portal

## Upgrading to current version
If the portal is running, stop it by running: `sudo stop portal`

Copy the current working files as a backup:

`cp -r /home/pexip/portal /home/pexip/portal-backup`

Pull down the latest code from github:

`git fetch origin`

Then apply:

`git reset --hard origin/master`

Note that this will pull down the default config.py file, so you will either need to re-edit the file to suit your environment or copy the originaly file back. Here is how to copy from your backup:

`rm /home/pexip/portal/config.py && cp /home/pexip/portal-backup/config.py /home/pexip/portal/`

Now you can start it again: `sudo start portal`


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

Now browse to `https://<your-RP-FQDN>/portal`

## Change the logo image


To change the logo image that appears at the top left of the page, upload your new image to the /home/pexip/portal/static/img directory. Then edit the /home/pexip/portal/templates/layout.html file and change the file name to relect your new file:

`<img src="{{ url_for('static', filename='img/pexip-wordmark-RGB.png') }}" hspace="20" height="30" alt="">`
