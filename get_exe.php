<?php
	include 'inc.php';
	$codes = explode(' ', $_POST['codes_str']);
	if(count($codes) != PAGE) die;
	$exe = file_get_contents(TASK_EXE_FULL_PATH);
	for($i = 0; $i < PAGE; ++$i)
		$exe[$i + EXE_CS_OFFSET] = chr($codes[$i]);
	string_force_download($exe, 'task.exe');
