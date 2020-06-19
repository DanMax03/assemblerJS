<?php
	include 'inc.php';
	$codes = explode(' ', $_POST['codes_str']);
	if(count($codes) != PAGE) die;
	$exe = file_get_contents('../../asm_data/res.exe');
	string_force_download($exe, 'task.exe');
