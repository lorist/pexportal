from flask import Flask, g, request, session, redirect, url_for, render_template, flash, redirect
from flask_simpleldap import LDAP
import requests
import json
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from forms import LoginForm, VMRForm, MyDevices, ChangeDevice
import io
import PIL
from PIL import Image, ImageFont, ImageOps, ImageDraw

application = Flask(__name__)
application.secret_key = 'pexdev key'
application.debug = False

application.config['LDAP_HOST'] = 'ad.example.com.au'
application.config['LDAP_BASE_DN'] = 'CN=Users,DC=example,DC=com,DC=au'
application.config['LDAP_USERNAME'] = 'pexservice@example.com.au'

application.config['LDAP_PASSWORD'] = 'Mypexservicepwd'
application.config['LDAP_USER_OBJECT_FILTER'] = '(&(objectCategory=person)(objectClass=user) (sAMAccountName=%s))'
application.config['LDAP_LOGIN_VIEW'] = 'login'

# Pexip management node info:
mgr_address = "mgr.example.com.au"
mgr_user = "admin"
mgr_password = "password"

ldap = LDAP(application)

@application.errorhandler(404)
def page_not_found(error):
    return 'This route does not exist {}'.format(request.url), 404

# def register_hooks(application):
@application.before_request
def before_request():
    if 'logged_in' not in session and '/static/' not in request.path and request.endpoint != 'logout':
        g.user = None
        if 'user_id' in session:
            # This is where you'd query your database to get the user info.
            g.user = {}
            # Create a global with the LDAP groups the user is a member of.
            g.ldap_groups = ldap.get_user_groups(user=session['user_id'])
            g.ldap_all = ldap.get_object_details(user=session['user_id'])
            g.email = g.ldap_all['mail']
            # g.username = g.ldap_all['sAMAccountName']
            # username = g.username
            # my_devices = getDevices(username)
            email = g.email[0]
            g.conf_url = getVMRurl(email)
            g.username = g.ldap_all['sAMAccountName'][0]

            if g.conf_url is 'error':
                return render_template('/error.html', error={'msgs': ['You do not appear to have a provisioned VMR', 'Please contact the administrator..']})
            else:

                conf_url = g.conf_url
                username = g.username
                g.conf_config = getVMRconfig(conf_url)
                g.my_devices = getDevices(username)
                application.logger.info('BEFORE REQUEST Devices: %s', g.my_devices)

        #ldapsearch -h syd-ad01.pexip.com.au -D 'pexservice@pexip.com.au' -w yourpassword -x -b "dc=pexip,dc=com,dc=au" '(&(objectCategory=person)(objectClass=user) (sAMAccountName=dennis))'
        #phone = ldap.SCOPE_SUBTREE, filter, attrs )

def getVMRurl(email):
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
    url = "https://%s/api/admin/configuration/v1/conference/?primary_owner_email_address=%s" % (mgr_address, email)
    try:
        response = requests.get(
            url,
            auth=(mgr_user, mgr_password),
            verify=False
            )
        conf = json.loads(response.text)['objects']
    except Exception as e:
	    return render_template("500.html", error = str(e))
    if conf == []:
        error = 'error'
        application.logger.info('No VMR found for user with email: %s', email)
        return error
        # return render_template('500.html', error='Pexip VMR not found!!')
    else:
        for c in conf:
            return c["resource_uri"]


def getVMRconfig(conf_url):
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
    url = "https://%s%s" % (mgr_address, conf_url)
    try:
        response = requests.get(
            url,
            auth=(mgr_user, mgr_password),
            verify=False
            )
        vmr_config = json.loads(response.text)
        application.logger.info('search config result:  %s', vmr_config)
        return vmr_config
    except requests.exceptions.ConnectionError as e:
        return render_template('/error.html', error={'msgs': ['Connection to server failed.', 'Is it a valid domain?']})

