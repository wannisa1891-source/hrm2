<?php
$host = '172.30.3.249';
$user = 'HRM';
$pass = '11111';
$db   = 'hrm_db';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$cols = array(
    'old_level' => 'VARCHAR(100)',
    'new_level' => 'VARCHAR(100)',
    'old_pos_no' => 'VARCHAR(100)',
    'new_pos_no' => 'VARCHAR(100)',
    'remark' => 'TEXT'
);

foreach ($cols as $name => $type) {
    $res = $conn->query("SHOW COLUMNS FROM tbl_transfers LIKE '$name'");
    if ($res->num_rows == 0) {
        echo "Adding $name...\n";
        $conn->query("ALTER TABLE tbl_transfers ADD $name $type DEFAULT NULL");
    }
}

echo "Done.";
$conn->close();
?>
