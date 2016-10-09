######################################
####### Pexip myVMR config file ######
######################################

####### Active Directory details:
LDAP_HOST = 'ad01.customer.com'
LDAP_BASE_DN = 'CN=Users,DC=custom,DC=com'
LDAP_USERNAME = 'pexservice@customer.com'
LDAP_PASSWORD = 'yourpassword'
LDAP_USER_OBJECT_FILTER = '(&(objectCategory=person)(objectClass=user) (sAMAccountName=%s))'

####### Pexip Managament node details:
MGR_ADDRESS = 'mgr.customer.com'
MGR_USER = 'admin'
MGR_PASSWORD = 'yourpassword'

####### VMR details:
CONTROL_YOUR_VMR_FQDN = 'meet.customer.com' #FQDN or IP of conference node or RP for webRTC. The 'Control your VMR' link
WEBRTC_FQDN = 'meet.customer.com' #FQDN or IP of conference node or RP for webRTC. Appears in webRTC links and 'Copy to clipboard'
PHONE_VR = '+6183100000'
