# fetch-themes.py
# idea from https://help.parsehub.com/hc/en-us/articles/217751808-API-Tutorial-How-to-get-run-data-using-Python-Flask

import requests
import os
import json
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from portal import application

mgr_address = application.config['MGR_ADDRESS']
mgr_user = application.config['MGR_USER']
mgr_password = application.config['MGR_PASSWORD']
allow_themes = application.config['ALLOW_THEMES']

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##### Get all themes:
url = "https://%s/api/admin/configuration/v1/ivr_theme/?limit=1000" % (mgr_address)
r = requests.get(
            url,
            auth=(mgr_user, mgr_password),
            verify=False
            )

with open('./themes.tmp.json', 'w') as f:
  f.write(r.text)

os.rename('./themes.tmp.json', './themes.json')

##### Identify the Global default theme:
url = "https://%s/api/admin/configuration/v1/global/" % (mgr_address)
r = requests.get(
            url,
            auth=(mgr_user, mgr_password),
            verify=False
            )
global_config = json.loads(r.text)['objects'][0]['default_theme']

# default_theme = global_config['default_theme'][0]

# print global_config
with open('./global_config.tmp.json', 'w') as f:
  json.dump(global_config, f)

os.rename('./global_config.tmp.json', './global_config.json')
