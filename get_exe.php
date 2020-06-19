<?php
	include 'inc.php';
	$codes = explode(' ', $_POST['codes_str']);
	if(count($codes) != PAGE) die;
	$exe = file_get_contents(TASK_EXE_FULL_PATH);
	string_force_download($exe, 'task.exe');
