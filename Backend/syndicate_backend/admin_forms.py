"""Admin login: we use email as Django User.username; label the field Email for clarity."""
from django import forms
from django.contrib.admin.forms import AdminAuthenticationForm


class EmailAsUsernameAdminLoginForm(AdminAuthenticationForm):
    username = forms.CharField(
        label="Email",
        widget=forms.TextInput(attrs={"autocomplete": "email", "autofocus": True}),
    )
    password = forms.CharField(
        label="Password",
        strip=False,
        widget=forms.PasswordInput(attrs={"autocomplete": "current-password"}),
        help_text="Type your password here. Server variables (e.g. DJANGO_SUPERUSER_PASSWORD) do not auto-fill this field.",
    )
