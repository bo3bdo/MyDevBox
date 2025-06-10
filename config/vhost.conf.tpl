# Virtual Host for {{SITE_NAME}}.test
<VirtualHost *:80>
    ServerName {{SITE_NAME}}.test
    ServerAlias www.{{SITE_NAME}}.test
    DocumentRoot "{{SITE_PATH}}"
    
    <Directory "{{SITE_PATH}}">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Custom log files for this site
    ErrorLog "logs/{{SITE_NAME}}-error.log"
    CustomLog "logs/{{SITE_NAME}}-access.log" combined
</VirtualHost> 