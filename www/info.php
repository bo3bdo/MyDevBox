<?php
echo "<h1 style='color: #4CAF50; text-align: center;'>🎉 PHP يعمل مع Apache بنجاح!</h1>";
echo "<div style='text-align: center; font-family: Arial; margin: 20px;'>";
echo "<p><strong>إصدار PHP:</strong> " . phpversion() . "</p>";
echo "<p><strong>الخادم:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p><strong>الوقت:</strong> " . date('Y-m-d H:i:s') . "</p>";
echo "</div>";

// عرض معلومات PHP الكاملة
echo "<hr>";
phpinfo();
?> 