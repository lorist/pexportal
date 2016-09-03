from flask.ext.wtf import Form
from wtforms import StringField, BooleanField, PasswordField, SelectField, RadioField, IntegerField, ValidationError
from wtforms.validators import DataRequired, Required

class LoginForm(Form):
    user = StringField('user', validators=[DataRequired()])
    passwd = PasswordField('passwd', validators=[DataRequired()])

class VMRForm(Form):
    def allowGpin(form, field):
        if field.data and not form.allow_guests.data:
            raise ValidationError("You must allow guests if guest pin is set.")
    def uniqueGpin(form, field):
        if field.data and field.data == form.pin.data:
            raise ValidationError('Guest PIN must be different to Host PIN.')
    def allowG_no_host_pin(form, field):
        if field.data and not form.pin.data:
            raise ValidationError('Host PIN must be set to allow guests.')
    pin = StringField('pin')
    guest_pin = StringField('Guest Pin', validators=[allowGpin, uniqueGpin])
    host_view = RadioField('Host View', choices=[('one_main_twentyone_pips', 'One Large, 21 PIPs'),('two_mains_twentyone_pips', 'Two Large, 21 PIPs'), ('one_main_zero_pips','Full screen'),('one_main_seven_pips','One Large, 7 PIPs')])
    allow_guests = BooleanField('Allow Guests', description='Allow Guests to Join', validators=[allowG_no_host_pin])

class MyDevices(Form):
    alias = StringField('alias')
    description = StringField('description')
    password = StringField('password')
    id = IntegerField('id')

class ChangeDevice(Form):
    password = StringField('password')
    id = IntegerField('id')
