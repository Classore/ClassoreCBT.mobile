import sys, os
sys.path.append(r'C:\Users\GFA\Documents\GitHub\ClassoreCBT.be\cbt_backend')
os.environ['DJANGO_SETTINGS_MODULE'] = 'cbt_backend.settings'
import django
django.setup()
from django.conf import settings
from rest_framework.settings import api_settings
print('DEFAULT_PAGINATION_CLASS:', api_settings.DEFAULT_PAGINATION_CLASS)
print('PAGE_SIZE:', api_settings.PAGE_SIZE)
