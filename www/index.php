<?php
echo "MyDevBox Apache is working!<br>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "<br>";
echo "<br><a href='/phpmyadmin'>phpMyAdmin</a>";
?> 