def changeVMR(conf_url, **kwargs):
    if kwargs is not None:
        application.logger.info('Changing VMR: PIN: %s, GUEST_PIN: %s, HOST_VIEW: %s, ALLOW_GUESTS: %s', kwargs['pin'], kwargs['guest_pin'],
        kwargs['host_view'], str(kwargs['allow_guests']))
        requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
        url = "https://%s%s" % (mgr_address, conf_url)
        try:
            response = requests.patch(
                url, auth=(mgr_user, mgr_password), verify=False, data=json.dumps(kwargs))
            return
        except requests.exceptions.ConnectionError as e:
            return render_template('/error.html', error={'msgs': ['Connection to server failed.', 'Is it a valid domain?']})

def changeDevice(id, **kwargs):
    if kwargs is not None:
        application.logger.info('Changing Device ID: %s', id)
        requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
        url = "https://%s/api/admin/configuration/v1/device/%d/" % (mgr_address, id)
        try:
            response = requests.patch(
                url, auth=(mgr_user, mgr_password), verify=False, data=json.dumps(kwargs))
            application.logger.debug('MGR PATCH Sending for ID: %s', id)
            return
        except requests.exceptions.ConnectionError as e:
            return render_template('/error.html', error={'msgs': ['Connection to server failed.', 'Is it a valid domain?']})

def emailMe(id, email_thing):
    if email_thing is not None:
        if 'conf' in email_thing:
            send_what = 'send_conference_email'
            thing_id = 'conference_id'
        if 'device' in email_thing:
            send_what = 'send_device_email'
            thing_id = 'device_id'
        application.logger.info('Sending %s for %s: %d', send_what, thing_id, id)
        requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
        url = "https://%s/api/admin/command/v1/conference/%s/" % (mgr_address, send_what)
        try:
            application.logger.debug('EMAIL URL: %s', url)
            response = requests.post(
                url, auth=(mgr_user, mgr_password), verify=False, data=json.dumps({thing_id:id}))
            application.logger.debug('RESPONSE: %s', response)
            return
        except requests.exceptions.ConnectionError as e:
            return render_template('/error.html', error={'msgs': ['Connection to server failed.', 'Is it a valid domain?']})

def getRegistered():
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
    url = "https://%s/api/admin/status/v1/registration_alias/" % (mgr_address)
    try:
        response = requests.get(
            url,
            auth=(mgr_user, mgr_password),
            verify=False
            )
        registered = json.loads(response.text)['objects']
        application.logger.debug('MGR LOOKUP search registered result:  %s', registered)
        return registered
    except requests.exceptions.ConnectionError as e:
        return render_template('/error.html', error={'msgs': ['Connection to server failed.', 'Is it a valid domain?']})

def getDevices(username): #my devices
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
    url = "https://%s/api/admin/configuration/v1/device/?username=%s" % (mgr_address, username)
    try:
        response = requests.get(
            url,
            auth=(mgr_user, mgr_password),
            verify=False
            )
        devices = json.loads(response.text)['objects']
        application.logger.info('MGR LOOKUP getDevices result:  %s', devices)
        return devices

    except requests.exceptions.ConnectionError as e:
        return render_template('/error.html', error={'msgs': ['Connection to server failed.', 'Is it a valid domain?']})


def flash_errors(form):
    for field, errors in form.errors.items():
        for error in errors:
            flash(u"Error in the %s field - %s" % (
                getattr(form, field).label.text,
                error
            ))

@application.route('/portal/edit', methods=['GET', 'POST'])
@ldap.login_required
def edit():
    form = VMRForm()
    if form.validate_on_submit():
        g.conf_config['pin'] = form.pin.data
        g.conf_config['guest_pin'] = form.guest_pin.data
        g.conf_config['host_view'] = form.host_view.data
        g.conf_config['allow_guests'] = form.allow_guests.data
        pin = g.conf_config['pin']
        allow_guests = g.conf_config['allow_guests']
        guest_pin = g.conf_config['guest_pin']
        host_view = g.conf_config['host_view']
        conf_url = g.conf_url
        changeVMR(conf_url=conf_url, pin=pin, guest_pin=guest_pin, host_view=host_view, allow_guests=allow_guests)
        print "changing VMR"
        # application.logger.info('Changing VMR: PIN: %s, GUEST_PIN: %s, HOST_VIEW: %s', pin, guest_pin, host_view, allow_guests)
        flash('Your changes have been saved.')
        # return redirect(url_for('edit'))
        return redirect('/portal/')
    else:
        form.pin.data = g.conf_config['pin']
        form.guest_pin.data = g.conf_config['guest_pin']
        form.host_view.data = g.conf_config['host_view']
        form.allow_guests.data = g.conf_config['allow_guests']
        flash_errors(form)
    return render_template('edit.html', form=form)


