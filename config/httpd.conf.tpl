# MyDevBox Apache Configuration with Virtual Hosts
ServerRoot "{{APP_ROOT}}/bin/apache"
Listen 80

# Essential modules only
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule dir_module modules/mod_dir.so
LoadModule mime_module modules/mod_mime.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule log_config_module modules/mod_log_config.so
LoadModule vhost_alias_module modules/mod_vhost_alias.so

# PHP Module
LoadModule php_module "{{PHP_PATH}}/php8apache2_4.dll"
PHPIniDir "{{PHP_PATH}}"

# Server settings
ServerName localhost:80

# MIME Types
TypesConfig conf/mime.types
AddType application/x-httpd-php .php

# Main site (localhost)
DocumentRoot "{{APP_ROOT}}/www"
<Directory "{{APP_ROOT}}/www">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>

# Include Virtual Hosts
Include "{{APP_ROOT}}/config/vhosts/*.conf"

# Disable server signature
ServerTokens Prod
ServerSignature Off