<?php
try {
    $p = new PDO('mysql:host=172.30.3.249;dbname=hrm_db', 'HRM', '11111');
    $s = $p->query('SELECT DISTINCT status FROM tbl_employees');
    while ($r = $s->fetch()) {
        echo $r['status'] . PHP_EOL;
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