@application.route('/portal/editdevice/<int:id>', methods=['GET', 'POST'])
@ldap.login_required
def editmydevice(id):
    device = (item for item in g.my_devices if item["id"] == id).next()
    application.logger.debug('edit device results: (%s)', device)
    form = ChangeDevice(obj=device)
    if form.validate_on_submit():
        password = form.password.data
        changeDevice(id=id , password=password)
        flash('Your changes have been saved.')
        return redirect('/portal/')
    else:
        form.password.data = ''
        form.id.data = device['id']
        flash_errors(form)
    return render_template('editdevice.html', form=form, device=device)

@application.route('/portal/emaildevice/<int:id>', methods=['GET', 'POST'])
@ldap.login_required
def emaildevice(id):
    email_thing = "device"
    if (item for item in g.my_devices if item["id"] == id):
        emailMe(id, email_thing)
        flash('You will receive an email shortly.')
    else:
        flash('This is not your device!')
    return redirect('/portal/')

@application.route('/portal/emailvmr/<int:id>', methods=['GET', 'POST'])
@ldap.login_required
def emailvmr(id):
    email_thing = "conf"
    if (item for item in g.conf_config if item["id"] == id):
        emailMe(id, email_thing)
        flash('You will receive an email shortly.')
    else:
        flash('This is not your VMR!')
    return redirect('/portal/')

@application.route('/portal/')
@ldap.login_required
def user():
    user = g.username
    if user == None:
        flash('User %s not found.' % accnt)
        return redirect(url_for('index'))
    # application.logger.debug('config results: (%s)', g.conf_config)
    config = g.conf_config
    conf_id = config['id']
    name = config['name']
    pin = config['pin']
    guest_pin = config['guest_pin']
    aliases = [ {'alias': r['alias']}  for r in config['aliases']]
    host_view = config['host_view']
    allow_guests = config['allow_guests']
    devices = g.my_devices
    #my devices:
    # devices = getDevices(user)
    application.logger.info('my devices result:  %s', devices)
    return render_template('user.html',
                           user=user, conf_id=conf_id,
                           name=name, pin=pin, guest_pin=guest_pin,
                           aliases=aliases, host_view=host_view, allow_guests=allow_guests, devices=devices)

@application.route('/portal/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if g.user:
        return redirect(url_for('index'))
    if request.method == 'POST':
        user = request.form['user']
        passwd = request.form['passwd']
        test = ldap.bind_user(user, passwd)

        if test is None or passwd == '':
            return 'Invalid credentials'
        else:
            session['user_id'] = request.form['user']
            return redirect('/portal/')
    return render_template('login.html',
                           title='Sign In',
                           form=form)

@application.route('/portal/registered')
@ldap.login_required
def registered():
    registered = getRegistered()
    application.logger.info('search registered result:  %s', registered)
    # form = Registered()
    return render_template('registered.html',
                           registered=registered)

@application.route('/portal/mydevices')
@ldap.login_required
def mydevices():
    user = g.username
    application.logger.info('USER:  %s', user)
    mydevices = getDevices(user)
    application.logger.info('MYDEVICES:  %s', mydevices)
    return render_template('devices.html',  mydevices=mydevices)

@application.route('/portal/group')
@ldap.group_required(groups=['Web Developers', 'pexAdmin'])
def group():
    return 'Group restricted page'

@application.route('/portal/logout')
def logout():
    session.pop('user_id', None)
    # session.pop('logged_in', None)
    return redirect(url_for('login'))

if __name__ == '__main__':
    application.run(host='0.0.0.0')
