<?php
	include 'inc.php';
	$cs = explode(' ', $_POST['cs_str']); if(count($cs) != CODE_PAGE) die;
	$ds = explode(' ', $_POST['ds_str']); if(count($ds) != DATA_PAGE) die;
	$exe = file_get_contents(TASK_EXE_FULL_PATH);
	for($i = 0; $i < CODE_PAGE; ++$i)
		$exe[$i + EXE_CS_OFFSET] = chr($cs[$i]);
	for($i = 0; $i < DATA_PAGE; ++$i)
		$exe[$i + EXE_DS_OFFSET] = chr($ds[$i]);
	string_force_download($exe, 'task.exe');
