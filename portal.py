from flask import Flask, g, request, session, redirect, url_for, render_template, flash, redirect
from flask_simpleldap import LDAP
import requests
import json
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from forms import LoginForm, VMRForm, MyDevices, ChangeDevice
import io
import PIL
from PIL import Image, ImageFont, ImageOps, ImageDraw
import base64
import logging
from logging.handlers import RotatingFileHandler

application = Flask(__name__)
application.secret_key = 'pexdev key'
application.debug = True
application.config['LDAP_LOGIN_VIEW'] = 'login'
application.config.from_object('config')
log_filename = application.config['LOG_FILENAME']
mgr_address = application.config['MGR_ADDRESS']
mgr_user = application.config['MGR_USER']
mgr_password = application.config['MGR_PASSWORD']

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
            g.vmrs, g.vmr_count = getVMRs(g.email[0])
            g.username = g.ldap_all['sAMAccountName'][0]
            g.my_devices, g.my_devices_total = getDevices(g.email[0])
                
            if "thumbnailPhoto" in g.ldap_all:
                thumbnaildata = g.ldap_all['thumbnailPhoto'][0]
                g.thumbnailstring = convert(thumbnaildata)
            else:
                g.thumbnailstring = "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"


            if g.vmrs is 'error':
                return render_template('/error.html', error={'msgs': ['You do not appear to have a provisioned VMR', 'Please contact the administrator..']})
            else:
                scheduled = totalScheduled(g.vmrs)
                application.logger.info('Scheduled VMRs: %s', scheduled)
                g.scheduled_count = totalScheduled(g.vmrs)
                username = g.username

def convert(thumbnail):
    thumbnailstring = base64.b64encode(thumbnail)
    return thumbnailstring

def totalScheduled(vmrs):
    total_scheduled = []
    for c in vmrs:
        if c['scheduled_conferences']:
            total_scheduled.append(c['scheduled_conferences'])
    sched_count = len(total_scheduled)
    return sched_count



def getVMRs(email):
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
    url = "https://%s/api/admin/configuration/v1/conference/?primary_owner_email_address=%s" % (mgr_address, email)
    try:
        response = requests.get(
            url,
            auth=(mgr_user, mgr_password),
            verify=False
            )
        vmrs = json.loads(response.text)['objects']
        vmr_count = json.loads(response.text)['meta']['total_count']
        # scheduled_count = len(vmrs.scheduled_conference)
        # application.logger.info('Scheduled count: %s', scheduled_count)

    except Exception as e:
            return render_template("500.html", error = str(e))
    if vmrs == []:
        error = 'error'
        application.logger.info('No VMR found for user with email: %s', email)
        return error, vmr_count
        # return render_template('500.html', error='Pexip VMR not found!!')
    else:

        return vmrs, vmr_count



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
        # application.logger.info('Changing VMR: PIN: %s, GUEST_PIN: %s, HOST_VIEW: %s, ALLOW_GUESTS: %s, Overlay: %s', kwargs['pin'], kwargs['guest_pin'], kwargs['host_view'], kwargs['allow_guests'], str(kwargs['force_presenter_into_main']))
        requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
        url = "https://%s%s" % (mgr_address, conf_url)
        try:
            response = requests.patch(
                url, auth=(mgr_user, mgr_password), verify=False, data=json.dumps(kwargs))
            return response
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

def getDevices(email): #my devices
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
    url = "https://%s/api/admin/configuration/v1/device/?primary_owner_email_address=%s" % (mgr_address, email)
    try:
        response = requests.get(
            url,
            auth=(mgr_user, mgr_password),
            verify=False
            )
        devices = json.loads(response.text)['objects']
        device_count = json.loads(response.text)['meta']['total_count']
        application.logger.info('MGR LOOKUP getDevices result:  %s', devices)
        return devices, device_count

    except requests.exceptions.ConnectionError as e:
        return render_template('/error.html', error={'msgs': ['Connection to server failed.', 'Is it a valid domain?']})


