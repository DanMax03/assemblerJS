<?php
	include 'inc.php';
	if(!isset($_POST['codes'])) exit('Программа отсутствует.');
	if(!is_array($_POST['codes'])) exit('Программа в неверном формате');
	$codes = $_POST['codes'];
	if(count($codes) != PAGE) exit('Программа задана не верно.');
	if(!isset($_POST['task_id']) || !trim($_POST['task_id'])) exit('Не указан номер задачи.');
	$task_id = trim($_POST['task_id']);
	if(!preg_match('/^[0-9]+$/', $task_id)) exit('Неверно задан номер задачи.');

	$exe = file_get_contents(TASK_EXE_FULL_PATH);
	for($i = 0; $i < PAGE; ++$i)
		$exe[$i + EXE_CS_OFFSET] = chr($codes[$i]);


	$params = array(
		'task_id' => $task_id,
		'exe' => $exe,
	);
	$result = file_get_contents(JOBE_EXE_URL, false, stream_context_create(array(
		'http' => array(
			'method'  => 'POST',
			'header'  => 'Content-type: application/x-www-form-urlencoded',
			'content' => http_build_query($params)
		)
	)));

	if($result === false) exit('Файл протестировать не удалось.');
	
	echo $result;
