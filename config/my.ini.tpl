[client]
port=3306
socket="{{BASEDIR}}/tmp/mysql.sock"
default-character-set=utf8mb4

[mysqld]
port=3306
socket="{{BASEDIR}}/tmp/mysql.sock"
basedir="{{BASEDIR}}/bin/mysql"
tmpdir="{{BASEDIR}}/tmp"
datadir="{{BASEDIR}}/bin/mysql/data"
pid_file="mysql.pid"
key_buffer_size=16M
max_allowed_packet=1M
sort_buffer_size=512K
net_buffer_length=8K
read_buffer_size=256K
read_rnd_buffer_size=512K
myisam_sort_buffer_size=8M
log_error="mysql_error.log"

# Bind to localhost only for security
bind-address="127.0.0.1"

# Skip plugin directory as it doesn't exist in this distribution
#plugin_dir="{{BASEDIR}}/bin/mysql/lib/plugin/"

# Character set (server settings)
character-set-server=utf8mb4
collation-server=utf8mb4_general_ci

# InnoDB settings
innodb_data_home_dir="{{BASEDIR}}/bin/mysql/data"
innodb_data_file_path=ibdata1:10M:autoextend
innodb_log_group_home_dir="{{BASEDIR}}/bin/mysql/data"
innodb_buffer_pool_size=16M
innodb_log_file_size=5M
innodb_log_buffer_size=8M
innodb_flush_log_at_trx_commit=1
innodb_lock_wait_timeout=50

# SQL Mode
sql_mode=NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION
log_bin_trust_function_creators=1

[mysqldump]
max_allowed_packet=16M

[mysql]
default-character-set=utf8mb4

[isamchk]
key_buffer_size=20M
sort_buffer_size=20M
read_buffer=2M
write_buffer=2M

[myisamchk]
key_buffer_size=20M
sort_buffer_size=20M
read_buffer=2M
write_buffer=2M