def flash_errors(form):
    for field, errors in form.errors.items():
        for error in errors:
            flash(u"Error in the %s field - %s" % (
                getattr(form, field).label.text,
                error
            ))
def test_vmrowenership(checkvmr, id):
    try:
        vmr = (item for item in g.vmrs if item["id"] == id).next()
        return vmr
    except Exception as e:
        error = 'error'
        return error

def test_deviceowenership(checkdevice, id):
    try:
        device = (item for item in checkdevice if item["id"] == id).next()
        return device
    except Exception as e:
        error = 'error'
        return error

@application.route('/portal/edit/<int:id>', methods=['GET', 'POST'])
@ldap.login_required

def edit(id):
    # vmr = (item for item in g.vmrs if item["id"] == id).next()
    # checkvmr
    vmr = test_vmrowenership(g.vmrs, id)
    if vmr is 'error':
        return render_template('/error.html', error={'msgs': ['Not your conference.', 'Or, you must have got here by accident']})
    application.logger.debug('edit vmr results: (%s)', vmr)
    form = VMRForm()
    if form.validate_on_submit():
        vmr['pin'] = form.pin.data
        vmr['guest_pin'] = form.guest_pin.data
        vmr['host_view'] = form.host_view.data
        vmr['allow_guests'] = form.allow_guests.data
        vmr['guests_can_present'] = form.guests_can_present.data
 
        pin = vmr['pin']
        # force_presenter_into_main = vmr['force_presenter_into_main']
        allow_guests = vmr['allow_guests']
        guest_pin = vmr['guest_pin']
        host_view = vmr['host_view']
        conf_url = vmr['resource_uri']
        guests_can_present = vmr['guests_can_present']
        
        changeVMR(conf_url=conf_url, pin=pin, guest_pin=guest_pin, host_view=host_view, 
            allow_guests=allow_guests, guests_can_present=guests_can_present)
        print "changing VMR"
        # application.logger.info('Changing VMR: PIN: %s, GUEST_PIN: %s, HOST_VIEW: %s', pin, guest_pin, host_view, allow_guests)
        flash('Your changes have been saved.')
        # return redirect(url_for('edit'))
        return redirect('/portal/')
    else:
        form.pin.data = vmr['pin']
        # form.force_presenter_into_main = vmr['force_presenter_into_main']
        form.guest_pin.data = vmr['guest_pin']
        form.host_view.data = vmr['host_view']
        form.allow_guests.data = vmr['allow_guests']
        form.guests_can_present.data = vmr['guests_can_present']
        flash_errors(form)
    return render_template('edit.html', form=form)


@application.route('/portal/editdevice/<int:id>', methods=['GET', 'POST'])
@ldap.login_required
def editmydevice(id):
    device = test_deviceowenership(g.my_devices, id)
    if device is 'error':
        return render_template('/error.html', error={'msgs': ['Not your device.', 'Or, you must have got here by accident']})
 
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
    # scheduled = g.scheduled
    # scheduled_count = g.scheduled_count
    vmr_config = g.vmrs
    vmr_count = g.vmr_count
    application.logger.debug('config results: (%s)', vmr_config)
    devices = g.my_devices
    scheduled_count = g.scheduled_count
    device_count = g.my_devices_total
    thumbnailstring = g.thumbnailstring
    return render_template('user.html',
                           user=user, vmr_config=vmr_config, vmr_count=vmr_count, scheduled_count=scheduled_count, devices=devices, device_count=device_count, thumbnailstring=thumbnailstring)

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
    formatter = logging.Formatter(
        "[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
    handler = RotatingFileHandler(log_filename, maxBytes=10000000, backupCount=5)
    handler.setLevel(logging.INFO)
    handler.setFormatter(formatter)
    application.logger.addHandler(handler)
    application.run(host='0.0.0.0')
